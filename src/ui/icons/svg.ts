/* =====================================================
   手描き SVG の 読みこみ(絵の 差しかえ)。

   いまの 絵は TypeScript の コードで 図形を ならべた もの(食べもの・いきもの…の *.ts)。
   そこに 手描きの SVG を **1つずつ かぶせて いく** ための しくみ。

   考え方:
   ・SVG が ある かたちは SVG、ない かたちは これまでの コード描画。
     202個 そろうのを 待たない。1個 置いた ぶんだけ すぐ よくなる
   ・SVG は `#MAIN` / `#DARK` の 2つの 合図を もつ(docs/ART_DIRECTION.md §5)。
     いろの 名まえから ほんとうの 色に 置きかえて から 焼く
   ・焼くのは **見せる ときに 1回だけ**。ぜんぶ 先に 焼くと
     いろちがい 526通りに なって 起動が おそくなる

   絵が できるまでの あいだ:
     絵の 用意は 画像の デコードを 待つ ので すぐには 終わらない。
     そこで まず コード描画で 出し、SVG が 焼けたら その 場で 差しかえる
     (setTexture は 公開 API なので 安全に すりかえられる)。
   ===================================================== */
import type Phaser from 'phaser';
import { ICON_COLORS, S } from './kit';

/** SVG の 文字列を そのまま バンドルに 入れる(fetch しないので オフラインでも 動く)。
    public/ に 置く のは 絵を たのむ ときの 決めごと(docs/ART_DIRECTION.md §6)。 */
const SOURCES = import.meta.glob('../../../public/art/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** かたちの 名まえ → SVG の 文字列 */
const SVG_OF: Record<string, string> = {};
for (const [p, text] of Object.entries(SOURCES)) {
  const name = p.split('/').pop()?.replace(/\.svg$/, '');
  if (name) SVG_OF[name] = text;
}

/** 手描きの SVG が ある かたちか */
export const hasSvg = (shape: string): boolean => shape in SVG_OF;

/** SVG が ある かたちの 名まえ ぜんぶ(iconsheet の 見くらべ用) */
export const svgShapes = (): string[] => Object.keys(SVG_OF).sort();

/** 焼いた SVG の テクスチャキー(コード描画の `icon:` と 分ける) */
export const svgTextureKey = (key: string): string => `svgicon:${key}`;

const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

/** 1回 焼いたら おぼえておく。おなじ ものを 2回 焼かない */
const baked = new Set<string>();
/** いま 焼いている ものの やくそく(同時に 何回 よばれても 1回で すむ) */
const baking = new Map<string, Promise<boolean>>();

/**
 * `かたち:いろ` の SVG を テクスチャに 焼く。
 * @returns 焼けたら true。SVG が ない / 読めない ときは false
 */
async function bake(scene: Phaser.Scene, key: string): Promise<boolean> {
  const texKey = svgTextureKey(key);
  if (baked.has(texKey)) return true;
  const [shape, colorName] = key.split(':');
  const src = SVG_OF[shape];
  if (!src) return false;

  const c = ICON_COLORS[colorName ?? 'cream'] ?? ICON_COLORS.cream;
  const text = src.replaceAll('#MAIN', hex(c[0])).replaceAll('#DARK', hex(c[1]));
  // 見た目の 2ばいの ドットで 焼く(コード描画と そろえる。HiDPI で ぼやけない)
  const px = S * 2;

  try {
    const img = new Image(px, px);
    img.decoding = 'sync';
    await new Promise<void>((ok, ng) => {
      img.onload = () => ok();
      img.onerror = () => ng(new Error('svg load failed'));
      // unescape(encodeURIComponent(...)) は マルチバイトを base64 に 通す ための 定番
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(text)))}`;
    });
    // すでに ほかの よびだしが 焼いていたら やめる
    if (scene.textures.exists(texKey)) {
      baked.add(texKey);
      return true;
    }
    const canvas = scene.textures.createCanvas(texKey, px, px);
    if (!canvas) return false;
    canvas.context.drawImage(img, 0, 0, px, px);
    canvas.refresh();
    baked.add(texKey);
    return true;
  } catch {
    // 絵が こわれて いても ゲームは 止めない(コード描画の まま)
    if (import.meta.env.DEV) console.warn(`[icons] SVG を 焼けなかった: ${key}`);
    return false;
  }
}

/** もう 焼けている か(すぐ つかえる か) */
export const svgReady = (scene: Phaser.Scene, key: string): boolean =>
  hasSvg(key.split(':')[0]) && scene.textures.exists(svgTextureKey(key));

/**
 * その アイコンに 手描きの SVG を あてる。
 * すでに 焼けていれば **その場で** 差しかえ、まだなら 焼けてから 差しかえる。
 * SVG が ない かたちは 何も しない(コード描画の まま)。
 */
export function applySvg(img: Phaser.GameObjects.Image, key: string, size: number): void {
  const shape = key.split(':')[0];
  if (!hasSvg(shape)) return;
  const scene = img.scene;
  const texKey = svgTextureKey(key);

  const put = (): void => {
    // 消えた あとに 差しかえない
    if (!img.active || !img.scene) return;
    const before = img.frame?.realWidth ?? 0;
    img.setTexture(texKey);
    // ドット数が おなじ(どちらも 128)なら scale を さわらない。
    // さわると ポンと 出る tween の とちゅうを つぶして しまう
    if ((img.frame?.realWidth ?? 0) !== before) img.setDisplaySize(size, size);
  };

  if (scene.textures.exists(texKey)) {
    put();
    return;
  }
  let job = baking.get(texKey);
  if (!job) {
    job = bake(scene, key).finally(() => baking.delete(texKey));
    baking.set(texKey, job);
  }
  void job.then((ok) => {
    if (ok) put();
  });
}

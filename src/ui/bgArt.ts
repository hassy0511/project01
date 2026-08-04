/* =====================================================
   ミニゲームの 背景の 絵(手描き SVG)。

   ★ アイコン(icons/svg.ts)とは 読みこみ方を わざと 変えて ある。

   アイコンは 202個 × 小さい ので、バンドルに 文字列ごと 埋めこんで いる
   (fetch しない = オフラインでも かならず 出る)。
   背景は ちがう:
     ・1まいが 画面ぜんたい(480×748)ぶんの 絵で、アイコンより ずっと 大きい
     ・59まい あるが、1回の あそびで つかうのは 1まいだけ
   ぜんぶ 埋めこむと、遊ばない 58まいの ために 起動が おそくなる。
   なので 背景は **その ゲームを 始める ときに 取りに いく**。

   オフラインでも 平気な 理由:
     ・絵が とどく まで(または 絵が ない ときは ずっと)、いままでの
       コード描画の 背景が そのまま 出る。空白には ならない
     ・一度 出した 背景は サービスワーカーが おぼえる(public/sw.js の
       とってきた ものを キャッシュする しくみ)ので、2回目からは 電波が なくても 出る

   つかい方(ホストの シーンから 1行):
     applyBgArt(this, this.area, bgNameOf(engine));
   絵が あれば コード描画の 背景を かくして 差しかえる。なければ 何も しない。
   ミニゲーム 43本の 中身は さわらなくて よい。
   ===================================================== */
import type Phaser from 'phaser';
import { GAME_AREA_H, GAME_W } from './theme';
import { SCENERY_NAME } from './scenery';
export { bgNameOf } from '../core/bgName';

/** 焼いた 背景の テクスチャキー(アイコンの svgicon: と 分ける) */
export const bgTextureKey = (name: string): string => `bgart:${name}`;

/** 背景SVGの ある ばしょ。public/art/bg/ に 置く だけで つかわれる */
export const bgUrl = (name: string): string => `${import.meta.env.BASE_URL}art/bg/${name}.svg`;

/** 一度 焼いたら おぼえておく(同じ ゲームを 何回 あそんでも 1回だけ)。
    ならびは 「つかった 順」(さいごが いちばん あたらしい) */
const baked = new Set<string>();
/** いま 焼いて いる ものの やくそく(同時に よばれても 1回で すむ) */
const baking = new Map<string, Promise<boolean>>();
/** 取りに いって 「なかった」ものは もう 取りに いかない(毎回 404 を 出さない) */
const missing = new Set<string>();

/** おぼえておく 背景の 枚数。
    ★背景は 1まいで 960×1376×4バイト ≈ 5MB(canvas と GPU の 両方に のる)。
    まえは 一度 焼いたら ずっと もって いた ので、ゲームを わたり歩く ほど
    メモリが つみあがり、ふるい iPad で 「あそぶほど ぜんたいが 重くなる」
    (子供の 実機で 報告)。すぐ また あそぶ ぶんだけ のこして、古い ものは すてる。
    すてても SVG は サービスワーカーが おぼえて いる ので、つぎは 取りなおして 焼くだけ */
const KEEP_BAKED = 3;

/** つかった しるし(LRU)。いちど けして 入れなおすと ならびの さいごに くる */
function touch(texKey: string): void {
  baked.delete(texKey);
  baked.add(texKey);
}

/** 古い 背景を すてる。いま 出して いる もの(= さいきん touch した もの)は のこる */
function evictOld(scene: Phaser.Scene): void {
  while (baked.size > KEEP_BAKED) {
    const oldest = baked.values().next().value as string | undefined;
    if (!oldest) return;
    baked.delete(oldest);
    try {
      scene.textures.remove(oldest);
    } catch {
      /* すでに ない なら それで よい */
    }
  }
}

/** 背景SVG を テクスチャに 焼く。@returns 焼けたら true */
async function bake(scene: Phaser.Scene, name: string): Promise<boolean> {
  const texKey = bgTextureKey(name);
  if (baked.has(texKey)) {
    touch(texKey);
    return true;
  }
  if (missing.has(name)) return false;
  try {
    const res = await fetch(bgUrl(name));
    if (!res.ok) {
      missing.add(name);
      return false;
    }
    const text = await res.text();
    // 見た目の 2ばいの ドットで 焼く(HiDPI で ぼやけない。アイコンと そろえる)
    const w = GAME_W * 2;
    const h = GAME_AREA_H * 2;
    const img = new Image(w, h);
    await new Promise<void>((ok, ng) => {
      img.onload = () => ok();
      img.onerror = () => ng(new Error('bg svg load failed'));
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(text)))}`;
    });
    if (scene.textures.exists(texKey)) {
      touch(texKey);
      return true;
    }
    const canvas = scene.textures.createCanvas(texKey, w, h);
    if (!canvas) return false;
    canvas.context.drawImage(img, 0, 0, w, h);
    canvas.refresh();
    touch(texKey);
    evictOld(scene);
    return true;
  } catch (e) {
    // 絵が こわれて いても ゲームは 止めない(コード描画の まま)
    missing.add(name);
    console.warn(`[bgArt] 背景を 焼けなかった: ${name}`, String(e));
    return false;
  }
}

/**
 * その ミニゲームに 手描きの 背景が あれば あてる。
 * 絵が とどくまでは コード描画の ままで、焼けたら その場で 差しかえる。
 * @param area ミニゲームの いれもの(コード描画の 背景も この 中に ある)
 */
export function applyBgArt(scene: Phaser.Scene, area: Phaser.GameObjects.Container, name: string): void {
  if (missing.has(name)) return;
  const texKey = bgTextureKey(name);

  const put = (): void => {
    // シーンが 変わった あとに 差しこまない
    if (!area.active || !area.scene || area.scene !== scene) return;
    const img = scene.add.image(GAME_W / 2, GAME_AREA_H / 2, texKey);
    img.setDisplaySize(GAME_W, GAME_AREA_H);
    area.addAt(img, 0); // いちばん 後ろへ
    // コード描画の 背景を かくす(絵と かさねない)
    for (const o of area.list) {
      if (o.name === SCENERY_NAME) (o as Phaser.GameObjects.Image).setVisible(false);
    }
  };

  if (scene.textures.exists(texKey)) {
    touch(texKey); // いま つかう ものを 「さいきん」に して、すてられない ように する
    put();
    return;
  }
  let job = baking.get(texKey);
  if (!job) {
    job = bake(scene, name).finally(() => baking.delete(texKey));
    baking.set(texKey, job);
  }
  void job.then((ok) => {
    if (ok) put();
  });
}

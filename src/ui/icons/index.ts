/* めいさんアイコン: ゲームに でてくる 絵を ぜんぶ ベクターで 描く。
   絵文字(🍓🐟…)は 端末の フォントで 見た目が バラバラに なり、
   おなじ 絵が べつの 意味で 使い回しに なって 安っぽく 見えるので つかわない。

   使い方:
     addIcon(scene, x, y, 'strawberry:red', 64)  → Phaser.GameObjects.Image
     iconTexture(scene, 'fish:sky')              → テクスチャキー(Sprite/Particle にも つかえる)

   キーは `かたち:いろ` の 文字列 1つ(データ駆動)。
   かたちは 種類ごとの ファイルに 分けてある:
     food.ts   … そざい・りょうり
     actors.ts … ひと・いきもの
     nature.ts … しぜん・けしき
     props.ts  … どうぐ・おまつりの もの
     ui.ts     … ★・やじるし などの きごう
   あたらしい かたちを たすときは、その ファイルに 1つ 関数を 足すだけ(ここは いじらない)。 */
import Phaser from 'phaser';
import { ICON_COLORS, S, type IconDraw } from './kit';
import { DRAW } from './registry';
import { applySvg } from './svg';

export { ICON_COLORS } from './kit';
export { allShapes, hasShape } from './registry';
export { hasSvg, svgShapes, svgTextureKey } from './svg';
export type IconKey = string;

/** テクスチャは 見た目の 2ばいの ドットで 焼く(HiDPI で ぼやけない ように) */
const RES = 2;

const parsed = (key: IconKey): { draw: IconDraw; c: [number, number] } => {
  const [shape, cName] = key.split(':');
  const c = ICON_COLORS[cName ?? 'cream'] ?? ICON_COLORS.cream;
  const draw = DRAW[shape];
  if (!draw && import.meta.env.DEV) console.warn(`[icons] しらない かたち: ${shape}`);
  return { draw: draw ?? DRAW.round, c };
};

/** アイコンの テクスチャを 用意して キーを かえす(できていれば つかいまわす) */
export function iconTexture(scene: Phaser.Scene, key: IconKey): string {
  const tk = `icon:${key}`;
  if (scene.textures.exists(tk)) return tk;
  const { draw, c } = parsed(key);
  const g = scene.add.graphics().setVisible(false);
  g.scaleCanvas(RES, RES); // 描画コマンドを 拡大(generateTexture に のる)
  draw(g, c);
  g.generateTexture(tk, S * RES, S * RES);
  g.destroy();
  return tk;
}

/** どの 大きさで おいたかを おぼえておく ための しるし */
const SIZE_KEY = '__iconSize';

/** アイコンを おく(size = 見た目の 1辺 px)。
    手描きの SVG が ある かたちは、焼けしだい そちらに 差しかわる
    (それまでは コード描画。202個 そろうのを 待たない ため) */
export function addIcon(scene: Phaser.Scene, x: number, y: number, key: IconKey, size = 64): Phaser.GameObjects.Image {
  const img = scene.add.image(x, y, iconTexture(scene, key)).setOrigin(0.5).setDisplaySize(size, size);
  img.setData(SIZE_KEY, size);
  applySvg(img, key, size);
  return img;
}

/** アイコンの 「もとの 大きさ = 1」と した ときの scale の あたい。
    テクスチャは 見た目より 大きい ドット数で 焼いてある ので、
    tween や setScale に 1 や 0.8 を そのまま わたすと でっかく なって しまう。
    ぷるんと させたい ときは `scale: iconScale(img, 1.15)` の ように つかう。 */
export function iconScale(img: Phaser.GameObjects.Image, mult = 1): number {
  const size = (img.getData(SIZE_KEY) as number | undefined) ?? img.displayWidth;
  const frameW = img.frame?.realWidth || S * RES;
  return (size / frameW) * mult;
}

/** アイコンを おいた ときの 大きさに もどす。
    テクスチャは 見た目より 大きい ドット数で 焼いてある ので、
    `setScale(1)` を つかうと ドット数どおりの でっかい 絵に なって しまう。
    「もとの 大きさに もどす」ときは かならず これを つかう。 */
export function resetIcon(img: Phaser.GameObjects.Image): Phaser.GameObjects.Image {
  const size = (img.getData(SIZE_KEY) as number | undefined) ?? img.displayWidth;
  return img.setDisplaySize(size, size);
}

/** すでに おいた アイコンの 絵を べつの かたちに 差しかえる(状態が かわる ときに つかう。
    もとの 大きさ・回転は そのまま たもつ) */
export function setIcon(img: Phaser.GameObjects.Image, key: IconKey, size?: number): void {
  const w = size ?? (img.getData(SIZE_KEY) as number | undefined) ?? img.displayWidth;
  img.setTexture(iconTexture(img.scene, key));
  img.setDisplaySize(w, w);
  img.setData(SIZE_KEY, w);
  applySvg(img, key, w);
}



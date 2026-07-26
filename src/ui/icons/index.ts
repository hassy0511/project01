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

export { ICON_COLORS } from './kit';
export { allShapes, hasShape } from './registry';
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

/** アイコンを おく(size = 見た目の 1辺 px) */
export function addIcon(scene: Phaser.Scene, x: number, y: number, key: IconKey, size = 64): Phaser.GameObjects.Image {
  return scene.add.image(x, y, iconTexture(scene, key)).setOrigin(0.5).setDisplaySize(size, size);
}

/** すでに おいた アイコンの 絵を べつの かたちに 差しかえる(状態が かわる ときに つかう。
    もとの 大きさ・回転は そのまま たもつ) */
export function setIcon(img: Phaser.GameObjects.Image, key: IconKey, size?: number): void {
  const w = size ?? img.displayWidth;
  img.setTexture(iconTexture(img.scene, key));
  img.setDisplaySize(w, w);
}



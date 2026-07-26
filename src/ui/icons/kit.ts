/* めいさんアイコンの 共通キット: いろ・ふち・ヘルパー。
   かたちの ていぎファイル(food.ts / actors.ts / nature.ts / props.ts / ui.ts)は
   ここから import して、`Record<string, IconDraw>` を export する。
   64x64 の ローカル座標で 描く(テクスチャ生成側で 2ばいに 拡大される)。 */
import type Phaser from 'phaser';

export type G = Phaser.GameObjects.Graphics;
/** かたち1つの 描画関数。c = [ほんたい色, こい色] */
export type IconDraw = (g: G, c: [number, number]) => void;

/** アイコンの 1辺(ローカル座標) */
export const S = 64;
export const OUTLINE = 0x5a4632;
/** 白っぽい ものの ふち。背景(#f7f3e6)に とけない こさが 必要。
   うつわ・ごはん・ぬのなど「白い もの」の ふちは これを つかう(ベタ書き きんし) */
export const OUTLINE_SOFT = 0x9c8f76;

/** いろの なまえ(データから 文字列で 指定する) */
export const ICON_COLORS: Record<string, [number, number]> = {
  // [ほんたい, こい ぶぶん(ふち・かげ)]
  red: [0xe0584f, 0xa83a33],
  crimson: [0xc0392b, 0x8e2a20],
  pink: [0xf28ba0, 0xc25f74],
  orange: [0xf0913c, 0xbc6a22],
  amber: [0xf2b544, 0xbf8622],
  yellow: [0xf5d84e, 0xc2a52c],
  lime: [0xa7cf5a, 0x77993a],
  green: [0x6fb04a, 0x4b7c30],
  deepgreen: [0x3f7d3c, 0x2a5828],
  teal: [0x4fb3a3, 0x2f8175],
  sky: [0x76c4e8, 0x4a94b8],
  blue: [0x4f86c6, 0x33608f],
  navy: [0x3b4f7d, 0x27365a],
  purple: [0xa77bc4, 0x7a5293],
  violet: [0x8e6bb5, 0x644a86],
  brown: [0x9a6b42, 0x6d492b],
  tan: [0xd8b483, 0xa8865a],
  // うすい 3色は ふちを こく する(うすい ふちだと 背景に とけて かたちが 見えない)
  cream: [0xf6e7c4, 0xb59253],
  white: [0xfaf6ec, 0x9c8f76],
  gray: [0x9aa0a6, 0x6c7278],
  dark: [0x4a4a52, 0x2c2c33],
  gold: [0xe8c14a, 0xb28f22],
  silver: [0xd6dde3, 0x8a949e],
};

export const fill = (g: G, color: number): void => {
  g.fillStyle(color, 1);
};
export const line = (g: G, color = OUTLINE, w = 2.4): void => {
  g.lineStyle(w, color, 1);
};

/** はっぱ(みの うえに つける) */
export const leaf = (g: G, x: number, y: number, sz = 12, dir = 1): void => {
  fill(g, 0x5aa04a);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + sz * dir, y - sz * 0.7);
  g.lineTo(x + sz * 1.5 * dir, y + sz * 0.15);
  g.lineTo(x + sz * 0.4 * dir, y + sz * 0.45);
  g.closePath();
  g.fillPath();
  line(g, 0x37702c, 1.6);
  g.strokePath();
};

export const stem = (g: G, x: number, y: number, h = 10): void => {
  fill(g, 0x7a5a34);
  g.fillRoundedRect(x - 2, y - h, 4, h + 2, 2);
};

/** つやの ハイライト */
export const shine = (g: G, x: number, y: number, rx = 6, ry = 4): void => {
  g.fillStyle(0xffffff, 0.5);
  g.fillEllipse(x, y, rx * 2, ry * 2);
};

export const ellipseOutlined = (g: G, x: number, y: number, w: number, h: number, c: [number, number]): void => {
  fill(g, c[0]);
  g.fillEllipse(x, y, w, h);
  line(g, c[1]);
  g.strokeEllipse(x, y, w, h);
};


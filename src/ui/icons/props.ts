/* どうぐ・おまつりの ものの かたち(ちょうちん・たいこ・ふね・たこ・つな…)。
   64x64 の ローカル座標で 描く。いろは c=[ほんたい, こい色] で わたされる。
   ここに あたらしい かたちを 足すときは、この Record に 1つ 関数を 足すだけでよい。 */
import { fill, line, shine, type G, type IconDraw } from './kit';

const WOOD = 0x8a6a4a;
const WOOD_D = 0x63492f;
const TAN = 0xd8b483;
const TAN_D = 0xa8865a;
const METAL = 0xd6dde3;
const METAL_D = 0x9aa0a6;
const PAPER = 0xfaf6ec;
const PAPER_D = 0xcfc7b4;
const STONE = 0x9aa0a6;
const STONE_D = 0x6c7278;
const INK = 0x2c2c33;
const FLAME = 0xf0913c;
const FLAME_IN = 0xf5d84e;

/** てんを つないだ かたちを ぬって、こい色で ふちどる */
const poly = (g: G, pts: readonly [number, number][], c: [number, number], w = 2.4): void => {
  fill(g, c[0]);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
  g.closePath();
  g.fillPath();
  line(g, c[1], w);
  g.strokePath();
};

/** かどの まるい しかく(いた・はこ・ぼう に つかう) */
const box = (g: G, x: number, y: number, w: number, h: number, r: number, c: [number, number], lw = 2.4): void => {
  fill(g, c[0]);
  g.fillRoundedRect(x, y, w, h, r);
  line(g, c[1], lw);
  g.strokeRoundedRect(x, y, w, h, r);
};

/** ふとい ぼう(えだ・え・はしら)。ふちを 先に ひいて 上から ぬる */
const rod = (g: G, x1: number, y1: number, x2: number, y2: number, c: [number, number] = [WOOD, WOOD_D], w = 4): void => {
  const trace = (): void => {
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.strokePath();
  };
  line(g, c[1], w + 2.6);
  trace();
  line(g, c[0], w);
  trace();
};

/** 下むきの はんえん(はち・ドーム) */
const dome = (g: G, x: number, y: number, r: number, c: [number, number], up = true): void => {
  const a0 = up ? Math.PI : 0;
  const a1 = up ? Math.PI * 2 : Math.PI;
  fill(g, c[0]);
  g.slice(x, y, r, a0, a1, false);
  g.fillPath();
  line(g, c[1]);
  g.beginPath();
  g.arc(x, y, r, a0, a1, false);
  g.closePath();
  g.strokePath();
};

/** ひ(たいまつ・かま の ほのお) */
const flame = (g: G, x: number, y: number, s: number): void => {
  poly(
    g,
    [
      [x, y - s * 1.9],
      [x + s * 0.85, y - s * 0.5],
      [x + s * 0.7, y + s * 0.7],
      [x - s * 0.7, y + s * 0.7],
      [x - s * 0.85, y - s * 0.5],
    ],
    [FLAME, 0xbc6a22],
    2,
  );
  poly(
    g,
    [
      [x, y - s * 0.9],
      [x + s * 0.45, y],
      [x + s * 0.35, y + s * 0.7],
      [x - s * 0.35, y + s * 0.7],
      [x - s * 0.45, y],
    ],
    [FLAME_IN, 0xe0a52c],
    1.4,
  );
};

/** やねの かたち(そりかえった のき)。castle / cart で つかう */
const roofShape = (g: G, cx: number, yTop: number, yBot: number, halfTop: number, halfBot: number, c: [number, number]): void => {
  poly(
    g,
    [
      [cx - halfTop, yTop],
      [cx + halfTop, yTop],
      [cx + halfBot, yBot - 4],
      [cx + halfBot - 2.5, yBot],
      [cx - halfBot + 2.5, yBot],
      [cx - halfBot, yBot - 4],
    ],
    c,
  );
};

export const PROP_ICONS: Record<string, IconDraw> = {
  lantern: (g, c) => {
    fill(g, 0x8a6a4a);
    g.fillRect(28, 6, 8, 6);
    fill(g, c[0]);
    g.fillEllipse(32, 34, 32, 44);
    line(g, c[1]);
    g.strokeEllipse(32, 34, 32, 44);
    fill(g, 0xf5d84e);
    g.fillEllipse(32, 34, 16, 26);
    fill(g, 0x8a6a4a);
    g.fillRect(22, 10, 20, 5);
    g.fillRect(22, 54, 20, 5);
  },
  fan: (g, c) => {
    fill(g, c[0]);
    g.slice(32, 52, 30, Math.PI * 1.15, Math.PI * 1.85, false);
    g.fillPath();
    line(g, c[1]);
    g.beginPath();
    g.arc(32, 52, 30, Math.PI * 1.15, Math.PI * 1.85, false);
    g.strokePath();
    line(g, c[1], 1.4);
    for (let i = 0; i <= 4; i++) {
      const a = Math.PI * 1.15 + (i / 4) * Math.PI * 0.7;
      g.beginPath();
      g.moveTo(32, 52);
      g.lineTo(32 + Math.cos(a) * 30, 52 + Math.sin(a) * 30);
      g.strokePath();
    }
    fill(g, 0x8a6a4a);
    g.fillCircle(32, 52, 4);
  },
  /** たいこ。ほかと 大きさを そろえ、びょうを うって「バケツ」に 見えない ように する */
  drum: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(11, 18, 42, 34, 8);
    line(g, c[1]);
    g.strokeRoundedRect(11, 18, 42, 34, 8);
    // かわ(うわめん)
    fill(g, 0xf6e7c4);
    g.fillEllipse(32, 19, 46, 14);
    line(g, 0x9c8f76, 2.2);
    g.strokeEllipse(32, 19, 46, 14);
    // びょう
    fill(g, c[1]);
    for (const x of [16, 26, 38, 48]) g.fillCircle(x, 34, 2);
    // ばち
    fill(g, 0xd8b483);
    g.fillRoundedRect(48, 6, 5, 24, 2.5);
    line(g, 0xa8865a, 1.8);
    g.strokeRoundedRect(48, 6, 5, 24, 2.5);
  },
  shrine: (g, c) => {
    fill(g, c[0]);
    g.fillRect(14, 22, 8, 34);
    g.fillRect(42, 22, 8, 34);
    line(g, c[1], 1.8);
    g.strokeRect(14, 22, 8, 34);
    g.strokeRect(42, 22, 8, 34);
    box(g, 12, 26, 40, 6, 2, c, 1.8);
    box(g, 6, 12, 52, 9, 3, c);
  },
  boat: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(8, 38);
    g.lineTo(56, 38);
    g.lineTo(46, 52);
    g.lineTo(18, 52);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    fill(g, 0xfaf6ec);
    g.fillTriangle(32, 8, 32, 36, 50, 34);
    line(g, 0xcfc7b4, 1.6);
    g.strokeTriangle(32, 8, 32, 36, 50, 34);
    fill(g, 0x8a6a4a);
    g.fillRect(30, 8, 3, 30);
  },
  kite: (g, c) => {
    fill(g, c[0]);
    g.fillTriangle(32, 8, 10, 34, 54, 34);
    g.fillTriangle(10, 34, 54, 34, 32, 52);
    line(g, c[1]);
    g.strokeTriangle(32, 8, 10, 34, 54, 34);
    line(g, 0x8a7a62, 1.6);
    g.beginPath();
    g.moveTo(32, 52);
    g.lineTo(38, 62);
    g.strokePath();
  },
  balloon: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 28, 40, 42);
    line(g, c[1]);
    g.strokeEllipse(32, 28, 40, 42);
    g.fillStyle(0xffffff, 0.35);
    g.fillEllipse(24, 20, 8, 12);
    fill(g, 0x8a6a4a);
    g.fillRect(26, 48, 12, 10);
    line(g, 0x6d492b, 1.6);
    g.strokeRect(26, 48, 12, 10);
  },
  /** つな・なわ。まえは ななめの すじだけで なにか わからなかったので
     たばねた 「わ」+ よじれ に する(おおづなひき・わらじ・かんぴょう) */
  rope: (g, c) => {
    // つなの わ(たばねた ロープ)
    line(g, c[1], 15);
    g.strokeEllipse(32, 36, 42, 32);
    line(g, c[0], 11);
    g.strokeEllipse(32, 36, 42, 32);
    // よじれ(ねじった すじ)
    line(g, c[1], 1.8);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const [cx, cy] = [32 + Math.cos(a) * 21, 36 + Math.sin(a) * 16];
      const [nx, ny] = [Math.cos(a), Math.sin(a) * 0.76];
      const len = Math.hypot(nx, ny) || 1;
      g.beginPath();
      g.moveTo(cx - (nx / len) * 5 - (ny / len) * 3, cy - (ny / len) * 5 + (nx / len) * 3);
      g.lineTo(cx + (nx / len) * 5 + (ny / len) * 3, cy + (ny / len) * 5 - (nx / len) * 3);
      g.strokePath();
    }
    // むすんだ さき
    line(g, c[1], 9);
    g.beginPath();
    g.moveTo(44, 52);
    g.lineTo(56, 60);
    g.strokePath();
    line(g, c[0], 6);
    g.beginPath();
    g.moveTo(44, 52);
    g.lineTo(56, 60);
    g.strokePath();
  },

  /** てこぎの こぶね(かわくだり・ふなあそび) */
  rowboat: (g, c) => {
    const oar = (x2: number, y2: number, x1: number, y1: number): void => {
      const d = Math.hypot(x2 - x1, y2 - y1);
      const ux = (x2 - x1) / d;
      const uy = (y2 - y1) / d;
      rod(g, x1, y1, x2, y2, [WOOD, WOOD_D], 3.4);
      poly(g, [
        [x2 - uy * 5 - ux * 12, y2 + ux * 5 - uy * 12],
        [x2 + uy * 5 - ux * 12, y2 - ux * 5 - uy * 12],
        [x2 + uy * 4 + ux * 3, y2 - ux * 4 + uy * 3],
        [x2 - uy * 4 + ux * 3, y2 + ux * 4 + uy * 3],
      ], [TAN, TAN_D], 1.8);
    };
    oar(10, 16, 28, 42);
    oar(54, 16, 36, 42);
    poly(g, [
      [5, 34],
      [59, 34],
      [48, 54],
      [16, 54],
    ], c);
    box(g, 20, 34, 24, 5, 2, [TAN, TAN_D], 1.6);
    line(g, c[1], 1.6);
    g.beginPath();
    g.moveTo(12, 44);
    g.lineTo(52, 44);
    g.strokePath();
  },

  /** よさこいの なるこ(木の いたを うちならす どうぐ) */
  naruko: (g, c) => {
    line(g, WOOD_D, 2.2);
    g.beginPath();
    g.moveTo(15, 14);
    g.lineTo(49, 14);
    g.strokePath();
    box(g, 9, 11, 15, 24, 3, c, 2);
    box(g, 40, 11, 15, 24, 3, c, 2);
    box(g, 22, 7, 20, 32, 3, [TAN, TAN_D]);
    fill(g, c[0]);
    g.fillRect(22, 15, 20, 7);
    line(g, c[1], 1.6);
    g.strokeRect(22, 15, 20, 7);
    line(g, TAN_D, 1.6);
    g.beginPath();
    g.moveTo(26, 30);
    g.lineTo(38, 30);
    g.strokePath();
    box(g, 27, 37, 10, 21, 5, [WOOD, WOOD_D]);
  },

  /** よこぶえ(おはやしの ふえ) */
  flute: (g, c) => {
    box(g, 4, 27, 56, 11, 5, [TAN, TAN_D]);
    fill(g, INK);
    for (let i = 0; i < 5; i++) g.fillCircle(24 + i * 7, 32.5, 2.4);
    g.fillEllipse(13, 32.5, 7, 5);
    fill(g, c[0]);
    g.fillRect(17, 26, 4, 13);
    g.fillRect(54, 26, 4, 13);
    line(g, c[1], 1.4);
    g.strokeRect(17, 26, 4, 13);
    g.strokeRect(54, 26, 4, 13);
    shine(g, 20, 29, 12, 1.6);
  },

  /** たいまつ(よまつりの ひ) */
  torch: (g, c) => {
    box(g, 27, 30, 9, 30, 4, [WOOD, WOOD_D]);
    line(g, WOOD_D, 2);
    g.beginPath();
    g.moveTo(27, 44);
    g.lineTo(36, 44);
    g.moveTo(27, 52);
    g.lineTo(36, 52);
    g.strokePath();
    dome(g, 31.5, 32, 11, c, false);
    flame(g, 32, 20, 9);
  },

  /** おけ(みずくみ・しゅうかくの いれもの) */
  bucket: (g, c) => {
    line(g, METAL_D, 3);
    g.beginPath();
    g.arc(32, 24, 17, Math.PI, Math.PI * 2, false);
    g.strokePath();
    poly(g, [
      [13, 22],
      [51, 22],
      [45, 56],
      [19, 56],
    ], c);
    line(g, c[1], 2);
    g.beginPath();
    g.moveTo(15, 34);
    g.lineTo(49, 34);
    g.moveTo(17, 45);
    g.lineTo(47, 45);
    g.strokePath();
    fill(g, c[1]);
    g.fillEllipse(32, 22, 38, 11);
    fill(g, 0x4a3a2c);
    g.fillEllipse(32, 22.5, 31, 7);
  },

  /** いど(石の わく+つるべ) */
  well: (g, c) => {
    box(g, 13, 8, 7, 26, 2, [WOOD, WOOD_D], 1.8);
    box(g, 44, 8, 7, 26, 2, [WOOD, WOOD_D], 1.8);
    box(g, 8, 4, 48, 9, 3, c);
    line(g, WOOD_D, 1.8);
    g.beginPath();
    g.moveTo(32, 13);
    g.lineTo(32, 24);
    g.strokePath();
    box(g, 26, 23, 13, 11, 2, [TAN, TAN_D], 1.8);
    box(g, 10, 32, 44, 24, 4, [STONE, STONE_D]);
    line(g, STONE_D, 1.6);
    for (const x of [22, 32, 42]) {
      g.beginPath();
      g.moveTo(x, 40);
      g.lineTo(x, 56);
      g.strokePath();
    }
    g.beginPath();
    g.moveTo(10, 44);
    g.lineTo(54, 44);
    g.strokePath();
    fill(g, STONE);
    g.fillEllipse(32, 32, 44, 13);
    line(g, STONE_D, 2.2);
    g.strokeEllipse(32, 32, 44, 13);
    fill(g, 0x2f3a4a);
    g.fillEllipse(32, 32.5, 34, 8);
  },

  /** つるはし(こうざん・かいたくの どうぐ) */
  pick: (g, c) => {
    rod(g, 24, 58, 34, 20, [WOOD, WOOD_D], 5.5);
    poly(g, [
      [5, 28],
      [18, 15],
      [32, 11],
      [46, 15],
      [59, 28],
      [45, 23],
      [32, 20],
      [19, 23],
    ], [METAL, METAL_D]);
    box(g, 25, 16, 14, 12, 3, c, 2);
    shine(g, 24, 19, 5, 2);
  },

  /** ほうちょう(りょうりの どうぐ) */
  knife: (g, c) => {
    poly(g, [
      [4, 42],
      [15, 20],
      [38, 20],
      [38, 42],
    ], [METAL, METAL_D]);
    shine(g, 22, 27, 9, 2.4);
    box(g, 37, 24, 23, 18, 6, c);
    box(g, 35, 22, 6, 21, 2, [METAL, METAL_D], 1.8);
    fill(g, c[1]);
    g.fillCircle(47, 33, 2.2);
    g.fillCircle(55, 33, 2.2);
  },

  /** かご(しゅうかくを いれる たけかご) */
  basket: (g, c) => {
    dome(g, 32, 28, 22, c, false);
    line(g, c[1], 1.6);
    for (const r of [16, 10]) {
      g.beginPath();
      g.arc(32, 28, r, 0, Math.PI, false);
      g.strokePath();
    }
    for (const x of [20, 32, 44]) {
      g.beginPath();
      g.moveTo(x, 28);
      g.lineTo(x, 28 + Math.sqrt(Math.max(0, 22 * 22 - (x - 32) * (x - 32))) - 2);
      g.strokePath();
    }
    fill(g, c[0]);
    g.fillEllipse(32, 28, 46, 12);
    line(g, c[1], 2.2);
    g.strokeEllipse(32, 28, 46, 12);
    line(g, WOOD_D, 4.4);
    g.beginPath();
    g.arc(32, 27, 16, Math.PI, Math.PI * 2, false);
    g.strokePath();
    line(g, WOOD, 2.6);
    g.beginPath();
    g.arc(32, 27, 16, Math.PI, Math.PI * 2, false);
    g.strokePath();
  },

  /** てぶくろ(はたけしごとの ぐんて) */
  glove: (g, c) => {
    box(g, 10, 26, 17, 14, 7, c);
    box(g, 21, 10, 26, 38, 10, c);
    line(g, c[1], 1.8);
    for (const x of [30, 38]) {
      g.beginPath();
      g.moveTo(x, 12);
      g.lineTo(x, 26);
      g.strokePath();
    }
    box(g, 20, 44, 28, 12, 4, [PAPER, PAPER_D]);
    line(g, PAPER_D, 1.6);
    g.beginPath();
    g.moveTo(20, 50);
    g.lineTo(48, 50);
    g.strokePath();
  },

  /** てぬぐい(ものほしに かけた ぬの) */
  towel: (g, c) => {
    line(g, 0x8a7a62, 2.2);
    g.beginPath();
    g.moveTo(2, 13);
    g.lineTo(62, 13);
    g.strokePath();
    poly(g, [
      [7, 11],
      [57, 11],
      [57, 44],
      [49, 52],
      [41, 44],
      [32, 52],
      [23, 44],
      [15, 52],
      [7, 44],
    ], c);
    fill(g, PAPER);
    g.fillRect(7, 20, 50, 7);
    g.fillRect(7, 33, 50, 7);
    line(g, c[1], 1.6);
    g.strokeRect(7, 20, 50, 7);
    g.strokeRect(7, 33, 50, 7);
    fill(g, METAL);
    for (const x of [16, 48]) {
      g.fillRoundedRect(x - 3.5, 6, 7, 12, 3);
      line(g, METAL_D, 1.6);
      g.strokeRoundedRect(x - 3.5, 6, 7, 12, 3);
    }
  },

  /** おまつりの やたい(しま模様の やね+だい) */
  stall: (g, c) => {
    poly(g, [
      [4, 24],
      [60, 24],
      [52, 12],
      [12, 12],
    ], [PAPER, PAPER_D]);
    const top = (x: number): number => 12 + ((x - 4) / 56) * 40;
    fill(g, c[0]);
    for (let i = 0; i < 4; i++) {
      const x0 = 5 + i * 14;
      g.beginPath();
      g.moveTo(x0, 23);
      g.lineTo(x0 + 7, 23);
      g.lineTo(top(x0 + 7), 13);
      g.lineTo(top(x0), 13);
      g.closePath();
      g.fillPath();
    }
    line(g, PAPER_D, 2.4);
    g.beginPath();
    g.moveTo(4, 24);
    g.lineTo(60, 24);
    g.lineTo(52, 12);
    g.lineTo(12, 12);
    g.closePath();
    g.strokePath();
    box(g, 8, 24, 5, 20, 1.5, [WOOD, WOOD_D], 1.8);
    box(g, 51, 24, 5, 20, 1.5, [WOOD, WOOD_D], 1.8);
    box(g, 8, 38, 48, 8, 2, [TAN, TAN_D]);
    box(g, 13, 46, 38, 12, 2, [WOOD, WOOD_D]);
  },

  /** のぼりばた(おまつりの はた) */
  banner: (g, c) => {
    box(g, 9, 6, 6, 54, 3, [WOOD, WOOD_D], 1.8);
    poly(g, [
      [14, 10],
      [58, 10],
      [49, 26],
      [58, 42],
      [14, 42],
    ], c);
    fill(g, PAPER);
    g.fillRect(14, 22, 32, 7);
    line(g, c[1], 1.6);
    g.strokeRect(14, 22, 32, 7);
    fill(g, 0xe8c14a);
    g.fillCircle(12, 6, 5);
    line(g, 0xb28f22, 1.8);
    g.strokeCircle(12, 6, 5);
  },

  /** 山車(だんじり。くるまの ついた おまつりの やたい) */
  cart: (g, c) => {
    box(g, 28, 3, 8, 8, 2, [0xe8c14a, 0xb28f22], 1.8);
    roofShape(g, 32, 12, 26, 16, 29, c);
    box(g, 14, 26, 36, 18, 2, [TAN, TAN_D]);
    fill(g, INK);
    g.fillRect(19, 30, 10, 10);
    g.fillRect(35, 30, 10, 10);
    box(g, 10, 42, 44, 6, 2, [WOOD, WOOD_D], 1.8);
    for (const x of [20, 44]) {
      fill(g, WOOD);
      g.fillCircle(x, 51, 8);
      line(g, WOOD_D, 2.2);
      g.strokeCircle(x, 51, 8);
      g.beginPath();
      g.moveTo(x - 6, 51);
      g.lineTo(x + 6, 51);
      g.moveTo(x, 45);
      g.lineTo(x, 57);
      g.strokePath();
    }
  },

  /** てっとう(とうきょうタワー風の たかい とう) */
  tower: (g, c) => {
    const hw = (y: number): number => 7 + ((y - 18) / 40) * 17;
    for (const s of [-1, 1]) {
      poly(g, [
        [32 + s * hw(58), 58],
        [32 + s * (hw(58) - 6), 58],
        [32 + s * (hw(18) - 4), 18],
        [32 + s * hw(18), 18],
      ], c, 1.8);
    }
    line(g, c[1], 1.4);
    const ys = [58, 46, 34, 26, 18];
    for (let i = 0; i < ys.length - 1; i++) {
      g.beginPath();
      g.moveTo(32 - hw(ys[i]) + 2, ys[i]);
      g.lineTo(32 + hw(ys[i + 1]) - 2, ys[i + 1]);
      g.moveTo(32 + hw(ys[i]) - 2, ys[i]);
      g.lineTo(32 - hw(ys[i + 1]) + 2, ys[i + 1]);
      g.strokePath();
    }
    for (const y of [46, 34, 18]) box(g, 32 - hw(y), y - 2, hw(y) * 2, 4, 1.5, c, 1.4);
    box(g, 32 - 13, 24, 26, 7, 2, c, 1.8);
    box(g, 29, 4, 6, 15, 2, c, 1.8);
    fill(g, 0xe0584f);
    g.fillCircle(32, 4, 3.5);
  },

  /** てんしゅかく(おしろ) */
  castle: (g, c) => {
    poly(g, [
      [4, 58],
      [14, 44],
      [50, 44],
      [60, 58],
    ], [STONE, STONE_D]);
    line(g, STONE_D, 1.6);
    g.beginPath();
    g.moveTo(10, 51);
    g.lineTo(54, 51);
    g.strokePath();
    box(g, 15, 30, 34, 15, 2, [PAPER, PAPER_D]);
    fill(g, INK);
    g.fillRect(20, 34, 8, 8);
    g.fillRect(36, 34, 8, 8);
    roofShape(g, 32, 21, 31, 15, 29, c);
    box(g, 24, 11, 16, 8, 2, [PAPER, PAPER_D], 1.8);
    fill(g, INK);
    g.fillRect(29, 13, 6, 5);
    roofShape(g, 32, 4, 12, 7, 17, c);
  },

  /** まちや(むらの いえ) */
  house: (g, c) => {
    box(g, 12, 26, 40, 30, 2, [PAPER, PAPER_D]);
    poly(g, [
      [4, 28],
      [14, 10],
      [50, 10],
      [60, 28],
    ], c);
    line(g, c[1], 1.6);
    g.beginPath();
    g.moveTo(9, 19);
    g.lineTo(55, 19);
    g.strokePath();
    box(g, 18, 38, 14, 18, 2, [WOOD, WOOD_D]);
    box(g, 36, 32, 14, 12, 2, [0x76c4e8, 0x4a94b8]);
    line(g, 0x4a94b8, 1.6);
    g.beginPath();
    g.moveTo(43, 32);
    g.lineTo(43, 44);
    g.moveTo(36, 38);
    g.lineTo(50, 38);
    g.strokePath();
  },

  /** こや(かやぶきの ちいさな こや) */
  hut: (g, c) => {
    poly(g, [
      [32, 5],
      [59, 55],
      [5, 55],
    ], c);
    line(g, c[1], 1.6);
    for (const d of [0.35, 0.6, 0.85]) {
      g.beginPath();
      g.moveTo(32 - 27 * d, 5 + 50 * d);
      g.lineTo(32 + 27 * d, 5 + 50 * d);
      g.strokePath();
    }
    fill(g, WOOD);
    g.fillRoundedRect(24, 34, 16, 21, 8);
    g.fillRect(24, 46, 16, 9);
    line(g, WOOD_D, 2.2);
    g.strokeRoundedRect(24, 34, 16, 21, 8);
    line(g, WOOD_D, 1.8);
    g.beginPath();
    g.moveTo(32, 36);
    g.lineTo(32, 55);
    g.strokePath();
  },

  /** まきもの(ずかん・いいつたえ) */
  scroll: (g, c) => {
    box(g, 16, 14, 44, 36, 2, [PAPER, PAPER_D]);
    line(g, STONE_D, 1.8);
    for (const [x, h] of [[28, 24], [36, 17], [44, 22], [52, 13]] as const) {
      g.beginPath();
      g.moveTo(x, 20);
      g.lineTo(x, 20 + h);
      g.strokePath();
    }
    box(g, 4, 11, 18, 42, 9, c);
    line(g, c[1], 1.8);
    g.strokeRoundedRect(8, 17, 10, 30, 5);
    g.beginPath();
    g.arc(13, 32, 3.5, 0, Math.PI * 2, false);
    g.strokePath();
  },

  /** わがさ(かさおどりの かさ) */
  umbrella: (g, c) => {
    box(g, 30, 8, 5, 12, 2, [WOOD, WOOD_D], 1.8);
    for (const dx of [-19, -6.5, 6.5, 19]) {
      fill(g, c[0]);
      g.slice(32 + dx, 36, 7, 0, Math.PI, false);
      g.fillPath();
    }
    dome(g, 32, 36, 26, c);
    line(g, c[1], 1.6);
    for (const dx of [-19, -6.5, 6.5, 19]) {
      g.beginPath();
      g.arc(32 + dx, 36, 7, 0, Math.PI, false);
      g.strokePath();
      g.beginPath();
      g.moveTo(32 + dx - 7, 36);
      g.lineTo(32, 36);
      g.strokePath();
    }
    for (let i = 1; i < 5; i++) {
      const a = Math.PI + (i / 5) * Math.PI;
      g.beginPath();
      g.moveTo(32, 36);
      g.lineTo(32 + Math.cos(a) * 25, 36 + Math.sin(a) * 25);
      g.strokePath();
    }
    box(g, 30, 36, 5, 22, 2, [WOOD, WOOD_D], 1.8);
  },

  /** さけ(とっくりと おちょこ) */
  sake: (g, c) => {
    box(g, 20, 18, 12, 16, 3, c, 2);
    fill(g, c[0]);
    g.fillEllipse(26, 42, 32, 30);
    line(g, c[1]);
    g.strokeEllipse(26, 42, 32, 30);
    fill(g, c[0]);
    g.fillEllipse(26, 18, 18, 8);
    line(g, c[1], 2);
    g.strokeEllipse(26, 18, 18, 8);
    box(g, 14, 38, 24, 11, 1.5, [PAPER, PAPER_D], 1.8);
    line(g, c[1], 1.6);
    g.beginPath();
    g.moveTo(14, 43.5);
    g.lineTo(38, 43.5);
    g.strokePath();
    poly(g, [
      [44, 42],
      [61, 42],
      [58, 55],
      [47, 55],
    ], [PAPER, PAPER_D], 2);
  },

  /** あみ(さかなを すくう たまあみ) */
  net: (g, c) => {
    rod(g, 6, 58, 26, 36, [WOOD, WOOD_D], 4.5);
    line(g, c[1], 1.4);
    for (const r of [22, 14, 7]) {
      g.beginPath();
      g.arc(40, 24, r, 0, Math.PI, false);
      g.strokePath();
    }
    for (let i = 1; i < 6; i++) {
      const a = (i / 6) * Math.PI;
      g.beginPath();
      g.moveTo(40 + Math.cos(a) * 22, 24 + Math.sin(a) * 1);
      g.lineTo(40 + Math.cos(a) * 6, 24 + Math.sin(a) * 22);
      g.strokePath();
    }
    line(g, c[1], 4.6);
    g.strokeEllipse(40, 24, 44, 18);
    line(g, c[0], 2.8);
    g.strokeEllipse(40, 24, 44, 18);
  },

  /** のこぎり(きを きる どうぐ) */
  saw: (g, c) => {
    poly(g, [
      [6, 20],
      [46, 20],
      [46, 32],
      [6, 32],
    ], [METAL, METAL_D], 2);
    for (let i = 0; i < 7; i++) {
      const x = 8 + i * 5.4;
      poly(g, [
        [x, 31],
        [x + 5.4, 31],
        [x + 2.7, 38],
      ], [METAL, METAL_D], 1.6);
    }
    shine(g, 22, 24, 12, 1.8);
    box(g, 44, 16, 16, 20, 5, c);
    fill(g, METAL_D);
    g.fillCircle(52, 21, 2);
  },

  /** ひしゃく(みずを くむ たけの どうぐ) */
  ladle: (g, c) => {
    rod(g, 56, 8, 30, 34, [TAN, TAN_D], 5);
    box(g, 12, 32, 26, 18, 3, [TAN, TAN_D]);
    fill(g, c[0]);
    g.fillRect(12, 41, 26, 5);
    line(g, c[1], 1.4);
    g.strokeRect(12, 41, 26, 5);
    fill(g, TAN);
    g.fillEllipse(25, 32, 28, 10);
    line(g, TAN_D, 2.2);
    g.strokeEllipse(25, 32, 28, 10);
    fill(g, 0x76c4e8);
    g.fillEllipse(25, 33, 21, 6);
    shine(g, 20, 32, 4, 1.4);
  },

  /** かま(やきものを やく かま) */
  kiln: (g, c) => {
    box(g, 47, 6, 12, 24, 2, [STONE, STONE_D], 2);
    fill(g, 0x1e1e24);
    g.fillRect(49, 6, 8, 4);
    dome(g, 27, 44, 23, c);
    line(g, c[1], 1.6);
    for (const r of [16, 9] as const) {
      g.beginPath();
      g.arc(27, 44, r, Math.PI, Math.PI * 2, false);
      g.strokePath();
    }
    box(g, 3, 42, 58, 12, 3, [STONE, STONE_D]);
    fill(g, 0x1e1e24);
    g.fillRoundedRect(19, 31, 17, 15, 7);
    line(g, c[1], 2);
    g.strokeRoundedRect(19, 31, 17, 15, 7);
    flame(g, 27.5, 42, 5.5);
  },

  /** いかだ(まるたを ならべた ふね) */
  raft: (g, c) => {
    for (let i = 0; i < 5; i++) {
      const y = 12 + i * 9;
      box(g, 5, y, 54, 9, 4.5, c, 2);
      fill(g, c[1]);
      g.fillEllipse(8, y + 4.5, 6, 7);
    }
    line(g, WOOD_D, 3.2);
    for (const x of [20, 46]) {
      g.beginPath();
      g.moveTo(x, 10);
      g.lineTo(x, 58);
      g.strokePath();
    }
    line(g, TAN, 1.6);
    for (const x of [20, 46]) {
      g.beginPath();
      g.moveTo(x, 10);
      g.lineTo(x, 58);
      g.strokePath();
    }
  },

  /** かにかご(あみを はった しかけかご) */
  cage: (g, c) => {
    dome(g, 32, 50, 27, c);
    line(g, c[1], 2);
    for (const r of [19, 11] as const) {
      g.beginPath();
      g.arc(32, 50, r, Math.PI, Math.PI * 2, false);
      g.strokePath();
    }
    for (let i = 1; i < 5; i++) {
      const a = Math.PI + (i / 5) * Math.PI;
      g.beginPath();
      g.moveTo(32, 50);
      g.lineTo(32 + Math.cos(a) * 26, 50 + Math.sin(a) * 26);
      g.strokePath();
    }
    fill(g, 0x2f3a4a);
    g.fillEllipse(32, 43, 17, 14);
    line(g, c[1], 2.2);
    g.strokeEllipse(32, 43, 17, 14);
    box(g, 3, 48, 58, 10, 4, [WOOD, WOOD_D]);
    line(g, WOOD_D, 3.2);
    g.beginPath();
    g.arc(32, 24, 8, Math.PI * 1.1, Math.PI * 1.9, false);
    g.strokePath();
  },
};

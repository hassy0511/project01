/* きごうの かたち(★・やじるし・チェック・かぎ・おと など UI用)。
   64x64 の ローカル座標で 描く。いろは c=[ほんたい, こい色] で わたされる。
   ここに あたらしい かたちを 足すときは、この Record に 1つ 関数を 足すだけでよい。
   UI では 20〜32px と 小さく でるので、線は 太め・かたちは 単純に する。 */
import { fill, line, shine, type G, type IconDraw } from './kit';

const PAPER = 0xfaf6ec;
const PAPER_D = 0xcfc7b4;
const WOOD = 0x8a6a4a;
const WOOD_D = 0x63492f;
const METAL = 0xd6dde3;
const METAL_D = 0x9aa0a6;
const GOLD = 0xe8c14a;
const GOLD_D = 0xb28f22;
const RUBY = 0xe0584f;
const EMPTY = 0xded4bc;

type Pt = readonly [number, number];

/** てんを つないだ かたちを ぬって、こい色で ふちどる */
const poly = (g: G, pts: readonly Pt[], c: [number, number], w = 2.6): void => {
  fill(g, c[0]);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
  g.closePath();
  g.fillPath();
  line(g, c[1], w);
  g.strokePath();
};

/** かどの まるい しかく(ぼう・いた・はこ) */
const box = (g: G, x: number, y: number, w: number, h: number, r: number, c: [number, number], lw = 2.6): void => {
  fill(g, c[0]);
  g.fillRoundedRect(x, y, w, h, r);
  line(g, c[1], lw);
  g.strokeRoundedRect(x, y, w, h, r);
};

/** ふとい 線(こい色の したじき+ほんたい色の うわぬり)で 道すじを 2どがき する */
const stroke2 = (g: G, c: [number, number], w: number, trace: () => void): void => {
  line(g, c[1], w + 3);
  trace();
  line(g, c[0], w);
  trace();
};

/** てんを (cx,cy) のまわりに deg どだけ まわす */
const turn = (pts: readonly Pt[], deg: number, cx = 32, cy = 32): Pt[] => {
  const r = (deg * Math.PI) / 180;
  const co = Math.cos(r);
  const si = Math.sin(r);
  return pts.map(([x, y]) => [cx + (x - cx) * co - (y - cy) * si, cy + (x - cx) * si + (y - cy) * co] as Pt);
};

/** ほしの とがり(ro=そとがわ半径, ri=うちがわ半径) */
const starPts = (cx: number, cy: number, ro: number, ri: number): Pt[] => {
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const r = i % 2 === 0 ? ro : ri;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
};

/** じゅうじ(+)の 12かくけい。deg=45 で ×に なる */
const crossPts = (cx: number, cy: number, len: number, t: number, deg: number): Pt[] =>
  turn(
    [
      [cx - t, cy - len],
      [cx + t, cy - len],
      [cx + t, cy - t],
      [cx + len, cy - t],
      [cx + len, cy + t],
      [cx + t, cy + t],
      [cx + t, cy + len],
      [cx - t, cy + len],
      [cx - t, cy + t],
      [cx - len, cy + t],
      [cx - len, cy - t],
      [cx - t, cy - t],
    ],
    deg,
    cx,
    cy,
  );

/** みぎむきの やじるし(太い みじかい 矢)。turn で 4ほうこうに つかう */
const ARROW: readonly Pt[] = [
  [9, 25],
  [30, 25],
  [30, 11],
  [57, 32],
  [30, 53],
  [30, 39],
  [9, 39],
];

/** かぎの ほんたい(lock / unlock で つかう) */
const lockBody = (g: G, c: [number, number]): void => {
  box(g, 12, 28, 40, 30, 8, c);
  fill(g, c[1]);
  g.fillCircle(32, 40, 5);
  g.fillTriangle(28.6, 41, 35.4, 41, 32, 52);
};

/** スピーカー(sound-on / sound-off で つかう) */
const speaker = (g: G, c: [number, number], dx = 0): void => {
  poly(g, [
    [8 + dx, 25],
    [21 + dx, 25],
    [35 + dx, 11],
    [35 + dx, 53],
    [21 + dx, 39],
    [8 + dx, 39],
  ], c);
};

export const UI_ICONS: Record<string, IconDraw> = {
  /** ★(できばえの ほし。ついた ぶん) */
  star: (g, c) => {
    poly(g, starPts(32, 33, 26, 11), c);
    shine(g, 26, 22, 4, 2.6);
  },

  /** ☆(まだ ついていない ほし。star と ならべて ★★☆ に する) */
  'star-empty': (g, c) => {
    poly(g, starPts(32, 33, 26, 11), [EMPTY, c[1]]);
  },

  /** →(つぎへ すすむ) */
  'arrow-right': (g, c) => {
    poly(g, ARROW, c);
  },

  /** ←(まえに もどる) */
  'arrow-left': (g, c) => {
    poly(g, turn(ARROW, 180), c);
  },

  /** ↑(うえへ・ランクアップ) */
  'arrow-up': (g, c) => {
    poly(g, turn(ARROW, -90), c);
  },

  /** ↓(したへ・ダウンロード) */
  'arrow-down': (g, c) => {
    poly(g, turn(ARROW, 90), c);
  },

  /** ✓(せいかい・できた) */
  check: (g, c) => {
    poly(g, [
      [8, 33],
      [17, 24],
      [26, 34],
      [46, 12],
      [56, 21],
      [27, 52],
    ], c);
  },

  /** ✕(ちがう・とじる) */
  cross: (g, c) => {
    poly(g, crossPts(32, 32, 21, 7.5, 45), c);
  },

  /** ?(まだ わからない・ひみつ) */
  question: (g, c) => {
    stroke2(g, c, 8, () => {
      g.beginPath();
      g.arc(32, 21, 12, Math.PI, Math.PI * 2.35, false);
      g.strokePath();
      g.beginPath();
      g.moveTo(37.5, 31.7);
      g.lineTo(32, 41);
      g.strokePath();
    });
    fill(g, c[1]);
    g.fillCircle(32, 53, 6.5);
    fill(g, c[0]);
    g.fillCircle(32, 53, 4);
  },

  /** かぎが かかっている(まだ ひらけない) */
  lock: (g, c) => {
    stroke2(g, [METAL, METAL_D], 6, () => {
      g.beginPath();
      g.arc(32, 26, 11, Math.PI, Math.PI * 2, false);
      g.strokePath();
    });
    lockBody(g, c);
  },

  /** かぎが ひらいた(あそべる ように なった) */
  unlock: (g, c) => {
    stroke2(g, [METAL, METAL_D], 6, () => {
      g.beginPath();
      g.arc(34, 25, 11, Math.PI, Math.PI * 1.7, false);
      g.strokePath();
    });
    lockBody(g, c);
  },

  /** しょるい(きろく・レシピの かみ) */
  doc: (g, c) => {
    poly(g, [
      [13, 5],
      [40, 5],
      [51, 16],
      [51, 57],
      [13, 57],
    ], [PAPER, c[1]]);
    poly(g, [
      [40, 5],
      [51, 16],
      [40, 16],
    ], [PAPER_D, c[1]], 1.8);
    fill(g, c[0]);
    g.fillRoundedRect(20, 25, 24, 5, 2.5);
    g.fillRoundedRect(20, 36, 24, 5, 2.5);
    g.fillRoundedRect(20, 47, 15, 5, 2.5);
  },

  /** ごみばこ(けす・すてる) */
  trash: (g, c) => {
    box(g, 25, 4, 14, 8, 3, c, 2);
    box(g, 8, 12, 48, 10, 4, c);
    poly(g, [
      [14, 22],
      [50, 22],
      [46, 58],
      [18, 58],
    ], c);
    line(g, c[1], 2.4);
    for (const x of [26, 38]) {
      g.beginPath();
      g.moveTo(x, 29);
      g.lineTo(x, 51);
      g.strokePath();
    }
  },

  /** はぐるま(せってい) */
  gear: (g, c) => {
    const pts: Pt[] = [];
    const d = (Math.PI * 2) / 6;
    for (let i = 0; i < 6; i++) {
      const a = i * d;
      for (const [k, r] of [[-0.2, 28], [0.2, 28], [0.28, 19], [0.72, 19]] as const) {
        pts.push([32 + Math.cos(a + k * d) * r, 32 + Math.sin(a + k * d) * r]);
      }
    }
    poly(g, pts, c);
    fill(g, PAPER);
    g.fillCircle(32, 32, 8);
    line(g, c[1], 2.6);
    g.strokeCircle(32, 32, 8);
  },

  /** おとが なる(スピーカー+おとの なみ) */
  'sound-on': (g, c) => {
    speaker(g, c);
    line(g, c[1], 3.8);
    for (const r of [10, 18]) {
      g.beginPath();
      g.arc(37, 32, r, Math.PI * -0.32, Math.PI * 0.32, false);
      g.strokePath();
    }
  },

  /** おとを けす(スピーカー+×) */
  'sound-off': (g, c) => {
    speaker(g, c, -6);
    poly(g, crossPts(48, 32, 12, 4.4, 45), [c[1], c[1]], 1.6);
  },

  /** ひらいた 本(ずかん) */
  book: (g, c) => {
    poly(g, [
      [3, 12],
      [32, 19],
      [32, 57],
      [3, 50],
    ], c);
    poly(g, [
      [61, 12],
      [32, 19],
      [32, 57],
      [61, 50],
    ], c);
    poly(g, [
      [8, 18],
      [28, 23],
      [28, 51],
      [8, 46],
    ], [PAPER, PAPER_D], 1.8);
    poly(g, [
      [56, 18],
      [36, 23],
      [36, 51],
      [56, 46],
    ], [PAPER, PAPER_D], 1.8);
    line(g, PAPER_D, 1.8);
    for (const dy of [0, 8]) {
      g.beginPath();
      g.moveTo(11, 30 + dy);
      g.lineTo(26, 34 + dy);
      g.moveTo(53, 30 + dy);
      g.lineTo(38, 34 + dy);
      g.strokePath();
    }
    box(g, 29.5, 17, 5, 40, 2, [c[1], c[1]], 1.6);
  },

  /** リュック(もちもの) */
  bag: (g, c) => {
    line(g, c[1], 7);
    g.beginPath();
    g.arc(32, 21, 11, Math.PI * 1.06, Math.PI * 1.94, false);
    g.strokePath();
    box(g, 10, 20, 44, 38, 12, c);
    fill(g, c[1]);
    g.fillRoundedRect(10, 20, 44, 16, 11);
    g.fillRect(10, 30, 44, 6);
    line(g, c[1], 2.6);
    g.strokeRoundedRect(10, 20, 44, 38, 12);
    box(g, 27, 31, 11, 10, 3, [GOLD, GOLD_D], 2);
    line(g, c[1], 2.4);
    g.strokeRoundedRect(18, 43, 28, 14, 5);
  },

  /** メダル(ごほうび) */
  medal: (g, c) => {
    poly(g, [
      [18, 3],
      [29, 3],
      [33, 24],
      [22, 26],
    ], c, 2);
    poly(g, [
      [35, 3],
      [46, 3],
      [42, 26],
      [31, 24],
    ], [c[1], c[1]], 1.6);
    fill(g, GOLD);
    g.fillCircle(32, 42, 17);
    line(g, GOLD_D, 2.6);
    g.strokeCircle(32, 42, 17);
    poly(g, starPts(32, 42, 10, 4.4), [0xfff0b8, GOLD_D], 1.8);
  },

  /** かんむり(いちばんの ごほうび) */
  crown: (g, c) => {
    poly(g, [
      [8, 44],
      [8, 16],
      [20, 30],
      [32, 9],
      [44, 30],
      [56, 16],
      [56, 44],
    ], c);
    box(g, 6, 42, 52, 15, 5, c);
    fill(g, GOLD);
    for (const [x, y] of [[8, 15], [32, 9], [56, 15]] as const) {
      g.fillCircle(x, y, 4);
      line(g, GOLD_D, 1.8);
      g.strokeCircle(x, y, 4);
    }
    fill(g, RUBY);
    g.fillCircle(32, 49.5, 4.5);
    fill(g, PAPER);
    g.fillCircle(18, 49.5, 3.5);
    g.fillCircle(46, 49.5, 3.5);
  },

  /** トロフィー(ゆうしょうカップ) */
  trophy: (g, c) => {
    stroke2(g, c, 4.5, () => {
      g.beginPath();
      g.arc(17, 24, 9, Math.PI * 0.45, Math.PI * 1.55, false);
      g.strokePath();
      g.beginPath();
      g.arc(47, 24, 9, Math.PI * 1.45, Math.PI * 2.45, false);
      g.strokePath();
    });
    poly(g, [
      [16, 8],
      [48, 8],
      [45, 30],
      [40, 38],
      [24, 38],
      [19, 30],
    ], c);
    shine(g, 24, 16, 3.4, 6);
    box(g, 27, 37, 10, 9, 2, c, 2);
    box(g, 20, 45, 24, 7, 2.5, c, 2);
    box(g, 14, 51, 36, 9, 4, c);
  },

  /** まるい 的(ねらい・もくひょう) */
  target: (g, c) => {
    fill(g, c[0]);
    g.fillCircle(32, 32, 27);
    line(g, c[1], 2.8);
    g.strokeCircle(32, 32, 27);
    fill(g, PAPER);
    g.fillCircle(32, 32, 19);
    line(g, c[1], 2.4);
    g.strokeCircle(32, 32, 19);
    fill(g, c[0]);
    g.fillCircle(32, 32, 11);
    line(g, c[1], 2.4);
    g.strokeCircle(32, 32, 11);
    fill(g, c[1]);
    g.fillCircle(32, 32, 4.5);
  },

  /** おんぷ(おと・BGM) */
  note: (g, c) => {
    box(g, 32, 10, 6, 37, 3, c, 2.2);
    poly(g, [
      [38, 10],
      [53, 17],
      [53, 28],
      [38, 21],
    ], c, 2.2);
    fill(g, c[0]);
    g.fillEllipse(24, 45, 26, 19);
    line(g, c[1], 2.6);
    g.strokeEllipse(24, 45, 26, 19);
    shine(g, 18, 41, 4, 2.4);
  },

  /** でんきゅう(ひらめき・ヒント) */
  bulb: (g, c) => {
    line(g, c[1], 4.2);
    for (const a of [-1, -0.78, -0.5, -0.22, 0] as const) {
      const r = a * Math.PI;
      g.beginPath();
      g.moveTo(32 + Math.cos(r) * 19.5, 26 + Math.sin(r) * 19.5);
      g.lineTo(32 + Math.cos(r) * 28, 26 + Math.sin(r) * 28);
      g.strokePath();
    }
    fill(g, c[0]);
    g.fillCircle(32, 26, 16);
    g.fillRect(24, 34, 16, 10);
    line(g, c[1], 2.6);
    g.strokeCircle(32, 26, 16);
    shine(g, 26, 20, 4, 6);
    box(g, 23, 42, 18, 8, 2, [METAL, METAL_D], 2.2);
    box(g, 25, 49, 14, 8, 3, [METAL, METAL_D], 2.2);
  },

  /** はた(もくひょう・ゴール) */
  flag: (g, c) => {
    box(g, 11, 8, 6, 50, 3, [WOOD, WOOD_D], 2.2);
    poly(g, [
      [16, 10],
      [55, 21],
      [16, 32],
    ], c);
    fill(g, GOLD);
    g.fillCircle(14, 7, 4.5);
    line(g, GOLD_D, 1.8);
    g.strokeCircle(14, 7, 4.5);
  },

  /** +(ふやす・くわえる) */
  plus: (g, c) => {
    poly(g, crossPts(32, 32, 23, 8, 0), c);
  },

  /** −(へらす) */
  minus: (g, c) => {
    box(g, 9, 24, 46, 16, 7, c);
  },

  /** ハート(すき・げんき) */
  heart: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.arc(22, 26, 13, Math.PI * 0.8, Math.PI * 1.9, false);
    g.arc(42, 26, 13, Math.PI * 1.1, Math.PI * 0.2, false);
    g.lineTo(32, 56);
    g.closePath();
    g.fillPath();
    line(g, c[1], 2.8);
    g.strokePath();
    shine(g, 22, 22, 4, 3);
  },

  /** ピン(ちずの ばしょ) */
  pin: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.arc(32, 24, 15, Math.PI * 0.28, Math.PI * 0.72, true);
    g.lineTo(32, 58);
    g.closePath();
    g.fillPath();
    line(g, c[1], 2.8);
    g.strokePath();
    fill(g, PAPER);
    g.fillCircle(32, 23, 6);
    line(g, c[1], 2.4);
    g.strokeCircle(32, 23, 6);
  },
};

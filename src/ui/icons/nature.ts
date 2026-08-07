/* しぜん・けしきの かたち(そら・うみ・やま・はな・ゆき・ひ)。
   64x64 の ローカル座標で 描く。いろは c=[ほんたい, こい色] で わたされる。
   ここに あたらしい かたちを 足すときは、この Record に 1つ 関数を 足すだけでよい。 */
import { fill, line, shine, type G, type IconDraw } from './kit';

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

/** ふちどり つきの ふとい すじ(なみ・かぜ・ゆげ に つかう) */
const band = (g: G, pts: readonly [number, number][], c: [number, number], w = 4.5): void => {
  const trace = (): void => {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
    g.strokePath();
  };
  line(g, c[1], w + 2.4);
  trace();
  line(g, c[0], w);
  trace();
};

/** 4つの とがりの きらり */
const twinkle = (g: G, x: number, y: number, r: number, c: [number, number]): void => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.3;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  poly(g, pts, c, r > 12 ? 2.2 : 1.6);
};

/** 5つの とがりの ほし */
const star5 = (g: G, x: number, y: number, r: number, c: [number, number]): void => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  poly(g, pts, c, r > 12 ? 2.4 : 1.6);
};

/** みずの しずく(はねた みず に つかう) */
const drop = (g: G, x: number, y: number, r: number, c: [number, number]): void => {
  line(g, c[1], 2.2);
  g.strokeCircle(x, y, r);
  g.strokeTriangle(x - r * 0.9, y - r * 0.4, x + r * 0.9, y - r * 0.4, x, y - r * 2.7);
  fill(g, c[0]);
  g.fillCircle(x, y, r);
  g.fillTriangle(x - r * 0.95, y - r * 0.45, x + r * 0.95, y - r * 0.45, x, y - r * 2.6);
};

/** ぐもの もこもこ(cloud / cloud-dark で つかう)。ふちを 先に 太く ひいて 上から ぬる */
const cloudBody = (g: G, y: number, body: number, edge: number): void => {
  const lumps: [number, number, number][] = [
    [21, y + 2, 12],
    [33, y - 4, 15],
    [46, y + 3, 11],
    [16, y + 13, 8.5],
    [34, y + 14, 10],
    [49, y + 12, 7.5],
  ];
  line(g, edge, 5.4);
  for (const [x, cy, r] of lumps) g.strokeCircle(x, cy, r);
  g.strokeRoundedRect(9, y + 2, 46, 15, 7.5);
  fill(g, body);
  for (const [x, cy, r] of lumps) g.fillCircle(x, cy, r);
  g.fillRoundedRect(9, y + 2, 46, 15, 7.5);
};

export const NATURE_ICONS: Record<string, IconDraw> = {
  /** ほのお(かまど・やきもの・はなび の たね火) */
  fire: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(32, 8);
    g.lineTo(46, 30);
    g.lineTo(40, 52);
    g.lineTo(24, 52);
    g.lineTo(18, 30);
    g.closePath();
    g.fillPath();
    fill(g, 0xf5d84e);
    g.fillEllipse(32, 40, 16, 22);
    line(g, c[1], 1.8);
    g.beginPath();
    g.moveTo(32, 8);
    g.lineTo(46, 30);
    g.lineTo(40, 52);
    g.lineTo(24, 52);
    g.lineTo(18, 30);
    g.closePath();
    g.strokePath();
  },

  /** ふる ゆき(ゆきの ひ・つもった ゆき) */
  snow: (g, c) => {
    const flake = (x: number, y: number, r: number): void => {
      for (const [w, col] of [
        [4.2, c[1]],
        [2.0, c[0]],
      ] as const) {
        line(g, col, w);
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI;
          g.beginPath();
          g.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
          g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
          g.strokePath();
        }
      }
    };
    flake(21, 18, 12);
    flake(45, 32, 14);
    flake(24, 46, 9);
  },

  /** おひさま(はれの ひ・あさ) */
  sun: (g, c) => {
    line(g, c[1], 5);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 16;
      g.beginPath();
      g.moveTo(32 + Math.cos(a) * 19, 32 + Math.sin(a) * 19);
      g.lineTo(32 + Math.cos(a) * 30, 32 + Math.sin(a) * 30);
      g.strokePath();
    }
    fill(g, c[0]);
    g.fillCircle(32, 32, 17);
    line(g, c[1], 2.6);
    g.strokeCircle(32, 32, 17);
    shine(g, 25, 25, 5, 4);
  },

  /** くも(そらの もよう・もやもやぐも) */
  cloud: (g, c) => {
    cloudBody(g, 30, c[0], c[1]);
    shine(g, 26, 24, 6, 4);
  },

  /** こい もやもやぐも(じゃまを する わるい くも) */
  'cloud-dark': (g, c) => {
    const edge = 0x2c2c33;
    const jag = [15, 25, 35, 45, 53];
    line(g, edge, 5);
    for (const x of jag) g.strokeTriangle(x - 6, 44, x + 6, 44, x, 58);
    cloudBody(g, 26, c[1], edge);
    fill(g, c[1]);
    for (const x of jag) g.fillTriangle(x - 6, 43, x + 6, 43, x, 57);
    fill(g, 0xfaf6ec);
    g.fillEllipse(26, 28, 11, 9);
    g.fillEllipse(40, 28, 11, 9);
    fill(g, edge);
    g.fillCircle(27, 29, 3.2);
    g.fillCircle(39, 29, 3.2);
    line(g, edge, 3.2);
    g.beginPath();
    g.moveTo(18, 19);
    g.lineTo(31, 25);
    g.strokePath();
    g.beginPath();
    g.moveTo(48, 19);
    g.lineTo(35, 25);
    g.strokePath();
  },

  /** うみの なみ(3すじの 波がしら) */
  wave: (g, c) => {
    for (let r = 0; r < 3; r++) {
      const y = 18 + r * 15;
      const pts: [number, number][] = [];
      for (let i = 0; i <= 12; i++) pts.push([6 + i * 4.3, y + Math.sin((i / 12) * Math.PI * 2) * 6]);
      band(g, pts, c, 4.5);
    }
    fill(g, 0xfaf6ec);
    for (const [x, y] of [
      [16, 12],
      [31, 27],
      [46, 42],
    ] as const)
      g.fillCircle(x, y, 2.4);
  },

  /** かぜ(うずまきと ながれる すじ) */
  wind: (g, c) => {
    const spiral: [number, number][] = [];
    for (let i = 0; i <= 36; i++) {
      const t = i / 36;
      const a = Math.PI * 0.4 + t * Math.PI * 3.2;
      const r = 3 + t * 17;
      spiral.push([25 + Math.cos(a) * r, 34 + Math.sin(a) * r]);
    }
    band(g, spiral, c, 4);
    band(g, [[30, 12], [44, 14], [58, 10]], c, 3.4);
    band(g, [[30, 55], [45, 53], [59, 58]], c, 3.4);
  },

  /** きらきら(できばえ・ごほうびの えんしゅつ) */
  sparkle: (g, c) => {
    twinkle(g, 26, 27, 20, c);
    twinkle(g, 48, 46, 11, c);
    twinkle(g, 50, 15, 8, c);
  },

  /** ゆきだるま(ゆきの おまつり・ふゆの けしき) */
  snowman: (g, c) => {
    line(g, 0x8a6a4a, 2.8);
    g.beginPath();
    g.moveTo(19, 42);
    g.lineTo(7, 33);
    g.strokePath();
    g.beginPath();
    g.moveTo(45, 42);
    g.lineTo(57, 33);
    g.strokePath();
    line(g, 0xbfb6a2, 2.4);
    g.strokeCircle(32, 45, 15);
    g.strokeCircle(32, 22, 11);
    fill(g, 0xfaf6ec);
    g.fillCircle(32, 45, 15);
    g.fillCircle(32, 22, 11);
    fill(g, 0x2c2c33);
    g.fillCircle(28, 20, 2.2);
    g.fillCircle(36, 20, 2.2);
    g.fillCircle(32, 46, 2.2);
    g.fillCircle(32, 54, 2.2);
    fill(g, 0xf0913c);
    g.fillTriangle(31, 23, 31, 27, 41, 26);
    fill(g, c[0]);
    g.fillRoundedRect(20, 30, 24, 7, 3);
    g.fillRoundedRect(37, 34, 7, 14, 3);
    line(g, c[1], 2);
    g.strokeRoundedRect(20, 30, 24, 7, 3);
    g.strokeRoundedRect(37, 34, 7, 14, 3);
  },

  /** ゆきの けっしょう(ゆき・さむさの しるし) */
  snowflake: (g, c) => {
    const segs: [number, number, number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const [dx, dy] = [Math.cos(a), Math.sin(a)];
      segs.push([32, 32, 32 + dx * 26, 32 + dy * 26]);
      for (const s of [-1, 1]) {
        const b = a + s * 0.9;
        segs.push([32 + dx * 15, 32 + dy * 15, 32 + dx * 15 + Math.cos(b) * 9, 32 + dy * 15 + Math.sin(b) * 9]);
      }
    }
    for (const [w, col] of [
      [5.6, c[1]],
      [3, c[0]],
    ] as const) {
      line(g, col, w);
      for (const [x1, y1, x2, y2] of segs) {
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.strokePath();
      }
    }
    fill(g, c[0]);
    g.fillCircle(32, 32, 5);
    line(g, c[1], 2);
    g.strokeCircle(32, 32, 5);
  },

  /** やま(ゆきがしらの ふじさん風。けしき・りっち) */
  mountain: (g, c) => {
    poly(g, [[32, 8], [41, 24], [52, 43], [58, 55], [6, 55], [12, 43], [23, 24]], c, 2.6);
    poly(
      g,
      [[32, 8], [41, 25], [37, 23], [34, 29], [30, 24], [27, 30], [23, 25]],
      [0xfaf6ec, 0xcfc7b4],
      2,
    );
  },

  /** けむりを 上げる やま(さくらじま・かざん) */
  volcano: (g, c) => {
    const puffs = [
      [32, 17, 8],
      [24, 11, 6],
      [34, 7, 6.5],
      [44, 9, 5],
    ] as const;
    line(g, 0x6c7278, 2.4);
    for (const [x, y, r] of puffs) g.strokeCircle(x, y, r);
    fill(g, 0x9aa0a6);
    for (const [x, y, r] of puffs) g.fillCircle(x, y, r);
    poly(g, [[23, 22], [41, 22], [58, 56], [6, 56]], c, 2.6);
    poly(g, [[28, 22], [36, 22], [35, 34], [32, 46], [28, 33]], [0xe0584f, 0xa83a33], 1.8);
    fill(g, 0xe0584f);
    g.fillEllipse(32, 22, 20, 7);
    fill(g, 0xf2b544);
    g.fillEllipse(32, 22, 11, 4);
  },

  /** もり(すぎの き 3本。しんりん・きこり) */
  forest: (g, c) => {
    const tree = (x: number, base: number, s: number): void => {
      fill(g, 0x8a6a4a);
      g.fillRect(x - 2.5, base - 5, 5, 10);
      for (let i = 2; i >= 0; i--) {
        const w = s * (1 - i * 0.2);
        const ty = base - 4 - i * s * 0.52;
        fill(g, c[0]);
        g.fillTriangle(x, ty - s * 0.85, x - w / 2, ty, x + w / 2, ty);
        line(g, c[1], 1.8);
        g.strokeTriangle(x, ty - s * 0.85, x - w / 2, ty, x + w / 2, ty);
      }
    };
    tree(32, 50, 20);
    tree(14, 58, 16);
    tree(50, 58, 16);
  },

  /** やしのき(おきなわ・あたたかい みなみの しま) */
  palm: (g, c) => {
    // みき(すこし そった ぼう)
    line(g, 0x63492f, 8);
    g.beginPath();
    g.moveTo(30, 58);
    g.lineTo(34, 40);
    g.lineTo(31, 26);
    g.strokePath();
    line(g, 0x8a6a4a, 5);
    g.beginPath();
    g.moveTo(30, 58);
    g.lineTo(34, 40);
    g.lineTo(31, 26);
    g.strokePath();
    // はっぱ(6まい ほうしゃじょう)
    for (let i = 0; i < 6; i++) {
      const a = Math.PI + (i / 5) * Math.PI;
      const ex = 31 + Math.cos(a) * 25;
      const ey = 26 + Math.sin(a) * 17;
      poly(g, [
        [31, 26],
        [(31 + ex) / 2, (26 + ey) / 2 - 7],
        [ex, ey],
        [(31 + ex) / 2, (26 + ey) / 2 + 5],
      ], c, 1.8);
    }
    fill(g, 0x9a6b42);
    g.fillCircle(35, 29, 4);
  },

  /** さくら(はなみ・はる) */
  sakura: (g, c) => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.save();
      g.translateCanvas(32, 34);
      g.rotateCanvas(a);
      poly(g, [[0, -2], [-9, -11], [-5, -25], [0, -19], [5, -25], [9, -11]], c, 2);
      g.restore();
    }
    fill(g, 0xf5d84e);
    g.fillCircle(32, 34, 5.5);
    line(g, 0xc2a52c, 1.8);
    g.strokeCircle(32, 34, 5.5);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * Math.PI * 2 + 0.3;
      g.beginPath();
      g.moveTo(32 + Math.cos(a) * 5, 34 + Math.sin(a) * 5);
      g.lineTo(32 + Math.cos(a) * 10, 34 + Math.sin(a) * 10);
      g.strokePath();
    }
  },

  /** ハイビスカス(おきなわ・あたたかい みなみの はな) */
  hibiscus: (g, c) => {
    const angles = [0, 1, 2, 3, 4].map((i) => (i / 5) * Math.PI * 2 + 0.35);
    for (const pass of [0, 1, 2]) {
      if (pass === 0) line(g, c[1], 5);
      else if (pass === 1) fill(g, c[0]);
      else line(g, c[1], 1.8);
      for (const a of angles) {
        g.save();
        g.translateCanvas(29, 37);
        g.rotateCanvas(a);
        if (pass === 1) g.fillEllipse(0, -14, 24, 26);
        else if (pass === 0) g.strokeEllipse(0, -14, 24, 26);
        else {
          g.beginPath();
          g.moveTo(0, -6);
          g.lineTo(0, -25);
          g.strokePath();
        }
        g.restore();
      }
    }
    fill(g, c[1]);
    g.fillCircle(29, 37, 6);
    line(g, 0xf5d84e, 3);
    g.beginPath();
    g.moveTo(29, 37);
    g.lineTo(52, 13);
    g.strokePath();
    fill(g, 0xf5d84e);
    g.fillCircle(52, 12, 4.5);
    line(g, 0xc2a52c, 1.6);
    g.strokeCircle(52, 12, 4.5);
  },

  /** チューリップ(はなだん・はなの さいばい) */
  tulip: (g, c) => {
    line(g, 0x4b7c30, 4);
    g.beginPath();
    g.moveTo(32, 30);
    g.lineTo(32, 58);
    g.strokePath();
    for (const s of [-1, 1]) {
      poly(
        g,
        [[32, 48], [32 + 19 * s, 35], [32 + 21 * s, 49], [32 + 2 * s, 55]],
        [0x6fb04a, 0x4b7c30],
        1.8,
      );
    }
    poly(
      g,
      [[16, 27], [20, 9], [26, 22], [32, 6], [38, 22], [44, 9], [48, 27], [43, 35], [32, 39], [21, 35]],
      c,
      2.4,
    );
  },

  /** はっぱ(みどり・しょくぶつ・おちゃ) */
  leaf: (g, c) => {
    const [ax, ay, bx, by] = [11, 52, 53, 13];
    const [px, py] = [0.68, 0.73];
    const pts: [number, number][] = [];
    for (const s of [-1, 1]) {
      for (let i = 0; i <= 8; i++) {
        const t = s < 0 ? i / 8 : (8 - i) / 8;
        const bulge = Math.sin(t * Math.PI) * 13;
        pts.push([ax + (bx - ax) * t + px * bulge * s, ay + (by - ay) * t + py * bulge * s]);
      }
    }
    poly(g, pts, c, 2.4);
    line(g, c[1], 2);
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(bx, by);
    g.strokePath();
    line(g, c[1], 1.4);
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      const [x, y] = [ax + (bx - ax) * t, ay + (by - ay) * t];
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x - px * 9, y - py * 9);
      g.strokePath();
    }
  },

  /** クローバー(まきば・くさち・しあわせ) */
  clover: (g, c) => {
    for (let i = 0; i < 3; i++) {
      g.save();
      g.translateCanvas(32, 33);
      g.rotateCanvas((i / 3) * Math.PI * 2);
      line(g, c[1], 2.4);
      g.strokeCircle(-7, -19, 8.5);
      g.strokeCircle(7, -19, 8.5);
      g.strokeTriangle(-14, -15, 14, -15, 0, -2);
      fill(g, c[0]);
      g.fillCircle(-7, -19, 8.5);
      g.fillCircle(7, -19, 8.5);
      g.fillTriangle(-14.5, -16, 14.5, -16, 0, -1);
      g.restore();
    }
    line(g, 0x4b7c30, 3.2);
    g.beginPath();
    g.moveTo(33, 36);
    g.lineTo(36, 60);
    g.strokePath();
  },

  /** おんせん(お湯の うつわと ゆげ 3本) */
  hotspring: (g, c) => {
    for (const x0 of [19, 32, 45]) {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        pts.push([x0 + Math.sin(t * Math.PI * 1.7) * 5, 36 - t * 28]);
      }
      band(g, pts, c, 3.4);
    }
    poly(g, [[8, 41], [56, 41], [49, 59], [15, 59]], [0x9a6b42, 0x6d492b], 2.4);
    fill(g, 0x76c4e8);
    g.fillEllipse(32, 43, 42, 8);
    line(g, 0x4a94b8, 1.8);
    g.strokeEllipse(32, 43, 42, 8);
  },

  /** はねた みず(みずやり・しぶき) */
  splash: (g, c) => {
    drop(g, 32, 27, 7, c);
    drop(g, 15, 33, 5, c);
    drop(g, 49, 31, 5.5, c);
    fill(g, c[0]);
    g.fillEllipse(32, 51, 46, 15);
    line(g, c[1], 2.4);
    g.strokeEllipse(32, 51, 46, 15);
    shine(g, 23, 47, 6, 3);
  },

  /** つき(よる・ねむる じかん) */
  moon: (g, c) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 16; i++) {
      const a = ((62.9 + (297.1 - 62.9) * (i / 16)) * Math.PI) / 180;
      pts.push([30 + Math.cos(a) * 22, 33 + Math.sin(a) * 22]);
    }
    for (let i = 0; i <= 16; i++) {
      const a = ((258.5 - (258.5 - 101.5) * (i / 16)) * Math.PI) / 180;
      pts.push([44 + Math.cos(a) * 20, 33 + Math.sin(a) * 20]);
    }
    poly(g, pts, c, 2.6);
    twinkle(g, 51, 15, 7, c);
    twinkle(g, 50, 48, 5, c);
  },

  /** よぞらの ほし(よるの けしき・ほしまつり) */
  'star-night': (g, c) => {
    star5(g, 27, 27, 18, c);
    star5(g, 49, 16, 8, c);
    star5(g, 47, 45, 10, c);
    star5(g, 15, 50, 6, c);
  },

  /** はたけの うね(たがやす・そざいを そだてる) */
  field: (g, c) => {
    fill(g, 0x9a6b42);
    g.fillRoundedRect(4, 20, 56, 40, 6);
    line(g, 0x6d492b, 2.4);
    g.strokeRoundedRect(4, 20, 56, 40, 6);
    for (let i = 0; i < 3; i++) {
      const y = 30 + i * 12;
      fill(g, 0xd8b483);
      g.fillRoundedRect(8, y, 48, 7, 3.5);
      line(g, 0x6d492b, 1.8);
      g.strokeRoundedRect(8, y, 48, 7, 3.5);
      fill(g, c[0]);
      for (const x of [17, 31, 45]) {
        g.fillTriangle(x - 4, y + 2, x + 4, y + 2, x, y - 8);
        line(g, c[1], 1.4);
        g.strokeTriangle(x - 4, y + 2, x + 4, y + 2, x, y - 8);
        fill(g, c[0]);
      }
    }
  },

  /** いわ(てついし・こうぶつを ほる) */
  rock: (g, c) => {
    poly(g, [[9, 44], [16, 26], [30, 15], [46, 20], [56, 38], [50, 55], [19, 56]], c, 2.6);
    line(g, c[1], 2);
    g.beginPath();
    g.moveTo(30, 15);
    g.lineTo(34, 34);
    g.lineTo(56, 38);
    g.strokePath();
    g.beginPath();
    g.moveTo(34, 34);
    g.lineTo(25, 55);
    g.strokePath();
    fill(g, c[1]);
    for (const [x, y, r] of [
      [20, 40, 2.6],
      [26, 30, 2],
      [44, 44, 2.4],
    ] as const)
      g.fillCircle(x, y, r);
    shine(g, 23, 25, 5, 3);
  },

  /** すいしょう(たからもの・ほうせき) */
  gem: (g, c) => {
    poly(g, [[32, 6], [52, 25], [44, 55], [20, 55], [12, 25]], c, 2.6);
    g.fillStyle(0xffffff, 0.26);
    g.fillTriangle(32, 6, 12, 25, 26, 32);
    g.fillTriangle(12, 25, 26, 32, 20, 55);
    line(g, c[1], 2);
    for (const [x1, y1, x2, y2] of [
      [32, 6, 26, 32],
      [26, 32, 20, 55],
      [26, 32, 52, 25],
      [26, 32, 44, 55],
    ] as const) {
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.strokePath();
    }
    twinkle(g, 41, 19, 7, [0xfaf6ec, 0xffffff]);
  },

  /** まるた・ほだぎ(きのこ さいばい・きを きる) */
  log: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(9, 22, 46, 22, 7);
    line(g, c[1], 2.4);
    g.strokeRoundedRect(9, 22, 46, 22, 7);
    line(g, c[1], 1.6);
    for (const y of [28, 34, 40]) {
      g.beginPath();
      g.moveTo(14, y);
      g.lineTo(38, y + 1);
      g.strokePath();
    }
    fill(g, 0xd8b483);
    g.fillEllipse(50, 33, 17, 24);
    line(g, c[1], 2.2);
    g.strokeEllipse(50, 33, 17, 24);
    line(g, 0xa8865a, 1.8);
    g.strokeEllipse(50, 33, 10, 14);
    g.strokeEllipse(50, 33, 4, 6);
  },

  /** なだらかな おか(のはら・けしき) */
  hill: (g, c) => {
    const mound = (cx: number, cy: number, rx: number, ry: number, col: [number, number]): void => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 14; i++) {
        const a = Math.PI + (i / 14) * Math.PI;
        pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
      }
      pts.push([cx + rx, 60], [cx - rx, 60]);
      poly(g, pts, col, 2.4);
    };
    mound(43, 50, 18, 20, [c[1], c[1]]);
    fill(g, c[1]);
    g.fillRoundedRect(3, 50, 58, 10, 4);
    mound(24, 54, 22, 18, c);
    line(g, c[1], 2);
    for (const [x, y] of [
      [14, 46],
      [30, 40],
      [24, 50],
    ] as const) {
      for (const dx of [-3, 0, 3]) {
        g.beginPath();
        g.moveTo(x, y + 3);
        g.lineTo(x + dx, y - 4);
        g.strokePath();
      }
    }
  },
  /** もみじの 葉 1まい(あきの しるし。季節マークの ために 用意。まだ データからは つかって いない) */
  momiji: (g, c) => {
    fill(g, c[0]);
    const pts: [number, number][] = [
      [32, 6], [38, 22], [52, 14], [46, 30], [58, 34],
      [44, 40], [50, 54], [34, 46], [32, 58], [30, 46],
      [14, 54], [20, 40], [6, 34], [18, 30], [12, 14], [26, 22],
    ];
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
    g.closePath();
    g.strokePath();
    line(g, c[1], 1.6);
    g.beginPath();
    g.moveTo(32, 52);
    g.lineTo(32, 26);
    g.strokePath();
  },
};

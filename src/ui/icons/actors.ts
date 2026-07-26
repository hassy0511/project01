/* ひと・いきものの かたち(こども・おどりて・とり・むし・けもの・マスコット)。
   64x64 の ローカル座標で 描く。いろは c=[ほんたい, こい色] で わたされる。
   ここに あたらしい かたちを 足すときは、この Record に 1つ 関数を 足すだけでよい。 */
import { fill, line, shine, type G, type IconDraw } from './kit';

/** 意味が きまっている いろ(ひとの はだ・目・しろ・き) */
const SKIN = 0xf2c9a0;
const EYE = 0x2c2c33;
const WHITE = 0xfaf6ec;
const CREAM = 0xf6e7c4;
const CREAM_D = 0xc0a878;
const WOOD = 0x8a6a4a;
const BEAK = 0xf0913c;
const BEAK_D = 0xbc6a22;
const CHEEK = 0xf28ba0;
const WATER = 0x76c4e8;

/** はだ色の あたま(ふちは こい色) */
const head = (g: G, c: [number, number], x: number, y: number, r: number): void => {
  fill(g, SKIN);
  g.fillCircle(x, y, r);
  line(g, c[1]);
  g.strokeCircle(x, y, r);
};

/** ちいさな くろい 目 2つ */
const dotEyes = (g: G, x: number, y: number, gap: number, r = 2): void => {
  fill(g, EYE);
  g.fillCircle(x - gap, y, r);
  g.fillCircle(x + gap, y, r);
};

/** まるい 目 2つ(しろ目 + くろ目) */
const bigEyes = (g: G, c: [number, number], x: number, y: number, gap: number, r: number): void => {
  fill(g, WHITE);
  g.fillCircle(x - gap, y, r);
  g.fillCircle(x + gap, y, r);
  line(g, c[1], 2);
  g.strokeCircle(x - gap, y, r);
  g.strokeCircle(x + gap, y, r);
  fill(g, EYE);
  g.fillCircle(x - gap, y, r * 0.5);
  g.fillCircle(x + gap, y, r * 0.5);
};

/** てんを つないだ かたち(ぬり + ふちどり) */
const poly = (g: G, c: [number, number], pts: readonly (readonly [number, number])[], w = 2.4): void => {
  fill(g, c[0]);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillPath();
  line(g, c[1], w);
  g.strokePath();
};

/** ふく(からだ)を まるみの ある だいけいで 描く */
const torso = (g: G, c: [number, number], cx: number, top: number, wTop: number, bottom: number, wBot: number): void => {
  fill(g, c[0]);
  g.beginPath();
  g.moveTo(cx - wTop / 2, top);
  g.lineTo(cx + wTop / 2, top);
  g.lineTo(cx + wBot / 2, bottom);
  g.lineTo(cx - wBot / 2, bottom);
  g.closePath();
  g.fillPath();
  line(g, c[1]);
  g.strokePath();
};

/** あし 2ほん(こい色) */
const legs2 = (g: G, c: [number, number], cx: number, y: number, h: number): void => {
  fill(g, c[1]);
  g.fillRoundedRect(cx - 9, y, 8, h, 4);
  g.fillRoundedRect(cx + 1, y, 8, h, 4);
};

/** ほそい あし(とりの あし) */
const birdLegs = (g: G, x: number, y: number): void => {
  line(g, BEAK_D, 2.4);
  for (const dx of [-5, 5]) {
    g.beginPath();
    g.moveTo(x + dx, y);
    g.lineTo(x + dx, y + 7);
    g.lineTo(x + dx + 4, y + 9);
    g.strokePath();
  }
};

export const ACTOR_ICONS: Record<string, IconDraw> = {
  /** おめんの かたち(おまつり・やたいの おめん) */
  mask: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 34, 40, 46);
    line(g, c[1]);
    g.strokeEllipse(32, 34, 40, 46);
    fill(g, 0x2c2c33);
    g.fillEllipse(24, 30, 8, 5);
    g.fillEllipse(40, 30, 8, 5);
    fill(g, 0xe0584f);
    g.fillEllipse(32, 46, 12, 8);
  },
  /** うま(やぶさめ・のうぎょうの うま) */
  horse: (g, c) => {
    // あし(からだの したに 先に ひく。ふちを つけて 太さを そろえる)
    for (const [w, col] of [
      [8, c[1]],
      [4.5, c[0]],
    ] as const) {
      line(g, col, w);
      for (const x of [17, 26, 38, 46]) {
        g.beginPath();
        g.moveTo(x, 42);
        g.lineTo(x, 57);
        g.strokePath();
      }
    }
    // からだ
    fill(g, c[0]);
    g.fillEllipse(30, 36, 42, 22);
    line(g, c[1]);
    g.strokeEllipse(30, 36, 42, 22);
    // くび(ななめ うしろに かたむける)
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(38, 32);
    g.lineTo(40, 18);
    g.lineTo(50, 14);
    g.lineTo(50, 32);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    // あたま(よこ向き。はなづらを 右へ ながく のばす)
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(41, 16);
    g.lineTo(49, 10);
    g.lineTo(58, 18);
    g.lineTo(56, 25);
    g.lineTo(48, 24);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    // みみ
    fill(g, c[0]);
    g.fillTriangle(44, 14, 49, 12, 44, 5);
    line(g, c[1], 1.6);
    g.strokeTriangle(44, 14, 49, 12, 44, 5);
    // たてがみ(くびの うしろ)
    fill(g, c[1]);
    g.beginPath();
    g.moveTo(40, 14);
    g.lineTo(44, 10);
    g.lineTo(41, 32);
    g.lineTo(35, 32);
    g.closePath();
    g.fillPath();
    // しっぽ
    line(g, c[1], 5);
    g.beginPath();
    g.moveTo(10, 30);
    g.lineTo(4, 42);
    g.lineTo(9, 50);
    g.strokePath();
    // め・はなさき
    fill(g, 0x2c2c33);
    g.fillCircle(51, 17, 2.2);
    fill(g, c[1]);
    g.fillEllipse(55, 21, 6, 5);
  },

  /** りゅう(ねぶた・たつの おまつり) */
  dragon: (g, c) => {
    // からだ(なめらかな くねり。ふちを 先に 太く ひいて 上から ぬる)
    const body: [number, number][] = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      body.push([8 + t * 36, 54 - t * 26 + Math.sin(t * Math.PI * 1.6) * 9]);
    }
    const trace = (): void => {
      g.beginPath();
      g.moveTo(body[0][0], body[0][1]);
      for (const [x, y] of body.slice(1)) g.lineTo(x, y);
      g.strokePath();
    };
    line(g, c[1], 14);
    trace();
    line(g, c[0], 10);
    trace();
    // せなかの とげ
    fill(g, c[1]);
    for (let i = 3; i <= 15; i += 3) {
      const [x, y] = body[i];
      g.fillTriangle(x - 4, y - 4, x + 3, y - 5, x - 1, y - 13);
    }
    // あたま
    fill(g, c[0]);
    g.fillEllipse(50, 24, 24, 19);
    line(g, c[1]);
    g.strokeEllipse(50, 24, 24, 19);
    // つの 2本
    fill(g, c[1]);
    g.fillTriangle(44, 15, 50, 17, 42, 4);
    g.fillTriangle(54, 15, 59, 18, 58, 5);
    // め(きんいろ)
    fill(g, 0xf5d84e);
    g.fillCircle(54, 21, 4);
    line(g, 0xb28f22, 1.4);
    g.strokeCircle(54, 21, 4);
    fill(g, 0x2c2c33);
    g.fillCircle(55, 21, 2);
    // ひげ
    line(g, c[1], 1.8);
    for (const dy of [0, 5]) {
      g.beginPath();
      g.moveTo(58, 28 + dy);
      g.lineTo(63, 32 + dy);
      g.strokePath();
    }
  },

  /** ふつうの ひと(むらびと・だれか) */
  person: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(13, 30, 9, 18, 4.5);
    g.fillRoundedRect(42, 30, 9, 18, 4.5);
    line(g, c[1]);
    g.strokeRoundedRect(13, 30, 9, 18, 4.5);
    g.strokeRoundedRect(42, 30, 9, 18, 4.5);
    legs2(g, c, 32, 44, 15);
    torso(g, c, 32, 28, 22, 47, 26);
    head(g, c, 32, 15, 11);
    dotEyes(g, 32, 15, 4);
    fill(g, SKIN);
    g.fillCircle(17, 50, 4);
    g.fillCircle(47, 50, 4);
    line(g, c[1], 2);
    g.strokeCircle(17, 50, 4);
    g.strokeCircle(47, 50, 4);
  },
  /** こども(あたま 大きめ・せは ひくい) */
  'person-child': (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(15, 34, 10, 16, 5);
    g.fillRoundedRect(39, 34, 10, 16, 5);
    line(g, c[1]);
    g.strokeRoundedRect(15, 34, 10, 16, 5);
    g.strokeRoundedRect(39, 34, 10, 16, 5);
    legs2(g, c, 32, 46, 11);
    torso(g, c, 32, 32, 20, 48, 24);
    fill(g, 0x6b4b32);
    g.fillEllipse(32, 10, 20, 10);
    head(g, c, 32, 19, 14);
    fill(g, 0x6b4b32);
    g.fillEllipse(32, 10, 22, 11);
    line(g, 0x4a3324, 2);
    g.strokeEllipse(32, 10, 22, 11);
    dotEyes(g, 32, 19, 5, 2.4);
    fill(g, CHEEK);
    g.fillCircle(21, 24, 3);
    g.fillCircle(43, 24, 3);
  },
  /** きものの ひと(おまつり・ぶんかの ばめん) */
  'person-kimono': (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(8, 30, 13, 18, 6);
    g.fillRoundedRect(43, 30, 13, 18, 6);
    line(g, c[1]);
    g.strokeRoundedRect(8, 30, 13, 18, 6);
    g.strokeRoundedRect(43, 30, 13, 18, 6);
    torso(g, c, 32, 27, 22, 56, 36);
    fill(g, WHITE);
    g.beginPath();
    g.moveTo(24, 27);
    g.lineTo(32, 44);
    g.lineTo(40, 27);
    g.closePath();
    g.fillPath();
    line(g, c[1], 2);
    g.strokePath();
    fill(g, c[1]);
    g.fillRect(18, 40, 28, 7);
    head(g, c, 32, 16, 10);
    fill(g, 0x3a2c22);
    g.fillEllipse(32, 10, 22, 12);
    g.fillCircle(32, 5, 4.5);
    dotEyes(g, 32, 17, 4);
  },
  /** はたらく ひと(のうか・しょくにん。はちまきと まえかけ) */
  'person-worker': (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(13, 32, 9, 18, 4.5);
    g.fillRoundedRect(42, 32, 9, 18, 4.5);
    line(g, c[1]);
    g.strokeRoundedRect(13, 32, 9, 18, 4.5);
    g.strokeRoundedRect(42, 32, 9, 18, 4.5);
    legs2(g, c, 32, 46, 12);
    torso(g, c, 32, 30, 24, 49, 28);
    fill(g, CREAM);
    g.fillRoundedRect(24, 34, 16, 15, 3);
    line(g, CREAM_D, 2);
    g.strokeRoundedRect(24, 34, 16, 15, 3);
    head(g, c, 32, 18, 12);
    fill(g, WHITE);
    g.fillRoundedRect(19, 9, 26, 8, 3);
    line(g, CREAM_D, 2.2);
    g.strokeRoundedRect(19, 9, 26, 8, 3);
    poly(g, [WHITE, CREAM_D], [
      [43, 10],
      [52, 6],
      [50, 13],
      [53, 17],
      [43, 16],
    ], 2);
    dotEyes(g, 32, 21, 4.5);
  },
  /** はしる ひと(かけっこ・いそぐ ばめん) */
  'person-runner': (g, c) => {
    line(g, c[1], 7);
    g.beginPath();
    g.moveTo(30, 40);
    g.lineTo(20, 48);
    g.lineTo(12, 46);
    g.strokePath();
    g.beginPath();
    g.moveTo(32, 40);
    g.lineTo(42, 48);
    g.lineTo(44, 58);
    g.strokePath();
    line(g, c[0], 7);
    g.beginPath();
    g.moveTo(36, 26);
    g.lineTo(50, 20);
    g.strokePath();
    g.beginPath();
    g.moveTo(30, 28);
    g.lineTo(18, 32);
    g.lineTo(14, 24);
    g.strokePath();
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(28, 22);
    g.lineTo(40, 26);
    g.lineTo(34, 44);
    g.lineTo(24, 40);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    head(g, c, 40, 14, 9);
    dotEyes(g, 43, 14, 3);
  },
  /** おどる ひと(ぼんおどり・おまつりの おどり) */
  'person-dancer': (g, c) => {
    line(g, c[0], 8);
    g.beginPath();
    g.moveTo(24, 32);
    g.lineTo(14, 22);
    g.lineTo(10, 12);
    g.strokePath();
    g.beginPath();
    g.moveTo(40, 32);
    g.lineTo(50, 22);
    g.lineTo(54, 12);
    g.strokePath();
    fill(g, SKIN);
    g.fillCircle(10, 11, 4.5);
    g.fillCircle(54, 11, 4.5);
    line(g, c[1], 2);
    g.strokeCircle(10, 11, 4.5);
    g.strokeCircle(54, 11, 4.5);
    line(g, c[1], 6);
    g.beginPath();
    g.moveTo(30, 50);
    g.lineTo(24, 58);
    g.strokePath();
    g.beginPath();
    g.moveTo(36, 50);
    g.lineTo(44, 56);
    g.strokePath();
    torso(g, c, 32, 28, 22, 52, 34);
    head(g, c, 32, 16, 10);
    dotEyes(g, 32, 16, 4);
  },
  /** ぼうを かつぐ ひと(にもつ・おこめを はこぶ) */
  'person-carry': (g, c) => {
    legs2(g, c, 32, 46, 12);
    torso(g, c, 32, 26, 22, 48, 26);
    head(g, c, 32, 14, 9);
    dotEyes(g, 32, 14, 3.5);
    line(g, WOOD, 5);
    g.beginPath();
    g.moveTo(8, 26);
    g.lineTo(56, 22);
    g.strokePath();
    line(g, c[1], 1.6);
    for (const [x, y] of [
      [11, 25],
      [53, 22],
    ] as const) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + 10);
      g.strokePath();
    }
    fill(g, CREAM);
    g.fillEllipse(11, 42, 17, 16);
    g.fillEllipse(53, 39, 17, 16);
    line(g, CREAM_D, 2.2);
    g.strokeEllipse(11, 42, 17, 16);
    g.strokeEllipse(53, 39, 17, 16);
  },
  /** ひとだかり(にんき・おきゃくさんが たくさん) */
  crowd: (g, c) => {
    for (const cx of [15, 49]) {
      torso(g, [c[1], c[1]], cx, 32, 20, 54, 24);
      fill(g, SKIN);
      g.fillCircle(cx, 22, 9);
      line(g, c[1]);
      g.strokeCircle(cx, 22, 9);
      dotEyes(g, cx, 22, 3.5);
    }
    torso(g, c, 32, 36, 24, 58, 30);
    head(g, c, 32, 27, 11);
    dotEyes(g, 32, 27, 4);
  },

  /** おに(せつぶん・おにの おまつり) */
  oni: (g, c) => {
    fill(g, c[1]);
    for (const [x, y] of [
      [14, 22],
      [22, 14],
      [32, 10],
      [42, 14],
      [50, 22],
    ] as const)
      g.fillTriangle(x - 8, y + 12, x, y, x + 8, y + 12);
    fill(g, CREAM);
    g.fillTriangle(14, 26, 22, 4, 30, 26);
    g.fillTriangle(50, 26, 42, 4, 34, 26);
    line(g, CREAM_D, 2.2);
    g.strokeTriangle(14, 26, 22, 4, 30, 26);
    g.strokeTriangle(50, 26, 42, 4, 34, 26);
    fill(g, c[0]);
    g.fillCircle(32, 37, 19);
    line(g, c[1]);
    g.strokeCircle(32, 37, 19);
    bigEyes(g, c, 32, 33, 9, 6);
    line(g, c[1], 3);
    g.beginPath();
    g.moveTo(18, 24);
    g.lineTo(28, 28);
    g.strokePath();
    g.beginPath();
    g.moveTo(46, 24);
    g.lineTo(36, 28);
    g.strokePath();
    fill(g, EYE);
    g.fillEllipse(32, 47, 22, 10);
    fill(g, WHITE);
    g.fillTriangle(25, 43, 30, 43, 27, 50);
    g.fillTriangle(39, 43, 34, 43, 37, 50);
  },
  /** てんぐ(やまの ぶんか・あかい かおと ながい はな) */
  tengu: (g, c) => {
    fill(g, c[1]);
    g.fillRoundedRect(19, 4, 16, 8, 3);
    fill(g, c[0]);
    g.fillEllipse(27, 34, 40, 42);
    line(g, c[1]);
    g.strokeEllipse(27, 34, 40, 42);
    poly(g, c, [
      [29, 30],
      [30, 44],
      [59, 50],
    ]);
    bigEyes(g, c, 21, 26, 9, 6);
    line(g, WHITE, 5);
    g.beginPath();
    g.moveTo(11, 17);
    g.lineTo(21, 15);
    g.strokePath();
    g.beginPath();
    g.moveTo(25, 15);
    g.lineTo(35, 19);
    g.strokePath();
    line(g, c[1], 3);
    g.beginPath();
    g.moveTo(14, 44);
    g.lineTo(20, 47);
    g.lineTo(26, 46);
    g.strokePath();
  },
  /** きつねの おめん(いなり・おまつりの おめん) */
  foxmask: (g, c) => {
    fill(g, c[0]);
    g.fillTriangle(11, 28, 15, 8, 29, 22);
    g.fillTriangle(53, 28, 49, 8, 35, 22);
    line(g, c[1]);
    g.strokeTriangle(11, 28, 15, 8, 29, 22);
    g.strokeTriangle(53, 28, 49, 8, 35, 22);
    fill(g, WHITE);
    g.fillTriangle(16, 25, 18, 14, 25, 22);
    g.fillTriangle(48, 25, 46, 14, 39, 22);
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(12, 22);
    g.lineTo(52, 22);
    g.lineTo(46, 42);
    g.lineTo(32, 58);
    g.lineTo(18, 42);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    fill(g, 0xe0584f);
    g.fillTriangle(15, 26, 29, 29, 15, 32);
    g.fillTriangle(49, 26, 35, 29, 49, 32);
    fill(g, EYE);
    g.fillEllipse(23, 38, 11, 6);
    g.fillEllipse(41, 38, 11, 6);
    fill(g, c[1]);
    g.fillTriangle(28, 48, 36, 48, 32, 53);
  },

  /** たんけんヒヨコ ぴっけ(このゲームの マスコット) */
  chick: (g) => {
    const Y = 0xf7d24a;
    const YD = 0xc79c22;
    fill(g, Y);
    for (const [x, y] of [
      [26, 13],
      [32, 9],
      [38, 13],
    ] as const)
      g.fillEllipse(x, y, 9, 11);
    line(g, YD, 2);
    for (const [x, y] of [
      [26, 13],
      [32, 9],
      [38, 13],
    ] as const)
      g.strokeEllipse(x, y, 9, 11);
    fill(g, BEAK);
    g.fillRoundedRect(21, 49, 8, 11, 3);
    g.fillRoundedRect(35, 49, 8, 11, 3);
    line(g, BEAK_D, 1.8);
    g.strokeRoundedRect(21, 49, 8, 11, 3);
    g.strokeRoundedRect(35, 49, 8, 11, 3);
    fill(g, Y);
    g.fillCircle(32, 33, 19);
    line(g, YD, 2.6);
    g.strokeCircle(32, 33, 19);
    fill(g, CHEEK);
    g.fillCircle(21, 39, 3.4);
    g.fillCircle(43, 39, 3.4);
    fill(g, Y);
    g.fillEllipse(13, 41, 12, 17);
    g.fillEllipse(51, 41, 12, 17);
    line(g, YD, 2.2);
    g.strokeEllipse(13, 41, 12, 17);
    g.strokeEllipse(51, 41, 12, 17);
    fill(g, EYE);
    g.fillCircle(25, 30, 3.4);
    g.fillCircle(39, 30, 3.4);
    shine(g, 24, 29, 1.3, 1.3);
    shine(g, 38, 29, 1.3, 1.3);
    fill(g, BEAK);
    g.beginPath();
    g.moveTo(32, 36);
    g.lineTo(25, 40);
    g.lineTo(32, 46);
    g.lineTo(39, 40);
    g.closePath();
    g.fillPath();
    line(g, BEAK_D, 2);
    g.strokePath();
  },
  /** たまごから でる ヒヨコ(あたらしく はじまる しるし) */
  'chick-egg': (g) => {
    const Y = 0xf7d24a;
    const YD = 0xc79c22;
    fill(g, Y);
    g.fillEllipse(32, 25, 30, 15);
    g.fillCircle(32, 25, 14);
    line(g, YD, 2.4);
    g.strokeCircle(32, 25, 14);
    fill(g, EYE);
    g.fillCircle(27, 22, 2.8);
    g.fillCircle(37, 22, 2.8);
    fill(g, BEAK);
    g.fillTriangle(32, 27, 27, 31, 37, 31);
    fill(g, CREAM);
    g.beginPath();
    g.moveTo(12, 42);
    g.lineTo(18, 34);
    g.lineTo(24, 41);
    g.lineTo(31, 33);
    g.lineTo(38, 41);
    g.lineTo(45, 34);
    g.lineTo(52, 42);
    g.lineTo(48, 54);
    g.lineTo(38, 60);
    g.lineTo(26, 60);
    g.lineTo(16, 54);
    g.closePath();
    g.fillPath();
    line(g, CREAM_D, 2.4);
    g.strokePath();
    fill(g, CREAM);
    g.beginPath();
    g.moveTo(20, 12);
    g.lineTo(28, 4);
    g.lineTo(36, 4);
    g.lineTo(44, 12);
    g.lineTo(38, 10);
    g.lineTo(32, 15);
    g.lineTo(26, 10);
    g.closePath();
    g.fillPath();
    line(g, CREAM_D, 2);
    g.strokePath();
  },
  /** とり(そらを とぶ とり・やちょう) */
  bird: (g, c) => {
    birdLegs(g, 28, 47);
    fill(g, c[0]);
    g.fillTriangle(15, 34, 4, 26, 7, 45);
    line(g, c[1]);
    g.strokeTriangle(15, 34, 4, 26, 7, 45);
    fill(g, c[0]);
    g.fillEllipse(28, 36, 36, 26);
    g.fillCircle(45, 23, 10);
    line(g, c[1]);
    g.strokeEllipse(28, 36, 36, 26);
    g.strokeCircle(45, 23, 10);
    fill(g, BEAK);
    g.fillTriangle(53, 20, 61, 24, 53, 28);
    line(g, BEAK_D, 1.8);
    g.strokeTriangle(53, 20, 61, 24, 53, 28);
    fill(g, c[1]);
    g.fillEllipse(26, 37, 22, 13);
    fill(g, EYE);
    g.fillCircle(48, 21, 2.2);
  },
  /** かも(みずべの とり・ひらたい くちばし) */
  duck: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(28, 38, 40, 24);
    g.fillCircle(43, 22, 10);
    line(g, c[1]);
    g.strokeEllipse(28, 38, 40, 24);
    g.strokeCircle(43, 22, 10);
    fill(g, c[0]);
    g.fillTriangle(12, 32, 4, 24, 14, 40);
    line(g, c[1], 2);
    g.strokeTriangle(12, 32, 4, 24, 14, 40);
    fill(g, BEAK);
    g.fillRoundedRect(49, 21, 12, 8, 4);
    line(g, BEAK_D, 2);
    g.strokeRoundedRect(49, 21, 12, 8, 4);
    fill(g, c[1]);
    g.fillEllipse(27, 39, 22, 12);
    fill(g, EYE);
    g.fillCircle(44, 19, 2.2);
    line(g, WATER, 3);
    g.beginPath();
    g.moveTo(8, 52);
    g.lineTo(18, 56);
    g.lineTo(30, 52);
    g.lineTo(42, 56);
    g.lineTo(54, 52);
    g.strokePath();
  },
  /** たか(はねを ひろげた もうきん・そらの おうさま) */
  hawk: (g, c) => {
    for (const s of [-1, 1] as const)
      poly(g, c, [
        [32 + s * 5, 24],
        [32 + s * 22, 18],
        [32 + s * 30, 24],
        [32 + s * 28, 31],
        [32 + s * 21, 30],
        [32 + s * 24, 37],
        [32 + s * 14, 34],
      ]);
    poly(g, c, [
      [25, 42],
      [39, 42],
      [36, 58],
      [32, 52],
      [28, 58],
    ], 2);
    fill(g, c[0]);
    g.fillEllipse(32, 33, 20, 26);
    g.fillCircle(32, 18, 10);
    line(g, c[1]);
    g.strokeEllipse(32, 33, 20, 26);
    g.strokeCircle(32, 18, 10);
    fill(g, CREAM);
    g.fillEllipse(32, 38, 14, 14);
    poly(g, [0xf5d84e, 0xbf8622], [
      [27, 20],
      [37, 20],
      [35, 28],
      [32, 33],
      [29, 28],
    ], 1.8);
    dotEyes(g, 32, 15, 4.5, 2.4);
    line(g, c[1], 2.6);
    g.beginPath();
    g.moveTo(24, 11);
    g.lineTo(31, 14);
    g.strokePath();
    g.beginPath();
    g.moveTo(40, 11);
    g.lineTo(33, 14);
    g.strokePath();
  },
  /** ふくろう(よるの とり・おおきな目) */
  owl: (g, c) => {
    fill(g, c[0]);
    g.fillTriangle(13, 22, 16, 6, 27, 18);
    g.fillTriangle(51, 22, 48, 6, 37, 18);
    line(g, c[1], 2);
    g.strokeTriangle(13, 22, 16, 6, 27, 18);
    g.strokeTriangle(51, 22, 48, 6, 37, 18);
    fill(g, c[0]);
    g.fillEllipse(32, 36, 42, 44);
    line(g, c[1]);
    g.strokeEllipse(32, 36, 42, 44);
    fill(g, c[1]);
    g.fillEllipse(14, 38, 12, 24);
    g.fillEllipse(50, 38, 12, 24);
    bigEyes(g, c, 32, 29, 10, 9);
    fill(g, BEAK);
    g.fillTriangle(32, 36, 27, 43, 37, 43);
    line(g, BEAK_D, 1.8);
    g.strokeTriangle(32, 36, 27, 43, 37, 43);
    fill(g, CREAM);
    g.fillEllipse(32, 51, 20, 10);
    fill(g, BEAK);
    g.fillRoundedRect(22, 54, 8, 6, 3);
    g.fillRoundedRect(34, 54, 8, 6, 3);
  },
  /** すずめ(ちいさな とり・むらの とり) */
  sparrow: (g, c) => {
    birdLegs(g, 30, 48);
    fill(g, c[1]);
    g.fillTriangle(20, 34, 6, 22, 14, 40);
    line(g, c[1]);
    g.strokeTriangle(20, 34, 6, 22, 14, 40);
    fill(g, c[0]);
    g.fillEllipse(30, 38, 30, 26);
    g.fillCircle(40, 27, 9);
    line(g, c[1]);
    g.strokeEllipse(30, 38, 30, 26);
    g.strokeCircle(40, 27, 9);
    fill(g, CREAM);
    g.fillEllipse(29, 44, 18, 10);
    fill(g, WHITE);
    g.fillEllipse(41, 31, 9, 6);
    fill(g, 0x3a2c22);
    g.fillEllipse(40, 20, 16, 7);
    fill(g, c[1]);
    g.fillTriangle(47, 24, 55, 27, 47, 30);
    fill(g, EYE);
    g.fillCircle(43, 25, 2.2);
  },
  /** かえる(たんぼの いきもの・じゃまする やつ) */
  frog: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(13, 51, 16, 12);
    g.fillEllipse(51, 51, 16, 12);
    line(g, c[1], 2);
    g.strokeEllipse(13, 51, 16, 12);
    g.strokeEllipse(51, 51, 16, 12);
    fill(g, c[0]);
    g.fillEllipse(32, 41, 44, 32);
    line(g, c[1]);
    g.strokeEllipse(32, 41, 44, 32);
    fill(g, CREAM);
    g.fillEllipse(32, 48, 24, 12);
    bigEyes(g, c, 32, 24, 12, 8);
    line(g, c[1], 3);
    g.beginPath();
    g.moveTo(17, 40);
    g.lineTo(24, 47);
    g.lineTo(40, 47);
    g.lineTo(47, 40);
    g.strokePath();
  },
  /** かたつむり(あめの いきもの・ゆっくり) */
  snail: (g, c) => {
    fill(g, 0xd8b483);
    g.fillRoundedRect(8, 42, 46, 13, 6);
    g.fillEllipse(50, 42, 16, 14);
    line(g, 0xa8865a, 2.2);
    g.strokeRoundedRect(8, 42, 46, 13, 6);
    line(g, 0xa8865a, 2.2);
    g.beginPath();
    g.moveTo(52, 38);
    g.lineTo(57, 26);
    g.strokePath();
    g.beginPath();
    g.moveTo(45, 36);
    g.lineTo(46, 24);
    g.strokePath();
    fill(g, 0xa8865a);
    g.fillCircle(57, 25, 2.4);
    g.fillCircle(46, 23, 2.4);
    fill(g, c[0]);
    g.fillCircle(26, 30, 16);
    line(g, c[1]);
    g.strokeCircle(26, 30, 16);
    line(g, c[1], 2.2);
    g.strokeCircle(28, 31, 11);
    g.strokeCircle(30, 32, 6);
    fill(g, c[1]);
    g.fillCircle(31, 33, 2.2);
    fill(g, EYE);
    g.fillCircle(53, 42, 2);
  },
  /** いもむし(はっぱの むし・そざいの じゃま) */
  bug: (g, c) => {
    const seg: readonly (readonly [number, number])[] = [
      [11, 46],
      [21, 42],
      [31, 40],
      [41, 41],
    ];
    fill(g, c[0]);
    for (const [x, y] of seg) g.fillCircle(x, y, 9);
    line(g, c[1], 1.5);
    for (const [x, y] of seg) g.strokeCircle(x, y, 9);
    line(g, c[1], 2.4);
    g.beginPath();
    g.moveTo(11, 55);
    g.lineTo(31, 49);
    g.lineTo(45, 50);
    g.strokePath();
    fill(g, c[0]);
    g.fillCircle(50, 35, 11);
    line(g, c[1], 2.4);
    g.strokeCircle(50, 35, 11);
    line(g, c[1], 2);
    for (const [x, y] of [
      [45, 22],
      [56, 22],
    ] as const) {
      g.beginPath();
      g.moveTo(x + (x < 50 ? 2 : -2), y + 5);
      g.lineTo(x, y);
      g.strokePath();
      fill(g, c[1]);
      g.fillCircle(x, y, 2.4);
    }
    dotEyes(g, 50, 33, 5, 2.4);
    line(g, EYE, 1.8);
    g.beginPath();
    g.moveTo(46, 40);
    g.lineTo(50, 42);
    g.lineTo(54, 40);
    g.strokePath();
  },
  /** はち(はなの みつ・しましま) */
  bee: (g) => {
    line(g, EYE, 2);
    g.beginPath();
    g.moveTo(13, 30);
    g.lineTo(9, 20);
    g.strokePath();
    g.beginPath();
    g.moveTo(20, 29);
    g.lineTo(20, 18);
    g.strokePath();
    fill(g, EYE);
    g.fillCircle(9, 19, 2.4);
    g.fillCircle(20, 17, 2.4);
    g.fillStyle(WHITE, 0.85);
    g.fillEllipse(31, 28, 24, 15);
    g.fillEllipse(47, 30, 18, 12);
    line(g, 0x9aa0a6, 1.8);
    g.strokeEllipse(31, 28, 24, 15);
    g.strokeEllipse(47, 30, 18, 12);
    fill(g, EYE);
    g.fillTriangle(57, 40, 62, 45, 55, 47);
    fill(g, 0xf5d84e);
    g.fillCircle(30, 40, 12);
    g.fillCircle(51, 42, 8.5);
    line(g, 0xc2a52c, 2.2);
    g.strokeCircle(30, 40, 12);
    g.strokeCircle(51, 42, 8.5);
    fill(g, 0x3c3c44);
    g.fillCircle(42, 41, 10.5);
    g.fillCircle(16, 37, 9.5);
    fill(g, WHITE);
    g.fillCircle(13, 35, 2.8);
    g.fillCircle(20, 35, 2.8);
  },
  /** あり(はたらく むし・3つの まる) */
  ant: (g, c) => {
    line(g, c[1], 2.2);
    for (const [x, y] of [
      [22, 44],
      [28, 46],
      [34, 44],
    ] as const) {
      g.beginPath();
      g.moveTo(x, 36);
      g.lineTo(x - 4, y);
      g.lineTo(x - 8, y + 6);
      g.strokePath();
    }
    for (const [x, y] of [
      [24, 26],
      [30, 24],
      [36, 26],
    ] as const) {
      g.beginPath();
      g.moveTo(x, 34);
      g.lineTo(x + 4, y);
      g.lineTo(x + 9, y - 5);
      g.strokePath();
    }
    fill(g, c[0]);
    g.fillCircle(14, 34, 8);
    g.fillCircle(29, 36, 7);
    g.fillCircle(47, 36, 11);
    line(g, c[1]);
    g.strokeCircle(14, 34, 8);
    g.strokeCircle(29, 36, 7);
    g.strokeCircle(47, 36, 11);
    line(g, c[1], 2);
    g.beginPath();
    g.moveTo(11, 27);
    g.lineTo(6, 18);
    g.strokePath();
    g.beginPath();
    g.moveTo(17, 27);
    g.lineTo(18, 16);
    g.strokePath();
    fill(g, WHITE);
    g.fillCircle(13, 33, 2.4);
  },

  /** いのしし(やまの けもの・きばと せの けが とくちょう) */
  boar: (g, c) => {
    fill(g, c[1]);
    for (const [x, y] of [
      [14, 20],
      [22, 17],
      [30, 16],
      [37, 18],
    ] as const)
      g.fillTriangle(x - 5, y + 12, x, y, x + 5, y + 12);
    fill(g, c[1]);
    for (const x of [13, 23, 33, 41]) g.fillRoundedRect(x, 44, 8, 16, 3);
    line(g, c[1]);
    for (const x of [13, 23, 33, 41]) g.strokeRoundedRect(x, 44, 8, 16, 3);
    poly(g, c, [
      [36, 28],
      [52, 32],
      [58, 40],
      [50, 50],
      [36, 50],
    ]);
    fill(g, c[0]);
    g.fillEllipse(26, 40, 42, 26);
    line(g, c[1]);
    g.strokeEllipse(26, 40, 42, 26);
    fill(g, c[1]);
    g.fillTriangle(36, 24, 45, 26, 40, 32);
    fill(g, 0xd8b483);
    g.fillEllipse(55, 40, 12, 11);
    line(g, 0xa8865a, 1.8);
    g.strokeEllipse(55, 40, 12, 11);
    fill(g, EYE);
    g.fillCircle(53, 39, 1.6);
    g.fillCircle(57, 41, 1.6);
    poly(g, [WHITE, CREAM_D], [
      [47, 52],
      [53, 50],
      [52, 37],
    ], 1.8);
    fill(g, EYE);
    g.fillCircle(43, 34, 2.4);
  },
  /** しか(なら・やまの けもの・つのが とくちょう) */
  deer: (g, c) => {
    line(g, c[1], 4);
    for (const s of [-1, 1] as const) {
      const bx = 45 + s * 6;
      g.beginPath();
      g.moveTo(bx, 24);
      g.lineTo(bx + s * 3, 5);
      g.strokePath();
      g.beginPath();
      g.moveTo(bx + s * 1, 18);
      g.lineTo(bx + s * 12, 12);
      g.strokePath();
      g.beginPath();
      g.moveTo(bx + s * 2, 11);
      g.lineTo(bx + s * 11, 4);
      g.strokePath();
    }
    poly(g, c, [
      [39, 28],
      [50, 30],
      [49, 46],
      [36, 44],
    ]);
    fill(g, c[0]);
    g.fillEllipse(25, 41, 38, 24);
    line(g, c[1]);
    g.strokeEllipse(25, 41, 38, 24);
    fill(g, c[0]);
    g.fillEllipse(46, 29, 19, 16);
    line(g, c[1]);
    g.strokeEllipse(46, 29, 19, 16);
    fill(g, c[1]);
    g.fillTriangle(35, 22, 42, 25, 35, 29);
    fill(g, WHITE);
    for (const [x, y] of [
      [20, 40],
      [28, 38],
      [24, 47],
    ] as const)
      g.fillCircle(x, y, 2.4);
    line(g, c[1], 2.6);
    for (const x of [13, 21, 29, 35]) {
      g.beginPath();
      g.moveTo(x, 52);
      g.lineTo(x, 60);
      g.strokePath();
    }
    fill(g, EYE);
    g.fillCircle(49, 28, 2.2);
  },
  /** うさぎ(つきみ・ながい みみ) */
  rabbit: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(28, 14, 10, 24);
    g.fillEllipse(41, 13, 10, 24);
    line(g, c[1]);
    g.strokeEllipse(28, 14, 10, 24);
    g.strokeEllipse(41, 13, 10, 24);
    fill(g, CHEEK);
    g.fillEllipse(28, 14, 4, 15);
    g.fillEllipse(41, 13, 4, 15);
    fill(g, WHITE);
    g.fillCircle(12, 44, 7);
    line(g, CREAM_D, 2);
    g.strokeCircle(12, 44, 7);
    fill(g, c[0]);
    g.fillEllipse(31, 44, 34, 28);
    g.fillCircle(37, 29, 11);
    line(g, c[1]);
    g.strokeEllipse(31, 44, 34, 28);
    g.strokeCircle(37, 29, 11);
    dotEyes(g, 37, 27, 5, 2.4);
    fill(g, CHEEK);
    g.fillTriangle(34, 33, 40, 33, 37, 37);
    fill(g, c[1]);
    g.fillRoundedRect(24, 52, 10, 7, 3);
    g.fillRoundedRect(37, 52, 10, 7, 3);
  },
  /** りす(どんぐり・ふさふさの しっぽ) */
  squirrel: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(15, 28, 26, 40);
    line(g, c[1]);
    g.strokeEllipse(15, 28, 26, 40);
    line(g, c[1], 1.8);
    for (const y of [20, 30, 40]) {
      g.beginPath();
      g.moveTo(5, y);
      g.lineTo(14, y - 4);
      g.lineTo(23, y);
      g.strokePath();
    }
    fill(g, c[0]);
    g.fillEllipse(38, 43, 28, 30);
    g.fillCircle(42, 24, 11);
    line(g, c[1]);
    g.strokeEllipse(38, 43, 28, 30);
    g.strokeCircle(42, 24, 11);
    fill(g, c[0]);
    g.fillTriangle(33, 16, 36, 8, 41, 15);
    g.fillTriangle(51, 16, 48, 8, 43, 15);
    line(g, c[1], 2);
    g.strokeTriangle(33, 16, 36, 8, 41, 15);
    g.strokeTriangle(51, 16, 48, 8, 43, 15);
    dotEyes(g, 42, 23, 5, 2.4);
    fill(g, EYE);
    g.fillTriangle(39, 28, 45, 28, 42, 32);
    fill(g, WOOD);
    g.fillEllipse(40, 44, 15, 17);
    line(g, 0x5f4630, 2);
    g.strokeEllipse(40, 44, 15, 17);
    fill(g, 0x5f4630);
    g.fillEllipse(40, 37, 12, 5);
  },
  /** くじら(うみの おおきな いきもの・しおふき) */
  whale: (g, c) => {
    line(g, WATER, 4);
    g.beginPath();
    g.moveTo(32, 28);
    g.lineTo(32, 16);
    g.strokePath();
    fill(g, WATER);
    for (const [x, y, r] of [
      [20, 13, 3.2],
      [26, 8, 3.6],
      [33, 6, 4],
      [40, 9, 3.4],
      [45, 14, 3],
    ] as const)
      g.fillCircle(x, y, r);
    poly(g, c, [
      [16, 44],
      [4, 32],
      [10, 44],
      [4, 57],
    ]);
    fill(g, c[0]);
    g.fillEllipse(33, 43, 50, 30);
    line(g, c[1]);
    g.strokeEllipse(33, 43, 50, 30);
    fill(g, CREAM);
    g.fillEllipse(34, 52, 32, 10);
    poly(g, [c[1], c[1]], [
      [24, 52],
      [34, 53],
      [26, 60],
    ], 2);
    line(g, c[1], 2.6);
    g.beginPath();
    g.moveTo(56, 44);
    g.lineTo(48, 49);
    g.lineTo(38, 48);
    g.strokePath();
    fill(g, EYE);
    g.fillCircle(48, 38, 2.6);
  },
  /** さめ(うみの きけんな さかな・おおきな せびれ) */
  shark: (g, c) => {
    fill(g, c[0]);
    g.fillTriangle(26, 28, 33, 8, 43, 28);
    line(g, c[1]);
    g.strokeTriangle(26, 28, 33, 8, 43, 28);
    fill(g, c[0]);
    g.fillTriangle(11, 38, 2, 26, 3, 50);
    line(g, c[1]);
    g.strokeTriangle(11, 38, 2, 26, 3, 50);
    fill(g, c[1]);
    g.fillTriangle(30, 46, 22, 58, 40, 48);
    fill(g, c[0]);
    g.fillEllipse(32, 38, 48, 24);
    g.fillTriangle(50, 29, 62, 38, 50, 47);
    line(g, c[1]);
    g.strokeEllipse(32, 38, 48, 24);
    g.strokeTriangle(50, 29, 62, 38, 50, 47);
    fill(g, CREAM);
    g.fillEllipse(32, 45, 36, 9);
    fill(g, EYE);
    g.fillCircle(44, 34, 2.4);
    line(g, c[1], 2.6);
    g.beginPath();
    g.moveTo(40, 43);
    g.lineTo(54, 40);
    g.strokePath();
    fill(g, WHITE);
    for (const [x, y] of [
      [42, 43],
      [47, 42],
      [52, 41],
    ] as const)
      g.fillTriangle(x - 2.4, y, x + 2.4, y - 0.6, x, y - 5.5);
  },

  /** にこにこの かお(せいこう・ごうかくの しるし) */
  'face-smile': (g, c) => {
    head(g, c, 32, 32, 24);
    dotEyes(g, 32, 26, 9, 3);
    fill(g, CHEEK);
    g.fillCircle(15, 36, 4);
    g.fillCircle(49, 36, 4);
    line(g, c[1], 3.2);
    g.beginPath();
    g.moveTo(21, 38);
    g.lineTo(26, 45);
    g.lineTo(38, 45);
    g.lineTo(43, 38);
    g.strokePath();
  },
  /** かなしい かお(ざんねん・もういちど) */
  'face-sad': (g, c) => {
    head(g, c, 32, 32, 24);
    dotEyes(g, 32, 27, 9, 3);
    line(g, c[1], 3.2);
    g.beginPath();
    g.moveTo(22, 48);
    g.lineTo(27, 42);
    g.lineTo(37, 42);
    g.lineTo(42, 48);
    g.strokePath();
    g.beginPath();
    g.moveTo(16, 19);
    g.lineTo(24, 22);
    g.strokePath();
    g.beginPath();
    g.moveTo(48, 19);
    g.lineTo(40, 22);
    g.strokePath();
    fill(g, WATER);
    g.fillTriangle(41, 32, 46, 32, 43.5, 26);
    g.fillCircle(43.5, 34, 3.4);
    line(g, 0x4a94b8, 1.6);
    g.strokeCircle(43.5, 34, 3.4);
  },
  /** びっくりの かお(はっけん・おどろき) */
  'face-surprised': (g, c) => {
    head(g, c, 32, 32, 24);
    bigEyes(g, c, 32, 27, 9, 6);
    line(g, c[1], 2.8);
    g.beginPath();
    g.moveTo(16, 16);
    g.lineTo(26, 15);
    g.strokePath();
    g.beginPath();
    g.moveTo(48, 16);
    g.lineTo(38, 15);
    g.strokePath();
    fill(g, EYE);
    g.fillEllipse(32, 45, 12, 13);
    fill(g, CHEEK);
    g.fillCircle(14, 38, 3.4);
    g.fillCircle(50, 38, 3.4);
  },
  /** おこった かお(だめ・きけんの しるし) */
  'face-angry': (g, c) => {
    head(g, c, 32, 32, 24);
    dotEyes(g, 32, 29, 9, 3);
    line(g, c[1], 4);
    g.beginPath();
    g.moveTo(15, 19);
    g.lineTo(27, 25);
    g.strokePath();
    g.beginPath();
    g.moveTo(49, 19);
    g.lineTo(37, 25);
    g.strokePath();
    fill(g, EYE);
    g.beginPath();
    g.moveTo(21, 43);
    g.lineTo(27, 47);
    g.lineTo(32, 43);
    g.lineTo(37, 47);
    g.lineTo(43, 43);
    g.lineTo(43, 49);
    g.lineTo(21, 49);
    g.closePath();
    g.fillPath();
    fill(g, 0xe0584f);
    g.fillCircle(13, 34, 3.4);
    g.fillCircle(51, 34, 3.4);
  },
  /** てのひら(タップ・さわる あんない) */
  hand: (g, c) => {
    fill(g, SKIN);
    const fingers: [number, number, number, number][] = [
      [20, 14, 7, 20],
      [28, 9, 7, 25],
      [36, 11, 7, 23],
      [43, 16, 7, 18],
    ];
    for (const [x, y, w, h] of fingers) g.fillRoundedRect(x, y, w, h, 3.4);
    g.fillRoundedRect(9, 32, 14, 11, 5.4);
    line(g, c[1], 2.2);
    for (const [x, y, w, h] of fingers) g.strokeRoundedRect(x, y, w, h, 3.4);
    g.strokeRoundedRect(9, 32, 14, 11, 5.4);
    fill(g, SKIN);
    g.fillRoundedRect(18, 28, 30, 27, 9);
    line(g, c[1]);
    g.strokeRoundedRect(18, 28, 30, 27, 9);
  },
  /** ゆびさし(あそびかたの 「ここを おす」の しるし)。うえむきの ひとさしゆび */
  'hand-point': (g, c) => {
    // ひとさしゆび(まっすぐ うえ)
    fill(g, SKIN);
    g.fillRoundedRect(25, 6, 13, 26, 6.5);
    line(g, c[1], 2.2);
    g.strokeRoundedRect(25, 6, 13, 26, 6.5);
    // にぎった てのひら
    fill(g, SKIN);
    g.fillRoundedRect(19, 26, 27, 30, 10);
    line(g, c[1], 2.4);
    g.strokeRoundedRect(19, 26, 27, 30, 10);
    // おやゆび
    fill(g, SKIN);
    g.fillRoundedRect(13, 33, 12, 15, 6);
    line(g, c[1], 2.2);
    g.strokeRoundedRect(13, 33, 12, 15, 6);
    // まがった ゆびの すじ(にぎって いる ことが わかる)
    line(g, c[1], 1.6);
    for (const y of [36, 43, 50]) {
      g.beginPath();
      g.moveTo(27, y);
      g.lineTo(44, y);
      g.strokePath();
    }
  },
  /** ぱちぱち(はくしゅ・おいわい) */
  'hand-clap': (g, c) => {
    line(g, c[0], 3.2);
    for (const [x1, y1, x2, y2] of [
      [40, 14, 46, 7],
      [50, 20, 58, 15],
      [24, 46, 18, 54],
      [14, 40, 5, 46],
    ] as const) {
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.strokePath();
    }
    poly(g, [SKIN, c[1]], [
      [5, 16],
      [22, 20],
      [37, 32],
      [28, 43],
      [9, 33],
    ]);
    poly(g, [SKIN, c[1]], [
      [59, 48],
      [42, 44],
      [27, 32],
      [36, 21],
      [55, 31],
    ]);
    line(g, c[1], 1.6);
    for (const d of [-5, 0, 5]) {
      g.beginPath();
      g.moveTo(38 + d, 26 - d * 0.9);
      g.lineTo(48 + d, 33 - d * 0.9);
      g.strokePath();
    }
  },
  /** あしうら(あるく・すすむ)  */
  foot: (g, c) => {
    fill(g, SKIN);
    const toes: [number, number, number][] = [
      [17, 22, 4.6],
      [25, 15, 4.8],
      [33, 13, 4.2],
      [40, 15, 3.8],
      [46, 19, 3.4],
    ];
    for (const [x, y, r] of toes) g.fillCircle(x, y, r);
    line(g, c[1], 2);
    for (const [x, y, r] of toes) g.strokeCircle(x, y, r);
    fill(g, SKIN);
    g.beginPath();
    g.moveTo(15, 30);
    g.lineTo(20, 22);
    g.lineTo(40, 22);
    g.lineTo(47, 30);
    g.lineTo(44, 40);
    g.lineTo(40, 45);
    g.lineTo(41, 52);
    g.lineTo(36, 59);
    g.lineTo(26, 59);
    g.lineTo(21, 52);
    g.lineTo(24, 44);
    g.lineTo(17, 38);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
  },
};

/* たべもの・そざいの かたち(くだもの・やさい・さかな・かいさんぶつ・つくったもの)。
   実物の「なにもの か」で かたちを 選ぶ。おなじ 絵を べつの 意味に 使い回さない */
import { OUTLINE_SOFT, ellipseOutlined, fill, leaf, line, shine, stem, type IconDraw } from './kit';

export const FOOD_ICONS: Record<string, IconDraw> = {
  /** かたちが まるい だけの み(もも・トマト・すいか)。まるに へた 1つ。とくちょうの ある みは べつの かたちを つかう */
  round: (g, c) => {
    ellipseOutlined(g, 32, 36, 44, 42, c);
    stem(g, 32, 16);
    leaf(g, 33, 15, 11);
    shine(g, 22, 26, 7, 5);
  },
  /** かんきつ(みかん・レモン・ゆず)。まるい みに はっぱ 1まいと へた */
  citrus: (g, c) => {
    ellipseOutlined(g, 32, 37, 44, 40, c);
    g.fillStyle(c[1], 0.35);
    for (const [dx, dy] of [
      [-12, -8], [-4, -12], [6, -9], [13, -3], [-14, 2], [-6, 4], [4, 2], [12, 6], [-9, 10], [2, 11], [10, 13], [0, -2],
    ] as const)
      g.fillCircle(32 + dx, 36 + dy, 1.2);
    fill(g, 0x4a8a3a);
    g.fillEllipse(32, 15, 12, 7);
    leaf(g, 34, 13, 10);
    shine(g, 21, 28, 6, 4);
  },
  /** つぶの みが ふさに なった もの(ブルーベリー・ぶどう・さくらんぼ)。まるを 6〜7つ かさねて ふさに し、うえに みじかい えだ */
  berry: (g, c) => {
    stem(g, 32, 14, 8);
    const pts: [number, number][] = [
      [32, 18],
      [24, 26],
      [40, 26],
      [18, 35],
      [32, 35],
      [46, 35],
      [25, 45],
      [39, 45],
      [32, 54],
    ];
    for (const [x, y] of pts) {
      fill(g, c[0]);
      g.fillCircle(x, y, 8);
      line(g, c[1], 1.6);
      g.strokeCircle(x, y, 8);
    }
    shine(g, 22, 24, 3, 2);
  },
  /** いちご。さきが とがった みに たねの 点、上に みどりの がく */
  strawberry: (g, c) => {
    // からだ: かたが まるく、さきが とがった かたち(たこ形に 見えない ように 上を まるめる)
    fill(g, c[0]);
    g.fillEllipse(24, 30, 26, 26);
    g.fillEllipse(40, 30, 26, 26);
    g.fillEllipse(32, 34, 40, 30);
    g.beginPath();
    g.moveTo(13, 34);
    g.lineTo(51, 34);
    g.lineTo(32, 59);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokeEllipse(32, 38, 40, 42);
    // たね
    g.fillStyle(0xfff3c4, 0.95);
    for (const [x, y] of [
      [24, 30],
      [40, 30],
      [32, 36],
      [22, 42],
      [42, 42],
      [32, 50],
    ] as const)
      g.fillCircle(x, y, 2);
    // へた(みどりの ほし)
    fill(g, 0x4a8a3a);
    for (const dx of [-11, 0, 11]) g.fillTriangle(32, 24, 32 + dx, 10, 32 + dx * 0.35 + 5, 24);
    line(g, 0x2f6b2a, 1.6);
    for (const dx of [-11, 0, 11]) g.strokeTriangle(32, 24, 32 + dx, 10, 32 + dx * 0.35 + 5, 24);
    stem(g, 32, 12, 7);
  },
  /** メロン・すいか。まるい みに あみめ(メロン)か しま(すいか) */
  melon: (g, c) => {
    ellipseOutlined(g, 32, 34, 46, 44, c);
    line(g, c[1], 1.4);
    for (let i = -2; i <= 2; i++) {
      g.beginPath();
      g.moveTo(32 + i * 9, 13);
      g.lineTo(32 + i * 11, 56);
      g.strokePath();
    }
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.moveTo(10, 34 + i * 11);
      g.lineTo(54, 34 + i * 11);
      g.strokePath();
    }
    stem(g, 32, 13, 8);
  },
  /** はっぱの やさい(こまつな・レタス・しゅんぎく)。はっぱ 3〜4まいが たばに なって いる */
  leafy: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 38, 46, 40);
    line(g, c[1]);
    g.strokeEllipse(32, 38, 46, 40);
    fill(g, c[1]);
    for (const dx of [-14, 0, 14]) {
      g.beginPath();
      g.moveTo(32 + dx * 0.4, 58);
      g.lineTo(32 + dx, 20);
      g.lineTo(32 + dx + 4, 22);
      g.closePath();
      g.fillPath();
    }
    fill(g, 0xf3f0dc);
    g.fillRoundedRect(30, 44, 5, 16, 2);
  },
  /** ねぎ・せり など「くきの やさい」。はっぱは いつも みどり
     (c で ぬると white/cream/yellow の とき まっしろに 消えて しまう)。
     c は じくの いろに つかう */
  stalk: (g, c) => {
    // はっぱ(3まい)
    for (const [dx, tipY] of [
      [-13, 6],
      [0, 2],
      [13, 8],
    ] as const) {
      fill(g, 0x5aa04a);
      g.beginPath();
      g.moveTo(32, 40);
      g.lineTo(32 + dx, tipY);
      g.lineTo(32 + dx * 0.45 + 6, 40);
      g.closePath();
      g.fillPath();
      line(g, 0x37702c, 1.8);
      g.strokePath();
    }
    // じく(白ねぎの しろい ぶぶん)。ほそ長く して「くき」に 見える ように する
    fill(g, c[0]);
    g.fillRoundedRect(26, 26, 13, 32, 6);
    line(g, c[1], 2.4);
    g.strokeRoundedRect(26, 26, 13, 32, 6);
    line(g, c[1], 1.4);
    g.beginPath();
    g.moveTo(27, 34);
    g.lineTo(38, 34);
    g.strokePath();
  },
  /** ねの やさい(わさび・にんじん・しょうが)。したが とがった ねと、上に みどりの は */
  root: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(24, 22);
    g.lineTo(40, 22);
    g.lineTo(34, 58);
    g.lineTo(30, 58);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    line(g, c[1], 1.2);
    for (const y of [30, 38, 46]) {
      g.beginPath();
      g.moveTo(26, y);
      g.lineTo(38, y - 2);
      g.strokePath();
    }
    fill(g, 0x4a8a3a);
    for (const dx of [-8, 0, 8]) g.fillTriangle(32, 22, 32 + dx, 6, 32 + dx * 0.4, 22);
  },
  /** いも(さつまいも・じゃがいも)。ながい たまごがたに 土の 点 */
  tuber: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 36, 48, 32);
    g.fillEllipse(22, 30, 22, 22);
    line(g, c[1]);
    g.strokeEllipse(32, 36, 48, 32);
    g.fillStyle(c[1], 0.5);
    for (const [x, y] of [
      [20, 32],
      [34, 28],
      [42, 40],
      [26, 44],
    ] as const)
      g.fillCircle(x, y, 1.6);
  },
  /** さや(えだまめ・そらまめ・だいず)。ななめの ふとい さやに して
     まめの ふくらみを 3つ 見せる */
  pod: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(9, 47);
    g.lineTo(20, 24);
    g.lineTo(40, 12);
    g.lineTo(55, 17);
    g.lineTo(46, 40);
    g.lineTo(26, 54);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    // まめの ふくらみ
    g.fillStyle(c[1], 0.5);
    for (const [x, y] of [
      [22, 40],
      [31, 32],
      [41, 24],
    ] as const)
      g.fillCircle(x, y, 7);
    line(g, c[1], 1.4);
    for (const [x, y] of [
      [22, 40],
      [31, 32],
      [41, 24],
    ] as const)
      g.strokeCircle(x, y, 7);
    // へた
    stem(g, 52, 18, 8);
  },
  /** ピーマン・ししとう。まるい 実だと りんごと 見わけが つかないので
     したが 3つに わかれた ピーマンの かたちに する */
  pepper: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(14, 22, 36, 30, 14);
    line(g, c[1]);
    g.strokeRoundedRect(14, 22, 36, 30, 14);
    // たての みぞ 2本(これで「りんご」ではなく ピーマンに 見える)
    line(g, c[1], 2);
    for (const dx of [-9, 9]) {
      g.beginPath();
      g.moveTo(32 + dx, 26);
      g.lineTo(32 + dx, 50);
      g.strokePath();
    }
    // へた
    stem(g, 32, 20, 9);
    fill(g, 0x4a8a3a);
    g.fillEllipse(32, 20, 18, 8);
    line(g, 0x2f6b2a, 1.6);
    g.strokeEllipse(32, 20, 18, 8);
    shine(g, 24, 32, 4, 6);
  },
  /** きゅうり・ゴーヤー。ながい みに たての すじ。ゴーヤーは 表面が いぼいぼに 見える ように */
  cucumber: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(24, 10, 16, 46, 8);
    line(g, c[1]);
    g.strokeRoundedRect(24, 10, 16, 46, 8);
    g.fillStyle(c[1], 0.6);
    for (let i = 0; i < 7; i++) g.fillCircle(28 + (i % 2) * 8, 16 + i * 6, 1.4);
    fill(g, 0x4a8a3a);
    g.fillEllipse(32, 10, 12, 6);
  },
  /** なす。まるみの ある みに、みどりの がくと へた */
  eggplant: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 40, 32, 40);
    line(g, c[1]);
    g.strokeEllipse(32, 40, 32, 40);
    fill(g, 0x4a8a3a);
    g.fillTriangle(22, 20, 42, 20, 32, 8);
    g.fillRect(30, 8, 4, 14);
    shine(g, 24, 34, 4, 8);
  },
  /** たまねぎ。まるい みに たての すじ、上に みどりの め */
  onion: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 40, 38, 34);
    line(g, c[1]);
    g.strokeEllipse(32, 40, 38, 34);
    line(g, c[1], 1.2);
    for (const dx of [-8, 0, 8]) {
      g.beginPath();
      g.moveTo(32 + dx, 24);
      g.lineTo(32 + dx * 1.4, 56);
      g.strokePath();
    }
    fill(g, 0x8aa04a);
    g.fillTriangle(28, 24, 36, 24, 30, 6);
    g.fillTriangle(30, 24, 38, 24, 40, 8);
  },
  /** きのこ。太い じくと まるい かさ。かさに 点が すこし */
  mushroom: (g, c) => {
    fill(g, 0xf0e6d0);
    g.fillRoundedRect(26, 32, 12, 24, 5);
    line(g, OUTLINE_SOFT, 1.8);
    g.strokeRoundedRect(26, 32, 12, 24, 5);
    fill(g, c[0]);
    g.slice(32, 34, 22, Math.PI, Math.PI * 2, false);
    g.fillPath();
    line(g, c[1]);
    g.beginPath();
    g.arc(32, 34, 22, Math.PI, Math.PI * 2, false);
    g.strokePath();
    g.fillStyle(c[1], 0.45);
    for (const [x, y] of [
      [24, 26],
      [38, 24],
      [32, 30],
    ] as const)
      g.fillCircle(x, y, 2.4);
  },
  /** こくもつ(こめ・むぎ・とうもろこし)。つぶが たてに ならんだ ほ */
  grain: (g, c) => {
    line(g, 0x9a8a4a, 2.6);
    g.beginPath();
    g.moveTo(32, 58);
    g.lineTo(32, 22);
    g.strokePath();
    fill(g, c[0]);
    for (let i = 0; i < 6; i++) {
      const y = 20 + i * 6.6;
      g.fillEllipse(22, y, 16, 8);
      g.fillEllipse(42, y + 3, 16, 8);
    }
    line(g, c[1], 1.4);
    for (let i = 0; i < 6; i++) {
      const y = 20 + i * 6.6;
      g.strokeEllipse(22, y, 16, 8);
      g.strokeEllipse(42, y + 3, 16, 8);
    }
  },
  /** たけ。ふしの ある みどりの つつ 2本と、さきに はっぱ。たけのこ(tuber)とは べつ */
  bamboo: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(26, 8, 14, 50, 4);
    line(g, c[1]);
    g.strokeRoundedRect(26, 8, 14, 50, 4);
    line(g, c[1], 2);
    for (const y of [22, 34, 46]) {
      g.beginPath();
      g.moveTo(26, y);
      g.lineTo(40, y);
      g.strokePath();
    }
    fill(g, 0x5aa04a);
    g.fillTriangle(40, 20, 58, 12, 42, 28);
    g.fillTriangle(26, 32, 8, 24, 24, 40);
  },
  /** れんこんの 断面。あなが 7〜8こ ならぶ */
  lotus: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(7, 17, 50, 34, 16);
    line(g, c[1]);
    g.strokeRoundedRect(7, 17, 50, 34, 16);
    const holes = [
      [19, 28],
      [32, 25],
      [45, 29],
      [24, 42],
      [40, 43],
      [32, 36],
    ] as const;
    fill(g, 0xfffdf5);
    for (const [x, y] of holes) g.fillCircle(x, y, 5.5);
    line(g, c[1], 1.4);
    for (const [x, y] of holes) g.strokeCircle(x, y, 5.5);
  },
  /** しょうが。まえは 3つの まるで「ねずみのかお」に 見えて いた。
     ごつごつした 塊+こぶ を つないだ かたちに する */
  ginger: (g, c) => {
    // したの 太い かたまり
    fill(g, c[0]);
    g.fillRoundedRect(9, 34, 46, 20, 10);
    // うえに つきでた こぶ 3つ
    for (const [x, w, h] of [
      [15, 13, 20],
      [30, 15, 26],
      [45, 13, 18],
    ] as const)
      g.fillRoundedRect(x, 54 - h - 12, w, h, 6.5);
    line(g, c[1]);
    g.strokeRoundedRect(9, 34, 46, 20, 10);
    for (const [x, w, h] of [
      [15, 13, 20],
      [30, 15, 26],
      [45, 13, 18],
    ] as const)
      g.strokeRoundedRect(x, 54 - h - 12, w, h, 6.5);
    // かたまりの うわがわを ぬりつぶし直して こぶの 線を けす
    fill(g, c[0]);
    g.fillRoundedRect(11, 38, 42, 14, 7);
    line(g, c[1], 1.6);
    g.beginPath();
    g.moveTo(11, 44);
    g.lineTo(53, 44);
    g.strokePath();
    shine(g, 20, 40, 5, 3);
  },
  /** はな(ブロッコリー・べにばな・はなっこりー)。はなびら 5まいと まんなかの まる */
  flower: (g, c) => {
    fill(g, 0x5aa04a);
    g.fillRect(30, 34, 4, 24);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      fill(g, c[0]);
      g.fillEllipse(32 + Math.cos(a) * 13, 28 + Math.sin(a) * 13, 15, 15);
    }
    fill(g, 0xf5d84e);
    g.fillCircle(32, 28, 8);
    line(g, c[1], 1.6);
    g.strokeCircle(32, 28, 8);
  },
  /** き。太い みきと まるい はっぱの かたまり。forest(すぎ 3本)や palm(やしのき)とは べつ */
  tree: (g, c) => {
    fill(g, 0x8a6a42);
    g.fillRect(29, 40, 6, 18);
    fill(g, c[0]);
    g.fillTriangle(32, 6, 14, 30, 50, 30);
    g.fillTriangle(32, 18, 10, 46, 54, 46);
    line(g, c[1], 1.8);
    g.strokeTriangle(32, 6, 14, 30, 50, 30);
    g.strokeTriangle(32, 18, 10, 46, 54, 46);
  },
  /** らっかせい。まえの 絵は「円すい」で アイスの コーンに 見えて いた。
     まめ2つぶ ぶんの くびれた からに する */
  nut: (g, c) => {
    // ひとつづきの シルエット(まるを 2つ ならべると ゆきだるまに 見える)。
    // たてに ながい たまごがたを、まんなかで くびれさせる
    const shell: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const a = -Math.PI / 2 + (i / 40) * Math.PI * 2;
      const waist = 1 - 0.42 * Math.pow(Math.cos(a), 6); // まんなか(cos≒±1)だけ ほそく
      shell.push([32 + Math.sin(a) * 14 * waist, 32 - Math.cos(a) * 24]);
    }
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(shell[0][0], shell[0][1]);
    for (const [x, y] of shell.slice(1)) g.lineTo(x, y);
    g.closePath();
    g.fillPath();
    line(g, c[1], 2.6);
    g.strokePath();
    // くびれ(まん中の しわ)
    line(g, c[1], 1.8);
    for (const sgn of [-1, 1]) {
      g.beginPath();
      g.moveTo(32 + sgn * 8, 28);
      g.lineTo(32 + sgn * 5, 32);
      g.lineTo(32 + sgn * 8, 36);
      g.strokePath();
    }
    // からの あみめ(よこすじ。ななめの ×は きずに 見える)
    line(g, c[1], 1.2);
    for (const y of [16, 21, 43, 48]) {
      g.beginPath();
      g.moveTo(24, y);
      g.lineTo(40, y);
      g.strokePath();
    }
  },
  /** くり。とがった さきと、ざらざらの したはんぶん */
  chestnut: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(32, 8);
    g.lineTo(52, 26);
    g.lineTo(54, 44);
    g.arc(32, 44, 22, 0, Math.PI, false);
    g.lineTo(12, 26);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    // したの ざらざら(あわい 帯)
    g.fillStyle(0xf3e2bc, 0.85);
    g.fillEllipse(32, 52, 42, 16);
    line(g, c[1], 1.8);
    g.beginPath();
    g.moveTo(11, 48);
    g.lineTo(53, 48);
    g.strokePath();
    shine(g, 24, 26, 5, 4);
  },
  /** ちゃば。ひしがた 3つでは「はっぱ」に 見えなかったので
     さきの とがった はっぱ+まんなかの すじ に する */
  tealeaf: (g, c) => {
    const oneLeaf = (bx: number, by: number, tx: number, ty: number): void => {
      const pts: [number, number][] = [];
      const [nx, ny] = [-(ty - by), tx - bx];
      const len = Math.hypot(nx, ny) || 1;
      for (const s of [-1, 1]) {
        for (let i = 0; i <= 8; i++) {
          const t = s < 0 ? i / 8 : (8 - i) / 8;
          const bulge = Math.sin(t * Math.PI) * 9 * s;
          pts.push([bx + (tx - bx) * t + (nx / len) * bulge, by + (ty - by) * t + (ny / len) * bulge]);
        }
      }
      fill(g, c[0]);
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
      g.closePath();
      g.fillPath();
      line(g, c[1], 1.8);
      g.strokePath();
      line(g, c[1], 1.4);
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(tx, ty);
      g.strokePath();
    };
    // くき
    line(g, 0x5a7c3a, 3);
    g.beginPath();
    g.moveTo(32, 58);
    g.lineTo(32, 26);
    g.strokePath();
    oneLeaf(32, 30, 8, 16);
    oneLeaf(32, 42, 56, 28);
    oneLeaf(32, 30, 32, 6);
  },
  /** キウイの 断面。まるい わの 中が しろく、たねの 点が わに ならぶ */
  kiwi: (g, c) => {
    ellipseOutlined(g, 32, 36, 44, 40, c);
    fill(g, 0xd8e8a8);
    g.fillEllipse(32, 36, 30, 27);
    fill(g, 0xfdfdf0);
    g.fillCircle(32, 36, 5);
    fill(g, 0x3a3a3a);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      g.fillCircle(32 + Math.cos(a) * 10, 36 + Math.sin(a) * 9, 1.4);
    }
  },
  /** パイナップル。あみめの みと、上に とがった はっぱ */
  pineapple: (g, c) => {
    fill(g, 0x5aa04a);
    for (const dx of [-10, -4, 4, 10]) g.fillTriangle(32 + dx, 24, 32 + dx * 2.2, 2, 32 + dx + 5, 24);
    fill(g, c[0]);
    g.fillRoundedRect(18, 22, 28, 38, 12);
    line(g, c[1]);
    g.strokeRoundedRect(18, 22, 28, 38, 12);
    line(g, c[1], 1.2);
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.moveTo(18, 30 + i * 8);
      g.lineTo(46, 26 + i * 8);
      g.strokePath();
      g.beginPath();
      g.moveTo(18, 26 + i * 8);
      g.lineTo(46, 34 + i * 8);
      g.strokePath();
    }
  },
  /** マンゴー。ふっくらした たまごがた。へたが よこに つく */
  mango: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 38, 44, 36);
    fill(g, 0xe8563f);
    g.fillEllipse(24, 32, 22, 20);
    line(g, c[1]);
    g.strokeEllipse(32, 38, 44, 36);
    stem(g, 34, 20, 8);
    leaf(g, 36, 18, 10);
    shine(g, 40, 44, 5, 3);
  },
  /** ふつうの さかな(いわし・あじ・たい)。よこむき。せびれと しっぽ。bigfish より ほそい */
  fish: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(30, 34, 42, 24);
    g.fillTriangle(52, 34, 62, 22, 62, 46);
    line(g, c[1]);
    g.strokeEllipse(30, 34, 42, 24);
    g.strokeTriangle(52, 34, 62, 22, 62, 46);
    fill(g, 0xfdfdf5);
    g.fillCircle(18, 30, 4);
    fill(g, 0x3a3a3a);
    g.fillCircle(17, 30, 2);
    line(g, c[1], 1.6);
    g.beginPath();
    g.moveTo(28, 24);
    g.lineTo(34, 18);
    g.lineTo(40, 26);
    g.strokePath();
  },
  /** 大きな さかな(まぐろ・かつお・さけ)。よこむき。fish より 体が ぶあつく しっぽが 大きい */
  bigfish: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(29, 34, 50, 30);
    g.fillTriangle(51, 34, 61, 18, 61, 50);
    fill(g, 0xf8f5ea);
    g.fillEllipse(29, 42, 42, 12);
    line(g, c[1]);
    g.strokeEllipse(29, 34, 50, 30);
    fill(g, 0xfdfdf5);
    g.fillCircle(15, 30, 4.5);
    fill(g, 0x2c2c33);
    g.fillCircle(14, 30, 2.2);
  },
  /** ふぐ。まるく ふくらんだ 体と ちいさな ひれ、とげ */
  pufferfish: (g, c) => {
    fill(g, c[0]);
    g.fillCircle(30, 34, 22);
    g.fillTriangle(50, 34, 62, 24, 60, 46);
    line(g, c[1]);
    g.strokeCircle(30, 34, 22);
    fill(g, c[1]);
    for (const [x, y] of [
      [24, 20],
      [36, 20],
      [20, 32],
      [40, 34],
      [30, 46],
    ] as const)
      g.fillTriangle(x - 3, y, x + 3, y, x, y - 6);
    fill(g, 0xfdfdf5);
    g.fillCircle(18, 30, 5);
    fill(g, 0x2c2c33);
    g.fillCircle(17, 30, 2.4);
  },
  /** うなぎ・あなご。なめらかな S字の 体に せびれと あたま を つけて
     「ぼう」ではなく「さかな」に 見える ように する */
  eel: (g, c) => {
    const body: [number, number][] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      body.push([8 + t * 48, 44 - Math.sin(t * Math.PI * 1.15) * 22 + t * 4]);
    }
    const trace = (): void => {
      g.beginPath();
      g.moveTo(body[0][0], body[0][1]);
      for (const [x, y] of body.slice(1)) g.lineTo(x, y);
      g.strokePath();
    };
    // せびれ(体より 少し こい色で うしろに)
    line(g, c[1], 15);
    trace();
    line(g, c[0], 11);
    trace();
    // しっぽ(左)を とがらせる
    fill(g, c[0]);
    g.fillTriangle(4, 40, 14, 38, 12, 50);
    line(g, c[1], 1.8);
    g.strokeTriangle(4, 40, 14, 38, 12, 50);
    // あたま(右)
    const [hx, hy] = body[body.length - 1];
    fill(g, c[0]);
    g.fillEllipse(hx, hy, 17, 13);
    line(g, c[1], 1.8);
    g.strokeEllipse(hx, hy, 17, 13);
    fill(g, 0xfdfdf5);
    g.fillCircle(hx + 3, hy - 2, 3.2);
    fill(g, 0x2c2c33);
    g.fillCircle(hx + 4, hy - 2, 1.8);
    line(g, c[1], 1.6);
    g.beginPath();
    g.moveTo(hx + 1, hy + 4);
    g.lineTo(hx + 7, hy + 4);
    g.strokePath();
  },
  /** かい(かき・ほたて・しじみ)。おうぎがたの かいがらに すじ */
  shell: (g, c) => {
    fill(g, c[0]);
    g.slice(32, 44, 24, Math.PI, Math.PI * 2, false);
    g.fillPath();
    line(g, c[1]);
    g.beginPath();
    g.arc(32, 44, 24, Math.PI, Math.PI * 2, false);
    g.strokePath();
    line(g, c[1], 1.4);
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(32, 44);
      g.lineTo(32 + i * 7.5, 22);
      g.strokePath();
    }
    fill(g, c[1]);
    g.fillRect(10, 43, 44, 3);
  },
  /** しんじゅ。かいを こく して、たまが 白く 浮くように する */
  pearl: (g, c) => {
    // ひらいた かい(したがわ)
    fill(g, 0xbdb49f);
    g.slice(32, 52, 28, Math.PI, Math.PI * 2, false);
    g.fillPath();
    line(g, 0x7e7563, 2.4);
    g.beginPath();
    g.arc(32, 52, 28, Math.PI, Math.PI * 2, false);
    g.strokePath();
    line(g, 0x7e7563, 1.4);
    for (let i = -2; i <= 2; i++) {
      g.beginPath();
      g.moveTo(32, 52);
      g.lineTo(32 + i * 11, 27);
      g.strokePath();
    }
    // たま
    fill(g, c[0]);
    g.fillCircle(32, 30, 14);
    line(g, c[1], 2.4);
    g.strokeCircle(32, 30, 14);
    shine(g, 27, 25, 5, 4);
  },
  /** かに。ひらたい こうらと はさみ 2つ、あし 6本。正面から */
  crab: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 36, 34, 24);
    line(g, c[1]);
    g.strokeEllipse(32, 36, 34, 24);
    line(g, c[0], 5);
    for (const [x1, y1, x2, y2] of [
      [18, 30, 8, 18],
      [46, 30, 56, 18],
      [16, 40, 6, 46],
      [48, 40, 58, 46],
    ] as const) {
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.strokePath();
    }
    fill(g, c[0]);
    g.fillTriangle(4, 14, 14, 16, 6, 24);
    g.fillTriangle(60, 14, 50, 16, 58, 24);
    fill(g, 0xfdfdf5);
    g.fillCircle(26, 32, 3.4);
    g.fillCircle(38, 32, 3.4);
    fill(g, 0x2c2c33);
    g.fillCircle(26, 32, 1.8);
    g.fillCircle(38, 32, 1.8);
  },
  /** えび。まるまった 体+しっぽの おうぎ+ひげ で 「えび」と わかる ように する */
  shrimp: (g, c) => {
    // からだ: あたま(左うえ)から しっぽ(右うえ)へ まるまった カーブ。
    // ふしめの ある からと、おうぎの しっぽ、ひげ で 「えび」と わかる ように する
    const spine: [number, number][] = [];
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI * 1.05 - (i / 16) * Math.PI * 1.15;
      spine.push([31 + Math.cos(a) * 18, 32 + Math.sin(a) * 18]);
    }
    const trace = (): void => {
      g.beginPath();
      g.moveTo(spine[0][0], spine[0][1]);
      for (const [x, y] of spine.slice(1)) g.lineTo(x, y);
      g.strokePath();
    };
    line(g, c[1], 21);
    trace();
    line(g, c[0], 16);
    trace();
    // からの ふしめ(まんなかから そとへ 放射)
    line(g, c[1], 1.8);
    for (let i = 3; i <= 13; i += 2) {
      const [x, y] = spine[i];
      g.beginPath();
      g.moveTo(32 + (x - 32) * 0.6, 32 + (y - 32) * 0.6);
      g.lineTo(32 + (x - 32) * 1.38, 32 + (y - 32) * 1.38);
      g.strokePath();
    }
    // しっぽの おうぎ(3まい)
    const [tx, ty] = spine[spine.length - 1];
    for (const [dx, dy] of [
      [10, -9],
      [13, -1],
      [10, 7],
    ] as const) {
      fill(g, c[0]);
      g.fillTriangle(tx - 2, ty + 3, tx + dx, ty + dy, tx + dx * 0.5, ty + dy + 5);
      line(g, c[1], 1.6);
      g.strokeTriangle(tx - 2, ty + 3, tx + dx, ty + dy, tx + dx * 0.5, ty + dy + 5);
    }
    // あたま(左うえ)を ふとらせて、め と ひげ を つける
    const [hx, hy] = spine[0];
    fill(g, c[0]);
    g.fillEllipse(hx - 1, hy + 3, 20, 17);
    line(g, c[1], 2);
    g.strokeEllipse(hx - 1, hy + 3, 20, 17);
    line(g, c[1], 2);
    for (const [ex, ey] of [
      [hx - 10, hy - 8],
      [hx - 6, hy - 13],
    ] as const) {
      g.beginPath();
      g.moveTo(hx - 4, hy - 1);
      g.lineTo(ex, ey);
      g.strokePath();
    }
    fill(g, 0xfdfdf5);
    g.fillCircle(hx - 3, hy + 2, 3.6);
    fill(g, 0x2c2c33);
    g.fillCircle(hx - 4, hy + 2, 2);
  },
  /** いか。さんかくの あたまと ひれ、あしが 何本か */
  squid: (g, c) => {
    fill(g, c[0]);
    g.fillTriangle(32, 4, 16, 32, 48, 32);
    g.fillEllipse(32, 34, 30, 20);
    line(g, c[1]);
    g.strokeTriangle(32, 4, 16, 32, 48, 32);
    line(g, c[0], 4);
    for (const dx of [-10, -4, 4, 10]) {
      g.beginPath();
      g.moveTo(32 + dx, 42);
      g.lineTo(32 + dx * 1.5, 58);
      g.strokePath();
    }
    fill(g, 0x2c2c33);
    g.fillCircle(26, 32, 2);
    g.fillCircle(38, 32, 2);
  },
  /** たこ。まるい あたまと、見えている あし 3〜4本 */
  octopus: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 26, 36, 32);
    line(g, c[1]);
    g.strokeEllipse(32, 26, 36, 32);
    line(g, c[0], 6);
    for (const dx of [-14, -5, 5, 14]) {
      g.beginPath();
      g.moveTo(32 + dx, 38);
      g.lineTo(32 + dx * 1.6, 52);
      g.lineTo(32 + dx * 1.2, 58);
      g.strokePath();
    }
    fill(g, 0xfdfdf5);
    g.fillCircle(25, 24, 4);
    g.fillCircle(39, 24, 4);
    fill(g, 0x2c2c33);
    g.fillCircle(25, 24, 2);
    g.fillCircle(39, 24, 2);
  },
  /** かいそう(わかめ・こんぶ・のり)。ゆらゆらした ながい は 2まい */
  seaweed: (g, c) => {
    line(g, c[0], 7);
    for (const x of [20, 32, 44]) {
      g.beginPath();
      g.moveTo(x, 58);
      g.lineTo(x - 6, 44);
      g.lineTo(x + 5, 30);
      g.lineTo(x - 3, 14);
      g.strokePath();
    }
    line(g, c[1], 1.6);
    for (const x of [20, 32, 44]) {
      g.beginPath();
      g.moveTo(x, 58);
      g.lineTo(x - 6, 44);
      g.lineTo(x + 5, 30);
      g.lineTo(x - 3, 14);
      g.strokePath();
    }
  },
  /** うし。まえは 「まるに ぶちが 2つ」で なにか わからなかった。
     かおを 大きく して、つの・みみ・はなを はっきり させる */
  cow: (g, c) => {
    const EDGE = 0x6f6152;
    // からだ(よこ向き)+あし
    fill(g, 0xfaf6ec);
    g.fillEllipse(34, 40, 44, 26);
    line(g, EDGE);
    g.strokeEllipse(34, 40, 44, 26);
    for (const [w, col] of [
      [8, EDGE],
      [4.5, 0xfaf6ec],
    ] as const) {
      line(g, col, w);
      for (const x of [22, 31, 42, 50]) {
        g.beginPath();
        g.moveTo(x, 46);
        g.lineTo(x, 57);
        g.strokePath();
      }
    }
    // ぶち(c の いろ)
    fill(g, c[0]);
    g.fillEllipse(26, 36, 15, 13);
    g.fillEllipse(45, 44, 13, 11);
    // かお
    fill(g, 0xfaf6ec);
    g.fillEllipse(20, 20, 26, 22);
    line(g, EDGE, 2.2);
    g.strokeEllipse(20, 20, 26, 22);
    // つの
    fill(g, 0xe0d6c0);
    for (const s of [-1, 1]) {
      g.fillTriangle(20 + s * 9, 11, 20 + s * 15, 4, 20 + s * 16, 13);
      line(g, EDGE, 1.6);
      g.strokeTriangle(20 + s * 9, 11, 20 + s * 15, 4, 20 + s * 16, 13);
    }
    // はな
    fill(g, 0xf0b8c0);
    g.fillEllipse(20, 27, 16, 10);
    line(g, EDGE, 1.6);
    g.strokeEllipse(20, 27, 16, 10);
    fill(g, 0x8a6a62);
    g.fillCircle(16, 27, 1.8);
    g.fillCircle(24, 27, 1.8);
    // め
    fill(g, 0x2c2c33);
    g.fillCircle(14, 17, 2.2);
    g.fillCircle(26, 17, 2.2);
  },
  /** ぎゅうにゅう。上が ひらいた 紙パック。cup(ゆのみ)とは 見わける */
  milk: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(20, 18, 24, 40, 4);
    g.fillTriangle(20, 18, 44, 18, 32, 6);
    line(g, OUTLINE_SOFT);
    g.strokeRoundedRect(20, 18, 24, 40, 4);
    fill(g, 0x76c4e8);
    g.fillRect(24, 30, 16, 8);
  },
  /** たまご 1つ。たてに ながい だえん */
  egg: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 38, 34, 42);
    line(g, c[1]);
    g.strokeEllipse(32, 38, 34, 42);
    g.fillStyle(0xd8b483, 0.6);
    for (const [x, y] of [
      [26, 30],
      [36, 36],
      [30, 46],
    ] as const)
      g.fillCircle(x, y, 2.6);
    shine(g, 25, 28, 4, 3);
  },
  /** きいと・まゆ(いとまき)。まえの 絵は うすい 円だけで なにか わからなかった */
  silk: (g, c) => {
    // まきしんの じく(うえと したの つば)
    fill(g, 0xb59253);
    g.fillRoundedRect(14, 8, 36, 8, 3);
    g.fillRoundedRect(14, 48, 36, 8, 3);
    line(g, 0x7d6335, 2);
    g.strokeRoundedRect(14, 8, 36, 8, 3);
    g.strokeRoundedRect(14, 48, 36, 8, 3);
    // まきついた いと
    fill(g, c[0]);
    g.fillRect(18, 15, 28, 34);
    line(g, c[1], 2.4);
    g.strokeRect(18, 15, 28, 34);
    line(g, c[1], 1.4);
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(18, 18 + i * 5.6);
      g.lineTo(46, 15 + i * 5.6);
      g.strokePath();
    }
    // ほどけた いとの さき
    line(g, c[1], 2);
    g.beginPath();
    g.moveTo(46, 26);
    g.lineTo(56, 32);
    g.lineTo(50, 40);
    g.strokePath();
  },
  /** みずの しずく。うえが とがって したが まるい */
  drop: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(32, 8);
    g.lineTo(50, 38);
    g.arc(32, 40, 18, 0, Math.PI, false);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    shine(g, 26, 38, 5, 7);
  },
  /** しお。もりあがった しろい やまと、ちいさな つぶ */
  salt: (g, c) => {
    fill(g, 0xf2ede0);
    g.fillTriangle(32, 16, 12, 52, 52, 52);
    line(g, OUTLINE_SOFT);
    g.strokeTriangle(32, 16, 12, 52, 52, 52);
    fill(g, c[0]);
    for (const [x, y] of [
      [28, 34],
      [36, 40],
      [24, 46],
      [40, 48],
      [32, 26],
    ] as const)
      g.fillRect(x, y, 4, 4);
  },
  /** ねんどの かたまり。きれいな まるでは なく ゆがんだ かたまり。てで つかんだ あとが ある */
  clay: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 42, 44, 26);
    g.fillEllipse(32, 34, 32, 22);
    line(g, c[1]);
    g.strokeEllipse(32, 42, 44, 26);
    g.fillStyle(c[1], 0.4);
    g.fillEllipse(32, 30, 20, 8);
  },
  /** いし。かどの ある ちいさな かたまり。rock より 小さく たいらな 面が ある */
  stone: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(6, 40);
    g.lineTo(19, 14);
    g.lineTo(46, 10);
    g.lineTo(58, 34);
    g.lineTo(44, 56);
    g.lineTo(16, 54);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    g.fillStyle(0xffffff, 0.28);
    g.fillTriangle(20, 17, 45, 13, 29, 32);
  },
  /** ふかい わん・どんぶり。中身が すこし もりあがって 見える。plate(たいらな さら)とは 見わける */
  bowl: (g, c) => {
    fill(g, 0xf6efdc);
    g.fillEllipse(32, 30, 42, 16);
    fill(g, c[0]);
    g.slice(32, 30, 22, 0, Math.PI, false);
    g.fillPath();
    line(g, c[1]);
    g.beginPath();
    g.arc(32, 30, 22, 0, Math.PI, false);
    g.strokePath();
    line(g, OUTLINE_SOFT, 2);
    g.strokeEllipse(32, 30, 42, 16);
  },
  /** たいらな さら。よこから 見た あさい さら。bowl(ふかい わん)とは 見わける */
  plate: (g, c) => {
    fill(g, 0xf6efdc);
    g.fillEllipse(32, 40, 52, 22);
    line(g, OUTLINE_SOFT);
    g.strokeEllipse(32, 40, 52, 22);
    fill(g, c[0]);
    g.fillEllipse(32, 36, 32, 14);
    line(g, c[1], 1.8);
    g.strokeEllipse(32, 36, 32, 14);
  },
  /** ゆのみ(おちゃ・ジュース)。ほかの アイコンと 同じ 大きさに なる ように 64枠を つかう */
  cup: (g, c) => {
    fill(g, 0xf6efdc);
    g.beginPath();
    g.moveTo(15, 18);
    g.lineTo(49, 18);
    g.lineTo(44, 54);
    g.lineTo(20, 54);
    g.closePath();
    g.fillPath();
    line(g, OUTLINE_SOFT);
    g.strokePath();
    fill(g, c[0]);
    g.fillEllipse(32, 21, 32, 11);
    line(g, c[1], 1.8);
    g.strokeEllipse(32, 21, 32, 11);
    g.fillStyle(0xffffff, 0.5);
    g.fillEllipse(23, 36, 4, 12);
    line(g, OUTLINE_SOFT, 2);
    g.beginPath();
    g.moveTo(18, 52);
    g.lineTo(46, 52);
    g.strokePath();
  },
  /** くびの ある びん(ジュース・しょうゆ・さけ)。中身の 色が ほんたい色。jar(ひろくちの びん)とは 見わける */
  bottle: (g, c) => {
    fill(g, 0xeae3cf);
    g.fillRoundedRect(24, 10, 14, 12, 3);
    fill(g, c[0]);
    g.fillRoundedRect(20, 20, 22, 38, 7);
    line(g, c[1]);
    g.strokeRoundedRect(20, 20, 22, 38, 7);
    fill(g, 0xfff8e0);
    g.fillRect(22, 34, 18, 10);
  },
  /** ひろくちの びん(ジャム・つけもの)。大きな ふたが めじるし。bottle(くびの ある びん)とは 見わける */
  jar: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(13, 20, 38, 38, 7);
    line(g, c[1]);
    g.strokeRoundedRect(13, 20, 38, 38, 7);
    fill(g, 0xd8b483);
    g.fillRoundedRect(9, 10, 46, 13, 5);
    line(g, 0xa8865a, 2.2);
    g.strokeRoundedRect(9, 10, 46, 13, 5);
    g.fillStyle(0xffffff, 0.4);
    g.fillEllipse(22, 34, 6, 12);
  },
  /** わがし。まるい もちの 中に あんこが 見える。cake(ようがし)とは 見わける */
  sweet: (g, c) => {
    // くし(こい 木の いろ+ふち。うすいと だんごが 3つの まるに 見える)
    line(g, 0x8f7440, 6);
    g.beginPath();
    g.moveTo(8, 50);
    g.lineTo(58, 22);
    g.strokePath();
    line(g, 0xd8b483, 3.4);
    g.beginPath();
    g.moveTo(8, 50);
    g.lineTo(58, 22);
    g.strokePath();
    for (const [x, y] of [
      [20, 43],
      [33, 36],
      [46, 29],
    ] as const) {
      fill(g, c[0]);
      g.fillCircle(x, y, 10);
      line(g, c[1], 2);
      g.strokeCircle(x, y, 10);
      shine(g, x - 3, y - 4, 3, 2);
    }
  },
  /** ケーキ 1きれ。よこから 見た さんかく。上に みが 1つ */
  cake: (g, c) => {
    fill(g, 0xf6e7c4);
    g.fillRoundedRect(9, 30, 46, 26, 5);
    line(g, OUTLINE_SOFT);
    g.strokeRoundedRect(9, 30, 46, 26, 5);
    line(g, OUTLINE_SOFT, 1.6);
    g.beginPath();
    g.moveTo(10, 43);
    g.lineTo(54, 43);
    g.strokePath();
    fill(g, c[0]);
    g.fillRoundedRect(7, 18, 50, 16, 7);
    line(g, c[1]);
    g.strokeRoundedRect(7, 18, 50, 16, 7);
    fill(g, 0xe0584f);
    g.fillCircle(32, 14, 6.5);
    line(g, 0xa83a33, 1.8);
    g.strokeCircle(32, 14, 6.5);
  },
  /** めん(うどん・そば・ラーメン)。どんぶりから めんが もちあがって いる */
  noodle: (g, c) => {
    fill(g, 0xf6efdc);
    g.fillEllipse(32, 36, 46, 22);
    line(g, OUTLINE_SOFT);
    g.strokeEllipse(32, 36, 46, 22);
    line(g, c[0], 3.4);
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.moveTo(16 + i * 8, 30);
      g.lineTo(18 + i * 8, 42);
      g.strokePath();
    }
    fill(g, 0x9a6b42);
    g.fillRect(40, 14, 4, 22);
    g.fillRect(46, 14, 4, 22);
  },
  /** くし(やきとり・だんご)。まっすぐな くしに たまが 3つ */
  skewer: (g, c) => {
    fill(g, 0xd8b483);
    g.fillRect(30, 8, 4, 50);
    for (const y of [22, 34, 46]) {
      fill(g, c[0]);
      g.fillRoundedRect(20, y - 7, 24, 14, 6);
      line(g, c[1], 1.8);
      g.strokeRoundedRect(20, y - 7, 24, 14, 6);
    }
  },
  /** おにぎり。ごはんは いつも 白(c で ぬると のりと 見わけが つかない)。
     いろは「うえに のせた ぐ」に つかうので、ぐの ちがいで 見わけられる */
  onigiri: (g, c) => {
    const tri: [number, number][] = [
      [32, 8],
      [57, 52],
      [7, 52],
    ];
    fill(g, 0xfaf6ec);
    g.fillTriangle(tri[0][0], tri[0][1], tri[1][0], tri[1][1], tri[2][0], tri[2][1]);
    line(g, OUTLINE_SOFT, 2.6);
    g.strokeTriangle(tri[0][0], tri[0][1], tri[1][0], tri[1][1], tri[2][0], tri[2][1]);
    // のり: したの へんに ぴったり そわせた 台形(まんなかに ういた しかくは
    // 「はこ」に 見えて しまうので さける)
    fill(g, 0x33422f);
    g.beginPath();
    g.moveTo(15, 38);
    g.lineTo(49, 38);
    g.lineTo(56, 51);
    g.lineTo(8, 51);
    g.closePath();
    g.fillPath();
    line(g, 0x1f2a1c, 1.8);
    g.strokePath();
    // ぐ(いろの ちがいは ここで 見せる)
    fill(g, c[0]);
    g.fillCircle(32, 27, 7.5);
    line(g, c[1], 1.8);
    g.strokeCircle(32, 27, 7.5);
  },
  /** せんべい。まるく ひらたい やきもの。やきめの もようが すこし */
  senbei: (g, c) => {
    fill(g, c[0]);
    g.fillCircle(32, 36, 22);
    line(g, c[1]);
    g.strokeCircle(32, 36, 22);
    fill(g, 0x3a4a3a);
    g.fillRect(20, 30, 24, 7);
    g.fillStyle(c[1], 0.4);
    for (const [x, y] of [
      [24, 44],
      [38, 46],
      [32, 24],
    ] as const)
      g.fillCircle(x, y, 2);
  },
  /** なべ。ふたと とっての ある なべ。よこから */
  pot: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(14, 28, 36, 24, 8);
    line(g, c[1]);
    g.strokeRoundedRect(14, 28, 36, 24, 8);
    fill(g, 0xd8cdb0);
    g.fillEllipse(32, 28, 42, 12);
    line(g, OUTLINE_SOFT, 2);
    g.strokeEllipse(32, 28, 42, 12);
    g.fillStyle(0xffffff, 0.5);
    g.fillEllipse(24, 20, 10, 5);
    g.fillEllipse(38, 16, 8, 4);
  },
  /** やきもの(とうき)。ろくろで つくった つぼ。くびが すこし しまって いる */
  pottery: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 38, 48, 40);
    g.fillRect(22, 10, 20, 14);
    line(g, c[1]);
    g.strokeEllipse(32, 38, 48, 40);
    g.strokeRect(22, 10, 20, 14);
    fill(g, c[1]);
    g.fillEllipse(32, 11, 20, 6);
    g.fillStyle(0xffffff, 0.35);
    g.fillEllipse(21, 32, 9, 14);
  },
  /** ぬの・わた の ぬの(たたんだ ぬの)。towel(ほしてある タオル)とは
     かたちで 見わける: cloth は かどが めくれた いちまい */
  cloth: (g, c) => {
    // たたんだ ぬの(しかくに ななめの おりめ)。ぺらの しかくだと
    // カード・towel と 見わけが つかない ので かどを めくる
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(8, 16);
    g.lineTo(56, 12);
    g.lineTo(56, 46);
    g.lineTo(8, 52);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    // おりめ 1本だけ(たてと よこ 両方 ひくと「まどガラス」に 見える)
    line(g, c[1], 1.8);
    g.beginPath();
    g.moveTo(8, 34);
    g.lineTo(56, 28);
    g.strokePath();
    // めくれた かど(うらがわが 見える)
    fill(g, c[1]);
    g.fillTriangle(56, 46, 38, 49, 52, 58);
    line(g, c[1], 2);
    g.strokeTriangle(56, 46, 38, 49, 52, 58);
    g.fillStyle(0xffffff, 0.3);
    g.fillRect(10, 18, 44, 4);
  },
  /** わりばし(きの こうげいひん)。めがね・コースターには つかわない
     (それぞれ glasses / mat が ある) */
  craft: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(18, 8, 8, 46, 4);
    g.fillRoundedRect(36, 8, 8, 46, 4);
    line(g, c[1], 2);
    g.strokeRoundedRect(18, 8, 8, 46, 4);
    g.strokeRoundedRect(36, 8, 8, 46, 4);
    // はしぶくろ(おびがみ)
    fill(g, 0xc9a86a);
    g.fillRoundedRect(12, 42, 40, 12, 3);
    line(g, 0x8f7440, 2);
    g.strokeRoundedRect(12, 42, 40, 12, 3);
  },
  /** めがね(さばえの めがね) */
  glasses: (g, c) => {
    line(g, c[1], 3);
    // つる
    g.beginPath();
    g.moveTo(6, 24);
    g.lineTo(14, 30);
    g.strokePath();
    g.beginPath();
    g.moveTo(58, 24);
    g.lineTo(50, 30);
    g.strokePath();
    // はしら(まんなか)
    g.beginPath();
    g.moveTo(27, 32);
    g.lineTo(37, 32);
    g.strokePath();
    for (const cx of [18, 46]) {
      g.fillStyle(0xffffff, 0.55);
      g.fillEllipse(cx, 34, 22, 20);
      line(g, c[1], 3.4);
      g.strokeEllipse(cx, 34, 22, 20);
    }
  },
  /** コースター・ござ(いぐさの あみもの) */
  mat: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(8, 18, 48, 32, 4);
    line(g, c[1]);
    g.strokeRoundedRect(8, 18, 48, 32, 4);
    // あみめ
    line(g, c[1], 1.6);
    for (let i = 1; i < 6; i++) {
      g.beginPath();
      g.moveTo(8 + i * 8, 18);
      g.lineTo(8 + i * 8, 50);
      g.strokePath();
    }
    for (let i = 1; i < 4; i++) {
      g.beginPath();
      g.moveTo(8, 18 + i * 8);
      g.lineTo(56, 18 + i * 8);
      g.strokePath();
    }
  },
  /** ソフトクリーム(sweet(だんご)で 代用すると 意味が わからない) */
  icecream: (g, c) => {
    // コーン
    fill(g, 0xd8b483);
    g.fillTriangle(32, 60, 18, 30, 46, 30);
    line(g, 0xa8865a, 2.2);
    g.strokeTriangle(32, 60, 18, 30, 46, 30);
    line(g, 0xa8865a, 1.4);
    for (const [x1, y1, x2, y2] of [
      [22, 34, 38, 52],
      [30, 32, 42, 42],
      [26, 52, 42, 34],
    ] as const) {
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.strokePath();
    }
    // まきの クリーム
    fill(g, c[0]);
    g.fillEllipse(32, 30, 32, 14);
    g.fillEllipse(32, 22, 26, 14);
    g.fillEllipse(32, 15, 18, 13);
    g.fillCircle(32, 8, 5);
    line(g, c[1], 2);
    g.strokeEllipse(32, 30, 32, 14);
    g.strokeEllipse(32, 22, 26, 14);
    g.strokeEllipse(32, 15, 18, 13);
    g.strokeCircle(32, 8, 5);
  },
  /** チーズ(あなの あいた くさびがた) */
  cheese: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(6, 44);
    g.lineTo(50, 16);
    g.lineTo(58, 24);
    g.lineTo(58, 40);
    g.lineTo(14, 52);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    // かわ(うわめん)
    line(g, c[1], 1.8);
    g.beginPath();
    g.moveTo(50, 16);
    g.lineTo(50, 30);
    g.lineTo(58, 24);
    g.strokePath();
    g.beginPath();
    g.moveTo(6, 44);
    g.lineTo(50, 30);
    g.strokePath();
    // あな
    g.fillStyle(c[1], 0.55);
    for (const [x, y, r] of [
      [22, 44, 4],
      [36, 40, 3.2],
      [48, 38, 2.6],
    ] as const)
      g.fillCircle(x, y, r);
  },
  /** プリン(カラメルの のった むしがし) */
  pudding: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(12, 24);
    g.lineTo(52, 24);
    g.lineTo(44, 52);
    g.lineTo(20, 52);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    // うえの カラメル
    fill(g, 0x9a6b42);
    g.fillEllipse(32, 24, 40, 12);
    line(g, 0x6d492b, 2);
    g.strokeEllipse(32, 24, 40, 12);
    // したの おさら
    fill(g, 0xf6efdc);
    g.fillEllipse(32, 54, 50, 10);
    line(g, OUTLINE_SOFT, 2);
    g.strokeEllipse(32, 54, 50, 10);
    shine(g, 22, 36, 4, 7);
  },
  /** かまぼこ(いたに のった はんえん) */
  kamaboko: (g, c) => {
    // いた
    fill(g, 0xd8b483);
    g.fillRoundedRect(6, 44, 52, 10, 3);
    line(g, 0xa8865a, 2.2);
    g.strokeRoundedRect(6, 44, 52, 10, 3);
    // み(はんえん)。そとは 白、ふちが c の いろ
    fill(g, 0xfaf6ec);
    g.slice(32, 45, 24, Math.PI, Math.PI * 2, false);
    g.fillPath();
    line(g, OUTLINE_SOFT, 2.2);
    g.beginPath();
    g.arc(32, 45, 24, Math.PI, Math.PI * 2, false);
    g.strokePath();
    // かわ(いろの ついた そとがわ)
    line(g, c[0], 5);
    g.beginPath();
    g.arc(32, 45, 21.5, Math.PI * 1.03, Math.PI * 1.97, false);
    g.strokePath();
    line(g, c[1], 1.6);
    g.beginPath();
    g.arc(32, 45, 19, Math.PI * 1.03, Math.PI * 1.97, false);
    g.strokePath();
  },
};

/* たべもの・そざいの かたち(くだもの・やさい・さかな・かいさんぶつ・つくったもの)。
   実物の「なにもの か」で かたちを 選ぶ。おなじ 絵を べつの 意味に 使い回さない */
import { ellipseOutlined, fill, leaf, line, shine, stem, type IconDraw } from './kit';

export const FOOD_ICONS: Record<string, IconDraw> = {
  round: (g, c) => {
    ellipseOutlined(g, 32, 36, 44, 42, c);
    stem(g, 32, 16);
    leaf(g, 33, 15, 11);
    shine(g, 22, 26, 7, 5);
  },
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
  strawberry: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(32, 58);
    g.lineTo(12, 30);
    g.lineTo(20, 18);
    g.lineTo(44, 18);
    g.lineTo(52, 30);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    g.fillStyle(0xfff3c4, 0.95);
    for (const [x, y] of [
      [24, 28],
      [34, 26],
      [42, 32],
      [28, 38],
      [37, 40],
      [32, 48],
    ] as const)
      g.fillCircle(x, y, 1.8);
    fill(g, 0x4a8a3a);
    g.fillTriangle(20, 18, 32, 8, 44, 18);
    line(g, 0x2f6b2a, 1.6);
    g.strokeTriangle(20, 18, 32, 8, 44, 18);
  },
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
  stalk: (g, c) => {
    fill(g, 0xf5f2e0);
    g.fillRoundedRect(26, 30, 12, 28, 5);
    line(g, 0xcfc9ae, 1.6);
    g.strokeRoundedRect(26, 30, 12, 28, 5);
    fill(g, c[0]);
    for (const [dx, dy] of [
      [-10, -6],
      [0, -14],
      [10, -6],
    ] as const) {
      g.beginPath();
      g.moveTo(32, 32);
      g.lineTo(32 + dx, 6 + dy + 10);
      g.lineTo(32 + dx + 5, 34);
      g.closePath();
      g.fillPath();
    }
    line(g, c[1], 1.6);
    g.strokeRoundedRect(26, 30, 12, 28, 5);
  },
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
  pod: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(12, 42);
    g.lineTo(26, 22);
    g.lineTo(50, 26);
    g.lineTo(52, 40);
    g.lineTo(30, 50);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    g.fillStyle(c[1], 0.55);
    for (const [x, y] of [
      [24, 34],
      [34, 33],
      [44, 34],
    ] as const)
      g.fillCircle(x, y, 5);
  },
  pepper: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 40, 30, 34);
    g.fillEllipse(24, 38, 16, 26);
    g.fillEllipse(40, 38, 16, 26);
    line(g, c[1]);
    g.strokeEllipse(32, 40, 30, 34);
    stem(g, 32, 22, 10);
    fill(g, 0x4a8a3a);
    g.fillEllipse(32, 22, 16, 7);
    shine(g, 25, 34, 4, 6);
  },
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
  mushroom: (g, c) => {
    fill(g, 0xf0e6d0);
    g.fillRoundedRect(26, 32, 12, 24, 5);
    line(g, 0xc9bda0, 1.8);
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
  grain: (g, c) => {
    line(g, 0x9a8a4a, 2.6);
    g.beginPath();
    g.moveTo(32, 58);
    g.lineTo(32, 22);
    g.strokePath();
    fill(g, c[0]);
    for (let i = 0; i < 6; i++) {
      const y = 22 + i * 6;
      g.fillEllipse(26, y, 12, 7);
      g.fillEllipse(38, y + 3, 12, 7);
    }
    line(g, c[1], 1.2);
    for (let i = 0; i < 6; i++) {
      const y = 22 + i * 6;
      g.strokeEllipse(26, y, 12, 7);
      g.strokeEllipse(38, y + 3, 12, 7);
    }
  },
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
  lotus: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(14, 24, 36, 26, 12);
    line(g, c[1]);
    g.strokeRoundedRect(14, 24, 36, 26, 12);
    fill(g, 0xfffdf5);
    for (const [x, y] of [
      [23, 32],
      [33, 30],
      [42, 34],
      [26, 42],
      [37, 42],
    ] as const)
      g.fillCircle(x, y, 4);
    line(g, c[1], 1.2);
    for (const [x, y] of [
      [23, 32],
      [33, 30],
      [42, 34],
      [26, 42],
      [37, 42],
    ] as const)
      g.strokeCircle(x, y, 4);
  },
  ginger: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(28, 38, 26, 20);
    g.fillEllipse(42, 30, 16, 14);
    g.fillEllipse(20, 26, 14, 12);
    line(g, c[1]);
    g.strokeEllipse(28, 38, 26, 20);
    g.strokeEllipse(42, 30, 16, 14);
    g.strokeEllipse(20, 26, 14, 12);
  },
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
  nut: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(32, 16);
    g.lineTo(52, 46);
    g.lineTo(12, 46);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    fill(g, 0xf3e2bc);
    g.fillEllipse(32, 46, 40, 12);
    line(g, c[1], 1.6);
    g.strokeEllipse(32, 46, 40, 12);
  },
  tealeaf: (g, c) => {
    for (const [x, y, d] of [
      [24, 40, -1],
      [40, 34, 1],
      [32, 22, 1],
    ] as const) {
      fill(g, c[0]);
      g.beginPath();
      g.moveTo(x, y + 10);
      g.lineTo(x + 14 * d, y - 6);
      g.lineTo(x + 2 * d, y - 14);
      g.lineTo(x - 8 * d, y);
      g.closePath();
      g.fillPath();
      line(g, c[1], 1.8);
      g.strokePath();
    }
  },
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
  bigfish: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(30, 34, 52, 30);
    g.fillTriangle(54, 34, 64, 18, 64, 50);
    fill(g, 0xf8f5ea);
    g.fillEllipse(30, 42, 44, 12);
    line(g, c[1]);
    g.strokeEllipse(30, 34, 52, 30);
    fill(g, 0xfdfdf5);
    g.fillCircle(15, 30, 4.5);
    fill(g, 0x2c2c33);
    g.fillCircle(14, 30, 2.2);
  },
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
  eel: (g, c) => {
    line(g, c[0], 12);
    g.beginPath();
    g.moveTo(10, 46);
    g.lineTo(24, 30);
    g.lineTo(40, 40);
    g.lineTo(56, 20);
    g.strokePath();
    line(g, c[1], 2);
    g.beginPath();
    g.moveTo(10, 46);
    g.lineTo(24, 30);
    g.lineTo(40, 40);
    g.lineTo(56, 20);
    g.strokePath();
    fill(g, 0xfdfdf5);
    g.fillCircle(54, 20, 3.4);
    fill(g, 0x2c2c33);
    g.fillCircle(55, 20, 1.8);
  },
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
  pearl: (g, c) => {
    fill(g, 0xd9d3c4);
    g.slice(32, 46, 26, Math.PI, Math.PI * 2, false);
    g.fillPath();
    line(g, 0xa39c8b);
    g.beginPath();
    g.arc(32, 46, 26, Math.PI, Math.PI * 2, false);
    g.strokePath();
    fill(g, c[0]);
    g.fillCircle(32, 34, 11);
    shine(g, 28, 30, 4, 3);
    line(g, c[1], 1.6);
    g.strokeCircle(32, 34, 11);
  },
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
  shrimp: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(48, 18);
    g.lineTo(52, 32);
    g.lineTo(38, 48);
    g.lineTo(20, 46);
    g.lineTo(14, 34);
    g.lineTo(28, 22);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    line(g, c[1], 1.4);
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(24 + i * 8, 24);
      g.lineTo(30 + i * 8, 46);
      g.strokePath();
    }
    line(g, c[1], 1.6);
    g.beginPath();
    g.moveTo(48, 18);
    g.lineTo(60, 8);
    g.strokePath();
    g.beginPath();
    g.moveTo(48, 20);
    g.lineTo(62, 18);
    g.strokePath();
  },
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
  cow: (g, c) => {
    fill(g, 0xfaf6ec);
    g.fillEllipse(32, 38, 46, 30);
    fill(g, c[0]);
    g.fillEllipse(22, 34, 16, 14);
    g.fillEllipse(42, 42, 14, 12);
    line(g, 0x8a7a62);
    g.strokeEllipse(32, 38, 46, 30);
    fill(g, 0xfaf6ec);
    g.fillEllipse(32, 22, 22, 16);
    line(g, 0x8a7a62, 2);
    g.strokeEllipse(32, 22, 22, 16);
    fill(g, 0xf0b8c0);
    g.fillEllipse(32, 26, 12, 8);
    fill(g, 0x2c2c33);
    g.fillCircle(27, 20, 1.8);
    g.fillCircle(37, 20, 1.8);
    fill(g, 0xe0d6c0);
    g.fillTriangle(20, 14, 26, 18, 18, 20);
    g.fillTriangle(44, 14, 38, 18, 46, 20);
  },
  milk: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(20, 18, 24, 40, 4);
    g.fillTriangle(20, 18, 44, 18, 32, 6);
    line(g, 0xa8a08c);
    g.strokeRoundedRect(20, 18, 24, 40, 4);
    fill(g, 0x76c4e8);
    g.fillRect(24, 30, 16, 8);
  },
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
  silk: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 36, 40, 34);
    line(g, c[1]);
    g.strokeEllipse(32, 36, 40, 34);
    line(g, c[1], 1.6);
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.arc(32, 36, 8 + i * 5, 0.4, 2.6, false);
      g.strokePath();
    }
  },
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
  salt: (g, c) => {
    fill(g, 0xf2ede0);
    g.fillTriangle(32, 16, 12, 52, 52, 52);
    line(g, 0xbfb7a4);
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
  clay: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 42, 44, 26);
    g.fillEllipse(32, 34, 32, 22);
    line(g, c[1]);
    g.strokeEllipse(32, 42, 44, 26);
    g.fillStyle(c[1], 0.4);
    g.fillEllipse(32, 30, 20, 8);
  },
  stone: (g, c) => {
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(14, 40);
    g.lineTo(24, 20);
    g.lineTo(44, 18);
    g.lineTo(52, 36);
    g.lineTo(40, 52);
    g.lineTo(20, 50);
    g.closePath();
    g.fillPath();
    line(g, c[1]);
    g.strokePath();
    g.fillStyle(0xffffff, 0.28);
    g.fillTriangle(24, 22, 42, 20, 30, 34);
  },
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
    line(g, 0xd8cdb0, 2);
    g.strokeEllipse(32, 30, 42, 16);
  },
  plate: (g, c) => {
    fill(g, 0xf6efdc);
    g.fillEllipse(32, 40, 52, 22);
    line(g, 0xcfc4a8);
    g.strokeEllipse(32, 40, 52, 22);
    fill(g, c[0]);
    g.fillEllipse(32, 36, 32, 14);
    line(g, c[1], 1.8);
    g.strokeEllipse(32, 36, 32, 14);
  },
  cup: (g, c) => {
    fill(g, 0xf6efdc);
    g.fillRoundedRect(18, 26, 28, 26, 6);
    line(g, 0xcfc4a8);
    g.strokeRoundedRect(18, 26, 28, 26, 6);
    fill(g, c[0]);
    g.fillEllipse(32, 28, 24, 9);
    line(g, c[1], 1.6);
    g.strokeEllipse(32, 28, 24, 9);
    g.fillStyle(0xffffff, 0.5);
    g.fillEllipse(24, 40, 5, 12);
  },
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
  jar: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(18, 22, 28, 34, 6);
    line(g, c[1]);
    g.strokeRoundedRect(18, 22, 28, 34, 6);
    fill(g, 0xd8b483);
    g.fillRoundedRect(15, 16, 34, 10, 4);
    line(g, 0xa8865a, 2);
    g.strokeRoundedRect(15, 16, 34, 10, 4);
  },
  sweet: (g, c) => {
    line(g, 0xc9a86a, 3);
    g.beginPath();
    g.moveTo(10, 46);
    g.lineTo(54, 26);
    g.strokePath();
    for (const [x, y] of [
      [20, 42],
      [32, 36],
      [44, 30],
    ] as const) {
      fill(g, c[0]);
      g.fillCircle(x, y, 9);
      line(g, c[1], 1.8);
      g.strokeCircle(x, y, 9);
    }
  },
  cake: (g, c) => {
    fill(g, 0xf6e7c4);
    g.fillRoundedRect(16, 32, 32, 22, 4);
    line(g, 0xd0bb90);
    g.strokeRoundedRect(16, 32, 32, 22, 4);
    fill(g, c[0]);
    g.fillRoundedRect(14, 22, 36, 14, 6);
    line(g, c[1]);
    g.strokeRoundedRect(14, 22, 36, 14, 6);
    fill(g, 0xe0584f);
    g.fillCircle(32, 20, 5);
  },
  noodle: (g, c) => {
    fill(g, 0xf6efdc);
    g.fillEllipse(32, 36, 46, 22);
    line(g, 0xcfc4a8);
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
  onigiri: (g, c) => {
    fill(g, c[0]);
    g.fillTriangle(32, 12, 12, 50, 52, 50);
    line(g, 0xcfc4a8);
    g.strokeTriangle(32, 12, 12, 50, 52, 50);
    fill(g, 0x3a4a3a);
    g.fillRect(22, 36, 20, 14);
  },
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
  pot: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(14, 28, 36, 24, 8);
    line(g, c[1]);
    g.strokeRoundedRect(14, 28, 36, 24, 8);
    fill(g, 0xd8cdb0);
    g.fillEllipse(32, 28, 42, 12);
    line(g, 0xa89c80, 2);
    g.strokeEllipse(32, 28, 42, 12);
    g.fillStyle(0xffffff, 0.5);
    g.fillEllipse(24, 20, 10, 5);
    g.fillEllipse(38, 16, 8, 4);
  },
  pottery: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(32, 40, 36, 30);
    g.fillRect(24, 18, 16, 12);
    line(g, c[1]);
    g.strokeEllipse(32, 40, 36, 30);
    g.strokeRect(24, 18, 16, 12);
    g.fillStyle(0xffffff, 0.35);
    g.fillEllipse(24, 34, 8, 12);
  },
  cloth: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(12, 18, 40, 34, 4);
    line(g, c[1]);
    g.strokeRoundedRect(12, 18, 40, 34, 4);
    g.fillStyle(0xffffff, 0.45);
    for (let i = 0; i < 3; i++) g.fillRect(12, 24 + i * 10, 40, 3);
    fill(g, c[1]);
    g.fillRect(12, 48, 40, 4);
  },
  craft: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(20, 10, 6, 44, 3);
    g.fillRoundedRect(34, 10, 6, 44, 3);
    line(g, c[1], 1.8);
    g.strokeRoundedRect(20, 10, 6, 44, 3);
    g.strokeRoundedRect(34, 10, 6, 44, 3);
    fill(g, 0xc9a86a);
    g.fillRect(16, 48, 30, 6);
  },
};

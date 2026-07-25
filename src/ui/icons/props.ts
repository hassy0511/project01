/* どうぐ・おまつりの ものの かたち(ちょうちん・たいこ・ふね・たこ・つな…)。
   64x64 の ローカル座標で 描く。いろは c=[ほんたい, こい色] で わたされる。
   ここに あたらしい かたちを 足すときは、この Record に 1つ 関数を 足すだけでよい。 */
import { fill, line, type IconDraw } from './kit';

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
  drum: (g, c) => {
    fill(g, c[0]);
    g.fillRoundedRect(16, 24, 32, 26, 6);
    line(g, c[1]);
    g.strokeRoundedRect(16, 24, 32, 26, 6);
    fill(g, 0xf6e7c4);
    g.fillEllipse(32, 24, 34, 12);
    line(g, 0xbfae8a, 2);
    g.strokeEllipse(32, 24, 34, 12);
    fill(g, 0xd8b483);
    g.fillRect(46, 12, 4, 20);
  },
  shrine: (g, c) => {
    fill(g, c[0]);
    g.fillRect(14, 22, 8, 34);
    g.fillRect(42, 22, 8, 34);
    g.fillRoundedRect(6, 14, 52, 8, 3);
    g.fillRect(12, 26, 40, 6);
    line(g, c[1], 1.8);
    g.strokeRoundedRect(6, 14, 52, 8, 3);
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
  rope: (g, c) => {
    line(g, c[0], 8);
    g.beginPath();
    g.moveTo(6, 40);
    g.lineTo(58, 26);
    g.strokePath();
    line(g, c[1], 1.6);
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.moveTo(8 + i * 8, 44 - i * 1.6);
      g.lineTo(14 + i * 8, 34 - i * 1.6);
      g.strokePath();
    }
  },
};

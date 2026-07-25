/* ひと・いきものの かたち(こども・おどりて・とり・むし・けもの・マスコット)。
   64x64 の ローカル座標で 描く。いろは c=[ほんたい, こい色] で わたされる。
   ここに あたらしい かたちを 足すときは、この Record に 1つ 関数を 足すだけでよい。 */
import { fill, line, type IconDraw } from './kit';

export const ACTOR_ICONS: Record<string, IconDraw> = {
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
  horse: (g, c) => {
    fill(g, c[0]);
    g.fillEllipse(30, 38, 40, 24);
    g.fillEllipse(46, 24, 18, 14);
    line(g, c[1]);
    g.strokeEllipse(30, 38, 40, 24);
    g.strokeEllipse(46, 24, 18, 14);
    fill(g, c[1]);
    g.fillTriangle(42, 16, 48, 20, 40, 22);
    line(g, c[0], 4);
    for (const x of [18, 28, 38, 44]) {
      g.beginPath();
      g.moveTo(x, 48);
      g.lineTo(x, 58);
      g.strokePath();
    }
    fill(g, 0x2c2c33);
    g.fillCircle(50, 24, 2);
  },
  dragon: (g, c) => {
    line(g, c[0], 9);
    g.beginPath();
    g.moveTo(8, 50);
    g.lineTo(22, 38);
    g.lineTo(36, 46);
    g.lineTo(48, 30);
    g.strokePath();
    fill(g, c[0]);
    g.fillEllipse(52, 24, 22, 18);
    line(g, c[1]);
    g.strokeEllipse(52, 24, 22, 18);
    fill(g, 0xf5d84e);
    g.fillCircle(56, 20, 3.4);
    fill(g, 0x2c2c33);
    g.fillCircle(57, 20, 1.8);
    fill(g, c[1]);
    g.fillTriangle(44, 14, 52, 12, 46, 20);
  },
};

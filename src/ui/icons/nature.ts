/* しぜん・けしきの かたち(そら・うみ・やま・はな・ゆき・ひ)。
   64x64 の ローカル座標で 描く。いろは c=[ほんたい, こい色] で わたされる。
   ここに あたらしい かたちを 足すときは、この Record に 1つ 関数を 足すだけでよい。 */
import { fill, line, type IconDraw } from './kit';

export const NATURE_ICONS: Record<string, IconDraw> = {
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
  snow: (g, c) => {
    line(g, c[0], 4);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      g.beginPath();
      g.moveTo(32 - Math.cos(a) * 22, 34 - Math.sin(a) * 22);
      g.lineTo(32 + Math.cos(a) * 22, 34 + Math.sin(a) * 22);
      g.strokePath();
    }
    fill(g, c[0]);
    g.fillCircle(32, 34, 6);
  },
};

/* きごうの かたち(★・やじるし・チェック・かぎ・おと など UI用)。
   64x64 の ローカル座標で 描く。いろは c=[ほんたい, こい色] で わたされる。
   ここに あたらしい かたちを 足すときは、この Record に 1つ 関数を 足すだけでよい。 */
import { fill, line, type IconDraw } from './kit';

export const UI_ICONS: Record<string, IconDraw> = {
  /** ★(できばえの ほし)。from = 中心, とがりは 5つ */
  star: (g, c) => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const r = i % 2 === 0 ? 26 : 11;
      pts.push([32 + Math.cos(a) * r, 33 + Math.sin(a) * r]);
    }
    fill(g, c[0]);
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
    g.closePath();
    g.fillPath();
    line(g, c[1], 2.6);
    g.strokePath();
  },
};

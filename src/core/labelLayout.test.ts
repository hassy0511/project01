import { describe, expect, it } from 'vitest';
import { layoutLabels, leaderNeeded, overlaps, type LabelBounds, type LabelBox } from './labelLayout';

const B: LabelBounds = { minX: 0, minY: 0, maxX: 480, maxY: 800 };
const box = (id: string, x: number, y: number, w = 100, h = 30): LabelBox => ({ id, x, y, w, h, ax: x, ay: y });

describe('地図ラベルの かさなり ほどき', () => {
  it('かさなって いなければ 動かさない', () => {
    const items = [box('a', 100, 100), box('b', 100, 300)];
    const out = layoutLabels(items, B);
    expect(out.map((o) => [o.x, o.y])).toEqual([
      [100, 100],
      [100, 300],
    ]);
  });

  it('まっすぐ かさなった 2つを はなす', () => {
    const out = layoutLabels([box('a', 100, 100), box('b', 100, 108)], B);
    expect(overlaps(out[0], out[1])).toBe(false);
  });

  it('にっぽん地図の 西日本のように こみあっても ぜんぶ ほどける', () => {
    // ちゅうぶ・きんき・ちゅうごく・しこく・きゅうしゅう を まねた 5つ
    const items = [
      box('chubu', 250, 290, 120, 34),
      box('kinki', 246, 312, 110, 34),
      box('chugoku', 160, 300, 130, 34),
      box('shikoku', 200, 350, 110, 34),
      box('kyushu', 120, 352, 150, 34),
    ];
    const out = layoutLabels(items, B);
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        expect(overlaps(out[i], out[j]), `${out[i].id} と ${out[j].id} が かさなった`).toBe(false);
      }
    }
  });

  it('画面の そとには 出さない', () => {
    const narrow: LabelBounds = { minX: 0, minY: 0, maxX: 200, maxY: 200 };
    const out = layoutLabels([box('a', 100, 100, 120, 40), box('b', 100, 104, 120, 40)], narrow);
    for (const o of out) {
      expect(o.x - o.w / 2).toBeGreaterThanOrEqual(-0.001);
      expect(o.x + o.w / 2).toBeLessThanOrEqual(200.001);
      expect(o.y - o.h / 2).toBeGreaterThanOrEqual(-0.001);
      expect(o.y + o.h / 2).toBeLessThanOrEqual(200.001);
    }
  });

  it('さす ばしょは 動かない(引き出し線の さきっぽ)', () => {
    const out = layoutLabels([box('a', 100, 100), box('b', 100, 108)], B);
    expect(out.map((o) => [o.ax, o.ay])).toEqual([
      [100, 100],
      [100, 108],
    ]);
  });

  it('大きく ずれた ラベルにだけ 引き出し線が いる', () => {
    expect(leaderNeeded({ ...box('a', 100, 100), ax: 100, ay: 104 })).toBe(false);
    expect(leaderNeeded({ ...box('a', 100, 100), ax: 100, ay: 160 })).toBe(true);
  });

  it('同じ 入力なら 同じ 結果(乱数を つかわない)', () => {
    const items = [box('a', 100, 100), box('b', 100, 108), box('c', 104, 116)];
    expect(layoutLabels(items, B)).toEqual(layoutLabels(items, B));
  });
});

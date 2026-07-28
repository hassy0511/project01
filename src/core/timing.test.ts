import { describe, expect, it } from 'vitest';
import {
  closestApproach,
  judgeByTime,
  OK_MS,
  OK_RATIO,
  PERFECT_MS,
  PERFECT_RATIO,
  visualOffset,
  windowsFor,
} from './timing';

/** だるまの ふりこ。中心 240 / しんぷく 148 / しゅうき period ms */
const swing = (phase: number, period: number) => (t: number) =>
  240 + Math.sin(phase + (t / period) * Math.PI * 2) * 148;

describe('windowsFor', () => {
  it('おそい しんどうでは 上かぎり(人の 手が とどく ひろさ)に なる', () => {
    const w = windowsFor(3000);
    expect(w.perfectMs).toBe(PERFECT_MS);
    expect(w.okMs).toBe(OK_MS);
  });

  it('はやい しんどうでは 1はくの わりあいで おさえる(あたりまえに しない)', () => {
    // 山車の 曳っかわせ(直した あと): しゅうき1275ms → 1はく 638ms
    const w = windowsFor(638);
    expect(w.okMs).toBeCloseTo(638 * OK_RATIO, 6);
    expect(w.okMs).toBeLessThan(OK_MS);
    expect(w.perfectMs).toBeCloseTo(638 * PERFECT_RATIO, 6);
    expect(w.perfectMs).toBeLessThan(PERFECT_MS);

    // ゆっくり な しんどうでは 上かぎりが かつ
    const slow = windowsFor(2000);
    expect(slow.okMs).toBe(OK_MS);
    expect(slow.perfectMs).toBe(PERFECT_MS);
  });

  it('どんなに はやくても 1はくの はんぶんを こえない(= はずれが のこる)', () => {
    for (const beat of [100, 200, 382, 450, 750, 850]) {
      expect(windowsFor(beat).okMs).toBeLessThan(beat / 2);
    }
  });

  it('へんな 1はく(0・マイナス・NaN)でも こわれない', () => {
    for (const bad of [0, -100, NaN, Infinity]) {
      const w = windowsFor(bad);
      expect(w.okMs).toBe(OK_MS);
      expect(w.perfectMs).toBe(PERFECT_MS);
    }
  });
});

describe('judgeByTime', () => {
  it('ぴったりの 窓は ±PERFECT_MS(おそい しんどう)', () => {
    expect(judgeByTime(0)).toBe('perfect');
    expect(judgeByTime(PERFECT_MS)).toBe('perfect');
    expect(judgeByTime(-PERFECT_MS)).toBe('perfect');
    expect(judgeByTime(PERFECT_MS + 1)).toBe('ok');
  });

  it('いいねの 窓は ±OK_MS。こえたら miss(おそい しんどう)', () => {
    expect(judgeByTime(OK_MS)).toBe('ok');
    expect(judgeByTime(-OK_MS)).toBe('ok');
    expect(judgeByTime(OK_MS + 1)).toBe('miss');
    expect(judgeByTime(-OK_MS - 1)).toBe('miss');
  });

  it('NaN は miss(こわれた 入力で 点を あげない)', () => {
    expect(judgeByTime(NaN)).toBe('miss');
  });

  it('はやい しんどうでは 同じ ずれ でも きびしく なる', () => {
    const fast = windowsFor(638); // ok=127.6ms / perfect=57.4ms
    expect(judgeByTime(120, fast)).toBe('ok');
    expect(judgeByTime(150, fast)).toBe('miss'); // ゆっくり なら ok だった ずれ
    expect(judgeByTime(150)).toBe('ok');
  });

  it('どんな はやさでも 1はくの 4わり だけが あたり(のこりは はずれ)', () => {
    for (const beat of [300, 400, 638, 850, 1200]) {
      const w = windowsFor(beat);
      const hitRate = (2 * w.okMs) / beat;
      expect(hitRate).toBeLessThanOrEqual(0.4 + 1e-9);
      expect(hitRate).toBeGreaterThan(0.2); // かんたんすぎ にも しない
    }
  });
});

describe('closestApproach', () => {
  it('ちょうど 中心に いる ときは dtMs=0', () => {
    // phase=0 → sin=0 → ばしょは 240(=ねらい)
    const a = closestApproach(swing(0, 950), 240);
    expect(a.dtMs).toBe(0);
    expect(a.miss).toBeCloseTo(0, 6);
  });

  it('これから 中心に くる ときは プラスの dtMs を かえす', () => {
    // phase=-π/4 なら つぎの ゼロ点は まえ(+period/8)、その まえは -3period/8
    const period = 950;
    const a = closestApproach(swing(-Math.PI / 4, period), 240);
    expect(a.dtMs).toBeGreaterThan(0);
    expect(a.dtMs).toBeCloseTo(period / 8, -1.5); // 119ms あたり
  });

  it('もう すぎた ときは マイナスの dtMs を かえす', () => {
    const period = 950;
    const a = closestApproach(swing(Math.PI / 4, period), 240);
    expect(a.dtMs).toBeLessThan(0);
    expect(a.dtMs).toBeCloseTo(-period / 8, -1.5);
  });

  it('いちばん ちかづく ばしょ(pos)も かえす', () => {
    const a = closestApproach(swing(-Math.PI / 4, 950), 240);
    // 5ms きざみで しらべる ので、その あいだに すすむ ぶん(約5px)は のこる
    expect(a.miss).toBeLessThan(5);
    expect(a.pos).toBeGreaterThan(235);
    expect(a.pos).toBeLessThan(245);
  });

  it('さいだい かたむきの ときは まえ後 どちらも 同じ ちかさ。いまに ちかい ほうを かえす', () => {
    // phase=-π/2(左の はし)は ±period/4 の 両方が ゼロ点。
    // どちらでも よいが、|dtMs| が ちいさい ほうを えらぶ ように して ある
    const period = 950;
    const a = closestApproach(swing(-Math.PI / 2, period), 240);
    expect(Math.abs(a.dtMs)).toBeCloseTo(period / 4, -1.5);
  });

  it('さがす はんいを せまく しても、ふちを 「あたり」に しない', () => {
    // ★これが もとの 設計ミス。
    //   さがす はんい と はんていの 窓が 同じ だと、ねらいに ぜんぜん
    //   とどいて いない ときも dtMs=±窓 が かえり ok に なって しまう。
    //   SEARCH_MS を ひろく とる ことで ほんとうの 最小点が 見つかる。
    const period = 950;
    const near = closestApproach(swing(-Math.PI / 2, period), 240, 60);
    // せまく さがすと ふちで あきらめる ─ その ときは まだ とどいて いない
    expect(near.miss).toBeGreaterThan(20);
    // ひろく さがせば ほんとうの 最小点(1/4しゅうき 先)が 見つかり、
    // それは OK_MS の 外 なので miss に なる
    const wide = closestApproach(swing(-Math.PI / 2, period), 240);
    expect(judgeByTime(wide.dtMs)).toBe('miss');
  });

  /* ── これが 直したかった こと ──
     px で はんてい すると しゅうきが みじかく なるほど 窓が つぶれるが、
     じかんで はんてい すれば しゅうきに よらず 窓は 一定。 */
  it('しゅうきが かわっても あたる はんいは じかんとして 変わらない', () => {
    for (const period of [1700, 950, 760]) {
      // 中心を すぎた 直後(dt が -OK_MS を すこし こえる)は miss、
      // -OK_MS の 内がわは ok 以上
      const justInside = swing((OK_MS / period) * Math.PI * 2, period);
      const justOutside = swing(((OK_MS + 40) / period) * Math.PI * 2, period);
      expect(judgeByTime(closestApproach(justInside, 240).dtMs)).not.toBe('miss');
      expect(judgeByTime(closestApproach(justOutside, 240).dtMs)).toBe('miss');
    }
  });

  it('px の ずれは しゅうきで 大きく かわる(px はんていが だめな しょうこ)', () => {
    // OK_MS ぶん 早おし した ときの 「px の ずれ」を くらべる
    const miss = (period: number) =>
      Math.abs(swing(-(OK_MS / period) * Math.PI * 2, period)(0) - 240);
    // はやい ほど 同じ じかんの ずれが 大きな px の ずれに なる
    expect(miss(760)).toBeGreaterThan(miss(1700) * 1.5);
    // むかしの OK_PX=36 では、はやい ときは 同じ じかんでも はずれて いた
    expect(miss(760)).toBeGreaterThan(36);
    expect(miss(1700)).toBeLessThan(36 * 3);
  });
});

describe('visualOffset', () => {
  it('ぴったりなら ほぼ 中央、OK ぎりぎりなら maxPx ずれる', () => {
    expect(Math.abs(visualOffset(0, 1, 36))).toBe(0);
    expect(visualOffset(OK_MS, 1, 36)).toBeCloseTo(36, 6);
    expect(visualOffset(-OK_MS, -1, 36)).toBeCloseTo(-36, 6);
  });

  it('ぴったりの 窓の 中は OK ぎりぎりの はんぶん より 小さい ずれ', () => {
    expect(Math.abs(visualOffset(PERFECT_MS, 1, 36))).toBeLessThan(18);
  });

  it('OK を こえても maxPx より 外へは 出ない(とうが とんでいかない)', () => {
    expect(visualOffset(OK_MS * 5, 1, 36)).toBeCloseTo(36, 6);
  });

  it('side が 0 でも みぎ がわに ずれる(0 わり や NaN に しない)', () => {
    expect(visualOffset(OK_MS, 0, 36)).toBeCloseTo(36, 6);
  });
});

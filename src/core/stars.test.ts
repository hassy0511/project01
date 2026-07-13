import { describe, expect, it } from 'vitest';
import {
  calcStars,
  CARE_BONUS_RATIO,
  comboMultiplier,
  harvestYield,
  QUIZ_BONUS_RATIO,
  totalScore,
} from './stars';

const T = { star2: 150, star3: 320 };

describe('calcStars(スコア実力制)', () => {
  it('★3 = star3 以上', () => {
    expect(calcStars(320, T)).toBe(3);
    expect(calcStars(999, T)).toBe(3);
  });

  it('★2 = star2 以上 star3 未満', () => {
    expect(calcStars(150, T)).toBe(2);
    expect(calcStars(319, T)).toBe(2);
  });

  it('0点でも★1(失敗・全損なし=成功保証の床)', () => {
    expect(calcStars(0, T)).toBe(1);
    expect(calcStars(149, T)).toBe(1);
  });
});

describe('totalScore(ボーナス加算)', () => {
  it('クイズ正解 = ★3しきい値の15%を加算', () => {
    expect(totalScore(100, T, { quizCorrect: true })).toBe(100 + Math.round(320 * QUIZ_BONUS_RATIO));
  });

  it('おせわ保険 = ★3しきい値の20%を加算', () => {
    expect(totalScore(100, T, { careDone: true })).toBe(100 + Math.round(320 * CARE_BONUS_RATIO));
  });

  it('両方あれば両方加算・無指定なら素点のまま', () => {
    expect(totalScore(100, T)).toBe(100);
    expect(totalScore(100, T, { quizCorrect: true, careDone: true })).toBe(
      100 + Math.round(320 * QUIZ_BONUS_RATIO) + Math.round(320 * CARE_BONUS_RATIO),
    );
  });

  it('保険+クイズで★の境界を越えられる(あと一歩を救済する保険の役割)', () => {
    const nearMiss = T.star3 - Math.round(T.star3 * QUIZ_BONUS_RATIO);
    expect(calcStars(totalScore(nearMiss, T), T)).toBe(2);
    expect(calcStars(totalScore(nearMiss, T, { quizCorrect: true }), T)).toBe(3);
  });
});

describe('harvestYield / comboMultiplier', () => {
  it('★3は おまけつきで2個、★2/★1は1個', () => {
    expect(harvestYield(3)).toBe(2);
    expect(harvestYield(2)).toBe(1);
    expect(harvestYield(1)).toBe(1);
  });

  it('コンボ倍率: 5ごとに+1、最大×4', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(4)).toBe(1);
    expect(comboMultiplier(5)).toBe(2);
    expect(comboMultiplier(10)).toBe(3);
    expect(comboMultiplier(15)).toBe(4);
    expect(comboMultiplier(99)).toBe(4);
  });
});

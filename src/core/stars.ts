/* =====================================================
   ★(できばえ)計算: アーケードスコア → ★変換。
   ★2/★3 はスコアの実力制。ただし最低★1は必ず貰える(成功保証の床)。
   おせわ保険・クイズ正解はスコアボーナスとして加算される。
   ===================================================== */

/** ★3収穫は yield 2個(おまけ) */
export const STAR3_YIELD = 2;
export const NORMAL_YIELD = 1;

/** クイズ正解ボーナス = ★3しきい値の 15% */
export const QUIZ_BONUS_RATIO = 0.15;
/** おせわ保険ボーナス = ★3しきい値の 20% */
export const CARE_BONUS_RATIO = 0.2;

export interface StarThresholds {
  star2: number;
  star3: number;
}

/** ボーナス込みの最終スコアを計算する */
export function totalScore(
  gameScore: number,
  t: StarThresholds,
  opts: { quizCorrect?: boolean; careDone?: boolean } = {},
): number {
  let score = gameScore;
  if (opts.quizCorrect) score += Math.round(t.star3 * QUIZ_BONUS_RATIO);
  if (opts.careDone) score += Math.round(t.star3 * CARE_BONUS_RATIO);
  return score;
}

/** スコア→★。しきい値未満でも★1(失敗・全損なし=成功保証) */
export function calcStars(score: number, t: StarThresholds): 1 | 2 | 3 {
  return score >= t.star3 ? 3 : score >= t.star2 ? 2 : 1;
}

/** ★3なら おまけつきで2個、それ以外は1個 */
export function harvestYield(stars: number): number {
  return stars === 3 ? STAR3_YIELD : NORMAL_YIELD;
}

/** コンボ数→倍率(5コンボごとに +1、最大×4)。アーケード共通 */
export const COMBO_STEP = 5;
export const COMBO_MAX_MULT = 4;
export function comboMultiplier(combo: number): number {
  return Math.min(COMBO_MAX_MULT, 1 + Math.floor(combo / COMBO_STEP));
}

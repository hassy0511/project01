/* =====================================================
   ★(できばえ)計算: セッション得点 → ★変換(maxBase方式)
   +おせわ保険。失敗・全損は存在しない(成功保証: 最低★1)。
   reference/app.js finishGrow / startSession の得点部分の移植。
   ===================================================== */

/** おせわチャンスをやっておくと収穫時に +1(★の保険) */
export const CARE_BONUS = 1;
/** pluck を9秒以内に全部タップすると 2pt(それ以外の成功は 1pt) */
export const PLUCK_FAST_MS = 9000;
export const PLUCK_FAST_PTS = 2;
export const PLUCK_SLOW_PTS = 1;
/** ★3収穫は yield 2個(おまけ) */
export const STAR3_YIELD = 2;
export const NORMAL_YIELD = 1;

export type SessionStepKind = 'quiz' | 'timing' | 'dig' | 'pluck' | 'whack';

export interface SessionStep {
  kind: SessionStepKind;
}

/** セッション満点: pluck ステップ=2pt、他は各1pt */
export function sessionMaxBase(steps: SessionStep[]): number {
  return steps.reduce((acc, s) => acc + (s.kind === 'pluck' ? PLUCK_FAST_PTS : 1), 0);
}

/** おせわ保険を得点に反映する */
export function sessionPoints(score: number, careDone: boolean): number {
  return score + (careDone ? CARE_BONUS : 0);
}

/** ★3 = 満点以上 / ★2 = 2pt以上 / ★1 = それ以外(0でも★1: 成功保証) */
export function calcStars(pts: number, maxBase: number): 1 | 2 | 3 {
  return pts >= maxBase ? 3 : pts >= 2 ? 2 : 1;
}

/** ★3なら おまけつきで2個、それ以外は1個 */
export function harvestYield(stars: number): number {
  return stars === 3 ? STAR3_YIELD : NORMAL_YIELD;
}

/** pluck の得点: 全部タップまでの経過ミリ秒で決まる */
export function pluckPoints(elapsedMs: number): number {
  return elapsedMs <= PLUCK_FAST_MS ? PLUCK_FAST_PTS : PLUCK_SLOW_PTS;
}

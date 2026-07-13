/* =====================================================
   ★(できばえ)計算: セッション得点 → ★変換(maxBase方式)
   +おせわ保険。失敗・全損は存在しない(成功保証: 最低★1)。
   reference/app.js finishGrow / startSession の得点部分の移植。
   ===================================================== */

/** おせわチャンスをやっておくと収穫時に +1(★の保険) */
export const CARE_BONUS = 1;
/** 収穫系ミニゲーム(swipe/shake/roll/reap/dig)を既定9秒以内に完了すると 2pt(それ以外は 1pt) */
export const DEFAULT_FAST_MS = 9000;
export const FAST_PTS = 2;
export const SLOW_PTS = 1;
/** ★3収穫は yield 2個(おまけ) */
export const STAR3_YIELD = 2;
export const NORMAL_YIELD = 1;

export type SessionStepKind = 'quiz' | 'timing' | 'whack' | 'swipe' | 'shake' | 'roll' | 'reap' | 'dig';

export interface SessionStep {
  kind: SessionStepKind;
}

/** 収穫系ミニゲーム(はやさで2pt/1ptが決まるもの)の種類 */
const HARVEST_KINDS: ReadonlySet<SessionStepKind> = new Set(['swipe', 'shake', 'roll', 'reap', 'dig']);

/** セッション満点: 収穫系ステップ=2pt、クイズ・タイミングは各1pt */
export function sessionMaxBase(steps: SessionStep[]): number {
  return steps.reduce((acc, s) => acc + (HARVEST_KINDS.has(s.kind) ? FAST_PTS : 1), 0);
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

/** 収穫系ミニゲームの得点: 完了までの経過ミリ秒がしきい値以内なら2pt、それ以外は1pt */
export function harvestSpeedPoints(elapsedMs: number, fastThresholdMs: number = DEFAULT_FAST_MS): number {
  return elapsedMs <= fastThresholdMs ? FAST_PTS : SLOW_PTS;
}

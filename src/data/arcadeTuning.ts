/* アーケード型ミニゲームのチューニング値(データ駆動)。
   ★2/★3 のしきい値・制限時間はここを書き換えて調整する(子供テストで再調整前提)。
   engine ごとの得点レート:
     chain/reap: 1個 5pt ×チェーン倍率(最大×4) → 45秒で上手いと 400pt 前後
     catch:      1個 10pt ×コンボ倍率、金の実 30pt → 45秒で 450pt 前後
     mine:       お宝 25-60pt(深いほど高い)+宝石 40pt
     fish:       小 10 / 中 20 / 大 50pt
     flick:      ゴール 25pt + ど真ん中ボーナス 10pt
*/

export type ArcadeEngine = 'chain' | 'reap' | 'catch' | 'flick' | 'mine' | 'fish' | 'care';

export interface ArcadeTuning {
  /** 制限時間(秒) */
  durationSec: number;
  /** ★2 に必要なスコア */
  star2: number;
  /** ★3 に必要なスコア */
  star3: number;
}

export const ARCADE_TUNING: Record<ArcadeEngine, ArcadeTuning> = {
  chain: { durationSec: 45, star2: 150, star3: 320 },
  reap: { durationSec: 45, star2: 150, star3: 320 },
  catch: { durationSec: 45, star2: 180, star3: 360 },
  flick: { durationSec: 40, star2: 75, star3: 160 },
  mine: { durationSec: 40, star2: 120, star3: 260 },
  fish: { durationSec: 45, star2: 100, star3: 220 },
  care: { durationSec: 25, star2: 0, star3: 0 }, // おせわは★なし(careDone のみ)
};

/** 実行時チューニング: E2E テストは timeScale を上げて時間を短縮する(__mqAdmin.fastMode) */
export const runtimeTuning = { timeScale: 1 };

export function scaledDuration(engine: ArcadeEngine): number {
  return ARCADE_TUNING[engine].durationSec / runtimeTuning.timeScale;
}

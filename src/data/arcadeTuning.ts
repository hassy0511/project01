/* アーケード型ミニゲームのチューニング値(データ駆動)。
   ★2/★3 のしきい値・制限時間はここを書き換えて調整する(子供テストで再調整前提)。
   engine ごとの得点レート(概算):
     chain: 食べごろ1個 8pt ×コンボ倍率(最大×4)。上手いと45秒で 700pt 超
     reap:  いね1本 3pt ×コンボ + ひとふでがり 20pt。上手いと 800pt 前後
     catch: 実1個 10pt ×コンボ、金の実 30pt。終盤ラッシュを取り切ると 800pt 超
     mine:  お宝 30pt ×5個/盤 + シャベル残ボーナス。1盤クリア ≈ 170pt
     fish:  小10(1タップ)/中25(2タップ)/大50(3タップ)/ぬし120(4タップ)×コンボ。★3はぬし必須
     flick: ゴール 25pt + ど真ん中 10pt(コンボなし)
     fest:  おきゃくさん12pt×コンボ + はやわざ6pt、とくべつな客30pt。★なし(さいこうスコア制)
*/

export type ArcadeEngine =
  | 'chain'
  | 'reap'
  | 'catch'
  | 'flick'
  | 'mine'
  | 'fish'
  | 'care'
  | 'fest'
  | 'daruma'
  | 'hanabi';

export interface ArcadeTuning {
  /** 制限時間(秒) */
  durationSec: number;
  /** ★2 に必要なスコア */
  star2: number;
  /** ★3 に必要なスコア */
  star3: number;
}

export const ARCADE_TUNING: Record<ArcadeEngine, ArcadeTuning> = {
  chain: { durationSec: 45, star2: 300, star3: 700 },
  reap: { durationSec: 45, star2: 320, star3: 750 },
  catch: { durationSec: 45, star2: 320, star3: 800 },
  flick: { durationSec: 40, star2: 75, star3: 160 },
  mine: { durationSec: 50, star2: 170, star3: 330 },
  fish: { durationSec: 45, star2: 300, star3: 650 },
  care: { durationSec: 25, star2: 0, star3: 0 }, // おせわは★なし(careDone のみ)
  fest: { durationSec: 60, star2: 0, star3: 0 }, // おまつりは★なし(さいこうスコア制)。集大成なので最長
  daruma: { durationSec: 60, star2: 0, star3: 0 }, // だるまいち(ぐんま)
  hanabi: { durationSec: 60, star2: 0, star3: 0 }, // はなび(ちば)
};

/** 実行時チューニング: E2E テストは timeScale を上げて時間を短縮する(__mqAdmin.fastMode) */
export const runtimeTuning = { timeScale: 1 };

export function scaledDuration(engine: ArcadeEngine): number {
  return ARCADE_TUNING[engine].durationSec / runtimeTuning.timeScale;
}

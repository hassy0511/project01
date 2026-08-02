/* ゲーム内の 季節(Phaser 非依存)。docs/DOUGU_SHIN_PLAN.md が 設計の 正。

   実カレンダー連動に しなかった 理由: 旬の 勉強には なるが、ずかんの
   コンプに 最長 1年 かかって しまう(人間と 相談して 2週間に 決定)。
   2週間ごとに はる→なつ→あき→ふゆ と めぐる(8週間で 一年)。

   時計は 端末時刻から 決める 固定関数。セーブに 依存しない ので、
   機種変えや セーブ削除でも 季節は ずれない。 */
import type { Material } from '../data/gameData';

export type Season = 'haru' | 'natsu' | 'aki' | 'fuyu';

export const SEASONS: readonly Season[] = ['haru', 'natsu', 'aki', 'fuyu'];

export const SEASON_LABEL: Record<Season, string> = {
  haru: 'はる',
  natsu: 'なつ',
  aki: 'あき',
  fuyu: 'ふゆ',
};

/** 1つの 季節の ながさ(2週間) */
export const SEASON_LEN_MS = 14 * 24 * 60 * 60 * 1000;

/** 季節の 起点(この日から はる)。
    公開の 時期(2026年8月)に ゲームの 季節が ほんものの 夏と そろう ように、
    2026-07-13 を はるの 1日目に した(7/27 から なつ)。 */
export const SEASON_EPOCH_MS = Date.UTC(2026, 6, 13);

/** いまの 季節 */
export function seasonAt(now: number): Season {
  const idx = Math.floor((now - SEASON_EPOCH_MS) / SEASON_LEN_MS);
  return SEASONS[((idx % 4) + 4) % 4];
}

/** その そざいが いま とれるか(季節の ない そざいは いつでも) */
export function inSeason(m: Pick<Material, 'season'>, now: number): boolean {
  if (!m.season) return true;
  return seasonAt(now) === m.season;
}

/** その 季節が つぎに はじまる まで あと 何日か(きりあげ。いま その季節なら 0) */
export function daysUntilSeason(now: number, season: Season): number {
  if (seasonAt(now) === season) return 0;
  const idx = Math.floor((now - SEASON_EPOCH_MS) / SEASON_LEN_MS);
  for (let i = 1; i <= 4; i++) {
    if (SEASONS[(((idx + i) % 4) + 4) % 4] === season) {
      const start = SEASON_EPOCH_MS + (idx + i) * SEASON_LEN_MS;
      return Math.ceil((start - now) / (24 * 60 * 60 * 1000));
    }
  }
  return 0; // ここには こない(4つ しか ない)
}

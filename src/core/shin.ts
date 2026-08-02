/* しんの めいさん(第2章)の 出しわけ(Phaser 非依存)。docs/DOUGU_SHIN_PLAN.md が 正。

   ひらく 条件: その県の おまつりを 1回 ひらいた(= 県が 晴れた と 同じ ものさし)。
   季節の 決まり:
     - 季節は 「うえる とき」だけ 見る。うえた あとに 季節が かわっても
       そだった ものは ちゃんと しゅうかく できる(枯れ・没収は しない。原則3)
     - 待ちなし(timing/dig)の そざいは 「あそぶ とき」に 見る */
import type { GameData, Material, PrefectureId } from '../data/gameData';
import type { SaveState } from './state';
import { inSeason } from './season';

/** その県の しんの めいさんが ひらいて いるか */
export function isShinOpen(state: SaveState, data: GameData, prefId: PrefectureId): boolean {
  const p = data.prefectures.find((x) => x.id === prefId);
  return p?.festivalId !== undefined && state.fest.includes(p.festivalId);
}

export type MaterialLock = 'shin' | 'season' | null;

/** その そざいを いま そだてはじめ(あそびはじめ)られるか。
    null = だいじょうぶ / 'shin' = おまつりが まだ / 'season' = 季節外れ */
export function materialLock(
  state: SaveState,
  data: GameData,
  m: Material,
  prefId: PrefectureId,
  now: number,
): MaterialLock {
  if (m.shin && !isShinOpen(state, data, prefId)) return 'shin';
  if (!inSeason(m, now)) return 'season';
  return null;
}

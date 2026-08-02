/* きんの ぼんぼり(おまつりの できばえ。Phaser 非依存)。

   おまつりは なんどでも ひらける ように なって いるが、
   2回目からは 「さいこうきろく」の 数字が ふえるだけで、目あてが なかった。
   そこで さいこうスコアに おうじて ぼんぼりの いろを かえる:

     どう(brown) … 1回でも ひらいた
     ぎん(silver) … ぎんの めやすを こえた
     きん(gold)  … きんの めやすを こえた

   ★の しくみとは べつ物に する:
     - ★は そざいの できばえ(1回ごと)。ぼんぼりは おまつりの さいこうきろく
     - 下げは しない。1度 きんに なったら きんの まま(festBest が 下がらない ため)

   めやすの 数字は data/arcadeTuning.ts の ARCADE_TUNING[エンジン] に おく。
   0 の ときは 下の 既定値を つかう(47本 ぜんぶを 手で 調整しなくて よい ように)。
   ★数字は 子供テストで 調整する 前提。docs/DOUGU_SHIN_PLAN.md の P3 */
import type { GameData, Recipe, RecipeId } from '../data/gameData';
import type { SaveState } from './state';

export type BonboriRank = 'none' | 'copper' | 'silver' | 'gold';

/** ぼんぼりの いろ(アイコンの いろ名)。none は 出さない */
export const BONBORI_COLOR: Record<Exclude<BonboriRank, 'none'>, string> = {
  copper: 'brown',
  silver: 'silver',
  gold: 'gold',
};

/** めやすの 既定値。おまつりゲームは どれも 60びょう・1てんが 数〜数十点なので
    しゅうかくの ★2/★3(300前後 / 700前後)と 同じ ものさしに そろえた */
export const FEST_RANK_DEFAULT = { silver: 320, gold: 680 };

export interface RankThresholds {
  silver: number;
  gold: number;
}

/** その おまつりの めやす。0 は 「まだ 調整して いない」= 既定値 */
export function rankThresholds(t: { star2: number; star3: number } | undefined): RankThresholds {
  return {
    silver: t?.star2 || FEST_RANK_DEFAULT.silver,
    gold: t?.star3 || FEST_RANK_DEFAULT.gold,
  };
}

/** さいこうスコア → ぼんぼりの いろ。まだ ひらいて いなければ none */
export function bonboriRank(best: number | undefined, t: RankThresholds): BonboriRank {
  if (best === undefined) return 'none';
  if (best >= t.gold) return 'gold';
  if (best >= t.silver) return 'silver';
  return 'copper';
}

/** きんの ぼんぼりの 数(アクティブ県のうち きんに なった もの) */
export function goldCount(state: SaveState, data: GameData, thresholdsOf: (r: Recipe) => RankThresholds): number {
  return data.prefectures.filter((p) => {
    if (!p.active || !p.festivalId) return false;
    const r = data.recipes.find((x) => x.id === p.festivalId);
    if (!r) return false;
    return bonboriRank(state.festBest[p.festivalId], thresholdsOf(r)) === 'gold';
  }).length;
}

/** 47県 ぜんぶ きんに なったか(さいごの おいわいの 条件) */
export function isAllGold(state: SaveState, data: GameData, thresholdsOf: (r: Recipe) => RankThresholds): boolean {
  const total = data.prefectures.filter((p) => p.active && p.festivalId).length;
  return total > 0 && goldCount(state, data, thresholdsOf) >= total;
}

/** 「ぜんぶ きん」の おいわいを 見た しるし(flags の キー) */
export const ALL_GOLD_FLAG = 'allGoldSeen';

/** おまつりレシピの さいこうきろく(なければ undefined) */
export const bestOf = (state: SaveState, id: RecipeId): number | undefined => state.festBest[id];

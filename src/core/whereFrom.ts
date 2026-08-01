/* 「その ざいりょうは どこへ 行けば とれるか」を 決める(Phaser 非依存の 純ロジック)。

   レシピは 県を またぐ ことが ある。たとえば ちゃんぽん(ながさき)の こむぎ は
   かがわ にしか ない。県ページには なまえと 数しか 出て いなかった ので、
   子どもは 「どこにも ない」と 思って 止まって しまう。

   どこを 見せるか の きめかた:
     ・いま いる 県で とれる なら 何も 出さない(ふだんは じゃまなだけ)
     ・とれる 県が いくつも ある なら いちばん 近い 県。
       エリアの ならび(data.regions)は 北から 南の 順なので、その 番号の
       へだたりを 「近さ」の 目やすに つかう(ちゅうごく から なら きんきが
       となり、かんとうは 遠い) */
import type { GameData, Ingredient, PrefectureId } from '../data/gameData';
import { findMaterial, findPref, findRecipe } from '../data/gameData';

export interface WhereFrom {
  /** いちばん 近い 産地の 県 */
  pref: PrefectureId;
  /** とれる 県の 数(2つ以上なら「ほか」と そえる) */
  count: number;
}

/**
 * その ざいりょうの 行き先。出さなくて よい ときは null。
 * @param atPref いま 見ている 県
 * @param enough もう 足りて いるか(足りて いれば 出さない)
 */
export function whereFrom(
  data: GameData,
  atPref: PrefectureId,
  ing: Ingredient,
  enough: boolean,
): WhereFrom | null {
  // 産地指定(origin)は すでに なまえの よこに 出て いる ので 重ねない
  if (enough || ing.origin) return null;

  const m = findMaterial(data, ing.ref);
  const r = m ? undefined : findRecipe(data, ing.ref);
  const froms = (m ? m.origins : r ? [r.pref] : []).filter((o) => findPref(data, o)?.active);
  if (!froms.length || froms.includes(atPref)) return null;

  const regionNo = (prefId: PrefectureId): number =>
    data.regions.findIndex((rg) => rg.id === findPref(data, prefId)?.region);
  const mine = regionNo(atPref);
  const near = froms.reduce((best, o) =>
    Math.abs(regionNo(o) - mine) < Math.abs(regionNo(best) - mine) ? o : best,
  );
  return { pref: near, count: froms.length };
}

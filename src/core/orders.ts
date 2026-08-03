/* ちゅうもん(注文)の 純ロジック(Phaser 非依存)。

   ねらい: 晴れた 県(おまつりを 1回 ひらいた 県)に 行くと、まちの ひとが
   「じぶんの 県では とれない・つくれない もの」を たのんで くる。
   よその 県へ とりに 行く 旅の 動機に なり、こたえると
     - はじめの 1回: その県の かざり(ずかんの あつめもの)
     - 通算数: 称号(はいたつ みならい → … → でんせつの おとどけやさん)
   が もらえる。

   健全設計の 約束:
     - 締めきりも 失敗も ない。ほうって おいても なにも うしなわない
     - たのまれる ものは かならず 「いま ひらいて いる 県」で 手に入る
       (まだ 行けない エリアの ものは たのまれない) */
import type { GameData, Kazari, PrefectureId } from '../data/gameData';

import type { InvItem, SaveState } from './state';

/** たのまれる 数(そざいは 2こ、レシピの 産物は 1こ) */
export const ORDER_MATERIAL_COUNT = 2;
export const ORDER_RECIPE_COUNT = 1;

export interface Order {
  ref: string;
  count: number;
}

/** その県の ちゅうもんが ひらいて いるか(= 晴れて いるか) */
export function ordersOpen(state: SaveState, data: GameData, prefId: PrefectureId): boolean {
  const p = data.prefectures.find((x) => x.id === prefId);
  return p?.festivalId !== undefined && state.fest.includes(p.festivalId);
}

/** たのめる 品物の 一覧。
    - その県では とれない・つくれない
    - 開拓ずみの 県で 手に入る(いま かならず こたえられる)
    - どうぐ・しんの めいさん・季節限定・おまつりは たのまない
      (むずかしすぎたり、まちぼうけに なったり する ため) */
export function orderCandidates(state: SaveState, data: GameData, prefId: PrefectureId): Order[] {
  const unlocked = new Set(state.unlocked);
  const out: Order[] = [];
  for (const m of data.materials) {
    if (m.dougu || m.shin || m.season) continue;
    if (m.origins.includes(prefId)) continue;
    if (!m.origins.some((o) => unlocked.has(o))) continue;
    out.push({ ref: m.id, count: ORDER_MATERIAL_COUNT });
  }
  for (const r of data.recipes) {
    if (r.tier === 4 || r.type === 'dougu' || r.shin) continue;
    if (r.pref === prefId) continue;
    if (!unlocked.has(r.pref)) continue;
    out.push({ ref: r.id, count: ORDER_RECIPE_COUNT });
  }
  return out;
}

/** ちゅうもんを 1つ 出す(なければ null)。rand は 0〜1(テストでは 固定値を わたす) */
export function generateOrder(
  state: SaveState,
  data: GameData,
  prefId: PrefectureId,
  rand: () => number,
): Order | null {
  const cands = orderCandidates(state, data, prefId);
  if (!cands.length) return null;
  return cands[Math.floor(rand() * cands.length) % cands.length];
}

/** いま ひらいて いる ちゅうもん。なければ つくって セーブ状態に 書く(保存は よびだしがわ) */
export function ensureOrder(
  state: SaveState,
  data: GameData,
  prefId: PrefectureId,
  rand: () => number,
): Order | null {
  if (!ordersOpen(state, data, prefId)) return null;
  const cur = state.orders[prefId];
  if (cur) return cur;
  const next = generateOrder(state, data, prefId, rand);
  if (next) state.orders[prefId] = next;
  return next;
}

/** ちゅうもんに 出せる 手もち(産地は 問わない) */
export function matchOrderItems(inv: InvItem[], order: Order): InvItem[] {
  return inv.filter((it) => it.ref === order.ref);
}

export function canFulfill(state: SaveState, order: Order): boolean {
  return matchOrderItems(state.inv, order).length >= order.count;
}

export interface FulfillResult {
  /** はじめて この県に とどけた ときだけ、その県の かざり */
  kazari?: Kazari;
  /** 通算数が 称号の しきい値を こえた ときだけ、あたらしい 称号 */
  newTitle?: string;
  /** 通算で とどけた 数 */
  total: number;
}

/** ちゅうもんに こたえる: 手もちを 消費(★の ひくい ものから)し、
    かざり・称号を 判定して、つぎの ちゅうもんの ために スロットを あける */
export function fulfillOrder(
  state: SaveState,
  data: GameData,
  prefId: PrefectureId,
  rand: () => number,
): FulfillResult {
  const order = state.orders[prefId];
  if (!order || !canFulfill(state, order)) throw new Error(`fulfillOrder: しなものが たりない ${prefId}`);
  const picked = matchOrderItems(state.inv, order)
    .sort((a, b) => (a.quality ?? 0) - (b.quality ?? 0))
    .slice(0, order.count);
  for (const it of picked) state.inv.splice(state.inv.indexOf(it), 1);

  const prevTotal = totalOrdersDone(state);
  const prevPref = state.orderDone[prefId] ?? 0;
  state.orderDone[prefId] = prevPref + 1;
  delete state.orders[prefId];
  // つぎの ちゅうもんを すぐ 出す(まちぼうけを つくらない)
  ensureOrder(state, data, prefId, rand);

  const total = prevTotal + 1;
  const kazari = prevPref === 0 ? data.kazari.find((k) => k.pref === prefId) : undefined;
  const crossed = data.orderTitles.find((t) => prevTotal < t.count && total >= t.count);
  return { kazari, newTitle: crossed?.name, total };
}

/** 通算で とどけた 数 */
export function totalOrdersDone(state: SaveState): number {
  return Object.values(state.orderDone).reduce((a, b) => a + b, 0);
}

/** いまの 称号(まだ なければ null)と、つぎの 称号までの のこり */
export function currentTitle(
  state: SaveState,
  data: GameData,
): { name: string | null; next?: { name: string; remain: number } } {
  const total = totalOrdersDone(state);
  let name: string | null = null;
  for (const t of data.orderTitles) {
    if (total >= t.count) name = t.name;
  }
  const next = data.orderTitles.find((t) => total < t.count);
  return { name, next: next ? { name: next.name, remain: next.count - total } : undefined };
}

/** もらった かざり(ずかんの あつめもの)。県の ならび順で かえす */
export function earnedKazari(state: SaveState, data: GameData): Kazari[] {
  return data.kazari.filter((k) => (state.orderDone[k.pref] ?? 0) > 0);
}

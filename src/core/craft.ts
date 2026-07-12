/* =====================================================
   クラフトロジック: matchItems / craftable / pickConsume /
   jimoto判定 / クラフト・おまつりの状態適用
   reference/app.js の同名関数の移植。Phaser 非依存。
   ===================================================== */
import type { Ingredient, Recipe } from '../data/gameData';
import type { InvItem, SaveState } from './state';

/** ref の命名規則: そざい="m〜" / レシピ="r〜"(じもと判定は そざいのみ対象) */
export const isMaterialRef = (ref: string): boolean => ref.startsWith('m');

/** 材料条件(産地指定・★指定)を満たす手持ちを列挙する */
export function matchItems(inv: InvItem[], ing: Ingredient): InvItem[] {
  return inv.filter(
    (it) =>
      it.ref === ing.ref &&
      (!ing.origin || it.origin === ing.origin) &&
      (!ing.quality || (it.quality ?? 0) >= ing.quality),
  );
}

export function craftable(inv: InvItem[], recipe: Recipe): boolean {
  return recipe.ingredients.every((ing) => matchItems(inv, ing).length >= ing.count);
}

/**
 * 消費するアイテムを選ぶ: 産地一致(じもと)を優先しつつ、低い★から使う
 * (高★は温存)。craftable が前提。足りない場合は例外。
 */
export function pickConsume(inv: InvItem[], recipe: Recipe): InvItem[] {
  const used: InvItem[] = [];
  for (const ing of recipe.ingredients) {
    const cands = matchItems(inv, ing)
      .filter((it) => !used.includes(it))
      .sort(
        (a, b) =>
          Number(b.origin === recipe.pref) - Number(a.origin === recipe.pref) ||
          (a.quality ?? 0) - (b.quality ?? 0),
      );
    for (let i = 0; i < ing.count; i++) {
      const item = cands[i];
      if (!item) throw new Error(`pickConsume: そざい不足 ${recipe.id} ${ing.ref}`);
      used.push(item);
    }
  }
  return used;
}

/** じもとメダル判定: 消費した「そざい」が全て自県産(材料の産物は除く。そざい0個なら false) */
export function isJimoto(used: InvItem[], recipe: Recipe): boolean {
  const mats = used.filter((it) => isMaterialRef(it.ref));
  return mats.length > 0 && mats.every((it) => it.origin === recipe.pref);
}

/** クラフト(tier2/3)をセーブ状態に適用: 消費+産物追加+ずかん登録。じもとメダルは一度取れば維持 */
export function applyCraft(state: SaveState, recipe: Recipe): { used: InvItem[]; jimoto: boolean } {
  const used = pickConsume(state.inv, recipe);
  for (const it of used) state.inv.splice(state.inv.indexOf(it), 1);
  state.inv.push({ ref: recipe.id, origin: recipe.pref, quality: null });
  const jimoto = isJimoto(used, recipe);
  const prev = state.zukanProd[recipe.id];
  state.zukanProd[recipe.id] = { jimoto: (prev?.jimoto ?? false) || jimoto };
  return { used, jimoto };
}

/** おまつり(tier4)開催をセーブ状態に適用: めいぶつを消費し fest に登録(産物は生まれない) */
export function applyFestival(state: SaveState, recipe: Recipe): InvItem[] {
  const used = pickConsume(state.inv, recipe);
  for (const it of used) state.inv.splice(state.inv.indexOf(it), 1);
  state.fest.push(recipe.id);
  return used;
}

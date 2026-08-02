/* =====================================================
   「いま この けんで やること」を 1つ 決める(Phaser 非依存)。

   47県 ぜんぶ 遊べるように なったが、県ページには 何の 案内も なく
   「まず 何を すれば いいのか」が わからない ― その ための しくみ。

   いそぎの ものから 見て、さいしょに 当てはまった 1つを かえす。
   文章は data/uiText.ts が もつ(ここは 種類だけを 決める)。
   ===================================================== */
import type { GameData, Prefecture } from '../data/gameData';
import type { SaveState } from './state';
import { isShinOpen, materialLock } from './shin';
import { TOOL_LV3_USES } from './tools';
import { infraStock, plotKey, plotState } from './plots';
import { craftable } from './craft';

/** やる ことの 種類。いそぎの ものが 先(この ならびで しらべる) */
export type TaskKind =
  | 'care' //        おせわチャンス(時間で 消える)
  | 'harvest' //     しゅうかくできる
  | 'infraFull' //   いど・たんぼの ストックが まんたん
  | 'festival' //    おまつりが ひらける
  | 'craft' //       めいぶつが つくれる
  | 'findRecipe' //  レシピを さがせる
  | 'plant' //       まだ 何も うえていない
  | 'growing' //     そだち中しか ない(ほかの けんへ)
  | 'done'; //       この けんで やることは ない

export interface NextTask {
  kind: TaskKind;
  /** 対象が ある ものだけ(そざい名・レシピ名を 文に 入れる ため) */
  name?: string;
}

/** その けんの そざい(産地に 入っていて、いま さわれる もの)。
    しんの めいさん(未開放)や 季節外れを 「やること」に すすめない */
const materialsOf = (state: SaveState, data: GameData, pref: Prefecture, now: number) =>
  data.materials.filter((m) => m.origins.includes(pref.id) && materialLock(state, data, m, pref.id, now) === null);

/** その けんの レシピ(しん未開放と ねむった きわみどうぐは ださない) */
const recipesOf = (state: SaveState, data: GameData, pref: Prefecture) =>
  data.recipes.filter(
    (r) =>
      r.pref === pref.id &&
      (!r.shin || isShinOpen(state, data, pref.id)) &&
      (!(r.tool && r.tool.level >= 3) || (state.toolUse[r.tool.engine] ?? 0) >= TOOL_LV3_USES),
  );

/**
 * いま やる ことを 1つ かえす。
 * @param now テストしやすいよう 時刻は 外から わたす
 */
export function nextTask(state: SaveState, pref: Prefecture, data: GameData, now: number): NextTask {
  const mats = materialsOf(state, data, pref, now);
  const recipes = recipesOf(state, data, pref);

  /* --- 1. おせわチャンス: 時間で 消えるので いちばん いそぎ --- */
  for (const m of mats) {
    if (m.gather.type !== 'plant') continue;
    const view = plotState(state.plots[plotKey(pref.id, m.id)], m.gather, now);
    if (view.st === 'growing' && view.care) return { kind: 'care', name: m.name };
  }

  /* --- 2. しゅうかくできる --- */
  for (const m of mats) {
    if (m.gather.type !== 'plant') continue;
    const view = plotState(state.plots[plotKey(pref.id, m.id)], m.gather, now);
    if (view.st === 'ready') return { kind: 'harvest', name: m.name };
  }

  /* --- 3. ストックまんたん(あふれると もったいない) --- */
  for (const m of mats) {
    if (m.gather.type !== 'infra') continue;
    const rec = state.infra[plotKey(pref.id, m.id)];
    if (rec && infraStock(rec, m.gather, now) >= m.gather.max) return { kind: 'infraFull', name: m.name };
  }

  /* --- 4. おまつりが ひらける(この けんの ゴール) --- */
  const fest = recipes.find((r) => r.type === 'matsuri' && state.recipes.includes(r.id) && craftable(state.inv, r));
  if (fest) return { kind: 'festival', name: fest.name };

  /* --- 5. めいぶつが つくれる --- */
  const makeable = recipes.find(
    (r) => r.type !== 'matsuri' && state.recipes.includes(r.id) && craftable(state.inv, r),
  );
  if (makeable) return { kind: 'craft', name: makeable.name };

  /* --- 6. うえられる はたけが ある。
         「まず そざいを そだてる」を 覚えて ほしいので レシピさがしより 先に する --- */
  const plantable = mats.find((m) => {
    if (m.gather.type !== 'plant') return false;
    return plotState(state.plots[plotKey(pref.id, m.id)], m.gather, now).st === 'empty';
  });
  if (plantable) return { kind: 'plant', name: plantable.name };

  /* --- 7. レシピを さがせる。はたけが ぜんぶ ふさがっている あいだの よい つかい道 --- */
  if (recipes.some((r) => !state.recipes.includes(r.id))) return { kind: 'findRecipe' };

  /* --- 8. そだち中しか ない: 待つ あいだは ほかの けんへ --- */
  const growing = mats.find((m) => {
    if (m.gather.type !== 'plant') return false;
    return plotState(state.plots[plotKey(pref.id, m.id)], m.gather, now).st === 'growing';
  });
  if (growing) return { kind: 'growing', name: growing.name };

  return { kind: 'done' };
}

/** その けんで もう やる ことが ない か(おまつりまで 終わった か) */
export function prefComplete(state: SaveState, pref: Prefecture, data: GameData): boolean {
  const fests = recipesOf(state, data, pref).filter((r) => r.type === 'matsuri');
  return fests.length > 0 && fests.every((r) => state.fest.includes(r.id));
}

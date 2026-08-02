/* どうぐの 純ロジック(Phaser 非依存)。docs/DOUGU_SHIN_PLAN.md が 設計の 正。

   どうぐは 各地の 工芸の 県で 作る(type 'dougu' の レシピ)。
   効果は 「その あそびの じかんが すこし のびる」だけ:
     - どの エンジンにも 同じ 一つの 式で きく(コードの 分岐が ふえない)
     - ★1保証・★のしきい値・そだつ時間には いっさい さわらない
       (原則: 待ち時間は 他県へ 行く 動機。どうぐで 買わせない)
     - どうぐが なくても すべての コンテンツが 完成できる */
import type { GameData, Recipe, ToolEngine } from '../data/gameData';
import type { SaveState } from './state';

/** のびる わりあいの 上限。データテストでも 縛る(これを こえる 設定は 事故) */
export const TOOL_ASSIST_MAX = 0.2;
/** Lv2 どうぐの のび(45びょう → 50びょう くらい。体感できて こわれない 幅) */
export const TOOL_ASSIST_LV2 = 0.12;
/** Lv3 どうぐの のび(P2 で レシピを 足す。上限の 手前まで) */
export const TOOL_ASSIST_LV3 = 0.18;
/** Lv3 レシピが 目ざめる つかいこみ 回数(P2) */
export const TOOL_LV3_USES = 20;

/** いまの どうぐレベル。もっていなければ 1(ふつうの どうぐ) */
export function toolLevel(state: SaveState, engine: string): number {
  return state.tools[engine] ?? 1;
}

/** あそびの じかんが のびる わりあい(0〜TOOL_ASSIST_MAX)。
    どうぐの ない エンジン(おまつり・おせわ など)は かならず 0 */
export function toolAssist(state: SaveState, engine: string): number {
  const lv = toolLevel(state, engine);
  if (lv >= 3) return TOOL_ASSIST_LV3;
  if (lv >= 2) return TOOL_ASSIST_LV2;
  return 0;
}

/** つかいこみを 1回 きろくする(どうぐが ある エンジンだけ。Lv3の 目ざめ判定用) */
export function recordToolUse(data: GameData, state: SaveState, engine: string): void {
  if (!findToolRecipe(data, engine)) return; // どうぐの ない あそびは 数えない
  state.toolUse[engine] = (state.toolUse[engine] ?? 0) + 1;
}

/** その エンジンの どうぐレシピ(レベルの ひくい 順)。UI の 「どこで 作れるか」にも つかう */
export function findToolRecipe(data: GameData, engine: string, level = 2): Recipe | undefined {
  return data.recipes.find((r) => r.type === 'dougu' && r.tool?.engine === engine && r.tool.level === level);
}

/** どうぐレシピを 作った ときの 反映: tools を 上げる(下がりは しない) */
export function applyToolCraft(state: SaveState, recipe: Recipe): void {
  const t = recipe.tool;
  if (!t) return;
  state.tools[t.engine] = Math.max(state.tools[t.engine] ?? 1, t.level);
}

/** ぜんぶの どうぐエンジン(データから 引く。UI の ならび順にも つかう) */
export function allToolEngines(data: GameData): ToolEngine[] {
  const seen = new Set<ToolEngine>();
  for (const r of data.recipes) {
    if (r.type === 'dougu' && r.tool) seen.add(r.tool.engine);
  }
  return [...seen];
}

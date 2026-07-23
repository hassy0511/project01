/* =====================================================
   セーブデータ型・load/save(localStorage)
   v0.4 の localStorage キー "meisanquest-save-v1" と互換。
   Phaser 非依存。storage を注入できるのでユニットテスト可能。
   ===================================================== */
import type { GameData, Material, MaterialId, PrefectureId, RecipeId } from '../data/gameData';

export const SAVE_KEY = 'meisanquest-save-v1';

export interface InvItem {
  ref: MaterialId | RecipeId;
  origin: PrefectureId;
  /** そざい=★1〜3 / クラフト産物=null */
  quality: number | null;
}

export interface PlotRecord {
  plantedAt: number;
  careSpawned: boolean;
  careDone: boolean;
}

export interface InfraRecord {
  lastCollect: number;
}

export interface ZukanProdRecord {
  jimoto: boolean;
}

export interface SaveState {
  unlocked: PrefectureId[];
  inv: InvItem[];
  recipes: RecipeId[];
  /** matId → prefId → その産地での最高★ */
  zukanMat: Record<MaterialId, Record<PrefectureId, number>>;
  zukanProd: Record<RecipeId, ZukanProdRecord>;
  fest: RecipeId[];
  /** おまつりごとの さいこうスコア(おまつりは なんどでも 開催できる) */
  festBest: Record<RecipeId, number>;
  /** 最近出題したクイズID(古い順)。同じ問題ばかり出さないためのローテーション用 */
  quizRecent: string[];
  seenTrivia: Record<string, boolean>;
  /** キーは "prefId|matId"(core/plots.ts の plotKey) */
  plots: Record<string, PlotRecord>;
  infra: Record<string, InfraRecord>;
  flags: Record<string, boolean>;
  /** さいごに ひらいていた地方(MapScene の表示対象) */
  currentRegion: string;
}

/** localStorage 互換の最小インターフェース(テスト時はメモリ実装を注入) */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function defaultState(): SaveState {
  return {
    unlocked: [],
    inv: [],
    recipes: [],
    zukanMat: {},
    zukanProd: {},
    fest: [],
    festBest: {},
    quizRecent: [],
    seenTrivia: {},
    plots: {},
    infra: {},
    flags: {},
    currentRegion: 'kanto',
  };
}

/** 旧セーブに無いキーは defaultState で補完(v0.4 と同じシャローマージ方式のマイグレーション) */
export function loadState(storage: StorageLike): SaveState {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (raw) return Object.assign(defaultState(), JSON.parse(raw)) as SaveState;
  } catch {
    /* 破損時は初期化 */
  }
  return defaultState();
}

export function saveState(state: SaveState, storage: StorageLike): void {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* 保存不可でも続行 */
  }
}

/** 入手したそざいをインベントリ+ずかんに登録する(★は産地ごとの最高値のみ更新) */
export function registerMaterial(
  state: SaveState,
  matId: MaterialId,
  prefId: PrefectureId,
  stars: number,
  count: number,
): void {
  for (let i = 0; i < count; i++) state.inv.push({ ref: matId, origin: prefId, quality: stars });
  if (!state.zukanMat[matId]) state.zukanMat[matId] = {};
  state.zukanMat[matId][prefId] = Math.max(state.zukanMat[matId][prefId] ?? 0, stars);
}

/** さんちコンプ(全産地で入手済み)判定 */
export function isSanchiComplete(state: SaveState, material: Material): boolean {
  const rec = state.zukanMat[material.id];
  if (!rec) return false;
  return material.origins.every((o) => rec[o] !== undefined && rec[o] > 0);
}

/** 管理者用「ぜんぶ かいほう」: 全アクティブ県・全レシピを解放し、
    全そざい(各産地×2個。infraは★2固定/それ以外は★3)と全さんぶつ・めいぶつ(×2個)を配る。
    どのステージ・レシピ・おまつりもすぐ遊べる状態にする検証用機能。
    ずかん・おまつり開催実績・トリビアは増やさない(遊んで埋める部分はそのまま残す) */
/** これまでに あそびきった おまつりの種類数(festBest に記録が残る) */
export function playedFestCount(state: SaveState): number {
  return Object.keys(state.festBest).length;
}

/** 地方に いま入れるか。active が前提。unlockFests(おまつり種類数)を満たすか、
    すでにその地方の県が開拓済み(管理者の全開放を含む)なら入れる */
export function isRegionOpen(
  state: SaveState,
  region: { active: boolean; unlockFests?: number },
  regionPrefIds: PrefectureId[],
): boolean {
  if (!region.active) return false;
  if (regionPrefIds.some((p) => state.unlocked.includes(p))) return true;
  return (region.unlockFests ?? 0) <= playedFestCount(state);
}

export function adminUnlockAll(state: SaveState, data: GameData): void {
  for (const p of data.prefectures) {
    if (p.active && !state.unlocked.includes(p.id)) state.unlocked.push(p.id);
  }
  for (const r of data.recipes) {
    if (r.tier !== 4 && !state.recipes.includes(r.id)) state.recipes.push(r.id);
  }
  for (const m of data.materials) {
    const stars = m.gather.type === 'infra' ? 2 : 3;
    for (const o of m.origins) {
      for (let i = 0; i < 2; i++) state.inv.push({ ref: m.id, origin: o, quality: stars });
    }
  }
  for (const r of data.recipes) {
    if (r.tier === 4) continue;
    for (let i = 0; i < 2; i++) state.inv.push({ ref: r.id, origin: r.pref, quality: null });
  }
  state.flags.introSeen = true;
}

export const sanchiCompFlagKey = (matId: MaterialId): string => `comp_${matId}`;

/** さんちコンプを初達成した瞬間だけ true を返し、フラグを立てる(祝福演出のトリガー用) */
export function markSanchiCompleteOnce(state: SaveState, material: Material): boolean {
  const key = sanchiCompFlagKey(material.id);
  if (state.flags[key]) return false;
  if (!isSanchiComplete(state, material)) return false;
  state.flags[key] = true;
  return true;
}

/* =====================================================
   セーブデータ型・load/save(localStorage)
   v0.4 の localStorage キー "meisanquest-save-v1" と互換。
   Phaser 非依存。storage を注入できるのでユニットテスト可能。
   ===================================================== */
import type { Material, MaterialId, PrefectureId, RecipeId } from '../data/gameData';

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
  seenTrivia: Record<string, boolean>;
  /** キーは "prefId|matId"(core/plots.ts の plotKey) */
  plots: Record<string, PlotRecord>;
  infra: Record<string, InfraRecord>;
  flags: Record<string, boolean>;
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
    seenTrivia: {},
    plots: {},
    infra: {},
    flags: {},
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

export const sanchiCompFlagKey = (matId: MaterialId): string => `comp_${matId}`;

/** さんちコンプを初達成した瞬間だけ true を返し、フラグを立てる(祝福演出のトリガー用) */
export function markSanchiCompleteOnce(state: SaveState, material: Material): boolean {
  const key = sanchiCompFlagKey(material.id);
  if (state.flags[key]) return false;
  if (!isSanchiComplete(state, material)) return false;
  state.flags[key] = true;
  return true;
}

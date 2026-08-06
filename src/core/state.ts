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
  /** はじめて けんに ついた ときの 3コマを 見たか */
  seenPrefGuide: boolean;
  /** あそんだ ことが ある ミニゲーム(エンジン名 → true)。
      あそびかたの 説明を 初回だけ 出す/ずかんで 見返せる ものを 決める のに つかう */
  playedGame: Record<string, boolean>;
  /** どうぐの レベル(エンジン名 → 2 以上)。ない エンジンは Lv1(ふつうの どうぐ)。
      どうぐは 各地の 工芸の 県で 作る(docs/DOUGU_SHIN_PLAN.md) */
  tools: Record<string, number>;
  /** どうぐを つかった 回数(エンジン名 → 回数)。Lv3 レシピの 目ざめ判定に つかう */
  toolUse: Record<string, number>;
  /** いま ひらいて いる ちゅうもん(県ID → 品物と 数)。晴れた 県に 1つずつ */
  orders: Record<PrefectureId, { ref: string; count: number }>;
  /** ちゅうもんに こたえた 回数(県ID → 回数)。1回以上で その県の かざりが もらえる */
  orderDone: Record<PrefectureId, number>;
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
    seenPrefGuide: false,
    playedGame: {},
    tools: {},
    toolUse: {},
    orders: {},
    orderDone: {},
  };
}

/** 旧セーブに無いキーは defaultState で補完する。
    ここは「こわれた セーブでも ぜったいに 起動する」ことが しごと ―
    シャローマージだけだと、保存値の null や 型ちがい(オブジェクトのはずが 配列 など)が
    そのまま 入って あとで TypeError に なり、白い画面で 何も できなく なる。
    そこで **キーごとに 型を たしかめて、あわない ものは 既定値に もどす** */
export function loadState(storage: StorageLike): SaveState {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    return sanitizeState(JSON.parse(raw)) ?? defaultState();
  } catch {
    /* 破損時は初期化 */
  }
  return defaultState();
}

/** 外から来た JSON を SaveState に ならす(バックアップの 読みこみでも つかう)。
    オブジェクトで なければ null。キーごとに 型を たしかめ、あわない ものは 既定値 */
export function sanitizeState(parsed: unknown): SaveState | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const base = defaultState();
  const src = parsed as Record<string, unknown>;
  const out = base as unknown as Record<string, unknown>;
  for (const key of Object.keys(base)) {
    const v = src[key];
    const def = out[key];
    if (v === null || v === undefined) continue; // 既定値の まま
    if (Array.isArray(def)) {
      if (Array.isArray(v)) out[key] = v;
    } else if (typeof def === 'object') {
      if (typeof v === 'object' && !Array.isArray(v)) out[key] = v;
    } else if (typeof v === typeof def) {
      out[key] = v;
    }
  }
  return base;
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

/* ---------- 晴れ(ストーリー)の ものさし ----------
   「県が 晴れた」= その県の おまつりを 1回 ひらいた(fest に 入った)。
   地図の 見た目(快晴+🏮)と 同じ 条件を ここに 集約する。
   シネマを 見たか どうかは べつの フラグ(hareFlagKey)で もつ
   ── 晴れの 事実 と 演出の 既読 を わけないと、
   演出を とばした とき 県が 晴れて いない ことに なって しまう */

/** その県の 晴れシネマを 見た しるし(flags の キー) */
export const hareFlagKey = (prefId: PrefectureId): string => `hare_${prefId}`;

/** エリアの バッジ(全県🏮)を 受けとった しるし */
export const regionCompFlagKey = (regionId: string): string => `regionComp_${regionId}`;

/** エリア開放の おしらせを 見た しるし */
export const regionOpenFlagKey = (regionId: string): string => `regionOpen_${regionId}`;

/** 晴れた 県の 数(アクティブ県のうち おまつりを 1回 ひらいた 県) */
export function harePrefCount(state: SaveState, data: GameData): number {
  return data.prefectures.filter(
    (p) => p.active && p.festivalId !== undefined && state.fest.includes(p.festivalId),
  ).length;
}

/** アクティブ県の 総数(はれメーターの 分母) */
export function activePrefCount(data: GameData): number {
  return data.prefectures.filter((p) => p.active).length;
}

/** にっぽん ぜんぶ 晴れたか(エンディングの 条件) */
export function isAllHare(state: SaveState, data: GameData): boolean {
  return harePrefCount(state, data) >= activePrefCount(data) && activePrefCount(data) > 0;
}

/** その エリアの 県が ぜんぶ 晴れたか(ちほうバッジの 条件) */
export function isRegionComp(state: SaveState, data: GameData, regionId: string): boolean {
  const prefs = data.prefectures.filter((p) => p.region === regionId && p.active);
  return (
    prefs.length > 0 &&
    prefs.every((p) => p.festivalId !== undefined && state.fest.includes(p.festivalId))
  );
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
    // どうぐは もちものに 入る 産物では ない(作ると tools が 上がる だけ)
    if (r.tier === 4 || r.type === 'dougu') continue;
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

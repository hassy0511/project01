/* =====================================================
   畑の成長・おせわチャンス・infraストック計算
   reference/app.js の plotState / infraStock / plantSeed /
   collectInfra / __mqAdmin(boostAll・halfGrow)の移植。
   時刻は now(ミリ秒)を引数で受け取る(テスト可能な純ロジック)。
   ===================================================== */
import type { GameData, InfraGather, Material, PlantGather, PrefectureId } from '../data/gameData';
import { findMaterial } from '../data/gameData';
import type { InfraRecord, PlotRecord, SaveState } from './state';
import { registerMaterial } from './state';

/** おせわチャンスが湧く成長率(40%) */
export const CARE_SPAWN_PROGRESS = 0.4;
/** infra 素材のできばえは常に★2固定 */
export const INFRA_QUALITY = 2;

export const plotKey = (prefId: PrefectureId, matId: string): string => `${prefId}|${matId}`;
export const matIdOfKey = (key: string): string => key.split('|')[1] ?? '';

export type PlotView =
  | { st: 'empty' }
  | { st: 'growing'; prog: number; care: boolean; plot: PlotRecord }
  | { st: 'ready'; plot: PlotRecord };

/**
 * 畑の状態を導出する。
 * おせわチャンス: 成長40%以上で湧き、おせわ済み(careDone)なら消える。
 * 成長率は単調増加なので careSpawned フラグと同値になる(純関数として導出)。
 */
export function plotState(plot: PlotRecord | undefined, gather: PlantGather, now: number): PlotView {
  if (!plot) return { st: 'empty' };
  const prog = Math.min(1, (now - plot.plantedAt) / (gather.growSec * 1000));
  if (prog >= 1) return { st: 'ready', plot };
  return { st: 'growing', prog, care: prog >= CARE_SPAWN_PROGRESS && !plot.careDone, plot };
}

/** たねをまく: プロットを新規作成 */
export function plantSeed(state: SaveState, matId: string, prefId: PrefectureId, now: number): void {
  state.plots[plotKey(prefId, matId)] = { plantedAt: now, careSpawned: false, careDone: false };
}

/** おせわ完了を記録(収穫時の★保険 +1 の対象になる) */
export function markCareDone(state: SaveState, matId: string, prefId: PrefectureId): void {
  const plot = state.plots[plotKey(prefId, matId)];
  if (plot) {
    plot.careSpawned = true;
    plot.careDone = true;
  }
}

/** 収穫後に畑を空に戻す */
export function clearPlot(state: SaveState, matId: string, prefId: PrefectureId): void {
  delete state.plots[plotKey(prefId, matId)];
}

/** infra レコードが無ければ「今から貯まり始める」状態で初期化する */
export function ensureInfra(state: SaveState, matId: string, prefId: PrefectureId, now: number): InfraRecord {
  const key = plotKey(prefId, matId);
  if (!state.infra[key]) state.infra[key] = { lastCollect: now };
  return state.infra[key];
}

/** 現在のストック数(rateSec ごとに +1、max で頭打ち) */
export function infraStock(rec: InfraRecord | undefined, gather: InfraGather, now: number): number {
  if (!rec) return 0;
  return Math.min(gather.max, Math.floor((now - rec.lastCollect) / (gather.rateSec * 1000)));
}

/** 次の +1 までの残り秒数(満タンなら 0) */
export function infraNextSec(rec: InfraRecord, gather: InfraGather, now: number): number {
  if (infraStock(rec, gather, now) >= gather.max) return 0;
  const cycleMs = gather.rateSec * 1000;
  return Math.ceil((cycleMs - ((now - rec.lastCollect) % cycleMs)) / 1000);
}

/**
 * infra 回収: ストック分を★2固定でインベントリ+ずかんに登録し、タイマーをリセット。
 * 回収した個数を返す(0 なら何も起きない)。
 */
export function collectInfra(state: SaveState, material: Material, prefId: PrefectureId, now: number): number {
  if (material.gather.type !== 'infra') return 0;
  const rec = ensureInfra(state, material.id, prefId, now);
  const st = infraStock(rec, material.gather, now);
  if (st <= 0) return 0;
  registerMaterial(state, material.id, prefId, INFRA_QUALITY, st);
  rec.lastCollect = now;
  return st;
}

/* --- 管理者用デバッグAPI(⏩まんたん / おせわチャンス検証) --- */

/** 全プロットを収穫可能に、全 infra を満タンにする */
export function boostAll(state: SaveState, data: GameData, now: number): void {
  for (const key of Object.keys(state.plots)) {
    const m = findMaterial(data, matIdOfKey(key));
    if (m && m.gather.type === 'plant') state.plots[key].plantedAt = now - m.gather.growSec * 1000;
  }
  for (const key of Object.keys(state.infra)) {
    const m = findMaterial(data, matIdOfKey(key));
    if (m && m.gather.type === 'infra') {
      state.infra[key].lastCollect = now - m.gather.rateSec * m.gather.max * 1000;
    }
  }
}

/** 全プロットを成長50%まで進める(おせわチャンス検証用) */
export function halfGrow(state: SaveState, data: GameData, now: number): void {
  for (const key of Object.keys(state.plots)) {
    const m = findMaterial(data, matIdOfKey(key));
    if (m && m.gather.type === 'plant') state.plots[key].plantedAt = now - m.gather.growSec * 500;
  }
}

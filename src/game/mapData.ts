/* 地図パスJSON(public/assets/map-<region>.json = 各地方の県形(かんとうのみ旧名 map-gen.json)、
   public/assets/regions-gen.json = にほんぜんこくの地方シルエット)の読み込みとパース。
   どの地方を読むかは GAME_DATA.regions の active/mapFile が決める(データ駆動)。
   パスは scripts/gen-*.mjs が出力する M/L/Z のみの単純ポリゴン */
import { GAME_DATA } from '../data/gameData';

export interface MapPoint {
  x: number;
  y: number;
}

export interface MapAsset {
  viewW: number;
  viewH: number;
  polys: Record<string, MapPoint[]>;
  labels: Record<string, [number, number]>;
  /** 形クイズ用 bbox "x y w h" */
  boxes: Record<string, { x: number; y: number; w: number; h: number }>;
}

interface RawMapGen {
  viewBox: string;
  paths: Record<string, string>;
  labels: Record<string, [number, number]>;
  boxes: Record<string, string>;
}

/** "M1.0,2.0L3.0,4.0...Z" → 点列 */
export function parsePathPoints(d: string): MapPoint[] {
  return d
    .replace(/^M/, '')
    .replace(/Z$/, '')
    .split('L')
    .map((pair) => {
      const [x, y] = pair.split(',').map(Number);
      return { x, y };
    })
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
}

export function parseMapGen(raw: RawMapGen): MapAsset {
  const [, , w, h] = raw.viewBox.split(/\s+/).map(Number);
  const polys: Record<string, MapPoint[]> = {};
  for (const [id, d] of Object.entries(raw.paths)) polys[id] = parsePathPoints(d);
  const boxes: Record<string, { x: number; y: number; w: number; h: number }> = {};
  for (const [id, b] of Object.entries(raw.boxes)) {
    const [bx, by, bw, bh] = b.split(/\s+/).map(Number);
    boxes[id] = { x: bx, y: by, w: bw, h: bh };
  }
  return { viewW: w, viewH: h, polys, labels: raw.labels, boxes };
}

/* ---------- にほんぜんこく(地方シルエット) ---------- */

export interface RegionMapAsset {
  viewW: number;
  viewH: number;
  /** 地方id → リング(県単位のポリゴン)の配列 */
  polys: Record<string, MapPoint[][]>;
  labels: Record<string, [number, number]>;
}

interface RawRegionsGen {
  viewBox: string;
  regions: Record<string, string[]>;
  labels: Record<string, [number, number]>;
}

export function parseRegionsGen(raw: RawRegionsGen): RegionMapAsset {
  const [, , w, h] = raw.viewBox.split(/\s+/).map(Number);
  const polys: Record<string, MapPoint[][]> = {};
  for (const [id, list] of Object.entries(raw.regions)) polys[id] = list.map(parsePathPoints);
  return { viewW: w, viewH: h, polys, labels: raw.labels };
}

/** 地方id → 県形マップ。active な地方のぶんを Boot で読み込む(mapFile はデータ駆動) */
const prefMaps: Record<string, MapAsset> = {};
let regionAsset: RegionMapAsset | null = null;

export async function loadMapAsset(baseUrl: string): Promise<void> {
  const targets = GAME_DATA.regions.filter((r) => r.active && r.mapFile);
  const [resRegions, ...resMaps] = await Promise.all([
    fetch(`${baseUrl}assets/regions-gen.json`),
    ...targets.map((r) => fetch(`${baseUrl}assets/${r.mapFile}`)),
  ]);
  if (!resRegions.ok) throw new Error(`regions-gen.json load failed: ${resRegions.status}`);
  regionAsset = parseRegionsGen((await resRegions.json()) as RawRegionsGen);
  for (let i = 0; i < targets.length; i++) {
    if (!resMaps[i].ok) throw new Error(`${targets[i].mapFile} load failed: ${resMaps[i].status}`);
    prefMaps[targets[i].id] = parseMapGen((await resMaps[i].json()) as RawMapGen);
  }
}

/** Boot で読み込み済みの県形マップを取得(未ロードなら例外) */
export function getMapAsset(regionId = 'kanto'): MapAsset {
  const m = prefMaps[regionId];
  if (!m) throw new Error(`map asset not loaded: ${regionId}`);
  return m;
}

export function getRegionAsset(): RegionMapAsset {
  if (!regionAsset) throw new Error('region asset not loaded');
  return regionAsset;
}

/* 地図パスJSON(public/assets/map-gen.json = 関東の県形、
   public/assets/regions-gen.json = にほんぜんこくの地方シルエット)の読み込みとパース。
   パスは scripts/gen-*.mjs が出力する M/L/Z のみの単純ポリゴン */

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

let mapAsset: MapAsset | null = null;
let regionAsset: RegionMapAsset | null = null;

export async function loadMapAsset(baseUrl: string): Promise<MapAsset> {
  const [res, resRegions] = await Promise.all([
    fetch(`${baseUrl}assets/map-gen.json`),
    fetch(`${baseUrl}assets/regions-gen.json`),
  ]);
  if (!res.ok) throw new Error(`map-gen.json load failed: ${res.status}`);
  if (!resRegions.ok) throw new Error(`regions-gen.json load failed: ${resRegions.status}`);
  mapAsset = parseMapGen((await res.json()) as RawMapGen);
  regionAsset = parseRegionsGen((await resRegions.json()) as RawRegionsGen);
  return mapAsset;
}

/** Boot で読み込み済みの地図データを取得(未ロードなら例外) */
export function getMapAsset(): MapAsset {
  if (!mapAsset) throw new Error('map asset not loaded');
  return mapAsset;
}

export function getRegionAsset(): RegionMapAsset {
  if (!regionAsset) throw new Error('region asset not loaded');
  return regionAsset;
}

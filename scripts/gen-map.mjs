/* 関東7県の実形SVGパス生成スクリプト
   japan.topojson → 最大リング抽出 → 投影 → Douglas-Peucker簡略化 → パス出力
   使い方: node scripts/gen-map.mjs [japan.topojson のパス]
   出力: public/assets/map-gen.json(ゲームが fetch で読む)
   ※ japan.topojson はリポジトリに含めていない。県を追加する時に入手して実行する */
import fs from "fs";
import * as topojson from "topojson-client";

const SRC = process.argv[2] ?? "japan.topojson";
const OUT = "public/assets/map-gen.json";
const topo = JSON.parse(fs.readFileSync(SRC, "utf8"));
const fc = topojson.feature(topo, topo.objects.japan);
const WANT = { 8: "ibaraki", 9: "tochigi", 10: "gunma", 11: "saitama", 12: "chiba", 13: "tokyo", 14: "kanagawa" };

/* 最大リング(本土)だけ取る: 島嶼部は子供向け簡易地図では割愛 */
function largestRing(geom) {
  let best = null, bestArea = -1;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  for (const poly of polys) {
    const ring = poly[0];
    let a = 0;
    for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    a = Math.abs(a / 2);
    if (a > bestArea) { bestArea = a; best = ring; }
  }
  return best;
}

/* Douglas-Peucker */
function dp(points, eps) {
  if (points.length < 3) return points;
  const [sx, sy] = points[0], [ex, ey] = points[points.length - 1];
  let maxD = 0, idx = 0;
  const dx = ex - sx, dy = ey - sy, len = Math.hypot(dx, dy) || 1e-9;
  for (let i = 1; i < points.length - 1; i++) {
    const d = Math.abs(dy * points[i][0] - dx * points[i][1] + ex * sy - ey * sx) / len;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) {
    const l = dp(points.slice(0, idx + 1), eps), r = dp(points.slice(idx), eps);
    return l.slice(0, -1).concat(r);
  }
  return [points[0], points[points.length - 1]];
}

/* 閉リング対応: 始点から最遠の点で2分割してDPをかける */
function simplifyRing(ring, eps) {
  const open = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
    ? ring.slice(0, -1) : ring.slice();
  let far = 1, maxD = -1;
  for (let i = 1; i < open.length; i++) {
    const d = Math.hypot(open[i][0] - open[0][0], open[i][1] - open[0][1]);
    if (d > maxD) { maxD = d; far = i; }
  }
  const a = dp(open.slice(0, far + 1), eps);
  const b = dp(open.slice(far).concat([open[0]]), eps);
  return a.slice(0, -1).concat(b.slice(0, -1));
}

const rings = {};
for (const f of fc.features) {
  const id = f.properties.id;
  if (WANT[id]) rings[WANT[id]] = largestRing(f.geometry);
}

/* 投影: 経度緯度 → 平面(中央緯度で横方向補正) */
let minLon = 1e9, maxLon = -1e9, minLat = 1e9, maxLat = -1e9;
for (const r of Object.values(rings)) for (const [lon, lat] of r) {
  minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
  minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
}
const midLat = (minLat + maxLat) / 2;
const kx = Math.cos((midLat * Math.PI) / 180);
const W = 340, PAD = 12;
const scale = W / ((maxLon - minLon) * kx);
const H = (maxLat - minLat) * scale;
const px = ([lon, lat]) => [PAD + (lon - minLon) * kx * scale, PAD + (maxLat - lat) * scale];

const out = { viewBox: `0 0 ${Math.round(W + PAD * 2)} ${Math.round(H + PAD * 2)}`, paths: {}, labels: {}, boxes: {} };
for (const [name, ring] of Object.entries(rings)) {
  const projected = ring.map(px);
  /* 簡略化: 目標 60〜110点。epsを二分で調整 */
  let lo = 0.05, hi = 8, pts = simplifyRing(projected, 1);
  for (let i = 0; i < 22; i++) {
    const eps = (lo + hi) / 2;
    pts = simplifyRing(projected, eps);
    if (pts.length > 110) lo = eps; else if (pts.length < 60) hi = eps; else break;
  }
  pts = pts.concat([pts[0]]); /* 閉じる */
  const d = "M" + pts.map(([x, y]) => x.toFixed(1) + "," + y.toFixed(1)).join("L") + "Z";
  out.paths[name] = d;
  /* ラベル位置 = 重心 */
  let cx = 0, cy = 0, a = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const cross = pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
    a += cross; cx += (pts[i][0] + pts[i + 1][0]) * cross; cy += (pts[i][1] + pts[i + 1][1]) * cross;
  }
  a /= 2; cx /= 6 * a; cy /= 6 * a;
  out.labels[name] = [Math.round(cx), Math.round(cy)];
  /* 形クイズ用bbox(少し余白) */
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  out.boxes[name] = `${(x0 - 6).toFixed(0)} ${(y0 - 6).toFixed(0)} ${(x1 - x0 + 12).toFixed(0)} ${(y1 - y0 + 12).toFixed(0)}`;
  console.log(name, pts.length + "pts");
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log("viewBox:", out.viewBox);
console.log("labels:", JSON.stringify(out.labels));

/* 地方単位の県形マップ生成: @svg-maps/japan(CC BY 4.0, © Victor Cazanave)から
   指定地方の県パスを取り出し、map-gen.json と同じ形式で出力する。
   (gen-map.mjs は topojson が別途必要だったが、こちらは npm 依存だけで動く)
   使い方: node scripts/gen-pref-map.mjs tohoku
   出力: public/assets/map-<region>.json { viewBox, paths, labels, boxes } */
import fs from 'fs';
import { createRequire } from 'module';

const req = createRequire(import.meta.url);
const mod = req('@svg-maps/japan');
const map = mod.default ?? mod;

const REGION_PREFS = {
  tohoku: ['hokkaido', 'aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'],
  kanto: ['ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa'],
  chubu: ['niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano', 'gifu', 'shizuoka', 'aichi'],
  kinki: ['mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama'],
  chugoku: ['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi'],
  shikoku: ['tokushima', 'kagawa', 'ehime', 'kochi'],
  kyushu: ['fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa'],
};

/** はなれた しま(おきなわ)は 実測どおり置くと 地方ぜんたいが ほそながく なって
    子供には あそびにくい。にほんの ちずと おなじく「はこ入りの さしえ(インセット)」にする:
    その県だけ 別で 拡大して、あいている 海の 上に おく */
const INSET = {
  // ほんどの bbox の した(あいている うみ)に、はこ入りの さしえとして おく
  kyushu: { okinawa: { scale: 1.18, at: [52, 420] } },
};

/** ラベル位置の手動補正(重心が となりの県名と 重なる場合に ずらす) */
const NUDGE = {
  akita: [-18, -4],
  iwate: [18, 2],
  miyagi: [22, 8],
  yamagata: [-22, 2],
};

const region = process.argv[2];
if (!REGION_PREFS[region]) {
  console.error('使い方: node scripts/gen-pref-map.mjs <region>  region =', Object.keys(REGION_PREFS).join(' '));
  process.exit(1);
}
const OUT = `public/assets/map-${region}.json`;

/* ---- gen-region-map.mjs と同じパーサ/簡略化 ---- */
function parseRings(d) {
  const rings = [];
  let cur = [];
  let cx = 0, cy = 0;
  let sx = 0, sy = 0;
  let first = true;
  let pendingMove = false;
  for (const t of d.trim().split(/\s+/)) {
    if (t === 'm' || t === 'M') { pendingMove = true; continue; }
    if (t === 'z' || t === 'Z') {
      if (cur.length > 2) rings.push(cur);
      cur = [];
      cx = sx; cy = sy;
      continue;
    }
    const [a, b] = t.split(',').map(Number);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (pendingMove) {
      if (first) { cx = a; cy = b; } else { cx += a; cy += b; }
      sx = cx; sy = cy;
      cur = [[cx, cy]];
      pendingMove = false;
      first = false;
    } else {
      cx += a; cy += b;
      cur.push([cx, cy]);
    }
  }
  if (cur.length > 2) rings.push(cur);
  return rings;
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a / 2);
}

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

function simplifyRing(ring, eps) {
  let far = 1, maxD = -1;
  for (let i = 1; i < ring.length; i++) {
    const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]);
    if (d > maxD) { maxD = d; far = i; }
  }
  const a = dp(ring.slice(0, far + 1), eps);
  const b = dp(ring.slice(far).concat([ring[0]]), eps);
  return a.slice(0, -1).concat(b.slice(0, -1));
}

function centroid(ring) {
  let cx = 0, cy = 0, a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    const cross = x1 * y2 - x2 * y1;
    a += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  a /= 2;
  return [cx / (6 * a), cy / (6 * a)];
}

/* ---- 県ごとに最大リング(本土)を取り出す ---- */
const rings = {};
for (const loc of map.locations) {
  if (!REGION_PREFS[region].includes(loc.id)) continue;
  let best = null;
  let bestArea = -1;
  for (const ring of parseRings(loc.path)) {
    const a = ringArea(ring);
    if (a > bestArea) {
      bestArea = a;
      best = ring;
    }
  }
  if (best) rings[loc.id] = best;
}

/* ---- 地方の bbox を W=340 に正規化(map-gen.json と同じ座標感覚)。
       インセットの県は はこ入りの さしえに するので bbox の けいさんに 入れない ---- */
const insets = INSET[region] ?? {};
let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
for (const [name, r] of Object.entries(rings)) {
  if (insets[name]) continue;
  for (const [x, y] of r) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y);
    x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
}
const W = 340, PAD = 12;
const scale = W / (x1 - x0);
const H = (y1 - y0) * scale;
const px = ([x, y]) => [PAD + (x - x0) * scale, PAD + (y - y0) * scale];

const out = { viewBox: `0 0 ${Math.round(W + PAD * 2)} ${Math.round(H + PAD * 2)}`, paths: {}, labels: {}, boxes: {} };
for (const [name, ring] of Object.entries(rings)) {
  let projected = ring.map(px);
  const inset = insets[name];
  if (inset) {
    // 自分の bbox の 中心を きめて、拡大して しめされた ばしょへ うつす
    let ix0 = 1e9, iy0 = 1e9, ix1 = -1e9, iy1 = -1e9;
    for (const [x, y] of projected) {
      ix0 = Math.min(ix0, x); iy0 = Math.min(iy0, y);
      ix1 = Math.max(ix1, x); iy1 = Math.max(iy1, y);
    }
    const mx = (ix0 + ix1) / 2, my = (iy0 + iy1) / 2;
    // あいている うみに ずらす(at = 出力座標)
    projected = projected.map(([x, y]) => [
      inset.at[0] + (x - mx) * inset.scale,
      inset.at[1] + (y - my) * inset.scale,
    ]);
  }
  let lo = 0.05, hi = 8, pts = simplifyRing(projected, 1);
  for (let i = 0; i < 22; i++) {
    const eps = (lo + hi) / 2;
    pts = simplifyRing(projected, eps);
    if (pts.length > 110) lo = eps;
    else if (pts.length < 60) hi = eps;
    else break;
  }
  pts = pts.concat([pts[0]]);
  out.paths[name] = 'M' + pts.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join('L') + 'Z';
  const [cx, cy] = centroid(pts.slice(0, -1));
  const [nx, ny] = NUDGE[name] ?? [0, 0];
  out.labels[name] = [Math.round(cx + nx), Math.round(cy + ny)];
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  for (const [x, y] of pts) {
    bx0 = Math.min(bx0, x); by0 = Math.min(by0, y);
    bx1 = Math.max(bx1, x); by1 = Math.max(by1, y);
  }
  out.boxes[name] = `${(bx0 - 6).toFixed(0)} ${(by0 - 6).toFixed(0)} ${(bx1 - bx0 + 12).toFixed(0)} ${(by1 - by0 + 12).toFixed(0)}`;
  console.log(name, pts.length + 'pts');
}
// インセットを ふくめた ぜんたいの おおきさに viewBox を あわせる
{
  let vx1 = 0, vy1 = 0;
  for (const box of Object.values(out.boxes)) {
    const [bx, by, bw, bh] = box.split(' ').map(Number);
    vx1 = Math.max(vx1, bx + bw + 6);
    vy1 = Math.max(vy1, by + bh + 6);
  }
  out.viewBox = `0 0 ${Math.max(Math.round(W + PAD * 2), Math.round(vx1))} ${Math.max(Math.round(H + PAD * 2), Math.round(vy1))}`;
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('viewBox:', out.viewBox);
console.log('labels:', JSON.stringify(out.labels));

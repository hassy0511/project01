/* にほんぜんこく画面用の実形シルエット生成:
   @svg-maps/japan(CC BY 4.0, © Victor Cazanave)の47都道府県パスを
   8地方ごとにまとめ、簡略化して public/assets/regions-gen.json に出力する。
   使い方: node scripts/gen-region-map.mjs
   出力形式: { viewBox, regions: { 地方id: ["M..L..Z", ...] }, labels: { 地方id: [x,y] } }
   (リングは県単位のまま持つ。描画側で 地方色+白フチ で塗ると
    「地方=色のまとまり」の日本地図になる) */
import fs from 'fs';
import { createRequire } from 'module';

const req = createRequire(import.meta.url);
const mod = req('@svg-maps/japan');
const map = mod.default ?? mod;

const OUT = 'public/assets/regions-gen.json';

/** これ未満の面積(viewBox座標系)の小島は割愛(子供向け簡易シルエット) */
const AREA_MIN = 8;
/** 簡略化の許容ずれ。となり県とのわずかなすき間は描画側の同系フチで目立たない */
const EPS = 0.9;

const REGION_OF = {
  hokkaido: 'tohoku',
  aomori: 'tohoku', iwate: 'tohoku', miyagi: 'tohoku', akita: 'tohoku', yamagata: 'tohoku', fukushima: 'tohoku',
  ibaraki: 'kanto', tochigi: 'kanto', gunma: 'kanto', saitama: 'kanto', chiba: 'kanto', tokyo: 'kanto', kanagawa: 'kanto',
  niigata: 'chubu', toyama: 'chubu', ishikawa: 'chubu', fukui: 'chubu', yamanashi: 'chubu', nagano: 'chubu',
  gifu: 'chubu', shizuoka: 'chubu', aichi: 'chubu',
  mie: 'kinki', shiga: 'kinki', kyoto: 'kinki', osaka: 'kinki', hyogo: 'kinki', nara: 'kinki', wakayama: 'kinki',
  tottori: 'chugoku', shimane: 'chugoku', okayama: 'chugoku', hiroshima: 'chugoku', yamaguchi: 'chugoku',
  tokushima: 'shikoku', kagawa: 'shikoku', ehime: 'shikoku', kochi: 'shikoku',
  fukuoka: 'kyushu', saga: 'kyushu', nagasaki: 'kyushu', kumamoto: 'kyushu', oita: 'kyushu',
  miyazaki: 'kyushu', kagoshima: 'kyushu', okinawa: 'kyushu',
};

/* 'm x,y dx,dy … z m …' 形式(相対 moveto + 暗黙の相対 lineto)→ 絶対座標リング群 */
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

/* Douglas-Peucker(gen-map.mjs と同じ) */
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

/** ラベル位置の手動補正(細長い地方は重心が読みにくい位置に来るため) */
const NUDGE = {
  tohoku: [0, 0],
  kanto: [6, 4],
  chubu: [-4, 6],
  kinki: [0, 4],
  chugoku: [-4, -2],
  shikoku: [0, 4],
  kyushu: [-2, -8],
};

const regions = {};
const largest = {};
for (const loc of map.locations) {
  const rid = REGION_OF[loc.id];
  if (!rid) {
    console.warn('未対応の県ID:', loc.id);
    continue;
  }
  for (const ring of parseRings(loc.path)) {
    const area = ringArea(ring);
    if (area < AREA_MIN) continue;
    const simple = simplifyRing(ring, EPS);
    if (simple.length < 3 || ringArea(simple) < AREA_MIN) continue;
    (regions[rid] ??= []).push(simple);
    if (!largest[rid] || area > largest[rid].area) largest[rid] = { area, ring: simple };
  }
}

const out = { viewBox: map.viewBox, regions: {}, labels: {} };
let totalPts = 0;
for (const [rid, rings] of Object.entries(regions)) {
  out.regions[rid] = rings.map(
    (r) => 'M' + r.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z',
  );
  totalPts += rings.reduce((s, r) => s + r.length, 0);
  const [cx, cy] = centroid(largest[rid].ring);
  const [nx, ny] = NUDGE[rid] ?? [0, 0];
  out.labels[rid] = [Math.round(cx + nx), Math.round(cy + ny)];
  console.log(rid, `rings=${rings.length}`, `pts=${rings.reduce((s, r) => s + r.length, 0)}`);
}
fs.writeFileSync(OUT, JSON.stringify(out));
console.log('total points:', totalPts, '→', OUT, `${fs.statSync(OUT).size} bytes`);

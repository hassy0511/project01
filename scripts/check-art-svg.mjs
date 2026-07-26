/* 納品された SVG が docs/ART_DIRECTION.md の きまりを まもって いるか しらべる。

   絵を 描く人(または AI)が **ブラウザを 使わずに** 自分で 直せる ように するのが ねらい。
   ここを ぜんぶ 通ってから 出してもらう。

   実行:
     node scripts/check-art-svg.mjs            ぜんぶ しらべる
     node scripts/check-art-svg.mjs strawberry fish   その かたちだけ

   しらべる こと(ART_DIRECTION.md の 章):
     §4 viewBox / セーフエリア / つかえる 要素 / 線の 太さ / パスの 数
     §5 #MAIN の 有無 / パレット外の 色
     §6 ファイル名が 一覧の 名前と 合って いるか
     §7 背景は viewBox と 要素数 だけ

   しらべ「られない」こと(人の 目で 見る):
     32px で わかるか / 似た ものと 区別が つくか / 絵柄が そろって いるか
     → npm run dev → iconsheet.html?size=32 */
import fs from 'fs';
import path from 'path';

const ICON_DIR = 'src/ui/icons';
const ICON_FILES = ['food.ts', 'actors.ts', 'nature.ts', 'props.ts', 'ui.ts'];
const ART_ICON_DIR = 'public/art/icons';
const ART_BG_DIR = 'public/art/bg';
const MINIGAME_DIR = 'src/scenes/minigames';

/* ---------- 期待される 名まえ ---------- */
const expectedShapes = new Set();
for (const f of ICON_FILES) {
  const src = fs.readFileSync(path.join(ICON_DIR, f), 'utf8');
  for (const m of src.matchAll(/\n\s{2}'?([a-z][a-z0-9-]*)'?:\s*\(g,\s*c\)\s*=>/g)) expectedShapes.add(m[1]);
}
const expectedBg = new Set(
  fs
    .readdirSync(MINIGAME_DIR)
    .filter((f) => f.endsWith('Game.ts'))
    .map((f) => f.replace(/Game\.ts$/, '')),
);

/* ---------- パレット(§5) ---------- */
const PALETTE = new Set(
  [
    '#E0584F', '#A83A33', '#C0392B', '#8E2A20', '#F28BA0', '#C25F74',
    '#F0913C', '#BC6A22', '#F2B544', '#BF8622', '#F5D84E', '#C2A52C',
    '#A7CF5A', '#77993A', '#6FB04A', '#4B7C30', '#3F7D3C', '#2A5828',
    '#4FB3A3', '#2F8175', '#76C4E8', '#4A94B8', '#4F86C6', '#33608F',
    '#3B4F7D', '#27365A', '#A77BC4', '#7A5293', '#8E6BB5', '#644A86',
    '#9A6B42', '#6D492B', '#D8B483', '#A8865A', '#F6E7C4', '#B59253',
    '#FAF6EC', '#9C8F76', '#9AA0A6', '#6C7278', '#4A4A52', '#2C2C33',
    '#E8C14A', '#B28F22', '#D6DDE3', '#8A949E',
    // 「その ものの 色」として 指示書が みとめて いる もの(§5・作例)
    '#5AA04A', '#37702C', '#FFFFFF', '#000000', 'none',
  ].map((c) => c.toUpperCase()),
);

const ALLOWED_TAGS = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'polygon', 'polyline', 'line', 'title', 'desc']);
const FORBIDDEN_TAGS = ['image', 'text', 'filter', 'clipPath', 'mask', 'use', 'linearGradient', 'radialGradient', 'pattern', 'animate', 'animateTransform', 'style', 'foreignObject', 'tspan', 'switch', 'symbol', 'marker'];

/**
 * 1まいを しらべる。
 * @param kind 'icon' | 'bg'
 */
function checkOne(file, kind) {
  const bad = [];
  const warn = [];
  const src = fs.readFileSync(file, 'utf8');
  const box = kind === 'icon' ? '0 0 64 64' : '0 0 480 748';

  /* --- §4 viewBox --- */
  const vb = /viewBox="([^"]+)"/.exec(src);
  if (!vb) bad.push('viewBox が ない');
  else if (vb[1].trim().replace(/\s+/g, ' ') !== box) bad.push(`viewBox が "${vb[1]}"。"${box}" に する`);
  if (/\swidth="/.test(src) || /\sheight="/.test(src)) {
    warn.push('width / height 属性は なくてよい(viewBox だけで 足りる)');
  }

  /* --- §4 つかえない 要素 --- */
  for (const t of FORBIDDEN_TAGS) {
    if (new RegExp(`<${t}[\\s>/]`, 'i').test(src)) bad.push(`<${t}> は つかえない`);
  }
  for (const m of src.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)/g)) {
    const tag = m[1];
    if (!ALLOWED_TAGS.has(tag) && !FORBIDDEN_TAGS.includes(tag)) bad.push(`しらない 要素 <${tag}>`);
  }

  /* --- §4 style 属性の CSS は つかわない --- */
  if (/style="[^"]*(?:fill|stroke)/i.test(src)) bad.push('style="fill:…" では なく fill="…" 属性で 書く');

  /* --- §4 線の 太さ(細い線は 縮小で 消える) --- */
  for (const m of src.matchAll(/stroke-width="([\d.]+)"/g)) {
    const w = Number(m[1]);
    const min = kind === 'icon' ? 1.5 : 2;
    if (w < min) bad.push(`stroke-width="${w}" は 細すぎる(${min} 以上)`);
  }

  /* --- §4 パスの 数 --- */
  const shapeCount = [...src.matchAll(/<(path|circle|ellipse|rect|polygon|polyline|line)[\s>]/g)].length;
  if (kind === 'icon') {
    if (shapeCount === 0) bad.push('かたちが 1つも ない');
    if (shapeCount > 50) bad.push(`かたちが ${shapeCount}個。50 を こえたら 描きすぎ`);
    else if (shapeCount > 20) warn.push(`かたちが ${shapeCount}個。20 いないが 目安`);
  } else if (shapeCount > 40) {
    warn.push(`背景の かたちが ${shapeCount}個。要素は 10個 いないに まとめる`);
  }

  /* --- §5 いろ --- */
  const colors = [...src.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1]);
  if (kind === 'icon' && !colors.includes('#MAIN')) {
    bad.push('#MAIN が ない。いろちがいで かわる 面は #MAIN に する');
  }
  if (kind === 'icon' && colors.includes('#MAIN') && !colors.includes('#DARK')) {
    warn.push('#DARK が ない。ふちどりは #DARK に すると いろちがいで きれいに 出る');
  }
  for (const c of new Set(colors)) {
    if (c === '#MAIN' || c === '#DARK') continue;
    if (!PALETTE.has(c.toUpperCase())) bad.push(`パレット外の 色 ${c}`);
  }

  /* --- §4 セーフエリア。path の d は 相対指定が あって はんだんできない ので、
         まちがいなく 絶対座標の 属性(cx/cy/x/y/r/rx/ry)だけを 見る --- */
  if (kind === 'icon') {
    const out = [];
    for (const m of src.matchAll(/\s(cx|cy|x|y|r|rx|ry|width|height)="(-?[\d.]+)"/g)) {
      const v = Number(m[2]);
      if (v < -1 || v > 65) out.push(`${m[1]}="${m[2]}"`);
    }
    if (out.length) warn.push(`わく(0〜64)の 外を さす 属性: ${[...new Set(out)].slice(0, 4).join(' ')}`);
  }

  return { bad, warn };
}

/* ---------- 走る ---------- */
const only = process.argv.slice(2);
const problems = [];
const warnings = [];
let n = 0;

const scan = (dir, kind, expected, prefix = '') => {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.svg'));
  for (const f of files) {
    const name = f.replace(/\.svg$/, '').replace(new RegExp(`^${prefix}`), '');
    if (only.length && !only.includes(name)) continue;
    n++;
    if (!expected.has(name)) {
      problems.push(`${dir}/${f}: この 名まえは 一覧に ない(ART_ASSET_LIST.md の 名まえと 1文字も かえない)`);
      continue;
    }
    const { bad, warn } = checkOne(path.join(dir, f), kind);
    for (const b of bad) problems.push(`${dir}/${f}: ${b}`);
    for (const w of warn) warnings.push(`${dir}/${f}: ${w}`);
  }
  return files;
};

const icons = scan(ART_ICON_DIR, 'icon', expectedShapes);
const bgs = scan(ART_BG_DIR, 'bg', expectedBg, 'bg-');

console.log(`しらべた SVG: ${n}まい(かたち ${icons.length} / 背景 ${bgs.length})`);
console.log(`まだ ない かたち: ${expectedShapes.size - icons.length} / 背景: ${expectedBg.size - bgs.length}`);

if (warnings.length) {
  console.log('\nきをつけたい ところ(止めない):');
  for (const w of warnings) console.log('  ' + w);
}
if (problems.length) {
  console.error('\nなおす ところ:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
if (!n) {
  console.log('\nSVG が まだ ありません(public/art/icons/*.svg に おいて ください)。');
}
console.log('\nART SVG OK');

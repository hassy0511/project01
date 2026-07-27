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
     32px で わかるか / 似た ものと 区別が つくか / 絵柄が そろって いるか /
     下絵(docs/art-ref/*.png)と 同じ ものに 見えるか
     → npm run dev → iconsheet.html?size=32 */
import fs from 'fs';
import path from 'path';

const ICON_DIR = 'src/ui/icons';
const ICON_FILES = ['food.ts', 'actors.ts', 'nature.ts', 'props.ts', 'ui.ts'];
const ART_ICON_DIR = 'public/art/icons';
const ART_BG_DIR = 'public/art/bg';
const ART_REF_DIR = 'docs/art-ref';
const MINIGAME_DIR = 'src/scenes/minigames';
const ART_LIST = 'docs/ART_ASSET_LIST.md';

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

/* ---------- パレット(§5)。kit.ts が 正なので そこから よむ ---------- */
const PALETTE_OF = {}; // いろ名 -> [MAIN, DARK]
{
  const kit = fs.readFileSync(path.join(ICON_DIR, 'kit.ts'), 'utf8');
  for (const m of kit.matchAll(/^\s{2}(\w+): \[(0x[0-9a-f]{6}), (0x[0-9a-f]{6})\]/gm)) {
    PALETTE_OF[m[1]] = [m[2].replace('0x', '#').toUpperCase(), m[3].replace('0x', '#').toUpperCase()];
  }
}
/** 「その ものの 色」として 指示書が みとめて いる もの(§5・作例) */
const EXTRA_OK = ['#5AA04A', '#37702C', '#FFFFFF', '#000000', 'NONE'];
const PALETTE = new Set([...Object.values(PALETTE_OF).flat(), ...EXTRA_OK]);

/* ---------- その かたちが つかう いろ(ART_ASSET_LIST.md から) ---------- */
const usedColors = {}; // かたち名 -> いろ名[]
{
  const list = fs.readFileSync(ART_LIST, 'utf8');
  for (const m of list.matchAll(/^\| `([a-z0-9-]+)\.svg` \| [^|]*\| ([^|]*)\|/gm)) {
    usedColors[m[1]] = m[2].trim().split(/\s+/).filter((c) => PALETTE_OF[c]);
  }
}

const ALLOWED_TAGS = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'polygon', 'polyline', 'line', 'title', 'desc']);
const FORBIDDEN_TAGS = ['image', 'text', 'filter', 'clipPath', 'mask', 'use', 'linearGradient', 'radialGradient', 'pattern', 'animate', 'animateTransform', 'style', 'foreignObject', 'tspan', 'switch', 'symbol', 'marker'];

/**
 * 1まいを しらべる。
 * @param kind 'icon' | 'bg'
 * @param name かたちの 名まえ(その かたちが つかう いろを 見る ため)
 */
function checkOne(file, kind, name) {
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

  /* --- §5 「いろちがいに した とき 消える 色」の 検出。
         直に 書いた 色が、その かたちが つかう いろの MAIN/DARK と 同じだと、
         その いろちがいの ときだけ 見えなくなる。
         (いちごの たねを #F6E7C4 に して、strawberry:cream で 消えた のが これ) --- */
  if (kind === 'icon') {
    for (const c of new Set(colors)) {
      if (c === '#MAIN' || c === '#DARK') continue;
      const hex = c.toUpperCase();
      for (const col of usedColors[name] ?? []) {
        const [main, dark] = PALETTE_OF[col];
        if (hex === main) {
          warn.push(`直に 書いた 色 ${c} は 「${col}」の 本体色と 同じ。${name}:${col} の ときに 消えます(#DARK に する か、べつの 色に する)`);
        } else if (hex === dark) {
          warn.push(`直に 書いた 色 ${c} は 「${col}」の こい色と 同じ。${name}:${col} の ときに ふちどりに とけます`);
        }
      }
    }
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
    const { bad, warn } = checkOne(path.join(dir, f), kind, name);
    for (const b of bad) problems.push(`${dir}/${f}: ${b}`);
    for (const w of warn) warnings.push(`${dir}/${f}: ${w}`);
    // 下絵(PNG)なしで SVG だけ 出て いたら しらせる(ART_DIRECTION §8-0)
    const ref = ['webp', 'png', 'jpg'].map((e) => path.join(ART_REF_DIR, `${prefix}${name}.${e}`));
    const hit = ref.find((r) => fs.existsSync(r));
    if (!hit) warnings.push(`${dir}/${f}: 下絵 ${ref[0]} が ない(先に 下絵を 作る)`);
    else if (fs.statSync(hit).size > 300 * 1024) {
      warnings.push(`${dir}/${f}: 下絵 ${hit} が ${(fs.statSync(hit).size / 1024 / 1024).toFixed(2)}MB。512px の WebP に 縮める`);
    }
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

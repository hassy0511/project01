/* 納品SVGの 見わたし。ぜんぶの 手描きSVG を 実際の いろで ならべて 1まいの 絵に する。
   規約チェック(npm run art:check)は 「きまりを 守って いるか」しか 見ない。
   「32pxで 何の 絵か わかるか」「ほかの かたちと 見わけが つくか」は 目で 見るしかない。

   出す もの: shots/art-sheet-1.png … (32px と 64px を ならべた 一覧)

   実行: node e2e/shots/art-sheet.mjs(preview サーバーを 立ててから) */
import { readFileSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { CHROMIUM_PATH } from '../helpers.mjs';

const SHOTS = new URL('.', import.meta.url).pathname;
const ART = new URL('../../public/art/icons/', import.meta.url).pathname;
const LIST = new URL('../../docs/ART_ASSET_LIST.md', import.meta.url).pathname;

/** パレット(ART_DIRECTION §5)。見本には その かたちが 実際に つかう 1色目を あてる */
const PALETTE = {
  red: ['#E0584F', '#A83A33'], crimson: ['#C0392B', '#8E2A20'], pink: ['#F28BA0', '#C25F74'],
  orange: ['#F0913C', '#BC6A22'], amber: ['#F2B544', '#BF8622'], yellow: ['#F5D84E', '#C2A52C'],
  lime: ['#A7CF5A', '#77993A'], green: ['#6FB04A', '#4B7C30'], deepgreen: ['#3F7D3C', '#2A5828'],
  teal: ['#4FB3A3', '#2F8175'], sky: ['#76C4E8', '#4A94B8'], blue: ['#4F86C6', '#33608F'],
  navy: ['#3B4F7D', '#27365A'], purple: ['#A77BC4', '#7A5293'], violet: ['#8E6BB5', '#644A86'],
  brown: ['#9A6B42', '#6D492B'], tan: ['#D8B483', '#A8865A'], cream: ['#F6E7C4', '#B59253'],
  white: ['#FAF6EC', '#9C8F76'], gray: ['#9AA0A6', '#6C7278'], dark: ['#4A4A52', '#2C2C33'],
  gold: ['#E8C14A', '#B28F22'], silver: ['#D6DDE3', '#8A949E'],
};

/** 発注リストから 「その かたちが つかう いろ」を よむ */
const md = readFileSync(LIST, 'utf8');
const colorsOf = {};
for (const m of md.matchAll(/^\| `([a-z0-9-]+)\.svg` \| [^|]*\| ([^|]*)\|/gm)) {
  const cols = m[2].trim().split(/\s+/).filter((c) => PALETTE[c]);
  if (cols.length) colorsOf[m[1]] = cols;
}

const names = readdirSync(ART).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)).sort();
const cells = names.map((n) => {
  const [main, dark] = PALETTE[colorsOf[n]?.[0] ?? 'tan'];
  const svg = readFileSync(`${ART}${n}.svg`, 'utf8').replaceAll('#MAIN', main).replaceAll('#DARK', dark);
  const color = colorsOf[n]?.[0] ?? '?';
  return `<figure><div class="row"><span class="s32">${svg}</span><span class="s64">${svg}</span></div>
    <figcaption>${n}<br><small>${color}</small></figcaption></figure>`;
});

const PER_PAGE = 60;
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
for (let i = 0; i * PER_PAGE < cells.length; i++) {
  const chunk = cells.slice(i * PER_PAGE, (i + 1) * PER_PAGE);
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    body { background:#EAF4F8; font-family: sans-serif; margin:14px; }
    h1 { font-size:15px; margin:0 0 10px; color:#5a5148 }
    .grid { display:grid; grid-template-columns:repeat(10,1fr); gap:8px }
    figure { margin:0; background:#FFF8E7; border-radius:8px; padding:6px 2px; text-align:center }
    .row { display:flex; align-items:flex-end; justify-content:center; gap:6px; height:66px }
    .s32 svg { width:32px; height:32px } .s64 svg { width:56px; height:56px }
    figcaption { font-size:9px; color:#5a5148; margin-top:4px; line-height:1.25 }
    small { color:#9a8f80 }
  </style><h1>手描きSVG ${i * PER_PAGE + 1}〜${Math.min((i + 1) * PER_PAGE, cells.length)} / ${cells.length}(左=32px 右=56px)</h1>
  <div class="grid">${chunk.join('')}</div>`);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SHOTS}/art-sheet-${i + 1}.png`, fullPage: true });
  console.log(`art-sheet-${i + 1}.png (${chunk.length}こ)`);
}
await browser.close();

/* 背景 59まいの 見わたし。ゲームの 上に アイコンが のる ので、
   「その 場所に 見えるか」と 「あかるすぎ/こますぎ ないか」を 目で 見る */
import { readFileSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { CHROMIUM_PATH } from '../helpers.mjs';
const SHOTS = new URL('.', import.meta.url).pathname;
const BG = new URL('../../public/art/bg/', import.meta.url).pathname;
const names = readdirSync(BG).filter((f) => f.endsWith('.svg')).sort();
const cells = names.map((f) => {
  const svg = readFileSync(`${BG}${f}`, 'utf8').replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ');
  return `<figure><div class="thumb">${svg}</div><figcaption>${f.replace('bg-', '').replace('.svg', '')}</figcaption></figure>`;
});
const PER = 24;
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 1100, height: 1200 } });
for (let i = 0; i * PER < cells.length; i++) {
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
   body{background:#EAF4F8;font-family:sans-serif;margin:14px}
   h1{font-size:15px;margin:0 0 10px;color:#5a5148}
   .grid{display:grid;grid-template-columns:repeat(8,1fr);gap:10px}
   figure{margin:0;text-align:center}
   .thumb{width:100%;aspect-ratio:480/748;border-radius:6px;overflow:hidden;background:#fff}
   .thumb svg{width:100%;height:100%;display:block}
   figcaption{font-size:10px;color:#5a5148;margin-top:4px}
  </style><h1>ミニゲームの 背景 ${i * PER + 1}〜${Math.min((i + 1) * PER, cells.length)} / ${cells.length}</h1>
  <div class="grid">${cells.slice(i * PER, (i + 1) * PER).join('')}</div>`);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${SHOTS}/bg-sheet-${i + 1}.png`, fullPage: true });
  console.log(`bg-sheet-${i + 1}.png`);
}
await browser.close();

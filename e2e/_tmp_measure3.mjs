import { chromium } from 'playwright';
import { CHROMIUM_PATH } from './helpers.mjs';
import fs from 'fs';

const src = fs.readFileSync('/home/user/project01/src/data/gameData.ts', 'utf8');
const lines = src.split('\n');
const choiceSets = [];
lines.forEach((l, i) => {
  const m = /choices: \[([^\]]*)\]/.exec(l);
  if (m) {
    const cs = [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(x => x[1]);
    choiceSets.push({ line: i + 1, cs });
  }
});
const flat = [];
choiceSets.forEach(cs => cs.cs.forEach(c => flat.push({ line: cs.line, c })));

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
await page.goto('http://localhost:4273/project01/');
await page.waitForFunction(() => !!window.__game, null, { timeout: 20000 });
await page.waitForTimeout(2000);
const res = await page.evaluate((p) => {
  const scene = window.__game.scene.getScenes(true)[0];
  const FONT = "'Hiragino Maru Gothic ProN','BIZ UDPGothic','Yu Gothic UI','Meiryo',sans-serif";
  const mw = (text, style) => { const t = scene.add.text(0, 0, text, { fontFamily: FONT, ...style }); const w = Math.round(t.width); t.destroy(); return w; };
  return {
    choices: p.flat.map(x => ({ ...x, w: mw(x.c, { fontSize: '17px', fontStyle: 'bold' }) })),
    hints: p.flat.map(x => ({ ...x, w: mw(`こたえは「${x.c}」だよ!`, { fontSize: '15px' }) })),
  };
}, { flat });
console.log('=== choice label > 340 (CHOICE_W, no wrap) ===');
res.choices.filter(x => x.w > 340).sort((a,b)=>b.w-a.w).forEach(x => console.log(`gameData.ts:${x.line} w=${x.w} "${x.c}"`));
console.log('=== choice 320..340 (tight) ===');
res.choices.filter(x => x.w > 320 && x.w <= 340).sort((a,b)=>b.w-a.w).forEach(x => console.log(`gameData.ts:${x.line} w=${x.w} "${x.c}"`));
console.log('=== answerIs hint > 420 ===');
res.hints.filter(x => x.w > 420).sort((a,b)=>b.w-a.w).slice(0,12).forEach(x => console.log(`gameData.ts:${x.line} w=${x.w} こたえは「${x.c}」だよ!`));
await browser.close();

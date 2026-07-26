import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from './helpers.mjs';

const BASE = 'http://localhost:4273/project01/';
const SHOTS = '/tmp/claude-0/-home-user-project01/d96fbbb8-2c76-53c9-80d5-ef58e7c02ee7/scratchpad/shots2';
mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
page.on('pageerror', e => console.log('pageerror', e.message));
const d = makeDriver(page, SHOTS);

await page.goto(BASE);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1500);
await page.evaluate(() => { window.__mqAdmin.fastMode(); window.__mqAdmin.unlockAll(); });
await page.waitForTimeout(500);
try { await d.clickText('スキップ'); } catch {}
await page.waitForTimeout(800);
await d.clickText('きんき');
await page.waitForTimeout(900);
await d.clickText('しが');
await page.waitForTimeout(1200);
// ふなを つる (timing engine, long prompt)
await d.scrollAndClick('ふなを つる');
await page.waitForTimeout(1200);
await page.screenshot({ path: `${SHOTS}/10-ika-intro.png` });
// modal has a start button? capture all texts
const texts = await page.evaluate(() => {
  const out = [];
  for (const scene of window.__game.scene.getScenes(true)) {
    const walk = (list) => { for (const o of list) { if (o.list) walk(o.list); if (o.text) out.push(o.text); } };
    walk(scene.children.list);
  }
  return out;
});
console.log(JSON.stringify(texts, null, 0));
await browser.close();

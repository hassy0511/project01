import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from './helpers.mjs';

const BASE = 'http://localhost:4273/project01/';
const SHOTS = '/tmp/claude-0/-home-user-project01/d96fbbb8-2c76-53c9-80d5-ef58e7c02ee7/scratchpad/shots';
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
// skip story if present
try { await d.clickText('スキップ'); } catch { /* already past */ }
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOTS}/00-region.png` });

// go to きんき → きょうと
const target = process.argv[2] ?? 'きんき';
const pref = process.argv[3] ?? 'きょうと';
try {
  await d.clickText(target);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/01-map-${target}.png` });
} catch (e) { console.log('region click failed', e.message); }
// click pref label on map
try {
  await d.clickText(pref);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/02-pref-${pref}.png`, fullPage: false });
} catch (e) { console.log('pref click failed', e.message); }
// scroll through the pref list capturing shots
for (let i = 1; i <= 6; i++) {
  await d.scrollList(340);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/03-pref-${pref}-scroll${i}.png` });
}
await browser.close();
console.log('done');

/* リズムづみの得点検証: 葉が的に来た瞬間にタップして スコアが入ることを確かめる */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
const d = makeDriver(page, '/home/user/project01/e2e/shots');

await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.waitForTimeout(1500);
await page.evaluate(() => window.__mqAdmin.skipGuides()); // はじめての 3コマは verify-guide.mjs で しらべる
await d.waitText('スキップ');
await d.clickText('スキップ');
await d.waitText('にっぽん ぜんこく');
await d.clickText('かんとう');
await page.waitForTimeout(800);
await page.evaluate(() => window.__mqAdmin.unlockAll());
await page.waitForTimeout(400);
// さいたまへ
await page.mouse.click(10 + 142 * 1.263, 80 + 208 * 1.263);
await page.waitForTimeout(700);
if (!(await d.findTexts('しゅうかく!')).length) {
  await d.scrollAndClick('ちゃのきを うえる');
  await page.evaluate(() => window.__mqAdmin.boostAll());
  await page.waitForTimeout(1600);
}
await d.scrollAndClick('しゅうかく!');
const score = async () =>
  page.evaluate(() => {
    let v = null;
    for (const scene of window.__game.scene.getScenes(true)) {
      const walk = (list) => {
        for (const o of list) {
          if (o.list) walk(o.list);
          if (typeof o.text === 'string' && o.text.startsWith('スコア ')) v = Number(o.text.slice(4));
        }
      };
      walk(scene.children.list);
    }
    return v;
  });
await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
const t0 = Date.now();
let taps = 0;
while (Date.now() - t0 < 15000 && taps < 6) {
  const leaves = await d.findNames('mg-target');
  const near = leaves.find((l) => Math.abs(l.x - 118) < 22 && l.y > 300);
  if (near) {
    await page.mouse.click(near.x, near.y);
    taps++;
    await page.waitForTimeout(400);
  } else {
    await page.waitForTimeout(60);
  }
}
const s = await score();
console.log(`taps=${taps} score=${s}`);
await page.screenshot({ path: '/home/user/project01/e2e/shots/f13-rhythm-scored.png' });
await browser.close();
if (!s || s <= 0) {
  console.error('RHYTHM SCORE FAILED');
  process.exit(1);
}
console.log('RHYTHM OK');

/* ほっかいどう統合の確認: 全国図・とうほく地図(7県)・ゆきまつり(雪像づくり) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = '/home/user/project01/e2e/shots';
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
const d = makeDriver(page, SHOTS);

await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
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
await d.clickText('にっぽん');
await d.waitText('にっぽん ぜんこく');
await page.screenshot({ path: `${SHOTS}/hk-region-select.png` });
await d.clickText('ほっかいどう・とうほく');
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOTS}/hk-tohoku-map.png` });

// ほっかいどうへ(map-tohoku labels: hokkaido [186,163], scale=min(460/364,560/616)=0.909, offX=(480-364*0.909)/2≈74.6, offY=80)
const S = 0.909, OX = 74.6, OY = 80;
await page.mouse.click(OX + 186 * S, OY + 163 * S);
await page.waitForTimeout(700);
await d.startFest();
await page.waitForTimeout(1800);
// ⛄の型: そとがわ (r,c) を けずる
const carve = [[0, 0], [0, 4], [1, 0], [1, 4], [2, 0], [2, 1]];
for (const [r, c] of carve) {
  await page.mouse.click(55 + c * 74 + 37, 170 + r * 74 + 37 + 52);
  await page.waitForTimeout(220);
}
await page.screenshot({ path: `${SHOTS}/hk-yukimatsuri.png` });
const score = await page.evaluate(() => {
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
console.log('yukimatsuri score:', score);
await browser.close();
if (!score || score <= 0) {
  console.error('YUKIMATSURI SCORE FAILED');
  process.exit(1);
}
console.log('HOKKAIDO SHOTS OK');

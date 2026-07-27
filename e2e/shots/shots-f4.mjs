/* F4 スクリーンショット: とうほく地図・ゆきはらい・とうほく祭り6本 */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = '/home/user/project01/e2e/shots';
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
const d = makeDriver(page, SHOTS);
const log = (s) => console.log('✔ ' + s);

/** 県は 地図の 名まえラベルで えらぶ(座標だと 地図を なおす たびに こわれる) */
const clickPref = async (name) => {
  const t = (await d.findTexts(name))[0];
  if (!t) throw new Error(`県が みつからない: ${name}`);
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(700);
};

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
await page.screenshot({ path: `${SHOTS}/f4-region-select.png` });
await d.clickText('ほっかいどう・とうほく'); // ほっかいどうを とりこんで 名まえが かわった
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOTS}/f4-tohoku-map.png` });
log('とうほく地図');

/* ゆきはらい(あおもり) */
await clickPref('あおもり');
await d.scrollAndClick('たねを まく');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
await page.waitForTimeout(1800);
await page.mouse.move(70, 245);
await page.mouse.down();
for (let i = 0; i < 8; i++) {
  await page.mouse.move(70 + (i % 2) * 70, 240 + (i % 3) * 6);
  await page.waitForTimeout(40);
}
await page.mouse.up();
await page.waitForTimeout(200);
await page.screenshot({ path: `${SHOTS}/f4-sweep.png` });
log('ゆきはらい');

/* 祭り6本 */
const FESTS = [
  ['あおもり', 'nebuta', async () => {
    for (let i = 0; i < 4; i++) { await page.mouse.click(240, 522); await page.waitForTimeout(450); }
  }],
  ['いわて', 'sansa', async () => {
    for (let i = 0; i < 4; i++) { await page.mouse.click(i % 2 ? 340 : 140, 572); await page.waitForTimeout(400); }
  }],
  ['みやぎ', 'tanabata', async () => page.waitForTimeout(1200)],
  ['あきた', 'kantou', async () => {
    await page.mouse.move(240, 660); await page.mouse.down();
    for (let i = 0; i < 8; i++) { await page.mouse.move(180 + (i % 2) * 120, 660); await page.waitForTimeout(80); }
    await page.mouse.up();
  }],
  ['やまがた', 'hanagasa', async () => {
    await page.mouse.move(240 + 70, 392); await page.mouse.down();
    for (let i = 1; i <= 16; i++) {
      const a = (i / 8) * Math.PI;
      await page.mouse.move(240 + Math.cos(a) * 70, 392 + Math.sin(a) * 70);
      await page.waitForTimeout(30);
    }
    await page.mouse.up();
  }],
  ['ふくしま', 'waraji', async () => {
    for (let i = 0; i < 6; i++) { await page.mouse.click(i % 2 ? 350 : 130, 632); await page.waitForTimeout(250); }
  }],
];

for (const [pref, name, interact] of FESTS) {
  await page.goto(BASE_URL); // とうほく地図に もどる(currentRegion=tohoku)
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1400);
  await clickPref(pref);
  await d.startFest();
  await page.waitForTimeout(2200);
  await interact();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${SHOTS}/f4-fest-${name}.png` });
  log(`まつり: ${name}`);
}

await browser.close();
console.log('F4 SHOTS DONE');

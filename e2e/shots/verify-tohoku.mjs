/* とうほく祭りの得点検証: ねぶた・さんさ・はながさ・たなばた で実際にスコアが入ることを確認 */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
const d = makeDriver(page, '/home/user/project01/e2e/shots');

/** 県は 名まえの ラベルを おして 開く(地図の かたちが かわっても こわれない) */
const PREF = { aomori: 'あおもり', iwate: 'いわて', miyagi: 'みやぎ', yamagata: 'やまがた' };

const score = () =>
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
await d.clickText('ほっかいどう・とうほく'); // エリア名は ほっかいどう統合で かわった
await page.waitForTimeout(800);

const results = {};
const openFest = async (pref) => {
  const label = (await d.findTexts(PREF[pref]))[0];
  if (!label) throw new Error(`県の ラベルが みつからない: ${PREF[pref]}`);
  await page.mouse.click(label.x, label.y);
  await page.waitForTimeout(700);
  await d.startFest();
  await page.waitForTimeout(1200);
};
const backToMap = async () => {
  await page.goto(BASE_URL);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1400);
};

/* ねぶた: 連打すれば わっかの重なりに 何度か当たる */
await openFest('aomori');
for (let i = 0; i < 30; i++) {
  await page.mouse.click(240, 522);
  await page.waitForTimeout(200);
}
results.nebuta = await score();
await backToMap();

/* さんさ: 左レーンを 連打 */
await openFest('iwate');
for (let i = 0; i < 40; i++) {
  await page.mouse.click(140, 572);
  await page.waitForTimeout(160);
}
results.sansa = await score();
await backToMap();

/* はながさ: 3回転 */
await openFest('yamagata');
await page.mouse.move(310, 392);
await page.mouse.down();
for (let i = 1; i <= 60; i++) {
  const a = (i / 10) * Math.PI;
  await page.mouse.move(240 + Math.cos(a) * 70, 392 + Math.sin(a) * 70);
  await page.waitForTimeout(25);
}
await page.mouse.up();
results.hanagasa = await score();
await backToMap();

/* たなばた: ひかるフックの位置(Arc r=26)を さがして 3色を 順にドラッグ */
await openFest('miyagi');
for (let attempt = 0; attempt < 4 && !(await score()); attempt++) {
  const hook = await page.evaluate(() => {
    for (const scene of window.__game.scene.getScenes(true)) {
      const found = [];
      const walk = (list) => {
        for (const o of list) {
          if (o.list) walk(o.list);
          if (o.type === 'Arc' && Math.round(o.radius) === 26) {
            const m = o.getWorldTransformMatrix();
            found.push({ x: m.tx, y: m.ty });
          }
        }
      };
      walk(scene.children.list);
      if (found.length) return found[0];
    }
    return null;
  });
  if (!hook) break;
  for (const tx of [120, 240, 360]) {
    await page.mouse.move(tx, 652);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) {
      await page.mouse.move(tx + ((hook.x - tx) * i) / 6, 652 + ((hook.y - 652) * i) / 6);
      await page.waitForTimeout(30);
    }
    await page.mouse.up();
    await page.waitForTimeout(250);
    if (await score()) break;
  }
}
results.tanabata = await score();

console.log(JSON.stringify(results));
await browser.close();
const bad = Object.entries(results).filter(([, v]) => !v || v <= 0);
if (bad.length) {
  console.error('SCORE FAILED:', bad.map(([k]) => k).join(','));
  process.exit(1);
}
console.log('TOHOKU FESTS OK');

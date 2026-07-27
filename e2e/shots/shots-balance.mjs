/* バランス調整の確認: 名産が増えた県のリストと、新そざいの収穫を1つ実プレイする */
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

/* とうきょう: そざい3から5(わさび・うど 追加)の県ページ */
await page.mouse.click(10 + 155 * 1.263, 80 + 256 * 1.263);
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOTS}/bal-tokyo-pref.png` });
await d.scrollList(300);
await page.screenshot({ path: `${SHOTS}/bal-tokyo-pref2.png` });

/* わさび(pluck)を実際に収穫してスコアを確認 */
await d.scrollAndClick('なえを うえる', 2); // うめ(0), ブルーベリー(1), [わさび](2)
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
await page.waitForTimeout(2000);
const ripe = await page.evaluate(() => {
  const out = [];
  for (const scene of window.__game.scene.getScenes(true)) {
    const walk = (list) => {
      for (const o of list) {
        if (o.list) walk(o.list);
        if (o.name === 'mg-target' && (o.tintTopLeft ?? 0xffffff) === 0xffffff) {
          const m = o.getWorldTransformMatrix();
          out.push({ x: m.tx, y: m.ty });
        }
      }
    };
    walk(scene.children.list);
  }
  return out;
});
if (ripe.length) {
  const f = ripe[0];
  await page.mouse.move(f.x, f.y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(f.x, f.y + i * 14);
    await page.waitForTimeout(45);
  }
  await page.mouse.up();
}
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOTS}/bal-wasabi.png` });
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
console.log('wasabi pluck score:', score);
await browser.close();
if (!score || score <= 0) {
  console.error('WASABI SCORE FAILED');
  process.exit(1);
}
console.log('BALANCE SHOTS OK');

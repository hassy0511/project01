/* かいひきあげ(shell)の確認: みやぎの かき を実プレイしてスコアを確かめる */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = '/home/user/project01/e2e/shots';
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
const d = makeDriver(page, SHOTS);

const score = () =>
  page.evaluate(() => {
    let v = null;
    for (const s of window.__game.scene.getScenes(true)) {
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if (typeof o.text === 'string' && o.text.startsWith('スコア ')) v = Number(o.text.slice(4));
        }
      };
      walk(s.children.list);
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
await d.clickText('ほっかいどう・とうほく');
await page.waitForTimeout(800);
const miyagi = (await d.findTexts('みやぎ'))[0];
await page.mouse.click(miyagi.x, miyagi.y);
await page.waitForTimeout(700);
await d.scrollAndClick('たねがいを つるす');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${SHOTS}/shell-haul.png` });

/** たばの ワールド座標(かいの へいきん) */
const bunchPos = () =>
  page.evaluate(() => {
    const pts = [];
    for (const s of window.__game.scene.getScenes(true)) {
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if (o.name === 'mg-target') { const m = o.getWorldTransformMatrix(); pts.push({ x: m.tx, y: m.ty }); }
        }
      };
      walk(s.children.list);
    }
    if (!pts.length) return null;
    return { x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length };
  });

for (let round = 0; round < 3; round++) {
  const start = await bunchPos();
  if (!start) break;
  // だん1: ちょうどよい はやさで ひきあげる(1ステップ 18px / 60ms ≒ 0.3px/ms)
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  let y = start.y;
  for (let i = 0; i < 26 && y > 320; i++) {
    y -= 18;
    await page.mouse.move(start.x, y);
    await page.waitForTimeout(60);
  }
  await page.mouse.up();
  await page.waitForTimeout(400);
  if (round === 0) await page.screenshot({ path: `${SHOTS}/shell-peel.png` });
  // だん2: デッキの 貝を タップして はずす
  for (let k = 0; k < 8; k++) {
    const shells = await d.findNames('mg-target');
    if (!shells.length) break;
    await page.mouse.click(shells[0].x, shells[0].y);
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(500);
}
const sc = await score();
console.log('shell score:', sc);
await page.screenshot({ path: `${SHOTS}/shell-done.png` });
await browser.close();
if (!sc || sc <= 0) {
  console.error('SHELL SCORE FAILED');
  process.exit(1);
}
console.log('SHELL OK');

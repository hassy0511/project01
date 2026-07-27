/* F1-3 スクリーンショット: つみとり(pluck)・リズムづみ(rhythm)・いねかりの とり */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = '/home/user/project01/e2e/shots';
mkdirSync(SHOTS, { recursive: true });

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
log('セットアップ(全県アンロック)');

/** 熟した(tintなし=白)ターゲットの ワールド座標を かえす */
const ripeSpots = (name) =>
  page.evaluate((nm) => {
    const out = [];
    for (const scene of window.__game.scene.getScenes(true)) {
      const walk = (list) => {
        for (const o of list) {
          if (o.list) walk(o.list);
          if (o.name === nm && o.visible && (o.tintTopLeft ?? 0xffffff) === 0xffffff) {
            const m = o.getWorldTransformMatrix();
            out.push({ x: m.tx, y: m.ty });
          }
        }
      };
      walk(scene.children.list);
    }
    return out;
  }, name);

/* ---- 1. つみとり(いばらき いちご) ---- */
await clickPref('とちぎ');
await d.scrollAndClick('たねを まく', 1); // だいず, [いちご], ゆうがお
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
const arcadeT0 = Date.now();
await page.waitForTimeout(2200);
await page.screenshot({ path: `${SHOTS}/f13-pluck-field.png` });
let ripe = await ripeSpots('mg-target');
if (ripe.length) {
  const f = ripe[0];
  await page.mouse.move(f.x, f.y);
  await page.mouse.down();
  for (let i = 1; i <= 4; i++) {
    await page.mouse.move(f.x, f.y + i * 16);
    await page.waitForTimeout(60);
  }
  await page.screenshot({ path: `${SHOTS}/f13-pluck-stretch.png` }); // びよ〜ん中
  for (let i = 5; i <= 9; i++) {
    await page.mouse.move(f.x, f.y + i * 16);
    await page.waitForTimeout(50);
  }
  await page.mouse.up();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${SHOTS}/f13-pluck-pop.png` });
}
// まぼろしの おおつぶ(12秒後に出現)
await page.waitForTimeout(Math.max(0, 13000 - (Date.now() - arcadeT0)));
await page.screenshot({ path: `${SHOTS}/f13-pluck-big.png` });
log('つみとり撮影');

/* ---- 2. リズムづみ(さいたま ちゃば) ---- */
await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.waitForTimeout(1500);
await clickPref('さいたま');
await d.scrollAndClick('ちゃのきを うえる');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
await page.waitForTimeout(2600);
await page.screenshot({ path: `${SHOTS}/f13-rhythm.png` });
// 的の近くで何回かタップ(判定演出)
for (let i = 0; i < 5; i++) {
  await page.mouse.click(240, 400);
  await page.waitForTimeout(900);
}
await page.screenshot({ path: `${SHOTS}/f13-rhythm-tap.png` });
log('リズムづみ撮影');

/* ---- 3. いねかりの とり(ちば こめ。バランス調整で 米の さんちが うつった) ---- */
await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.waitForTimeout(1500);
await clickPref('ちば');
await d.scrollAndClick('いねを うえる');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
const t0 = Date.now();
for (;;) {
  const birds = await d.findNames('mg-bird');
  if (birds.length) break;
  if (Date.now() - t0 > 12000) {
    console.error('bird did not appear in 12s');
    break;
  }
  await page.waitForTimeout(120);
}
await page.waitForTimeout(400); // 飛行中の姿
await page.screenshot({ path: `${SHOTS}/f13-reap-bird.png` });
log('いねかりの とり撮影');

await browser.close();
console.log('SHOTS DONE');

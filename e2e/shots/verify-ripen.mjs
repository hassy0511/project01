/* そだちの だんかいが 見わけられるか の 目視かくにん。
   ブルーベリー(chain: みどり→あか→むらさき)と わさび(pluck: クリーム→ライム)を
   はじまってすぐ・とちゅう・あとの 3まい とる。
   実行: node e2e/shots/verify-ripen.mjs */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = '/home/user/project01/e2e/shots';
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
const d = makeDriver(page, SHOTS);

/** いま でている みの テクスチャを かぞえる */
const stageCount = () =>
  page.evaluate(() => {
    const c = {};
    for (const s of window.__game.scene.getScenes(true)) {
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if ((o.name === 'mg-target' || o.name === 'mg-fruit') && o.visible) {
            const k = (o.texture?.key ?? '?') + (o.tintTopLeft !== 0xffffff ? '+tint' : '');
            c[k] = (c[k] ?? 0) + 1;
          }
        }
      };
      walk(s.children.list);
    }
    return c;
  });

await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1500);
await page.evaluate(() => window.__mqAdmin.skipGuides()); // はじめての 3コマは verify-guide.mjs で しらべる
await d.clickText('スキップ');
await d.waitText('にっぽん ぜんこく');
await d.clickText('かんとう');
await page.waitForTimeout(800);
await page.evaluate(() => window.__mqAdmin.unlockAll());
await page.waitForTimeout(400);

const runOne = async (pref, verbNth, tag) => {
  // まいかい さらの じょうたいに もどす(まえの しゅうかくで ならびが かわらない ように)
  await page.goto(BASE_URL);
  await page.waitForSelector('canvas');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__mqAdmin.skipGuides());
  await d.clickText('スキップ');
  await d.waitText('にっぽん ぜんこく');
  await d.clickText('かんとう');
  await page.waitForTimeout(800);
  await page.evaluate(() => window.__mqAdmin.unlockAll());
  await page.waitForTimeout(600);
  const t = (await d.findTexts(pref))[0];
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(700);
  await d.scrollAndClick('なえを うえる', verbNth);
  await page.evaluate(() => window.__mqAdmin.boostAll());
  await page.waitForTimeout(1600);
  await d.scrollAndClick('しゅうかく!');
  await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
  for (const [ms, no] of [[900, 1], [2600, 2], [5200, 3]]) {
    await page.waitForTimeout(no === 1 ? ms : ms - 900);
    await page.screenshot({ path: `${SHOTS}/ripen-${tag}-${no}.png` });
    console.log(`${tag}-${no}`, JSON.stringify(await stageCount()));
  }
};

await runOne('とうきょう', 1, 'blueberry'); // うめ(0), ブルーベリー(1), わさび(2)
await runOne('とうきょう', 2, 'wasabi');
await browser.close();
console.log('RIPEN SHOTS DONE');

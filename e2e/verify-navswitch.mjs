/* ナビの switch(ねむらせて 再利用)の 回帰テスト。

   しらべる こと:
     1. ナビで ずかんへ → ちずは ねむる(こわされない)
     2. ナビで ちずへ もどる → ずかんは ねむり、ちずは 目をさます
     3. セーブが 変わって いない とき、ずかんへ もどると 作りなおさず そのまま
        (前に つけた しるしが のこって いる)
     4. セーブが 変わった とき(boostAll)、ずかんへ もどると 作りなおす
        (しるしが きえて いる)
     5. 2回目に ずかんを ひらく のは 1回目より ずっと はやい

   実行: node e2e/verify-navswitch.mjs(preview サーバーを 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from './helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('./shots/out', import.meta.url).pathname;

/* ナビの あたり位置(ui/nav.ts: x=70+i*110, ナビ帯は GAME_H-72 から) */
const NAV_Y = 800 - 36;
const NAV_X = { map: 70, zukan: 180, inv: 290 };

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
const d = makeDriver(page, SHOTS);
void d;
const assert = (cond, msg) => {
  if (!cond) problems.push(msg);
};

const status = (key) =>
  page.evaluate((k) => {
    const s = window.__game.scene.getScene(k);
    if (!s) return 'none';
    if (s.sys.isSleeping()) return 'sleeping';
    if (s.sys.isActive()) return 'active';
    return 'other';
  }, key);

await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1300);
await page.evaluate(() => {
  window.__mqAdmin.skipGuides();
  window.__mqAdmin.unlockAll();
});
await page.evaluate(() => window.__game.scene.getScenes(true)[0].scene.start('MapScene'));
await page.waitForTimeout(1000);

/* 1. ちず → ずかん(はじめて = 作る)。かかった 時間を おぼえる */
const t0 = Date.now();
await page.mouse.click(NAV_X.zukan, NAV_Y);
await page.waitForFunction(() => window.__game.scene.getScene('ZukanScene')?.sys.isActive(), null, { timeout: 8000 });
await page.waitForTimeout(1500); // セルの 組み立てを まつ
const firstOpenMs = Date.now() - t0;
assert((await status('MapScene')) === 'sleeping', `ちずが ねむって いない(${await status('MapScene')})`);

// ずかんの 1つ目の 子に しるしを つける(作りなおしの 見わけ)
await page.evaluate(() => {
  window.__game.scene.getScene('ZukanScene').children.list[0].__mark = true;
});

/* 2. ずかん → ちず → ずかん(セーブは 変わって いない = そのまま 目ざめる) */
await page.mouse.click(NAV_X.map, NAV_Y);
await page.waitForFunction(() => window.__game.scene.getScene('MapScene')?.sys.isActive(), null, { timeout: 8000 });
assert((await status('ZukanScene')) === 'sleeping', `ずかんが ねむって いない(${await status('ZukanScene')})`);
const t1 = Date.now();
await page.mouse.click(NAV_X.zukan, NAV_Y);
await page.waitForFunction(() => window.__game.scene.getScene('ZukanScene')?.sys.isActive(), null, { timeout: 8000 });
const secondOpenMs = Date.now() - t1;
const markKept = await page.evaluate(() => window.__game.scene.getScene('ZukanScene').children.list[0].__mark === true);
assert(markKept, 'セーブが 変わって いないのに ずかんを 作りなおして いる');
console.log(`ずかんを ひらく: 1回目 ${firstOpenMs}ms / 2回目 ${secondOpenMs}ms`);
assert(secondOpenMs < Math.max(700, firstOpenMs), '2回目の ずかんが はやく なって いない');

/* 3. セーブを 変えて(boostAll) もどる → 作りなおす */
await page.mouse.click(NAV_X.map, NAV_Y);
await page.waitForFunction(() => window.__game.scene.getScene('MapScene')?.sys.isActive(), null, { timeout: 8000 });
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.mouse.click(NAV_X.zukan, NAV_Y);
await page.waitForFunction(() => window.__game.scene.getScene('ZukanScene')?.sys.isActive(), null, { timeout: 8000 });
await page.waitForTimeout(800);
const markGone = await page.evaluate(() => window.__game.scene.getScene('ZukanScene').children.list[0].__mark !== true);
assert(markGone, 'セーブが 変わったのに ずかんを 作りなおして いない');

/* 4. もちものtoo: ナビで 行き来 しても こわれない */
await page.mouse.click(NAV_X.inv, NAV_Y);
await page.waitForFunction(() => window.__game.scene.getScene('InvScene')?.sys.isActive(), null, { timeout: 8000 });
await page.mouse.click(NAV_X.map, NAV_Y);
await page.waitForFunction(() => window.__game.scene.getScene('MapScene')?.sys.isActive(), null, { timeout: 8000 });
assert((await status('InvScene')) === 'sleeping', 'もちものが ねむって いない');
await page.screenshot({ path: `${SHOTS}/navswitch.png` });

await browser.close();
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('NAVSWITCH OK');

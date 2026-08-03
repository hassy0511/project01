/* ちゅうもんの 回帰テスト。

   しらべる こと:
     1. おまつり前: 県ページに ちゅうもんは 出ない
     2. おまつり後: ちゅうもんカードが 出る(たのまれた ものは 自県で とれない)
     3. とどけると ありがとう+かざり+称号。つぎの ちゅうもんが すぐ 出る
     4. ずかんの おれいタブに かざりと 称号が ならぶ

   実行: node e2e/verify-orders.mjs(preview サーバーを 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from './helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('./shots/out', import.meta.url).pathname;

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
const d = makeDriver(page, SHOTS);
const assert = (cond, msg) => {
  if (!cond) problems.push(msg);
};

const findPart = (part) =>
  page.evaluate((p) => {
    const out = [];
    for (const scene of window.__game.scene.getScenes(true)) {
      const walk = (list) => {
        for (const o of list) {
          if (o.list) walk(o.list);
          if (typeof o.text === 'string' && o.text.includes(p) && o.visible) out.push(o.text);
        }
      };
      walk(scene.children.list);
    }
    return out;
  }, part);

const gotoPref = async (prefId) => {
  await page.evaluate((id) => window.__game.scene.getScenes(true)[0].scene.start('PrefScene', { prefId: id }), prefId);
  await page.waitForTimeout(900);
};
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('meisanquest-save-v1')));

await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1300);
await page.evaluate(() => {
  window.__mqAdmin.skipGuides();
  window.__mqAdmin.unlockAll(); // 全県 開拓+しなものは 2こずつ ある 状態
});

/* 1. おまつり前は ちゅうもん なし */
await gotoPref('ibaraki');
assert((await d.findTexts(' ちゅうもん').length ?? 0) === 0 && (await findPart('ほしいなあ')).length === 0, 'おまつり前なのに ちゅうもんが 出ている');

/* 2. おまつり後は ちゅうもんカードが 出る */
await page.evaluate(() => window.__mqAdmin.fest('ibaraki'));
await gotoPref('ibaraki');
const ask = await findPart('ほしいなあ');
assert(ask.length > 0, 'おまつり後に ちゅうもんが 出ない');
console.log('ちゅうもん:', ask[0] ?? '(なし)');
const s1 = await save();
const order1 = s1.orders?.ibaraki;
assert(order1, 'セーブに ちゅうもんが 入っていない');
await page.screenshot({ path: `${SHOTS}/order-card.png` });

/* 3. とどける → かざり+称号 → つぎの ちゅうもん */
await d.scrollAndClick('とどける!');
await d.waitText('ありがとう!');
assert((await findPart('おれいに')).length > 0, 'かざりが もらえていない');
assert((await findPart('はいたつ みならい')).length > 0, '称号が もらえていない');
await page.screenshot({ path: `${SHOTS}/order-thanks.png` });
await d.clickText('やったー!');
await page.waitForTimeout(700);
const s2 = await save();
assert(s2.orderDone?.ibaraki === 1, `orderDone が 1 に ならない(${JSON.stringify(s2.orderDone)})`);
assert(s2.orders?.ibaraki, 'つぎの ちゅうもんが 出ていない');
assert((await findPart('ほしいなあ')).length > 0, '画面に つぎの ちゅうもんカードが ない');

/* 4. ずかんの おれいタブ */
await page.evaluate(() => window.__game.scene.getScenes(true)[0].scene.start('ZukanScene'));
await page.waitForTimeout(800);
await d.clickName('tab-kazari');
await page.waitForTimeout(700);
assert((await d.findTexts('はいたつ みならい')).length > 0, 'おれいタブに 称号が ない');
assert((await d.findTexts('うめの かんざし')).length > 0, 'いばらきの かざりが ずかんに ない');
const tabCount = await findPart('1/47');
assert(tabCount.length > 0, 'おれいタブの かぞえが 1/47 に なっていない');
await page.screenshot({ path: `${SHOTS}/order-zukan.png` });

await browser.close();
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('ORDERS OK');

/* M2 受け入れテスト: 開拓→たねまき→⏩→収穫→レシピ→クラフト→うめまつり の一周を
   実ブラウザのUIクリックでプレイし、セーブ状態を検証する。
   実行: npm run test:e2e(ビルド+preview サーバー起動込み) */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from './helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('./shots', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
const d = makeDriver(page, SHOTS);
const log = (s) => console.log('✔ ' + s);

/* ---- セーブをリセットして開始 ---- */
await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1500);

/* 1. いばらき開拓(形/位置+知識クイズ) */
// 地図クリック座標: MapScene の scale=min(460/364,560/407)≈1.263, offX≈10, offY=80
await page.mouse.click(10 + 276 * 1.263, 80 + 155 * 1.263);
await d.clickText('ちょうせん する!');
await d.answerQuiz();
await d.answerQuiz();
await d.waitText('かいたく せいこう!');
await d.clickText('いばらきけんに いく!');
log('いばらき開拓');

/* 2. うめ: なえを うえる → ⏩ → pluck収穫 ★3 */
await d.waitText('なえを うえる');
await d.clickText('なえを うえる');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600); // 1秒ティッカーの再描画待ち
await d.clickText('しゅうかく!');
await page.waitForFunction(() => window.__mq?.kind === 'pluck', null, { timeout: 8000 });
for (let i = 0; i < 6; i++) {
  const targets = await d.findTexts('🫒');
  if (!targets.length) break;
  await page.mouse.click(targets[0].x, targets[0].y);
  await page.waitForTimeout(120);
}
await d.answerQuiz();
await d.waitText('もどる');
await d.clickText('もどる');
await d.dismissTrivia();
log('うめ収穫(pluck+クイズ=★3×2)');

/* 3. いど回収 → 4. ねんど(dig) */
await d.clickText('くみあげる');
await d.dismissTrivia();
log('いど回収(みず×3 ★2)');
await d.clickText('ほりに いく');
await d.digAllSteps();
await d.waitText('もどる');
await d.clickText('もどる');
await d.dismissTrivia();
log('ねんど ほりあて(dig×3+クイズ=★3×2)');

/* 5. うめジュース: レシピ取得 → クラフト */
await d.scrollAndClick('レシピを さがす', 2); // r01,r02,[r03]
await d.clickText('クイズに ちょうせん!');
await d.answerQuiz();
await d.answerQuiz();
await d.clickText('やったー!');
await d.scrollAndClick('つくる');
await d.clickText('つくる!');
await d.waitText('やったー!');
await d.clickText('やったー!');
await d.dismissTrivia();
log('うめジュース(レシピ探索→クラフト)');

/* 6. かさまやき(いばらき産ねんど 産地指定) */
await d.scrollAndClick('レシピを さがす', 3); // r01,r02,r04,[r05]
await d.clickText('クイズに ちょうせん!');
await d.answerQuiz();
await d.answerQuiz();
await d.clickText('やったー!');
await d.scrollAndClick('つくる', 1); // 0番目は材料切れの うめジュース
await d.clickText('つくる!');
await d.waitText('やったー!');
await d.clickText('やったー!');
await d.dismissTrivia();
log('かさまやき(産地指定クラフト)');

/* 7. うめまつり(だんどりパズル) */
await d.scrollAndClick('ひらく!');
await d.clickText('じゅんびスタート!');
for (const step of ['かいじょうを おそうじ', 'うめのきを かざる', 'ちょうちんを つける', 'おきゃくさんを おむかえ']) {
  await d.clickText(step);
  await page.waitForTimeout(200);
}
await d.waitText('ちずを みる!', 10000);
await page.screenshot({ path: `${SHOTS}/festival-done.png` });
await d.clickText('ちずを みる!');
await d.dismissTrivia();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${SHOTS}/map-after-festival.png` });
log('うめまつり開催 → 地図に🏮');

/* 8. ちば: いわし(timing) — 県またぎでミニゲーム3種目を網羅 */
await page.mouse.click(10 + 260 * 1.263, 80 + 290 * 1.263);
await d.clickText('ちょうせん する!');
await d.answerQuiz();
await d.answerQuiz();
await d.waitText('かいたく せいこう!');
await d.clickText('ちばけんに いく!');
await d.scrollAndClick('りょうに でる');
await d.timingAllSteps();
await d.waitText('もどる');
await d.clickText('もどる');
await d.dismissTrivia();
log('ちば開拓 → いわし漁(timing)');

/* 9. セーブ検証 */
const save = await page.evaluate(() => JSON.parse(localStorage.getItem('meisanquest-save-v1')));
const assert = (cond, msg) => {
  if (!cond) throw new Error('assert failed: ' + msg);
};
assert(save.unlocked.includes('ibaraki') && save.unlocked.includes('chiba'), 'unlocked');
assert(save.fest.includes('rf1'), 'rf1 held');
assert(save.zukanProd.r03 && save.zukanProd.r05, 'crafted r03/r05');
assert(save.zukanProd.r05.jimoto === true, 'r05 jimoto medal');
assert(save.zukanMat.m06.ibaraki === 3, 'ume ★3');
assert(save.zukanMat.m01.ibaraki === 2, 'mizu ★2');
assert(save.zukanMat.m09?.chiba >= 1, 'iwashi obtained');
log('セーブ検証 OK');

if (errors.length) {
  console.error('page errors:', errors);
  process.exit(1);
}
console.log('\nALL E2E PLAYTHROUGH PASSED 🎉');
await browser.close();

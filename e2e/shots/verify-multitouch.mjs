/* ゆびを 2本 つかう ゲームが ほんとうに 2本 とれて いるか しらべる。

   さんさおどり(いわて)は ひだり・みぎの たいこに **同時に** ノーツを 出す
   (sansaGame の spawn(1 - lane))。Phaser の 既定は タッチ1本 なので、
   main.ts で input.activePointers を 指定しないと 2本目が とどかず
   「同時に たたけない」= 遊びとして 成立しない。

   ここでは CDP で ほんものの 2点タッチを 送って、
   ・pointerdown が 2回 くる
   ・2つの たいこ 両方に あたって 点が 入る
   ことを たしかめる。

   実行: node e2e/shots/verify-multitouch.mjs(preview サーバーを 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('.', import.meta.url).pathname;
/** さんさおどりの たいこ(sansaGame の LANE_X と DRUM_Y。area は 52 下) */
const DRUMS = [
  [140, 470 + 52],
  [340, 470 + 52],
];

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
// タッチイベントが とどく ようにする(スマホと おなじ 条件)
const ctx = await browser.newContext({ viewport: { width: 480, height: 800 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const d = makeDriver(page, SHOTS);
const problems = [];
const cdp = await ctx.newCDPSession(page);

/** ほんものの 2点 同時タッチ(CDP。Playwright の tap は 1点しか 送れない) */
const twoFingerTap = async (pts) => {
  const touchPoints = pts.map(([x, y], i) => ({ x, y, id: i + 1 }));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints });
  await page.waitForTimeout(60);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};

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
await page.evaluate(() => window.__mqAdmin.skipGuides());

/* --- 1. Phaser が ゆび2本ぶん もって いるか --- */
const pointers = await page.evaluate(() => window.__game.input.pointers.length);
console.log(`Phaser の ポインタ数: ${pointers}`);
if (pointers < 3) problems.push(`ポインタが ${pointers}本 しか ない(main.ts の activePointers を 見る)`);

await d.clickText('スキップ');
await d.waitText('にっぽん ぜんこく');
await d.clickText('かんとう');
await page.waitForTimeout(700);
await page.evaluate(() => window.__mqAdmin.unlockAll());
await page.waitForTimeout(400);
await d.clickText('にっぽん');
await d.clickText('ほっかいどう・とうほく');
await page.waitForTimeout(800);
const iwate = (await d.findTexts('いわて'))[0];
if (!iwate) {
  problems.push('いわて が 見つからない');
} else {
  await page.mouse.click(iwate.x, iwate.y);
  await page.waitForTimeout(700);
  await d.startFest();
  await page.waitForTimeout(1500);

  /* --- 2. 同時タッチで pointerdown が 2回 くるか --- */
  await page.evaluate(() => {
    window.__pd = 0;
    for (const s of window.__game.scene.getScenes(true)) {
      if (s.scene.key !== 'FestivalScene') continue;
      s.input.on('pointerdown', () => {
        window.__pd++;
      });
    }
  });
  await twoFingerTap(DRUMS);
  await page.waitForTimeout(300);
  const pd = await page.evaluate(() => window.__pd);
  console.log(`2本指タップ → pointerdown ${pd}回`);
  if (pd < 2) problems.push(`2本指で たたいたのに pointerdown が ${pd}回 しか こない`);

  /* --- 3. 両方の たいこに あたって 点が 入るか(ノーツの タイミングに あうまで くりかえす) --- */
  const before = await score();
  for (let i = 0; i < 30 && (await score()) === before; i++) {
    await twoFingerTap(DRUMS);
    await page.waitForTimeout(220);
  }
  const after = await score();
  console.log(`スコア: ${before} → ${after}`);
  if (!(after > (before ?? 0))) problems.push('2本指で たたいても 点が 入らない');
  await page.screenshot({ path: `${SHOTS}/multitouch-sansa.png` });
}

await browser.close();
if (errors.length) console.error('PAGEERROR:', [...new Set(errors)].join(' | '));
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('MULTITOUCH OK');

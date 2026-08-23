/* ずかん 100%(真コンプ)の おいわいの テスト。

   505件 ぜんぶ 集めた ときの 演出は 手でしか 確かめられて いなかった。
   ここまで あそんで たどりつく のは 現実的で ない ので、
   __mqAdmin.zukanFull() で 「ぜんぶ 集めた セーブ」を 作って 見にいく。

   しらべる こと:
     1. ヘッダーの かぞえが 505/505 に なる
     2. ずかんを ひらくと はかせの おいわいが 出る(称号 「ものしりはかせ」)
     3. **2回目は 出ない**(1回だけの ごほうび。毎回 出たら うっとうしい)

   実行: node e2e/verify-zukan-full.mjs(preview サーバーを 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from './helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('./shots', import.meta.url).pathname;

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
const d = makeDriver(page, SHOTS);

/* ナビの 「ずかん」の ばしょ(ui/nav.ts: x=70+i*110、ナビ帯は GAME_H-72 から) */
const NAV_ZUKAN = { x: 180, y: 800 - 36 };

await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1500);

/* 「ぜんぶ 集めた」セーブを 作る。skipGuides は おいわいも 止めて しまう ので つかわない
   (ZukanScene の maybeCelebrateFull は runtimeStory.muted で 出なくなる) */
await page.evaluate(() => {
  window.__mqAdmin.unlockAll();
  window.__mqAdmin.zukanFull();
});
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(2000);

/* --- 1. ヘッダーの かぞえ --- */
const countText = await page.evaluate(() => {
  let t = null;
  for (const s of window.__game.scene.getScenes(true)) {
    const walk = (l) => {
      for (const o of l) {
        if (o.list) walk(o.list);
        // ナビの ラベルも 「ずかん」なので、かぞえ(505/505)が ある ほうだけ 取る
        if (typeof o.text === 'string' && o.text.includes('ずかん') && o.text.includes('/')) t = o.text;
      }
    };
    walk(s.children.list);
  }
  return t;
});
console.log('ヘッダー:', countText);
const m = /(\d+)\s*\/\s*(\d+)/.exec(countText ?? '');
if (!m) problems.push(`ずかんの かぞえが 読めない: ${countText}`);
else if (m[1] !== m[2]) problems.push(`100% に なって いない: ${m[1]}/${m[2]}`);

/* --- 2. ずかんを ひらくと おいわいが 出る --- */
await page.mouse.click(NAV_ZUKAN.x, NAV_ZUKAN.y);
await page.waitForTimeout(2000);
const celebrated = (await d.findTexts('ずかん かんせい!')).length > 0;
const gotTitle = (await page.evaluate(() => {
  let hit = false;
  for (const s of window.__game.scene.getScenes(true)) {
    const walk = (l) => {
      for (const o of l) {
        if (o.list) walk(o.list);
        if (typeof o.text === 'string' && o.text.includes('ものしりはかせ')) hit = true;
      }
    };
    walk(s.children.list);
  }
  return hit;
})) === true;
console.log(`おいわい: ${celebrated ? '出た ✓' : '出ない ✗'} / 称号の ことば: ${gotTitle ? 'ある ✓' : 'ない ✗'}`);
if (!celebrated) problems.push('505件 そろっても おいわいが 出ない');
if (!gotTitle) problems.push('おいわいに 称号(ものしりはかせ)の ことばが ない');
await page.screenshot({ path: `${SHOTS}/zukan-full.png` });

/* --- 3. 2回目は 出ない --- */
await d.clickText('えっへん!');
await page.waitForTimeout(600);
await page.mouse.click(70, NAV_ZUKAN.y); // ちずへ
await page.waitForTimeout(1200);
await page.mouse.click(NAV_ZUKAN.x, NAV_ZUKAN.y); // ずかんへ もどる
await page.waitForTimeout(2000);
const again = (await d.findTexts('ずかん かんせい!')).length > 0;
console.log(again ? '2回目: また 出た ✗' : '2回目: 出ない ✓');
if (again) problems.push('おいわいが 毎回 出る(1回だけの はず)');

await browser.close();
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('ZUKAN FULL OK');

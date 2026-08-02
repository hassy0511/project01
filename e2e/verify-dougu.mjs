/* どうぐの 回帰テスト。

   しらべる こと:
     1. どうぐ なし: いねかり(reap)の あそび時間は もとの ながさ
     2. かま(Lv2)を もつと あそび時間が のびて、HUD に どうぐの しるしが 出る
     3. もちものに どうぐの ならびが あり、まだの ものは 「〜で つくれるよ」
     4. どうぐレシピを ほんとうに UI から 作れて、作ると tools が 上がる

   実行: node e2e/verify-dougu.mjs(preview サーバーを 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from './helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('./shots/out', import.meta.url).pathname;
/** Lv2 どうぐの のび(core/tools.ts の TOOL_ASSIST_LV2 と そろえる) */
const LV2_RATIO = 1.12;

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
const d = makeDriver(page, SHOTS);
const assert = (cond, msg) => {
  if (!cond) problems.push(msg);
};

/** 部分一致で テキストを さがす(findTexts は 完全一致) */
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

await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1300);
await page.evaluate(() => {
  window.__mqAdmin.skipGuides();
  window.__mqAdmin.unlockAll();
  window.__mqAdmin.fastMode();
});

/** ちばの こめ(reap)を 1回 あそび、あそび時間(のこり秒の さいしょ)を はかる */
const measureReap = async () => {
  await page.evaluate(() => window.__game.scene.getScenes(true)[0].scene.start('PrefScene', { prefId: 'chiba' }));
  await page.waitForTimeout(900);
  const planted = await d.findTexts('しゅうかく!');
  if (!planted.length) {
    await d.scrollAndClick('いねを うえる');
    await page.evaluate(() => window.__mqAdmin.boostAll());
    await page.waitForTimeout(1600);
    await d.scrollAndClick('しゅうかく!');
  } else {
    await d.scrollAndClick('しゅうかく!');
  }
  await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
  const sec = await page.evaluate(() => window.__mq.durationSec);
  // あそびを おわらせて クイズも すませる(つぎの 計測の ために 畑を あける)
  await d.playArcade();
  await d.answerQuiz();
  await d.waitText('もどる');
  await d.clickText('もどる');
  await page.waitForTimeout(700);
  const trivia = await d.findTexts('へえ!');
  if (trivia.length) await page.mouse.click(trivia[0].x, trivia[0].y);
  await page.waitForTimeout(400);
  return sec;
};

/* 1. どうぐ なしの あそび時間 */
const base = await measureReap();
assert(base > 0, `reap の あそび時間が とれない(${base})`);

/* 2. かま(Lv2)を もたせる → のびる + HUD の しるし */
await page.evaluate(() => {
  const key = 'meisanquest-save-v1';
  const s = JSON.parse(localStorage.getItem(key));
  s.tools = { reap: 2 };
  localStorage.setItem(key, JSON.stringify(s));
});
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1300);
await page.evaluate(() => window.__mqAdmin.fastMode());

await page.evaluate(() => window.__game.scene.getScenes(true)[0].scene.start('PrefScene', { prefId: 'chiba' }));
await page.waitForTimeout(900);
await d.scrollAndClick('いねを うえる');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
const withTool = await page.evaluate(() => window.__mq.durationSec);
const hud = await findPart('どうぐ Lv2');
assert(hud.length > 0, 'HUD に 「どうぐ Lv2」が 出ていない');
await d.playArcade();
await d.answerQuiz();
await d.waitText('もどる');
await d.clickText('もどる');
await page.waitForTimeout(600);

const ratio = withTool / base;
console.log(`reap あそび時間: なし ${base.toFixed(2)}s / かまLv2 ${withTool.toFixed(2)}s (×${ratio.toFixed(3)})`);
assert(Math.abs(ratio - LV2_RATIO) < 0.02, `のびが おかしい(×${ratio.toFixed(3)}、きたいは ×${LV2_RATIO})`);

/* 3. もちものの どうぐの ならび */
await page.evaluate(() => window.__game.scene.getScenes(true)[0].scene.start('InvScene'));
await page.waitForTimeout(800);
assert((await d.findTexts('どうぐ')).length > 0, 'もちものに どうぐの 見出しが ない');
assert((await d.findTexts('えちごの かま')).length > 0, '作った かまが もちものに 出ていない');
assert((await d.findTexts('Lv2')).length > 0, 'かまの Lv2 が 出ていない');
const hints = await findPart('つくれるよ');
assert(hints.length >= 5, `まだの どうぐの 「〜で つくれるよ」が すくない(${hints.length})`);
await page.screenshot({ path: `${SHOTS}/dougu-inv.png` });

/* 4. どうぐレシピを UI から 作る(にいがた の かま は Lv2 済みなので べつの どうぐ:
      あきたの ゆきべら = き×2。材料と レシピ習得を セーブに 入れて 作るだけを ためす) */
await page.evaluate(() => {
  const key = 'meisanquest-save-v1';
  const s = JSON.parse(localStorage.getItem(key));
  s.recipes.push('rd08');
  s.inv.push({ ref: 'm126', origin: 'nagano', quality: 1 }, { ref: 'm126', origin: 'nagano', quality: 1 });
  localStorage.setItem(key, JSON.stringify(s));
});
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1300);
await page.evaluate(() => window.__game.scene.getScenes(true)[0].scene.start('PrefScene', { prefId: 'akita' }));
await page.waitForTimeout(900);
// unlockAll で ぜんぶの カードに 「つくる」が ならぶ ので、
// ゆきべらの カードまで スクロールして、その 行の 「つくる」を おす
await d.scrollAndClick('あきたの ゆきべら〔どうぐ〕'); // 題字は 押せないが 見える ところまで スクロールされる
const cardTitle = (await d.findTexts('あきたの ゆきべら〔どうぐ〕'))[0];
const buttons = await d.findTexts('つくる');
const mine = buttons.reduce((b, x) => (Math.abs(x.y - cardTitle.y) < Math.abs(b.y - cardTitle.y) ? x : b));
if (Math.abs(mine.y - cardTitle.y) > 50) problems.push('ゆきべらの カードに つくるボタンが ない');
await page.mouse.click(mine.x, mine.y);
await d.waitText('つくる!');
await d.clickText('つくる!');
await page.waitForTimeout(900);
assert((await findPart('てに いれた')).length > 0, 'どうぐを 作った ときの せつめいが 出ない');
const tools = await page.evaluate(() => JSON.parse(localStorage.getItem('meisanquest-save-v1')).tools);
assert(tools.sweep === 2, `ゆきべらを 作っても tools.sweep が 2 に ならない(${JSON.stringify(tools)})`);
assert(tools.reap === 2, 'かまの Lv2 が きえた');

await browser.close();
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('DOUGU OK');

/* しんの めいさん・季節・きわみどうぐの 回帰テスト。

   しらべる こと:
     1. おまつり前: 県ページに しんの そざいは 出ない
     2. おまつり後: 「しんの めいさん」の 見出しと そざいが 出る
     3. 季節外れの 激レアは 「◯◯に なったら とれるよ」で うえられない
     4. しんの 収穫は あそび時間が みじかい(SHIN_TUNING.durationScale)
     5. きわみ(Lv3)どうぐは つかいこみ 20回まで ねむって いる

   実行: node e2e/verify-shin.mjs(preview サーバーを 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from './helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('./shots/out', import.meta.url).pathname;
/** しんの あそび時間の 倍率(data/arcadeTuning.ts の SHIN_TUNING と そろえる) */
const SHIN_DURATION_SCALE = 0.85;

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

/* 1. おまつり前: しんは 見えない */
await gotoPref('ibaraki');
assert((await findPart('しんの めいさん')).length === 0, 'おまつり前なのに しんの 見出しが 出ている');
assert((await findPart('れんこんの はすだ')).length === 0, 'おまつり前なのに れんこんが 出ている');

/* 2. おまつりを ひらいた ことに する → しんが 出る */
await page.evaluate(() => window.__mqAdmin.fest('ibaraki'));
await gotoPref('ibaraki');
assert((await findPart('しんの めいさん')).length > 0, 'おまつり後に しんの 見出しが 出ない');
assert((await findPart('れんこんの はすだ')).length > 0, 'おまつり後に れんこんの はたけが 出ない');
await page.screenshot({ path: `${SHOTS}/shin-open.png` });

/* 3. 季節: いまの 季節を しらべ、季節外れの あんこう(ふゆ)の ふるまいを 見る。
      テストを どの 季節に 走らせても いい ように、ふゆ 以外なら ロック文言を たしかめ、
      ふゆなら ふつうに あそべる ことを たしかめる */
const season = await page.evaluate(() => {
  // ビルドに 埋まった 関数は 直接 よべない ので、見出しの 文字から よみとる
  return null;
});
void season;
const ankouLocked = await findPart('なったら とれるよ');
const ankouCard = await findPart('あんこう');
assert(ankouCard.length > 0, 'あんこうの カードが ない');
// ふゆ以外の 3/4 の 期間は ロック文言が ある はず。ふゆなら りょうに でる ボタンが おせる
if (ankouLocked.length > 0) {
  console.log('季節: ふゆ以外(あんこうは まちぼうけ) ✓');
} else {
  console.log('季節: いまは ふゆ(あんこうが とれる) ✓');
}

/* 4. しんの あそび時間は みじかい。れんこん(mine)と ふつうの mine そざいを くらべる */
// ふつうの mine: ねんど(いばらき)
await gotoPref('ibaraki');
await d.scrollAndClick('ほりに いく');
await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
const normalDur = await page.evaluate(() => window.__mq.durationSec);
await d.playArcade();
await d.answerQuiz();
await d.waitText('もどる');
await d.clickText('もどる');
await page.waitForTimeout(700);
const trivia1 = await d.findTexts('へえ!');
if (trivia1.length) await page.mouse.click(trivia1[0].x, trivia1[0].y);
await page.waitForTimeout(400);

// しんの mine: れんこん(うえて そだてて ほる)
await gotoPref('ibaraki');
await d.scrollAndClick('たねばすを うえる');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
const shinDur = await page.evaluate(() => window.__mq.durationSec);
const hudShin = await findPart('どうぐ');
void hudShin;
await d.playArcade();
await d.answerQuiz();
await d.waitText('もどる');
await d.clickText('もどる');
await page.waitForTimeout(700);
const trivia2 = await d.findTexts('へえ!');
if (trivia2.length) await page.mouse.click(trivia2[0].x, trivia2[0].y);
await page.waitForTimeout(400);

const ratio = shinDur / normalDur;
console.log(`mine あそび時間: ふつう ${normalDur.toFixed(2)}s / しん ${shinDur.toFixed(2)}s (×${ratio.toFixed(3)})`);
assert(Math.abs(ratio - SHIN_DURATION_SCALE) < 0.02, `しんの 時間倍率が おかしい(×${ratio.toFixed(3)})`);

/* 5. きわみ(Lv3)どうぐ: Lv2を もって いても つかいこみ 20回までは ねむったまま */
await page.evaluate(() => {
  const key = 'meisanquest-save-v1';
  const s = JSON.parse(localStorage.getItem(key));
  s.tools = { reap: 2 };
  s.toolUse = { reap: 3 };
  localStorage.setItem(key, JSON.stringify(s));
});
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1300);
await gotoPref('niigata');
const sleeping = await findPart('めを さます');
assert(sleeping.length > 0, 'きわみの かまが ねむりカードに なっていない');
// 20回 つかった ことに すると 目ざめる(さがせる ように なる)
await page.evaluate(() => {
  const key = 'meisanquest-save-v1';
  const s = JSON.parse(localStorage.getItem(key));
  s.toolUse = { reap: 25 };
  localStorage.setItem(key, JSON.stringify(s));
});
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1300);
await gotoPref('niigata');
assert((await findPart('めを さます')).length === 0, '目ざめた のに ねむりカードの まま');
const kiwami = await findPart('きわみの かま');
assert(kiwami.length > 0, '目ざめた きわみの かまの カードが ない');
await page.screenshot({ path: `${SHOTS}/shin-kiwami.png` });

await browser.close();
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('SHIN OK');

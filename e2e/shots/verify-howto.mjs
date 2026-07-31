/* 段3の しらべ: しゅうかくゲームの ゆびマーク(あそびかたの 実演)。
   ・ゲームが 始まったら ゆびが 出る
   ・さわると 消える
   ・5秒 何も しないと また 出る
   実行: node e2e/shots/verify-howto.mjs(preview サーバーを 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('.', import.meta.url).pathname;

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const d = makeDriver(page, SHOTS);
const problems = [];

/** いま 見えている ゆびマーク(hand-point の アイコン)の 数と ばしょ */
const finger = () =>
  page.evaluate(() => {
    const out = [];
    for (const s of window.__game.scene.getScenes(true)) {
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          const tex = o.texture?.key ?? '';
          // 手描きSVGが 入ると テクスチャ名が icon: → svgicon: に かわる。どちらも ゆびマーク
          if (/^(svg)?icon:hand-point/.test(tex) && o.alpha > 0.2) {
            const m = o.getWorldTransformMatrix();
            out.push({ x: Math.round(m.tx), y: Math.round(m.ty), alpha: Number(o.alpha.toFixed(2)) });
          }
        }
      };
      walk(s.children.list);
    }
    return out;
  });

/** ゆびが 出るまで まつ */
const waitFinger = async (ms = 9000) => {
  const t0 = Date.now();
  for (;;) {
    const f = await finger();
    if (f.length) return f;
    if (Date.now() - t0 > ms) return [];
    await page.waitForTimeout(200);
  }
};

await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1500);
await page.evaluate(() => window.__mqAdmin.fastMode());
await d.clickText('スキップ');
await d.waitText('にっぽん ぜんこく');
await d.clickText('かんとう');
await page.waitForTimeout(600);
await d.waitText('にっぽん');

/* いばらきを 開拓 → さつまいも(mine)の しゅうかくへ */
await page.mouse.click(10 + 276 * 1.263, 80 + 155 * 1.263);
await d.clickText('ちょうせん する!');
await d.answerQuiz();
await d.waitText('かいたく せいこう!');
await d.clickText('いばらきけんに いく!');
await page.waitForTimeout(900);
/* はじめての 3コマを おわらせる(つぎへ→つぎへ→やってみる!) */
for (let i = 0; i < 4; i++) {
  const next = await d.findTexts('つぎへ');
  if (next.length) {
    await page.mouse.click(next[0].x, next[0].y);
    await page.waitForTimeout(350);
    continue;
  }
  const start = await d.findTexts('やってみる!');
  if (!start.length) break;
  await page.mouse.click(start[0].x, start[0].y);
  await page.waitForTimeout(500);
  break;
}

await d.scrollAndClick('たねいもを うえる');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1400);
await d.scrollAndClick('しゅうかく!');
await page.waitForTimeout(1200);

/* --- 1. ゲームが 始まると ゆびが 出る --- */
const shown = await waitFinger();
if (!shown.length) problems.push('ゲームが 始まっても ゆびマークが 出ない');
else console.log(`出た: ${JSON.stringify(shown)}`);
await page.screenshot({ path: `${SHOTS}/howto-mine.png` });

/* --- 2. さわると 消える --- */
await page.mouse.click(240, 400);
await page.waitForTimeout(500);
if ((await finger()).length) problems.push('さわっても ゆびマークが 消えない');

/* --- 3. 5秒 何も しないと また 出る --- */
const again = await waitFinger(9000);
if (!again.length) problems.push('5秒 まっても ゆびマークが 出なおさない');
else console.log(`出なおした: ${JSON.stringify(again)}`);
await page.screenshot({ path: `${SHOTS}/howto-mine-again.png` });

/* --- 4. クイズに すすんだら もう 出ない
       (ここまでの まちで 時間切れに なって いる。そのまま クイズを まつ) --- */
await d.waitText('ものしりクイズ! せいかいで スコアボーナス!', 20000);
await page.waitForTimeout(800);
if ((await finger()).length) problems.push('クイズの ときに ゆびマークが のこっている');
await page.screenshot({ path: `${SHOTS}/howto-quiz.png` });

/* --- 5. なぞる ゲーム(うめ=catch)でも 出るか。線が ひける ことを 目で 見る --- */
await d.answerQuiz();
await d.waitText('もどる');
await d.clickText('もどる');
await d.dismissTrivia();
await page.waitForTimeout(600);
// ここから さきは 実時間の しくみ(5びょうの まちうけ)を ためす ので
// ゲームの 時間を もとに もどす(fastMode の ままだと ゲームが さきに おわる)
await page.evaluate(() => window.__mqAdmin.fastMode(1));
await d.scrollAndClick('なえを うえる');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1400);
await d.scrollAndClick('しゅうかく!');
await page.waitForTimeout(1500);
const drag = await waitFinger();
if (!drag.length) problems.push('なぞる ゲーム(catch)で ゆびマークが 出ない');
else console.log(`なぞる: ${JSON.stringify(drag)}`);
await page.screenshot({ path: `${SHOTS}/howto-catch.png` });

/* --- 5b. なぞって いる あいだは 出つづけない ---
   うめ(catch)は かごを ドラッグしつづける ゲーム。
   「さわった」を pointerdown だけで はかって いた ころは、
   ゆびを つけたまま うごかす あいだ ずっと 「何も していない」あつかいに なり、
   5秒ごとに ゆびマークが 出て きて じゃまだった(実機で 指摘)。 */
await page.mouse.move(200, 700);
await page.mouse.down();
let duringDrag = 0;
let stillPlaying = 0;
for (let i = 0; i < 40; i++) {
  // 8びょうかけて ゆっくり 左右に なぞる(ゆびは つけたまま)
  await page.mouse.move(140 + ((i % 10) * 200) / 10, 700);
  await page.waitForTimeout(200);
  if ((await page.evaluate(() => window.__mq?.kind)) !== 'arcade') break; // ゲームが おわった
  stillPlaying++;
  if ((await finger()).length) duringDrag++;
}
await page.mouse.up();
if (stillPlaying < 35) problems.push(`テストの 前提: なぞる まえに ゲームが おわった(${stillPlaying}/40)`);
else if (duringDrag) problems.push(`なぞって いる さいちゅうに ゆびマークが 出た(${duringDrag}かい)`);
else console.log(`なぞって いる あいだは 出ない ✓(${stillPlaying * 0.2}びょう)`);

/* --- 5c. ゆびを はなして 何も しなければ、また 出る(まよって いる 合図は のこす) --- */
const afterDrag = await waitFinger(9000);
if (!afterDrag.length) problems.push('なぞりを やめて 5秒 まっても ゆびマークが 出なおさない');
else console.log('やめて 5秒で 出なおす ✓');

/* --- 6. 「?」を おすと 説明が 出て、読んでいる あいだ 時計が 止まる --- */
const secLeft = () => page.evaluate(() => window.__mq?.secLeft ?? null);
await d.clickName('nav-help');
await d.waitText('あそびかた');
const t1 = await secLeft();
await page.waitForTimeout(2000);
const t2 = await secLeft();
console.log(`のこり時間: ${t1} → ${t2}(読んでいる あいだは へらない)`);
if (t1 === null || t2 === null) problems.push('のこり時間が よめない');
else if (Math.abs(t1 - t2) > 0.4) problems.push(`説明を 読んでいる あいだに 時間が へった (${t1}→${t2})`);
await page.screenshot({ path: `${SHOTS}/howto-help.png` });
await d.clickText('わかった!');
await page.waitForTimeout(500);
const t3 = await secLeft();
if (t3 !== null && t2 !== null && t3 > t2 + 0.1) problems.push('とじたのに 時計が 止まったまま');

await browser.close();
if (errors.length) console.error('PAGEERROR:', [...new Set(errors)].join(' | '));
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('HOWTO OK');

/* 段1-2の しらべ: 県ページの 「いま やること」1行 と はじめての 3コマ。
   ・はじめて 県に ついた ときだけ 3コマが 出る(2県目・2回目では 出ない)
   ・ガイド行の 文が 状態で かわる(うえよう → しゅうかく)
   ・ガイド行が バナーの 中に おさまる(カードに かぶらない)
   実行: node e2e/shots/verify-guide.mjs(preview サーバーを 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('.', import.meta.url).pathname;
/** バナーの ところ(theme の TOP_H=48 + PrefScene の BANNER_H=88)。ここから 出たら 崩れ */
const BANNER_TOP = 48;
const BANNER_BOTTOM = 136;

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const d = makeDriver(page, SHOTS);
const problems = [];

/** ぴっけの ふきだしの 文と、その わくの 上下 */
const guideRow = () =>
  page.evaluate(() => {
    for (const s of window.__game.scene.getScenes(true)) {
      if (s.scene.key !== 'PrefScene') continue;
      const row = s.taskRow;
      if (!row) return null;
      const t = row.list.find((o) => typeof o.text === 'string' && o.text);
      const b = row.getBounds();
      return { text: t?.text ?? '', top: b.y, bottom: b.y + b.height };
    }
    return null;
  });

/** ガイド行の 文を かえす。バナーから 出ていたら もんだいに 足す */
const check = async (label, want) => {
  const g = await guideRow();
  if (!g) {
    problems.push(`${label}: ガイド行が ない`);
    return '';
  }
  if (g.top < BANNER_TOP - 1 || g.bottom > BANNER_BOTTOM + 1) {
    problems.push(`${label}: ガイド行が バナーの 外(${Math.round(g.top)}〜${Math.round(g.bottom)})`);
  }
  console.log(`${label}: 「${g.text}」`);
  if (want && !want.test(g.text)) problems.push(`${label}: 文が ちがう(${g.text})`);
  return g.text;
};

/* ---- まっさらな セーブで はじめる ---- */
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

/* ---- いばらきを 開拓して 県ページへ(ほんとうの 初回) ---- */
await page.mouse.click(10 + 276 * 1.263, 80 + 155 * 1.263);
await d.clickText('ちょうせん する!');
await d.answerQuiz();
await d.waitText('かいたく せいこう!');
await d.clickText('いばらきけんに いく!');
await page.waitForTimeout(900);

/* --- はじめての 3コマ --- */
await d.waitText('この まちで やること');
await page.screenshot({ path: `${SHOTS}/guide-1.png` });
await d.clickText('つぎへ');
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/guide-2.png` });
await d.clickText('つぎへ');
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/guide-3.png` });
await d.clickText('やってみる!');
await page.waitForTimeout(700);
await page.screenshot({ path: `${SHOTS}/guide-task-plant.png` });
await check('うえる前', /うえてみよう/);

/* --- 2回目の 来訪では 3コマは 出ない --- */
await d.clickText('ちずへ');
await page.waitForTimeout(500);
await d.clickText('いばらき');
await page.waitForTimeout(1200);
if ((await d.findTexts('この まちで やること')).length) problems.push('2回目の 来訪でも 3コマが 出た');
await check('2回目', /うえてみよう/);

/* --- うえて そだてると 「しゅうかく」に かわる --- */
await d.clickText('たねいもを うえる');
await page.waitForTimeout(1200);
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await check('そだちきった あと', /しゅうかくできる/);
await page.screenshot({ path: `${SHOTS}/guide-task-harvest.png` });

await browser.close();
if (errors.length) console.error('PAGEERROR:', [...new Set(errors)].join(' | '));
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('GUIDE OK');

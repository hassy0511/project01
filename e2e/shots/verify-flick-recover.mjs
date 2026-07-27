/* フリック(メロン)が 画面の そとへ 指を 出しても 固まらない ことを しらべる。

   もとの バグ: 実を つかんだまま 指が キャンバスの そとへ 出ると
   'gameout' が とんでくるが、この イベントは Pointer を わたして こない。
   うけとる 側は p.worldX を 読む ので NaN に なり、
     ・とんだ ことに ならない(はやさが NaN)
     ・止まった ことにも ならない(NaN < STOP_SPEED は いつも false)
   で つぎの 実が 出ず、40秒の 時間切れまで 何も できなく なっていた。

   実行: node e2e/shots/verify-flick-recover.mjs(preview サーバーを 立ててから) */
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

/** いま 出ている 実(mg-target)の ばしょ。ない ときは null */
const fruit = () =>
  page.evaluate(() => {
    for (const s of window.__game.scene.getScenes(true)) {
      let hit = null;
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if (o.name === 'mg-target' && o.active) {
            const m = o.getWorldTransformMatrix();
            // ざひょうが こわれて いたら それも しらせる(NaN に なるのが もとの バグ)
            hit = Number.isFinite(m.tx) && Number.isFinite(m.ty)
              ? { x: Math.round(m.tx), y: Math.round(m.ty) }
              : { x: null, y: null, broken: true };
          }
        }
      };
      walk(s.children.list);
      if (hit) return hit;
    }
    return null;
  });

const waitFruit = async (ms = 8000) => {
  const t0 = Date.now();
  for (;;) {
    const f = await fruit();
    if (f) return f;
    if (Date.now() - t0 > ms) return null;
    await page.waitForTimeout(200);
  }
};

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
await page.waitForTimeout(700);
await page.evaluate(() => window.__mqAdmin.unlockAll());
await page.waitForTimeout(400);

/* いばらき の メロン(flick)へ */
await d.clickText('いばらき');
await page.waitForTimeout(800);
await d.scrollAndClick('たねを まく'); // いばらきで 「たねを まく」のは メロンだけ
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1400);
await d.scrollAndClick('しゅうかく!');
await page.waitForTimeout(1500);

const first = await waitFruit();
if (!first) {
  problems.push('メロンの 実が 出ない(ゲームが 始まって いない?)');
} else if (first.broken) {
  problems.push('はじめから 実の ざひょうが こわれて いる');
} else {
  console.log(`実: (${first.x}, ${first.y})`);

  /* --- 実を つかんだまま 画面の そとへ 指を 出す --- */
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  await page.mouse.move(first.x, first.y + 40);
  await page.mouse.move(first.x, 799);
  // キャンバスの そとへ(gameout が とぶ)
  await page.mouse.move(first.x, 900);
  await page.waitForTimeout(200);
  await page.mouse.up();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${SHOTS}/flick-out.png` });

  /* --- そのあと ちゃんと あそべるか。実が あって、フリックで 点が 入るか --- */
  const after = await waitFruit(6000);
  if (!after) problems.push('画面の そとへ 出したあと 実が 出てこない(固まっている)');
  else if (after.broken) problems.push('画面の そとへ 出したあと 実の ざひょうが NaN に なった(固まっている)');
  else console.log(`もどった 実: (${after.x}, ${after.y})`);

  /* かごに 入るかは 岩の ならび(乱数)しだい なので、
     ここでは 「操作が ちゃんと 効いて いるか」を 見る。
     はじいたら 実が 動きだす(= vx/vy が まともな 数)ことが 確かめたい こと。 */
  const f0 = await fruit();
  if (!f0 || f0.broken) {
    problems.push('はじく 前に 実が つかめない');
  } else {
    await page.mouse.move(f0.x, f0.y);
    await page.mouse.down();
    await page.mouse.move(f0.x, Math.min(f0.y + 120, 795));
    await page.mouse.up();
    // 動きだした か(ばしょが かわる / つぎの 実に 入れかわる)
    let moved = false;
    for (let k = 0; k < 20; k++) {
      await page.waitForTimeout(100);
      const f = await fruit();
      if (!f) continue;
      if (f.broken) {
        problems.push('はじいた あと 実の ざひょうが NaN に なった');
        moved = true;
        break;
      }
      if (Math.hypot(f.x - f0.x, f.y - f0.y) > 20) {
        moved = true;
        console.log(`はじいたら 動いた: (${f0.x},${f0.y}) → (${f.x},${f.y})`);
        break;
      }
    }
    if (!moved) problems.push('画面の そとへ 出したあと、はじいても 実が 動かない(入力が 死んでいる)');
  }
}

await browser.close();
if (errors.length) console.error('PAGEERROR:', [...new Set(errors)].join(' | '));
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('FLICK RECOVER OK');

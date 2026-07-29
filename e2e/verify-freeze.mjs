/* ゲームが 固まらない ことの 回帰テスト。

   実機(iPad)で 子供が 遭遇した 固まり:
     ・キャベツ(フリック)を かごの ど真ん中に 入れると 止まる
     ・落ちもの(キャッチ)で 金の実を とると 止まる
   どちらも 「でかい一撃」= bigImpact → hitStop の 道。
   むかしの hitStop は scene.scene.pause() で シーンを 止め、
   70ms 後に isPaused() を 見てから resume して いた。
   Phaser の pause は キューごし(つぎの フレームで きく)なので、
   つぎの フレームが 70ms より 遅れると resume を とりこぼし、
   シーンが 止まったまま に なる。

   見る もの:
     1. でかい一撃(ど真ん中)を 出しても シーンが PAUSED に ならない
        = 「間」の しくみが シーンを 止めて いない
     2. その あとも あそべる(つぎの みが 出て、コマも 進む)
     3. 万一 シーンが 止まっても ウォッチドッグが 起こす
        (原因不明の 固まり からの 立ち直り)

   実行: node e2e/verify-freeze.mjs(preview サーバーを 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from './helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('./shots', import.meta.url).pathname;
/** Phaser の シーン状態 6 = PAUSED */
const PAUSED = 6;
/** ウォッチドッグが 起こすまで 待つ 時間(ms)。しきい値 1.5びょう + よゆう */
const RESCUE_WAIT = 3500;

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
const d = makeDriver(page, SHOTS);

/** シーンの pause/resume を 記録する(hitStop が シーンを 止めて いないかの 見はり) */
await page.addInitScript(() => {
  window.__pauseLog = [];
  const hook = () => {
    const g = window.__game;
    if (!g) return;
    for (const s of g.scene.scenes) {
      if (s.__pauseHooked) continue;
      s.__pauseHooked = true;
      s.events.on('pause', () => window.__pauseLog.push(`pause:${s.scene.key}`));
      s.events.on('resume', () => window.__pauseLog.push(`resume:${s.scene.key}`));
    }
  };
  setInterval(hook, 300);
});

/* 止めた シーンは getScenes(true)(= うごいている シーン)から きえる ので、
   ミニゲームの シーンは キーで 名ざしで 見る */
const KEY = 'SessionScene';
const state = () =>
  page.evaluate((key) => {
    const s = window.__game.scene.getScene(key);
    return {
      key: s?.scene.key,
      status: s?.sys.settings.status,
      frame: window.__game.loop.frame,
      pauseLog: window.__pauseLog.slice(),
      mq: window.__mq,
    };
  }, KEY);

/* ---- メロン(flick)の 収穫まで すすむ ---- */
await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1500);
await page.evaluate(() => {
  window.__mqAdmin.skipGuides();
  window.__mqAdmin.unlockAll();
});
await d.clickText('スキップ');
await d.waitText('にっぽん ぜんこく');
await d.clickText('かんとう');
await page.waitForTimeout(800);
await page.mouse.click(10 + 276 * 1.263, 80 + 155 * 1.263); // いばらき
await page.waitForTimeout(800);
await d.clickText('たねを まく'); // メロン = flick
await page.waitForTimeout(500);
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
const engine = await page.evaluate(() => window.__mq.engine);
if (engine !== 'flick') problems.push(`テストの 前提: flick に ならない(${engine})`);

/* ---- 1. 「間」の しくみ そのもの(かならず 通る 道) ----
   ど真ん中・金の実は 運しだい なので、まず admin から 直に 叩いて たしかめる。
   むかしの コードなら ここで シーンが 止まる(そして 二度と もどらない ことが ある)。 */
const at0 = await page.evaluate(() => window.__mqAdmin.hitStopTest());
if (!at0) problems.push('テストの 前提: hitStopTest が つかえない');
else {
  if (at0.tweenScale !== 0) problems.push(`「間」が きいて いない(tweenScale=${at0.tweenScale})`);
  await page.waitForTimeout(400);
  const s = await state();
  if (s.status === PAUSED) problems.push('「間」で シーンが 止まったまま(むかしの 固まり)');
  if (s.pauseLog.length) problems.push(`「間」が シーンを 止めている: ${s.pauseLog.join(',')}`);
  const back = await page.evaluate((key) => window.__game.scene.getScene(key).tweens.timeScale, KEY);
  if (back !== 1) problems.push(`「間」の あと はやさが もどらない(${back})`);
  if (!problems.length) console.log('「間」: シーンを 止めず、じかんも もどる ✓');
}

/* ---- 2. じっさいに ど真ん中を ねらって 撃つ(ほんばんの 道) ---- */
let centered = false;
for (let attempt = 0; attempt < 10 && !centered; attempt++) {
  const t = await d.findNames('mg-target');
  if (!t.length) {
    problems.push('つぎの みが 出てこない(フリックが 止まっている)');
    break;
  }
  // かごは 画面の まんなか(x=240)。まっすぐ 下に ひっぱると まっすぐ 上へ とぶ
  await page.mouse.move(t[0].x, t[0].y);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(t[0].x, t[0].y + (200 * i) / 6);
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
  for (let i = 0; i < 16 && !centered; i++) {
    await page.waitForTimeout(90);
    const hit = await page.evaluate(() => {
      for (const s of window.__game.scene.getScenes(true)) {
        let found = false;
        const walk = (l) => {
          for (const o of l) {
            if (o.list) walk(o.list);
            if (o.text === 'どまんなか!') found = true;
          }
        };
        walk(s.children.list);
        if (found) return true;
      }
      return false;
    });
    if (hit) centered = true;
  }
  if (!centered) {
    const st = await state();
    console.log(`  ねらい ${attempt}: score=${st.mq?.score} status=${st.status}`);
  }
}
if (!centered) {
  // 岩に はじかれて 入らない ことも ある。しくみは 1. で 見て いるので ここは 見のがす
  console.log('(ど真ん中には 当たらなかった。しくみは 1. で 確認ずみ)');
} else {
  console.log('でかい一撃(どまんなか!)を 確認');
  const s1 = await state();
  if (s1.status === PAUSED) problems.push('でかい一撃で シーンが 止まった(PAUSED)');
  const pauses = s1.pauseLog.filter((x) => x.startsWith('pause:'));
  if (pauses.length) problems.push(`「間」が シーンを 止めている: ${pauses.join(',')}`);
  // その あとも あそべるか: コマが 進み、つぎの みが 出る
  await page.waitForTimeout(1200);
  const s2 = await state();
  if (s2.frame <= s1.frame) problems.push('でかい一撃の あと コマが 進まない(ループが 死んだ)');
  const next = await d.findNames('mg-target');
  if (!next.length) problems.push('でかい一撃の あと つぎの みが 出てこない');
  if (s2.mq?.kind !== 'arcade') problems.push('でかい一撃の あと ゲームが おわって しまった');
  if (!problems.length) console.log('でかい一撃の あとも あそべる ✓');
  await page.screenshot({ path: `${SHOTS}/freeze-bigimpact.png` });
}

/* ---- 3. 万一 止まっても ウォッチドッグが 起こす ---- */
await page.evaluate((key) => {
  window.__game.scene.getScene(key).sys.pause(); // 理由は ともあれ 止まったまま に なった 状態を つくる
}, KEY);
await page.waitForTimeout(300);
const stuck = await state();
if (stuck.status !== PAUSED) {
  problems.push('テストの 前提: わざと 止められなかった');
} else {
  await page.waitForTimeout(RESCUE_WAIT);
  const after = await state();
  if (after.status === PAUSED) problems.push('ウォッチドッグが 止まったシーンを 起こさない');
  else console.log('ウォッチドッグ: 止まったシーンを 起こした ✓');
}

await browser.close();
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('FREEZE OK');

/* ストーリー演出の とおし確認。

   見る もの:
     1. 県はれシネマ … はじめて おまつりを ひらいた 県で、地図の 雲が ふきとび
        ぴっけが ばんざいする(1回だけ。2回目の 地図では 出ない)
     2. はれメーター … にっぽんぜんこくに 「はれた けん n/47」
     3. ちほうバッジ … エリア全県🏮で はかせの 授与モーダル
     4. エンディング … 47県目の シネマの あとに 紙芝居 3枚 → おもいでに 追加
     5. skipGuides(既存E2Eの 前提)では どれも 出ない

   admin の fest(prefId) / festAllButOne() で おまつり実績だけ を つくる
   (シネマの 既読フラグは 立てない ので、地図を ひらくと 演出が 走る)。

   実行: node e2e/shots/verify-story-beats.mjs(preview サーバーを 立ててから) */
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

/** まっさらに して 導入を スキップし、にっぽんぜんこく まで すすむ */
const freshToRegion = async () => {
  await page.goto(BASE_URL);
  await page.waitForSelector('canvas');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1600);
  await d.clickText('スキップ');
  await d.waitText('にっぽん ぜんこく');
};

/** ぶぶん一致で 文字を さがす(d.findTexts は 完全一致 なので べつに 持つ) */
const findPart = (part) =>
  page.evaluate((pt) => {
    for (const s of window.__game.scene.getScenes(true)) {
      let hit = null;
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if (typeof o.text === 'string' && o.visible && o.alpha > 0.05 && o.text.includes(pt)) {
            const m = o.getWorldTransformMatrix();
            hit = { x: m.tx, y: m.ty };
          }
        }
      };
      walk(s.children.list);
      if (hit) return hit;
    }
    return null;
  }, part);

/** その文字(ぶぶん一致)が 出るまで まつ(なければ null) */
const waitFor = async (part, ms = 10000) => {
  const t0 = Date.now();
  for (;;) {
    const hit = await findPart(part);
    if (hit) return hit;
    if (Date.now() - t0 > ms) return null;
    await page.waitForTimeout(250);
  }
};

/** セーブの flags を よむ */
const flags = () =>
  page.evaluate(() => {
    const raw = localStorage.getItem('meisanquest-save-v1');
    return raw ? (JSON.parse(raw).flags ?? {}) : {};
  });

/* ================= 1+2. 県はれシネマ と はれメーター ================= */
await freshToRegion();
await d.clickText('かんとう');
await page.waitForTimeout(800);
// おまつり実績だけ つくる → mq-refresh で 地図が 作りなおされ、シネマが 走る
await page.evaluate(() => window.__mqAdmin.fest('ibaraki'));
const cheer = await waitFor('はれた〜!', 9000);
if (!cheer) problems.push('晴れシネマ: ぴっけの ばんざいが 出ない');
else console.log('晴れシネマ: ばんざい 確認');
await page.screenshot({ path: `${SHOTS}/story-hare.png` });
// おわるのを まって、フラグが ついたか
await page.waitForTimeout(4000);
const f1 = await flags();
if (!f1.hare_ibaraki) problems.push('晴れシネマ: 既読フラグ hare_ibaraki が つかない');
// 2回目は 出ない(にっぽん → かんとう と いったりきたり)
await d.clickText('にっぽん');
const meter = await waitFor('はれた けん 1/', 5000);
if (!meter) problems.push('はれメーター: 「はれた けん 1/…」が 出ない');
else console.log('はれメーター: 1県 確認');
await page.screenshot({ path: `${SHOTS}/story-meter.png` });
await d.clickText('かんとう');
await page.waitForTimeout(2500);
if (await findPart('はれた〜!')) problems.push('晴れシネマ: 2回目の 地図でも 出てしまう');
else console.log('晴れシネマ: 2回目は 出ない ✓');

/* ================= 3. ちほうバッジ(かんとう 全県) ================= */
for (const pref of ['tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa']) {
  await page.evaluate((id) => window.__mqAdmin.fest(id), pref);
  await page.waitForTimeout(120);
}
// のこり6県ぶんの シネマが じゅんばんに 流れ、さいごに バッジ授与
const badge = await waitFor('ちほうバッジ ゲット!', 60000);
if (!badge) problems.push('ちほうバッジ: 授与モーダルが 出ない');
else {
  console.log('ちほうバッジ: 授与 確認');
  await page.screenshot({ path: `${SHOTS}/story-badge.png` });
  await d.clickText('やったー!');
  await page.waitForTimeout(400);
}
const f2 = await flags();
if (!f2.regionComp_kanto) problems.push('ちほうバッジ: フラグ regionComp_kanto が つかない');

/* ================= 3.5 エリア開放の おしらせ ================= */
// かんとう7県の おまつりで festBest が 7しゅ → とうほく(3)・ちゅうぶ(6)が ひらく。
// にっぽんぜんこくへ 行くと 「くもの すきまが ひらいた!」が 1つだけ 出る
await d.clickText('にっぽん');
const open1 = await waitFor('くもの すきまが ひらいた!', 6000);
if (!open1) problems.push('エリア開放: おしらせモーダルが 出ない');
else {
  console.log('エリア開放: おしらせ 確認');
  await page.screenshot({ path: `${SHOTS}/story-region-open.png` });
  await d.clickText('いってみよう!');
  await page.waitForTimeout(900);
}

/* ================= 4. エンディング(47県目) ================= */
await freshToRegion();
await page.evaluate(() => window.__mqAdmin.festAllButOne());
await page.waitForTimeout(400);
await d.clickText('かんとう');
await page.waitForTimeout(800);
await page.evaluate(() => window.__mqAdmin.fest('ibaraki'));
// シネマ → エンディング 1枚目
const end1 = await waitFor('さいごの もやもやぐも', 15000);
if (!end1) {
  problems.push('エンディング: 47県目の あとに 紙芝居が 出ない');
} else {
  console.log('エンディング: 1枚目 確認');
  await page.screenshot({ path: `${SHOTS}/story-ending1.png` });
  await page.mouse.click(240, 400);
  await page.waitForTimeout(700);
  await page.mouse.click(240, 400);
  await page.waitForTimeout(700);
  const goOn = await waitFor('これからも ぼうけんを つづける!', 5000);
  if (!goOn) problems.push('エンディング: さいごの ボタンが 出ない');
  else {
    await page.screenshot({ path: `${SHOTS}/story-ending3.png` });
    await d.clickText('これからも ぼうけんを つづける!');
  }
  await d.waitText('にっぽん ぜんこく');
  const all = await waitFor('はれた けん 47/47', 5000);
  if (!all) problems.push('エンディング後: メーターが 47/47 に ならない');
  const f3 = await flags();
  if (!f3.endingSeen) problems.push('エンディング: endingSeen フラグが つかない');
  // おもいでに エンディングが ふえたか。
  // RegionScene には nav が ない ので、かんとうの 地図へ 行ってから 設定を ひらく
  await d.clickText('かんとう');
  await page.waitForTimeout(2500); // 授与モーダルなどが 出たら とじる
  const btn = (await d.findTexts('やったー!'))[0];
  if (btn) {
    await page.mouse.click(btn.x, btn.y);
    await page.waitForTimeout(400);
  }
  await d.clickName('nav-gear');
  await page.waitForTimeout(500);
  await d.clickText('おもいでを みる');
  await page.waitForTimeout(500);
  if (!(await findPart('はれの おいわい'))) {
    problems.push('おもいで: エンディングの 再生ボタンが 出ない');
  } else console.log('おもいで: エンディング 追加 確認');
  await page.screenshot({ path: `${SHOTS}/story-omoide.png` });
}

/* ================= 5. skipGuides では 何も 出ない ================= */
await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1600);
await page.evaluate(() => window.__mqAdmin.skipGuides());
await d.clickText('スキップ');
await d.waitText('にっぽん ぜんこく');
await d.clickText('かんとう');
await page.waitForTimeout(600);
await page.evaluate(() => window.__mqAdmin.fest('ibaraki'));
await page.waitForTimeout(2500);
if (await findPart('はれた〜!')) {
  problems.push('skipGuides でも シネマが 出てしまう(既存E2Eを こわす)');
} else console.log('skipGuides: シネマ抑止 ✓');

await browser.close();
if (errors.length) console.error('PAGEERROR:', [...new Set(errors)].join(' | '));
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('STORY BEATS OK');

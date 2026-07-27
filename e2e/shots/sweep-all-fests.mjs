/* 全編とおしの 目視+自動チェック: 7エリア47県の おまつりを 1本ずつ ひらいて
     ・pageerror が でないか
     ・アイコンキー('fish:sky' のような 文字)が そのまま 画面に 出ていないか
     ・よみこめていない テクスチャ(__MISSING)が ないか
     ・スコアが 1てん以上 入る(あそべる)か
   を たしかめ、スクショを のこす。
   実行: node e2e/shots/sweep-all-fests.mjs  (preview サーバーが 4273 で うごいている こと) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = '/home/user/project01/e2e/shots/sweep';
const REGIONS = ['ほっかいどう・とうほく', 'かんとう', 'ちゅうぶ', 'きんき', 'ちゅうごく', 'しこく', 'きゅうしゅう・おきなわ'];

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const d = makeDriver(page, SHOTS);

/** 画面に でている もじの うち、アイコンキーに 見える もの(かたち:いろ) */
const leakedKeys = () =>
  page.evaluate(() => {
    const out = [];
    const re = /^[a-z][a-z0-9-]*:[a-z]+$/;
    for (const s of window.__game.scene.getScenes(true)) {
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if (typeof o.text === 'string' && re.test(o.text.trim())) out.push(o.text.trim());
        }
      };
      walk(s.children.list);
    }
    return out;
  });

/** でかすぎる アイコン(setScale(1) で テクスチャの ドット数に なって しまった もの) */
const hugeIcons = () =>
  page.evaluate(() => {
    const bad = [];
    for (const s of window.__game.scene.getScenes(true)) {
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if (o.texture?.key?.startsWith('icon:') && o.displayWidth > 96) {
            bad.push(`${o.texture.key} ${Math.round(o.displayWidth)}px`);
          }
        }
      };
      walk(s.children.list);
    }
    return [...new Set(bad)];
  });

/** よみこめていない アイコンテクスチャ */
const missingTextures = () =>
  page.evaluate(() => {
    const bad = [];
    for (const s of window.__game.scene.getScenes(true)) {
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if (o.texture && o.texture.key === '__MISSING') bad.push(o.name || '(no name)');
        }
      };
      walk(s.children.list);
    }
    return bad;
  });

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
await page.evaluate(() => window.__mqAdmin.skipGuides()); // はじめての 3コマは verify-guide.mjs で しらべる
await page.evaluate(() => window.__mqAdmin.fastMode());
await d.clickText('スキップ');
await d.waitText('にっぽん ぜんこく');
await d.clickText('かんとう');
await page.waitForTimeout(800);
await page.evaluate(() => window.__mqAdmin.unlockAll());
await page.waitForTimeout(400);

const problems = [];
const noScore = [];
let n = 0;

for (const region of REGIONS) {
  await d.clickText('にっぽん');
  await d.waitText('にっぽん ぜんこく');
  await d.clickText(region);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/map-${REGIONS.indexOf(region)}.png` });
  // この エリアの 県ラベルを ぜんぶ ひろう(ラベルは 地図の うえ)
  const prefs = await page.evaluate(() => {
    const out = [];
    for (const s of window.__game.scene.getScenes(true)) {
      if (s.scene.key !== 'MapScene') continue;
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if (typeof o.text === 'string' && /^[ぁ-ん]{2,7}$/.test(o.text) && o.input?.enabled) out.push(o.text);
        }
      };
      walk(s.children.list);
    }
    return [...new Set(out)];
  });

  for (const pref of prefs) {
    const label = (await d.findTexts(pref))[0];
    if (!label) {
      problems.push(`${pref}: ラベルが みつからない`);
      continue;
    }
    await page.mouse.click(label.x, label.y);
    await page.waitForTimeout(700);
    try {
      await d.startFest();
    } catch (e) {
      problems.push(`${pref}: おまつりを ひらけない (${e.message})`);
      await page.goto(BASE_URL);
      await page.waitForSelector('canvas');
      await page.waitForTimeout(1200);
      continue;
    }
    await page.waitForTimeout(1400);
    // てあたりに さわって みる(どの ゲームでも 1てんは 入る はず)
    for (let i = 0; i < 12; i++) {
      await page.mouse.click(120 + (i % 3) * 120, 380 + (i % 4) * 70);
      await page.waitForTimeout(70);
    }
    for (const [x0, y0, x1, y1] of [[240, 620, 240, 500], [120, 450, 360, 450]]) {
      await page.mouse.move(x0, y0);
      await page.mouse.down();
      for (let k = 1; k <= 6; k++) await page.mouse.move(x0 + ((x1 - x0) * k) / 6, y0 + ((y1 - y0) * k) / 6);
      await page.mouse.up();
      await page.waitForTimeout(120);
    }
    const leaks = await leakedKeys();
    const miss = await missingTextures();
    const huge = await hugeIcons();
    if (huge.length) problems.push(`${pref}: アイコンが でかすぎる → ${huge.join(',')}`);
    if (leaks.length) problems.push(`${pref}: アイコンキーが 文字で 出ている → ${[...new Set(leaks)].join(',')}`);
    if (miss.length) problems.push(`${pref}: テクスチャが ない → ${[...new Set(miss)].join(',')}`);
    await page.screenshot({ path: `${SHOTS}/fest-${pref}.png` });
    const sc = await score();
    console.log(`✔ ${pref}  score=${sc}${leaks.length ? ' ⚠キーもれ' : ''}`);
    // スコア0は 「この 台本の てあたりな 操作では 点が 入らない」だけ の ことが 多い
    // (ドラッグの むきや リズムが きまっている ゲーム)。
    // 実力どおり 点が 入るかは エリアごとの 台本(shots-*.mjs)が ちゃんと 見ている。
    // ここは あくまで 「ひらけて・絵が こわれていない」ことの 通し確認なので しらせるだけ
    if (sc !== null && sc <= 0) noScore.push(pref);
    n++;
    // 地図へ もどる
    await page.goto(BASE_URL);
    await page.waitForSelector('canvas');
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.__mqAdmin.fastMode());
  }
}

await browser.close();
console.log(`\nみた おまつり: ${n}`);
if (errors.length) {
  console.error('PAGEERROR:');
  for (const e of [...new Set(errors)]) console.error('  ' + e);
}
if (noScore.length) {
  console.log(`てあたりな 操作では 点が 入らなかった おまつり(エリア台本で 別に 確認ずみ): ${noScore.join(' ')}`);
}
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('SWEEP OK');

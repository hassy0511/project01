/* ストア提出用スクリーンショットの 自動撮影台本(docs/STORE_REVIEW.md ST-4)。

   App Store / Google Play が 要求する 端末サイズの ピクセルで そのまま 撮る:
     - iphone65: 1284×2778(6.5インチ。viewport 428×926 × dsf3)
     - ipad129 : 2048×2732(12.9インチ iPad。viewport 1024×1366 × dsf2)
   ゲームは 480×800 FIT なので 左右に レターボックスが つく。実機の
   スクリーンショットと 同じ 見た目に なる(ストアは これで 受理される)。

   撮る 場面(1プロファイルにつき 5まい):
     1. story   — 導入の おはなし
     2. map     — かんとうの 地図(ぼんぼり 点灯ずみ)
     3. zenkoku — にっぽん ぜんこく
     4. pref    — 県ページ(はたけが 実って いる)
     5. fest    — おまつり ミニゲームの さいちゅう

   実行: npm run build && (vite preview --port 4273 &) && node e2e/shots/store-shots.mjs
   出力: e2e/shots/store/<profile>-<n>-<name>.png */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const OUT = new URL('./store', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const PROFILES = [
  { name: 'iphone65', vw: 428, vh: 926, dsf: 3 }, // 1284×2778
  { name: 'ipad129', vw: 1024, vh: 1366, dsf: 2 }, // 2048×2732
];

/* かんとうの ぼんぼりを ともす 県(地図が にぎやかに 見える ように) */
const LIT_PREFS = ['tokyo', 'kanagawa', 'chiba', 'saitama', 'tochigi'];

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });

/* ---------- 1. 480×800 の 素の ページで あそんだ状態の セーブを 作る ---------- */
const prep = await browser.newPage({ viewport: { width: 480, height: 800 } });
await prep.goto(BASE_URL);
await prep.waitForSelector('canvas');
await prep.waitForTimeout(1500);
await prep.evaluate((prefs) => {
  localStorage.clear();
  window.__mqAdmin.skipGuides();
  window.__mqAdmin.unlockAll();
  window.__mqAdmin.boostAll();
  for (const p of prefs) window.__mqAdmin.fest(p);
  // 晴れシネマの 既読も 立てる(撮影中に シネマが 走らない ように)
}, LIT_PREFS);
await prep.waitForTimeout(400);
const savedEntries = await prep.evaluate(() => Object.entries(localStorage));
await prep.close();

/* ---------- 2. プロファイルごとに セーブを 持ちこんで 撮る ---------- */
for (const prof of PROFILES) {
  const ctx = await browser.newContext({
    viewport: { width: prof.vw, height: prof.vh },
    deviceScaleFactor: prof.dsf,
  });

  /* --- 1まいめ: 導入の おはなし(セーブなし = はじめての 画面) --- */
  {
    const page = await ctx.newPage();
    await page.goto(BASE_URL);
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2500); // 1コマ目の 絵と 文字が 出そろう まで
    await page.screenshot({ path: `${OUT}/${prof.name}-1-story.png` });
    await page.close();
  }

  const page = await ctx.newPage();
  await page.addInitScript((entries) => {
    for (const [k, v] of entries) localStorage.setItem(k, v);
  }, savedEntries);
  const d = makeDriver(page, OUT);

  /** 世界座標(480×800)→ ページ座標。FIT で 縮んだ ぶんを かけ算する */
  const toPage = async (wx, wy) => {
    const box = await page.locator('canvas').boundingBox();
    const scale = box.width / 480;
    return { x: box.x + wx * scale, y: box.y + wy * scale };
  };
  const clickWorld = async (wx, wy) => {
    const p = await toPage(wx, wy);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(400);
  };
  const clickTextScaled = async (label) => {
    const found = await d.waitText(label);
    await clickWorld(found[0].x, found[0].y);
  };
  /** 一覧を 世界座標で dy ぶん 下へ スクロール(FIT の 縮みを かけて ドラッグ) */
  const scrollWorld = async (dy) => {
    const from = await toPage(60, 620);
    const to = await toPage(60, 620 - dy);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(from.x, from.y + ((to.y - from.y) * i) / 8);
      await page.waitForTimeout(25);
    }
    await page.mouse.up();
    await page.waitForTimeout(300);
  };
  /** スクロールしながら さがして クリック(世界座標版 scrollAndClick) */
  const scrollAndClickScaled = async (label) => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const found = await d.findTexts(label);
      const hit = found.find((t) => t.y >= 170 && t.y <= 700);
      if (hit) {
        await clickWorld(hit.x, hit.y);
        return;
      }
      await scrollWorld(found.length ? Math.max(-360, Math.min(360, found[0].y - 430)) : 300);
    }
    throw new Error(`scrollAndClickScaled failed: ${label}`);
  };

  await page.goto(BASE_URL);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(2000);

  /* --- 2まいめ: かんとうの 地図(ぼんぼり つき) --- */
  await page.screenshot({ path: `${OUT}/${prof.name}-2-map.png` });

  /* --- 3まいめ: にっぽん ぜんこく --- */
  await clickTextScaled('にっぽん');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${prof.name}-3-zenkoku.png` });
  await clickTextScaled('かんとう');
  await page.waitForTimeout(900);

  /* --- 4まいめ: 県ページ(はたけ 実り) --- */
  await clickTextScaled('とうきょう');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${prof.name}-4-pref.png` });

  /* --- 5まいめ: おまつりの さいちゅう。
     とうきょうは 開催ずみ(ぼんぼり用)なので、まだの ぐんま(だるま積み)で 撮る --- */
  try {
    await clickTextScaled('ちずへ');
    await page.waitForTimeout(700);
    await clickTextScaled('ぐんま');
    await page.waitForTimeout(900);
    await scrollAndClickScaled('ひらく!');
    const start = await d.findTexts('おまつり スタート!');
    if (start.length) await clickWorld(start[0].x, start[0].y);
    await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
    await page.waitForTimeout(2500); // 手描き背景が 焼きあがる のを まつ
    // まんなかを ぽんぽん たたいて うごきの ある 絵に する
    for (let i = 0; i < 8; i++) {
      await clickWorld(240, 470);
      await page.waitForTimeout(150);
    }
    await page.screenshot({ path: `${OUT}/${prof.name}-5-fest.png` });
  } catch (e) {
    console.warn(`fest shot failed (${prof.name}): ${String(e)}`);
  }

  await ctx.close();
  console.log(`✔ ${prof.name} (${prof.vw * prof.dsf}×${prof.vh * prof.dsf})`);
}

await browser.close();
console.log('STORE SHOTS OK →', OUT);

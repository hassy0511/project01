/* 手描きの 背景(public/art/bg/bg-<ゲーム名>.svg)の しくみの 回帰テスト。

   背景は アイコンと ちがって バンドルに 埋めこまない
   (1まいが 画面ぜんたいの 大きさで、59まい あっても つかうのは 1回に 1まい)。
   あそぶ ときに 取りに いく。

   見る もの:
     1. 絵が ない ゲーム(うめ=catch)… いままでの コード描画の 背景が そのまま。
        空白に ならない(絵が そろう まえでも あそべる)
     2. 絵が ある ゲーム(メロン=flick)… 背景が 差しかわり、
        コード描画の 背景は かくれる(二重に かさならない)
     3. 背景は 取りに いって いる = バンドルに 埋めこまれて いない

   背景は まだ 1まいも 納品されて いない ので、見本を 1まい dist に 置いて ためす。
   preview サーバーは 起動時に ファイルを おぼえる ので、
   見本を 置いてから この テストの 中で 立てる(おわったら 止めて 見本も 消す)。

   実行: node e2e/verify-bg-art.mjs(preview サーバーは 自分で 立てる) */
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from './helpers.mjs';

const PORT = 4275;
const BASE_URL = `http://localhost:${PORT}/project01/`;
const SHOTS = new URL('./shots', import.meta.url).pathname;
const BG_DIR = new URL('../dist/art/bg/', import.meta.url).pathname;
/** 納品ずみの 背景の 置き場(テストで 消した ものを もどす もと) */
const SRC_BG = new URL('../public/art/bg/', import.meta.url).pathname;
/** ためし用の 背景(ももいろの 空+大きな まる)。ひと目で 差しかわりが わかる 絵 */
const FIXTURE = `<svg viewBox="0 0 480 748" xmlns="http://www.w3.org/2000/svg">
  <rect width="480" height="748" fill="#F28BA0"/>
  <circle cx="240" cy="300" r="150" fill="#F5D84E"/>
  <rect y="600" width="480" height="148" fill="#3F7D3C"/>
</svg>`;

/* ---- 見本を 置いてから サーバーを 立てる ---- */
mkdirSync(BG_DIR, { recursive: true });
writeFileSync(`${BG_DIR}bg-flick.svg`, FIXTURE);
/* うめ(catch)は 「絵が ない」がわ を 見る ため、いちど どける。
   背景は 59まい ぜんぶ 納品ずみ なので、じっさいに 絵が ない ゲームは もう ない。
   dist の ぶんだけ 消して ためし、おわったら 書きもどす(public は さわらない) */
rmSync(`${BG_DIR}bg-catch.svg`, { force: true });
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
const cleanup = () => {
  server.kill('SIGKILL'); // のこると この プロセスが おわらない
  rmSync(`${BG_DIR}bg-flick.svg`, { force: true });
  // どけた 本物を もどす(dist を こわしたまま に しない)
  if (existsSync(`${SRC_BG}bg-catch.svg`)) copyFileSync(`${SRC_BG}bg-catch.svg`, `${BG_DIR}bg-catch.svg`);
  if (existsSync(`${SRC_BG}bg-flick.svg`)) copyFileSync(`${SRC_BG}bg-flick.svg`, `${BG_DIR}bg-flick.svg`);
};
process.on('exit', cleanup);
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(BASE_URL)).ok) break;
  } catch {
    /* まだ 起動ちゅう */
  }
  await new Promise((r) => setTimeout(r, 300));
}

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
/** 背景を 取りに いった 通信(バンドルに 埋めこんで いない ことの 裏づけ) */
const fetched = [];
page.on('request', (r) => {
  if (r.url().includes('/art/bg/')) fetched.push(r.url().split('/').pop());
});
const d = makeDriver(page, SHOTS);

/** はたけを うえて しゅうかくの アーケードまで すすむ。plant = 畑の ボタン名 */
const toGame = async (plantLabel) => {
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
  await d.scrollAndClick(plantLabel);
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__mqAdmin.boostAll());
  await page.waitForTimeout(1600);
  await d.scrollAndClick('しゅうかく!');
  await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
  await page.waitForTimeout(2500); // 取りに いって 焼くまで まつ
  return page.evaluate(() => window.__mq.engine);
};

/** 背景の テクスチャ / コード描画の 背景の 見えかた */
const bgState = (name) =>
  page.evaluate((n) => {
    const s = window.__game.scene.getScene('SessionScene');
    let sceneryVisible = 0;
    let sceneryHidden = 0;
    let bgImages = 0;
    const walk = (l) => {
      for (const o of l) {
        if (o.list) walk(o.list);
        if (o.name === 'scenery') o.visible ? (sceneryVisible += 1) : (sceneryHidden += 1);
        if (o.texture?.key?.startsWith('bgart:')) bgImages++;
      }
    };
    walk(s.children.list);
    return { hasTexture: window.__game.textures.exists(`bgart:${n}`), sceneryVisible, sceneryHidden, bgImages };
  }, name);

/* ================= 1. 絵が ない ゲーム(うめ=catch) ================= */
const e1 = await toGame('なえを うえる');
if (e1 !== 'catch') problems.push(`テストの 前提: catch に ならない(${e1})`);
const none = await bgState('bg-catch');
if (none.hasTexture || none.bgImages) problems.push('背景の 絵が ない のに 差しかわって いる');
else if (!none.sceneryVisible) problems.push('コード描画の 背景が 出て いない(空白に なる)');
else console.log(`絵が ない とき: コード描画の 背景 ${none.sceneryVisible}こ が そのまま ✓`);
await page.screenshot({ path: `${SHOTS}/bg-art-none.png` });

/* ================= 2. 絵が ある ゲーム(メロン=flick) ================= */
const e2 = await toGame('たねを まく');
if (e2 !== 'flick') problems.push(`テストの 前提: flick に ならない(${e2})`);
const art = await bgState('bg-flick');
if (!art.hasTexture) problems.push('背景の 絵を 置いても 焼かれない');
else if (!art.bgImages) problems.push('背景の 絵が 画面に 出て いない');
else if (art.sceneryVisible) problems.push(`絵と コード描画が かさなって いる(コード側 ${art.sceneryVisible}こ が 見えたまま)`);
else console.log(`絵が ある とき: 差しかわり、コード描画 ${art.sceneryHidden}こ が かくれた ✓`);
if (!fetched.includes('bg-flick.svg')) problems.push('背景を 取りに いって いない(バンドルに 埋めこまれて いる?)');
else console.log('背景は 取りに いって いる(バンドルに 入って いない)✓');
await page.screenshot({ path: `${SHOTS}/bg-art-applied.png` });

await browser.close();
cleanup();
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('BG ART OK');
process.exit(0); // 立てた サーバーの 子プロセスが のこっても ここで おわる

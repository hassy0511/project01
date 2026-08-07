/* 手描き SVG が ゲーム画面に 出て いるか しらべる。
   ・データが つかう かたちは ぜんぶ svgicon: に なる
   ・まえは 「SVG が ない かたちは icon: の まま」も 見て いた(1個ずつ 差しかえて
     いた ころの ガード)。第7回で ぴっけ・はちも SVG に なり、絵が ぜんぶ そろった ので
     「コード描画が のこって いる こと」は もう 正しさの しるしでは ない。
     いまは 「SVG が じゅうぶんな 数 出て いる」ことと、コード描画に おちて いる
     かたちが あれば その 名まえを 出す(発注もれの 早期発見)ように した
   実行: node e2e/shots/verify-svg-icons.mjs(preview サーバーを 立ててから) */
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

/** いま 出ている アイコンの テクスチャキーを かぞえる */
const textures = () =>
  page.evaluate(() => {
    const out = {};
    for (const s of window.__game.scene.getScenes(true)) {
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          const k = o.texture?.key ?? '';
          if (k.startsWith('icon:') || k.startsWith('svgicon:')) out[k] = (out[k] ?? 0) + 1;
        }
      };
      walk(s.children.list);
    }
    return out;
  });

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
await page.waitForTimeout(800);
await page.evaluate(() => window.__mqAdmin.unlockAll());
await page.waitForTimeout(500);

/* ずかんの 「そざい」タブ: たくさんの かたちが 一度に 出る */
await d.clickText('ずかん');
await page.waitForTimeout(1200);
const zk = await textures();
const svgKeys = Object.keys(zk).filter((k) => k.startsWith('svgicon:'));
const codeKeys = Object.keys(zk).filter((k) => k.startsWith('icon:'));
console.log(`ずかん: SVG ${svgKeys.length}しゅ / コード描画 ${codeKeys.length}しゅ`);
if (svgKeys.length) console.log('  SVG:', svgKeys.join(' '));
// 絵が ぜんぶ そろった ので、コード描画に おちて いる ものは 「発注もれ」の しるし。
// 落ちても すぐ こまる わけでは ない ので しらせるだけ(SVG が 出て いない ほうが 大ごと)
if (codeKeys.length) console.log('  コード描画の まま:', codeKeys.join(' '));
// ずかんは まだ 集めて いない セルが 「?」なので、出る かたちは ヘッダー+ナビ+? の 7しゅ ほど
if (svgKeys.length < 5) problems.push(`ずかんの SVG が すくなすぎる(${svgKeys.length}しゅ)。差しかえが うごいて いない`);
await page.screenshot({ path: `${SHOTS}/svg-zukan.png` });

/* いちごが 出る 県(とちぎ)の 県ページ */
await d.clickText('ちず');
await page.waitForTimeout(600);
await d.clickText('とちぎ');
await page.waitForTimeout(1200);
const pf = await textures();
const straw = Object.keys(pf).filter((k) => k.includes('strawberry'));
console.log('とちぎ いちご:', straw.join(' ') || '(なし)');
if (straw.length && !straw.some((k) => k.startsWith('svgicon:'))) {
  problems.push(`いちごが SVG に なって いない: ${straw.join(' ')}`);
}
await page.screenshot({ path: `${SHOTS}/svg-pref.png` });

await browser.close();
if (errors.length) console.error('PAGEERROR:', [...new Set(errors)].join(' | '));
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('SVG ICONS OK');

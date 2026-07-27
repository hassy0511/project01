/* 段6の しらべ: ずかんの 「あそびかた」タブ。
   ・あそんでいない ゲームは ？？？(ネタバレ しない)
   ・あそんだ ゲームだけ 名まえが 出て、タップすると 見本が 動く
   実行: node e2e/shots/verify-howto-tab.mjs(preview サーバーを 立ててから) */
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

/** ずかんに 出ている 名まえ(？？？ を のぞく) */
const namedCells = () =>
  page.evaluate(() => {
    const out = [];
    for (const s of window.__game.scene.getScenes(true)) {
      if (s.scene.key !== 'ZukanScene') continue;
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if (typeof o.text === 'string' && o.text && o.style?.fontSize === '13px') out.push(o.text);
        }
      };
      walk(s.children.list);
    }
    return out;
  });

/** 見本わくの 中の ゆびマーク */
const demoFinger = () =>
  page.evaluate(() => {
    const out = [];
    for (const s of window.__game.scene.getScenes(true)) {
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if ((o.texture?.key ?? '').startsWith('icon:hand-point') && o.alpha > 0.2) {
            const m = o.getWorldTransformMatrix();
            out.push({ x: Math.round(m.tx), y: Math.round(m.ty), scale: Number(m.scaleX.toFixed(2)) });
          }
        }
      };
      walk(s.children.list);
    }
    return out;
  });

const waitDemo = async (ms = 8000) => {
  const t0 = Date.now();
  for (;;) {
    const f = await demoFinger();
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
await page.evaluate(() => window.__mqAdmin.skipGuides());
await page.evaluate(() => window.__mqAdmin.fastMode());
await d.clickText('スキップ');
await d.waitText('にっぽん ぜんこく');
await d.clickText('かんとう');
await page.waitForTimeout(700);

/* --- 1. 何も あそんでいない: ぜんぶ ？？？ --- */
await d.clickText('ずかん');
await page.waitForTimeout(600);
await d.clickName('tab-how');
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}/howto-tab-locked.png` });
const before = await namedCells();
const leaked = before.filter((t) => t !== '？？？');
if (leaked.length) problems.push(`あそぶ前から 名まえが 出ている: ${leaked.join(',')}`);

/* --- 2. 1つ あそぶと そのゲームだけ 出る --- */
await d.clickText('ちず');
await page.waitForTimeout(600);
await page.evaluate(() => window.__mqAdmin.unlockAll());
await page.waitForTimeout(400);
await d.clickText('いばらき');
await page.waitForTimeout(800);
await d.scrollAndClick('たねいもを うえる');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1400);
await d.scrollAndClick('しゅうかく!');
await page.waitForTimeout(1500);
await d.clickText('もどる');
await page.waitForTimeout(700);

await d.clickText('ずかん');
await page.waitForTimeout(600);
await d.clickName('tab-how');
await page.waitForTimeout(600);
const after = await namedCells();
const shown = after.filter((t) => t !== '？？？');
console.log(`出た あそびかた: ${shown.join(',') || '(なし)'}`);
if (!shown.includes('すいりで ほる')) problems.push('あそんだ ゲームが 出ない');
if (shown.length > 1) problems.push(`あそんでいない ゲームまで 出ている: ${shown.join(',')}`);
await page.screenshot({ path: `${SHOTS}/howto-tab.png` });

/* --- 3. タップすると 見本の ゆびが 動く --- */
await d.clickText('すいりで ほる');
await page.waitForTimeout(700);
const f = await waitDemo();
if (!f.length) problems.push('見本の ゆびマークが 出ない');
else console.log(`見本の ゆび: ${JSON.stringify(f)}`);
await page.screenshot({ path: `${SHOTS}/howto-tab-demo.png` });
await d.clickText('わかった!');
await page.waitForTimeout(600);
if ((await demoFinger()).length) problems.push('とじても 見本の ゆびが のこっている');

await browser.close();
if (errors.length) console.error('PAGEERROR:', [...new Set(errors)].join(' | '));
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('HOWTO TAB OK');

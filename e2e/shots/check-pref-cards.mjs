/* 47県ぜんぶの 県ページで、カードの 名まえや ボタンの 文字が かさなっていないか を しらべる。
   ・カードの 名まえ(ふとじ16px系)の みぎ端が ボタンの ひだり端を こえていないか
   ・ボタンの ラベルが ボタンの わくから はみ出していないか
   実行: node e2e/shots/check-pref-cards.mjs */
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

/** いま でている カードの 中で、文字と ボタンが かさなっている ものを かえす */
const overlaps = () =>
  page.evaluate(() => {
    const bad = [];
    for (const s of window.__game.scene.getScenes(true)) {
      if (s.scene.key !== 'PrefScene') continue;
      // カード = 中に Graphics と Text と ボタン(Container)を もつ Container
      const cards = [];
      const walk = (l) => {
        for (const o of l) {
          if (!o.list) continue;
          const texts = o.list.filter((x) => typeof x.text === 'string' && x.text);
          const btns = o.list.filter((x) => x.list && x.input);
          if (texts.length && btns.length) cards.push({ o, texts, btns });
          walk(o.list);
        }
      };
      walk(s.children.list);
      for (const { texts, btns } of cards) {
        for (const b of btns) {
          // ボタンの ひだり端(ボタンは 中心原点・はば116)
          const bl = b.x - 58;
          for (const t of texts) {
            const tr = t.x + (1 - (t.originX ?? 0)) * 0 + t.width * (1 - (t.originX ?? 0));
            const tl = t.x - t.width * (t.originX ?? 0);
            if (tl > bl) continue; // ボタンより みぎの 文字(=ボタンの ラベル)は 見ない
            if (tr > bl + 1) {
              bad.push(`「${t.text}」が ボタン「${b.list.find((x) => x.text)?.text ?? '?'}」に ${Math.round(tr - bl)}px かさなる`);
            }
          }
          // ボタンの ラベルが わくから はみ出していないか
          const label = b.list.find((x) => typeof x.text === 'string' && x.text);
          if (label && label.width > 116 - 8) {
            bad.push(`ボタンの 文字「${label.text}」が わく(116px)より ${Math.round(label.width - 108)}px ひろい`);
          }
        }
      }
    }
    return [...new Set(bad)];
  });

await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1500);
await page.evaluate(() => window.__mqAdmin.skipGuides()); // はじめての 3コマは verify-guide.mjs で しらべる
await d.clickText('スキップ');
await d.waitText('にっぽん ぜんこく');
await d.clickText('かんとう');
await page.waitForTimeout(800);
await page.evaluate(() => window.__mqAdmin.unlockAll());
await page.waitForTimeout(400);

const problems = [];
let n = 0;
for (const region of REGIONS) {
  await d.clickText('にっぽん');
  await d.waitText('にっぽん ぜんこく');
  await d.clickText(region);
  await page.waitForTimeout(900);
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
    if (!label) continue;
    await page.mouse.click(label.x, label.y);
    await page.waitForTimeout(650);
    // うえから したまで 見る(スクロールしながら)
    const seen = new Set();
    for (let k = 0; k < 6; k++) {
      for (const b of await overlaps()) seen.add(b);
      await d.scrollList(320);
    }
    if (seen.size) {
      problems.push(`${pref}: ${[...seen].join(' / ')}`);
      await page.screenshot({ path: `${SHOTS}/card-${pref}.png` });
    }
    n++;
    await d.clickText('ちずへ');
    await page.waitForTimeout(500);
  }
}

await browser.close();
console.log(`しらべた 県: ${n}`);
if (errors.length) console.error('PAGEERROR:', [...new Set(errors)].join(' | '));
if (problems.length) {
  console.error('かさなり:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('PREF CARDS OK');

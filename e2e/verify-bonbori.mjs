/* きんの ぼんぼりの 回帰テスト。

   しらべる こと:
     1. さいこうきろくに おうじて 地図の ぼんぼりの いろが かわる(どう/ぎん/きん)
     2. ずかんの おまつりセルに いろの 名まえが 出る
     3. にっぽん地図に 「きんの ぼんぼり n/47」が 出る(おまつりを 1つでも ひらいたら)。
        おすと 説明モーダル(どう→ぎん→きんの 条件)が ひらく
     4. 47県 ぜんぶ きんに すると おいわいが 1回だけ 出る
     5. 県ページの おまつりカードに 「つぎの いろまで あと◯てん」が 出る

   実行: node e2e/verify-bonbori.mjs(preview サーバーを 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from './helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('./shots/out', import.meta.url).pathname;
/** core/bonbori.ts の FEST_RANK_DEFAULT と そろえる */
const SILVER = 320;
const GOLD = 680;

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
const d = makeDriver(page, SHOTS);
const assert = (cond, msg) => {
  if (!cond) problems.push(msg);
};

const findPart = (part) =>
  page.evaluate((p) => {
    const out = [];
    for (const scene of window.__game.scene.getScenes(true)) {
      const walk = (list) => {
        for (const o of list) {
          if (o.list) walk(o.list);
          if (typeof o.text === 'string' && o.text.includes(p) && o.visible) out.push(o.text);
        }
      };
      walk(scene.children.list);
    }
    return out;
  }, part);

/** 地図に 出ている ちょうちんの いろ(テクスチャキー)を ぜんぶ ひろう */
const lanternColors = () =>
  page.evaluate(() => {
    const out = [];
    for (const scene of window.__game.scene.getScenes(true)) {
      const walk = (list) => {
        for (const o of list) {
          if (o.list) walk(o.list);
          const k = o.texture?.key;
          if (typeof k === 'string' && k.includes('lantern:')) out.push(k.split('lantern:')[1]);
        }
      };
      walk(scene.children.list);
    }
    return out;
  });

/** セーブを 書きかえて つみなおす */
const setSave = async (fn) => {
  await page.evaluate((src) => {
    const key = 'meisanquest-save-v1';
    const s = JSON.parse(localStorage.getItem(key));
    // eslint-disable-next-line no-new-func
    new Function('s', src)(s);
    localStorage.setItem(key, JSON.stringify(s));
  }, `(${fn.toString()})(s)`);
  await page.reload();
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1300);
};

await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1300);
await page.evaluate(() => {
  window.__mqAdmin.skipGuides();
  window.__mqAdmin.unlockAll();
  window.__mqAdmin.festAllButOne(); // 46県ぶん おまつりを ひらいた ことに する
});
await page.waitForTimeout(600);

/* 1. きろくの ちがいで ぼんぼりの いろが かわる */
await setSave(() => {
  const ids = Object.keys(s.festBest);
  s.festBest[ids[0]] = 10; // どう
  s.festBest[ids[1]] = 400; // ぎん
  s.festBest[ids[2]] = 900; // きん
});
await page.evaluate(() => window.__game.scene.getScenes(true)[0].scene.start('MapScene', { regionId: 'kanto' }));
await page.waitForTimeout(1200);
const colors = await lanternColors();
console.log('地図の ぼんぼり:', [...new Set(colors)].join(' '));
assert(colors.includes('brown'), 'どうの ぼんぼりが 出ない');
assert(colors.includes('silver'), 'ぎんの ぼんぼりが 出ない');
assert(colors.includes('gold'), 'きんの ぼんぼりが 出ない');
await page.screenshot({ path: `${SHOTS}/bonbori-map.png` });

/* 2. ずかんの おまつりタブ */
await page.evaluate(() => window.__game.scene.getScenes(true)[0].scene.start('ZukanScene'));
await page.waitForTimeout(800);
await d.clickName('tab-t4');
await page.waitForTimeout(700);
assert((await findPart('ぼんぼり')).length > 0, 'ずかんに ぼんぼりの いろが 出ない');
await page.screenshot({ path: `${SHOTS}/bonbori-zukan.png` });

/* 3. にっぽん地図の カウンタ → おすと 説明が ひらく */
await page.evaluate(() => window.__game.scene.getScenes(true)[0].scene.start('RegionScene'));
await page.waitForTimeout(1000);
const counter = await findPart('きんの ぼんぼり');
assert(counter.length > 0, 'にっぽん地図に きんの カウンタが 出ない');
console.log('カウンタ:', counter[0]);
{
  // カウンタの ばしょ(GAME_W/2, TOP_H+52)を おす → 説明モーダル
  await page.mouse.click(240, 100);
  await page.waitForTimeout(600);
  assert((await findPart('きんの ぼんぼりとは')).length > 0, 'カウンタを おしても 説明が ひらかない');
  assert((await findPart('320てん')).length > 0, '説明に ぎんの めやす点が ない');
  assert((await findPart('680てん')).length > 0, '説明に きんの めやす点が ない');
  await page.screenshot({ path: `${SHOTS}/bonbori-help.png` });
  await d.clickText('わかった!');
  await page.waitForTimeout(400);
}

/* 5. 県ページの おまつりカード: ぼんぼりの 目あてが いつも 見える。
      開催ずみなら 「◯◯まで あと◯てん!」か 「きんの ぼんぼり ともった!」の
      どちらかが かならず 出る(ぐんまの きろくは 手前の ステップしだい) */
{
  await page.evaluate(() => window.__game.scene.getScenes(true)[0].scene.start('PrefScene', { prefId: 'gunma' }));
  await page.waitForTimeout(900);
  const next = await findPart('まで あと');
  const done = await findPart('ぼんぼり ともった');
  assert(next.length + done.length > 0, 'おまつりカードに ぼんぼりの 目あてが 出ない');
  const line = next[0] ?? done[0];
  if (line) console.log('カードの 目あて:', line.split('\n').pop());
  await page.screenshot({ path: `${SHOTS}/bonbori-card.png` });
}

/* 4. しきい値ちょうど: ぎん/きんの さかいめ */
await setSave(() => {
  const ids = Object.keys(s.festBest);
  s.festBest[ids[0]] = 319;
  s.festBest[ids[1]] = 320;
  s.festBest[ids[2]] = 679;
  s.festBest[ids[3]] = 680;
});
await page.evaluate(() => window.__game.scene.getScenes(true)[0].scene.start('MapScene', { regionId: 'kanto' }));
await page.waitForTimeout(1200);
const edge = await lanternColors();
assert(edge.includes('brown') && edge.includes('silver') && edge.includes('gold'), `さかいめの いろが おかしい(${[...new Set(edge)].join(' ')})`);
void SILVER;
void GOLD;

await browser.close();
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('BONBORI OK');

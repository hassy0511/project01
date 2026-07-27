/* ちゅうぶ9県の確認: 地図・すくいとり・実在祭り9本のスクショと得点検証 */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = '/home/user/project01/e2e/shots';
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
const d = makeDriver(page, SHOTS);
const log = (s) => console.log('✔ ' + s);

const score = () =>
  page.evaluate(() => {
    let v = null;
    for (const scene of window.__game.scene.getScenes(true)) {
      const walk = (list) => {
        for (const o of list) {
          if (o.list) walk(o.list);
          if (typeof o.text === 'string' && o.text.startsWith('スコア ')) v = Number(o.text.slice(4));
        }
      };
      walk(scene.children.list);
    }
    return v;
  });

const setup = async () => {
  await page.goto(BASE_URL);
  await page.waitForSelector('canvas');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__mqAdmin.skipGuides()); // はじめての 3コマは verify-guide.mjs で しらべる
  await d.waitText('スキップ');
  await d.clickText('スキップ');
  await d.waitText('にっぽん ぜんこく');
  await d.clickText('かんとう');
  await page.waitForTimeout(800);
  await page.evaluate(() => window.__mqAdmin.unlockAll());
  await page.waitForTimeout(400);
  await d.clickText('にっぽん');
  await d.clickText('ちゅうぶ');
  await page.waitForTimeout(800);
};
await setup();
await page.screenshot({ path: `${SHOTS}/chubu-map-full.png` });
log('ちゅうぶ地図');

const gotoPref = async (name) => {
  await page.goto(BASE_URL); // currentRegion=chubu が保存されている
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1400);
  const t = (await d.findTexts(name))[0];
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(700);
};

/* すくいとり(とやま しろえび) */
await gotoPref('とやま');
await d.scrollAndClick('あみを しかける');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
await page.waitForTimeout(2000);
await page.mouse.move(60, 420);
await page.mouse.down();
for (let pass = 0; pass < 3; pass++) {
  for (let i = 0; i <= 8; i++) {
    const x = pass % 2 === 0 ? 40 + i * 50 : 440 - i * 50;
    await page.mouse.move(x, 380 + (i % 3) * 60);
    await page.waitForTimeout(60);
  }
}
await page.mouse.up();
await page.screenshot({ path: `${SHOTS}/chubu-scoop.png` });
await page.mouse.click(240, 520);
await page.waitForTimeout(200);
const scoopScore = await score();
log(`すくいとり score=${scoopScore}`);

/* 祭り9本 */
const FESTS = [
  ['にいがた', 'minyou', async () => {
    // お手本を見たあと、光っているボタンを順に押す(お手本と同じ位置を総当たりで)
    for (const x of [70, 185, 300, 415]) {
      await page.waitForTimeout(3400); // お手本の表示が おわるまで まつ
      await page.mouse.click(x, 612);
      await page.waitForTimeout(400);
    }
  }],
  ['とやま', 'owara', async () => {
    // 光る輪を追いかけて指を置き続ける
    await page.mouse.move(240, 302); await page.mouse.down();
    for (let i = 0; i < 20; i++) {
      const t = await page.evaluate(() => {
        for (const s of window.__game.scene.getScenes(true)) {
          const f = [];
          const walk = (l) => { for (const o of l) { if (o.list) walk(o.list); if (o.type === 'Arc' && Math.round(o.radius) === 62) { const m = o.getWorldTransformMatrix(); f.push({ x: m.tx, y: m.ty }); } } };
          walk(s.children.list); if (f.length) return f[0];
        } return null;
      });
      if (t) await page.mouse.move(t.x, t.y);
      await page.waitForTimeout(150);
    }
    await page.mouse.up();
  }],
  ['いしかわ', 'tourou', async () => {
    for (let k = 0; k < 3; k++) {
      await page.mouse.move(240, 606); await page.mouse.down();
      for (let i = 1; i <= 8; i++) { await page.mouse.move(240, 606 - i * 26); await page.waitForTimeout(70); }
      await page.mouse.up();
      await page.waitForTimeout(700);
    }
  }],
  ['ふくい', 'kani', async () => {
    for (let k = 0; k < 8; k++) {
      const rings = await page.evaluate(() => {
        for (const s of window.__game.scene.getScenes(true)) {
          const f = [];
          const walk = (l) => { for (const o of l) { if (o.list) walk(o.list); if (o.type === 'Arc' && Math.round(o.radius) === 22) { const m = o.getWorldTransformMatrix(); f.push({ x: m.tx, y: m.ty }); } } };
          walk(s.children.list); if (f.length) return f;
        } return [];
      });
      if (rings.length) { await page.mouse.click(rings[0].x, rings[0].y); await page.waitForTimeout(180); await page.mouse.click(rings[0].x, rings[0].y); }
      await page.waitForTimeout(300);
    }
  }],
  ['やまなし', 'himatsuri', async () => {
    // ROWS: area y=250(3本) / 370(4本) / 490(5本) → world y = +52
    const torches = [];
    for (const [ay, n] of [[250, 3], [370, 4], [490, 5]]) {
      for (let i = 0; i < n; i++) torches.push([(480 / (n + 1)) * (i + 1), ay + 52]);
    }
    await page.mouse.move(torches[0][0], torches[0][1]); await page.mouse.down();
    for (const [x, y] of torches) { await page.mouse.move(x, y); await page.waitForTimeout(150); }
    await page.mouse.up();
  }],
  ['ながの', 'onbashira', async () => {
    for (let i = 0; i < 14; i++) { await page.mouse.click(i % 2 ? 120 : 360, 400); await page.waitForTimeout(260); }
  }],
  ['ぎふ', 'karakuri', async () => {
    for (let k = 0; k < 8; k++) {
      const lit = await page.evaluate(() => {
        for (const s of window.__game.scene.getScenes(true)) {
          const f = [];
          const walk = (l) => { for (const o of l) { if (o.list) walk(o.list); if (o.scaleX > 1.0 && o.scaleX < 1.2 && o.list) { const m = o.getWorldTransformMatrix(); f.push({ x: m.tx, y: m.ty }); } } };
          walk(s.children.list); if (f.length) return f[0];
        } return null;
      });
      for (const x of [90, 180, 300, 390]) { await page.mouse.click(x, 522); await page.waitForTimeout(120); }
      void lit;
      await page.waitForTimeout(200);
    }
  }],
  ['しずおか', 'tako', async () => {
    for (let k = 0; k < 5; k++) {
      await page.mouse.move(240, 400); await page.mouse.down();
      await page.waitForTimeout(900);
      await page.mouse.up();
      await page.waitForTimeout(500);
    }
  }],
  ['あいち', 'makiwara', async () => {
    for (let k = 0; k < 10; k++) {
      const ring = await page.evaluate(() => {
        for (const s of window.__game.scene.getScenes(true)) {
          const f = [];
          const walk = (l) => { for (const o of l) { if (o.list) walk(o.list); if (o.type === 'Arc' && Math.round(o.radius) === 20 && o.visible) { const m = o.getWorldTransformMatrix(); f.push({ x: m.tx, y: m.ty }); } } };
          walk(s.children.list); if (f.length) return f[0];
        } return null;
      });
      if (ring) await page.mouse.click(ring.x, ring.y);
      await page.waitForTimeout(260);
    }
  }],
];

const results = { scoop: scoopScore };
for (const [pref, name, interact] of FESTS) {
  await gotoPref(pref);
  await d.startFest();
  await page.waitForTimeout(1600);
  await interact();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/chubu-fest-${name}.png` });
  results[name] = await score();
  log(`まつり ${name}: score=${results[name]}`);
}

console.log(JSON.stringify(results));
await browser.close();
const zero = Object.entries(results).filter(([, v]) => !v || v <= 0);
if (zero.length) {
  console.error('SCORE ZERO:', zero.map(([k]) => k).join(','));
  process.exit(1);
}
console.log('CHUBU OK');

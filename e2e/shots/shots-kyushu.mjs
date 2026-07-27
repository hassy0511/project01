/* きゅうしゅう・おきなわ8県の確認: 地図(おきなわインセット)と 実在祭り8本の 得点検証 */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = '/home/user/project01/e2e/shots';
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
const d = makeDriver(page, SHOTS);
const log = (s) => console.log('✔ ' + s);
const OFF = 52;

const score = () =>
  page.evaluate(() => {
    if (window.__mq?.kind === 'arcade' && typeof window.__mq.score === 'number') return window.__mq.score;
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

const findText = (needle) =>
  page.evaluate((n) => {
    for (const s of window.__game.scene.getScenes(true)) {
      let f = null;
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if (typeof o.text === 'string' && o.text.includes(n) && o.visible) {
            const m = o.getWorldTransformMatrix();
            f = { text: o.text, x: m.tx, y: m.ty };
          }
        }
      };
      walk(s.children.list);
      if (f) return f;
    }
    return null;
  }, needle);


/** name を つけた アイコンの ワールド座標(+ data) */
const namesOf = (name) =>
  page.evaluate((nm) => {
    const out = [];
    for (const s of window.__game.scene.getScenes(true)) {
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if (o.name === nm && o.visible) {
            const m = o.getWorldTransformMatrix();
            out.push({ x: m.tx, y: m.ty, data: o.data ? { ...o.data.values } : {}, tint: o.tintTopLeft, tex: o.texture?.key, alpha: o.alpha });
          }
        }
      };
      walk(s.children.list);
    }
    return out;
  }, name);

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
await page.screenshot({ path: `${SHOTS}/kyushu-regions.png` });
await d.clickText('きゅうしゅう・おきなわ');
await page.waitForTimeout(900);
await page.screenshot({ path: `${SHOTS}/kyushu-map-full.png` });
log('きゅうしゅう地図');

const gotoPref = async (name) => {
  await page.goto(BASE_URL);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1400);
  const t = (await d.findTexts(name))[0];
  if (!t) throw new Error(`県が みつからない: ${name}`);
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(700);
};

const FESTS = [
  ['ふくおか', 'yamakasa', async () => {
    // れんだで はしり、ときどき かつぎ手を こうたい
    for (let round = 0; round < 12; round++) {
      for (let i = 0; i < 12; i++) {
        await page.mouse.click(240, 250 + OFF);
        await page.waitForTimeout(70);
      }
      const x = [90, 190, 290, 390][round % 4];
      await page.mouse.click(x, 500 + OFF);
      await page.waitForTimeout(150);
    }
  }],
  ['さが', 'balloon', async () => {
    // バーナーで たかさを かえ、まとの うえで おとす
    for (let round = 0; round < 8; round++) {
      // まとに ちかづくまで バーナーを つかう
      for (let i = 0; i < 16; i++) {
        const bx = (await namesOf('mg-balloon')).find((b) => b.alpha === 1);
        const tx = (await namesOf('mg-goal'))[0];
        if (!bx || !tx) break;
        if (Math.abs(bx.x - tx.x) < 40) break;
        // まとが みぎなら うえの かぜ、ひだりなら したの かぜ
        const wantUp = tx.x > bx.x;
        await page.mouse.move(115, 620 + OFF);
        if (wantUp) {
          await page.mouse.down();
          await page.waitForTimeout(420);
          await page.mouse.up();
        } else {
          await page.waitForTimeout(420);
        }
      }
      await page.mouse.click(480 - 115, 620 + OFF);
      await page.waitForTimeout(900);
    }
  }],
  ['ながさき', 'kokkodesho', async () => {
    // なげ上げ → うけとめ の 2だん
    for (let round = 0; round < 14; round++) {
      await page.mouse.click(240, 300);
      await page.waitForTimeout(620);
      await page.mouse.click(240, 300);
      await page.waitForTimeout(500);
    }
  }],
  ['くまもと', 'kazariuma', async () => {
    for (let i = 0; i < 60; i++) {
      // すすむ ボタン
      await page.mouse.click(240, 610 + OFF);
      // ときどき なでる
      if (i % 4 === 3) {
        await page.mouse.move(170, 420 + OFF);
        await page.mouse.down();
        await page.mouse.move(230, 430 + OFF);
        await page.mouse.up();
      }
      await page.waitForTimeout(140);
    }
  }],
  ['おおいた', 'yukake', async () => {
    for (let round = 0; round < 12; round++) {
      const want = await findText('が いい!');
      const hot = want?.text.includes('あつめ');
      await page.mouse.move(240, 700);
      await page.mouse.down();
      await page.waitForTimeout(hot ? 1500 : 300);
      await page.mouse.up();
      await page.waitForTimeout(1100);
    }
  }],
  ['みやざき', 'hyottoko', async () => {
    for (let i = 0; i < 45; i++) {
      const cue = await findText('ポーズ!');
      const same = await findText('まねっこ');
      let idx = -1;
      if (cue) {
        idx = cue.text.includes('ひょっとこ') ? 0 : cue.text.includes('おかめ') ? 1 : 2;
      } else if (same) {
        idx = -2; // まえと おなじ: おおきな おめんを 見る
      }
      if (idx === -2) {
        const dancer = (await namesOf('mg-dancer')).find((o) => o.alpha === 1);
        const tex = dancer?.tex ?? '';
        idx = tex.includes('mask:red') ? 0 : tex.includes('face-surprised') ? 1 : tex.includes('foxmask') ? 2 : -1;
      }
      if (idx >= 0) {
        await page.mouse.click([90, 240, 390][idx], 440 + OFF);
        await page.waitForTimeout(260);
      } else {
        await page.waitForTimeout(120);
      }
    }
  }],
  ['かごしま', 'rokugatsudo', async () => {
    for (let round = 0; round < 10; round++) {
      for (let n = 1; n <= 12; n++) {
        const dot = await page.evaluate((num) => {
          for (const s of window.__game.scene.getScenes(true)) {
            let f = null;
            const walk = (l) => {
              for (const o of l) {
                if (o.list) walk(o.list);
                if (o.text === String(num) && o.style?.fontSize === '15px') {
                  const m = o.getWorldTransformMatrix();
                  f = { x: m.tx, y: m.ty };
                }
              }
            };
            walk(s.children.list);
            if (f) return f;
          }
          return null;
        }, n);
        if (!dot) continue;
        await page.mouse.click(dot.x, dot.y);
        await page.waitForTimeout(110);
      }
      await page.waitForTimeout(600);
    }
  }],
  ['おきなわ', 'tsunahiki', async () => {
    for (let i = 0; i < 120; i++) {
      const warn = await findText('ふんばれ');
      if (warn) {
        await page.mouse.move(240, 620);
        await page.mouse.down();
        await page.waitForTimeout(1500);
        await page.mouse.up();
      } else {
        await page.mouse.click(240, 620);
        await page.waitForTimeout(60);
      }
    }
  }],
];

const results = {};
for (const [pref, name, interact] of FESTS) {
  await gotoPref(pref);
  await d.startFest();
  await page.waitForTimeout(1600);
  await interact();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/ky-fest-${name}.png` });
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
console.log('KYUSHU OK');

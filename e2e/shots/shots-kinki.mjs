/* きんき7県の確認: 地図・実在祭り7本のスクショと得点検証 */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = '/home/user/project01/e2e/shots';
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
const d = makeDriver(page, SHOTS);
const log = (s) => console.log('✔ ' + s);
/** area 座標 → world 座標の ずれ(ヘッダー48+4) */
const OFF = 52;

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

/** 指定した もじの ワールド座標(ぜんぶ) */
const textsOf = (t) =>
  page.evaluate((needle) => {
    const out = [];
    for (const s of window.__game.scene.getScenes(true)) {
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if (o.text === needle && o.visible) {
            const m = o.getWorldTransformMatrix();
            out.push({ x: m.tx, y: m.ty });
          }
        }
      };
      walk(s.children.list);
    }
    return out;
  }, t);


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
await page.screenshot({ path: `${SHOTS}/kinki-regions.png` });
await d.clickText('きんき');
await page.waitForTimeout(900);
await page.screenshot({ path: `${SHOTS}/kinki-map-full.png` });
log('きんき地図');

const gotoPref = async (name) => {
  await page.goto(BASE_URL); // currentRegion=kinki が ほぞんされている
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1400);
  const t = (await d.findTexts(name))[0];
  if (!t) throw new Error(`県が みつからない: ${name}`);
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(700);
};

const FESTS = [
  ['みえ', 'ishidori', async () => {
    // かねと たいこ(area x=145/335, y=400)を こうごに たたく
    for (let i = 0; i < 22; i++) {
      await page.mouse.click(145, 400 + OFF);
      await page.waitForTimeout(140);
      await page.mouse.click(335, 400 + OFF);
      await page.waitForTimeout(420);
    }
  }],
  ['しが', 'kabuki', async () => {
    // せりふの あいずが わく(x≒384)に きたら タップ
    for (let i = 0; i < 90; i++) {
      const cues = await namesOf('mg-cue');
      const near = cues.find((c) => Math.abs(c.x - 384) < 18);
      if (near) {
        await page.mouse.click(240, 600);
        await page.waitForTimeout(180);
      } else {
        await page.waitForTimeout(60);
      }
    }
  }],
  ['きょうと', 'gion', async () => {
    for (let round = 0; round < 3; round++) {
      // 竹を 3まい しく(area y=478)
      for (const x of [180, 240, 300]) {
        await page.mouse.click(x, 478 + OFF);
        await page.waitForTimeout(180);
      }
      // やまほこを ゆっくり ぐるっと まわす(中心 240,400+OFF / はんけい120)
      const cx = 240;
      const cy = 400 + OFF;
      const r = 120;
      await page.mouse.move(cx + r, cy);
      await page.mouse.down();
      for (let i = 1; i <= 18; i++) {
        const a = i * 0.11;
        await page.mouse.move(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        await page.waitForTimeout(90);
      }
      await page.mouse.up();
      await page.waitForTimeout(900);
    }
  }],
  ['おおさか', 'danjiri', async () => {
    // めもりが ゾーンに きた ところで タップ(タイミングは まかせ)
    for (let i = 0; i < 40; i++) {
      await page.mouse.click(240, 620);
      await page.waitForTimeout(260);
    }
  }],
  ['ひょうご', 'fukuotoko', async () => {
    // れんだで はしり、ときどき うえに スワイプ
    for (let i = 0; i < 60; i++) {
      if (i % 9 === 8) {
        await page.mouse.move(240, 600);
        await page.mouse.down();
        await page.mouse.move(240, 520);
        await page.mouse.up();
      } else {
        await page.mouse.click(240, 620);
      }
      await page.waitForTimeout(120);
    }
  }],
  ['なら', 'yamayaki', async () => {
    // たいまつ(area 35,588)を タップ → 火の となりを なぞる
    await page.mouse.click(35, 588 + OFF);
    await page.waitForTimeout(500);
    for (let row = 4; row >= 0; row--) {
      const y = 300 + row * 62 + OFF;
      await page.mouse.move(75, y);
      await page.mouse.down();
      for (let col = 0; col < 6; col++) {
        await page.mouse.move(75 + col * 66, y);
        await page.waitForTimeout(90);
      }
      await page.mouse.up();
      await page.waitForTimeout(200);
    }
  }],
  ['わかやま', 'ougi', async () => {
    // たいまつを 上下に ふる(ふりかえしで 1かい)
    await page.mouse.move(240, 470 + OFF);
    await page.mouse.down();
    for (let i = 0; i < 26; i++) {
      await page.mouse.move(240, (i % 2 ? 470 : 380) + OFF);
      await page.waitForTimeout(110);
    }
    await page.mouse.up();
  }],
];

const results = {};
for (const [pref, name, interact] of FESTS) {
  await gotoPref(pref);
  await d.startFest();
  await page.waitForTimeout(1600);
  await interact();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/kinki-fest-${name}.png` });
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
console.log('KINKI OK');

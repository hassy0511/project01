/* ちゅうごく5県・しこく4県の確認: 地図2枚と 実在祭り9本の 得点検証 */
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

const gotoRegion = async (name, shot) => {
  await d.clickText('にっぽん');
  await d.clickText(name);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/${shot}.png` });
  log(`${name}地図`);
};
await gotoRegion('ちゅうごく', 'chugoku-map-full');

const gotoPref = async (name) => {
  await page.goto(BASE_URL);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1400);
  let t = (await d.findTexts(name))[0];
  if (!t) {
    // ちがう エリアに いる: エリアを きりかえる
    await d.clickText('にっぽん');
    await d.clickText(name === 'とっとり' || name === 'しまね' || name === 'おかやま' || name === 'ひろしま' || name === 'やまぐち' ? 'ちゅうごく' : 'しこく');
    await page.waitForTimeout(900);
    t = (await d.findTexts(name))[0];
  }
  if (!t) throw new Error(`県が みつからない: ${name}`);
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(700);
};

const FESTS = [
  ['とっとり', 'shanshan', async () => {
    // あいずを 見て かさを ひらく/とじる。「そのまま」の ときは タップしない
    for (let i = 0; i < 60; i++) {
      const cue = await page.evaluate(() => {
        for (const s of window.__game.scene.getScenes(true)) {
          let found = null;
          const walk = (l) => {
            for (const o of l) {
              if (o.list) walk(o.list);
              if (typeof o.text === 'string' && (o.text.includes('シャン') || o.text.includes('そのまま'))) found = o.text;
            }
          };
          walk(s.children.list);
          if (found) return found;
        }
        return null;
      });
      if (cue && !cue.includes('そのまま')) {
        await page.mouse.click(240, 620);
        await page.waitForTimeout(360);
      } else {
        await page.waitForTimeout(150);
      }
    }
  }],
  ['しまね', 'kagura', async () => {
    for (let i = 0; i < 40; i++) {
      const arrow = (await namesOf('mg-arrow'))[0] ?? null;
      if (arrow) {
        const dir = arrow.data.dir;
        const [dx, dy] = dir === 'up' ? [0, -70] : dir === 'down' ? [0, 70] : dir === 'left' ? [-70, 0] : [70, 0];
        await page.mouse.move(240, 620);
        await page.mouse.down();
        await page.mouse.move(240 + dx, 620 + dy);
        await page.mouse.up();
        await page.waitForTimeout(220);
      } else {
        await page.waitForTimeout(150);
      }
    }
  }],
  ['おかやま', 'eyou', async () => {
    for (let round = 0; round < 8; round++) {
      // しんぎを タップ
      for (let i = 0; i < 20; i++) {
        const t = (await namesOf('mg-shingi'))[0];
        if (t) {
          await page.mouse.click(t.x, t.y);
          break;
        }
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(400);
      // おされる むきの はんたいに スワイプ(あんないを よむ)
      for (let k = 0; k < 4; k++) {
        const hint = await page.evaluate(() => {
          for (const s of window.__game.scene.getScenes(true)) {
            let f = null;
            const walk = (l) => {
              for (const o of l) {
                if (o.list) walk(o.list);
                if (typeof o.text === 'string' && o.text.includes('おされる')) f = o.text;
              }
            };
            walk(s.children.list);
            if (f) return f;
          }
          return null;
        });
        if (!hint) {
          await page.waitForTimeout(300);
          continue;
        }
        const toRight = hint.includes('ひだりから');
        await page.mouse.move(240, 600);
        await page.mouse.down();
        await page.mouse.move(240 + (toRight ? 90 : -90), 600);
        await page.mouse.up();
        await page.waitForTimeout(700);
      }
    }
  }],
  ['ひろしま', 'betcha', async () => {
    for (let i = 0; i < 50; i++) {
      const kids = await namesOf('mg-kid');
      if (kids.length) await page.mouse.click(kids[0].x, kids[0].y);
      await page.waitForTimeout(180);
    }
  }],
  ['やまぐち', 'kingyo', async () => {
    // ひかっている てんを なぞる(みちの てんを じゅんに たどる)
    for (let round = 0; round < 6; round++) {
      const cx = 240;
      const cy = 380 + OFF;
      await page.mouse.move(cx + 110, cy);
      await page.mouse.down();
      for (let i = 1; i <= 30; i++) {
        const a = (i / 30) * Math.PI * 2;
        await page.mouse.move(cx + Math.cos(a) * 110, cy + Math.sin(a) * 74);
        await page.waitForTimeout(45);
      }
      await page.mouse.up();
      await page.waitForTimeout(500);
    }
  }],
  ['とくしま', 'awaodori', async () => {
    for (let i = 0; i < 80; i++) {
      const notes = (await namesOf('mg-note')).filter((n) => Math.abs(n.x - 96) < 24);
      const hand = notes.find((n) => n.data.kind === 'hand');
      const foot = notes.find((n) => n.data.kind === 'foot');
      if (hand) {
        await page.mouse.click(240, 620);
        await page.waitForTimeout(160);
      } else if (foot) {
        await page.mouse.move(240, 620);
        await page.mouse.down();
        await page.mouse.move(240, 540);
        await page.mouse.up();
        await page.waitForTimeout(160);
      } else {
        await page.waitForTimeout(60);
      }
    }
  }],
  ['かがわ', 'chousa', async () => {
    // 4つの かたを じゅんばんに タップしつづける
    for (let i = 0; i < 70; i++) {
      const x = [90, 190, 290, 390][i % 4];
      await page.mouse.click(x, 470 + OFF);
      await page.waitForTimeout(130);
    }
  }],
  ['えひめ', 'ushioni', async () => {
    for (let i = 0; i < 12; i++) {
      const target = (await namesOf('mg-gate')).find((g) => g.tint === 0xffd34d) ?? null;
      const head = (await namesOf('mg-head'))[0];
      if (!head || !target) {
        await page.waitForTimeout(250);
        continue;
      }
      await page.mouse.move(head.x, head.y);
      await page.mouse.down();
      const steps = 8;
      for (let k = 1; k <= steps; k++) {
        await page.mouse.move(
          head.x + ((target.x - head.x) * k) / steps,
          head.y + ((target.y - head.y) * k) / steps,
        );
        await page.waitForTimeout(50);
      }
      await page.mouse.up();
      await page.waitForTimeout(400);
    }
  }],
  ['こうち', 'yosakoi', async () => {
    for (let i = 0; i < 40; i++) {
      const cue = await page.evaluate(() => {
        for (const s of window.__game.scene.getScenes(true)) {
          let f = null;
          const walk = (l) => {
            for (const o of l) {
              if (o.list) walk(o.list);
              if (typeof o.text === 'string' && (o.text.includes('カチッ') || o.text.includes('よっちょれ'))) f = o.text;
            }
          };
          walk(s.children.list);
          if (f) return f;
        }
        return null;
      });
      if (cue) {
        const n = cue.includes('よっちょれ') ? 3 : 2;
        for (let k = 0; k < n; k++) {
          await page.mouse.click(240, 620);
          await page.waitForTimeout(90);
        }
        await page.waitForTimeout(400);
      } else {
        await page.waitForTimeout(100);
      }
    }
  }],
];

const results = {};
let shikokuShot = false;
for (const [pref, name, interact] of FESTS) {
  await gotoPref(pref);
  if (!shikokuShot && ['とくしま', 'かがわ', 'えひめ', 'こうち'].includes(pref)) {
    await d.clickText('ちずへ');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SHOTS}/shikoku-map-full.png` });
    log('しこく地図');
    shikokuShot = true;
    const t = (await d.findTexts(pref))[0];
    await page.mouse.click(t.x, t.y);
    await page.waitForTimeout(700);
  }
  await d.startFest();
  await page.waitForTimeout(1600);
  await interact();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/cs-fest-${name}.png` });
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
console.log('CHUGOKU/SHIKOKU OK');

/* ゆびを 2本 つかった とき、ゲームの おぼえがきが こわれない ことを しらべる。

   main.ts の activePointers で 2本目は とどく ように なった が、
   ゲーム側が 「おしはじめの ばしょ」を シーンで 1つの へんすうに
   もって いると、2本目が おりた しゅんかんに 1本目の きろくが
   うわがきされ、ちがう こと が おきる:

     ・ふくおとこ(ひょうごの 走る おまつり): downX が 2本目の x に なり、
       1本目を はなした ときに 2本の あいだの きょり(=大きい)が
       スワイプと 見なされて、よけて いないのに よけた ことに なる。
       たいてい じゃまの しゅるいが ちがう ので 「こける」= コンボ切れ。
     ・おうぎみこし(わかやま): lastY が うわがきされ、
       ありもしない ふりかえしに なったり ふりが 数えられなく なる。
     ・いねかり(しゅうかく): かたほうを はなすと もう かたほうの
       なぞりも 死ぬ(strokeActive が 1つ しか ない)。

   なおしかた: minigames/input.ts の PerPointer で p.id ごとに おぼえる。

   ここでは ほんものの 2点タッチ(CDP)を 送って、
   「2本 つかっても 1本の ときと 同じに はたらく」ことを たしかめる。

   実行: node e2e/shots/verify-two-finger-state.mjs(preview サーバーを 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('.', import.meta.url).pathname;

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const ctx = await browser.newContext({ viewport: { width: 480, height: 800 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const d = makeDriver(page, SHOTS);
const problems = [];
const cdp = await ctx.newCDPSession(page);

const touch = (type, pts) =>
  cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: pts.map(([x, y], i) => ({ x, y, id: i + 1 })),
  });

const score = () =>
  page.evaluate(() => (window.__mq && window.__mq.kind === 'arcade' ? window.__mq.score : null));

/** いま どの ゲームが 動いて いるか(engine 名) */
const engine = () =>
  page.evaluate(() => (window.__mq && window.__mq.kind === 'arcade' ? window.__mq.engine : null));

/** 「ミス」の しるし(コンボ切れ)が 出た かどうか。
    ゲームごとの ことばを さがす */
const sawText = (words) =>
  page.evaluate((ws) => {
    for (const s of window.__game.scene.getScenes(true)) {
      let hit = '';
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if (typeof o.text === 'string' && o.alpha > 0.15 && ws.some((w) => o.text.includes(w))) hit = o.text;
        }
      };
      walk(s.children.list);
      if (hit) return hit;
    }
    return '';
  }, words);

const goArea = async (area, pref) => {
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
  await page.waitForTimeout(700);
  await page.evaluate(() => window.__mqAdmin.unlockAll());
  await page.waitForTimeout(400);
  await d.clickText('にっぽん');
  await d.clickText(area);
  await page.waitForTimeout(900);
  const t = (await d.findTexts(pref))[0];
  if (!t) throw new Error(`県が みつからない: ${pref}`);
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(800);
  await d.startFest();
  await page.waitForTimeout(1500);
};

/* ================= 1. ふくおとこ(ひょうご) =================
   タップ 1回 = STEP_M(0.9m)すすむ。
   バグ版は 2本目を はなす とき 2本の あいだの きょり が スワイプと
   見なされ、dodge() に 入って **1歩も すすまない**(はしる 処理は
   swipe なら return する)。
   点は コンボ倍率で ぶれる ので、すすんだ きょり(m)で しらべる */

/** 「Nm / 60m ゴール Nかい」から すすんだ きょりを よみとる */
const meters = () =>
  page.evaluate(() => {
    for (const s of window.__game.scene.getScenes(true)) {
      let v = null;
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          const m = typeof o.text === 'string' ? o.text.match(/^([\d.]+)m \//) : null;
          if (m) v = parseFloat(m[1]);
        }
      };
      walk(s.children.list);
      if (v !== null) return v;
    }
    return null;
  });
await goArea('きんき', 'ひょうご');
console.log('ひょうご の ゲーム:', await engine());
if ((await score()) === null) {
  problems.push('ふくおとこが 始まって いない');
} else {
  const TAPS = 10;
  /* 1本指で TAPS 回 */
  let m0 = await meters();
  for (let i = 0; i < TAPS; i++) {
    await touch('touchStart', [[240, 620]]);
    await page.waitForTimeout(40);
    await touch('touchEnd', []);
    await page.waitForTimeout(130);
  }
  const oneFinger = (await meters()) - m0;

  /* 2本指で TAPS 回(ひだりと みぎ を いっしょに) */
  m0 = await meters();
  for (let i = 0; i < TAPS; i++) {
    await touch('touchStart', [[120, 620], [360, 620]]);
    await page.waitForTimeout(40);
    await touch('touchEnd', []);
    await page.waitForTimeout(130);
  }
  const twoFinger = (await meters()) - m0;
  console.log(`ふくおとこ: 1本指 ${TAPS}回 → +${oneFinger.toFixed(1)}m / 2本指 ${TAPS}回 → +${twoFinger.toFixed(1)}m`);
  // 2本の ゆびは 2歩 に なる のが すじ。すくなくとも 1本ぶんは すすむ こと
  if (twoFinger < oneFinger * 0.9) {
    problems.push(
      `ふくおとこ: 2本指だと すすまない(1本 +${oneFinger.toFixed(1)}m / 2本 +${twoFinger.toFixed(1)}m)`,
    );
  }
  await page.screenshot({ path: `${SHOTS}/two-finger-fukuotoko.png` });
}

/* ================= 2. おうぎみこし(わかやま) =================
   ドラッグで 火を そだてながら、もう かたほうの ゆびで ひのこを タップ。
   バグ版は 2本目が lastY を うわがきして ふりが 数えられなく なる。 */
await goArea('きんき', 'わかやま');
console.log('わかやま の ゲーム:', await engine());
if ((await score()) === null) {
  problems.push('おうぎみこしが 始まって いない');
} else {
  /** うえ・した に ふる(ドラッグ)。extra があれば もう1本 そえる */
  const swing = async (extra) => {
    for (let k = 0; k < 6; k++) {
      const y = k % 2 ? 250 : 480;
      const pts = extra ? [[240, y], extra] : [[240, y]];
      await touch(k === 0 ? 'touchStart' : 'touchMove', pts);
      await page.waitForTimeout(70);
    }
    await touch('touchEnd', []);
    await page.waitForTimeout(150);
  };

  let s0 = await score();
  await swing(null);
  await swing(null);
  const oneFinger = (await score()) - s0;

  s0 = await score();
  await swing([420, 700]); // もう 1本 そえたまま ふる
  await swing([420, 700]);
  const twoFinger = (await score()) - s0;
  console.log(`おうぎみこし: 1本で ふる → +${oneFinger} / 2本で ふる → +${twoFinger}`);
  // うごかない 2本目は ふりに かんけい しない ので、点は 同じくらいに なる はず。
  // バグ版は 1本目の たかさが 2本目で うわがきされ、でたらめな さ(d)で
  // ふりが 何度も 誤発火する ため 大きく ふえる(実測 2.8ばい)
  if (oneFinger > 0 && (twoFinger < oneFinger * 0.5 || twoFinger > oneFinger * 2.2)) {
    problems.push(
      `おうぎみこし: うごかない 2本目で ふりの かぞえが 狂う(1本 +${oneFinger} / 2本 +${twoFinger})`,
    );
  }
  await page.screenshot({ path: `${SHOTS}/two-finger-ougi.png` });
}

/* ================= 3. いねかり(しゅうかく・ちば の こめ) =================
   2本の ゆびで なぞって、かたほうを はなしても もう かたほうが 生きて いる か。 */
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
await page.waitForTimeout(700);
await page.evaluate(() => window.__mqAdmin.unlockAll());
await page.waitForTimeout(500);
await d.clickText('ちば');
await page.waitForTimeout(800);
/** 「こめ」の カードの 「たねを まく」を おす(なんばんめ かは データしだい なので
    そざい名と 同じ たかさの ボタンを えらぶ) */
const clickPlantOf = async (matName) => {
  for (let tries = 0; tries < 8; tries++) {
    const hit = await page.evaluate((nm) => {
      const rows = [];
      const btns = [];
      for (const s of window.__game.scene.getScenes(true)) {
        const walk = (l) => {
          for (const o of l) {
            if (o.list) walk(o.list);
            if (typeof o.text !== 'string') continue;
            const m = o.getWorldTransformMatrix();
            // カードの みだしは 「こめの たんぼ」など(そざい名 + ばしょ)
            if (o.text.trim().startsWith(nm)) rows.push(Math.round(m.ty));
            // うえる ことば は そざいごと(「たねを まく」「いねを うえる」など)。
            // カードの みぎ半分に ある ボタンの 文字を ひろう
            if (m.tx > 300 && o.text.length <= 12 && /[ぁ-ん]/.test(o.text) && !o.text.includes('/')) {
              btns.push({ x: Math.round(m.tx), y: Math.round(m.ty), t: o.text });
            }
          }
        };
        walk(s.children.list);
      }
      if (!rows.length || !btns.length) return null;
      const y = rows[0];
      const b = btns.sort((a, c) => Math.abs(a.y - y) - Math.abs(c.y - y))[0];
      return Math.abs(b.y - y) < 44 ? b : null;
    }, matName);
    if (hit) {
      console.log(`  「${matName}」の ボタン: 「${hit.t}」`);
      await page.mouse.click(hit.x, hit.y);
      return true;
    }
    // 見えて いない: すこし スクロール
    await page.mouse.move(240, 500);
    await page.mouse.wheel(0, 220);
    await page.waitForTimeout(300);
  }
  return false;
};
if (!(await clickPlantOf('こめ'))) throw new Error('ちばで 「こめ」の たねまきが 見つからない');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1400);
await d.scrollAndClick('しゅうかく!');
await page.waitForTimeout(1600);

console.log('ちば の こめ の ゲーム:', await engine());
const reapOk = (await engine()) === 'reap';
if (!reapOk) {
  problems.push(`いねかりに 入れなかった(engine=${await engine()})`);
} else {
  /* いねの ならび(reapGame の ROW_Y0=180 / ROW_GAP=122、area は 52 下)。
     3れつめ(まんなか あたり)を なぞる */
  const ROW_Y = 180 + 2 * 122 + 52;

  /* まず 1本だけで なぞって、なぞれば 点が 入る ことを たしかめる(1れつめ) */
  const TEST_Y = 180 + 52;
  let s0 = await score();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 420, y: TEST_Y, id: 1 }] });
  for (let x = 400; x >= 40; x -= 24) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: TEST_Y, id: 1 }] });
    await page.waitForTimeout(40);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(300);
  const oneFingerReap = (await score()) - s0;
  console.log(`いねかり: 1本で なぞる → +${oneFingerReap}`);
  if (oneFingerReap === 0) {
    problems.push('いねかり: 1本でも なぞれて いない(しらべが 成立して いない)');
  }

  /* 2本 おいて、1本目を はなす。そのあと 2本目で なぞって 点が 入るか */
  s0 = await score();
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 60, y: ROW_Y, id: 1 }, { x: 420, y: ROW_Y, id: 2 }],
  });
  await page.waitForTimeout(80);
  // 1本目(id=1)を はなす = のこりは 2本目 だけ
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: 60, y: ROW_Y, id: 1 }] });
  await page.waitForTimeout(120);
  const afterRelease = await score();
  // 2本目(id=2)で よこに なぞる
  for (let x = 400; x >= 40; x -= 24) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: ROW_Y, id: 2 }] });
    await page.waitForTimeout(40);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(300);
  const gained = (await score()) - afterRelease;
  console.log(`いねかり: 1本を はなした あと のこった ゆびで なぞる → +${gained}`);
  if (gained === 0) {
    problems.push('いねかり: かたほうを はなすと もう かたほうの なぞりも 死ぬ');
  }
  await page.screenshot({ path: `${SHOTS}/two-finger-reap.png` });
}

await browser.close();
if (errors.length) console.error('PAGEERROR:', [...new Set(errors)].join(' | '));
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('TWO FINGER STATE OK');

/* 「あそびかた(?)」を 読んでも ゲームが 損を しない ことを しらべる。

   もとの バグ:
     ・Phaser は 「もの」を さわった あと かならず scene.input からも
       おなじ タップを 出す(InputPlugin.processDownEvents)。
       ミニゲームは ほぼ scene.input 直づけ なので、
       「?」を おした タップが ゲームにも 入って いた:
         わらじ → 「みぎ足」の タップに なって よろけ(コンボ切れ+450ms停止)
         あわおどり → judge() が 走り ノーツが ないので かならず ミス
         山車 → pull() が 走り めもりが ゾーン外なら ミス
     ・モーダルの くらい まく(setInteractive)も これは 止められない ので、
       「わかった!」を おす タップも ゲームに とどいた。
     ・時計は 止まる が ミニゲームの UPDATE は まわりつづける ので、
       説明を 読んで いる あいだに ノーツ・きゃくが ながれて
       ミス判定を こえ、コンボが きえて いた。

   しらべる こと(ゲームごとの あたり判定に よらない ように、
   「scene.input に とどいたか」を 数えて 見る):
     1. 「?」を おした タップが scene.input に とどかない
     2. モーダルの 上の タップも とどかない
     3. とじる タップも とどかない
     4. 読んで いる あいだ ゲームの うごき(UPDATE)が 止まる
     5. とじた あとは ちゃんと とどく・うごきだす(もどし わすれが ない)

   実行: node e2e/shots/verify-help-safe.mjs(preview サーバーを 立ててから) */
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

const SCENE = 'FestivalScene';

/** scene.input に とどいた タップの 数を 数えはじめる */
const startCounting = () =>
  page.evaluate((key) => {
    window.__pd = 0;
    window.__pu = 0;
    window.__dom = 0;
    // キャンバスに とどいた か(タップが そもそも 当たって いるか の たしかめ)
    document.querySelector('canvas').addEventListener('pointerdown', () => window.__dom++);
    for (const s of window.__game.scene.getScenes(true)) {
      if (s.scene.key !== key) continue;
      s.input.on('pointerdown', () => window.__pd++);
      s.input.on('pointerup', () => window.__pu++);
    }
  }, SCENE);

const counts = () => page.evaluate(() => ({ down: window.__pd, up: window.__pu, dom: window.__dom }));
const resetCounts = () =>
  page.evaluate(() => {
    window.__pd = 0;
    window.__pu = 0;
    window.__dom = 0;
  });

const arcade = () =>
  page.evaluate(() => {
    const h = window.__mq;
    return h && h.kind === 'arcade' ? { score: h.score, secLeft: h.secLeft } : null;
  });

/** ミニゲームの まいフレーム処理(UPDATE の ききみみ)が いくつ ついて いるか。
    トゥイーン(かざりの ゆれ)は わざと 止めて いない ので、
    ばしょの 見くらべでは なく 「しかけが 外れて いるか」を 直に 見る */
const updaters = () =>
  page.evaluate((key) => {
    for (const s of window.__game.scene.getScenes(true)) {
      if (s.scene.key !== key) continue;
      return s.events.listenerCount('update');
    }
    return -1;
  }, SCENE);

const findByName = (name) =>
  page.evaluate((n) => {
    for (const s of window.__game.scene.getScenes(true)) {
      let hit = null;
      const walk = (l) => {
        for (const o of l) {
          if (o.list) walk(o.list);
          if (o.name === n && o.active) {
            const m = o.getWorldTransformMatrix();
            hit = { x: Math.round(m.tx), y: Math.round(m.ty) };
          }
        }
      };
      walk(s.children.list);
      if (hit) return hit;
    }
    return null;
  }, name);

await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1500);
await page.evaluate(() => window.__mqAdmin.skipGuides());
await d.clickText('スキップ');
await d.waitText('にっぽん ぜんこく');
// エリアは はじめ かんとう だけ。かんとうへ 入って から ぜんぶ あける
await d.clickText('かんとう');
await page.waitForTimeout(700);
await page.evaluate(() => window.__mqAdmin.unlockAll());
await page.waitForTimeout(400);
await d.clickText('にっぽん');
await d.clickText('しこく');
await page.waitForTimeout(900);

/* とくしま の あわおどり(ノーツが ながれる = うごきが 見やすい) */
const tokushima = (await d.findTexts('とくしま'))[0];
if (!tokushima) throw new Error('とくしま が 見つからない');
await page.mouse.click(tokushima.x, tokushima.y);
await page.waitForTimeout(800);
await d.startFest();
await page.waitForTimeout(1500);

if (!(await arcade())) {
  problems.push('おまつりが 始まって いない(__mq が arcade で ない)');
} else {
  await startCounting();

  /* --- ふつうの タップは とどく(かぞえかたが 正しいか の たしかめ) --- */
  await page.mouse.click(240, 500);
  await page.waitForTimeout(250);
  const base = await counts();
  if (base.down === 0) {
    problems.push('ばんめんの タップが scene.input に とどいて いない(かぞえかたが おかしい)');
  }
  console.log(`ばんめんの タップ: down=${base.down} up=${base.up}(とどく のが 正しい)`);

  const baseUpd = await updaters();
  console.log(`あそぶ とき の UPDATE ききみみ: ${baseUpd}`);

  const btn = await findByName('nav-help');
  if (!btn) {
    problems.push('「?」ボタンが 見つからない');
  } else {
    /* --- 1. 「?」を おす --- */
    await resetCounts();
    const beforeArcade = await arcade();
    await page.mouse.click(btn.x, btn.y);
    await page.waitForTimeout(700);
    const onOpen = await counts();
    if (onOpen.down > 0 || onOpen.up > 0) {
      problems.push(`「?」の タップが ゲームに とどいた: down=${onOpen.down} up=${onOpen.up}`);
    }
    if (onOpen.dom === 0) problems.push('「?」の タップが キャンバスに 当たって いない(しらべ が 成立して いない)');
    console.log(`「?」の タップ: dom=${onOpen.dom} down=${onOpen.down} up=${onOpen.up}(dom=1 / down,up=0 が 正しい)`);
    // モーダルが ちゃんと ひらいて いる か(swallow が ききすぎて いない か)
    if (!(await d.findTexts('わかった!')).length) {
      problems.push('「?」を おしても あそびかたが ひらかない');
    }
    await page.screenshot({ path: `${SHOTS}/help-safe-open.png` });

    /* --- 2. モーダルの 上を タップ --- */
    await resetCounts();
    await page.mouse.click(240, 300);
    await page.waitForTimeout(300);
    const onModal = await counts();
    if (onModal.down > 0 || onModal.up > 0) {
      problems.push(`モーダルの 上の タップが ゲームに とどいた: down=${onModal.down} up=${onModal.up}`);
    }
    if (onModal.dom === 0) problems.push('モーダルの 上の タップが キャンバスに 当たって いない');
    console.log(`モーダルの 上の タップ: dom=${onModal.dom} down=${onModal.down} up=${onModal.up}(dom=1 / down,up=0 が 正しい)`);

    /* --- 4. 読んで いる あいだ ゲームの まいフレーム処理が 止まる --- */
    await page.waitForTimeout(1600);
    const readUpd = await updaters();
    if (readUpd >= baseUpd) {
      problems.push(
        `読んで いる あいだも ゲームの まいフレーム処理が 動いて いる(UPDATE ${baseUpd} → ${readUpd})`,
      );
    } else {
      console.log(`読んで いる あいだ: UPDATE ${baseUpd} → ${readUpd}(ゲームの ぶんが 外れて いる)`);
    }
    const readArcade = await arcade();
    if (Math.abs(readArcade.secLeft - beforeArcade.secLeft) > 0.6) {
      problems.push(
        `読んで いる あいだに 時計が すすんだ: ${beforeArcade.secLeft.toFixed(1)} → ${readArcade.secLeft.toFixed(1)}`,
      );
    }
    if (readArcade.score !== beforeArcade.score) {
      problems.push(`読んで いる あいだに 点が かわった: ${beforeArcade.score} → ${readArcade.score}`);
    }

    /* --- 3. とじる タップ --- */
    await resetCounts();
    await d.clickText('わかった!');
    await page.waitForTimeout(500);
    const onClose = await counts();
    if (onClose.down > 0 || onClose.up > 0) {
      problems.push(`とじる タップが ゲームに とどいた: down=${onClose.down} up=${onClose.up}`);
    }
    if (onClose.dom === 0) problems.push('とじる タップが キャンバスに 当たって いない');
    console.log(`とじる タップ: dom=${onClose.dom} down=${onClose.down} up=${onClose.up}(dom=1 / down,up=0 が 正しい)`);

    /* --- 5. とじた あとは とどく + ゲームも うごきだす --- */
    await resetCounts();
    await page.mouse.click(240, 500);
    await page.waitForTimeout(250);
    const after = await counts();
    if (after.down === 0) {
      problems.push('とじた あと タップが とどかない(ききみみを もどし わすれて いる)');
    }
    console.log(`とじた あとの タップ: down=${after.down} up=${after.up}(とどく のが 正しい)`);

    const afterUpd = await updaters();
    if (afterUpd !== baseUpd) {
      problems.push(`とじた あと まいフレーム処理が もどって いない(UPDATE ${baseUpd} → ${afterUpd})`);
    } else {
      console.log(`とじた あと: UPDATE ${afterUpd}(もどって いる)`);
    }
    await page.screenshot({ path: `${SHOTS}/help-safe-after.png` });
  }
}

await browser.close();
if (errors.length) console.error('PAGEERROR:', [...new Set(errors)].join(' | '));
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('HELP SAFE OK');

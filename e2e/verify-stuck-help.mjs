/* あそび中の 手引き(まよって いる 子への 助け)の テスト。

   しらべる こと:
     1. 点が 入らない まま しばらく たつと、ゆびマークが もう一度 出る
        ── ゆびマークは 「5びょう さわらない」と 出る しくみ なので、
           **さわりつづけて いる のに 点が 入らない** 子には 出て こなかった。
           そこを アーケードが 点で 見て 助ける(HELP_NUDGE)
     2. ちゃんと 点が 入って いる あいだは 出て こない(じゃまを しない)

   実行: node e2e/verify-stuck-help.mjs(preview サーバーを 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from './helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('./shots', import.meta.url).pathname;

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
const d = makeDriver(page, SHOTS);

/** ゆびマークが いま 見えて いるか(alpha > 0 の hand-point アイコン) */
const handVisible = () =>
  page.evaluate(() => {
    let seen = false;
    for (const s of window.__game.scene.getScenes(true)) {
      const walk = (list) => {
        for (const o of list) {
          if (o.list) walk(o.list);
          if (String(o.texture?.key ?? '').includes('hand-point') && o.alpha > 0.05) seen = true;
        }
      };
      walk(s.children.list);
    }
    return seen;
  });

await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1500);
await page.evaluate(() => {
  window.__mqAdmin.skipGuides();
  window.__mqAdmin.unlockAll();
  window.__mqAdmin.boostAll();
});
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(2000);

/* とちぎの おまつり(ましこ ろくろ。なぞって 形を つくる ので タップでは 点が 入らない) */
await d.clickText('とちぎ');
await page.waitForTimeout(900);
await d.startFest();
await page.waitForTimeout(1800);

/* --- 1. 「さわって いるのに 点が 入らない」を つくる ---
   画面の すみ(なにも ない ところ)を たたきつづける。
   これで ゆびマークの 「5びょう さわらない」は はたらかない */
const poke = async (ms) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    await page.mouse.click(12, 120); // area の 左上のすみ
    await page.waitForTimeout(400);
  }
};

// まず ゆびマークを 一度 けす(さわると ひっこむ)
await page.mouse.click(12, 120);
await page.waitForTimeout(400);

let appeared = false;
const t0 = Date.now();
while (Date.now() - t0 < 16000 && !appeared) {
  await poke(1200);
  if (await handVisible()) appeared = true;
}
console.log(appeared ? 'まよって いる とき: ゆびマークが 出た ✓' : 'まよって いる とき: 出なかった ✗');
if (!appeared) problems.push('点が 入らない まま たっても ゆびマークが 出て こない');
await page.screenshot({ path: `${SHOTS}/stuck-help.png` });

/* --- 2. うまく 点が 入って いる あいだは 出て こない ---
   ぐんまの だるま積みは タップで 点が 入る ので、ここで しらべる */
await d.clickText('もどる');
await page.waitForTimeout(900);
await d.clickText('ちずへ');
await page.waitForTimeout(900);
await d.clickText('ぐんま');
await page.waitForTimeout(900);
await d.startFest();
await page.waitForTimeout(1800);

const scoreNow = () => page.evaluate(() => (window.__mq?.kind === 'arcade' ? window.__mq.score : -1));
const before = await scoreNow();
let nagged = false;
const t1 = Date.now();
while (Date.now() - t1 < 11000) {
  await page.mouse.click(240, 470); // まん中を たたく = だるまが おちる
  await page.waitForTimeout(350);
  if (await handVisible()) nagged = true;
}
const after = await scoreNow();
console.log(`だるま積み 点: ${before} → ${after}${nagged ? ' / ゆびマークが 出た' : ' / ゆびマークは 出ない'}`);
if (after <= before) {
  problems.push(`点が 入らなかった(${before} → ${after})。台本が ゲームに あって いない`);
} else if (nagged) {
  problems.push('うまく あそべて いる のに ゆびマークが 出て きた(じゃまに なる)');
} else {
  console.log('うまく あそべて いる とき: 出て こない ✓');
}

await browser.close();
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('STUCK HELP OK');

/* 効果音の 回帰テスト。

   ★ 音は 人が 聞かないと 良し悪しが わからない。ここで 見るのは
     「良い 音か」では なく 「こわれて いないか」だけ:
       ・鳴って いる(無音に なって いない)
       ・われて いない(1.0 に はりつかない)
       ・長さが おかしく ない(鳴りっぱなしに ならない)
       ・BGM の じゃまを する ほど 大きく ない
     合成の 中身を いじる たび、ここが 落ちなければ 「音が 消えた・
     われた・鳴りやまない」の 事故は 起きて いない と 言える。

   実行: node e2e/verify-sfx.mjs(preview サーバーを 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH } from './helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
/** しらべる 音(ぜんぶ) */
const NAMES = ['pop', 'good', 'bad', 'plant', 'collect', 'fanfare', 'star', 'fest', 'hint'];
/** これを 下まわると 「鳴って いない」 */
const MIN_PEAK = 0.05;
/** これを こえると 「われて いる」(リミッターの 先で 1.0 に はりつく) */
const MAX_PEAK = 0.98;
/** 鳴りおわって いて ほしい 時間(ms)。長い ものでも fest の 6音ぶん */
const TAIL_MS = 1600;
/** 鳴りやんだ と みなす しきい値 */
const SILENT = 0.02;

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

/* 出口に アナライザを 割りこませて 実際の 波形を 測る */
await page.addInitScript(() => {
  const OrigConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    try {
      if (dest && dest.constructor && /AudioDestinationNode/.test(dest.constructor.name)) {
        const ctx = dest.context;
        if (!ctx.__an) {
          ctx.__an = ctx.createAnalyser();
          ctx.__an.fftSize = 2048;
          OrigConnect.call(ctx.__an, ctx.destination);
          window.__ctx = ctx;
        }
        OrigConnect.call(this, ctx.__an);
      }
    } catch {
      /* noop */
    }
    return OrigConnect.call(this, dest, ...rest);
  };
  window.__peak = () => {
    const ctx = window.__ctx;
    if (!ctx?.__an) return null;
    const buf = new Float32Array(ctx.__an.fftSize);
    ctx.__an.getFloatTimeDomainData(buf);
    let p = 0;
    for (const v of buf) p = Math.max(p, Math.abs(v));
    return p;
  };
});

await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1300);
await page.evaluate(() => window.__mqAdmin.skipGuides());
await page.mouse.click(240, 400); // 1タップで 音が つかえる ように なる
await page.waitForTimeout(1500);

/** その 音を 鳴らして、いちばん 大きい ところと、鳴りおわったかを 測る */
const measure = async (name) => {
  await page.evaluate((n) => {
    window.__mqAdmin.sfx(n);
  }, name);
  let peak = 0;
  for (let i = 0; i < 26; i++) {
    const p = await page.evaluate(() => window.__peak());
    if (p !== null) peak = Math.max(peak, p);
    await page.waitForTimeout(25);
  }
  await page.waitForTimeout(TAIL_MS);
  let tail = 0;
  for (let i = 0; i < 4; i++) {
    const p = await page.evaluate(() => window.__peak());
    if (p !== null) tail = Math.max(tail, p);
    await page.waitForTimeout(40);
  }
  return { peak, tail };
};

/* BGM を 止める(効果音だけを 測る ため)。ミュートでは なく 曲だけ 止める */
await page.evaluate(() => window.__mqAdmin.bgm(false));
await page.waitForTimeout(800);
const quiet = await page.evaluate(() => window.__peak());
if (quiet !== null && quiet > SILENT) problems.push(`テストの 前提: BGM が 止まって いない(${quiet.toFixed(3)})`);

console.log('おと          さいだい   1.6びょう後');
for (const name of NAMES) {
  const { peak, tail } = await measure(name);
  console.log(`${name.padEnd(12)}  ${peak.toFixed(3)}     ${tail.toFixed(3)}`);
  if (peak < MIN_PEAK) problems.push(`${name}: 鳴って いない(peak ${peak.toFixed(3)} < ${MIN_PEAK})`);
  if (peak > MAX_PEAK) problems.push(`${name}: われて いる(peak ${peak.toFixed(3)} > ${MAX_PEAK})`);
  if (tail > SILENT) problems.push(`${name}: 鳴りやまない(1.6びょう後も ${tail.toFixed(3)})`);
}

await browser.close();
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('SFX OK');

/* おとの 出力レベルを 実ブラウザで 測る回帰テスト。
   「BGMが 鳴っていない」の 再発防止: 出口(destination)に アナライザを 割りこませて
   じっさいの 音の おおきさ(RMS/ピーク)を 測り、しきい値を 下まわったら 失敗する。

   使い方: npx vite preview --port 4273 を 立ててから node e2e/verify-audio.mjs */
import { chromium } from 'playwright';
import { CHROMIUM_PATH } from './helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
/** これを 下まわると 「鳴っていない」と 判定する(実測: なおす前 peak 0.02〜0.15 / なおした後 0.15〜0.65) */
const MIN_PEAK = 0.12;
const MIN_RMS = 0.02;
/** 音が でている サンプルの 割合(休符も あるので 全部では ない) */
const MIN_LOUD_RATIO = 0.5;

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
page.on('pageerror', (e) => console.error('pageerror:', e.message));

await page.addInitScript(() => {
  const OrigConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    try {
      if (dest && dest.constructor && /AudioDestinationNode/.test(dest.constructor.name)) {
        const ctx = dest.context;
        if (!ctx.__analyser) {
          ctx.__analyser = ctx.createAnalyser();
          ctx.__analyser.fftSize = 2048;
          OrigConnect.call(ctx.__analyser, ctx.destination);
          window.__probeCtx = ctx;
        }
        OrigConnect.call(this, ctx.__analyser);
      }
    } catch {
      /* noop */
    }
    return OrigConnect.call(this, dest, ...rest);
  };
  window.__measure = () => {
    const ctx = window.__probeCtx;
    if (!ctx || !ctx.__analyser) return null;
    const buf = new Float32Array(ctx.__analyser.fftSize);
    ctx.__analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    let peak = 0;
    for (const v of buf) {
      sum += v * v;
      peak = Math.max(peak, Math.abs(v));
    }
    return { rms: Math.sqrt(sum / buf.length), peak, state: ctx.state };
  };
});

await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1200);
// 1タップで AudioContext が resume して BGM が はじまる
await page.mouse.click(240, 400);
await page.waitForTimeout(2500);

const samples = [];
for (let i = 0; i < 20; i++) {
  samples.push(await page.evaluate(() => window.__measure()));
  await page.waitForTimeout(200);
}
await browser.close();

const valid = samples.filter(Boolean);
if (!valid.length) {
  console.error('AUDIO FAILED: そもそも AudioContext が 出力に つながっていない');
  process.exit(1);
}
const peak = Math.max(...valid.map((s) => s.peak));
const loud = valid.filter((s) => s.rms >= MIN_RMS).length / valid.length;
const avgRms = valid.reduce((a, s) => a + s.rms, 0) / valid.length;
console.log(
  `おと: さいだいピーク ${peak.toFixed(3)} / へいきんRMS ${avgRms.toFixed(3)} / 鳴っている割合 ${(loud * 100).toFixed(0)}%`,
);
if (peak < MIN_PEAK || loud < MIN_LOUD_RATIO) {
  console.error(`AUDIO TOO QUIET: peak>=${MIN_PEAK} かつ 割合>=${MIN_LOUD_RATIO * 100}% が ひつよう`);
  process.exit(1);
}
console.log('AUDIO OK');

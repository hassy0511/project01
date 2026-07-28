/* アプリを 見ていない あいだ 音が 止まるかの 回帰テスト。
   「ホームに もどっても・画面を ロックしても BGM が 鳴りつづける」の 再発防止。

   見る もの:
     1. かくれると AudioContext が suspended に なり、音の 時計(currentTime)が 進まなくなる
        (= 音を 作るのを やめている。BGM の 先読み予約も 止まっている)
     2. もどると 時計が 進みだし、じっさいの 音量が もどる(曲の つづきから)
     3. iPhone の ふり(UA)を した ときは、出口の <audio> に pause() が 呼ばれる
        ← これが 本当の 原因。iOS は 出口を メディア再生に して いる ので
          AudioContext を 止めるだけでは 足りない

   かくれた 状態の 作りかた: headless の ブラウザは タブを 切りかえても
   ほんとうに 「かくれた」ことに ならない(document.hidden が false のまま)ので、
   document.hidden / visibilityState を さしかえて visibilitychange を 発火させる。
   実機の Safari が バックグラウンドで やる ことと 同じ しらせ方で、
   受け手(main.ts → sfx.ts → bgm.ts)の ふるまいを ためす。

   実行: node e2e/verify-audio-bg.mjs(npx vite preview --port 4273 を 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH } from './helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
/** かくれている あいだに 進んで よい 音の 時計(秒)。ほんとうは 0 だが 止まる ずれを みこむ */
const MAX_HIDDEN_ADVANCE = 0.15;
/** もどった あとに 進んで ほしい 音の 時計(秒) */
const MIN_BACK_ADVANCE = 0.4;
/** もどった あとの 音量(verify-audio.mjs と 同じ しきい値) */
const MIN_PEAK = 0.12;

/** 出力に アナライザを 割りこませ、<audio> の play/pause も 記録する。
    あわせて 「かくれた ふり」を できる ように する */
const probe = () => {
  let fakeHidden = false;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => fakeHidden });
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (fakeHidden ? 'hidden' : 'visible'),
  });
  window.__setHidden = (v) => {
    fakeHidden = v;
    document.dispatchEvent(new Event('visibilitychange'));
  };
  const OrigConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    try {
      if (dest && dest.constructor && /AudioDestinationNode/.test(dest.constructor.name)) {
        const ctx = dest.context;
        if (!ctx.__analyser) {
          ctx.__analyser = ctx.createAnalyser();
          ctx.__analyser.fftSize = 2048;
          OrigConnect.call(ctx.__analyser, ctx.destination);
        }
        window.__probeCtx = ctx;
        OrigConnect.call(this, ctx.__analyser);
      }
      // iOS ルート(MediaStream)では destination に つながらない ので ここで つかむ
      if (dest && dest.constructor && /MediaStreamAudioDestinationNode/.test(dest.constructor.name)) {
        window.__probeCtx = dest.context;
      }
    } catch {
      /* noop */
    }
    return OrigConnect.call(this, dest, ...rest);
  };
  window.__mediaLog = [];
  const p = HTMLMediaElement.prototype;
  const origPlay = p.play;
  const origPause = p.pause;
  p.play = function (...a) {
    window.__mediaLog.push('play');
    return origPlay.apply(this, a);
  };
  p.pause = function (...a) {
    window.__mediaLog.push('pause');
    return origPause.apply(this, a);
  };
  window.__audioState = () => {
    const ctx = window.__probeCtx;
    if (!ctx) return null;
    let peak = 0;
    if (ctx.__analyser) {
      const buf = new Float32Array(ctx.__analyser.fftSize);
      ctx.__analyser.getFloatTimeDomainData(buf);
      for (const v of buf) peak = Math.max(peak, Math.abs(v));
    }
    return { state: ctx.state, time: ctx.currentTime, peak, media: window.__mediaLog.slice() };
  };
};

const problems = [];
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });

/** BGM が 鳴っている ところまで すすめた ページを かえす */
const openPlaying = async (ctxOpts) => {
  const context = await browser.newContext({ viewport: { width: 480, height: 800 }, ...ctxOpts });
  const page = await context.newPage();
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  await page.addInitScript(probe);
  await page.goto(BASE_URL);
  await page.waitForSelector('canvas');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.__mqAdmin.skipGuides());
  await page.mouse.click(240, 400); // 1タップで AudioContext が resume して BGM が はじまる
  await page.waitForTimeout(2000);
  return { context, page };
};

/* ================= 1+2. かくれたら 止まり、もどったら つづく ================= */
{
  const { context, page } = await openPlaying();
  const playing = await page.evaluate(() => window.__audioState());
  if (!playing) problems.push('そもそも AudioContext が つかめない(テストの 前提が くずれている)');
  else if (playing.state !== 'running') problems.push(`さいせい中に state=${playing.state}(running で ないと 前提が くずれる)`);

  // ホームに もどった / 画面を ロックした のと 同じ しらせ
  await page.evaluate(() => window.__setHidden(true));
  await page.waitForTimeout(700);
  const hidden = await page.evaluate(() => ({ hidden: document.hidden, ...window.__audioState() }));
  if (!hidden.hidden) {
    problems.push('テストの 前提: かくれた ことに できていない');
  } else {
    if (hidden.state !== 'suspended') problems.push(`かくれても AudioContext が 止まらない(state=${hidden.state})`);
    // 先読み予約が 止まっているか = 音の 時計が 進まないか
    const t0 = hidden.time;
    await page.waitForTimeout(1200);
    const still = await page.evaluate(() => window.__audioState());
    const advance = still.time - t0;
    if (advance > MAX_HIDDEN_ADVANCE) {
      problems.push(`かくれている あいだも 音が 作られている(時計が ${advance.toFixed(2)}秒 すすんだ)`);
    } else {
      console.log(`かくれている あいだ: state=${still.state} / 時計 +${advance.toFixed(3)}秒 ✓`);
    }
  }

  // もどす
  await page.evaluate(() => window.__setHidden(false));
  await page.mouse.click(240, 400); // 実機と 同じく タップも する(自動で 鳴りだす はずだが 念のため)
  await page.waitForTimeout(1500);
  const back = await page.evaluate(() => window.__audioState());
  const backAdvance = back.time - hidden.time;
  if (back.state !== 'running' || backAdvance < MIN_BACK_ADVANCE) {
    problems.push(`もどっても 鳴りださない(state=${back.state} / 時計 +${backAdvance.toFixed(2)}秒)`);
  }
  let peak = back.peak;
  for (let i = 0; i < 12; i++) {
    const s = await page.evaluate(() => window.__audioState());
    peak = Math.max(peak, s.peak);
    await page.waitForTimeout(200);
  }
  if (peak < MIN_PEAK) problems.push(`もどった あとの 音量が 小さい(peak ${peak.toFixed(3)} < ${MIN_PEAK})`);
  else console.log(`もどった あと: state=${back.state} / 時計 +${backAdvance.toFixed(2)}秒 / peak ${peak.toFixed(3)} ✓`);
  await context.close();
}

/* ================= 3. iPhone の ふり: <audio> が pause される ================= */
{
  const { context, page } = await openPlaying({ userAgent: IPHONE_UA, hasTouch: true, isMobile: true });
  const before = await page.evaluate(() => window.__mediaLog.slice());
  if (!before.includes('play')) {
    problems.push('iPhone UA なのに <audio> ルート(消音スイッチ対策)が つかわれていない');
  } else {
    await page.evaluate(() => window.__setHidden(true));
    await page.waitForTimeout(700);
    const log = await page.evaluate(() => window.__mediaLog.slice());
    if (log[log.length - 1] !== 'pause') {
      problems.push(`かくれても <audio> が 止まっていない(log=${log.slice(-3).join(',')})`);
    } else {
      console.log('iPhone ルート: かくれると <audio> を pause ✓');
      await page.evaluate(() => window.__setHidden(false));
      await page.mouse.click(240, 400);
      await page.waitForTimeout(900);
      const log2 = await page.evaluate(() => window.__mediaLog.slice());
      if (log2[log2.length - 1] !== 'play') {
        problems.push(`もどっても <audio> が 鳴りださない(log=${log2.slice(-3).join(',')})`);
      } else console.log('iPhone ルート: もどると <audio> を play ✓');
    }
  }
  await context.close();
}

await browser.close();
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('AUDIO BG OK');

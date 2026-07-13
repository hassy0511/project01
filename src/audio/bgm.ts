/* BGM: WebAudio 合成のやさしいループ曲(アセット不要)。
   のんびりした「ぼうけんの あさ」風 8小節ループ。
   ミュート(sfx.ts)と連動: ミュート中は鳴らさず、解除で再開する。
   iOS 対策: 初回 pointerdown(main.ts)から startBgm を呼ぶ */
import { isMuted, onMuteChange, sharedAudioContext } from './sfx';

const TEMPO = 104;
/** 1ステップ=8分音符 */
const STEP_SEC = 60 / TEMPO / 2;
const STEPS_PER_BAR = 8;
/** 先読みスケジューリング窓(秒)とチェック間隔(ms) */
const LOOKAHEAD_SEC = 0.35;
const TICK_MS = 120;

const MASTER_VOL = 0.5;
const MELODY_VOL = 0.05;
const BASS_VOL = 0.055;
const PLUCK_VOL = 0.022;

/** MIDIノート番号→周波数。0 は休符 */
const freq = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

/* 8小節(C / Am / F / G ×2まわり)。データを差し替えれば曲が変わる */
// prettier-ignore
const MELODY: number[] = [
  64, 67, 72, 0, 67, 0, 69, 0,
  69, 67, 64, 0, 60, 62, 64, 0,
  65, 69, 72, 0, 69, 72, 74, 0,
  76, 74, 71, 67, 62, 0, 67, 0,
  72, 0, 76, 0, 67, 69, 72, 0,
  69, 72, 76, 0, 74, 72, 69, 0,
  65, 0, 69, 72, 74, 72, 69, 65,
  67, 69, 71, 0, 74, 0, 72, 0,
];
/** 小節ごとのコードのルート(C3/A2/F2/G2) */
const BASS_ROOTS: number[] = [48, 45, 41, 43, 48, 45, 41, 43];
const TOTAL_STEPS = MELODY.length;

let running = false;
let master: GainNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let step = 0;
let nextTime = 0;

function voice(
  ctx: AudioContext,
  midi: number,
  t0: number,
  dur: number,
  type: OscillatorType,
  vol: number,
): void {
  if (!master) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq(midi), t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  } catch {
    /* noop */
  }
}

function scheduleStep(ctx: AudioContext, s: number, t0: number): void {
  const inBar = s % STEPS_PER_BAR;
  const bar = Math.floor(s / STEPS_PER_BAR);
  const note = MELODY[s];
  if (note) voice(ctx, note, t0, STEP_SEC * 1.7, 'triangle', MELODY_VOL);
  const root = BASS_ROOTS[bar];
  if (inBar === 0 || inBar === 4) voice(ctx, root, t0, STEP_SEC * 3.4, 'sine', BASS_VOL);
  if (inBar === 6) voice(ctx, root + 7, t0, STEP_SEC * 1.6, 'sine', BASS_VOL * 0.8);
  // うら拍にコードのかけら(3度+5度)を薄く
  if (inBar === 2 || inBar === 6) {
    voice(ctx, root + 16, t0, STEP_SEC * 1.4, 'triangle', PLUCK_VOL);
    voice(ctx, root + 19, t0, STEP_SEC * 1.4, 'triangle', PLUCK_VOL);
  }
}

function tick(): void {
  const ctx = sharedAudioContext();
  if (!ctx || !running) return;
  if (ctx.state !== 'running') {
    // まだ resume していない間は現在時刻に追従だけしておく
    nextTime = ctx.currentTime + 0.1;
    return;
  }
  if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
  while (nextTime < ctx.currentTime + LOOKAHEAD_SEC) {
    scheduleStep(ctx, step % TOTAL_STEPS, nextTime);
    step++;
    nextTime += STEP_SEC;
  }
}

export function startBgm(): void {
  if (running || isMuted()) return;
  const ctx = sharedAudioContext();
  if (!ctx) return;
  try {
    master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(MASTER_VOL, ctx.currentTime + 1.2);
    master.connect(ctx.destination);
  } catch {
    return;
  }
  running = true;
  step = 0;
  nextTime = ctx.currentTime + 0.1;
  timer = setInterval(tick, TICK_MS);
}

export function stopBgm(): void {
  if (!running) return;
  running = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  const ctx = sharedAudioContext();
  const m = master;
  master = null;
  if (ctx && m) {
    try {
      m.gain.cancelScheduledValues(ctx.currentTime);
      m.gain.setValueAtTime(Math.max(m.gain.value, 0.0001), ctx.currentTime);
      m.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      setTimeout(() => {
        try {
          m.disconnect();
        } catch {
          /* noop */
        }
      }, 450);
    } catch {
      /* noop */
    }
  }
}

// 🔊トグルに連動: ミュートで止め、解除で流す
onMuteChange((m) => {
  if (m) stopBgm();
  else startBgm();
});

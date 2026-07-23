/* BGM: WebAudio 合成のやさしいループ曲(アセット不要)。
   トラックはデータ駆動で3曲: day(ぼうけんの あさ)/ fest(おまつりばやし)/ night(よるの はなびまち)。
   シーンから setBgmTrack() で切り替える(FestivalScene: fest、はなびは night)。
   ミュート(sfx.ts)と連動: ミュート中は鳴らさず、解除で再開する。
   iOS 対策: 初回 pointerdown(main.ts)から startBgm を呼ぶ */
import { isMuted, onMuteChange, sharedAudioContext } from './sfx';

export type BgmTrackName = 'day' | 'fest' | 'night';

/** 1ステップ=8分音符 */
const STEPS_PER_BAR = 8;
/** 先読みスケジューリング窓(秒)とチェック間隔(ms) */
const LOOKAHEAD_SEC = 0.35;
const TICK_MS = 120;
const MASTER_VOL = 1.0;

/** MIDIノート番号→周波数。0 は休符 */
const freq = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

interface BgmTrack {
  tempo: number;
  /** 8小節×8ステップのメロディ(MIDIノート。0=休符) */
  melody: number[];
  /** 小節ごとのコードのルート(MIDIノート) */
  bassRoots: number[];
  melodyType: OscillatorType;
  melodyVol: number;
  bassVol: number;
  /** うら拍のコードのかけらの音量(0で無し) */
  pluckVol: number;
  /** おまつり打楽器(どん/かっ)を鳴らすか */
  percussion: boolean;
}

/* 曲データ。差し替え・追加でバリエーションが増やせる */
// prettier-ignore
const TRACKS: Record<BgmTrackName, BgmTrack> = {
  /* のんびりした「ぼうけんの あさ」風(C / Am / F / G まわり) */
  day: {
    tempo: 104,
    melody: [
      64, 67, 72, 0, 67, 0, 69, 0,
      69, 67, 64, 0, 60, 62, 64, 0,
      65, 69, 72, 0, 69, 72, 74, 0,
      76, 74, 71, 67, 62, 0, 67, 0,
      72, 0, 76, 0, 67, 69, 72, 0,
      69, 72, 76, 0, 74, 72, 69, 0,
      65, 0, 69, 72, 74, 72, 69, 65,
      67, 69, 71, 0, 74, 0, 72, 0,
    ],
    bassRoots: [48, 45, 41, 43, 48, 45, 41, 43],
    melodyType: 'triangle',
    melodyVol: 0.085,
    bassVol: 0.09,
    pluckVol: 0.035,
    percussion: false,
  },
  /* はやしの「おまつりばやし」風: ヨナぬき音階+どん・かっ の打楽器 */
  fest: {
    tempo: 128,
    melody: [
      76, 76, 79, 0, 76, 79, 81, 0,
      79, 76, 74, 76, 72, 0, 0, 0,
      76, 76, 79, 0, 81, 79, 84, 0,
      81, 79, 76, 74, 72, 74, 76, 0,
      72, 74, 76, 79, 76, 74, 72, 0,
      69, 72, 74, 76, 74, 72, 69, 0,
      76, 0, 79, 0, 81, 0, 84, 81,
      79, 76, 74, 72, 74, 0, 72, 0,
    ],
    bassRoots: [48, 48, 41, 43, 48, 45, 43, 48],
    melodyType: 'square',
    melodyVol: 0.045,
    bassVol: 0.08,
    pluckVol: 0,
    percussion: true,
  },
  /* しずかな「よるの はなびまち」風: ゆっくり・まばら・低め(Am / F / C / G) */
  night: {
    tempo: 80,
    melody: [
      69, 0, 0, 72, 0, 0, 74, 0,
      72, 0, 69, 0, 0, 0, 64, 0,
      64, 0, 67, 0, 69, 0, 72, 0,
      74, 0, 72, 0, 69, 0, 67, 0,
      69, 0, 0, 76, 0, 0, 74, 0,
      72, 0, 74, 0, 72, 0, 69, 0,
      64, 0, 67, 69, 0, 0, 72, 0,
      69, 0, 0, 0, 67, 0, 64, 0,
    ],
    bassRoots: [45, 41, 48, 43, 45, 41, 48, 43],
    melodyType: 'sine',
    melodyVol: 0.075,
    bassVol: 0.08,
    pluckVol: 0.022,
    percussion: false,
  },
};

let current: BgmTrackName = 'day';
let running = false;
let master: GainNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let step = 0;
let nextTime = 0;
let noiseBuf: AudioBuffer | null = null;

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

/** おまつりの打楽器: どん(たいこ)/ かっ(しめだいこ)。ノイズ+フィルタで合成 */
function drum(ctx: AudioContext, t0: number, kind: 'don' | 'kachi'): void {
  if (!master) return;
  try {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    if (kind === 'don') {
      f.type = 'lowpass';
      f.frequency.setValueAtTime(160, t0);
      g.gain.setValueAtTime(0.22, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
    } else {
      f.type = 'highpass';
      f.frequency.setValueAtTime(3200, t0);
      g.gain.setValueAtTime(0.05, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
    }
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + 0.25);
  } catch {
    /* noop */
  }
}

function stepSec(): number {
  return 60 / TRACKS[current].tempo / 2;
}

function scheduleStep(ctx: AudioContext, s: number, t0: number): void {
  const tr = TRACKS[current];
  const inBar = s % STEPS_PER_BAR;
  const bar = Math.floor(s / STEPS_PER_BAR);
  const note = tr.melody[s];
  const sec = stepSec();
  if (note) voice(ctx, note, t0, sec * 1.7, tr.melodyType, tr.melodyVol);
  const root = tr.bassRoots[bar];
  if (inBar === 0 || inBar === 4) voice(ctx, root, t0, sec * 3.4, 'sine', tr.bassVol);
  if (inBar === 6) voice(ctx, root + 7, t0, sec * 1.6, 'sine', tr.bassVol * 0.8);
  // うら拍にコードのかけら(3度+5度)を薄く
  if (tr.pluckVol > 0 && (inBar === 2 || inBar === 6)) {
    voice(ctx, root + 16, t0, sec * 1.4, 'triangle', tr.pluckVol);
    voice(ctx, root + 19, t0, sec * 1.4, 'triangle', tr.pluckVol);
  }
  if (tr.percussion) {
    if (inBar === 0 || inBar === 4) drum(ctx, t0, 'don');
    if (inBar === 2 || inBar === 6 || inBar === 7) drum(ctx, t0, 'kachi');
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
  const total = TRACKS[current].melody.length;
  while (nextTime < ctx.currentTime + LOOKAHEAD_SEC) {
    scheduleStep(ctx, step % total, nextTime);
    step++;
    nextTime += stepSec();
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

/** シーンからの曲替え。曲の頭から流し直す(未再生・ミュート中は選択だけ覚えておく) */
export function setBgmTrack(name: BgmTrackName): void {
  if (current === name) return;
  current = name;
  step = 0;
  if (running) {
    const ctx = sharedAudioContext();
    // 少し間(ま)をあけて次の曲へ(ぶつ切り感の緩和)
    if (ctx) nextTime = Math.max(nextTime, ctx.currentTime + 0.45);
  }
}

// 🔊トグルに連動: ミュートで止め、解除で流す
onMuteChange((m) => {
  if (m) stopBgm();
  else startBgm();
});

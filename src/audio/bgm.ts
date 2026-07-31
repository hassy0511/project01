/* BGM: WebAudio 合成のやさしいループ曲(アセット不要)。
   トラックはデータ駆動で3曲: day(ぼうけんの あさ)/ fest(おまつりばやし)/ night(よるの はなびまち)。
   シーンから setBgmTrack() で切り替える(FestivalScene: fest、はなびは night)。
   ミュート(sfx.ts)と連動: ミュート中は鳴らさず、解除で再開する。
   iOS 対策: 初回 pointerdown(main.ts)から startBgm を呼ぶ */
import {
  audioOut,
  isAudioHidden,
  isMuted,
  onAudioHidden,
  onAudioResume,
  onMuteChange,
  onSfxDuck,
  sharedAudioContext,
} from './sfx';

export type BgmTrackName = 'day' | 'fest' | 'night';

/** 1ステップ=8分音符 */
const STEPS_PER_BAR = 8;
/** 先読みスケジューリング窓(秒)とチェック間隔(ms) */
/* モバイルは 画面を 見ていない あいだ setInterval が 1びょうに 間引かれる。
   先読みが みじかいと そこで 音が 途切れるので ゆとりを もたせる */
const LOOKAHEAD_SEC = 1.4;
const TICK_MS = 250;
/** BGM ぜんたいの 音量。
    いちど「鳴ってない」と 言われて 1.0 まで 上げた あと、こんどは 効果音より
    前に 出すぎて 「BGM が すごい」と 言われた。効果音の 底上げ(SFX_GAIN)と
    ダッキング(下の DUCK_*)が 入った ので、ここは 一歩 さげて 下じきに する */
const MASTER_VOL = 0.34;
/** BGM の こもらせ ぐあい(Hz)。ここより 上を けずると 音が 一枚 うしろに さがり、
    効果音の きらっとした 高い ところと ぶつからなく なる */
const MASTER_TONE_HZ = 2600;
/** 効果音が 鳴った ときに BGM を さげる 深さ(1で 無音)と、さがる/もどる 時間(秒) */
const DUCK_DEPTH = 0.42;
const DUCK_IN_SEC = 0.05;
const DUCK_OUT_SEC = 0.3;

/** MIDIノート番号→周波数。0 は休符 */
const freq = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

interface BgmTrack {
  tempo: number;
  /** 8小節×8ステップの メロディ A(MIDIノート。0=休符) */
  melody: number[];
  /** 8小節×8ステップの メロディ B。A の あとに つづけて 鳴らし、
      1まわりを 16小節に する(同じ ふしが すぐ もどって こない ように) */
  melodyB: number[];
  /** 小節ごとのコードのルート(MIDIノート) */
  bassRoots: number[];
  melodyType: OscillatorType;
  melodyVol: number;
  bassVol: number;
  /** うら拍のコードのかけらの音量(0で無し) */
  pluckVol: number;
  /** おまつり打楽器(どん/かっ)を鳴らすか */
  percussion: boolean;
  /** 小節ぜんたいに うすく のばす パッド(0で無し)。音の すきまを うめて「鳴っている」感を 出す */
  padVol: number;
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
    /* B: おなじ コード(C Am F G)で、音を へらして ひくめに。
       A の あとに くると 「べつの ところ」に 聞こえる */
    melodyB: [
      60, 0, 64, 0, 67, 0, 0, 0,
      69, 0, 67, 0, 64, 0, 0, 0,
      65, 0, 0, 69, 0, 72, 0, 0,
      71, 0, 74, 0, 71, 0, 67, 0,
      72, 0, 0, 71, 72, 0, 76, 0,
      0, 76, 0, 74, 72, 0, 69, 0,
      65, 67, 69, 0, 72, 0, 0, 0,
      74, 0, 71, 0, 67, 0, 62, 0,
    ],
    bassRoots: [48, 45, 41, 43, 48, 45, 41, 43],
    melodyType: 'triangle',
    melodyVol: 0.3,
    bassVol: 0.26,
    pluckVol: 0.12,
    percussion: false,
    padVol: 0.05,
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
    /* B: おなじ ヨナぬき(ド レ ミ ソ ラ)で かけあがり中心。さいごの 小節は 休んで「間」を つくる */
    melodyB: [
      72, 0, 76, 0, 79, 76, 72, 0,
      74, 76, 79, 81, 79, 0, 76, 0,
      81, 79, 76, 74, 72, 0, 69, 0,
      74, 76, 79, 0, 76, 74, 72, 0,
      76, 79, 84, 0, 81, 79, 76, 0,
      81, 0, 79, 76, 74, 0, 72, 0,
      74, 76, 79, 76, 74, 72, 0, 0,
      72, 0, 0, 0, 0, 0, 0, 0,
    ],
    bassRoots: [48, 48, 41, 43, 48, 45, 43, 48],
    melodyType: 'square',
    melodyVol: 0.17,
    bassVol: 0.24,
    pluckVol: 0,
    percussion: true,
    padVol: 0.04,
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
    /* B: さらに まばらに。よるの しずけさを こわさない */
    melodyB: [
      0, 0, 69, 0, 0, 0, 72, 0,
      0, 0, 65, 0, 69, 0, 0, 0,
      0, 0, 72, 0, 0, 76, 0, 0,
      74, 0, 0, 0, 71, 0, 67, 0,
      69, 0, 0, 0, 76, 0, 0, 0,
      0, 0, 72, 0, 0, 69, 0, 0,
      64, 0, 67, 0, 72, 0, 0, 0,
      0, 0, 71, 0, 67, 0, 0, 0,
    ],
    bassRoots: [45, 41, 48, 43, 45, 41, 48, 43],
    melodyType: 'sine',
    melodyVol: 0.28,
    bassVol: 0.24,
    pluckVol: 0.1,
    percussion: false,
    padVol: 0.06,
  },
};

/* 1まわり(16小節)を そのまま くりかえすと、やはり 「ずっと 同じ」に 聞こえる。
   まわる たびに 「どの 小節で メロディを 鳴らすか」を 変えて、
   ふしが 出たり ひっこんだり する ように する。
   数字は 小節(bar % 8)ごとの スイッチ。0 の 小節は ベースと パッドだけに なり、
   そこが 曲の 「息つぎ」に なる。4まわりで 1セット = だいたい 2〜3分 くりかえさない */
const MELODY_VARIANTS: readonly (readonly boolean[])[] = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 0, 0, 1, 1, 1, 1],
  [1, 1, 1, 1, 0, 0, 1, 1],
  [1, 0, 0, 0, 1, 1, 0, 0],
].map((a) => a.map(Boolean));

/** A+B を つないだ 1まわりぶん。作りなおさない ように 覚えておく */
const melodyCache = new Map<BgmTrackName, number[]>();
function melodyOf(name: BgmTrackName): number[] {
  let m = melodyCache.get(name);
  if (!m) {
    const t = TRACKS[name];
    m = [...t.melody, ...t.melodyB];
    melodyCache.set(name, m);
  }
  return m;
}

/** テスト用: 曲データの かたちだけを 外から しらべる(音は 鳴らさない)。
    メロディの 長さが ずれると 1まわりが 半端に なり、へんそうの 区切りも ずれる */
export const BGM_TRACKS: Readonly<Record<BgmTrackName, BgmTrack>> = TRACKS;
export const BGM_VARIANTS = MELODY_VARIANTS;
export { STEPS_PER_BAR };

let current: BgmTrackName = 'day';
let running = false;
let master: GainNode | null = null;
/** master の あとに はさむ ローパス(BGM を うしろに さげる) */
let tone: BiquadFilterNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let step = 0;
let nextTime = 0;
let noiseBuf: AudioBuffer | null = null;
/** 画面から きえた ので スケジューラだけ 止めている(曲と 位置は のこす) */
let hidePaused = false;

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

/** パッド: 小節ぜんたいを ゆったり のばす ハーモニー。
    voice() は すぐ 減衰するので、パッドは「ゆっくり 立ち上げ → たもつ → はなす」で 音の すきまを うめる */
function pad(ctx: AudioContext, midi: number, t0: number, dur: number, vol: number): void {
  if (!master) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq(midi), t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.25);
    g.gain.setValueAtTime(vol, t0 + dur * 0.75);
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
      g.gain.setValueAtTime(0.5, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
    } else {
      f.type = 'highpass';
      f.frequency.setValueAtTime(3200, t0);
      g.gain.setValueAtTime(0.14, t0);
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

/** s = 1まわりの なかの ステップ / pass = 何まわり目か(へんそうに つかう) */
function scheduleStep(ctx: AudioContext, s: number, t0: number, pass: number): void {
  const tr = TRACKS[current];
  const inBar = s % STEPS_PER_BAR;
  const bar = Math.floor(s / STEPS_PER_BAR);
  const note = melodyOf(current)[s];
  const sec = stepSec();
  const variant = MELODY_VARIANTS[pass % MELODY_VARIANTS.length];
  if (note && variant[bar % variant.length]) voice(ctx, note, t0, sec * 1.7, tr.melodyType, tr.melodyVol);
  const root = tr.bassRoots[bar % tr.bassRoots.length];
  if (inBar === 0 || inBar === 4) voice(ctx, root, t0, sec * 3.4, 'sine', tr.bassVol);
  if (inBar === 6) voice(ctx, root + 7, t0, sec * 1.6, 'sine', tr.bassVol * 0.8);
  // パッド: 小節まるごと のばして、音の すきまを うめる
  if (inBar === 0 && tr.padVol > 0) {
    const barSec = sec * STEPS_PER_BAR * 1.02; // つぎの小節と すこし かさねて 切れ目を なくす
    pad(ctx, root + 12, t0, barSec, tr.padVol);
    pad(ctx, root + 16, t0, barSec, tr.padVol * 0.9);
    pad(ctx, root + 19, t0, barSec, tr.padVol * 0.8);
  }
  // うら拍にコードのかけら(3度+5度)を薄く。まわりごとに 位置を ずらす
  const pluckAt = pass % 2 === 0 ? [2, 6] : [3, 5];
  if (tr.pluckVol > 0 && pluckAt.includes(inBar)) {
    voice(ctx, root + 16, t0, sec * 1.4, 'triangle', tr.pluckVol);
    voice(ctx, root + 19, t0, sec * 1.4, 'triangle', tr.pluckVol);
  }
  if (tr.percussion) {
    // どん(拍の しん)は いつも。かっ(あいの手)は まわりごとに かえる
    if (inBar === 0 || inBar === 4) drum(ctx, t0, 'don');
    const kachiAt = pass % 2 === 0 ? [2, 6, 7] : [1, 3, 6];
    if (kachiAt.includes(inBar)) drum(ctx, t0, 'kachi');
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
  const total = melodyOf(current).length;
  while (nextTime < ctx.currentTime + LOOKAHEAD_SEC) {
    scheduleStep(ctx, step % total, nextTime, Math.floor(step / total));
    step++;
    nextTime += stepSec();
  }
}

/** BGM の 出口を 組む: master(音量)→ tone(高いところを けずる)→ 出口。
    tone を はさむ ことで BGM が 一枚 うしろに さがり、効果音と ぶつからない */
function buildChain(ctx: AudioContext, fadeInSec: number): boolean {
  const out = audioOut();
  if (!out) return false;
  try {
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(MASTER_TONE_HZ, ctx.currentTime);
    g.gain.setValueAtTime(fadeInSec > 0 ? 0.0001 : MASTER_VOL, ctx.currentTime);
    if (fadeInSec > 0) g.gain.exponentialRampToValueAtTime(MASTER_VOL, ctx.currentTime + fadeInSec);
    g.connect(f);
    f.connect(out);
    master = g;
    tone = f;
    return true;
  } catch {
    return false;
  }
}

export function startBgm(): void {
  if (running || isMuted() || isAudioHidden()) return;
  const ctx = sharedAudioContext();
  if (!ctx) return;
  if (!buildChain(ctx, 1.2)) return;
  running = true;
  hidePaused = false;
  step = 0;
  nextTime = ctx.currentTime + 0.1;
  timer = setInterval(tick, TICK_MS);
}

export function stopBgm(): void {
  if (!running) return;
  running = false;
  hidePaused = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  const ctx = sharedAudioContext();
  const m = master;
  const f = tone;
  master = null;
  tone = null;
  if (ctx && m) {
    try {
      m.gain.cancelScheduledValues(ctx.currentTime);
      m.gain.setValueAtTime(Math.max(m.gain.value, 0.0001), ctx.currentTime);
      m.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      setTimeout(() => {
        try {
          m.disconnect();
          f?.disconnect();
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

/* 中断(他アプリ・画面ロック)から もどったら、出口を つなぎなおして 曲を 続ける。
   master は 古い AudioContext の ノードなので すてて 作りなおす */
onAudioResume(() => {
  if (!running || isMuted()) return;
  const ctx = sharedAudioContext();
  if (!ctx) return;
  if (buildChain(ctx, 0)) nextTime = ctx.currentTime + 0.1;
});

/* ダッキング: 効果音が 鳴った ら BGM を さっと 下げて、ゆっくり もどす。
   これで BGM の 音量を むやみに 下げなくても 効果音が 前に 出る */
onSfxDuck((amount) => {
  if (!running || !master) return;
  const ctx = sharedAudioContext();
  if (!ctx) return;
  const low = Math.max(MASTER_VOL * (1 - DUCK_DEPTH * amount), 0.0001);
  try {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
    master.gain.exponentialRampToValueAtTime(low, t + DUCK_IN_SEC);
    master.gain.exponentialRampToValueAtTime(MASTER_VOL, t + DUCK_IN_SEC + DUCK_OUT_SEC);
  } catch {
    /* noop */
  }
});

/* ほかのアプリ・ホーム画面・画面ロックで 画面から きえたら、先読みの 予約を 止める。
   曲(current)と 位置(step)は のこして おき、もどってきたら つづきから 鳴らす。
   音の 出口じたい(<audio>/AudioContext)は sfx.ts が 止める */
onAudioHidden((h) => {
  if (h) {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
    hidePaused = true;
    return;
  }
  if (!hidePaused) return;
  hidePaused = false;
  if (!running || isMuted()) return;
  const ctx = sharedAudioContext();
  if (!ctx) return;
  nextTime = ctx.currentTime + 0.1;
  timer = setInterval(tick, TICK_MS);
});

// おとの トグルに連動: ミュートで止め、解除で流す
onMuteChange((m) => {
  if (m) stopBgm();
  else startBgm();
});

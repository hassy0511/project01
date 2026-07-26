/* WebAudio合成SFX(アセット不要・ミュート可)。reference/app.js の移植。
   iOS Safari 対策 その1: 初回タップで resume する(main.ts で pointerdown に紐付け)
   iOS Safari 対策 その2: iPad/iPhone は「サイレントスイッチ(消音モード)」で
     WebAudio の 音が まるごと 消える。それだと 親が 気づけないので、
     iOS では 出力を MediaStream 経由で <audio> に つなぐ(= メディア再生あつかいに なり、
     消音スイッチでは 消えず、本体の 音量つまみで 調整できる)。
     ほかの ブラウザは そのまま ctx.destination に つなぐ(挙動を 変えない)。
   すべての 音(SFX/BGM)は audioOut() が かえす 1つの ノードに つなぐ */

const MUTE_KEY = 'meisanquest-mute';

let audioCtx: AudioContext | null = null;
let muted = false;
try {
  muted = localStorage.getItem(MUTE_KEY) === '1';
} catch {
  /* noop */
}

export function isMuted(): boolean {
  return muted;
}

/** ミュート切替を購読する(BGM の停止/再開などに使う) */
type MuteListener = (muted: boolean) => void;
const muteListeners: MuteListener[] = [];
export function onMuteChange(cb: MuteListener): void {
  muteListeners.push(cb);
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    /* noop */
  }
  for (const cb of muteListeners) cb(value);
}

export function resumeAudio(): void {
  const ctx = sharedAudioContext();
  if (ctx) audioOut();
  // <audio> ルートの さいせいも タップの たびに 試す(iOS は 一度 止まると 再開が 必要)
  mediaEl?.play().catch(() => undefined);
}

/** iOS(iPad/iPhone)かどうか。iPadOS は Mac を 名乗るので タッチ数でも みる */
function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1);
}

let outNode: AudioNode | null = null;
let mediaEl: HTMLAudioElement | null = null;

/** 音の 出口。SFX/BGM は かならず ここに つなぐ(消音スイッチ対策込み) */
export function audioOut(): AudioNode | null {
  const ctx = sharedAudioContext();
  if (!ctx) return null;
  if (outNode) return outNode;
  // つぶれ防止の リミッター(音量を 上げても わりない ように)
  let head: AudioNode = ctx.destination;
  try {
    if (isIos() && typeof ctx.createMediaStreamDestination === 'function' && typeof Audio !== 'undefined') {
      const msd = ctx.createMediaStreamDestination();
      const el = new Audio();
      el.srcObject = msd.stream;
      el.setAttribute('playsinline', 'true');
      el.volume = 1;
      el.play().catch(() => undefined);
      mediaEl = el;
      head = msd;
    }
  } catch {
    head = ctx.destination;
  }
  try {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-14, ctx.currentTime);
    comp.knee.setValueAtTime(12, ctx.currentTime);
    comp.ratio.setValueAtTime(6, ctx.currentTime);
    comp.attack.setValueAtTime(0.004, ctx.currentTime);
    comp.release.setValueAtTime(0.2, ctx.currentTime);
    comp.connect(head);
    outNode = comp;
  } catch {
    outNode = head;
  }
  return outNode;
}

/** AudioContext のコンストラクタ(ふるい iPadOS Safari は webkit 接頭辞つき) */
function audioCtor(): typeof AudioContext | null {
  if (typeof AudioContext !== 'undefined') return AudioContext;
  const w = window as unknown as { webkitAudioContext?: typeof AudioContext };
  return w.webkitAudioContext ?? null;
}

/** SFX/BGM で共有する AudioContext(ミュート中でも取得・resume は行う)。
    iOS Safari には W3C にない第3の状態 'interrupted' がある(他アプリへの切りかえ・画面ロック・
    着信・Siri など)。ここを ほうっておくと 一度 中断された あと ずっと 無音に なるので、
    'suspended' と おなじように resume する。resume できない ときは 作りなおす */
export function sharedAudioContext(): AudioContext | null {
  const Ctor = audioCtor();
  if (!Ctor) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  const state = audioCtx.state as string;
  if (state === 'suspended' || state === 'interrupted') {
    audioCtx
      .resume()
      .then(() => {
        // 中断から もどったら BGM の さいせいも つなぎなおす
        for (const cb of resumeListeners) cb();
      })
      .catch(() => {
        // どうしても もどらない: 作りなおして つぎの タップで 鳴るように する
        recreateContext();
      });
  }
  return audioCtx;
}

/** 中断から 復帰した ときに 呼ばれる(bgm.ts が スケジューラの つなぎなおしに つかう) */
type ResumeListener = () => void;
const resumeListeners: ResumeListener[] = [];
export function onAudioResume(cb: ResumeListener): void {
  resumeListeners.push(cb);
}

function recreateContext(): void {
  const old = audioCtx;
  audioCtx = null;
  outNode = null;
  mediaEl = null;
  try {
    old?.close();
  } catch {
    /* noop */
  }
  for (const cb of resumeListeners) cb();
}

function ac(): AudioContext | null {
  if (muted) return null;
  return sharedAudioContext();
}

/** SFX の 音量そうごう(小さすぎて 聞こえない と 言われたので 上げた) */
const SFX_GAIN = 2.2;

function tone(freq: number, dur: number, type: OscillatorType, vol: number, when = 0, slide?: number): void {
  const ctx = ac();
  if (!ctx) return;
  const out = audioOut();
  if (!out) return;
  try {
    const t0 = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.min(1, vol * SFX_GAIN), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(out);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  } catch {
    /* noop */
  }
}

export const SFX = {
  pop(): void {
    tone(500 + Math.random() * 400, 0.09, 'triangle', 0.16, 0, 180);
  },
  good(): void {
    tone(784, 0.09, 'sine', 0.13);
    tone(1175, 0.15, 'sine', 0.13, 0.08);
  },
  bad(): void {
    tone(210, 0.2, 'triangle', 0.1, 0, 150);
  },
  plant(): void {
    tone(320, 0.12, 'sine', 0.14, 0, 200);
    tone(520, 0.12, 'sine', 0.12, 0.11);
  },
  collect(): void {
    tone(1047, 0.07, 'square', 0.08);
    tone(1568, 0.12, 'square', 0.08, 0.06);
  },
  fanfare(): void {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.15, i * 0.09));
  },
  star(i: number): void {
    tone(880 + i * 240, 0.13, 'sine', 0.16);
  },
  fest(): void {
    [523, 659, 784, 880, 1047, 1319].forEach((f, i) => tone(f, 0.18, 'triangle', 0.14, i * 0.11));
  },
  hint(): void {
    tone(988, 0.09, 'sine', 0.1);
    tone(1319, 0.09, 'sine', 0.08, 0.09);
  },
};

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
  if (hidden) return; // 画面を 見ていない あいだは 鳴らさない
  const ctx = sharedAudioContext();
  if (ctx) audioOut();
  // <audio> ルートの さいせいも タップの たびに 試す(iOS は 一度 止まると 再開が 必要)
  mediaEl?.play().catch(() => undefined);
}

/* ほかのアプリ・ホーム画面・画面ロックで 画面から きえた あいだ、音を まるごと 止める。
   iOS では 出口が <audio>(= メディア再生あつかい)なので、なにも しないと
   アプリを 見ていない あいだも BGM が 鳴りつづける。
   ・出口の <audio> を pause し、AudioContext も suspend する
   ・かくれている あいだは 自動 resume を しない(下の sharedAudioContext を みる)
   ・もどったら つなぎなおして 曲の つづきから 鳴らす */
let hidden = false;

/** 画面から きえている あいだ true(SFX/BGM は 鳴らさない) */
export function isAudioHidden(): boolean {
  return hidden;
}

type HiddenListener = (hidden: boolean) => void;
const hiddenListeners: HiddenListener[] = [];
/** かくれ/もどりを 購読する(bgm.ts が スケジューラの 停止・再開に つかう) */
export function onAudioHidden(cb: HiddenListener): void {
  hiddenListeners.push(cb);
}

export function setAudioHidden(value: boolean): void {
  if (hidden === value) return;
  if (value) {
    hidden = true;
    // さきに 予約を 止める(順番が 逆だと 先読みぶんが 鳴ってしまう)
    for (const cb of hiddenListeners) cb(true);
    try {
      mediaEl?.pause();
    } catch {
      /* noop */
    }
    try {
      audioCtx?.suspend().catch(() => undefined);
    } catch {
      /* noop */
    }
  } else {
    hidden = false;
    resumeAudio();
    for (const cb of hiddenListeners) cb(false);
  }
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
  // かくれている あいだは 起こさない(OS が 止めた のを こちらが 復活させない)
  if (!hidden && (state === 'suspended' || state === 'interrupted')) {
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
  // 音の 部品も ふるい AudioContext の もの。のこすと つなげた しゅんかんに
  // 例外に なり、SFX が まるごと 鳴らなく なる(try で のみこまれて 気づけない)
  spaceIn = null;
  noiseBuf = null;
  try {
    mediaEl?.pause(); // すてる まえに 止める(ふるい <audio> が 鳴りっぱなしに ならない ように)
  } catch {
    /* noop */
  }
  mediaEl = null;
  try {
    old?.close();
  } catch {
    /* noop */
  }
  for (const cb of resumeListeners) cb();
}

function ac(): AudioContext | null {
  if (muted || hidden) return null;
  return sharedAudioContext();
}

/** SFX の 音量そうごう(小さすぎて 聞こえない と 言われたので 上げた) */
const SFX_GAIN = 2.2;

/* 効果音が 鳴る あいだ、BGM を すこし 下げる(ダッキング)。
   BGM を ただ 小さく するのでは なく、「音が 鳴った ときだけ 一歩さがる」に
   すると、BGM は ちゃんと 聞こえる まま 効果音が 前に 出る。
   bgm.ts が この ファイルを import して いる ので、逆向きの import を
   さけて 受け口だけ ここに おく(onMuteChange と 同じ かたち)。 */
type DuckListener = (amount: number) => void;
const duckListeners: DuckListener[] = [];
export function onSfxDuck(cb: DuckListener): void {
  duckListeners.push(cb);
}
/** 音の 大きさ(vol)を 0.3〜1 の さがりぐあいに 直して しらせる */
function fireDuck(vol: number): void {
  const amount = Math.max(0.3, Math.min(1, vol / 0.15));
  for (const cb of duckListeners) cb(amount);
}

/* =====================================================
   おとの 作り(層を かさねる)

   むかしは 1つの おとに 波を 1本だけ つかって いた。それだと
   どうしても 「ピコピコ」した 電子音に なる。ほんものの おとは
   いくつかの 成分が かさなって できて いる ので、ここでは 3つの 層に する:

     1. アタック … はじめの ごく短い ざつおん(「シャッ」「コッ」)。
        これが ある だけで 「もの が ぶつかった」感じに なる
     2. ボディ  … 音の 高さを 決める 波。ほんの すこし ずらした 2本を
        かさねて 厚みを 出し、ローパスで 角を とる
     3. ひろがり … ごく短い やまびこ(0.085びょう)。同じ 部屋に いる 感じ

   音声ファイルは つかわない(容量が ふえず、オフラインでも 鳴る)。
   ===================================================== */

/** ざつおんの たね。アタックに つかう。1回 作って つかいまわす */
let noiseBuf: AudioBuffer | null = null;
function noise(ctx: AudioContext): AudioBuffer {
  if (!noiseBuf || noiseBuf.sampleRate !== ctx.sampleRate) {
    noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

/** ひろがり(短い やまびこ)の 入口。ぜんぶの 音が すこしだけ ここへ 送る */
let spaceIn: GainNode | null = null;
function space(ctx: AudioContext, out: AudioNode): GainNode | null {
  if (spaceIn) return spaceIn;
  try {
    const input = ctx.createGain();
    const delay = ctx.createDelay(0.5);
    delay.delayTime.setValueAtTime(0.085, ctx.currentTime);
    const damp = ctx.createBiquadFilter(); // やまびこは 高い音から 消える
    damp.type = 'lowpass';
    damp.frequency.setValueAtTime(2600, ctx.currentTime);
    const fb = ctx.createGain();
    fb.gain.setValueAtTime(0.22, ctx.currentTime);
    input.connect(delay);
    delay.connect(damp);
    damp.connect(fb);
    fb.connect(delay); // 1〜2回 かえって 消える くらい
    damp.connect(out);
    spaceIn = input;
  } catch {
    return null;
  }
  return spaceIn;
}

interface NoteOpts {
  /** 波の かたち */
  type?: OscillatorType;
  /** おわりの 高さ(ここまで すべる) */
  slide?: number;
  /** 何びょう後に 鳴らすか */
  when?: number;
  /** ローパスの 切れる 高さ。ひくいほど やわらかい */
  cutoff?: number;
  /** 2本目を どれだけ ずらすか(セント)。厚みが 出る */
  detune?: number;
  /** ひろがりへ 送る わりあい(0〜1) */
  space?: number;
  /** はじめの ざつおん(アタック)の つよさ。0で なし */
  click?: number;
  /** アタックの 高さ(Hz)。かたい ものほど 高く */
  clickHz?: number;
}

/** 1つの おとを 鳴らす(3つの 層を つくる) */
function note(freq: number, dur: number, vol: number, opts: NoteOpts = {}): void {
  const ctx = ac();
  if (!ctx) return;
  const out = audioOut();
  if (!out) return;
  const { type = 'triangle', slide, when = 0, cutoff, detune = 6, space: spaceAmt = 0.12, click = 0, clickHz = 2400 } = opts;
  fireDuck(vol);
  try {
    const t0 = ctx.currentTime + when;
    const peak = Math.min(1, vol * SFX_GAIN);
    const send = space(ctx, out);

    // ── 1. アタック(ざつおんの ごく短い ひとつぶ)
    if (click > 0) {
      const src = ctx.createBufferSource();
      src.buffer = noise(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(clickHz, t0);
      bp.Q.setValueAtTime(1.2, t0);
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(peak * click, t0);
      cg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.035);
      src.connect(bp);
      bp.connect(cg);
      cg.connect(out);
      src.start(t0);
      src.stop(t0 + 0.06);
    }

    // ── 2. ボディ(すこし ずらした 2本 + ローパス)
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    const co = cutoff ?? Math.max(900, freq * 4);
    lp.frequency.setValueAtTime(co * 1.6, t0); // はじめは あかるく
    lp.frequency.exponentialRampToValueAtTime(Math.max(200, co * 0.7), t0 + dur); // だんだん こもる
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.connect(lp);
    lp.connect(out);
    if (send && spaceAmt > 0) {
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(spaceAmt, t0);
      lp.connect(sg);
      sg.connect(send);
    }
    for (const cents of [0, detune]) {
      if (cents !== 0 && detune === 0) continue;
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
      o.detune.setValueAtTime(cents, t0);
      o.connect(g);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
      if (detune === 0) break;
    }
  } catch {
    /* noop */
  }
}

export const SFX = {
  /** とった・はじけた。いちばん よく 鳴る ので みじかく 軽く */
  pop(): void {
    const f = 520 + Math.random() * 380;
    note(f, 0.1, 0.15, { type: 'triangle', slide: 190, click: 0.5, clickHz: 3000, cutoff: 2600, space: 0.1 });
  },
  /** せいかい・うまくいった。2つの 音が 上がる */
  good(): void {
    note(784, 0.1, 0.12, { type: 'sine', cutoff: 2200, click: 0.25, clickHz: 3600, space: 0.16 });
    note(1175, 0.17, 0.12, { type: 'sine', when: 0.08, cutoff: 3000, space: 0.22 });
  },
  /** しっぱい。とがらせない。ひくい 「ぼふっ」 */
  bad(): void {
    note(210, 0.22, 0.1, { type: 'triangle', slide: 140, cutoff: 700, detune: 12, click: 0.35, clickHz: 700, space: 0.08 });
  },
  /** うえた・おいた。やわらかい 「ぽふ」 */
  plant(): void {
    note(320, 0.13, 0.13, { type: 'sine', slide: 210, cutoff: 900, click: 0.4, clickHz: 900, space: 0.1 });
    note(520, 0.13, 0.1, { type: 'sine', when: 0.1, cutoff: 1600, space: 0.14 });
  },
  /** ひろった。ちいさく きらっと */
  collect(): void {
    note(1047, 0.08, 0.07, { type: 'triangle', cutoff: 5000, detune: 0, click: 0.3, clickHz: 5200, space: 0.2 });
    note(1568, 0.14, 0.07, { type: 'sine', when: 0.06, cutoff: 6000, detune: 0, space: 0.26 });
  },
  /** できた!の ファンファーレ。4音 のぼる */
  fanfare(): void {
    [523, 659, 784, 1047].forEach((f, i) =>
      note(f, 0.18, 0.14, { type: 'triangle', when: i * 0.09, cutoff: 2600, click: i === 0 ? 0.3 : 0.15, clickHz: 3200, space: 0.24 }),
    );
  },
  /** ★が 1つ つく たび。ベルっぽく */
  star(i: number): void {
    const f = 880 + i * 240;
    note(f, 0.14, 0.15, { type: 'sine', cutoff: f * 5, detune: 0, click: 0.3, clickHz: f * 3, space: 0.3 });
    note(f * 2.01, 0.1, 0.05, { type: 'sine', detune: 0, cutoff: f * 8, space: 0.3 }); // ばいおん(かねの ひびき)
  },
  /** おまつりの はじまり。6音 かけあがる */
  fest(): void {
    [523, 659, 784, 880, 1047, 1319].forEach((f, i) =>
      note(f, 0.2, 0.13, { type: 'triangle', when: i * 0.11, cutoff: 2800, click: 0.2, clickHz: 3000, space: 0.26 }),
    );
  },
  /** ヒント・気づき。ひかえめに 2音 */
  hint(): void {
    note(988, 0.1, 0.09, { type: 'sine', cutoff: 3000, detune: 0, space: 0.2 });
    note(1319, 0.11, 0.07, { type: 'sine', when: 0.09, cutoff: 4000, detune: 0, space: 0.24 });
  },
};

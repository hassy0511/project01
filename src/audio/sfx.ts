/* WebAudio合成SFX(アセット不要・ミュート可)。reference/app.js の移植。
   iOS Safari 対策: 初回タップで resume する(main.ts で pointerdown に紐付け) */

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

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    /* noop */
  }
}

export function resumeAudio(): void {
  ac();
}

function ac(): AudioContext | null {
  if (muted) return null;
  if (typeof AudioContext === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => undefined);
  }
  return audioCtx;
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, when = 0, slide?: number): void {
  const ctx = ac();
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(ctx.destination);
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

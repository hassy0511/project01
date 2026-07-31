/* BGM の 曲データの かたち検査。
   音の 良し悪しは 人が 聞くしか ないが、「1まわりの 長さ」だけは
   ずれると すぐ 気づけない まま 曲が こわれる ので ここで 固定する。

   ・A と B を つないで 1まわり=16小節。ここが 8小節に もどると
     「ずっと 同じのが 鳴ってる」に 逆もどりする
   ・へんそう(MELODY_VARIANTS)は 小節ごとの スイッチ。数が 合わないと
     どこかの 小節が いつも 休みに なる */
import { describe, expect, it } from 'vitest';
import { BGM_TRACKS, BGM_VARIANTS, STEPS_PER_BAR } from './bgm';

/** 1つの ふし(A / B)の 小節数 */
const BARS_PER_PHRASE = 8;
const PHRASE_STEPS = BARS_PER_PHRASE * STEPS_PER_BAR;
/** 鳴らして よい MIDI の はんい(0=休符)。ここを 外れると 高すぎ/低すぎで 耳に つく */
const MIDI_MIN = 36;
const MIDI_MAX = 96;

describe('BGM の 曲データ', () => {
  const names = Object.keys(BGM_TRACKS) as (keyof typeof BGM_TRACKS)[];

  it('すべての 曲が A・B の 2つの ふしを もつ(1まわり=16小節)', () => {
    for (const n of names) {
      const t = BGM_TRACKS[n];
      expect(t.melody.length, `${n}: メロディ A`).toBe(PHRASE_STEPS);
      expect(t.melodyB.length, `${n}: メロディ B`).toBe(PHRASE_STEPS);
      expect(t.bassRoots.length, `${n}: ベース`).toBe(BARS_PER_PHRASE);
    }
  });

  it('A と B は ちがう ふし(同じなら 長くした 意味が ない)', () => {
    for (const n of names) {
      const t = BGM_TRACKS[n];
      expect(t.melody.join(','), `${n}`).not.toBe(t.melodyB.join(','));
    }
  });

  it('音の 高さが 鳴らして よい はんいに ある', () => {
    for (const n of names) {
      for (const m of [...BGM_TRACKS[n].melody, ...BGM_TRACKS[n].melodyB, ...BGM_TRACKS[n].bassRoots]) {
        if (m === 0) continue; // 休符
        expect(m, `${n}: midi ${m}`).toBeGreaterThanOrEqual(MIDI_MIN);
        expect(m, `${n}: midi ${m}`).toBeLessThanOrEqual(MIDI_MAX);
      }
    }
  });

  it('どの ふしも まるごと 休符では ない', () => {
    for (const n of names) {
      expect(BGM_TRACKS[n].melody.some((x) => x !== 0), `${n}: A`).toBe(true);
      expect(BGM_TRACKS[n].melodyB.some((x) => x !== 0), `${n}: B`).toBe(true);
    }
  });

  it('へんそうは 小節ぶんの スイッチで、ぜんぶ 休みの まわりは ない', () => {
    expect(BGM_VARIANTS.length).toBeGreaterThan(1);
    for (const v of BGM_VARIANTS) {
      expect(v.length).toBe(BARS_PER_PHRASE);
      expect(v.some(Boolean), 'メロディが まるごと 消える まわりが ある').toBe(true);
    }
    // 1つは「まるごと 鳴らす」まわりが ないと ふしが 通しで 聞けない
    expect(BGM_VARIANTS.some((v) => v.every(Boolean))).toBe(true);
  });
});

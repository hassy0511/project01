import { describe, expect, it } from 'vitest';
import {
  calcStars,
  CARE_BONUS,
  harvestYield,
  pluckPoints,
  sessionMaxBase,
  sessionPoints,
} from './stars';

describe('sessionMaxBase(セッション満点)', () => {
  it('pluck収穫: pluck(2) + quiz(1) = 3', () => {
    expect(sessionMaxBase([{ kind: 'pluck' }, { kind: 'quiz' }])).toBe(3);
  });

  it('dig収穫: dig×2 + quiz = 3', () => {
    expect(sessionMaxBase([{ kind: 'dig' }, { kind: 'dig' }, { kind: 'quiz' }])).toBe(3);
  });

  it('待ちなし(timing): timing×3 + quiz = 4', () => {
    expect(sessionMaxBase([{ kind: 'timing' }, { kind: 'timing' }, { kind: 'timing' }, { kind: 'quiz' }])).toBe(4);
  });
});

describe('calcStars(★変換)', () => {
  it('満点以上で★3', () => {
    expect(calcStars(3, 3)).toBe(3);
    expect(calcStars(4, 3)).toBe(3);
  });

  it('2pt以上で★2', () => {
    expect(calcStars(2, 3)).toBe(2);
  });

  it('0〜1ptでも★1(失敗・全損なし=成功保証)', () => {
    expect(calcStars(1, 3)).toBe(1);
    expect(calcStars(0, 3)).toBe(1);
  });

  it('おせわ保険: 満点-1でも careDone なら★3に届く', () => {
    const maxBase = 3;
    const score = 2;
    expect(calcStars(sessionPoints(score, false), maxBase)).toBe(2);
    expect(calcStars(sessionPoints(score, true), maxBase)).toBe(3);
    expect(CARE_BONUS).toBe(1);
  });
});

describe('harvestYield / pluckPoints', () => {
  it('★3は おまけつきで2個、★2/★1は1個', () => {
    expect(harvestYield(3)).toBe(2);
    expect(harvestYield(2)).toBe(1);
    expect(harvestYield(1)).toBe(1);
  });

  it('pluck: 9秒以内=2pt、超過=1pt', () => {
    expect(pluckPoints(9000)).toBe(2);
    expect(pluckPoints(9001)).toBe(1);
  });
});

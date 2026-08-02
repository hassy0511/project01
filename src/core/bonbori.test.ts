import { describe, expect, it } from 'vitest';
import { GAME_DATA as D } from '../data/gameData';
import { defaultState } from './state';
import {
  bonboriRank,
  BONBORI_COLOR,
  FEST_RANK_DEFAULT,
  goldCount,
  isAllGold,
  rankThresholds,
} from './bonbori';

const T = { silver: 100, gold: 200 };
/** テスト用: どの おまつりも 同じ めやす */
const flat = () => T;

describe('ぼんぼりの いろ', () => {
  it('まだ ひらいて いなければ none', () => {
    expect(bonboriRank(undefined, T)).toBe('none');
  });

  it('スコアで どう → ぎん → きん', () => {
    expect(bonboriRank(0, T)).toBe('copper'); // 0点でも ひらけば どう(成功保証)
    expect(bonboriRank(99, T)).toBe('copper');
    expect(bonboriRank(100, T)).toBe('silver'); // しきい値ちょうども ぎん
    expect(bonboriRank(199, T)).toBe('silver');
    expect(bonboriRank(200, T)).toBe('gold');
    expect(bonboriRank(9999, T)).toBe('gold');
  });

  it('めやすは 0 の とき 既定値に なる(47本を 手で うめなくて よい)', () => {
    expect(rankThresholds({ star2: 0, star3: 0 })).toEqual(FEST_RANK_DEFAULT);
    expect(rankThresholds(undefined)).toEqual(FEST_RANK_DEFAULT);
    expect(rankThresholds({ star2: 50, star3: 90 })).toEqual({ silver: 50, gold: 90 });
  });

  it('いろは どう・ぎん・きんの 3つ', () => {
    expect(Object.keys(BONBORI_COLOR).sort()).toEqual(['copper', 'gold', 'silver']);
  });
});

describe('きんの かぞえ方', () => {
  const actives = D.prefectures.filter((p) => p.active && p.festivalId);

  it('きんの 数を かぞえる', () => {
    const s = defaultState();
    expect(goldCount(s, D, flat)).toBe(0);
    s.festBest[actives[0].festivalId!] = 250; // きん
    s.festBest[actives[1].festivalId!] = 150; // ぎん(数えない)
    expect(goldCount(s, D, flat)).toBe(1);
  });

  it('47県 ぜんぶ きんで はじめて ぜんぶきん', () => {
    const s = defaultState();
    for (const p of actives) s.festBest[p.festivalId!] = 250;
    expect(isAllGold(s, D, flat)).toBe(true);
    // 1つ でも ぎんに 下がれば まだ
    s.festBest[actives[0].festivalId!] = 150;
    expect(isAllGold(s, D, flat)).toBe(false);
  });

  it('からの セーブでは ぜんぶきんに ならない', () => {
    expect(isAllGold(defaultState(), D, flat)).toBe(false);
  });
});

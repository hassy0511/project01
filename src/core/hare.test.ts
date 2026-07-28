import { describe, expect, it } from 'vitest';
import { GAME_DATA } from '../data/gameData';
import {
  activePrefCount,
  defaultState,
  harePrefCount,
  hareFlagKey,
  isAllHare,
  isRegionComp,
  regionCompFlagKey,
  regionOpenFlagKey,
} from './state';

/** その県の おまつりを 1回 ひらいた ことに する */
const fest = (s: ReturnType<typeof defaultState>, prefId: string): void => {
  const p = GAME_DATA.prefectures.find((x) => x.id === prefId);
  if (p?.festivalId && !s.fest.includes(p.festivalId)) s.fest.push(p.festivalId);
};

describe('晴れの ものさし(ストーリーの 進行条件)', () => {
  it('はじめは 0県。おまつりを ひらくと ふえる', () => {
    const s = defaultState();
    expect(harePrefCount(s, GAME_DATA)).toBe(0);
    fest(s, 'ibaraki');
    expect(harePrefCount(s, GAME_DATA)).toBe(1);
    // おなじ 県を なんど ひらいても 1県の まま
    fest(s, 'ibaraki');
    expect(harePrefCount(s, GAME_DATA)).toBe(1);
  });

  it('分母は アクティブ県の 数(いまは 47)', () => {
    expect(activePrefCount(GAME_DATA)).toBe(
      GAME_DATA.prefectures.filter((p) => p.active).length,
    );
    expect(activePrefCount(GAME_DATA)).toBeGreaterThanOrEqual(47);
  });

  it('ぜんぶの 県で おまつりを ひらくと エンディング条件が 立つ', () => {
    const s = defaultState();
    expect(isAllHare(s, GAME_DATA)).toBe(false);
    for (const p of GAME_DATA.prefectures.filter((x) => x.active)) fest(s, p.id);
    expect(isAllHare(s, GAME_DATA)).toBe(true);
  });

  it('1県 かけていたら エンディングに ならない', () => {
    const s = defaultState();
    const actives = GAME_DATA.prefectures.filter((x) => x.active);
    for (const p of actives.slice(1)) fest(s, p.id);
    expect(isAllHare(s, GAME_DATA)).toBe(false);
  });

  it('エリアコンプは そのエリアの 全県が 晴れた とき だけ', () => {
    const s = defaultState();
    const kanto = GAME_DATA.prefectures.filter((p) => p.region === 'kanto' && p.active);
    expect(isRegionComp(s, GAME_DATA, 'kanto')).toBe(false);
    for (const p of kanto.slice(0, -1)) fest(s, p.id);
    expect(isRegionComp(s, GAME_DATA, 'kanto')).toBe(false);
    fest(s, kanto[kanto.length - 1].id);
    expect(isRegionComp(s, GAME_DATA, 'kanto')).toBe(true);
    // ほかの エリアは まだ
    expect(isRegionComp(s, GAME_DATA, 'tohoku')).toBe(false);
  });

  it('しらない エリア名では コンプに ならない(0県 なら false)', () => {
    const s = defaultState();
    expect(isRegionComp(s, GAME_DATA, 'atlantis')).toBe(false);
  });

  it('フラグの キーは 県・エリアごとに ぶつからない', () => {
    expect(hareFlagKey('ibaraki')).not.toBe(hareFlagKey('tochigi'));
    expect(regionCompFlagKey('kanto')).not.toBe(regionOpenFlagKey('kanto'));
  });
});

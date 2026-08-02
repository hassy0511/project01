import { describe, expect, it } from 'vitest';
import { GAME_DATA as D } from '../data/gameData';
import { daysUntilSeason, inSeason, SEASON_EPOCH_MS, SEASON_LEN_MS, seasonAt, SEASONS } from './season';

const DAY = 24 * 60 * 60 * 1000;

describe('季節の 時計', () => {
  it('起点は はる、2週間ごとに はる→なつ→あき→ふゆ→はる', () => {
    expect(seasonAt(SEASON_EPOCH_MS)).toBe('haru');
    expect(seasonAt(SEASON_EPOCH_MS + SEASON_LEN_MS)).toBe('natsu');
    expect(seasonAt(SEASON_EPOCH_MS + 2 * SEASON_LEN_MS)).toBe('aki');
    expect(seasonAt(SEASON_EPOCH_MS + 3 * SEASON_LEN_MS)).toBe('fuyu');
    expect(seasonAt(SEASON_EPOCH_MS + 4 * SEASON_LEN_MS)).toBe('haru');
    // 季節の さかいめの 1ms 手前は まだ 前の 季節
    expect(seasonAt(SEASON_EPOCH_MS + SEASON_LEN_MS - 1)).toBe('haru');
  });

  it('起点より 前の 時刻でも こわれない(むかしの 端末時計)', () => {
    expect(SEASONS).toContain(seasonAt(SEASON_EPOCH_MS - 1));
    expect(seasonAt(SEASON_EPOCH_MS - SEASON_LEN_MS)).toBe('fuyu');
  });

  it('季節の ない そざいは いつでも とれる', () => {
    expect(inSeason({}, SEASON_EPOCH_MS)).toBe(true);
    expect(inSeason({ season: 'fuyu' }, SEASON_EPOCH_MS)).toBe(false);
    expect(inSeason({ season: 'fuyu' }, SEASON_EPOCH_MS + 3 * SEASON_LEN_MS)).toBe(true);
  });

  it('つぎの 季節までの 日数(いま その 季節なら 0)', () => {
    expect(daysUntilSeason(SEASON_EPOCH_MS, 'haru')).toBe(0);
    expect(daysUntilSeason(SEASON_EPOCH_MS, 'natsu')).toBe(14);
    expect(daysUntilSeason(SEASON_EPOCH_MS, 'fuyu')).toBe(42);
    // まちじかんは 最長 6週間(42日)。これを こえたら 設計ミス
    for (const s of SEASONS) {
      expect(daysUntilSeason(SEASON_EPOCH_MS + 3 * DAY, s)).toBeLessThanOrEqual(42);
    }
  });
});

describe('季節つき そざいの データ', () => {
  it('季節が つくのは しんの めいさん だけ(激レア限定の 約束)', () => {
    for (const m of D.materials) {
      if (m.season) expect(m.shin, `${m.id} ${m.name}: season には shin が いる`).toBe(true);
    }
  });
});

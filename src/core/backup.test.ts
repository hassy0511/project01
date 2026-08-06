/* セーブの バックアップ(書き出し / 読みこみ)の テスト */
import { describe, expect, it } from 'vitest';
import { BACKUP_APP, backupFileName, exportBackup, importBackup } from './backup';
import { defaultState } from './state';

describe('backup', () => {
  it('書き出した ものを そのまま 読みこめる(往復)', () => {
    const state = defaultState();
    state.unlocked.push('tokyo');
    state.fest.push('rf1');
    state.festBest.rf1 = 320;
    state.flags.introSeen = true;
    const text = exportBackup(state, 1234567890);
    const result = importBackup(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.save.unlocked).toEqual(['tokyo']);
      expect(result.save.festBest.rf1).toBe(320);
      expect(result.save.flags.introSeen).toBe(true);
      expect(result.at).toBe(1234567890);
    }
  });

  it('JSONで ない ファイルは broken', () => {
    expect(importBackup('こんにちは')).toEqual({ ok: false, reason: 'broken' });
    expect(importBackup('')).toEqual({ ok: false, reason: 'broken' });
  });

  it('よその アプリの JSON は notOurs', () => {
    expect(importBackup(JSON.stringify({ app: 'other-game', v: 1, save: {} }))).toEqual({
      ok: false,
      reason: 'notOurs',
    });
    expect(importBackup(JSON.stringify({ hello: 'world' }))).toEqual({ ok: false, reason: 'notOurs' });
  });

  it('新しすぎる 版は notOurs(将来の ファイルを 古い アプリで 開いた とき)', () => {
    const text = JSON.stringify({ app: BACKUP_APP, v: 999, at: 0, save: defaultState() });
    expect(importBackup(text)).toEqual({ ok: false, reason: 'notOurs' });
  });

  it('save の 型が おかしい ところは 既定値に なおる', () => {
    const text = JSON.stringify({
      app: BACKUP_APP,
      v: 1,
      at: 0,
      save: { unlocked: 'not-an-array', fest: ['rf1'], currentRegion: 'tohoku' },
    });
    const result = importBackup(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.save.unlocked).toEqual([]); // 型ちがい → 既定値
      expect(result.save.fest).toEqual(['rf1']);
      expect(result.save.currentRegion).toBe('tohoku');
    }
  });

  it('save が オブジェクトで ない ときは broken', () => {
    const text = JSON.stringify({ app: BACKUP_APP, v: 1, at: 0, save: [1, 2, 3] });
    expect(importBackup(text)).toEqual({ ok: false, reason: 'broken' });
  });

  it('ファイル名は 日づけ入り', () => {
    expect(backupFileName(new Date(2026, 7, 6))).toBe('harehare-save-20260806.json');
  });
});

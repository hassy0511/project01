import { describe, expect, it } from 'vitest';
import { GAME_DATA, findMaterial } from '../data/gameData';
import {
  defaultState,
  isSanchiComplete,
  loadState,
  markSanchiCompleteOnce,
  registerMaterial,
  SAVE_KEY,
  saveState,
  type StorageLike,
} from './state';

const memoryStorage = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
};

describe('load / save(キー "meisanquest-save-v1" 互換)', () => {
  it('セーブが無ければ初期状態', () => {
    const s = loadState(memoryStorage());
    expect(s).toEqual(defaultState());
  });

  it('save → load ラウンドトリップ', () => {
    const storage = memoryStorage();
    const s = defaultState();
    s.unlocked.push('ibaraki');
    s.inv.push({ ref: 'm01', origin: 'ibaraki', quality: 2 });
    saveState(s, storage);
    expect(storage.data.has(SAVE_KEY)).toBe(true);
    expect(loadState(storage)).toEqual(s);
  });

  it('マイグレーション: 旧セーブに無いキーは初期値で補完される', () => {
    const storage = memoryStorage();
    // v0.4 初期の最小セーブを想定(plots/infra/flags なし)
    storage.setItem(SAVE_KEY, JSON.stringify({ unlocked: ['ibaraki'], inv: [], recipes: ['r01'] }));
    const s = loadState(storage);
    expect(s.unlocked).toEqual(['ibaraki']);
    expect(s.recipes).toEqual(['r01']);
    expect(s.plots).toEqual({});
    expect(s.infra).toEqual({});
    expect(s.flags).toEqual({});
  });

  it('破損セーブは初期化される(例外を投げない)', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, '{broken json!!');
    expect(loadState(storage)).toEqual(defaultState());
  });
});

describe('registerMaterial(ずかん★登録)', () => {
  it('インベントリ追加+産地ごとの最高★を記録', () => {
    const s = defaultState();
    registerMaterial(s, 'm03', 'ibaraki', 3, 2);
    expect(s.inv).toHaveLength(2);
    expect(s.zukanMat['m03']['ibaraki']).toBe(3);
  });

  it('★は上書きでなく最高値を維持する', () => {
    const s = defaultState();
    registerMaterial(s, 'm03', 'ibaraki', 3, 1);
    registerMaterial(s, 'm03', 'ibaraki', 1, 1);
    expect(s.zukanMat['m03']['ibaraki']).toBe(3);
  });
});

describe('さんちコンプ', () => {
  const clay = findMaterial(GAME_DATA, 'm07'); // origins: ibaraki, tochigi
  if (!clay) throw new Error('m07 not found');

  it('全産地で入手して初めてコンプ', () => {
    const s = defaultState();
    registerMaterial(s, 'm07', 'ibaraki', 2, 1);
    expect(isSanchiComplete(s, clay)).toBe(false);
    registerMaterial(s, 'm07', 'tochigi', 2, 1);
    expect(isSanchiComplete(s, clay)).toBe(true);
  });

  it('markSanchiCompleteOnce は初回だけ true(祝福演出は一度きり)', () => {
    const s = defaultState();
    registerMaterial(s, 'm07', 'ibaraki', 2, 1);
    expect(markSanchiCompleteOnce(s, clay)).toBe(false);
    registerMaterial(s, 'm07', 'tochigi', 2, 1);
    expect(markSanchiCompleteOnce(s, clay)).toBe(true);
    expect(markSanchiCompleteOnce(s, clay)).toBe(false);
  });
});

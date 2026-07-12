import { describe, expect, it } from 'vitest';
import { GAME_DATA, findMaterial, type Material, type PlantGather, type InfraGather } from '../data/gameData';
import {
  boostAll,
  CARE_SPAWN_PROGRESS,
  clearPlot,
  collectInfra,
  ensureInfra,
  halfGrow,
  infraNextSec,
  infraStock,
  INFRA_QUALITY,
  markCareDone,
  plantSeed,
  plotKey,
  plotState,
} from './plots';
import { defaultState } from './state';

const material = (id: string): Material => {
  const m = findMaterial(GAME_DATA, id);
  if (!m) throw new Error(`material not found: ${id}`);
  return m;
};
const plantGather = (id: string): PlantGather => {
  const g = material(id).gather;
  if (g.type !== 'plant') throw new Error(`not plant: ${id}`);
  return g;
};
const infraGather = (id: string): InfraGather => {
  const g = material(id).gather;
  if (g.type !== 'infra') throw new Error(`not infra: ${id}`);
  return g;
};

const T0 = 1_000_000_000;

describe('plotState(成長状態遷移)', () => {
  const daizu = plantGather('m03'); // growSec 300

  it('未作付けは empty', () => {
    expect(plotState(undefined, daizu, T0).st).toBe('empty');
  });

  it('植えた直後は growing / prog 0 / おせわなし', () => {
    const state = defaultState();
    plantSeed(state, 'm03', 'ibaraki', T0);
    const view = plotState(state.plots[plotKey('ibaraki', 'm03')], daizu, T0);
    expect(view.st).toBe('growing');
    if (view.st === 'growing') {
      expect(view.prog).toBe(0);
      expect(view.care).toBe(false);
    }
  });

  it('40%未満は おせわチャンスなし、40%以上で湧く', () => {
    const state = defaultState();
    plantSeed(state, 'm03', 'ibaraki', T0);
    const plot = state.plots[plotKey('ibaraki', 'm03')];
    const at39 = plotState(plot, daizu, T0 + daizu.growSec * 1000 * 0.39);
    expect(at39.st === 'growing' && at39.care).toBe(false);
    const at40 = plotState(plot, daizu, T0 + daizu.growSec * 1000 * CARE_SPAWN_PROGRESS);
    expect(at40.st === 'growing' && at40.care).toBe(true);
  });

  it('おせわ完了後は おせわチャンスが消える', () => {
    const state = defaultState();
    plantSeed(state, 'm03', 'ibaraki', T0);
    markCareDone(state, 'm03', 'ibaraki');
    const view = plotState(state.plots[plotKey('ibaraki', 'm03')], daizu, T0 + daizu.growSec * 500);
    expect(view.st === 'growing' && view.care).toBe(false);
  });

  it('growSec 経過で ready、収穫後は clearPlot で empty に戻る', () => {
    const state = defaultState();
    plantSeed(state, 'm03', 'ibaraki', T0);
    const key = plotKey('ibaraki', 'm03');
    expect(plotState(state.plots[key], daizu, T0 + daizu.growSec * 1000).st).toBe('ready');
    clearPlot(state, 'm03', 'ibaraki');
    expect(state.plots[key]).toBeUndefined();
    expect(plotState(state.plots[key], daizu, T0).st).toBe('empty');
  });
});

describe('infraStock(いど・たんぼ)', () => {
  const ido = infraGather('m01'); // rateSec 120, max 3

  it('初期ストックは 0', () => {
    const state = defaultState();
    const rec = ensureInfra(state, 'm01', 'ibaraki', T0);
    expect(infraStock(rec, ido, T0)).toBe(0);
  });

  it('rateSec ごとに +1、max で頭打ち', () => {
    const rec = { lastCollect: T0 };
    expect(infraStock(rec, ido, T0 + 120_000)).toBe(1);
    expect(infraStock(rec, ido, T0 + 240_000)).toBe(2);
    expect(infraStock(rec, ido, T0 + 360_000)).toBe(3);
    expect(infraStock(rec, ido, T0 + 999_000_000)).toBe(3); // max 超過しない
  });

  it('レコード未初期化なら 0', () => {
    expect(infraStock(undefined, ido, T0)).toBe(0);
  });

  it('infraNextSec: 次の+1までの残り秒(満タンなら0)', () => {
    const rec = { lastCollect: T0 };
    expect(infraNextSec(rec, ido, T0 + 30_000)).toBe(90);
    expect(infraNextSec(rec, ido, T0 + 360_000)).toBe(0);
  });

  it('collectInfra: ストック分を★2固定で回収、ずかん登録、タイマーリセット', () => {
    const state = defaultState();
    ensureInfra(state, 'm01', 'ibaraki', T0);
    const t = T0 + 360_000;
    const got = collectInfra(state, material('m01'), 'ibaraki', t);
    expect(got).toBe(3);
    expect(state.inv.filter((i) => i.ref === 'm01' && i.quality === INFRA_QUALITY)).toHaveLength(3);
    expect(state.zukanMat['m01']['ibaraki']).toBe(INFRA_QUALITY);
    expect(state.infra[plotKey('ibaraki', 'm01')].lastCollect).toBe(t);
    expect(collectInfra(state, material('m01'), 'ibaraki', t)).toBe(0); // 直後は空
  });
});

describe('管理者API(boostAll / halfGrow)', () => {
  it('boostAll: 全プロットが ready、全 infra が満タンになる', () => {
    const state = defaultState();
    plantSeed(state, 'm03', 'ibaraki', T0);
    plantSeed(state, 'm05', 'ibaraki', T0);
    ensureInfra(state, 'm01', 'ibaraki', T0);
    boostAll(state, GAME_DATA, T0 + 1000);
    expect(plotState(state.plots[plotKey('ibaraki', 'm03')], plantGather('m03'), T0 + 1000).st).toBe('ready');
    expect(plotState(state.plots[plotKey('ibaraki', 'm05')], plantGather('m05'), T0 + 1000).st).toBe('ready');
    expect(infraStock(state.infra[plotKey('ibaraki', 'm01')], infraGather('m01'), T0 + 1000)).toBe(3);
  });

  it('halfGrow: 成長50%になり おせわチャンスが湧く', () => {
    const state = defaultState();
    plantSeed(state, 'm05', 'ibaraki', T0);
    halfGrow(state, GAME_DATA, T0 + 1000);
    const view = plotState(state.plots[plotKey('ibaraki', 'm05')], plantGather('m05'), T0 + 1000);
    expect(view.st).toBe('growing');
    if (view.st === 'growing') {
      expect(view.prog).toBeCloseTo(0.5, 5);
      expect(view.care).toBe(true);
    }
  });
});

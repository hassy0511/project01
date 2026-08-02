import { describe, expect, it } from 'vitest';
import { findMaterial, findPref, GAME_DATA as D } from '../data/gameData';
import { SEASON_EPOCH_MS, SEASON_LEN_MS } from './season';
import { defaultState } from './state';
import { isShinOpen, materialLock } from './shin';

const NOW_HARU = SEASON_EPOCH_MS + 1000;
const NOW_FUYU = SEASON_EPOCH_MS + 3 * SEASON_LEN_MS + 1000;

describe('しんの めいさんの 出しわけ', () => {
  it('おまつりを ひらくまで しんは ロック', () => {
    const s = defaultState();
    const renkon = findMaterial(D, 'm127')!; // れんこん(いばらき・季節なし)
    expect(materialLock(s, D, renkon, 'ibaraki', NOW_HARU)).toBe('shin');
    s.fest.push(findPref(D, 'ibaraki')!.festivalId!);
    expect(isShinOpen(s, D, 'ibaraki')).toBe(true);
    expect(materialLock(s, D, renkon, 'ibaraki', NOW_HARU)).toBeNull();
  });

  it('季節つきは 開いて いても 季節外れなら ロック', () => {
    const s = defaultState();
    s.fest.push(findPref(D, 'ibaraki')!.festivalId!);
    const ankou = findMaterial(D, 'm128')!; // あんこう(ふゆ)
    expect(materialLock(s, D, ankou, 'ibaraki', NOW_HARU)).toBe('season');
    expect(materialLock(s, D, ankou, 'ibaraki', NOW_FUYU)).toBeNull();
  });

  it('ふつうの そざいは いつでも だいじょうぶ', () => {
    const s = defaultState();
    const ume = findMaterial(D, 'm06')!;
    expect(materialLock(s, D, ume, 'ibaraki', NOW_HARU)).toBeNull();
  });

  it('しんの そざいと レシピは 各かんとう県に 2つずつ ある(試作の 約束)', () => {
    for (const pid of ['ibaraki', 'tochigi', 'gunma', 'saitama', 'tokyo', 'chiba', 'kanagawa']) {
      const mats = D.materials.filter((m) => m.shin && m.origins.includes(pid));
      const recs = D.recipes.filter((r) => r.shin && r.pref === pid);
      expect(mats.length, `${pid} の しんそざい`).toBe(2);
      expect(recs.length, `${pid} の しんレシピ`).toBe(2);
    }
  });

  it('しんの そざいは そだつ時間 30分いじょう(まちが 旅の 動機に なる 長さ)', () => {
    for (const m of D.materials.filter((x) => x.shin)) {
      const g = m.gather;
      if (g.type === 'plant') expect(g.growSec, m.id).toBeGreaterThanOrEqual(1800);
    }
  });

  it('しんレシピの 材料は しん・かんとうの ものだけ(自エリアで 完結)', () => {
    for (const r of D.recipes.filter((x) => x.shin)) {
      for (const ing of r.ingredients) {
        const m = findMaterial(D, ing.ref);
        expect(m, `${r.id}: ${ing.ref}`).toBeDefined();
        const inKanto = m!.origins.some((o) => findPref(D, o)?.region === 'kanto');
        expect(inKanto, `${r.id}: ${ing.ref} が かんとうで とれない`).toBe(true);
      }
    }
  });
});

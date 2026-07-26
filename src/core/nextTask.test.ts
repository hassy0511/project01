/* 「いま やること」の 見つけ方。いそぎの ものが 先に 出るか を 見る */
import { describe, expect, it } from 'vitest';
import { GAME_DATA, findPref } from '../data/gameData';
import { defaultState } from './state';
import { plotKey } from './plots';
import { nextTask, prefComplete } from './nextTask';

const NOW = 1_700_000_000_000;
const ibaraki = findPref(GAME_DATA, 'ibaraki')!;
/** いばらきの そざい(データを 直に 書かない) */
const matsOf = (prefId: string) => GAME_DATA.materials.filter((m) => m.origins.includes(prefId));
const plantOf = (prefId: string) => matsOf(prefId).find((m) => m.gather.type === 'plant')!;

describe('nextTask(いま やること)', () => {
  it('まだ 何も していない けんでは 「うえよう」に なる', () => {
    const s = defaultState();
    expect(nextTask(s, ibaraki, GAME_DATA, NOW).kind).toBe('plant');
  });

  it('そだち中しか ない ときは 「ほかの けんへ」に なる', () => {
    const s = defaultState();
    // レシピは ぜんぶ もっている ことに する(さがす ことが 残っていると そちらが 先に 出る)
    for (const r of GAME_DATA.recipes.filter((r) => r.pref === 'ibaraki')) s.recipes.push(r.id);
    // いばらきの はたけ ぜんぶに うえる
    for (const m of matsOf('ibaraki')) {
      if (m.gather.type !== 'plant') continue;
      s.plots[plotKey('ibaraki', m.id)] = { plantedAt: NOW, careSpawned: false, careDone: true };
    }
    expect(nextTask(s, ibaraki, GAME_DATA, NOW).kind).toBe('growing');
  });

  it('そだちきったら 「しゅうかく」が そだち中より 先に 出る', () => {
    const s = defaultState();
    const mats = matsOf('ibaraki').filter((m) => m.gather.type === 'plant');
    for (const m of mats) {
      if (m.gather.type !== 'plant') continue;
      s.plots[plotKey('ibaraki', m.id)] = { plantedAt: NOW, careSpawned: false, careDone: true };
    }
    // 1つだけ そだちきらせる
    const first = mats[0];
    if (first.gather.type === 'plant') {
      s.plots[plotKey('ibaraki', first.id)] = {
        plantedAt: NOW - first.gather.growSec * 1000 - 1,
        careSpawned: true,
        careDone: true,
      };
    }
    const t = nextTask(s, ibaraki, GAME_DATA, NOW);
    expect(t.kind).toBe('harvest');
    expect(t.name).toBe(first.name);
  });

  it('おせわチャンスは しゅうかくよりも 先に 出る(時間で 消えるから)', () => {
    const s = defaultState();
    const mats = matsOf('ibaraki').filter((m) => m.gather.type === 'plant');
    const [a, b] = mats;
    if (a.gather.type === 'plant') {
      // a は しゅうかくできる
      s.plots[plotKey('ibaraki', a.id)] = {
        plantedAt: NOW - a.gather.growSec * 1000 - 1,
        careSpawned: true,
        careDone: true,
      };
    }
    if (b?.gather.type === 'plant') {
      // b は おせわチャンス中(はんぶんまで そだって おせわ未実施)
      s.plots[plotKey('ibaraki', b.id)] = {
        plantedAt: NOW - b.gather.growSec * 1000 * 0.7,
        careSpawned: true,
        careDone: false,
      };
      const t = nextTask(s, ibaraki, GAME_DATA, NOW);
      expect(t.kind).toBe('care');
      expect(t.name).toBe(b.name);
    }
  });

  it('はたけが 空いていれば 「うえよう」が レシピさがしより 先(そざいが 出発点)', () => {
    const s = defaultState();
    expect(nextTask(s, ibaraki, GAME_DATA, NOW).kind).toBe('plant');
  });

  it('はたけが ふさがっていて レシピが 未取得なら 「さがそう」', () => {
    const s = defaultState();
    for (const m of matsOf('ibaraki')) {
      if (m.gather.type !== 'plant') continue;
      s.plots[plotKey('ibaraki', m.id)] = { plantedAt: NOW, careSpawned: false, careDone: true };
    }
    expect(nextTask(s, ibaraki, GAME_DATA, NOW).kind).toBe('findRecipe');
  });

  it('レシピを ぜんぶ もっていて つくれない なら 「さがす」には ならない', () => {
    const s = defaultState();
    for (const r of GAME_DATA.recipes.filter((r) => r.pref === 'ibaraki')) s.recipes.push(r.id);
    // はたけは 空なので 「うえよう」に なる(レシピは もう ぜんぶ ある)
    expect(nextTask(s, ibaraki, GAME_DATA, NOW).kind).toBe('plant');
  });

  it('つくれる めいぶつが あれば 「つくろう」が レシピさがしより 先', () => {
    const s = defaultState();
    const r = GAME_DATA.recipes.find((x) => x.pref === 'ibaraki' && x.type !== 'matsuri')!;
    s.recipes.push(r.id);
    for (const ing of r.ingredients) {
      for (let i = 0; i < ing.count; i++) s.inv.push({ ref: ing.ref, origin: 'ibaraki', quality: 1 });
    }
    const t = nextTask(s, ibaraki, GAME_DATA, NOW);
    expect(t.kind).toBe('craft');
    expect(t.name).toBe(r.name);
  });

  it('おまつりが ひらけるなら いちばん 先に すすめる(けんの ゴール)', () => {
    const s = defaultState();
    const fest = GAME_DATA.recipes.find((x) => x.pref === 'ibaraki' && x.type === 'matsuri')!;
    s.recipes.push(fest.id);
    for (const ing of fest.ingredients) {
      for (let i = 0; i < ing.count; i++) s.inv.push({ ref: ing.ref, origin: 'ibaraki', quality: 1 });
    }
    expect(nextTask(s, ibaraki, GAME_DATA, NOW).kind).toBe('festival');
  });

  it('どの けんでも 「やることが ない」に ならない(あそび始めの 状態で)', () => {
    const s = defaultState();
    for (const p of GAME_DATA.prefectures.filter((x) => x.active)) {
      expect(nextTask(s, p, GAME_DATA, NOW).kind, `${p.name}`).not.toBe('done');
    }
  });

  it('うえられる そざいが ある かぎり 名前が つく(文に 入れる ため)', () => {
    const s = defaultState();
    const t = nextTask(s, ibaraki, GAME_DATA, NOW);
    expect(t.name).toBe(plantOf('ibaraki').name);
  });
});

describe('prefComplete(その けんは 終わったか)', () => {
  it('おまつりを ひらくまでは 未完', () => {
    expect(prefComplete(defaultState(), ibaraki, GAME_DATA)).toBe(false);
  });

  it('おまつりを ぜんぶ ひらいたら 完了', () => {
    const s = defaultState();
    for (const r of GAME_DATA.recipes.filter((x) => x.pref === 'ibaraki' && x.type === 'matsuri')) s.fest.push(r.id);
    expect(prefComplete(s, ibaraki, GAME_DATA)).toBe(true);
  });
});

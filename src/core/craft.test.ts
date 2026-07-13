import { describe, expect, it } from 'vitest';
import { GAME_DATA, findRecipe, type Recipe } from '../data/gameData';
import { applyCraft, applyFestival, craftable, isJimoto, matchItems, pickConsume, updateFestBest } from './craft';
import { defaultState, type InvItem } from './state';

const recipe = (id: string): Recipe => {
  const r = findRecipe(GAME_DATA, id);
  if (!r) throw new Error(`recipe not found: ${id}`);
  return r;
};
const item = (ref: string, origin: string, quality: number | null): InvItem => ({ ref, origin, quality });

describe('matchItems', () => {
  it('ref が一致するものだけ返す', () => {
    const inv = [item('m03', 'ibaraki', 3), item('m01', 'ibaraki', 2)];
    expect(matchItems(inv, { ref: 'm03', count: 1 })).toHaveLength(1);
  });

  it('産地指定ガード: とちぎ産ねんどは いばらき指定に一致しない', () => {
    const inv = [item('m07', 'tochigi', 3), item('m07', 'tochigi', 3)];
    expect(matchItems(inv, { ref: 'm07', count: 2, origin: 'ibaraki' })).toHaveLength(0);
    expect(matchItems(inv, { ref: 'm07', count: 2, origin: 'tochigi' })).toHaveLength(2);
  });

  it('★指定: ★2は quality:3 に一致せず、★3は一致する', () => {
    const inv = [item('m05', 'ibaraki', 2), item('m05', 'ibaraki', 3)];
    const matched = matchItems(inv, { ref: 'm05', count: 1, quality: 3 });
    expect(matched).toHaveLength(1);
    expect(matched[0].quality).toBe(3);
  });

  it('quality:null(クラフト産物)は★指定に一致しない', () => {
    const inv = [item('r01', 'ibaraki', null)];
    expect(matchItems(inv, { ref: 'r01', count: 1, quality: 3 })).toHaveLength(0);
    expect(matchItems(inv, { ref: 'r01', count: 1 })).toHaveLength(1);
  });
});

describe('craftable', () => {
  it('かさまやき: とちぎ産ねんどだけでは作れない(産地指定ガード)', () => {
    const inv = [item('m07', 'tochigi', 3), item('m07', 'tochigi', 3), item('m01', 'ibaraki', 2)];
    expect(craftable(inv, recipe('r05'))).toBe(false);
  });

  it('かさまやき: いばらき産ねんど2+みず1 で作れる', () => {
    const inv = [item('m07', 'ibaraki', 3), item('m07', 'ibaraki', 1), item('m01', 'ibaraki', 2)];
    expect(craftable(inv, recipe('r05'))).toBe(true);
  });

  it('ブランドメロン: ★3メロンが必要', () => {
    expect(craftable([item('m05', 'ibaraki', 2)], recipe('r06'))).toBe(false);
    expect(craftable([item('m05', 'ibaraki', 3)], recipe('r06'))).toBe(true);
  });
});

describe('pickConsume', () => {
  it('じもと優先: いばらき産ねんどを消費し とちぎ産は温存(かさまやき)', () => {
    const tochigi1 = item('m07', 'tochigi', 3);
    const tochigi2 = item('m07', 'tochigi', 3);
    const inv = [tochigi1, tochigi2, item('m07', 'ibaraki', 3), item('m07', 'ibaraki', 3), item('m01', 'ibaraki', 2)];
    const used = pickConsume(inv, recipe('r05'));
    expect(used.filter((it) => it.ref === 'm07').every((it) => it.origin === 'ibaraki')).toBe(true);
    expect(used).not.toContain(tochigi1);
    expect(used).not.toContain(tochigi2);
  });

  it('低★温存: 同条件なら低い★から使い、高★を残す', () => {
    const low = item('m03', 'ibaraki', 1);
    const high = item('m03', 'ibaraki', 3);
    const inv = [high, low, item('m03', 'ibaraki', 2), item('m01', 'ibaraki', 2)];
    const used = pickConsume(inv, recipe('r01')); // だいず2+みず1
    expect(used).toContain(low);
    expect(used).not.toContain(high);
  });

  it('じもと優先は★温存より強い(他県産★1より自県産★3を使う)', () => {
    const otherLow = item('m03', 'tochigi', 1);
    const homeHigh = item('m03', 'ibaraki', 3);
    const inv = [otherLow, homeHigh, item('m03', 'ibaraki', 3), item('m01', 'ibaraki', 2)];
    const used = pickConsume(inv, recipe('r01'));
    expect(used).toContain(homeHigh);
    expect(used).not.toContain(otherLow);
  });

  it('そざい不足なら例外(craftable が前提)', () => {
    expect(() => pickConsume([item('m03', 'ibaraki', 2)], recipe('r01'))).toThrow();
  });
});

describe('isJimoto / applyCraft', () => {
  it('全て自県産そざいなら じもとメダル', () => {
    const used = [item('m03', 'ibaraki', 2), item('m03', 'ibaraki', 2), item('m01', 'ibaraki', 2)];
    expect(isJimoto(used, recipe('r01'))).toBe(true);
  });

  it('他県産そざいが混ざると じもとにならない', () => {
    const used = [item('m03', 'tochigi', 2), item('m03', 'ibaraki', 2), item('m01', 'ibaraki', 2)];
    expect(isJimoto(used, recipe('r01'))).toBe(false);
  });

  it('材料の産物(レシピref)は じもと判定から除外される', () => {
    // なっとうていしょく: なっとう(いばらき産物) + こめ + しょうゆ(ちば産物)
    const used = [item('r01', 'ibaraki', null), item('m02', 'ibaraki', 2), item('r07', 'chiba', null)];
    expect(isJimoto(used, recipe('r04'))).toBe(true);
  });

  it('県またぎ: ちば産しょうゆで なっとうていしょく 完成 → ずかん登録・しょうゆ消費', () => {
    const state = defaultState();
    state.inv = [
      item('r01', 'ibaraki', null),
      item('m02', 'ibaraki', 2),
      item('r07', 'chiba', null),
    ];
    expect(craftable(state.inv, recipe('r04'))).toBe(true);
    applyCraft(state, recipe('r04'));
    expect(state.zukanProd['r04']).toBeDefined();
    expect(state.inv.some((it) => it.ref === 'r07')).toBe(false);
    expect(state.inv.some((it) => it.ref === 'r04' && it.origin === 'ibaraki')).toBe(true);
  });

  it('じもとメダルは一度取れば維持される(2回目が他県産でも)', () => {
    const state = defaultState();
    state.inv = [item('m03', 'ibaraki', 1), item('m03', 'ibaraki', 1), item('m01', 'ibaraki', 2)];
    applyCraft(state, recipe('r01'));
    expect(state.zukanProd['r01'].jimoto).toBe(true);
    state.inv.push(item('m03', 'tochigi', 1), item('m03', 'tochigi', 1), item('m01', 'ibaraki', 2));
    applyCraft(state, recipe('r01'));
    expect(state.zukanProd['r01'].jimoto).toBe(true);
  });
});

describe('applyFestival', () => {
  it('めいぶつを消費して fest に登録(産物は生まれない)', () => {
    const state = defaultState();
    state.inv = [item('r03', 'ibaraki', null), item('r05', 'ibaraki', null)];
    applyFestival(state, recipe('rf1'));
    expect(state.fest).toContain('rf1');
    expect(state.inv).toHaveLength(0);
    expect(state.zukanProd['rf1']).toBeUndefined();
  });

  it('なんどでも開催できる: 2回目も消費するが fest は重複しない', () => {
    const state = defaultState();
    state.inv = [
      item('r03', 'ibaraki', null),
      item('r05', 'ibaraki', null),
      item('r03', 'ibaraki', null),
      item('r05', 'ibaraki', null),
    ];
    applyFestival(state, recipe('rf1'));
    applyFestival(state, recipe('rf1'));
    expect(state.inv).toHaveLength(0);
    expect(state.fest.filter((id) => id === 'rf1')).toHaveLength(1);
  });
});

describe('updateFestBest', () => {
  it('きろく更新のときだけ true を返し、スコアを保存する', () => {
    const state = defaultState();
    expect(updateFestBest(state, 'rf1', 300)).toBe(true);
    expect(state.festBest['rf1']).toBe(300);
    expect(updateFestBest(state, 'rf1', 200)).toBe(false);
    expect(state.festBest['rf1']).toBe(300);
    expect(updateFestBest(state, 'rf1', 350)).toBe(true);
    expect(state.festBest['rf1']).toBe(350);
  });

  it('同点は こうしんに ならない', () => {
    const state = defaultState();
    updateFestBest(state, 'rf1', 300);
    expect(updateFestBest(state, 'rf1', 300)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { GAME_DATA as D, findMaterial, findPref } from '../data/gameData';
import { whereFrom } from './whereFrom';

const at = (prefId: string, ref: string, enough = false, origin?: string) =>
  whereFrom(D, prefId, origin ? { ref, count: 1, origin } : { ref, count: 1 }, enough);

describe('ざいりょうの 行き先', () => {
  it('自分の県で とれる ものには 何も 出さない', () => {
    // こむぎ(m94)は かがわ の めいさん
    expect(findMaterial(D, 'm94')!.origins).toContain('kagawa');
    expect(at('kagawa', 'm94')).toBeNull();
  });

  it('県を またぐ ざいりょうは 行き先を 出す(ちゃんぽんの こむぎ)', () => {
    const w = at('nagasaki', 'm94');
    expect(w).not.toBeNull();
    expect(w!.pref).toBe('kagawa');
    expect(w!.count).toBe(1); // かがわ だけ = 「ほか」は つかない
  });

  it('足りて いる ときは 出さない(ふだんは じゃまなだけ)', () => {
    expect(at('nagasaki', 'm94', true)).toBeNull();
  });

  it('産地指定(origin)には 出さない(すでに 名前の よこに ある)', () => {
    expect(at('nagasaki', 'm94', false, 'kagawa')).toBeNull();
  });

  it('とれる 県が いくつも ある ときは いちばん 近い エリアの 県', () => {
    // しお(m51)は いしかわ(ちゅうぶ)と ひょうご(きんき)
    const salt = findMaterial(D, 'm51')!;
    expect(salt.origins.sort()).toEqual(['hyogo', 'ishikawa']);
    // ながさき(きゅうしゅう)からは きんき の ひょうご のほうが 近い
    expect(at('nagasaki', 'm51')!.pref).toBe('hyogo');
    // ちゅうぶ の にいがた からは ちゅうぶ の いしかわ
    expect(at('niigata', 'm51')!.pref).toBe('ishikawa');
    expect(at('nagasaki', 'm51')!.count).toBe(2); // 2県 ある = 「ほか」つき
  });

  it('レシピを ざいりょうに する ときも 作れる 県を さす', () => {
    // バター(r39)は ほっかいどう。ながの(ちゅうぶ)の りんごバターが つかう
    const w = at('nagano', 'r39');
    expect(w).not.toBeNull();
    expect(w!.pref).toBe('hokkaido');
  });

  it('知らない ざいりょうでは こわれない', () => {
    expect(at('kagawa', 'xxx')).toBeNull();
  });

  it('さす 県は かならず アクティブ', () => {
    for (const r of D.recipes) {
      if (!findPref(D, r.pref)?.active) continue;
      for (const ing of r.ingredients) {
        const w = whereFrom(D, r.pref, ing, false);
        if (w) expect(findPref(D, w.pref)?.active, `${r.id} → ${w.pref}`).toBe(true);
      }
    }
  });
});

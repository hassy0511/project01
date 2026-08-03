import { describe, expect, it } from 'vitest';
import { findMaterial, findPref, findRecipe, GAME_DATA as D } from '../data/gameData';
import { defaultState } from './state';
import {
  canFulfill,
  currentTitle,
  earnedKazari,
  ensureOrder,
  fulfillOrder,
  generateOrder,
  orderCandidates,
  ordersOpen,
  totalOrdersDone,
} from './orders';

/** いばらきが 晴れて いて、ちばも 開拓ずみの セーブ */
const baseState = () => {
  const s = defaultState();
  s.unlocked = ['ibaraki', 'chiba'];
  s.fest.push(findPref(D, 'ibaraki')!.festivalId!);
  return s;
};

const rand0 = () => 0; // いつも 先頭の 候補

describe('ちゅうもんの 出しかた', () => {
  it('おまつり前は ひらかない', () => {
    const s = defaultState();
    s.unlocked = ['ibaraki', 'chiba'];
    expect(ordersOpen(s, D, 'ibaraki')).toBe(false);
    expect(ensureOrder(s, D, 'ibaraki', rand0)).toBeNull();
  });

  it('たのまれる ものは 自県で とれず、開拓ずみの 県で 手に入る', () => {
    const s = baseState();
    for (const c of orderCandidates(s, D, 'ibaraki')) {
      const m = findMaterial(D, c.ref);
      if (m) {
        expect(m.origins.includes('ibaraki'), c.ref).toBe(false);
        expect(m.origins.some((o) => s.unlocked.includes(o)), c.ref).toBe(true);
        expect(m.dougu ?? false, `${c.ref} は どうぐの 材料`).toBe(false);
        expect(m.shin ?? false, `${c.ref} は しん`).toBe(false);
        expect(m.season, `${c.ref} は 季節限定`).toBeUndefined();
      } else {
        const r = findRecipe(D, c.ref)!;
        expect(r.pref === 'ibaraki', c.ref).toBe(false);
        expect(s.unlocked.includes(r.pref), c.ref).toBe(true);
        expect(r.tier, c.ref).not.toBe(4);
        expect(r.type, c.ref).not.toBe('dougu');
        expect(r.shin ?? false, c.ref).toBe(false);
      }
    }
  });

  it('どの 晴れた 県でも、全県 開拓ずみなら かならず 候補が ある', () => {
    const s = defaultState();
    s.unlocked = D.prefectures.filter((p) => p.active).map((p) => p.id);
    for (const p of D.prefectures.filter((x) => x.active)) {
      expect(orderCandidates(s, D, p.id).length, p.id).toBeGreaterThan(0);
    }
  });

  it('ensureOrder は 同じ ちゅうもんを かえしつづける(リロードで 変わらない)', () => {
    const s = baseState();
    const a = ensureOrder(s, D, 'ibaraki', rand0);
    const b = ensureOrder(s, D, 'ibaraki', () => 0.9);
    expect(a).toEqual(b);
  });

  it('開拓が 1県だけ なら 候補ゼロで ちゅうもんは 出ない', () => {
    const s = defaultState();
    s.unlocked = ['ibaraki'];
    s.fest.push(findPref(D, 'ibaraki')!.festivalId!);
    // いばらきで とれない もの は ぜんぶ 未開拓の 県の もの
    expect(generateOrder(s, D, 'ibaraki', rand0)).toBeNull();
  });
});

describe('ちゅうもんに こたえる', () => {
  const withOrder = () => {
    const s = baseState();
    const o = ensureOrder(s, D, 'ibaraki', rand0)!;
    for (let i = 0; i < o.count; i++) s.inv.push({ ref: o.ref, origin: 'chiba', quality: 2 });
    return { s, o };
  };

  it('しなものが たりると こたえられる。★の ひくい ものから 出す', () => {
    const { s, o } = withOrder();
    s.inv.push({ ref: o.ref, origin: 'chiba', quality: 3 }); // ★3は 温存される
    expect(canFulfill(s, o)).toBe(true);
    fulfillOrder(s, D, 'ibaraki', rand0);
    expect(s.inv.filter((it) => it.ref === o.ref && it.quality === 3).length).toBe(1);
  });

  it('はじめの 1回で その県の かざり+称号「はいたつ みならい」', () => {
    const { s } = withOrder();
    const res = fulfillOrder(s, D, 'ibaraki', rand0);
    expect(res.kazari?.pref).toBe('ibaraki');
    expect(res.newTitle).toBe('はいたつ みならい');
    expect(res.total).toBe(1);
    expect(earnedKazari(s, D).map((k) => k.pref)).toEqual(['ibaraki']);
  });

  it('2回目は かざり なし。つぎの ちゅうもんが すぐ 出て いる', () => {
    const { s } = withOrder();
    fulfillOrder(s, D, 'ibaraki', rand0);
    const next = s.orders.ibaraki;
    expect(next).toBeDefined();
    for (let i = 0; i < next.count; i++) s.inv.push({ ref: next.ref, origin: 'chiba', quality: 1 });
    const res2 = fulfillOrder(s, D, 'ibaraki', rand0);
    expect(res2.kazari).toBeUndefined();
    expect(totalOrdersDone(s)).toBe(2);
  });

  it('たりない ときは こたえられない(例外)', () => {
    const s = baseState();
    ensureOrder(s, D, 'ibaraki', rand0);
    expect(() => fulfillOrder(s, D, 'ibaraki', rand0)).toThrow();
  });

  it('称号は 通算数で 上がって いく', () => {
    const s = baseState();
    expect(currentTitle(s, D).name).toBeNull();
    s.orderDone = { ibaraki: 3, chiba: 2 };
    const t = currentTitle(s, D);
    expect(t.name).toBe('まちの はいたつやさん');
    expect(t.next?.name).toBe('たびする はいたつやさん');
    expect(t.next?.remain).toBe(10);
  });
});

describe('かざりの データ', () => {
  it('47県ぶん、県の 重複なし・ぜんぶ アクティブ', () => {
    expect(D.kazari.length).toBe(47);
    expect(new Set(D.kazari.map((k) => k.pref)).size).toBe(47);
    for (const k of D.kazari) expect(findPref(D, k.pref)?.active, k.id).toBe(true);
  });

  it('称号は count の 小さい 順', () => {
    for (let i = 1; i < D.orderTitles.length; i++) {
      expect(D.orderTitles[i].count).toBeGreaterThan(D.orderTitles[i - 1].count);
    }
  });
});

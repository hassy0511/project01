import { describe, expect, it } from 'vitest';
import { GAME_DATA, findRecipe } from '../data/gameData';
import {
  kaitakuKnowledgePool,
  pickKaitakuQuizzes,
  pickRecipeQuizzes,
  recipeQuizPool,
  sessionQuizPool,
  shuffle,
  shuffledChoiceOrder,
} from './quiz';

const quizzes = GAME_DATA.quizzes;
const activePrefs = GAME_DATA.prefectures.filter((p) => p.active).map((p) => p.id);

/** 決定的な擬似乱数(テスト用) */
const seededRng = (seed: number): (() => number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

describe('クイズプール分離(v0.4 で確定した規律)', () => {
  it('「さんち」カテゴリは廃止済み', () => {
    expect(quizzes.some((q) => (q.kind as string) === 'sanchi')).toBe(false);
  });

  it('育成プール: 全そざいで空にならず、形・位置・開拓が混入しない', () => {
    for (const m of GAME_DATA.materials) {
      const pool = sessionQuizPool(quizzes, m.id);
      expect(pool.length, `empty quiz pool for ${m.id}`).toBeGreaterThan(0);
      expect(
        pool.some((q) => q.type || q.kind === 'kaitaku' || q.kind === 'bunka'),
        `wrong quiz leaked for ${m.id}`,
      ).toBe(false);
    }
  });

  it('開拓の知識クイズが各アクティブ県に3問以上ある', () => {
    for (const pid of activePrefs) {
      expect(kaitakuKnowledgePool(quizzes, pid).length, pid).toBeGreaterThanOrEqual(3);
    }
  });

  it('開拓出題: 形/位置1問 + 知識1問(タグは対象県)', () => {
    for (const pid of activePrefs) {
      const qs = pickKaitakuQuizzes(quizzes, pid, seededRng(42));
      expect(qs).toHaveLength(2);
      expect(qs[0].type === 'shape' || qs[0].type === 'position').toBe(true);
      expect(qs[1].kind).toBe('kaitaku');
      expect(qs[1].type).toBeUndefined();
      for (const q of qs) expect(q.tags).toContain(pid);
    }
  });

  it('レシピ探索プール: sozai/bunka のみで形・位置・開拓が混入しない', () => {
    for (const r of GAME_DATA.recipes) {
      const pool = recipeQuizPool(quizzes, r, r.pref);
      expect(pool.length, `pool for ${r.id}`).toBeGreaterThanOrEqual(2);
      expect(
        pool.some((q) => q.type || q.kind === 'kaitaku'),
        `wrong quiz leaked for ${r.id}`,
      ).toBe(false);
    }
  });

  it('レシピ探索の出題は2問', () => {
    const recipe = findRecipe(GAME_DATA, 'r01');
    if (!recipe) throw new Error('r01 not found');
    const qs = pickRecipeQuizzes(quizzes, recipe, 'ibaraki', seededRng(7));
    expect(qs).toHaveLength(2);
    expect(new Set(qs.map((q) => q.id)).size).toBe(2);
  });
});

describe('shuffle / 選択肢シャッフル', () => {
  it('shuffle: 要素を欠かさず並び替え、元配列を変更しない', () => {
    const orig = [1, 2, 3, 4, 5];
    const result = shuffle(orig, seededRng(1));
    expect(result.slice().sort()).toEqual(orig.slice().sort());
    expect(orig).toEqual([1, 2, 3, 4, 5]);
  });

  it('同じ rng シードなら同じ並びになる(決定性)', () => {
    const a = shuffle([1, 2, 3, 4, 5, 6, 7, 8], seededRng(9));
    const b = shuffle([1, 2, 3, 4, 5, 6, 7, 8], seededRng(9));
    expect(a).toEqual(b);
  });

  it('選択肢の表示順: 全 index を含む並び順を返す(answer は元 index のまま)', () => {
    const quiz = quizzes[0];
    const order = shuffledChoiceOrder(quiz, seededRng(3));
    expect(order.slice().sort()).toEqual(quiz.choices.map((_, i) => i));
  });
});

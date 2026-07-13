import { describe, expect, it } from 'vitest';
import { GAME_DATA, findRecipe } from '../data/gameData';
import {
  kaitakuKnowledgePool,
  pickKaitakuQuiz,
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

describe('クイズプール分離(文脈規律)', () => {
  it('「さんち」カテゴリは廃止済み', () => {
    expect(quizzes.some((q) => (q.kind as string) === 'sanchi')).toBe(false);
  });

  it('育成プール: 収穫セッションのある全そざいに「その素材にタグ一致する」問題だけがある', () => {
    for (const m of GAME_DATA.materials) {
      if (m.gather.type === 'infra') continue; // 育成セッションが無い
      const pool = sessionQuizPool(quizzes, m.id);
      expect(pool.length, `no tagged quiz for ${m.id}`).toBeGreaterThan(0);
      for (const q of pool) {
        expect(q.kind).toBe('sozai');
        expect(q.type).toBeUndefined();
        expect(q.tags, `${q.id} must be tagged with ${m.id}`).toContain(m.id);
      }
    }
  });

  it('開拓の知識クイズプールは維持されている(各アクティブ県に3問以上)', () => {
    for (const pid of activePrefs) {
      expect(kaitakuKnowledgePool(quizzes, pid).length, pid).toBeGreaterThanOrEqual(3);
    }
  });

  it('開拓出題: 形/位置クイズを1問だけ(県名を直接当てる)', () => {
    for (const pid of activePrefs) {
      const q = pickKaitakuQuiz(quizzes, pid, seededRng(42));
      expect(q).toBeDefined();
      expect(q!.type === 'shape' || q!.type === 'position').toBe(true);
      expect(q!.tags).toContain(pid);
    }
  });

  it('レシピ探索プール: レシピ自身か材料に関係する問題のみ(県タグだけの一致や補充はしない)', () => {
    for (const r of GAME_DATA.recipes) {
      const refs = new Set(r.ingredients.map((g) => g.ref).concat([r.id]));
      const pool = recipeQuizPool(quizzes, r);
      expect(pool.length, `no related quiz for ${r.id}`).toBeGreaterThanOrEqual(1);
      for (const q of pool) {
        expect(q.type, q.id).toBeUndefined();
        expect(q.kind === 'sozai' || q.kind === 'bunka', q.id).toBe(true);
        expect(q.tags.some((t) => refs.has(t)), `${q.id} is unrelated to ${r.id}`).toBe(true);
      }
    }
  });

  it('レシピ探索の出題は最大2問・重複なし', () => {
    const recipe = findRecipe(GAME_DATA, 'r01');
    if (!recipe) throw new Error('r01 not found');
    const qs = pickRecipeQuizzes(quizzes, recipe, seededRng(7));
    expect(qs.length).toBeGreaterThanOrEqual(1);
    expect(qs.length).toBeLessThanOrEqual(2);
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
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

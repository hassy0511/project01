/* =====================================================
   クイズ出題プール選択(kaitaku / sozai / bunka の使い分け)
   GAME_SPEC「クイズ設計」の規律を実装:
   - 産地を問う問題(kaitaku)は開拓専用。育成・レシピには混ぜない
   - 育成中のセッションクイズ = sozai のみ
   - レシピ探索 = sozai + bunka のみ
   - プール不足時に無関係カテゴリで補充しない(形・位置は決して漏らさない)
   乱数は rng を注入できる(テスト・リプレイ用)。
   ===================================================== */
import type { Quiz, Recipe } from '../data/gameData';

export type Rng = () => number;

/** Fisher-Yates。元配列は変更しない */
export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom<T>(arr: readonly T[], rng: Rng = Math.random): T | undefined {
  if (!arr.length) return undefined;
  return arr[Math.floor(rng() * arr.length)];
}

/** 開拓クイズ: 形or位置クイズの候補(その県のもののみ) */
export function kaitakuIdPool(quizzes: Quiz[], prefId: string): Quiz[] {
  return quizzes.filter((q) => (q.type === 'shape' || q.type === 'position') && q.tags.includes(prefId));
}

/** 開拓クイズ: 知識クイズの候補(kaitaku かつ形位置でないもの) */
export function kaitakuKnowledgePool(quizzes: Quiz[], prefId: string): Quiz[] {
  return quizzes.filter((q) => q.kind === 'kaitaku' && !q.type && q.tags.includes(prefId));
}

/** 開拓時の出題: 形/位置1問 + 知識1問(プールが空なら該当分は出さない) */
export function pickKaitakuQuizzes(quizzes: Quiz[], prefId: string, rng: Rng = Math.random): Quiz[] {
  const idQ = pickRandom(kaitakuIdPool(quizzes, prefId), rng);
  const knowQ = pickRandom(kaitakuKnowledgePool(quizzes, prefId), rng);
  return [idQ, knowQ].filter((q): q is Quiz => q !== undefined);
}

/**
 * 育成セッション用プール: sozai のみ(形・位置・開拓は決して混ぜない)。
 * その素材にタグ一致するものを優先し、無ければ sozai 全体から。
 */
export function sessionQuizPool(quizzes: Quiz[], matId: string): Quiz[] {
  const isSozai = (q: Quiz): boolean => !q.type && q.kind === 'sozai';
  const tagged = quizzes.filter((q) => isSozai(q) && q.tags.includes(matId));
  return tagged.length ? tagged : quizzes.filter(isSozai);
}

export function pickSessionQuiz(quizzes: Quiz[], matId: string, rng: Rng = Math.random): Quiz | undefined {
  return pickRandom(sessionQuizPool(quizzes, matId), rng);
}

/**
 * レシピ探索用プール: sozai + bunka のみ。県タグ一致 or
 * 材料・レシピ自身の ref にタグ一致するものを優先し、
 * 2問に満たなければ sozai 全体から補充(bunka や kaitaku では補充しない)。
 */
export function recipeQuizPool(quizzes: Quiz[], recipe: Recipe, prefId: string): Quiz[] {
  const refs = recipe.ingredients.map((g) => g.ref).concat([recipe.id]);
  let pool = quizzes.filter(
    (q) =>
      !q.type &&
      (q.kind === 'sozai' || q.kind === 'bunka') &&
      (q.tags.includes(prefId) || q.tags.some((t) => refs.includes(t))),
  );
  if (pool.length < 2) {
    pool = pool.concat(quizzes.filter((q) => q.kind === 'sozai' && !pool.includes(q)));
  }
  return pool;
}

/** レシピ探索の出題: プールから2問 */
export function pickRecipeQuizzes(quizzes: Quiz[], recipe: Recipe, prefId: string, rng: Rng = Math.random): Quiz[] {
  return shuffle(recipeQuizPool(quizzes, recipe, prefId), rng).slice(0, 2);
}

/** 選択肢の表示順を毎回シャッフルする(answer は元 index のまま)。表示用の並び順 index 配列を返す */
export function shuffledChoiceOrder(quiz: Quiz, rng: Rng = Math.random): number[] {
  return shuffle(quiz.choices.map((_, i) => i), rng);
}

/* =====================================================
   クイズ出題プール選択(kaitaku / sozai / bunka の使い分け)
   GAME_SPEC「クイズ設計」の規律を実装:
   - 産地を問う問題(kaitaku)は開拓専用。育成・レシピには混ぜない
   - 出題は必ず「タップしたもの」に関係する問題のみ。
     無関係な問題での補充(フォールバック)はしない — プールが空なら出題自体をスキップする
   - 育成中のセッションクイズ = その素材にタグ一致する sozai のみ
   - レシピ探索 = そのレシピ or 材料にタグ一致する sozai/bunka のみ
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

/* ---------- 出題ローテーション(同じ問題ばかり 出さない) ---------- */

/** 最近の出題履歴に残す件数 */
export const QUIZ_RECENT_MAX = 12;

/**
 * 最近出した問題を避けて1問選ぶ。
 * 未出題を最優先(その中からランダム)。全部最近出したなら、いちばん昔に出したものを選ぶ
 */
export function pickFresh(pool: Quiz[], recent: readonly string[], rng: Rng = Math.random): Quiz | undefined {
  if (!pool.length) return undefined;
  // recent.indexOf: 未出題=-1 が最優先、出題済みは古い(index小)順。同順位はシャッフルでばらす
  return shuffle(pool, rng).sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id))[0];
}

/** 出題したことを履歴に記録する(古いものから押し出すローリング式)。保存は呼び出し側で行う */
export function recordQuizAsked(recent: string[], quizId: string): void {
  const i = recent.indexOf(quizId);
  if (i >= 0) recent.splice(i, 1);
  recent.push(quizId);
  while (recent.length > QUIZ_RECENT_MAX) recent.shift();
}

/** 開拓クイズ: 形or位置クイズの候補(その県のもののみ) */
export function kaitakuIdPool(quizzes: Quiz[], prefId: string): Quiz[] {
  return quizzes.filter((q) => (q.type === 'shape' || q.type === 'position') && q.tags.includes(prefId));
}

/** 開拓クイズ: 知識クイズの候補(kaitaku かつ形位置でないもの) */
export function kaitakuKnowledgePool(quizzes: Quiz[], prefId: string): Quiz[] {
  return quizzes.filter((q) => q.kind === 'kaitaku' && !q.type && q.tags.includes(prefId));
}

/**
 * 開拓の出題: 形/位置クイズを1問だけ(県名を直接当てる。
 * 不正解なら開拓失敗 → 何度でも再挑戦できる)。再挑戦のたびに別バリエーションが出やすい
 */
export function pickKaitakuQuiz(
  quizzes: Quiz[],
  prefId: string,
  recent: readonly string[] = [],
  rng: Rng = Math.random,
): Quiz | undefined {
  return pickFresh(kaitakuIdPool(quizzes, prefId), recent, rng);
}

/** 育成セッション用プール: その素材にタグ一致する sozai のみ(無関係な補充はしない) */
export function sessionQuizPool(quizzes: Quiz[], matId: string): Quiz[] {
  return quizzes.filter((q) => !q.type && q.kind === 'sozai' && q.tags.includes(matId));
}

/** 出題1問。プールが空なら undefined(呼び出し側はクイズをスキップする) */
export function pickSessionQuiz(
  quizzes: Quiz[],
  matId: string,
  recent: readonly string[] = [],
  rng: Rng = Math.random,
): Quiz | undefined {
  return pickFresh(sessionQuizPool(quizzes, matId), recent, rng);
}

/**
 * レシピ探索用プール: そのレシピ自身 or 材料の ref にタグ一致する sozai/bunka のみ。
 * 県タグだけの一致や、足りない時の無関係な補充はしない
 */
export function recipeQuizPool(quizzes: Quiz[], recipe: Recipe): Quiz[] {
  const refs = new Set<string>(recipe.ingredients.map((g) => g.ref).concat([recipe.id]));
  return quizzes.filter(
    (q) => !q.type && (q.kind === 'sozai' || q.kind === 'bunka') && q.tags.some((t) => refs.has(t)),
  );
}

/** レシピ探索の出題: 関係する問題から最大2問(未出題を優先。1問しか無ければ1問) */
export function pickRecipeQuizzes(
  quizzes: Quiz[],
  recipe: Recipe,
  recent: readonly string[] = [],
  rng: Rng = Math.random,
): Quiz[] {
  return shuffle(recipeQuizPool(quizzes, recipe), rng)
    .sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id))
    .slice(0, 2);
}

/** 選択肢の表示順を毎回シャッフルする(answer は元 index のまま)。表示用の並び順 index 配列を返す */
export function shuffledChoiceOrder(quiz: Quiz, rng: Rng = Math.random): number[] {
  return shuffle(quiz.choices.map((_, i) => i), rng);
}

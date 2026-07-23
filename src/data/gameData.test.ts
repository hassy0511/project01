/* データ整合性テスト: 参照切れ・全レシピ完成可能・トリビア網羅・
   「★3指定素材が infra(★2固定)でないこと」など。
   コンテンツ追記時の事故をここで検出する。 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  GAME_DATA,
  findEntity,
  findMaterial,
  findPref,
  findRecipe,
  findTrivia,
  type Ingredient,
  type Recipe,
} from './gameData';

const D = GAME_DATA;
const activeIds = new Set(D.prefectures.filter((p) => p.active).map((p) => p.id));

describe('参照整合性', () => {
  it('レシピの ingredient ref が全て存在する', () => {
    for (const r of D.recipes) {
      for (const ing of r.ingredients) {
        expect(findEntity(D, ing.ref), `${r.id} → ${ing.ref}`).toBeDefined();
      }
    }
  });

  it('レシピの pref・ingredient の origin 指定が実在の県', () => {
    for (const r of D.recipes) {
      expect(findPref(D, r.pref), `${r.id} pref`).toBeDefined();
      for (const ing of r.ingredients) {
        if (ing.origin) {
          expect(findPref(D, ing.origin), `${r.id} → ${ing.ref} origin`).toBeDefined();
          const m = findMaterial(D, ing.ref);
          expect(m, `${r.id}: origin指定はそざいのみ`).toBeDefined();
          expect(m!.origins, `${r.id}: ${ing.ref} は ${ing.origin} 産が存在しない`).toContain(ing.origin);
        }
      }
    }
  });

  it('アクティブ県の festivalId が実在の tier4 レシピを指す', () => {
    for (const p of D.prefectures.filter((x) => x.active)) {
      const fest = findRecipe(D, p.festivalId ?? '');
      expect(fest, `${p.id} festivalId`).toBeDefined();
      expect(fest!.tier).toBe(4);
      expect(fest!.pref).toBe(p.id);
    }
  });

  it('県の region が実在の地方を指し、アクティブ県の地方もアクティブ', () => {
    for (const p of D.prefectures) {
      const region = D.regions.find((r) => r.id === p.region);
      expect(region, `${p.id} region ${p.region}`).toBeDefined();
      if (p.active) expect(region!.active, `${p.id} は active だが地方 ${p.region} が inactive`).toBe(true);
    }
  });

  it('そざいの origins が全て実在の県', () => {
    for (const m of D.materials) {
      expect(m.origins.length, m.id).toBeGreaterThan(0);
      for (const o of m.origins) expect(findPref(D, o), `${m.id} origin ${o}`).toBeDefined();
    }
  });

  it('トリビアの target が全て実在する', () => {
    for (const t of D.trivia) {
      expect(findEntity(D, t.target), `trivia → ${t.target}`).toBeDefined();
    }
  });
});

describe('トリビア網羅', () => {
  it('全そざい・全レシピにトリビアがある', () => {
    for (const m of D.materials) expect(findTrivia(D, m.id), `trivia missing: ${m.id}`).toBeDefined();
    for (const r of D.recipes) expect(findTrivia(D, r.id), `trivia missing: ${r.id}`).toBeDefined();
  });
});

describe('レシピ完成可能性(アクティブ県内)', () => {
  /** ingredient が(再帰的に)アクティブ県だけで揃うか */
  const obtainable = (ing: Ingredient, seen: Set<string>): boolean => {
    const m = findMaterial(D, ing.ref);
    if (m) {
      if (ing.origin) return activeIds.has(ing.origin) && m.origins.includes(ing.origin);
      return m.origins.some((o) => activeIds.has(o));
    }
    const r = findRecipe(D, ing.ref);
    if (!r) return false;
    return recipeCompletable(r, seen);
  };
  const recipeCompletable = (r: Recipe, seen = new Set<string>()): boolean => {
    if (seen.has(r.id)) return false; // 循環参照はデータ不正
    seen.add(r.id);
    return activeIds.has(r.pref) && r.ingredients.every((ing) => obtainable(ing, seen));
  };

  it('全レシピがアクティブ県内で完成可能', () => {
    for (const r of D.recipes) {
      expect(recipeCompletable(r), `not completable: ${r.id}`).toBe(true);
    }
  });

  it('★3指定素材が infra(★2固定)でない', () => {
    for (const r of D.recipes) {
      for (const ing of r.ingredients) {
        if (!ing.quality || ing.quality < 3) continue;
        const m = findMaterial(D, ing.ref);
        expect(m, `${r.id}: ★指定はそざいのみ`).toBeDefined();
        expect(m!.gather.type, `${r.id}: ★3指定の ${ing.ref} が infra`).not.toBe('infra');
      }
    }
  });
});

describe('クイズデータ', () => {
  it('選択肢は3つ・answer は有効 index・id 重複なし', () => {
    const ids = new Set<string>();
    for (const q of D.quizzes) {
      expect(q.choices, q.id).toHaveLength(3);
      expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
      expect(q.answer, q.id).toBeLessThan(q.choices.length);
      expect(ids.has(q.id), `duplicate quiz id: ${q.id}`).toBe(false);
      ids.add(q.id);
    }
  });

  it('形・位置クイズは kaitaku のみ', () => {
    for (const q of D.quizzes) {
      if (q.type) expect(q.kind, q.id).toBe('kaitaku');
    }
  });

  it('アクティブ各県に 形クイズ・位置クイズが1問以上', () => {
    for (const pid of activeIds) {
      expect(D.quizzes.some((q) => q.type === 'shape' && q.tags.includes(pid)), `shape: ${pid}`).toBe(true);
      expect(D.quizzes.some((q) => q.type === 'position' && q.tags.includes(pid)), `position: ${pid}`).toBe(true);
    }
  });
});

describe('おまつり(tier4)', () => {
  it('implemented なら 屋台メニューが2品以上で、ref が全て解決できる', () => {
    for (const r of D.recipes.filter((x) => x.tier === 4)) {
      expect(r.implemented, `${r.id} implemented undefined`).toBeDefined();
      if (!r.implemented) continue;
      const refs = r.menu ?? r.ingredients.map((i) => i.ref);
      expect(refs.length, `${r.id}: 屋台が少なすぎる`).toBeGreaterThanOrEqual(2);
      for (const ref of refs) {
        expect(findEntity(D, ref), `${r.id} menu → ${ref}`).toBeDefined();
      }
    }
  });

  it('menu の しなものは その県の めいぶつ・そざい(よその県のものを 屋台に 並べない)', () => {
    for (const r of D.recipes.filter((x) => x.tier === 4 && x.menu)) {
      for (const ref of r.menu!) {
        const rec = findRecipe(D, ref);
        const mat = findMaterial(D, ref);
        const ok = rec ? rec.pref === r.pref : (mat?.origins.includes(r.pref) ?? false);
        expect(ok, `${r.id} menu → ${ref} は ${r.pref} の しなものではない`).toBe(true);
      }
    }
  });
});

describe('地図アセット(public/assets/regions-gen.json)', () => {
  it('全地方に実形シルエットとラベルがある', () => {
    const gen = JSON.parse(readFileSync('public/assets/regions-gen.json', 'utf8')) as {
      viewBox: string;
      regions: Record<string, string[]>;
      labels: Record<string, [number, number]>;
    };
    expect(gen.viewBox).toBeTruthy();
    for (const r of D.regions) {
      expect(gen.regions[r.id]?.length ?? 0, `region shape: ${r.id}`).toBeGreaterThan(0);
      expect(gen.labels[r.id], `region label: ${r.id}`).toBeTruthy();
    }
  });
});

describe('地図アセット(地方ごとの県形マップ)', () => {
  it('アクティブ地方に mapFile があり、その地方の全県のパス・ラベル・bbox が揃っている', () => {
    for (const region of D.regions.filter((r) => r.active)) {
      expect(region.mapFile, `mapFile: ${region.id}`).toBeTruthy();
      const mapGen = JSON.parse(readFileSync(`public/assets/${region.mapFile}`, 'utf8')) as {
        viewBox: string;
        paths: Record<string, string>;
        labels: Record<string, [number, number]>;
        boxes: Record<string, string>;
      };
      expect(mapGen.viewBox, region.id).toBeTruthy();
      for (const p of D.prefectures.filter((x) => x.region === region.id)) {
        expect(mapGen.paths[p.id], `path: ${p.id}`).toBeTruthy();
        expect(mapGen.labels[p.id], `label: ${p.id}`).toBeTruthy();
        if (p.active) expect(mapGen.boxes[p.id], `box: ${p.id}`).toBeTruthy();
      }
    }
  });
});

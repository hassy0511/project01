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

/* 県ごとの あそべる量は「全県 ぴったり おなじ数」に そろえる。
   少なすぎる県(すかすか)も、多すぎる県(先に作った いばらき)も どちらも だめ。
   ねらいは 数のバランスだけ。中身は 県ごとに ちがってよい ―
   むしろ そざいの かぶりは 県の個性を うすめるので、
   「その県だけの そざい」が1つ以上あることも 条件にする。
   みず(いど)のような 共通そざいを 全県に置くことは しない(地方に1つの めいすいの さと)。
   ここを増やすときは 全県ぶん 足すこと(docs/ADD_PREF_CHECKLIST.md) */
const QUOTA = { materials: 5, tier2: 3, tier3: 2, fest: 1 };
const FLOOR = { engines: 4, uniqueMaterials: 1 };

describe('県ごとの ボリューム(全県そろえる)', () => {
  const activePrefs = D.prefectures.filter((p) => p.active);
  /** その県で あそべる アーケード種別(infra=いど収集ふくむ) */
  const enginesOf = (prefId: string): Set<string> => {
    const set = new Set<string>();
    for (const m of D.materials) {
      if (!m.origins.includes(prefId)) continue;
      const g = m.gather;
      set.add(g.type === 'plant' ? g.harvest.engine : g.type === 'dig' ? 'mine' : g.type === 'timing' ? 'fish' : 'infra');
    }
    return set;
  };

  it.each(activePrefs.map((p) => [p.name, p.id]))('%s: そざい/レシピの数が 全県そろっている', (_name, prefId) => {
    const mats = D.materials.filter((m) => m.origins.includes(prefId));
    const recipes = D.recipes.filter((r) => r.pref === prefId);
    expect(mats.length, `そざい数(いま: ${mats.map((m) => m.name).join('・')})`).toBe(QUOTA.materials);
    expect(recipes.filter((r) => r.tier === 2).length, 'tier2 レシピ数').toBe(QUOTA.tier2);
    expect(recipes.filter((r) => r.tier === 3).length, 'tier3 レシピ数').toBe(QUOTA.tier3);
    expect(recipes.filter((r) => r.tier === 4).length, 'おまつり数').toBe(QUOTA.fest);
    expect(enginesOf(prefId).size, 'あそびの種類').toBeGreaterThanOrEqual(FLOOR.engines);
    // その県だけの そざい(= 県の個性)
    const only = mats.filter((m) => m.origins.length === 1);
    expect(only.length, `その県だけの そざい(いま: ${only.map((m) => m.name).join('・') || 'なし'})`).toBeGreaterThanOrEqual(
      FLOOR.uniqueMaterials,
    );
  });

  it('みず(いど)は 地方に1つの「めいすいの さと」だけ(全県に置かない)', () => {
    const water = D.materials.find((m) => m.id === 'm01');
    expect(water).toBeDefined();
    const byRegion = new Map<string, string[]>();
    for (const pid of water!.origins) {
      const region = findPref(D, pid)?.region ?? '?';
      byRegion.set(region, [...(byRegion.get(region) ?? []), pid]);
    }
    // 各地方に 1県だけ(0県だと その地方で みずを つかう めいぶつが つくれない)
    for (const region of D.regions.filter((r) => r.active)) {
      expect(byRegion.get(region.id)?.length ?? 0, `${region.id} の めいすいの さと`).toBe(1);
    }
  });

  it('おまつりの ゲーム種別は 県ごとに ユニーク(47県すべて別のあそび)', () => {
    const seen = new Map<string, string>();
    for (const r of D.recipes.filter((x) => x.tier === 4 && x.implemented)) {
      const kind = r.festGame ?? 'yatai';
      expect(seen.has(kind), `${kind} が ${seen.get(kind)} と ${r.id} で重複`).toBe(false);
      seen.set(kind, r.id);
    }
  });
});

describe('そざいの あそび方が 実物と あっているか', () => {
  /** つるして そだてる貝・かご漁の いきもの は「釣りざお」ゲームにしない
      (2026-07: かき・ほたてが 魚釣りゲームになっていた不整合の再発防止) */
  const CAGE_GROWN = ['🦪', '🐚', '🦀'];

  it('貝・かに(つるす/かご漁)は fish(釣りざお)ではなく shell(ひきあげ)', () => {
    for (const m of D.materials) {
      if (!CAGE_GROWN.includes(m.emoji)) continue;
      const g = m.gather;
      expect(g.type, `${m.name}: 釣りざお(timing)ではなく いかだ/かご(plant)`).toBe('plant');
      if (g.type === 'plant') {
        expect(g.harvest.engine, `${m.name} の あそび方`).toBe('shell');
      }
    }
  });

  it('shell エンジンの そざいは いかだ/かごの よびなを もつ', () => {
    for (const m of D.materials) {
      const g = m.gather;
      if (g.type !== 'plant' || g.harvest.engine !== 'shell') continue;
      expect(g.fieldLabel, `${m.name} の fieldLabel`).toBeTruthy();
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

import { describe, expect, it } from 'vitest';
import { GAME_DATA as D, findPref } from '../data/gameData';
import { defaultState } from './state';
import {
  allToolEngines,
  applyToolCraft,
  findToolRecipe,
  recordToolUse,
  TOOL_ASSIST_LV2,
  TOOL_ASSIST_LV3,
  TOOL_ASSIST_MAX,
  toolAssist,
  toolLevel,
} from './tools';

describe('どうぐの ロジック', () => {
  it('もっていなければ Lv1・のびは 0', () => {
    const s = defaultState();
    expect(toolLevel(s, 'reap')).toBe(1);
    expect(toolAssist(s, 'reap')).toBe(0);
  });

  it('Lv2/Lv3 で のびる。上限は こえない', () => {
    const s = defaultState();
    s.tools.reap = 2;
    expect(toolAssist(s, 'reap')).toBe(TOOL_ASSIST_LV2);
    s.tools.reap = 3;
    expect(toolAssist(s, 'reap')).toBe(TOOL_ASSIST_LV3);
    expect(TOOL_ASSIST_LV2).toBeLessThanOrEqual(TOOL_ASSIST_MAX);
    expect(TOOL_ASSIST_LV3).toBeLessThanOrEqual(TOOL_ASSIST_MAX);
  });

  it('どうぐレシピを 作ると レベルが 上がる(下がりは しない)', () => {
    const s = defaultState();
    const r = findToolRecipe(D, 'reap');
    expect(r).toBeDefined();
    applyToolCraft(s, r!);
    expect(toolLevel(s, 'reap')).toBe(2);
    s.tools.reap = 3;
    applyToolCraft(s, r!); // Lv2 レシピを もう一度 作っても 3 の まま
    expect(toolLevel(s, 'reap')).toBe(3);
  });

  it('つかいこみは どうぐの ある あそびだけ 数える', () => {
    const s = defaultState();
    recordToolUse(D, s, 'reap');
    recordToolUse(D, s, 'reap');
    recordToolUse(D, s, 'fest'); // おまつりに どうぐは ない
    expect(s.toolUse.reap).toBe(2);
    expect(s.toolUse.fest).toBeUndefined();
  });
});

describe('どうぐの データ', () => {
  const tools = D.recipes.filter((r) => r.type === 'dougu');

  it('どうぐは 11エンジン × Lv2/Lv3 で、レベルごとに エンジンの 重複が ない', () => {
    for (const level of [2, 3] as const) {
      const lv = tools.filter((r) => r.tool?.level === level);
      expect(lv.length, `Lv${level}`).toBe(11);
      expect(new Set(lv.map((r) => r.tool?.engine)).size, `Lv${level}`).toBe(lv.length);
    }
    for (const r of tools) expect(r.tool, `${r.id}: type dougu なのに tool が ない`).toBeDefined();
    // Lv3 は Lv2 と 同じ 県で 作る(その 工芸の 里で きわめる)
    for (const r3 of tools.filter((r) => r.tool?.level === 3)) {
      const r2 = tools.find((r) => r.tool?.level === 2 && r.tool.engine === r3.tool?.engine);
      expect(r2?.pref, r3.id).toBe(r3.pref);
    }
  });

  it('どうぐは アクティブな 県で 作れる', () => {
    for (const r of tools) {
      expect(findPref(D, r.pref)?.active, `${r.id} の 県 ${r.pref}`).toBe(true);
    }
  });

  it('type が dougu でない レシピに tool は 付かない', () => {
    for (const r of D.recipes) {
      if (r.type !== 'dougu') expect(r.tool, `${r.id}`).toBeUndefined();
    }
  });

  it('allToolEngines は エンジンの 種類の 数(レベルは べつ)', () => {
    expect(allToolEngines(D).length).toBe(11);
  });

  it('どうぐの 材料そざい(dougu)は 複数の 県で とれる(1県こわれても 詰まない)', () => {
    for (const m of D.materials.filter((x) => x.dougu)) {
      expect(m.origins.length, m.id).toBeGreaterThanOrEqual(2);
    }
  });
});

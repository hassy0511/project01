/* ゆびマーク(あそびかたの 実演)データの 整合性テスト。
   ねらい:
   1. しゅうかくゲームに ぜんぶ ゆびマークが ある(新しい エンジンを 足したら ここで 落ちる)
   2. ざひょうが ゲームの area の 中に ある(画面の 外を さす ゆびを ふせぐ)
   3. tapTarget/dragTarget の 名まえが ほんとうに setName されている(つづり違いの 検出) */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAME_AREA_H, GAME_W } from '../ui/theme';
import { GAME_DATA } from './gameData';
import { HOW_TO, type HowTo, type Pt } from './howto';

/** データから 「そざいを とる ときに つかう エンジン」を 集める(ベタ書きしない) */
const harvestEngines = (): string[] => {
  const out = new Set<string>(['care']); // おせわチャンスは どの そざいにも つく
  for (const m of GAME_DATA.materials) {
    const g = m.gather;
    if (g.type === 'plant') out.add(g.harvest.engine);
    else if (g.type === 'dig') out.add('mine');
    else if (g.type === 'timing') out.add('fish');
  }
  return [...out].sort();
};

/** ミニゲームの ソースに 書いてある setName('mg-…') の 名まえ ぜんぶ */
const declaredNames = (): Set<string> => {
  const dir = 'src/scenes/minigames';
  const out = new Set<string>();
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.ts')) continue;
    const src = readFileSync(join(dir, f), 'utf8');
    for (const m of src.matchAll(/setName\('([^']+)'\)/g)) out.add(m[1]);
  }
  return out;
};

/** その しぐさが つかう ざひょう ぜんぶ */
const pointsOf = (h: HowTo): Pt[] => {
  switch (h.kind) {
    case 'tap':
      return [...h.at];
    case 'alternate':
      return [...h.at];
    case 'drag':
      return [h.from, h.to];
    case 'hold':
    case 'swipe':
      return [h.at];
    case 'circle':
      return [h.at, [h.at[0] - h.r, h.at[1] - h.r], [h.at[0] + h.r, h.at[1] + h.r]];
    default:
      return []; // tapTarget / dragTarget は じっさいの ものの ばしょを つかう
  }
};

describe('ゆびマーク(HOW_TO)', () => {
  it('しゅうかくゲームには ぜんぶ ゆびマークが ある', () => {
    for (const e of harvestEngines()) {
      expect(HOW_TO[e], `エンジン「${e}」の ゆびマークが ない`).toBeTruthy();
    }
  });

  it('ざひょうは ゲームの area の 中に ある', () => {
    for (const [key, h] of Object.entries(HOW_TO)) {
      for (const [x, y] of pointsOf(h)) {
        expect(x, `${key} の x`).toBeGreaterThanOrEqual(0);
        expect(x, `${key} の x`).toBeLessThanOrEqual(GAME_W);
        expect(y, `${key} の y`).toBeGreaterThanOrEqual(0);
        expect(y, `${key} の y`).toBeLessThanOrEqual(GAME_AREA_H);
      }
    }
  });

  it('うごく ものを さす ときの 名まえは ほんとうに ある', () => {
    const names = declaredNames();
    for (const [key, h] of Object.entries(HOW_TO)) {
      if (h.kind !== 'tapTarget' && h.kind !== 'dragTarget') continue;
      expect(names.has(h.name), `${key} の 名まえ「${h.name}」は setName されていない`).toBe(true);
    }
  });

  it('おなじ しぐさの ていぎが 2つ ない(キーの 重なり)', () => {
    const keys = Object.keys(HOW_TO);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

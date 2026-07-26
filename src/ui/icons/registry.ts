/* かたちの 台帳。Phaser の 実行時 依存を もたない ので、
   node の テスト(vitest)からも そのまま 読める(絵文字検出・つづり検査に つかう) */
import type { IconDraw } from './kit';
import { FOOD_ICONS } from './food';
import { ACTOR_ICONS } from './actors';
import { NATURE_ICONS } from './nature';
import { PROP_ICONS } from './props';
import { UI_ICONS } from './ui';

export const DRAW: Record<string, IconDraw> = {
  ...FOOD_ICONS,
  ...ACTOR_ICONS,
  ...NATURE_ICONS,
  ...PROP_ICONS,
  ...UI_ICONS,
};

/** かたちの 名前 一覧(開発用の 一覧ページ・テストで つかう) */
export function allShapes(): string[] {
  return Object.keys(DRAW).sort();
}

/** そのかたちが あるか(データ整合性テスト用) */
export function hasShape(name: string): boolean {
  return Boolean(DRAW[name]);
}

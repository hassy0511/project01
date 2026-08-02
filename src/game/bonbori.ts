/* ぼんぼりの めやすを ゲームデータ(ARCADE_TUNING)から 引く 薄い ラッパ。
   core/bonbori.ts は データの かたちを 知らない ように して あるので、
   「レシピ → エンジン名 → めやす」の 変換は ここに おく */
import { ARCADE_TUNING, type ArcadeEngine } from '../data/arcadeTuning';
import { GAME_DATA, type Recipe } from '../data/gameData';
import { store } from './store';
import {
  bonboriRank,
  goldCount,
  isAllGold,
  rankThresholds,
  type BonboriRank,
  type RankThresholds,
} from '../core/bonbori';

/** おまつりレシピ → アーケードの エンジン名(yatai は 'fest') */
export function festEngineOf(r: Recipe): ArcadeEngine {
  const kind = r.festGame ?? 'yatai';
  return (kind === 'yatai' ? 'fest' : kind) as ArcadeEngine;
}

export function thresholdsOf(r: Recipe): RankThresholds {
  return rankThresholds(ARCADE_TUNING[festEngineOf(r)]);
}

/** その おまつりの いまの ぼんぼり */
export function rankOf(r: Recipe): BonboriRank {
  return bonboriRank(store.state.festBest[r.id], thresholdsOf(r));
}

export const currentGoldCount = (): number => goldCount(store.state, GAME_DATA, thresholdsOf);
export const currentAllGold = (): boolean => isAllGold(store.state, GAME_DATA, thresholdsOf);

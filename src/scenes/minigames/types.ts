/* 各ミニゲームが SessionScene から受け取る足場。
   スコア加算・ステップ進行・演出テキストは SessionScene 側の実装を呼ぶだけにして、
   ミニゲーム自体は「その場の遊び」だけに専念できるようにする */
import Phaser from 'phaser';

export interface MinigameApi {
  scene: Phaser.Scene;
  /** GAME_AREA_Y だけ下にオフセットされたコンテナ。子はローカル座標で追加する */
  area: Phaser.GameObjects.Container;
  /** area のオフセット量。effects.ts 等の絶対座標系APIに座標を渡すとき x, y + areaY とする */
  areaY: number;
  addScore: (n: number) => void;
  advance: (delayMs: number) => void;
  feedback: (text: string, good: boolean) => void;
  sign: (text: string) => void;
  /** ゲーム固有の★3条件(例: フィッシングの「ぬし」)を満たしていない時に true を渡す */
  lockStar3: (locked: boolean) => void;
}

/* テスト・デバッグ用フック(v0.4 の window.__mq 相当)。
   自動プレイテストがミニゲームの内部状態(スコア・残り時間・正解)を読むために使う */

export type MqHook =
  | { kind: 'quiz'; correctText: string; choices: string[] }
  | { kind: 'arcade'; engine: string; score: number; secLeft: number }
  | { kind: 'done' };

declare global {
  interface Window {
    __mq?: MqHook;
  }
}

export function setHook(hook: MqHook): void {
  window.__mq = hook;
}

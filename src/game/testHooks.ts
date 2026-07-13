/* テスト・デバッグ用フック(v0.4 の window.__mq 相当)。
   自動プレイテストがミニゲームの内部状態(正解・光ったマス等)を読むために使う */

export type MqHook =
  | { kind: 'quiz'; correctText: string; choices: string[] }
  | { kind: 'dig'; hits: number; needed: number }
  | { kind: 'pluck'; remaining: number }
  | { kind: 'timing'; pos: number }
  | { kind: 'reel'; progress: number; target: number }
  | { kind: 'shake'; progress: number }
  | { kind: 'whack'; active: boolean }
  | { kind: 'done' };

declare global {
  interface Window {
    __mq?: MqHook;
  }
}

export function setHook(hook: MqHook): void {
  window.__mq = hook;
}

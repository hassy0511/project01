import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { StoryScene } from './scenes/StoryScene';
import { RegionScene } from './scenes/RegionScene';
import { MapScene } from './scenes/MapScene';
import { PrefScene } from './scenes/PrefScene';
import { SessionScene } from './scenes/SessionScene';
import { FestivalScene } from './scenes/FestivalScene';
import { ZukanScene } from './scenes/ZukanScene';
import { InvScene } from './scenes/InvScene';
import { GAME_H, GAME_W } from './ui/theme';
import { DPR, installHiDpiText } from './ui/display';
import { resumeAudio } from './audio/sfx';
import { startBgm } from './audio/bgm';

// HiDPI: バッファは DPR 倍で確保し、各シーンのカメラズームで論理480×800を保つ(ui/display.ts)
installHiDpiText();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_W * DPR,
  height: GAME_H * DPR,
  backgroundColor: '#f2f7e8',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // おとは じぶんで WebAudio 合成しているので、Phaser 側の サウンドは つかわない
  // (AudioContext が 2つ できると iOS で とりあいに なる)
  audio: { noAudio: true },
  // ★ゆびを 2本 つかう ゲームが ある(ひだり・みぎの たいこを 同時に たたく など)。
  //   Phaser の 既定は タッチ1本なので、指定しないと 2本目が とどかず
  //   「同時に たたけない」= 遊びとして 成立しない 状態に なる。
  //   3 = ゆび2本 + よゆう1(はなす とちゅうに つぎを おいた とき とりこぼさない)
  input: { activePointers: 3 },
  scene: [BootScene, StoryScene, RegionScene, MapScene, PrefScene, SessionScene, FestivalScene, ZukanScene, InvScene],
};

const game = new Phaser.Game(config);

// テスト・デバッグ用フック(v0.4 の window.__mq 相当)
declare global {
  interface Window {
    __game?: Phaser.Game;
  }
}
window.__game = game;

/* iOS Safari の AudioContext 制約への 対策。
   - pointerdown だけでは「ユーザー操作」と みなされない ことが あるので touchend/click も 見る
   - 画面に もどってきた とき(visibilitychange)も 中断からの 復帰を 試す
   すでに 起動ずみなら 何も しない(何回 呼んでも 安全) */
const kickAudio = (): void => {
  resumeAudio();
  startBgm();
};
for (const ev of ['pointerdown', 'touchend', 'click', 'keydown'] as const) {
  document.addEventListener(ev, kickAudio, { passive: true });
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) kickAudio();
});
window.addEventListener('focus', kickAudio);

// オフライン対応: 一度開けば、電波が無い場所でもホーム画面から起動できるようにする
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  });
}

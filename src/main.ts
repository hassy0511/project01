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
import { resumeAudio } from './audio/sfx';
import { startBgm } from './audio/bgm';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#f2f7e8',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
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

// iOS Safari の AudioContext 制約: タップのたびに resume と BGM 開始を試みる
// (初回タップが AudioContext の起動に失敗しても、次のタップで立ち上がる。起動済みなら何もしない)
document.addEventListener('pointerdown', () => {
  resumeAudio();
  startBgm();
});

// オフライン対応: 一度開けば、電波が無い場所でもホーム画面から起動できるようにする
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  });
}

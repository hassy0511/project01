import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
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
  scene: [BootScene, RegionScene, MapScene, PrefScene, SessionScene, FestivalScene, ZukanScene, InvScene],
};

const game = new Phaser.Game(config);

// テスト・デバッグ用フック(v0.4 の window.__mq 相当)
declare global {
  interface Window {
    __game?: Phaser.Game;
  }
}
window.__game = game;

// iOS Safari の AudioContext 制約: 初回タップで resume し、BGM も始める
document.addEventListener(
  'pointerdown',
  () => {
    resumeAudio();
    startBgm();
  },
  { once: true },
);

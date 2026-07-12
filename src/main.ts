import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MapScene } from './scenes/MapScene';
import { PrefScene } from './scenes/PrefScene';
import { SessionScene } from './scenes/SessionScene';
import { ZukanScene } from './scenes/ZukanScene';
import { InvScene } from './scenes/InvScene';
import { GAME_H, GAME_W } from './ui/theme';
import { resumeAudio } from './audio/sfx';

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
  scene: [BootScene, MapScene, PrefScene, SessionScene, ZukanScene, InvScene],
};

const game = new Phaser.Game(config);

// テスト・デバッグ用フック(v0.4 の window.__mq 相当)
declare global {
  interface Window {
    __game?: Phaser.Game;
  }
}
window.__game = game;

// iOS Safari の AudioContext 制約: 初回タップで resume する
document.addEventListener('pointerdown', () => resumeAudio(), { once: true });

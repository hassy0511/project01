import Phaser from 'phaser';
import { TITLE_TEXT } from '../data/uiText';

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#8fd3f4');
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, TITLE_TEXT, {
        fontSize: '48px',
        color: '#2d3a2e',
      })
      .setOrigin(0.5);
  }
}

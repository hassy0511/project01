/* ほりあてゲーム(ねんど・いもほり): 記憶して当てる骨格は残しつつ、
   平らな四角のマス目を「土のマウンド+クワのカーソル+崩れる演出」に作り直した */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { floatUp, missShake, soilPuff } from '../../ui/effects';
import { setHook } from '../../game/testHooks';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import type { MinigameApi } from './types';

const SIZE = 96;
const GAP = 10;
const HINT_MS = 900;

export function renderDig(api: MinigameApi, prompt: string, targetEmoji: string): void {
  const { scene, area } = api;
  api.sign(prompt);

  const cell = Math.floor(Math.random() * 9);
  setHook({ kind: 'dig', cell });
  const originX = GAME_W / 2 - (SIZE * 3 + GAP * 2) / 2 + SIZE / 2;
  const originY = 120;
  let answered = false;
  let hintOn = true;
  let hintTween: Phaser.Tweens.Tween | undefined;
  const cells: { label: Phaser.GameObjects.Text; x: number; y: number }[] = [];

  const shovel = scene.add.text(originX, originY - SIZE, '⛏️', { fontSize: '30px' }).setOrigin(0.5, 1).setAlpha(0.85);
  area.add(shovel);
  scene.tweens.add({ targets: shovel, angle: { from: -12, to: 12 }, duration: 500, yoyo: true, repeat: -1 });

  for (let i = 0; i < 9; i++) {
    const cx = originX + (i % 3) * (SIZE + GAP);
    const cy = originY + Math.floor(i / 3) * (SIZE + GAP);
    const c = scene.add.container(cx, cy);
    const bg = scene.add.graphics();
    bg.fillGradientStyle(0xe4cf9f, 0xe4cf9f, 0xc7a86e, 0xc7a86e, 1);
    bg.fillRoundedRect(-SIZE / 2, -SIZE / 2, SIZE, SIZE, 14);
    bg.lineStyle(2, 0xb0895a, 0.7);
    bg.strokeRoundedRect(-SIZE / 2, -SIZE / 2, SIZE, SIZE, 14);
    bg.lineStyle(1.5, 0xb0895a, 0.35);
    bg.lineBetween(-SIZE / 4, -SIZE / 3, -SIZE / 8, 4);
    bg.lineBetween(SIZE / 6, SIZE / 4, SIZE / 3, -SIZE / 8);
    const label = scene.add.text(0, 0, i === cell ? '✨' : '', { fontSize: '34px' }).setOrigin(0.5);
    c.add([bg, label]);
    c.setSize(SIZE, SIZE);
    c.setInteractive({ useHandCursor: true });
    if (i === cell) {
      hintTween = scene.tweens.add({
        targets: label,
        scale: { from: 1, to: 1.3 },
        alpha: { from: 1, to: 0.6 },
        yoyo: true,
        repeat: -1,
        duration: 350,
      });
    }
    const moveShovel = (): void => {
      shovel.setPosition(cx, cy - SIZE / 2 - 6);
    };
    c.on('pointerover', moveShovel);
    c.on('pointerdown', moveShovel);
    c.on('pointerup', () => {
      if (answered || hintOn) return;
      answered = true;
      const ok = i === cell;
      soilPuff(scene, cx, cy + api.areaY);
      if (ok) {
        label.setText(targetEmoji);
        label.setScale(0);
        scene.tweens.add({ targets: label, scale: 1, ease: 'Back.easeOut', duration: 280 });
        floatUp(scene, cx, cy + api.areaY - 40, '+1');
        api.addScore(1);
        SFX.good();
      } else {
        label.setText('🕳️');
        const correct = cells[cell];
        correct.label.setText(targetEmoji);
        correct.label.setScale(0);
        scene.tweens.add({ targets: correct.label, scale: 1, ease: 'Back.easeOut', duration: 280 });
        api.feedback(UI_TEXT.session.digHere, false);
        missShake(scene);
        SFX.bad();
      }
      api.advance(ok ? 750 : 1400);
    });
    cells.push({ label, x: cx, y: cy });
    area.add(c);
  }
  scene.time.delayedCall(HINT_MS, () => {
    hintOn = false;
    hintTween?.stop();
    cells[cell].label.setText('');
  });
}

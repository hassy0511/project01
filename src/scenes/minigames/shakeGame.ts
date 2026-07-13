/* ゆさぶり収穫(shake): 木を左右にドラッグしてゆさぶり、実を落として集める。
   うめ・なし などの木の実に使う。「ゆさぶる→落ちる→集める」の2段階の手応え */
import Phaser from 'phaser';
import { harvestSpeedPoints } from '../../core/stars';
import { SFX } from '../../audio/sfx';
import { burst, floatUp } from '../../ui/effects';
import { setHook } from '../../game/testHooks';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import type { MinigameApi } from './types';

const SHAKE_GOAL = 460;
const TREE_Y = 130;

export function renderShake(api: MinigameApi, target: string, prompt: string, count: number): void {
  const { scene, area } = api;
  api.sign(prompt);

  const tree = scene.add.text(GAME_W / 2, TREE_Y, '🌳', { fontSize: '90px' }).setOrigin(0.5);
  area.add(tree);

  const fruitSpots: Phaser.GameObjects.Text[] = [];
  for (let i = 0; i < count; i++) {
    const angle = -70 + (i / Math.max(1, count - 1)) * 140;
    const r = 55;
    const fx = GAME_W / 2 + Math.cos((angle * Math.PI) / 180) * r;
    const fy = TREE_Y - 20 + Math.sin((angle * Math.PI) / 180) * r * 0.6;
    const f = scene.add.text(fx, fy, target, { fontSize: '26px' }).setOrigin(0.5);
    area.add(f);
    fruitSpots.push(f);
  }

  const gaugeBg = scene.add.graphics();
  gaugeBg.fillStyle(0xe6e0d0, 1);
  gaugeBg.fillRoundedRect(GAME_W / 2 - 110, 230, 220, 20, 10);
  area.add(gaugeBg);
  const gaugeFill = scene.add.graphics();
  area.add(gaugeFill);
  const drawGauge = (ratio: number): void => {
    gaugeFill.clear();
    gaugeFill.fillStyle(0x8ed46f, 1);
    gaugeFill.fillRoundedRect(GAME_W / 2 - 110, 230, 220 * Phaser.Math.Clamp(ratio, 0, 1), 20, 10);
  };
  drawGauge(0);
  const hintText = scene.add
    .text(GAME_W / 2, 268, UI_TEXT.session.shakeHint, { fontFamily: 'sans-serif', fontSize: '14px', color: '#8a7a62' })
    .setOrigin(0.5);
  area.add(hintText);

  let shakeAmount = 0;
  let dropped = false;
  let lastX: number | null = null;
  const t0 = Date.now();
  setHook({ kind: 'shake', progress: 0 });

  const onMove = (p: Phaser.Input.Pointer): void => {
    if (dropped || !p.isDown) {
      lastX = null;
      return;
    }
    if (lastX !== null) {
      shakeAmount += Math.abs(p.x - lastX);
      const ratio = shakeAmount / SHAKE_GOAL;
      tree.setAngle(Math.sin(shakeAmount / 18) * 7);
      drawGauge(ratio);
      setHook({ kind: 'shake', progress: ratio });
      if (shakeAmount >= SHAKE_GOAL) {
        dropped = true;
        dropFruits();
      }
    }
    lastX = p.x;
  };
  const onUp = (): void => {
    lastX = null;
    if (!dropped) tree.setAngle(0);
  };
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);
  const cleanupShakeListeners = (): void => {
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupShakeListeners);

  const dropFruits = (): void => {
    cleanupShakeListeners();
    hintText.destroy();
    gaugeBg.destroy();
    gaugeFill.destroy();
    SFX.pop();
    scene.cameras.main.shake(160, 0.006);
    burst(scene, tree.x, tree.y + api.areaY, 12);

    const basket = scene.add.text(GAME_W / 2, 300, '🧺', { fontSize: '52px' }).setOrigin(0.5);
    area.add(basket);
    const countText = scene.add
      .text(GAME_W / 2, 336, `0/${count}`, {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#4a3b2a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    area.add(countText);

    let collected = 0;
    setHook({ kind: 'pluck', remaining: count });
    fruitSpots.forEach((f, i) => {
      const landX = 50 + Math.random() * (GAME_W - 100);
      const landY = 190 + Math.random() * 40;
      scene.tweens.add({
        targets: f,
        x: landX,
        y: landY,
        duration: 420 + Math.random() * 160,
        delay: i * 60,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          if (f.active) f.setInteractive({ useHandCursor: true });
        },
      });
      f.on('pointerup', () => {
        if (!f.active || !f.input?.enabled) return;
        f.disableInteractive();
        SFX.pop();
        burst(scene, f.x, f.y + api.areaY, 6);
        scene.tweens.add({
          targets: f,
          x: basket.x,
          y: basket.y,
          scale: 0.2,
          alpha: 0.5,
          duration: 260,
          ease: 'Cubic.easeIn',
          onComplete: () => f.destroy(),
        });
        floatUp(scene, f.x, f.y + api.areaY - 18, '+1');
        collected++;
        setHook({ kind: 'pluck', remaining: count - collected });
        countText.setText(`${collected}/${count}`);
        scene.tweens.add({ targets: countText, scale: { from: 1.35, to: 1 }, duration: 200, ease: 'Back.easeOut' });

        if (collected === count) {
          const pts = harvestSpeedPoints(Date.now() - t0);
          api.addScore(pts);
          api.feedback(pts === 2 ? UI_TEXT.session.pluckFast : UI_TEXT.session.pluckDone, true);
          api.advance(800);
        }
      });
    });
  };
}

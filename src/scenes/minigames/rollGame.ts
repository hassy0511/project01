/* ころがし収穫(roll): おもい実を つかんで かごまで ドラッグする。
   メロン・ゆうがお など重量感のある実に使う。ドラッグ中はごろごろ回転させて
   「おもいものを運んでいる」手応えを出す */
import Phaser from 'phaser';
import { harvestSpeedPoints } from '../../core/stars';
import { SFX } from '../../audio/sfx';
import { burst, floatUp } from '../../ui/effects';
import { setHook } from '../../game/testHooks';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import type { MinigameApi } from './types';

const BASKET_Y = 300;
const DROP_RADIUS = 64;

export function renderRoll(api: MinigameApi, target: string, prompt: string, count: number): void {
  const { scene, area } = api;
  api.sign(prompt);

  const basket = scene.add.text(GAME_W / 2, BASKET_Y, '🧺', { fontSize: '58px' }).setOrigin(0.5);
  const countText = scene.add
    .text(GAME_W / 2, BASKET_Y + 40, `0/${count}`, {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      color: '#4a3b2a',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  area.add([basket, countText]);

  let delivered = 0;
  const t0 = Date.now();
  setHook({ kind: 'pluck', remaining: count });

  for (let i = 0; i < count; i++) {
    const x = 60 + (i / Math.max(1, count - 1)) * (GAME_W - 120);
    const y = 90 + Math.random() * 70;
    const fruit = scene.add
      .text(x, y, target, { fontSize: '46px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true, draggable: true });
    area.add(fruit);

    let angleAccum = 0;
    fruit.on('drag', (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      angleAccum += (dragX - fruit.x) * 4;
      fruit.setAngle(angleAccum);
      fruit.setPosition(dragX, dragY);
    });
    fruit.on('dragend', () => {
      const dist = Phaser.Math.Distance.Between(fruit.x, fruit.y, basket.x, basket.y);
      if (dist >= DROP_RADIUS) return;
      fruit.disableInteractive();
      SFX.pop();
      burst(scene, fruit.x, fruit.y + api.areaY, 8);
      scene.tweens.add({
        targets: fruit,
        x: basket.x,
        y: basket.y,
        scale: 0.2,
        alpha: 0.4,
        duration: 220,
        ease: 'Cubic.easeIn',
        onComplete: () => fruit.destroy(),
      });
      floatUp(scene, basket.x, basket.y - 40 + api.areaY, '+1');
      delivered++;
      setHook({ kind: 'pluck', remaining: count - delivered });
      countText.setText(`${delivered}/${count}`);
      scene.tweens.add({ targets: countText, scale: { from: 1.35, to: 1 }, duration: 200, ease: 'Back.easeOut' });

      if (delivered === count) {
        const pts = harvestSpeedPoints(Date.now() - t0);
        api.addScore(pts);
        api.feedback(pts === 2 ? UI_TEXT.session.pluckFast : UI_TEXT.session.pluckDone, true);
        api.advance(800);
      }
    });
  }
}

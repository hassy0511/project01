/* 摘み取りゲーム(pluck): 実が弾みながら降ってきて、タップするとかごへ飛んでいく。
   旧版は静止した絵文字をタップするだけだったのを、
   「降ってくる→つかむ→かごに集まる」という一連の流れに作り直した */
import { pluckPoints } from '../../core/stars';
import { SFX } from '../../audio/sfx';
import { burst, floatUp } from '../../ui/effects';
import { setHook } from '../../game/testHooks';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import type { MinigameApi } from './types';

const BASKET_Y = 300;

export function renderPluck(api: MinigameApi, target: string, prompt: string, count: number): void {
  const { scene, area } = api;
  api.sign(prompt);

  const basket = scene.add.text(GAME_W / 2, BASKET_Y, '🧺', { fontSize: '52px' }).setOrigin(0.5);
  const countText = scene.add
    .text(GAME_W / 2, BASKET_Y + 36, `0/${count}`, {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      color: '#4a3b2a',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  area.add([basket, countText]);

  let left = count;
  let collected = 0;
  setHook({ kind: 'pluck', remaining: left });
  const t0 = Date.now();

  for (let i = 0; i < count; i++) {
    const x = 50 + Math.random() * (GAME_W - 100);
    const landY = 60 + Math.random() * 150;
    const fruit = scene.add
      .text(x, -40 - Math.random() * 80, target, { fontSize: '40px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    area.add(fruit);

    scene.tweens.add({
      targets: fruit,
      y: landY,
      duration: 520 + Math.random() * 220,
      delay: i * 80 + Math.random() * 140,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        if (!fruit.active) return;
        scene.tweens.add({
          targets: fruit,
          scaleX: { from: 1, to: 1.08 },
          scaleY: { from: 1, to: 0.92 },
          yoyo: true,
          repeat: -1,
          duration: 550,
          delay: Math.random() * 400,
        });
      },
    });

    fruit.on('pointerup', () => {
      if (!fruit.active || !fruit.input?.enabled) return;
      fruit.disableInteractive();
      SFX.pop();
      burst(scene, fruit.x, fruit.y + api.areaY, 6);
      scene.tweens.add({
        targets: fruit,
        x: basket.x,
        y: basket.y,
        scale: 0.2,
        alpha: 0.5,
        duration: 300,
        ease: 'Cubic.easeIn',
        onComplete: () => fruit.destroy(),
      });

      collected++;
      left--;
      setHook({ kind: 'pluck', remaining: left });
      countText.setText(`${collected}/${count}`);
      scene.tweens.add({ targets: countText, scale: { from: 1.35, to: 1 }, duration: 200, ease: 'Back.easeOut' });
      floatUp(scene, fruit.x, fruit.y + api.areaY - 20, '+1');

      if (left === 0) {
        const pts = pluckPoints(Date.now() - t0);
        api.addScore(pts);
        api.feedback(pts === 2 ? UI_TEXT.session.pluckFast : UI_TEXT.session.pluckDone, true);
        api.advance(800);
      }
    });
  }
}

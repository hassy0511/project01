/* おせわチャンス(whack): 1体ずつ順番に出ていたのを、
   同時に2体まで・顔を出す溜め・コンボ表示 のある「叩く手応え」に作り直した */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, squashStretch } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import type { CareSpec } from '../../data/gameData';
import type { MinigameApi } from './types';

const TOTAL = 6;
const MAX_CONCURRENT = 2;
const SPAWN_INTERVAL_MS = 750;
const PEEK_MS = 220;
const LIFETIME_MS = 1500;
const COMBO_WINDOW_MS = 1200;

export function renderWhack(api: MinigameApi, care: CareSpec): void {
  const { scene, area } = api;
  api.sign(`${care.target} ${care.label}`);

  let shown = 0;
  let hits = 0;
  let combo = 0;
  let lastHitAt = 0;
  const active = new Set<Phaser.GameObjects.Text>();

  const checkEnd = (): void => {
    if (shown >= TOTAL && active.size === 0) {
      spawnTimer.remove();
      api.feedback(hits > 0 ? UI_TEXT.session.whackDone : UI_TEXT.session.whackEnd, true);
      api.advance(800);
    }
  };

  const spawn = (): void => {
    if (shown >= TOTAL || active.size >= MAX_CONCURRENT) return;
    shown++;
    const x = 50 + Math.random() * (GAME_W - 100);
    const y = 90 + Math.random() * 260;
    const pest = scene.add.text(x, y, care.target, { fontSize: '42px' }).setOrigin(0.5).setAlpha(0);
    area.add(pest);
    active.add(pest);

    scene.tweens.add({
      targets: pest,
      alpha: 1,
      scale: { from: 0.3, to: 1 },
      duration: PEEK_MS,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (pest.active) pest.setInteractive({ useHandCursor: true });
      },
    });

    const expire = scene.time.delayedCall(LIFETIME_MS, () => {
      if (!pest.active) return;
      active.delete(pest);
      scene.tweens.add({ targets: pest, alpha: 0, scale: 0.5, duration: 200, onComplete: () => pest.destroy() });
      checkEnd();
    });

    pest.on('pointerup', () => {
      if (!pest.active || !pest.input?.enabled) return;
      expire.remove(false);
      active.delete(pest);
      pest.disableInteractive();
      SFX.pop();
      squashStretch(scene, pest);
      burst(scene, pest.x, pest.y + api.areaY, 8);
      scene.tweens.add({ targets: pest, alpha: 0, scale: 0, duration: 220, onComplete: () => pest.destroy() });

      const now = Date.now();
      combo = now - lastHitAt <= COMBO_WINDOW_MS ? combo + 1 : 1;
      lastHitAt = now;
      hits++;

      const label = combo >= 2 ? UI_TEXT.session.whackCombo(combo) : UI_TEXT.session.whackTap;
      const float = scene.add
        .text(pest.x, pest.y + api.areaY - 28, label, {
          fontFamily: 'sans-serif',
          fontSize: combo >= 2 ? '20px' : '16px',
          color: '#e0812a',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      scene.tweens.add({ targets: float, y: float.y - 40, alpha: 0, duration: 700, onComplete: () => float.destroy() });

      checkEnd();
    });
  };

  spawn();
  const spawnTimer = scene.time.addEvent({ delay: SPAWN_INTERVAL_MS, loop: true, callback: spawn });
}

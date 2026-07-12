/* タイミングゲーム(いわし漁など): 2段階に作り直した。
   ①キャスト: 浮きが揺れる帯の「いいところ」で止める(旧版のまま=既に手応えのある部分)
   ②引き上げ: 止めるのに成功したら、連打でぐいぐい引き寄せる「ひっぱり」が発生する。
   旧版は①だけで即終了していたため、成功しても手応えが一瞬で終わっていた */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, cameraPulse, missShake } from '../../ui/effects';
import { setHook } from '../../game/testHooks';
import { UI_TEXT } from '../../data/uiText';
import type { TimingTheme } from '../../data/gameData';
import { COLORS, GAME_W } from '../../ui/theme';
import { makeButton } from '../../ui/widgets';
import type { MinigameApi } from './types';

const TICK_MS = 25;
const SPEED = 0.11;
const PERFECT = [42, 58] as const;
const GOOD = [30, 70] as const;
const TRACK_Y = 150;
const TRACK_W = 360;
const REEL_TARGET = 4;

export function renderTiming(api: MinigameApi, theme: TimingTheme): void {
  const { scene, area } = api;
  api.sign(theme.prompt);

  const gfx = scene.add.graphics();
  gfx.fillStyle(COLORS.barBg, 1);
  gfx.fillRoundedRect(GAME_W / 2 - TRACK_W / 2, TRACK_Y - 14, TRACK_W, 28, 14);
  gfx.fillStyle(0xbfe3a8, 1);
  gfx.fillRoundedRect(
    GAME_W / 2 - TRACK_W / 2 + (TRACK_W * GOOD[0]) / 100,
    TRACK_Y - 14,
    (TRACK_W * (GOOD[1] - GOOD[0])) / 100,
    28,
    14,
  );
  gfx.fillStyle(0x8ed46f, 1);
  gfx.fillRect(
    GAME_W / 2 - TRACK_W / 2 + (TRACK_W * PERFECT[0]) / 100,
    TRACK_Y - 14,
    (TRACK_W * (PERFECT[1] - PERFECT[0])) / 100,
    28,
  );
  area.add(gfx);
  const marker = scene.add.text(GAME_W / 2, TRACK_Y, theme.marker, { fontSize: '30px' }).setOrigin(0.5);
  area.add(marker);

  let pos = 0;
  let t = Math.random() * Math.PI * 2;
  let stopped = false;
  setHook({ kind: 'timing', pos });
  const timer = scene.time.addEvent({
    delay: TICK_MS,
    loop: true,
    callback: () => {
      t += SPEED;
      pos = 50 + 50 * Math.sin(t);
      marker.x = GAME_W / 2 - TRACK_W / 2 + (TRACK_W * pos) / 100;
      setHook({ kind: 'timing', pos });
      if (!stopped && Math.random() < 0.35) {
        const ghost = scene.add
          .text(marker.x, TRACK_Y, theme.marker, { fontSize: '30px' })
          .setOrigin(0.5)
          .setAlpha(0.35);
        area.add(ghost);
        scene.tweens.add({ targets: ghost, alpha: 0, scale: 0.7, duration: 260, onComplete: () => ghost.destroy() });
      }
    },
  });

  const stopBtn = makeButton(scene, {
    x: GAME_W / 2,
    y: 260,
    w: 220,
    h: 54,
    label: theme.stopBtn,
    color: COLORS.orange,
    onClick: () => {
      if (stopped) return;
      stopped = true;
      timer.remove();
      stopBtn.destroy();
      const perfect = pos >= PERFECT[0] && pos <= PERFECT[1];
      const good = pos >= GOOD[0] && pos <= GOOD[1];
      if (perfect || good) {
        if (perfect) cameraPulse(scene);
        burst(scene, marker.x, TRACK_Y + api.areaY, perfect ? 14 : 8);
        SFX.good();
        api.feedback(perfect ? UI_TEXT.session.timingPerfect : UI_TEXT.session.timingGood, true);
        marker.setVisible(false);
        startReel(api);
      } else {
        api.feedback(UI_TEXT.session.timingMiss, false);
        missShake(scene);
        SFX.bad();
        api.advance(1300);
      }
    },
  });
  area.add(stopBtn);
}

/** 引き上げフェーズ: 連打でぐいぐい寄せる(常に成功。回数がかかるだけ) */
function startReel(api: MinigameApi): void {
  const { scene, area } = api;
  const fishStartX = GAME_W / 2 + 130;
  const centerX = GAME_W / 2;
  const fish = scene.add.text(fishStartX, 210, '🐟', { fontSize: '34px' }).setOrigin(0.5);
  area.add(fish);

  const tensionBg = scene.add.graphics();
  tensionBg.fillStyle(COLORS.barBg, 1);
  tensionBg.fillRoundedRect(centerX - 110, 250, 220, 20, 10);
  area.add(tensionBg);
  const tensionFill = scene.add.graphics();
  area.add(tensionFill);
  const drawTension = (ratio: number): void => {
    tensionFill.clear();
    tensionFill.fillStyle(COLORS.orange, 1);
    tensionFill.fillRoundedRect(centerX - 110, 250, 220 * Phaser.Math.Clamp(ratio, 0, 1), 20, 10);
  };
  drawTension(0);

  let progress = 0;
  setHook({ kind: 'reel', progress, target: REEL_TARGET });

  const pullBtn = makeButton(scene, {
    x: centerX,
    y: 310,
    w: 220,
    h: 54,
    label: UI_TEXT.session.reelPull,
    color: COLORS.primary,
    onClick: () => {
      progress++;
      setHook({ kind: 'reel', progress, target: REEL_TARGET });
      SFX.pop();
      scene.cameras.main.shake(60, 0.002);
      drawTension(progress / REEL_TARGET);
      scene.tweens.add({
        targets: fish,
        x: fishStartX - ((fishStartX - centerX) * progress) / REEL_TARGET,
        duration: 160,
        ease: 'Sine.easeOut',
      });
      const splash = scene.add.text(fish.x, fish.y - 20, '💦', { fontSize: '18px' }).setOrigin(0.5);
      area.add(splash);
      scene.tweens.add({
        targets: splash,
        y: splash.y - 16,
        alpha: 0,
        duration: 300,
        onComplete: () => splash.destroy(),
      });

      if (progress >= REEL_TARGET) {
        pullBtn.destroy();
        setHook({ kind: 'done' });
        scene.tweens.add({
          targets: fish,
          x: centerX,
          y: 30,
          scale: 1.4,
          duration: 320,
          ease: 'Back.easeIn',
          onComplete: () => {
            burst(scene, fish.x, fish.y + api.areaY, 12);
            fish.destroy();
            api.feedback(UI_TEXT.session.reelDone, true);
            SFX.good();
            api.addScore(1);
            api.advance(700);
          },
        });
      }
    },
  });
  area.add(pullBtn);
}

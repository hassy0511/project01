/* チェーンなぞりゲーム(だいず・いちご・らっかせい / こめ=列レイアウト):
   熟した実だけを一筆書きでつないで集める。葉っぱ(ハズレ)に触れるとコンボが切れる。
   ウェーブ制で数と混ざり具合が増えていく */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_W, TEXT_COLORS } from '../../ui/theme';
import { drawMeadow } from '../../ui/scenery';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const PLAY_TOP = 130;
const PLAY_BOTTOM = 600;
const HIT_RADIUS = 32;
const RIPE_PTS = 5;

interface Target {
  obj: Phaser.GameObjects.Text;
  ripe: boolean;
  got: boolean;
}

export function renderChain(api: MinigameApi, target: string, prompt: string, rows: boolean): void {
  const { scene, area } = api;
  drawMeadow(scene, area, AREA_H);
  api.sign(prompt);

  let targets: Target[] = [];
  let wave = 0;
  let spawning = false;

  const session = new ArcadeSession(api, {
    engine: rows ? 'reap' : 'chain',
    onEnd: () => {
      cleanupInput();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  const spawnWave = (): void => {
    wave++;
    spawning = true;
    targets.forEach((t) => t.obj.destroy());
    targets = [];
    const ripeCount = Math.min(12, 5 + wave);
    const junkCount = Math.min(8, 1 + wave);

    const positions: { x: number; y: number }[] = [];
    const total = ripeCount + junkCount;
    if (rows) {
      const cols = 4;
      for (let i = 0; i < total; i++) {
        positions.push({
          x: 70 + (i % cols) * ((GAME_W - 140) / (cols - 1)),
          y: PLAY_TOP + 40 + Math.floor(i / cols) * 86 + ((i % cols) % 2) * 18,
        });
      }
    } else {
      for (let i = 0; i < total; i++) {
        // 適度にバラす(既存と近すぎたら少しずらす)
        let x = 56 + Math.random() * (GAME_W - 112);
        let y = PLAY_TOP + 30 + Math.random() * (PLAY_BOTTOM - PLAY_TOP - 60);
        for (const p of positions) {
          if (Math.hypot(p.x - x, p.y - y) < 62) {
            x = Phaser.Math.Clamp(x + 70, 56, GAME_W - 56);
            y = Phaser.Math.Clamp(y + 46, PLAY_TOP + 30, PLAY_BOTTOM - 30);
          }
        }
        positions.push({ x, y });
      }
    }
    Phaser.Utils.Array.Shuffle(positions);

    positions.forEach((pos, i) => {
      const ripe = i < ripeCount;
      const obj = scene.add
        .text(pos.x, pos.y, ripe ? target : '🌿', { fontSize: ripe ? '34px' : '30px' })
        .setOrigin(0.5)
        .setScale(0);
      if (!ripe) obj.setAlpha(0.9);
      area.add(obj);
      scene.tweens.add({
        targets: obj,
        scale: 1,
        duration: 240,
        delay: i * 40,
        ease: 'Back.easeOut',
        onComplete: () => {
          if (ripe && obj.active) {
            scene.tweens.add({
              targets: obj,
              scale: { from: 0.94, to: 1.1 },
              yoyo: true,
              repeat: -1,
              duration: 460 + Math.random() * 200,
            });
          }
        },
      });
      targets.push({ obj, ripe, got: false });
    });
    scene.time.delayedCall(positions.length * 40 + 260, () => {
      spawning = false;
    });
  };

  const waveCleared = (): void => {
    const banner = scene.add
      .text(GAME_W / 2, 300, UI_TEXT.arcade.wave(wave + 1), {
        fontFamily: FONT,
        fontSize: '28px',
        color: TEXT_COLORS.good,
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScale(0);
    area.add(banner);
    scene.tweens.add({
      targets: banner,
      scale: 1,
      duration: 260,
      ease: 'Back.easeOut',
      onComplete: () =>
        scene.tweens.add({ targets: banner, alpha: 0, delay: 400, duration: 250, onComplete: () => banner.destroy() }),
    });
    spawnWave();
  };

  let stunnedUntil = 0;
  const touch = (px: number, py: number): void => {
    if (session.isEnded() || spawning || Date.now() < stunnedUntil) return;
    for (const t of targets) {
      if (t.got || !t.obj.active) continue;
      if (Math.hypot(px - t.obj.x, py - api.areaY - t.obj.y) > HIT_RADIUS) continue;
      if (t.ripe) {
        t.got = true;
        SFX.pop();
        burst(scene, t.obj.x, t.obj.y + api.areaY, 6);
        session.addPoints(RIPE_PTS, t.obj.x, t.obj.y + api.areaY - 16);
        scene.tweens.killTweensOf(t.obj);
        scene.tweens.add({ targets: t.obj, scale: 0, alpha: 0, duration: 160, onComplete: () => t.obj.destroy() });
        if (targets.every((x) => !x.ripe || x.got)) waveCleared();
      } else {
        // 葉っぱに触れた: チェーンが切れて一瞬だけ手が止まる
        stunnedUntil = Date.now() + 450;
        session.resetCombo();
        missShake(scene);
        SFX.bad();
        scene.tweens.add({ targets: t.obj, angle: { from: -16, to: 16 }, duration: 60, yoyo: true, repeat: 3 });
      }
      return;
    }
  };

  // なぞり軌跡(小さな残像)
  let lastTrailAt = 0;
  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!p.isDown) return;
    touch(p.x, p.y);
    if (Date.now() - lastTrailAt > 40) {
      lastTrailAt = Date.now();
      const dot = scene.add.circle(p.x, p.y - api.areaY, 7, 0xffffff, 0.55);
      area.add(dot);
      scene.tweens.add({ targets: dot, scale: 0.2, alpha: 0, duration: 300, onComplete: () => dot.destroy() });
    }
  };
  const onDown = (p: Phaser.Input.Pointer): void => touch(p.x, p.y);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerdown', onDown);
  const cleanupInput = (): void => {
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerdown', onDown);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupInput);

  spawnWave();
}

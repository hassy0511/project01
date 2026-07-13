/* 掘り進めゲーム(dig): 「どこが光ったか当てる」記憶ゲームをやめて、
   1つの土山を連続タップで掘り進める直接的な操作に作り直した。
   ハズレという概念自体が無くなったので、常に成功に近づくだけ(成功保証をより素直に表現) */
import { harvestSpeedPoints } from '../../core/stars';
import { SFX } from '../../audio/sfx';
import { burst, floatUp, screenFlash, soilPuff } from '../../ui/effects';
import { setHook } from '../../game/testHooks';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import type { MinigameApi } from './types';

const HITS_NEEDED = 5;
const MOUND_SIZE = 190;
const FAST_MS = 6000;

export function renderDig(api: MinigameApi, prompt: string, targetEmoji: string): void {
  const { scene, area } = api;
  api.sign(prompt);

  const cx = GAME_W / 2;
  const cy = 190;

  const mound = scene.add.container(cx, cy);
  const bg = scene.add.graphics();
  const drawMound = (hits: number): void => {
    bg.clear();
    const shrink = hits * 6;
    const radius = MOUND_SIZE / 2 - shrink;
    bg.fillGradientStyle(0xe4cf9f, 0xe4cf9f, 0xc7a86e, 0xc7a86e, 1);
    bg.fillCircle(0, 0, radius);
    bg.lineStyle(3, 0xb0895a, 0.8);
    bg.strokeCircle(0, 0, radius);
    for (let i = 0; i < hits; i++) {
      const a = (i / HITS_NEEDED) * Math.PI * 2 + 0.4;
      bg.lineStyle(2, 0x8a6242, 0.6);
      bg.lineBetween(Math.cos(a) * 10, Math.sin(a) * 10, Math.cos(a) * (radius - 6), Math.sin(a) * (radius - 6));
    }
  };
  drawMound(0);
  mound.add(bg);
  mound.setSize(MOUND_SIZE, MOUND_SIZE);
  mound.setInteractive({ useHandCursor: true });
  area.add(mound);

  const pick = scene.add.text(cx, cy - MOUND_SIZE / 2 - 18, '⛏️', { fontSize: '32px' }).setOrigin(0.5, 1);
  area.add(pick);

  const gaugeBg = scene.add.graphics();
  gaugeBg.fillStyle(0xe6e0d0, 1);
  gaugeBg.fillRoundedRect(cx - 100, cy + MOUND_SIZE / 2 + 24, 200, 16, 8);
  area.add(gaugeBg);
  const gaugeFill = scene.add.graphics();
  area.add(gaugeFill);
  const drawGauge = (hits: number): void => {
    gaugeFill.clear();
    gaugeFill.fillStyle(0xff9f40, 1);
    gaugeFill.fillRoundedRect(cx - 100, cy + MOUND_SIZE / 2 + 24, 200 * (hits / HITS_NEEDED), 16, 8);
  };
  drawGauge(0);

  let hits = 0;
  let finished = false;
  const t0 = Date.now();
  setHook({ kind: 'dig', hits: 0, needed: HITS_NEEDED });

  mound.on('pointerup', () => {
    if (finished) return;
    hits++;
    setHook({ kind: 'dig', hits, needed: HITS_NEEDED });
    SFX.pop();
    scene.tweens.add({ targets: pick, angle: { from: -55, to: 20 }, duration: 150, yoyo: true });
    scene.cameras.main.shake(80, 0.0035);
    soilPuff(scene, cx + (Math.random() - 0.5) * 70, cy + (Math.random() - 0.5) * 50 + api.areaY);
    scene.tweens.add({ targets: mound, x: cx + (Math.random() - 0.5) * 8, duration: 60, yoyo: true });
    drawMound(hits);
    drawGauge(hits);

    if (hits >= HITS_NEEDED) {
      finished = true;
      mound.disableInteractive();
      scene.cameras.main.shake(220, 0.009);
      screenFlash(scene, 0xfff2c4, 0.4);
      burst(scene, cx, cy + api.areaY, 22);
      bg.clear();
      const reveal = scene.add.text(0, 0, targetEmoji, { fontSize: '48px' }).setOrigin(0.5).setScale(0);
      mound.add(reveal);
      scene.tweens.add({ targets: reveal, scale: 1, ease: 'Back.easeOut', duration: 320 });
      floatUp(scene, cx, cy + api.areaY - 50, '+1');
      SFX.good();
      const pts = harvestSpeedPoints(Date.now() - t0, FAST_MS);
      api.addScore(pts);
      api.feedback(pts === 2 ? UI_TEXT.session.digFast : UI_TEXT.session.digFound, true);
      api.advance(900);
    }
  });
}

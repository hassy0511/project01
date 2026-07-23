/* ねぶたまつり(あおもり): 太鼓のビートで はねる(跳人=ハネト)ゲーム。
   縮んでいく わっかが 的に かさなった しゅんかんに タップ=「ラッセラー!」と はねる。
   外しても コンボが切れるだけ(成功保証)。
   ときどき「おおねぶたタイム」= ねぶたが せまってきて 得点2倍 が C 要素。
   実在のねぶた祭の「囃子に合わせて はねる」をそのまま動詞化 */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const TARGET = { x: 240, y: 470, r: 36 };
/** わっかの縮む時間(序盤→終盤, ms)と判定幅 */
const BEAT_FROM_MS = 1000;
const BEAT_TO_MS = 640;
const JUST_PX = 11;
const OK_PX = 32;
const JUST_PTS = 20;
const OK_PTS = 10;
/** おおねぶたタイム */
const BIG_EVERY_MS = 15000;
const BIG_LEN_MS = 6000;

export function renderNebuta(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 夜の まち + ちょうちん
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x1d2547, 0x1d2547, 0x2f3a66, 0x2f3a66, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0x141a33, 1);
  for (let i = 0; i < 5; i++) bg.fillRect(i * 100 - 10, 120 + (i % 2) * 30, 84, 200);
  for (let i = 0; i < 6; i++) {
    bg.fillStyle(0xe05b5b, 1);
    bg.fillEllipse(i * 85 + 40, 84, 16, 22);
    bg.fillStyle(0xffd34d, 0.6);
    bg.fillEllipse(i * 85 + 40, 84, 9, 13);
  }
  area.add(bg);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'nebuta',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- ねぶた(ひかる 大きな山車) ---------- */
  const nebuta = scene.add.container(GAME_W / 2, 250);
  const ng = scene.add.graphics();
  ng.fillStyle(0xffd34d, 0.16);
  ng.fillEllipse(0, 0, 340, 220); // ひかりの にじみ
  ng.fillStyle(0xf2e6c9, 1);
  ng.fillRoundedRect(-130, -70, 260, 130, 26);
  ng.fillStyle(0xd94f4f, 0.9);
  ng.fillEllipse(-70, -20, 70, 60);
  ng.fillEllipse(70, -20, 70, 60);
  ng.fillStyle(0x3d6fb8, 0.85);
  ng.fillEllipse(0, 26, 120, 54);
  ng.fillStyle(0x4a3b2a, 1);
  ng.fillRect(-140, 60, 280, 16);
  nebuta.add(ng);
  nebuta.add(scene.add.text(0, -24, '👹', { fontSize: '58px' }).setOrigin(0.5));
  area.add(nebuta);
  scene.tweens.add({ targets: nebuta, y: 244, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  // ハネト(はねる ひとたち)
  const hanetos: Phaser.GameObjects.Text[] = [];
  for (const [dx, e] of [[-160, '🧍'], [-60, '👘'], [60, '🧍'], [160, '👘']] as const) {
    const h = scene.add.text(GAME_W / 2 + dx, 560, e, { fontSize: '34px' }).setOrigin(0.5);
    area.add(h);
    hanetos.push(h);
  }

  // 的と わっか
  const targetRing = scene.add.circle(TARGET.x, TARGET.y, TARGET.r).setStrokeStyle(5, 0xffffff, 0.95);
  area.add(targetRing);
  const label = scene.add.text(TARGET.x, TARGET.y, '🥁', { fontSize: '30px' }).setOrigin(0.5);
  area.add(label);

  let ring: Phaser.GameObjects.Arc | null = null;
  let ringTween: Phaser.Tweens.Tween | null = null;
  let bigTime = false;

  const spawnRing = (): void => {
    if (session.isEnded()) return;
    ring = scene.add.circle(TARGET.x, TARGET.y, 130).setStrokeStyle(6, bigTime ? 0xffd34d : 0x9ad0f5, 0.95);
    area.add(ring);
    const ms = Phaser.Math.Linear(BEAT_FROM_MS, BEAT_TO_MS, session.progress()) * (bigTime ? 0.85 : 1);
    ringTween = scene.tweens.add({
      targets: ring,
      radius: 16,
      duration: ms,
      onComplete: () => {
        // まにあわなかった: すっと きえるだけ(コンボが切れる)
        session.resetCombo();
        ring?.destroy();
        ring = null;
        scene.time.delayedCall(260, spawnRing);
      },
    });
  };
  spawnRing();

  const jump = (just: boolean): void => {
    for (const [i, h] of hanetos.entries()) {
      scene.tweens.add({ targets: h, y: 560 - (just ? 46 : 30), duration: 160, yoyo: true, delay: i * 30, ease: 'Quad.easeOut' });
    }
    scene.tweens.add({ targets: nebuta, scale: just ? 1.06 : 1.03, duration: 120, yoyo: true });
  };

  const onDown = (): void => {
    if (session.isEnded() || !ring) return;
    const diff = Math.abs(ring.radius - TARGET.r);
    if (diff <= OK_PX) {
      const just = diff <= JUST_PX;
      const pts = (just ? JUST_PTS : OK_PTS) * (bigTime ? 2 : 1);
      SFX.pop();
      if (just) SFX.good();
      impactRing(scene, TARGET.x, TARGET.y + api.areaY, just ? 0xffd34d : 0xffffff, 14);
      burst(scene, TARGET.x, TARGET.y + api.areaY, just ? 10 : 6);
      session.addPoints(pts, TARGET.x, TARGET.y + api.areaY - 40);
      floatUp(scene, TARGET.x + 90, TARGET.y + api.areaY - 60, just ? UI_TEXT.fest.haneJust : UI_TEXT.fest.rassera, just ? '#3f7d2c' : '#e0812a');
      jump(just);
      if (just && bigTime) bigImpact(scene, GAME_W / 2, 250 + api.areaY);
      ringTween?.remove();
      ring.destroy();
      ring = null;
      scene.time.delayedCall(200, spawnRing);
    } else {
      // はやすぎ/おそすぎ: コンボが切れるだけ
      session.resetCombo();
      SFX.bad();
      floatUp(scene, TARGET.x, TARGET.y + api.areaY - 40, UI_TEXT.arcade.miss, '#c04545');
    }
  };
  scene.input.on('pointerdown', onDown);

  // おおねぶたタイム(C要素)
  const bigTimer = scene.time.addEvent({
    delay: BIG_EVERY_MS,
    loop: true,
    callback: () => {
      if (session.isEnded() || bigTime) return;
      bigTime = true;
      SFX.fanfare();
      floatUp(scene, GAME_W / 2, 180 + api.areaY, UI_TEXT.fest.nebutaTime, '#e0812a');
      confetti(scene, 16);
      scene.tweens.add({ targets: nebuta, scale: 1.18, duration: 500, ease: 'Back.easeOut' });
      scene.time.delayedCall(BIG_LEN_MS, () => {
        bigTime = false;
        scene.tweens.add({ targets: nebuta, scale: 1, duration: 500 });
      });
    },
  });

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    bigTimer.remove();
    ringTween?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

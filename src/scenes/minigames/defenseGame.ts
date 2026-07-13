/* おせわディフェンス(care): 畑の作物めがけて害虫が四方から迫ってくる。
   タップで撃退するウェーブ防衛。逃しても作物は失われない(★なし、careDone のみ)が、
   まもった数/のがした数が最後に表示される */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, impactRing, missShake, squashStretch } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_W, TEXT_COLORS } from '../../ui/theme';
import { drawMeadow } from '../../ui/scenery';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const CROP_X = GAME_W / 2;
const CROP_Y = 400;
const BOP_PTS = 10;

export function renderDefense(
  api: MinigameApi,
  cropEmoji: string,
  pestEmoji: string,
  prompt: string,
  onResult: (bopped: number, leaked: number) => void,
): void {
  const { scene, area } = api;
  drawMeadow(scene, area, AREA_H);
  api.sign(prompt);

  // まもる作物(土のうね+芽+実)
  const crop = scene.add.container(CROP_X, CROP_Y);
  const cg = scene.add.graphics();
  cg.fillStyle(0x9c7d4f, 1);
  cg.fillEllipse(0, 26, 120, 40);
  cg.fillStyle(0x8bc063, 1);
  cg.fillTriangle(-16, 8, 0, -26, 16, 8);
  crop.add(cg);
  crop.add(scene.add.text(0, -10, cropEmoji, { fontSize: '40px' }).setOrigin(0.5));
  area.add(crop);
  scene.tweens.add({ targets: crop, scale: { from: 0.98, to: 1.03 }, duration: 900, yoyo: true, repeat: -1 });

  let bopped = 0;
  let leaked = 0;

  interface Pest {
    obj: Phaser.GameObjects.Text;
    speed: number;
  }
  const pests: Pest[] = [];
  let spawnTimer: Phaser.Time.TimerEvent | undefined;

  const session = new ArcadeSession(api, {
    engine: 'care',
    onEnd: () => {
      cleanup();
      const summary = scene.add
        .text(GAME_W / 2, 300, UI_TEXT.arcade.careResult(bopped, leaked), {
          fontFamily: FONT,
          fontSize: '20px',
          color: TEXT_COLORS.main,
          fontStyle: 'bold',
          align: 'center',
          stroke: '#ffffff',
          strokeThickness: 5,
        })
        .setOrigin(0.5);
      area.add(summary);
      onResult(bopped, leaked);
      api.advance(1400);
    },
  });

  const spawn = (): void => {
    if (session.isEnded()) return;
    // 画面の外周からランダムに湧く
    const side = Math.floor(Math.random() * 3); // 0=左 1=右 2=下(上はHUDなので使わない)
    const x = side === 0 ? -24 : side === 1 ? GAME_W + 24 : 60 + Math.random() * (GAME_W - 120);
    const y = side === 2 ? AREA_H + 24 : 140 + Math.random() * (AREA_H - 220);
    const speed = Phaser.Math.Linear(46, 96, session.progress()) * (0.85 + Math.random() * 0.3);
    const obj = scene.add
      .text(x, y, pestEmoji, { fontSize: '36px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    area.add(obj);
    const pest: Pest = { obj, speed };
    pests.push(pest);
    obj.on('pointerdown', () => {
      if (!obj.active || session.isEnded()) return;
      bopped++;
      obj.disableInteractive();
      SFX.pop();
      squashStretch(scene, obj);
      impactRing(scene, obj.x, obj.y + api.areaY, 0xffffff, 10);
      burst(scene, obj.x, obj.y + api.areaY, 8);
      session.addPoints(BOP_PTS, obj.x, obj.y + api.areaY - 20);
      scene.tweens.add({ targets: obj, alpha: 0, scale: 0, duration: 200, onComplete: () => obj.destroy() });
    });
    const interval = Phaser.Math.Linear(1300, 620, session.progress());
    spawnTimer = scene.time.delayedCall(interval, spawn);
  };

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    for (let i = pests.length - 1; i >= 0; i--) {
      const p = pests[i];
      if (!p.obj.active) {
        pests.splice(i, 1);
        continue;
      }
      const dx = CROP_X - p.obj.x;
      const dy = CROP_Y - p.obj.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 46) {
        // 作物に届いた: むしゃむしゃ(失敗ペナルティはないが、まもれなかった)
        leaked++;
        session.resetCombo();
        missShake(scene);
        SFX.bad();
        scene.tweens.add({ targets: crop, angle: { from: -6, to: 6 }, duration: 70, yoyo: true, repeat: 3 });
        p.obj.disableInteractive();
        scene.tweens.add({ targets: p.obj, alpha: 0, y: p.obj.y - 20, duration: 350, onComplete: () => p.obj.destroy() });
        pests.splice(i, 1);
        continue;
      }
      p.obj.x += (dx / dist) * p.speed * dt;
      p.obj.y += (dy / dist) * p.speed * dt;
      p.obj.setFlipX(dx < 0);
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
  const cleanup = (): void => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    spawnTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);

  spawn();
  scene.time.delayedCall(500, spawn);
}

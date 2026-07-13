/* フィッシング(いわし): 泳ぐ魚をタップで釣り上げる。小さい魚ほど速い。
   大物は2回タップ(掛ける→引き上げる)で、逃すとコンボが切れる。
   時間経過で魚が速く・多くなる */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_W } from '../../ui/theme';
import { drawSea } from '../../ui/scenery';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const SEA_TOP = 190;
const BOAT_Y = 168;

interface FishSpec {
  emoji: string;
  pts: number;
  speed: [number, number];
  size: number;
  big: boolean;
  weight: number;
}

const FISH_TYPES: FishSpec[] = [
  { emoji: '🐟', pts: 10, speed: [95, 150], size: 30, big: false, weight: 0.62 },
  { emoji: '🐠', pts: 20, speed: [65, 100], size: 36, big: false, weight: 0.3 },
  { emoji: '🐡', pts: 50, speed: [42, 60], size: 46, big: true, weight: 0.08 },
];

export function renderFish(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;
  drawSea(scene, area, SEA_TOP, AREA_H);
  api.sign(prompt);

  // 舟(ベクター描画)
  const boat = scene.add.container(GAME_W / 2, BOAT_Y);
  const bg = scene.add.graphics();
  bg.fillStyle(0xa9713a, 1);
  bg.beginPath();
  bg.moveTo(-70, -8);
  bg.lineTo(70, -8);
  bg.lineTo(46, 18);
  bg.lineTo(-46, 18);
  bg.closePath();
  bg.fillPath();
  bg.fillStyle(0xc98f4e, 1);
  bg.fillRect(-70, -12, 140, 7);
  bg.fillStyle(0x8a6242, 1);
  bg.fillRect(-4, -58, 8, 48);
  bg.fillStyle(0xe05b5b, 1);
  bg.fillTriangle(4, -58, 4, -34, 40, -46);
  boat.add(bg);
  area.add(boat);
  scene.tweens.add({ targets: boat, y: BOAT_Y + 5, angle: 1.6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  interface Swimmer {
    obj: Phaser.GameObjects.Text;
    spec: FishSpec;
    vx: number;
    hooked: boolean;
    hookedAt: number;
    hint?: Phaser.GameObjects.Text;
  }
  const fishes: Swimmer[] = [];
  let spawnTimer: Phaser.Time.TimerEvent | undefined;

  const session = new ArcadeSession(api, {
    engine: 'fish',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  const pickSpec = (): FishSpec => {
    const roll = Math.random();
    let acc = 0;
    for (const s of FISH_TYPES) {
      acc += s.weight;
      if (roll < acc) return s;
    }
    return FISH_TYPES[0];
  };

  const spawn = (): void => {
    if (session.isEnded()) return;
    const spec = pickSpec();
    const fromLeft = Math.random() < 0.5;
    const depth = SEA_TOP + 60 + Math.random() * (AREA_H - SEA_TOP - 110);
    const speedBoost = Phaser.Math.Linear(1, 1.55, session.progress());
    const speed = Phaser.Math.Between(spec.speed[0], spec.speed[1]) * speedBoost;
    const obj = scene.add
      .text(fromLeft ? -30 : GAME_W + 30, depth, spec.emoji, { fontSize: `${spec.size}px` })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    obj.setFlipX(!fromLeft); // 進行方向を向く(🐟は左向き絵文字)
    if (fromLeft) obj.setFlipX(true);
    area.add(obj);
    const swimmer: Swimmer = { obj, spec, vx: fromLeft ? speed : -speed, hooked: false, hookedAt: 0 };
    fishes.push(swimmer);

    obj.on('pointerdown', () => {
      if (session.isEnded() || !obj.active) return;
      if (!swimmer.spec.big) {
        land(swimmer);
        return;
      }
      if (!swimmer.hooked) {
        // 大物: 1回目のタップで「掛かった!」→ 暴れ出す。1.2秒以内にもう1回で釣り上げ
        swimmer.hooked = true;
        swimmer.hookedAt = Date.now();
        SFX.hint();
        impactRing(scene, obj.x, obj.y + api.areaY, 0xffd34d, 14);
        swimmer.hint = scene.add
          .text(obj.x, obj.y - 34, UI_TEXT.arcade.again, {
            fontFamily: FONT,
            fontSize: '16px',
            color: '#e0812a',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 4,
          })
          .setOrigin(0.5);
        area.add(swimmer.hint);
        swimmer.vx *= 2.4; // 暴れて加速
      } else {
        land(swimmer);
      }
    });

    const interval = Phaser.Math.Linear(1000, 480, session.progress());
    spawnTimer = scene.time.delayedCall(interval, spawn);
  };

  const land = (s: Swimmer): void => {
    if (!s.obj.active) return;
    s.hint?.destroy();
    SFX.good();
    burst(scene, s.obj.x, s.obj.y + api.areaY, s.spec.big ? 16 : 8, [0x8ed4e8, 0xffffff, 0x6fc4e0]);
    session.addPoints(s.spec.pts, s.obj.x, s.obj.y + api.areaY - 20);
    s.obj.disableInteractive();
    // 釣り糸で舟まで引き上げる
    const line = scene.add.graphics();
    area.add(line);
    line.lineStyle(2, 0xffffff, 0.8);
    line.lineBetween(boat.x, boat.y, s.obj.x, s.obj.y);
    scene.tweens.add({
      targets: s.obj,
      x: boat.x,
      y: boat.y + 6,
      scale: 0.4,
      duration: 300,
      ease: 'Cubic.easeIn',
      onUpdate: () => {
        line.clear();
        line.lineStyle(2, 0xffffff, 0.8);
        line.lineBetween(boat.x, boat.y, s.obj.x, s.obj.y);
      },
      onComplete: () => {
        line.destroy();
        s.obj.destroy();
      },
    });
  };

  const escape = (s: Swimmer): void => {
    s.hint?.destroy();
    s.hooked = false;
    session.resetCombo();
    missShake(scene);
    SFX.bad();
    const splash = scene.add
      .text(s.obj.x, s.obj.y - 26, UI_TEXT.arcade.escaped, {
        fontFamily: FONT,
        fontSize: '15px',
        color: '#c04545',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    area.add(splash);
    scene.tweens.add({ targets: splash, y: splash.y - 26, alpha: 0, duration: 600, onComplete: () => splash.destroy() });
    s.vx *= 1.4;
  };

  const onUpdate = (_t: number, dtMs: number): void => {
    const dt = dtMs / 1000;
    for (let i = fishes.length - 1; i >= 0; i--) {
      const s = fishes[i];
      if (!s.obj.active) {
        fishes.splice(i, 1);
        continue;
      }
      s.obj.x += s.vx * dt;
      s.obj.y += Math.sin(Date.now() / 300 + i) * 0.3;
      if (s.hint) s.hint.setPosition(s.obj.x, s.obj.y - 34);
      if (s.hooked && Date.now() - s.hookedAt > 1200) escape(s);
      if (s.obj.x < -50 || s.obj.x > GAME_W + 50) {
        s.hint?.destroy();
        s.obj.destroy();
        fishes.splice(i, 1);
      }
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
  const cleanup = (): void => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    spawnTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);

  spawn();
  scene.time.delayedCall(300, spawn);
}

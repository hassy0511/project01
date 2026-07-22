/* フィッシング(いわし): 泳ぐ魚をタップで釣り上げる。
   小=1タップ / 中=2タップ / 大=3タップ / ぬし=4タップ(セッション中1〜2回だけ出現)。
   一度タップされた魚は「回遊」を始める(画面内で折り返す)が、タップのたびに加速し、
   次のタップが遅れると逃げる。★3は ぬしを つりあげないと取れない */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, impactRing, missShake, padHitArea, screenFlash } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_W } from '../../ui/theme';
import { drawSea } from '../../ui/scenery';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const SEA_TOP = 190;
const BOAT_Y = 168;
/** タップ間の猶予(これを過ぎると逃げる) */
const TAP_WINDOW_MS = 1500;
/** タップごとの加速率 */
const TAP_SPEEDUP = 1.32;
/** ぬしが現れるタイミング(経過率) */
const BOSS_TIMES = [0.28, 0.66] as const;

interface FishSpec {
  emoji: string;
  pts: number;
  taps: number;
  speed: [number, number];
  size: number;
  weight: number;
}

const FISH_TYPES: FishSpec[] = [
  { emoji: '🐟', pts: 10, taps: 1, speed: [95, 150], size: 30, weight: 0.55 },
  { emoji: '🐠', pts: 25, taps: 2, speed: [70, 110], size: 38, weight: 0.32 },
  { emoji: '🐡', pts: 50, taps: 3, speed: [55, 85], size: 46, weight: 0.13 },
];

const BOSS: FishSpec = { emoji: '🐋', pts: 120, taps: 4, speed: [60, 90], size: 64, weight: 0 };

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
    tapsLeft: number;
    /** タップ済み=回遊モード(画面内で折り返す) */
    patrol: boolean;
    lastTapAt: number;
    isBoss: boolean;
    hint?: Phaser.GameObjects.Text;
  }
  const fishes: Swimmer[] = [];
  let spawnTimer: Phaser.Time.TimerEvent | undefined;
  let bossCaught = false;
  const bossSpawned = [false, false];

  const session = new ArcadeSession(api, {
    engine: 'fish',
    onEnd: () => {
      cleanup();
      api.lockStar3(!bossCaught);
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

  const makeSwimmer = (spec: FishSpec, isBoss: boolean): void => {
    const fromLeft = Math.random() < 0.5;
    const depth = SEA_TOP + 60 + Math.random() * (AREA_H - SEA_TOP - 110);
    const speedBoost = Phaser.Math.Linear(1, 1.5, session.progress());
    const speed = Phaser.Math.Between(spec.speed[0], spec.speed[1]) * (isBoss ? 1 : speedBoost);
    const obj = scene.add
      .text(fromLeft ? -40 : GAME_W + 40, depth, spec.emoji, { fontSize: `${spec.size}px` })
      .setOrigin(0.5);
    padHitArea(obj, isBoss ? 18 : 12); // 泳ぐ的は見た目より当たり判定を広く(子供の指)
    obj.setFlipX(fromLeft);
    area.add(obj);
    const swimmer: Swimmer = {
      obj,
      spec,
      vx: fromLeft ? speed : -speed,
      tapsLeft: spec.taps,
      patrol: false,
      lastTapAt: 0,
      isBoss,
    };
    fishes.push(swimmer);

    obj.on('pointerdown', () => {
      if (session.isEnded() || !obj.active) return;
      swimmer.tapsLeft--;
      if (swimmer.tapsLeft <= 0) {
        land(swimmer);
        return;
      }
      // まだ釣り上がらない: 回遊モードに入り、暴れて加速+反転
      swimmer.patrol = true;
      swimmer.lastTapAt = Date.now();
      swimmer.vx = -swimmer.vx * TAP_SPEEDUP;
      SFX.hint();
      impactRing(scene, obj.x, obj.y + api.areaY, swimmer.isBoss ? 0xffd34d : 0xffffff, 12);
      scene.tweens.add({ targets: obj, angle: { from: -12, to: 12 }, duration: 60, yoyo: true, repeat: 2 });
      if (!swimmer.hint) {
        swimmer.hint = scene.add
          .text(obj.x, obj.y - spec.size / 2 - 16, '', {
            fontFamily: FONT,
            fontSize: '17px',
            color: '#e0812a',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 4,
          })
          .setOrigin(0.5);
        area.add(swimmer.hint);
      }
      swimmer.hint.setText(UI_TEXT.arcade.tapsLeft(swimmer.tapsLeft));
    });
  };

  const spawn = (): void => {
    if (session.isEnded()) return;
    makeSwimmer(pickSpec(), false);
    const interval = Phaser.Math.Linear(1000, 480, session.progress());
    spawnTimer = scene.time.delayedCall(interval, spawn);
  };

  const spawnBoss = (): void => {
    SFX.fanfare();
    const banner = scene.add
      .text(GAME_W / 2, 260, UI_TEXT.arcade.bossAppear, {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#e0812a',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScale(0);
    area.add(banner);
    scene.tweens.add({
      targets: banner,
      scale: 1,
      ease: 'Back.easeOut',
      duration: 300,
      onComplete: () =>
        scene.tweens.add({ targets: banner, alpha: 0, delay: 900, duration: 300, onComplete: () => banner.destroy() }),
    });
    makeSwimmer(BOSS, true);
  };

  const land = (s: Swimmer): void => {
    if (!s.obj.active) return;
    s.hint?.destroy();
    SFX.good();
    burst(scene, s.obj.x, s.obj.y + api.areaY, s.isBoss ? 22 : 8, [0x8ed4e8, 0xffffff, 0x6fc4e0]);
    if (s.isBoss) {
      bossCaught = true;
      bigImpact(scene, s.obj.x, s.obj.y + api.areaY);
      screenFlash(scene, 0xfff2c4, 0.45);
      const caught = scene.add
        .text(GAME_W / 2, 300, UI_TEXT.arcade.bossCaught, {
          fontFamily: FONT,
          fontSize: '26px',
          color: '#3f7d2c',
          fontStyle: 'bold',
          stroke: '#ffffff',
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setScale(0);
      area.add(caught);
      scene.tweens.add({
        targets: caught,
        scale: 1,
        ease: 'Back.easeOut',
        duration: 300,
        onComplete: () =>
          scene.tweens.add({ targets: caught, alpha: 0, delay: 800, duration: 300, onComplete: () => caught.destroy() }),
      });
    }
    session.addPoints(s.spec.pts, s.obj.x, s.obj.y + api.areaY - 20);
    s.obj.disableInteractive();
    // 釣り糸で舟まで引き上げる
    const line = scene.add.graphics();
    area.add(line);
    scene.tweens.add({
      targets: s.obj,
      x: boat.x,
      y: boat.y + 6,
      scale: 0.4,
      duration: 320,
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
    if (!s.obj.active) return;
    s.hint?.destroy();
    s.hint = undefined;
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
    s.obj.disableInteractive();
    scene.tweens.add({ targets: s.obj, alpha: 0, y: s.obj.y + 30, duration: 400, onComplete: () => s.obj.destroy() });
  };

  const onUpdate = (_t: number, dtMs: number): void => {
    const dt = Math.min(dtMs, 33) / 1000;
    // ぬしの出現スケジュール(1〜2回)
    BOSS_TIMES.forEach((t, i) => {
      if (!bossSpawned[i] && session.progress() >= t && !session.isEnded()) {
        bossSpawned[i] = true;
        // 2回目は、まだ釣れていない時だけ現れる
        if (i === 0 || !bossCaught) spawnBoss();
      }
    });
    for (let i = fishes.length - 1; i >= 0; i--) {
      const s = fishes[i];
      if (!s.obj.active) {
        fishes.splice(i, 1);
        continue;
      }
      s.obj.x += s.vx * dt;
      s.obj.y += Math.sin(Date.now() / 300 + i) * 0.3;
      s.obj.setFlipX(s.vx > 0);
      if (s.hint) s.hint.setPosition(s.obj.x, s.obj.y - s.spec.size / 2 - 16);
      if (s.patrol) {
        // 回遊: 画面内で折り返す(逃さないかわりに、タップ猶予がある)
        if (s.obj.x < 40) {
          s.obj.x = 40;
          s.vx = Math.abs(s.vx);
        } else if (s.obj.x > GAME_W - 40) {
          s.obj.x = GAME_W - 40;
          s.vx = -Math.abs(s.vx);
        }
        if (Date.now() - s.lastTapAt > TAP_WINDOW_MS) escape(s);
      } else if (s.obj.x < -60 || s.obj.x > GAME_W + 60) {
        // 未タップの魚はそのまま泳ぎ去る
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

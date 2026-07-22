/* はなび打ち上げ(ちば・ちょうし みなとまつり): のぼっていく はなびだまを、
   よぞらの「わっか」の中でタップすると ジャストで大輪が咲く。
   タップが早い/遅い → 小さな花(得点は入る)。ノータップ → しゅう…と消える(コンボが切れるだけ)。
   ときどき来る「しゃくだま」が C 要素(ゆっくり・わっかが小さい・大花火)。
   加算合成パーティクルの見せ場 */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, floatUp, TX_DOT, TX_GLOW } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { DEPTH, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const LAUNCH_Y = 620;
/** ジャスト判定: わっかの中心から この距離まで */
const JUST_R = 30;
const JUST_R_SHAKU = 20;
const PTS_JUST = 18;
const PTS_SMALL = 6;
const PTS_SHAKU = 60;
/** 何発ごとに しゃくだま が来るか */
const SHAKU_EVERY = 5;
/** のぼる速さ(px/s): 序盤→終盤 */
const RISE_FROM = 230;
const RISE_TO = 360;
const RING_MIN_Y = 150;
const RING_MAX_Y = 320;
const HUES = [0xff6b6b, 0xffd34d, 0x8ed4e8, 0xb39ddb, 0x7dcf55, 0xff9eb5];

interface Shell {
  img: Phaser.GameObjects.Image;
  trail: Phaser.GameObjects.Particles.ParticleEmitter;
  ring: Phaser.GameObjects.Graphics;
  ringY: number;
  vy: number;
  hue: number;
  isShaku: boolean;
}

export function renderHanabi(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;
  drawNightPort(scene, area);
  api.sign(prompt);

  const shells: Shell[] = [];
  let launchTimer: Phaser.Time.TimerEvent | undefined;
  let launchCount = 0;

  const session = new ArcadeSession(api, {
    engine: 'hanabi',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /** 大輪の花: リング状に飛ぶ光+中心のきらめき+こぼれる金粉(加算合成) */
  const bloom = (x: number, y: number, hue: number, size: number): void => {
    const ax = x;
    const ay = y + api.areaY;
    const petals = scene.add
      .particles(ax, ay, TX_GLOW, {
        speed: { min: 150 * size, max: 190 * size },
        lifespan: { min: 650, max: 950 },
        scale: { start: 1.1 * size, end: 0 },
        gravityY: 60,
        blendMode: Phaser.BlendModes.ADD,
        tint: hue,
        emitting: false,
      })
      .setDepth(DEPTH.overlay);
    petals.explode(Math.round(42 * size));
    const core = scene.add
      .particles(ax, ay, TX_GLOW, {
        speed: { min: 20, max: 90 * size },
        lifespan: { min: 300, max: 550 },
        scale: { start: 1.4 * size, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
        tint: 0xfff2c4,
        emitting: false,
      })
      .setDepth(DEPTH.overlay);
    core.explode(Math.round(16 * size));
    const glitter = scene.add
      .particles(ax, ay, TX_DOT, {
        speed: { min: 40, max: 120 * size },
        lifespan: { min: 700, max: 1200 },
        gravityY: 190,
        scale: { start: 0.9, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
        tint: [hue, 0xffd34d, 0xffffff],
        emitting: false,
      })
      .setDepth(DEPTH.overlay);
    glitter.explode(Math.round(26 * size));
    scene.time.delayedCall(1400, () => {
      petals.destroy();
      core.destroy();
      glitter.destroy();
    });
  };

  const removeShell = (s: Shell): void => {
    const i = shells.indexOf(s);
    if (i >= 0) shells.splice(i, 1);
    s.trail.destroy();
    s.ring.destroy();
    s.img.destroy();
  };

  const launch = (): void => {
    if (session.isEnded()) return;
    launchCount++;
    const isShaku = launchCount % SHAKU_EVERY === 0;
    const x = 90 + Math.random() * (GAME_W - 180);
    const ringY = RING_MIN_Y + Math.random() * (RING_MAX_Y - RING_MIN_Y);
    const hue = HUES[Math.floor(Math.random() * HUES.length)];

    // わっか(ねらい)
    const ring = scene.add.graphics();
    const rr = isShaku ? JUST_R_SHAKU + 10 : JUST_R + 10;
    ring.lineStyle(3, isShaku ? 0xffd34d : 0xffffff, 0.85);
    ring.strokeCircle(x, ringY, rr);
    ring.lineStyle(1.5, isShaku ? 0xffd34d : 0xffffff, 0.35);
    ring.strokeCircle(x, ringY, rr + 7);
    area.add(ring);
    scene.tweens.add({ targets: ring, alpha: 0.45, duration: 420, yoyo: true, repeat: -1 });

    // はなびだま(光の粒)+尾を引く
    const img = scene.add.image(x, LAUNCH_Y, TX_GLOW).setTint(hue).setScale(isShaku ? 2.6 : 1.7);
    img.setBlendMode(Phaser.BlendModes.ADD);
    area.add(img);
    const trail = scene.add
      .particles(0, 0, TX_GLOW, {
        speed: { min: 4, max: 26 },
        lifespan: { min: 260, max: 420 },
        scale: { start: 0.9, end: 0 },
        frequency: 26,
        blendMode: Phaser.BlendModes.ADD,
        tint: hue,
        follow: img,
      })
      .setDepth(DEPTH.content);
    area.add(trail);
    SFX.pop();
    if (isShaku) {
      SFX.hint();
      floatUp(scene, x, LAUNCH_Y + api.areaY - 46, UI_TEXT.fest.shakudama, '#e0812a');
    }

    const speed = Phaser.Math.Linear(RISE_FROM, RISE_TO, session.progress()) * (isShaku ? 0.72 : 1);
    shells.push({ img, trail, ring, ringY, vy: speed, hue, isShaku });

    const interval = Phaser.Math.Linear(1300, 720, session.progress());
    launchTimer = scene.time.delayedCall(interval, launch);
    // 終盤はもう1発かぶせて追いこむ
    if (session.progress() > 0.6 && Math.random() < 0.4) {
      scene.time.delayedCall(interval * 0.45, () => {
        if (!session.isEnded()) launchWithoutSchedule();
      });
    }
  };
  const launchWithoutSchedule = (): void => {
    const saved = launchTimer;
    launch();
    launchTimer?.remove();
    launchTimer = saved;
  };

  const onDown = (): void => {
    if (session.isEnded() || !shells.length) return;
    // いちばん わっかに近い たまに適用(2発同時のときも意図を汲む)
    const s = shells.reduce((a, b) => (Math.abs(a.img.y - a.ringY) <= Math.abs(b.img.y - b.ringY) ? a : b));
    const d = Math.abs(s.img.y - s.ringY);
    const justR = s.isShaku ? JUST_R_SHAKU : JUST_R;
    const bx = s.img.x;
    const by = s.img.y;
    if (d <= justR) {
      if (s.isShaku) {
        bloom(bx, by, s.hue, 1.7);
        scene.time.delayedCall(180, () => bloom(bx, by - 30, HUES[(HUES.indexOf(s.hue) + 2) % HUES.length], 1.1));
        bigImpact(scene, bx, by + api.areaY, s.hue);
        session.addPoints(PTS_SHAKU, bx, by + api.areaY - 40);
        SFX.fest();
      } else {
        bloom(bx, by, s.hue, 1);
        floatUp(scene, bx, by + api.areaY - 66, UI_TEXT.fest.just, '#ffd34d');
        session.addPoints(PTS_JUST, bx, by + api.areaY - 40);
        SFX.good();
      }
    } else {
      // 早すぎ/遅すぎ: 小さな花(それでも きれい。得点も入る。コンボは伸びない)
      bloom(bx, by, s.hue, 0.5);
      session.addPoints(PTS_SMALL, bx, by + api.areaY - 30, false);
      SFX.pop();
    }
    removeShell(s);
  };
  scene.input.on('pointerdown', onDown);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i];
      s.img.y -= s.vy * dt;
      // わっかを通りすぎて上まで行ったら不発(しゅう…)
      if (s.img.y < s.ringY - 110) {
        session.resetCombo();
        floatUp(scene, s.img.x, s.img.y + api.areaY, UI_TEXT.fest.fizzle, '#8a7a62');
        const puff = scene.add
          .particles(s.img.x, s.img.y + api.areaY, TX_DOT, {
            speed: { min: 15, max: 45 },
            lifespan: 500,
            scale: { start: 0.8, end: 0 },
            tint: 0x9a9a9a,
            emitting: false,
          })
          .setDepth(DEPTH.overlay);
        puff.explode(8);
        scene.time.delayedCall(600, () => puff.destroy());
        removeShell(s);
      }
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    launchTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);

  launch();
}

/* みなとの夜: 夜空+星+海と船のシルエット+見物の人だかり */
function drawNightPort(scene: Phaser.Scene, area: Phaser.GameObjects.Container): void {
  const g = scene.add.graphics();
  g.fillGradientStyle(0x1c2447, 0x1c2447, 0x3a3560, 0x3a3560, 1);
  g.fillRect(0, 0, GAME_W, AREA_H);
  // 海
  g.fillStyle(0x24305c, 1);
  g.fillRect(0, 470, GAME_W, AREA_H - 470);
  g.fillStyle(0x3a4a7a, 0.5);
  for (let i = 0; i < 5; i++) g.fillRoundedRect(20 + i * 95, 486 + (i % 2) * 26, 62, 5, 2.5);
  // 船のシルエット
  g.fillStyle(0x11172e, 1);
  g.fillRoundedRect(40, 500, 130, 26, 8);
  g.fillRect(95, 468, 8, 34);
  g.fillRoundedRect(300, 520, 150, 28, 8);
  g.fillRect(360, 482, 9, 40);
  // 見物の人だかり(まっくろシルエット)
  g.fillStyle(0x0d1226, 1);
  g.fillRect(0, 596, GAME_W, AREA_H - 596);
  for (let x = 12; x < GAME_W; x += 30) {
    g.fillCircle(x + (x % 60 === 12 ? 4 : 0), 596 - (x % 90 === 12 ? 8 : 3), 11);
  }
  area.add(g);
  // 星
  for (let i = 0; i < 30; i++) {
    const star = scene.add.circle(
      Math.random() * GAME_W,
      60 + Math.random() * 330,
      0.8 + Math.random() * 1.4,
      0xfff2c4,
      0.4 + Math.random() * 0.6,
    );
    area.add(star);
    scene.tweens.add({ targets: star, alpha: 0.15, duration: 700 + Math.random() * 1500, yoyo: true, repeat: -1 });
  }
}

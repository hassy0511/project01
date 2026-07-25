/* よしだの ひまつり(やまなし・ふじよしだ): たいまつ点火リレー。
   まちなかに ならぶ 大たいまつ。指で「ひだね」を つかんで はこび、
   まだ ついていない たいまつに ふれると 点火(得点)。
   ひだねには「のこり時間」があり、かぜで だんだん 小さくなる。
   ついている たいまつに ふれると ひだねが 元気に なる(給油ポイント)。
   きえても ひだねが すぐ わたされるだけ(成功保証)。
   全部つくと「まちが あかるい!」でボーナス+ならびが 増える(C要素) */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const LIT_PTS = 12;
const ALL_BONUS = 30;
/** ひだねの もち時間(ms): 序盤→終盤で みじかくなる */
const FUEL_FROM = 4200;
const FUEL_TO = 2600;
/** たいまつの ならび */
const ROWS = [
  { y: 250, n: 3 },
  { y: 370, n: 4 },
  { y: 490, n: 5 },
];

interface Torch {
  x: number;
  y: number;
  lit: boolean;
  g: Phaser.GameObjects.Graphics;
  fire: Phaser.GameObjects.Text;
}

export function renderHimatsuri(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 夜の ふじさんの ふもと
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x141a33, 0x141a33, 0x2a2140, 0x2a2140, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0x3b3358, 1);
  bg.fillTriangle(60, 200, 240, 60, 420, 200); // ふじさん
  bg.fillStyle(0xf0f4ff, 0.9);
  bg.fillTriangle(198, 110, 240, 60, 282, 110);
  area.add(bg);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'himatsuri',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- たいまつ ---------- */
  const torches: Torch[] = [];
  const buildTorches = (): void => {
    for (const t of torches) {
      t.g.destroy();
      t.fire.destroy();
    }
    torches.length = 0;
    for (const row of ROWS) {
      for (let i = 0; i < row.n; i++) {
        const x = (GAME_W / (row.n + 1)) * (i + 1);
        const g = scene.add.graphics();
        g.fillStyle(0x6b4a2a, 1);
        g.fillTriangle(x - 16, row.y + 44, x + 16, row.y + 44, x, row.y - 10); // たいまつの たば
        g.fillStyle(0x4a3520, 1);
        g.fillRect(x - 4, row.y + 30, 8, 26);
        area.add(g);
        const fire = scene.add.text(x, row.y - 22, '🔥', { fontSize: '26px' }).setOrigin(0.5).setAlpha(0);
        area.add(fire);
        torches.push({ x, y: row.y, lit: false, g, fire });
      }
    }
  };
  buildTorches();

  /* ---------- ひだね(指で はこぶ) ---------- */
  const seed = scene.add.container(GAME_W / 2, 600);
  const sg = scene.add.graphics();
  seed.add(sg);
  const seedFire = scene.add.text(0, 0, '🔥', { fontSize: '30px' }).setOrigin(0.5);
  seed.add(seedFire);
  area.add(seed);

  let fuel = 1;
  const fuelMax = (): number => Phaser.Math.Linear(FUEL_FROM, FUEL_TO, session.progress());
  const drawSeed = (): void => {
    sg.clear();
    sg.fillStyle(0xffd34d, 0.25 + 0.35 * fuel);
    sg.fillCircle(0, 0, 22 + 16 * fuel);
    seedFire.setScale(0.6 + 0.6 * fuel);
  };
  drawSeed();

  const relight = (): void => {
    fuel = 1;
    drawSeed();
    SFX.pop();
    burst(scene, seed.x, seed.y + api.areaY, 6, [0xffd34d, 0xff7043]);
  };

  const onDown = (p: Phaser.Input.Pointer): void => {
    seed.setPosition(p.worldX, Phaser.Math.Clamp(p.worldY - api.areaY, 120, AREA_H - 30));
  };
  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!p.isDown || session.isEnded()) return;
    seed.setPosition(p.worldX, Phaser.Math.Clamp(p.worldY - api.areaY, 120, AREA_H - 30));
    // たいまつに ふれた?
    for (const t of torches) {
      if (Math.hypot(seed.x - t.x, seed.y - t.y) > 42) continue;
      if (!t.lit) {
        if (fuel <= 0) continue;
        t.lit = true;
        t.fire.setAlpha(1);
        scene.tweens.add({ targets: t.fire, y: t.y - 30, scale: { from: 0.6, to: 1 }, duration: 220 });
        scene.tweens.add({ targets: t.fire, alpha: 0.75, duration: 420, yoyo: true, repeat: -1 });
        SFX.pop();
        impactRing(scene, t.x, t.y + api.areaY - 20, 0xffd34d, 10);
        burst(scene, t.x, t.y + api.areaY - 20, 7, [0xffd34d, 0xff7043]);
        session.addPoints(LIT_PTS, t.x, t.y + api.areaY - 46);
        floatUp(scene, t.x, t.y + api.areaY - 64, UI_TEXT.fest.hiLit, '#e0812a');
        if (torches.every((x) => x.lit)) {
          SFX.fanfare();
          session.addPoints(ALL_BONUS, GAME_W / 2, 200 + api.areaY, false);
          floatUp(scene, GAME_W / 2, 180 + api.areaY, UI_TEXT.fest.hiAll, '#3f7d2c');
          bigImpact(scene, GAME_W / 2, 300 + api.areaY);
          confetti(scene, 18);
          scene.time.delayedCall(700, () => {
            if (!session.isEnded()) {
              buildTorches();
              relight();
            }
          });
        }
      } else if (fuel < 0.6) {
        // ついている たいまつから ひを もらう
        relight();
      }
    }
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const before = fuel;
    fuel = Math.max(0, fuel - Math.min(dtMs, 33) / fuelMax());
    drawSeed();
    if (before > 0 && fuel <= 0) {
      // きえた: すぐ 新しい ひだねが わたされる(ペナルティは コンボ切れだけ)
      session.resetCombo();
      SFX.bad();
      floatUp(scene, seed.x, seed.y + api.areaY - 40, UI_TEXT.fest.hiOut, '#c04545');
      scene.time.delayedCall(600, () => {
        if (!session.isEnded()) relight();
      });
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

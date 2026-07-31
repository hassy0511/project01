/* すわの おんばしら(ながの): 木落し(きおとし)ゲーム。
   坂を すべりおりる 大きな木。木は 左右に かたむいていくので、
   かたむいた「はんたいがわ」を タップして たてなおしながら、下まで おりる。
   まっすぐなほど はやく すべり、得点も 高い。おおきく かたむくと 速度が おちるだけ(成功保証)。
   1本 おりきると 次の木が すこし ながく(=かたむきやすく)なる = C要素のはしご */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';
import { SCENERY_NAME } from '../../ui/scenery';

const AREA_H = GAME_AREA_H;
const START_Y = 150;
const GOAL_Y = 560;
/** すべる はやさ(px/s): まっすぐな時と かたむいた時 */
const SPEED_OK = 62;
const SPEED_TILT = 22;
/** かたむきの じそく(度/秒)。レベルで つよくなる */
const TILT_BASE = 13;
const TILT_PER_LV = 4;
/** タップ1回の たてなおし(度) */
const FIX_DEG = 9;
const TILT_MAX = 34;
/** 距離ごとの 得点きざみ */
const TICK_MS = 500;
const TICK_PTS = 7;
const GOAL_PTS = 26;

export function renderOnbashira(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 春の やまの さかみち
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xaee3f7, 0xaee3f7, 0xd7efc3, 0xd7efc3, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0x6faf5b, 1);
  bg.fillTriangle(-20, AREA_H, -20, 120, GAME_W + 20, AREA_H); // さか
  bg.fillStyle(0x8a6a4a, 0.55);
  bg.fillTriangle(20, AREA_H, 60, 130, GAME_W - 40, AREA_H); // すべりみち
  area.add(bg.setName(SCENERY_NAME)); // 手描きの 背景が 来たら かくれる
  for (let i = 0; i < 6; i++) {
    area.add(addIcon(scene, 24 + i * 12, 150 + i * 82, 'tree:deepgreen', 22));
    area.add(addIcon(scene, GAME_W - 30 - i * 6, 190 + i * 74, 'tree:deepgreen', 20));
  }

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'onbashira',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- 木(まるた)+のり手 ---------- */
  let level = 1;
  const log = scene.add.container(GAME_W / 2, START_Y);
  const lg = scene.add.graphics();
  const drawLog = (): void => {
    lg.clear();
    const w = 150 + level * 26;
    lg.fillStyle(0xa9713a, 1);
    lg.fillRoundedRect(-w / 2, -18, w, 36, 18);
    lg.fillStyle(0xc9a86a, 1);
    lg.fillEllipse(-w / 2 + 6, 0, 16, 30);
    lg.fillEllipse(w / 2 - 6, 0, 16, 30);
    lg.lineStyle(3, 0x8a5a2a, 1);
    for (let i = -2; i <= 2; i++) lg.lineBetween(i * 24, -18, i * 24, 18);
  };
  drawLog();
  log.add(lg);
  const riders: Phaser.GameObjects.Image[] = [];
  for (const dx of [-40, 0, 40]) {
    const r = addIcon(scene, dx, -30, 'person:teal', 24);
    log.add(r);
    riders.push(r);
  }
  area.add(log);

  // かたむきメーター
  const meter = scene.add.graphics();
  area.add(meter);
  const drawMeter = (deg: number): void => {
    meter.clear();
    const mx = GAME_W / 2;
    const my = 96;
    meter.fillStyle(0xffffff, 0.85);
    meter.fillRoundedRect(mx - 120, my - 9, 240, 18, 9);
    meter.fillStyle(0x9ccb6f, 0.9);
    meter.fillRoundedRect(mx - 40, my - 9, 80, 18, 9);
    const nx = mx + (Phaser.Math.Clamp(deg, -TILT_MAX, TILT_MAX) / TILT_MAX) * 120;
    meter.fillStyle(0xd94f4f, 1);
    meter.fillRoundedRect(nx - 5, my - 14, 10, 28, 5);
  };

  let deg = 0;
  let dir = Math.random() < 0.5 ? -1 : 1;
  let dirTimer: Phaser.Time.TimerEvent | undefined;
  const scheduleDir = (): void => {
    dirTimer = scene.time.delayedCall(1200 + Math.random() * 1600, () => {
      dir *= -1;
      scheduleDir();
    });
  };
  scheduleDir();

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    const side = p.worldX < GAME_W / 2 ? -1 : 1;
    // かたむいている はんたいがわを タップすると たてなおる
    if (Math.sign(deg) !== 0 && side !== Math.sign(deg)) {
      deg -= Math.sign(deg) * FIX_DEG;
      SFX.pop();
      burst(scene, p.worldX, log.y + api.areaY, 3, [0xd8c49a, 0xffffff]);
      for (const [i, r] of riders.entries()) {
        scene.tweens.add({ targets: r, y: -38, duration: 110, yoyo: true, delay: i * 25 });
      }
    } else {
      // よけいに かたむける(あれれ)
      deg += side * FIX_DEG * 0.6;
      SFX.bad();
      session.resetCombo();
      floatUp(scene, p.worldX, log.y + api.areaY - 40, UI_TEXT.fest.kiTilt, '#c04545');
      missShake(scene);
    }
  };
  scene.input.on('pointerdown', onDown);

  const tick = scene.time.addEvent({
    delay: TICK_MS,
    loop: true,
    callback: () => {
      if (session.isEnded()) return;
      if (Math.abs(deg) <= 12) {
        session.addPoints(TICK_PTS, log.x, log.y + api.areaY - 50);
        if (Math.random() < 0.3) floatUp(scene, log.x + 80, log.y + api.areaY - 30, UI_TEXT.fest.kiSlide, '#e0812a');
      }
    },
  });

  const nextLog = (): void => {
    SFX.fanfare();
    session.addPoints(GOAL_PTS, GAME_W / 2, GOAL_Y + api.areaY - 40, false);
    floatUp(scene, GAME_W / 2, GOAL_Y + api.areaY - 70, UI_TEXT.fest.kiGoal, '#3f7d2c');
    bigImpact(scene, GAME_W / 2, GOAL_Y + api.areaY);
    confetti(scene, 14);
    level++;
    drawLog();
    deg = 0;
    log.setAngle(0);
    log.setPosition(GAME_W / 2, START_Y);
  };

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    deg += dir * (TILT_BASE + level * TILT_PER_LV) * dt;
    if (Math.abs(deg) > TILT_MAX) deg = Math.sign(deg) * TILT_MAX;
    const speed = Math.abs(deg) <= 12 ? SPEED_OK : SPEED_TILT;
    log.y += speed * dt;
    log.setAngle(deg);
    drawMeter(deg);
    if (log.y >= GOAL_Y) nextLog();
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    dirTimer?.remove();
    tick.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

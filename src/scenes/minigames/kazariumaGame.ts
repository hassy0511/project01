/* ふじさきはちまんぐう れいたいさい「ぼした祭り」(くまもと): きれいに かざった うまを ひいて まちを ねりあるく。
   うまは おおきな おとや ひとごみに びっくりする ― だから これは「うまを なだめながら すすむ」ゲーム。
     ・「すすむ」ボタンで まえへ(すすむと 得点)
     ・うまの おちつきメーターが さがると あばれそうに なる
       → うまの からだを なでる(スワイプ)と おちつく
     ・おちつきが 0に なると たちどまる(すすめない だけ。うまも 人も けがを しない)
   ゴール(とりい)まで つくと ボーナス。動作=なだめる スワイプ + すすむ タップの りょうりつ */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const HORSE_X = 170;
const HORSE_Y = 420;
const GOAL_M = 30;
const STEP_M = 0.6;
const STEP_PTS = 5;
const CALM_PTS = 7;
const GOAL_BONUS = 55;
/** おちつきの げんしょう(/s。おどろき イベントで どんと さがる) */
const CALM_DROP = 0.13;
const SCARE_DROP = 0.3;
const CALM_UP = 0.16;
const SWIPE_MIN = 36;

export function renderKazariuma(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xbfe4f5, 0xbfe4f5, 0xe9e0c0, 0xe9e0c0, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0xc8b088, 1);
  bg.fillRect(0, 500, GAME_W, AREA_H - 500);
  area.add(bg);
  // まちの ひとたち(おどろかす げんいん)
  const crowd: Phaser.GameObjects.Text[] = [];
  for (let i = 0; i < 8; i++) {
    const t = scene.add.text(30 + i * 60, 300 + (i % 2) * 26, '🧑', { fontSize: '22px' }).setOrigin(0.5).setAlpha(0.8);
    area.add(t);
    crowd.push(t);
  }
  const torii = scene.add.text(GAME_W - 50, 250, '⛩️', { fontSize: '40px' }).setOrigin(0.5);
  area.add(torii);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'kazariuma',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- かざりうま ---------- */
  const horse = scene.add.container(HORSE_X, HORSE_Y);
  const hg = scene.add.graphics();
  hg.fillStyle(0xc0392b, 1);
  hg.fillRoundedRect(-60, -30, 120, 60, 12); // かざりの ぬの
  hg.fillStyle(0xffd34d, 1);
  for (let i = 0; i < 4; i++) hg.fillCircle(-40 + i * 26, 0, 8);
  horse.add(hg);
  horse.add(scene.add.text(0, -52, '🐴', { fontSize: '48px' }).setOrigin(0.5));
  horse.add(scene.add.text(-70, 10, '🧑', { fontSize: '24px' }).setOrigin(0.5)); // ひきて
  area.add(horse);

  /* ---------- おちつきメーター ---------- */
  let calm = 1;
  let dist = 0;
  let goals = 0;
  const gauge = scene.add.graphics();
  area.add(gauge);
  const info = scene.add
    .text(GAME_W / 2, 180, '', { fontFamily: FONT, fontSize: '15px', color: '#5a4632', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(info);
  const mood = scene.add.text(HORSE_X, HORSE_Y - 110, '', { fontSize: '26px' }).setOrigin(0.5);
  area.add(mood);

  const draw = (): void => {
    gauge.clear();
    gauge.fillStyle(0xffffff, 0.7);
    gauge.fillRoundedRect(60, 148, GAME_W - 120, 16, 8);
    gauge.fillStyle(calm > 0.5 ? 0x6fbf44 : calm > 0.2 ? 0xffd34d : 0xe05b5b, 1);
    gauge.fillRoundedRect(60, 148, Math.max(5, (GAME_W - 120) * calm), 16, 8);
    // すすんだ ぶん
    gauge.fillStyle(0xffffff, 0.5);
    gauge.fillRoundedRect(60, 210, GAME_W - 120, 10, 5);
    gauge.fillStyle(0x8a6a4a, 1);
    gauge.fillRoundedRect(60, 210, Math.max(4, ((GAME_W - 120) * dist) / GOAL_M), 10, 5);
    info.setText(UI_TEXT.fest.umaInfo(Math.floor(dist), GOAL_M, goals));
    mood.setText(calm > 0.55 ? '🎶' : calm > 0.2 ? '💦' : '💢');
    mood.x = horse.x;
  };
  draw();

  /* ---------- おどろき イベント ---------- */
  const scareTimer = scene.time.addEvent({
    delay: 3800,
    loop: true,
    callback: () => {
      if (session.isEnded()) return;
      calm = Math.max(0, calm - SCARE_DROP);
      SFX.bad();
      const c = crowd[Math.floor(Math.random() * crowd.length)];
      floatUp(scene, c.x, c.y + api.areaY, UI_TEXT.fest.umaScare, '#c04545');
      scene.tweens.add({ targets: horse, angle: { from: -6, to: 0 }, duration: 260 });
      scene.tweens.add({ targets: c, y: c.y - 14, duration: 160, yoyo: true });
      draw();
    },
  });

  /* ---------- にゅうりょく ---------- */
  const stepBtn = scene.add.container(GAME_W / 2, 610);
  const sg = scene.add.graphics();
  sg.fillStyle(0x3f7d2c, 1);
  sg.fillRoundedRect(-96, -28, 192, 56, 14);
  stepBtn.add(sg);
  stepBtn.add(
    scene.add
      .text(0, 0, UI_TEXT.fest.umaStep, { fontFamily: FONT, fontSize: '18px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5),
  );
  stepBtn.setSize(200, 68);
  stepBtn.setInteractive({ useHandCursor: true });
  area.add(stepBtn);

  stepBtn.on('pointerdown', () => {
    if (session.isEnded()) return;
    if (calm <= 0.02) {
      floatUp(scene, horse.x, HORSE_Y + api.areaY - 90, UI_TEXT.fest.umaStop, '#c04545');
      session.resetCombo();
      return;
    }
    dist += STEP_M;
    calm = Math.max(0, calm - 0.02);
    SFX.pop();
    session.addPoints(STEP_PTS, horse.x, HORSE_Y + api.areaY - 80);
    horse.x = Math.min(GAME_W - 110, HORSE_X + (dist / GOAL_M) * (GAME_W - 110 - HORSE_X));
    scene.tweens.add({ targets: horse, y: HORSE_Y - 6, duration: 100, yoyo: true });
    burst(scene, horse.x - 40, 500 + api.areaY, 3, [0xc8b088, 0xffffff]);
    if (dist >= GOAL_M) {
      goals++;
      dist = 0;
      calm = 1;
      SFX.fanfare();
      bigImpact(scene, torii.x, torii.y + api.areaY, 0xffd34d);
      confetti(scene, 18);
      session.addPoints(GOAL_BONUS, GAME_W / 2, 300 + api.areaY, false);
      floatUp(scene, GAME_W / 2, 260 + api.areaY, UI_TEXT.fest.umaGoal(goals), '#e0812a');
      horse.x = HORSE_X;
    }
    draw();
  });

  // なでる(スワイプ)
  let downX = 0;
  let downY = 0;
  const onDown = (p: Phaser.Input.Pointer): void => {
    downX = p.worldX;
    downY = p.worldY;
  };
  const onUp = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    const dx = p.worldX - downX;
    const dy = p.worldY - downY;
    if (Math.hypot(dx, dy) < SWIPE_MIN) return;
    // うまの ちかくで なでたか
    if (Math.hypot(p.worldX - horse.x, p.worldY - api.areaY - HORSE_Y) > 130) return;
    calm = Math.min(1, calm + CALM_UP);
    SFX.good();
    impactRing(scene, horse.x, HORSE_Y + api.areaY, 0x9ccb6f, 10);
    session.addPoints(CALM_PTS, horse.x, HORSE_Y + api.areaY - 110);
    floatUp(scene, horse.x, HORSE_Y + api.areaY - 140, UI_TEXT.fest.umaCalm, '#3f7d2c');
    draw();
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointerup', onUp);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    calm = Math.max(0, calm - CALM_DROP * (Math.min(dtMs, 33) / 1000));
    draw();
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointerup', onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    scareTimer.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

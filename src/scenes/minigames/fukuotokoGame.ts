/* にしのみやの とおかえびす(ひょうご): 「ふくおとこ えらび」の かいもんしんじ。
   もんが ひらいたら、ほんでんまで はしる ― れんだ(タップ)で すすむ ゲーム。
   ただし ころんでは いけない: みちには 石だんと ひとの かたまりが あって、
   ちかづいたら スワイプで よける(うえ=とぶ / よこ=かわす)。
   ころんでも「しっぱい」に しない: すこし とまるだけ(すぐ たてなおして また はしる)。
   ゴールすると つぎの としの かいもん ― 何回 ゴールできるかの ゲーム。
   動作=れんだ+はんしゃスワイプ。ほかの おまつりゲームに ない てざわり */
import Phaser from 'phaser';
import { addIcon, setIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const RUNNER_X = 120;
const GROUND_Y = 470;
/** コース(m) */
const COURSE_M = 60;
/** タップ1かいで すすむ きょり(m) */
const STEP_M = 0.9;
/** じゃまが くる はんいと はんてい */
const OBST_X = RUNNER_X + 42;
const DODGE_PX = 74;
const RUN_PTS = 3;
const DODGE_PTS = 14;
const GOAL_PTS = 60;

type ObstKind = 'jump' | 'side';

interface Obst {
  obj: Phaser.GameObjects.Image;
  kind: ObstKind;
  x: number;
  passed: boolean;
}

export function renderFukuotoko(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x2f3f6b, 0x2f3f6b, 0x6b5a7a, 0x6b5a7a, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  // とりいの ならぶ さんどう
  for (let i = 0; i < 4; i++) {
    const x = 60 + i * 120;
    bg.fillStyle(0xc0392b, 1);
    bg.fillRect(x - 34, 250, 10, 180);
    bg.fillRect(x + 24, 250, 10, 180);
    bg.fillRect(x - 46, 240, 92, 12);
  }
  bg.fillStyle(0x5a4632, 1);
  bg.fillRect(0, GROUND_Y, GAME_W, AREA_H - GROUND_Y); // じめん
  bg.fillStyle(0x6b5442, 1);
  for (let i = 0; i < 12; i++) bg.fillRect(i * 42, GROUND_Y, 30, 6);
  area.add(bg);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'fukuotoko',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- はしるひと ---------- */
  const runner = addIcon(scene, RUNNER_X, GROUND_Y - 26, 'person-runner:sky', 44);
  area.add(runner);
  const ribbon = addIcon(scene, RUNNER_X - 26, GROUND_Y - 54, 'bamboo:lime', 20);
  area.add(ribbon);

  // すすんだ きょりの メーター
  const meter = scene.add.graphics();
  area.add(meter);
  const meterText = scene.add
    .text(GAME_W / 2, 210, '', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffe8b0', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(meterText);

  /* ---------- 状態 ---------- */
  let dist = 0; // m
  let goals = 0;
  let fallenUntil = 0;
  let jumpUntil = 0;
  const obsts: Obst[] = [];
  let spawnTimer: Phaser.Time.TimerEvent | undefined;

  const drawMeter = (): void => {
    meter.clear();
    meter.fillStyle(0xffffff, 0.3);
    meter.fillRoundedRect(50, 176, GAME_W - 100, 16, 8);
    meter.fillStyle(0xffd34d, 1);
    meter.fillRoundedRect(50, 176, Math.max(6, ((GAME_W - 100) * dist) / COURSE_M), 16, 8);
    meterText.setText(UI_TEXT.fest.fukuotokoMeter(Math.floor(dist), COURSE_M, goals));
  };
  drawMeter();

  const spawn = (): void => {
    if (session.isEnded()) return;
    const kind: ObstKind = Math.random() < 0.5 ? 'jump' : 'side';
    const obj = addIcon(
      scene,
      GAME_W + 30,
      kind === 'jump' ? GROUND_Y - 14 : GROUND_Y - 30,
      kind === 'jump' ? 'rock:gray' : 'crowd:teal',
      kind === 'jump' ? 30 : 34,
    );
    area.add(obj);
    obsts.push({ obj, kind, x: GAME_W + 30, passed: false });
    spawnTimer = scene.time.delayedCall(1400 + Math.random() * 900 - 500 * session.progress(), spawn);
  };
  spawnTimer = scene.time.delayedCall(1600, spawn);

  const fall = (): void => {
    fallenUntil = Date.now() + 900;
    SFX.bad();
    missShake(scene);
    session.resetCombo();
    setIcon(runner, 'face-sad:cream');
    floatUp(scene, RUNNER_X, GROUND_Y + api.areaY - 70, UI_TEXT.fest.fukuotokoFall, '#c04545');
    scene.time.delayedCall(900, () => {
      if (!session.isEnded()) setIcon(runner, 'person-runner:sky');
    });
  };

  const goal = (): void => {
    goals++;
    dist = 0;
    SFX.fanfare();
    bigImpact(scene, RUNNER_X, GROUND_Y + api.areaY - 40, 0xffd34d);
    confetti(scene, 18);
    session.addPoints(GOAL_PTS, GAME_W / 2, 300 + api.areaY, false);
    floatUp(scene, GAME_W / 2, 260 + api.areaY, UI_TEXT.fest.fukuotokoGoal, '#e0812a');
    for (const o of obsts) o.obj.destroy();
    obsts.length = 0;
  };

  /* ---------- にゅうりょく: れんだ + スワイプ ---------- */
  let downAt = 0;
  let downX = 0;
  let downY = 0;

  const onDown = (p: Phaser.Input.Pointer): void => {
    downAt = Date.now();
    downX = p.worldX;
    downY = p.worldY;
  };

  const dodge = (kind: ObstKind): void => {
    // ちかい じゃまを さがす
    const near = obsts.find((o) => !o.passed && Math.abs(o.x - OBST_X) < DODGE_PX);
    if (!near) return;
    if (near.kind !== kind) {
      fall();
      near.passed = true;
      return;
    }
    near.passed = true;
    SFX.good();
    impactRing(scene, near.x, near.obj.y + api.areaY, 0x9ad0f5, 10);
    session.addPoints(DODGE_PTS, near.x, near.obj.y + api.areaY - 50);
    floatUp(
      scene,
      RUNNER_X,
      GROUND_Y + api.areaY - 90,
      kind === 'jump' ? UI_TEXT.fest.fukuotokoJump : UI_TEXT.fest.fukuotokoSide,
      '#3f7d2c',
    );
    if (kind === 'jump') {
      jumpUntil = Date.now() + 520;
      scene.tweens.add({ targets: [runner, ribbon], y: '-=62', duration: 240, yoyo: true, ease: 'Quad.easeOut' });
    } else {
      scene.tweens.add({ targets: [runner, ribbon], x: '-=34', duration: 180, yoyo: true });
    }
  };

  const onUp = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    const dt = Date.now() - downAt;
    const dx = p.worldX - downX;
    const dy = p.worldY - downY;
    const swipe = Math.hypot(dx, dy) > 40 && dt < 500;
    if (swipe) {
      dodge(Math.abs(dy) > Math.abs(dx) && dy < 0 ? 'jump' : 'side');
      return;
    }
    // れんだ: はしる
    if (Date.now() < fallenUntil) return;
    dist += STEP_M;
    session.addPoints(RUN_PTS, RUNNER_X + 30, GROUND_Y + api.areaY - 60);
    burst(scene, RUNNER_X - 20, GROUND_Y + api.areaY, 3, [0xd8c69a, 0xffffff]);
    if (Date.now() > jumpUntil) {
      scene.tweens.add({ targets: [runner, ribbon], y: '-=10', duration: 70, yoyo: true });
    }
    drawMeter();
    if (dist >= COURSE_M) goal();
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointerup', onUp);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    // じゃまは 走る はやさで ながれてくる(すすんだ ぶんだけ)
    const flow = 150 + 90 * session.progress();
    for (const o of obsts) {
      o.x -= flow * dt;
      o.obj.x = o.x;
      if (!o.passed && o.x < RUNNER_X - 10) {
        o.passed = true;
        if (Date.now() > jumpUntil) fall(); // よけられなかった
      }
      if (o.x < -40) o.obj.destroy();
    }
    while (obsts.length && obsts[0].x < -40) obsts.shift();
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointerup', onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    spawnTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

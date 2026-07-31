/* さいだいじ えよう(おかやま): まよなかに なげこまれる「しんぎ」を うけとって、もみあいの中を すすむ。
   だん1「うけとる」: くらい どうから しんぎが おちてくる。ひかりの すじで おちる ばしょが わかるので、
     そこを タップして うけとる。
   だん2「こらえる」: まわりから「おし」が くる。やじるしの ほうから おされるので
     はんたいがわに スワイプして ふんばる。3かい こらえると 門まで もっていけて 大とくてん。
   おされて しんぎを はなしても また なげこまれる(しっぱいに しない)。
   動作=よそくタップ + はんたい方向スワイプ(おしかえし) */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import { offPointerRelease, onPointerRelease } from './input';
import type { MinigameApi } from './types';
import { SCENERY_NAME } from '../../ui/scenery';

const AREA_H = GAME_AREA_H;
const FLOOR_Y = 500;
const CATCH_PTS = 16;
const HOLD_PTS = 18;
const CARRY_BONUS = 55;
const HOLDS_TO_GOAL = 3;
/** しんぎが おちてくる じかん */
const FALL_MS = 1300;
const SWIPE_MIN = 40;

type Side = 'left' | 'right';

export function renderEyou(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // くらい どう(はだか祭りの よる)
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x14141f, 0x14141f, 0x2f2a35, 0x2f2a35, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0x3a2f2a, 1);
  bg.fillRect(0, FLOOR_Y, GAME_W, AREA_H - FLOOR_Y);
  // どうの はり
  bg.fillStyle(0x241d18, 1);
  bg.fillRect(0, 120, GAME_W, 18);
  area.add(bg.setName(SCENERY_NAME)); // 手描きの 背景が 来たら かくれる
  // もみあう ひとたち(あたま)
  const crowd: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < 14; i++) {
    const t = addIcon(scene, 20 + (i % 7) * 72, FLOOR_Y + 30 + Math.floor(i / 7) * 46, 'person:teal', 26)
      .setAlpha(0.85);
    area.add(t);
    crowd.push(t);
  }
  // 門(ゴール)
  const gate = addIcon(scene, GAME_W - 44, 210, 'shrine:red', 38);
  area.add(gate);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'eyou',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- 状態 ---------- */
  let phase: 'fall' | 'hold' = 'fall';
  let holds = 0;
  let pushSide: Side | null = null;
  let carried = 0;
  const light = scene.add.graphics();
  area.add(light);
  const shingi = addIcon(scene, 0, 0, 'log:tan', 34).setVisible(false).setName('mg-shingi');
  area.add(shingi);
  const holder = addIcon(scene, GAME_W / 2, FLOOR_Y - 30, 'person:gray', 40);
  area.add(holder);
  const info = scene.add
    .text(GAME_W / 2, 170, '', { fontFamily: 'sans-serif', fontSize: '15px', color: '#ffe8b0', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(info);

  let fallX = 0;
  let fallStart = 0;
  let fallTimer: Phaser.Time.TimerEvent | undefined;
  let pushTimer: Phaser.Time.TimerEvent | undefined;

  const startFall = (): void => {
    if (session.isEnded()) return;
    phase = 'fall';
    pushSide = null;
    fallX = 60 + Math.random() * (GAME_W - 120);
    fallStart = Date.now();
    shingi.setPosition(fallX, 130).setVisible(true);
    info.setText(UI_TEXT.fest.eyouCatchHint);
    SFX.hint();
    fallTimer = scene.time.delayedCall(FALL_MS + 400, () => {
      if (phase !== 'fall') return;
      // だれかに とられた(コンボ切れ)
      shingi.setVisible(false);
      session.resetCombo();
      floatUp(scene, fallX, FLOOR_Y + api.areaY - 60, UI_TEXT.fest.eyouLost, '#c04545');
      scene.time.delayedCall(500, startFall);
    });
  };

  const nextPush = (): void => {
    if (session.isEnded() || phase !== 'hold') return;
    pushSide = Math.random() < 0.5 ? 'left' : 'right';
    info.setText(pushSide === 'left' ? UI_TEXT.fest.eyouPushLeft : UI_TEXT.fest.eyouPushRight);
    SFX.hint();
    scene.tweens.add({
      targets: holder,
      x: GAME_W / 2 + (pushSide === 'left' ? 40 : -40),
      duration: 700,
      ease: 'Sine.easeIn',
    });
    pushTimer = scene.time.delayedCall(1500, () => {
      if (phase !== 'hold' || !pushSide) return;
      // ふんばれなかった: しんぎを はなす
      pushSide = null;
      session.resetCombo();
      missShake(scene);
      SFX.bad();
      floatUp(scene, holder.x, FLOOR_Y + api.areaY - 80, UI_TEXT.fest.eyouDrop, '#c04545');
      shingi.setVisible(false);
      holds = 0;
      scene.tweens.add({ targets: holder, x: GAME_W / 2, duration: 300 });
      scene.time.delayedCall(600, startFall);
    });
  };

  const startHold = (): void => {
    phase = 'hold';
    holds = 0;
    scene.time.delayedCall(500, nextPush);
  };

  const goal = (): void => {
    carried++;
    SFX.fanfare();
    bigImpact(scene, gate.x, gate.y + api.areaY);
    confetti(scene, 20);
    session.addPoints(CARRY_BONUS, GAME_W / 2, 300 + api.areaY, false);
    floatUp(scene, GAME_W / 2, 260 + api.areaY, UI_TEXT.fest.eyouGoal, '#e0812a');
    shingi.setVisible(false);
    holds = 0;
    scene.time.delayedCall(900, startFall);
  };

  /* ---------- にゅうりょく ---------- */
  let downX = 0;
  let downY = 0;
  const onDown = (p: Phaser.Input.Pointer): void => {
    downX = p.worldX;
    downY = p.worldY;
    if (session.isEnded() || phase !== 'fall' || !shingi.visible) return;
    // うけとる: しんぎの ちかくを タップ
    if (Math.hypot(p.worldX - shingi.x, p.worldY - api.areaY - shingi.y) < 70) {
      phase = 'hold';
      fallTimer?.remove();
      SFX.good();
      impactRing(scene, shingi.x, shingi.y + api.areaY, 0xffd34d, 12);
      burst(scene, shingi.x, shingi.y + api.areaY, 10);
      session.addPoints(CATCH_PTS, shingi.x, shingi.y + api.areaY - 40);
      floatUp(scene, shingi.x, shingi.y + api.areaY - 70, UI_TEXT.fest.eyouCatch, '#e0812a');
      shingi.setPosition(GAME_W / 2, FLOOR_Y - 70);
      startHold();
    }
  };

  const onUp = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded() || phase !== 'hold' || !pushSide) return;
    const dx = p.worldX - downX;
    const dy = p.worldY - downY;
    if (Math.hypot(dx, dy) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;
    const swiped: Side = dx > 0 ? 'right' : 'left';
    // 「ひだりから おされる」なら みぎに スワイプして ふんばる
    const need: Side = pushSide === 'left' ? 'right' : 'left';
    pushTimer?.remove();
    if (swiped !== need) {
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      floatUp(scene, holder.x, FLOOR_Y + api.areaY - 80, UI_TEXT.fest.eyouWrong, '#c04545');
      pushSide = null;
      scene.time.delayedCall(600, nextPush);
      return;
    }
    pushSide = null;
    holds++;
    SFX.good();
    impactRing(scene, holder.x, FLOOR_Y + api.areaY - 40, 0x9ccb6f, 12);
    session.addPoints(HOLD_PTS, holder.x, FLOOR_Y + api.areaY - 100);
    floatUp(scene, holder.x, FLOOR_Y + api.areaY - 130, UI_TEXT.fest.eyouHold, '#3f7d2c');
    scene.tweens.add({ targets: holder, x: GAME_W / 2, duration: 240, ease: 'Back.easeOut' });
    for (const [i, c] of crowd.entries()) {
      scene.tweens.add({ targets: c, y: c.y - 8, duration: 120, yoyo: true, delay: i * 20 });
    }
    if (holds >= HOLDS_TO_GOAL) goal();
    else scene.time.delayedCall(600, nextPush);
  };
  scene.input.on('pointerdown', onDown);
  onPointerRelease(scene, onUp);
  startFall();

  const onUpdate = (): void => {
    if (session.isEnded()) return;
    light.clear();
    if (phase === 'fall' && shingi.visible) {
      const t = Math.min(1, (Date.now() - fallStart) / FALL_MS);
      shingi.y = 130 + t * (FLOOR_Y - 200);
      shingi.setAngle(t * 300);
      // ひかりの すじ(おちる ばしょ)
      light.fillStyle(0xffd34d, 0.16);
      light.fillTriangle(fallX - 26, 130, fallX + 26, 130, fallX, FLOOR_Y - 40);
      light.fillStyle(0xffd34d, 0.3);
      light.fillEllipse(fallX, FLOOR_Y - 44, 54, 14);
    } else if (phase === 'hold' && shingi.visible) {
      shingi.setPosition(holder.x, FLOOR_Y - 70).setAngle(0);
    }
    info.setText(
      phase === 'hold' && !pushSide
        ? UI_TEXT.fest.eyouHoldInfo(holds, HOLDS_TO_GOAL, carried)
        : info.text,
    );
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    offPointerRelease(scene, onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    fallTimer?.remove();
    pushTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

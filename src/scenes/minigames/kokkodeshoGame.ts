/* ながさき くんち「コッコデショ」: たいこやまを そらへ ほうり上げて、かた手で うけとめる ど迫力の だしもの。
   だから これは「なげ上げ → うけとめ」の 2だん タイミング。
     1. ゲージが みどりの ゾーンに きたら タップ = ちょうど よい ちからで なげ上げ
        (よわいと ひくい / つよすぎると かたむいて おちる)
     2. たいこやまが おりてくる ― かげの わっかに かさなった しゅんかんに タップ = かた手うけ
   しっぱいしても だれも けがを しない(コンボが きれるだけ)。
   動作=2だんの タイミング(なげる/うける)。1だんの タップゲームとは べつの てざわり */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, cameraPulse, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';
import { SCENERY_NAME } from '../../ui/scenery';

const AREA_H = GAME_AREA_H;
const CX = GAME_W / 2;
const HOLD_Y = 470;
/** ゲージ */
const GX0 = 60;
const GX1 = GAME_W - 60;
const GY = 600;
const ZONE_W = 96;
const PERFECT_W = 34;
/** うけとめの はんてい(px) */
const CATCH_OK = 46;
const CATCH_PERFECT = 20;
const THROW_PTS = 14;
const CATCH_PTS = 26;
const PERFECT_BONUS = 30;

export function renderKokkodesho(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x2a2f55, 0x2a2f55, 0x6b4a5a, 0x6b4a5a, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0x4a3a2a, 1);
  bg.fillRect(0, 540, GAME_W, AREA_H - 540);
  for (let i = 0; i < 7; i++) {
    bg.fillStyle(0xffd34d, 0.9);
    bg.fillCircle(24 + i * 72, 80, 8);
  }
  area.add(bg.setName(SCENERY_NAME)); // 手描きの 背景が 来たら かくれる

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'kokkodesho',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- たいこやまと かつぎ手 ---------- */
  const dai = scene.add.container(CX, HOLD_Y);
  const dg = scene.add.graphics();
  dg.fillStyle(0x8a2f2f, 1);
  dg.fillRoundedRect(-80, -34, 160, 68, 10);
  dg.fillStyle(0xc9a23f, 1);
  dg.fillRect(-88, -42, 176, 12);
  dai.add(dg);
  dai.add(addIcon(scene, 0, 0, 'drum:crimson', 30));
  for (const dx of [-46, -16, 16, 46]) dai.add(addIcon(scene, dx, -60, 'person-child:amber', 18));
  area.add(dai);
  const holders: Phaser.GameObjects.Image[] = [];
  for (const dx of [-60, -20, 20, 60]) {
    const t = addIcon(scene, CX + dx, HOLD_Y + 60, 'person:teal', 26);
    area.add(t);
    holders.push(t);
  }
  // かげの わっか(うけとめの ばしょ)
  const shadow = scene.add.graphics();
  area.add(shadow);
  const drawShadow = (): void => {
    shadow.clear();
    shadow.lineStyle(4, 0xffd34d, 0.85);
    shadow.strokeCircle(CX, HOLD_Y, 54);
  };
  drawShadow();

  /* ---------- ゲージ(なげる ちから) ---------- */
  const gauge = scene.add.graphics();
  area.add(gauge);
  const label = scene.add
    .text(CX, GY - 44, '', { fontFamily: FONT, fontSize: '15px', color: '#ffe8b0', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(label);

  let phase: 'aim' | 'fly' = 'aim';
  let cursor = GX0;
  let dir = 1;
  let vy = 0;
  let catches = 0;
  let strongThrow = false;

  const zoneX = (GX0 + GX1) / 2;
  const drawGauge = (): void => {
    gauge.clear();
    if (phase !== 'aim') return;
    gauge.fillStyle(0xffffff, 0.5);
    gauge.fillRoundedRect(GX0, GY - 14, GX1 - GX0, 28, 10);
    gauge.fillStyle(0x9ccb6f, 0.9);
    gauge.fillRoundedRect(zoneX - ZONE_W / 2, GY - 14, ZONE_W, 28, 8);
    gauge.fillStyle(0xffd34d, 0.95);
    gauge.fillRoundedRect(zoneX - PERFECT_W / 2, GY - 14, PERFECT_W, 28, 6);
    gauge.fillStyle(0xe05b5b, 1);
    gauge.fillRoundedRect(cursor - 4, GY - 22, 8, 44, 4);
  };

  const throwUp = (): void => {
    const d = Math.abs(cursor - zoneX);
    const perfect = d <= PERFECT_W / 2;
    const ok = d <= ZONE_W / 2;
    strongThrow = !ok && cursor > zoneX;
    phase = 'fly';
    vy = perfect ? -520 : ok ? -440 : strongThrow ? -600 : -300;
    SFX.good();
    burst(scene, CX, HOLD_Y + api.areaY, 8, [0xffd34d, 0xffffff]);
    session.addPoints(THROW_PTS, CX, HOLD_Y + api.areaY - 60);
    floatUp(
      scene,
      CX,
      HOLD_Y + api.areaY - 90,
      perfect ? UI_TEXT.fest.kokkoGood : ok ? UI_TEXT.fest.kokkoThrow : UI_TEXT.fest.kokkoRough,
      perfect ? '#e0812a' : '#3f7d2c',
    );
    label.setText(UI_TEXT.fest.kokkoCatchHint);
    for (const [i, h] of holders.entries()) {
      scene.tweens.add({ targets: h, y: HOLD_Y + 60 + 8, duration: 140, yoyo: true, delay: i * 20 });
    }
    if (strongThrow) dai.setAngle(10);
  };

  const catchIt = (): void => {
    const d = Math.abs(dai.y - HOLD_Y);
    if (d > CATCH_OK) {
      // まだ はやい / もう おそい: そのまま おりる
      SFX.bad();
      session.resetCombo();
      floatUp(scene, CX, HOLD_Y + api.areaY - 60, UI_TEXT.fest.kokkoMiss, '#c04545');
      return;
    }
    const perfect = d <= CATCH_PERFECT;
    catches++;
    phase = 'aim';
    vy = 0;
    dai.y = HOLD_Y;
    dai.setAngle(0);
    if (perfect) {
      SFX.fanfare();
      bigImpact(scene, CX, HOLD_Y + api.areaY, 0xffd34d);
      cameraPulse(scene);
      confetti(scene, 16);
      session.addPoints(CATCH_PTS + PERFECT_BONUS, CX, HOLD_Y + api.areaY - 80);
      floatUp(scene, CX, HOLD_Y + api.areaY - 120, UI_TEXT.fest.kokkoOne, '#e0812a');
    } else {
      SFX.good();
      impactRing(scene, CX, HOLD_Y + api.areaY, 0x9ccb6f, 14);
      session.addPoints(CATCH_PTS, CX, HOLD_Y + api.areaY - 80);
      floatUp(scene, CX, HOLD_Y + api.areaY - 120, UI_TEXT.fest.kokkoCatch, '#3f7d2c');
    }
    label.setText(UI_TEXT.fest.kokkoAimHint(catches));
  };

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    void p;
    if (phase === 'aim') throwUp();
    else catchIt();
  };
  scene.input.on('pointerdown', onDown);
  label.setText(UI_TEXT.fest.kokkoAimHint(0));

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    if (phase === 'aim') {
      cursor += dir * (330 + 120 * session.progress()) * dt;
      if (cursor > GX1) {
        cursor = GX1;
        dir = -1;
      }
      if (cursor < GX0) {
        cursor = GX0;
        dir = 1;
      }
    } else {
      vy += 1150 * dt;
      dai.y += vy * dt;
      if (strongThrow) dai.setAngle(dai.angle + 90 * dt);
      if (dai.y > HOLD_Y + 90) {
        // おちてしまった(だれも けがしない)
        SFX.bad();
        missShake(scene);
        session.resetCombo();
        floatUp(scene, CX, HOLD_Y + api.areaY - 40, UI_TEXT.fest.kokkoDrop, '#c04545');
        dai.y = HOLD_Y;
        dai.setAngle(0);
        vy = 0;
        phase = 'aim';
        label.setText(UI_TEXT.fest.kokkoAimHint(catches));
      }
    }
    drawGauge();
    drawShadow();
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

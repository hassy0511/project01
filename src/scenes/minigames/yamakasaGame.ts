/* はかた ぎおん やまかさ(ふくおか): 「おいやま」で 1トンちかい かきやまを かついで まちを はしる。
   ひとりでは とても もたない ― だから ほんものと おなじで「こうたい(交代)」しながら すすむ。
     ・タップれんだで はしる(かつぎ手の ちからが へっていく)
     ・ちからが へった かつぎ手は あかくなる → つぎの かつぎ手を タップして こうたい
     ・つかれた かつぎ手は やすんで ちからが もどる
   ちからが 0の まま はしると すすまない(たおれない=成功保証)。
   動作=れんだ + こうたいの さいはい(リレーかんり)。fukuotoko(ひとりで はしる)とは べつ */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const RUNNERS = 4;
const RUN_PTS = 4;
const LAP_M = 40;
const LAP_BONUS = 55;
/** 1タップで すすむ きょり(m) */
const STEP_M = 0.7;
/** ちからの げんしょう/かいふく(/たっぷ・/s) */
const TIRE_PER_TAP = 0.09;
const REST_PER_SEC = 0.26;
const LOW = 0.25;

export function renderYamakasa(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xffe0b0, 0xffe0b0, 0xf0d0a0, 0xf0d0a0, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0xb9a882, 1);
  bg.fillRect(0, 470, GAME_W, AREA_H - 470);
  for (let i = 0; i < 8; i++) {
    bg.fillStyle(0xd8c8a8, 1);
    bg.fillRect(i * 62, 470, 44, 8);
  }
  area.add(bg);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'yamakasa',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- かきやま ---------- */
  const yama = scene.add.container(GAME_W / 2, 300);
  const yg = scene.add.graphics();
  yg.fillStyle(0x8a2f2f, 1);
  yg.fillRoundedRect(-96, -20, 192, 90, 10);
  yg.fillStyle(0xc9a23f, 1);
  yg.fillRect(-104, -28, 208, 14);
  yg.fillStyle(0xe8d9a8, 1);
  yg.fillRect(-70, 0, 140, 44);
  yama.add(yg);
  yama.add(scene.add.text(0, -62, '⛩️', { fontSize: '34px' }).setOrigin(0.5));
  yama.add(scene.add.text(0, 22, '🎎', { fontSize: '26px' }).setOrigin(0.5));
  area.add(yama);

  /* ---------- かつぎ手 ---------- */
  const power = [1, 1, 1, 1];
  let active = 0;
  const runners: Phaser.GameObjects.Container[] = [];
  const gauges: Phaser.GameObjects.Graphics[] = [];
  const POS = [90, 190, 290, 390];
  for (let i = 0; i < RUNNERS; i++) {
    const c = scene.add.container(POS[i], 500);
    c.add(scene.add.text(0, 0, '🧑', { fontSize: '34px' }).setOrigin(0.5));
    c.setSize(96, 120);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => swap(i));
    area.add(c);
    runners.push(c);
    const g = scene.add.graphics();
    area.add(g);
    gauges.push(g);
  }
  const activeMark = scene.add.text(POS[0], 440, '⬇️', { fontSize: '24px' }).setOrigin(0.5);
  area.add(activeMark);

  const drawGauges = (): void => {
    for (let i = 0; i < RUNNERS; i++) {
      const g = gauges[i];
      g.clear();
      g.fillStyle(0xffffff, 0.7);
      g.fillRoundedRect(POS[i] - 24, 540, 48, 12, 6);
      g.fillStyle(power[i] < LOW ? 0xe05b5b : power[i] < 0.6 ? 0xffd34d : 0x6fbf44, 1);
      g.fillRoundedRect(POS[i] - 24, 540, Math.max(4, 48 * power[i]), 12, 6);
      runners[i].setAlpha(i === active ? 1 : 0.65);
    }
  };

  const swap = (i: number): void => {
    if (session.isEnded() || i === active) return;
    active = i;
    SFX.good();
    activeMark.setX(POS[i]);
    impactRing(scene, POS[i], 500 + api.areaY, 0x9ccb6f, 12);
    floatUp(scene, POS[i], 470 + api.areaY, UI_TEXT.fest.yamakasaSwap, '#3f7d2c');
    drawGauges();
  };

  /* ---------- はしる ---------- */
  let dist = 0;
  let laps = 0;
  const meter = scene.add.graphics();
  area.add(meter);
  const info = scene.add
    .text(GAME_W / 2, 200, '', { fontFamily: FONT, fontSize: '15px', color: '#5a4632', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(info);

  const drawMeter = (): void => {
    meter.clear();
    meter.fillStyle(0xffffff, 0.6);
    meter.fillRoundedRect(50, 168, GAME_W - 100, 14, 7);
    meter.fillStyle(0xe05b5b, 1);
    meter.fillRoundedRect(50, 168, Math.max(5, ((GAME_W - 100) * dist) / LAP_M), 14, 7);
    info.setText(UI_TEXT.fest.yamakasaInfo(Math.floor(dist), LAP_M, laps));
  };
  drawMeter();

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    // かつぎ手の あたりは container の pointerdown で しょりされる
    if (p.worldY - api.areaY > 440 && p.worldY - api.areaY < 570) return;
    if (power[active] <= 0.01) {
      // ちからが つきた: すすまない(こうたいの あいず)
      floatUp(scene, GAME_W / 2, 260 + api.areaY, UI_TEXT.fest.yamakasaTired, '#c04545');
      session.resetCombo();
      return;
    }
    power[active] = Math.max(0, power[active] - TIRE_PER_TAP);
    dist += STEP_M;
    SFX.pop();
    session.addPoints(RUN_PTS, GAME_W / 2, 250 + api.areaY);
    burst(scene, GAME_W / 2, 380 + api.areaY, 3, [0xd8c8a8, 0xffffff]);
    scene.tweens.add({ targets: yama, y: 292, duration: 90, yoyo: true });
    scene.tweens.add({ targets: runners[active], y: 492, duration: 90, yoyo: true });
    if (power[active] < LOW) floatUp(scene, POS[active], 470 + api.areaY, UI_TEXT.fest.yamakasaLow, '#e0812a');
    drawMeter();
    drawGauges();
    if (dist >= LAP_M) {
      laps++;
      dist = 0;
      SFX.fanfare();
      bigImpact(scene, GAME_W / 2, 300 + api.areaY, 0xffd34d);
      confetti(scene, 18);
      session.addPoints(LAP_BONUS, GAME_W / 2, 240 + api.areaY, false);
      floatUp(scene, GAME_W / 2, 210 + api.areaY, UI_TEXT.fest.yamakasaLap(laps), '#e0812a');
    }
  };
  scene.input.on('pointerdown', onDown);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    for (let i = 0; i < RUNNERS; i++) {
      if (i !== active) power[i] = Math.min(1, power[i] + REST_PER_SEC * dt);
    }
    yama.setAngle(Math.sin(Date.now() / 320) * 1.5);
    drawGauges();
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

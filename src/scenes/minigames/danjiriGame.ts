/* きしわだ だんじりまつり(おおさか): 「やりまわし」。
   だんじりは とまらない。はしりながら かどを 直角に まわす ― だから これは
   「はしる → かどの ちょうどで タップ」の いっしゅんの はんだんゲーム。
   ゲージの ひかる ゾーンで タップすると きれいに まがる。
   はやすぎ・おそすぎでも だんじりは たおれない(スピードが おちて コンボが きれるだけ)。
   スピードが たまると「そうこう(疾走)」= 得点アップ。gion(ゆっくり回す)と 正反対の てざわり */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, cameraPulse, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const ROAD_Y = 430;
/** ゲージ */
const GX0 = 46;
const GX1 = GAME_W - 46;
const GY = 250;
/** ゾーンの ひろさ(px。だんだん せまくなる) */
const ZONE_W_START = 92;
const ZONE_W_END = 54;
const PERFECT_W = 26;
const TURN_PTS = 20;
const PERFECT_PTS = 34;
/** スピード(0〜1)。まがるたび あがり、しっぱいで さがる */
const SPD_UP = 0.16;
const SPD_DOWN = 0.34;
const DASH_AT = 0.7;

export function renderDanjiri(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xbfe4f5, 0xbfe4f5, 0xe9f0d8, 0xe9f0d8, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0x9e9e8a, 1);
  bg.fillRect(0, ROAD_Y, GAME_W, 150); // みちすじ
  bg.fillStyle(0xd8d8c4, 1);
  for (let i = 0; i < 8; i++) bg.fillRect(i * 60 + 10, ROAD_Y + 70, 34, 8); // センターライン
  area.add(bg);
  // かどの もくひょう(直角の かど)
  const corner = scene.add.graphics();
  corner.fillStyle(0x7a6a4a, 1);
  corner.fillRect(GAME_W - 150, ROAD_Y - 120, 150, 120);
  corner.fillStyle(0x8a7a5a, 1);
  corner.fillRect(GAME_W - 150, ROAD_Y - 130, 150, 14);
  area.add(corner);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'danjiri',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- だんじり ---------- */
  const danjiri = scene.add.container(120, ROAD_Y + 60);
  const dg = scene.add.graphics();
  dg.fillStyle(0x6b4a2a, 1);
  dg.fillRoundedRect(-52, -46, 104, 66, 8);
  dg.fillStyle(0x8a6a3a, 1);
  dg.fillTriangle(-62, -46, 62, -46, 0, -84); // ひわだぶきの やね
  dg.fillStyle(0xc9a23f, 1);
  dg.fillRect(-40, -30, 80, 8);
  dg.fillStyle(0x3a2a18, 1);
  dg.fillCircle(-32, 26, 16);
  dg.fillCircle(32, 26, 16);
  danjiri.add(dg);
  danjiri.add(addIcon(scene, 0, -58, 'lantern:crimson', 20));
  danjiri.add(addIcon(scene, -16, -8, 'person:teal', 18));
  danjiri.add(addIcon(scene, 16, -8, 'person:teal', 18));
  area.add(danjiri);
  // ひきての れつ
  const ropes: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < 4; i++) {
    const r = addIcon(scene, 60 - i * 30, ROAD_Y + 78, 'person:gray', 20);
    area.add(r);
    ropes.push(r);
  }

  /* ---------- ゲージ ---------- */
  const gauge = scene.add.graphics();
  area.add(gauge);
  const spdText = scene.add
    .text(GAME_W / 2, GY - 46, '', { fontFamily: 'sans-serif', fontSize: '15px', color: '#5a4632', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(spdText);

  let cursor = GX0;
  let dir = 1;
  let zoneX = GAME_W / 2;
  let speed = 0.2;
  let turns = 0;

  const zoneW = (): number => ZONE_W_START + (ZONE_W_END - ZONE_W_START) * session.progress();
  const cursorSpeed = (): number => 300 + 260 * speed + 120 * session.progress(); // px/s

  const newZone = (): void => {
    zoneX = GX0 + 80 + Math.random() * (GX1 - GX0 - 160);
  };
  newZone();

  const drawGauge = (): void => {
    gauge.clear();
    gauge.fillStyle(0xffffff, 0.55);
    gauge.fillRoundedRect(GX0, GY - 16, GX1 - GX0, 32, 10);
    // ゾーン
    const w = zoneW();
    gauge.fillStyle(0x9ccb6f, 0.85);
    gauge.fillRoundedRect(zoneX - w / 2, GY - 16, w, 32, 8);
    gauge.fillStyle(0xffd34d, 0.95);
    gauge.fillRoundedRect(zoneX - PERFECT_W / 2, GY - 16, PERFECT_W, 32, 6);
    // カーソル
    gauge.fillStyle(0xe05b5b, 1);
    gauge.fillRoundedRect(cursor - 4, GY - 24, 8, 48, 4);
    spdText.setText(UI_TEXT.fest.danjiriSpeed(Math.round(speed * 100), turns));
  };

  /* ---------- まわす ---------- */
  const turn = (): void => {
    if (session.isEnded()) return;
    const d = Math.abs(cursor - zoneX);
    const dash = speed >= DASH_AT;
    if (d > zoneW() / 2) {
      // かどを ふくらんで しまった: スピードが おちるだけ
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      speed = Math.max(0, speed - SPD_DOWN);
      floatUp(scene, GAME_W / 2, GY + api.areaY + 40, UI_TEXT.fest.danjiriWide, '#c04545');
      scene.tweens.add({ targets: danjiri, angle: { from: 8, to: 0 }, duration: 300 });
      newZone();
      return;
    }
    const perfect = d <= PERFECT_W / 2;
    turns++;
    speed = Math.min(1, speed + SPD_UP);
    const pts = (perfect ? PERFECT_PTS : TURN_PTS) * (dash ? 2 : 1);
    if (perfect) {
      SFX.fanfare();
      bigImpact(scene, danjiri.x, danjiri.y + api.areaY, 0xffd34d);
      floatUp(scene, danjiri.x, danjiri.y + api.areaY - 100, UI_TEXT.fest.danjiriPerfect, '#e0812a');
    } else {
      SFX.good();
      impactRing(scene, danjiri.x, danjiri.y + api.areaY, 0x9ccb6f, 12);
      floatUp(scene, danjiri.x, danjiri.y + api.areaY - 100, UI_TEXT.fest.danjiriOk, '#3f7d2c');
    }
    burst(scene, danjiri.x, danjiri.y + api.areaY + 20, perfect ? 12 : 6, [0xd8d8c4, 0xffffff]);
    session.addPoints(pts, danjiri.x, danjiri.y + api.areaY - 130);
    // だんじりが ぐるっと まわる
    scene.tweens.add({
      targets: danjiri,
      angle: { from: 0, to: perfect ? 360 : 300 },
      duration: perfect ? 420 : 520,
      onComplete: () => danjiri.setAngle(0),
    });
    if (dash) {
      cameraPulse(scene);
      floatUp(scene, GAME_W / 2, GY + api.areaY + 70, UI_TEXT.fest.danjiriDash, '#e0812a');
    }
    for (const [i, r] of ropes.entries()) {
      scene.tweens.add({ targets: r, y: ROAD_Y + 78 - 14, duration: 130, yoyo: true, delay: i * 40 });
    }
    newZone();
  };
  const onDown = (): void => turn();
  scene.input.on('pointerdown', onDown);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    cursor += dir * cursorSpeed() * dt;
    if (cursor > GX1) {
      cursor = GX1;
      dir = -1;
    }
    if (cursor < GX0) {
      cursor = GX0;
      dir = 1;
    }
    // だんじりは いつも はしっている(スピードで ゆれが かわる)
    danjiri.y = ROAD_Y + 60 + Math.sin(Date.now() / (110 - speed * 40)) * (2 + speed * 3);
    drawGauge();
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

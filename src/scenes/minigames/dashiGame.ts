/* かわごえまつり(さいたま): 山車(だし)の綱引きリズムゲーム。
   ゲージの めもりが まんなか(スイートゾーン)に来た瞬間にタップ=綱を引く。
   引くたびに 山車が進み、蔵造りの町並みが流れていく。外すと「およよ…」で一瞬止まるだけ。
   ときどき来る「曳っかわせ(ひっかわせ)」= 対向の山車との競演が C 要素(得点2倍タイム)。
   実在の川越まつりの「山車の曳っかわせ」をそのまま動詞化 */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, floatUp, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const STREET_Y = 430; // 地面の高さ
const DASHI_X = 170;
const GAUGE_Y = 590;
const GAUGE_W = 360;
const PULL_PTS = 12;
const JUST_PTS = 20;
/** スイートゾーン半幅(ゲージ座標): 序盤→終盤で狭くなる。ジャストはさらに中心 */
const ZONE_FROM = 64;
const ZONE_TO = 40;
const JUST_HALF = 14;
/** めもりの往復周期(ms): 序盤→終盤 */
const SWING_FROM = 1500;
const SWING_TO = 900;
/** 外した時に めもりが止まる時間 */
const STALL_MS = 500;
/** 曳っかわせ: 間隔と持続 */
const HIKKAWASE_EVERY_MS = 18000;
const HIKKAWASE_LEN_MS = 8000;

export function renderDashi(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 夕暮れの蔵造りの町並み(スクロールする背景を2枚タイル)
  const bgFixed = scene.add.graphics();
  bgFixed.fillGradientStyle(0xf7c873, 0xf7c873, 0xf7e3b8, 0xf7e3b8, 1);
  bgFixed.fillRect(0, 0, GAME_W, STREET_Y);
  bgFixed.fillStyle(0xb89b6a, 1);
  bgFixed.fillRect(0, STREET_Y, GAME_W, AREA_H - STREET_Y);
  bgFixed.fillStyle(0xa5854f, 0.5);
  for (let i = 0; i < 5; i++) bgFixed.fillRect(0, STREET_Y + 30 + i * 40, GAME_W, 4);
  area.add(bgFixed);

  const tiles: Phaser.GameObjects.Graphics[] = [];
  for (let t = 0; t < 2; t++) {
    const g = scene.add.graphics();
    // 蔵(くらづくり)のシルエット並び
    for (let i = 0; i < 3; i++) {
      const bx = i * 170 + 10;
      g.fillStyle(0x5a4a3a, 1);
      g.fillRect(bx, STREET_Y - 150, 140, 150);
      g.fillStyle(0x3d3129, 1);
      g.fillTriangle(bx - 12, STREET_Y - 150, bx + 70, STREET_Y - 196, bx + 152, STREET_Y - 150);
      g.fillStyle(0xf7e3b8, 0.9);
      g.fillRect(bx + 24, STREET_Y - 110, 28, 34);
      g.fillRect(bx + 88, STREET_Y - 110, 28, 34);
    }
    // ちょうちんの列
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0xe05b5b, 1);
      g.fillEllipse(i * 85 + 40, STREET_Y - 210, 18, 24);
      g.fillStyle(0xffd34d, 0.55);
      g.fillEllipse(i * 85 + 40, STREET_Y - 210, 10, 14);
    }
    g.setX(t * 510);
    area.add(g);
    tiles.push(g);
  }

  api.sign(prompt);

  const session = new ArcadeSession(api, {
    engine: 'dashi',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- 山車(ベクター描画: 車輪+櫓+人形) ---------- */
  const dashi = scene.add.container(DASHI_X, STREET_Y);
  const dg = scene.add.graphics();
  dg.fillStyle(0x4a3b2a, 1);
  dg.fillCircle(-52, -18, 22);
  dg.fillCircle(52, -18, 22);
  dg.fillStyle(0xc98f4e, 1);
  dg.fillCircle(-52, -18, 9);
  dg.fillCircle(52, -18, 9);
  dg.fillStyle(0xa9713a, 1);
  dg.fillRoundedRect(-78, -78, 156, 52, 8);
  dg.fillStyle(0xd94f4f, 1);
  dg.fillRoundedRect(-64, -150, 128, 74, 8);
  dg.fillStyle(0xffd34d, 1);
  dg.fillRect(-64, -104, 128, 8);
  dg.fillStyle(0x3d3129, 1);
  dg.fillTriangle(-76, -150, 0, -186, 76, -150);
  dashi.add(dg);
  const doll = scene.add.text(0, -204, '🎎', { fontSize: '34px' }).setOrigin(0.5);
  dashi.add(doll);
  // 綱と引き手
  const rope = scene.add.graphics();
  rope.lineStyle(4, 0x8a6242, 1);
  rope.lineBetween(78, -30, 210, -8);
  dashi.add(rope);
  for (let i = 0; i < 3; i++) {
    dashi.add(scene.add.text(120 + i * 44, -16, ['🧑', '👧', '👦'][i], { fontSize: '26px' }).setOrigin(0.5));
  }
  area.add(dashi);
  scene.tweens.add({ targets: doll, angle: { from: -4, to: 4 }, duration: 900, yoyo: true, repeat: -1 });

  /* ---------- 対向の山車(曳っかわせ用。ふだんは画面外) ---------- */
  const rival = scene.add.container(GAME_W + 140, STREET_Y);
  const rg = scene.add.graphics();
  rg.fillStyle(0x4a3b2a, 1);
  rg.fillCircle(-40, -14, 17);
  rg.fillCircle(40, -14, 17);
  rg.fillStyle(0x7a5a9a, 1);
  rg.fillRoundedRect(-58, -120, 116, 62, 8);
  rg.fillStyle(0x3d3129, 1);
  rg.fillTriangle(-56, -120, 0, -150, 56, -120);
  rival.add(rg);
  rival.add(scene.add.text(0, -166, '👺', { fontSize: '28px' }).setOrigin(0.5));
  area.add(rival);

  /* ---------- 綱引きゲージ ---------- */
  const gauge = scene.add.graphics();
  area.add(gauge);
  const marker = scene.add.graphics();
  marker.fillStyle(0xd94f4f, 1);
  marker.fillRoundedRect(-7, -24, 14, 48, 7);
  const markerC = scene.add.container(GAME_W / 2, GAUGE_Y);
  markerC.add(marker);
  area.add(markerC);

  let phase = 0;
  let stalledUntil = 0;
  let hikkawase = false;
  let hikkawaseTimer: Phaser.Time.TimerEvent | undefined;

  const zoneHalf = (): number => Phaser.Math.Linear(ZONE_FROM, ZONE_TO, session.progress());

  const drawGauge = (): void => {
    gauge.clear();
    gauge.fillStyle(0xffffff, 0.85);
    gauge.fillRoundedRect(GAME_W / 2 - GAUGE_W / 2, GAUGE_Y - 14, GAUGE_W, 28, 14);
    const half = zoneHalf();
    gauge.fillStyle(hikkawase ? 0xffd34d : 0x9ccb6f, 0.9);
    gauge.fillRoundedRect(GAME_W / 2 - half, GAUGE_Y - 14, half * 2, 28, 12);
    gauge.fillStyle(0x3f7d2c, 0.9);
    gauge.fillRoundedRect(GAME_W / 2 - JUST_HALF, GAUGE_Y - 14, JUST_HALF * 2, 28, 8);
  };
  drawGauge();

  /** 町並みを流す=山車が進んで見える */
  const advanceStreet = (px: number): void => {
    for (const t of tiles) {
      t.x -= px;
      if (t.x < -510) t.x += 1020;
    }
  };

  const pull = (): void => {
    const now = Date.now();
    if (session.isEnded() || now < stalledUntil) return;
    const offset = Math.abs(markerC.x - GAME_W / 2);
    if (offset <= zoneHalf()) {
      const just = offset <= JUST_HALF;
      const base = (just ? JUST_PTS : PULL_PTS) * (hikkawase ? 2 : 1);
      SFX.pop();
      if (just) SFX.good();
      session.addPoints(base, dashi.x + 40, STREET_Y + api.areaY - 190);
      floatUp(scene, dashi.x + 120, STREET_Y + api.areaY - 60, UI_TEXT.fest.wasshoi, just ? '#3f7d2c' : '#e0812a');
      // 山車が ぐっと進む(車体が沈んで前へ)
      scene.tweens.add({ targets: dashi, x: DASHI_X + 14, duration: 130, yoyo: true, ease: 'Quad.easeOut' });
      scene.tweens.add({ targets: dashi, y: STREET_Y + 4, duration: 90, yoyo: true });
      advanceStreet(just ? 46 : 30);
      burst(scene, dashi.x - 40, STREET_Y + api.areaY - 6, 5, [0xb89b6a, 0xd8c49a]);
      if (hikkawase) {
        // 競演中は 相手の山車を押し返す
        scene.tweens.add({ targets: rival, x: rival.x + 18, duration: 150 });
        if (just) bigImpact(scene, dashi.x + 60, STREET_Y + api.areaY - 120);
      }
    } else {
      stalledUntil = now + STALL_MS;
      session.resetCombo();
      missShake(scene);
      SFX.bad();
      floatUp(scene, markerC.x, GAUGE_Y + api.areaY - 40, UI_TEXT.fest.stall, '#c04545');
    }
  };
  const onDown = (): void => pull();
  scene.input.on('pointerdown', onDown);

  /* ---------- 曳っかわせ(C要素): 対向の山車が現れて得点2倍 ---------- */
  const startHikkawase = (): void => {
    if (session.isEnded() || hikkawase) return;
    hikkawase = true;
    SFX.fanfare();
    floatUp(scene, GAME_W / 2, 240 + api.areaY, UI_TEXT.fest.hikkawase, '#e0812a');
    scene.tweens.add({ targets: rival, x: GAME_W - 120, duration: 700, ease: 'Sine.easeOut' });
    drawGauge();
    scene.time.delayedCall(HIKKAWASE_LEN_MS, () => {
      hikkawase = false;
      scene.tweens.add({ targets: rival, x: GAME_W + 140, duration: 700, ease: 'Sine.easeIn' });
      drawGauge();
    });
  };
  hikkawaseTimer = scene.time.addEvent({
    delay: HIKKAWASE_EVERY_MS,
    loop: true,
    callback: startHikkawase,
  });

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    if (Date.now() < stalledUntil) return; // 外した「間」: めもりも一瞬止まる
    const period = Phaser.Math.Linear(SWING_FROM, SWING_TO, session.progress()) * (hikkawase ? 0.85 : 1);
    phase += (Math.min(dtMs, 33) / period) * Math.PI * 2;
    markerC.x = GAME_W / 2 + Math.sin(phase) * (GAUGE_W / 2 - 16);
    if ((session.progress() * 100) % 1 < 0.02) drawGauge(); // ゾーン幅の更新(ときどきでよい)
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    hikkawaseTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

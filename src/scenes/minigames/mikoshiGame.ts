/* かんだまつり(とうきょう): 神輿(みこし)かつぎバランスゲーム。
   みこしは かってに かたむいていく。かたむいた側の「はんたい」を押して(押しっぱなしOK)
   バランスを取り、まっすぐ担げているあいだ どんどん得点が入る。
   大きくかたむくと「おっとっと!」でよろけるだけ(落とさない=成功保証)。
   ときどき「わっしょいタイム」= 得点2倍+紙吹雪が C 要素。
   実在の神田祭の神輿渡御(とぎょ)をそのまま動詞化 */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, confetti, floatUp, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const STREET_Y = 470;
const MIKOSHI_Y = 400;
/** 傾き(度): 得点帯・ぴったり帯・よろけ */
const OK_DEG = 18;
const PERFECT_DEG = 6;
const STUMBLE_DEG = 30;
/** 得点の刻み(ms)と点 */
const TICK_MS = 600;
const TICK_PTS = 6;
const PERFECT_PTS = 10;
/** プレイヤーの押し(度/秒)と風のゆさぶり(序盤→終盤, 度/秒) */
const TORQUE = 34;
const WIND_FROM = 10;
const WIND_TO = 26;
/** 風向きが変わる間隔 */
const WIND_MIN_MS = 900;
const WIND_MAX_MS = 2000;
/** わっしょいタイム: 間隔と持続 */
const WASSHOI_EVERY_MS = 15000;
const WASSHOI_LEN_MS = 5000;

export function renderMikoshi(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 参道: 青空+鳥居+人ごみ
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xaee3f7, 0xaee3f7, 0xd7efc3, 0xd7efc3, 1);
  bg.fillRect(0, 0, GAME_W, STREET_Y);
  bg.fillStyle(0xb89b6a, 1);
  bg.fillRect(0, STREET_Y, GAME_W, AREA_H - STREET_Y);
  // 鳥居
  bg.fillStyle(0xd94f4f, 1);
  bg.fillRect(90, 130, 16, 190);
  bg.fillRect(374, 130, 16, 190);
  bg.fillRect(60, 120, 360, 18);
  bg.fillRect(80, 158, 320, 12);
  area.add(bg);
  // 沿道の見物人(ゆれる)
  for (let i = 0; i < 10; i++) {
    const side = i % 2 === 0 ? 30 + (i / 2) * 22 : GAME_W - 30 - ((i - 1) / 2) * 22;
    const p = scene.add.text(side, STREET_Y - 12 + (i % 3) * 8, ['🧑', '👧', '👦', '👩', '👴'][i % 5], {
      fontSize: '22px',
    }).setOrigin(0.5);
    area.add(p);
    scene.tweens.add({ targets: p, y: p.y - 5, duration: 400 + (i % 4) * 90, yoyo: true, repeat: -1 });
  }

  api.sign(prompt);

  const session = new ArcadeSession(api, {
    engine: 'mikoshi',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- みこし(ベクター+担ぎ手)。下端を支点に傾く ---------- */
  const mikoshi = scene.add.container(GAME_W / 2, MIKOSHI_Y);
  const mg = scene.add.graphics();
  // 担ぎ棒
  mg.fillStyle(0xa9713a, 1);
  mg.fillRoundedRect(-150, 44, 300, 12, 6);
  // 本体
  mg.fillStyle(0xd94f4f, 1);
  mg.fillRoundedRect(-56, -32, 112, 72, 10);
  mg.fillStyle(0xffd34d, 1);
  mg.fillRect(-56, -6, 112, 8);
  // 屋根+鳳凰
  mg.fillStyle(0x3d3129, 1);
  mg.fillTriangle(-72, -32, 0, -74, 72, -32);
  mikoshi.add(mg);
  mikoshi.add(scene.add.text(0, -88, '🐦', { fontSize: '24px' }).setOrigin(0.5));
  // 担ぎ手
  for (const [dx, e] of [[-118, '🧑'], [-62, '👦'], [62, '👧'], [118, '🧑']] as const) {
    mikoshi.add(scene.add.text(dx, 68, e, { fontSize: '28px' }).setOrigin(0.5));
  }
  area.add(mikoshi);
  // かつぎの上下ゆれ(まっすぐ担げている感)
  scene.tweens.add({ targets: mikoshi, y: MIKOSHI_Y - 8, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  /* ---------- バランスメーター(上部) ---------- */
  const meter = scene.add.graphics();
  area.add(meter);
  const drawMeter = (deg: number): void => {
    meter.clear();
    const mx = GAME_W / 2;
    const my = 110;
    meter.fillStyle(0xffffff, 0.85);
    meter.fillRoundedRect(mx - 130, my - 10, 260, 20, 10);
    meter.fillStyle(0x9ccb6f, 0.9);
    meter.fillRoundedRect(mx - (OK_DEG / STUMBLE_DEG) * 130, my - 10, (OK_DEG / STUMBLE_DEG) * 260, 20, 10);
    meter.fillStyle(0x3f7d2c, 0.9);
    meter.fillRoundedRect(mx - (PERFECT_DEG / STUMBLE_DEG) * 130, my - 10, (PERFECT_DEG / STUMBLE_DEG) * 260, 20, 8);
    const nx = mx + (Phaser.Math.Clamp(deg, -STUMBLE_DEG, STUMBLE_DEG) / STUMBLE_DEG) * 130;
    meter.fillStyle(0xd94f4f, 1);
    meter.fillRoundedRect(nx - 5, my - 16, 10, 32, 5);
  };

  /* ---------- 入力: 画面の左右どちらを押しているか(押しっぱなし対応) ---------- */
  let press = 0; // -1=ひだり押し / 1=みぎ押し / 0=なし
  const setPress = (p: Phaser.Input.Pointer, down: boolean): void => {
    if (!down) {
      press = 0;
      return;
    }
    press = p.worldX < GAME_W / 2 ? -1 : 1;
  };
  const onDown = (p: Phaser.Input.Pointer): void => setPress(p, true);
  const onMove = (p: Phaser.Input.Pointer): void => {
    if (p.isDown) setPress(p, true);
  };
  const onUp = (): void => setPress(scene.input.activePointer, false);
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);

  /* ---------- 状態 ---------- */
  let deg = 0;
  let wind = WIND_FROM;
  let windTimer: Phaser.Time.TimerEvent | undefined;
  let wasshoi = false;
  let recoverUntil = 0;

  const scheduleWind = (): void => {
    const amp = Phaser.Math.Linear(WIND_FROM, WIND_TO, session.progress());
    wind = (Math.random() < 0.5 ? -1 : 1) * amp * (0.6 + Math.random() * 0.7);
    windTimer = scene.time.delayedCall(WIND_MIN_MS + Math.random() * (WIND_MAX_MS - WIND_MIN_MS), scheduleWind);
  };
  scheduleWind();

  // わっしょいタイム(C要素)
  const wasshoiTimer = scene.time.addEvent({
    delay: WASSHOI_EVERY_MS,
    loop: true,
    callback: () => {
      if (session.isEnded() || wasshoi) return;
      wasshoi = true;
      SFX.fanfare();
      floatUp(scene, GAME_W / 2, 200 + api.areaY, UI_TEXT.fest.wasshoiTime, '#e0812a');
      confetti(scene, 18);
      scene.time.delayedCall(WASSHOI_LEN_MS, () => {
        wasshoi = false;
      });
    },
  });

  // 得点の刻み: まっすぐ担げているあいだ どんどん入る
  const tick = scene.time.addEvent({
    delay: TICK_MS,
    loop: true,
    callback: () => {
      if (session.isEnded() || Date.now() < recoverUntil) return;
      const a = Math.abs(deg);
      if (a <= PERFECT_DEG) {
        session.addPoints(PERFECT_PTS * (wasshoi ? 2 : 1), GAME_W / 2, MIKOSHI_Y + api.areaY - 130);
        if (Math.random() < 0.25) {
          floatUp(scene, GAME_W / 2 + 90, MIKOSHI_Y + api.areaY - 90, UI_TEXT.fest.balancePerfect, '#3f7d2c');
        }
      } else if (a <= OK_DEG) {
        session.addPoints(TICK_PTS * (wasshoi ? 2 : 1), GAME_W / 2, MIKOSHI_Y + api.areaY - 130);
      }
      if (Math.random() < 0.35) {
        floatUp(scene, 60 + Math.random() * (GAME_W - 120), STREET_Y + api.areaY - 30, UI_TEXT.fest.wasshoi, '#8a7a62');
      }
    },
  });

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    if (Date.now() >= recoverUntil) {
      deg += wind * dt + press * TORQUE * dt;
    }
    if (Math.abs(deg) >= STUMBLE_DEG) {
      // よろけ: コンボが切れて 反対側に立て直し(落とさない)
      recoverUntil = Date.now() + 600;
      session.resetCombo();
      missShake(scene);
      SFX.bad();
      floatUp(scene, GAME_W / 2, MIKOSHI_Y + api.areaY - 150, UI_TEXT.fest.stumble, '#c04545');
      burst(scene, GAME_W / 2, STREET_Y + api.areaY - 20, 6, [0xb89b6a, 0xd8c49a]);
      deg = deg > 0 ? -12 : 12;
    }
    mikoshi.setAngle(deg);
    drawMeter(deg);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    windTimer?.remove();
    wasshoiTimer.remove();
    tick.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

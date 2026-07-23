/* かんとうまつり(あきた): 竿燈(かんとう)バランスゲーム。
   ちょうちんを つけた ながい竿を、下の「て」を左右にドラッグして ささえる。
   まっすぐ ささえているあいだ 得点が入りつづけ、8秒たえるごとに 竿が たかくなって
   配点アップ(C要素=リスクとリワードの はしご)。よろけたら レベル1に もどるだけ(成功保証)。
   mikoshi(左右押し)との違い = 指で「したを うごかして うえを ささえる」倒立バランス */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, confetti, floatUp, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const HAND_Y = 560;
/** 傾き: 得点帯・ぴったり帯・よろけ */
const OK_DEG = 16;
const PERFECT_DEG = 6;
const STUMBLE_DEG = 30;
const TICK_MS = 600;
/** レベル(竿の高さ): 配点と 上がるまでの安定時間 */
const MAX_LEVEL = 4;
const LEVEL_UP_MS = 8000;
const PTS_PERFECT = [0, 8, 12, 16, 22];
const PTS_OK = [0, 5, 7, 10, 14];
/** 不安定さ: 傾きの自己増幅と 風 */
const GRAV = 1.9;
const WIND_FROM = 3;
const WIND_TO = 8;
/** 手の移動が竿を立て直す係数(px → deg) */
const CORRECT_K = 0.055;

export function renderKantou(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 夕ぐれの おまつり広場
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x35406b, 0x35406b, 0x6b5a8a, 0x6b5a8a, 1);
  bg.fillRect(0, 0, GAME_W, HAND_Y);
  bg.fillStyle(0x8a7a62, 1);
  bg.fillRect(0, HAND_Y, GAME_W, AREA_H - HAND_Y);
  area.add(bg);
  for (let i = 0; i < 8; i++) {
    const p = scene.add.text(20 + i * 62, HAND_Y - 8, ['🧑', '👧', '👦', '👩'][i % 4], { fontSize: '20px' }).setOrigin(0.5);
    area.add(p);
    scene.tweens.add({ targets: p, y: p.y - 4, duration: 420 + (i % 3) * 90, yoyo: true, repeat: -1 });
  }

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'kantou',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- 竿燈: 下端が支点。レベルで ちょうちんの段が増える ---------- */
  let level = 1;
  const pole = scene.add.container(GAME_W / 2, HAND_Y);
  area.add(pole);
  const buildPole = (): void => {
    pole.removeAll(true);
    const g = scene.add.graphics();
    const h = 210 + level * 70;
    g.lineStyle(7, 0xc9a86a, 1);
    g.lineBetween(0, 0, 0, -h);
    for (let row = 0; row < level + 1; row++) {
      const y = -h + 26 + row * 64;
      g.lineStyle(4, 0xc9a86a, 1);
      g.lineBetween(-70, y, 70, y);
      pole.add(g);
      for (let i = -2; i <= 2; i++) {
        const lan = scene.add.text(i * 34, y + 18, '🏮', { fontSize: '20px' }).setOrigin(0.5);
        pole.add(lan);
      }
    }
    pole.add(g);
  };
  buildPole();

  // ささえる て(ドラッグで動く)
  const hand = scene.add.text(GAME_W / 2, HAND_Y + 26, '🖐️', { fontSize: '40px' }).setOrigin(0.5);
  area.add(hand);

  /* ---------- 状態 ---------- */
  let deg = 0;
  let wind = WIND_FROM;
  let px = GAME_W / 2; // 手(=支点)の x
  let recoverUntil = 0;
  let stableSince = Date.now();
  let windTimer: Phaser.Time.TimerEvent | undefined;

  const scheduleWind = (): void => {
    const amp = Phaser.Math.Linear(WIND_FROM, WIND_TO, session.progress());
    wind = (Math.random() < 0.5 ? -1 : 1) * amp * (0.5 + Math.random() * 0.8);
    windTimer = scene.time.delayedCall(900 + Math.random() * 1400, scheduleWind);
  };
  scheduleWind();

  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!p.isDown || session.isEnded()) return;
    const nx = Phaser.Math.Clamp(p.worldX, 60, GAME_W - 60);
    const dx = nx - px;
    px = nx;
    // 手を かたむいた側へ うごかすと 竿が たてなおる(倒立バランスの きもち)
    if (Date.now() >= recoverUntil) deg -= dx * CORRECT_K * (deg > 0 === dx > 0 ? 1.6 : 0.4);
  };
  const onDown = (p: Phaser.Input.Pointer): void => {
    px = Phaser.Math.Clamp(p.worldX, 60, GAME_W - 60);
  };
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerdown', onDown);

  // 得点の刻み
  const tick = scene.time.addEvent({
    delay: TICK_MS,
    loop: true,
    callback: () => {
      if (session.isEnded() || Date.now() < recoverUntil) return;
      const a = Math.abs(deg);
      if (a <= PERFECT_DEG) {
        session.addPoints(PTS_PERFECT[level], px, HAND_Y + api.areaY - 200);
      } else if (a <= OK_DEG) {
        session.addPoints(PTS_OK[level], px, HAND_Y + api.areaY - 200);
      }
      // 安定を つづけたら 竿が たかくなる
      if (Date.now() - stableSince >= LEVEL_UP_MS && level < MAX_LEVEL) {
        level++;
        stableSince = Date.now();
        buildPole();
        SFX.fanfare();
        floatUp(scene, GAME_W / 2, 200 + api.areaY, UI_TEXT.fest.kantouUp(level), '#e0812a');
        confetti(scene, 10);
      }
    },
  });

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    if (Date.now() >= recoverUntil) {
      deg += (deg * GRAV + wind * (1 + level * 0.25)) * dt;
    }
    if (Math.abs(deg) >= STUMBLE_DEG) {
      recoverUntil = Date.now() + 700;
      stableSince = Date.now();
      session.resetCombo();
      missShake(scene);
      SFX.bad();
      floatUp(scene, px, HAND_Y + api.areaY - 240, UI_TEXT.fest.kantouWobble, '#c04545');
      burst(scene, px, HAND_Y + api.areaY - 10, 6, [0x8a7a62, 0xc9a86a]);
      if (level > 1) {
        level = 1;
        buildPole();
      }
      deg = deg > 0 ? -8 : 8;
    }
    pole.setX(px);
    pole.setAngle(deg);
    hand.setX(px);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerdown', onDown);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    windTimer?.remove();
    tick.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

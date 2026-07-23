/* よこはま みなとまつり(かながわ): 操船パレードゲーム。
   指の左右で ふねを あやつり、ながれてくる「はたのゲート」をくぐると得点。
   ブイに ぶつかると「ごつん!」でコンボが切れるだけ(沈まない=成功保証)。
   ながれてくる「きてきのわっか」に かさなった瞬間タップで「ぽーっ!」ボーナス。
   金のわっか=「あいさつの汽笛」が C 要素(大型船へのあいさつ)。
   横浜開港祭の船のパレードを動詞化。かごキャッチと同じ連続操作系だが
   「くぐる・よける・鳴らす」の3役で差別化 */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const BOAT_Y = 500;
const GATE_PTS = 12;
const HORN_PTS = 20;
const HORN_BIG_PTS = 40;
/** 流れる速さ(px/s): 序盤→終盤 */
const FLOW_FROM = 170;
const FLOW_TO = 300;
/** ゲートのすき間(px): 序盤→終盤 */
const GAP_FROM = 170;
const GAP_TO = 122;
/** スポーン間隔(ms) */
const SPAWN_FROM = 1500;
const SPAWN_TO = 900;
/** きてきのわっか: 出現率 / 金のわっか(あいさつ)の出現率 */
const HORN_CHANCE = 0.22;
const HORN_BIG_CHANCE = 0.3;
/** ふねの追従(かごと同じ吸い付き+傾き) */
const BOAT_LERP = 0.3;
const TILT_MAX = 14;

type Floater =
  | { kind: 'gate'; y: number; cx: number; gap: number; obj: Phaser.GameObjects.Container; passed: boolean }
  | { kind: 'buoy'; y: number; x: number; obj: Phaser.GameObjects.Container; hit: boolean }
  | { kind: 'horn'; y: number; x: number; big: boolean; obj: Phaser.GameObjects.Container; used: boolean };

export function renderSousen(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 港: 海+ベイブリッジ風+みなとの街
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xaee3f7, 0xaee3f7, 0x6fc4e0, 0x6fc4e0, 1);
  bg.fillRect(0, 0, GAME_W, 150);
  // 街とかんらんしゃ
  bg.fillStyle(0x8fa8bf, 1);
  for (const [bx, bw, bh] of [[30, 40, 70], [80, 30, 96], [120, 44, 60], [330, 36, 88], [380, 50, 64]] as const) {
    bg.fillRect(bx, 150 - bh, bw, bh);
  }
  bg.lineStyle(5, 0xd0dde8, 1);
  bg.strokeCircle(240, 116, 34);
  // ベイブリッジ風
  bg.lineStyle(6, 0xffffff, 0.9);
  bg.lineBetween(0, 150, GAME_W, 150);
  bg.lineStyle(3, 0xffffff, 0.7);
  for (let i = 0; i < 7; i++) bg.lineBetween(70 + i * 57, 150, 100 + i * 40, 96);
  // 海
  bg.fillGradientStyle(0x5fb4d4, 0x5fb4d4, 0x3f92b8, 0x3f92b8, 1);
  bg.fillRect(0, 150, GAME_W, AREA_H - 150);
  area.add(bg);
  // 波すじ(ながれる)
  const waves: Phaser.GameObjects.Graphics[] = [];
  for (let i = 0; i < 8; i++) {
    const w = scene.add.graphics();
    w.fillStyle(0xffffff, 0.22);
    w.fillRoundedRect(-30, 0, 60 + Math.random() * 50, 5, 2.5);
    w.setPosition(40 + Math.random() * (GAME_W - 80), 170 + i * 60);
    area.add(w);
    waves.push(w);
  }

  api.sign(prompt);

  const session = new ArcadeSession(api, {
    engine: 'sousen',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- ふね(指に吸い付いて傾く) ---------- */
  const boat = scene.add.container(GAME_W / 2, BOAT_Y);
  const bt = scene.add.graphics();
  bt.fillStyle(0xffffff, 1);
  bt.beginPath();
  bt.moveTo(-46, -6);
  bt.lineTo(46, -6);
  bt.lineTo(30, 26);
  bt.lineTo(-30, 26);
  bt.closePath();
  bt.fillPath();
  bt.fillStyle(0xd94f4f, 1);
  bt.fillRect(-46, -12, 92, 8);
  bt.fillStyle(0x4a6a8a, 1);
  bt.fillRoundedRect(-20, -34, 40, 24, 6);
  bt.fillStyle(0xe8b84b, 1);
  bt.fillRect(-4, -52, 8, 20);
  boat.add(bt);
  const flag = scene.add.text(16, -48, '🚩', { fontSize: '18px' }).setOrigin(0.5);
  boat.add(flag);
  area.add(boat);
  // 航跡
  const wakeTimer = scene.time.addEvent({
    delay: 130,
    loop: true,
    callback: () => {
      if (session.isEnded()) return;
      const dot = scene.add.circle(boat.x + (Math.random() - 0.5) * 20, BOAT_Y + 30, 5, 0xffffff, 0.5);
      area.add(dot);
      scene.tweens.add({ targets: dot, y: dot.y + 40, alpha: 0, scale: 0.3, duration: 700, onComplete: () => dot.destroy() });
    },
  });

  let targetX = boat.x;
  const onMove = (p: Phaser.Input.Pointer): void => {
    targetX = Phaser.Math.Clamp(p.worldX, 46, GAME_W - 46);
  };
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerdown', onMove);

  /* ---------- ながれてくるもの ---------- */
  const floaters: Floater[] = [];
  let spawnTimer: Phaser.Time.TimerEvent | undefined;

  const spawnGate = (): void => {
    const gap = Phaser.Math.Linear(GAP_FROM, GAP_TO, session.progress());
    const cx = 70 + gap / 2 + Math.random() * (GAME_W - 140 - gap);
    const c = scene.add.container(0, -40);
    for (const side of [-1, 1]) {
      const px = cx + (side * gap) / 2;
      const g = scene.add.graphics();
      g.fillStyle(0xa9713a, 1);
      g.fillRect(px - 4, -26, 8, 52);
      c.add(g);
      const f = scene.add.text(px, -30, side < 0 ? '🚩' : '🎌', { fontSize: '22px' }).setOrigin(0.5, 1);
      c.add(f);
    }
    area.add(c);
    floaters.push({ kind: 'gate', y: -40, cx, gap, obj: c, passed: false });
  };

  const spawnBuoy = (): void => {
    const x = 60 + Math.random() * (GAME_W - 120);
    const c = scene.add.container(x, -30);
    const g = scene.add.graphics();
    g.fillStyle(0xe05b5b, 1);
    g.fillCircle(0, 0, 16);
    g.fillStyle(0xffffff, 1);
    g.fillRect(-16, -4, 32, 8);
    c.add(g);
    area.add(c);
    scene.tweens.add({ targets: c, angle: { from: -8, to: 8 }, duration: 800, yoyo: true, repeat: -1 });
    floaters.push({ kind: 'buoy', y: -30, x, obj: c, hit: false });
  };

  const spawnHorn = (): void => {
    const big = Math.random() < HORN_BIG_CHANCE;
    const x = 70 + Math.random() * (GAME_W - 140);
    const c = scene.add.container(x, -30);
    const g = scene.add.graphics();
    g.lineStyle(4, big ? 0xffd34d : 0xffffff, 0.95);
    g.strokeCircle(0, 0, big ? 34 : 26);
    g.lineStyle(2, big ? 0xffd34d : 0xffffff, 0.4);
    g.strokeCircle(0, 0, big ? 44 : 34);
    c.add(g);
    c.add(scene.add.text(0, 0, '📯', { fontSize: big ? '26px' : '20px' }).setOrigin(0.5));
    area.add(c);
    scene.tweens.add({ targets: c, alpha: 0.55, duration: 400, yoyo: true, repeat: -1 });
    floaters.push({ kind: 'horn', y: -30, x, big, obj: c, used: false });
  };

  const spawn = (): void => {
    if (session.isEnded()) return;
    const roll = Math.random();
    if (roll < HORN_CHANCE) spawnHorn();
    else if (roll < HORN_CHANCE + 0.3) spawnBuoy();
    else spawnGate();
    // 終盤はブイを追加で流す
    if (session.progress() > 0.55 && Math.random() < 0.4) spawnBuoy();
    spawnTimer = scene.time.delayedCall(Phaser.Math.Linear(SPAWN_FROM, SPAWN_TO, session.progress()), spawn);
  };

  /* ---------- きてき(タップ) ---------- */
  const onDown = (p: Phaser.Input.Pointer): void => {
    onMove(p);
    if (session.isEnded()) return;
    for (const f of floaters) {
      if (f.kind !== 'horn' || f.used) continue;
      if (Math.abs(f.y - BOAT_Y) < 52 && Math.abs(f.x - boat.x) < 70) {
        f.used = true;
        SFX.fanfare();
        if (f.big) {
          bigImpact(scene, boat.x, BOAT_Y + api.areaY - 30);
          confetti(scene, 16);
          floatUp(scene, boat.x, BOAT_Y + api.areaY - 90, UI_TEXT.fest.hornBig, '#e0812a');
          session.addPoints(HORN_BIG_PTS, boat.x, BOAT_Y + api.areaY - 60);
        } else {
          floatUp(scene, boat.x, BOAT_Y + api.areaY - 90, UI_TEXT.fest.horn, '#3f7d2c');
          session.addPoints(HORN_PTS, boat.x, BOAT_Y + api.areaY - 60, false);
        }
        burst(scene, f.x, f.y + api.areaY, 8, [0xffd34d, 0xffffff, 0x8ed4e8]);
        f.obj.destroy();
        return;
      }
    }
  };
  scene.input.on('pointerdown', onDown);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    // ふねの吸い付き+傾き
    const dx = (targetX - boat.x) * BOAT_LERP;
    boat.x += dx;
    boat.setAngle(Phaser.Math.Clamp(dx * 0.9, -TILT_MAX, TILT_MAX));
    // 波と浮遊物を流す
    const flow = Phaser.Math.Linear(FLOW_FROM, FLOW_TO, session.progress()) * dt;
    for (const w of waves) {
      w.y += flow;
      if (w.y > AREA_H + 10) w.y = 150;
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.y += flow;
      f.obj.y = f.y;
      if (f.kind === 'gate' && !f.passed && f.y >= BOAT_Y - 8) {
        f.passed = true;
        if (Math.abs(boat.x - f.cx) < f.gap / 2 - 20) {
          SFX.good();
          session.addPoints(GATE_PTS, boat.x, BOAT_Y + api.areaY - 60);
          floatUp(scene, f.cx, BOAT_Y + api.areaY - 100, UI_TEXT.fest.gatePass, '#3f7d2c');
          burst(scene, boat.x, BOAT_Y + api.areaY - 20, 6, [0xffffff, 0x8ed4e8]);
        } else {
          session.resetCombo();
        }
      }
      if (f.kind === 'buoy' && !f.hit && Math.abs(f.y - BOAT_Y) < 34 && Math.abs(f.x - boat.x) < 52) {
        f.hit = true;
        session.resetCombo();
        missShake(scene);
        SFX.bad();
        floatUp(scene, boat.x, BOAT_Y + api.areaY - 70, UI_TEXT.fest.bump, '#c04545');
        scene.tweens.add({ targets: boat, angle: { from: -16, to: 0 }, duration: 300 });
      }
      if (f.y > AREA_H + 60) {
        f.obj.destroy();
        floaters.splice(i, 1);
      }
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerdown', onMove);
    scene.input.off('pointerdown', onDown);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    spawnTimer?.remove();
    wakeTimer.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);

  spawn();
}

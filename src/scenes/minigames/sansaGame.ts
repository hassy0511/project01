/* さんさおどり(いわて・もりおか): 2レーンの たいこリズムゲーム。
   うえから ながれてくる まるが、ひだり/みぎの たいこに かさなった しゅんかんに
   その がわを タップ=「ドン!」。りょうほう同時も くる(終盤)。
   はずしても コンボが切れるだけ(成功保証)。「パレードタイム」= 2倍 が C 要素。
   rhythm(1レーン横ながれ)との違い = 左右の手の つかいわけ */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const DRUM_Y = 520;
const LANE_X = [140, 340];
const NOTE_SPEED = 240; // px/s
const SPAWN_FROM_MS = 1100;
const SPAWN_TO_MS = 680;
const PERFECT_PX = 24;
const GOOD_PX = 58;
const PERFECT_PTS = 14;
const GOOD_PTS = 6;
const WHIFF_STUN_MS = 350;
const DOUBLE_CHANCE = 0.3;
const PARADE_EVERY_MS = 15000;
const PARADE_LEN_MS = 6000;

interface Note {
  obj: Phaser.GameObjects.Container;
  lane: number;
  done: boolean;
}

export function renderSansa(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x3a4a7a, 0x3a4a7a, 0x5a3a5a, 0x5a3a5a, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0xffffff, 0.12);
  for (const x of LANE_X) bg.fillRoundedRect(x - 46, 60, 92, DRUM_Y - 40, 24);
  area.add(bg);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'sansa',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- たいこ 2つ ---------- */
  const drums: Phaser.GameObjects.Container[] = [];
  for (const x of LANE_X) {
    const d = scene.add.container(x, DRUM_Y);
    const g = scene.add.graphics();
    g.fillStyle(0xc9a86a, 1);
    g.fillEllipse(0, 8, 108, 40);
    g.fillStyle(0xf2e6c9, 1);
    g.fillEllipse(0, 0, 104, 38);
    g.lineStyle(4, 0xd94f4f, 1);
    g.strokeEllipse(0, 0, 104, 38);
    g.fillStyle(0xd94f4f, 1);
    g.fillCircle(0, 0, 8);
    d.add(g);
    area.add(d);
    drums.push(d);
  }
  // おどりて
  const dancer = scene.add.text(GAME_W / 2, 600, '👘', { fontSize: '36px' }).setOrigin(0.5);
  area.add(dancer);
  scene.tweens.add({ targets: dancer, y: 594, duration: 500, yoyo: true, repeat: -1 });

  /* ---------- ながれてくる まる ---------- */
  const notes: Note[] = [];
  let parade = false;

  const spawn = (lane: number): void => {
    if (session.isEnded()) return;
    const c = scene.add.container(LANE_X[lane], 40);
    const g = scene.add.graphics();
    g.fillStyle(parade ? 0xffd34d : 0xf2e6c9, 1);
    g.fillCircle(0, 0, 20);
    g.lineStyle(4, 0xd94f4f, 1);
    g.strokeCircle(0, 0, 20);
    c.add(g);
    area.add(c);
    notes.push({ obj: c, lane, done: false });
  };

  let spawnTimer: Phaser.Time.TimerEvent | undefined;
  const scheduleSpawn = (): void => {
    const iv = Phaser.Math.Linear(SPAWN_FROM_MS, SPAWN_TO_MS, session.progress()) * (parade ? 0.85 : 1);
    spawnTimer = scene.time.delayedCall(iv, () => {
      if (session.isEnded()) return;
      const lane = Math.floor(Math.random() * 2);
      spawn(lane);
      if (session.progress() > 0.4 && Math.random() < DOUBLE_CHANCE) spawn(1 - lane);
      scheduleSpawn();
    });
  };
  spawn(0);
  scheduleSpawn();

  const removeNote = (n: Note): void => {
    n.done = true;
    const i = notes.indexOf(n);
    if (i >= 0) notes.splice(i, 1);
  };

  let stunnedUntil = 0;
  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded() || Date.now() < stunnedUntil) return;
    const lane = p.worldX < GAME_W / 2 ? 0 : 1;
    let best: Note | null = null;
    let bestD = Infinity;
    for (const n of notes) {
      if (n.lane !== lane) continue;
      const d = Math.abs(n.obj.y - DRUM_Y);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    const drum = drums[lane];
    scene.tweens.add({ targets: drum, scaleY: 0.86, duration: 70, yoyo: true });
    if (!best || bestD > GOOD_PX) {
      stunnedUntil = Date.now() + WHIFF_STUN_MS;
      session.resetCombo();
      SFX.bad();
      floatUp(scene, LANE_X[lane], DRUM_Y + api.areaY - 60, UI_TEXT.arcade.miss, '#c04545');
      return;
    }
    const just = bestD <= PERFECT_PX;
    const pts = (just ? PERFECT_PTS : GOOD_PTS) * (parade ? 2 : 1);
    SFX.pop();
    if (just) SFX.good();
    impactRing(scene, LANE_X[lane], DRUM_Y + api.areaY, just ? 0xffd34d : 0xffffff, 12);
    burst(scene, LANE_X[lane], DRUM_Y + api.areaY, just ? 9 : 5);
    session.addPoints(pts, LANE_X[lane], DRUM_Y + api.areaY - 50);
    floatUp(scene, LANE_X[lane], DRUM_Y + api.areaY - 80, UI_TEXT.fest.sansaDon, just ? '#3f7d2c' : '#e0812a');
    const obj = best.obj;
    removeNote(best);
    scene.tweens.add({ targets: obj, scale: 1.5, alpha: 0, duration: 160, onComplete: () => obj.destroy() });
  };
  scene.input.on('pointerdown', onDown);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    for (const n of [...notes]) {
      n.obj.y += NOTE_SPEED * dt;
      if (n.obj.y > DRUM_Y + GOOD_PX + 16) {
        removeNote(n);
        session.resetCombo();
        missShake(scene);
        const obj = n.obj;
        scene.tweens.add({ targets: obj, alpha: 0, y: obj.y + 30, duration: 300, onComplete: () => obj.destroy() });
      }
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  // パレードタイム(C要素)
  const paradeTimer = scene.time.addEvent({
    delay: PARADE_EVERY_MS,
    loop: true,
    callback: () => {
      if (session.isEnded() || parade) return;
      parade = true;
      SFX.fanfare();
      floatUp(scene, GAME_W / 2, 160 + api.areaY, UI_TEXT.fest.sansaParade, '#e0812a');
      confetti(scene, 16);
      scene.time.delayedCall(PARADE_LEN_MS, () => {
        parade = false;
      });
    },
  });

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    spawnTimer?.remove();
    paradeTimer.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

/* たなばたまつり(みやぎ・せんだい): かざりつけゲーム。
   笹(ささ)の ひかっている フックに、おなじ色の ふきながしを ドラッグして つるす。
   色ちがい・とどかない は ぷるんと もどるだけ(コンボが切れるだけ=成功保証)。
   まれに「きんの ふきながし」フックが ひかる(大得点)が C 要素。
   実在の仙台七夕の「かざりを つるして まちを いろどる」をそのまま動詞化 */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const TRAY_Y = 600;
const HANG_PTS = 12;
const GOLD_PTS = 30;
const GOLD_CHANCE = 0.12;
/** フックの ひかる時間(序盤→終盤, ms)と 吸いつき判定 */
const HOOK_FROM_MS = 5200;
const HOOK_TO_MS = 3000;
const SNAP_PX = 54;

const COLORS3 = [0xf06292, 0x64b5f6, 0xffd54f];

interface Hook {
  x: number;
  y: number;
}

export function renderTanabata(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // あさの しょうてんがい + 笹 2本
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xaee3f7, 0xaee3f7, 0xf7ecd2, 0xf7ecd2, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0x5e9c43, 1);
  bg.fillRect(96, 60, 10, 480);
  bg.fillRect(374, 60, 10, 480);
  for (const [bx, dir] of [[100, -1], [379, 1]] as const) {
    for (let i = 0; i < 6; i++) {
      bg.fillStyle(0x7bbf5a, 1);
      bg.fillEllipse(bx + dir * (22 + (i % 2) * 10), 90 + i * 78, 44, 14);
    }
  }
  area.add(bg);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'tanabata',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- トレイ(3色の ふきながし) ---------- */
  const makeDeco =(color: number, x: number, y: number, scale = 1): Phaser.GameObjects.Container => {
    const c = scene.add.container(x, y).setScale(scale);
    const g = scene.add.graphics();
    g.fillStyle(color, 1);
    g.fillEllipse(0, -18, 40, 26); // くす玉
    g.fillStyle(color, 0.75);
    for (let i = -2; i <= 2; i++) g.fillRect(i * 8 - 2, -8, 4, 44); // たれる かみ
    g.fillStyle(0xffffff, 0.5);
    g.fillEllipse(-8, -22, 12, 8);
    c.add(g);
    return c;
  };
  const trayItems: { color: number; obj: Phaser.GameObjects.Container }[] = [];
  COLORS3.forEach((color, i) => {
    const obj = makeDeco(color, 120 + i * 120, TRAY_Y);
    area.add(obj);
    trayItems.push({ color, obj });
  });

  /* ---------- ひかる フック(1つずつ) ---------- */
  const HOOKS: Hook[] = [];
  for (const bx of [101, 379]) for (let i = 0; i < 5; i++) HOOKS.push({ x: bx + (bx < 240 ? 34 : -34), y: 110 + i * 84 });
  let cur: { hook: Hook; color: number; gold: boolean; ring: Phaser.GameObjects.Arc; timer: Phaser.Time.TimerEvent } | null = null;

  const nextHook = (): void => {
    if (session.isEnded()) return;
    cur?.ring.destroy();
    cur?.timer.remove();
    const hook = HOOKS[Math.floor(Math.random() * HOOKS.length)];
    const gold = Math.random() < GOLD_CHANCE;
    const color = gold ? 0xffd34d : COLORS3[Math.floor(Math.random() * COLORS3.length)];
    const ring = scene.add.circle(hook.x, hook.y, 26).setStrokeStyle(5, color, 0.95);
    area.add(ring);
    scene.tweens.add({ targets: ring, scale: { from: 1, to: 1.25 }, alpha: { from: 1, to: 0.5 }, duration: 500, yoyo: true, repeat: -1 });
    const ms = Phaser.Math.Linear(HOOK_FROM_MS, HOOK_TO_MS, session.progress());
    const timer = scene.time.delayedCall(ms, () => {
      // まにあわなかった: フックが べつの ばしょへ(コンボが切れる)
      session.resetCombo();
      nextHook();
    });
    cur = { hook, color, gold, ring, timer };
  };
  nextHook();

  /* ---------- ドラッグ ---------- */
  let drag: { color: number; ghost: Phaser.GameObjects.Container } | null = null;

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    const py = p.worldY - api.areaY;
    for (const t of trayItems) {
      if (Math.hypot(p.worldX - t.obj.x, py - t.obj.y) < 52) {
        const ghost = makeDeco(t.color, p.worldX, py, 1.1);
        area.add(ghost);
        drag = { color: t.color, ghost };
        return;
      }
    }
  };
  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!drag) return;
    drag.ghost.setPosition(p.worldX, p.worldY - api.areaY);
  };
  const onUp = (p: Phaser.Input.Pointer): void => {
    if (!drag) return;
    const { color, ghost } = drag;
    drag = null;
    const py = p.worldY - api.areaY;
    const hit = cur && Math.hypot(p.worldX - cur.hook.x, py - cur.hook.y) < SNAP_PX;
    // きんのフックは どの色でも OK(ごほうび)。ふつうは 色が あっていること
    if (hit && cur && (cur.gold || cur.color === color)) {
      const { hook, gold } = cur;
      cur.ring.destroy();
      cur.timer.remove();
      cur = null;
      ghost.setPosition(hook.x, hook.y + 22);
      SFX.pop();
      if (gold) SFX.good();
      impactRing(scene, hook.x, hook.y + api.areaY, gold ? 0xffd34d : 0xffffff, 12);
      burst(scene, hook.x, hook.y + api.areaY, gold ? 12 : 6);
      session.addPoints(gold ? GOLD_PTS : HANG_PTS, hook.x, hook.y + api.areaY - 26);
      floatUp(scene, hook.x, hook.y + api.areaY - 50, gold ? UI_TEXT.fest.tanabataGold : UI_TEXT.fest.tanabataHang, gold ? '#e0812a' : '#3f7d2c');
      if (gold) {
        bigImpact(scene, hook.x, hook.y + api.areaY);
        confetti(scene, 12);
      }
      // かざりは ゆれながら のこる(まちが にぎやかに なっていく)
      scene.tweens.add({ targets: ghost, angle: { from: -6, to: 6 }, duration: 900, yoyo: true, repeat: -1 });
      scene.time.delayedCall(250, nextHook);
    } else {
      // いろちがい/とどかない: ふわっと きえるだけ
      if (hit) {
        session.resetCombo();
        SFX.bad();
        floatUp(scene, p.worldX, py + api.areaY - 30, UI_TEXT.fest.tanabataMissHook, '#c04545');
      }
      scene.tweens.add({ targets: ghost, alpha: 0, scale: 0.5, duration: 220, onComplete: () => ghost.destroy() });
    }
  };

  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);
  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
    cur?.timer.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

/* うわじま うしおにまつり(えひめ): ながい くびの「うしおに」が まちを ねりあるき、
   いえの もんに あたまを 入れて わるいものを おいはらう。
   ゆびで あたまを ドラッグすると くびが にょろにょろ のびる。
   ひかっている もんに あたまを 入れると おはらい せいこう。
   くびは のばしすぎると もどってしまう(のびる かぎりが ある = のばす きょりの かけひき)。
   ぜんぶの もんを おはらいすると 大ボーナス。動作=のばして ねらう(のびる くびの コントロール) */
import Phaser from 'phaser';
import { addIcon, setIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import { offPointerRelease, onPointerRelease } from './input';
import type { MinigameApi } from './types';

const AREA_H = 660;
/** からだの ばしょ(ここから くびが のびる) */
const BODY_Y = 560;
/** くびの さいだいの ながさ */
const NECK_MAX = 330;
/** もん */
const GATE_PTS = 20;
const ALL_BONUS = 50;
const GATE_R = 40;

interface Gate {
  obj: Phaser.GameObjects.Image;
  x: number;
  y: number;
  done: boolean;
}

export function renderUshioni(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x3a5a8a, 0x3a5a8a, 0x8a7a5a, 0x8a7a5a, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0x6b5a3a, 1);
  bg.fillRect(0, BODY_Y + 30, GAME_W, AREA_H - BODY_Y - 30); // とおり
  area.add(bg);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'ushioni',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- もん(いえ) ---------- */
  const gates: Gate[] = [];
  const buildGates = (): void => {
    for (const g of gates) g.obj.destroy();
    gates.length = 0;
    const spots = [
      [70, 200],
      [200, 150],
      [340, 210],
      [420, 330],
      [110, 340],
    ] as const;
    for (const [x, y] of spots) {
      const obj = addIcon(scene, x, y, 'house:teal', 40).setName('mg-gate');
      area.add(obj);
      gates.push({ obj, x, y, done: false });
    }
    lightNext();
  };

  let target: Gate | null = null;
  const lightNext = (): void => {
    for (const g of gates) g.obj.setTint(0xffffff).setScale(1);
    const rest = gates.filter((g) => !g.done);
    target = rest.length ? rest[Math.floor(Math.random() * rest.length)] : null;
    if (target) {
      target.obj.setTint(0xffd34d);
      scene.tweens.add({ targets: target.obj, scale: { from: 1, to: 1.16 }, duration: 420, yoyo: true, repeat: -1 });
    }
  };

  /* ---------- うしおに ---------- */
  const neck = scene.add.graphics();
  area.add(neck);
  const body = scene.add.container(GAME_W / 2, BODY_Y);
  const bgph = scene.add.graphics();
  bgph.fillStyle(0x8a3a2a, 1);
  bgph.fillEllipse(0, 0, 190, 90); // あかい どう(しゅろの け)
  bgph.fillStyle(0x6b2a1a, 1);
  for (let i = -3; i <= 3; i++) bgph.fillEllipse(i * 26, 6, 20, 60);
  body.add(bgph);
  for (const dx of [-60, -20, 20, 60]) body.add(addIcon(scene, dx, 52, 'person:teal', 20));
  area.add(body);

  const head = addIcon(scene, GAME_W / 2, BODY_Y - 120, 'cow:dark', 46).setName('mg-head');
  area.add(head);

  let dragging = false;
  let cleared = 0;

  const drawNeck = (): void => {
    neck.clear();
    const x0 = body.x;
    const y0 = BODY_Y - 30;
    const x1 = head.x;
    const y1 = head.y;
    const len = Math.hypot(x1 - x0, y1 - y0);
    // にょろにょろの くび(なみを つけた たいこせん)
    neck.lineStyle(16, 0x8a3a2a, 1);
    neck.beginPath();
    neck.moveTo(x0, y0);
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const nx = x0 + (x1 - x0) * t;
      const ny = y0 + (y1 - y0) * t;
      const wob = Math.sin(t * Math.PI * 2 + Date.now() / 260) * (10 * (1 - t)) * (len / NECK_MAX);
      neck.lineTo(nx + wob, ny);
    }
    neck.strokePath();
  };

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    if (Math.hypot(p.worldX - head.x, p.worldY - api.areaY - head.y) < 70) dragging = true;
  };

  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!dragging || !p.isDown || session.isEnded()) return;
    const x = p.worldX;
    const y = p.worldY - api.areaY;
    const dx = x - body.x;
    const dy = y - (BODY_Y - 30);
    const len = Math.hypot(dx, dy);
    if (len > NECK_MAX) {
      // のばしすぎ: くびが もどる
      const k = NECK_MAX / len;
      head.setPosition(body.x + dx * k, BODY_Y - 30 + dy * k);
      if (Math.random() < 0.06) floatUp(scene, head.x, head.y + api.areaY - 40, UI_TEXT.fest.ushioniLimit, '#c04545');
    } else {
      head.setPosition(x, y);
    }
    // もんに あたまが 入ったか
    if (target && !target.done && Math.hypot(head.x - target.x, head.y - target.y) < GATE_R) {
      const g = target;
      g.done = true;
      cleared++;
      SFX.good();
      impactRing(scene, g.x, g.y + api.areaY, 0xffd34d, 14);
      burst(scene, g.x, g.y + api.areaY, 10, [0xffd34d, 0xffffff]);
      session.addPoints(GATE_PTS, g.x, g.y + api.areaY - 50);
      floatUp(scene, g.x, g.y + api.areaY - 80, UI_TEXT.fest.ushioniOharai, '#e0812a');
      setIcon(g.obj, 'sparkle:gold');
      scene.tweens.killTweensOf(g.obj);
      g.obj.setScale(1).setTint(0xffffff);
      if (gates.every((x2) => x2.done)) {
        SFX.fanfare();
        bigImpact(scene, GAME_W / 2, 300 + api.areaY);
        confetti(scene, 20);
        session.addPoints(ALL_BONUS, GAME_W / 2, 280 + api.areaY, false);
        floatUp(scene, GAME_W / 2, 250 + api.areaY, UI_TEXT.fest.ushioniAll, '#e0812a');
        scene.time.delayedCall(900, () => {
          if (!session.isEnded()) buildGates();
        });
      } else {
        lightNext();
      }
    } else if (target) {
      // ひかっていない もんに 入れると おはらいに ならない(コンボ切れ)
      for (const g of gates) {
        if (g === target || g.done) continue;
        if (Math.hypot(head.x - g.x, head.y - g.y) < GATE_R * 0.7) {
          session.resetCombo();
          SFX.bad();
          missShake(scene);
          floatUp(scene, g.x, g.y + api.areaY - 50, UI_TEXT.fest.ushioniWrong, '#c04545');
          break;
        }
      }
    }
  };

  const onUp = (): void => {
    dragging = false;
    // くびは すこし もどる
    scene.tweens.add({ targets: head, x: body.x, y: BODY_Y - 120, duration: 500, ease: 'Sine.easeOut' });
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  onPointerRelease(scene, onUp);
  buildGates();

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    // からだは ゆっくり ねりあるく
    body.x += Math.sin(Date.now() / 1800) * 0.5 * (Math.min(dtMs, 33) / 16);
    body.x = Phaser.Math.Clamp(body.x, 120, GAME_W - 120);
    if (!dragging) head.x += (body.x - head.x) * 0.05;
    void cleared;
    drawNeck();
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    offPointerRelease(scene, onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

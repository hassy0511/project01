/* かなざわ ひゃくまんごく まつり(いしかわ): とうろう流しゲーム。
   きしべの とうろうを 指で つかんで、川面まで そっと はこんで はなす。
   はなす瞬間の 指の はやさが たいせつ: ゆっくり はなすと すーっと ながれ(得点)、
   いきおいよく はなすと ひっくり返って ひが きえる(コンボが切れるだけ=成功保証)。
   ときどき「きんの とうろう」= 大得点(C要素)。
   pluck(引く)と違い、これは「はこんで、そっと はなす」= 速度をゼロに近づける遊び */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import { offPointerRelease, onPointerRelease } from './input';
import { CROWD } from './crowd';
import type { MinigameApi } from './types';

const AREA_H = GAME_AREA_H;
/** 川の 上端(ここより下に はなせば ながれる) */
const RIVER_Y = 300;
const BANK_Y = 560;
const PTS = 12;
const GOLD_PTS = 34;
const GOLD_CHANCE = 0.14;
/** そっと はなす 判定(px/ms): これ以下なら せいこう */
const GENTLE_V = 0.45;
const VEL_WINDOW_MS = 90;

interface Lantern {
  obj: Phaser.GameObjects.Container;
  gold: boolean;
  flowing: boolean;
}

export function renderTourou(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 夜の かわ(かなざわの あさのがわ風)
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x1d2338, 0x1d2338, 0x2d3550, 0x2d3550, 1);
  bg.fillRect(0, 0, GAME_W, RIVER_Y);
  bg.fillGradientStyle(0x24405e, 0x24405e, 0x16283c, 0x16283c, 1);
  bg.fillRect(0, RIVER_Y, GAME_W, BANK_Y - RIVER_Y);
  bg.fillStyle(0x3d3a33, 1);
  bg.fillRect(0, BANK_Y, GAME_W, AREA_H - BANK_Y);
  area.add(bg);
  // 水面の きらめき
  for (let i = 0; i < 8; i++) {
    const sh = scene.add.graphics();
    sh.fillStyle(0xffffff, 0.1);
    sh.fillRoundedRect(0, 0, 60, 4, 2);
    sh.setPosition(Math.random() * GAME_W, RIVER_Y + 20 + Math.random() * (BANK_Y - RIVER_Y - 40));
    area.add(sh);
    scene.tweens.add({ targets: sh, x: sh.x + 40, alpha: 0.3, duration: 2200 + i * 200, yoyo: true, repeat: -1 });
  }
  // 見物人
  for (let i = 0; i < 6; i++) {
    area.add(addIcon(scene, 30 + i * 82, BANK_Y + 60, CROWD[i % CROWD.length], 24));
  }

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'tourou',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  const flowing: Lantern[] = [];

  const makeLantern = (x: number, y: number, gold: boolean): Lantern => {
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(gold ? 0xffd34d : 0xf5e6c8, 1);
    g.fillRoundedRect(-20, -24, 40, 34, 6); // ほんたい
    g.fillStyle(0x8a6242, 1);
    g.fillRect(-24, 10, 48, 8); // だい
    g.fillStyle(gold ? 0xffef9f : 0xffe0a3, 0.85);
    g.fillCircle(0, -8, 9); // ひ
    c.add(g);
    c.add(addIcon(scene, 0, -8, 'fire:orange', 14));
    area.add(c);
    return { obj: c, gold, flowing: false };
  };

  /* ---------- きしべの とうろう(1つずつ) ---------- */
  let cur: Lantern | null = null;
  const spawn = (): void => {
    if (session.isEnded()) return;
    cur = makeLantern(GAME_W / 2, BANK_Y - 6, Math.random() < GOLD_CHANCE);
    cur.obj.setScale(0);
    scene.tweens.add({ targets: cur.obj, scale: 1, ease: 'Back.easeOut', duration: 260 });
    if (cur.gold) {
      SFX.fanfare();
      floatUp(scene, GAME_W / 2, BANK_Y + api.areaY - 60, UI_TEXT.fest.tourouGold, '#e0812a');
    }
  };
  spawn();

  /* ---------- ドラッグ ---------- */
  let grab: { lantern: Lantern; lastT: number; lastY: number; v: number } | null = null;

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded() || !cur) return;
    const py = p.worldY - api.areaY;
    if (Math.hypot(p.worldX - cur.obj.x, py - cur.obj.y) > 60) return;
    grab = { lantern: cur, lastT: Date.now(), lastY: p.worldY, v: 0 };
  };
  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!grab || !p.isDown) return;
    grab.lantern.obj.setPosition(p.worldX, Phaser.Math.Clamp(p.worldY - api.areaY, RIVER_Y + 10, BANK_Y - 6));
    const now = Date.now();
    if (now - grab.lastT >= VEL_WINDOW_MS) {
      grab.v = Math.abs(p.worldY - grab.lastY) / (now - grab.lastT);
      grab.lastT = now;
      grab.lastY = p.worldY;
    }
  };
  const onUp = (): void => {
    if (!grab) return;
    const { lantern, v } = grab;
    grab = null;
    const onRiver = lantern.obj.y < BANK_Y - 20;
    if (!onRiver) {
      // まだ きしべ: そのまま
      return;
    }
    if (v <= GENTLE_V) {
      // そっと はなせた: すーっと ながれる
      lantern.flowing = true;
      flowing.push(lantern);
      cur = null;
      SFX.pop();
      if (lantern.gold) SFX.good();
      impactRing(scene, lantern.obj.x, lantern.obj.y + api.areaY, lantern.gold ? 0xffd34d : 0xffe0a3, 10);
      session.addPoints(lantern.gold ? GOLD_PTS : PTS, lantern.obj.x, lantern.obj.y + api.areaY - 40);
      floatUp(scene, lantern.obj.x, lantern.obj.y + api.areaY - 60, UI_TEXT.fest.tourouFlow, '#3f7d2c');
      if (lantern.gold) {
        bigImpact(scene, lantern.obj.x, lantern.obj.y + api.areaY);
        confetti(scene, 12);
      }
      scene.time.delayedCall(500, spawn);
    } else {
      // いきおいよく はなした: ひっくり返って ひが きえる
      cur = null;
      session.resetCombo();
      SFX.bad();
      burst(scene, lantern.obj.x, lantern.obj.y + api.areaY, 5, [0x9ad0f5, 0xffffff]);
      floatUp(scene, lantern.obj.x, lantern.obj.y + api.areaY - 40, UI_TEXT.fest.tourouTip, '#c04545');
      const obj = lantern.obj;
      scene.tweens.add({
        targets: obj,
        angle: 160,
        y: obj.y + 26,
        alpha: 0,
        duration: 520,
        onComplete: () => obj.destroy(),
      });
      scene.time.delayedCall(600, spawn);
    }
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  onPointerRelease(scene, onUp);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    for (const l of [...flowing]) {
      l.obj.x += 42 * dt;
      l.obj.y -= 8 * dt;
      l.obj.setAngle(Math.sin(l.obj.x / 40) * 4);
      if (l.obj.x > GAME_W + 40) {
        l.obj.destroy();
        flowing.splice(flowing.indexOf(l), 1);
      }
    }
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

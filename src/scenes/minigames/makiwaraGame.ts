/* つしま てんのうさい(あいち): まきわら舟の ちょうちん飾りゲーム。
   ふねの うえに ちょうちんを「はんえん(半円)」に かざる。
   ひかった とりつけ位置を タップすると ちょうちんが ともる。
   じゅんばんは 自由だが、ひかりは すぐ 別の位置へ 移るので 目と指の 追いかけっこ。
   はんえんが 1つ 完成すると ボーナス+ふねが 川を すすむ。
   ちがう場所を タップしても なにも起きないだけ(成功保証) */
import Phaser from 'phaser';
import { addIcon, iconScale } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = GAME_AREA_H;
const BOAT_Y = 470;
/** ちょうちんの 半円: 個数と 半径 */
const N = 12;
const RADIUS = 150;
const LIT_PTS = 9;
const ARC_BONUS = 28;
/** ひかりが 移るまで(ms): 序盤→終盤 */
const HINT_FROM_MS = 1500;
const HINT_TO_MS = 800;

export function renderMakiwara(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 夜の 川(まきわら舟)
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x141a33, 0x141a33, 0x24304f, 0x24304f, 1);
  bg.fillRect(0, 0, GAME_W, BOAT_Y + 40);
  bg.fillGradientStyle(0x1d3a52, 0x1d3a52, 0x122636, 0x122636, 1);
  bg.fillRect(0, BOAT_Y + 40, GAME_W, AREA_H - BOAT_Y - 40);
  area.add(bg);
  for (let i = 0; i < 6; i++) {
    const sh = scene.add.graphics();
    sh.fillStyle(0xffd34d, 0.12);
    sh.fillRoundedRect(0, 0, 70, 5, 3);
    sh.setPosition(Math.random() * GAME_W, BOAT_Y + 70 + Math.random() * 120);
    area.add(sh);
    scene.tweens.add({ targets: sh, x: sh.x + 30, alpha: 0.05, duration: 2400 + i * 200, yoyo: true, repeat: -1 });
  }

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'makiwara',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- ふね ---------- */
  const boat = scene.add.container(GAME_W / 2, BOAT_Y);
  const bgr = scene.add.graphics();
  bgr.fillStyle(0x5a4a3a, 1);
  bgr.fillEllipse(0, 30, 260, 46); // ふなぞこ
  bgr.fillStyle(0x8a6a4a, 1);
  bgr.fillRoundedRect(-120, 6, 240, 26, 8);
  bgr.lineStyle(4, 0xa9713a, 1);
  bgr.lineBetween(0, 6, 0, -RADIUS + 20); // まきわらの ほばしら
  boat.add(bgr);
  area.add(boat);
  scene.tweens.add({ targets: boat, y: BOAT_Y - 6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  /* ---------- ちょうちんの とりつけ位置(半円) ---------- */
  interface Slot {
    x: number;
    y: number;
    lit: boolean;
    lamp: Phaser.GameObjects.Image;
    ring: Phaser.GameObjects.Arc;
  }
  const slots: Slot[] = [];
  const buildArc = (): void => {
    for (const s of slots) {
      s.lamp.destroy();
      s.ring.destroy();
    }
    slots.length = 0;
    for (let i = 0; i < N; i++) {
      const a = Math.PI + (i / (N - 1)) * Math.PI; // 上向きの 半円
      const x = Math.cos(a) * RADIUS;
      const y = Math.sin(a) * RADIUS * 0.62;
      const lamp = addIcon(scene, x, y, 'lantern:crimson', 22).setAlpha(0.22);
      boat.add(lamp);
      const ring = scene.add.circle(x, y, 20).setStrokeStyle(3, 0xffd34d, 0).setVisible(false);
      boat.add(ring);
      slots.push({ x, y, lit: false, lamp, ring });
    }
  };
  buildArc();

  /* ---------- ヒント(ひかる位置) ---------- */
  let hint = -1;
  let hintTimer: Phaser.Time.TimerEvent | undefined;
  const setHint = (i: number): void => {
    if (hint >= 0) {
      slots[hint].ring.setVisible(false);
      scene.tweens.killTweensOf(slots[hint].ring);
    }
    hint = i;
    if (i >= 0) {
      const s = slots[i];
      s.ring.setVisible(true).setStrokeStyle(3, 0xffd34d, 0.95).setScale(1);
      scene.tweens.add({ targets: s.ring, scale: 1.35, alpha: 0.3, duration: 520, yoyo: true, repeat: -1 });
      s.lamp.setAlpha(0.6);
    }
  };
  const nextHint = (): void => {
    if (session.isEnded()) return;
    const rest = slots.map((s, i) => (s.lit ? -1 : i)).filter((i) => i >= 0);
    if (!rest.length) return;
    setHint(rest[Math.floor(Math.random() * rest.length)]);
    hintTimer?.remove();
    hintTimer = scene.time.delayedCall(Phaser.Math.Linear(HINT_FROM_MS, HINT_TO_MS, session.progress()), () => {
      // まにあわなかった: べつの ばしょへ(コンボが切れる)
      session.resetCombo();
      if (hint >= 0 && !slots[hint].lit) slots[hint].lamp.setAlpha(0.22);
      nextHint();
    });
  };
  nextHint();

  const finishArc = (): void => {
    SFX.fanfare();
    session.addPoints(ARC_BONUS, boat.x, BOAT_Y + api.areaY - 120, false);
    floatUp(scene, boat.x, BOAT_Y + api.areaY - 150, UI_TEXT.fest.chochinRow, '#3f7d2c');
    bigImpact(scene, boat.x, BOAT_Y + api.areaY - 80);
    confetti(scene, 18);
    // ふねが すすむ(ゆらゆら 横へ)→ 次の 半円へ
    scene.tweens.add({
      targets: boat,
      x: boat.x + 40,
      duration: 700,
      yoyo: true,
      onComplete: () => {
        if (session.isEnded()) return;
        buildArc();
        nextHint();
      },
    });
  };

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded() || hint < 0) return;
    const s = slots[hint];
    const wx = boat.x + s.x;
    const wy = boat.y + s.y;
    if (Math.hypot(p.worldX - wx, p.worldY - api.areaY - wy) > 40) return;
    s.lit = true;
    s.lamp.setAlpha(1);
    s.ring.setVisible(false);
    scene.tweens.killTweensOf(s.ring);
    scene.tweens.add({ targets: s.lamp, scale: { from: iconScale(s.lamp, 1.5), to: iconScale(s.lamp) }, duration: 240, ease: 'Back.easeOut' });
    SFX.pop();
    impactRing(scene, wx, wy + api.areaY, 0xffd34d, 8);
    burst(scene, wx, wy + api.areaY, 4, [0xffd34d, 0xffffff]);
    session.addPoints(LIT_PTS, wx, wy + api.areaY - 24);
    if (Math.random() < 0.4) floatUp(scene, wx, wy + api.areaY - 40, UI_TEXT.fest.chochinOn, '#e0812a');
    if (slots.every((x) => x.lit)) finishArc();
    else nextHint();
  };
  scene.input.on('pointerdown', onDown);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    hintTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

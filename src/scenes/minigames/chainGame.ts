/* 色づき収穫(いちご・だいず): 畑の実が 緑 → だんだん色づく → 食べごろ → しおれる
   と変化していく。「食べごろ」の実だけを素早く摘む。青いうちに触るとコンボが切れる。
   同じ形の実を色で見分けるのが本体(時間経過で食べごろの窓が短くなる) */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, impactRing, missShake } from '../../ui/effects';
import { GAME_W } from '../../ui/theme';
import { drawMeadow } from '../../ui/scenery';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const HIT_RADIUS = 36;
const RIPE_PTS = 8;
/** 未熟(緑)→ 色づき(中間)→ 食べごろ の tint 段階 */
const TINT_UNRIPE = 0x86c26a;
const TINT_TURNING = 0xd9c26a;

type Stage = 'empty' | 'unripe' | 'turning' | 'ripe' | 'wilt';

interface Spot {
  x: number;
  y: number;
  stage: Stage;
  obj?: Phaser.GameObjects.Text;
  ring?: Phaser.GameObjects.Arc;
  timer?: Phaser.Time.TimerEvent;
}

export function renderChain(api: MinigameApi, target: string, prompt: string): void {
  const { scene, area } = api;
  drawMeadow(scene, area, AREA_H);
  api.sign(prompt);

  const session = new ArcadeSession(api, {
    engine: 'chain',
    onEnd: () => {
      cleanupInput();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  // うね(畝)と株の配置: 4列×3株のゆるいグリッド
  const spots: Spot[] = [];
  const rowsG = scene.add.graphics();
  for (let r = 0; r < 4; r++) {
    const y = 170 + r * 118;
    rowsG.fillStyle(0xa8895c, 0.55);
    rowsG.fillRoundedRect(30, y + 24, GAME_W - 60, 20, 10);
    for (let c = 0; c < 3; c++) {
      const x = 100 + c * 140 + (r % 2) * 24;
      // 株(緑のしげみ)
      rowsG.fillStyle(0x5e9c43, 1);
      rowsG.fillEllipse(x, y + 18, 64, 30);
      rowsG.fillStyle(0x7bbf5a, 1);
      rowsG.fillEllipse(x - 14, y + 10, 40, 24);
      rowsG.fillEllipse(x + 16, y + 12, 38, 22);
      spots.push({ x, y, stage: 'empty' });
    }
  }
  area.add(rowsG);

  const clearSpot = (s: Spot): void => {
    s.timer?.remove();
    s.ring?.destroy();
    s.obj?.destroy();
    s.obj = undefined;
    s.ring = undefined;
    s.stage = 'empty';
  };

  const schedule = (s: Spot, delayMs: number, fn: () => void): void => {
    s.timer = scene.time.delayedCall(delayMs, () => {
      if (!session.isEnded()) fn();
    });
  };

  const sprout = (s: Spot): void => {
    if (session.isEnded()) return;
    s.stage = 'unripe';
    s.obj = scene.add.text(s.x, s.y, target, { fontSize: '34px' }).setOrigin(0.5).setScale(0);
    s.obj.setTint(TINT_UNRIPE);
    area.add(s.obj);
    scene.tweens.add({ targets: s.obj, scale: 0.8, ease: 'Back.easeOut', duration: 260 });
    schedule(s, 1200 + Math.random() * 1400, () => turn(s));
  };

  const turn = (s: Spot): void => {
    if (!s.obj) return;
    s.stage = 'turning';
    s.obj.setTint(TINT_TURNING);
    scene.tweens.add({ targets: s.obj, scale: 0.92, duration: 300 });
    schedule(s, 900 + Math.random() * 900, () => ripen(s));
  };

  const ripen = (s: Spot): void => {
    if (!s.obj) return;
    s.stage = 'ripe';
    s.obj.clearTint();
    scene.tweens.add({ targets: s.obj, scale: { from: 1.15, to: 1 }, ease: 'Back.easeOut', duration: 220 });
    // 「いま食べごろ!」の合図リング
    s.ring = scene.add.circle(s.x, s.y, 30).setStrokeStyle(3, 0xffffff, 0.8);
    area.add(s.ring);
    scene.tweens.add({ targets: s.ring, radius: 40, alpha: 0, duration: 500, onComplete: () => s.ring?.destroy() });
    // 食べごろの窓は時間とともに短くなる(45秒かけて 3.2s → 1.5s)
    const window = Phaser.Math.Linear(3200, 1500, session.progress());
    schedule(s, window, () => wilt(s));
  };

  const wilt = (s: Spot): void => {
    if (!s.obj) return;
    s.stage = 'wilt';
    s.obj.setTint(0x9a9a8a);
    scene.tweens.add({
      targets: s.obj,
      alpha: 0,
      y: s.y + 12,
      scaleY: 0.6,
      duration: 600,
      onComplete: () => {
        clearSpot(s);
        schedule(s, 400 + Math.random() * 900, () => sprout(s));
      },
    });
  };

  let stunnedUntil = 0;
  const touch = (px: number, py: number): void => {
    if (session.isEnded() || Date.now() < stunnedUntil) return;
    for (const s of spots) {
      if (!s.obj || s.stage === 'empty' || s.stage === 'wilt') continue;
      if (Math.hypot(px - s.x, py - api.areaY - s.y) > HIT_RADIUS) continue;
      if (s.stage === 'ripe') {
        SFX.pop();
        impactRing(scene, s.x, s.y + api.areaY, 0xffffff, 10);
        burst(scene, s.x, s.y + api.areaY, 7);
        session.addPoints(RIPE_PTS, s.x, s.y + api.areaY - 18);
        const obj = s.obj;
        s.timer?.remove();
        s.obj = undefined;
        s.stage = 'empty';
        scene.tweens.add({ targets: obj, y: obj.y - 30, scale: 0.3, alpha: 0, duration: 200, onComplete: () => obj.destroy() });
        schedule(s, 700 + Math.random() * 1200, () => sprout(s));
      } else {
        // まだ青い! コンボが切れて一瞬手が止まる
        stunnedUntil = Date.now() + 500;
        session.resetCombo();
        missShake(scene);
        SFX.bad();
        scene.tweens.add({ targets: s.obj, angle: { from: -14, to: 14 }, duration: 60, yoyo: true, repeat: 3 });
      }
      return;
    }
  };

  const onDown = (p: Phaser.Input.Pointer): void => touch(p.worldX, p.worldY);
  const onMove = (p: Phaser.Input.Pointer): void => {
    if (p.isDown) touch(p.worldX, p.worldY);
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  const cleanupInput = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupInput);

  // 開始: 時間差で芽吹かせる(最初から2つは食べごろ寸前に)
  spots.forEach((s, i) => schedule(s, i * 260 + Math.random() * 400, () => sprout(s)));
}

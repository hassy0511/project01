/* なぞり収穫(swipe / reap): 一筆書きで複数の実をなぞって集める。
   だいず・らっかせい・いちご(まめ・べりーなど群生するもの)と
   こめの いねかり(reap=れつ状のレイアウト)で共用する。
   旧版の「静止した絵文字をタップするだけ」から、ドラッグで連続collectできる
   なぞりの手応えに作り直した */
import Phaser from 'phaser';
import { harvestSpeedPoints } from '../../core/stars';
import { SFX } from '../../audio/sfx';
import { burst, floatUp } from '../../ui/effects';
import { setHook } from '../../game/testHooks';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import type { MinigameApi } from './types';

const HIT_RADIUS = 34;
const BASKET_Y = 300;

export type SwipeLayout = 'cluster' | 'rows';

export interface SwipeOpts {
  target: string;
  prompt: string;
  count: number;
  layout?: SwipeLayout;
  cursor?: string;
}

export function renderSwipe(api: MinigameApi, opts: SwipeOpts): void {
  const { scene, area } = api;
  const layout = opts.layout ?? 'cluster';
  api.sign(opts.prompt);

  const basket = scene.add.text(GAME_W / 2, BASKET_Y, '🧺', { fontSize: '52px' }).setOrigin(0.5);
  const countText = scene.add
    .text(GAME_W / 2, BASKET_Y + 36, `0/${opts.count}`, {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      color: '#4a3b2a',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  area.add([basket, countText]);

  const positions: { x: number; y: number }[] = [];
  if (layout === 'rows') {
    const cols = 4;
    for (let i = 0; i < opts.count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push({
        x: 65 + col * ((GAME_W - 130) / (cols - 1 || 1)),
        y: 90 + row * 52 + (col % 2 === 0 ? 0 : 14),
      });
    }
  } else {
    const bandY = 110 + Math.random() * 40;
    for (let i = 0; i < opts.count; i++) {
      positions.push({
        x: 50 + (i / Math.max(1, opts.count - 1)) * (GAME_W - 100) + (Math.random() - 0.5) * 30,
        y: bandY + (Math.random() - 0.5) * 90,
      });
    }
  }

  const targets: { obj: Phaser.GameObjects.Text; got: boolean }[] = [];
  for (const pos of positions) {
    const t = scene.add.text(pos.x, pos.y, opts.target, { fontSize: '36px' }).setOrigin(0.5);
    area.add(t);
    scene.tweens.add({
      targets: t,
      scale: { from: 0.94, to: 1.06 },
      yoyo: true,
      repeat: -1,
      duration: 500 + Math.random() * 300,
      delay: Math.random() * 400,
    });
    targets.push({ obj: t, got: false });
  }

  let cursor: Phaser.GameObjects.Text | undefined;
  if (opts.cursor) {
    cursor = scene.add.text(0, 0, opts.cursor, { fontSize: '30px' }).setOrigin(0.5).setVisible(false);
    area.add(cursor);
  }

  let remaining = opts.count;
  let finished = false;
  const t0 = Date.now();
  setHook({ kind: 'pluck', remaining });

  const collect = (t: { obj: Phaser.GameObjects.Text; got: boolean }): void => {
    t.got = true;
    const obj = t.obj;
    SFX.pop();
    burst(scene, obj.x, obj.y + api.areaY, 6);
    scene.tweens.add({
      targets: obj,
      x: basket.x,
      y: basket.y,
      scale: 0.2,
      alpha: 0.5,
      duration: 260,
      ease: 'Cubic.easeIn',
      onComplete: () => obj.destroy(),
    });
    floatUp(scene, obj.x, obj.y + api.areaY - 18, '+1');
    remaining--;
    setHook({ kind: 'pluck', remaining });
    countText.setText(`${opts.count - remaining}/${opts.count}`);
    scene.tweens.add({ targets: countText, scale: { from: 1.35, to: 1 }, duration: 200, ease: 'Back.easeOut' });

    if (remaining === 0 && !finished) {
      finished = true;
      cleanup();
      const pts = harvestSpeedPoints(Date.now() - t0);
      api.addScore(pts);
      api.feedback(pts === 2 ? UI_TEXT.session.pluckFast : UI_TEXT.session.pluckDone, true);
      api.advance(800);
    }
  };

  const tryCollect = (worldX: number, worldY: number): void => {
    for (const t of targets) {
      if (t.got) continue;
      const dx = worldX - t.obj.x;
      const dy = worldY - api.areaY - t.obj.y;
      if (dx * dx + dy * dy <= HIT_RADIUS * HIT_RADIUS) collect(t);
    }
  };

  const onMove = (p: Phaser.Input.Pointer): void => {
    if (cursor) cursor.setPosition(p.x, p.y - api.areaY).setVisible(true);
    if (!p.isDown) return;
    tryCollect(p.x, p.y);
  };
  const onDown = (p: Phaser.Input.Pointer): void => tryCollect(p.x, p.y);
  const onUp = (): void => {
    cursor?.setVisible(false);
  };

  scene.input.on('pointermove', onMove);
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointerup', onUp);

  const cleanup = (): void => {
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointerup', onUp);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

/* フリックゲーム(メロン・ゆうがお・キャベツ): 実を引っぱって放し、岩を避けてかごに転がし入れる。
   壁と岩で跳ね返る簡易物理。ど真ん中に入ると追加ボーナス。
   時間経過で岩が増え、かごが左右に動き出す。
   引っぱるほど実が「ぐぐっ」と張りつめる(手応えレイヤー)。岩バウンスは失敗ではなく物理 */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, impactRing } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_W } from '../../ui/theme';
import { drawBasket, drawMeadow } from '../../ui/scenery';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const BASKET_Y = 150;
const START_Y = 580;
const GOAL_PTS = 25;
const CENTER_BONUS = 10;
const FRICTION = 0.984;
const BOUNCE = 0.72;
const STOP_SPEED = 26;
const FRUIT_R = 24;

export function renderFlick(api: MinigameApi, target: string, prompt: string): void {
  const { scene, area } = api;
  drawMeadow(scene, area, AREA_H);
  api.sign(prompt);

  const basket = drawBasket(scene, 104, 60);
  basket.setPosition(GAME_W / 2, BASKET_Y);
  area.add(basket);

  // 岩(丸いボルダー)。ウェーブごとに置き直す
  let rocks: { x: number; y: number; r: number; obj: Phaser.GameObjects.Container }[] = [];
  const placeRocks = (): void => {
    rocks.forEach((r) => r.obj.destroy());
    rocks = [];
    const count = 3 + Math.floor(session.progress() * 3);
    for (let i = 0; i < count; i++) {
      const r = 24 + Math.random() * 14;
      const x = 60 + Math.random() * (GAME_W - 120);
      const y = 250 + Math.random() * 220;
      const obj = scene.add.container(x, y);
      const g = scene.add.graphics();
      g.fillStyle(0x8d8d8d, 1);
      g.fillCircle(0, 0, r);
      g.fillStyle(0xa5a5a5, 1);
      g.fillCircle(-r / 3, -r / 3, r / 2.2);
      g.lineStyle(3, 0x6e6e6e, 1);
      g.strokeCircle(0, 0, r);
      obj.add(g);
      area.add(obj);
      rocks.push({ x, y, r, obj });
    }
  };

  const session = new ArcadeSession(api, {
    engine: 'flick',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });
  placeRocks();

  // かごが動き出す(15秒経過後)
  let basketTween: Phaser.Tweens.Tween | undefined;
  scene.time.delayedCall((15 / (session.progress() >= 0 ? 1 : 1)) * 1000, () => {
    if (session.isEnded()) return;
    basketTween = scene.tweens.add({
      targets: basket,
      x: { from: 110, to: GAME_W - 110 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  });

  let fruit: Phaser.GameObjects.Text;
  let vx = 0;
  let vy = 0;
  let rolling = false;
  let aiming = false;
  let resolved = false;
  const aimDots: Phaser.GameObjects.Arc[] = [];

  const newFruit = (): void => {
    resolved = false;
    rolling = false;
    vx = 0;
    vy = 0;
    fruit = scene.add.text(GAME_W / 2, START_Y, target, { fontSize: '44px' }).setOrigin(0.5).setScale(0);
    area.add(fruit);
    scene.tweens.add({ targets: fruit, scale: 1, ease: 'Back.easeOut', duration: 240 });
  };
  newFruit();

  const clearAim = (): void => {
    aimDots.forEach((d) => d.destroy());
    aimDots.length = 0;
  };

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded() || rolling) return;
    if (Math.hypot(p.worldX - fruit.x, p.worldY - api.areaY - fruit.y) < 84) aiming = true;
  };
  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!aiming || !p.isDown) return;
    clearAim();
    // ひっぱった逆方向に飛ぶ(パチンコ式)。点線でねらいを見せる
    const dx = fruit.x - p.worldX;
    const dy = fruit.y - (p.worldY - api.areaY);
    const power = Math.hypot(dx, dy);
    for (let i = 1; i <= 6; i++) {
      const d = scene.add.circle(fruit.x + (dx * i) / 4, fruit.y + (dy * i) / 4, 5 - i * 0.5, 0xffffff, 0.7);
      area.add(d);
      aimDots.push(d);
    }
    // 引っぱるほど実が張りつめ、発射方向へわずかに向く(チャージの手応え)
    const charge = Math.min(power / 220, 1);
    fruit.setScale(1 + charge * 0.14);
    fruit.setAngle(Phaser.Math.RadToDeg(Math.atan2(dy, dx)) * 0.06);
  };
  const onUp = (p: Phaser.Input.Pointer): void => {
    if (!aiming) return;
    aiming = false;
    clearAim();
    const dx = fruit.x - p.worldX;
    const dy = fruit.y - (p.worldY - api.areaY);
    const power = Math.hypot(dx, dy);
    fruit.setAngle(0);
    if (power < 14) {
      fruit.setScale(1);
      return; // 誤タップは無視
    }
    const k = 5.2;
    vx = dx * k;
    vy = dy * k;
    rolling = true;
    // びよんっと縮んで飛び出す
    scene.tweens.add({ targets: fruit, scale: { from: 0.8, to: 1 }, duration: 160, ease: 'Back.easeOut' });
    burst(scene, fruit.x, fruit.y + api.areaY + 14, 5, [0x9ccb6f, 0xd8c49a]);
    SFX.pop();
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);

  const resolveMiss = (): void => {
    if (resolved) return;
    resolved = true;
    session.resetCombo();
    const oops = scene.add
      .text(fruit.x, fruit.y - 34, UI_TEXT.arcade.stopped, {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#8a7a62',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    area.add(oops);
    scene.tweens.add({ targets: oops, alpha: 0, y: oops.y - 22, duration: 550, onComplete: () => oops.destroy() });
    scene.tweens.add({
      targets: fruit,
      alpha: 0,
      scale: 0.5,
      duration: 260,
      onComplete: () => {
        fruit.destroy();
        if (!session.isEnded()) newFruit();
      },
    });
  };

  const resolveGoal = (): void => {
    if (resolved) return;
    resolved = true;
    const centered = Math.abs(fruit.x - basket.x) < 16;
    SFX.good();
    if (centered) bigImpact(scene, basket.x, BASKET_Y + api.areaY);
    else impactRing(scene, basket.x, BASKET_Y + api.areaY, 0xffd34d);
    burst(scene, basket.x, BASKET_Y + api.areaY, 12);
    session.addPoints(GOAL_PTS + (centered ? CENTER_BONUS : 0), basket.x, BASKET_Y + api.areaY - 40, false);
    if (centered) {
      const nice = scene.add
        .text(basket.x, BASKET_Y - 64, UI_TEXT.arcade.center, {
          fontFamily: FONT,
          fontSize: '18px',
          color: '#e0812a',
          fontStyle: 'bold',
          stroke: '#ffffff',
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      area.add(nice);
      scene.tweens.add({ targets: nice, y: nice.y - 26, alpha: 0, duration: 650, onComplete: () => nice.destroy() });
    }
    scene.tweens.add({
      targets: fruit,
      x: basket.x,
      y: BASKET_Y,
      scale: 0.3,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        fruit.destroy();
        placeRocks(); // 岩の配置替えで毎回ちがうパズルに
        if (!session.isEnded()) newFruit();
      },
    });
  };

  const onUpdate = (_t: number, dtMs: number): void => {
    if (!rolling || resolved || session.isEnded() || !fruit.active) return;
    const dt = Math.min(dtMs, 33) / 1000;
    fruit.x += vx * dt;
    fruit.y += vy * dt;
    fruit.angle += vx * dt * 1.6; // ごろごろ回る
    vx *= FRICTION;
    vy *= FRICTION;
    // 壁
    if (fruit.x < FRUIT_R + 6) {
      fruit.x = FRUIT_R + 6;
      vx = Math.abs(vx) * BOUNCE;
    } else if (fruit.x > GAME_W - FRUIT_R - 6) {
      fruit.x = GAME_W - FRUIT_R - 6;
      vx = -Math.abs(vx) * BOUNCE;
    }
    if (fruit.y < 90) {
      fruit.y = 90;
      vy = Math.abs(vy) * BOUNCE;
    } else if (fruit.y > AREA_H - 30) {
      fruit.y = AREA_H - 30;
      vy = -Math.abs(vy) * BOUNCE;
    }
    // 岩に当たると跳ね返る
    for (const rock of rocks) {
      const dx = fruit.x - rock.x;
      const dy = fruit.y - rock.y;
      const dist = Math.hypot(dx, dy);
      if (dist < rock.r + FRUIT_R && dist > 0.01) {
        const nx = dx / dist;
        const ny = dy / dist;
        const dot = vx * nx + vy * ny;
        vx = (vx - 2 * dot * nx) * BOUNCE;
        vy = (vy - 2 * dot * ny) * BOUNCE;
        fruit.x = rock.x + nx * (rock.r + FRUIT_R + 1);
        fruit.y = rock.y + ny * (rock.r + FRUIT_R + 1);
        // バウンスは「失敗」ではなく物理(バンクショットは戦略)。ごつんという手応えだけ返す
        scene.tweens.add({ targets: rock.obj, scale: { from: 1.12, to: 1 }, duration: 130 });
        burst(scene, fruit.x - nx * FRUIT_R, fruit.y + api.areaY - ny * FRUIT_R, 4, [0xa5a5a5, 0x8d8d8d]);
        SFX.pop();
      }
    }
    // ゴール判定
    if (Math.abs(fruit.x - basket.x) < 46 && Math.abs(fruit.y - BASKET_Y) < 34) {
      resolveGoal();
      return;
    }
    // 止まった
    if (Math.hypot(vx, vy) < STOP_SPEED) {
      rolling = false;
      resolveMiss();
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
    basketTween?.stop();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

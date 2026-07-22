/* キャッチゲーム(うめ・なし・みかん): 木から実が降ってくる→かごを左右にドラッグしてキャッチ。
   金の実はボーナス、枝はハズレ(コンボが切れる)。時間経過で落下が速く・多くなる。
   かごは指へ吸い付くように追従しつつ慣性で傾く(手応えレイヤー) */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, impactRing, missShake, squashStretch } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_W } from '../../ui/theme';
import { drawBasket, drawMeadow } from '../../ui/scenery';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const TREE_Y = 190;
const BASKET_Y = 590;
const CATCH_RADIUS = 62;
const FRUIT_PTS = 10;
const GOLD_PTS = 30;
/** かごの追従率(1フレームで縮める距離の割合)と、速度→傾きの係数 */
const BASKET_LERP = 0.38;
const TILT_PER_SPEED = 0.9;
const TILT_MAX = 16;

export function renderCatch(api: MinigameApi, target: string, prompt: string): void {
  const { scene, area } = api;
  drawMeadow(scene, area, AREA_H);
  api.sign(prompt);

  // 木(ベクター描画)
  const tree = scene.add.container(GAME_W / 2, TREE_Y);
  const tg = scene.add.graphics();
  tg.fillStyle(0x8a6242, 1);
  tg.fillRoundedRect(-14, -10, 28, 90, 8);
  tg.fillStyle(0x5e9c43, 1);
  tg.fillCircle(-52, -46, 44);
  tg.fillCircle(52, -46, 44);
  tg.fillCircle(0, -72, 56);
  tg.fillStyle(0x7bbf5a, 1);
  tg.fillCircle(-28, -38, 40);
  tg.fillCircle(30, -34, 38);
  tg.fillCircle(0, -60, 46);
  tree.add(tg);
  // 木に実の飾り
  for (const [fx, fy] of [[-50, -50], [40, -60], [0, -80], [-15, -35], [55, -30]] as const) {
    tree.add(scene.add.text(fx, fy, target, { fontSize: '18px' }).setOrigin(0.5));
  }
  area.add(tree);

  // かご(ドラッグで左右移動)。指に吸い付きつつ慣性で追いかけ、移動速度で傾く
  const basket = drawBasket(scene);
  basket.setPosition(GAME_W / 2, BASKET_Y);
  area.add(basket);
  let targetX = basket.x;
  let stunnedTiltUntil = 0; // スタン演出(angleツイーン)中は傾き計算を止める
  const onMove = (p: Phaser.Input.Pointer): void => {
    targetX = Phaser.Math.Clamp(p.x, 56, GAME_W - 56);
  };
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerdown', onMove);
  const onBasketUpdate = (): void => {
    const dx = (targetX - basket.x) * BASKET_LERP;
    basket.x += dx;
    if (Date.now() > stunnedTiltUntil) {
      basket.angle = Phaser.Math.Clamp(dx * TILT_PER_SPEED, -TILT_MAX, TILT_MAX);
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onBasketUpdate);

  let spawnTimer: Phaser.Time.TimerEvent | undefined;
  const cleanup = (): void => {
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerdown', onMove);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onBasketUpdate);
    spawnTimer?.remove();
  };
  const session = new ArcadeSession(api, {
    engine: 'catch',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);

  const stunBasket = (): void => {
    session.resetCombo();
    missShake(scene);
    SFX.bad();
    stunnedTiltUntil = Date.now() + 400;
    scene.tweens.add({ targets: basket, angle: { from: -10, to: 10 }, duration: 70, yoyo: true, repeat: 3 });
    scene.tweens.addCounter({ from: 0, to: 1, duration: 300 }); // 触感の間
  };

  const dropOne = (): void => {
    if (session.isEnded()) return;
    const kindRoll = Math.random();
    const isGold = kindRoll < 0.1;
    const isJunk = !isGold && kindRoll < 0.26;
    const x = GAME_W / 2 + (Math.random() - 0.5) * 220;
    const label = isJunk ? '🪵' : target;
    const item = scene.add.text(x, TREE_Y - 40, label, { fontSize: isGold ? '38px' : '32px' }).setOrigin(0.5);
    if (isGold) {
      item.setTint(0xffd34d);
      scene.tweens.add({ targets: item, angle: 360, duration: 900, repeat: -1 });
    }
    area.add(item);
    // 木がぷるっと揺れて実を落とす
    scene.tweens.add({ targets: tree, angle: { from: -1.6, to: 1.6 }, duration: 80, yoyo: true });

    const fallMs = Phaser.Math.Linear(2400, 950, session.progress());
    const sway = (Math.random() - 0.5) * 90;
    let resolved = false;
    scene.tweens.add({ targets: item, x: x + sway, duration: fallMs, ease: 'Sine.easeInOut' });
    scene.tweens.add({
      targets: item,
      y: BASKET_Y + 26,
      duration: fallMs,
      ease: 'Quad.easeIn',
      onUpdate: () => {
        if (resolved || session.isEnded()) return;
        if (item.y > BASKET_Y - 26 && Math.abs(item.x - basket.x) < CATCH_RADIUS) {
          resolved = true;
          scene.tweens.killTweensOf(item);
          if (isJunk) {
            item.destroy();
            stunBasket();
            const oops = scene.add
              .text(basket.x, BASKET_Y - 46, UI_TEXT.arcade.miss, {
                fontFamily: FONT,
                fontSize: '18px',
                color: '#c04545',
                fontStyle: 'bold',
              })
              .setOrigin(0.5);
            area.add(oops);
            scene.tweens.add({ targets: oops, y: oops.y - 30, alpha: 0, duration: 600, onComplete: () => oops.destroy() });
          } else {
            SFX.pop();
            squashStretch(scene, basket);
            // かごが実の重みで ぽすっと沈む
            scene.tweens.add({ targets: basket, y: BASKET_Y + 7, duration: 70, yoyo: true, ease: 'Quad.easeOut' });
            if (isGold) {
              bigImpact(scene, basket.x, BASKET_Y + api.areaY);
            } else {
              impactRing(scene, basket.x, BASKET_Y + api.areaY, 0xffffff);
            }
            burst(scene, item.x, item.y + api.areaY, isGold ? 14 : 7);
            session.addPoints(isGold ? GOLD_PTS : FRUIT_PTS, item.x, item.y + api.areaY - 20);
            scene.tweens.add({
              targets: item,
              x: basket.x,
              y: BASKET_Y,
              scale: 0.3,
              alpha: 0,
              duration: 160,
              onComplete: () => item.destroy(),
            });
          }
        }
      },
      onComplete: () => {
        if (resolved) return;
        resolved = true;
        // 地面に落ちた: 実ならコンボが切れる(枝は放置してよい)
        if (!isJunk) {
          session.resetCombo();
          burst(scene, item.x, BASKET_Y + 20 + api.areaY, 5, [0x9ccb6f, 0x7cb356]);
        }
        scene.tweens.add({ targets: item, scaleY: 0.4, alpha: 0, duration: 220, onComplete: () => item.destroy() });
      },
    });

    const interval = Phaser.Math.Linear(1050, 260, session.progress());
    spawnTimer = scene.time.delayedCall(interval, dropOne);
    // 終盤は2個同時に落ちてくる(取りきれないラッシュ)
    if (session.progress() > 0.55 && Math.random() < 0.35) {
      scene.time.delayedCall(interval / 2, () => {
        if (!session.isEnded()) dropOneExtra();
      });
    }
  };
  /** spawnTimer を触らない追加ドロップ(ラッシュ用) */
  const dropOneExtra = (): void => {
    const saved = spawnTimer;
    dropOne();
    spawnTimer?.remove();
    spawnTimer = saved;
  };
  dropOne();
}

/* リズムづみ(ちゃば): 茶畑の うねに そって わかばが ながれてくる。
   かごの まえの「わっか」に かさなった瞬間にタップ=つみとり。
   ばっちり/おしい の2段階判定。はずしても「すかっ」でコンボが切れるだけ(成功保証)。
   ときどき ながれてくる「きんの わかば」= ばっちりで 大得点 が C 要素。
   タップ位置は問わない=タイミングだけの遊び(dashi のゲージと親戚だが「ながれてくる的」型) */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
/** わかばの通り道と 的(わっか)の位置 */
const LEAF_Y = 330;
const TARGET_X = 118;
const TARGET_R = 34;
/** ながれる速さ(px/s)と 出現間隔(序盤→終盤, ms) */
const LEAF_SPEED = 205;
const SPAWN_FROM_MS = 1150;
const SPAWN_TO_MS = 720;
/** 判定(的の中心からの距離 px) */
const PERFECT_PX = 22;
const GOOD_PX = 56;
const PERFECT_PTS = 14;
const GOOD_PTS = 6;
const GOLD_PTS = 30;
/** きんの わかば の出現率と、空振り後のかたまり時間 */
const GOLD_CHANCE = 0.12;
const WHIFF_STUN_MS = 350;
/** 終盤に2枚つづけて来る確率(progress>0.4 で有効) */
const DOUBLE_CHANCE = 0.25;

interface Leaf {
  obj: Phaser.GameObjects.Container;
  gold: boolean;
  bobPhase: number;
  done: boolean;
}

export function renderRhythm(api: MinigameApi, target: string, prompt: string): void {
  const { scene, area } = api;

  // 茶畑: 空+だんだん畑(うねの緑のしま)
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xaee3f7, 0xaee3f7, 0xd7efc3, 0xd7efc3, 1);
  bg.fillRect(0, 0, GAME_W, 210);
  bg.fillStyle(0x6faf5b, 1);
  bg.fillRect(0, 210, GAME_W, AREA_H - 210);
  for (let i = 0; i < 6; i++) {
    const y = 220 + i * 74;
    bg.fillStyle(i % 2 === 0 ? 0x5e9c43 : 0x7bbf5a, 1);
    bg.fillRoundedRect(-20, y, GAME_W + 40, 46, 22);
    bg.fillStyle(0x4c7a35, 0.4);
    bg.fillRoundedRect(-20, y + 34, GAME_W + 40, 8, 4);
  }
  area.add(bg);
  // とおくの山(さやまの丘のつもり)
  bg.fillStyle(0x9ccb8f, 0.8);
  bg.fillEllipse(120, 208, 300, 90);
  bg.fillEllipse(380, 210, 340, 110);

  api.sign(prompt);

  const session = new ArcadeSession(api, {
    engine: 'rhythm',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- かご と 的(わっか) ---------- */
  const basket = scene.add.container(TARGET_X - 4, LEAF_Y + 92);
  const bk = scene.add.graphics();
  bk.fillStyle(0xa9713a, 1);
  bk.fillRoundedRect(-42, -30, 84, 56, 12);
  bk.lineStyle(3, 0x7a4f26, 1);
  for (let i = 0; i < 3; i++) bk.strokeRoundedRect(-42, -30 + i * 18, 84, 10, 5);
  basket.add(bk);
  basket.add(scene.add.text(0, -40, '🧺', { fontSize: '26px' }).setOrigin(0.5));
  area.add(basket);
  // つみこ(茶摘みの人)
  const picker = scene.add.text(TARGET_X - 74, LEAF_Y + 40, '👒', { fontSize: '34px' }).setOrigin(0.5);
  area.add(picker);
  scene.tweens.add({ targets: picker, y: picker.y - 6, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  const ring = scene.add.circle(TARGET_X, LEAF_Y, TARGET_R).setStrokeStyle(5, 0xffffff, 0.95);
  area.add(ring);
  scene.tweens.add({ targets: ring, scale: { from: 1, to: 1.1 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // 通り道のガイド(うすい点線)
  const guide = scene.add.graphics();
  guide.fillStyle(0xffffff, 0.35);
  for (let x = TARGET_X + 50; x < GAME_W; x += 34) guide.fillCircle(x, LEAF_Y, 3);
  area.add(guide);

  /* ---------- わかばの流れ ---------- */
  const leaves: Leaf[] = [];
  let elapsed = 0;

  const spawnLeaf = (gold: boolean): void => {
    if (session.isEnded()) return;
    const c = scene.add.container(GAME_W + 30, LEAF_Y);
    const t = scene.add.text(0, 0, target, { fontSize: gold ? '38px' : '32px' }).setOrigin(0.5);
    if (gold) t.setTint(0xffd34d);
    c.add(t);
    if (gold) {
      const r = scene.add.circle(0, 0, 26).setStrokeStyle(3, 0xffd34d, 0.9);
      c.add(r);
      scene.tweens.add({ targets: r, scale: { from: 1, to: 1.3 }, alpha: { from: 0.9, to: 0.3 }, duration: 500, yoyo: true, repeat: -1 });
    }
    area.add(c);
    leaves.push({ obj: c, gold, bobPhase: Math.random() * Math.PI * 2, done: false });
  };

  let spawnTimer: Phaser.Time.TimerEvent | undefined;
  const scheduleSpawn = (): void => {
    const iv = Phaser.Math.Linear(SPAWN_FROM_MS, SPAWN_TO_MS, session.progress());
    spawnTimer = scene.time.delayedCall(iv, () => {
      if (session.isEnded()) return;
      spawnLeaf(Math.random() < GOLD_CHANCE);
      // 終盤: たまに2枚めが すぐ後ろに つづく
      if (session.progress() > 0.4 && Math.random() < DOUBLE_CHANCE) {
        scene.time.delayedCall(340, () => {
          if (!session.isEnded()) spawnLeaf(false);
        });
      }
      scheduleSpawn();
    });
  };
  spawnLeaf(false);
  scheduleSpawn();

  const removeLeaf = (leaf: Leaf): void => {
    leaf.done = true;
    const idx = leaves.indexOf(leaf);
    if (idx >= 0) leaves.splice(idx, 1);
  };

  /** つみとり成功: かごへ とんでいく */
  const intoBasket = (leaf: Leaf): void => {
    removeLeaf(leaf);
    scene.tweens.killTweensOf(leaf.obj);
    scene.tweens.add({
      targets: leaf.obj,
      x: basket.x,
      y: basket.y - 20,
      scale: 0.35,
      alpha: 0.9,
      duration: 260,
      ease: 'Quad.easeIn',
      onComplete: () => leaf.obj.destroy(),
    });
    scene.tweens.add({ targets: basket, scaleY: 0.85, duration: 90, yoyo: true, delay: 240 });
  };

  let stunnedUntil = 0;
  const onDown = (): void => {
    if (session.isEnded() || Date.now() < stunnedUntil) return;
    // 的に いちばん近い わかば で判定
    let best: Leaf | null = null;
    let bestD = Infinity;
    for (const l of leaves) {
      const d = Math.abs(l.obj.x - TARGET_X);
      if (d < bestD) {
        bestD = d;
        best = l;
      }
    }
    if (!best || bestD > GOOD_PX) {
      // すかっ(空振り): コンボが切れて一瞬止まるだけ
      stunnedUntil = Date.now() + WHIFF_STUN_MS;
      session.resetCombo();
      SFX.bad();
      floatUp(scene, TARGET_X, LEAF_Y + api.areaY - 50, UI_TEXT.arcade.rhythmWhiff, '#8a7a62');
      return;
    }
    const wy = LEAF_Y + api.areaY;
    if (bestD <= PERFECT_PX) {
      const pts = best.gold ? GOLD_PTS : PERFECT_PTS;
      SFX.good();
      impactRing(scene, TARGET_X, wy, best.gold ? 0xffd34d : 0xffffff, 12);
      burst(scene, best.obj.x, wy, best.gold ? 14 : 7);
      session.addPoints(pts, TARGET_X, wy - 30);
      floatUp(scene, TARGET_X + 70, wy - 54, best.gold ? UI_TEXT.arcade.goldLeaf : UI_TEXT.arcade.rhythmPerfect, '#3f7d2c');
      if (best.gold) {
        bigImpact(scene, TARGET_X, wy - 10);
        confetti(scene, 12);
      }
    } else {
      SFX.pop();
      session.addPoints(GOOD_PTS, TARGET_X, wy - 30);
      floatUp(scene, TARGET_X + 70, wy - 54, UI_TEXT.arcade.rhythmGood, '#e0812a');
    }
    intoBasket(best);
  };
  scene.input.on('pointerdown', onDown);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    elapsed += dt;
    for (const l of [...leaves]) {
      l.obj.x -= LEAF_SPEED * dt;
      l.obj.y = LEAF_Y + Math.sin(elapsed * 3 + l.bobPhase) * 8;
      // とりのがし: ふわっと にげていく(コンボが切れるだけ)
      if (l.obj.x < TARGET_X - GOOD_PX - 14) {
        removeLeaf(l);
        session.resetCombo();
        floatUp(scene, l.obj.x, LEAF_Y + api.areaY - 30, UI_TEXT.arcade.escaped, '#c04545');
        missShake(scene);
        scene.tweens.add({ targets: l.obj, y: l.obj.y - 90, alpha: 0, angle: 60, duration: 500, onComplete: () => l.obj.destroy() });
      }
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    spawnTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

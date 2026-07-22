/* だるまいち(ぐんま・たかさき): ゆらゆら動くだるまをタップで落とし、
   タイミングよく まんなかに つみあげるバランスゲーム。
   ずれても倒れない(成功保証)— 大きくずれた だるまは ころんと転がるだけ(コンボが切れる)。
   ときどき来る「とくだいだるま」が C 要素(でかい・速い・高得点)。
   だるまはベクター描画(実在の縁起物: 目は願掛けの片目入れ) */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, floatUp, impactRing, squashStretch, TX_DOT } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const SWING_Y = 168;
const BASE_Y = 596; // 台の上面
const DARUMA_H = 54; // 1段ぶんの高さ
const PERFECT_PX = 10;
const OK_PX = 36;
const PTS_OK = 12;
const PTS_PERFECT = 22;
const PTS_BIG = 50;
/** 何個ごとに とくだいだるま が来るか */
const BIG_EVERY = 6;
/** 振り子の周期(ms): 序盤→終盤 */
const SWING_FROM = 1700;
const SWING_TO = 950;
const SWING_RANGE = 148;
/** 積みがここより高く見えたら 台ごと下げる */
const SHIFT_TRIGGER_Y = 330;

/** だるまをベクターで描く(赤い縁起物・片目入れ) */
function drawDaruma(scene: Phaser.Scene, s = 1): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const g = scene.add.graphics();
  g.fillStyle(0xd94f4f, 1);
  g.fillEllipse(0, 0, 84 * s, 72 * s);
  g.fillStyle(0xb63d3d, 1);
  g.fillEllipse(0, 24 * s, 60 * s, 18 * s);
  g.fillStyle(0xfff2e2, 1);
  g.fillEllipse(0, 2 * s, 50 * s, 42 * s);
  g.fillStyle(0xe8b84b, 1);
  g.fillEllipse(0, -25 * s, 30 * s, 11 * s);
  g.lineStyle(2.5 * s, 0x4a3b2a, 1);
  g.strokeCircle(-11 * s, -2 * s, 5 * s);
  g.strokeCircle(11 * s, -2 * s, 5 * s);
  g.lineBetween(-6 * s, 12 * s, 6 * s, 12 * s);
  c.add(g);
  // 片目(ねがいごとの め)
  c.add(scene.add.circle(-11 * s, -2 * s, 3.2 * s, 0x4a3b2a));
  return c;
}

export function renderDaruma(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;
  drawMarket(scene, area);
  api.sign(prompt);

  const session = new ArcadeSession(api, {
    engine: 'daruma',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  interface Stacked {
    x: number;
    cont: Phaser.GameObjects.Container;
  }
  const stack: Stacked[] = [];
  const stackRoot = scene.add.container(0, 0);
  area.add(stackRoot);

  let current: Phaser.GameObjects.Container | undefined;
  let currentBig = false;
  let dropping = false;
  let dropCount = 0;
  let phase = 0;
  let spawnTimer: Phaser.Time.TimerEvent | undefined;

  const topCenterX = (): number => (stack.length ? stack[stack.length - 1].x : GAME_W / 2);
  /** つぎに着地する高さ(画面座標) */
  const landingY = (): number => BASE_Y - (stack.length + 0.5) * DARUMA_H + stackRoot.y;

  const spawnNext = (): void => {
    if (session.isEnded()) return;
    currentBig = dropCount > 0 && dropCount % BIG_EVERY === BIG_EVERY - 1;
    current = drawDaruma(scene, currentBig ? 1.45 : 1);
    current.setPosition(GAME_W / 2, SWING_Y);
    area.add(current);
    current.setScale(0);
    scene.tweens.add({ targets: current, scale: 1, ease: 'Back.easeOut', duration: 220 });
    if (currentBig) {
      SFX.hint();
      floatUp(scene, GAME_W / 2, SWING_Y + api.areaY - 50, UI_TEXT.fest.bigDaruma, '#e0812a');
    }
    dropping = false;
  };

  const land = (d: Phaser.GameObjects.Container, big: boolean): void => {
    const target = topCenterX();
    const offset = d.x - target;
    if (Math.abs(offset) > OK_PX) {
      // ずれすぎ: ころんと転がって退場(スタックは無事。コンボが切れるだけ)
      session.resetCombo();
      SFX.bad();
      floatUp(scene, d.x, d.y + api.areaY - 40, UI_TEXT.fest.slideOff, '#c04545');
      scene.tweens.add({
        targets: d,
        x: d.x + (offset > 0 ? 170 : -170),
        y: d.y + 140,
        angle: offset > 0 ? 300 : -300,
        alpha: 0,
        duration: 520,
        ease: 'Quad.easeIn',
        onComplete: () => d.destroy(),
      });
      spawnTimer = scene.time.delayedCall(340, spawnNext);
      return;
    }

    const perfect = Math.abs(offset) <= PERFECT_PX;
    if (perfect) d.setX(target); // ぴったりは吸い付いて完全にそろう
    squashStretch(scene, d);
    // 着地の粉じん
    burst(scene, d.x, d.y + api.areaY + DARUMA_H / 2, 6, [0xd8c49a, 0xb89b6a]);
    if (big) {
      bigImpact(scene, d.x, d.y + api.areaY);
      session.addPoints(PTS_BIG, d.x, d.y + api.areaY - 46);
      SFX.fanfare();
    } else if (perfect) {
      impactRing(scene, d.x, d.y + api.areaY, 0xffd34d, 12);
      floatUp(scene, d.x, d.y + api.areaY - 64, UI_TEXT.fest.pitta, '#3f7d2c');
      session.addPoints(PTS_PERFECT, d.x, d.y + api.areaY - 42);
      SFX.good();
    } else {
      session.addPoints(PTS_OK, d.x, d.y + api.areaY - 42);
      SFX.pop();
    }
    // スタックへ編入(stackRoot 座標系に載せ替え)
    d.setY(d.y - stackRoot.y);
    area.remove(d);
    stackRoot.add(d);
    stack.push({ x: d.x, cont: d });

    // 高くなったら台ごと沈めて、作業位置を保つ
    if (landingY() < SHIFT_TRIGGER_Y) {
      scene.tweens.add({ targets: stackRoot, y: stackRoot.y + DARUMA_H * 2, duration: 380, ease: 'Sine.easeInOut' });
    }
    // 画面のずっと下に沈んだ だるまは掃除(ノード数を抑える)
    for (const s of stack) {
      if (s.cont.active && s.cont.y + stackRoot.y > AREA_H + 90) s.cont.destroy();
    }
    spawnTimer = scene.time.delayedCall(320, spawnNext);
  };

  const onDown = (): void => {
    if (session.isEnded() || dropping || !current) return;
    dropping = true;
    const d = current;
    const big = currentBig;
    current = undefined;
    const fallY = landingY();
    scene.tweens.add({
      targets: d,
      y: fallY,
      duration: 240 + Math.max(0, fallY - SWING_Y) * 0.12,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (session.isEnded()) return;
        land(d, big);
      },
    });
  };
  scene.input.on('pointerdown', onDown);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded() || !current) return;
    const period = Phaser.Math.Linear(SWING_FROM, SWING_TO, session.progress()) * (currentBig ? 0.8 : 1);
    phase += (Math.min(dtMs, 33) / period) * Math.PI * 2;
    current.setX(GAME_W / 2 + Math.sin(phase) * SWING_RANGE);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    spawnTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);

  spawnNext();
}

/* お正月の市: 冬空+紅白の幕+屋台テーブル+ちらつく雪 */
function drawMarket(scene: Phaser.Scene, area: Phaser.GameObjects.Container): void {
  const g = scene.add.graphics();
  g.fillGradientStyle(0xcfe3f7, 0xcfe3f7, 0xf2ead8, 0xf2ead8, 1);
  g.fillRect(0, 0, GAME_W, AREA_H);
  // 遠くの山なみ(たかさきの上州の山)
  g.fillStyle(0xb8c9de, 1);
  g.fillTriangle(20, 300, 150, 180, 280, 300);
  g.fillTriangle(200, 300, 340, 150, 470, 300);
  g.fillStyle(0xffffff, 0.7);
  g.fillTriangle(120, 210, 150, 180, 180, 210);
  g.fillTriangle(310, 185, 340, 150, 370, 185);
  // 地面
  g.fillStyle(0xe8ddc8, 1);
  g.fillRect(0, 300, GAME_W, AREA_H - 300);
  // 紅白の幕
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 88, GAME_W, 26);
  g.fillStyle(0xd94f4f, 1);
  for (let x = 0; x < GAME_W; x += 48) g.fillRect(x, 88, 24, 26);
  // 台(だるまを積む屋台テーブル)
  g.fillStyle(0xa9713a, 1);
  g.fillRoundedRect(60, BASE_Y - DARUMA_H / 2 + 20, GAME_W - 120, 70, 10);
  g.fillStyle(0xc98f4e, 1);
  g.fillRoundedRect(60, BASE_Y - DARUMA_H / 2 + 20, GAME_W - 120, 14, 7);
  area.add(g);
  // ちらつく雪(新パーティクル基盤の見せどころその1)
  const snow = scene.add.particles(GAME_W / 2, -10, TX_DOT, {
    x: { min: -GAME_W / 2, max: GAME_W / 2 },
    speedY: { min: 22, max: 48 },
    speedX: { min: -12, max: 12 },
    lifespan: 16000,
    scale: { min: 0.4, max: 0.9 },
    alpha: { start: 0.8, end: 0.2 },
    frequency: 320,
    tint: 0xffffff,
  });
  area.add(snow);
}

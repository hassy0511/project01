/* ゲームフィール用エフェクト: スカッシュ&ストレッチ・パーティクル・
   スコアポップ・紙吹雪・画面パルス・衝撃リング・画面フラッシュ・ヒットストップ。
   画像アセット不要(パーティクルのテクスチャは起動時に Graphics から焼く) */
import Phaser from 'phaser';
import { DEPTH, FONT, GAME_H, GAME_W } from './theme';

const CONF_COLORS = [0xff9f40, 0x6fbf44, 0xff9eb5, 0xffd166, 0x8ed4e8, 0xb39ddb];

/* ---------- パーティクル用テクスチャ(起動時に一度だけ焼く) ---------- */

export const TX_DOT = 'tx-dot';
export const TX_GLOW = 'tx-glow';
export const TX_SQUARE = 'tx-square';

/** BootScene から呼ぶ。Graphics を焼いてテクスチャ化(画像ファイル不要のまま ParticleEmitter を使う) */
export function makeParticleTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(TX_DOT)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 4);
  g.generateTexture(TX_DOT, 8, 8);
  g.clear();
  // やわらかい光球(加算合成でグローに使う)
  for (let r = 12; r >= 2; r -= 2) {
    g.fillStyle(0xffffff, r === 2 ? 0.9 : 0.13);
    g.fillCircle(12, 12, r);
  }
  g.generateTexture(TX_GLOW, 24, 24);
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 7, 7);
  g.generateTexture(TX_SQUARE, 7, 7);
  g.destroy();
}

/* ---------- ヒットストップ ---------- */

let hitStopActive = false;

/** でかい一撃の「間」: 一瞬だけ世界を止める(市販アクションの常套手段)。多重呼び出しは無視 */
export function hitStop(scene: Phaser.Scene, ms = 70): void {
  if (hitStopActive || !scene.scene.isActive()) return;
  hitStopActive = true;
  scene.scene.pause();
  setTimeout(() => {
    hitStopActive = false;
    if (scene.scene.isPaused()) scene.scene.resume();
  }, ms);
}

/** タップの手応え: ぐにゃっと潰れてから弾ける */
export function squashStretch(scene: Phaser.Scene, target: Phaser.GameObjects.Components.Transform): void {
  scene.tweens.chain({
    targets: target,
    tweens: [
      { scaleX: 1.25, scaleY: 0.7, duration: 70, ease: 'Quad.easeOut' },
      { scaleX: 0.85, scaleY: 1.15, duration: 80 },
      { scaleX: 1, scaleY: 1, duration: 90, ease: 'Back.easeOut' },
    ],
  });
}

/** スコアポップ: +1 などがふわっと浮いて消える */
export function floatUp(scene: Phaser.Scene, x: number, y: number, text: string, color = '#e0812a'): void {
  const t = scene.add
    .text(x, y, text, { fontFamily: FONT, fontSize: '22px', color, fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 4 })
    .setOrigin(0.5)
    .setDepth(DEPTH.overlay)
    .setScale(0.6);
  scene.tweens.add({
    targets: t,
    scale: 1.15,
    duration: 130,
    ease: 'Back.easeOut',
    onComplete: () =>
      scene.tweens.add({
        targets: t,
        y: y - 58,
        alpha: { from: 1, to: 0 },
        duration: 560,
        ease: 'Quad.easeOut',
        onComplete: () => t.destroy(),
      }),
  });
}

/** 衝撃リング: 一瞬でパッと広がって消える輪(打撃・命中の"ドン!"を強調) */
export function impactRing(scene: Phaser.Scene, x: number, y: number, color = 0xffffff, startRadius = 8): void {
  const ring = scene.add.circle(x, y, startRadius).setStrokeStyle(5, color, 0.9).setDepth(DEPTH.overlay);
  scene.tweens.add({
    targets: ring,
    radius: startRadius + 46,
    alpha: 0,
    duration: 300,
    ease: 'Quad.easeOut',
    onUpdate: () => ring.setStrokeStyle(5, color, ring.alpha),
    onComplete: () => ring.destroy(),
  });
}

/** その場で弾けるパーティクル(グロー閃光+重力つき色破片+中心の衝撃リング) */
export function burst(scene: Phaser.Scene, x: number, y: number, count = 14, colors = CONF_COLORS): void {
  impactRing(scene, x, y, colors[0]);
  // 中心の光(加算合成でグロー)
  const kira = scene.add
    .particles(x, y, TX_GLOW, {
      speed: { min: 30, max: 130 },
      lifespan: { min: 180, max: 360 },
      scale: { start: 1.2, end: 0 },
      blendMode: Phaser.BlendModes.ADD,
      tint: 0xfff2c4,
      emitting: false,
    })
    .setDepth(DEPTH.overlay);
  kira.explode(Math.min(6, count));
  // 色つき破片(重力で散る)
  const bits = scene.add
    .particles(x, y, Math.random() < 0.5 ? TX_DOT : TX_SQUARE, {
      speed: { min: 130, max: 300 },
      lifespan: { min: 380, max: 640 },
      gravityY: 620,
      scale: { start: 1.2, end: 0.2 },
      rotate: { min: 0, max: 360 },
      tint: colors,
      emitting: false,
    })
    .setDepth(DEPTH.overlay);
  bits.explode(count);
  scene.time.delayedCall(800, () => {
    kira.destroy();
    bits.destroy();
  });
}

/** 土けむり(dig 用): 茶色の破片+石ころが舞う */
export function soilPuff(scene: Phaser.Scene, x: number, y: number): void {
  burst(scene, x, y, 12, [0xb89b6a, 0x8a6242, 0xd8c49a, 0x9c7d4f]);
}

/** 紙吹雪: 上から降ってくる(祝福用)。角形+きらめき絵文字を混ぜる */
export function confetti(scene: Phaser.Scene, count = 34): void {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * GAME_W;
    const useEmoji = Math.random() < 0.25;
    const p = useEmoji
      ? scene.add.text(x, -20, Math.random() < 0.5 ? '✨' : '⭐', { fontSize: '18px' }).setDepth(DEPTH.overlay)
      : scene.add
          .rectangle(x, -20, 10, 14, CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)])
          .setDepth(DEPTH.overlay)
          .setAngle(Math.random() * 360);
    scene.tweens.add({
      targets: p,
      y: 620 + Math.random() * 160,
      x: x + (Math.random() - 0.5) * 160,
      angle: (p.angle ?? 0) + 380 + Math.random() * 240,
      duration: 1400 + Math.random() * 700,
      delay: Math.random() * 400,
      ease: 'Sine.easeIn',
      alpha: { from: 1, to: 0.1 },
      onComplete: () => p.destroy(),
    });
  }
}

/** 打ち上げ花火: 光が昇っていき、頂点で放射状にひらく(おまつり用) */
export function firework(scene: Phaser.Scene, x: number, topY: number, color?: number): void {
  const c = color ?? CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)];
  const rocket = scene.add.circle(x, topY + 260, 4, 0xfff2c4, 1).setDepth(DEPTH.overlay);
  scene.tweens.add({
    targets: rocket,
    y: topY,
    duration: 460,
    ease: 'Quad.easeOut',
    onComplete: () => {
      rocket.destroy();
      impactRing(scene, x, topY, c, 10);
      const sparks = 16;
      for (let i = 0; i < sparks; i++) {
        const ang = (Math.PI * 2 * i) / sparks + Math.random() * 0.2;
        const dist = 52 + Math.random() * 42;
        const p = scene.add
          .circle(x, topY, 2.5 + Math.random() * 2.5, i % 3 === 0 ? 0xfff2c4 : c, 1)
          .setDepth(DEPTH.overlay);
        scene.tweens.add({
          targets: p,
          x: x + Math.cos(ang) * dist,
          y: topY + Math.sin(ang) * dist + 28,
          alpha: 0,
          scale: 0.4,
          duration: 720 + Math.random() * 320,
          ease: 'Quad.easeOut',
          onComplete: () => p.destroy(),
        });
      }
    },
  });
}

/** 画面いっぱいのフラッシュ(でっかい成功の一瞬を強調) */
export function screenFlash(scene: Phaser.Scene, color = 0xffffff, peakAlpha = 0.55): void {
  const flash = scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, color, peakAlpha).setDepth(DEPTH.overlay);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 260,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });
}

/** ジャスト成功の画面パルス(ズームがふっと寄って戻る)。
    HiDPI でカメラの基準ズームが 1 でない場合があるため、必ず現在値からの相対で書く */
export function cameraPulse(scene: Phaser.Scene): void {
  const cam = scene.cameras.main;
  const base = cam.zoom;
  scene.tweens.add({
    targets: cam,
    zoom: { from: base * 1.045, to: base },
    duration: 260,
    ease: 'Quad.easeOut',
  });
}

/** はずれの小さな揺れ */
export function missShake(scene: Phaser.Scene): void {
  scene.cameras.main.shake(120, 0.004);
}

/** でっかい一撃の合図: ヒットストップ+リング+フラッシュ+カメラパルス(金の実・ぬし・ど真ん中用) */
export function bigImpact(scene: Phaser.Scene, x: number, y: number, color = 0xffd34d): void {
  impactRing(scene, x, y, color, 14);
  screenFlash(scene, color, 0.22);
  cameraPulse(scene);
  hitStop(scene, 70);
}

/** 当たり判定を見た目より広げる(子供の指は太い)。Text等の interactive 済みオブジェクトに使う */
export function padHitArea(obj: Phaser.GameObjects.Text, pad: number): void {
  obj.setInteractive(
    new Phaser.Geom.Rectangle(-pad, -pad, obj.width + pad * 2, obj.height + pad * 2),
    Phaser.Geom.Rectangle.Contains,
  );
}

/** ぷるんと揺れ続ける(収穫ごろの実・カード強調用) */
export function wobble(scene: Phaser.Scene, target: Phaser.GameObjects.Components.Transform): void {
  scene.tweens.add({
    targets: target,
    angle: { from: -4, to: 4 },
    duration: 320,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

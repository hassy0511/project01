/* ゲームフィール用エフェクト: スカッシュ&ストレッチ・パーティクル・
   スコアポップ・紙吹雪・画面パルス・衝撃リング・画面フラッシュ。
   すべて Tween ベースでアセット不要 */
import Phaser from 'phaser';
import { DEPTH, FONT, GAME_H, GAME_W } from './theme';

const CONF_COLORS = [0xff9f40, 0x6fbf44, 0xff9eb5, 0xffd166, 0x8ed4e8, 0xb39ddb];

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

/** その場で弾けるパーティクル(色つき破片+中心の衝撃リング) */
export function burst(scene: Phaser.Scene, x: number, y: number, count = 14, colors = CONF_COLORS): void {
  impactRing(scene, x, y, colors[0]);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 40 + Math.random() * 46;
    const size = 6 + Math.random() * 6;
    const color = colors[i % colors.length];
    const shape =
      Math.random() < 0.5
        ? scene.add.rectangle(x, y, size, size, color)
        : scene.add.circle(x, y, size / 2, color);
    shape.setDepth(DEPTH.overlay).setAngle(Math.random() * 360);
    scene.tweens.add({
      targets: shape,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist + 14,
      angle: shape.angle + 220,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 0.3 },
      duration: 460 + Math.random() * 220,
      ease: 'Quad.easeOut',
      onComplete: () => shape.destroy(),
    });
  }
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

/** ジャスト成功の画面パルス(ズームがふっと寄って戻る) */
export function cameraPulse(scene: Phaser.Scene): void {
  const cam = scene.cameras.main;
  scene.tweens.add({
    targets: cam,
    zoom: { from: 1.045, to: 1 },
    duration: 260,
    ease: 'Quad.easeOut',
  });
}

/** はずれの小さな揺れ */
export function missShake(scene: Phaser.Scene): void {
  scene.cameras.main.shake(120, 0.004);
}

/** でっかい一撃の合図: リング+フラッシュ+カメラパルスをまとめて鳴らす(金の実・ぬし・ど真ん中用) */
export function bigImpact(scene: Phaser.Scene, x: number, y: number, color = 0xffd34d): void {
  impactRing(scene, x, y, color, 14);
  screenFlash(scene, color, 0.22);
  cameraPulse(scene);
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

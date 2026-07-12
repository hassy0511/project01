/* ゲームフィール用エフェクト(M3): スカッシュ&ストレッチ・パーティクル・
   スコアポップ・紙吹雪・画面パルス。すべて Tween ベースでアセット不要 */
import Phaser from 'phaser';
import { DEPTH, FONT, GAME_W } from './theme';

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
    .text(x, y, text, { fontFamily: FONT, fontSize: '20px', color, fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 4 })
    .setOrigin(0.5)
    .setDepth(DEPTH.overlay);
  scene.tweens.add({
    targets: t,
    y: y - 54,
    alpha: { from: 1, to: 0 },
    scale: { from: 1, to: 1.25 },
    duration: 700,
    ease: 'Quad.easeOut',
    onComplete: () => t.destroy(),
  });
}

/** その場で弾けるパーティクル(小さな色つき破片) */
export function burst(scene: Phaser.Scene, x: number, y: number, count = 10, colors = CONF_COLORS): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 34 + Math.random() * 30;
    const p = scene.add
      .rectangle(x, y, 7, 7, colors[i % colors.length])
      .setDepth(DEPTH.overlay)
      .setAngle(Math.random() * 360);
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist + 12,
      angle: p.angle + 200,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 0.4 },
      duration: 420 + Math.random() * 180,
      ease: 'Quad.easeOut',
      onComplete: () => p.destroy(),
    });
  }
}

/** 土けむり(dig 用): 茶色の破片が舞う */
export function soilPuff(scene: Phaser.Scene, x: number, y: number): void {
  burst(scene, x, y, 8, [0xb89b6a, 0x8a6242, 0xd8c49a]);
}

/** 紙吹雪: 上から降ってくる(祝福用) */
export function confetti(scene: Phaser.Scene, count = 26): void {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * GAME_W;
    const p = scene.add
      .rectangle(x, -20, 9, 12, CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)])
      .setDepth(DEPTH.overlay)
      .setAngle(Math.random() * 360);
    scene.tweens.add({
      targets: p,
      y: 620 + Math.random() * 160,
      x: x + (Math.random() - 0.5) * 130,
      angle: p.angle + 380 + Math.random() * 240,
      duration: 1500 + Math.random() * 700,
      delay: Math.random() * 400,
      ease: 'Sine.easeIn',
      alpha: { from: 1, to: 0.15 },
      onComplete: () => p.destroy(),
    });
  }
}

/** ジャスト成功の画面パルス(ズームがふっと寄って戻る) */
export function cameraPulse(scene: Phaser.Scene): void {
  const cam = scene.cameras.main;
  scene.tweens.add({
    targets: cam,
    zoom: { from: 1.035, to: 1 },
    duration: 240,
    ease: 'Quad.easeOut',
  });
}

/** はずれの小さな揺れ */
export function missShake(scene: Phaser.Scene): void {
  scene.cameras.main.shake(120, 0.004);
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

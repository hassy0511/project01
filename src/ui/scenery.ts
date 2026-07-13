/* ミニゲーム用の描画背景(ベクター)。無地背景を廃止して
   空・丘・地下断面・海などをグラデーション+図形で描く */
import Phaser from 'phaser';
import { GAME_W } from './theme';

/** 空+奥の丘+雲(地上系ゲーム共通)。h は背景の高さ */
export function drawMeadow(scene: Phaser.Scene, area: Phaser.GameObjects.Container, h: number): void {
  const g = scene.add.graphics();
  g.fillGradientStyle(0xaee3f7, 0xaee3f7, 0xe8f7d9, 0xe8f7d9, 1);
  g.fillRect(0, 0, GAME_W, h);
  // 奥の丘(2層)
  g.fillStyle(0xb5d98a, 1);
  g.fillEllipse(GAME_W * 0.25, h + 10, GAME_W * 1.2, h * 0.55);
  g.fillStyle(0x9ccb6f, 1);
  g.fillEllipse(GAME_W * 0.85, h + 30, GAME_W * 1.1, h * 0.45);
  // 手前の草地
  g.fillStyle(0x8bc063, 1);
  g.fillRect(0, h - 46, GAME_W, 46);
  g.fillStyle(0x7cb356, 1);
  for (let x = 10; x < GAME_W; x += 26) {
    g.fillTriangle(x, h - 46, x + 6, h - 60, x + 12, h - 46);
  }
  area.add(g);
  // 太陽と雲(ゆっくり流れる)
  const sun = scene.add.circle(GAME_W - 52, 104, 22, 0xffd34d).setAlpha(0.9);
  area.add(sun);
  for (const [cx, cy, s] of [
    [70, 50, 1],
    [230, 84, 0.7],
  ] as const) {
    const cloud = scene.add.container(cx, cy).setAlpha(0.85).setScale(s);
    const cg = scene.add.graphics();
    cg.fillStyle(0xffffff, 1);
    cg.fillEllipse(0, 0, 74, 30);
    cg.fillEllipse(-22, 6, 44, 22);
    cg.fillEllipse(24, 6, 48, 24);
    cloud.add(cg);
    area.add(cloud);
    scene.tweens.add({
      targets: cloud,
      x: cx + 40,
      duration: 9000 + Math.random() * 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

/** 地上ライン+地下断面(採掘ゲーム用)。groundY から下を地層にする */
export function drawUnderground(
  scene: Phaser.Scene,
  area: Phaser.GameObjects.Container,
  groundY: number,
  h: number,
): void {
  const g = scene.add.graphics();
  // 空
  g.fillGradientStyle(0xaee3f7, 0xaee3f7, 0xd7efc3, 0xd7efc3, 1);
  g.fillRect(0, 0, GAME_W, groundY);
  // 草のふち
  g.fillStyle(0x8bc063, 1);
  g.fillRect(0, groundY - 14, GAME_W, 14);
  // 地層(下ほど濃い)
  const cols = [0xc9a06a, 0xb98f58, 0xa87e4a, 0x966d3d];
  const layerH = (h - groundY) / cols.length;
  cols.forEach((c, i) => {
    g.fillStyle(c, 1);
    g.fillRect(0, groundY + i * layerH, GAME_W, layerH + 1);
  });
  // 小石の模様
  g.fillStyle(0x7d5a33, 0.5);
  for (let i = 0; i < 26; i++) {
    g.fillCircle(Math.random() * GAME_W, groundY + 10 + Math.random() * (h - groundY - 20), 2 + Math.random() * 3);
  }
  area.add(g);
}

/** 海と空(フィッシング用) */
export function drawSea(scene: Phaser.Scene, area: Phaser.GameObjects.Container, seaTopY: number, h: number): void {
  const g = scene.add.graphics();
  g.fillGradientStyle(0xbfe9f7, 0xbfe9f7, 0xe9f7fb, 0xe9f7fb, 1);
  g.fillRect(0, 0, GAME_W, seaTopY);
  g.fillGradientStyle(0x6fc4e0, 0x6fc4e0, 0x2f7ea6, 0x2f7ea6, 1);
  g.fillRect(0, seaTopY, GAME_W, h - seaTopY);
  area.add(g);
  // 波(白線がゆらゆら)
  for (let i = 0; i < 3; i++) {
    const wave = scene.add.graphics();
    wave.lineStyle(3, 0xffffff, 0.35);
    const y = seaTopY + 8 + i * 4;
    wave.beginPath();
    for (let x = 0; x <= GAME_W; x += 8) {
      const wy = y + Math.sin(x / 26 + i) * 3;
      if (x === 0) wave.moveTo(x, wy);
      else wave.lineTo(x, wy);
    }
    wave.strokePath();
    area.add(wave);
    scene.tweens.add({
      targets: wave,
      x: { from: -12, to: 12 },
      duration: 2200 + i * 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  const sun = scene.add.circle(GAME_W - 48, 108, 20, 0xffd34d).setAlpha(0.9);
  area.add(sun);
}

/** ベクター描画のかご(絵文字より立体感のある収穫かご)。中心原点 */
export function drawBasket(scene: Phaser.Scene, w = 92, h = 56): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const g = scene.add.graphics();
  // 本体(台形)
  g.fillStyle(0xc98f4e, 1);
  g.beginPath();
  g.moveTo(-w / 2, -h / 2 + 10);
  g.lineTo(w / 2, -h / 2 + 10);
  g.lineTo(w / 2 - 12, h / 2);
  g.lineTo(-w / 2 + 12, h / 2);
  g.closePath();
  g.fillPath();
  // 編み目
  g.lineStyle(3, 0xa9713a, 0.8);
  for (let i = 1; i < 4; i++) {
    const y = -h / 2 + 10 + (i * (h - 10)) / 4;
    g.lineBetween(-w / 2 + (i * 12) / 4, y, w / 2 - (i * 12) / 4, y);
  }
  for (let i = 1; i < 5; i++) {
    const x = -w / 2 + (i * w) / 5;
    g.lineBetween(x, -h / 2 + 10, x * 0.82, h / 2);
  }
  // 縁
  g.fillStyle(0xdfa963, 1);
  g.fillRoundedRect(-w / 2 - 4, -h / 2, w + 8, 14, 7);
  g.lineStyle(2, 0xa9713a, 1);
  g.strokeRoundedRect(-w / 2 - 4, -h / 2, w + 8, 14, 7);
  c.add(g);
  return c;
}

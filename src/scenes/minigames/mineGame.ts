/* 採掘ゲーム(さつまいも・ねんど): 地下断面のタイルを掘り進める。
   掘れるのは「上の列」か「掘った所のとなり」だけ。岩は掘れないので迂回ルートを考える。
   深いお宝ほど高得点。全部見つけたらタイムボーナス */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, floatUp, screenFlash, soilPuff } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { drawUnderground } from '../../ui/scenery';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const GROUND_Y = 150;
const COLS = 5;
const ROWS = 5;
const TILE = 86;
const GAP = 6;
const TREASURES = 5;
const GEMS = 2;
const GEM_PTS = 40;
const TIME_BONUS_PER_SEC = 2;

type TileKind = 'dirt' | 'hard' | 'rock';
interface Tile {
  kind: TileKind;
  hp: number;
  dug: boolean;
  treasure?: 'item' | 'gem';
  c: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
}

export function renderMine(api: MinigameApi, prompt: string, targetEmoji: string): void {
  const { scene, area } = api;
  drawUnderground(scene, area, GROUND_Y, AREA_H);
  api.sign(prompt);

  const originX = (GAME_W - (COLS * TILE + (COLS - 1) * GAP)) / 2 + TILE / 2;
  const originY = GROUND_Y + 14 + TILE / 2;
  const tiles: Tile[][] = [];

  let found = 0;
  const session = new ArcadeSession(api, {
    engine: 'mine',
    onEnd: () => {
      api.addScore(session.score);
      api.advance(400);
    },
  });

  // 盤面生成: 岩12% / かたい土30% / ふつう58%。お宝と宝石は岩以外に隠す
  for (let r = 0; r < ROWS; r++) {
    tiles.push([]);
    for (let col = 0; col < COLS; col++) {
      const roll = Math.random();
      const kind: TileKind = roll < 0.12 ? 'rock' : roll < 0.42 ? 'hard' : 'dirt';
      const c = scene.add.container(originX + col * (TILE + GAP), originY + r * (TILE + GAP));
      const bg = scene.add.graphics();
      c.add(bg);
      c.setSize(TILE, TILE);
      area.add(c);
      tiles[r].push({ kind, hp: kind === 'hard' ? 2 : 1, dug: false, c, bg });
    }
  }
  const spots: { r: number; col: number }[] = [];
  for (let r = 1; r < ROWS; r++) for (let col = 0; col < COLS; col++) if (tiles[r][col].kind !== 'rock') spots.push({ r, col });
  Phaser.Utils.Array.Shuffle(spots);
  spots.slice(0, TREASURES).forEach((s) => (tiles[s.r][s.col].treasure = 'item'));
  spots.slice(TREASURES, TREASURES + GEMS).forEach((s) => (tiles[s.r][s.col].treasure = 'gem'));

  const diggable = (r: number, col: number): boolean => {
    const t = tiles[r][col];
    if (t.dug || t.kind === 'rock') return false;
    if (r === 0) return true;
    const near = [
      [r - 1, col],
      [r + 1, col],
      [r, col - 1],
      [r, col + 1],
    ];
    return near.some(([nr, nc]) => tiles[nr]?.[nc]?.dug);
  };

  const drawTile = (r: number, col: number): void => {
    const t = tiles[r][col];
    const g = t.bg;
    g.clear();
    if (t.dug) return;
    if (t.kind === 'rock') {
      g.fillStyle(0x8d8d8d, 1);
      g.fillRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 12);
      g.fillStyle(0x757575, 1);
      g.fillCircle(-14, -8, 16);
      g.fillCircle(16, 12, 20);
      g.lineStyle(3, 0x5f5f5f, 1);
      g.strokeRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 12);
      return;
    }
    const canDig = diggable(r, col);
    const base = t.kind === 'hard' ? 0x8f6a3c : 0xb98f58;
    g.fillStyle(base, canDig ? 1 : 0.62);
    g.fillRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 12);
    g.lineStyle(2, 0x7d5a33, canDig ? 1 : 0.4);
    g.strokeRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 12);
    if (t.kind === 'hard') {
      g.lineStyle(2, 0x6b4a26, 0.8);
      g.lineBetween(-TILE / 4, -TILE / 4, TILE / 5, 0);
      g.lineBetween(-TILE / 6, TILE / 4, TILE / 4, -TILE / 8);
    }
    if (t.kind === 'hard' && t.hp === 1) {
      g.lineStyle(3, 0x4a3018, 0.9);
      g.lineBetween(-TILE / 3, -TILE / 3, TILE / 3, TILE / 4);
      g.lineBetween(TILE / 4, -TILE / 4, -TILE / 5, TILE / 3);
    }
  };
  const redrawAll = (): void => {
    for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) drawTile(r, col);
  };
  redrawAll();

  for (let r = 0; r < ROWS; r++) {
    for (let col = 0; col < COLS; col++) {
      const t = tiles[r][col];
      t.c.setInteractive({ useHandCursor: true });
      t.c.on('pointerdown', () => {
        if (session.isEnded() || !diggable(r, col)) return;
        const wx = t.c.x;
        const wy = t.c.y + api.areaY;
        soilPuff(scene, wx, wy);
        scene.cameras.main.shake(70, 0.003);
        SFX.pop();
        t.hp--;
        if (t.hp > 0) {
          drawTile(r, col); // ひび割れ表示
          scene.tweens.add({ targets: t.c, x: t.c.x + 4, duration: 50, yoyo: true });
          return;
        }
        t.dug = true;
        t.bg.clear();
        redrawAll(); // となりが掘れるようになったのを明るく
        if (t.treasure) {
          found += t.treasure === 'item' ? 1 : 0;
          const pts = t.treasure === 'gem' ? GEM_PTS : 20 + r * 10; // 深いほど高得点
          const icon = scene.add
            .text(0, 0, t.treasure === 'gem' ? '💎' : targetEmoji, { fontSize: '40px' })
            .setOrigin(0.5)
            .setScale(0);
          t.c.add(icon);
          scene.tweens.add({ targets: icon, scale: 1, ease: 'Back.easeOut', duration: 260 });
          burst(scene, wx, wy, 12);
          SFX.good();
          session.addPoints(pts, wx, wy - 30, false);
          scene.tweens.add({
            targets: icon,
            y: -(r * (TILE + GAP)) - TILE,
            alpha: 0,
            scale: 0.5,
            delay: 380,
            duration: 420,
            ease: 'Cubic.easeIn',
          });
          if (found >= TREASURES) {
            // 全部ほりあて: タイムボーナスをつけて早じまい
            const bonus = Math.round(session.secLeft() * TIME_BONUS_PER_SEC);
            if (bonus > 0) {
              session.addPoints(bonus, GAME_W / 2, 300 + api.areaY, false);
              floatUp(scene, GAME_W / 2, 340 + api.areaY, UI_TEXT.arcade.timeBonus(bonus), '#3f7d2c');
            }
            screenFlash(scene, 0xfff2c4, 0.4);
            session.finish();
          }
        }
      });
    }
  }
}

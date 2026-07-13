/* 採掘パズル(さつまいも・らっかせい・ねんど): シャベルの回数に限りがある。
   はずれを掘ると「まわり8マスに お宝がいくつあるか」の数字ヒントが出るので、
   推理して掘る場所を選ぶ(マインスイーパーの逆型)。
   全部見つけると 残りシャベル×ボーナス + 新しい盤面(だんだんシャベルが減る) */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, floatUp, screenFlash, soilPuff } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_W } from '../../ui/theme';
import { drawUnderground } from '../../ui/scenery';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const GROUND_Y = 176;
const COLS = 5;
const ROWS = 5;
const TILE = 86;
const GAP = 6;
const TREASURES = 5;
const FIRST_SHOVELS = 12;
const MIN_SHOVELS = 9;
const TREASURE_PTS = 30;
const SHOVEL_BONUS = 5;

interface Tile {
  dug: boolean;
  treasure: boolean;
  c: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
}

const HINT_COLORS: Record<number, string> = { 0: '#8a7a62', 1: '#e0812a', 2: '#d84343', 3: '#b02a2a' };

export function renderMine(api: MinigameApi, prompt: string, targetEmoji: string): void {
  const { scene, area } = api;
  drawUnderground(scene, area, GROUND_Y, AREA_H);
  api.sign(prompt);

  const session = new ArcadeSession(api, {
    engine: 'mine',
    onEnd: () => {
      api.addScore(session.score);
      api.advance(400);
    },
  });

  // シャベル残数表示
  const shovelText = scene.add
    .text(20, GROUND_Y - 44, '', {
      fontFamily: FONT,
      fontSize: '18px',
      color: '#4a3b2a',
      fontStyle: 'bold',
      backgroundColor: '#ffffffbb',
      padding: { x: 10, y: 4 },
    })
    .setOrigin(0, 0.5);
  area.add(shovelText);

  let board = 0;
  let shovels = 0;
  let found = 0;
  let tiles: Tile[][] = [];
  const originX = (GAME_W - (COLS * TILE + (COLS - 1) * GAP)) / 2 + TILE / 2;
  const originY = GROUND_Y + 10 + TILE / 2;

  const updateShovels = (): void => {
    shovelText.setText(UI_TEXT.arcade.shovels(shovels));
    scene.tweens.add({ targets: shovelText, scale: { from: 1.15, to: 1 }, duration: 140 });
  };

  const neighborCount = (r: number, c: number): number => {
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        if (tiles[r + dr]?.[c + dc]?.treasure) n++;
      }
    }
    return n;
  };

  const drawTileFace = (t: Tile): void => {
    t.bg.clear();
    t.bg.fillGradientStyle(0xc9a06a, 0xc9a06a, 0xa87e4a, 0xa87e4a, 1);
    t.bg.fillRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 12);
    t.bg.lineStyle(2, 0x7d5a33, 0.9);
    t.bg.strokeRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 12);
    t.bg.fillStyle(0xdbb87f, 0.7);
    t.bg.fillRoundedRect(-TILE / 2 + 5, -TILE / 2 + 5, TILE - 10, 10, 5);
  };

  const newBoard = (): void => {
    board++;
    found = 0;
    shovels = Math.max(MIN_SHOVELS, FIRST_SHOVELS - (board - 1));
    updateShovels();
    tiles.forEach((row) => row.forEach((t) => t.c.destroy()));
    tiles = [];
    for (let r = 0; r < ROWS; r++) {
      tiles.push([]);
      for (let c = 0; c < COLS; c++) {
        const cc = scene.add.container(originX + c * (TILE + GAP), originY + r * (TILE + GAP));
        const bg = scene.add.graphics();
        cc.add(bg);
        cc.setSize(TILE, TILE);
        cc.setAlpha(0);
        area.add(cc);
        scene.tweens.add({ targets: cc, alpha: 1, duration: 220, delay: (r * COLS + c) * 18 });
        const tile: Tile = { dug: false, treasure: false, c: cc, bg };
        drawTileFace(tile);
        tiles[r].push(tile);
        cc.setInteractive({ useHandCursor: true });
        cc.on('pointerdown', () => dig(r, c));
      }
    }
    // お宝を隠す
    const spots: { r: number; c: number }[] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) spots.push({ r, c });
    Phaser.Utils.Array.Shuffle(spots);
    spots.slice(0, TREASURES).forEach((s) => (tiles[s.r][s.c].treasure = true));
  };

  const dig = (r: number, c: number): void => {
    const t = tiles[r][c];
    if (session.isEnded() || t.dug || shovels <= 0) return;
    t.dug = true;
    shovels--;
    updateShovels();
    const wx = t.c.x;
    const wy = t.c.y + api.areaY;
    soilPuff(scene, wx, wy);
    scene.cameras.main.shake(60, 0.0025);
    SFX.pop();
    t.bg.clear();
    t.bg.fillStyle(0x6b4a26, 1); // 掘った穴
    t.bg.fillRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 12);
    t.bg.lineStyle(2, 0x543a1e, 1);
    t.bg.strokeRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 12);

    if (t.treasure) {
      found++;
      const icon = scene.add.text(0, 0, targetEmoji, { fontSize: '42px' }).setOrigin(0.5).setScale(0);
      t.c.add(icon);
      scene.tweens.add({ targets: icon, scale: 1, ease: 'Back.easeOut', duration: 280 });
      burst(scene, wx, wy, 12);
      SFX.good();
      session.addPoints(TREASURE_PTS, wx, wy - 30, false);
      if (found >= TREASURES) boardCleared();
    } else {
      // 数字ヒント: まわり8マスの お宝の数
      const n = neighborCount(r, c);
      const hint = scene.add
        .text(0, 0, `${n}`, {
          fontFamily: FONT,
          fontSize: '30px',
          color: HINT_COLORS[Math.min(n, 3)],
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScale(0);
      t.c.add(hint);
      scene.tweens.add({ targets: hint, scale: 1, ease: 'Back.easeOut', duration: 240 });
      SFX.bad();
      if (shovels <= 0) {
        // シャベル切れ: 少し待って新しい掘り場へ(ペナルティなし・時間だけが過ぎる)
        floatUp(scene, GAME_W / 2, 400 + api.areaY, UI_TEXT.arcade.noShovels, '#c04545');
        scene.time.delayedCall(1100, () => {
          if (!session.isEnded()) newBoard();
        });
      }
    }
  };

  const boardCleared = (): void => {
    const bonus = shovels * SHOVEL_BONUS;
    screenFlash(scene, 0xfff2c4, 0.4);
    SFX.fanfare();
    if (bonus > 0) {
      session.addPoints(bonus, GAME_W / 2, 380 + api.areaY, false);
      floatUp(scene, GAME_W / 2, 420 + api.areaY, UI_TEXT.arcade.shovelBonus(shovels), '#3f7d2c');
    }
    scene.time.delayedCall(1000, () => {
      if (!session.isEnded()) newBoard();
    });
  };

  newBoard();
}

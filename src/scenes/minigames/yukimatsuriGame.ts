/* ゆきまつり(ほっかいどう・さっぽろ): 雪像(ゆきぞう)づくりゲーム。
   雪のブロックの かたまりから、うっすら みえる 型の「そと」だけを タップして けずる。
   ぞうの部分を けずってしまうと「あぶない!」でコンボが切れるだけ(成功保証)。
   ぜんぶ けずると 雪像かんせい! 3体ごとに「おおきな ゆきぞう」= 2倍 が C 要素。
   実在のさっぽろ雪まつりの「雪像を つくる」をそのまま動詞化。動作=見て けずる精密タップ */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const GRID = 5;
const CELL = 74;
const GRID_X = (GAME_W - GRID * CELL) / 2;
const GRID_Y = 170;
const CARVE_PTS = 6;
const DONE_PTS = 30;
const MISS_STUN_MS = 500;
/** 3体ごとに おおきな ゆきぞう(2倍) */
const BIG_EVERY = 3;

/** 型: X=ぞうの部分(のこす) . =けずる */
const PATTERNS: { emoji: string; rows: string[] }[] = [
  { emoji: '⛄', rows: ['.XXX.', '.XXX.', '..X..', 'XXXXX', 'XXXXX'] },
  { emoji: '🐟', rows: ['..XX.', '.XXXX', 'XXXXX', '.XXXX', '..XX.'] },
  { emoji: '⭐', rows: ['..X..', '.XXX.', 'XXXXX', '.XXX.', '.X.X.'] },
];

interface Cell {
  keep: boolean;
  alive: boolean;
  g: Phaser.GameObjects.Graphics;
}

export function renderYukimatsuri(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 雪の会場: 夜空+ライトアップ
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x1d2547, 0x1d2547, 0x3a4a7a, 0x3a4a7a, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0xf4f7fb, 1);
  bg.fillRect(0, GRID_Y + GRID * CELL + 20, GAME_W, AREA_H);
  area.add(bg);
  for (let i = 0; i < 12; i++) {
    const f = scene.add.circle(Math.random() * GAME_W, Math.random() * 400, 2, 0xffffff, 0.8);
    area.add(f);
    scene.tweens.add({ targets: f, y: f.y + 90, alpha: 0.2, duration: 3600 + Math.random() * 2000, repeat: -1 });
  }

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'yukimatsuri',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  // おてほん表示
  const sample = scene.add.text(GAME_W - 60, 130, '', { fontSize: '40px' }).setOrigin(0.5);
  area.add(sample);
  const sampleLabel = scene.add
    .text(GAME_W - 60, 96, 'おてほん', { fontSize: '13px', color: '#9ad0f5' })
    .setOrigin(0.5);
  area.add(sampleLabel);

  let cells: Cell[][] = [];
  let statueNo = 0;
  let big = false;
  let carveLeft = 0;
  let stunnedUntil = 0;
  let building = false;

  const cellXY = (r: number, c: number): [number, number] => [GRID_X + c * CELL + CELL / 2, GRID_Y + r * CELL + CELL / 2];

  const drawCell = (cell: Cell, r: number, c: number): void => {
    const [x, y] = cellXY(r, c);
    cell.g.clear();
    if (!cell.alive) return;
    cell.g.fillStyle(0xffffff, 1);
    cell.g.fillRoundedRect(x - CELL / 2 + 3, y - CELL / 2 + 3, CELL - 6, CELL - 6, 10);
    // ぞうの部分は うっすら 青いかげで ヒント(みて けずる)
    if (cell.keep) {
      cell.g.fillStyle(big ? 0xffd34d : 0x9ad0f5, 0.28);
      cell.g.fillRoundedRect(x - CELL / 2 + 8, y - CELL / 2 + 8, CELL - 16, CELL - 16, 8);
    } else {
      cell.g.fillStyle(0xe6edf5, 0.7);
      cell.g.fillRoundedRect(x - CELL / 2 + 10, y + 4, CELL - 20, CELL / 2 - 14, 6);
    }
  };

  const buildStatue = (): void => {
    building = false;
    const pat = PATTERNS[statueNo % PATTERNS.length];
    big = (statueNo + 1) % BIG_EVERY === 0;
    sample.setText(pat.emoji);
    carveLeft = 0;
    cells = [];
    for (let r = 0; r < GRID; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < GRID; c++) {
        const keep = pat.rows[r][c] === 'X';
        const g = scene.add.graphics();
        area.add(g);
        const cell: Cell = { keep, alive: true, g };
        if (!keep) carveLeft++;
        row.push(cell);
        drawCell(cell, r, c);
        g.setAlpha(0);
        scene.tweens.add({ targets: g, alpha: 1, duration: 250, delay: (r * GRID + c) * 18 });
      }
      cells.push(row);
    }
    if (big) {
      floatUp(scene, GAME_W / 2, GRID_Y + api.areaY - 30, UI_TEXT.fest.yukiBig, '#e0812a');
      SFX.fanfare();
    }
  };
  buildStatue();

  const finishStatue = (): void => {
    building = true;
    statueNo++;
    SFX.fanfare();
    const bonus = DONE_PTS * (big ? 2 : 1);
    session.addPoints(bonus, GAME_W / 2, GRID_Y + api.areaY + 120, false);
    floatUp(scene, GAME_W / 2, GRID_Y + api.areaY + 80, UI_TEXT.fest.yukiDone, '#3f7d2c');
    bigImpact(scene, GAME_W / 2, GRID_Y + api.areaY + 150);
    confetti(scene, big ? 20 : 12);
    // のこった雪が 氷いろに ひかって かんせい
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const cell = cells[r][c];
        if (!cell.alive) continue;
        const [x, y] = cellXY(r, c);
        cell.g.clear();
        cell.g.fillStyle(0xbfe9f7, 1);
        cell.g.fillRoundedRect(x - CELL / 2 + 3, y - CELL / 2 + 3, CELL - 6, CELL - 6, 10);
      }
    }
    scene.time.delayedCall(1100, () => {
      if (session.isEnded()) return;
      for (const row of cells) for (const cell of row) cell.g.destroy();
      buildStatue();
    });
  };

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded() || building || Date.now() < stunnedUntil) return;
    const c = Math.floor((p.worldX - GRID_X) / CELL);
    const r = Math.floor((p.worldY - api.areaY - GRID_Y) / CELL);
    if (r < 0 || r >= GRID || c < 0 || c >= GRID) return;
    const cell = cells[r]?.[c];
    if (!cell || !cell.alive) return;
    const [x, y] = cellXY(r, c);
    if (!cell.keep) {
      cell.alive = false;
      cell.g.clear();
      carveLeft--;
      SFX.pop();
      burst(scene, x, y + api.areaY, 6, [0xffffff, 0xdde6ef]);
      session.addPoints(CARVE_PTS * (big ? 2 : 1), x, y + api.areaY - 16);
      if (carveLeft <= 0) finishStatue();
    } else {
      // ぞうを けずりそうに! ひやっとするだけ(ぞうは けずれない)
      stunnedUntil = Date.now() + MISS_STUN_MS;
      session.resetCombo();
      missShake(scene);
      SFX.bad();
      impactRing(scene, x, y + api.areaY, 0xc04545, 10);
      floatUp(scene, x, y + api.areaY - 26, UI_TEXT.fest.yukiOops, '#c04545');
    }
  };
  scene.input.on('pointerdown', onDown);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

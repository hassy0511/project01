/* わかくさやまの やまやき(なら): 山ぜんたいの かれくさに 火を つけて もやす ぎょうじ。
   ほんものと おなじで、まず ひとつずつ「ひつけ」に 火を つけ、
   火は かぜに のって よこに ひろがる ― プレイヤーは 火の さきに 指で「ひみち」を なぞって
   まだ もえていない くさむらへ みちびく。
   ひみちを つないだ ぶんだけ もえひろがって 得点。
   ぼうかたい(もえて ほしくない き)に 火を つれていくと 火が とまる(コンボが きれるだけ)。
   動作=なぞって みちびく。sweep(こする)とは ちがい、火の「せんとう」を つないでいく */
import Phaser from 'phaser';
import { addIcon, iconScale, setIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = GAME_AREA_H;
/** くさむらの ます(山のしゃめん) */
const COLS = 6;
const ROWS = 5;
const CELL_W = 66;
const CELL_H = 62;
const GRID_X = (GAME_W - COLS * CELL_W) / 2 + CELL_W / 2;
const GRID_Y = 300;
const GRASS_PTS = 9;
const ROW_BONUS = 24;
const ALL_BONUS = 55;
/** き(ぼうかたい)の わりあい */
/** やけあとの 大きさ(くさより ひとまわり 小さく のこる) */
const BURNT_SIZE = 22;
const TREE_CHANCE = 0.14;

interface Cell {
  obj: Phaser.GameObjects.Image;
  burnt: boolean;
  tree: boolean;
  col: number;
  row: number;
}

export function renderYamayaki(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // よるの わかくさやま
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x1f2545, 0x1f2545, 0x3f3a5a, 0x3f3a5a, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  for (let i = 0; i < 30; i++) {
    bg.fillStyle(0xffffff, 0.5 + Math.random() * 0.5);
    bg.fillCircle(Math.random() * GAME_W, Math.random() * 240, Math.random() * 1.6 + 0.6);
  }
  // 山の シルエット(3つの かさなり)
  bg.fillStyle(0x2f4a35, 1);
  bg.fillEllipse(GAME_W / 2, 620, 620, 520);
  bg.fillStyle(0x3a5a3f, 1);
  bg.fillEllipse(GAME_W / 2, 660, 520, 460);
  area.add(bg);
  // ごじゅうのとう(なら)
  const tou = addIcon(scene, 46, 250, 'castle:cream', 34);
  area.add(tou);
  const deer = addIcon(scene, GAME_W - 44, 600, 'deer:brown', 30);
  area.add(deer);
  scene.tweens.add({ targets: deer, x: GAME_W - 60, duration: 2400, yoyo: true, repeat: -1 });

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'yamayaki',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- くさむら ---------- */
  const cells: Cell[] = [];
  const buildField = (): void => {
    for (const c of cells) c.obj.destroy();
    cells.length = 0;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tree = Math.random() < TREE_CHANCE;
        const obj = addIcon(scene, GRID_X + col * CELL_W, GRID_Y + row * CELL_H, tree ? 'tree:deepgreen' : 'grain:amber', tree ? 30 : 26);
        if (!tree) obj.setTint(0xc9b26a); // かれくさ
        area.add(obj);
        cells.push({ obj, burnt: false, tree, col, row });
      }
    }
  };
  buildField();

  const cellAt = (x: number, y: number): Cell | undefined =>
    cells.find((c) => !c.burnt && Math.hypot(c.obj.x - x, c.obj.y - y) < 34);

  /* ---------- 火の せんとう ---------- */
  let lit = false; // ひつけ が すんだか
  const torch = addIcon(scene, GRID_X - 40, GRID_Y + (ROWS - 1) * CELL_H + 40, 'fire:orange', 34);
  area.add(torch);
  scene.tweens.add({ targets: torch, scale: { from: iconScale(torch), to: iconScale(torch, 1.15) }, duration: 420, yoyo: true, repeat: -1 });
  const hint = scene.add
    .text(GAME_W / 2, 246, UI_TEXT.fest.yamayakiLight, {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      color: '#ffe8b0',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  area.add(hint);

  const burn = (c: Cell): void => {
    c.burnt = true;
    if (c.tree) {
      // ぼうかたいに 火が いった: 火が とまる
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      c.obj.setTint(0x6b6b6b);
      floatUp(scene, c.obj.x, c.obj.y + api.areaY - 30, UI_TEXT.fest.yamayakiStop, '#c04545');
      return;
    }
    SFX.pop();
    impactRing(scene, c.obj.x, c.obj.y + api.areaY, 0xff8a3d, 8);
    burst(scene, c.obj.x, c.obj.y + api.areaY, 5, [0xff8a3d, 0xffd34d]);
    session.addPoints(GRASS_PTS, c.obj.x, c.obj.y + api.areaY - 26);
    setIcon(c.obj, 'fire:orange');
    c.obj.setTint(0xffffff);
    scene.tweens.add({
      targets: c.obj,
      alpha: 0.35,
      scale: 0.8,
      duration: 700,
      onComplete: () => {
        setIcon(c.obj, 'stone:dark', BURNT_SIZE);
        c.obj.setTint(0x4a3a2a).setAlpha(0.8);
      },
    });
    // よこ1れつ もえたら ボーナス
    const row = cells.filter((x) => x.row === c.row && !x.tree);
    if (row.every((x) => x.burnt)) {
      SFX.good();
      session.addPoints(ROW_BONUS, GAME_W / 2, GRID_Y + c.row * CELL_H + api.areaY - 30, false);
      floatUp(scene, GAME_W / 2, GRID_Y + c.row * CELL_H + api.areaY - 60, UI_TEXT.fest.yamayakiRow, '#e0812a');
    }
    // 山ぜんぶ もえたら 大ボーナス→つぎの 山へ
    if (cells.filter((x) => !x.tree).every((x) => x.burnt)) {
      SFX.fanfare();
      confetti(scene, 20);
      session.addPoints(ALL_BONUS, GAME_W / 2, 300 + api.areaY, false);
      floatUp(scene, GAME_W / 2, 270 + api.areaY, UI_TEXT.fest.yamayakiAll, '#e0812a');
      scene.time.delayedCall(900, () => {
        if (!session.isEnded()) {
          buildField();
          lit = false;
          hint.setText(UI_TEXT.fest.yamayakiLight).setAlpha(1);
        }
      });
    }
  };

  /* ---------- にゅうりょく ---------- */
  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    const y = p.worldY - api.areaY;
    if (!lit) {
      // まず たいまつを タップして ひつけ
      if (Math.hypot(p.worldX - torch.x, y - torch.y) < 60) {
        lit = true;
        SFX.good();
        hint.setText(UI_TEXT.fest.yamayakiGuide).setAlpha(0.8);
        burst(scene, torch.x, torch.y + api.areaY, 10, [0xff8a3d, 0xffd34d]);
        // いちばん ちかい くさむらに 火が つく
        const first = cells
          .filter((c) => !c.burnt && !c.tree)
          .sort((a, b) => Math.hypot(a.obj.x - torch.x, a.obj.y - torch.y) - Math.hypot(b.obj.x - torch.x, b.obj.y - torch.y))[0];
        if (first) burn(first);
      }
      return;
    }
    const c = cellAt(p.worldX, y);
    if (c) burn(c);
  };

  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!p.isDown || !lit || session.isEnded()) return;
    const c = cellAt(p.worldX, p.worldY - api.areaY);
    if (!c) return;
    // となりに 火が ある ときだけ もえひろがる(火は とびこえない)
    const near = cells.some(
      (x) => x.burnt && !x.tree && Math.abs(x.col - c.col) <= 1 && Math.abs(x.row - c.row) <= 1,
    );
    if (near) burn(c);
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

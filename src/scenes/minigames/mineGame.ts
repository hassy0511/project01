/* 採掘パズル(さつまいも・らっかせい・ねんど): 時間なしの 盤面制。
   はずれを掘ると「まわり8マスに お宝がいくつあるか」の数字ヒントが出るので、
   推理して掘る場所を選ぶ(マインスイーパーの逆型)。
   シャベル10本で お宝5個を さがす 盤面を 3つ あそんだら おわり。
   全部見つけると 残りシャベル×ボーナス。シャベル切れは 得点そのまま 次の盤面へ。

   ★子供FB「時間が 足りなくて 適当タッチに なる」→ 時間制を やめた。
     じっくり 考える 子ほど 報われる。シャベルの 上限が ある ので
     でたらめ押し では 盤面クリア(ボーナス)に とどかない(★1保証は そのまま) */
import Phaser from 'phaser';
import { addIcon, iconScale } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { burst, floatUp, screenFlash, soilPuff } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { ARCADE_TUNING, runtimeTuning } from '../../data/arcadeTuning';
import { toolAssist } from '../../core/tools';
import { store } from '../../game/store';
import { FONT, GAME_AREA_H, GAME_W, TEXT_COLORS } from '../../ui/theme';
import { drawUnderground } from '../../ui/scenery';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = GAME_AREA_H;
const GROUND_Y = 176;
const COLS = 5;
const ROWS = 5;
const TILE = 86;
const GAP = 6;
const TREASURES = 5;
/** 盤面の数・シャベル本数は データ(ARCADE_TUNING.mine)から とる */
const BOARDS = ARCADE_TUNING.mine.boards ?? 3;
const BASE_SHOVELS = ARCADE_TUNING.mine.shovels ?? 10;
/** どうぐの 補助(toolAssist 0.12/0.18)を シャベルの 本数に かえる 倍率。
    時間なしゲーム なので 「じかんが のびる」の かわりに 「シャベル +1/+2本」 */
const SHOVELS_PER_ASSIST = 10;
/** しんの めいさんは シャベル 1本 すくない(時間なしゲームの むずかしさ) */
const SHIN_SHOVEL_PENALTY = 1;
const TREASURE_PTS = 30;
const SHOVEL_BONUS = 5;
/** ★子供FB「むずかしくて ただ 適当に タッチして いる」への 手あて。
    はずれが つづいたら、お宝の ある マスを きらっと 光らせて
    「ねらって ほる」に つれもどす。シャベルの 上限は そのまま なので、
    でたらめ押し だけ では 盤面を クリアできない しくみは かわらない */
const HINT_MISS_STREAK = 3;
const HINT_MS = 2600;

interface Tile {
  dug: boolean;
  treasure: boolean;
  c: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
}

const HINT_COLORS: Record<number, string> = { 0: '#8a7a62', 1: '#e0812a', 2: '#d84343', 3: '#b02a2a' };

export function renderMine(api: MinigameApi, prompt: string, targetIcon: string): void {
  const { scene, area } = api;
  drawUnderground(scene, area, GROUND_Y, AREA_H);
  api.sign(prompt);

  const session = new ArcadeSession(api, {
    engine: 'mine',
    untimed: true,
    onEnd: () => {
      api.addScore(session.score);
      api.advance(400);
    },
  });
  const shovelsPerBoard = Math.max(
    1,
    BASE_SHOVELS +
      Math.round(toolAssist(store.state, 'mine') * SHOVELS_PER_ASSIST) -
      (runtimeTuning.shinHard ? SHIN_SHOVEL_PENALTY : 0),
  );

  /* シャベルの のこり。

     ★このゲームの しごとは まるごと 「シャベルの のこり回数」に かかって
       いる(0 に なると 盤面が ながれる)。それなのに 見せかたが
       'シャベル ×12' の 文字 だけ で、絵が 1つも なかった。
       おなじ 画面には 「まわり8マスに いくつ お宝が あるか」の すうじ も
       出る ので、いみの ちがう すうじが 2しゅるい ならんで いた。
       のこりを シャベルの 絵で ならべる と、字を 読まなくても
       「あと これだけ」が わかる。 */
  const SHOVEL_ICON = 'pick:gray';
  const SHOVEL_SIZE = 22;
  const SHOVEL_GAP = 20;
  /** 絵で ならべる のは ここまで。それ より 多い ときは 「×N」も そえる */
  const SHOVEL_ICON_MAX = 10;
  const shovelRow = scene.add.container(20, GROUND_Y - 44);
  area.add(shovelRow);
  const shovelBg = scene.add.graphics();
  shovelRow.add(shovelBg);
  /** ★シャベルの 絵だけを おぼえて おく。
      shovelRow.removeAll(true) で まとめて けすと、
      おなじ 入れものに 入れて いる かずの 文字まで 「はかい」されて しまい、
      つぎに setText した しゅんかんに canvas が null で こわれる
      (ゲームが まるごと 止まって、ゆびマークも 消えなく なる) */
  const shovelIcons: Phaser.GameObjects.Image[] = [];
  const shovelText = scene.add
    .text(0, 0, '', {
      fontFamily: FONT,
      fontSize: '18px',
      color: '#4a3b2a',
      fontStyle: 'bold',
    })
    .setOrigin(0, 0.5);
  shovelRow.add(shovelText);
  const drawShovels = (n: number): void => {
    for (const o of shovelIcons.splice(0)) o.destroy();
    const shown = Math.min(n, SHOVEL_ICON_MAX);
    const extra = n > SHOVEL_ICON_MAX || n === 0;
    shovelBg.clear();
    shovelBg.fillStyle(0xffffff, 0.73);
    shovelBg.fillRoundedRect(-8, -18, Math.max(46, shown * SHOVEL_GAP + 16 + (extra ? 42 : 0)), 36, 12);
    for (let i = 0; i < shown; i++) {
      const ic = addIcon(scene, 8 + i * SHOVEL_GAP, 0, SHOVEL_ICON, SHOVEL_SIZE);
      shovelRow.add(ic);
      shovelIcons.push(ic);
    }
    // 絵で ならべきれない ぶん(と 0 の とき)だけ すうじを そえる
    shovelText.setText(n === 0 ? '0' : n > SHOVEL_ICON_MAX ? `×${n}` : '');
    shovelText.setX(n === 0 ? 10 : 8 + shown * SHOVEL_GAP + 4);
  };

  // 「いま なんばんめの ほりば か」(時間の かわりの ものさし)
  const boardLabel = scene.add
    .text(GAME_W - 20, GROUND_Y - 44, '', {
      fontFamily: FONT,
      fontSize: '18px',
      color: TEXT_COLORS.main,
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4,
    })
    .setOrigin(1, 0.5);
  area.add(boardLabel);

  let board = 0;
  let shovels = 0;
  let found = 0;
  let missStreak = 0;
  let hint: { icon: Phaser.GameObjects.Image; tile: Tile } | undefined;
  let tiles: Tile[][] = [];
  const originX = (GAME_W - (COLS * TILE + (COLS - 1) * GAP)) / 2 + TILE / 2;
  const originY = GROUND_Y + 10 + TILE / 2;

  const updateShovels = (): void => {
    drawShovels(shovels);
    scene.tweens.add({ targets: shovelRow, scale: { from: 1.12, to: 1 }, duration: 140 });
  };

  const clearHint = (): void => {
    hint?.icon.destroy();
    hint = undefined;
  };

  /** まだ ほって いない お宝マスを 1つ、しばらく きらきら 光らせる */
  const showHint = (): void => {
    clearHint();
    const cands: Tile[] = [];
    tiles.forEach((row) =>
      row.forEach((t) => {
        if (!t.dug && t.treasure) cands.push(t);
      }),
    );
    if (cands.length === 0) return;
    const tile = Phaser.Utils.Array.GetRandom(cands);
    const icon = addIcon(scene, 0, -TILE / 4, 'star:gold', 30);
    tile.c.add(icon);
    scene.tweens.add({
      targets: icon,
      alpha: { from: 1, to: 0.3 },
      scale: { from: iconScale(icon), to: iconScale(icon) * 1.3 },
      duration: 360,
      yoyo: true,
      repeat: -1,
    });
    SFX.pop();
    hint = { icon, tile };
    scene.time.delayedCall(HINT_MS, () => {
      if (hint?.icon === icon) clearHint();
    });
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

  /** 盤面の おわり: さいごの 盤面なら セッションを とじ、まだなら 次の 盤面へ */
  const endOrNext = (delayMs: number): void => {
    scene.time.delayedCall(delayMs, () => {
      if (session.isEnded()) return;
      if (board >= BOARDS) session.finish();
      else newBoard();
    });
  };

  /** シャベル切れで 見つからなかった お宝を ふわっと 見せる(次の 推理の 学びに) */
  const revealTreasures = (): void => {
    tiles.forEach((row) =>
      row.forEach((t) => {
        if (t.dug || !t.treasure) return;
        const icon = addIcon(scene, 0, 0, targetIcon, 40).setAlpha(0);
        t.c.add(icon);
        scene.tweens.add({ targets: icon, alpha: 0.55, duration: 450 });
      }),
    );
  };

  const newBoard = (): void => {
    board++;
    found = 0;
    missStreak = 0;
    clearHint();
    boardLabel.setText(UI_TEXT.arcade.mineBoard(board, BOARDS));
    scene.tweens.add({ targets: boardLabel, scale: { from: 1.25, to: 1 }, duration: 200 });
    shovels = shovelsPerBoard;
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
    if (hint?.tile === t) clearHint();
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
      missStreak = 0;
      const icon = addIcon(scene, 0, 0, targetIcon, 44).setScale(0);
      t.c.add(icon);
      scene.tweens.add({ targets: icon, scale: iconScale(icon), ease: 'Back.easeOut', duration: 280 });
      burst(scene, wx, wy, 12);
      SFX.good();
      session.addPoints(TREASURE_PTS, wx, wy - 30, false);
      if (found >= TREASURES) {
        boardCleared();
        return;
      }
    } else {
      // 数字ヒント: まわり8マスの お宝の数
      const n = neighborCount(r, c);
      const hintText = scene.add
        .text(0, 0, `${n}`, {
          fontFamily: FONT,
          fontSize: '30px',
          color: HINT_COLORS[Math.min(n, 3)],
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScale(0);
      t.c.add(hintText);
      scene.tweens.add({ targets: hintText, scale: 1, ease: 'Back.easeOut', duration: 240 });
      SFX.bad();
      // はずれが つづいたら お宝マスを きらっと 教える(子供FB対応)
      missStreak++;
      if (missStreak >= HINT_MISS_STREAK) {
        missStreak = 0;
        showHint();
      }
    }
    // シャベル切れ: この 盤面は クリアならず。とった 点は そのまま、
    // のこりの お宝を 見せてから 次の 盤面へ(うしなう ものは ない)。
    // お宝を ほって シャベルが 0 に なった ときも ここを 通る ―
    // まえは 「はずれ」の ときだけ 見ていたので、最後の 1ぷりで お宝が 出ると
    // つぎの 掘り場が こないまま 盤面が 死んでいた
    if (shovels <= 0) {
      clearHint();
      revealTreasures();
      floatUp(
        scene,
        GAME_W / 2,
        400 + api.areaY,
        board >= BOARDS ? UI_TEXT.arcade.noShovelsEnd : UI_TEXT.arcade.noShovels,
        '#c04545',
      );
      endOrNext(1500);
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
    endOrNext(1000);
  };

  newBoard();
}

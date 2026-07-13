/* おまつりシーン(tier4・集大成): やたいラッシュを遊び、さいこうスコアに挑む。
   めいぶつは 開催のたびに 消費する(なんどでも 開催できる)。
   消費と fest 登録は ゲームを最後まで遊んだ finish() 時点で行う
   (とちゅうで もどっても なにも 失わない=成功保証) */
import Phaser from 'phaser';
import { findEntity, findPref, findRecipe, GAME_DATA, type Recipe } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { applyFestival, craftable, updateFestBest } from '../core/craft';
import { store } from '../game/store';
import { setHook } from '../game/testHooks';
import { SFX } from '../audio/sfx';
import { showTriviaOnce } from '../ui/trivia';
import { COLORS, DEPTH, FONT, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import { makeGuideRow, Modal } from '../ui/widgets';
import { confetti, firework, screenFlash } from '../ui/effects';
import { renderFestival, type StallItem } from './minigames/festivalGame';
import type { MinigameApi } from './minigames/types';

const TOP_H = 48;
const GAME_AREA_Y = TOP_H + 4;

export class FestivalScene extends Phaser.Scene {
  private recipeId = '';
  private prefId = '';
  private recipe!: Recipe;
  private gameScore = 0;
  private area?: Phaser.GameObjects.Container;

  constructor() {
    super('FestivalScene');
  }

  init(data: { recipeId: string; prefId: string }): void {
    this.recipeId = data.recipeId;
    this.prefId = data.prefId;
  }

  create(): void {
    const r = findRecipe(GAME_DATA, this.recipeId);
    // めいぶつが足りないまま直接呼ばれた場合の保険(PrefScene 側でも確認している)
    if (!r || !craftable(store.state.inv, r)) {
      this.scene.start('PrefScene', { prefId: this.prefId });
      return;
    }
    this.recipe = r;
    this.gameScore = 0;
    this.cameras.main.setBackgroundColor(0x243057);

    // ヘッダー(もどる=開催せずに帰る。なにも消費しない)
    const head = this.add.container(0, 0).setDepth(DEPTH.header);
    head.add(this.add.rectangle(GAME_W / 2, TOP_H / 2, GAME_W, TOP_H, COLORS.headerBg));
    const back = this.add
      .text(12, TOP_H / 2, UI_TEXT.session.back, {
        fontFamily: FONT,
        fontSize: '16px',
        color: TEXT_COLORS.good,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('PrefScene', { prefId: this.prefId }));
    head.add(back);
    head.add(
      this.add
        .text(GAME_W / 2 + 10, TOP_H / 2, `${r.emoji} ${r.name}`, {
          fontFamily: FONT,
          fontSize: '16px',
          color: TEXT_COLORS.main,
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    this.area = this.add.container(0, GAME_AREA_Y);
    renderFestival(this.minigameApi(), UI_TEXT.fest.prompt, this.buildMenu());
  }

  /** やたいの 品ぞろえ: recipe.menu(未指定なら ingredients)を解決する */
  private buildMenu(): StallItem[] {
    const refs = this.recipe.menu ?? this.recipe.ingredients.map((i) => i.ref);
    const items: StallItem[] = [];
    for (const ref of refs) {
      const e = findEntity(GAME_DATA, ref);
      if (e) items.push({ ref, emoji: e.emoji, name: e.name });
    }
    return items;
  }

  private minigameApi(): MinigameApi {
    return {
      scene: this,
      area: this.area!,
      areaY: GAME_AREA_Y,
      addScore: (n) => {
        this.gameScore += n;
      },
      advance: (delayMs) => {
        this.time.delayedCall(delayMs, () => this.finish());
      },
      feedback: () => undefined,
      sign: (text) => {
        const t = this.add
          .text(GAME_W / 2, 54, text, {
            fontFamily: FONT,
            fontSize: '14px',
            color: TEXT_COLORS.main,
            align: 'center',
            wordWrap: { width: 400 },
            backgroundColor: '#fff8e7',
            padding: { x: 12, y: 6 },
          })
          .setOrigin(0.5, 0)
          .setAlpha(0.95);
        this.area?.add(t);
        this.tweens.add({ targets: t, alpha: 0.25, delay: 4000, duration: 500 });
      },
      lockStar3: () => undefined, // おまつりは★なし(さいこうスコア制)
    };
  }

  /* ---------- 開催成立: 消費+登録+きろく更新+フィナーレ演出 ---------- */
  private finish(): void {
    setHook({ kind: 'done' });
    const r = this.recipe;
    applyFestival(store.state, r);
    const newRecord = updateFestBest(store.state, r.id, this.gameScore);
    store.save();

    SFX.fest();
    screenFlash(this, 0xfff2c4, 0.4);
    confetti(this);
    // はなび+ちょうちんが のぼる フィナーレ
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 350, () => firework(this, 50 + Math.random() * (GAME_W - 100), 120 + Math.random() * 140));
    }
    for (let i = 0; i < 8; i++) {
      const l = this.add
        .text(40 + Math.random() * (GAME_W - 80), GAME_H + 30, '🏮', { fontSize: '30px' })
        .setDepth(DEPTH.overlay);
      this.tweens.add({
        targets: l,
        y: -40,
        duration: 2200 + Math.random() * 800,
        delay: Math.random() * 900,
        ease: 'Sine.easeIn',
        onComplete: () => l.destroy(),
      });
    }

    this.time.delayedCall(1500, () => {
      const pref = findPref(GAME_DATA, this.prefId);
      const best = store.state.festBest[r.id] ?? this.gameScore;
      const modal = new Modal(this, UI_TEXT.fest.doneTitle);
      modal.add(this.add.text(0, 0, '🏮🎆🏮', { fontSize: '44px' }).setOrigin(0.5), 52);
      modal.addText(UI_TEXT.fest.doneBody(r.name), 18);
      modal.addText(UI_TEXT.session.scoreLine(this.gameScore), 17, TEXT_COLORS.accent);
      modal.addText(
        newRecord ? UI_TEXT.fest.newRecord : UI_TEXT.fest.bestScore(best),
        15,
        newRecord ? TEXT_COLORS.good : TEXT_COLORS.sub,
      );
      const guide = makeGuideRow(this, UI_TEXT.fest.doneGuide(pref?.name ?? ''), 'happy');
      modal.add(guide.container, guide.height);
      modal.addButton(UI_TEXT.fest.goMap, COLORS.orange, () => {
        modal.close();
        showTriviaOnce(this, r.id, () => this.scene.start('MapScene'));
      });
      modal.show();
    });
  }
}

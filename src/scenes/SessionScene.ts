/* そざい入手セッション: アーケードゲーム(45〜60秒)+ものしりクイズの2ステップ。
   どのゲームを使うかはデータ(harvest.engine 等)が決め、シーン側に品種分岐は書かない。
   ★はスコアの実力制(core/stars.ts)。ただし最低★1は保証 */
import Phaser from 'phaser';
import { findMaterial, findPref, GAME_DATA, type Material } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { ARCADE_TUNING, type ArcadeEngine } from '../data/arcadeTuning';
import { clearPlot, markCareDone, plotKey } from '../core/plots';
import { pickSessionQuiz } from '../core/quiz';
import { calcStars, harvestYield, totalScore } from '../core/stars';
import { markSanchiCompleteOnce, registerMaterial } from '../core/state';
import { store } from '../game/store';
import { setHook } from '../game/testHooks';
import { SFX } from '../audio/sfx';
import { buildQuizView } from '../ui/quizRunner';
import { showTriviaOnce } from '../ui/trivia';
import { COLORS, DEPTH, FONT, GAME_W, TEXT_COLORS } from '../ui/theme';
import { makeStarRow, Modal, showToast } from '../ui/widgets';
import { confetti, screenFlash } from '../ui/effects';
import { renderCatch } from './minigames/catchGame';
import { renderChain } from './minigames/chainGame';
import { renderMine } from './minigames/mineGame';
import { renderFish } from './minigames/fishGame';
import { renderFlick } from './minigames/flickGame';
import { renderDefense } from './minigames/defenseGame';
import type { MinigameApi } from './minigames/types';

export type SessionMode = 'instant' | 'harvest' | 'care';

const TOP_H = 48;
const GAME_AREA_Y = TOP_H + 4;

export class SessionScene extends Phaser.Scene {
  private matId = '';
  private prefId = '';
  private mode: SessionMode = 'instant';
  private material!: Material;
  private gameScore = 0;
  private quizCorrect = false;
  private phase: 'game' | 'quiz' | 'done' = 'game';
  private area?: Phaser.GameObjects.Container;

  constructor() {
    super('SessionScene');
  }

  init(data: { matId: string; prefId: string; mode: SessionMode }): void {
    this.matId = data.matId;
    this.prefId = data.prefId;
    this.mode = data.mode;
  }

  create(): void {
    const m = findMaterial(GAME_DATA, this.matId);
    const pref = findPref(GAME_DATA, this.prefId);
    if (!m || !pref) {
      this.scene.start('MapScene');
      return;
    }
    this.material = m;
    this.cameras.main.setBackgroundColor(COLORS.ground);
    this.gameScore = 0;
    this.quizCorrect = false;
    this.phase = 'game';

    // ヘッダー
    const g = m.gather;
    const title =
      this.mode === 'care'
        ? UI_TEXT.session.careTitle
        : this.mode === 'harvest'
          ? UI_TEXT.session.harvestTitle(m.emoji, m.name)
          : UI_TEXT.session.instantTitle(m.emoji, m.name, g.type === 'timing' || g.type === 'dig' ? g.verb : '');
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
        .text(GAME_W / 2 + 10, TOP_H / 2, title, {
          fontFamily: FONT,
          fontSize: '16px',
          color: TEXT_COLORS.main,
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    this.renderGame();
  }

  /** ミニゲーム側に渡す足場 */
  private minigameApi(): MinigameApi {
    return {
      scene: this,
      area: this.area!,
      areaY: GAME_AREA_Y,
      addScore: (n) => {
        this.gameScore += n;
      },
      advance: (delayMs) => {
        this.time.delayedCall(delayMs, () => {
          if (this.phase === 'game') {
            this.phase = 'quiz';
            this.renderQuiz();
          } else {
            this.phase = 'done';
            this.finish();
          }
        });
      },
      feedback: () => undefined, // アーケード側が自前で演出するため未使用
      sign: (text) => this.sign(text),
    };
  }

  /** 素材からアーケード種別を導出(データ駆動) */
  private engineOf(): ArcadeEngine {
    const g = this.material.gather;
    if (this.mode === 'care') return 'care';
    if (g.type === 'plant') return g.harvest.engine;
    if (g.type === 'dig') return 'mine';
    return 'fish'; // timing
  }

  private renderGame(): void {
    this.area?.destroy();
    this.area = this.add.container(0, GAME_AREA_Y);
    const api = this.minigameApi();
    const g = this.material.gather;
    const engine = this.engineOf();
    const targetEmoji = (g.type === 'plant' ? g.harvest.target : undefined) ?? this.material.emoji;
    const prompt =
      g.type === 'plant' ? g.harvest.prompt : g.type === 'dig' || g.type === 'timing' ? g.theme.prompt : '';

    if (engine === 'care' && g.type === 'plant') {
      renderDefense(api, this.material.emoji, g.care.target, g.care.label, () => undefined);
    } else if (engine === 'catch') {
      renderCatch(api, targetEmoji, prompt);
    } else if (engine === 'chain' || engine === 'reap') {
      renderChain(api, targetEmoji, prompt, engine === 'reap');
    } else if (engine === 'mine') {
      renderMine(api, prompt, this.material.emoji);
    } else if (engine === 'flick') {
      renderFlick(api, targetEmoji, prompt);
    } else {
      renderFish(api, prompt);
    }
  }

  private sign(text: string): void {
    if (!this.area) return;
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
    this.area.add(t);
    // 最初の数秒だけ見せて、じゃまにならないよう薄くする
    this.tweens.add({ targets: t, alpha: 0.25, delay: 4000, duration: 500 });
  }

  /* ---------- クイズステップ(スコアボーナス) ---------- */
  private renderQuiz(): void {
    if (this.mode === 'care') {
      this.finish();
      return;
    }
    this.area?.destroy();
    this.area = this.add.container(0, GAME_AREA_Y);
    this.cameras.main.setBackgroundColor(COLORS.ground);
    const quiz = pickSessionQuiz(GAME_DATA.quizzes, this.matId);
    if (!quiz) {
      this.finish();
      return;
    }
    const signText = this.add
      .text(GAME_W / 2, 20, UI_TEXT.session.quizSign, {
        fontFamily: FONT,
        fontSize: '15px',
        color: TEXT_COLORS.main,
        align: 'center',
        backgroundColor: '#fff8e7',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5, 0);
    this.area.add(signText);
    const view = buildQuizView(this, quiz, (ok, delay) => {
      this.quizCorrect = ok;
      this.time.delayedCall(delay, () => {
        this.phase = 'done';
        this.finish();
      });
    });
    view.container.setPosition(GAME_W / 2, 90);
    this.area.add(view.container);
  }

  /* ---------- セッション終了 ---------- */
  private finish(): void {
    setHook({ kind: 'done' });
    const s = store.state;
    if (this.mode === 'care') {
      markCareDone(s, this.matId, this.prefId);
      store.save();
      showToast(this, UI_TEXT.session.careDoneToast);
      this.scene.start('PrefScene', { prefId: this.prefId });
      return;
    }

    let careDone = false;
    if (this.mode === 'harvest') {
      careDone = s.plots[plotKey(this.prefId, this.matId)]?.careDone ?? false;
      clearPlot(s, this.matId, this.prefId);
    }
    const t = ARCADE_TUNING[this.engineOf()];
    const score = totalScore(this.gameScore, t, { quizCorrect: this.quizCorrect, careDone });
    const stars = calcStars(score, t);
    const yieldN = harvestYield(stars);
    registerMaterial(s, this.matId, this.prefId, stars, yieldN);
    const compNow = markSanchiCompleteOnce(s, this.material);
    store.save();

    if (compNow) {
      this.time.delayedCall(1200, () => {
        showToast(this, UI_TEXT.session.sanchiComp(this.material.name));
        SFX.fanfare();
      });
    }

    const g = this.material.gather;
    const successWord =
      (g.type === 'timing' || g.type === 'dig' ? g.theme.success : undefined) ??
      (g.type === 'plant' ? g.harvest.success : undefined) ??
      UI_TEXT.session.harvestSuccess;
    const note =
      stars === 3 ? UI_TEXT.session.star3Note : stars === 2 ? UI_TEXT.session.star2Note : UI_TEXT.session.star1Note;

    if (stars === 3) {
      screenFlash(this, 0xfff2c4, 0.35);
      confetti(this);
    }
    const modal = new Modal(this, UI_TEXT.session.resultTitle);
    modal.add(this.add.text(0, 0, this.material.emoji, { fontSize: '56px' }).setOrigin(0.5), 62);
    modal.addText(successWord, 18);
    modal.add(makeStarRow(this, stars), 48);
    modal.addText(UI_TEXT.session.scoreLine(score), 16, TEXT_COLORS.accent);
    modal.addText(`${UI_TEXT.session.gotItems(this.material.name, yieldN)}\n${note}`, 15, TEXT_COLORS.sub);
    modal.addButton(UI_TEXT.session.backBtn, COLORS.primary, () => {
      modal.close();
      showTriviaOnce(this, this.matId, () => this.scene.start('PrefScene', { prefId: this.prefId }));
    });
    modal.show();
  }
}

/* そざい入手セッション: pluck / dig / timing / whack / quiz のステップ実行。
   各ミニゲームの実体は scenes/minigames/ に分離。このシーンは
   進行(ステップ・ドット・スコア集計・★判定)の指揮役に専念する。
   せいこうは常に保証。できばえで★1〜3(core/stars.ts) */
import Phaser from 'phaser';
import { findMaterial, findPref, GAME_DATA, type Material } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { clearPlot, markCareDone, plotKey } from '../core/plots';
import { pickSessionQuiz } from '../core/quiz';
import {
  calcStars,
  harvestYield,
  sessionMaxBase,
  sessionPoints,
  type SessionStep,
} from '../core/stars';
import { markSanchiCompleteOnce, registerMaterial } from '../core/state';
import type { Quiz } from '../data/gameData';
import { store } from '../game/store';
import { setHook } from '../game/testHooks';
import { SFX } from '../audio/sfx';
import { buildQuizView } from '../ui/quizRunner';
import { showTriviaOnce } from '../ui/trivia';
import { COLORS, DEPTH, FONT, GAME_W, TEXT_COLORS } from '../ui/theme';
import { makeStarRow, Modal, showToast } from '../ui/widgets';
import { confetti } from '../ui/effects';
import { renderPluck } from './minigames/pluckGame';
import { renderDig } from './minigames/digGame';
import { renderTiming } from './minigames/timingGame';
import { renderWhack } from './minigames/whackGame';
import type { MinigameApi } from './minigames/types';

export type SessionMode = 'instant' | 'harvest' | 'care';

interface QuizStep extends SessionStep {
  kind: 'quiz';
  quiz: Quiz;
}

const TOP_H = 48;
const STAGE_Y = 130;
const GAME_AREA_Y = 210;
const GAME_AREA_H = 420;
const PLUCK_COUNT = 6;

export class SessionScene extends Phaser.Scene {
  private matId = '';
  private prefId = '';
  private mode: SessionMode = 'instant';
  private material!: Material;
  private steps: SessionStep[] = [];
  private idx = 0;
  private score = 0;
  private maxBase = 0;
  private area?: Phaser.GameObjects.Container;
  private dots: Phaser.GameObjects.Text[] = [];
  private stage?: Phaser.GameObjects.Text;

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
    this.idx = 0;
    this.score = 0;
    this.steps = this.buildSteps();
    this.maxBase = sessionMaxBase(this.steps);

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

    // 進行ドット+ステージ絵文字
    this.stage = this.add.text(GAME_W / 2, STAGE_Y, '', { fontSize: '64px' }).setOrigin(0.5);
    this.dots = [];
    for (let i = 0; i < this.steps.length; i++) {
      this.dots.push(
        this.add
          .text(GAME_W / 2 + (i - (this.steps.length - 1) / 2) * 26, STAGE_Y + 56, '●', {
            fontSize: '14px',
            color: '#ddd5c2',
          })
          .setOrigin(0.5),
      );
    }
    this.renderStep();
  }

  private buildSteps(): SessionStep[] {
    const g = this.material.gather;
    if (this.mode === 'care') return [{ kind: 'whack' }];
    if (this.mode === 'harvest' && g.type === 'plant') {
      return g.harvest.engine === 'dig'
        ? [{ kind: 'dig' }, { kind: 'dig' }, this.makeQuizStep()]
        : [{ kind: 'pluck' }, this.makeQuizStep()];
    }
    if (g.type === 'timing' || g.type === 'dig') {
      return [{ kind: g.type }, { kind: g.type }, { kind: g.type }, this.makeQuizStep()];
    }
    return [this.makeQuizStep()];
  }

  private makeQuizStep(): QuizStep {
    const quiz = pickSessionQuiz(GAME_DATA.quizzes, this.matId);
    if (!quiz) throw new Error(`quiz pool empty: ${this.matId}`);
    return { kind: 'quiz', quiz };
  }

  private stepAdvance(delayMs: number): void {
    this.time.delayedCall(delayMs, () => {
      this.idx++;
      this.renderStep();
    });
  }

  /** ミニゲーム側に渡す足場(スコア加算・進行・演出はここに集約) */
  private minigameApi(): MinigameApi {
    return {
      scene: this,
      area: this.area!,
      areaY: GAME_AREA_Y,
      addScore: (n) => {
        this.score += n;
      },
      advance: (delayMs) => this.stepAdvance(delayMs),
      feedback: (text, good) => this.feedback(text, good),
      sign: (text) => this.sign(text),
    };
  }

  private renderStep(): void {
    this.area?.destroy();
    this.area = this.add.container(0, GAME_AREA_Y);
    const total = this.steps.length;
    const g = this.material.gather;
    const themeStages =
      g.type === 'timing' || g.type === 'dig'
        ? g.theme.stages
        : this.mode === 'harvest'
          ? ['🧺', '🧺', '✨']
          : ['🌿', '🌿', '🌿'];
    const stageIdx = Math.min(2, Math.floor((this.idx / total) * 3));
    this.stage?.setText(this.idx >= total ? this.material.emoji : themeStages[stageIdx]);
    this.dots.forEach((d, i) =>
      d.setColor(i < this.idx ? '#6fbf44' : i === this.idx ? '#ff9f40' : '#ddd5c2'),
    );

    if (this.idx >= total) {
      this.finish();
      return;
    }
    const st = this.steps[this.idx];
    const api = this.minigameApi();
    if (st.kind === 'quiz') this.renderQuizStep(st as QuizStep);
    else if (st.kind === 'timing' && g.type === 'timing') renderTiming(api, g.theme);
    else if (st.kind === 'dig') {
      const prompt = g.type === 'dig' ? g.theme.prompt : g.type === 'plant' ? g.harvest.prompt : '';
      renderDig(api, prompt, this.material.emoji);
    } else if (st.kind === 'pluck' && g.type === 'plant') {
      renderPluck(api, g.harvest.target ?? this.material.emoji, g.harvest.prompt, PLUCK_COUNT);
    } else if (st.kind === 'whack' && g.type === 'plant') {
      renderWhack(api, g.care);
    }
  }

  private sign(text: string): void {
    if (!this.area) return;
    const t = this.add
      .text(GAME_W / 2, 0, text, {
        fontFamily: FONT,
        fontSize: '15px',
        color: TEXT_COLORS.main,
        align: 'center',
        wordWrap: { width: 380 },
        backgroundColor: '#fff8e7',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5, 0);
    this.area.add(t);
  }

  private feedback(text: string, good: boolean): void {
    if (!this.area) return;
    const t = this.add
      .text(GAME_W / 2, GAME_AREA_H - 30, text, {
        fontFamily: FONT,
        fontSize: '17px',
        color: good ? TEXT_COLORS.good : TEXT_COLORS.accent,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.area.add(t);
  }

  /* ---------- クイズステップ ---------- */
  private renderQuizStep(st: QuizStep): void {
    this.sign(UI_TEXT.session.quizSign);
    const view = buildQuizView(this, st.quiz, (ok, delay) => {
      if (ok) this.score++;
      this.stepAdvance(delay);
    });
    view.container.setPosition(GAME_W / 2, 60);
    this.area?.add(view.container);
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
    const pts = sessionPoints(this.score, careDone);
    const stars = calcStars(pts, this.maxBase);
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

    if (stars === 3) confetti(this);
    const modal = new Modal(this, UI_TEXT.session.resultTitle);
    modal.add(this.add.text(0, 0, this.material.emoji, { fontSize: '56px' }).setOrigin(0.5), 62);
    modal.addText(successWord, 18);
    modal.add(makeStarRow(this, stars), 48);
    modal.addText(`${UI_TEXT.session.gotItems(this.material.name, yieldN)}\n${note}`, 15, TEXT_COLORS.sub);
    modal.addButton(UI_TEXT.session.backBtn, COLORS.primary, () => {
      modal.close();
      showTriviaOnce(this, this.matId, () => this.scene.start('PrefScene', { prefId: this.prefId }));
    });
    modal.show();
  }
}

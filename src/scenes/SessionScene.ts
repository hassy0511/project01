/* そざい入手セッション: pluck / dig / timing / whack / quiz のステップ実行。
   せいこうは常に保証。できばえで★1〜3(core/stars.ts) */
import Phaser from 'phaser';
import { findMaterial, findPref, GAME_DATA, type Material } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { clearPlot, markCareDone, plotKey } from '../core/plots';
import { pickSessionQuiz } from '../core/quiz';
import {
  calcStars,
  harvestYield,
  pluckPoints,
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
import { makeButton, makeStarRow, Modal, showToast } from '../ui/widgets';

export type SessionMode = 'instant' | 'harvest' | 'care';

interface QuizStep extends SessionStep {
  kind: 'quiz';
  quiz: Quiz;
}

const TOP_H = 48;
const STAGE_Y = 130;
const GAME_AREA_Y = 210;
const GAME_AREA_H = 420;

const TIMING_TICK_MS = 25;
const TIMING_SPEED = 0.11;
const TIMING_PERFECT = [42, 58] as const;
const TIMING_GOOD = [30, 70] as const;
const DIG_HINT_MS = 900;
const PLUCK_COUNT = 6;
const WHACK_TOTAL = 5;
const WHACK_INTERVAL_MS = 1400;

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
    if (st.kind === 'quiz') this.renderQuizStep(st as QuizStep);
    else if (st.kind === 'timing') this.renderTimingStep();
    else if (st.kind === 'dig') this.renderDigStep();
    else if (st.kind === 'pluck') this.renderPluckStep();
    else if (st.kind === 'whack') this.renderWhackStep();
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

  /* ---------- タイミングゲーム(いわし漁など) ---------- */
  private renderTimingStep(): void {
    const g = this.material.gather;
    if (g.type !== 'timing') return;
    const th = g.theme;
    this.sign(th.prompt);

    const trackY = 150;
    const trackW = 360;
    const gfx = this.add.graphics();
    gfx.fillStyle(COLORS.barBg, 1);
    gfx.fillRoundedRect(GAME_W / 2 - trackW / 2, trackY - 14, trackW, 28, 14);
    gfx.fillStyle(0xbfe3a8, 1);
    gfx.fillRoundedRect(
      GAME_W / 2 - trackW / 2 + (trackW * TIMING_GOOD[0]) / 100,
      trackY - 14,
      (trackW * (TIMING_GOOD[1] - TIMING_GOOD[0])) / 100,
      28,
      14,
    );
    gfx.fillStyle(0x8ed46f, 1);
    gfx.fillRect(
      GAME_W / 2 - trackW / 2 + (trackW * TIMING_PERFECT[0]) / 100,
      trackY - 14,
      (trackW * (TIMING_PERFECT[1] - TIMING_PERFECT[0])) / 100,
      28,
    );
    this.area?.add(gfx);
    const marker = this.add.text(GAME_W / 2, trackY, th.marker, { fontSize: '30px' }).setOrigin(0.5);
    this.area?.add(marker);

    let pos = 0;
    let t = Math.random() * Math.PI * 2;
    let stopped = false;
    setHook({ kind: 'timing', pos });
    const timer = this.time.addEvent({
      delay: TIMING_TICK_MS,
      loop: true,
      callback: () => {
        t += TIMING_SPEED;
        pos = 50 + 50 * Math.sin(t);
        marker.x = GAME_W / 2 - trackW / 2 + (trackW * pos) / 100;
        setHook({ kind: 'timing', pos });
      },
    });

    const stopBtn = makeButton(this, {
      x: GAME_W / 2,
      y: 260,
      w: 220,
      h: 54,
      label: th.stopBtn,
      color: COLORS.orange,
      onClick: () => {
        if (stopped) return;
        stopped = true;
        timer.remove();
        const perfect = pos >= TIMING_PERFECT[0] && pos <= TIMING_PERFECT[1];
        const good = pos >= TIMING_GOOD[0] && pos <= TIMING_GOOD[1];
        if (perfect) {
          this.score++;
          this.feedback(UI_TEXT.session.timingPerfect, true);
          SFX.good();
        } else if (good) {
          this.score++;
          this.feedback(UI_TEXT.session.timingGood, true);
          SFX.good();
        } else {
          this.feedback(UI_TEXT.session.timingMiss, false);
          SFX.bad();
        }
        this.stepAdvance(good ? 750 : 1300);
      },
    });
    this.area?.add(stopBtn);
  }

  /* ---------- ほりあてゲーム(ねんど・いもほり) ---------- */
  private renderDigStep(): void {
    const g = this.material.gather;
    const prompt = g.type === 'dig' ? g.theme.prompt : g.type === 'plant' ? g.harvest.prompt : '';
    this.sign(prompt);

    const cell = Math.floor(Math.random() * 9);
    setHook({ kind: 'dig', cell });
    const size = 96;
    const gap = 10;
    const originX = GAME_W / 2 - (size * 3 + gap * 2) / 2 + size / 2;
    const originY = 120;
    let answered = false;
    let hintOn = true;
    const cells: Phaser.GameObjects.Container[] = [];

    for (let i = 0; i < 9; i++) {
      const cx = originX + (i % 3) * (size + gap);
      const cy = originY + Math.floor(i / 3) * (size + gap);
      const c = this.add.container(cx, cy);
      const bg = this.add.graphics();
      bg.fillStyle(0xd8c49a, 1);
      bg.lineStyle(2, 0xb89b6a, 1);
      bg.fillRoundedRect(-size / 2, -size / 2, size, size, 12);
      bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 12);
      const label = this.add.text(0, 0, i === cell ? '✨' : '', { fontSize: '34px' }).setOrigin(0.5);
      c.add([bg, label]);
      c.setSize(size, size);
      c.setInteractive({ useHandCursor: true });
      c.on('pointerup', () => {
        if (answered || hintOn) return;
        answered = true;
        const ok = i === cell;
        if (ok) {
          label.setText(this.material.emoji);
          this.score++;
          SFX.good();
        } else {
          label.setText('🕳️');
          (cells[cell].list[1] as Phaser.GameObjects.Text).setText(this.material.emoji);
          this.feedback(UI_TEXT.session.digHere, false);
          SFX.bad();
        }
        this.stepAdvance(ok ? 750 : 1400);
      });
      cells.push(c);
      this.area?.add(c);
    }
    this.time.delayedCall(DIG_HINT_MS, () => {
      hintOn = false;
      (cells[cell].list[1] as Phaser.GameObjects.Text).setText('');
    });
  }

  /* ---------- ぽんぽん摘みゲーム(収穫アクション) ---------- */
  private renderPluckStep(): void {
    const g = this.material.gather;
    if (g.type !== 'plant') return;
    this.sign(g.harvest.prompt);

    let left = PLUCK_COUNT;
    setHook({ kind: 'pluck', remaining: left });
    const t0 = Date.now();
    for (let i = 0; i < PLUCK_COUNT; i++) {
      const x = 60 + Math.random() * (GAME_W - 120);
      const y = 110 + Math.random() * 250;
      const b = this.add
        .text(x, y, g.harvest.target ?? this.material.emoji, { fontSize: '40px' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      this.tweens.add({
        targets: b,
        scale: { from: 0.92, to: 1.08 },
        yoyo: true,
        repeat: -1,
        duration: 600,
        delay: Math.random() * 800,
      });
      b.on('pointerup', () => {
        if (!b.visible) return;
        b.setVisible(false);
        SFX.pop();
        left--;
        setHook({ kind: 'pluck', remaining: left });
        if (left === 0) {
          const pts = pluckPoints(Date.now() - t0);
          this.score += pts;
          this.feedback(pts === 2 ? UI_TEXT.session.pluckFast : UI_TEXT.session.pluckDone, true);
          this.stepAdvance(800);
        }
      });
      this.area?.add(b);
    }
  }

  /* ---------- おせわチャンス(タップ撃退) ---------- */
  private renderWhackStep(): void {
    const g = this.material.gather;
    if (g.type !== 'plant') return;
    const th = g.care;
    this.sign(`${th.target} ${th.label}`);

    let shown = 0;
    let hits = 0;
    let active: Phaser.GameObjects.Text | null = null;
    const spawn = (): void => {
      active?.destroy();
      active = null;
      if (shown >= WHACK_TOTAL) {
        timer.remove();
        this.feedback(hits > 0 ? UI_TEXT.session.whackDone : UI_TEXT.session.whackEnd, true);
        this.stepAdvance(800);
        return;
      }
      shown++;
      const b = this.add
        .text(60 + Math.random() * (GAME_W - 120), 110 + Math.random() * 250, th.target, { fontSize: '42px' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      b.on('pointerup', () => {
        if (!b.visible) return;
        b.setVisible(false);
        SFX.pop();
        hits++;
        showToast(this, UI_TEXT.session.whackTap);
      });
      this.area?.add(b);
      active = b;
    };
    spawn();
    const timer = this.time.addEvent({ delay: WHACK_INTERVAL_MS, loop: true, callback: spawn });
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

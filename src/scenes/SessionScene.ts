/* そざい入手セッション: アーケードゲーム(45〜60秒)+ものしりクイズの2ステップ。
   どのゲームを使うかはデータ(harvest.engine 等)が決め、シーン側に品種分岐は書かない。
   ★はスコアの実力制(core/stars.ts)。ただし最低★1は保証 */
import Phaser from 'phaser';
import { setupHiDpi } from '../ui/display';
import { findMaterial, findPref, GAME_DATA, type Material } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { ARCADE_TUNING, type ArcadeEngine } from '../data/arcadeTuning';
import { clearPlot, markCareDone, plotKey } from '../core/plots';
import { pickSessionQuiz, recordQuizAsked } from '../core/quiz';
import { calcStars, harvestYield, totalScore } from '../core/stars';
import { markSanchiCompleteOnce, registerMaterial } from '../core/state';
import { store } from '../game/store';
import { setHook } from '../game/testHooks';
import { buildQuizView } from '../ui/quizRunner';
import { showTriviaOnce } from '../ui/trivia';
import { COLORS, DEPTH, FONT, GAME_W, TEXT_COLORS } from '../ui/theme';
import { makeStarRow, Modal, swallowPointer } from '../ui/widgets';
import { confetti, screenFlash } from '../ui/effects';
import { applyBgArt, bgNameOf } from '../ui/bgArt';
import { addHelpButton, showHowTo, type HowToHandle } from '../ui/howto';
import { addIcon } from '../ui/icons';
import { renderCatch } from './minigames/catchGame';
import { renderChain } from './minigames/chainGame';
import { renderReap } from './minigames/reapGame';
import { renderPluck } from './minigames/pluckGame';
import { renderRhythm } from './minigames/rhythmGame';
import { renderSweep } from './minigames/sweepGame';
import { renderScoop } from './minigames/scoopGame';
import { renderShell } from './minigames/shellGame';
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
  private star3Locked = false;
  private phase: 'game' | 'quiz' | 'done' = 'game';
  private area?: Phaser.GameObjects.Container;
  /** ヘッダーの「もどる」。けっかの モーダルが 出たら かくす(おしても なにも おきない ボタンを のこさない) */
  private backBtn?: Phaser.GameObjects.Text;
  /** あそびかたの ゆびマーク(クイズに すすむ ときに 止める) */
  private howto?: HowToHandle;
  /** あそびかたの 「?」。クイズでは 消す(ゲームの 説明を 出しても まぎらわしい) */
  private helpBtn?: Phaser.GameObjects.Image;

  constructor() {
    super('SessionScene');
  }

  init(data: { matId: string; prefId: string; mode: SessionMode }): void {
    this.matId = data.matId;
    this.prefId = data.prefId;
    this.mode = data.mode;
  }

  create(): void {
    setupHiDpi(this);
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
    this.star3Locked = false;
    this.phase = 'game';

    // ヘッダー
    const g = m.gather;
    const title =
      this.mode === 'care'
        ? UI_TEXT.session.careTitle
        : this.mode === 'harvest'
          ? UI_TEXT.session.harvestTitle('', m.name)
          : UI_TEXT.session.instantTitle('', m.name, g.type === 'timing' || g.type === 'dig' ? g.verb : '');
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
    // 「もどる」の タップも ゲームに ながさない(ミニゲームは scene.input 直づけ)
    swallowPointer(back);
    back.on('pointerup', () => this.scene.start('PrefScene', { prefId: this.prefId }));
    head.add(back);
    this.backBtn = back;
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
      lockStar3: (locked) => {
        this.star3Locked = locked;
      },
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
    // ミニゲームには 「絵」ではなく **アイコンキー** を わたす(絵文字は つかわない)
    const targetIcon = (g.type === 'plant' ? g.harvest.targetIcon : undefined) ?? this.material.icon;
    const prompt =
      g.type === 'plant' ? g.harvest.prompt : g.type === 'dig' || g.type === 'timing' ? g.theme.prompt : '';
    // そだちの とちゅうの すがた(データに あれば つかう)
    const ripen: { unripeIcon?: string; turningIcon?: string } = g.type === 'plant' ? g.harvest : {};

    if (engine === 'care' && g.type === 'plant') {
      renderDefense(api, this.material.icon, g.care.targetIcon, g.care.label, () => undefined);
    } else if (engine === 'catch') {
      renderCatch(api, targetIcon, prompt);
    } else if (engine === 'chain') {
      renderChain(api, targetIcon, prompt, { unripe: ripen.unripeIcon, turning: ripen.turningIcon });
    } else if (engine === 'reap') {
      renderReap(api, targetIcon, prompt);
    } else if (engine === 'pluck') {
      renderPluck(api, targetIcon, prompt, ripen.unripeIcon);
    } else if (engine === 'rhythm') {
      renderRhythm(api, targetIcon, prompt);
    } else if (engine === 'sweep') {
      renderSweep(api, targetIcon, prompt);
    } else if (engine === 'scoop') {
      renderScoop(api, targetIcon, prompt);
    } else if (engine === 'shell') {
      renderShell(api, targetIcon, prompt);
    } else if (engine === 'mine') {
      renderMine(api, prompt, this.material.icon);
    } else if (engine === 'flick') {
      renderFlick(api, targetIcon, prompt);
    } else {
      renderFish(api, prompt);
    }

    // 手描きの 背景が あれば 差しかえる(public/art/bg/bg-<エンジン名>.svg)。
    // なければ 上の ミニゲームが 描いた コード背景の まま
    applyBgArt(this, this.area, bgNameOf(engine));

    // あそびかたの ゆびマーク(データに ある ゲームだけ)。字が 読めなくても わかるように
    this.howto?.stop();
    this.howto = showHowTo(this, engine, GAME_AREA_Y);
    // 忘れた ときの 見なおし口。説明文は データの 案内文を そのまま つかう
    const helpText = engine === 'care' && g.type === 'plant' ? g.care.label : prompt;
    this.helpBtn?.destroy();
    this.helpBtn = addHelpButton(this, GAME_W - 28, TOP_H / 2, UI_TEXT.howto.title, helpText, this.howto);
    store.state.playedGame[engine] = true;
    store.save();
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
    this.howto?.stop();
    this.howto = undefined;
    this.helpBtn?.destroy();
    this.helpBtn = undefined;
    if (this.mode === 'care') {
      this.finish();
      return;
    }
    this.area?.destroy();
    this.area = this.add.container(0, GAME_AREA_Y);
    this.cameras.main.setBackgroundColor(COLORS.ground);
    const quiz = pickSessionQuiz(GAME_DATA.quizzes, this.matId, store.state.quizRecent);
    if (!quiz) {
      this.finish();
      return;
    }
    recordQuizAsked(store.state.quizRecent, quiz.id);
    store.save();
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
      // しらせは 県ページで 出す。ここで showToast すると 次の 行の
      // scene.start で この シーンごと 消え、1フレームも 見えないまま
      // 「おせわ できた」の 手ごたえが 無く なる
      this.scene.start('PrefScene', {
        prefId: this.prefId,
        toast: UI_TEXT.session.careDoneToast,
      });
      return;
    }

    let careDone = false;
    if (this.mode === 'harvest') {
      careDone = s.plots[plotKey(this.prefId, this.matId)]?.careDone ?? false;
      clearPlot(s, this.matId, this.prefId);
    }
    const t = ARCADE_TUNING[this.engineOf()];
    const score = totalScore(this.gameScore, t, { quizCorrect: this.quizCorrect, careDone });
    let stars = calcStars(score, t);
    const bossBlocked = this.star3Locked && stars === 3;
    if (bossBlocked) stars = 2; // ★3はゲーム固有条件(ぬし等)を満たさないと取れない
    const yieldN = harvestYield(stars);
    registerMaterial(s, this.matId, this.prefId, stars, yieldN);
    const compNow = markSanchiCompleteOnce(s, this.material);
    store.save();

    const g = this.material.gather;
    const successWord =
      (g.type === 'timing' || g.type === 'dig' ? g.theme.success : undefined) ??
      (g.type === 'plant' ? g.harvest.success : undefined) ??
      UI_TEXT.session.harvestSuccess;
    const note = bossBlocked
      ? UI_TEXT.session.bossNote
      : stars === 3
        ? UI_TEXT.session.star3Note
        : stars === 2
          ? UI_TEXT.session.star2Note
          : UI_TEXT.session.star1Note;

    if (stars === 3) {
      screenFlash(this, 0xfff2c4, 0.35);
      confetti(this);
    }
    // けっかが 出たら ヘッダーの もどるは かくす(モーダルが 下を ふさぐので おせない)
    this.backBtn?.setVisible(false).disableInteractive();
    // クイズの ばんめんを かたづける(モーダルの したに もんだいが のこると ごちゃごちゃする)
    this.area?.destroy();
    this.area = undefined;
    const modal = new Modal(this, UI_TEXT.session.resultTitle);
    modal.add(addIcon(this, 0, 0, this.material.icon, 58), 62);
    modal.addText(successWord, 18);
    modal.add(makeStarRow(this, stars), 48);
    modal.addText(UI_TEXT.session.scoreLine(score), 16, TEXT_COLORS.accent);
    modal.addText(`${UI_TEXT.session.gotItems(this.material.name, yieldN)}\n${note}`, 15, TEXT_COLORS.sub);
    modal.addButton(UI_TEXT.session.backBtn, COLORS.primary, () => {
      modal.close();
      // 産地コンプの お祝いも 県ページで 出す。
      // まえは 1.2秒後の delayedCall だったので、子供が それより 早く
      // 「もどる」を おすと Clock ごと 消えて 一生 見られなかった
      // (フラグは もう 立って いる ので 二度と 出ない)
      showTriviaOnce(this, this.matId, () =>
        this.scene.start('PrefScene', {
          prefId: this.prefId,
          toast: compNow ? UI_TEXT.session.sanchiComp(this.material.name) : undefined,
          fanfare: compNow,
        }),
      );
    });
    modal.show();
  }
}

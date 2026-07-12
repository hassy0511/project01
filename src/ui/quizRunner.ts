/* クイズ出題UI(モーダル版=開拓・レシピ探索/埋め込み版=セッション内)。
   まちがえても すすめる(せいかいを おしえる)。選択肢は毎回シャッフル */
import Phaser from 'phaser';
import type { Quiz } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { shuffledChoiceOrder } from '../core/quiz';
import { SFX } from '../audio/sfx';
import { getMapAsset } from '../game/mapData';
import { setHook } from '../game/testHooks';
import { COLORS, FONT, TEXT_COLORS } from './theme';
import { makeButton, Modal, setButtonStyle } from './widgets';

const CHOICE_W = 340;
const CHOICE_H = 46;
const ANSWER_DELAY_OK = 800;
const ANSWER_DELAY_NG = 1600;

/** 形クイズ・位置クイズの図(中心原点)。該当しないクイズなら null */
export function buildQuizVisual(
  scene: Phaser.Scene,
  quiz: Quiz,
): { container: Phaser.GameObjects.Container; height: number } | null {
  if (quiz.type !== 'shape' && quiz.type !== 'position') return null;
  const map = getMapAsset();
  const target = quiz.tags[0];
  const c = scene.add.container(0, 0);

  if (quiz.type === 'shape') {
    const box = map.boxes[target];
    const poly = map.polys[target];
    if (!box || !poly) return null;
    const H = 170;
    const scale = Math.min(300 / box.w, H / box.h);
    const g = scene.add.graphics();
    g.fillStyle(0x8fcb6b, 1);
    g.lineStyle(3, COLORS.primaryDark, 1);
    const pts = poly.map((p) => new Phaser.Geom.Point((p.x - box.x - box.w / 2) * scale, (p.y - box.y - box.h / 2) * scale));
    g.fillPoints(pts, true);
    g.strokePoints(pts, true);
    c.add(g);
    return { container: c, height: H + 10 };
  }

  // position: ミニ地図で対象県を光らせる
  const H = 210;
  const scale = Math.min(220 / map.viewW, H / map.viewH);
  const g = scene.add.graphics();
  for (const [id, poly] of Object.entries(map.polys)) {
    const hit = id === target;
    g.fillStyle(hit ? COLORS.orange : 0xede9dd, 1);
    g.lineStyle(2, 0xffffff, 1);
    const pts = poly.map(
      (p) => new Phaser.Geom.Point((p.x - map.viewW / 2) * scale, (p.y - map.viewH / 2) * scale),
    );
    g.fillPoints(pts, true);
    g.strokePoints(pts, true);
  }
  c.add(g);
  return { container: c, height: H + 10 };
}

export interface QuizViewHandle {
  container: Phaser.GameObjects.Container;
  height: number;
}

/**
 * 1問ぶんの出題ビュー(質問+視覚+選択肢)を組み立てる(上端中心原点)。
 * 回答後は正解を示し、onAnswered(ok, delayMs) を呼ぶ(遷移は呼び出し側)。
 */
export function buildQuizView(
  scene: Phaser.Scene,
  quiz: Quiz,
  onAnswered: (ok: boolean, delayMs: number) => void,
): QuizViewHandle {
  const c = scene.add.container(0, 0);
  let cursor = 0;
  setHook({ kind: 'quiz', correctText: quiz.choices[quiz.answer], choices: quiz.choices });

  const visual = buildQuizVisual(scene, quiz);
  if (visual) {
    visual.container.setPosition(0, cursor + visual.height / 2);
    c.add(visual.container);
    cursor += visual.height + 8;
  }

  const q = scene.add
    .text(0, 0, quiz.q, {
      fontFamily: FONT,
      fontSize: '18px',
      color: TEXT_COLORS.main,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 380 },
      lineSpacing: 6,
    })
    .setOrigin(0.5, 0);
  q.setPosition(0, cursor);
  c.add(q);
  cursor += q.height + 14;

  let answered = false;
  const buttons: { btn: Phaser.GameObjects.Container; choiceIdx: number }[] = [];
  const hintY = cursor + 3 * (CHOICE_H + 10) + 4;

  for (const [row, ci] of shuffledChoiceOrder(quiz).entries()) {
    const btn = makeButton(scene, {
      x: 0,
      y: cursor + CHOICE_H / 2 + row * (CHOICE_H + 10),
      w: CHOICE_W,
      h: CHOICE_H,
      label: quiz.choices[ci],
      color: COLORS.panel,
      textColor: TEXT_COLORS.main,
      fontSize: 17,
    });
    const g = btn.list[0] as Phaser.GameObjects.Graphics;
    g.lineStyle(2, COLORS.panelLine, 1);
    g.strokeRoundedRect(-CHOICE_W / 2, -CHOICE_H / 2, CHOICE_W, CHOICE_H, 14);
    btn.on('pointerup', () => {
      if (answered) return;
      answered = true;
      const ok = ci === quiz.answer;
      const label = btn.list[1] as Phaser.GameObjects.Text;
      if (ok) {
        setButtonStyle(btn, CHOICE_W, CHOICE_H, COLORS.correct);
        label.setColor(TEXT_COLORS.white);
        SFX.good();
      } else {
        setButtonStyle(btn, CHOICE_W, CHOICE_H, COLORS.wrong);
        label.setColor(TEXT_COLORS.white);
        SFX.bad();
        const right = buttons.find((b) => b.choiceIdx === quiz.answer);
        if (right) {
          setButtonStyle(right.btn, CHOICE_W, CHOICE_H, COLORS.correct);
          (right.btn.list[1] as Phaser.GameObjects.Text).setColor(TEXT_COLORS.white);
        }
        const hint = scene.add
          .text(0, hintY, UI_TEXT.quiz.answerIs(quiz.choices[quiz.answer]), {
            fontFamily: FONT,
            fontSize: '15px',
            color: TEXT_COLORS.accent,
          })
          .setOrigin(0.5, 0);
        c.add(hint);
      }
      onAnswered(ok, ok ? ANSWER_DELAY_OK : ANSWER_DELAY_NG);
    });
    c.add(btn);
    buttons.push({ btn, choiceIdx: ci });
  }
  cursor += 3 * (CHOICE_H + 10) + 30; // ヒント表示ぶんの余白込み

  return { container: c, height: cursor };
}

/** モーダルでクイズを連続出題する(開拓・レシピ探索用) */
export function runQuizModal(
  scene: Phaser.Scene,
  quizzes: Quiz[],
  title: string,
  onDone: (correct: number) => void,
): void {
  let i = 0;
  let score = 0;
  const step = (): void => {
    if (i >= quizzes.length) {
      Modal.closeCurrent();
      onDone(score);
      return;
    }
    const quiz = quizzes[i];
    const modal = new Modal(scene, title);
    modal.addText(UI_TEXT.quiz.progress(i + 1, quizzes.length), 13, TEXT_COLORS.sub);
    const view = buildQuizView(scene, quiz, (ok, delay) => {
      if (ok) score++;
      scene.time.delayedCall(delay, () => {
        i++;
        step();
      });
    });
    // buildQuizView は上端原点なので、高さぶんの箱として積む
    const wrap = scene.add.container(0, 0);
    wrap.add(view.container);
    view.container.setPosition(0, -view.height / 2);
    modal.add(wrap, view.height);
    modal.show();
  };
  step();
}

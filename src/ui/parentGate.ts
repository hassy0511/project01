/* 保護者ゲート: 大人向けの確認モーダル(2桁×1桁の かけ算+テンキー入力)。
   ・文言は意図的に漢字表記(ひらがな中心ルールの例外。子供に読めなくするため)
   ・計算は九九を超える範囲(12〜49 × 3〜9)で、未就学〜低学年には突破できない難度にする
   ・window.prompt / confirm は使わない(WebView・ストア審査対応)
   3回まちがえると閉じる。突破しても何も失わない(リセット等は先のメニューで再確認) */
import Phaser from 'phaser';
import { SFX } from '../audio/sfx';
import { UI_TEXT } from '../data/uiText';
import { COLORS, TEXT_COLORS } from './theme';
import { makeButton, Modal } from './widgets';

const MAX_WRONG = 3;
const KEY_W = 108;
const KEY_H = 52;
const KEY_GAP = 10;

export function showParentGate(scene: Phaser.Scene, onPass: () => void): void {
  let a = 0;
  let b = 0;
  let entered = '';
  let wrong = 0;
  let errText: Phaser.GameObjects.Text | null = null;

  const newQuestion = (): void => {
    a = 12 + Math.floor(Math.random() * 38); // 12〜49
    b = 3 + Math.floor(Math.random() * 7); // 3〜9
    entered = '';
  };
  newQuestion();

  const modal = new Modal(scene, UI_TEXT.settings.gateTitle, true);
  modal.addText(UI_TEXT.settings.gateBody, 15, TEXT_COLORS.sub);
  const qText = modal.addText(UI_TEXT.settings.gateQuestion(a, b, entered), 28);
  const refresh = (): void => {
    qText.setText(UI_TEXT.settings.gateQuestion(a, b, entered));
  };

  const submit = (): void => {
    if (entered !== '' && parseInt(entered, 10) === a * b) {
      modal.close();
      onPass();
      return;
    }
    wrong++;
    SFX.bad();
    if (wrong >= MAX_WRONG) {
      modal.close();
      return;
    }
    errText?.setText(UI_TEXT.settings.gateWrong);
    scene.tweens.add({
      targets: qText,
      x: { from: -10, to: 10 },
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => qText.setX(0),
    });
    newQuestion();
    refresh();
  };

  const press = (key: string): void => {
    if (key === UI_TEXT.settings.gateKeyDel) {
      entered = entered.slice(0, -1);
    } else if (key === UI_TEXT.settings.gateKeyOk) {
      submit();
      return;
    } else if (entered.length < 3) {
      entered += key;
    }
    refresh();
  };

  // テンキー(3列×4行)
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [UI_TEXT.settings.gateKeyDel, '0', UI_TEXT.settings.gateKeyOk],
  ];
  const pad = scene.add.container(0, 0);
  const padH = rows.length * (KEY_H + KEY_GAP) - KEY_GAP;
  rows.forEach((row, r) => {
    row.forEach((key, c) => {
      pad.add(
        makeButton(scene, {
          x: (c - 1) * (KEY_W + KEY_GAP),
          y: -padH / 2 + KEY_H / 2 + r * (KEY_H + KEY_GAP),
          w: KEY_W,
          h: KEY_H,
          label: key,
          color: key === UI_TEXT.settings.gateKeyOk ? COLORS.primary : COLORS.gray,
          onClick: () => press(key),
        }),
      );
    });
  });
  modal.add(pad, padH);
  errText = modal.addText(' ', 13, '#c04545');
  modal.show();
}

/* ぼんぼりの 説明モーダル。
   子供FB「きんの ぼんぼりの コンプの しかたが わからない」への 手あて。
   どう→ぎん→きんの 条件を、実さいの めやす点(FEST_RANK_DEFAULT)と いっしょに 見せる。
   エリア画面の ぼんぼりカウンタを おすと ひらく */
import type Phaser from 'phaser';
import { BONBORI_COLOR, FEST_RANK_DEFAULT } from '../core/bonbori';
import { UI_TEXT } from '../data/uiText';
import { COLORS, FONT, TEXT_COLORS } from './theme';
import { addIcon } from './icons';
import { Modal } from './widgets';

const ROW_H = 36;
const ICON_X = -150;
const TEXT_X = -124;

export function showBonboriHelp(scene: Phaser.Scene): void {
  const modal = new Modal(scene, UI_TEXT.fest.bonbori.title, true);
  modal.addText(UI_TEXT.fest.bonbori.intro, 15);

  const row = (color: string, text: string): void => {
    const c = scene.add.container(0, 0);
    c.add(addIcon(scene, ICON_X, 0, `lantern:${color}`, 28));
    c.add(
      scene.add
        .text(TEXT_X, 0, text, {
          fontFamily: FONT,
          fontSize: '15px',
          color: TEXT_COLORS.main,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5),
    );
    modal.add(c, ROW_H);
  };
  row(BONBORI_COLOR.copper, UI_TEXT.fest.bonbori.copper);
  row(BONBORI_COLOR.silver, UI_TEXT.fest.bonbori.silver(FEST_RANK_DEFAULT.silver));
  row(BONBORI_COLOR.gold, UI_TEXT.fest.bonbori.gold(FEST_RANK_DEFAULT.gold));

  modal.addText(UI_TEXT.fest.bonbori.footer, 13, TEXT_COLORS.sub);
  modal.addButton(UI_TEXT.fest.bonbori.close, COLORS.primary, () => modal.close());
  modal.show();
}

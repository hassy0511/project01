/* ものしりカード: 初回入手時に一度だけ表示する */
import Phaser from 'phaser';
import { findEntity, findTrivia, GAME_DATA } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { store } from '../game/store';
import { SFX } from '../audio/sfx';
import { COLORS, TEXT_COLORS } from './theme';
import { addIcon } from './icons';
import { makeGuideRow, Modal } from './widgets';

/** ものしりカードの 絵の 大きさ(カードの 主役なので 大きく) */
const CARD_ICON = 62;

export function showTriviaOnce(scene: Phaser.Scene, ref: string, after: () => void): void {
  if (store.state.seenTrivia[ref]) {
    after();
    return;
  }
  const trivia = findTrivia(GAME_DATA, ref);
  const entity = findEntity(GAME_DATA, ref);
  if (!trivia || !entity) {
    after();
    return;
  }
  store.state.seenTrivia[ref] = true;
  store.save();
  SFX.hint();

  const modal = new Modal(scene, UI_TEXT.trivia.modalTitle);
  const guide = makeGuideRow(scene, UI_TEXT.trivia.found, 'wow');
  modal.add(guide.container, guide.height);
  modal.addText(UI_TEXT.trivia.head, 14, TEXT_COLORS.accent);
  modal.add(addIcon(scene, 0, 0, entity.icon, CARD_ICON), CARD_ICON + 6);
  modal.addText(entity.name, 20);
  modal.addText(trivia.text, 15, TEXT_COLORS.sub);
  modal.addButton(UI_TEXT.trivia.register, COLORS.primary, () => {
    modal.close();
    after();
  });
  modal.show();
}

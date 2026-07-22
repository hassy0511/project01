/* もちもの: インベントリをグループ化して表示 */
import Phaser from 'phaser';
import { setupHiDpi } from '../ui/display';
import { findEntity, findPref, GAME_DATA } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { store } from '../game/store';
import { buildHeader, buildNav, HEADER_H } from '../ui/nav';
import { COLORS, FONT, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import { ScrollArea } from '../ui/widgets';

const CELL_W = 148;
const CELL_H = 110;

export class InvScene extends Phaser.Scene {
  constructor() {
    super('InvScene');
  }

  create(): void {
    setupHiDpi(this);
    this.cameras.main.setBackgroundColor(COLORS.ground);
    buildHeader(this);
    buildNav(this, 'inv');

    const groups = new Map<string, number>();
    for (const it of store.state.inv) {
      const key = `${it.ref}|${it.origin}|${it.quality ?? 0}`;
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }

    const top = HEADER_H + 10;
    if (!groups.size) {
      this.add
        .text(GAME_W / 2, GAME_H / 2, UI_TEXT.inv.empty, {
          fontFamily: FONT,
          fontSize: '16px',
          color: TEXT_COLORS.sub,
          align: 'center',
          lineSpacing: 8,
        })
        .setOrigin(0.5);
      return;
    }

    const scroll = new ScrollArea(this, 0, top, GAME_W, GAME_H - top - 72);
    const keys = [...groups.keys()].sort();
    const cols = 3;
    keys.forEach((key, i) => {
      const [ref, origin, q] = key.split('|');
      const e = findEntity(GAME_DATA, ref);
      const prefName = findPref(GAME_DATA, origin)?.name ?? origin;
      const c = this.add.container(
        (GAME_W - cols * (CELL_W + 8)) / 2 + (i % cols) * (CELL_W + 8) + CELL_W / 2 + 4,
        10 + Math.floor(i / cols) * (CELL_H + 8) + CELL_H / 2,
      );
      const g = this.add.graphics();
      g.fillStyle(COLORS.panel, 1);
      g.lineStyle(2, COLORS.panelLine, 1);
      g.fillRoundedRect(-CELL_W / 2, -CELL_H / 2, CELL_W, CELL_H, 12);
      g.strokeRoundedRect(-CELL_W / 2, -CELL_H / 2, CELL_W, CELL_H, 12);
      c.add(g);
      c.add(this.add.text(0, -CELL_H / 2 + 26, e?.emoji ?? '❓', { fontSize: '28px' }).setOrigin(0.5));
      c.add(
        this.add
          .text(0, -CELL_H / 2 + 56, `${e?.name ?? ref} ×${groups.get(key)}`, {
            fontFamily: FONT,
            fontSize: '13px',
            color: TEXT_COLORS.main,
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );
      const stars = Number(q) ? '★'.repeat(Number(q)) : '';
      c.add(
        this.add
          .text(0, -CELL_H / 2 + 82, `${UI_TEXT.recipe.originChip(prefName)}${stars ? ` ${stars}` : ''}`, {
            fontFamily: FONT,
            fontSize: '11px',
            color: TEXT_COLORS.sub,
          })
          .setOrigin(0.5),
      );
      scroll.content.add(c);
    });
    scroll.setContentHeight(10 + Math.ceil(keys.length / cols) * (CELL_H + 8) + 12);
  }
}

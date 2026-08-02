/* もちもの: どうぐの ならび + インベントリをグループ化して表示 */
import Phaser from 'phaser';
import { setupHiDpi } from '../ui/display';
import { findEntity, findPref, GAME_DATA } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { store } from '../game/store';
import { toolLevel } from '../core/tools';
import { buildHeader, buildNav, HEADER_H } from '../ui/nav';
import { COLORS, FONT, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import { ScrollArea } from '../ui/widgets';
import { addIcon, type IconKey } from '../ui/icons';

const CELL_W = 148;
const CELL_H = 110;
/** データに 絵が ない ときの 絵 */
const UNKNOWN_ICON: IconKey = 'question:gray';
/** できばえの ほし アイコン */
const STAR_ICON: IconKey = 'star:gold';
const STAR_SIZE = 11;
const COLS = 3;
const SECTION_H = 30;

export class InvScene extends Phaser.Scene {
  constructor() {
    super('InvScene');
  }

  create(): void {
    setupHiDpi(this);
    this.cameras.main.setBackgroundColor(COLORS.ground);
    buildHeader(this);
    buildNav(this, 'inv');

    const top = HEADER_H + 10;
    const scroll = new ScrollArea(this, 0, top, GAME_W, GAME_H - top - 72);
    let y = 10;

    /* ---------- どうぐ(工芸の 県で 作る。docs/DOUGU_SHIN_PLAN.md) ----------
       作った ものは レベルつきで、まだの ものは ？？？ +「どこで 作れるか」。
       ならびが 「にっぽんの どうぐ工芸の 地図」に なる ように ぜんぶ 見せる */
    y = this.addSectionHead(scroll, UI_TEXT.dougu.invHead, y);
    const tools = GAME_DATA.recipes.filter((r) => r.type === 'dougu' && r.tool);
    tools.forEach((r, i) => {
      const lv = toolLevel(store.state, r.tool!.engine);
      const made = lv >= (r.tool!.level ?? 2);
      const c = this.cellBase(i, y);
      const prefName = findPref(GAME_DATA, r.pref)?.name ?? '';
      c.add(addIcon(this, 0, -CELL_H / 2 + 26, made ? r.icon : UNKNOWN_ICON, 28));
      c.add(
        this.add
          .text(0, -CELL_H / 2 + 56, made ? r.name : UI_TEXT.inv.unknownTool, {
            fontFamily: FONT,
            fontSize: '12px',
            color: TEXT_COLORS.main,
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );
      c.add(
        this.add
          .text(0, -CELL_H / 2 + 82, made ? UI_TEXT.dougu.lvChip(lv) : UI_TEXT.dougu.craftAt(prefName), {
            fontFamily: FONT,
            fontSize: '11px',
            color: made ? TEXT_COLORS.good : TEXT_COLORS.sub,
            fontStyle: made ? 'bold' : 'normal',
          })
          .setOrigin(0.5),
      );
      scroll.content.add(c);
    });
    y += Math.ceil(tools.length / COLS) * (CELL_H + 8);

    /* ---------- そざいと めいさん ---------- */
    const groups = new Map<string, number>();
    for (const it of store.state.inv) {
      const key = `${it.ref}|${it.origin}|${it.quality ?? 0}`;
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }

    y = this.addSectionHead(scroll, UI_TEXT.inv.itemsHead, y + 4);
    if (!groups.size) {
      scroll.content.add(
        this.add
          .text(GAME_W / 2, y + 40, UI_TEXT.inv.empty, {
            fontFamily: FONT,
            fontSize: '15px',
            color: TEXT_COLORS.sub,
            align: 'center',
            lineSpacing: 8,
          })
          .setOrigin(0.5, 0),
      );
      scroll.setContentHeight(y + 120);
      return;
    }

    const keys = [...groups.keys()].sort();
    keys.forEach((key, i) => {
      const [ref, origin, qs] = key.split('|');
      const e = findEntity(GAME_DATA, ref);
      const prefName = findPref(GAME_DATA, origin)?.name ?? origin;
      const c = this.cellBase(i, y);
      c.add(addIcon(this, 0, -CELL_H / 2 + 26, e?.icon ?? UNKNOWN_ICON, 28));
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
      // 「〜さん ほし」の 行(ほしは アイコン)。文と ほしを まとめて 中央に そろえる
      const stars = Number(qs) || 0;
      const sy = -CELL_H / 2 + 82;
      const chip = this.add
        .text(0, sy, UI_TEXT.recipe.originChip(prefName), {
          fontFamily: FONT,
          fontSize: '11px',
          color: TEXT_COLORS.sub,
        })
        .setOrigin(0, 0.5);
      const total = chip.width + (stars ? 4 + stars * STAR_SIZE : 0);
      chip.x = -total / 2;
      c.add(chip);
      for (let s = 0; s < stars; s++) {
        c.add(addIcon(this, -total / 2 + chip.width + 4 + s * STAR_SIZE + STAR_SIZE / 2, sy, STAR_ICON, STAR_SIZE));
      }
      scroll.content.add(c);
    });
    y += Math.ceil(keys.length / COLS) * (CELL_H + 8);
    scroll.setContentHeight(y + 12);
  }

  /** くぎりの 見出し。かえりは つぎの ならびの はじまり y */
  private addSectionHead(scroll: ScrollArea, label: string, y: number): number {
    scroll.content.add(
      this.add
        .text(16, y + SECTION_H / 2, label, {
          fontFamily: FONT,
          fontSize: '15px',
          color: TEXT_COLORS.sub,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5),
    );
    return y + SECTION_H;
  }

  /** ならびの 1マス(そとわく だけ)。i は ならびの 中の 通し番号 */
  private cellBase(i: number, sectionY: number): Phaser.GameObjects.Container {
    const c = this.add.container(
      (GAME_W - COLS * (CELL_W + 8)) / 2 + (i % COLS) * (CELL_W + 8) + CELL_W / 2 + 4,
      sectionY + Math.floor(i / COLS) * (CELL_H + 8) + CELL_H / 2,
    );
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, 1);
    g.lineStyle(2, COLORS.panelLine, 1);
    g.fillRoundedRect(-CELL_W / 2, -CELL_H / 2, CELL_W, CELL_H, 12);
    g.strokeRoundedRect(-CELL_W / 2, -CELL_H / 2, CELL_W, CELL_H, 12);
    c.add(g);
    return c;
  }
}

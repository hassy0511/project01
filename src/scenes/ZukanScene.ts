/* ずかん: そざい / さんぶつ / めいぶつ / でんとう のタブ+グリッド。
   そざいセルは「さいこう★+さんち n/m」の要約だけ表示し、
   タップで産地ごとの★一覧モーダルを開く(県が増えても破綻しない) */
import Phaser from 'phaser';
import { setupHiDpi } from '../ui/display';
import { findPref, GAME_DATA, type Material } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { store } from '../game/store';
import { buildHeader, buildNav, HEADER_H } from '../ui/nav';
import { COLORS, FONT, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import { Modal, ScrollArea } from '../ui/widgets';

type TabKey = 'mat' | 't2' | 't3' | 't4';
const TIER_OF: Record<Exclude<TabKey, 'mat'>, number> = { t2: 2, t3: 3, t4: 4 };

const TAB_H = 46;
const CELL_W = 148;
const CELL_H = 130;

export class ZukanScene extends Phaser.Scene {
  private tab: TabKey = 'mat';
  private scroll?: ScrollArea;
  private tabBar?: Phaser.GameObjects.Container;

  constructor() {
    super('ZukanScene');
  }

  create(): void {
    setupHiDpi(this);
    this.cameras.main.setBackgroundColor(COLORS.ground);
    buildHeader(this);
    buildNav(this, 'zukan');
    this.buildTabs();
    this.buildGrid();
  }

  private tabCount(key: TabKey): [number, number] {
    const s = store.state;
    if (key === 'mat') return [Object.keys(s.zukanMat).length, GAME_DATA.materials.length];
    const tier = TIER_OF[key];
    const rs = GAME_DATA.recipes.filter((r) => r.tier === tier);
    const got = rs.filter((r) => (tier === 4 ? s.fest.includes(r.id) : s.zukanProd[r.id])).length;
    return [got, rs.length];
  }

  private buildTabs(): void {
    this.tabBar?.destroy();
    this.tabBar = this.add.container(0, HEADER_H + 6);
    const keys: TabKey[] = ['mat', 't2', 't3', 't4'];
    keys.forEach((key, i) => {
      const [got, total] = this.tabCount(key);
      const active = this.tab === key;
      const x = 12 + i * 116;
      const g = this.add.graphics();
      g.fillStyle(active ? COLORS.primary : COLORS.panel, 1);
      g.lineStyle(2, COLORS.panelLine, 1);
      g.fillRoundedRect(x, 0, 110, TAB_H - 8, 12);
      g.strokeRoundedRect(x, 0, 110, TAB_H - 8, 12);
      const t = this.add
        .text(x + 55, (TAB_H - 8) / 2, `${UI_TEXT.zukan.tabs[key]}\n${got}/${total}`, {
          fontFamily: FONT,
          fontSize: '12px',
          color: active ? TEXT_COLORS.white : TEXT_COLORS.sub,
          align: 'center',
          fontStyle: active ? 'bold' : 'normal',
        })
        .setOrigin(0.5);
      const zone = this.add.zone(x + 55, (TAB_H - 8) / 2, 110, TAB_H - 8).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        this.tab = key;
        this.buildTabs();
        this.buildGrid();
      });
      this.tabBar?.add([g, t, zone]);
    });
  }

  private buildGrid(): void {
    this.scroll?.destroy();
    const top = HEADER_H + TAB_H + 8;
    this.scroll = new ScrollArea(this, 0, top, GAME_W, GAME_H - top - 72);

    const cells: Phaser.GameObjects.Container[] = [];
    if (this.tab === 'mat') {
      for (const m of GAME_DATA.materials) {
        const rec = store.state.zukanMat[m.id];
        if (!rec) {
          cells.push(this.cell('❓', UI_TEXT.zukan.unknown, '', false));
          continue;
        }
        // 要約表示: さいこう★ / さんち n/m(県が増えても そざいごとに1セルのまま)
        const gotOrigins = m.origins.filter((o) => rec[o]);
        const best = gotOrigins.reduce((mx, o) => Math.max(mx, rec[o] ?? 0), 0);
        const comp = gotOrigins.length === m.origins.length;
        const sub =
          `${UI_TEXT.pref.bestStars('★'.repeat(best))}\n` +
          `${UI_TEXT.zukan.sanchi(gotOrigins.length, m.origins.length)}` +
          (comp ? `\n${UI_TEXT.zukan.comp}` : '');
        const c = this.cell(m.emoji, m.name, sub, true, comp);
        const zone = this.add.zone(0, 0, CELL_W, CELL_H).setInteractive({ useHandCursor: true });
        zone.on('pointerup', () => this.openMatDetail(m));
        c.add(zone);
        cells.push(c);
      }
    } else {
      const tier = TIER_OF[this.tab];
      for (const r of GAME_DATA.recipes.filter((x) => x.tier === tier)) {
        const got = tier === 4 ? store.state.fest.includes(r.id) : store.state.zukanProd[r.id];
        const prefName = findPref(GAME_DATA, r.pref)?.name ?? '';
        if (!got) {
          cells.push(this.cell('❓', UI_TEXT.zukan.unknown, prefName, false));
        } else if (tier === 4) {
          const best = store.state.festBest[r.id];
          const bestLine = best ? `\n${UI_TEXT.fest.bestScore(best)}` : '';
          cells.push(this.cell(r.emoji, r.name, prefName + bestLine, true, true));
        } else {
          const jimoto = typeof got === 'object' && got.jimoto ? `\n${UI_TEXT.zukan.jimoto}` : '';
          cells.push(this.cell(r.emoji, r.name, prefName + jimoto, true, jimoto !== ''));
        }
      }
    }

    let gridTop = 10;
    if (this.tab === 'mat') {
      const hint = this.add
        .text(GAME_W / 2, gridTop, UI_TEXT.zukan.tapHint, { fontFamily: FONT, fontSize: '12px', color: TEXT_COLORS.sub })
        .setOrigin(0.5, 0);
      this.scroll.content.add(hint);
      gridTop += hint.height + 8;
    }
    const cols = 3;
    cells.forEach((c, i) => {
      c.setPosition(
        (GAME_W - cols * (CELL_W + 8)) / 2 + (i % cols) * (CELL_W + 8) + CELL_W / 2 + 4,
        gridTop + Math.floor(i / cols) * (CELL_H + 8) + CELL_H / 2,
      );
      this.scroll?.content.add(c);
    });
    this.scroll.setContentHeight(gridTop + Math.ceil(cells.length / cols) * (CELL_H + 8) + 12);
  }

  /** そざいの くわしい ずかん: 産地ごとの★一覧(タップで開く) */
  private openMatDetail(m: Material): void {
    const rec = store.state.zukanMat[m.id] ?? {};
    const modal = new Modal(this, m.name, true);
    modal.add(this.add.text(0, 0, m.emoji, { fontSize: '48px' }).setOrigin(0.5), 54);
    modal.addText(UI_TEXT.zukan.detailHead, 14, TEXT_COLORS.accent);
    const lines = m.origins
      .map((o) => {
        const name = findPref(GAME_DATA, o)?.name ?? o;
        const st = rec[o];
        return st ? `${name}: ${'★'.repeat(st)}` : `${name}: ${UI_TEXT.zukan.notYet}`;
      })
      .join('\n');
    modal.addText(lines, 16);
    if (m.origins.every((o) => rec[o])) modal.addText(UI_TEXT.zukan.comp, 15, TEXT_COLORS.good);
    modal.addButton(UI_TEXT.settings.close, COLORS.primary, () => modal.close());
    modal.show();
  }

  private cell(emoji: string, name: string, sub: string, known: boolean, gold = false): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, known ? 1 : 0.6);
    g.lineStyle(2, gold ? COLORS.gold : COLORS.panelLine, 1);
    g.fillRoundedRect(-CELL_W / 2, -CELL_H / 2, CELL_W, CELL_H, 12);
    g.strokeRoundedRect(-CELL_W / 2, -CELL_H / 2, CELL_W, CELL_H, 12);
    c.add(g);
    c.add(this.add.text(0, -CELL_H / 2 + 28, emoji, { fontSize: '30px' }).setOrigin(0.5).setAlpha(known ? 1 : 0.5));
    c.add(
      this.add
        .text(0, -CELL_H / 2 + 58, name, {
          fontFamily: FONT,
          fontSize: '13px',
          color: TEXT_COLORS.main,
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
    c.add(
      this.add
        .text(0, -CELL_H / 2 + 92, sub, {
          fontFamily: FONT,
          fontSize: '10px',
          color: TEXT_COLORS.sub,
          align: 'center',
        })
        .setOrigin(0.5),
    );
    return c;
  }
}

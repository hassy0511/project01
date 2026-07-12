/* ずかん: そざい / さんぶつ / めいぶつ / でんとう のタブ+グリッド */
import Phaser from 'phaser';
import { findPref, GAME_DATA } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { store } from '../game/store';
import { buildHeader, buildNav, HEADER_H } from '../ui/nav';
import { COLORS, FONT, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import { ScrollArea } from '../ui/widgets';

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
        const chips = m.origins
          .map((o) => {
            const st = rec[o];
            const name = findPref(GAME_DATA, o)?.name ?? o;
            return st ? `${name}${'★'.repeat(st)}` : `${name}?`;
          })
          .join('\n');
        const comp = m.origins.every((o) => rec[o]);
        cells.push(this.cell(m.emoji, m.name, chips + (comp ? `\n${UI_TEXT.zukan.comp}` : ''), true, comp));
      }
    } else {
      const tier = TIER_OF[this.tab];
      for (const r of GAME_DATA.recipes.filter((x) => x.tier === tier)) {
        const got = tier === 4 ? store.state.fest.includes(r.id) : store.state.zukanProd[r.id];
        const prefName = findPref(GAME_DATA, r.pref)?.name ?? '';
        if (!got) {
          cells.push(this.cell('❓', UI_TEXT.zukan.unknown, prefName, false));
        } else {
          const jimoto = typeof got === 'object' && got.jimoto ? `\n${UI_TEXT.zukan.jimoto}` : '';
          cells.push(this.cell(r.emoji, r.name, prefName + jimoto, true, jimoto !== ''));
        }
      }
    }

    const cols = 3;
    cells.forEach((c, i) => {
      c.setPosition(
        (GAME_W - cols * (CELL_W + 8)) / 2 + (i % cols) * (CELL_W + 8) + CELL_W / 2 + 4,
        10 + Math.floor(i / cols) * (CELL_H + 8) + CELL_H / 2,
      );
      this.scroll?.content.add(c);
    });
    this.scroll.setContentHeight(10 + Math.ceil(cells.length / cols) * (CELL_H + 8) + 12);
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

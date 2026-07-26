/* ずかん: そざい / さんぶつ / めいぶつ / でんとう のタブ+グリッド。
   そざいセルは「さいこうほし+さんち n/m」の要約だけ表示し、
   タップで産地ごとのほし一覧モーダルを開く(県が増えても破綻しない) */
import Phaser from 'phaser';
import { setupHiDpi } from '../ui/display';
import { findPref, GAME_DATA, type Material } from '../data/gameData';
import { festIntro, UI_TEXT } from '../data/uiText';
import { HARVEST_ICON, HOW_TO } from '../data/howto';
import { showHowTo, type HowToHandle } from '../ui/howto';
import { store } from '../game/store';
import { buildHeader, buildNav, HEADER_H } from '../ui/nav';
import { COLORS, FONT, GAME_AREA_H, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import { Modal, ScrollArea, shrinkToWidth } from '../ui/widgets';
import { addIcon, type IconKey } from '../ui/icons';

type TabKey = 'mat' | 't2' | 't3' | 't4' | 'how';
const TIER_OF: Record<'t2' | 't3' | 't4', number> = { t2: 2, t3: 3, t4: 4 };

const TAB_H = 46;
/** タブ 5つ ぶんの わりつけ(ふえたら ここだけ 直す) */
const TAB_W = 86;
const TAB_GAP = 6;
/** 「あそびかた」の 見本わくの 大きさ(ゲーム画面 480x748 を 小さく 見せる) */
const DEMO_SCALE = 0.34;
const CELL_W = 148;
const CELL_H = 130;
/** まだ てにいれていない ものの 絵 */
const UNKNOWN_ICON: IconKey = 'question:gray';
/** できばえの ほし アイコン */
const STAR_ICON: IconKey = 'star:gold';

export class ZukanScene extends Phaser.Scene {
  private tab: TabKey = 'mat';
  private scroll?: ScrollArea;
  private tabBar?: Phaser.GameObjects.Container;
  /** 見本の ゆびマーク(モーダルを とじる ときに 止める) */
  private demo?: HowToHandle;

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
    if (key === 'how') {
      const games = this.gameList();
      return [games.filter((g) => s.playedGame[g.key]).length, games.length];
    }
    const tier = TIER_OF[key];
    const rs = GAME_DATA.recipes.filter((r) => r.tier === tier);
    const got = rs.filter((r) => (tier === 4 ? s.fest.includes(r.id) : s.zukanProd[r.id])).length;
    return [got, rs.length];
  }

  private buildTabs(): void {
    this.tabBar?.destroy();
    this.tabBar = this.add.container(0, HEADER_H + 6);
    const keys: TabKey[] = ['mat', 't2', 't3', 't4', 'how'];
    const left = (GAME_W - (keys.length * TAB_W + (keys.length - 1) * TAB_GAP)) / 2;
    keys.forEach((key, i) => {
      const [got, total] = this.tabCount(key);
      const active = this.tab === key;
      const x = left + i * (TAB_W + TAB_GAP);
      const g = this.add.graphics();
      g.fillStyle(active ? COLORS.primary : COLORS.panel, 1);
      g.lineStyle(2, COLORS.panelLine, 1);
      g.fillRoundedRect(x, 0, TAB_W, TAB_H - 8, 12);
      g.strokeRoundedRect(x, 0, TAB_W, TAB_H - 8, 12);
      const label = key === 'how' ? UI_TEXT.howto.tab : UI_TEXT.zukan.tabs[key];
      const t = this.add
        .text(x + TAB_W / 2, (TAB_H - 8) / 2, `${label}\n${got}/${total}`, {
          fontFamily: FONT,
          fontSize: '11px',
          color: active ? TEXT_COLORS.white : TEXT_COLORS.sub,
          align: 'center',
          fontStyle: active ? 'bold' : 'normal',
        })
        .setOrigin(0.5);
      shrinkToWidth(t, TAB_W - 6, 9);
      const zone = this.add
        .zone(x + TAB_W / 2, (TAB_H - 8) / 2, TAB_W, TAB_H - 8)
        .setName(`tab-${key}`) // E2E から おせる ように(見た目には ひびかない)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        this.demo?.stop();
        this.demo = undefined;
        this.tab = key;
        this.buildTabs();
        this.buildGrid();
      });
      this.tabBar?.add([g, t, zone]);
    });
  }

  /** 「あそびかた」に ならべる ゲームの ならび。
      しゅうかくは エンジン名、おまつりは レシピの festGame。
      名まえ・絵は データから ひく(ここで ベタ書きしない) */
  private gameList(): { key: string; name: string; icon: IconKey; intro: string }[] {
    const out: { key: string; name: string; icon: IconKey; intro: string }[] = [];
    // しゅうかくゲーム(uiText に 名まえと あそびかたが ある ぶん)
    for (const [key, info] of Object.entries(UI_TEXT.howto.harvest)) {
      if (!HOW_TO[key]) continue;
      out.push({ key, name: info.name, icon: HARVEST_ICON[key] ?? UNKNOWN_ICON, intro: info.intro });
    }
    // おまつりゲーム(ゲーム名は 47県で ユニークなので レシピから ひける)
    for (const r of GAME_DATA.recipes) {
      const kind = r.festGame;
      if (!kind || !HOW_TO[kind]) continue;
      out.push({ key: kind, name: r.name, icon: r.icon, intro: festIntro(kind) });
    }
    return out;
  }

  private buildGrid(): void {
    this.scroll?.destroy();
    const top = HEADER_H + TAB_H + 8;
    this.scroll = new ScrollArea(this, 0, top, GAME_W, GAME_H - top - 72);

    const cells: Phaser.GameObjects.Container[] = [];
    if (this.tab === 'how') {
      // ネタバレを しない: あそんだ ものだけ 名まえを 出す
      for (const g of this.gameList()) {
        if (!store.state.playedGame[g.key]) {
          cells.push(this.cell(UNKNOWN_ICON, UI_TEXT.howto.locked, UI_TEXT.howto.lockedNote, false));
          continue;
        }
        const c = this.cell(g.icon, g.name, '', true);
        const zone = this.add.zone(0, 0, CELL_W, CELL_H).setInteractive({ useHandCursor: true });
        zone.on('pointerup', () => this.openHowToDetail(g));
        c.add(zone);
        cells.push(c);
      }
    } else if (this.tab === 'mat') {
      for (const m of GAME_DATA.materials) {
        const rec = store.state.zukanMat[m.id];
        if (!rec) {
          cells.push(this.cell(UNKNOWN_ICON, UI_TEXT.zukan.unknown, '', false));
          continue;
        }
        // 要約表示: さいこうほし(アイコン) / さんち n/m(県が増えても そざいごとに1セルのまま)
        const gotOrigins = m.origins.filter((o) => rec[o]);
        const best = gotOrigins.reduce((mx, o) => Math.max(mx, rec[o] ?? 0), 0);
        const comp = gotOrigins.length === m.origins.length;
        const sub =
          `${UI_TEXT.zukan.sanchi(gotOrigins.length, m.origins.length)}` + (comp ? `\n${UI_TEXT.zukan.comp}` : '');
        const c = this.cell(m.icon, m.name, sub, true, comp, best);
        const zone = this.add.zone(0, 0, CELL_W, CELL_H).setInteractive({ useHandCursor: true });
        zone.on('pointerup', () => this.openMatDetail(m));
        c.add(zone);
        cells.push(c);
      }
    } else {
      const tier = TIER_OF[this.tab as 't2' | 't3' | 't4'];
      for (const r of GAME_DATA.recipes.filter((x) => x.tier === tier)) {
        const got = tier === 4 ? store.state.fest.includes(r.id) : store.state.zukanProd[r.id];
        const prefName = findPref(GAME_DATA, r.pref)?.name ?? '';
        if (!got) {
          cells.push(this.cell(UNKNOWN_ICON, UI_TEXT.zukan.unknown, prefName, false));
        } else if (tier === 4) {
          const best = store.state.festBest[r.id];
          const bestLine = best ? `\n${UI_TEXT.fest.bestScore(best)}` : '';
          cells.push(this.cell(r.icon, r.name, prefName + bestLine, true, true));
        } else {
          const jimoto = typeof got === 'object' && got.jimoto ? `\n${UI_TEXT.zukan.jimoto}` : '';
          cells.push(this.cell(r.icon, r.name, prefName + jimoto, true, jimoto !== ''));
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

  /** あそびかたの くわしい 見本: 説明 + ちいさな わくの 中で ゆびが 動く */
  private openHowToDetail(g: { key: string; name: string; icon: IconKey; intro: string }): void {
    const modal = new Modal(this, g.name, true);
    modal.add(addIcon(this, 0, 0, g.icon, 44), 50);
    modal.addText(g.intro, 14);
    // ちいさな 見本わく(ほんものの ゲーム画面では ない)
    const boxW = GAME_W * DEMO_SCALE;
    const boxH = GAME_AREA_H * DEMO_SCALE;
    const box = this.add.container(0, 0);
    const frame = this.add.graphics();
    frame.fillStyle(COLORS.sky, 1);
    frame.lineStyle(2, COLORS.panelLine, 1);
    frame.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 10);
    frame.strokeRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 10);
    box.add(frame);
    modal.add(box, boxH + 6);
    modal.addText(UI_TEXT.howto.demoNote, 12, TEXT_COLORS.sub);
    const demo = showHowTo(this, g.key, 0, { parent: box, scale: DEMO_SCALE });
    this.demo?.stop();
    this.demo = demo;
    modal.addButton(UI_TEXT.howto.gotIt, COLORS.primary, () => {
      demo.stop();
      if (this.demo === demo) this.demo = undefined;
      modal.close();
    });
    modal.show();
  }

  /** そざいの くわしい ずかん: 産地ごとのほし一覧(タップで開く) */
  private openMatDetail(m: Material): void {
    const rec = store.state.zukanMat[m.id] ?? {};
    const modal = new Modal(this, m.name, true);
    modal.add(addIcon(this, 0, 0, m.icon, 48), 54);
    modal.addText(UI_TEXT.zukan.detailHead, 14, TEXT_COLORS.accent);
    // 産地ごとの できばえ: なまえは 右づめ、ほしは アイコンで ならべる
    const rows = this.add.container(0, 0);
    const lineH = 22;
    m.origins.forEach((o, i) => {
      const name = findPref(GAME_DATA, o)?.name ?? o;
      const st = rec[o] ?? 0;
      const ly = (i - (m.origins.length - 1) / 2) * lineH;
      rows.add(
        this.add
          .text(-6, ly, `${name}:`, { fontFamily: FONT, fontSize: '16px', color: TEXT_COLORS.main })
          .setOrigin(1, 0.5),
      );
      if (st) {
        for (let s = 0; s < st; s++) rows.add(addIcon(this, 6 + s * 18 + 9, ly, STAR_ICON, 17));
      } else {
        rows.add(
          this.add
            .text(6, ly, UI_TEXT.zukan.notYet, { fontFamily: FONT, fontSize: '16px', color: TEXT_COLORS.sub })
            .setOrigin(0, 0.5),
        );
      }
    });
    modal.add(rows, m.origins.length * lineH);
    if (m.origins.every((o) => rec[o])) modal.addText(UI_TEXT.zukan.comp, 15, TEXT_COLORS.good);
    modal.addButton(UI_TEXT.settings.close, COLORS.primary, () => modal.close());
    modal.show();
  }

  private cell(
    icon: IconKey,
    name: string,
    sub: string,
    known: boolean,
    gold = false,
    stars = 0,
  ): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, known ? 1 : 0.6);
    g.lineStyle(2, gold ? COLORS.gold : COLORS.panelLine, 1);
    g.fillRoundedRect(-CELL_W / 2, -CELL_H / 2, CELL_W, CELL_H, 12);
    g.strokeRoundedRect(-CELL_W / 2, -CELL_H / 2, CELL_W, CELL_H, 12);
    c.add(g);
    c.add(addIcon(this, 0, -CELL_H / 2 + 28, icon, 30).setAlpha(known ? 1 : 0.5));
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
    if (stars > 0) {
      // 「さいこう ほし」の 行(ほしは アイコン)
      const label = this.add
        .text(0, 0, UI_TEXT.pref.bestStars('').trimEnd(), {
          fontFamily: FONT,
          fontSize: '10px',
          color: TEXT_COLORS.sub,
        })
        .setOrigin(0, 0.5);
      const sy = -CELL_H / 2 + 76;
      const total = label.width + 3 + stars * 13;
      label.setPosition(-total / 2, sy);
      c.add(label);
      for (let i = 0; i < stars; i++) {
        c.add(addIcon(this, -total / 2 + label.width + 3 + i * 13 + 6.5, sy, STAR_ICON, 13));
      }
    }
    c.add(
      this.add
        .text(0, -CELL_H / 2 + (stars > 0 ? 88 : 84), sub, {
          fontFamily: FONT,
          fontSize: '10px',
          color: TEXT_COLORS.sub,
          align: 'center',
          lineSpacing: 2,
        })
        .setOrigin(0.5, 0),
    );
    return c;
  }
}

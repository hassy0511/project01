/* 県画面: 風景バナー・そざいカード(いど/はたけ/待ちなし)・レシピ・おまつり */
import Phaser from 'phaser';
import {
  findEntity,
  findPref,
  GAME_DATA,
  prefTitle,
  RARITY_LABEL,
  TIER_LABEL,
  type Ingredient,
  type Material,
  type Prefecture,
  type Recipe,
} from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { applyCraft, craftable, matchItems, pickConsume } from '../core/craft';
import { ensureInfra, collectInfra, infraNextSec, infraStock, plantSeed, plotKey, plotState } from '../core/plots';
import { pickRecipeQuizzes, recordQuizAsked } from '../core/quiz';
import { store } from '../game/store';
import { SFX } from '../audio/sfx';
import { buildNav } from '../ui/nav';
import { runQuizModal } from '../ui/quizRunner';
import { showTriviaOnce } from '../ui/trivia';
import { COLORS, DEPTH, FONT, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import { makeButton, makeGuideRow, Modal, ScrollArea, showToast } from '../ui/widgets';
import { confetti, wobble } from '../ui/effects';

const CARD_W = 452;
const CARD_H = 80;
const CARD_GAP = 10;
const BANNER_H = 88;
const TOP_H = 48;
const SCROLL_TOP = TOP_H + BANNER_H + 8;

const fmtWait = (sec: number): string =>
  sec < 60 ? UI_TEXT.pref.soonWait : UI_TEXT.pref.minutesWait(Math.ceil(sec / 60));

export class PrefScene extends Phaser.Scene {
  private prefId = '';
  private pref!: Prefecture;
  private scroll?: ScrollArea;
  private lastSig = '';

  constructor() {
    super('PrefScene');
  }

  init(data: { prefId: string }): void {
    this.prefId = data.prefId;
  }

  create(): void {
    const pref = findPref(GAME_DATA, this.prefId);
    if (!pref) {
      this.scene.start('MapScene');
      return;
    }
    this.pref = pref;
    this.cameras.main.setBackgroundColor(COLORS.ground);
    this.buildTop();
    this.buildBanner();
    this.rebuildCards();
    buildNav(this, 'map');

    // 1秒ティッカー: 状態シグネチャが変わった時だけ再描画(モーダル中は触らない)
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (Modal.isOpen()) return;
        if (this.sozaiSig() !== this.lastSig) this.rebuildCards();
      },
    });

    const refresh = (): void => {
      if (this.scene.isActive() && !Modal.isOpen()) this.rebuildCards();
    };
    this.game.events.on('mq-refresh', refresh);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off('mq-refresh', refresh));
  }

  private buildTop(): void {
    const c = this.add.container(0, 0).setDepth(DEPTH.header);
    c.add(this.add.rectangle(GAME_W / 2, TOP_H / 2, GAME_W, TOP_H, COLORS.headerBg));
    const back = this.add
      .text(12, TOP_H / 2, UI_TEXT.pref.back, {
        fontFamily: FONT,
        fontSize: '16px',
        color: TEXT_COLORS.good,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('MapScene'));
    c.add(back);

    const chipColor = Phaser.Display.Color.HexStringToColor(this.pref.color ?? '#A9DC76').color;
    const chip = this.add.container(GAME_W / 2, TOP_H / 2);
    const g = this.add.graphics();
    g.fillStyle(chipColor, 1);
    g.fillRoundedRect(-64, -16, 128, 32, 16);
    chip.add(g);
    chip.add(
      this.add
        .text(0, 0, prefTitle(this.pref), {
          fontFamily: FONT,
          fontSize: '16px',
          color: TEXT_COLORS.main,
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
    c.add(chip);

    const prog = this.prefProgress();
    c.add(
      this.add
        .text(GAME_W - 12, TOP_H / 2, UI_TEXT.pref.progress(prog.got, prog.total), {
          fontFamily: FONT,
          fontSize: '14px',
          color: TEXT_COLORS.sub,
        })
        .setOrigin(1, 0.5),
    );
  }

  private buildBanner(): void {
    // 風景バナー(暫定): 県色の丘+空+絵文字
    const g = this.add.graphics();
    g.fillStyle(COLORS.sky, 1);
    g.fillRect(0, TOP_H, GAME_W, BANNER_H);
    const c = Phaser.Display.Color.HexStringToColor(this.pref.color ?? '#A9DC76').color;
    g.fillStyle(c, 0.9);
    g.fillEllipse(GAME_W * 0.7, TOP_H + BANNER_H + 18, GAME_W * 1.1, 70);
    g.fillStyle(c, 0.45);
    g.fillEllipse(GAME_W * 0.2, TOP_H + BANNER_H + 22, GAME_W * 0.9, 60);
    this.add.text(GAME_W - 52, TOP_H + 24, '☀️', { fontSize: '26px' }).setOrigin(0.5);
    const deco: Record<string, string> = { ibaraki: '🌸⛲', tochigi: '⛰️🍓', chiba: '🌊⛵' };
    this.add
      .text(24, TOP_H + BANNER_H - 30, deco[this.prefId] ?? '🌳', { fontSize: '26px' })
      .setOrigin(0, 0.5);
  }

  private prefProgress(): { got: number; total: number } {
    const s = store.state;
    const mats = GAME_DATA.materials.filter((m) => m.origins.includes(this.prefId));
    const recs = GAME_DATA.recipes.filter((r) => r.pref === this.prefId);
    let got = 0;
    for (const m of mats) if (s.zukanMat[m.id]?.[this.prefId]) got++;
    for (const r of recs) if (r.tier === 4 ? s.fest.includes(r.id) : s.zukanProd[r.id]) got++;
    return { got, total: mats.length + recs.length };
  }

  /* ---------- 状態シグネチャ(1秒ティッカー用) ---------- */
  private sozaiSig(): string {
    const now = Date.now();
    const s = store.state;
    return GAME_DATA.materials
      .filter((m) => m.origins.includes(this.prefId))
      .map((m) => {
        const g = m.gather;
        if (g.type === 'infra') {
          const rec = s.infra[plotKey(this.prefId, m.id)];
          const st = infraStock(rec, g, now);
          const next = rec ? infraNextSec(rec, g, now) : g.rateSec;
          return `i${st}${fmtWait(next)}`;
        }
        if (g.type === 'plant') {
          const view = plotState(s.plots[plotKey(this.prefId, m.id)], g, now);
          if (view.st === 'growing') {
            const remain = Math.ceil((g.growSec * 1000 - (now - view.plot.plantedAt)) / 1000);
            return `g${view.care ? 'c' : ''}${fmtWait(remain)}`;
          }
          return view.st;
        }
        return 'x';
      })
      .join('|');
  }

  /* ---------- カード一覧の再構築 ---------- */
  private rebuildCards(): void {
    this.lastSig = this.sozaiSig();
    this.scroll?.destroy();
    this.scroll = new ScrollArea(this, 0, SCROLL_TOP, GAME_W, GAME_H - SCROLL_TOP - 72);
    let y = 8;

    const addHeading = (text: string): void => {
      const t = this.add
        .text(16, y, text, { fontFamily: FONT, fontSize: '17px', color: TEXT_COLORS.main, fontStyle: 'bold' })
        .setOrigin(0, 0);
      this.scroll?.content.add(t);
      y += t.height + 8;
    };

    addHeading(UI_TEXT.pref.sozaiHead);
    for (const m of GAME_DATA.materials.filter((x) => x.origins.includes(this.prefId))) {
      this.scroll.content.add(this.buildSozaiCard(m, y));
      y += CARD_H + CARD_GAP;
    }
    y += 6;
    addHeading(UI_TEXT.pref.recipeHead);
    for (const r of GAME_DATA.recipes.filter((x) => x.pref === this.prefId).sort((a, b) => a.tier - b.tier)) {
      this.scroll.content.add(this.buildRecipeCard(r, y));
      y += CARD_H + CARD_GAP;
    }
    this.scroll.setContentHeight(y + 12);
  }

  private cardBase(y: number, ready = false): Phaser.GameObjects.Container {
    const c = this.add.container(GAME_W / 2, y + CARD_H / 2);
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, 1);
    g.lineStyle(2, ready ? COLORS.orange : COLORS.panelLine, 1);
    g.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14);
    g.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14);
    c.add(g);
    return c;
  }

  private cardTexts(c: Phaser.GameObjects.Container, emoji: string, name: string, sub: string): void {
    c.add(this.add.text(-CARD_W / 2 + 36, 0, emoji, { fontSize: '34px' }).setOrigin(0.5));
    c.add(
      this.add
        .text(-CARD_W / 2 + 70, -14, name, {
          fontFamily: FONT,
          fontSize: '16px',
          color: TEXT_COLORS.main,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5),
    );
    c.add(
      this.add
        .text(-CARD_W / 2 + 70, 12, sub, {
          fontFamily: FONT,
          fontSize: '12px',
          color: TEXT_COLORS.sub,
          wordWrap: { width: 240 },
        })
        .setOrigin(0, 0.5),
    );
  }

  private cardButton(
    c: Phaser.GameObjects.Container,
    label: string,
    color: number,
    onClick: () => void,
  ): void {
    c.add(
      makeButton(this, {
        x: CARD_W / 2 - 66,
        y: 0,
        w: 116,
        h: 40,
        label,
        color,
        fontSize: label.length > 7 ? 11 : 14,
        onClick,
      }),
    );
  }

  /* ---------- そざいカード ---------- */
  private buildSozaiCard(m: Material, y: number): Phaser.GameObjects.Container {
    const s = store.state;
    const now = Date.now();
    const g = m.gather;
    const known = s.zukanMat[m.id]?.[this.prefId];
    const starsTxt = known ? UI_TEXT.pref.bestStars('★'.repeat(known)) : UI_TEXT.pref.notObtained;
    const badge = RARITY_LABEL[m.rarity] ? ` ${RARITY_LABEL[m.rarity]}` : '';

    if (g.type === 'infra') {
      const rec = ensureInfra(s, m.id, this.prefId, now);
      const st = infraStock(rec, g, now);
      const nextSec = infraNextSec(rec, g, now);
      const sub =
        UI_TEXT.pref.stock(st, g.max) + (st >= g.max ? UI_TEXT.pref.stockFull : UI_TEXT.pref.stockNext(fmtWait(nextSec)));
      const c = this.cardBase(y);
      this.cardTexts(c, g.bEmoji, `${m.name}の ${g.building}`, sub);
      this.cardButton(c, g.collectVerb, st > 0 ? COLORS.primary : COLORS.gray, () => {
        const got = collectInfra(s, m, this.prefId, Date.now());
        if (got <= 0) {
          showToast(this, UI_TEXT.pref.notYet);
          return;
        }
        store.save();
        SFX.collect();
        showToast(this, UI_TEXT.pref.collected(m.emoji, m.name, got));
        showTriviaOnce(this, m.id, () => this.rebuildCards());
      });
      return c;
    }

    if (g.type === 'plant') {
      const view = plotState(s.plots[plotKey(this.prefId, m.id)], g, now);
      if (view.st === 'empty') {
        const c = this.cardBase(y);
        this.cardTexts(c, '🟫', UI_TEXT.pref.fieldName(m.name, g.fieldLabel) + badge, starsTxt);
        this.cardButton(c, g.verb, COLORS.primary, () => {
          plantSeed(s, m.id, this.prefId, Date.now());
          store.save();
          SFX.plant();
          showToast(this, UI_TEXT.pref.planted(m.emoji, m.name));
          this.rebuildCards();
        });
        return c;
      }
      if (view.st === 'growing') {
        const remain = Math.ceil((g.growSec * 1000 - (now - view.plot.plantedAt)) / 1000);
        const c = this.cardBase(y);
        this.cardTexts(c, '🌱', m.name + badge, UI_TEXT.pref.growing(fmtWait(remain)));
        // 成長バー
        const bar = this.add.graphics();
        bar.fillStyle(COLORS.barBg, 1);
        bar.fillRoundedRect(-CARD_W / 2 + 70, 24, 200, 8, 4);
        bar.fillStyle(COLORS.bar, 1);
        bar.fillRoundedRect(-CARD_W / 2 + 70, 24, Math.max(8, 200 * view.prog), 8, 4);
        c.add(bar);
        if (view.care) {
          this.cardButton(c, UI_TEXT.pref.careBtn, COLORS.orange, () =>
            this.scene.start('SessionScene', { matId: m.id, prefId: this.prefId, mode: 'care' }),
          );
        } else {
          this.cardButton(c, UI_TEXT.pref.growingBtn, COLORS.gray, () =>
            showToast(this, UI_TEXT.pref.growingToast),
          );
        }
        return c;
      }
      const c = this.cardBase(y, true);
      this.cardTexts(c, m.emoji, m.name + badge, UI_TEXT.pref.ready);
      wobble(this, c.list[1] as Phaser.GameObjects.Text); // 実がぷるんと揺れる
      this.cardButton(c, UI_TEXT.pref.harvestBtn, COLORS.primary, () =>
        this.scene.start('SessionScene', { matId: m.id, prefId: this.prefId, mode: 'harvest' }),
      );
      return c;
    }

    // timing / dig: 待ちなしミニゲーム
    const c = this.cardBase(y);
    this.cardTexts(c, m.emoji, m.name + badge, starsTxt);
    this.cardButton(c, g.verb, COLORS.primary, () =>
      this.scene.start('SessionScene', { matId: m.id, prefId: this.prefId, mode: 'instant' }),
    );
    return c;
  }

  /* ---------- レシピカード ---------- */
  private ingChipText(ing: Ingredient): string {
    const e = findEntity(GAME_DATA, ing.ref);
    if (!e) return '?';
    const have = Math.min(matchItems(store.state.inv, ing).length, ing.count);
    const extra =
      (ing.origin ? `(${findPref(GAME_DATA, ing.origin)?.name ?? ''}${UI_TEXT.recipe.originChip('').replace('さん', '')}さん)` : '') +
      (ing.quality ? `(${UI_TEXT.recipe.star3Chip})` : '');
    return `${e.emoji}${e.name}${extra} ${have}/${ing.count}`;
  }

  private buildRecipeCard(r: Recipe, y: number): Phaser.GameObjects.Container {
    const s = store.state;
    if (r.tier === 4) return this.buildFestivalCard(r, y);

    const owned = s.recipes.includes(r.id);
    if (!owned) {
      const c = this.cardBase(y);
      this.cardTexts(c, '❓', UI_TEXT.recipe.unknownName, UI_TEXT.recipe.sleeping(TIER_LABEL[r.tier]));
      this.cardButton(c, UI_TEXT.recipe.searchBtn, COLORS.orange, () => this.startRecipeGet(r));
      return c;
    }

    const crafted = s.zukanProd[r.id];
    const jimoto = crafted?.jimoto ? ` ${UI_TEXT.recipe.jimotoChip}` : '';
    const ings = r.ingredients.map((ing) => this.ingChipText(ing)).join('  ');
    const c = this.cardBase(y);
    this.cardTexts(c, r.emoji, `${r.name}〔${TIER_LABEL[r.tier]}〕${jimoto}`, ings);
    const ok = craftable(s.inv, r);
    this.cardButton(c, UI_TEXT.recipe.craftBtn, ok ? COLORS.primary : COLORS.gray, () => {
      if (craftable(store.state.inv, r)) this.openCraft(r);
      else showToast(this, UI_TEXT.recipe.notEnough);
    });
    return c;
  }

  /* ---------- レシピ探索(ものしりクイズ2問) ---------- */
  private startRecipeGet(r: Recipe): void {
    const quizzes = pickRecipeQuizzes(GAME_DATA.quizzes, r, store.state.quizRecent);
    for (const q of quizzes) recordQuizAsked(store.state.quizRecent, q.id);
    store.save();
    const modal = new Modal(this, UI_TEXT.recipe.searchTitle, true);
    const guide = makeGuideRow(this, UI_TEXT.recipe.searchGuide, 'normal');
    modal.add(guide.container, guide.height);
    modal.addButton(UI_TEXT.recipe.searchChallenge, COLORS.primary, () => {
      Modal.closeCurrent();
      runQuizModal(this, quizzes, UI_TEXT.recipe.searchQuizTitle, () => {
        store.state.recipes.push(r.id);
        store.save();
        SFX.fanfare();
        confetti(this);
        const done = new Modal(this, UI_TEXT.recipe.getTitle);
        done.add(this.add.text(0, 0, r.emoji, { fontSize: '54px' }).setOrigin(0.5), 60);
        done.addText(UI_TEXT.recipe.found(r.name), 18);
        const ings = r.ingredients
          .map((g) => {
            const e = findEntity(GAME_DATA, g.ref);
            return e ? `${e.emoji}${e.name}×${g.count}` : '';
          })
          .join('、');
        done.addText(UI_TEXT.recipe.ingredients(ings), 14, TEXT_COLORS.sub);
        done.addButton(UI_TEXT.recipe.yay, COLORS.primary, () => {
          done.close();
          this.rebuildCards();
        });
        done.show();
      });
    });
    modal.show();
  }

  /* ---------- クラフト ---------- */
  private openCraft(r: Recipe): void {
    const used = pickConsume(store.state.inv, r);
    const modal = new Modal(this, UI_TEXT.craft.confirmTitle, true);
    modal.add(this.add.text(0, 0, r.emoji, { fontSize: '50px' }).setOrigin(0.5), 56);
    modal.addText(UI_TEXT.craft.confirm(r.name), 18);
    const vis = r.ingredients
      .map((g) => {
        const e = findEntity(GAME_DATA, g.ref);
        return e ? `${e.emoji}×${g.count}` : '';
      })
      .join(' + ');
    modal.addText(`${vis} ➡ ${r.emoji}`, 17);
    const usedTxt = used
      .map((it) => {
        const e = findEntity(GAME_DATA, it.ref);
        const origin = findPref(GAME_DATA, it.origin)?.name ?? '';
        return `${e?.emoji ?? ''}${e?.name ?? ''}(${UI_TEXT.recipe.originChip(origin)})${it.quality ? ' ' + '★'.repeat(it.quality) : ''}`;
      })
      .join('\n');
    modal.addText(usedTxt, 13, TEXT_COLORS.sub);
    modal.addButton(UI_TEXT.craft.doIt, COLORS.primary, () => {
      const { jimoto } = applyCraft(store.state, r);
      store.save();
      SFX.fanfare();
      confetti(this);
      modal.close();
      const done = new Modal(this, UI_TEXT.craft.doneTitle);
      done.add(this.add.text(0, 0, r.emoji, { fontSize: '54px' }).setOrigin(0.5), 60);
      done.addText(UI_TEXT.craft.done(r.name), 18);
      if (jimoto) done.addText(UI_TEXT.craft.jimotoBanner, 15, TEXT_COLORS.accent);
      done.addButton(UI_TEXT.recipe.yay, COLORS.primary, () => {
        done.close();
        showTriviaOnce(this, r.id, () => this.rebuildCards());
      });
      done.show();
    });
    modal.show();
  }

  /* ---------- おまつり(Tier4): なんどでも 開催できる ---------- */
  private buildFestivalCard(r: Recipe, y: number): Phaser.GameObjects.Container {
    const s = store.state;
    const held = s.fest.includes(r.id);
    const c = this.cardBase(y, held);
    if (!r.implemented) {
      this.cardTexts(c, r.emoji, `${r.name}〔${TIER_LABEL[4]}〕`, UI_TEXT.fest.preparing);
      return c;
    }
    // まつり名は長いのでタイトルは名前だけにし、開催ずみバッジは下段に置く(ボタンと重ねない)
    const ings = r.ingredients.map((ing) => this.ingChipText(ing)).join('  ');
    this.cardTexts(c, r.emoji, r.name, held ? `${UI_TEXT.fest.held}  ${ings}` : ings);
    const ok = craftable(s.inv, r);
    this.cardButton(c, held ? UI_TEXT.fest.againBtn : UI_TEXT.fest.openBtn, ok ? COLORS.orange : COLORS.gray, () => {
      if (craftable(store.state.inv, r)) this.startFestival(r);
      else showToast(this, UI_TEXT.fest.needMeibutsu);
    });
    return c;
  }

  private startFestival(r: Recipe): void {
    const modal = new Modal(this, r.name, true);
    modal.add(this.add.text(0, 0, r.emoji, { fontSize: '54px' }).setOrigin(0.5), 60);
    modal.addText(UI_TEXT.fest.introBody, 15);
    const best = store.state.festBest[r.id];
    if (best) modal.addText(UI_TEXT.fest.bestScore(best), 14, TEXT_COLORS.accent);
    modal.addButton(UI_TEXT.fest.startBtn, COLORS.orange, () => {
      modal.close();
      this.scene.start('FestivalScene', { recipeId: r.id, prefId: this.prefId });
    });
    modal.show();
  }
}

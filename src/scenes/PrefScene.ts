/* 県画面: 風景バナー・そざいカード(いど/はたけ/待ちなし)・レシピ・おまつり */
import Phaser from 'phaser';
import { setupHiDpi } from '../ui/display';
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
import { festIntro, UI_TEXT } from '../data/uiText';
import { applyCraft, craftable, matchItems, pickConsume } from '../core/craft';
import { ensureInfra, collectInfra, infraNextSec, infraStock, plantSeed, plotKey, plotState } from '../core/plots';
import { pickRecipeQuizzes, recordQuizAsked } from '../core/quiz';
import { store } from '../game/store';
import { SFX } from '../audio/sfx';
import { buildNav } from '../ui/nav';
import { runQuizModal } from '../ui/quizRunner';
import { showTriviaOnce } from '../ui/trivia';
import { COLORS, DEPTH, FONT, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import {
  makeButton,
  makeGuideRow,
  Modal,
  ScrollArea,
  showToast,
  shrinkToWidth,
  type MascotMood,
} from '../ui/widgets';
import { nextTask, type NextTask } from '../core/nextTask';
import { TOOL_LV3_USES, toolLevel } from '../core/tools';
import { isShinOpen } from '../core/shin';
import { canFulfill, ensureOrder, fulfillOrder, matchOrderItems, type Order } from '../core/orders';
import { inSeason, SEASON_LABEL, seasonAt } from '../core/season';
import { whereFrom } from '../core/whereFrom';
import { confetti, wobble } from '../ui/effects';
import { addIcon, type IconKey } from '../ui/icons';

const CARD_W = 452;
const CARD_H = 80;
/** カードの 文字を おける よこはば。
    文字は x=-CARD_W/2+70 から。ボタンは x=CARD_W/2-66 が 中心で はば116 なので
    その ひだり端(CARD_W/2-124)より 10px 手前まで */
const TEXT_MAX_W = CARD_W - 124 - 70 - 10;
const CARD_GAP = 10;
const BANNER_H = 88;
const TOP_H = 48;
const SCROLL_TOP = TOP_H + BANNER_H + 8;

/** 風景バナーの かざり(県ごと)。ない県は 木ひとつ */
const BANNER_DECO: Record<string, IconKey[]> = {
  ibaraki: ['sakura:pink', 'well:sky'],
  tochigi: ['mountain:sky', 'strawberry:red'],
  chiba: ['wave:teal', 'boat:cream'],
};
const BANNER_DECO_DEFAULT: IconKey[] = ['tree:deepgreen'];

/** はたけの みため(まだ うえていない / そだちちゅう) */
const FIELD_ICON: IconKey = 'field:brown';
const SPROUT_ICON: IconKey = 'leaf:lime';
/** できばえの ほし アイコン */
const STAR_ICON: IconKey = 'star:gold';
const STAR_SIZE = 12;

/** 3コマの さしえ(そざい → めいぶつ → おまつり) */
const FIRST_GUIDE_ICONS: IconKey[] = ['leaf:lime', 'bowl:orange', 'lantern:crimson'];

const fmtWait = (sec: number): string =>
  sec < 60 ? UI_TEXT.pref.soonWait : UI_TEXT.pref.minutesWait(Math.ceil(sec / 60));

export class PrefScene extends Phaser.Scene {
  private prefId = '';
  private pref!: Prefecture;
  private scroll?: ScrollArea;
  private lastSig = '';
  /** 「いま やること」の 1行(状態が かわった ときだけ 作りなおす) */
  private taskRow?: Phaser.GameObjects.Container;
  private arrivalToast?: string;
  private arrivalFanfare = false;
  private lastTaskText = '';

  constructor() {
    super('PrefScene');
  }

  /** toast は 「まえの ばめんで 出したかった しらせ」。
      おせわ完了や 産地コンプの お祝いは、出した 直後に scene.start する と
      その シーンごと 消えて 1フレームも 見えない ので、
      こちらへ もってきて 出す(fanfare は 音も 鳴らす) */
  init(data: { prefId: string; toast?: string; fanfare?: boolean }): void {
    this.prefId = data.prefId;
    this.arrivalToast = data.toast;
    this.arrivalFanfare = data.fanfare ?? false;
  }

  create(): void {
    setupHiDpi(this);
    const pref = findPref(GAME_DATA, this.prefId);
    if (!pref) {
      this.scene.start('MapScene');
      return;
    }
    this.pref = pref;
    // Phaser は シーンを 作りなおさない。前の 県で のこった ガイド行を わすれさせる
    this.taskRow = undefined;
    this.lastTaskText = '';
    this.cameras.main.setBackgroundColor(COLORS.ground);
    this.buildTop();
    this.buildBanner();
    this.rebuildCards();
    buildNav(this, 'map');
    this.updateTaskRow();
    // まえの ばめんで 出したかった しらせ(おせわ できた / 産地コンプ)
    if (this.arrivalToast) {
      const msg = this.arrivalToast;
      const fanfare = this.arrivalFanfare;
      this.arrivalToast = undefined;
      this.arrivalFanfare = false;
      showToast(this, msg);
      if (fanfare) SFX.fanfare();
    }
    // はじめて けんに ついた ときだけ 「この まちで やること」を 3コマで 見せる
    if (!store.state.seenPrefGuide) this.time.delayedCall(400, () => this.showFirstGuide());

    // 1秒ティッカー: 状態シグネチャが変わった時だけ再描画(モーダル中は触らない)
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (Modal.isOpen()) return;
        this.updateTaskRow();
        if (this.sozaiSig() !== this.lastSig) this.rebuildCards();
      },
    });

    const refresh = (): void => {
      if (!this.scene.isActive() || Modal.isOpen()) return;
      this.rebuildCards();
      this.updateTaskRow();
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

  /* ---------- 「いま やること」の 1行 ---------- */

  /** core/nextTask の こたえを ことばに する。文は uiText がもつ */
  private taskText(t: NextTask): string {
    const T = UI_TEXT.pref.task;
    const name = t.name ?? '';
    switch (t.kind) {
      case 'care':
        return T.care(name);
      case 'harvest':
        return T.harvest(name);
      case 'infraFull':
        return T.infraFull(name);
      case 'festival':
        return T.festival(name);
      case 'craft':
        return T.craft(name);
      case 'findRecipe':
        return T.findRecipe;
      case 'plant':
        return T.plant(name);
      case 'growing':
        return T.growing;
      default:
        return T.done;
    }
  }

  /** いそぎの ことは ぴっけの かおも かえる */
  private taskMood(kind: NextTask['kind']): MascotMood {
    if (kind === 'care') return 'wow';
    if (kind === 'harvest' || kind === 'festival' || kind === 'craft') return 'happy';
    return 'normal';
  }

  private updateTaskRow(): void {
    const t = nextTask(store.state, this.pref, GAME_DATA, Date.now());
    const text = this.taskText(t);
    if (text === this.lastTaskText && this.taskRow) return;
    this.lastTaskText = text;
    this.taskRow?.destroy();
    const row = makeGuideRow(this, text, this.taskMood(t.kind), 440);
    row.container.setPosition(GAME_W / 2, TOP_H + BANNER_H - row.height / 2 - 4).setDepth(DEPTH.header - 1);
    this.taskRow = row.container;
  }

  /* ---------- はじめての ときの 3コマ ---------- */
  private showFirstGuide(step = 0): void {
    const G = UI_TEXT.pref.firstGuide;
    const last = step >= G.steps.length - 1;
    const modal = new Modal(this, G.title);
    modal.add(addIcon(this, 0, 0, FIRST_GUIDE_ICONS[step] ?? 'chick:amber', 54), 60);
    modal.addText(G.steps[step], 16);
    if (last) modal.addText(G.wait, 14, TEXT_COLORS.sub);
    modal.addButton(last ? G.start : G.next, COLORS.primary, () => {
      modal.close();
      if (last) {
        store.state.seenPrefGuide = true;
        store.save();
        this.updateTaskRow();
      } else {
        this.showFirstGuide(step + 1);
      }
    });
    modal.show();
  }

  private buildBanner(): void {
    // 風景バナー(暫定): 県色の丘+空+かざりアイコン
    const g = this.add.graphics();
    g.fillStyle(COLORS.sky, 1);
    g.fillRect(0, TOP_H, GAME_W, BANNER_H);
    const c = Phaser.Display.Color.HexStringToColor(this.pref.color ?? '#A9DC76').color;
    g.fillStyle(c, 0.9);
    g.fillEllipse(GAME_W * 0.7, TOP_H + BANNER_H + 18, GAME_W * 1.1, 70);
    g.fillStyle(c, 0.45);
    g.fillEllipse(GAME_W * 0.2, TOP_H + BANNER_H + 22, GAME_W * 0.9, 60);
    addIcon(this, GAME_W - 52, TOP_H + 24, 'sun:gold', 26);
    // かざりは そらの ところに おく。バナーの 下半分は 「いま やること」の ふきだしが つかう
    const deco = BANNER_DECO[this.prefId] ?? BANNER_DECO_DEFAULT;
    deco.forEach((key, i) => addIcon(this, 24 + 13 + i * 28, TOP_H + 22, key, 26));
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

    const shinOpen = isShinOpen(store.state, GAME_DATA, this.prefId);
    const prefMats = GAME_DATA.materials.filter((x) => x.origins.includes(this.prefId));

    // ちゅうもん: 晴れた 県では まちの ひとが 「ここでは 手に入らない もの」を たのんで くる。
    // よその 県へ 行く 動機に なる(core/orders.ts)。スロットが なければ ここで つくる
    const order = ensureOrder(store.state, GAME_DATA, this.prefId, Math.random);
    if (order) {
      store.save();
      addHeading(UI_TEXT.order.head);
      this.scroll.content.add(this.buildOrderCard(order, y));
      y += CARD_H + CARD_GAP + 6;
    }

    addHeading(UI_TEXT.pref.sozaiHead);
    for (const m of prefMats.filter((x) => !x.shin)) {
      this.scroll.content.add(this.buildSozaiCard(m, y));
      y += CARD_H + CARD_GAP;
    }

    // しんの めいさん: おまつりを ひらいた 県だけ。金いろの 見出しに いまの 季節
    if (shinOpen && prefMats.some((x) => x.shin)) {
      y += 6;
      const t = this.add
        .text(16, y, UI_TEXT.shin.head(SEASON_LABEL[seasonAt(Date.now())]), {
          fontFamily: FONT,
          fontSize: '17px',
          color: TEXT_COLORS.accent,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0);
      this.scroll?.content.add(t);
      y += t.height + 8;
      for (const m of prefMats.filter((x) => x.shin)) {
        this.scroll.content.add(this.buildSozaiCard(m, y));
        y += CARD_H + CARD_GAP;
      }
    }

    y += 6;
    addHeading(UI_TEXT.pref.recipeHead);
    const recipes = GAME_DATA.recipes
      .filter((x) => x.pref === this.prefId)
      // しんレシピは しんが ひらくまで 出さない。きわみ(Lv3)どうぐは 目ざめるまで
      .filter((x) => (!x.shin || shinOpen) && this.douguVisible(x))
      .sort((a, b) => a.tier - b.tier);
    for (const r of recipes) {
      this.scroll.content.add(this.buildRecipeCard(r, y));
      y += CARD_H + CARD_GAP;
    }
    this.scroll.setContentHeight(y + 12);
  }

  /* ---------- ちゅうもんカード ---------- */
  private buildOrderCard(order: Order, y: number): Phaser.GameObjects.Container {
    const e = findEntity(GAME_DATA, order.ref);
    const have = Math.min(matchOrderItems(store.state.inv, order).length, order.count);
    const ok = canFulfill(store.state, order);
    const c = this.cardBase(y, ok);
    // たのむ ひと(まちの ひと)を 絵で 見せて、「おねがい されている」と わかる ように
    c.add(addIcon(this, -CARD_W / 2 + 20, -CARD_H / 2 + 18, 'person:amber', 24));
    const where = this.whereChip({ ref: order.ref, count: order.count }, ok);
    this.cardTexts(
      c,
      e?.icon ?? 'question:gray',
      UI_TEXT.order.ask(e?.name ?? '?', order.count),
      `${have}/${order.count}${where ? `  ${where}` : ''}`,
    );
    this.cardButton(c, ok ? UI_TEXT.order.deliverBtn : UI_TEXT.order.collectingBtn, ok ? COLORS.orange : COLORS.gray, () => {
      if (!canFulfill(store.state, order)) {
        showToast(this, UI_TEXT.order.notEnough);
        return;
      }
      const res = fulfillOrder(store.state, GAME_DATA, this.prefId, Math.random);
      store.save();
      SFX.fanfare();
      confetti(this);
      const done = new Modal(this, UI_TEXT.order.thanksTitle);
      done.add(addIcon(this, 0, 0, e?.icon ?? 'question:gray', 50), 56);
      done.addText(UI_TEXT.order.thanks(e?.name ?? '?'), 17);
      if (res.kazari) {
        done.add(addIcon(this, 0, 0, res.kazari.icon, 44), 50);
        done.addText(UI_TEXT.order.kazariGet(res.kazari.name), 15, TEXT_COLORS.accent);
      }
      if (res.newTitle) done.addText(UI_TEXT.order.titleGet(res.newTitle), 15, TEXT_COLORS.good);
      done.addText(UI_TEXT.order.totalLine(res.total), 13, TEXT_COLORS.sub);
      done.addButton(UI_TEXT.recipe.yay, COLORS.primary, () => {
        done.close();
        this.rebuildCards();
      });
      done.show();
    });
    return c;
  }

  /** きわみ(Lv3)の どうぐレシピは、Lv2を もって いない うちは 出さない。
      もって いれば 「ねむって いる」カードで 出す(buildRecipeCard が 出しわけ) */
  private douguVisible(r: Recipe): boolean {
    if (!r.tool || r.tool.level < 3) return true;
    return toolLevel(store.state, r.tool.engine) >= 2;
  }

  /** きわみ(Lv3)レシピが 目ざめて いるか(つかいこみ 20回) */
  private douguAwake(r: Recipe): boolean {
    if (!r.tool || r.tool.level < 3) return true;
    return (store.state.toolUse[r.tool.engine] ?? 0) >= TOOL_LV3_USES;
  }

  private cardBase(y: number, ready = false, gold = false): Phaser.GameObjects.Container {
    const c = this.add.container(GAME_W / 2, y + CARD_H / 2);
    const g = this.add.graphics();
    g.fillStyle(COLORS.panel, 1);
    // 金ふち = しんの めいさん(とくべつ感)。じゅんびOK(オレンジ)より 優先度は ひくい
    g.lineStyle(gold && !ready ? 3 : 2, ready ? COLORS.orange : gold ? COLORS.gold : COLORS.panelLine, 1);
    g.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14);
    g.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14);
    c.add(g);
    return c;
  }

  /** カードの 絵+なまえ+せつめい。stars を わたすと せつめいの うしろに ほしアイコンを ならべる。
      もどり値は 絵の Image(ゆれる 演出などに つかう) */
  private cardTexts(
    c: Phaser.GameObjects.Container,
    icon: IconKey,
    name: string,
    sub: string,
    stars = 0,
  ): Phaser.GameObjects.Image {
    const img = addIcon(this, -CARD_W / 2 + 36, 0, icon, 34);
    c.add(img);
    const nameT = this.add
      .text(-CARD_W / 2 + 70, -14, name, {
        fontFamily: FONT,
        fontSize: '16px',
        color: TEXT_COLORS.main,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    shrinkToWidth(nameT, TEXT_MAX_W); // ボタンに かさならない はばに おさめる
    c.add(nameT);
    const subT = this.add
      .text(-CARD_W / 2 + 70, 12, sub, {
        fontFamily: FONT,
        fontSize: '12px',
        color: TEXT_COLORS.sub,
        wordWrap: { width: 240 },
      })
      .setOrigin(0, 0.5);
    c.add(subT);
    for (let i = 0; i < stars; i++) {
      c.add(addIcon(this, subT.x + subT.width + 8 + i * (STAR_SIZE + 1), 12, STAR_ICON, STAR_SIZE));
    }
    return img;
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
        fontSize: 14, // ながい ことばは makeButton が おりかえし+縮小で おさめる
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
    // ほしは アイコンで ならべるので、ことばだけ もらう
    const starsTxt = known ? UI_TEXT.pref.bestStars('').trimEnd() : UI_TEXT.pref.notObtained;
    const starsN = known ?? 0;
    const badge = RARITY_LABEL[m.rarity] ? ` ${RARITY_LABEL[m.rarity]}` : '';

    if (g.type === 'infra') {
      const rec = ensureInfra(s, m.id, this.prefId, now);
      const st = infraStock(rec, g, now);
      const nextSec = infraNextSec(rec, g, now);
      const sub =
        UI_TEXT.pref.stock(st, g.max) + (st >= g.max ? UI_TEXT.pref.stockFull : UI_TEXT.pref.stockNext(fmtWait(nextSec)));
      const c = this.cardBase(y);
      this.cardTexts(c, g.bIcon, `${m.name}の ${g.building}`, sub);
      this.cardButton(c, g.collectVerb, st > 0 ? COLORS.primary : COLORS.gray, () => {
        const got = collectInfra(s, m, this.prefId, Date.now());
        if (got <= 0) {
          showToast(this, UI_TEXT.pref.notYet);
          return;
        }
        store.save();
        SFX.collect();
        showToast(this, UI_TEXT.pref.collected('', m.name, got).trimStart());
        showTriviaOnce(this, m.id, () => this.rebuildCards());
      });
      return c;
    }

    /* 季節外れ(しんの 激レア): うえはじめ・あそびはじめを 止めて 案内だけ 出す。
       そだち中・しゅうかく待ちの 畑には さわらない(枯れ・没収は しない) */
    const seasonWait =
      !inSeason(m, now) && (g.type !== 'plant' || plotState(s.plots[plotKey(this.prefId, m.id)], g, now).st === 'empty')
        ? UI_TEXT.shin.seasonWait(SEASON_LABEL[m.season!])
        : null;
    if (seasonWait) {
      const c = this.cardBase(y, false, true);
      this.cardTexts(c, m.icon, m.name + badge, seasonWait);
      this.cardButton(c, g.verb, COLORS.gray, () => showToast(this, seasonWait));
      return c;
    }

    if (g.type === 'plant') {
      const view = plotState(s.plots[plotKey(this.prefId, m.id)], g, now);
      if (view.st === 'empty') {
        const c = this.cardBase(y, false, m.shin === true);
        this.cardTexts(c, FIELD_ICON, UI_TEXT.pref.fieldName(m.name, g.fieldLabel) + badge, starsTxt, starsN);
        this.cardButton(c, g.verb, COLORS.primary, () => {
          plantSeed(s, m.id, this.prefId, Date.now());
          store.save();
          SFX.plant();
          showToast(this, UI_TEXT.pref.planted('', m.name).trimStart());
          this.rebuildCards();
        });
        return c;
      }
      if (view.st === 'growing') {
        const remain = Math.ceil((g.growSec * 1000 - (now - view.plot.plantedAt)) / 1000);
        const c = this.cardBase(y);
        this.cardTexts(c, SPROUT_ICON, m.name + badge, UI_TEXT.pref.growing(fmtWait(remain)));
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
      const img = this.cardTexts(c, m.icon, m.name + badge, UI_TEXT.pref.ready);
      wobble(this, img); // 実がぷるんと揺れる
      this.cardButton(c, UI_TEXT.pref.harvestBtn, COLORS.primary, () =>
        this.scene.start('SessionScene', { matId: m.id, prefId: this.prefId, mode: 'harvest' }),
      );
      return c;
    }

    // timing / dig: 待ちなしミニゲーム
    const c = this.cardBase(y, false, m.shin === true);
    this.cardTexts(c, m.icon, m.name + badge, starsTxt, starsN);
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
    return `${e.name}${extra}${this.whereChip(ing, have >= ing.count)} ${have}/${ing.count}`;
  }

  /** この県では とれない ざいりょうに 「どこへ 行けば いいか」を そえる。
      どこを 見せるかの きめかたは core/whereFrom.ts(テストつき) */
  private whereChip(ing: Ingredient, enough: boolean): string {
    const w = whereFrom(GAME_DATA, this.prefId, ing, enough);
    if (!w) return '';
    return UI_TEXT.recipe.whereChip(findPref(GAME_DATA, w.pref)?.name ?? '', w.count);
  }

  private buildRecipeCard(r: Recipe, y: number): Phaser.GameObjects.Container {
    const s = store.state;
    if (r.tier === 4) return this.buildFestivalCard(r, y);
    const tierLabel = r.type === 'dougu' ? UI_TEXT.dougu.tier : TIER_LABEL[r.tier];

    // きわみ(Lv3)の どうぐ: つかいこみが たりない うちは ねむった まま(さがせない)
    if (r.tool?.level === 3 && !this.douguAwake(r)) {
      const c = this.cardBase(y);
      const remain = Math.max(1, TOOL_LV3_USES - (s.toolUse[r.tool.engine] ?? 0));
      this.cardTexts(c, 'question:gray', UI_TEXT.recipe.unknownName, UI_TEXT.dougu.lv3Sleeping(remain));
      return c;
    }

    const owned = s.recipes.includes(r.id);
    if (!owned) {
      const c = this.cardBase(y, false, r.shin === true);
      this.cardTexts(c, 'question:gray', UI_TEXT.recipe.unknownName, UI_TEXT.recipe.sleeping(tierLabel));
      this.cardButton(c, UI_TEXT.recipe.searchBtn, COLORS.orange, () => this.startRecipeGet(r));
      return c;
    }

    const crafted = s.zukanProd[r.id];
    const jimoto = crafted?.jimoto ? ` ${UI_TEXT.recipe.jimotoChip}` : '';
    const ings = r.ingredients.map((ing) => this.ingChipText(ing)).join('  ');
    const c = this.cardBase(y, false, r.shin === true);
    this.cardTexts(c, r.icon, `${r.name}〔${tierLabel}〕${jimoto}`, ings);
    // どうぐは 1回 作れば じゅうぶん(もう一度 作ると 材料の むだ)。ボタンを 済みに かえる
    if (r.tool && toolLevel(s, r.tool.engine) >= r.tool.level) {
      this.cardButton(c, UI_TEXT.recipe.craftedChip, COLORS.gray, () => {
        showToast(this, UI_TEXT.dougu.done(r.name));
      });
      return c;
    }
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
        done.add(addIcon(this, 0, 0, r.icon, 54), 60);
        done.addText(UI_TEXT.recipe.found(r.name), 18);
        const ings = r.ingredients
          .map((g) => {
            const e = findEntity(GAME_DATA, g.ref);
            return e ? `${e.name}×${g.count}` : '';
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
    modal.add(addIcon(this, 0, 0, r.icon, 50), 56);
    modal.addText(UI_TEXT.craft.confirm(r.name), 18);
    // ざいりょうの 絵を よこに ならべる(できるもの の 絵は 上に 出ている)
    const row = this.add.container(0, 0);
    const step = 76;
    r.ingredients.forEach((g, i) => {
      const e = findEntity(GAME_DATA, g.ref);
      if (!e) return;
      const cx = (i - (r.ingredients.length - 1) / 2) * step;
      row.add(addIcon(this, cx - 14, 0, e.icon, 34));
      row.add(
        this.add
          .text(cx + 8, 0, `×${g.count}`, { fontFamily: FONT, fontSize: '17px', color: TEXT_COLORS.main })
          .setOrigin(0, 0.5),
      );
    });
    modal.add(row, 40);
    // つかう そざいの 一覧(できばえは ほしアイコン)
    const usedBox = this.add.container(0, 0);
    const lineH = 20;
    used.forEach((it, i) => {
      const e = findEntity(GAME_DATA, it.ref);
      const origin = findPref(GAME_DATA, it.origin)?.name ?? '';
      const ly = (i - (used.length - 1) / 2) * lineH;
      const q = it.quality ?? 0;
      const t = this.add
        .text(0, ly, `${e?.name ?? ''}(${UI_TEXT.recipe.originChip(origin)})`, {
          fontFamily: FONT,
          fontSize: '13px',
          color: TEXT_COLORS.sub,
        })
        .setOrigin(0.5);
      const total = t.width + (q ? 6 + q * (STAR_SIZE - 1) : 0);
      t.x = -total / 2 + t.width / 2;
      usedBox.add(t);
      for (let s = 0; s < q; s++) {
        usedBox.add(addIcon(this, -total / 2 + t.width + 6 + s * (STAR_SIZE - 1) + 5, ly, STAR_ICON, STAR_SIZE - 1));
      }
    });
    modal.add(usedBox, used.length * lineH);
    modal.addButton(UI_TEXT.craft.doIt, COLORS.primary, () => {
      const { jimoto } = applyCraft(store.state, r);
      store.save();
      SFX.fanfare();
      confetti(this);
      modal.close();
      const done = new Modal(this, UI_TEXT.craft.doneTitle);
      done.add(addIcon(this, 0, 0, r.icon, 54), 60);
      // どうぐは 「なにが うれしいか」を そのばで つたえる
      done.addText(r.tool ? UI_TEXT.dougu.done(r.name) : UI_TEXT.craft.done(r.name), 18);
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
      this.cardTexts(c, r.icon, `${r.name}〔${TIER_LABEL[4]}〕`, UI_TEXT.fest.preparing);
      return c;
    }
    // まつり名は長いのでタイトルは名前だけにし、開催ずみバッジは下段に置く(ボタンと重ねない)
    const ings = r.ingredients.map((ing) => this.ingChipText(ing)).join('  ');
    this.cardTexts(c, r.icon, r.name, held ? `${UI_TEXT.fest.held}  ${ings}` : ings);
    const ok = craftable(s.inv, r);
    this.cardButton(c, held ? UI_TEXT.fest.againBtn : UI_TEXT.fest.openBtn, ok ? COLORS.orange : COLORS.gray, () => {
      if (craftable(store.state.inv, r)) this.startFestival(r);
      else showToast(this, UI_TEXT.fest.needMeibutsu);
    });
    return c;
  }

  private startFestival(r: Recipe): void {
    const kind = r.festGame ?? 'yatai';
    const go = (): void => {
      this.scene.start('FestivalScene', { recipeId: r.id, prefId: this.prefId });
    };
    // 2回目からは 説明を 出さずに すぐ 始める(毎回 全文が 出ると じゃま)。
    // 忘れた ときは ゲーム中の 「?」ボタンで 見なおせる
    if (store.state.playedGame[kind]) {
      const best = store.state.festBest[r.id];
      if (best) showToast(this, UI_TEXT.fest.bestScore(best));
      go();
      return;
    }
    const modal = new Modal(this, r.name, true);
    modal.add(addIcon(this, 0, 0, r.icon, 54), 60);
    modal.addText(festIntro(kind), 15);
    const best = store.state.festBest[r.id];
    if (best) modal.addText(UI_TEXT.fest.bestScore(best), 14, TEXT_COLORS.accent);
    modal.addButton(UI_TEXT.fest.startBtn, COLORS.orange, () => {
      modal.close();
      go();
    });
    modal.show();
  }
}

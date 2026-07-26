/* おまつりシーン(tier4・集大成): やたいラッシュを遊び、さいこうスコアに挑む。
   めいぶつは 開催のたびに 消費する(なんどでも 開催できる)。
   消費と fest 登録は ゲームを最後まで遊んだ finish() 時点で行う
   (とちゅうで もどっても なにも 失わない=成功保証) */
import Phaser from 'phaser';
import { setupHiDpi } from '../ui/display';
import { findEntity, findPref, findRecipe, GAME_DATA, prefTitle, type Recipe } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { applyFestival, craftable, updateFestBest } from '../core/craft';
import { store } from '../game/store';
import { setHook } from '../game/testHooks';
import { SFX } from '../audio/sfx';
import { setBgmTrack } from '../audio/bgm';
import { showTriviaOnce } from '../ui/trivia';
import { COLORS, DEPTH, FONT, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import { makeGuideRow, Modal } from '../ui/widgets';
import { confetti, firework, screenFlash } from '../ui/effects';
import { renderFestival, type StallItem } from './minigames/festivalGame';
import { renderDaruma } from './minigames/darumaGame';
import { renderHanabi } from './minigames/hanabiGame';
import { renderDashi } from './minigames/dashiGame';
import { renderMikoshi } from './minigames/mikoshiGame';
import { renderRokuro } from './minigames/rokuroGame';
import { renderSousen } from './minigames/sousenGame';
import { renderNebuta } from './minigames/nebutaGame';
import { renderSansa } from './minigames/sansaGame';
import { renderTanabata } from './minigames/tanabataGame';
import { renderKantou } from './minigames/kantouGame';
import { renderHanagasa } from './minigames/hanagasaGame';
import { renderWaraji } from './minigames/warajiGame';
import { renderYukimatsuri } from './minigames/yukimatsuriGame';
import { renderMinyou } from './minigames/minyouGame';
import { renderOwara } from './minigames/owaraGame';
import { renderTourou } from './minigames/tourouGame';
import { renderKani } from './minigames/kaniGame';
import { renderHimatsuri } from './minigames/himatsuriGame';
import { renderOnbashira } from './minigames/onbashiraGame';
import { renderKarakuri } from './minigames/karakuriGame';
import { renderTako } from './minigames/takoGame';
import { renderMakiwara } from './minigames/makiwaraGame';
import { renderIshidori } from './minigames/ishidoriGame';
import { renderKabuki } from './minigames/kabukiGame';
import { renderGion } from './minigames/gionGame';
import { renderDanjiri } from './minigames/danjiriGame';
import { renderFukuotoko } from './minigames/fukuotokoGame';
import { renderYamayaki } from './minigames/yamayakiGame';
import { renderOugi } from './minigames/ougiGame';
import { renderShanshan } from './minigames/shanshanGame';
import { renderKagura } from './minigames/kaguraGame';
import { renderEyou } from './minigames/eyouGame';
import { renderBetcha } from './minigames/betchaGame';
import { renderKingyo } from './minigames/kingyoGame';
import { renderAwaodori } from './minigames/awaodoriGame';
import { renderChousa } from './minigames/chousaGame';
import { renderUshioni } from './minigames/ushioniGame';
import { renderYosakoi } from './minigames/yosakoiGame';
import { renderYamakasa } from './minigames/yamakasaGame';
import { renderBalloon } from './minigames/balloonGame';
import { renderKokkodesho } from './minigames/kokkodeshoGame';
import { renderKazariuma } from './minigames/kazariumaGame';
import { renderYukake } from './minigames/yukakeGame';
import { renderHyottoko } from './minigames/hyottokoGame';
import { renderRokugatsudo } from './minigames/rokugatsudoGame';
import { renderTsunahiki } from './minigames/tsunahikiGame';
import type { MinigameApi } from './minigames/types';

const TOP_H = 48;
const GAME_AREA_Y = TOP_H + 4;

export class FestivalScene extends Phaser.Scene {
  private recipeId = '';
  private prefId = '';
  private recipe!: Recipe;
  private gameScore = 0;
  private area?: Phaser.GameObjects.Container;

  constructor() {
    super('FestivalScene');
  }

  init(data: { recipeId: string; prefId: string }): void {
    this.recipeId = data.recipeId;
    this.prefId = data.prefId;
  }

  create(): void {
    setupHiDpi(this);
    const r = findRecipe(GAME_DATA, this.recipeId);
    // めいぶつが足りないまま直接呼ばれた場合の保険(PrefScene 側でも確認している)
    if (!r || !craftable(store.state.inv, r)) {
      this.scene.start('PrefScene', { prefId: this.prefId });
      return;
    }
    this.recipe = r;
    this.gameScore = 0;
    this.cameras.main.setBackgroundColor(0x243057);

    // ヘッダー(もどる=開催せずに帰る。なにも消費しない)
    const head = this.add.container(0, 0).setDepth(DEPTH.header);
    head.add(this.add.rectangle(GAME_W / 2, TOP_H / 2, GAME_W, TOP_H, COLORS.headerBg));
    const back = this.add
      .text(12, TOP_H / 2, UI_TEXT.session.back, {
        fontFamily: FONT,
        fontSize: '16px',
        color: TEXT_COLORS.good,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('PrefScene', { prefId: this.prefId }));
    head.add(back);
    head.add(
      this.add
        .text(GAME_W / 2 + 10, TOP_H / 2, r.name, {
          fontFamily: FONT,
          fontSize: '16px',
          color: TEXT_COLORS.main,
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    // おまつりBGM(はなびは夜空なので夜の曲)。シーンを離れたら通常曲へ
    setBgmTrack(r.festGame === 'hanabi' ? 'night' : 'fest');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => setBgmTrack('day'));

    this.area = this.add.container(0, GAME_AREA_Y);
    // おまつりごとのゲーム(データ駆動)。全県ユニーク化の方針は docs/ACTION_DESIGN.md
    const api = this.minigameApi();
    switch (r.festGame ?? 'yatai') {
      case 'daruma':
        renderDaruma(api, UI_TEXT.fest.darumaPrompt);
        break;
      case 'hanabi':
        renderHanabi(api, UI_TEXT.fest.hanabiPrompt);
        break;
      case 'dashi':
        renderDashi(api, UI_TEXT.fest.dashiPrompt);
        break;
      case 'mikoshi':
        renderMikoshi(api, UI_TEXT.fest.mikoshiPrompt);
        break;
      case 'rokuro':
        renderRokuro(api, UI_TEXT.fest.rokuroPrompt);
        break;
      case 'sousen':
        renderSousen(api, UI_TEXT.fest.sousenPrompt);
        break;
      case 'nebuta':
        renderNebuta(api, UI_TEXT.fest.nebutaPrompt);
        break;
      case 'sansa':
        renderSansa(api, UI_TEXT.fest.sansaPrompt);
        break;
      case 'tanabata':
        renderTanabata(api, UI_TEXT.fest.tanabataPrompt);
        break;
      case 'kantou':
        renderKantou(api, UI_TEXT.fest.kantouPrompt);
        break;
      case 'hanagasa':
        renderHanagasa(api, UI_TEXT.fest.hanagasaPrompt);
        break;
      case 'waraji':
        renderWaraji(api, UI_TEXT.fest.warajiPrompt);
        break;
      case 'yukimatsuri':
        renderYukimatsuri(api, UI_TEXT.fest.yukimatsuriPrompt);
        break;
      case 'minyou':
        renderMinyou(api, UI_TEXT.fest.minyouPrompt);
        break;
      case 'owara':
        renderOwara(api, UI_TEXT.fest.owaraPrompt);
        break;
      case 'tourou':
        renderTourou(api, UI_TEXT.fest.tourouPrompt);
        break;
      case 'kani':
        renderKani(api, UI_TEXT.fest.kaniPrompt);
        break;
      case 'himatsuri':
        renderHimatsuri(api, UI_TEXT.fest.himatsuriPrompt);
        break;
      case 'onbashira':
        renderOnbashira(api, UI_TEXT.fest.onbashiraPrompt);
        break;
      case 'karakuri':
        renderKarakuri(api, UI_TEXT.fest.karakuriPrompt);
        break;
      case 'tako':
        renderTako(api, UI_TEXT.fest.takoPrompt);
        break;
      case 'makiwara':
        renderMakiwara(api, UI_TEXT.fest.makiwaraPrompt);
        break;
      case 'ishidori':
        renderIshidori(api, UI_TEXT.fest.ishidoriPrompt);
        break;
      case 'kabuki':
        renderKabuki(api, UI_TEXT.fest.kabukiPrompt);
        break;
      case 'gion':
        renderGion(api, UI_TEXT.fest.gionPrompt);
        break;
      case 'danjiri':
        renderDanjiri(api, UI_TEXT.fest.danjiriPrompt);
        break;
      case 'fukuotoko':
        renderFukuotoko(api, UI_TEXT.fest.fukuotokoPrompt);
        break;
      case 'yamayaki':
        renderYamayaki(api, UI_TEXT.fest.yamayakiPrompt);
        break;
      case 'ougi':
        renderOugi(api, UI_TEXT.fest.ougiPrompt);
        break;
      case 'shanshan':
        renderShanshan(api, UI_TEXT.fest.shanshanPrompt);
        break;
      case 'kagura':
        renderKagura(api, UI_TEXT.fest.kaguraPrompt);
        break;
      case 'eyou':
        renderEyou(api, UI_TEXT.fest.eyouPrompt);
        break;
      case 'betcha':
        renderBetcha(api, UI_TEXT.fest.betchaPrompt);
        break;
      case 'kingyo':
        renderKingyo(api, UI_TEXT.fest.kingyoPrompt);
        break;
      case 'awaodori':
        renderAwaodori(api, UI_TEXT.fest.awaodoriPrompt);
        break;
      case 'chousa':
        renderChousa(api, UI_TEXT.fest.chousaPrompt);
        break;
      case 'ushioni':
        renderUshioni(api, UI_TEXT.fest.ushioniPrompt);
        break;
      case 'yosakoi':
        renderYosakoi(api, UI_TEXT.fest.yosakoiPrompt);
        break;
      case 'yamakasa':
        renderYamakasa(api, UI_TEXT.fest.yamakasaPrompt);
        break;
      case 'balloon':
        renderBalloon(api, UI_TEXT.fest.balloonPrompt);
        break;
      case 'kokkodesho':
        renderKokkodesho(api, UI_TEXT.fest.kokkodeshoPrompt);
        break;
      case 'kazariuma':
        renderKazariuma(api, UI_TEXT.fest.kazariumaPrompt);
        break;
      case 'yukake':
        renderYukake(api, UI_TEXT.fest.yukakePrompt);
        break;
      case 'hyottoko':
        renderHyottoko(api, UI_TEXT.fest.hyottokoPrompt);
        break;
      case 'rokugatsudo':
        renderRokugatsudo(api, UI_TEXT.fest.rokugatsudoPrompt);
        break;
      case 'tsunahiki':
        renderTsunahiki(api, UI_TEXT.fest.tsunahikiPrompt);
        break;
      default:
        renderFestival(api, UI_TEXT.fest.prompt, this.buildMenu());
    }
  }

  /** やたいの 品ぞろえ: recipe.menu(未指定なら ingredients)を解決する */
  private buildMenu(): StallItem[] {
    const refs = this.recipe.menu ?? this.recipe.ingredients.map((i) => i.ref);
    const items: StallItem[] = [];
    for (const ref of refs) {
      const e = findEntity(GAME_DATA, ref);
      if (e) items.push({ ref, icon: e.icon, name: e.name });
    }
    return items;
  }

  private minigameApi(): MinigameApi {
    return {
      scene: this,
      area: this.area!,
      areaY: GAME_AREA_Y,
      addScore: (n) => {
        this.gameScore += n;
      },
      advance: (delayMs) => {
        this.time.delayedCall(delayMs, () => this.finish());
      },
      feedback: () => undefined,
      sign: (text) => {
        const t = this.add
          .text(GAME_W / 2, 54, text, {
            fontFamily: FONT,
            fontSize: '14px',
            color: TEXT_COLORS.main,
            align: 'center',
            wordWrap: { width: 400 },
            backgroundColor: '#fff8e7',
            padding: { x: 12, y: 6 },
          })
          .setOrigin(0.5, 0)
          .setAlpha(0.95);
        this.area?.add(t);
        this.tweens.add({ targets: t, alpha: 0.25, delay: 4000, duration: 500 });
      },
      lockStar3: () => undefined, // おまつりは★なし(さいこうスコア制)
    };
  }

  /* ---------- 開催成立: 消費+登録+きろく更新+フィナーレ演出 ---------- */
  private finish(): void {
    setHook({ kind: 'done' });
    const r = this.recipe;
    applyFestival(store.state, r);
    const newRecord = updateFestBest(store.state, r.id, this.gameScore);
    store.save();

    SFX.fest();
    screenFlash(this, 0xfff2c4, 0.4);
    confetti(this);
    // はなび+ちょうちんが のぼる フィナーレ
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 350, () => firework(this, 50 + Math.random() * (GAME_W - 100), 120 + Math.random() * 140));
    }
    for (let i = 0; i < 8; i++) {
      const l = this.add
        .text(40 + Math.random() * (GAME_W - 80), GAME_H + 30, '🏮', { fontSize: '30px' })
        .setDepth(DEPTH.overlay);
      this.tweens.add({
        targets: l,
        y: -40,
        duration: 2200 + Math.random() * 800,
        delay: Math.random() * 900,
        ease: 'Sine.easeIn',
        onComplete: () => l.destroy(),
      });
    }

    this.time.delayedCall(1500, () => {
      const pref = findPref(GAME_DATA, this.prefId);
      const best = store.state.festBest[r.id] ?? this.gameScore;
      const modal = new Modal(this, UI_TEXT.fest.doneTitle);
      modal.add(this.add.text(0, 0, '🏮🎆🏮', { fontSize: '44px' }).setOrigin(0.5), 52);
      modal.addText(UI_TEXT.fest.doneBody(r.name), 18);
      modal.addText(UI_TEXT.session.scoreLine(this.gameScore), 17, TEXT_COLORS.accent);
      modal.addText(
        newRecord ? UI_TEXT.fest.newRecord : UI_TEXT.fest.bestScore(best),
        15,
        newRecord ? TEXT_COLORS.good : TEXT_COLORS.sub,
      );
      const guide = makeGuideRow(this, UI_TEXT.fest.doneGuide(pref ? prefTitle(pref) : ''), 'happy');
      modal.add(guide.container, guide.height);
      modal.addButton(UI_TEXT.fest.goMap, COLORS.orange, () => {
        modal.close();
        showTriviaOnce(this, r.id, () => this.scene.start('MapScene'));
      });
      modal.show();
    });
  }
}

/* 地図画面: 実形パスの地方地図(かんとう/とうほく…)・雲(未開拓)・開拓フロー・ぴっけの案内。
   どの地方を表示するかは scene data の regionId(なければ前回の地方)で決まる */
import Phaser from 'phaser';
import { addIcon } from '../ui/icons';
import { setupHiDpi } from '../ui/display';
import { GAME_DATA, prefTitle, type Prefecture } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { pickKaitakuQuiz, recordQuizAsked } from '../core/quiz';
import { infraStock, plotState, matIdOfKey } from '../core/plots';
import { findMaterial } from '../data/gameData';
import { store, runtimeStory } from '../game/store';
import {
  hareFlagKey,
  isAllHare,
  isRegionComp,
  regionCompFlagKey,
} from '../core/state';
import { getMapAsset, hasMapAsset } from '../game/mapData';
import { SFX } from '../audio/sfx';
import { buildHeader, buildNav, HEADER_H } from '../ui/nav';
import { runQuizModal } from '../ui/quizRunner';
import { COLORS, DEPTH, FONT, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import { makeGuideRow, Modal, showToast, type MascotMood } from '../ui/widgets';
import { blowAwayCloud, burst, confetti } from '../ui/effects';

/** セーブが こわれていた ときに もどる エリア(はじめの エリア) */
const FALLBACK_REGION = 'kanto';
const GUIDE_UPDATE_MS = 3000;
const TIP_ROTATE_MS = 9000;

export class MapScene extends Phaser.Scene {
  private guideBox?: Phaser.GameObjects.Container;
  private lastGuideText = '';
  private regionId = FALLBACK_REGION;
  /** 晴れシネマ(雲の ふきとび)を 再生中は 入力を うけない */
  private hareCinema = false;
  /** シネマで つかう、地図の おきばしょ(drawMap で きまる) */
  private mapOffX = 0;
  private mapOffY = 0;
  private mapScale = 1;
  /** シネマ待ちの 県(晴れたのに シネマを まだ 見ていない)と、その もや */
  private pendingHare?: { p: Prefecture; lx: number; ly: number; mist?: Phaser.GameObjects.Container };

  constructor() {
    super('MapScene');
  }

  init(data: { regionId?: string }): void {
    // セーブに 知らない エリア名が 入っていても 白い画面に しない。
    // (むかしの セーブ・ためしに いじった セーブ・データから 消した エリアで
    //  地図の よみこみに しっぱいして なにも 出なくなる ことが あった)
    const want = data.regionId ?? store.state.currentRegion ?? FALLBACK_REGION;
    const known = GAME_DATA.regions.some((r) => r.id === want && r.active) && hasMapAsset(want);
    this.regionId = known ? want : FALLBACK_REGION;
  }

  create(): void {
    setupHiDpi(this);
    // Phaser は シーンを 作りなおさない ので、シネマの のこりものを わすれる
    this.hareCinema = false;
    this.pendingHare = undefined;
    this.lastGuideText = '';
    if (store.state.currentRegion !== this.regionId) {
      store.state.currentRegion = this.regionId;
      store.save();
    }
    this.cameras.main.setBackgroundColor(COLORS.sky);
    this.drawSea();
    this.drawMap();
    buildHeader(this);
    buildNav(this, 'map');
    this.buildJapanButton();
    this.buildRegionBanner();
    // 晴れたのに おいわいが まだの 県が あれば、地図が 見えてから シネマ。
    // さきに 立てて おくと updateGuide が だまる(シネマ中に ふきだしが かぶらない)
    if (this.pendingHare) {
      const refs = this.pendingHare;
      this.hareCinema = true;
      this.time.delayedCall(650, () => this.playHareCinema(refs));
    }
    this.updateGuide();
    this.time.addEvent({ delay: GUIDE_UPDATE_MS, loop: true, callback: () => this.updateGuide() });

    const refresh = (): void => {
      if (this.scene.isActive()) this.scene.restart();
    };
    this.game.events.on('mq-refresh', refresh);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off('mq-refresh', refresh));
  }

  /** にほんぜんこく画面への入り口(左上のチップ) */
  private buildJapanButton(): void {
    const c = this.add.container(12, HEADER_H + 12);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.92);
    g.lineStyle(2, COLORS.panelLine, 1);
    g.fillRoundedRect(0, 0, 118, 32, 16);
    g.strokeRoundedRect(0, 0, 118, 32, 16);
    c.add(g);
    c.add(
      this.add
        .text(59, 16, UI_TEXT.map.japanBtn, {
          fontFamily: FONT,
          fontSize: '13px',
          color: TEXT_COLORS.main,
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
    c.setInteractive(new Phaser.Geom.Rectangle(0, 0, 118, 32), Phaser.Geom.Rectangle.Contains);
    c.on('pointerup', () => this.scene.start('RegionScene'));
  }

  /** いま どこの エリアの 地図かを 見せる 帯。
      エリアの 地図は どれも 「県が ならんだ 島」なので、名前が ないと
      ちゅうぶ と きんき の 見わけが つかない(実際に まよった)。
      エリアの 色を そのまま 帯に つかい、にっぽん地図の 色と 目で つながる ように する */
  private buildRegionBanner(): void {
    const region = GAME_DATA.regions.find((r) => r.id === this.regionId);
    if (!region) return;
    const x = 12 + 118 + 10;
    const c = this.add.container(x, HEADER_H + 12);
    const label = this.add
      .text(40, 16, UI_TEXT.map.nowRegion(region.name), {
        fontFamily: FONT,
        fontSize: '15px',
        color: TEXT_COLORS.main,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    // ふだの はばは 名前に あわせる(「かんとう」で 画面いっぱいに ならない ように)
    const W = Math.min(40 + label.width + 14, GAME_W - 12 - x);
    const color = Phaser.Display.Color.HexStringToColor(region.color).color;
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.lineStyle(2, COLORS.panelLine, 1);
    g.fillRoundedRect(0, 0, W, 32, 16);
    g.strokeRoundedRect(0, 0, W, 32, 16);
    c.add(g);
    c.add(addIcon(this, 22, 16, region.icon, 22));
    c.add(label);
  }

  private drawSea(): void {
    // 海: グラデーション+ゆらめく波線+描画の太陽・雲(絵文字は使わない)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xbfe9f7, 0xbfe9f7, 0x8fd0e0, 0x8fd0e0, 1);
    bg.fillRect(0, HEADER_H, GAME_W, GAME_H - HEADER_H);
    for (let i = 0; i < 5; i++) {
      const wave = this.add.graphics();
      wave.lineStyle(2.5, 0xffffff, 0.28);
      const y = HEADER_H + 90 + i * 130;
      wave.beginPath();
      for (let x = -20; x <= GAME_W + 20; x += 8) {
        const wy = y + Math.sin(x / 30 + i * 1.7) * 4;
        if (x === -20) wave.moveTo(x, wy);
        else wave.lineTo(x, wy);
      }
      wave.strokePath();
      this.tweens.add({
        targets: wave,
        x: { from: -14, to: 14 },
        duration: 2600 + i * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    // 太陽(光条つき)。上は エリア名の ふだ、まん中は 地図なので 右下の 海に おく
    const sun = this.add.container(GAME_W - 50, GAME_H - 200);
    const sg = this.add.graphics();
    sg.fillStyle(0xffd34d, 1);
    sg.fillCircle(0, 0, 17);
    sg.lineStyle(3, 0xf0b429, 1);
    for (let a = 0; a < 8; a++) {
      const rad = (a * Math.PI) / 4;
      sg.lineBetween(Math.cos(rad) * 23, Math.sin(rad) * 23, Math.cos(rad) * 29, Math.sin(rad) * 29);
    }
    sun.add(sg);
    this.tweens.add({ targets: sun, angle: 360, duration: 60000, repeat: -1 });
    // 流れる雲
    for (const [cx, cy, sc] of [[90, HEADER_H + 60, 0.9], [350, GAME_H - 150, 0.7]] as const) {
      const cloud = this.add.container(cx, cy).setAlpha(0.8).setScale(sc);
      const cg = this.add.graphics();
      cg.fillStyle(0xffffff, 1);
      cg.fillEllipse(0, 0, 70, 26);
      cg.fillEllipse(-20, 6, 42, 20);
      cg.fillEllipse(22, 6, 44, 22);
      cloud.add(cg);
      this.tweens.add({
        targets: cloud,
        x: cx + 36,
        duration: 10000 + Math.random() * 4000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private drawMap(): void {
    const map = getMapAsset(this.regionId);
    const scale = Math.min((GAME_W - 20) / map.viewW, 560 / map.viewH);
    const offX = (GAME_W - map.viewW * scale) / 2;
    const offY = HEADER_H + 24;
    const root = this.add.container(offX, offY).setScale(scale);
    this.mapOffX = offX;
    this.mapOffY = offY;
    this.mapScale = scale;

    /* 晴れたのに シネマを まだ 見ていない 県(ふつうは 0か1)。
       その県だけ 「もや あり・🏮なし」で 描いて おき、シネマで はらす。
       E2E(skipGuides)では シネマを とばして ふつうに 描く */
    const regionPrefs = GAME_DATA.prefectures.filter((x) => x.region === this.regionId);
    const pendingPref = runtimeStory.muted
      ? undefined
      : regionPrefs.find(
          (x) =>
            x.active &&
            x.festivalId !== undefined &&
            store.state.fest.includes(x.festivalId) &&
            !store.state.flags[hareFlagKey(x.id)],
        );

    for (const p of regionPrefs) {
      const poly = map.polys[p.id];
      if (!poly) continue;
      const unlocked = store.state.unlocked.includes(p.id);
      const done =
        p.festivalId !== undefined && store.state.fest.includes(p.festivalId) && p !== pendingPref;

      let fill: number = COLORS.inactivePref;
      if (p.active) {
        fill = unlocked ? Phaser.Display.Color.HexStringToColor(p.color ?? '#A9DC76').color : COLORS.lockedPref;
      }
      const g = this.add.graphics();
      g.fillStyle(fill, 1);
      g.lineStyle(2 / scale, 0xffffff, 1);
      const pts = poly.map((pt) => new Phaser.Geom.Point(pt.x, pt.y));
      g.fillPoints(pts, true);
      g.strokePoints(pts, true);
      g.setInteractive(new Phaser.Geom.Polygon(pts), Phaser.Geom.Polygon.Contains);
      g.on('pointerup', () => this.onPrefTap(p));
      root.add(g);

      const [lx, ly] = map.labels[p.id];
      const fontSize = p.active ? 15 / scale : 11 / scale;
      // 名前ラベルも タップできる(細長い県や、ラベルが 県の外に はみ出す場合の 救済)
      const label = this.add
        .text(lx, ly, p.active && !unlocked ? '?' : p.name, {
          fontFamily: FONT,
          fontSize: `${fontSize}px`,
          color: p.active ? TEXT_COLORS.main : TEXT_COLORS.sub,
          fontStyle: p.active ? 'bold' : 'normal',
          stroke: '#ffffff',
          strokeThickness: 3 / scale,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      label.on('pointerup', () => this.onPrefTap(p));
      root.add(label);

      if (p.active && !unlocked) {
        for (const [dx, dy, cs] of [[-24, -18, 1], [14, 14, 0.8]] as const) {
          const cloud = this.add.container(lx + dx, ly + dy).setAlpha(0.9).setScale(cs / scale);
          const cg = this.add.graphics();
          cg.fillStyle(0xffffff, 1);
          cg.fillEllipse(0, 0, 40, 16);
          cg.fillEllipse(-12, 4, 24, 12);
          cg.fillEllipse(13, 4, 26, 13);
          cloud.add(cg);
          root.add(cloud);
          this.tweens.add({
            targets: cloud,
            x: lx + dx + 6 / scale,
            duration: 2400 + Math.random() * 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }
      } else if (p.active && unlocked && !done) {
        // 開拓ずみでも、おまつりを ひらくまでは うすい「もや」が すこし のこる
        const mist = this.add.container(lx + 18, ly - 16).setAlpha(0.45).setScale(0.75 / scale);
        const mg = this.add.graphics();
        mg.fillStyle(0xffffff, 1);
        mg.fillEllipse(0, 0, 46, 16);
        mg.fillEllipse(-15, 5, 26, 12);
        mg.fillEllipse(16, 5, 28, 13);
        mist.add(mg);
        root.add(mist);
        this.tweens.add({
          targets: mist,
          x: lx + 18 + 9 / scale,
          alpha: 0.3,
          duration: 2800 + Math.random() * 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        if (p === pendingPref) this.pendingHare = { p, lx, ly, mist };
      }
      if (done) {
        root.add(addIcon(this, lx + 22, ly - 20, 'lantern:crimson', 18 / scale));
      }
    }
  }

  private onPrefTap(p: Prefecture): void {
    if (Modal.isOpen() || this.hareCinema) return;
    if (!p.active) {
      showToast(this, UI_TEXT.map.inactivePref);
      return;
    }
    if (!store.state.unlocked.includes(p.id)) this.startKaitaku(p);
    else this.scene.start('PrefScene', { prefId: p.id });
  }

  /* ---------- 開拓フロー: 県名は明かさず、形/位置クイズで名前を当てる。
     不正解 = 開拓失敗(何度でも再挑戦できる。その過程で県名を覚える) ---------- */
  private startKaitaku(p: Prefecture): void {
    const quiz = pickKaitakuQuiz(GAME_DATA.quizzes, p.id, store.state.quizRecent);
    if (!quiz) return;
    recordQuizAsked(store.state.quizRecent, quiz.id);
    store.save();
    const modal = new Modal(this, UI_TEXT.kaitaku.modalTitle, true);
    const guide = makeGuideRow(this, UI_TEXT.kaitaku.intro, 'wow');
    modal.add(guide.container, guide.height);
    modal.addButton(UI_TEXT.kaitaku.challenge, COLORS.primary, () => {
      Modal.closeCurrent();
      runQuizModal(this, [quiz], UI_TEXT.kaitaku.quizTitle, (correct) => {
        if (correct < 1) {
          const fail = new Modal(this, UI_TEXT.kaitaku.failTitle);
          const g3 = makeGuideRow(this, UI_TEXT.kaitaku.failGuide, 'normal');
          fail.add(g3.container, g3.height);
          fail.addButton(UI_TEXT.kaitaku.retry, COLORS.orange, () => {
            fail.close();
            this.startKaitaku(p);
          });
          fail.show();
          return;
        }
        store.state.unlocked.push(p.id);
        store.save();
        SFX.fanfare();
        confetti(this);
        const done = new Modal(this, UI_TEXT.kaitaku.successTitle);
        const big = addIcon(this, 0, 0, 'sparkle:gold', 58);
        done.add(big, 62);
        done.addText(UI_TEXT.kaitaku.successBody(prefTitle(p)), 19);
        const g2 = makeGuideRow(this, UI_TEXT.kaitaku.successGuide, 'happy');
        done.add(g2.container, g2.height);
        done.addButton(UI_TEXT.kaitaku.goPref(prefTitle(p)), COLORS.primary, () => {
          done.close();
          this.scene.start('PrefScene', { prefId: p.id });
        });
        done.show();
      });
    });
    modal.show();
  }

  /* ---------- 県はれシネマ ----------
     はじめて その県の おまつりを ひらいた あと、地図で 1回だけ:
     もやもや(顔つきの 雲)が あわてて ふきとび、🏮が ともり、
     住人が とびはねて、ぴっけが ばんざいする。
     「くもを はらう」という 物語が 画面で ほんとうに おきる 瞬間 ── ここが 主役 */

  /** ラベル座標(viewBox)→ 画面座標 */
  private toScreen(x: number, y: number): [number, number] {
    return [this.mapOffX + x * this.mapScale, this.mapOffY + y * this.mapScale];
  }

  private playHareCinema(refs: { p: Prefecture; lx: number; ly: number; mist?: Phaser.GameObjects.Container }): void {
    const { p, lx, ly, mist } = refs;
    // さきに 既読に して 保存(とちゅうで アプリを とじても 二重再生しない)
    store.state.flags[hareFlagKey(p.id)] = true;
    store.save();

    // シネマ中の タップは ぜんぶ ここが すいとる
    const block = this.add
      .zone(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H)
      .setInteractive()
      .setDepth(DEPTH.modal);

    const [sx, sy] = this.toScreen(lx, ly);
    SFX.hint();

    // もやが あつまって 「もやもや」の すがたを あらわす
    if (mist?.scene) this.tweens.add({ targets: mist, alpha: 0, duration: 350 });
    const face = addIcon(this, sx, sy - 10, 'cloud-dark:gray', 62).setDepth(DEPTH.overlay);
    // ★アイコンは 128px テクスチャを 縮小表示 している ので、絶対値の scale に
    //   tween しては いけない(巨大化する)。もとの scale を おぼえて そこへ もどす
    const faceScale = face.scale;
    face.setScale(0);
    this.tweens.add({ targets: face, scale: faceScale, duration: 260, ease: 'Back.easeOut' });

    this.time.delayedCall(700, () => {
      // 「うわ〜!」と ふきとぶ(ちかい 画面はしへ)
      SFX.pop();
      blowAwayCloud(this, face, sx < GAME_W / 2 ? -1 : 1, () => {
        // 晴れた! 🏮と 住人と おいわい
        SFX.fanfare();
        confetti(this, 26);
        burst(this, sx, sy, 12, [0xffd34d, 0xffffff, 0x9ccb6f]);
        const lan = addIcon(this, ...this.toScreen(lx + 22, ly - 20), 'lantern:crimson', 20).setDepth(DEPTH.overlay);
        const lanScale = lan.scale;
        lan.setScale(0);
        this.tweens.add({ targets: lan, scale: lanScale, duration: 320, ease: 'Back.easeOut' });
        // 住人が とびはねる(すこししたら そっと きえる)
        const folks = [
          addIcon(this, sx - 26, sy + 16, 'person-child:amber', 18),
          addIcon(this, sx + 26, sy + 16, 'person:teal', 18),
        ];
        for (const [i, f] of folks.entries()) {
          f.setDepth(DEPTH.overlay).setAlpha(0);
          this.tweens.add({ targets: f, alpha: 1, duration: 200, delay: i * 90 });
          this.tweens.add({ targets: f, y: f.y - 10, duration: 240, yoyo: true, repeat: 3, delay: i * 90 });
          this.tweens.add({ targets: f, alpha: 0, duration: 400, delay: 1900, onComplete: () => f.destroy() });
        }
        // ぴっけの ばんざい
        const cheer = makeGuideRow(this, UI_TEXT.hare.line(prefTitle(p)), 'cheer', 440);
        cheer.container
          .setPosition(GAME_W / 2, GAME_H - 150 - cheer.height / 2)
          .setDepth(DEPTH.modal + 1)
          .setAlpha(0);
        this.tweens.add({ targets: cheer.container, alpha: 1, y: '-=14', duration: 300 });

        this.time.delayedCall(2300, () => {
          this.tweens.add({ targets: cheer.container, alpha: 0, duration: 300, onComplete: () => cheer.container.destroy() });
          block.destroy();
          this.afterHare();
        });
      });
    });
  }

  /** シネマの あとの ぶんき: エンディング → つぎの 晴れまち県 → エリアコンプ → ふつうに もどる */
  private afterHare(): void {
    const s = store.state;
    if (isAllHare(s, GAME_DATA) && !s.flags.endingSeen && !runtimeStory.muted) {
      this.scene.start('StoryScene', { mode: 'ending' });
      return;
    }
    const more = GAME_DATA.prefectures.some(
      (x) =>
        x.region === this.regionId &&
        x.active &&
        x.festivalId !== undefined &&
        s.fest.includes(x.festivalId) &&
        !s.flags[hareFlagKey(x.id)],
    );
    if (more) {
      // まれに 2県いじょう 晴れまち(べつの エリアで あそんで きた とき)。作りなおして つぎを 再生
      this.scene.restart();
      return;
    }
    this.hareCinema = false;
    if (isRegionComp(s, GAME_DATA, this.regionId) && !s.flags[regionCompFlagKey(this.regionId)]) {
      this.showRegionBadge();
    }
  }

  /** エリアの 全県が 晴れた: はかせが ちほうバッジを さずける */
  private showRegionBadge(): void {
    const region = GAME_DATA.regions.find((r) => r.id === this.regionId);
    if (!region) return;
    store.state.flags[regionCompFlagKey(this.regionId)] = true;
    store.save();
    SFX.fanfare();
    confetti(this, 30);
    const modal = new Modal(this, UI_TEXT.region.compTitle);
    modal.add(addIcon(this, 0, 0, 'medal:gold', 64), 68);
    const guide = makeGuideRow(this, UI_TEXT.region.compBody(region.name), 'normal', 420, 'hakase');
    modal.add(guide.container, guide.height);
    modal.addButton(UI_TEXT.region.compClose, COLORS.orange, () => modal.close());
    modal.show();
  }

  /* ---------- ぴっけの案内(状況に応じて) ---------- */
  private updateGuide(): void {
    if (Modal.isOpen() || this.hareCinema) return;
    const s = store.state;
    const now = Date.now();
    let text: string = UI_TEXT.guide.nextKaitaku;
    let mood: MascotMood = 'normal';

    const anyPlotReady = Object.entries(s.plots).some(([key, plot]) => {
      const m = findMaterial(GAME_DATA, matIdOfKey(key));
      return m?.gather.type === 'plant' && plotState(plot, m.gather, now).st === 'ready';
    });
    const anyCare = Object.entries(s.plots).some(([key, plot]) => {
      const m = findMaterial(GAME_DATA, matIdOfKey(key));
      if (m?.gather.type !== 'plant') return false;
      const view = plotState(plot, m.gather, now);
      return view.st === 'growing' && view.care;
    });
    const anyInfraFull = Object.entries(s.infra).some(([key, rec]) => {
      const m = findMaterial(GAME_DATA, matIdOfKey(key));
      return m?.gather.type === 'infra' && infraStock(rec, m.gather, now) >= m.gather.max;
    });
    const activeCount = GAME_DATA.prefectures.filter((x) => x.active).length;

    if (!s.unlocked.length) {
      text = UI_TEXT.guide.firstMap;
      mood = 'wow';
    } else if (anyPlotReady) {
      text = UI_TEXT.guide.plotReady;
      mood = 'happy';
    } else if (anyCare) {
      text = UI_TEXT.guide.careChance;
      mood = 'wow';
    } else if (anyInfraFull) {
      text = UI_TEXT.guide.infraFull;
    } else if (s.unlocked.length >= activeCount) {
      const tips = UI_TEXT.guide.tips;
      text = tips[Math.floor(now / TIP_ROTATE_MS) % tips.length];
    }

    if (text === this.lastGuideText) return;
    this.lastGuideText = text;
    this.guideBox?.destroy();
    const guide = makeGuideRow(this, text, mood, 440);
    guide.container.setPosition(GAME_W / 2, GAME_H - 72 - guide.height / 2 - 12);
    this.guideBox = guide.container;
  }
}

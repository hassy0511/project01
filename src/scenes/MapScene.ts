/* 地図画面: 実形パスの関東地図・雲(未開拓)・開拓フロー・ぴっけの案内 */
import Phaser from 'phaser';
import { GAME_DATA, prefTitle, type Prefecture } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { pickKaitakuQuiz, recordQuizAsked } from '../core/quiz';
import { infraStock, plotState, matIdOfKey } from '../core/plots';
import { findMaterial } from '../data/gameData';
import { store } from '../game/store';
import { getMapAsset } from '../game/mapData';
import { SFX } from '../audio/sfx';
import { buildHeader, buildNav, HEADER_H } from '../ui/nav';
import { runQuizModal } from '../ui/quizRunner';
import { COLORS, FONT, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import { makeGuideRow, Modal, showToast, type MascotMood } from '../ui/widgets';
import { confetti } from '../ui/effects';

const GUIDE_UPDATE_MS = 3000;
const TIP_ROTATE_MS = 9000;

export class MapScene extends Phaser.Scene {
  private guideBox?: Phaser.GameObjects.Container;
  private lastGuideText = '';

  constructor() {
    super('MapScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    this.drawSea();
    this.drawMap();
    buildHeader(this);
    buildNav(this, 'map');
    this.buildJapanButton();
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
    // 太陽(光条つき)
    const sun = this.add.container(GAME_W - 54, HEADER_H + 40);
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
    const map = getMapAsset();
    const scale = Math.min((GAME_W - 20) / map.viewW, 560 / map.viewH);
    const offX = (GAME_W - map.viewW * scale) / 2;
    const offY = HEADER_H + 24;
    const root = this.add.container(offX, offY).setScale(scale);

    for (const p of GAME_DATA.prefectures) {
      const poly = map.polys[p.id];
      if (!poly) continue;
      const unlocked = store.state.unlocked.includes(p.id);
      const done = p.festivalId !== undefined && store.state.fest.includes(p.festivalId);

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
      const label = this.add
        .text(lx, ly, p.active && !unlocked ? '?' : p.name, {
          fontFamily: FONT,
          fontSize: `${fontSize}px`,
          color: p.active ? TEXT_COLORS.main : TEXT_COLORS.sub,
          fontStyle: p.active ? 'bold' : 'normal',
          stroke: '#ffffff',
          strokeThickness: 3 / scale,
        })
        .setOrigin(0.5);
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
      }
      if (done) {
        root.add(this.add.text(lx + 22, ly - 20, '🏮', { fontSize: `${16 / scale}px` }).setOrigin(0.5));
      }
    }
  }

  private onPrefTap(p: Prefecture): void {
    if (Modal.isOpen()) return;
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
        const big = this.add.text(0, 0, '🎉', { fontSize: '56px' }).setOrigin(0.5);
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

  /* ---------- ぴっけの案内(状況に応じて) ---------- */
  private updateGuide(): void {
    if (Modal.isOpen()) return;
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

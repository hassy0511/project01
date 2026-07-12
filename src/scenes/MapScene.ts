/* 地図画面: 実形パスの関東地図・雲(未開拓)・開拓フロー・ぴっけの案内 */
import Phaser from 'phaser';
import { GAME_DATA, type Prefecture } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { pickKaitakuQuizzes } from '../core/quiz';
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
    this.updateGuide();
    this.time.addEvent({ delay: GUIDE_UPDATE_MS, loop: true, callback: () => this.updateGuide() });

    const refresh = (): void => {
      if (this.scene.isActive()) this.scene.restart();
    };
    this.game.events.on('mq-refresh', refresh);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off('mq-refresh', refresh));
  }

  private drawSea(): void {
    // うみの かざり(暫定): 太陽と波
    this.add.text(GAME_W - 60, HEADER_H + 26, '☀️', { fontSize: '34px' }).setOrigin(0.5);
    for (const [x, y] of [[40, 620], [420, 480], [60, 200], [430, 250]]) {
      this.add.text(x, y, '🌊', { fontSize: '20px' }).setOrigin(0.5).setAlpha(0.7);
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
        for (const [dx, dy] of [[-22, -16], [12, 14]]) {
          root.add(this.add.text(lx + dx, ly + dy, '☁️', { fontSize: `${16 / scale}px` }).setOrigin(0.5));
        }
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

  /* ---------- 開拓フロー: クイズ2問 → 解放 ---------- */
  private startKaitaku(p: Prefecture): void {
    const quizzes = pickKaitakuQuizzes(GAME_DATA.quizzes, p.id);
    const modal = new Modal(this, UI_TEXT.kaitaku.modalTitle, true);
    const guide = makeGuideRow(this, UI_TEXT.kaitaku.intro(p.name), 'wow');
    modal.add(guide.container, guide.height);
    modal.addButton(UI_TEXT.kaitaku.challenge, COLORS.primary, () => {
      Modal.closeCurrent();
      runQuizModal(this, quizzes, UI_TEXT.kaitaku.quizTitle(p.name), () => {
        store.state.unlocked.push(p.id);
        store.save();
        SFX.fanfare();
        confetti(this);
        const done = new Modal(this, UI_TEXT.kaitaku.successTitle);
        const big = this.add.text(0, 0, '🎉', { fontSize: '56px' }).setOrigin(0.5);
        done.add(big, 62);
        done.addText(UI_TEXT.kaitaku.successBody(p.name), 19);
        const g2 = makeGuideRow(this, UI_TEXT.kaitaku.successGuide, 'happy');
        done.add(g2.container, g2.height);
        done.addButton(UI_TEXT.kaitaku.goPref(p.name), COLORS.primary, () => {
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

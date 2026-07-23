/* にほんぜんこく画面: 実形の日本地図(regions-gen.json)を8地方の色分けで表示。
   アクティブな地方(いまは かんとうのみ)をタップすると その地図へ。
   ほかの地方は灰色+雲の「じゅんびちゅう」(エリア解放型の入り口になる画面)。
   もやもやぐも(ストーリー)の「まだ はれていない にっぽん」を見せる場でもある */
import Phaser from 'phaser';
import { setupHiDpi } from '../ui/display';
import { GAME_DATA, type Region } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { isRegionOpen, playedFestCount } from '../core/state';
import { store } from '../game/store';
import { getRegionAsset } from '../game/mapData';
import { SFX } from '../audio/sfx';
import { COLORS, DEPTH, FONT, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import { makeGuideRow, showToast } from '../ui/widgets';

const TOP_H = 48;
/** 下部ガイドぶんの余白 */
const BOTTOM_PAD = 170;

/** ラベルの逃がし(viewBox座標系)。せまい地方は海の上に出して重なりを防ぐ */
const LABEL_OFF: Record<string, [number, number]> = {
  hokkaido: [6, 16],
  tohoku: [26, 6],
  kanto: [34, 16],
  chubu: [-38, 30],
  kinki: [18, 34],
  chugoku: [-26, -20],
  shikoku: [4, 32],
  kyushu: [-36, 16],
};

export class RegionScene extends Phaser.Scene {
  constructor() {
    super('RegionScene');
  }

  create(): void {
    setupHiDpi(this);
    this.cameras.main.setBackgroundColor(COLORS.sky);
    this.drawSea();
    this.buildTop();
    this.drawJapan();

    const guide = makeGuideRow(this, UI_TEXT.region.guide, 'wow', 440);
    guide.container.setPosition(GAME_W / 2, GAME_H - 60 - guide.height / 2);
  }

  private buildTop(): void {
    const c = this.add.container(0, 0).setDepth(DEPTH.header);
    c.add(this.add.rectangle(GAME_W / 2, TOP_H / 2, GAME_W, TOP_H, COLORS.headerBg));
    const back = this.add
      .text(12, TOP_H / 2, UI_TEXT.region.back, {
        fontFamily: FONT,
        fontSize: '16px',
        color: TEXT_COLORS.good,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('MapScene'));
    c.add(back);
    c.add(
      this.add
        .text(GAME_W / 2, TOP_H / 2, `🗾 ${UI_TEXT.region.title}`, {
          fontFamily: FONT,
          fontSize: '18px',
          color: TEXT_COLORS.main,
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
  }

  private drawSea(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xbfe9f7, 0xbfe9f7, 0x8fd0e0, 0x8fd0e0, 1);
    bg.fillRect(0, TOP_H, GAME_W, GAME_H - TOP_H);
    for (let i = 0; i < 6; i++) {
      const wave = this.add.graphics();
      wave.lineStyle(2.5, 0xffffff, 0.25);
      const y = TOP_H + 70 + i * 110;
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
  }

  /** かんとうの進捗(かいたく数と 🏮の数) */
  private regionProgress(region: Region): string {
    const prefs = GAME_DATA.prefectures.filter((p) => p.region === region.id && p.active);
    const unlocked = prefs.filter((p) => store.state.unlocked.includes(p.id)).length;
    const fests = prefs.filter((p) => p.festivalId && store.state.fest.includes(p.festivalId)).length;
    let text = UI_TEXT.region.prog(unlocked, prefs.length);
    if (fests > 0) text += ` ${UI_TEXT.region.festCount(fests)}`;
    return text;
  }

  /* ---------- 実形の日本地図 ---------- */
  private drawJapan(): void {
    const rm = getRegionAsset();
    const availH = GAME_H - TOP_H - BOTTOM_PAD;
    const scale = Math.min((GAME_W - 16) / rm.viewW, availH / rm.viewH);
    const offX = (GAME_W - rm.viewW * scale) / 2;
    const offY = TOP_H + 10 + (availH - rm.viewH * scale) / 2;
    const root = this.add.container(offX, offY).setScale(scale);

    // 地面(県リングを地方色で塗る。白フチで県境も見える)
    for (const region of GAME_DATA.regions) {
      const rings = rm.polys[region.id];
      if (!rings) continue;
      const color = region.active
        ? Phaser.Display.Color.HexStringToColor(region.color).color
        : COLORS.lockedPref;
      for (const ring of rings) {
        const pts = ring.map((p) => new Phaser.Geom.Point(p.x, p.y));
        const g = this.add.graphics();
        g.fillStyle(color, 1);
        g.lineStyle(1.4 / scale, 0xffffff, 0.9);
        g.fillPoints(pts, true);
        g.strokePoints(pts, true);
        g.setInteractive(new Phaser.Geom.Polygon(pts), Phaser.Geom.Polygon.Contains);
        g.on('pointerup', () => this.onRegionTap(region));
        root.add(g);
      }
    }

    // ラベル・雲・バッジ(地面の上に重ねる)。せまい地方の文字は海側に逃がす
    for (const region of GAME_DATA.regions) {
      const lp = rm.labels[region.id];
      if (!lp) continue;
      const [ox, oy] = LABEL_OFF[region.id] ?? [0, 0];
      const lx = lp[0] + ox;
      const ly = lp[1] + oy;

      const open = this.regionOpen(region);
      if (!open) {
        // じゅんびちゅうの もやもやぐも(地方の上に。ラベルとは別位置)
        const cloud = this.add.container(lp[0], lp[1] - 6).setAlpha(0.85).setScale(0.9 / scale);
        const cg = this.add.graphics();
        cg.fillStyle(0xffffff, 1);
        cg.fillEllipse(0, 0, 52, 20);
        cg.fillEllipse(-17, 6, 30, 15);
        cg.fillEllipse(18, 6, 32, 16);
        cloud.add(cg);
        root.add(cloud);
        this.tweens.add({
          targets: cloud,
          x: lp[0] + 8 / scale,
          duration: 2400 + Math.random() * 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else {
        root.add(this.add.text(lx, ly - 26 / scale, region.emoji, { fontSize: `${18 / scale}px` }).setOrigin(0.5));
      }

      // 名前ラベルも タップできる(海側に出したラベルからも遷移できるように)
      const name = this.add
        .text(lx, ly, region.name, {
          fontFamily: FONT,
          fontSize: `${(region.name.length > 6 ? 10 : open ? 15 : 12) / scale}px`,
          color: open ? TEXT_COLORS.main : TEXT_COLORS.sub,
          fontStyle: open ? 'bold' : 'normal',
          stroke: '#ffffff',
          strokeThickness: 3.5 / scale,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      name.on('pointerup', () => this.onRegionTap(region));
      root.add(name);

      // アクティブだが未解放: あと何回で はれるかを見せる(めあて表示)
      if (region.active && !open && region.unlockFests) {
        const hint = this.add
          .text(lx, ly + 14 / scale, UI_TEXT.region.almostOpen(region.unlockFests), {
            fontFamily: FONT,
            fontSize: `${10 / scale}px`,
            color: TEXT_COLORS.sub,
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 3 / scale,
          })
          .setOrigin(0.5);
        root.add(hint);
      }

      if (open) {
        const sub = this.add
          .text(lx, ly + 15 / scale, this.regionProgress(region), {
            fontFamily: FONT,
            fontSize: `${10 / scale}px`,
            color: TEXT_COLORS.good,
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 3 / scale,
          })
          .setOrigin(0.5);
        root.add(sub);

        const badge = this.add
          .text(lx, ly - 46 / scale, UI_TEXT.region.go, {
            fontFamily: FONT,
            fontSize: `${12 / scale}px`,
            color: TEXT_COLORS.white,
            fontStyle: 'bold',
            backgroundColor: '#ff9f40',
            padding: { x: 8, y: 3 },
          })
          .setOrigin(0.5);
        root.add(badge);
        this.tweens.add({
          targets: badge,
          y: badge.y - 6 / scale,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }
  }

  private regionOpen(region: Region): boolean {
    const prefIds = GAME_DATA.prefectures.filter((p) => p.region === region.id).map((p) => p.id);
    return isRegionOpen(store.state, region, prefIds);
  }

  private onRegionTap(region: Region): void {
    if (!region.active) {
      showToast(this, UI_TEXT.region.lockedToast);
      return;
    }
    if (!this.regionOpen(region)) {
      showToast(this, UI_TEXT.region.unlockHint(region.unlockFests ?? 0, playedFestCount(store.state)));
      return;
    }
    SFX.good();
    this.scene.start('MapScene', { regionId: region.id });
  }
}

/* にほんぜんこく画面: 8つの地方(エリア)を島チップとして にほんれっとうの ならびに表示。
   アクティブな地方(いまは かんとうのみ)をタップすると その地図へ。
   ほかの地方は雲がかかった「じゅんびちゅう」表示(エリア解放型の入り口になる画面) */
import Phaser from 'phaser';
import { GAME_DATA, type Region } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { store } from '../game/store';
import { SFX } from '../audio/sfx';
import { COLORS, DEPTH, FONT, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import { makeGuideRow, showToast } from '../ui/widgets';

const TOP_H = 48;
/** 島チップを置くエリア(pos の 0..1 をこの範囲へ写す) */
const FIELD_X = 40;
const FIELD_W = GAME_W - 150;
const FIELD_Y = TOP_H + 60;
const FIELD_H = GAME_H - TOP_H - 300;

export class RegionScene extends Phaser.Scene {
  constructor() {
    super('RegionScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    this.drawSea();
    this.buildTop();
    // アクティブな地方を最後に描く(重なってもタップが埋もれないよう最前面にする)
    const islands = GAME_DATA.regions.slice().sort((a, b) => Number(a.active) - Number(b.active));
    for (const r of islands) this.buildIsland(r);

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
  private kantoProgress(region: Region): string {
    const prefs = GAME_DATA.prefectures.filter((p) => p.region === region.id && p.active);
    const unlocked = prefs.filter((p) => store.state.unlocked.includes(p.id)).length;
    const fests = prefs.filter((p) => p.festivalId && store.state.fest.includes(p.festivalId)).length;
    let text = UI_TEXT.region.prog(unlocked, prefs.length);
    if (fests > 0) text += ` ${UI_TEXT.region.festCount(fests)}`;
    return text;
  }

  private buildIsland(r: Region): void {
    const x = FIELD_X + r.pos[0] * FIELD_W;
    const y = FIELD_Y + r.pos[1] * FIELD_H;
    const c = this.add.container(x, y);
    const color = Phaser.Display.Color.HexStringToColor(r.color).color;

    // 島のかたち: だ円を重ねた ゆるい りんかく
    const g = this.add.graphics();
    const s = r.size;
    g.fillStyle(r.active ? color : COLORS.lockedPref, 1);
    g.lineStyle(3, 0xffffff, 1);
    g.fillEllipse(0, 0, 104 * s, 58 * s);
    g.fillEllipse(-30 * s, 11 * s, 54 * s, 30 * s);
    g.fillEllipse(32 * s, -12 * s, 50 * s, 28 * s);
    g.strokeEllipse(0, 0, 104 * s, 58 * s);
    c.add(g);

    const emoji = this.add.text(0, -34 * s, r.emoji, { fontSize: `${Math.round(22 * s)}px` }).setOrigin(0.5);
    c.add(emoji);
    const name = this.add
      .text(0, -2, r.name, {
        fontFamily: FONT,
        fontSize: r.name.length > 6 ? '12px' : '15px',
        color: r.active ? TEXT_COLORS.main : TEXT_COLORS.sub,
        fontStyle: r.active ? 'bold' : 'normal',
        stroke: '#ffffff',
        strokeThickness: 3,
        align: 'center',
      })
      .setOrigin(0.5);
    c.add(name);

    if (r.active) {
      c.add(
        this.add
          .text(0, 18, this.kantoProgress(r), {
            fontFamily: FONT,
            fontSize: '11px',
            color: TEXT_COLORS.good,
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 3,
          })
          .setOrigin(0.5),
      );
      // いまここ! のふわふわバッジ
      const badge = this.add
        .text(0, -56 * s, UI_TEXT.region.go, {
          fontFamily: FONT,
          fontSize: '12px',
          color: TEXT_COLORS.white,
          fontStyle: 'bold',
          backgroundColor: '#ff9f40',
          padding: { x: 8, y: 3 },
        })
        .setOrigin(0.5);
      c.add(badge);
      this.tweens.add({ targets: badge, y: badge.y - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: c, scale: { from: 1, to: 1.03 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      // じゅんびちゅうの雲
      const cloud = this.add.container(24 * s, -18 * s).setAlpha(0.9);
      const cg = this.add.graphics();
      cg.fillStyle(0xffffff, 1);
      cg.fillEllipse(0, 0, 46, 18);
      cg.fillEllipse(-14, 5, 28, 13);
      cg.fillEllipse(15, 5, 30, 14);
      cloud.add(cg);
      c.add(cloud);
      this.tweens.add({ targets: cloud, x: cloud.x + 7, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      c.add(
        this.add
          .text(0, 18, UI_TEXT.region.preparing, {
            fontFamily: FONT,
            fontSize: '10px',
            color: TEXT_COLORS.sub,
            stroke: '#ffffff',
            strokeThickness: 3,
          })
          .setOrigin(0.5),
      );
    }

    c.setSize(112 * s, 78 * s);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerup', () => {
      if (!r.active) {
        showToast(this, UI_TEXT.region.lockedToast);
        return;
      }
      SFX.good();
      this.scene.start('MapScene');
    });
  }
}

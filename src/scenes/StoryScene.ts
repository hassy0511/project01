/* 導入ストーリー(紙芝居): はじめての起動時に一度だけ流す(スキップ可)。
   「もやもやぐもに つつまれた にっぽんを、ものしりはかせに たくされた
   めいさんずかんと ともに はらしていく」という ぼうけんの動機づけ。
   くわしい設計は docs/STORY_DRAFT.md(案A)を参照 */
import Phaser from 'phaser';
import { setupHiDpi } from '../ui/display';
import { UI_TEXT } from '../data/uiText';
import { store } from '../game/store';
import { SFX } from '../audio/sfx';
import { addIcon, type IconKey } from '../ui/icons';
import { COLORS, DEPTH, FONT, GAME_H, GAME_W, TEXT_COLORS } from '../ui/theme';
import { makeButton } from '../ui/widgets';

/** スライドごとの背景色(うえ→した)。くらい あさ → あかるい きぼう */
const SLIDE_BG: [number, number][] = [
  [0x3a4466, 0x5a6488],
  [0x4a4466, 0x6a6488],
  [0x5a5477, 0x8a7a99],
  [0x7ec3e8, 0xcfeffb],
];

/** よこに ならべる アイコンの 大きさ と あいだ(px) */
const ROW_ICON = 38;
const ROW_GAP = 48;
/** わすれられていく めいさん(スライド2) */
const FORGOTTEN: IconKey[] = ['lantern:crimson', 'strawberry:red', 'pottery:tan', 'citrus:orange'];
/** おまつりの あかり(さいごの スライド) */
const FESTIVAL_ROW: IconKey[] = ['sparkle:gold', 'lantern:crimson', 'sparkle:gold'];
/** もやもやぐも 1つの 大きさ(px。ばいりつは いちごとに かける) */
const CLOUD_SIZE = 96;

export class StoryScene extends Phaser.Scene {
  private idx = 0;
  private slideRoot?: Phaser.GameObjects.Container;

  constructor() {
    super('StoryScene');
  }

  create(): void {
    setupHiDpi(this);
    this.idx = 0;

    // 全面タップで つぎへ(ボタンは topOnly でこのゾーンより優先される)
    const zone = this.add.zone(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H).setInteractive();
    zone.on('pointerup', () => this.next());

    this.showSlide();

    const skip = makeButton(this, {
      x: GAME_W - 64,
      y: 34,
      w: 96,
      h: 36,
      label: UI_TEXT.story.skip,
      color: COLORS.gray,
      fontSize: 14,
      onClick: () => this.finish(),
    });
    skip.setDepth(DEPTH.header);
  }

  private next(): void {
    if (this.idx >= UI_TEXT.story.slides.length - 1) return; // 最終スライドは ボタンで進む
    this.idx++;
    SFX.pop();
    this.showSlide();
  }

  private showSlide(): void {
    this.slideRoot?.destroy();
    const root = this.add.container(0, 0);
    this.slideRoot = root;
    const i = this.idx;
    const last = i === UI_TEXT.story.slides.length - 1;

    const [top, bottom] = SLIDE_BG[i] ?? SLIDE_BG[0];
    const bg = this.add.graphics();
    bg.fillGradientStyle(top, top, bottom, bottom, 1);
    bg.fillRect(0, 0, GAME_W, GAME_H);
    root.add(bg);

    this.drawArt(root, i);

    // 本文パネル
    const text = this.add
      .text(GAME_W / 2, GAME_H - 240, UI_TEXT.story.slides[i], {
        fontFamily: FONT,
        fontSize: '17px',
        color: TEXT_COLORS.main,
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: 400 },
        backgroundColor: '#fff8e7',
        padding: { x: 18, y: 14 },
      })
      .setOrigin(0.5)
      .setAlpha(0);
    root.add(text);
    this.tweens.add({ targets: text, alpha: 1, duration: 400 });

    if (last) {
      const start = makeButton(this, {
        x: GAME_W / 2,
        y: GAME_H - 120,
        w: 280,
        h: 56,
        label: UI_TEXT.story.start,
        color: COLORS.orange,
        onClick: () => {
          SFX.fanfare();
          this.finish();
        },
      });
      start.setScale(0);
      this.tweens.add({ targets: start, scale: 1, ease: 'Back.easeOut', duration: 350, delay: 350 });
      root.add(start);
    } else {
      const hint = this.add
        .text(GAME_W / 2, GAME_H - 130, UI_TEXT.story.tap, {
          fontFamily: FONT,
          fontSize: '14px',
          color: '#ffffff',
        })
        .setOrigin(0.5);
      root.add(hint);
      this.tweens.add({ targets: hint, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    }
  }

  /** アイコンを よこ1れつに ならべた ひとまとまり(まとめて フェードできる) */
  private iconRow(x: number, y: number, keys: IconKey[]): Phaser.GameObjects.Container {
    const row = this.add.container(x, y);
    const left = -((keys.length - 1) * ROW_GAP) / 2;
    keys.forEach((key, k) => row.add(addIcon(this, left + k * ROW_GAP, 0, key, ROW_ICON)));
    return row;
  }

  /** スライドの絵(ベクターの かんたんな一枚絵) */
  private drawArt(root: Phaser.GameObjects.Container, i: number): void {
    const cx = GAME_W / 2;
    const cy = 260;

    if (i === 0 || i === 1) {
      // にっぽんの しま + もやもやぐも
      const island = this.add.graphics();
      island.fillStyle(0x7ec06a, 1);
      island.lineStyle(3, 0xffffff, 0.8);
      island.fillEllipse(cx + 60, cy - 60, 110, 52);
      island.fillEllipse(cx, cy, 170, 74);
      island.fillEllipse(cx - 90, cy + 60, 120, 56);
      island.strokeEllipse(cx, cy, 170, 74);
      root.add(island);
      const positions: [number, number, number][] = [
        [cx - 70, cy - 40, 1.1],
        [cx + 60, cy - 66, 0.9],
        [cx + 10, cy + 20, 1.3],
        [cx - 110, cy + 66, 0.8],
        [cx + 110, cy + 6, 0.9],
      ];
      positions.forEach(([x, y, s], k) => {
        const cloud = addIcon(this, x, y, 'cloud-dark:gray', CLOUD_SIZE * s).setAlpha(i === 0 ? 0.92 : 0.8);
        root.add(cloud);
        this.tweens.add({
          targets: cloud,
          x: x + 12,
          duration: 2200 + k * 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      });
      if (i === 1) {
        // わすれられていく めいさんたち(うすくなっていく)
        const row = this.iconRow(cx, cy + 130, FORGOTTEN);
        root.add(row);
        this.tweens.add({ targets: row, alpha: 0.25, duration: 1600, yoyo: true, repeat: -1 });
      }
      return;
    }

    if (i === 2) {
      // はかせ が ずかんを たくす
      const prof = addIcon(this, cx - 90, cy - 10, 'owl:brown', 84);
      const book = addIcon(this, cx + 6, cy + 24, 'book:blue', 56);
      const pikke = addIcon(this, cx + 104, cy + 30, 'chick:amber', 56);
      root.add(prof);
      root.add(book);
      root.add(pikke);
      this.tweens.add({ targets: book, x: cx + 40, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: pikke, y: cy + 24, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const sparkle = addIcon(this, cx + 40, cy - 40, 'sparkle:gold', 30);
      root.add(sparkle);
      this.tweens.add({ targets: sparkle, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
      return;
    }

    // さいご: ひかりが さして ぼうけんへ
    const sun = this.add.graphics();
    sun.fillStyle(0xffd34d, 1);
    sun.fillCircle(cx, cy - 70, 34);
    sun.lineStyle(4, 0xf0b429, 1);
    for (let a = 0; a < 10; a++) {
      const rad = (a * Math.PI) / 5;
      sun.lineBetween(
        cx + Math.cos(rad) * 46,
        cy - 70 + Math.sin(rad) * 46,
        cx + Math.cos(rad) * 60,
        cy - 70 + Math.sin(rad) * 60,
      );
    }
    root.add(sun);
    const pikke = addIcon(this, cx, cy + 50, 'chick:amber', 72);
    root.add(pikke);
    this.tweens.add({ targets: pikke, y: cy + 40, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const fw = this.iconRow(cx, cy + 130, FESTIVAL_ROW);
    root.add(fw);
  }

  private finish(): void {
    store.state.flags.introSeen = true;
    store.save();
    this.scene.start('RegionScene');
  }
}

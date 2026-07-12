/* 共通UI部品: ボタン・モーダル・トースト・ガイド(ぴっけ)・★演出・スクロール
   見た目は M2 暫定(絵文字ベース)。M3/M4 で差し替える */
import Phaser from 'phaser';
import { COLORS, DEPTH, FONT, GAME_H, GAME_W, TEXT_COLORS } from './theme';
import { SFX } from '../audio/sfx';

export interface ButtonOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  color?: number;
  textColor?: string;
  fontSize?: number;
  onClick?: () => void;
}

/** 角丸ボタン(中心原点) */
export function makeButton(scene: Phaser.Scene, o: ButtonOpts): Phaser.GameObjects.Container {
  const c = scene.add.container(o.x, o.y);
  const g = scene.add.graphics();
  const color = o.color ?? COLORS.primary;
  g.fillStyle(color, 1);
  g.fillRoundedRect(-o.w / 2, -o.h / 2, o.w, o.h, Math.min(14, o.h / 2));
  const t = scene.add
    .text(0, 0, o.label, {
      fontFamily: FONT,
      fontSize: `${o.fontSize ?? 18}px`,
      color: o.textColor ?? TEXT_COLORS.white,
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  c.add([g, t]);
  c.setSize(o.w, o.h);
  c.setInteractive({ useHandCursor: true });
  if (o.onClick) {
    c.on('pointerdown', () => {
      c.setScale(0.96);
    });
    c.on('pointerup', () => {
      c.setScale(1);
      o.onClick?.();
    });
    c.on('pointerout', () => c.setScale(1));
  }
  return c;
}

/** ボタンのラベルと色を差し替える(状態変化用) */
export function setButtonStyle(btn: Phaser.GameObjects.Container, w: number, h: number, color: number): void {
  const g = btn.list[0] as Phaser.GameObjects.Graphics;
  g.clear();
  g.fillStyle(color, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, Math.min(14, h / 2));
}

const MODAL_W = 440;

/** 縦積みレイアウトのモーダル。add() で上から順に積み、show() で確定する */
export class Modal {
  private static current: Modal | null = null;

  readonly scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private box: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private cursorY = 0;
  private closed = false;

  static isOpen(): boolean {
    return Modal.current !== null;
  }

  static closeCurrent(): void {
    Modal.current?.close();
  }

  constructor(scene: Phaser.Scene, title: string, closable = false) {
    Modal.closeCurrent();
    Modal.current = this;
    this.scene = scene;

    this.root = scene.add.container(0, 0).setDepth(DEPTH.modal);
    const dim = scene.add
      .rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, COLORS.dim, 0.45)
      .setInteractive(); // 背面へのタップを遮断
    this.root.add(dim);

    this.box = scene.add.container(GAME_W / 2, GAME_H / 2);
    this.bg = scene.add.graphics();
    this.box.add(this.bg);
    this.root.add(this.box);

    const head = scene.add
      .text(0, 0, title, {
        fontFamily: FONT,
        fontSize: '20px',
        color: TEXT_COLORS.main,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);
    this.box.add(head);
    this.cursorY = 40;

    if (closable) {
      const x = scene.add
        .text(MODAL_W / 2 - 24, 14, '✕', { fontFamily: FONT, fontSize: '20px', color: TEXT_COLORS.sub })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      x.on('pointerup', () => this.close());
      this.box.add(x);
    }
  }

  /** 高さ h の要素を中央揃えで積む(child は中心原点前提) */
  add<T extends Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject>(
    child: T,
    h: number,
    gap = 12,
  ): T {
    child.setPosition(0, this.cursorY + h / 2);
    this.box.add(child);
    this.cursorY += h + gap;
    return child;
  }

  /** 折り返しテキストを積む */
  addText(text: string, fontSize = 16, color: string = TEXT_COLORS.main): Phaser.GameObjects.Text {
    const t = this.scene.add
      .text(0, 0, text, {
        fontFamily: FONT,
        fontSize: `${fontSize}px`,
        color,
        align: 'center',
        wordWrap: { width: MODAL_W - 48 },
        lineSpacing: 6,
      })
      .setOrigin(0.5);
    return this.add(t, t.height);
  }

  addButton(label: string, color: number, onClick: () => void, w = 260, h = 48): Phaser.GameObjects.Container {
    return this.add(makeButton(this.scene, { x: 0, y: 0, w, h, label, color, onClick }), h);
  }

  /** 内容に合わせて背景を描き、縦中央に配置する */
  show(): void {
    const totalH = this.cursorY + 16;
    this.bg.clear();
    this.bg.fillStyle(COLORS.panel, 1);
    this.bg.lineStyle(3, COLORS.panelLine, 1);
    this.bg.fillRoundedRect(-MODAL_W / 2, -14, MODAL_W, totalH + 14, 20);
    this.bg.strokeRoundedRect(-MODAL_W / 2, -14, MODAL_W, totalH + 14, 20);
    this.box.y = Math.max(40, (GAME_H - totalH) / 2);
    this.box.x = GAME_W / 2;
    // タイトルを箱の上端に合わせているので、box 原点は上端
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    if (Modal.current === this) Modal.current = null;
    this.root.destroy();
  }
}

/** トースト(画面下部に短く表示) */
export function showToast(scene: Phaser.Scene, msg: string): void {
  const key = '__toast';
  const prev = scene.data.get(key) as Phaser.GameObjects.Container | undefined;
  prev?.destroy();
  const c = scene.add.container(GAME_W / 2, GAME_H - 140).setDepth(DEPTH.toast);
  const t = scene.add
    .text(0, 0, msg, {
      fontFamily: FONT,
      fontSize: '15px',
      color: TEXT_COLORS.white,
      align: 'center',
      wordWrap: { width: 360 },
    })
    .setOrigin(0.5);
  const g = scene.add.graphics();
  g.fillStyle(0x4a3b2a, 0.92);
  g.fillRoundedRect(-t.width / 2 - 18, -t.height / 2 - 10, t.width + 36, t.height + 20, 16);
  c.add([g, t]);
  scene.data.set(key, c);
  scene.time.delayedCall(1800, () => {
    if (scene.data.get(key) === c) {
      c.destroy();
      scene.data.set(key, undefined);
    }
  });
}

export type MascotMood = 'normal' | 'happy' | 'wow';

const MOOD_EMOJI: Record<MascotMood, string> = { normal: '🐤', happy: '🐥', wow: '🐣' };

/** ぴっけ+吹き出し(暫定: 絵文字)。中心原点、幅 w */
export function makeGuideRow(
  scene: Phaser.Scene,
  text: string,
  mood: MascotMood = 'normal',
  w = 420,
): { container: Phaser.GameObjects.Container; height: number } {
  const c = scene.add.container(0, 0);
  const pikke = scene.add.text(-w / 2 + 28, 0, MOOD_EMOJI[mood], { fontSize: '40px' }).setOrigin(0.5);
  const bubbleW = w - 76;
  const t = scene.add
    .text(-w / 2 + 66 + bubbleW / 2, 0, text, {
      fontFamily: FONT,
      fontSize: '15px',
      color: TEXT_COLORS.main,
      wordWrap: { width: bubbleW - 24 },
      lineSpacing: 5,
    })
    .setOrigin(0.5);
  const h = Math.max(56, t.height + 20);
  const g = scene.add.graphics();
  g.fillStyle(0xfff8e7, 1);
  g.lineStyle(2, COLORS.panelLine, 1);
  g.fillRoundedRect(-w / 2 + 60, -h / 2, bubbleW + 12, h, 14);
  g.strokeRoundedRect(-w / 2 + 60, -h / 2, bubbleW + 12, h, 14);
  c.add([g, pikke, t]);
  return { container: c, height: h };
}

/** ★を1つずつ ポン♪ と出す(中心原点・幅約150) */
export function makeStarRow(scene: Phaser.Scene, stars: number): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  for (let i = 0; i < 3; i++) {
    const on = i < stars;
    const s = scene.add
      .text((i - 1) * 48, 0, '★', {
        fontFamily: FONT,
        fontSize: '40px',
        color: on ? '#f0b429' : '#ddd5c2',
      })
      .setOrigin(0.5);
    c.add(s);
    if (on) {
      s.setScale(0);
      scene.tweens.add({
        targets: s,
        scale: 1,
        ease: 'Back.easeOut',
        duration: 260,
        delay: 250 + i * 280,
        onStart: () => SFX.star(i),
      });
    }
  }
  return c;
}

/** 縦スクロール領域(ドラッグ+ホイール) */
export class ScrollArea {
  readonly content: Phaser.GameObjects.Container;
  private contentH = 0;
  private viewH: number;
  private destroyed = false;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number) {
    this.viewH = h;
    this.content = scene.add.container(x, y);

    const maskShape = scene.make.graphics();
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(x, y, w, h);
    this.content.setMask(maskShape.createGeometryMask());

    const zone = scene.add.zone(x + w / 2, y + h / 2, w, h).setInteractive();
    let dragging = false;
    let startPointerY = 0;
    let startContentY = 0;
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      dragging = true;
      startPointerY = p.y;
      startContentY = this.content.y - y;
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!dragging || !p.isDown) return;
      this.scrollTo(startContentY + (p.y - startPointerY));
    });
    scene.input.on('pointerup', () => {
      dragging = false;
    });
    scene.input.on(
      'wheel',
      (p: Phaser.Input.Pointer, _objs: unknown, _dx: number, dy: number) => {
        if (p.y < y || p.y > y + h) return;
        this.scrollTo(this.content.y - y - dy * 0.6);
      },
    );
    this.baseY = y;
    // zone はコンテンツより背面に置く(カード上のボタンを優先)
    zone.setDepth(-1);
  }

  private baseY = 0;

  setContentHeight(h: number): void {
    this.contentH = h;
    this.scrollTo(this.content.y - this.baseY);
  }

  private scrollTo(offset: number): void {
    if (this.destroyed) return;
    const min = Math.min(0, this.viewH - this.contentH);
    this.content.y = this.baseY + Phaser.Math.Clamp(offset, min, 0);
  }

  destroy(): void {
    this.destroyed = true;
    this.content.destroy();
  }
}

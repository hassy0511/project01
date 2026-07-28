/* 共通UI部品: ボタン・モーダル・トースト・ガイド(ぴっけ)・ほし演出・スクロール
   絵は ぜんぶ ui/icons の ベクターアイコン(絵文字は つかわない) */
import Phaser from 'phaser';
import { COLORS, DEPTH, FONT, GAME_H, GAME_W, TEXT_COLORS } from './theme';
import { SFX } from '../audio/sfx';
import { addIcon } from './icons';

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
/** ボタンの 文字が わくに ふれない ように あける よはく(左右あわせて) */
const LABEL_PAD = 12;

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
      align: 'center',
      wordWrap: { width: o.w - LABEL_PAD },
    })
    .setOrigin(0.5);
  // おれかえしても はみ出す ながい ことば(「あかまつの やまを まもる」など)は
  // 字を 小さく して わくに おさめる
  shrinkToWidth(t, o.w - LABEL_PAD, 10, o.h - 6);
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

/** この「もの」を さわった タップを ここで 止める(うしろへ わたさない)。

    Phaser は 「もの」の あつかいが おわった あと、かならず
    scene.input からも おなじ タップを 出す
    (InputPlugin.processDownEvents → this.emit(POINTER_DOWN))。
    ミニゲームは ほぼ scene.input 直づけで タップを うけて いる ので、
    ボタンを おした タップが そのまま ゲームにも 入って しまう:
      ・わらじ: 右上の 「?」(x=452)が 「みぎ足」の タップに なり、
        つぎが ひだり足なら よろけ = コンボ切れ + 450ms 停止
      ・あわおどり: judge() が 走り、ノーツが ないので かならず ミス
      ・山車: pull() が 走り、めもりが ゾーン外なら ミス
    Phaser が わたして くる EventData の stopPropagation() を よぶと
    そこで 止まる(processDownEvents:48 の _eventData.cancelled)。 */
export function swallowPointer(obj: Phaser.GameObjects.GameObject): void {
  const stop = (
    _p: Phaser.Input.Pointer,
    _x: number,
    _y: number,
    ev: Phaser.Types.Input.EventData,
  ): void => {
    ev.stopPropagation();
  };
  obj.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, stop);
  obj.on(Phaser.Input.Events.GAMEOBJECT_POINTER_MOVE, stop);
  obj.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, stop);
}

/** モーダルが 出ている あいだ ゲームに とどかせない イベント。
    ミニゲームが つかうのは この 5つ だけ(minigames/input.ts も 同じ) */
const MODAL_MUTED_EVENTS = [
  Phaser.Input.Events.POINTER_DOWN,
  Phaser.Input.Events.POINTER_MOVE,
  Phaser.Input.Events.POINTER_UP,
  Phaser.Input.Events.POINTER_UP_OUTSIDE,
  Phaser.Input.Events.GAME_OUT,
] as const;

/** 縦積みレイアウトのモーダル。add() で上から順に積み、show() で確定する */
export class Modal {
  private static current: Modal | null = null;

  readonly scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private box: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private cursorY = 0;
  private closed = false;
  private readonly closeHooks: (() => void)[] = [];
  /** モーダルの あいだ はずして おいた scene.input の ききみみ(とじたら もどす) */
  private readonly suspended: { ev: string; fn: (...a: never[]) => void }[] = [];

  static isOpen(): boolean {
    const m = Modal.current;
    if (!m) return false;
    // シーンごと きえた モーダルが のこっていたら わすれる。
    // (シーンを 切りかえた ときに close() が よばれず、
    //  「ずっと モーダルが 出ている」ことに なって 地図が タップできなく なっていた)
    if (m.closed || !m.root.scene || !m.scene.scene.isActive()) {
      Modal.current = null;
      return false;
    }
    return true;
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
      .setInteractive(); // 背面の「もの」へのタップを遮断
    this.root.add(dim);
    // くらい まくは 「もの」への タップは とめられるが、
    // scene.input 直づけの ききみみ(ミニゲームは ほぼ これ)には とどいて しまう。
    // = 「あそびかた」を ひらいて とじる あいだの タップが ゲームにも 入り、
    //   コンボが きれたり かってに 点が 入ったり して いた。
    // Phaser に 「まえの ものが すいとる」しくみが ない ので、
    // モーダルの あいだだけ ききみみを はずして、とじたら もどす。
    this.suspendSceneInput();

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

    // シーンが かたづく ときは モーダルも わすれる(static が のこらない ように)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.close());

    if (closable) {
      const x = addIcon(scene, MODAL_W / 2 - 24, 14, 'cross:gray', 24).setInteractive({ useHandCursor: true });
      swallowPointer(x);
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
    const btn = makeButton(this.scene, { x: 0, y: 0, w, h, label, color, onClick });
    // ボタンを おした タップ そのものは ここで 止める。
    // ききみみを もどすのは close() の 中 = この タップの とちゅう なので、
    // 止めないと 「とじる」タップだけ ゲームに とどいて しまう
    swallowPointer(btn);
    return this.add(btn, h);
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

  /** とじた ときに 1回 よぶ しごと(× でも ボタンでも かならず とおる) */
  onClose(fn: () => void): void {
    this.closeHooks.push(fn);
  }

  /** scene.input 直づけの ききみみを いったん はずす(モーダルの あいだ) */
  private suspendSceneInput(): void {
    const input = this.scene.input;
    for (const ev of MODAL_MUTED_EVENTS) {
      // listeners() は 関数だけ かえす。ゲーム側は どこも context を
      // わたして いない(scene.input.on(ev, fn) の 2ひきすう)ので これで もどせる
      for (const fn of input.listeners(ev) as ((...a: never[]) => void)[]) {
        input.off(ev, fn);
        this.suspended.push({ ev, fn });
      }
    }
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    if (Modal.current === this) Modal.current = null;
    const input = this.scene.input;
    // シーンが かたづいた あとは もどす 先が ない
    if (this.scene.scene.isActive()) {
      for (const { ev, fn } of this.suspended.splice(0)) input.on(ev, fn);
    } else {
      this.suspended.length = 0;
    }
    for (const fn of this.closeHooks.splice(0)) fn();
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

export type MascotMood = 'normal' | 'happy' | 'wow' | 'cheer';

/** ふきだしの はなし手。
    ぴっけ = ぼうけんの あいぼう(地図・県・おまつり)、
    はかせ = ものしり係(ものしりカード・ずかん・バッジの 授与)。
    役わりを わけると 「だれが なにを してくれる キャラか」が 子供に つたわる */
export type Speaker = 'pikke' | 'hakase';

/** ぴっけ(たんけんヒヨコ)の かお。wow は たまごから とびだす かたちで おどろきを 出す。
    cheer は ばんざい(はれた! コンプ! の おいわい) */
const MOOD_ICON: Record<MascotMood, string> = {
  normal: 'chick:amber',
  happy: 'chick:yellow',
  wow: 'chick-egg:amber',
  cheer: 'chick-cheer:amber',
};

/** はかせ(フクロウ)は 表情ちがいの 絵が まだ ない ので 1しゅるい */
const HAKASE_ICON = 'owl:brown';
/** ぴっけの 大きさ(吹き出しの 高さ 56 に おさまる ように すこし 大きめ) */
const MASCOT_SIZE = 46;

/** ぴっけ+吹き出し。中心原点、幅 w */
export function makeGuideRow(
  scene: Phaser.Scene,
  text: string,
  mood: MascotMood = 'normal',
  w = 420,
  speaker: Speaker = 'pikke',
): { container: Phaser.GameObjects.Container; height: number } {
  const c = scene.add.container(0, 0);
  const pikke = addIcon(scene, -w / 2 + 28, 0, speaker === 'hakase' ? HAKASE_ICON : MOOD_ICON[mood], MASCOT_SIZE);
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

/** よこはばに おさまるまで 字を 小さく する。それでも 入らない ときは おわりを … に。
    カードの 名まえが ボタンに かさなるのを ふせぐ ため(ベタ書きの 幅指定を ふやさない) */
export function shrinkToWidth(t: Phaser.GameObjects.Text, maxW: number, minPx = 11, maxH = Infinity): void {
  let px = Number.parseInt(String(t.style.fontSize), 10) || 16;
  while ((t.width > maxW || t.height > maxH) && px > minPx) {
    px -= 1;
    t.setFontSize(px);
  }
  if (t.width <= maxW) return;
  let body = t.text;
  while (body.length > 1 && t.width > maxW) {
    body = body.slice(0, -1);
    t.setText(`${body}…`);
  }
}

/** アイコンを よこ1れつに ならべた ひとまとまり(まとめて フェード・スケールできる)。
    おまつりの かざり・ものがたりの さしえで つかう */
export function makeIconRow(
  scene: Phaser.Scene,
  keys: readonly string[],
  size = 44,
  gap = 56,
): Phaser.GameObjects.Container {
  const row = scene.add.container(0, 0);
  const left = -((keys.length - 1) * gap) / 2;
  keys.forEach((key, i) => row.add(addIcon(scene, left + i * gap, 0, key, size)));
  return row;
}

/** ほしの 大きさと 間かく(できばえの 見た目の かなめ。ここだけで ととのえる)。
    ポンと 出る tween が 1.1ばいまで はみ出すので、置き場の 高さ 48(SessionScene)に おさまる 42 に する */
const STAR_SIZE = 42;
const STAR_GAP = 50;

/** できばえの ほしを 1つずつ ポンと 出す(中心原点・幅約150) */
export function makeStarRow(scene: Phaser.Scene, stars: number): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  for (let i = 0; i < 3; i++) {
    const on = i < stars;
    const s = addIcon(scene, (i - 1) * STAR_GAP, 0, on ? 'star:gold' : 'star-empty:tan', STAR_SIZE);
    c.add(s);
    if (on) {
      // アイコンは 表示サイズに あわせて 縮小ずみ。scale:1 に すると テクスチャの ドット数まで
      // でっかく なって しまうので、もとの scale へ もどす
      const base = s.scale;
      s.setScale(0);
      scene.tweens.add({
        targets: s,
        scale: base,
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
      startPointerY = p.worldY;
      startContentY = this.content.y - y;
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!dragging || !p.isDown) return;
      this.scrollTo(startContentY + (p.worldY - startPointerY));
    });
    scene.input.on('pointerup', () => {
      dragging = false;
    });
    scene.input.on(
      'wheel',
      (p: Phaser.Input.Pointer, _objs: unknown, _dx: number, dy: number) => {
        if (p.worldY < y || p.worldY > y + h) return;
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

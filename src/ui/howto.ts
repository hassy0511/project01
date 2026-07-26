/* =====================================================
   あそびかたの ゆびマーク(実演)。

   4〜8歳は 字が 読めない。だから 「半とうめいの ゆび」が 実際の 操作を
   やって みせる。データ(src/data/howto.ts)の かたち 1行を 読んで
   この 1つの 関数が ぜんぶ 面倒を 見る ― ゲームごとの 分岐は 書かない。

   出す/消す の きまり:
   ・ゲームが 始まった すぐ あとに 出る
   ・プレイヤーが 1回 さわったら すぐ 消える(じゃまを しない)
   ・そのあと 5秒 何も しなかったら もう一度 出る(まよって いる 合図)
   ===================================================== */
import Phaser from 'phaser';
import { HOW_TO, type HowTo, type Pt } from '../data/howto';
import { UI_TEXT } from '../data/uiText';
import { addIcon, iconScale } from './icons';
import { COLORS, DEPTH, GAME_W } from './theme';
import { Modal } from './widgets';

/** ゆびの 大きさ・こさ */
const HAND_SIZE = 64;
const HAND_ALPHA = 0.92;
/** ゆびの うしろの ぼんやり(どんな 背景でも ゆびが 見える ように) */
const GLOW_R = 26;
/** ゆびマークの アイコン。ぱっと 見て 「ゆび」と わかる ものだけ */
const HAND_ICON = 'hand-point:cream';
/** ゆびの さきが あたる ところと、絵の 中心の ずれ(絵の うえのほうが さき) */
const TIP_DY = HAND_SIZE * 0.38;

/** 何も しないで いたら また 出す までの 時間 */
const IDLE_MS = 5000;
/** 1回の 実演の 長さ(この あと 少し 間を おいて くりかえす) */
const LOOP_GAP_MS = 700;

export interface HowToHandle {
  /** もう 出さない(シーンを おわる とき・「?」で 出しなおす とき) */
  stop(): void;
  /** もう一度 はじめから 見せる(「?」ボタン用) */
  replay(): void;
}

const NOOP: HowToHandle = { stop: () => undefined, replay: () => undefined };

/** 名まえで さがした 見えている もの(いちばん 上に あるもの)の area 内 ざひょう */
const findTarget = (scene: Phaser.Scene, name: string, areaY: number): Pt | null => {
  let hit: Pt | null = null;
  const walk = (list: Phaser.GameObjects.GameObject[]): void => {
    for (const o of list) {
      const c = o as Phaser.GameObjects.Container;
      if (Array.isArray(c.list)) walk(c.list);
      if (o.name !== name) continue;
      const t = o as unknown as Phaser.GameObjects.Image;
      if (!t.visible || !t.active) continue;
      const m = t.getWorldTransformMatrix();
      hit = [m.tx, m.ty - areaY];
    }
  };
  walk(scene.children.list);
  return hit;
};

/**
 * ゆびマークを 出す。data に その ゲームの ぶんが なければ 何も しない。
 * @param scene ミニゲームの シーン
 * @param key   HOW_TO の キー(エンジン名 / おまつりゲーム名)
 * @param areaY ゲームの area の ずれ(MinigameApi.areaY を そのまま わたす)
 */
export function showHowTo(scene: Phaser.Scene, key: string, areaY: number): HowToHandle {
  const spec = HOW_TO[key];
  if (!spec) return NOOP;

  const layer = scene.add.container(0, areaY).setDepth(DEPTH.howto);
  const glow = scene.add.graphics();
  const hand = addIcon(scene, GAME_W / 2, 0, HAND_ICON, HAND_SIZE).setAlpha(0);
  const trail = scene.add.graphics();
  layer.add([trail, glow, hand]);

  let stopped = false;
  /** いま 実演を 出して いるか */
  let showing = false;
  const timers: Phaser.Time.TimerEvent[] = [];
  const tweens: Phaser.Tweens.Tween[] = [];

  const clearMotion = (): void => {
    for (const t of tweens.splice(0)) t.remove();
    trail.clear();
    glow.clear();
  };

  /** ゆびを その ばしょへ すぐに 置く(ゆびさきが at に あたるように) */
  const put = (at: Pt): void => {
    hand.setPosition(at[0], at[1] + TIP_DY);
    // ゆびさきの まわりを ぼんやり 明るく する。こい 背景でも ゆびを 見のがさない
    glow.clear();
    glow.fillStyle(0x000000, 0.22);
    glow.fillCircle(at[0], at[1], GLOW_R * 1.25);
    glow.fillStyle(0xffffff, 0.4);
    glow.fillCircle(at[0], at[1], GLOW_R);
  };

  /** トン と おす しぐさ(なみもんが ひろがる) */
  const tapAt = (at: Pt, delay: number): void => {
    const t = scene.time.delayedCall(delay, () => {
      if (stopped || !showing) return;
      put(at);
      hand.setAlpha(HAND_ALPHA);
      tweens.push(
        scene.tweens.add({
          targets: hand,
          scale: { from: iconScale(hand, 1), to: iconScale(hand, 0.82) },
          duration: 180,
          yoyo: true,
        }),
      );
      const ring = scene.add.graphics();
      ring.lineStyle(3, 0xffffff, 0.9);
      ring.strokeCircle(at[0], at[1], 12);
      layer.add(ring);
      tweens.push(
        scene.tweens.add({
          targets: ring,
          scale: 2.2,
          alpha: 0,
          duration: 520,
          onComplete: () => ring.destroy(),
        }),
      );
    });
    timers.push(t);
  };

  /** すーっと なぞる しぐさ(あとに 線を のこす) */
  const dragAlong = (from: Pt, to: Pt, ms: number): void => {
    put(from);
    hand.setAlpha(HAND_ALPHA);
    trail.clear();
    trail.lineStyle(7, 0xffffff, 0.5);
    const pen = { t: 0 };
    tweens.push(
      scene.tweens.add({
        targets: pen,
        t: 1,
        duration: ms,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          const x = Phaser.Math.Linear(from[0], to[0], pen.t);
          const y = Phaser.Math.Linear(from[1], to[1], pen.t);
          put([x, y]);
          trail.lineBetween(from[0], from[1], x, y);
        },
      }),
    );
  };

  /** ぐるっと まわす しぐさ */
  const circleAround = (at: Pt, r: number, ms: number): void => {
    hand.setAlpha(HAND_ALPHA);
    trail.clear();
    trail.lineStyle(7, 0xffffff, 0.5);
    const pen = { t: 0 };
    let prev: Pt = [at[0] + r, at[1]];
    tweens.push(
      scene.tweens.add({
        targets: pen,
        t: 1,
        duration: ms,
        ease: 'Linear',
        onUpdate: () => {
          const a = pen.t * Math.PI * 2;
          const x = at[0] + Math.cos(a) * r;
          const y = at[1] + Math.sin(a) * r;
          put([x, y]);
          trail.lineBetween(prev[0], prev[1], x, y);
          prev = [x, y];
        },
      }),
    );
  };

  /** おしたまま まつ しぐさ(なみもんが くりかえし ひろがる) */
  const holdAt = (at: Pt, ms: number): void => {
    put(at);
    hand.setAlpha(HAND_ALPHA);
    for (let i = 0; i < 3; i++) tapAt(at, (ms / 3) * i);
  };

  const DIR_VEC: Record<string, Pt> = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  };

  /** 1回の 実演。かかった 時間(ms)を かえす */
  const playOnce = (s: HowTo): number => {
    switch (s.kind) {
      case 'tap': {
        s.at.forEach((p, i) => tapAt(p, i * 520));
        return s.at.length * 520 + 400;
      }
      case 'alternate': {
        for (let i = 0; i < 4; i++) tapAt(s.at[i % 2], i * 420);
        return 4 * 420 + 400;
      }
      case 'tapTarget': {
        const p = findTarget(scene, s.name, areaY);
        if (!p) return 600; // まだ 出ていない: すぐ もう一度 さがす
        tapAt(p, 0);
        return 900;
      }
      case 'drag': {
        dragAlong(s.from, s.to, 1100);
        return 1400;
      }
      case 'dragTarget': {
        const p = findTarget(scene, s.name, areaY);
        if (!p) return 600;
        dragAlong(p, [p[0] + (s.dx ?? 0), p[1] + (s.dy ?? 0)], 800);
        return 1100;
      }
      case 'hold': {
        holdAt(s.at, s.ms);
        return s.ms + 400;
      }
      case 'swipe': {
        const v = DIR_VEC[s.dir] ?? DIR_VEC.up;
        const len = 130;
        dragAlong(s.at, [s.at[0] + v[0] * len, s.at[1] + v[1] * len], 380);
        return 800;
      }
      case 'circle': {
        circleAround(s.at, s.r, 1400);
        return 1700;
      }
    }
  };

  const hide = (): void => {
    showing = false;
    clearMotion();
    hand.setAlpha(0);
    for (const t of timers.splice(0)) t.remove();
  };

  /** 1回 見せおわったら すこし 間を おいて また 見せる(消えるのは さわられた とき だけ) */
  const loop = (): void => {
    if (stopped) return;
    showing = true;
    const ms = playOnce(spec);
    const t = scene.time.delayedCall(ms + LOOP_GAP_MS, () => {
      if (stopped || !showing) return;
      clearMotion();
      loop();
    });
    timers.push(t);
  };

  /** 「まよって いる」を はかる ための まちうけ。さわる たびに かけなおす */
  let idleTimer: Phaser.Time.TimerEvent | undefined;
  const armIdle = (): void => {
    idleTimer?.remove();
    idleTimer = scene.time.delayedCall(IDLE_MS, () => {
      if (!stopped) loop();
    });
  };

  /* さわられたら すぐ ひっこむ。そのあと 5秒 何も しなければ また 出る */
  const onTouch = (): void => {
    if (showing) hide();
    armIdle();
  };
  scene.input.on(Phaser.Input.Events.POINTER_DOWN, onTouch);

  const handle: HowToHandle = {
    stop: () => {
      if (stopped) return;
      stopped = true;
      hide();
      idleTimer?.remove();
      scene.input.off(Phaser.Input.Events.POINTER_DOWN, onTouch);
      layer.destroy();
    },
    replay: () => {
      if (stopped) return;
      idleTimer?.remove();
      hide();
      loop();
    },
  };

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => handle.stop());
  loop();
  return handle;
}

/* -----------------------------------------------------
   ゲーム中の 「?」ボタン。
   おまつりの 説明は 2回目からは 出ない ように した ので、
   忘れた ときの 見なおし口を ゲームの ヘッダーに 1つ おく。
   ----------------------------------------------------- */

/** 「?」ボタンの 大きさ */
const HELP_SIZE = 26;

/**
 * 「?」を おいて、おすと 説明 + ゆびマークを もう一度 見せる。
 * @param text  その ゲームの 説明文
 * @param howto showHowTo が かえした ハンドル(ない ときは 説明だけ)
 */
export function addHelpButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  title: string,
  text: string,
  howto?: HowToHandle,
): Phaser.GameObjects.Image {
  const btn = addIcon(scene, x, y, 'question:sky', HELP_SIZE)
    .setName('nav-help')
    .setDepth(DEPTH.header + 1)
    .setInteractive({ useHandCursor: true });
  btn.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
    const modal = new Modal(scene, title, true);
    modal.addText(text, 15);
    modal.addButton(UI_TEXT.howto.gotIt, COLORS.primary, () => {
      modal.close();
      howto?.replay();
    });
    modal.show();
  });
  return btn;
}

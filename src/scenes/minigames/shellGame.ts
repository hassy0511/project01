/* かいひきあげ(かき・ほたて・かに): 貝は「釣る」のではなく「つるして そだて、ひきあげる」。
   実在の養殖(いかだの垂下連)・かご漁の作業を そのまま動詞にした 2だんかいの遊び。

   だん1「ひきあげ」: うみの なかの ロープ(かご)を 指で つかんで 上へ ドラッグ。
     はやすぎると 貝が ぱらぱら 落ちる / おそすぎると ロープが すこし さがる。
     「ちょうどよい はやさ」を たもつのが きもち。ふねの デッキに とどけば つぎへ。
   だん2「はずし」: デッキに あがった 貝を タップで ひとつずつ はずして かごへ(かき打ち)。
     ぜんぶ はずすと ボーナス。きんいろの おおつぶは 大とくてん(C要素)。
   pluck(ゆっくり=安全)とちがい、こちらは はやすぎ・おそすぎの 両方が だめ = 速度ゾーンの遊び */
import Phaser from 'phaser';
import { addIcon, iconScale } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import { offPointerRelease, onPointerRelease } from './input';
import type { MinigameApi } from './types';

const AREA_H = GAME_AREA_H;
/** 海面と デッキ(ここまで あげる)の 高さ */
const SEA_Y = 210;
const DECK_Y = 250;
const START_Y = 600;
/** 速度判定(px/ms): はやすぎ / おそすぎ */
const V_FAST = 0.85;
const V_SLOW = 0.05;
const V_WINDOW_MS = 80;
/** おそすぎの時に ロープが さがる はやさ(px/s) */
const SINK_PER_SEC = 26;
/** 貝1つの点と ぜんぶ はずした ボーナス */
const PEEL_PTS = 9;
const GOLD_PTS = 26;
const ALL_BONUS = 18;
/** 1たばの 貝の数 */
const BUNCH_MIN = 4;
const BUNCH_MAX = 6;
const GOLD_CHANCE = 0.22;

interface Shell {
  obj: Phaser.GameObjects.Image;
  gold: boolean;
  peeled: boolean;
  dx: number;
  dy: number;
}

export function renderShell(api: MinigameApi, target: string, prompt: string): void {
  const { scene, area } = api;

  // 海(いかだの ある しずかな 湾)
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xaee3f7, 0xaee3f7, 0xd7efc3, 0xd7efc3, 1);
  bg.fillRect(0, 0, GAME_W, SEA_Y);
  bg.fillGradientStyle(0x3f8fb5, 0x3f8fb5, 0x1d5b80, 0x1d5b80, 1);
  bg.fillRect(0, SEA_Y, GAME_W, AREA_H - SEA_Y);
  // とおくの しま(まつしま風)
  bg.fillStyle(0x7fa87a, 1);
  bg.fillEllipse(80, SEA_Y - 6, 90, 40);
  bg.fillEllipse(300, SEA_Y - 4, 120, 34);
  bg.fillStyle(0x4f7a4a, 1);
  bg.fillEllipse(80, SEA_Y - 20, 44, 26);
  area.add(bg);
  // いかだ(デッキ)
  const deck = scene.add.graphics();
  deck.fillStyle(0x8a6a4a, 1);
  deck.fillRoundedRect(20, DECK_Y - 26, GAME_W - 40, 30, 8);
  deck.fillStyle(0x6b4a2a, 1);
  for (let i = 0; i < 8; i++) deck.fillRect(30 + i * 55, DECK_Y - 26, 6, 30);
  area.add(deck);
  const basket = addIcon(scene, GAME_W - 62, DECK_Y - 52, 'basket:tan', 32);
  area.add(basket);
  const worker = addIcon(scene, 56, DECK_Y - 52, 'person-worker:sky', 30);
  area.add(worker);
  scene.tweens.add({ targets: worker, y: worker.y - 4, duration: 700, yoyo: true, repeat: -1 });

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'shell',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- 状態 ---------- */
  const rope = scene.add.graphics();
  area.add(rope);
  let bunch = scene.add.container(GAME_W / 2, START_Y);
  area.add(bunch);
  let shells: Shell[] = [];
  let phase: 'haul' | 'peel' = 'haul';
  let grab: { lastT: number; lastY: number; offset: number } | null = null;
  let peelUntil = 0;

  const drawRope = (): void => {
    rope.clear();
    rope.lineStyle(4, 0x8a7a62, 0.95);
    rope.lineBetween(bunch.x, DECK_Y - 20, bunch.x, bunch.y - 30);
    // つかむ場所の めやす
    if (phase === 'haul') {
      rope.lineStyle(2, 0xffffff, 0.35);
      rope.strokeCircle(bunch.x, bunch.y, 58);
    }
  };

  const newBunch = (): void => {
    bunch.destroy();
    bunch = scene.add.container(GAME_W / 2 + (Math.random() * 120 - 60), START_Y);
    area.add(bunch);
    shells = [];
    const n = BUNCH_MIN + Math.floor(Math.random() * (BUNCH_MAX - BUNCH_MIN + 1));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const dx = Math.cos(a) * (18 + Math.random() * 12);
      const dy = Math.sin(a) * (14 + Math.random() * 10);
      const gold = Math.random() < GOLD_CHANCE;
      const obj = addIcon(scene, dx, dy, target, gold ? 34 : 28).setName('mg-target');
      if (gold) obj.setTint(0xffd34d);
      bunch.add(obj);
      shells.push({ obj, gold, peeled: false, dx, dy });
    }
    phase = 'haul';
    drawRope();
  };
  newBunch();

  /* ---------- だん2: はずし ---------- */
  const startPeel = (): void => {
    phase = 'peel';
    peelUntil = Date.now() + 5000;
    SFX.good();
    floatUp(scene, bunch.x, DECK_Y + api.areaY + 10, UI_TEXT.arcade.shellDeck, '#3f7d2c');
    burst(scene, bunch.x, DECK_Y + api.areaY, 8, [0xffffff, 0x9ad0f5]);
    // 貝が すこし ひろがって タップしやすくなる
    shells.forEach((s, i) => {
      scene.tweens.add({
        targets: s.obj,
        x: s.dx * 2.4,
        y: s.dy * 1.6,
        duration: 260,
        delay: i * 30,
      });
    });
    drawRope();
  };

  const finishPeel = (allPeeled: boolean): void => {
    peelUntil = Number.MAX_SAFE_INTEGER; // つぎの たばが 来るまで 時間切れ処理を 止める
    if (allPeeled) {
      SFX.fanfare();
      session.addPoints(ALL_BONUS, bunch.x, DECK_Y + api.areaY - 40, false);
      floatUp(scene, bunch.x, DECK_Y + api.areaY - 70, UI_TEXT.arcade.shellAll, '#3f7d2c');
      bigImpact(scene, bunch.x, DECK_Y + api.areaY);
      confetti(scene, 12);
    }
    scene.time.delayedCall(400, () => {
      if (!session.isEnded()) newBunch();
    });
  };

  const peelOne = (s: Shell): void => {
    s.peeled = true;
    SFX.pop();
    if (s.gold) SFX.good();
    impactRing(scene, bunch.x + s.obj.x, bunch.y + s.obj.y + api.areaY, s.gold ? 0xffd34d : 0xffffff, 8);
    burst(scene, bunch.x + s.obj.x, bunch.y + s.obj.y + api.areaY, s.gold ? 10 : 4);
    session.addPoints(s.gold ? GOLD_PTS : PEEL_PTS, bunch.x + s.obj.x, bunch.y + s.obj.y + api.areaY - 24);
    floatUp(
      scene,
      bunch.x + s.obj.x,
      bunch.y + s.obj.y + api.areaY - 40,
      s.gold ? UI_TEXT.arcade.shellGold : UI_TEXT.arcade.shellPeel,
      s.gold ? '#e0812a' : '#3f7d2c',
    );
    // かごへ とんでいく
    const obj = s.obj;
    scene.tweens.add({
      targets: obj,
      x: basket.x - bunch.x,
      y: basket.y - bunch.y,
      scale: iconScale(obj, 0.4),
      alpha: 0,
      duration: 260,
      ease: 'Quad.easeIn',
      onComplete: () => obj.destroy(),
    });
    scene.tweens.add({ targets: basket, scaleY: iconScale(basket, 0.86), duration: 90, yoyo: true, delay: 240 });
    if (shells.every((x) => x.peeled)) finishPeel(true);
  };

  /* ---------- 入力 ---------- */
  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    const py = p.worldY - api.areaY;
    if (phase === 'peel') {
      for (const s of shells) {
        if (s.peeled) continue;
        if (Math.hypot(p.worldX - (bunch.x + s.obj.x), py - (bunch.y + s.obj.y)) < 34) {
          peelOne(s);
          return;
        }
      }
      return;
    }
    // だん1: ロープを つかむ
    if (Math.hypot(p.worldX - bunch.x, py - bunch.y) > 76) return;
    grab = { lastT: Date.now(), lastY: p.worldY, offset: py - bunch.y };
  };

  const dropOne = (): void => {
    const alive = shells.filter((s) => !s.peeled);
    if (!alive.length) return;
    const s = alive[alive.length - 1];
    s.peeled = true; // 落ちた= もう はずせない
    const obj = s.obj;
    session.resetCombo();
    SFX.bad();
    missShake(scene);
    floatUp(scene, bunch.x, bunch.y + api.areaY - 40, UI_TEXT.arcade.shellDrop, '#c04545');
    scene.tweens.add({
      targets: obj,
      y: obj.y + 220,
      x: obj.x + (Math.random() * 60 - 30),
      angle: 220,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeIn',
      onComplete: () => obj.destroy(),
    });
  };

  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!grab || !p.isDown || phase !== 'haul' || session.isEnded()) return;
    const py = p.worldY - api.areaY;
    const nextY = Phaser.Math.Clamp(py - grab.offset, DECK_Y + 20, START_Y + 20);
    const now = Date.now();
    if (now - grab.lastT >= V_WINDOW_MS) {
      const v = (grab.lastY - p.worldY) / (now - grab.lastT); // 上向きプラス
      grab.lastT = now;
      grab.lastY = p.worldY;
      if (v > V_FAST) {
        // はやすぎ: 貝が こぼれる
        dropOne();
      } else if (v > V_SLOW && Math.random() < 0.14) {
        floatUp(scene, bunch.x + 70, bunch.y + api.areaY - 20, UI_TEXT.arcade.shellPace, '#9ccb6f');
      }
    }
    bunch.y = nextY;
    drawRope();
    if (bunch.y <= DECK_Y + 24) {
      grab = null;
      startPeel();
    }
  };

  const onUp = (): void => {
    grab = null;
  };

  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  onPointerRelease(scene, onUp);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    if (phase === 'haul' && !grab) {
      // 手を はなしていると すこし さがる(おそすぎ対策)
      bunch.y = Math.min(START_Y + 20, bunch.y + SINK_PER_SEC * dt);
      drawRope();
    }
    if (phase === 'peel' && Date.now() > peelUntil) {
      // 時間切れ: のこりは いかだに もどす(へるのは 得点機会だけ)
      let allPeeled = true;
      for (const s of shells)
        if (!s.peeled) {
          allPeeled = false;
          s.peeled = true; // タップ対象から外す(つぎの たばが 来るまでの すきま対策)
          s.obj.destroy();
        }
      finishPeel(allPeeled);
    }
    // 貝が ゆらゆら
    bunch.setAngle(Math.sin(Date.now() / 700) * 3);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    offPointerRelease(scene, onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

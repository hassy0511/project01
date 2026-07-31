/* かんとうまつり(あきた): 竿燈(かんとう)バランスゲーム。
   ちょうちんを つけた ながい竿を、下の「て」を左右にドラッグして ささえる。
   まっすぐ ささえているあいだ 得点が入りつづけ、8秒たえるごとに 竿が たかくなって
   配点アップ(C要素=リスクとリワードの はしご)。よろけたら レベル1に もどるだけ(成功保証)。
   mikoshi(左右押し)との違い = 指で「したを うごかして うえを ささえる」倒立バランス */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { burst, confetti, floatUp, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import { CROWD } from './crowd';
import type { MinigameApi } from './types';
import { SCENERY_NAME } from '../../ui/scenery';

const AREA_H = GAME_AREA_H;
const HAND_Y = 560;
/** 傾き: 得点帯・ぴったり帯・よろけ */
const OK_DEG = 16;
const PERFECT_DEG = 6;
const STUMBLE_DEG = 30;
const TICK_MS = 600;
/** レベル(竿の高さ): 配点と 上がるまでの安定時間 */
const MAX_LEVEL = 4;
const LEVEL_UP_MS = 8000;
const PTS_PERFECT = [0, 8, 12, 16, 22];
const PTS_OK = [0, 5, 7, 10, 14];
/* ★ちからの つりあい。

   まえは たてなおしが 「ゆびの うごいた ぶん(dx)」だけ だった。
   すると こう なって いた:
     ・手の x は [60, 420] に とじこめて ある ので 片道 360px。
       たてなおしは 1px あたり CORRECT_K×1.6 = 0.088度 → 片道 31.7度、
       もどり道は かたむきと 逆むきで 係数0.4 なので -7.9度、
       往復 720px で さしひき 23.8度 しか かせげない。
     ・ところが deg=16(OK の ふち)での 自己成長は deg×GRAV = 30.4度/秒。
       = ゾーンの ふちに いる だけで 往復1回ぶんの ちからを こえる。
       レベル4・終盤の かぜ(さいだい 20.8度/秒)を くわえると
       打ち消すだけで 630px/秒 の 連続スワイプが 必要 だった。
     ・さらに ゆびが とじこめの ふちで 止まると dx=0 = たてなおし 0 に なり、
       deg は e^(GRAV·t) で ふくらむ。deg=6 から 0.85秒 で よろけ。
       つまり 「手も足も 出ない」しゅんかんが あった。

   なおしかた: ゆびを かたむいた がわに おいて いる あいだ ずっと たてなおる
   ように する(ぼうを ささえる 手を かたむきの 下に 入れる きもち)。
   ふちで ゆびが 止まっても たてなおしが 0 に ならなく なる。

   GRAV や かぜ は さわらない。1分の あそびを 何とおりかの 「子供らしい
   うごき」で 数値シミュレーションして くらべた 結果:

     やりかた            よろけ / スコア / さいごのレベル(7回の へいきん)
     ──────────────────────────────────────────
     直す まえ  はやい子    3.0 / 1470 / 1.3
                おそい子   15.7 /  548 / 1.1
                とてもおそい 17.6 /  459 / 1.0   ← レベル4 に とどかない
     hold を 足す はやい子   0.0 / 1728 / 4.0
                おそい子    0.3 / 1605 / 3.4
                とてもおそい  2.7 /  990 / 1.6   ← 上手さの さが のこる
     GRAV も 下げる とてもおそい 0.0 / 1667 / 4.0 ← だれでも まんてん = やりすぎ

   なので hold だけ 足す。PTS_PERFECT[4]=22 の はしごに 手が とどく ように
   なり、それでも 上手い/へた の さは のこる。 */

/** 不安定さ: 傾きの自己増幅と 風 */
const GRAV = 1.9;
const WIND_FROM = 3;
const WIND_TO = 8;
/** 手の移動が竿を立て直す係数(px → deg) */
const CORRECT_K = 0.055;
/** ゆびを かたむいた がわに おいて いる あいだの たてなおし(度/秒)。
    いちばん はしまで よせた ときの 値。
    ※この 数字は 子供テストで 再調整(docs/ROADMAP.md) */
const HOLD_K = 40;
/** これだけ よこに よせたら HOLD_K が いっぱいに なる(px) */
const HOLD_FULL_PX = 150;

export function renderKantou(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 夕ぐれの おまつり広場
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x35406b, 0x35406b, 0x6b5a8a, 0x6b5a8a, 1);
  bg.fillRect(0, 0, GAME_W, HAND_Y);
  bg.fillStyle(0x8a7a62, 1);
  bg.fillRect(0, HAND_Y, GAME_W, AREA_H - HAND_Y);
  area.add(bg.setName(SCENERY_NAME)); // 手描きの 背景が 来たら かくれる
  for (let i = 0; i < 8; i++) {
    const p = addIcon(scene, 20 + i * 62, HAND_Y - 8, CROWD[i % CROWD.length], 20);
    area.add(p);
    scene.tweens.add({ targets: p, y: p.y - 4, duration: 420 + (i % 3) * 90, yoyo: true, repeat: -1 });
  }

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'kantou',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- 竿燈: 下端が支点。レベルで ちょうちんの段が増える ---------- */
  let level = 1;
  const pole = scene.add.container(GAME_W / 2, HAND_Y);
  area.add(pole);
  const buildPole = (): void => {
    pole.removeAll(true);
    const g = scene.add.graphics();
    const h = 210 + level * 70;
    g.lineStyle(7, 0xc9a86a, 1);
    g.lineBetween(0, 0, 0, -h);
    for (let row = 0; row < level + 1; row++) {
      const y = -h + 26 + row * 64;
      g.lineStyle(4, 0xc9a86a, 1);
      g.lineBetween(-70, y, 70, y);
      pole.add(g);
      for (let i = -2; i <= 2; i++) {
        const lan = addIcon(scene, i * 34, y + 18, 'lantern:crimson', 20);
        pole.add(lan);
      }
    }
    pole.add(g);
  };
  buildPole();

  // ささえる て(ドラッグで動く)
  const hand = addIcon(scene, GAME_W / 2, HAND_Y + 26, 'hand:tan', 40);
  area.add(hand);

  /* ---------- 状態 ---------- */
  let deg = 0;
  let wind = WIND_FROM;
  let px = GAME_W / 2; // 手(=支点)の x
  let recoverUntil = 0;
  let stableSince = Date.now();
  let windTimer: Phaser.Time.TimerEvent | undefined;

  const scheduleWind = (): void => {
    const amp = Phaser.Math.Linear(WIND_FROM, WIND_TO, session.progress());
    wind = (Math.random() < 0.5 ? -1 : 1) * amp * (0.5 + Math.random() * 0.8);
    windTimer = scene.time.delayedCall(900 + Math.random() * 1400, scheduleWind);
  };
  scheduleWind();

  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!p.isDown || session.isEnded()) return;
    const nx = Phaser.Math.Clamp(p.worldX, 60, GAME_W - 60);
    const dx = nx - px;
    px = nx;
    // 手を かたむいた側へ うごかすと 竿が たてなおる(倒立バランスの きもち)
    if (Date.now() >= recoverUntil) deg -= dx * CORRECT_K * (deg > 0 === dx > 0 ? 1.6 : 0.4);
  };
  const onDown = (p: Phaser.Input.Pointer): void => {
    px = Phaser.Math.Clamp(p.worldX, 60, GAME_W - 60);
  };
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerdown', onDown);

  // 得点の刻み
  const tick = scene.time.addEvent({
    delay: TICK_MS,
    loop: true,
    callback: () => {
      if (session.isEnded() || Date.now() < recoverUntil) return;
      const a = Math.abs(deg);
      if (a <= PERFECT_DEG) {
        session.addPoints(PTS_PERFECT[level], px, HAND_Y + api.areaY - 200);
      } else if (a <= OK_DEG) {
        session.addPoints(PTS_OK[level], px, HAND_Y + api.areaY - 200);
      }
      // 安定を つづけたら 竿が たかくなる
      if (Date.now() - stableSince >= LEVEL_UP_MS && level < MAX_LEVEL) {
        level++;
        stableSince = Date.now();
        buildPole();
        SFX.fanfare();
        floatUp(scene, GAME_W / 2, 200 + api.areaY, UI_TEXT.fest.kantouUp(level), '#e0812a');
        confetti(scene, 10);
      }
    },
  });

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    if (Date.now() >= recoverUntil) {
      deg += (deg * GRAV + wind * (1 + level * 0.25)) * dt;
      // ゆびを かたむいた がわに よせて いる あいだは じわじわ たてなおる。
      // ★ここが ないと とじこめの ふちで ゆびが 止まった とき
      //   たてなおしが 0 に なり、なにを しても たおれた
      const handOff = px - GAME_W / 2;
      if (deg !== 0 && Math.sign(handOff) === Math.sign(deg)) {
        const grip = Math.min(1, Math.abs(handOff) / HOLD_FULL_PX);
        const back = Math.sign(deg) * HOLD_K * grip * dt;
        // いきすぎて 逆に かたむけない
        deg = Math.abs(back) >= Math.abs(deg) ? 0 : deg - back;
      }
    }
    if (Math.abs(deg) >= STUMBLE_DEG) {
      recoverUntil = Date.now() + 700;
      stableSince = Date.now();
      session.resetCombo();
      missShake(scene);
      SFX.bad();
      floatUp(scene, px, HAND_Y + api.areaY - 240, UI_TEXT.fest.kantouWobble, '#c04545');
      burst(scene, px, HAND_Y + api.areaY - 10, 6, [0x8a7a62, 0xc9a86a]);
      if (level > 1) {
        level = 1;
        buildPole();
      }
      deg = deg > 0 ? -8 : 8;
    }
    pole.setX(px);
    pole.setAngle(deg);
    hand.setX(px);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerdown', onDown);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    windTimer?.remove();
    tick.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

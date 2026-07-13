/* おまつり やたいラッシュ(tier4・このゲームの集大成):
   よるの おまつり会場。おきゃくさんが つぎつぎ やってきて、ふきだしで ほしいものを 見せる。
   下の やたい(めいぶつ)を タップして、まちがえずに どんどん わたそう。
   - ふきだしの したの ゲージが おきゃくさんの がまん。きれると 😢 で 帰る(コンボが切れるだけ)
   - がまんが たっぷり のこっているうちに わたすと「はやわざ!」ボーナス
   - とちゅうから 🦊 とくべつな おきゃくさん(高得点・せっかち)が まざる
   - ラスト10秒は フィナーレ: はなびが あがる なか、来客ラッシュを さばききろう */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, firework, floatUp, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_W, TEXT_COLORS } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

/** やたいに ならぶ しなもの(FestivalScene が recipe.menu から組み立てる) */
export interface StallItem {
  ref: string;
  emoji: string;
  name: string;
}

const AREA_H = 660;
const SKY_H = 330;
const SLOT_XS = [72, 184, 296, 408] as const;
const SLOT_Y = 385;
const SPAWN_Y = 215;
const WALK_IN_MS = 700;
const COUNTER_TOP = 480;
const STALL_Y = 572;
const STALL_W = 116;
const STALL_H = 112;

const SERVE_PTS = 12;
const VIP_PTS = 30;
const QUICK_BONUS = 6;
/** はやわざ判定: がまんゲージの のこりが これ以上 */
const QUICK_RATIO = 0.7;
/** がまん時間(ms): 序盤→終盤 */
const PATIENCE_FROM = 6800;
const PATIENCE_TO = 4300;
/** 来客間隔(ms): 序盤→終盤 */
const ARRIVE_FROM = 2100;
const ARRIVE_TO = 750;
/** とくべつな おきゃくさん: 出現しはじめる経過率と確率 */
const VIP_AFTER = 0.35;
const VIP_CHANCE = 0.18;
const VIP_PATIENCE_MULT = 0.85;
/** フィナーレ(はなび)開始: のこり秒 */
const FINALE_SEC = 10;

const FACES = ['🧒', '👧', '👦', '👩', '👨', '👵', '👴'] as const;
const VIP_FACE = '🦊';

interface Customer {
  cont: Phaser.GameObjects.Container;
  face: Phaser.GameObjects.Text;
  bar: Phaser.GameObjects.Graphics;
  want: StallItem;
  slot: number;
  vip: boolean;
  /** 到着して がまんゲージが 動きだした時刻(歩いている間は 0) */
  arrivedAt: number;
  patienceMs: number;
  state: 'walk' | 'wait' | 'served' | 'gone';
}

export function renderFestival(api: MinigameApi, prompt: string, menu: StallItem[]): void {
  const { scene, area } = api;
  drawFestivalNight(scene, area);
  api.sign(prompt);

  const customers: Customer[] = [];
  const slots: (Customer | null)[] = SLOT_XS.map(() => null);
  let spawnTimer: Phaser.Time.TimerEvent | undefined;
  let finaleTimer: Phaser.Time.TimerEvent | undefined;
  let finaleStarted = false;

  const session = new ArcadeSession(api, {
    engine: 'fest',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- やたい(ボタン) ---------- */
  const stallX = (i: number): number => GAME_W / 2 + (i - (menu.length - 1) / 2) * (STALL_W + 14);
  menu.forEach((item, i) => {
    const c = scene.add.container(stallX(i), STALL_Y);
    const g = scene.add.graphics();
    g.fillStyle(0x8a6242, 1);
    g.fillRoundedRect(-STALL_W / 2 - 4, -STALL_H / 2 - 4, STALL_W + 8, STALL_H + 8, 14);
    g.fillStyle(0xfff8e7, 1);
    g.fillRoundedRect(-STALL_W / 2, -STALL_H / 2, STALL_W, STALL_H, 12);
    // のれん(赤白)
    g.fillStyle(0xe05b5b, 1);
    for (let k = 0; k < 3; k++) g.fillRect(-STALL_W / 2 + 8 + k * 38, -STALL_H / 2 + 4, 20, 12);
    c.add(g);
    c.add(scene.add.text(0, -12, item.emoji, { fontSize: '44px' }).setOrigin(0.5));
    c.add(
      scene.add
        .text(0, 36, item.name, {
          fontFamily: FONT,
          fontSize: '13px',
          color: TEXT_COLORS.main,
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
    area.add(c);
    c.setSize(STALL_W + 8, STALL_H + 8);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => {
      if (session.isEnded()) return;
      scene.tweens.add({ targets: c, scale: { from: 0.94, to: 1 }, duration: 120 });
      serve(item, stallX(i));
    });
  });

  /* ---------- おきゃくさん ---------- */
  const removeCustomer = (cu: Customer): void => {
    cu.state = 'gone';
    if (slots[cu.slot] === cu) slots[cu.slot] = null;
    const idx = customers.indexOf(cu);
    if (idx >= 0) customers.splice(idx, 1);
  };

  const spawnCustomer = (): void => {
    if (session.isEnded()) return;
    const free: number[] = [];
    slots.forEach((s, i) => {
      if (!s) free.push(i);
    });
    if (free.length > 0) {
      const slot = free[Math.floor(Math.random() * free.length)];
      const vip = session.progress() >= VIP_AFTER && Math.random() < VIP_CHANCE;
      const want = menu[Math.floor(Math.random() * menu.length)];
      const cont = scene.add.container(SLOT_XS[slot], SPAWN_Y).setScale(0.7);
      // ふきだし(ほしいもの)
      const bub = scene.add.graphics();
      bub.fillStyle(0xffffff, 0.96);
      bub.lineStyle(2, vip ? 0xffd34d : 0xe2dccc, 1);
      bub.fillRoundedRect(-27, -94, 54, 46, 12);
      bub.strokeRoundedRect(-27, -94, 54, 46, 12);
      bub.fillTriangle(-7, -50, 7, -50, 0, -40);
      cont.add(bub);
      cont.add(scene.add.text(0, -71, want.emoji, { fontSize: '26px' }).setOrigin(0.5));
      if (vip) {
        const spark = scene.add.text(24, -92, '✨', { fontSize: '16px' }).setOrigin(0.5);
        cont.add(spark);
        scene.tweens.add({ targets: spark, alpha: 0.3, duration: 320, yoyo: true, repeat: -1 });
      }
      const bar = scene.add.graphics();
      cont.add(bar);
      const face = scene.add.text(0, 0, vip ? VIP_FACE : FACES[Math.floor(Math.random() * FACES.length)], {
        fontSize: '40px',
      }).setOrigin(0.5);
      cont.add(face);
      area.add(cont);

      const patience =
        Phaser.Math.Linear(PATIENCE_FROM, PATIENCE_TO, session.progress()) * (vip ? VIP_PATIENCE_MULT : 1);
      const cu: Customer = {
        cont,
        face,
        bar,
        want,
        slot,
        vip,
        arrivedAt: 0,
        patienceMs: patience,
        state: 'walk',
      };
      slots[slot] = cu;
      customers.push(cu);
      if (vip) {
        SFX.hint();
        floatUp(scene, SLOT_XS[slot], SPAWN_Y + api.areaY - 40, UI_TEXT.fest.vipCome, '#e0812a');
      }
      // 奥から 屋台の前へ 歩いてくる
      scene.tweens.add({
        targets: cont,
        y: SLOT_Y,
        scale: 1,
        duration: WALK_IN_MS,
        ease: 'Sine.easeOut',
        onComplete: () => {
          if (cu.state !== 'walk') return;
          cu.state = 'wait';
          cu.arrivedAt = Date.now();
          scene.tweens.add({ targets: face, y: -4, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        },
      });
    }
    const wait = Phaser.Math.Linear(ARRIVE_FROM, ARRIVE_TO, session.progress());
    spawnTimer = scene.time.delayedCall(free.length > 0 ? wait : 350, spawnCustomer);
  };

  /** がまんが きれて 帰ってしまう(しっぱいは ない。コンボが切れるだけ) */
  const sadLeave = (cu: Customer): void => {
    removeCustomer(cu);
    session.resetCombo();
    SFX.bad();
    scene.tweens.killTweensOf(cu.face);
    cu.face.setText('😢');
    cu.bar.clear();
    floatUp(scene, cu.cont.x, cu.cont.y + api.areaY - 60, UI_TEXT.fest.sadLeave, '#c04545');
    scene.tweens.add({
      targets: cu.cont,
      y: SPAWN_Y,
      scale: 0.6,
      alpha: 0,
      duration: 600,
      ease: 'Sine.easeIn',
      onComplete: () => cu.cont.destroy(),
    });
  };

  /** やたいタップ → その しなものを ほしがっている(いちばん せっぱつまった)客に わたす */
  const serve = (item: StallItem, fromX: number): void => {
    const now = Date.now();
    const cands = customers.filter((c) => c.state === 'wait' && c.want.ref === item.ref);
    if (cands.length === 0) {
      // だれも ほしがっていない: コンボが切れるだけ(得点は へらない)
      session.resetCombo();
      SFX.bad();
      missShake(scene);
      floatUp(scene, fromX, STALL_Y + api.areaY - 76, UI_TEXT.fest.wrongItem, '#c04545');
      return;
    }
    const cu = cands.reduce((a, b) =>
      a.patienceMs - (now - a.arrivedAt) <= b.patienceMs - (now - b.arrivedAt) ? a : b,
    );
    cu.state = 'served';
    const remainRatio = 1 - (now - cu.arrivedAt) / cu.patienceMs;
    cu.bar.clear();
    // しなものが やたいから おきゃくさんへ とんでいく
    const food = scene.add.text(fromX, STALL_Y - 26, item.emoji, { fontSize: '30px' }).setOrigin(0.5);
    area.add(food);
    SFX.pop();
    scene.tweens.add({
      targets: food,
      x: cu.cont.x,
      y: cu.cont.y - 8,
      duration: 240,
      ease: 'Quad.easeOut',
      onComplete: () => {
        food.destroy();
        if (session.isEnded()) return;
        SFX.good();
        scene.tweens.killTweensOf(cu.face);
        cu.face.setText('😋');
        burst(scene, cu.cont.x, cu.cont.y + api.areaY - 10, cu.vip ? 16 : 8);
        session.addPoints(cu.vip ? VIP_PTS : SERVE_PTS, cu.cont.x, cu.cont.y + api.areaY - 46);
        if (remainRatio >= QUICK_RATIO) {
          session.addPoints(QUICK_BONUS, cu.cont.x, cu.cont.y + api.areaY - 84, false);
          floatUp(scene, cu.cont.x, cu.cont.y + api.areaY - 112, UI_TEXT.fest.quick, '#3f7d2c');
        }
        removeCustomer(cu);
        // ぴょんと よろこんで 帰っていく
        scene.tweens.add({ targets: cu.cont, y: cu.cont.y - 22, duration: 150, yoyo: true, ease: 'Quad.easeOut' });
        scene.tweens.add({
          targets: cu.cont,
          alpha: 0,
          scale: 0.7,
          delay: 320,
          duration: 380,
          onComplete: () => cu.cont.destroy(),
        });
      },
    });
  };

  /* ---------- フィナーレ(ラスト10秒: はなびの なかの ラッシュ) ---------- */
  const startFinale = (): void => {
    finaleStarted = true;
    SFX.fest();
    const banner = scene.add
      .text(GAME_W / 2, 240, UI_TEXT.fest.finale, {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#e0812a',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScale(0);
    area.add(banner);
    scene.tweens.add({
      targets: banner,
      scale: 1,
      ease: 'Back.easeOut',
      duration: 300,
      onComplete: () =>
        scene.tweens.add({ targets: banner, alpha: 0, delay: 900, duration: 300, onComplete: () => banner.destroy() }),
    });
    finaleTimer = scene.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        if (session.isEnded()) return;
        firework(scene, 60 + Math.random() * (GAME_W - 120), api.areaY + 110 + Math.random() * 90);
      },
    });
  };

  /* ---------- 毎フレーム: がまんゲージ ---------- */
  const onUpdate = (): void => {
    if (session.isEnded()) return;
    if (!finaleStarted && session.secLeft() <= FINALE_SEC) startFinale();
    const now = Date.now();
    for (let i = customers.length - 1; i >= 0; i--) {
      const cu = customers[i];
      if (cu.state !== 'wait') continue;
      const ratio = 1 - (now - cu.arrivedAt) / cu.patienceMs;
      if (ratio <= 0) {
        sadLeave(cu);
        continue;
      }
      cu.bar.clear();
      cu.bar.fillStyle(0xffffff, 0.85);
      cu.bar.fillRoundedRect(-23, -44, 46, 7, 3.5);
      cu.bar.fillStyle(ratio > 0.5 ? 0x6fbf44 : ratio > 0.25 ? 0xff9f40 : 0xe05b5b, 1);
      cu.bar.fillRoundedRect(-23, -44, Math.max(5, 46 * ratio), 7, 3.5);
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    spawnTimer?.remove();
    finaleTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);

  spawnCustomer();
  scene.time.delayedCall(600, spawnCustomer);
}

/* ---------- よるの おまつり会場(ベクター描画) ---------- */
function drawFestivalNight(scene: Phaser.Scene, area: Phaser.GameObjects.Container): void {
  const g = scene.add.graphics();
  // 夜空
  g.fillGradientStyle(0x243057, 0x243057, 0x4a3b6b, 0x4a3b6b, 1);
  g.fillRect(0, 0, GAME_W, SKY_H);
  // 地面(おまつりの ひろば)
  g.fillGradientStyle(0x9c7d4f, 0x9c7d4f, 0x8a6242, 0x8a6242, 1);
  g.fillRect(0, SKY_H, GAME_W, AREA_H - SKY_H);
  // ひろばの すじ(にぎわいの じめん)
  g.fillStyle(0xb89b6a, 0.25);
  for (let i = 0; i < 4; i++) g.fillRoundedRect(14, SKY_H + 34 + i * 42, GAME_W - 28, 10, 5);
  // やたいカウンター
  g.fillStyle(0xa9713a, 1);
  g.fillRoundedRect(8, COUNTER_TOP, GAME_W - 16, AREA_H - COUNTER_TOP - 8, 16);
  g.fillStyle(0xc98f4e, 1);
  g.fillRoundedRect(8, COUNTER_TOP, GAME_W - 16, 16, 8);
  area.add(g);

  // 星
  for (let i = 0; i < 26; i++) {
    const star = scene.add.circle(
      Math.random() * GAME_W,
      70 + Math.random() * (SKY_H - 130),
      1 + Math.random() * 1.5,
      0xfff2c4,
      0.5 + Math.random() * 0.5,
    );
    area.add(star);
    scene.tweens.add({
      targets: star,
      alpha: 0.2,
      duration: 800 + Math.random() * 1200,
      yoyo: true,
      repeat: -1,
    });
  }

  // ちょうちんの つらなり(たわんだ ひも+🏮)
  const rope = scene.add.graphics();
  rope.lineStyle(3, 0x4a3b2a, 1);
  rope.beginPath();
  const sag = 26;
  for (let x = 0; x <= GAME_W; x += 8) {
    const t = x / GAME_W;
    const y = 118 + Math.sin(Math.PI * t) * sag;
    if (x === 0) rope.moveTo(x, y);
    else rope.lineTo(x, y);
  }
  rope.strokePath();
  area.add(rope);
  for (let i = 0; i < 5; i++) {
    const t = (i + 0.5) / 5;
    const x = t * GAME_W;
    const y = 118 + Math.sin(Math.PI * t) * sag + 16;
    const lantern = scene.add.text(x, y, '🏮', { fontSize: '26px' }).setOrigin(0.5, 0.2);
    area.add(lantern);
    scene.tweens.add({
      targets: lantern,
      angle: { from: -7, to: 7 },
      duration: 1100 + i * 130,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // ちょうちんの あかりが じめんに おちる
    const glow = scene.add.circle(x, y + 8, 20, 0xffd34d, 0.14);
    area.add(glow);
    scene.tweens.add({ targets: glow, alpha: 0.05, duration: 900 + i * 90, yoyo: true, repeat: -1 });
  }
}

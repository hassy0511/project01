/* なちの おうぎまつり(わかやま): 12ほんの おおたいまつで、おうぎみこしを むかえる 火の まつり。
   プレイヤーの しごとは「たいまつを かかげて あおぐ」こと。
   ・たいまつを 上下に ふる(ドラッグ)と 火が おおきくなる = 得点
   ・火が よわると きえそうに なるので、ふり つづける(ただし ずっと おなじ ばしょでは だめ)
   ・とんでくる「ひのこ」が おうぎみこしに つくと あぶない: タップで はらう
   ・火が MAX で「おむかえ」= おうぎみこしが すすんで 大とくてん
   動作=じょうげの ふり+わりこみタップ。まもりながら そだてる てざわり */
import Phaser from 'phaser';
import { addIcon, iconScale } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import { offPointerRelease, onPointerRelease } from './input';
import type { MinigameApi } from './types';

const AREA_H = 660;
const TORCH_X = GAME_W / 2;
const TORCH_Y = 470;
/** ふりの はんてい */
const SWING_PX = 46;
const SWING_PTS = 8;
/** 火の おおきさ 0〜1 */
const FLAME_UP = 0.075;
const FLAME_DECAY = 0.1; // /s
const GREET_PTS = 50;
/** ひのこ */
const SPARK_EVERY_MS = 2600;
const SPARK_PTS = 12;

interface Spark {
  obj: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  dead: boolean;
}

export function renderOugi(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // なちの たきと よるの もり
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x14213a, 0x14213a, 0x2f2a45, 0x2f2a45, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0x1f3a2a, 1);
  bg.fillEllipse(60, 300, 240, 400);
  bg.fillEllipse(GAME_W - 50, 320, 260, 420);
  // たき
  bg.fillStyle(0xbfe4f5, 0.75);
  bg.fillRect(GAME_W / 2 - 22, 120, 44, 300);
  bg.fillStyle(0xffffff, 0.55);
  bg.fillRect(GAME_W / 2 - 10, 120, 12, 300);
  bg.fillStyle(0x2f4a6b, 1);
  bg.fillEllipse(GAME_W / 2, 430, 160, 40);
  area.add(bg);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'ougi',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- おうぎみこし ---------- */
  const mikoshi = scene.add.container(90, 250);
  const mg = scene.add.graphics();
  mg.fillStyle(0xc0392b, 1);
  mg.fillRect(-8, -60, 16, 120); // ほそながい みこし
  mg.fillStyle(0xffd34d, 1);
  for (let i = 0; i < 3; i++) mg.fillCircle(0, -40 + i * 40, 13); // おうぎの かがみ
  mikoshi.add(mg);
  mikoshi.add(addIcon(scene, 0, -80, 'fan:crimson', 26));
  area.add(mikoshi);
  let greeted = 0;

  /* ---------- たいまつ ---------- */
  const torch = scene.add.container(TORCH_X, TORCH_Y);
  const tg = scene.add.graphics();
  tg.fillStyle(0x6b4a2a, 1);
  tg.fillRoundedRect(-9, 0, 18, 130, 6); // え
  torch.add(tg);
  const flameObj = addIcon(scene, 0, -22, 'fire:orange', 40);
  torch.add(flameObj);
  area.add(torch);
  const holder = addIcon(scene, TORCH_X, TORCH_Y + 150, 'person-worker:red', 34);
  area.add(holder);

  // 火の おおきさ ゲージ
  const gauge = scene.add.graphics();
  area.add(gauge);
  const gaugeText = scene.add
    .text(GAME_W / 2, 566, '', { fontFamily: 'sans-serif', fontSize: '15px', color: '#ffe8b0', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(gaugeText);

  let flame = 0.25;
  const drawGauge = (): void => {
    gauge.clear();
    gauge.fillStyle(0xffffff, 0.25);
    gauge.fillRoundedRect(70, 590, GAME_W - 140, 18, 9);
    gauge.fillStyle(flame > 0.85 ? 0xffd34d : 0xff8a3d, 1);
    gauge.fillRoundedRect(70, 590, Math.max(6, (GAME_W - 140) * flame), 18, 9);
    gaugeText.setText(UI_TEXT.fest.ougiFlame(Math.round(flame * 100), greeted));
    flameObj.setScale(iconScale(flameObj, 0.7 + flame * 0.9));
    flameObj.setAlpha(0.6 + flame * 0.4);
  };
  drawGauge();

  /* ---------- ひのこ ---------- */
  const sparks: Spark[] = [];
  const sparkTimer = scene.time.addEvent({
    delay: SPARK_EVERY_MS,
    loop: true,
    callback: () => {
      if (session.isEnded()) return;
      const obj = addIcon(scene, TORCH_X, TORCH_Y - 40, 'sparkle:gold', 24);
      area.add(obj);
      sparks.push({ obj, vx: -60 - Math.random() * 40, vy: -20 - Math.random() * 30, dead: false });
    },
  });

  /* ---------- ふる(ドラッグ) ---------- */
  let lastY: number | null = null;
  let lastDir = 0;
  let swung = 0;

  const swing = (): void => {
    swung++;
    flame = Math.min(1, flame + FLAME_UP);
    SFX.pop();
    burst(scene, TORCH_X, TORCH_Y - 30 + api.areaY, 4, [0xff8a3d, 0xffd34d]);
    session.addPoints(SWING_PTS, TORCH_X + 60, TORCH_Y - 60 + api.areaY);
    scene.tweens.add({ targets: torch, angle: { from: swung % 2 ? -10 : 10, to: 0 }, duration: 200 });
    if (flame >= 1) greet();
  };

  const greet = (): void => {
    greeted++;
    flame = 0.35;
    SFX.fanfare();
    bigImpact(scene, mikoshi.x, mikoshi.y + api.areaY, 0xffd34d);
    confetti(scene, 16);
    session.addPoints(GREET_PTS, mikoshi.x, mikoshi.y + api.areaY - 80, false);
    floatUp(scene, GAME_W / 2, 200 + api.areaY, UI_TEXT.fest.ougiGreet, '#e0812a');
    // おうぎみこしが すすむ
    scene.tweens.add({
      targets: mikoshi,
      x: Math.min(GAME_W - 70, mikoshi.x + 60),
      duration: 700,
      ease: 'Sine.easeInOut',
    });
  };

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    // ひのこを はらう(タップ)
    const y = p.worldY - api.areaY;
    for (const s of sparks) {
      if (s.dead) continue;
      if (Math.hypot(s.obj.x - p.worldX, s.obj.y - y) < 44) {
        s.dead = true;
        SFX.good();
        impactRing(scene, s.obj.x, s.obj.y + api.areaY, 0x9ad0f5, 8);
        session.addPoints(SPARK_PTS, s.obj.x, s.obj.y + api.areaY - 30);
        floatUp(scene, s.obj.x, s.obj.y + api.areaY - 50, UI_TEXT.fest.ougiSpark, '#3f7d2c');
        s.obj.destroy();
        return;
      }
    }
    lastY = y;
    lastDir = 0;
  };

  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!p.isDown || session.isEnded() || lastY === null) return;
    const y = p.worldY - api.areaY;
    const d = y - lastY;
    if (Math.abs(d) < SWING_PX) return;
    const dir = d > 0 ? 1 : -1;
    lastY = y;
    // ふりかえし(上→下→上)で 1かい とカウント。おなじ むきに ずっとでは あがらない
    if (dir !== lastDir) {
      lastDir = dir;
      swing();
    }
  };
  const onUp = (): void => {
    lastY = null;
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  onPointerRelease(scene, onUp);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    flame = Math.max(0, flame - FLAME_DECAY * dt);
    drawGauge();
    for (const s of sparks) {
      if (s.dead) continue;
      s.obj.x += s.vx * dt;
      s.obj.y += s.vy * dt;
      // おうぎみこしに とうちゃく = 火の こが ついて コンボが きれる
      if (Math.hypot(s.obj.x - mikoshi.x, s.obj.y - mikoshi.y) < 44) {
        s.dead = true;
        SFX.bad();
        missShake(scene);
        session.resetCombo();
        floatUp(scene, mikoshi.x, mikoshi.y + api.areaY - 60, UI_TEXT.fest.ougiBurn, '#c04545');
        s.obj.destroy();
      } else if (s.obj.x < -30 || s.obj.y < -30) {
        s.dead = true;
        s.obj.destroy();
      }
    }
    // ゆらゆら
    flameObj.y = -22 + Math.sin(Date.now() / 160) * 4;
    holder.y = TORCH_Y + 150 + Math.sin(Date.now() / 420) * 3;
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    offPointerRelease(scene, onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    sparkTimer.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

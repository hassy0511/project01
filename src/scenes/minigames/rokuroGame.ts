/* ましこ とうきいち(とちぎ): ろくろと窯の器づくりゲーム。
   まわる ねんどの「ひかる おび」を指で押さえ続けると かたちが できていく(3段)。
   かたちが完成したら 窯の火加減ゲージ — いい火加減の瞬間にタップで やきあがり!
   ジャストなら「さいこうのやきあがり」。外しても ふつうに焼ける(成功保証)。
   4個ごとに「おおざら」(でかい・段が多い・高得点)が C 要素。
   益子の陶器づくり(ろくろ→窯)をそのまま動詞化 */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, floatUp, impactRing, TX_GLOW } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { DEPTH, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const WHEEL_X = GAME_W / 2;
const WHEEL_Y = 380;
const POT_W = 150;
/** 1段の成形に必要な押さえ時間(ms)。おおざらは段数が多い */
const BAND_MS = 1100;
const BANDS_NORMAL = 3;
const BANDS_OOZARA = 4;
const OOZARA_EVERY = 4;
/** 窯の火加減: マーカー周期と ジャスト帯 */
const KILN_PERIOD_FROM = 1300;
const KILN_PERIOD_TO = 850;
const KILN_JUST = 16;
const KILN_OK = 52;
const PTS_BAND = 6;
const PTS_FIRE_OK = 14;
const PTS_FIRE_JUST = 30;
const PTS_OOZARA_MULT = 2;

type PhaseKind = 'shape' | 'kiln';

export function renderRokuro(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 工房: あたたかい室内+棚の器+窯
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xe8dcc8, 0xe8dcc8, 0xd0bfa0, 0xd0bfa0, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  // 棚と並んだ器
  bg.fillStyle(0x8a6242, 1);
  bg.fillRect(20, 150, 200, 8);
  bg.fillRect(20, 220, 200, 8);
  bg.fillStyle(0x9c7d4f, 1);
  for (let i = 0; i < 4; i++) {
    bg.fillRoundedRect(34 + i * 48, 118, 30, 30, 6);
    bg.fillRoundedRect(34 + i * 48, 190, 30, 28, 10);
  }
  // 窯(のぼりがま)
  bg.fillStyle(0x7a5a45, 1);
  bg.fillRoundedRect(310, 100, 150, 130, 16);
  bg.fillStyle(0x3d3129, 1);
  bg.fillRoundedRect(345, 150, 80, 80, 40);
  area.add(bg);
  const kilnFire = scene.add.text(385, 200, '🔥', { fontSize: '30px' }).setOrigin(0.5).setAlpha(0.55);
  area.add(kilnFire);
  scene.tweens.add({ targets: kilnFire, scale: 1.2, alpha: 0.85, duration: 500, yoyo: true, repeat: -1 });

  api.sign(prompt);

  const session = new ArcadeSession(api, {
    engine: 'rokuro',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- ろくろ台と ねんど ---------- */
  const wheel = scene.add.graphics();
  wheel.fillStyle(0x6e5a45, 1);
  wheel.fillEllipse(WHEEL_X, WHEEL_Y + 96, 220, 46);
  wheel.fillStyle(0x8a7259, 1);
  wheel.fillEllipse(WHEEL_X, WHEEL_Y + 90, 190, 36);
  area.add(wheel);

  let potCount = 0;
  let oozara = false;
  let bandsTotal = BANDS_NORMAL;
  let bandIdx = 0;
  let bandHeld = 0; // 押さえ済みms
  let phase: PhaseKind = 'shape';
  let kilnPhase = 0;
  let holding = false;
  let potG: Phaser.GameObjects.Graphics | undefined;
  let bandG: Phaser.GameObjects.Graphics | undefined;
  let spinBits: Phaser.GameObjects.Arc[] = [];
  let kilnGauge: Phaser.GameObjects.Graphics | undefined;
  let kilnMarker = 0;

  const potScale = (): number => (oozara ? 1.35 : 1);
  /** 段のY(下から積み上がる) */
  const bandY = (i: number): number => WHEEL_Y + 70 - (i + 0.5) * 46 * potScale();

  const drawPot = (): void => {
    potG?.clear();
    if (!potG) {
      potG = scene.add.graphics();
      area.add(potG);
    }
    const s = potScale();
    // 完成済みの段
    for (let i = 0; i < bandIdx; i++) {
      const w = (POT_W - i * 26) * s;
      potG.fillStyle(0xb5654a, 1);
      potG.fillRoundedRect(WHEEL_X - w / 2, bandY(i) - 22 * s, w, 44 * s, 12);
      potG.fillStyle(0xc98a6a, 1);
      potG.fillRoundedRect(WHEEL_X - w / 2 + 6, bandY(i) - 22 * s, w - 12, 8, 4);
    }
    // 現在の段(押さえた分だけ せり上がる)
    if (phase === 'shape' && bandIdx < bandsTotal) {
      const ratio = bandHeld / BAND_MS;
      const w = (POT_W - bandIdx * 26) * s;
      const h = 44 * s * Math.max(0.15, ratio);
      potG.fillStyle(0xa5583e, 0.9);
      potG.fillRoundedRect(WHEEL_X - w / 2, bandY(bandIdx) + 22 * s - h, w, h, 8);
    }
  };

  const drawBand = (): void => {
    bandG?.clear();
    if (!bandG) {
      bandG = scene.add.graphics();
      area.add(bandG);
    }
    if (phase !== 'shape' || bandIdx >= bandsTotal) return;
    const s = potScale();
    const w = (POT_W - bandIdx * 26) * s + 46;
    // ひかる おび(押さえる場所)
    bandG.lineStyle(4, holding ? 0xffd34d : 0xffffff, holding ? 1 : 0.75);
    bandG.strokeRoundedRect(WHEEL_X - w / 2, bandY(bandIdx) - 26 * s, w, 52 * s, 14);
  };

  /** まわっている感: ねんどの表面を横に流れる粒 */
  const spinTimer = scene.time.addEvent({
    delay: 160,
    loop: true,
    callback: () => {
      if (session.isEnded() || phase !== 'shape') return;
      const i = Math.min(bandIdx, bandsTotal - 1);
      const s = potScale();
      const w = (POT_W - i * 26) * s;
      const dot = scene.add.circle(WHEEL_X - w / 2 + 6, bandY(i), 3, 0xe0b89a, 0.9);
      area.add(dot);
      spinBits.push(dot);
      scene.tweens.add({
        targets: dot,
        x: WHEEL_X + w / 2 - 6,
        alpha: 0,
        duration: 420,
        onComplete: () => {
          dot.destroy();
          spinBits = spinBits.filter((d) => d !== dot);
        },
      });
    },
  });

  const newPot = (): void => {
    potCount++;
    oozara = potCount % OOZARA_EVERY === 0;
    bandsTotal = oozara ? BANDS_OOZARA : BANDS_NORMAL;
    bandIdx = 0;
    bandHeld = 0;
    phase = 'shape';
    kilnGauge?.clear();
    if (oozara) {
      SFX.hint();
      floatUp(scene, WHEEL_X, WHEEL_Y + api.areaY - 180, UI_TEXT.fest.oozara, '#e0812a');
    }
    drawPot();
    drawBand();
  };

  /* ---------- 窯フェーズ ---------- */
  const startKiln = (): void => {
    phase = 'kiln';
    bandG?.clear();
    if (!kilnGauge) {
      kilnGauge = scene.add.graphics();
      area.add(kilnGauge);
    }
    SFX.hint();
  };

  const drawKiln = (): void => {
    if (!kilnGauge) return;
    kilnGauge.clear();
    if (phase !== 'kiln') return;
    const gy = 560;
    kilnGauge.fillStyle(0xffffff, 0.85);
    kilnGauge.fillRoundedRect(GAME_W / 2 - 170, gy - 14, 340, 28, 14);
    kilnGauge.fillStyle(0xff9f40, 0.85);
    kilnGauge.fillRoundedRect(GAME_W / 2 - KILN_OK, gy - 14, KILN_OK * 2, 28, 12);
    kilnGauge.fillStyle(0xd94f4f, 0.95);
    kilnGauge.fillRoundedRect(GAME_W / 2 - KILN_JUST, gy - 14, KILN_JUST * 2, 28, 8);
    const nx = GAME_W / 2 + kilnMarker * 154;
    kilnGauge.fillStyle(0x4a3b2a, 1);
    kilnGauge.fillRoundedRect(nx - 5, gy - 20, 10, 40, 5);
    kilnGauge.lineStyle(0, 0, 0);
  };

  const fire = (): void => {
    const off = Math.abs(kilnMarker * 154);
    const just = off <= KILN_JUST;
    const ok = off <= KILN_OK;
    const mult = oozara ? PTS_OOZARA_MULT : 1;
    const pts = (just ? PTS_FIRE_JUST : ok ? PTS_FIRE_OK : Math.round(PTS_FIRE_OK / 2)) * mult;
    // 焼きあがりの演出: 器がきらめいて棚へ
    const glow = scene.add.image(WHEEL_X, WHEEL_Y, TX_GLOW).setScale(oozara ? 7 : 5).setTint(just ? 0xffd34d : 0xffb37a);
    glow.setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.overlay);
    scene.tweens.add({ targets: glow, alpha: 0, scale: 2, duration: 600, onComplete: () => glow.destroy() });
    if (just) {
      if (oozara) bigImpact(scene, WHEEL_X, WHEEL_Y + api.areaY);
      else impactRing(scene, WHEEL_X, WHEEL_Y + api.areaY, 0xffd34d, 14);
      SFX.fanfare();
      floatUp(scene, WHEEL_X, WHEEL_Y + api.areaY - 130, UI_TEXT.fest.firedJust, '#3f7d2c');
    } else {
      SFX.good();
      floatUp(scene, WHEEL_X, WHEEL_Y + api.areaY - 130, UI_TEXT.fest.fired, '#e0812a');
    }
    session.addPoints(pts, WHEEL_X, WHEEL_Y + api.areaY - 90);
    burst(scene, WHEEL_X, WHEEL_Y + api.areaY, oozara ? 16 : 9, [0xb5654a, 0xc98a6a, 0xffd34d]);
    potG?.clear();
    kilnGauge?.clear();
    scene.time.delayedCall(420, () => {
      if (!session.isEnded()) newPot();
    });
    phase = 'shape'; // 次の準備(newPotで正式リセット)
    bandIdx = 0;
    bandHeld = 0;
  };

  /* ---------- 入力 ---------- */
  const inBand = (p: Phaser.Input.Pointer): boolean => {
    if (bandIdx >= bandsTotal) return false;
    const s = potScale();
    const w = (POT_W - bandIdx * 26) * s + 60;
    const y = p.worldY - api.areaY;
    return Math.abs(p.worldX - WHEEL_X) < w / 2 + 14 && Math.abs(y - bandY(bandIdx)) < 40 * s;
  };
  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    if (phase === 'kiln') {
      fire();
      return;
    }
    holding = inBand(p);
    drawBand();
  };
  const onMove = (p: Phaser.Input.Pointer): void => {
    if (phase !== 'shape' || !p.isDown) return;
    holding = inBand(p);
    drawBand();
  };
  const onUp = (): void => {
    holding = false;
    drawBand();
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33);
    if (phase === 'shape') {
      if (holding && bandIdx < bandsTotal) {
        bandHeld += dt;
        if (Math.floor(bandHeld / 90) !== Math.floor((bandHeld - dt) / 90)) SFX.pop();
        if (bandHeld >= BAND_MS) {
          // 1段 完成
          session.addPoints(PTS_BAND * (oozara ? PTS_OOZARA_MULT : 1), WHEEL_X, bandY(bandIdx) + api.areaY - 30);
          floatUp(scene, WHEEL_X + 100, bandY(bandIdx) + api.areaY, UI_TEXT.fest.shaped, '#3f7d2c');
          burst(scene, WHEEL_X, bandY(bandIdx) + api.areaY, 5, [0xc98a6a, 0xe0b89a]);
          bandIdx++;
          bandHeld = 0;
          if (bandIdx >= bandsTotal) startKiln();
        }
        drawPot();
        drawBand();
      }
    } else {
      const period = Phaser.Math.Linear(KILN_PERIOD_FROM, KILN_PERIOD_TO, session.progress());
      kilnPhase += (dt / period) * Math.PI * 2;
      kilnMarker = Math.sin(kilnPhase);
      drawKiln();
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    spinTimer.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);

  newPot();
}

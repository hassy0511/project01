/* はままつまつり(しずおか): たこあげ 合戦ゲーム。
   画面を おしているあいだ 糸を「ひく」= たこが 上がる。はなすと ゆるんで さがる。
   ただし ひきすぎると 糸が ぱんぱんに なって きれてしまう(下から やりなおし)。
   たこが 高いほど 得点が つみあがる。ときどき 相手の たこが 来て、
   高い方が 相手の糸を 切って 大得点(C要素)。
   kantou(倒立バランス)と違い、こちらは「張力の 上下」= ため方の 遊び */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, fillBar, floatUp, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import { offPointerRelease, onPointerRelease } from './input';
import { CROWD } from './crowd';
import type { MinigameApi } from './types';

const AREA_H = GAME_AREA_H;
const GROUND_Y = 600;
/** はりメーターの たかさ。あんない文(y=54から2ぎょう)と かさならない ところに おく */
const METER_Y = 112;
/** たこの 高さ(0=地上, 1=いちばん上) */
const RISE_PER_SEC = 0.42;
const FALL_PER_SEC = 0.3;
/** 糸の はり(0〜1): 押していると たまる。1で きれる */
const TENSION_UP = 0.55;
const TENSION_DOWN = 0.8;
const TICK_MS = 500;
/** 相手の たこ */
const RIVAL_EVERY_MS = 13000;
const RIVAL_LEN_MS = 6000;
const CUT_PTS = 34;

export function renderTako(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 5月の はままつの そら(すなの ばしょ)
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x7fc8f0, 0x7fc8f0, 0xd6f0ff, 0xd6f0ff, 1);
  bg.fillRect(0, 0, GAME_W, GROUND_Y);
  bg.fillStyle(0xe6d3a3, 1);
  bg.fillRect(0, GROUND_Y, GAME_W, AREA_H - GROUND_Y);
  area.add(bg);
  for (let i = 0; i < 3; i++) {
    const cl = scene.add.graphics();
    cl.fillStyle(0xffffff, 0.75);
    cl.fillEllipse(0, 0, 80, 28);
    cl.fillEllipse(-24, 8, 48, 22);
    cl.setPosition(60 + i * 160, 120 + (i % 2) * 70);
    area.add(cl);
    scene.tweens.add({ targets: cl, x: cl.x + 40, duration: 6000 + i * 1200, yoyo: true, repeat: -1 });
  }
  for (let i = 0; i < 5; i++) {
    area.add(addIcon(scene, 40 + i * 100, GROUND_Y + 30, CROWD[i], 26));
  }

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'tako',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- たこ と 糸 ---------- */
  const tako = scene.add.container(GAME_W / 2 - 40, GROUND_Y - 40);
  const tg = scene.add.graphics();
  tg.fillStyle(0xd94f4f, 1);
  tg.fillTriangle(-34, 0, 34, 0, 0, -46);
  tg.fillStyle(0xf5e6c8, 1);
  tg.fillTriangle(-20, 0, 20, 0, 0, -28);
  tg.lineStyle(3, 0x3d3129, 1);
  tg.lineBetween(-34, 0, 34, 0);
  tako.add(tg);
  tako.add(addIcon(scene, 0, 22, 'kite:sky', 20));
  area.add(tako);

  const rival = scene.add.container(GAME_W + 80, 200);
  const rg = scene.add.graphics();
  rg.fillStyle(0x7a5a9a, 1);
  rg.fillTriangle(-30, 0, 30, 0, 0, -40);
  rg.fillStyle(0xf5e6c8, 1);
  rg.fillTriangle(-16, 0, 16, 0, 0, -22);
  rival.add(rg);
  area.add(rival);

  const string = scene.add.graphics();
  area.add(string);
  const meter = scene.add.graphics();
  area.add(meter);

  /* ---------- 状態 ---------- */
  let height = 0;
  let tension = 0;
  let pressing = false;
  let cutUntil = 0;
  let rivalOn = false;

  const drawAll = (): void => {
    const y = GROUND_Y - 40 - height * (GROUND_Y - 150);
    tako.setPosition(GAME_W / 2 - 40 + Math.sin(height * 6) * 26, y);
    tako.setAngle(Math.sin(height * 8) * 8);
    string.clear();
    string.lineStyle(2, tension > 0.75 ? 0xd94f4f : 0xffffff, 0.9);
    string.lineBetween(GAME_W / 2 + 60, GROUND_Y + 10, tako.x, tako.y + 20);
    // 糸の はりメーター
    meter.clear();
    meter.fillStyle(0xffffff, 0.85);
    fillBar(meter, GAME_W / 2 - 110, METER_Y, 220, 16, 8);
    meter.fillStyle(tension > 0.75 ? 0xd94f4f : 0x9ccb6f, 1);
    fillBar(meter, GAME_W / 2 - 110, METER_Y, 220 * tension, 16, 8);
  };
  drawAll();

  const onDown = (): void => {
    pressing = true;
  };
  const onUp = (): void => {
    pressing = false;
  };
  scene.input.on('pointerdown', onDown);
  onPointerRelease(scene, onUp);

  const tick = scene.time.addEvent({
    delay: TICK_MS,
    loop: true,
    callback: () => {
      if (session.isEnded() || Date.now() < cutUntil) return;
      const pts = Math.round(2 + height * 12);
      if (height > 0.15) {
        session.addPoints(pts, tako.x, tako.y + api.areaY - 40);
        if (height > 0.8 && Math.random() < 0.4) {
          floatUp(scene, tako.x, tako.y + api.areaY - 60, UI_TEXT.fest.takoUp, '#e0812a');
        }
      }
    },
  });

  // 相手の たこ(C要素)
  const rivalTimer = scene.time.addEvent({
    delay: RIVAL_EVERY_MS,
    loop: true,
    callback: () => {
      if (session.isEnded() || rivalOn) return;
      rivalOn = true;
      SFX.fanfare();
      floatUp(scene, GAME_W / 2, 140 + api.areaY, UI_TEXT.fest.takoRival, '#e0812a');
      scene.tweens.add({ targets: rival, x: GAME_W - 90, duration: 800, ease: 'Sine.easeOut' });
      scene.time.delayedCall(RIVAL_LEN_MS, () => {
        rivalOn = false;
        scene.tweens.add({ targets: rival, x: GAME_W + 80, duration: 700 });
      });
    },
  });

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    if (Date.now() < cutUntil) {
      drawAll();
      return;
    }
    if (pressing) {
      height = Math.min(1, height + RISE_PER_SEC * dt);
      tension = Math.min(1, tension + TENSION_UP * dt);
    } else {
      height = Math.max(0, height - FALL_PER_SEC * dt);
      tension = Math.max(0, tension - TENSION_DOWN * dt);
    }
    // 相手より 高ければ 糸を 切れる
    if (rivalOn && height > 0.72) {
      rivalOn = false;
      SFX.good();
      session.addPoints(CUT_PTS, rival.x, rival.y + api.areaY, false);
      floatUp(scene, GAME_W / 2, 200 + api.areaY, UI_TEXT.fest.takoWin, '#3f7d2c');
      bigImpact(scene, rival.x, rival.y + api.areaY);
      confetti(scene, 16);
      scene.tweens.add({ targets: rival, x: GAME_W + 80, y: 520, angle: 180, duration: 900 });
    }
    if (tension >= 1) {
      // 糸が きれた: 下から やりなおし(コンボが切れるだけ)
      cutUntil = Date.now() + 900;
      tension = 0;
      height = 0;
      pressing = false;
      session.resetCombo();
      SFX.bad();
      missShake(scene);
      burst(scene, tako.x, tako.y + api.areaY, 6, [0xffffff, 0xd94f4f]);
      floatUp(scene, GAME_W / 2, 300 + api.areaY, UI_TEXT.fest.takoCut, '#c04545');
    }
    drawAll();
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    offPointerRelease(scene, onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    tick.remove();
    rivalTimer.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

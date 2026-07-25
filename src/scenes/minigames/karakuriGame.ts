/* たかやままつり(ぎふ): からくり人形の 糸あやつりゲーム。
   やたいの うえの 人形から 4本の 糸が のびている。ひかった 糸を
   じゅんばんに「下へ ひく」(ドラッグ)と、人形が 芸(わざ)を つづけていく。
   ひととおり できると「げいが きまった!」でボーナス。
   ちがう糸を ひいても 人形が すこし よろけるだけ(成功保証)。
   minyou(順番を おぼえる)と違い、こちらは 常に「いま ひかっている糸」を ひく=
   目と手の 追従。速さが 上がっていくのが 手ごたえ */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const DOLL_Y = 210;
/** 糸の 下端(ここを つかんで 下へ ひく) */
const HANDLE_Y = 470;
const PULL_DY = 54;
const STEP_PTS = 10;
const TRICK_BONUS = 24;
/** ひかりが きえるまで(ms): 序盤→終盤 */
const LIT_FROM_MS = 2200;
const LIT_TO_MS = 1200;
/** 1つの芸に つかう 糸の数 */
const TRICK_LEN = 4;

const STRING_X = [90, 180, 300, 390];
const POSES = ['🙆', '🙋', '💃', '🤹'];

export function renderKarakuri(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 春の たかやまの やたい
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xaee3f7, 0xaee3f7, 0xf7e3b8, 0xf7e3b8, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0x8a6a4a, 1);
  bg.fillRect(30, 520, GAME_W - 60, 90); // やたいの 台
  bg.fillStyle(0x5a4a3a, 1);
  bg.fillRect(50, 300, 20, 220);
  bg.fillRect(GAME_W - 70, 300, 20, 220);
  bg.fillStyle(0x3d3129, 1);
  bg.fillTriangle(20, 300, GAME_W / 2, 236, GAME_W - 20, 300); // やたいの やね
  bg.fillStyle(0xd94f4f, 1);
  bg.fillRect(40, 300, GAME_W - 80, 12);
  area.add(bg);
  for (let i = 0; i < 4; i++) {
    area.add(scene.add.text(70 + i * 110, 560, ['🧑', '👧', '👦', '👘'][i], { fontSize: '24px' }).setOrigin(0.5));
  }

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'karakuri',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- 人形 ---------- */
  const doll = scene.add.container(GAME_W / 2, DOLL_Y);
  const dg = scene.add.graphics();
  dg.fillStyle(0xf5e6c8, 1);
  dg.fillCircle(0, -22, 20); // かお
  dg.fillStyle(0xd94f4f, 1);
  dg.fillRoundedRect(-24, -4, 48, 52, 10); // からだ
  dg.fillStyle(0x3d3129, 1);
  dg.fillEllipse(0, -38, 40, 16); // かみ
  doll.add(dg);
  const dollFace = scene.add.text(0, -22, '🙂', { fontSize: '20px' }).setOrigin(0.5);
  doll.add(dollFace);
  const dollPose = scene.add.text(0, 66, '', { fontSize: '30px' }).setOrigin(0.5);
  doll.add(dollPose);
  area.add(doll);
  scene.tweens.add({ targets: doll, y: DOLL_Y - 6, duration: 1100, yoyo: true, repeat: -1 });

  /* ---------- 糸 ---------- */
  const lines = scene.add.graphics();
  area.add(lines);
  const handles: Phaser.GameObjects.Container[] = [];
  STRING_X.forEach((x, i) => {
    const c = scene.add.container(x, HANDLE_Y);
    const g = scene.add.graphics();
    const draw = (on: boolean): void => {
      g.clear();
      g.fillStyle(on ? 0xffd34d : 0xd8c49a, 1);
      g.fillCircle(0, 0, 22);
      g.lineStyle(3, 0xffffff, on ? 1 : 0.6);
      g.strokeCircle(0, 0, 22);
    };
    draw(false);
    c.add(g);
    c.setData('draw', draw);
    c.setData('idx', i);
    c.setInteractive(new Phaser.Geom.Circle(0, 0, 30), Phaser.Geom.Circle.Contains);
    area.add(c);
    handles.push(c);
  });
  const drawLines = (): void => {
    lines.clear();
    lines.lineStyle(2, 0x8a7a62, 0.9);
    STRING_X.forEach((_x, i) => lines.lineBetween(GAME_W / 2 + (i - 1.5) * 14, DOLL_Y + 10, handles[i].x, handles[i].y - 22));
  };
  drawLines();

  /* ---------- 状態 ---------- */
  let lit = -1;
  let step = 0;
  let litTimer: Phaser.Time.TimerEvent | undefined;

  const setLit = (i: number): void => {
    if (lit >= 0) (handles[lit].getData('draw') as (on: boolean) => void)(false);
    lit = i;
    if (i >= 0) {
      (handles[i].getData('draw') as (on: boolean) => void)(true);
      scene.tweens.add({ targets: handles[i], scale: { from: 1, to: 1.12 }, duration: 320, yoyo: true, repeat: -1 });
    }
  };

  const nextLit = (): void => {
    if (session.isEnded()) return;
    let n = Math.floor(Math.random() * STRING_X.length);
    if (n === lit) n = (n + 1) % STRING_X.length;
    scene.tweens.killTweensOf(handles);
    handles.forEach((h) => h.setScale(1));
    setLit(n);
    litTimer?.remove();
    litTimer = scene.time.delayedCall(Phaser.Math.Linear(LIT_FROM_MS, LIT_TO_MS, session.progress()), () => {
      // まにあわなかった: つぎの糸へ(コンボが切れる)
      session.resetCombo();
      step = 0;
      nextLit();
    });
  };
  nextLit();

  const doPull = (i: number): void => {
    if (session.isEnded()) return;
    const handle = handles[i];
    scene.tweens.add({ targets: handle, y: HANDLE_Y + PULL_DY, duration: 110, yoyo: true, onUpdate: drawLines });
    if (i === lit) {
      SFX.pop();
      session.addPoints(STEP_PTS, handle.x, HANDLE_Y + api.areaY - 40);
      floatUp(scene, handle.x, HANDLE_Y + api.areaY - 60, UI_TEXT.fest.itoPull, '#e0812a');
      // 人形が うごく
      dollPose.setText(POSES[i]);
      dollFace.setText('😄');
      scene.tweens.add({ targets: doll, angle: { from: -6, to: 6 }, duration: 120, yoyo: true, onComplete: () => doll.setAngle(0) });
      burst(scene, doll.x, DOLL_Y + api.areaY, 5, [0xffd34d, 0xffffff]);
      step++;
      if (step >= TRICK_LEN) {
        step = 0;
        SFX.fanfare();
        session.addPoints(TRICK_BONUS, doll.x, DOLL_Y + api.areaY - 60, false);
        floatUp(scene, doll.x, DOLL_Y + api.areaY - 90, UI_TEXT.fest.itoTrick, '#3f7d2c');
        bigImpact(scene, doll.x, DOLL_Y + api.areaY);
        confetti(scene, 14);
      }
      nextLit();
    } else {
      // ちがう糸: 人形が よろける
      session.resetCombo();
      step = 0;
      SFX.bad();
      missShake(scene);
      impactRing(scene, handle.x, HANDLE_Y + api.areaY, 0xc04545, 10);
      dollFace.setText('😵');
      scene.time.delayedCall(400, () => dollFace.setText('🙂'));
    }
  };
  handles.forEach((h, i) => h.on('pointerdown', () => doPull(i)));

  const cleanup = (): void => {
    litTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

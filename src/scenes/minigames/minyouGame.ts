/* にいがた まつり(だいみんようながし): 振り(ふり)おぼえゲーム。
   まちを ながれる おどりの列。お手本の「ふり」が じゅんばんに ひかるので、
   おなじ じゅんばんに タップして そろえる。そろえるほど 列が のびて 得点アップ。
   まちがえても おなじ長さで やりなおすだけ(成功保証)。
   実在の「大民謡流し」の「みんなで おなじ おどりを そろえる」をそのまま動詞化 */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
/** 4つの ふり(ボタン) */
const MOVES = [
  { emoji: '🙌', color: 0xef5350, label: 'ばんざい' },
  { emoji: '👐', color: 0x42a5f5, label: 'ひろげ' },
  { emoji: '👏', color: 0xffca28, label: 'てびょうし' },
  { emoji: '🤲', color: 0x66bb6a, label: 'すくい' },
];
const BTN_Y = 560;
const BTN_R = 54;
/** お手本の 見せる速さ(ms)と 1つ正解の点 */
const SHOW_MS = 620;
const STEP_PTS = 8;
const ROUND_BONUS = 16;
/** 最初の長さと 最大 */
const LEN_START = 2;
const LEN_MAX = 6;

export function renderMinyou(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 夕暮れの まちなみ+おどりの列
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xf7c873, 0xf7c873, 0xf7e3b8, 0xf7e3b8, 1);
  bg.fillRect(0, 0, GAME_W, 430);
  bg.fillStyle(0xb89b6a, 1);
  bg.fillRect(0, 430, GAME_W, AREA_H - 430);
  bg.fillStyle(0x8a6a4a, 1);
  for (let i = 0; i < 4; i++) bg.fillRect(i * 130 + 10, 300, 110, 130);
  area.add(bg);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'minyou',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  // おどりの列(ながれていく)
  const dancers: Phaser.GameObjects.Text[] = [];
  for (let i = 0; i < 7; i++) {
    const d = scene.add.text(20 + i * 72, 400, i % 2 === 0 ? '👘' : '🧑', { fontSize: '30px' }).setOrigin(0.5);
    area.add(d);
    dancers.push(d);
    scene.tweens.add({ targets: d, y: 394, duration: 420 + (i % 3) * 70, yoyo: true, repeat: -1 });
  }
  const flowDancers = (): void => {
    for (const d of dancers) {
      d.x += 12;
      if (d.x > GAME_W + 20) d.x = -20;
    }
  };

  /* ---------- ふりボタン ---------- */
  const btns: Phaser.GameObjects.Container[] = [];
  MOVES.forEach((m, i) => {
    const c = scene.add.container(70 + i * 115, BTN_Y);
    const g = scene.add.graphics();
    const draw = (on: boolean): void => {
      g.clear();
      g.fillStyle(m.color, on ? 1 : 0.5);
      g.fillCircle(0, 0, BTN_R);
      g.lineStyle(4, 0xffffff, on ? 1 : 0.6);
      g.strokeCircle(0, 0, BTN_R);
    };
    draw(false);
    c.add(g);
    c.add(scene.add.text(0, 0, m.emoji, { fontSize: '38px' }).setOrigin(0.5));
    c.setData('draw', draw);
    c.setInteractive(new Phaser.Geom.Circle(0, 0, BTN_R), Phaser.Geom.Circle.Contains);
    area.add(c);
    btns.push(c);
  });

  const flash = (i: number, ms = 260): void => {
    const draw = btns[i].getData('draw') as (on: boolean) => void;
    draw(true);
    scene.tweens.add({ targets: btns[i], scale: 1.12, duration: 90, yoyo: true });
    scene.time.delayedCall(ms, () => draw(false));
  };

  /* ---------- 状態 ---------- */
  let seq: number[] = [];
  let inputIdx = 0;
  let showing = true;
  let len = LEN_START;
  const timers: Phaser.Time.TimerEvent[] = [];

  const showSeq = (): void => {
    showing = true;
    inputIdx = 0;
    floatUp(scene, GAME_W / 2, 240 + api.areaY, UI_TEXT.fest.minyouRound(seq.length), '#e0812a');
    seq.forEach((mv, i) => {
      timers.push(
        scene.time.delayedCall(400 + i * SHOW_MS, () => {
          if (session.isEnded()) return;
          flash(mv, SHOW_MS * 0.6);
          SFX.pop();
        }),
      );
    });
    timers.push(
      scene.time.delayedCall(400 + seq.length * SHOW_MS + 200, () => {
        showing = false;
      }),
    );
  };

  const newRound = (): void => {
    seq = Array.from({ length: len }, () => Math.floor(Math.random() * MOVES.length));
    showSeq();
  };
  newRound();

  const onBtn = (i: number): void => {
    if (session.isEnded() || showing) return;
    flash(i);
    if (seq[inputIdx] === i) {
      SFX.pop();
      session.addPoints(STEP_PTS, btns[i].x, BTN_Y + api.areaY - 70);
      inputIdx++;
      flowDancers();
      if (inputIdx >= seq.length) {
        // ひと ながれ そろった!
        SFX.good();
        session.addPoints(ROUND_BONUS, GAME_W / 2, 320 + api.areaY, false);
        floatUp(scene, GAME_W / 2, 300 + api.areaY, UI_TEXT.fest.minyouStep, '#3f7d2c');
        burst(scene, GAME_W / 2, 340 + api.areaY, 10);
        if (len >= LEN_MAX) {
          bigImpact(scene, GAME_W / 2, 340 + api.areaY);
          confetti(scene, 14);
        }
        len = Math.min(LEN_MAX, len + 1);
        showing = true;
        timers.push(scene.time.delayedCall(700, newRound));
      }
    } else {
      // ちがった: おなじ長さで やりなおし(みじかくは ならない)
      session.resetCombo();
      SFX.bad();
      missShake(scene);
      impactRing(scene, btns[i].x, BTN_Y + api.areaY, 0xc04545, 12);
      floatUp(scene, GAME_W / 2, 300 + api.areaY, UI_TEXT.fest.minyouMiss, '#c04545');
      showing = true;
      timers.push(scene.time.delayedCall(700, showSeq));
    }
  };
  btns.forEach((b, i) => b.on('pointerdown', () => onBtn(i)));

  const cleanup = (): void => {
    for (const t of timers) t.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

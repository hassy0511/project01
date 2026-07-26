/* あわおどり(とくしま): 「ぞめき」の 2びょうしで まちを ながれる おどり。
   ふりの きごうが ながれてくるので、きごうに よって うごきを うちわける。
     👏(て) = タップ
     🦶(あし) = 上に スワイプ
   おなじ きごうが つづくと リズムに のって「ぞめき タイム」= 得点2ばい。
   まちがえた うごきでも たおれない(コンボが きれるだけ)。
   動作=2しゅるいの うごきの うちわけ。1つの ボタンを たたく リズムゲームとは ちがう */
import Phaser from 'phaser';
import { addIcon, iconScale } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { burst, cameraPulse, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import { offPointerRelease, onPointerRelease } from './input';
import type { MinigameApi } from './types';

const AREA_H = 660;
/** ながれる バーと はんてい */
const BAR_Y = 300;
const MARK_X = 96;
const PERFECT_PX = 26;
const OK_PX = 62;
const PERFECT_PTS = 16;
const OK_PTS = 7;
/** ぞめきタイム(れんぞく) */
const ZOMEKI_AT = 6;
const SPEED_START = 150;
const SPEED_END = 240;
const SWIPE_MIN = 36;

type Kind = 'hand' | 'foot';

interface Note {
  obj: Phaser.GameObjects.Image;
  x: number;
  kind: Kind;
  done: boolean;
}

export function renderAwaodori(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x2f2a4a, 0x2f2a4a, 0x5a3a5a, 0x5a3a5a, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  for (let i = 0; i < 6; i++) {
    bg.fillStyle(0xffd34d, 0.9);
    bg.fillRect(i * 84 + 20, 80, 48, 8); // よこの ちょうちんれつ
  }
  bg.fillStyle(0x4a3a2a, 1);
  bg.fillRect(0, 520, GAME_W, AREA_H - 520);
  area.add(bg);

  // おどりて(れんぞくで はねる)
  const dancers: Phaser.GameObjects.Image[] = [];
  for (const [dx, e] of [[-150, 'person-kimono:crimson'], [-60, 'person:teal'], [60, 'person-kimono:violet'], [150, 'person:navy']] as const) {
    const t = addIcon(scene, GAME_W / 2 + dx, 470, e, 34);
    area.add(t);
    dancers.push(t);
  }
  const kane = addIcon(scene, GAME_W / 2, 570, 'drum:brown', 30);
  area.add(kane);

  // はんていバー
  const bar = scene.add.graphics();
  bar.fillStyle(0xffffff, 0.16);
  bar.fillRoundedRect(40, BAR_Y - 26, GAME_W - 80, 52, 12);
  bar.lineStyle(4, 0xffd34d, 0.9);
  bar.strokeRoundedRect(MARK_X - 30, BAR_Y - 30, 60, 60, 12);
  area.add(bar);
  area.add(
    scene.add
      .text(GAME_W / 2, BAR_Y + 54, UI_TEXT.fest.awaodoriHow, {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#ffe8b0',
      })
      .setOrigin(0.5),
  );

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'awaodori',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- ふりの きごう ---------- */
  const notes: Note[] = [];
  let streak = 0;
  let zomeki = false;

  const spawn = (): void => {
    if (session.isEnded()) return;
    const kind: Kind = Math.random() < 0.55 ? 'hand' : 'foot';
    const obj = addIcon(scene, GAME_W - 30, BAR_Y, kind === 'hand' ? 'hand-clap:tan' : 'foot:tan', 30).setName('mg-note');
    obj.setData('kind', kind);
    area.add(obj);
    notes.push({ obj, x: GAME_W - 30, kind, done: false });
  };
  const gap = (): number => Math.max(520, 1150 - 500 * session.progress());
  let spawnTimer = scene.time.delayedCall(800, function loop() {
    spawn();
    if (!session.isEnded()) spawnTimer = scene.time.delayedCall(gap(), loop);
  });

  const speed = (): number => SPEED_START + (SPEED_END - SPEED_START) * session.progress();

  const hop = (big: boolean): void => {
    for (const [i, d] of dancers.entries()) {
      scene.tweens.add({ targets: d, y: 470 - (big ? 30 : 16), duration: 130, yoyo: true, delay: i * 30 });
    }
    scene.tweens.add({ targets: kane, scale: { from: iconScale(kane, 1.2), to: iconScale(kane) }, duration: 160 });
  };

  const judge = (kind: Kind): void => {
    if (session.isEnded()) return;
    let best: Note | null = null;
    let bd = Infinity;
    for (const n of notes) {
      if (n.done) continue;
      const d = Math.abs(n.x - MARK_X);
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    if (!best || bd > OK_PX) {
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      streak = 0;
      zomeki = false;
      floatUp(scene, MARK_X, BAR_Y + api.areaY - 60, UI_TEXT.fest.awaodoriMiss, '#c04545');
      return;
    }
    if (best.kind !== kind) {
      // うごきの まちがい
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      streak = 0;
      zomeki = false;
      floatUp(
        scene,
        MARK_X,
        BAR_Y + api.areaY - 60,
        best.kind === 'hand' ? UI_TEXT.fest.awaodoriNeedHand : UI_TEXT.fest.awaodoriNeedFoot,
        '#c04545',
      );
      return;
    }
    best.done = true;
    const perfect = bd <= PERFECT_PX;
    streak++;
    if (streak >= ZOMEKI_AT && !zomeki) {
      zomeki = true;
      SFX.fanfare();
      confetti(scene, 16);
      cameraPulse(scene);
      floatUp(scene, GAME_W / 2, 200 + api.areaY, UI_TEXT.fest.awaodoriZomeki, '#e0812a');
    }
    const pts = (perfect ? PERFECT_PTS : OK_PTS) * (zomeki ? 2 : 1);
    SFX[perfect ? 'good' : 'pop']();
    impactRing(scene, MARK_X, BAR_Y + api.areaY, kind === 'hand' ? 0xffd34d : 0x9ad0f5, perfect ? 14 : 10);
    burst(scene, MARK_X, BAR_Y + api.areaY, perfect ? 9 : 4);
    session.addPoints(pts, MARK_X, BAR_Y + api.areaY - 70);
    floatUp(
      scene,
      MARK_X + 60,
      BAR_Y + api.areaY - 90,
      perfect ? UI_TEXT.fest.awaodoriEraiya : UI_TEXT.fest.awaodoriOk,
      perfect ? '#e0812a' : '#3f7d2c',
    );
    hop(perfect);
    best.obj.destroy();
  };

  /* ---------- にゅうりょく: タップ or 上スワイプ ---------- */
  let downX = 0;
  let downY = 0;
  let downAt = 0;
  const onDown = (p: Phaser.Input.Pointer): void => {
    downX = p.worldX;
    downY = p.worldY;
    downAt = Date.now();
  };
  const onUp = (p: Phaser.Input.Pointer): void => {
    const dx = p.worldX - downX;
    const dy = p.worldY - downY;
    const up = dy < -SWIPE_MIN && Math.abs(dy) > Math.abs(dx) && Date.now() - downAt < 600;
    judge(up ? 'foot' : 'hand');
  };
  scene.input.on('pointerdown', onDown);
  onPointerRelease(scene, onUp);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dx = (speed() * Math.min(dtMs, 33)) / 1000;
    for (const n of notes) {
      if (n.done) continue;
      n.x -= dx;
      n.obj.x = n.x;
      if (n.x < 30) {
        n.done = true;
        n.obj.destroy();
        session.resetCombo();
        streak = 0;
        zomeki = false;
      }
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    offPointerRelease(scene, onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    spawnTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

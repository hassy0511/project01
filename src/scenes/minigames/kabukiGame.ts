/* ながはま ひきやままつり(しが): 曳山の ぶたいで する「こども かぶき」。
   せりふが ながれて、ひかった ポーズマークで キメる(タップ)。
   ★ ちょうどの ときに タップ = 「みえを きる」大せいこう。
     すこし ずれると「まあまあ」。はやすぎ・おそすぎでも 得点は へらない(コンボが きれるだけ)。
   ときどき「ぐんじょう(見せ場)」= 3れんぞくの キメ。ぜんぶ そろえると 大ボーナス。
   動作=「まちの タイミングタップ」。太鼓リズム(ishidori)や 回転(gion)とは べつの てざわり */
import Phaser from 'phaser';
import { addIcon, iconScale } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = GAME_AREA_H;
const STAGE_Y = 430;
/** せりふの ながれる バー */
const BAR_Y = 250;
const BAR_X0 = 40;
const BAR_X1 = GAME_W - 40;
const MARK_X = GAME_W - 96;
/** はんてい(px) */
const PERFECT_PX = 20;
const OK_PX = 54;
const PERFECT_PTS = 18;
const OK_PTS = 7;
/** 見せ場(3れんぞく)の ボーナス */
const SHOW_BONUS = 40;
/** せりふが ながれる はやさ(px/s。だんだん はやくなる) */
const SPEED_START = 130;
const SPEED_END = 210;

interface Cue {
  obj: Phaser.GameObjects.Image;
  x: number;
  done: boolean;
  show: boolean;
}

export function renderKabuki(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // ひきやまの ぶたい(まくと ちょうちん)
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x3a2a44, 0x3a2a44, 0x6b4a5a, 0x6b4a5a, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0x8a2f2f, 1);
  bg.fillRect(0, 300, GAME_W, 34);
  for (let i = 0; i < 8; i++) {
    bg.fillStyle(i % 2 ? 0x2f6b3a : 0xe8d9a8, 1);
    bg.fillRect(i * 60, 300, 60, 34);
  }
  // ぶたい
  bg.fillStyle(0x8a6a4a, 1);
  bg.fillRoundedRect(30, STAGE_Y - 20, GAME_W - 60, 150, 10);
  bg.fillStyle(0x6b4a2a, 1);
  bg.fillRect(30, STAGE_Y - 20, GAME_W - 60, 12);
  // くるま(曳山)
  bg.fillStyle(0x3a2a18, 1);
  bg.fillCircle(90, STAGE_Y + 140, 20);
  bg.fillCircle(GAME_W - 90, STAGE_Y + 140, 20);
  area.add(bg);

  const actor = addIcon(scene, GAME_W / 2, STAGE_Y + 50, 'person-kimono:crimson', 58);
  area.add(actor);
  const fan = addIcon(scene, GAME_W / 2 + 46, STAGE_Y + 40, 'fan:crimson', 30).setAlpha(0);
  area.add(fan);
  for (const [dx, e] of [[-140, 'drum:crimson'], [140, 'shamisen:tan']] as const) {
    area.add(addIcon(scene, GAME_W / 2 + dx, STAGE_Y + 96, e, 26));
  }

  // せりふバーと キメの わく
  const bar = scene.add.graphics();
  bar.fillStyle(0xffffff, 0.18);
  bar.fillRoundedRect(BAR_X0, BAR_Y - 22, BAR_X1 - BAR_X0, 44, 12);
  bar.lineStyle(4, 0xffd34d, 0.9);
  bar.strokeRoundedRect(MARK_X - 26, BAR_Y - 26, 52, 52, 12);
  area.add(bar);
  area.add(
    scene.add
      .text(MARK_X, BAR_Y + 44, UI_TEXT.fest.kabukiHere, {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#ffe8b0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5),
  );

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'kabuki',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- せりふ(キメ)の ながれ ---------- */
  const cues: Cue[] = [];
  let showStreak = 0; // 見せ場の れんぞく数
  let showLeft = 0; // 見せ場に のこっている キメ数

  const spawn = (): void => {
    if (session.isEnded()) return;
    const isShow = showLeft > 0;
    if (!isShow && Math.random() < 0.22) {
      // 見せ場の はじまり(3れんぞく)
      showLeft = 3;
      showStreak = 0;
      SFX.hint();
      floatUp(scene, GAME_W / 2, BAR_Y + api.areaY - 70, UI_TEXT.fest.kabukiShow, '#e0812a');
    }
    const show = showLeft > 0;
    if (show) showLeft--;
    const obj = addIcon(scene, BAR_X0, BAR_Y, show ? 'sparkle:gold' : 'mask:violet', show ? 30 : 26).setName('mg-cue');
    if (show) obj.setTint(0xffd34d);
    area.add(obj);
    cues.push({ obj, x: BAR_X0, done: false, show });
  };

  const speed = (): number => SPEED_START + (SPEED_END - SPEED_START) * session.progress();
  const spawnGap = (): number => Math.max(560, 1300 - 600 * session.progress());
  let spawnTimer = scene.time.delayedCall(700, function loop() {
    spawn();
    if (!session.isEnded()) spawnTimer = scene.time.delayedCall(spawnGap(), loop);
  });

  const pose = (good: boolean): void => {
    // きまりポーズ: 扇を ひらいて ぴたっと とまる
    fan.setAlpha(1).setScale(iconScale(fan, good ? 1.2 : 0.9));
    scene.tweens.add({ targets: fan, alpha: 0, duration: good ? 520 : 300 });
    scene.tweens.add({
      targets: actor,
      scaleX: { from: iconScale(actor, good ? 1.18 : 1.06), to: iconScale(actor) },
      scaleY: { from: iconScale(actor, good ? 0.88 : 0.96), to: iconScale(actor) },
      duration: 260,
      ease: 'Back.easeOut',
    });
  };

  /* ---------- タップ ---------- */
  const onDown = (): void => {
    if (session.isEnded()) return;
    // いちばん わくに ちかい キメを ねらう
    let best: Cue | null = null;
    let bestD = Infinity;
    for (const c of cues) {
      if (c.done) continue;
      const d = Math.abs(c.x - MARK_X);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    if (!best || bestD > OK_PX) {
      // はやすぎ / おそすぎ: へらないが コンボは きれる
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      showStreak = 0;
      pose(false);
      floatUp(scene, MARK_X, BAR_Y + api.areaY - 50, UI_TEXT.fest.kabukiEarly, '#c04545');
      return;
    }
    best.done = true;
    const perfect = bestD <= PERFECT_PX;
    const base = (perfect ? PERFECT_PTS : OK_PTS) * (best.show ? 2 : 1);
    if (perfect) {
      SFX.good();
      bigImpact(scene, MARK_X, BAR_Y + api.areaY, 0xffd34d);
      floatUp(scene, MARK_X, BAR_Y + api.areaY - 60, UI_TEXT.fest.kabukiPerfect, '#e0812a');
    } else {
      SFX.pop();
      impactRing(scene, MARK_X, BAR_Y + api.areaY, 0xffffff, 10);
      floatUp(scene, MARK_X, BAR_Y + api.areaY - 60, UI_TEXT.fest.kabukiOk, '#3f7d2c');
    }
    burst(scene, MARK_X, BAR_Y + api.areaY, perfect ? 10 : 5);
    session.addPoints(base, MARK_X, BAR_Y + api.areaY - 90);
    pose(perfect);
    best.obj.destroy();
    // 見せ場の 3れんぞく
    if (best.show && perfect) {
      showStreak++;
      if (showStreak >= 3) {
        showStreak = 0;
        SFX.fanfare();
        confetti(scene, 16);
        session.addPoints(SHOW_BONUS, GAME_W / 2, STAGE_Y + api.areaY - 40, false);
        floatUp(scene, GAME_W / 2, STAGE_Y + api.areaY - 80, UI_TEXT.fest.kabukiShowDone, '#e0812a');
      }
    } else if (!perfect) {
      showStreak = 0;
    }
  };
  scene.input.on('pointerdown', onDown);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dx = (speed() * Math.min(dtMs, 33)) / 1000;
    for (const c of cues) {
      if (c.done) continue;
      c.x += dx;
      c.obj.x = c.x;
      if (c.x > BAR_X1) {
        // ながれて いった(みのがし): コンボだけ きれる
        c.done = true;
        c.obj.destroy();
        session.resetCombo();
        showStreak = 0;
      }
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    spawnTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

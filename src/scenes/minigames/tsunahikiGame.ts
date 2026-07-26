/* なは おおづなひき(おきなわ): まちを ひがしと にしに わけて、おおきな つなを ひきあう ぎょうじ。
   これは「れんだ」と「ふんばり」の 2つを あわせた 力くらべ。
     ・タップれんだで つなを ひく(すこしずつ こちらに くる)
     ・あいてが「せーの!」で つよく ひく しゅんかんが ある(あかい あいず)
       → そのときは 画面を ながおしして ふんばる(はなすと ひきもどされる)
     ・つなの まんなかの ふさが こちらの せんを こえると 1しょうぶ かち!
   まけても また はじまる(たいせつなのは なんかい かてるか)。
   動作=れんだ + ながおしの きりかえ。ほかの おまつりに ない てざわり */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const CY = 340;
/** つなの ふさの いち(-1 = あいて / +1 = こちら) */
const WIN_AT = 0.85;
const PULL_PER_TAP = 0.035;
/** あいての ひき(/s) */
const FOE_BASE = 0.055;
const FOE_STRONG = 0.42;
const STRONG_MS = 1600;
const TAP_PTS = 4;
const HOLD_PTS = 12;
const WIN_PTS = 60;

export function renderTsunahiki(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x7fd8f0, 0x7fd8f0, 0xffe9b8, 0xffe9b8, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0xe8d8a8, 1);
  bg.fillRect(0, 430, GAME_W, AREA_H - 430); // こくさいどおり
  bg.fillStyle(0x9ccb6f, 0.5);
  bg.fillEllipse(60, 200, 120, 70);
  bg.fillEllipse(GAME_W - 50, 190, 130, 80);
  area.add(bg);
  area.add(addIcon(scene, 40, 150, 'hibiscus:pink', 26));
  area.add(addIcon(scene, GAME_W - 40, 158, 'palm:deepgreen', 34));

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'tsunahiki',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- つな ---------- */
  const rope = scene.add.graphics();
  area.add(rope);
  const fusa = addIcon(scene, GAME_W / 2, CY, 'tassel:crimson', 34);
  area.add(fusa);
  // ひきて(ひだり=あいて / みぎ=こちら)
  const foes: Phaser.GameObjects.Image[] = [];
  const ours: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < 4; i++) {
    const f = addIcon(scene, 30 + i * 34, CY + 60, 'person:teal', 24).setAlpha(0.85);
    area.add(f);
    foes.push(f);
    const o = addIcon(scene, GAME_W - 30 - i * 34, CY + 60, 'person-child:amber', 26);
    area.add(o);
    ours.push(o);
  }

  let pos = 0; // -1〜+1
  let strongUntil = 0;
  let holding = false;
  let wins = 0;
  let losses = 0;

  const warn = scene.add
    .text(GAME_W / 2, 220, '', { fontFamily: FONT, fontSize: '22px', color: '#c04545', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(warn);
  const info = scene.add
    .text(GAME_W / 2, 600, '', { fontFamily: FONT, fontSize: '15px', color: '#5a4632', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(info);

  const draw = (): void => {
    const cx = GAME_W / 2 + pos * (GAME_W / 2 - 60);
    rope.clear();
    rope.lineStyle(14, 0xc9a86a, 1);
    rope.lineBetween(10, CY, GAME_W - 10, CY);
    // こちらの かちライン
    rope.lineStyle(4, 0x3f7d2c, 0.8);
    rope.lineBetween(GAME_W / 2 + WIN_AT * (GAME_W / 2 - 60), CY - 40, GAME_W / 2 + WIN_AT * (GAME_W / 2 - 60), CY + 40);
    rope.lineStyle(4, 0xc04545, 0.5);
    rope.lineBetween(GAME_W / 2 - WIN_AT * (GAME_W / 2 - 60), CY - 40, GAME_W / 2 - WIN_AT * (GAME_W / 2 - 60), CY + 40);
    fusa.setX(cx);
    info.setText(UI_TEXT.fest.tsunaInfo(wins, losses));
  };
  draw();

  const strongTimer = scene.time.addEvent({
    delay: 4200,
    loop: true,
    callback: () => {
      if (session.isEnded()) return;
      strongUntil = Date.now() + STRONG_MS;
      SFX.hint();
      warn.setText(UI_TEXT.fest.tsunaWarn);
      scene.tweens.add({ targets: warn, scale: { from: 1.3, to: 1 }, duration: 200 });
      for (const [i, f] of foes.entries()) {
        scene.tweens.add({ targets: f, x: f.x - 10, duration: 200, yoyo: true, delay: i * 30 });
      }
    },
  });

  const roundEnd = (win: boolean): void => {
    if (win) {
      wins++;
      SFX.fanfare();
      bigImpact(scene, fusa.x, CY + api.areaY, 0xffd34d);
      confetti(scene, 20);
      session.addPoints(WIN_PTS, GAME_W / 2, CY + api.areaY - 90, false);
      floatUp(scene, GAME_W / 2, CY + api.areaY - 130, UI_TEXT.fest.tsunaWin(wins), '#e0812a');
    } else {
      losses++;
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      floatUp(scene, GAME_W / 2, CY + api.areaY - 90, UI_TEXT.fest.tsunaLose, '#c04545');
    }
    pos = 0;
    strongUntil = 0;
    draw();
  };

  const onDown = (): void => {
    if (session.isEnded()) return;
    holding = true;
    if (Date.now() < strongUntil) return; // ふんばり中は ひかない
    pos = Math.min(1, pos + PULL_PER_TAP);
    SFX.pop();
    session.addPoints(TAP_PTS, fusa.x, CY + api.areaY - 60);
    burst(scene, fusa.x, CY + api.areaY, 3, [0xc9a86a, 0xffffff]);
    for (const [i, o] of ours.entries()) {
      scene.tweens.add({ targets: o, x: o.x + 6, duration: 90, yoyo: true, delay: i * 15 });
    }
    if (pos >= WIN_AT) roundEnd(true);
    draw();
  };
  const onUp = (): void => {
    holding = false;
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointerup', onUp);

  let holdScoreAt = 0;
  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    const strong = Date.now() < strongUntil;
    warn.setText(strong ? UI_TEXT.fest.tsunaWarn : '');
    if (strong) {
      // ふんばれていれば ほとんど もっていかれない
      const foe = holding ? FOE_STRONG * 0.12 : FOE_STRONG;
      pos -= foe * dt;
      if (holding && Date.now() - holdScoreAt > 400) {
        holdScoreAt = Date.now();
        session.addPoints(HOLD_PTS, fusa.x, CY + api.areaY - 80);
        impactRing(scene, fusa.x, CY + api.areaY, 0x9ccb6f, 10);
        floatUp(scene, fusa.x, CY + api.areaY + 96, UI_TEXT.fest.tsunaHold, '#3f7d2c');
      }
    } else {
      pos -= (FOE_BASE + 0.05 * session.progress()) * dt;
    }
    if (pos <= -WIN_AT) roundEnd(false);
    fusa.setAngle(Math.sin(Date.now() / 200) * 8);
    draw();
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointerup', onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    strongTimer.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

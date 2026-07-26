/* おわら かぜの ぼん(とやま・やつお): しずかな おどりの「キープ」ゲーム。
   胡弓(こきゅう)の しずかな ねいろに あわせて、ゆっくり うごく「ひかる わく」の
   なかに 指を おいたまま ついていく。入っているあいだ 得点が つみあがる。
   はずれても 得点が とまるだけ(成功保証)。
   ときどき「かぜが とおる」= わくが すこし はやくなって 2倍(C要素)。
   他のゲームが「タップの瞬間」を問うのに対し、これは「はなさず ついていく」持続の遊び */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { burst, confetti, floatUp } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import { offPointerRelease, onPointerRelease } from './input';
import type { MinigameApi } from './types';

const AREA_H = GAME_AREA_H;
const RING_R = 62;
const TICK_MS = 500;
const TICK_PTS = 8;
/** わくの うごく はやさ(px/s): 序盤→終盤 */
const SPEED_FROM = 42;
const SPEED_TO = 76;
/** かぜタイム */
const WIND_EVERY_MS = 15000;
const WIND_LEN_MS = 6000;

export function renderOwara(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 夜の やつおの まちなみ(ぼんぼりの あかり)
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x1b2440, 0x1b2440, 0x33395e, 0x33395e, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0x141a2e, 1);
  for (let i = 0; i < 5; i++) bg.fillRect(i * 100 - 6, 380, 88, 200);
  area.add(bg);
  for (let i = 0; i < 7; i++) {
    const lamp = addIcon(scene, 20 + i * 72, 360, 'lantern:crimson', 20).setAlpha(0.9);
    area.add(lamp);
    scene.tweens.add({ targets: lamp, alpha: 0.55, duration: 1400 + i * 200, yoyo: true, repeat: -1 });
  }
  // おどり手(すげがさ)
  const dancer = scene.add.container(GAME_W / 2, 470);
  const dg = scene.add.graphics();
  dg.fillStyle(0xd8c49a, 1);
  dg.fillEllipse(0, -34, 74, 26); // すげがさ
  dg.fillStyle(0x2a3358, 1);
  dg.fillRoundedRect(-20, -26, 40, 74, 12);
  dancer.add(dg);
  dancer.add(addIcon(scene, 0, 42, 'person-kimono:crimson', 30));
  area.add(dancer);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'owara',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- ひかる わく(ゆっくり 8の字に うごく) ---------- */
  const ring = scene.add.circle(GAME_W / 2, 250, RING_R).setStrokeStyle(6, 0xffe0a3, 0.95);
  area.add(ring);
  scene.tweens.add({ targets: ring, scale: { from: 1, to: 1.06 }, duration: 900, yoyo: true, repeat: -1 });
  const inner = scene.add.circle(GAME_W / 2, 250, 8, 0xffe0a3, 0.8);
  area.add(inner);

  let phase = 0;
  let holding = false;
  let inside = false;
  let wind = false;

  const cx = (): number => GAME_W / 2 + Math.sin(phase) * 130;
  const cy = (): number => 250 + Math.sin(phase * 2) * 90;

  // 得点の刻み
  const tick = scene.time.addEvent({
    delay: TICK_MS,
    loop: true,
    callback: () => {
      if (session.isEnded() || !holding || !inside) return;
      session.addPoints(TICK_PTS * (wind ? 2 : 1), ring.x, ring.y + api.areaY - 70);
      if (Math.random() < 0.3) floatUp(scene, ring.x + 70, ring.y + api.areaY - 40, UI_TEXT.fest.owaraKeep, '#ffe0a3');
      // おどり手が わくの ほうへ 体を むける
      scene.tweens.add({ targets: dancer, x: Phaser.Math.Linear(dancer.x, ring.x, 0.5), duration: 400 });
    },
  });

  const onDown = (p: Phaser.Input.Pointer): void => {
    holding = true;
    check(p.worldX, p.worldY);
  };
  const onMove = (p: Phaser.Input.Pointer): void => {
    if (p.isDown) check(p.worldX, p.worldY);
  };
  const onUp = (): void => {
    holding = false;
    if (inside) {
      inside = false;
      ring.setStrokeStyle(6, 0xffe0a3, 0.95);
    }
  };
  /** さいごに 指が あった ところ。わくが うごいた あとの 判定に つかう */
  let fingerX = 0;
  let fingerY = 0;
  const check = (wx: number, wy: number): void => {
    fingerX = wx;
    fingerY = wy;
    const was = inside;
    inside = Math.hypot(wx - ring.x, wy - api.areaY - ring.y) <= RING_R;
    if (inside !== was) {
      ring.setStrokeStyle(6, inside ? 0x9ccb6f : 0xffe0a3, 0.95);
      if (inside) {
        SFX.pop();
        burst(scene, ring.x, ring.y + api.areaY, 4, [0xffe0a3, 0xffffff]);
      } else {
        floatUp(scene, ring.x, ring.y + api.areaY - 50, UI_TEXT.fest.owaraOut, '#c04545');
      }
    }
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  onPointerRelease(scene, onUp);

  // かぜタイム(C要素)
  const windTimer = scene.time.addEvent({
    delay: WIND_EVERY_MS,
    loop: true,
    callback: () => {
      if (session.isEnded() || wind) return;
      wind = true;
      SFX.fanfare();
      floatUp(scene, GAME_W / 2, 150 + api.areaY, UI_TEXT.fest.kazeTime, '#e0812a');
      confetti(scene, 10);
      scene.time.delayedCall(WIND_LEN_MS, () => {
        wind = false;
      });
    },
  });

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    const speed = Phaser.Math.Linear(SPEED_FROM, SPEED_TO, session.progress()) * (wind ? 1.5 : 1);
    phase += (speed / 260) * dt * Math.PI;
    ring.setPosition(cx(), cy());
    inner.setPosition(ring.x, ring.y);
    // わくが うごいた ぶんを 見なおす。うごかさずに おしっぱなしでも 得点が
    // 入りつづけて しまう のを ふせぐ(わくは にげていくので ついていく ひつようが ある)
    if (holding) check(fingerX, fingerY);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    offPointerRelease(scene, onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    tick.remove();
    windTimer.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

/* いわみかぐら(しまね): 「やまたのおろち」の まい。8つの あたまの おろちを たいじする。
   のびてきた あたまの そばに「やじるし」が でるので、その むきに スワイプして つるぎを ふる。
   むきを まちがえると かわされる(コンボ切れ。得点は へらない)。
   8つ ぜんぶ たいじすると 大ボーナス → つぎの おろちが でてくる。
   動作=むきの ある スワイプ(方向はんだん)。ほかの おまつりに ない てざわり */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const HEADS = 8;
const HEAD_PTS = 14;
const ALL_BONUS = 60;
/** スワイプの さいしょうきょり */
const SWIPE_MIN = 40;
/** あたまが でている じかん */
const SHOW_MS_START = 2100;
const SHOW_MS_END = 1150;

type Dir = 'up' | 'down' | 'left' | 'right';
const ARROW: Record<Dir, string> = { up: 'arrow-up:navy', down: 'arrow-down:navy', left: 'arrow-left:navy', right: 'arrow-right:navy' };

interface Head {
  obj: Phaser.GameObjects.Image;
  arrow: Phaser.GameObjects.Image;
  dir: Dir;
  x: number;
  y: number;
  alive: boolean;
  active: boolean;
}

export function renderKagura(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x2a1f3a, 0x2a1f3a, 0x4a2a3a, 0x4a2a3a, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  // かぐらの ぶたい(まくと ちょうちん)
  bg.fillStyle(0x8a2f2f, 1);
  bg.fillRect(0, 80, GAME_W, 26);
  bg.fillStyle(0x6b4a2a, 1);
  bg.fillRect(0, 560, GAME_W, AREA_H - 560);
  bg.fillStyle(0x5a3a1a, 1);
  for (let i = 0; i < 10; i++) bg.fillRect(i * 50, 560, 40, 6);
  area.add(bg);
  // かぐらの まいて(すさのお)
  const hero = addIcon(scene, GAME_W / 2, 600, 'knife:silver', 40);
  area.add(hero);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'kagura',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- おろちの あたま ---------- */
  const heads: Head[] = [];
  const build = (): void => {
    for (const h of heads) {
      h.obj.destroy();
      h.arrow.destroy();
    }
    heads.length = 0;
    for (let i = 0; i < HEADS; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 84 + col * 104;
      const y = 220 + row * 150;
      const dirs: Dir[] = ['up', 'down', 'left', 'right'];
      const dir = dirs[Math.floor(Math.random() * 4)];
      const obj = addIcon(scene, x, y, 'dragon:green', 44).setAlpha(0.25);
      const arrow = addIcon(scene, x, y - 52, ARROW[dir], 26).setVisible(false);
      area.add(obj);
      area.add(arrow);
      heads.push({ obj, arrow, dir, x, y, alive: true, active: false });
    }
  };
  build();

  let current: Head | null = null;
  let showTimer: Phaser.Time.TimerEvent | undefined;

  const showMs = (): number => SHOW_MS_START + (SHOW_MS_END - SHOW_MS_START) * session.progress();

  const hide = (h: Head): void => {
    h.active = false;
    h.arrow.setVisible(false);
    h.obj.setAlpha(h.alive ? 0.25 : 0).setScale(1);
  };

  const nextHead = (): void => {
    if (session.isEnded()) return;
    const alive = heads.filter((h) => h.alive);
    if (!alive.length) return;
    const h = alive[Math.floor(Math.random() * alive.length)];
    current = h;
    h.active = true;
    h.obj.setAlpha(1);
    h.arrow.setVisible(true);
    SFX.hint();
    scene.tweens.add({ targets: h.obj, scale: { from: 0.7, to: 1.15 }, duration: 260, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: h.arrow, scale: { from: 1, to: 1.25 }, duration: 300, yoyo: true, repeat: -1 });
    showTimer = scene.time.delayedCall(showMs(), () => {
      if (h.active) {
        // ひっこんだ(コンボ切れ)
        hide(h);
        current = null;
        session.resetCombo();
      }
      nextHead();
    });
  };
  scene.time.delayedCall(900, nextHead);

  /* ---------- スワイプ ---------- */
  let downX = 0;
  let downY = 0;
  const onDown = (p: Phaser.Input.Pointer): void => {
    downX = p.worldX;
    downY = p.worldY;
  };

  const onUp = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded() || !current || !current.active) return;
    const dx = p.worldX - downX;
    const dy = p.worldY - downY;
    if (Math.hypot(dx, dy) < SWIPE_MIN) return;
    const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    const h = current;
    // つるぎを ふる
    scene.tweens.add({
      targets: hero,
      x: h.x,
      y: h.y + 60,
      angle: dir === 'left' ? -60 : dir === 'right' ? 60 : dir === 'up' ? -20 : 20,
      duration: 160,
      yoyo: true,
      onComplete: () => hero.setPosition(GAME_W / 2, 600).setAngle(0),
    });
    if (dir !== h.dir) {
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      floatUp(scene, h.x, h.y + api.areaY - 60, UI_TEXT.fest.kaguraDodge, '#c04545');
      return;
    }
    h.alive = false;
    hide(h);
    current = null;
    SFX.good();
    impactRing(scene, h.x, h.y + api.areaY, 0xffd34d, 12);
    burst(scene, h.x, h.y + api.areaY, 10, [0xffd34d, 0xe05b5b]);
    session.addPoints(HEAD_PTS, h.x, h.y + api.areaY - 60);
    floatUp(scene, h.x, h.y + api.areaY - 90, UI_TEXT.fest.kaguraCut, '#e0812a');
    if (heads.every((x) => !x.alive)) {
      SFX.fanfare();
      bigImpact(scene, GAME_W / 2, 380 + api.areaY);
      confetti(scene, 22);
      session.addPoints(ALL_BONUS, GAME_W / 2, 360 + api.areaY, false);
      floatUp(scene, GAME_W / 2, 320 + api.areaY, UI_TEXT.fest.kaguraAll, '#e0812a');
      showTimer?.remove();
      scene.time.delayedCall(1100, () => {
        if (session.isEnded()) return;
        build();
        nextHead();
      });
    }
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointerup', onUp);

  const onUpdate = (): void => {
    if (session.isEnded()) return;
    // でていない あたまは ゆらゆら
    for (const h of heads) {
      if (!h.active && h.alive) h.obj.y = h.y + Math.sin(Date.now() / 600 + h.x) * 4;
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointerup', onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    showTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

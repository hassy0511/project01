/* わらじまつり(ふくしま): おおわらじ担ぎ 行進ゲーム。
   したの ひだり👣/みぎ👣を「こうごに」タップすると、おおわらじが 前へ すすむ。
   おなじ がわを つづけて タップすると よろけるだけ(コンボが切れる=成功保証)。
   ときどき「さかみち」= 1歩2倍 が C 要素。
   実在のわらじまつりの「大わらじを かついで ねりあるく」をそのまま動詞化。
   動作=左右交互タップ(歩行のリズム) */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, confetti, floatUp, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const STREET_Y = 430;
const STEP_PTS = 8;
const TRIP_STALL_MS = 450;
/** さかみち: 間隔と持続 */
const HILL_EVERY_MS = 12000;
const HILL_LEN_MS = 6000;

export function renderWaraji(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // まちなみ(スクロールする 2枚タイル)
  const bgFixed = scene.add.graphics();
  bgFixed.fillGradientStyle(0xaee3f7, 0xaee3f7, 0xf7ecd2, 0xf7ecd2, 1);
  bgFixed.fillRect(0, 0, GAME_W, STREET_Y);
  bgFixed.fillStyle(0xb89b6a, 1);
  bgFixed.fillRect(0, STREET_Y, GAME_W, AREA_H - STREET_Y);
  area.add(bgFixed);
  const tiles: Phaser.GameObjects.Graphics[] = [];
  for (let t = 0; t < 2; t++) {
    const g = scene.add.graphics();
    for (let i = 0; i < 3; i++) {
      const bx = i * 170 + 16;
      g.fillStyle(0x8a6a4a, 1);
      g.fillRect(bx, STREET_Y - 130, 130, 130);
      g.fillStyle(0x5a4a3a, 1);
      g.fillTriangle(bx - 10, STREET_Y - 130, bx + 65, STREET_Y - 168, bx + 140, STREET_Y - 130);
      g.fillStyle(0xf7e3b8, 0.9);
      g.fillRect(bx + 20, STREET_Y - 96, 26, 30);
      g.fillRect(bx + 82, STREET_Y - 96, 26, 30);
    }
    g.setX(t * 510);
    area.add(g);
    tiles.push(g);
  }

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'waraji',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- おおわらじ + かつぎて ---------- */
  const waraji = scene.add.container(GAME_W / 2, STREET_Y - 40);
  const wg = scene.add.graphics();
  wg.fillStyle(0xd8b878, 1);
  wg.fillEllipse(0, 0, 300, 110);
  wg.fillStyle(0xc9a86a, 1);
  wg.fillEllipse(0, 0, 260, 84);
  wg.lineStyle(5, 0x8a6a42, 1);
  for (let i = -3; i <= 3; i++) wg.strokeEllipse(0, 0, 260 - Math.abs(i) * 34, 84 - Math.abs(i) * 11);
  wg.lineStyle(7, 0x8a6a42, 1);
  wg.lineBetween(-60, -40, 0, 8);
  wg.lineBetween(60, -40, 0, 8);
  waraji.add(wg);
  for (const [dx, e] of [[-120, '🧑'], [-40, '👦'], [40, '👧'], [120, '🧑']] as const) {
    waraji.add(scene.add.text(dx, 62, e, { fontSize: '30px' }).setOrigin(0.5));
  }
  area.add(waraji);

  /* ---------- あしあとボタン(こうごに タップ) ---------- */
  let expect = 0; // 0=ひだりから
  const feet: Phaser.GameObjects.Container[] = [];
  const drawFoot = (i: number): void => {
    const c = feet[i];
    const g = c.getAt(0) as Phaser.GameObjects.Graphics;
    g.clear();
    const active = expect === i;
    g.fillStyle(active ? 0xff9f40 : 0xffffff, active ? 0.95 : 0.7);
    g.lineStyle(3, 0x8a6a42, 1);
    g.fillRoundedRect(-70, -44, 140, 88, 20);
    g.strokeRoundedRect(-70, -44, 140, 88, 20);
  };
  for (let i = 0; i < 2; i++) {
    const c = scene.add.container(i === 0 ? 130 : GAME_W - 130, 580);
    c.add(scene.add.graphics());
    c.add(scene.add.text(0, 0, '👣', { fontSize: '40px' }).setOrigin(0.5));
    area.add(c);
    feet.push(c);
  }
  drawFoot(0);
  drawFoot(1);

  let stalledUntil = 0;
  let hill = false;

  const advanceStreet = (px: number): void => {
    for (const t of tiles) {
      t.x -= px;
      if (t.x < -510) t.x += 1020;
    }
  };

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded() || Date.now() < stalledUntil) return;
    const side = p.worldX < GAME_W / 2 ? 0 : 1;
    if (side === expect) {
      expect = 1 - expect;
      drawFoot(0);
      drawFoot(1);
      const pts = STEP_PTS * (hill ? 2 : 1);
      SFX.pop();
      session.addPoints(pts, waraji.x, STREET_Y + api.areaY - 120);
      if (Math.random() < 0.4) {
        floatUp(scene, waraji.x + (side === 0 ? -90 : 90), STREET_Y + api.areaY - 60, UI_TEXT.fest.warajiStep, '#e0812a');
      }
      // わらじが かたむきながら すすむ
      scene.tweens.add({ targets: waraji, angle: side === 0 ? -4 : 4, y: STREET_Y - 46, duration: 110, yoyo: true });
      advanceStreet(hill ? 40 : 26);
      burst(scene, waraji.x + (side === 0 ? -110 : 110), STREET_Y + api.areaY + 20, 4, [0xb89b6a, 0xd8c49a]);
    } else {
      // おなじ がわを 2かい: よろけるだけ
      stalledUntil = Date.now() + TRIP_STALL_MS;
      session.resetCombo();
      missShake(scene);
      SFX.bad();
      floatUp(scene, waraji.x, STREET_Y + api.areaY - 140, UI_TEXT.fest.warajiTrip, '#c04545');
      scene.tweens.add({ targets: waraji, angle: { from: -7, to: 7 }, duration: 80, yoyo: true, repeat: 3, onComplete: () => waraji.setAngle(0) });
    }
  };
  scene.input.on('pointerdown', onDown);

  // さかみち(C要素)
  const hillTimer = scene.time.addEvent({
    delay: HILL_EVERY_MS,
    loop: true,
    callback: () => {
      if (session.isEnded() || hill) return;
      hill = true;
      SFX.fanfare();
      floatUp(scene, GAME_W / 2, 200 + api.areaY, UI_TEXT.fest.warajiHill, '#e0812a');
      confetti(scene, 12);
      scene.time.delayedCall(HILL_LEN_MS, () => {
        hill = false;
      });
    },
  });

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    hillTimer.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

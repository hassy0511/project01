/* いねかり(こめ): たんぼの列を横になぞって刈る。
   1列を一筆(指を離さず)で刈りきると「ひとふでがり!」ボーナス。
   刈った列は少しずつ生えてくるので、45秒間 刈りつづける */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, floatUp } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const ROWS = 4;
const STALKS_PER_ROW = 6;
const ROW_Y0 = 180;
const ROW_GAP = 122;
const CUT_RADIUS = 34;
const STALK_PTS = 3;
const ROW_BONUS = 20;
const REGROW_MS = 1600;

interface Stalk {
  obj: Phaser.GameObjects.Text;
  alive: boolean;
  strokeId: number; // どの一筆で刈られたか
}

export function renderReap(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;
  // たんぼ背景: 空+水を張った田(横縞)
  const g = scene.add.graphics();
  g.fillGradientStyle(0xaee3f7, 0xaee3f7, 0xd7efc3, 0xd7efc3, 1);
  g.fillRect(0, 0, GAME_W, 130);
  g.fillGradientStyle(0x9fd0b5, 0x9fd0b5, 0x7fbf9c, 0x7fbf9c, 1);
  g.fillRect(0, 130, GAME_W, AREA_H - 130);
  for (let r = 0; r < ROWS; r++) {
    const y = ROW_Y0 + r * ROW_GAP;
    g.fillStyle(0x6faf8b, 0.8);
    g.fillRoundedRect(16, y + 20, GAME_W - 32, 16, 8);
    g.fillStyle(0xbfe3d1, 0.5);
    g.fillRoundedRect(16, y + 40, GAME_W - 32, 6, 3);
  }
  area.add(g);
  api.sign(prompt);

  const session = new ArcadeSession(api, {
    engine: 'reap',
    onEnd: () => {
      cleanupInput();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  const rows: Stalk[][] = [];
  const stalkX = (c: number): number => 62 + c * ((GAME_W - 124) / (STALKS_PER_ROW - 1));

  const plantRow = (r: number, animate: boolean): void => {
    const y = ROW_Y0 + r * ROW_GAP;
    rows[r] = [];
    for (let c = 0; c < STALKS_PER_ROW; c++) {
      const obj = scene.add.text(stalkX(c), y, '🌾', { fontSize: '36px' }).setOrigin(0.5, 0.8);
      area.add(obj);
      if (animate) {
        obj.setScale(0);
        scene.tweens.add({ targets: obj, scale: 1, ease: 'Back.easeOut', duration: 300, delay: c * 60 });
      }
      scene.tweens.add({
        targets: obj,
        angle: { from: -4, to: 4 },
        duration: 900 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      rows[r].push({ obj, alive: true, strokeId: -1 });
    }
  };
  for (let r = 0; r < ROWS; r++) plantRow(r, false);

  let strokeId = 0;
  let strokeActive = false;

  const cutAt = (px: number, py: number): void => {
    if (session.isEnded()) return;
    const y = py - api.areaY;
    for (let r = 0; r < ROWS; r++) {
      const rowY = ROW_Y0 + r * ROW_GAP;
      if (Math.abs(y - rowY + 12) > 44) continue;
      for (const st of rows[r]) {
        if (!st.alive || Math.abs(px - st.obj.x) > CUT_RADIUS || Math.abs(y - st.obj.y) > 46) continue;
        st.alive = false;
        st.strokeId = strokeId;
        SFX.pop();
        burst(scene, st.obj.x, st.obj.y + api.areaY - 14, 5, [0xffd34d, 0xe8c66a, 0xbfa14a]);
        session.addPoints(STALK_PTS, st.obj.x, st.obj.y + api.areaY - 30);
        scene.tweens.killTweensOf(st.obj);
        // 刈った稲は横に倒れて消える
        scene.tweens.add({
          targets: st.obj,
          angle: 80,
          y: st.obj.y + 14,
          alpha: 0,
          duration: 320,
          onComplete: () => st.obj.destroy(),
        });
        // 列を刈りきった?
        if (rows[r].every((x) => !x.alive)) {
          const oneStroke = rows[r].every((x) => x.strokeId === strokeId);
          if (oneStroke) {
            session.addPoints(ROW_BONUS, GAME_W / 2, rowY + api.areaY - 40, false);
            floatUp(scene, GAME_W / 2, rowY + api.areaY - 66, UI_TEXT.arcade.cleanRow, '#3f7d2c');
            SFX.good();
          }
          scene.time.delayedCall(REGROW_MS, () => {
            if (!session.isEnded()) plantRow(r, true);
          });
        }
      }
    }
  };

  const onDown = (p: Phaser.Input.Pointer): void => {
    strokeId++;
    strokeActive = true;
    cutAt(p.x, p.y);
  };
  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!p.isDown || !strokeActive) return;
    cutAt(p.x, p.y);
    // 鎌の軌跡
    if (Math.random() < 0.5) {
      const dot = scene.add.circle(p.x, p.y - api.areaY, 6, 0xffffff, 0.5);
      area.add(dot);
      scene.tweens.add({ targets: dot, scale: 0.2, alpha: 0, duration: 260, onComplete: () => dot.destroy() });
    }
  };
  const onUp = (): void => {
    strokeActive = false;
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);
  const cleanupInput = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupInput);
}

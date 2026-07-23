/* ゆきはらい(とうほくの雪下野菜): 雪の山を こすって はらうと 作物が でてくる。
   でてきた作物は タップで しゅうかく。ときどき「ふぶき」が きて、
   とりのこした作物に また雪が つもる(へるのは 進みだけ=成功保証)。
   まれに「きんいろ」の山があり、深く はらうと 大得点(C要素)。
   既存動詞との違い = 「こする(みがく)」動作が本体。とうほく=雪ワールドの看板動詞 */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const HIT_RADIUS = 46;
const PTS = 10;
const GOLD_PTS = 40;
/** 雪の層: こすった移動量(px)で1層へる。ふつう2層 / きんいろ3層 */
const SCRUB_PX = 110;
const LAYERS = 2;
const LAYERS_GOLD = 3;
const GOLD_CHANCE = 0.1;
/** 収穫後の生えなおし */
const RESPAWN_MIN_MS = 900;
const RESPAWN_MAX_MS = 2000;
/** ふぶき: 間隔と予告 */
const BLIZZARD_MIN_MS = 10000;
const BLIZZARD_MAX_MS = 14000;
const BLIZZARD_WARN_MS = 1200;

type Stage = 'snow' | 'revealed' | 'empty';

interface Spot {
  x: number;
  y: number;
  stage: Stage;
  gold: boolean;
  depth: number;
  scrubbed: number;
  snowG?: Phaser.GameObjects.Graphics;
  crop?: Phaser.GameObjects.Text;
  ring?: Phaser.GameObjects.Arc;
  timer?: Phaser.Time.TimerEvent;
}

export function renderSweep(api: MinigameApi, target: string, prompt: string): void {
  const { scene, area } = api;

  // 雪ばたけ: くもり空+一面の雪+遠くの山
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xcfd8e6, 0xcfd8e6, 0xe8ecf2, 0xe8ecf2, 1);
  bg.fillRect(0, 0, GAME_W, 150);
  bg.fillStyle(0xb9c6d8, 1);
  bg.fillEllipse(110, 152, 260, 90);
  bg.fillEllipse(370, 156, 300, 110);
  bg.fillStyle(0xf4f7fb, 1);
  bg.fillRect(0, 150, GAME_W, AREA_H - 150);
  bg.fillStyle(0xdde6ef, 0.7);
  for (let i = 0; i < 4; i++) bg.fillRoundedRect(14, 205 + i * 118, GAME_W - 28, 14, 7);
  area.add(bg);
  // ちらつく雪
  for (let i = 0; i < 14; i++) {
    const f = scene.add.circle(Math.random() * GAME_W, Math.random() * AREA_H, 2 + Math.random() * 2, 0xffffff, 0.8);
    area.add(f);
    scene.tweens.add({
      targets: f,
      y: f.y + 80 + Math.random() * 60,
      x: f.x + 24,
      alpha: 0.2,
      duration: 3200 + Math.random() * 2400,
      repeat: -1,
    });
  }

  api.sign(prompt);

  const session = new ArcadeSession(api, {
    engine: 'sweep',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  const spots: Spot[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      spots.push({
        x: 100 + c * 140 + (r % 2) * 24,
        y: 190 + r * 118,
        stage: 'empty',
        gold: false,
        depth: 0,
        scrubbed: 0,
      });
    }
  }

  const drawSnow = (s: Spot): void => {
    if (!s.snowG) return;
    s.snowG.clear();
    const k = s.depth / (s.gold ? LAYERS_GOLD : LAYERS);
    const w = 76 * (0.6 + 0.4 * k);
    const h = 44 * (0.55 + 0.45 * k);
    s.snowG.fillStyle(0xffffff, 1);
    s.snowG.fillEllipse(s.x, s.y, w, h);
    s.snowG.fillStyle(0xe6edf5, 0.8);
    s.snowG.fillEllipse(s.x + w * 0.16, s.y + h * 0.14, w * 0.55, h * 0.4);
    if (s.gold) {
      s.snowG.fillStyle(0xffd34d, 0.55);
      s.snowG.fillEllipse(s.x - w * 0.18, s.y - h * 0.18, w * 0.3, h * 0.24);
    }
  };

  const clearSpot = (s: Spot): void => {
    s.timer?.remove();
    s.snowG?.destroy();
    s.crop?.destroy();
    s.ring?.destroy();
    s.snowG = undefined;
    s.crop = undefined;
    s.ring = undefined;
    s.stage = 'empty';
    s.gold = false;
  };

  const schedule = (s: Spot, delayMs: number, fn: () => void): void => {
    s.timer = scene.time.delayedCall(delayMs, () => {
      if (!session.isEnded()) fn();
    });
  };

  /** 雪の山が つもる(はじめ/生えなおし) */
  const pile = (s: Spot): void => {
    if (session.isEnded()) return;
    s.stage = 'snow';
    s.gold = Math.random() < GOLD_CHANCE;
    s.depth = s.gold ? LAYERS_GOLD : LAYERS;
    s.scrubbed = 0;
    s.snowG = scene.add.graphics();
    area.add(s.snowG);
    drawSnow(s);
    s.snowG.setAlpha(0);
    scene.tweens.add({ targets: s.snowG, alpha: 1, duration: 300 });
  };

  /** 1層はらえた */
  const shave = (s: Spot): void => {
    s.depth--;
    burst(scene, s.x, s.y + api.areaY - 8, 5, [0xffffff, 0xdde6ef]);
    SFX.pop();
    if (s.depth > 0) {
      drawSnow(s);
      return;
    }
    // 作物が でてきた! タップで しゅうかく
    s.stage = 'revealed';
    s.snowG?.destroy();
    s.snowG = undefined;
    s.crop = scene.add.text(s.x, s.y, target, { fontSize: s.gold ? '44px' : '34px' }).setOrigin(0.5).setScale(0);
    if (s.gold) s.crop.setTint(0xffd34d);
    area.add(s.crop);
    scene.tweens.add({ targets: s.crop, scale: 1, ease: 'Back.easeOut', duration: 300 });
    floatUp(scene, s.x, s.y + api.areaY - 34, s.gold ? UI_TEXT.arcade.goldVeg : UI_TEXT.arcade.sweepReveal, s.gold ? '#e0812a' : '#3f7d2c');
    s.ring = scene.add.circle(s.x, s.y, 32).setStrokeStyle(3, s.gold ? 0xffd34d : 0xffffff, 0.9);
    area.add(s.ring);
    scene.tweens.add({ targets: s.ring, scale: 1.25, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
  };

  const collect = (s: Spot): void => {
    const gold = s.gold;
    SFX.pop();
    if (gold) SFX.good();
    impactRing(scene, s.x, s.y + api.areaY, gold ? 0xffd34d : 0xffffff, 12);
    burst(scene, s.x, s.y + api.areaY, gold ? 14 : 7);
    session.addPoints(gold ? GOLD_PTS : PTS, s.x, s.y + api.areaY - 24);
    if (gold) {
      bigImpact(scene, s.x, s.y + api.areaY - 16);
      confetti(scene, 12);
    }
    const obj = s.crop;
    if (obj) {
      s.crop = undefined;
      scene.tweens.add({ targets: obj, y: obj.y - 56, scale: 0.3, alpha: 0, duration: 240, onComplete: () => obj.destroy() });
    }
    clearSpot(s);
    schedule(s, RESPAWN_MIN_MS + Math.random() * (RESPAWN_MAX_MS - RESPAWN_MIN_MS), () => pile(s));
  };

  /* ---------- ふぶき: とりのこした作物に また雪が つもる ---------- */
  let blizzardTimer: Phaser.Time.TimerEvent | undefined;
  const scheduleBlizzard = (): void => {
    blizzardTimer = scene.time.delayedCall(
      BLIZZARD_MIN_MS + Math.random() * (BLIZZARD_MAX_MS - BLIZZARD_MIN_MS),
      () => {
        if (session.isEnded()) return;
        floatUp(scene, GAME_W / 2, 190 + api.areaY, UI_TEXT.arcade.blizzardWarn, '#5a7ba6');
        scene.time.delayedCall(BLIZZARD_WARN_MS, () => {
          if (session.isEnded()) return;
          // 横なぐりの雪が ながれる演出
          for (let i = 0; i < 26; i++) {
            const p = scene.add.circle(-20, 160 + Math.random() * (AREA_H - 200), 3, 0xffffff, 0.9);
            area.add(p);
            scene.tweens.add({
              targets: p,
              x: GAME_W + 30,
              y: p.y + 40,
              duration: 600 + Math.random() * 500,
              delay: Math.random() * 350,
              onComplete: () => p.destroy(),
            });
          }
          SFX.bad();
          for (const s of spots) {
            if (s.stage !== 'revealed') continue;
            s.crop?.destroy();
            s.ring?.destroy();
            s.crop = undefined;
            s.ring = undefined;
            s.stage = 'snow';
            s.depth = 1; // ぜんぶは つもりなおさない(すこし はらえば もどれる)
            s.scrubbed = 0;
            s.snowG = scene.add.graphics();
            area.add(s.snowG);
            drawSnow(s);
          }
          scheduleBlizzard();
        });
      },
    );
  };
  scheduleBlizzard();

  /* ---------- 入力: こする(雪) / タップ(作物) ---------- */
  let last: { x: number; y: number } | null = null;

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    last = { x: p.worldX, y: p.worldY };
    const py = p.worldY - api.areaY;
    for (const s of spots) {
      if (s.stage === 'revealed' && Math.hypot(p.worldX - s.x, py - s.y) < HIT_RADIUS) {
        collect(s);
        return;
      }
    }
  };

  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!p.isDown || !last || session.isEnded()) return;
    const dist = Math.hypot(p.worldX - last.x, p.worldY - last.y);
    last = { x: p.worldX, y: p.worldY };
    if (dist <= 0) return;
    const py = p.worldY - api.areaY;
    for (const s of spots) {
      if (s.stage !== 'snow' || Math.hypot(p.worldX - s.x, py - s.y) > HIT_RADIUS) continue;
      s.scrubbed += dist;
      // こすっている感: 雪けむり
      if (Math.random() < 0.3) burst(scene, p.worldX, p.worldY - 6, 2, [0xffffff]);
      if (s.scrubbed >= SCRUB_PX) {
        s.scrubbed = 0;
        shave(s);
      }
      return;
    }
  };

  const onUp = (): void => {
    last = null;
  };

  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);
  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
    blizzardTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);

  // 開始: 時間差で つもらせる
  spots.forEach((s, i) => schedule(s, i * 200 + Math.random() * 300, () => pile(s)));
}

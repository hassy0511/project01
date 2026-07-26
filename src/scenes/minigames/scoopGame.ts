/* すくいとり(しらす・しろえび・さくらえび): ちゅうぶの海の新動詞。
   むれ(たくさんの ちいさな いきもの)が 潮に のって ながれてくる。
   ざるを 指で うごかして むれの なかを くぐらせると、ざるに たまっていく。
   ざるが いっぱいに なったら 上へ「すくいあげる」= 得点(ためるほど 高得点)。
   すくいあげずに 待ちすぎると、なみで こぼれる(ためた ぶんが へるだけ=成功保証)。
   catch(落ちてくる実を受ける)との違い = 「ためて、いいタイミングで あげる」リスク判断 */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const ZARU_Y = 380;
const ZARU_R = 52;
/** ざるの さいだい容量と 1ぴきの点 */
const CAP = 8;
const PER_ONE = 4;
/** ためた数に応じた ボーナス倍率(まんたんで あげると おいしい) */
const FULL_BONUS = 20;
/** むれの ながれる はやさ(px/s)と 出現間隔(序盤→終盤) */
const FLOW_FROM = 120;
const FLOW_TO = 190;
const SPAWN_FROM_MS = 900;
const SPAWN_TO_MS = 520;
/** なみ: この間隔で こぼれる(ためすぎ防止のリスク) */
const WAVE_EVERY_MS = 7000;
const WAVE_WARN_MS = 1000;
/** きんの むれ(C要素) */
const GOLD_EVERY_MS = 14000;

interface Fry {
  obj: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  gold: boolean;
  caught: boolean;
}

export function renderScoop(api: MinigameApi, target: string, prompt: string): void {
  const { scene, area } = api;

  // 海: 上が空、下は海中(すこし暗い青)
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xaee3f7, 0xaee3f7, 0x7fc8e8, 0x7fc8e8, 1);
  bg.fillRect(0, 0, GAME_W, 190);
  bg.fillGradientStyle(0x2f7fa8, 0x2f7fa8, 0x1d5b80, 0x1d5b80, 1);
  bg.fillRect(0, 190, GAME_W, AREA_H - 190);
  area.add(bg);
  // 光のすじ
  for (let i = 0; i < 5; i++) {
    const ray = scene.add.graphics();
    ray.fillStyle(0xffffff, 0.06);
    ray.fillTriangle(60 + i * 90, 190, 20 + i * 90, AREA_H, 110 + i * 90, AREA_H);
    area.add(ray);
  }
  // とおくの ふねと ふじさん風の やま
  bg.fillStyle(0x8fb0c9, 0.9);
  bg.fillTriangle(300, 190, 380, 96, 460, 190);
  bg.fillStyle(0xffffff, 0.9);
  bg.fillTriangle(352, 130, 380, 96, 408, 130);
  area.add(addIcon(scene, 90, 168, 'boat:navy', 28));

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'scoop',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- ざる ---------- */
  const zaru = scene.add.container(GAME_W / 2, ZARU_Y);
  const zg = scene.add.graphics();
  const drawZaru = (held: number): void => {
    zg.clear();
    // あみ(半円)
    zg.lineStyle(5, 0xd8b878, 1);
    zg.beginPath();
    zg.arc(0, 0, ZARU_R, 0, Math.PI, false);
    zg.strokePath();
    zg.lineBetween(-ZARU_R, 0, ZARU_R, 0);
    // たまった ぶん(下から もりあがる)
    if (held > 0) {
      const k = Math.min(1, held / CAP);
      zg.fillStyle(held >= CAP ? 0xffd34d : 0xf5e6c8, 0.9);
      zg.fillEllipse(0, ZARU_R * 0.45, ZARU_R * 1.5 * k, ZARU_R * 0.8 * k);
    }
    // え(柄)
    zg.lineStyle(6, 0xa9713a, 1);
    zg.lineBetween(0, 0, 0, -46);
  };
  zaru.add(zg);
  const countText = scene.add.text(0, -66, '', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
  zaru.add(countText);
  area.add(zaru);

  let held = 0;
  let goldHeld = 0;
  const refresh = (): void => {
    drawZaru(held);
    countText.setText(held > 0 ? `${held}${held >= CAP ? ' まんたん!' : ''}` : '');
  };
  refresh();

  /* ---------- むれ ---------- */
  const fries: Fry[] = [];
  const spawnBurst = (gold: boolean): void => {
    if (session.isEnded()) return;
    const fromLeft = Math.random() < 0.5;
    const speed = Phaser.Math.Linear(FLOW_FROM, FLOW_TO, session.progress());
    const n = gold ? 6 : 3 + Math.floor(Math.random() * 3);
    const baseY = 300 + Math.random() * 170;
    for (let i = 0; i < n; i++) {
      const obj = addIcon(
        scene,
        fromLeft ? -30 - i * 26 : GAME_W + 30 + i * 26,
        baseY + (Math.random() * 46 - 23),
        target,
        gold ? 28 : 22,
      ).setName('mg-target');
      if (gold) obj.setTint(0xffd34d);
      obj.setFlipX(!fromLeft);
      area.add(obj);
      fries.push({ obj, vx: (fromLeft ? 1 : -1) * speed, vy: Math.random() * 24 - 12, gold, caught: false });
    }
    if (gold) {
      SFX.fanfare();
      floatUp(scene, GAME_W / 2, 220 + api.areaY, UI_TEXT.arcade.goldSwarm, '#e0812a');
    }
  };
  spawnBurst(false);

  let spawnTimer: Phaser.Time.TimerEvent | undefined;
  const scheduleSpawn = (): void => {
    const iv = Phaser.Math.Linear(SPAWN_FROM_MS, SPAWN_TO_MS, session.progress());
    spawnTimer = scene.time.delayedCall(iv, () => {
      spawnBurst(false);
      scheduleSpawn();
    });
  };
  scheduleSpawn();
  const goldTimer = scene.time.addEvent({ delay: GOLD_EVERY_MS, loop: true, callback: () => spawnBurst(true) });

  /* ---------- なみ(ためすぎると こぼれる) ---------- */
  let waveTimer: Phaser.Time.TimerEvent | undefined;
  const scheduleWave = (): void => {
    waveTimer = scene.time.delayedCall(WAVE_EVERY_MS, () => {
      if (session.isEnded()) return;
      if (held > 0) floatUp(scene, zaru.x, ZARU_Y + api.areaY - 90, UI_TEXT.arcade.waveWarn, '#9ad0f5');
      scene.time.delayedCall(WAVE_WARN_MS, () => {
        if (session.isEnded()) return;
        // よこなみ: 画面が ゆれて、ためた ぶんが へる
        scene.tweens.add({ targets: zaru, angle: { from: -12, to: 12 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => zaru.setAngle(0) });
        if (held > 0) {
          const lost = Math.max(1, Math.ceil(held / 2));
          held -= lost;
          goldHeld = Math.min(goldHeld, held);
          SFX.bad();
          missShake(scene);
          floatUp(scene, zaru.x, ZARU_Y + api.areaY - 60, UI_TEXT.arcade.spilled(lost), '#c04545');
          burst(scene, zaru.x, ZARU_Y + api.areaY, 5, [0xffffff, 0x9ad0f5]);
          refresh();
        }
        scheduleWave();
      });
    });
  };
  scheduleWave();

  /* ---------- 入力: 横ドラッグ=ざる移動 / 上へフリック=すくいあげる ---------- */
  let dragFrom: { x: number; y: number; t: number } | null = null;

  const lift = (): void => {
    if (held <= 0) return;
    const full = held >= CAP;
    const pts = held * PER_ONE + goldHeld * PER_ONE * 2 + (full ? FULL_BONUS : 0);
    SFX.pop();
    if (full) SFX.good();
    impactRing(scene, zaru.x, ZARU_Y + api.areaY, full ? 0xffd34d : 0xffffff, 14);
    burst(scene, zaru.x, ZARU_Y + api.areaY, full ? 14 : 7);
    session.addPoints(pts, zaru.x, ZARU_Y + api.areaY - 70);
    floatUp(scene, zaru.x + 80, ZARU_Y + api.areaY - 90, full ? UI_TEXT.arcade.scoopFull : UI_TEXT.arcade.scoopUp, full ? '#3f7d2c' : '#e0812a');
    if (full) {
      bigImpact(scene, zaru.x, ZARU_Y + api.areaY - 40);
      confetti(scene, 12);
    }
    // すくいあげる うごき
    scene.tweens.add({ targets: zaru, y: ZARU_Y - 70, duration: 180, yoyo: true, ease: 'Quad.easeOut' });
    held = 0;
    goldHeld = 0;
    refresh();
  };

  const onDown = (p: Phaser.Input.Pointer): void => {
    dragFrom = { x: p.worldX, y: p.worldY, t: Date.now() };
  };
  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!p.isDown || session.isEnded()) return;
    zaru.x = Phaser.Math.Clamp(p.worldX, ZARU_R, GAME_W - ZARU_R);
    zaru.y = Phaser.Math.Clamp(p.worldY - api.areaY, 240, AREA_H - 90);
  };
  const onUp = (p: Phaser.Input.Pointer): void => {
    if (!dragFrom) return;
    const dy = p.worldY - dragFrom.y;
    const dt = Date.now() - dragFrom.t;
    dragFrom = null;
    // 上へ すばやく はらう or タップ = すくいあげる
    if (dy < -40 || dt < 220) lift();
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    for (const f of [...fries]) {
      if (f.caught) continue;
      f.obj.x += f.vx * dt;
      f.obj.y += f.vy * dt;
      // ざるの なかに 入った?
      if (held < CAP && Math.hypot(f.obj.x - zaru.x, f.obj.y - (zaru.y + ZARU_R * 0.4)) < ZARU_R * 1.15) {
        f.caught = true;
        held++;
        if (f.gold) goldHeld++;
        refresh();
        SFX.pop();
        const obj = f.obj;
        scene.tweens.add({
          targets: obj,
          x: zaru.x,
          y: zaru.y + ZARU_R * 0.4,
          scale: 0.4,
          alpha: 0,
          duration: 160,
          onComplete: () => obj.destroy(),
        });
        fries.splice(fries.indexOf(f), 1);
        continue;
      }
      if (f.obj.x < -60 || f.obj.x > GAME_W + 60 || f.obj.y > AREA_H + 40) {
        f.obj.destroy();
        fries.splice(fries.indexOf(f), 1);
      }
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    spawnTimer?.remove();
    waveTimer?.remove();
    goldTimer.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

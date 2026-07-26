/* えちぜん がにまつり(ふくい): かにを ほぐして もりつけるゲーム。
   かにの あしの「ひかった かんせつ」を タップで わり、つづけて 中の みを タップで とる。
   2タップの「わる → とる」が 1セット。わる前に みを タップしても なにも起きないだけ。
   おさら1まい ぶん(6つ)たまると「もりつけ かんせい」で ボーナス。
   ときどき「おおざら」= 目標が 8つで 2倍(C要素)。
   実在の かにまつりの「その場で かにを さばいて 食べる」をそのまま動詞化 */
import Phaser from 'phaser';
import { addIcon, iconScale } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = GAME_AREA_H;
const CRACK_PTS = 5;
const MI_PTS = 10;
const PLATE_BONUS = 24;
const PLATE_NORMAL = 6;
const PLATE_BIG = 8;
/** ひかる かんせつが 出る間隔(序盤→終盤) */
const SPOT_FROM_MS = 1100;
const SPOT_TO_MS = 650;
/** ほうっておくと きえる */
const SPOT_LIFE_MS = 2600;

interface Spot {
  x: number;
  y: number;
  ring: Phaser.GameObjects.Arc;
  cracked: boolean;
  mi?: Phaser.GameObjects.Image;
  timer: Phaser.Time.TimerEvent;
}

export function renderKani(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // 冬の 港の テント(ゆげ)
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xcfd8e6, 0xcfd8e6, 0xeef2f7, 0xeef2f7, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0xd94f4f, 1);
  bg.fillTriangle(-10, 120, GAME_W / 2, 40, GAME_W + 10, 120); // テント
  bg.fillStyle(0xf5f7fa, 1);
  bg.fillRoundedRect(20, 150, GAME_W - 40, 330, 20); // まないた
  bg.fillStyle(0xdfe6ee, 1);
  bg.fillRoundedRect(70, 500, GAME_W - 140, 110, 55); // おおざら
  area.add(bg);
  area.add(addIcon(scene, GAME_W / 2 - 52, 556, 'plate:cream', 26));
  const plateLabel = scene.add.text(GAME_W / 2 + 8, 556, '', { fontSize: '20px', color: '#3d3129', fontStyle: 'bold' }).setOrigin(0.5);
  area.add(plateLabel);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'kani',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- かに(まないたの うえ) ---------- */
  const kani = scene.add.container(GAME_W / 2, 300);
  const kg = scene.add.graphics();
  kg.fillStyle(0xe0503a, 1);
  kg.fillEllipse(0, 0, 150, 110); // こうら
  kg.fillStyle(0xc93f2c, 1);
  for (let i = 0; i < 4; i++) {
    const y = -34 + i * 24;
    kg.fillRoundedRect(-190, y - 6, 120, 13, 6); // ひだりの あし
    kg.fillRoundedRect(70, y - 6, 120, 13, 6); // みぎの あし
  }
  kg.fillStyle(0xe0503a, 1);
  kg.fillEllipse(-176, -46, 40, 26); // はさみ
  kg.fillEllipse(176, -46, 40, 26);
  kani.add(kg);
  kani.add(addIcon(scene, 0, 6, 'crab:red', 54));
  area.add(kani);
  scene.tweens.add({ targets: kani, y: 296, duration: 1200, yoyo: true, repeat: -1 });

  /* ---------- 状態 ---------- */
  const spots: Spot[] = [];
  let plate = 0;
  let target = PLATE_NORMAL;
  let big = false;
  const refreshPlate = (): void => {
    plateLabel.setText(`${plate}/${target}${big ? ' おおざら!' : ''}`);
  };
  refreshPlate();

  const removeSpot = (s: Spot): void => {
    s.timer.remove();
    s.ring.destroy();
    s.mi?.destroy();
    const i = spots.indexOf(s);
    if (i >= 0) spots.splice(i, 1);
  };

  const spawnSpot = (): void => {
    if (session.isEnded()) return;
    // あしの かんせつの どこか
    const side = Math.random() < 0.5 ? -1 : 1;
    const row = Math.floor(Math.random() * 4);
    const x = kani.x + side * (110 + Math.random() * 70);
    const y = 300 - 34 + row * 24;
    const ring = scene.add.circle(x, y, 22).setStrokeStyle(4, 0xffd34d, 0.95);
    area.add(ring);
    scene.tweens.add({ targets: ring, scale: { from: 1, to: 1.2 }, alpha: { from: 1, to: 0.6 }, duration: 500, yoyo: true, repeat: -1 });
    const s: Spot = {
      x,
      y,
      ring,
      cracked: false,
      timer: scene.time.delayedCall(SPOT_LIFE_MS, () => removeSpot(s)),
    };
    spots.push(s);
  };
  spawnSpot();

  let spawnTimer: Phaser.Time.TimerEvent | undefined;
  const scheduleSpawn = (): void => {
    const iv = Phaser.Math.Linear(SPOT_FROM_MS, SPOT_TO_MS, session.progress());
    spawnTimer = scene.time.delayedCall(iv, () => {
      if (spots.length < 3) spawnSpot();
      scheduleSpawn();
    });
  };
  scheduleSpawn();

  const finishPlate = (): void => {
    SFX.fanfare();
    session.addPoints(PLATE_BONUS * (big ? 2 : 1), GAME_W / 2, 520 + api.areaY, false);
    floatUp(scene, GAME_W / 2, 500 + api.areaY, big ? UI_TEXT.fest.kaniOozara : UI_TEXT.fest.kaniPlate, '#3f7d2c');
    bigImpact(scene, GAME_W / 2, 540 + api.areaY);
    confetti(scene, big ? 18 : 12);
    plate = 0;
    big = Math.random() < 0.34;
    target = big ? PLATE_BIG : PLATE_NORMAL;
    refreshPlate();
  };

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    const py = p.worldY - api.areaY;
    for (const s of [...spots]) {
      if (Math.hypot(p.worldX - s.x, py - s.y) > 34) continue;
      if (!s.cracked) {
        // 1タップめ: からを わる
        s.cracked = true;
        s.timer.remove();
        s.timer = scene.time.delayedCall(SPOT_LIFE_MS, () => removeSpot(s));
        SFX.pop();
        impactRing(scene, s.x, s.y + api.areaY, 0xffffff, 8);
        burst(scene, s.x, s.y + api.areaY, 4, [0xe0503a, 0xffffff]);
        session.addPoints(CRACK_PTS, s.x, s.y + api.areaY - 20);
        floatUp(scene, s.x, s.y + api.areaY - 34, UI_TEXT.fest.kaniCrack, '#e0812a');
        s.ring.setStrokeStyle(4, 0xffffff, 0.9);
        s.mi = addIcon(scene, s.x, s.y, 'heart:white', 20);
        area.add(s.mi);
        scene.tweens.add({ targets: s.mi, scale: { from: iconScale(s.mi, 0.6), to: iconScale(s.mi, 1.1) }, duration: 400, yoyo: true, repeat: -1 });
      } else {
        // 2タップめ: みを とって おさらへ
        SFX.good();
        session.addPoints(MI_PTS, s.x, s.y + api.areaY - 20);
        floatUp(scene, s.x, s.y + api.areaY - 40, UI_TEXT.fest.kaniMi, '#3f7d2c');
        const mi = s.mi;
        if (mi) {
          s.mi = undefined;
          scene.tweens.add({
            targets: mi,
            x: GAME_W / 2,
            y: 548,
            scale: 0.6,
            duration: 280,
            ease: 'Quad.easeIn',
            onComplete: () => mi.destroy(),
          });
        }
        removeSpot(s);
        plate++;
        refreshPlate();
        if (plate >= target) finishPlate();
      }
      return;
    }
  };
  scene.input.on('pointerdown', onDown);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    spawnTimer?.remove();
    for (const s of [...spots]) s.timer.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

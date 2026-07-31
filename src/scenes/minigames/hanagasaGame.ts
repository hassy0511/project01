/* はながさまつり(やまがた): 笠(かさ)まわしゲーム。
   やじるしの むきに 指を くるくる まわすと、はなの笠が まわって 得点。
   ときどき「ぎゃくまわし!」で むきが かわる(まちがった むきは すすまないだけ=成功保証)。
   「はなふぶきタイム」= 得点2倍 が C 要素。
   実在の花笠まつりの「笠を まわして おどる」をそのまま動詞化。動作=円ジェスチャー */
import Phaser from 'phaser';
import { addIcon, iconScale, setIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { burst, confetti, floatUp, impactRing } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import { offPointerRelease, onPointerRelease } from './input';
import type { MinigameApi } from './types';
import { SCENERY_NAME } from '../../ui/scenery';

const AREA_H = GAME_AREA_H;
const CX = GAME_W / 2;
const CY = 340;
const SPIN_PTS = 12;
/** 1回転=2π。むきが かわる間隔 */
const REVERSE_MIN_MS = 7000;
const REVERSE_MAX_MS = 11000;
/** はなふぶきタイム */
const FUBUKI_EVERY_MS = 15000;
const FUBUKI_LEN_MS = 5000;

export function renderHanagasa(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // まつりの よる: ちょうちんと おどりて
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x4a3566, 0x4a3566, 0x7a4a6b, 0x7a4a6b, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  for (let i = 0; i < 6; i++) {
    bg.fillStyle(0xe05b5b, 1);
    bg.fillEllipse(i * 85 + 40, 70, 16, 22);
    bg.fillStyle(0xffd34d, 0.6);
    bg.fillEllipse(i * 85 + 40, 70, 9, 13);
  }
  area.add(bg.setName(SCENERY_NAME)); // 手描きの 背景が 来たら かくれる
  const dancers: Phaser.GameObjects.Image[] = [];
  for (const [dx, e] of [[-170, 'person-kimono:crimson'], [-85, 'person:teal'], [85, 'person:navy'], [170, 'person-kimono:violet']] as const) {
    const d = addIcon(scene, CX + dx, 580, e, 32);
    area.add(d);
    dancers.push(d);
  }

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'hanagasa',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- はなの笠(円ジェスチャーで まわる) ---------- */
  const kasa = scene.add.container(CX, CY);
  const kg = scene.add.graphics();
  kg.fillStyle(0xc9a86a, 1);
  kg.fillCircle(0, 0, 96);
  kg.fillStyle(0xb8935a, 1);
  kg.fillCircle(0, 0, 70);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    kg.fillStyle(0xd94f4f, 1);
    kg.fillCircle(Math.cos(a) * 52, Math.sin(a) * 52, 13);
    kg.fillStyle(0xf06292, 1);
    kg.fillCircle(Math.cos(a) * 52, Math.sin(a) * 52, 7);
  }
  kasa.add(kg);
  kasa.add(addIcon(scene, 0, 0, 'sakura:pink', 40));
  area.add(kasa);

  // むきの やじるし
  const arrow = addIcon(scene, CX, CY - 140, 'spin-right:gold', 46);
  area.add(arrow);
  scene.tweens.add({ targets: arrow, scale: { from: iconScale(arrow), to: iconScale(arrow, 1.2) }, duration: 500, yoyo: true, repeat: -1 });

  /* ---------- 状態 ---------- */
  let dir = 1; // 1=とけいまわり
  let acc = 0; // ただしい むきの 累積角(rad)
  let lastAngle: number | null = null;
  let fubuki = false;

  const petals = (): void => {
    for (let i = 0; i < 6; i++) {
      const p = addIcon(scene, CX + (Math.random() * 160 - 80), CY + api.areaY - 40, 'sakura:pink', 16);
      scene.tweens.add({
        targets: p,
        y: p.y + 140 + Math.random() * 80,
        x: p.x + (Math.random() * 80 - 40),
        angle: 180,
        alpha: 0,
        duration: 900 + Math.random() * 500,
        onComplete: () => p.destroy(),
      });
    }
  };

  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!p.isDown || session.isEnded()) return;
    const a = Math.atan2(p.worldY - api.areaY - CY, p.worldX - CX);
    if (lastAngle !== null) {
      let d = a - lastAngle;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      if (d * dir > 0) {
        acc += Math.abs(d);
        kasa.rotation += d;
        if (acc >= Math.PI * 2) {
          acc -= Math.PI * 2;
          const pts = SPIN_PTS * (fubuki ? 2 : 1);
          SFX.pop();
          impactRing(scene, CX, CY + api.areaY, 0xf06292, 14);
          session.addPoints(pts, CX, CY + api.areaY - 110);
          floatUp(scene, CX + 100, CY + api.areaY - 130, UI_TEXT.fest.hanagasaSpin, '#e0812a');
          petals();
          for (const [i, dn] of dancers.entries()) {
            scene.tweens.add({ targets: dn, y: 580 - 24, duration: 150, yoyo: true, delay: i * 40 });
          }
        }
      }
      // まちがった むきは すすまない(ペナルティなし)
    }
    lastAngle = a;
  };
  const onUp = (): void => {
    lastAngle = null;
  };
  scene.input.on('pointermove', onMove);
  onPointerRelease(scene, onUp);

  // むきの きりかえ
  let reverseTimer: Phaser.Time.TimerEvent | undefined;
  const scheduleReverse = (): void => {
    reverseTimer = scene.time.delayedCall(REVERSE_MIN_MS + Math.random() * (REVERSE_MAX_MS - REVERSE_MIN_MS), () => {
      if (session.isEnded()) return;
      dir *= -1;
      acc = 0;
      SFX.good();
      setIcon(arrow, dir === 1 ? 'spin-right:gold' : 'spin-left:gold');
      floatUp(scene, CX, CY + api.areaY - 160, UI_TEXT.fest.hanagasaReverse, '#9ad0f5');
      burst(scene, CX, CY + api.areaY - 140, 6, [0x9ad0f5, 0xffffff]);
      scheduleReverse();
    });
  };
  scheduleReverse();

  // はなふぶきタイム(C要素)
  const fubukiTimer = scene.time.addEvent({
    delay: FUBUKI_EVERY_MS,
    loop: true,
    callback: () => {
      if (session.isEnded() || fubuki) return;
      fubuki = true;
      SFX.fanfare();
      floatUp(scene, CX, 160 + api.areaY, UI_TEXT.fest.hanagasaTime, '#e0812a');
      confetti(scene, 18);
      scene.time.delayedCall(FUBUKI_LEN_MS, () => {
        fubuki = false;
      });
    },
  });

  const cleanup = (): void => {
    scene.input.off('pointermove', onMove);
    offPointerRelease(scene, onUp);
    reverseTimer?.remove();
    fubukiTimer.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

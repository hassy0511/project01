/* おのみち べっちゃーまつり(ひろしま): おにが「ささら」や「しゅくぼう」で こどもを つくと
   1ねん びょうきを しないと いわれる まつり。
   プレイヤーは おに(ベタ)を うごかして、にげまわる こどもを つかまえる(タップ)。
   こどもは ちかづくと はやく にげるので、さきを よんで タップする。
   ぜんぶ つかまえると「ごりやく ぜんぶ!」で 大ボーナス → つぎの くみが でてくる。
   じかんが たつと こどもは はやくなる。動作=うごく まもの おいかけタップ */
import Phaser from 'phaser';
import { addIcon, setIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = GAME_AREA_H;
const FIELD_TOP = 180;
const FIELD_BOTTOM = 620;
const KIDS = 5;
const KID_PTS = 13;
const ALL_BONUS = 45;
/** こどもの はやさ(px/s) */
const SPD_START = 105;
const SPD_END = 190;
/** おにが ちかいと にげる はんい */
const FLEE_R = 150;

interface Kid {
  obj: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  caught: boolean;
}

export function renderBetcha(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // おのみちの みなとまち
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xbfe4f5, 0xbfe4f5, 0xe9e0c8, 0xe9e0c8, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0x9ec9d8, 1);
  bg.fillRect(0, 120, GAME_W, 56); // うみ
  bg.fillStyle(0xd8c8a8, 1);
  bg.fillRect(0, FIELD_TOP, GAME_W, FIELD_BOTTOM - FIELD_TOP + 40); // みちすじ
  for (let i = 0; i < 6; i++) {
    bg.fillStyle(0x8a6a4a, 1);
    bg.fillRect(i * 82 + 6, FIELD_TOP - 46, 66, 46); // まちや
    bg.fillStyle(0xc0392b, 1);
    bg.fillRect(i * 82 + 6, FIELD_TOP - 52, 66, 8);
  }
  area.add(bg);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'betcha',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- おに(プレイヤーの タップに ついていく) ---------- */
  const oni = addIcon(scene, GAME_W / 2, FIELD_BOTTOM, 'oni:crimson', 46);
  area.add(oni);
  const sasara = addIcon(scene, GAME_W / 2 + 28, FIELD_BOTTOM - 20, 'bamboo:lime', 22);
  area.add(sasara);

  /* ---------- こども ---------- */
  const kids: Kid[] = [];
  let rounds = 0;
  const spawnKids = (): void => {
    for (const k of kids) k.obj.destroy();
    kids.length = 0;
    for (let i = 0; i < KIDS; i++) {
      const x = 50 + Math.random() * (GAME_W - 100);
      const y = FIELD_TOP + 30 + Math.random() * (FIELD_BOTTOM - FIELD_TOP - 60);
      const a = Math.random() * Math.PI * 2;
      const obj = addIcon(scene, x, y, 'person-child:amber', 32).setName('mg-kid');
      area.add(obj);
      kids.push({ obj, x, y, vx: Math.cos(a), vy: Math.sin(a), caught: false });
    }
  };
  spawnKids();

  const speed = (): number => SPD_START + (SPD_END - SPD_START) * session.progress();

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    const px = p.worldX;
    const py = p.worldY - api.areaY;
    // おにが そこへ とぶ
    scene.tweens.add({ targets: [oni], x: px, y: Phaser.Math.Clamp(py, FIELD_TOP, FIELD_BOTTOM), duration: 140 });
    scene.tweens.add({
      targets: [sasara],
      x: px + 28,
      y: Phaser.Math.Clamp(py, FIELD_TOP, FIELD_BOTTOM) - 20,
      angle: { from: -40, to: 0 },
      duration: 140,
    });
    // つかまえる
    for (const k of kids) {
      if (k.caught) continue;
      if (Math.hypot(k.x - px, k.y - py) < 42) {
        k.caught = true;
        SFX.good();
        impactRing(scene, k.x, k.y + api.areaY, 0xffd34d, 12);
        burst(scene, k.x, k.y + api.areaY, 8, [0xffd34d, 0xffffff]);
        session.addPoints(KID_PTS, k.x, k.y + api.areaY - 40);
        floatUp(scene, k.x, k.y + api.areaY - 70, UI_TEXT.fest.betchaTouch, '#e0812a');
        setIcon(k.obj, 'face-smile:cream');
        scene.tweens.add({ targets: k.obj, y: k.y - 30, alpha: 0, duration: 600, onComplete: () => k.obj.destroy() });
        if (kids.every((x) => x.caught)) {
          rounds++;
          SFX.fanfare();
          bigImpact(scene, GAME_W / 2, 320 + api.areaY);
          confetti(scene, 18);
          session.addPoints(ALL_BONUS, GAME_W / 2, 300 + api.areaY, false);
          floatUp(scene, GAME_W / 2, 260 + api.areaY, UI_TEXT.fest.betchaAll(rounds), '#e0812a');
          scene.time.delayedCall(800, () => {
            if (!session.isEnded()) spawnKids();
          });
        }
        return;
      }
    }
    // からぶり: へらない(コンボは つづく)
    SFX.pop();
  };
  scene.input.on('pointerdown', onDown);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    const sp = speed();
    for (const k of kids) {
      if (k.caught) continue;
      // おにが ちかいと はんたいに にげる
      const dx = k.x - oni.x;
      const dy = k.y - oni.y;
      const dist = Math.hypot(dx, dy);
      if (dist < FLEE_R && dist > 1) {
        k.vx = k.vx * 0.7 + (dx / dist) * 1.3;
        k.vy = k.vy * 0.7 + (dy / dist) * 1.3;
      }
      const n = Math.hypot(k.vx, k.vy) || 1;
      k.vx /= n;
      k.vy /= n;
      k.x += k.vx * sp * dt * (dist < FLEE_R ? 1.5 : 1);
      k.y += k.vy * sp * dt * (dist < FLEE_R ? 1.5 : 1);
      // かべで はねかえる
      if (k.x < 30) {
        k.x = 30;
        k.vx = Math.abs(k.vx);
      }
      if (k.x > GAME_W - 30) {
        k.x = GAME_W - 30;
        k.vx = -Math.abs(k.vx);
      }
      if (k.y < FIELD_TOP + 10) {
        k.y = FIELD_TOP + 10;
        k.vy = Math.abs(k.vy);
      }
      if (k.y > FIELD_BOTTOM) {
        k.y = FIELD_BOTTOM;
        k.vy = -Math.abs(k.vy);
      }
      k.obj.setPosition(k.x, k.y + Math.sin(Date.now() / 120 + k.x) * 3);
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

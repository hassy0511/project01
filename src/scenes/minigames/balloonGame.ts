/* さが インターナショナル バルーンフェスタ: あさの しずかな そらに 100きいじょうの ききゅうが あがる。
   ききゅうは まえに すすむ ハンドルが ない ― 「たかさ」を かえて、そこに ふいている かぜに のる。
   これは じっさいの きょうぎ(ちじょうの もくひょうに どれだけ ちかづけるか)を そのまま あそびに した。
     ・バーナーを ながおしすると じょうしょう / はなすと ゆっくり こうか
     ・そらは 3つの かぜの そう: うえは → / まんなかは ほぼ とまる / したは ←
     ・もくひょうの ✕ の うえに きたら「マーカーを おとす」ボタンで とうか
   ちかいほど 高とくてん。おちても こわれない(またすぐ つぎの もくひょう) */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = GAME_AREA_H;
const GROUND_Y = 560;
/** かぜの そう(y の しきい) */
const HI_Y = 220;
const MID_Y = 380;
/** かぜの はやさ(px/s) */
const WIND_HI = 90;
const WIND_LOW = -80;
const WIND_MID = 6;
/** じょうしょう・こうか(px/s) */
const UP_SPEED = 130;
const DOWN_SPEED = 70;
const NEAR_PTS = 60;
const OK_PTS = 22;
/** はずれ。0 に しないのは 「なにも もらえない」を つくらない ため。
    ただし 「まとを 見ずに おとすだけ」が 得に ならない 高さに とどめる */
const FAR_PTS = 2;
/** ★マーカーは 有限。もっていない ときは おとせない。
    こうしないと 「まとを 見ずに おとすボタンを れんだ」が いちばん 高い とくてんに なり、
    バーナーで 高さを かえる = この ゲームの 芯 を やる 意味が なくなる */
const MARKER_MAX = 5;
/** 1こ もどるまで(60秒で 5 + 約18 = 23かい おとせる) */
const MARKER_REFILL_MS = 3200;

export function renderBalloon(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x9fd8f5, 0x9fd8f5, 0xffe6c0, 0xffe6c0, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  // かぜの そうの めやす
  bg.fillStyle(0xffffff, 0.14);
  bg.fillRect(0, 0, GAME_W, HI_Y);
  bg.fillRect(0, MID_Y, GAME_W, GROUND_Y - MID_Y);
  bg.fillStyle(0x8fbf6a, 1);
  bg.fillRect(0, GROUND_Y, GAME_W, AREA_H - GROUND_Y); // ちくごがわの かわらの りくちきち
  area.add(bg);
  for (const [y, t] of [
    [HI_Y / 2, UI_TEXT.fest.balloonWindHi],
    [(HI_Y + MID_Y) / 2, UI_TEXT.fest.balloonWindMid],
    [(MID_Y + GROUND_Y) / 2, UI_TEXT.fest.balloonWindLow],
  ] as const) {
    area.add(
      scene.add
        .text(GAME_W - 12, y, t, { fontFamily: FONT, fontSize: '13px', color: '#3f5a6b' })
        .setOrigin(1, 0.5)
        .setAlpha(0.9),
    );
  }
  // ほかの ききゅう(はいけい)
  for (const [x, y] of [[60, 120], [400, 180], [330, 90]] as const) {
    area.add(addIcon(scene, x, y, 'balloon:red', 22).setAlpha(0.5));
  }

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'balloon',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- ききゅう ---------- */
  const balloon = scene.add.container(70, 300);
  balloon.add(addIcon(scene, 0, 0, 'balloon:red', 54).setName('mg-balloon'));
  const flame = addIcon(scene, 0, 26, 'fire:orange', 18).setVisible(false);
  balloon.add(flame);
  area.add(balloon);

  /* ---------- もくひょう ---------- */
  let targetX = 300;
  const target = addIcon(scene, targetX, GROUND_Y + 20, 'target:red', 32).setName('mg-goal');
  area.add(target);
  const ring = scene.add.graphics();
  area.add(ring);
  const drawTarget = (): void => {
    ring.clear();
    ring.lineStyle(3, 0xe05b5b, 0.8);
    ring.strokeCircle(targetX, GROUND_Y + 20, 44);
    ring.lineStyle(2, 0xffffff, 0.6);
    ring.strokeCircle(targetX, GROUND_Y + 20, 78);
  };
  drawTarget();
  const newTarget = (): void => {
    targetX = 60 + Math.random() * (GAME_W - 120);
    target.setX(targetX);
    drawTarget();
  };

  /* ---------- ボタン ---------- */
  let burning = false;
  const makeBtn = (x: number, label: string, color: string): Phaser.GameObjects.Container => {
    const c = scene.add.container(x, 620);
    const g = scene.add.graphics();
    g.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
    g.fillRoundedRect(-84, -26, 168, 52, 14);
    c.add(g);
    c.add(
      scene.add.text(0, 0, label, { fontFamily: FONT, fontSize: '17px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5),
    );
    c.setSize(180, 64);
    c.setInteractive({ useHandCursor: true });
    area.add(c);
    return c;
  };
  const burnBtn = makeBtn(115, UI_TEXT.fest.balloonBurn, '#e0812a');
  const dropBtn = makeBtn(GAME_W - 115, UI_TEXT.fest.balloonDrop, '#3f7d2c');
  burnBtn.on('pointerdown', () => {
    burning = true;
    flame.setVisible(true);
    SFX.pop();
  });
  burnBtn.on('pointerup', () => {
    burning = false;
    flame.setVisible(false);
  });
  burnBtn.on('pointerout', () => {
    burning = false;
    flame.setVisible(false);
  });

  let drops = 0;
  let markers = MARKER_MAX;
  let dropping = false;

  /* のこりの マーカーを 絵で 見せる(字が 読めない 子むけ。
     かずの 文字だけだと 「あと 何回 おとせるか」が わからない) */
  const stockIcons: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < MARKER_MAX; i++) {
    const ic = addIcon(scene, GAME_W - 190 + i * 26, 588, 'target:teal', 20);
    area.add(ic);
    stockIcons.push(ic);
  }
  const drawStock = (): void => {
    stockIcons.forEach((ic, i) => ic.setAlpha(i < markers ? 1 : 0.22));
    // もっていない ときは ボタンも うすくして 「いま おせない」を 見せる
    dropBtn.setAlpha(markers > 0 ? 1 : 0.4);
  };
  drawStock();

  // すこし ずつ もどる。おとしっぱなしに できず、待つ あいだに 高さを あわせる ことに なる
  const refill = scene.time.addEvent({
    delay: MARKER_REFILL_MS,
    loop: true,
    callback: () => {
      if (session.isEnded() || markers >= MARKER_MAX) return;
      markers++;
      drawStock();
      const ic = stockIcons[markers - 1];
      scene.tweens.add({ targets: ic, scale: { from: ic.scale * 1.3, to: ic.scale }, duration: 220 });
    },
  });

  dropBtn.on('pointerdown', () => {
    if (session.isEnded() || dropping || markers <= 0) return;
    markers--;
    dropping = true;
    drawStock();
    const dx = Math.abs(balloon.x - targetX);
    const marker = addIcon(scene, balloon.x, balloon.y + 30, 'target:teal', 22);
    area.add(marker);
    scene.tweens.add({
      targets: marker,
      y: GROUND_Y + 20,
      duration: 520,
      ease: 'Quad.easeIn',
      onComplete: () => {
        const near = dx < 44;
        const ok = dx < 78;
        drops++;
        if (near) {
          SFX.fanfare();
          bigImpact(scene, targetX, GROUND_Y + 20 + api.areaY, 0xffd34d);
          confetti(scene, 16);
          session.addPoints(NEAR_PTS, targetX, GROUND_Y + api.areaY - 40, false);
          floatUp(scene, targetX, GROUND_Y + api.areaY - 70, UI_TEXT.fest.balloonBull, '#e0812a');
        } else if (ok) {
          SFX.good();
          impactRing(scene, marker.x, GROUND_Y + 20 + api.areaY, 0x9ccb6f, 12);
          session.addPoints(OK_PTS, marker.x, GROUND_Y + api.areaY - 40, false);
          floatUp(scene, marker.x, GROUND_Y + api.areaY - 70, UI_TEXT.fest.balloonNear, '#3f7d2c');
        } else {
          SFX.bad();
          session.resetCombo();
          session.addPoints(FAR_PTS, marker.x, GROUND_Y + api.areaY - 40, false);
          floatUp(scene, marker.x, GROUND_Y + api.areaY - 70, UI_TEXT.fest.balloonFar, '#c04545');
        }
        burst(scene, marker.x, GROUND_Y + 20 + api.areaY, near ? 12 : 5);
        marker.destroy();
        dropping = false;
        newTarget();
      },
    });
  });

  const info = scene.add
    .text(GAME_W / 2, 24, '', { fontFamily: FONT, fontSize: '14px', color: '#3f5a6b' })
    .setOrigin(0.5);
  area.add(info);

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    balloon.y += (burning ? -UP_SPEED : DOWN_SPEED) * dt;
    balloon.y = Phaser.Math.Clamp(balloon.y, 60, GROUND_Y - 40);
    const wind = balloon.y < HI_Y ? WIND_HI : balloon.y < MID_Y ? WIND_MID : WIND_LOW;
    balloon.x = Phaser.Math.Clamp(balloon.x + wind * dt, 30, GAME_W - 30);
    balloon.setAngle(Math.sin(Date.now() / 700) * 3);
    info.setText(UI_TEXT.fest.balloonInfo(drops));
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    refill.remove();
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

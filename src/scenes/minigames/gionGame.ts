/* ぎおんまつり(きょうと): やまほこの「つじまわし」。
   おおきな やまほこは まがれない。だから 竹を しいて 水を まき、
   みんなで ロープを ひいて 90どずつ 回す ― それを 指の 回転ジェスチャーに した。

   1. まず「竹しき」: ひかった 3まいの 竹を タップして しく(じゅんびの しごと)
   2. つぎに「まわす」: やまほこを ぐるっと ドラッグして 90ど まわす
      ゆっくり = きれいに まわる / いっきに ひっぱると 竹が すべって やりなおし(得点は へらない)
   3. まわりきると こうさてんを つぎへ すすむ。何回 まわせるかの ゲーム */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import { offPointerRelease, onPointerRelease } from './input';
import type { MinigameApi } from './types';

const AREA_H = GAME_AREA_H;
const CX = GAME_W / 2;
const CY = 400;
/** 90ど まわしきる */
const TURN_TARGET = Math.PI / 2;
/** はやすぎ(rad/ms)= 竹が すべる */
const V_SLIP = 0.011;
const V_WINDOW_MS = 90;
const BAMBOO_PTS = 6;
const TURN_PTS = 46;
const CLEAN_BONUS = 22;

export function renderGion(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // なつの きょうとの まちなみ
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x8ec7e8, 0x8ec7e8, 0xf6e6c0, 0xf6e6c0, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0xd8c69a, 1);
  bg.fillRect(0, 470, GAME_W, AREA_H - 470); // とおり
  bg.fillStyle(0xbca877, 1);
  for (let i = 0; i < 10; i++) bg.fillRect(0, 470 + i * 22, GAME_W, 2);
  // まちや
  for (const [x, w] of [[0, 90], [GAME_W - 90, 90]] as const) {
    bg.fillStyle(0x6b4a33, 1);
    bg.fillRect(x, 250, w, 220);
    bg.fillStyle(0x8a6a4a, 1);
    bg.fillRect(x, 240, w, 20);
  }
  area.add(bg);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'gion',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- やまほこ ---------- */
  const hoko = scene.add.container(CX, CY);
  const hg = scene.add.graphics();
  hg.fillStyle(0x7a4a2a, 1);
  hg.fillRoundedRect(-58, -40, 116, 96, 8); // だいわく
  hg.fillStyle(0xc9a23f, 1);
  hg.fillRect(-58, -46, 116, 12); // やねの ふち
  hg.fillStyle(0x2f4a7a, 1);
  hg.fillRect(-48, -30, 96, 60); // まくじ
  hg.fillStyle(0xe8d9a8, 1);
  hg.fillRect(-30, -18, 60, 34);
  hg.fillStyle(0x3a2a18, 1);
  hg.fillCircle(-40, 60, 18); // くるま
  hg.fillCircle(40, 60, 18);
  hoko.add(hg);
  // ほこの さきの ほこ(長い ぼう)
  const pole = scene.add.graphics();
  pole.lineStyle(6, 0x8a6a4a, 1);
  pole.lineBetween(0, -46, 0, -200);
  pole.fillStyle(0xffd34d, 1);
  pole.fillTriangle(-14, -196, 14, -196, 0, -232);
  hoko.add(pole);
  hoko.add(addIcon(scene, 0, 20, 'person-kimono:violet', 26));
  area.add(hoko);

  // ひっぱる ひとたち
  const pullers: Phaser.GameObjects.Image[] = [];
  for (const dx of [-150, -110, 110, 150]) {
    const p = addIcon(scene, CX + dx, CY + 110, 'person:teal', 24);
    area.add(p);
    pullers.push(p);
  }

  /* ---------- じゅんび: 竹しき ---------- */
  let phase: 'bamboo' | 'turn' = 'bamboo';
  let turned = 0;
  let slipped = false;
  let corner = 0;
  const bamboos: Phaser.GameObjects.Image[] = [];

  const cornerLabel = scene.add
    .text(CX, 150, '', { fontFamily: 'sans-serif', fontSize: '16px', color: '#5a4632', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(cornerLabel);

  const layBamboo = (): void => {
    phase = 'bamboo';
    turned = 0;
    slipped = false;
    cornerLabel.setText(UI_TEXT.fest.gionCorner(corner + 1));
    for (let i = 0; i < 3; i++) {
      const b = addIcon(scene, CX - 60 + i * 60, CY + 78, 'bamboo:lime', 30)
        .setAlpha(0.55)
        .setInteractive({ useHandCursor: true });
      b.on('pointerdown', () => {
        if (b.alpha > 0.9) return;
        b.setAlpha(1);
        SFX.pop();
        burst(scene, b.x, b.y + api.areaY, 4, [0x9ccb6f, 0xffffff]);
        session.addPoints(BAMBOO_PTS, b.x, b.y + api.areaY - 30);
        if (bamboos.every((x) => x.alpha > 0.9)) startTurn();
      });
      area.add(b);
      bamboos.push(b);
    }
    // 水を まく えんしゅつ
    scene.tweens.add({ targets: bamboos, y: CY + 74, duration: 500, yoyo: true, repeat: -1 });
  };

  const clearBamboo = (): void => {
    scene.tweens.killTweensOf(bamboos); // うごかす tween を のこすと けした あとも 追いかけて しまう
    for (const b of bamboos) b.destroy();
    bamboos.length = 0;
  };

  const startTurn = (): void => {
    phase = 'turn';
    SFX.good();
    floatUp(scene, CX, CY + api.areaY - 150, UI_TEXT.fest.gionReady, '#3f7d2c');
    cornerLabel.setText(UI_TEXT.fest.gionTurnNow);
  };
  layBamboo();

  /* ---------- まわす(回転ジェスチャー) ---------- */
  let grabbing = false;
  let lastAngle = 0;
  let winAngle = 0;
  let winT = 0;

  const angleOf = (px: number, py: number): number => Math.atan2(py - api.areaY - CY, px - CX);

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (phase !== 'turn' || session.isEnded()) return;
    if (Math.hypot(p.worldX - CX, p.worldY - api.areaY - CY) > 190) return;
    grabbing = true;
    lastAngle = angleOf(p.worldX, p.worldY);
    winAngle = lastAngle;
    winT = Date.now();
  };

  const slip = (): void => {
    slipped = true;
    grabbing = false;
    SFX.bad();
    missShake(scene);
    session.resetCombo();
    floatUp(scene, CX, CY + api.areaY - 120, UI_TEXT.fest.gionSlip, '#c04545');
    // やまほこが すこし もどる
    scene.tweens.add({ targets: hoko, rotation: hoko.rotation - turned * 0.6, duration: 400 });
    turned *= 0.4;
  };

  const finishTurn = (): void => {
    // まわし切った あと 500ms は やまほこが もどる えんしゅつ中。
    // その あいだも phase が 'turn' の ままだと、もう1かい つかんで まわすと
    // finishTurn が なんども はしって こうさてんが とびこし・竹が 二重に でて 止まる
    if (phase !== 'turn') return;
    phase = 'bamboo';
    turned = 0;
    SFX.fanfare();
    bigImpact(scene, CX, CY + api.areaY, 0xffd34d);
    session.addPoints(TURN_PTS, CX, CY + api.areaY - 120, false);
    if (!slipped) {
      session.addPoints(CLEAN_BONUS, CX, CY + api.areaY - 160, false);
      floatUp(scene, CX, CY + api.areaY - 190, UI_TEXT.fest.gionClean, '#e0812a');
      confetti(scene, 14);
    }
    floatUp(scene, CX, CY + api.areaY - 150, UI_TEXT.fest.gionDone, '#e0812a');
    for (const [i, p] of pullers.entries()) {
      scene.tweens.add({ targets: p, y: CY + 110 - 22, duration: 160, yoyo: true, delay: i * 50 });
    }
    corner++;
    grabbing = false;
    clearBamboo();
    // つぎの こうさてんへ(やまほこは まっすぐに もどる)
    scene.tweens.add({
      targets: hoko,
      rotation: 0,
      x: { from: CX, to: CX },
      duration: 500,
      onComplete: () => {
        if (!session.isEnded()) layBamboo();
      },
    });
  };

  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!grabbing || !p.isDown || phase !== 'turn' || session.isEnded()) return;
    const a = angleOf(p.worldX, p.worldY);
    let d = a - lastAngle;
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    lastAngle = a;
    // 時計まわりだけ すすむ(ぎゃくは すすまないだけ)
    if (d > 0) {
      turned += d;
      hoko.rotation += d;
      // はやすぎチェック
      const now = Date.now();
      if (now - winT >= V_WINDOW_MS) {
        let wd = a - winAngle;
        if (wd > Math.PI) wd -= Math.PI * 2;
        if (wd < -Math.PI) wd += Math.PI * 2;
        const v = Math.abs(wd) / (now - winT);
        winAngle = a;
        winT = now;
        if (v > V_SLIP) {
          slip();
          return;
        }
      }
      if (Math.random() < 0.05) impactRing(scene, CX, CY + api.areaY, 0x9ad0f5, 10);
      if (turned >= TURN_TARGET) finishTurn();
    }
  };

  const onUp = (): void => {
    grabbing = false;
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  onPointerRelease(scene, onUp);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    offPointerRelease(scene, onUp);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

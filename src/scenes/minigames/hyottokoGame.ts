/* ひゅうが ひょっとこ なつまつり(みやざき): おかしな おめんを つけて おどる まつり。
   おかめ・ひょっとこ・きつね ― 3つの おめんには それぞれ きまった ポーズが ある。
   おはやしの あいずで「どの おめんの ポーズか」が しめされるので、
   3つの ボタンから おなじ ものを えらぶ(はんしゃの ゲーム)。
   だんだん あいずが はやくなり、ときどき「まねっこ!」で さっきと おなじ ものが つづく。
   まちがえても おこられない(コンボが きれるだけ)。動作=3たくの はんしゃ */
import Phaser from 'phaser';
import { addIcon, iconScale, setIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { burst, cameraPulse, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';
import { SCENERY_NAME } from '../../ui/scenery';

const AREA_H = GAME_AREA_H;
const CX = GAME_W / 2;
const MASKS = ['mask:red', 'face-surprised:cream', 'foxmask:orange'] as const;
const HIT_PTS = 13;
const STREAK_BONUS = 34;
/** あいずの じかん */
const CUE_MS_START = 1800;
const CUE_MS_END = 900;

export function renderHyottoko(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x3a4a7a, 0x3a4a7a, 0x7a5a4a, 0x7a5a4a, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  for (let i = 0; i < 7; i++) {
    bg.fillStyle(0xffd34d, 0.9);
    bg.fillEllipse(24 + i * 72, 86, 16, 22);
  }
  bg.fillStyle(0x4a3a2a, 1);
  bg.fillRect(0, 560, GAME_W, AREA_H - 560);
  area.add(bg.setName(SCENERY_NAME)); // 手描きの 背景が 来たら かくれる
  // おはやしの ひとたち
  for (const [dx, e] of [[-150, 'drum:crimson'], [150, 'flute:tan']] as const) {
    area.add(addIcon(scene, CX + dx, 520, e, 26));
  }

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'hyottoko',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- おどりて(でっかい おめん) ---------- */
  const dancer = addIcon(scene, CX, 300, 'mask:red', 80).setAlpha(0.25).setName('mg-dancer');
  area.add(dancer);
  const cueText = scene.add
    .text(CX, 190, '', { fontFamily: FONT, fontSize: '20px', color: '#ffe8b0', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(cueText);

  /* ---------- 3つの ボタン ---------- */
  const btns: Phaser.GameObjects.Container[] = [];
  const BX = [90, CX, GAME_W - 90];
  for (let i = 0; i < 3; i++) {
    const c = scene.add.container(BX[i], 440);
    const g = scene.add.graphics();
    g.fillStyle(0xfff4dc, 1);
    g.fillRoundedRect(-52, -52, 104, 104, 18);
    c.add(g);
    c.add(addIcon(scene, 0, -6, MASKS[i], 46).setName('mg-mask'));
    c.add(
      scene.add
        .text(0, 36, UI_TEXT.fest.hyottokoNames[i], { fontFamily: FONT, fontSize: '13px', color: '#5a4632' })
        .setOrigin(0.5),
    );
    c.setSize(116, 116);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => answer(i));
    area.add(c);
    btns.push(c);
  }

  /* ---------- あいず ---------- */
  let want = -1;
  let streak = 0;
  let last = -1;
  let cueTimer: Phaser.Time.TimerEvent | undefined;

  const cueMs = (): number => CUE_MS_START + (CUE_MS_END - CUE_MS_START) * session.progress();

  const nextCue = (): void => {
    if (session.isEnded()) return;
    const same = last >= 0 && Math.random() < 0.22;
    want = same ? last : Math.floor(Math.random() * 3);
    last = want;
    setIcon(dancer, MASKS[want]);
    dancer.setAlpha(1);
    scene.tweens.add({ targets: dancer, scale: { from: iconScale(dancer, 0.8), to: iconScale(dancer) }, duration: 200, ease: 'Back.easeOut' });
    cueText.setText(same ? UI_TEXT.fest.hyottokoSame : UI_TEXT.fest.hyottokoCue(UI_TEXT.fest.hyottokoNames[want]));
    SFX.hint();
    cueTimer = scene.time.delayedCall(cueMs(), () => {
      if (want >= 0) {
        // まにあわなかった
        session.resetCombo();
        streak = 0;
        floatUp(scene, CX, 350 + api.areaY, UI_TEXT.fest.hyottokoLate, '#c04545');
      }
      want = -1;
      dancer.setAlpha(0.25);
      scene.time.delayedCall(300, nextCue);
    });
  };
  scene.time.delayedCall(900, nextCue);

  const answer = (i: number): void => {
    if (session.isEnded() || want < 0) return;
    const ok = i === want;
    scene.tweens.add({ targets: btns[i], scale: { from: 0.88, to: 1 }, duration: 150, ease: 'Back.easeOut' });
    if (!ok) {
      // ★この あいずは ここで おわり に する。
      //   まえは want を のこして いた ので、おめん 3つを 順に おせば
      //   かならず あたる(あいずは おわりまで 900ms 以上 ある)。
      //   = 「どの ポーズか 見わける」あそびが まるごと 消えて いた
      //     (60秒で 約35あいず × 13点 = 総なめだけで 約455点)。
      //   ばつは あたえない。この 1かいの ごほうびだけ のがす。
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      streak = 0;
      floatUp(scene, BX[i], 380 + api.areaY, UI_TEXT.fest.hyottokoWrong, '#c04545');
      want = -1;
      cueTimer?.remove();
      dancer.setAlpha(0.25);
      scene.time.delayedCall(300, nextCue);
      return;
    }
    want = -1;
    cueTimer?.remove();
    streak++;
    SFX.good();
    impactRing(scene, BX[i], 440 + api.areaY, 0xffd34d, 12);
    burst(scene, BX[i], 440 + api.areaY, 7);
    session.addPoints(HIT_PTS, BX[i], 400 + api.areaY);
    floatUp(scene, CX, 250 + api.areaY, UI_TEXT.fest.hyottokoOk, '#3f7d2c');
    scene.tweens.add({ targets: dancer, angle: { from: -10, to: 10 }, duration: 160, yoyo: true });
    if (streak % 5 === 0) {
      SFX.fanfare();
      cameraPulse(scene);
      confetti(scene, 14);
      session.addPoints(STREAK_BONUS, CX, 220 + api.areaY, false);
      floatUp(scene, CX, 190 + api.areaY, UI_TEXT.fest.hyottokoStreak(streak), '#e0812a');
    }
    dancer.setAlpha(0.25);
    scene.time.delayedCall(320, nextCue);
  };

  const cleanup = (): void => {
    cueTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

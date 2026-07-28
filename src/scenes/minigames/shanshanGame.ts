/* とっとり しゃんしゃんまつり: かさおどり。すずの ついた かさを ひらいたり とじたりして おどる。
   おんどの あいずを 見て・聞いて、かさの じょうたいを きりかえる ゲーム。
     「シャン」  = かさを ひらく(とじているとき だけ 正かい)
     「シャシャン」= かさを とじる(ひらいているとき だけ 正かい)
   すでに その じょうたいなら「そのまま」= なにも しないのが 正かい(あわてて タップすると コンボ切れ)。
   合図の じかんは だんだん みじかく なる。動作=じょうたいの きりかえ判断 */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = GAME_AREA_H;
const CX = GAME_W / 2;
const KASA_Y = 360;
const OK_PTS = 12;
const KEEP_PTS = 8;
const STREAK_BONUS = 30;
/** あいずの じかん */
const CUE_MS_START = 1900;
const CUE_MS_END = 1000;

type Cue = 'open' | 'close' | 'keep';

export function renderShanshan(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x35305e, 0x35305e, 0x6b4a6b, 0x6b4a6b, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  for (let i = 0; i < 8; i++) {
    bg.fillStyle(0xffd34d, 0.85);
    bg.fillCircle(20 + i * 64, 96, 7);
  }
  bg.fillStyle(0x4a3a2a, 1);
  bg.fillRect(0, 560, GAME_W, AREA_H - 560);
  area.add(bg);
  // うしろで おどる ひとたち
  const dancers: Phaser.GameObjects.Image[] = [];
  for (const dx of [-180, -110, 110, 180]) {
    const t = addIcon(scene, CX + dx, 520, 'person-kimono:crimson', 28);
    area.add(t);
    dancers.push(t);
  }

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'shanshan',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- かさ ---------- */
  let open = false;
  const kasa = scene.add.container(CX, KASA_Y);
  const kg = scene.add.graphics();
  kasa.add(kg);
  const bells: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < 5; i++) {
    const b = addIcon(scene, -80 + i * 40, 34, 'lantern:gold', 16);
    kasa.add(b);
    bells.push(b);
  }
  kasa.add(addIcon(scene, 0, 90, 'person:teal', 30));
  area.add(kasa);

  const drawKasa = (): void => {
    kg.clear();
    if (open) {
      // ひらいた かさ(あかい わがさ)
      kg.fillStyle(0xc0392b, 1);
      kg.slice(0, 10, 108, Math.PI, Math.PI * 2, false);
      kg.fillPath();
      kg.lineStyle(3, 0xffe8b0, 0.9);
      for (let i = 0; i <= 6; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        kg.lineBetween(0, 10, Math.cos(a) * 108, 10 + Math.sin(a) * 108);
      }
    } else {
      // とじた かさ
      kg.fillStyle(0xc0392b, 1);
      kg.fillRoundedRect(-11, -84, 22, 96, 10);
      kg.fillStyle(0xffe8b0, 1);
      kg.fillRect(-11, -40, 22, 5);
    }
    kg.fillStyle(0x8a6a4a, 1);
    kg.fillRect(-4, 10, 8, 80); // え
    for (const [i, b] of bells.entries()) {
      b.setVisible(open);
      b.x = -80 + i * 40;
    }
  };
  drawKasa();

  /* ---------- あいず ---------- */
  const cueText = scene.add
    .text(CX, 210, '', { fontFamily: FONT, fontSize: '30px', color: '#ffe8b0', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(cueText);

  /* ★あいずを 絵で 見せる。

     まえは 30px の ことば 1行 だけ で、しかも 「ひらく」と 「とじる」は
     どちらも #ffd34d の 同じ いろ だった(ちがうのは 「そのまま」だけ)。
     字が 読めない子は 「きんいろ=タップ / みずいろ=タップしない」を
     手がかり ゼロで 自分で 見つける しかない。
     ひょっとこ(おなじ 3たく)は 大きな おめんの 絵を 見せて いる のに、
     しゃんしゃんだけ 絵の あいずが なかった。

     なので 「これに する」かさの すがたを ちいさく 見せる。
     ひらく = ひらいた かさ / とじる = とじた かさ / そのまま = いまの まま + ○。 */
  /* おく ばしょ: まん中は 本もの の かさ(y=360 まわり)と 上の あいずの ことば
     (y=210)で うまって いる ので、みぎ はしに よせる。
     ひらいた かさの みぎ端は CX+108=348 なので、そこから 右に はなす。 */
  const CUE_ICON_X = GAME_W - 62;
  const CUE_ICON_Y = 320;
  const CUE_SCALE = 0.34;
  const cueIcon = scene.add.graphics();
  area.add(cueIcon);
  /** ちいさい かさを かく(want=true なら ひらいた すがた) */
  const drawCueKasa = (want: boolean, keep: boolean): void => {
    const x = CUE_ICON_X;
    const y = CUE_ICON_Y;
    cueIcon.clear();
    // うしろの わく(あいずの いろ。きんいろ=うごかす / みずいろ=そのまま)
    cueIcon.fillStyle(keep ? 0x9ad0f5 : 0xffd34d, keep ? 0.5 : 0.85);
    cueIcon.fillRoundedRect(x - 48, y - 44, 96, 92, 14);
    cueIcon.fillStyle(0xc0392b, 1);
    if (want) {
      cueIcon.slice(x, y - 6, 108 * CUE_SCALE, Math.PI, Math.PI * 2, false);
      cueIcon.fillPath();
      cueIcon.lineStyle(2, 0xffe8b0, 0.9);
      for (let i = 0; i <= 4; i++) {
        const a = Math.PI + (i / 4) * Math.PI;
        cueIcon.lineBetween(x, y - 6, x + Math.cos(a) * 108 * CUE_SCALE, y - 6 + Math.sin(a) * 108 * CUE_SCALE);
      }
    } else {
      cueIcon.fillRoundedRect(x - 5, y - 38, 10, 36, 5);
      cueIcon.fillStyle(0xffe8b0, 1);
      cueIcon.fillRect(x - 5, y - 22, 10, 3);
    }
    cueIcon.fillStyle(0x8a6a4a, 1);
    cueIcon.fillRect(x - 2, y - 6, 4, 32);
    if (keep) {
      // 「そのまま」= さわらない しるし(まる)
      cueIcon.lineStyle(4, 0xffffff, 0.95);
      cueIcon.strokeCircle(x + 28, y + 30, 11);
    }
  };
  const hideCueKasa = (): void => {
    cueIcon.clear();
  };

  let cue: Cue = 'keep';
  let answered = false;
  let streak = 0;
  let cueTimer: Phaser.Time.TimerEvent | undefined;

  const cueMs = (): number => CUE_MS_START + (CUE_MS_END - CUE_MS_START) * session.progress();

  /* 「いまは ひらいている / とじている」の 文字は やめた。
     目の まえの かさの 絵(ひらいた わがさ / とじた ぼう)が すでに
     見せて いる ことの くりかえし で、判断には つかえない。 */
  const showState = (): void => {
    /* なにも しない。かさの 絵が すでに 見せて いる */
  };

  const nextCue = (): void => {
    if (session.isEnded()) return;
    const r = Math.random();
    cue = r < 0.42 ? 'open' : r < 0.84 ? 'close' : 'keep';
    // すでに その じょうたいなら「そのまま」
    if ((cue === 'open' && open) || (cue === 'close' && !open)) cue = 'keep';
    answered = false;
    cueText.setText(cue === 'open' ? UI_TEXT.fest.shanshanCueOpen : cue === 'close' ? UI_TEXT.fest.shanshanCueClose : UI_TEXT.fest.shanshanCueKeep);
    cueText.setColor(cue === 'keep' ? '#9ad0f5' : '#ffd34d');
    // 「これに する」すがたを 絵でも 見せる(そのまま は いまの すがた + ○)
    drawCueKasa(cue === 'keep' ? open : cue === 'open', cue === 'keep');
    scene.tweens.add({ targets: cueText, scale: { from: 1.3, to: 1 }, duration: 200 });
    SFX.hint();
    for (const [i, dn] of dancers.entries()) {
      scene.tweens.add({ targets: dn, y: 520 - 16, duration: 150, yoyo: true, delay: i * 40 });
    }
    cueTimer = scene.time.delayedCall(cueMs(), () => {
      if (!answered) {
        if (cue === 'keep') {
          // なにも しないのが 正かい
          SFX.pop();
          session.addPoints(KEEP_PTS, CX, KASA_Y + api.areaY - 140);
          floatUp(scene, CX, KASA_Y + api.areaY - 170, UI_TEXT.fest.shanshanKeepOk, '#3f7d2c');
          streak++;
          checkStreak();
        } else {
          session.resetCombo();
          streak = 0;
          floatUp(scene, CX, KASA_Y + api.areaY - 140, UI_TEXT.fest.shanshanLate, '#c04545');
        }
      }
      cueText.setText('');
      hideCueKasa();
      nextCue();
    });
  };

  const checkStreak = (): void => {
    if (streak > 0 && streak % 5 === 0) {
      SFX.fanfare();
      confetti(scene, 14);
      session.addPoints(STREAK_BONUS, CX, 300 + api.areaY, false);
      floatUp(scene, CX, 270 + api.areaY, UI_TEXT.fest.shanshanStreak(streak), '#e0812a');
    }
  };

  const toggle = (): void => {
    if (session.isEnded() || answered) return;
    answered = true;
    hideCueKasa(); // こたえた ので あいずの 絵は もう いらない
    const wanted: Cue = open ? 'close' : 'open';
    if (cue !== wanted) {
      // 「そのまま」の ときに うごかす / ぎゃくの あいず = コンボ切れ(得点は へらない)
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      streak = 0;
      floatUp(scene, CX, KASA_Y + api.areaY - 140, UI_TEXT.fest.shanshanWrong, '#c04545');
      return;
    }
    open = !open;
    drawKasa();
    showState();
    SFX.good();
    impactRing(scene, CX, KASA_Y + api.areaY, 0xffd34d, 12);
    burst(scene, CX, KASA_Y + api.areaY, 8, [0xffd34d, 0xffe8b0]);
    session.addPoints(OK_PTS, CX, KASA_Y + api.areaY - 140);
    floatUp(scene, CX + 90, KASA_Y + api.areaY - 170, UI_TEXT.fest.shanshanRing, '#e0812a');
    scene.tweens.add({ targets: kasa, scale: { from: open ? 0.85 : 1.1, to: 1 }, duration: 220, ease: 'Back.easeOut' });
    streak++;
    checkStreak();
    cueTimer?.remove();
    scene.time.delayedCall(320, nextCue);
  };

  const onDown = (): void => toggle();
  scene.input.on('pointerdown', onDown);
  showState();
  scene.time.delayedCall(900, nextCue);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    cueTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

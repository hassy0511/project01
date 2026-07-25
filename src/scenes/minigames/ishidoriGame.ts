/* くわなの いしどりまつり(みえ): 「にほんいち やかましい まつり」の かねと たいこ。
   ひかった がっきを タップして たたく。かね(たかい音)と たいこ(ひくい音)を
   たたきわけるのが しごと。ふたつ どうじに ひかったら 両方 たたく(どちらか だけでは 半分)。
   まちがった がっきを たたくと おとが ずれて コンボが きれる(得点は へらない=成功保証)。
   おわりの「いちばん」= さいごの 10びょうは 得点2ばい */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, cameraPulse, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const KANE_X = GAME_W / 2 - 95;
const TAIKO_X = GAME_W / 2 + 95;
const INST_Y = 400;
const HIT_PTS = 10;
const BOTH_BONUS = 14;
/** ひかっている あいだ(だんだん みじかくなる) */
const LIT_MS_START = 1500;
const LIT_MS_END = 820;
/** つぎの あいずまでの 間 */
const GAP_MS_START = 800;
const GAP_MS_END = 380;
/** さいごの もりあがり(のこり秒) */
const FINALE_SEC = 10;

type Which = 'kane' | 'taiko' | 'both';

export function renderIshidori(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  // よるの まちなみ(ちょうちんの ならぶ 石取祭車)
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x2b2f5e, 0x2b2f5e, 0x53406b, 0x53406b, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  for (let i = 0; i < 7; i++) {
    bg.fillStyle(0xe05b5b, 1);
    bg.fillEllipse(24 + i * 72, 92, 18, 24);
    bg.fillStyle(0xffd34d, 0.65);
    bg.fillEllipse(24 + i * 72, 92, 10, 14);
  }
  // まつりぐるま(さいしゃ)
  bg.fillStyle(0x6b4a2a, 1);
  bg.fillRoundedRect(60, 480, GAME_W - 120, 90, 10);
  bg.fillStyle(0x8a6a4a, 1);
  bg.fillRect(60, 470, GAME_W - 120, 14);
  bg.fillStyle(0x3a2a18, 1);
  bg.fillCircle(110, 580, 22);
  bg.fillCircle(GAME_W - 110, 580, 22);
  area.add(bg);

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'ishidori',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- がっき ---------- */
  const makeInst = (x: number, emoji: string, label: string): Phaser.GameObjects.Container => {
    const c = scene.add.container(x, INST_Y);
    const ring = scene.add.graphics();
    ring.lineStyle(5, 0xffffff, 0.25);
    ring.strokeCircle(0, 0, 60);
    c.add(ring);
    const glow = scene.add.graphics();
    c.add(glow);
    c.setData('glow', glow);
    c.add(scene.add.text(0, 0, emoji, { fontSize: '54px' }).setOrigin(0.5));
    c.add(
      scene.add
        .text(0, 74, label, { fontFamily: 'sans-serif', fontSize: '15px', color: '#ffe8b0', fontStyle: 'bold' })
        .setOrigin(0.5),
    );
    area.add(c);
    return c;
  };
  const kane = makeInst(KANE_X, '🔔', UI_TEXT.fest.ishidoriKane);
  const taiko = makeInst(TAIKO_X, '🪘', UI_TEXT.fest.ishidoriTaiko);

  const setLit = (c: Phaser.GameObjects.Container, on: boolean, color: number): void => {
    const g = c.getData('glow') as Phaser.GameObjects.Graphics;
    g.clear();
    if (!on) return;
    g.fillStyle(color, 0.35);
    g.fillCircle(0, 0, 58);
    g.lineStyle(6, color, 0.9);
    g.strokeCircle(0, 0, 60);
  };

  /* ---------- あいず(どちらを たたくか) ---------- */
  let cue: Which | null = null;
  let need = { kane: false, taiko: false };
  let cueTimer: Phaser.Time.TimerEvent | undefined;
  let gapTimer: Phaser.Time.TimerEvent | undefined;

  const lerp = (a: number, b: number): number => a + (b - a) * session.progress();

  const closeCue = (): void => {
    cue = null;
    need = { kane: false, taiko: false };
    setLit(kane, false, 0xffd34d);
    setLit(taiko, false, 0x9ad0f5);
  };

  const nextCue = (): void => {
    if (session.isEnded()) return;
    const r = Math.random();
    cue = r < 0.42 ? 'kane' : r < 0.84 ? 'taiko' : 'both';
    need = { kane: cue !== 'taiko', taiko: cue !== 'kane' };
    if (need.kane) setLit(kane, true, 0xffd34d);
    if (need.taiko) setLit(taiko, true, 0x9ad0f5);
    SFX.hint();
    cueTimer = scene.time.delayedCall(lerp(LIT_MS_START, LIT_MS_END), () => {
      // たたけなくても へらない(コンボだけ きれる)
      if (need.kane || need.taiko) session.resetCombo();
      closeCue();
      gapTimer = scene.time.delayedCall(lerp(GAP_MS_START, GAP_MS_END), nextCue);
    });
  };
  scene.time.delayedCall(900, nextCue);

  /* ---------- たたく ---------- */
  const finale = (): boolean => session.secLeft() <= FINALE_SEC;

  const hit = (which: 'kane' | 'taiko', c: Phaser.GameObjects.Container): void => {
    if (session.isEnded()) return;
    const wanted = which === 'kane' ? need.kane : need.taiko;
    scene.tweens.add({ targets: c, scale: { from: 0.86, to: 1 }, duration: 140, ease: 'Back.easeOut' });
    if (!wanted) {
      // まちがった がっき: おとが ずれる
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      floatUp(scene, c.x, INST_Y + api.areaY - 80, UI_TEXT.fest.ishidoriMiss, '#c04545');
      return;
    }
    if (which === 'kane') {
      need.kane = false;
      setLit(kane, false, 0xffd34d);
      SFX.good();
    } else {
      need.taiko = false;
      setLit(taiko, false, 0x9ad0f5);
      SFX.pop();
    }
    const x2 = finale() ? 2 : 1;
    impactRing(scene, c.x, INST_Y + api.areaY, which === 'kane' ? 0xffd34d : 0x9ad0f5, 12);
    burst(scene, c.x, INST_Y + api.areaY, 6, which === 'kane' ? [0xffd34d, 0xffffff] : [0x9ad0f5, 0xffffff]);
    session.addPoints(HIT_PTS * x2, c.x, INST_Y + api.areaY - 70);
    // ふたつ どうじの あいずを 両方 たたけたら ボーナス
    if (cue === 'both' && !need.kane && !need.taiko) {
      SFX.fanfare();
      cameraPulse(scene);
      session.addPoints(BOTH_BONUS * x2, GAME_W / 2, INST_Y + api.areaY - 120, false);
      floatUp(scene, GAME_W / 2, INST_Y + api.areaY - 150, UI_TEXT.fest.ishidoriBoth, '#e0812a');
    }
    if (!need.kane && !need.taiko) {
      cueTimer?.remove();
      closeCue();
      gapTimer = scene.time.delayedCall(lerp(GAP_MS_START, GAP_MS_END), nextCue);
    }
  };

  for (const [c, w] of [
    [kane, 'kane'],
    [taiko, 'taiko'],
  ] as const) {
    c.setSize(160, 160); // 見た目より ひろい あたり判定(子供の指は ふとい)
    c.setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => hit(w, c));
  }

  // さいごの もりあがり(4びょうごとに あいさつ)
  let ticks = 0;
  const finaleTimer = scene.time.addEvent({
    delay: 500,
    loop: true,
    callback: () => {
      ticks++;
      if (session.isEnded() || !finale() || ticks % 8 !== 0) return;
      floatUp(scene, GAME_W / 2, 150 + api.areaY, UI_TEXT.fest.ishidoriFinale, '#e0812a');
    },
  });

  const cleanup = (): void => {
    cueTimer?.remove();
    gapTimer?.remove();
    finaleTimer.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

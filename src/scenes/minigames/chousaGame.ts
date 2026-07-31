/* さぬき ちょうさまつり(かがわ): おおきな たいこだいを 4すみの かたで かつぎ上げる。
   4つの「かた」の ちからゲージが バラバラに さがるので、さがった かたを タップして
   ちからを もどす ― ぜんぶ たかいまま そろえると「さしあげ」ができて 大とくてん。
   1つでも 0に なると たいこだいが かたむいて さしあげが とけるが、たおれはしない。
   動作=4つの ゲージの めくばり(マルチかんり)。1本ざおの バランス(kantou)とは べつ */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, fillBar, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';
import { SCENERY_NAME } from '../../ui/scenery';

const AREA_H = GAME_AREA_H;
const CX = GAME_W / 2;
const DAI_Y = 300;
const SHOULDERS = 4;
const TAP_PTS = 5;
const LIFT_PTS = 40;
/** ゲージが さがる はやさ(/s。だんだん はやくなる) */
const DROP_START = 0.19;
const DROP_END = 0.34;
/** これ以上 ちからが ある かたは 「たすける ひつようが ない」 */
const FULL_LINE = 0.9;
/** タップ1かいで もどる ぶん */
const RECOVER = 0.3;
/** さしあげ に ひつような たかさ */
const LIFT_LINE = 0.78;
const LIFT_HOLD_MS = 1200;

export function renderChousa(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x9ec9e8, 0x9ec9e8, 0xf0e4c4, 0xf0e4c4, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0xd8c69a, 1);
  bg.fillRect(0, 520, GAME_W, AREA_H - 520);
  area.add(bg.setName(SCENERY_NAME)); // 手描きの 背景が 来たら かくれる

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'chousa',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- たいこだい ---------- */
  const dai = scene.add.container(CX, DAI_Y);
  const dg = scene.add.graphics();
  dg.fillStyle(0xc0392b, 1);
  dg.fillRoundedRect(-120, -30, 240, 90, 10); // ふとん(あかい だん)
  dg.fillStyle(0xe05b5b, 1);
  for (let i = 0; i < 4; i++) dg.fillRect(-120, -30 + i * 22, 240, 8);
  dg.fillStyle(0xc9a23f, 1);
  dg.fillRect(-130, -40, 260, 14); // きんの ふち
  dai.add(dg);
  dai.add(addIcon(scene, 0, 20, 'drum:crimson', 34));
  dai.add(addIcon(scene, 0, -66, 'flag:crimson', 26));
  area.add(dai);

  /* ---------- 4つの かた ---------- */
  const power = [1, 1, 1, 1];
  const shoulders: Phaser.GameObjects.Container[] = [];
  const gauges: Phaser.GameObjects.Graphics[] = [];
  const POS = [
    [CX - 150, 470],
    [CX - 50, 470],
    [CX + 50, 470],
    [CX + 150, 470],
  ] as const;

  for (let i = 0; i < SHOULDERS; i++) {
    const c = scene.add.container(POS[i][0], POS[i][1]);
    c.add(addIcon(scene, 0, 0, 'person:teal', 36));
    /* 「かた1」〜「かた4」の ラベルは やめた。
       この 番号は ゲームの どこでも つかって いない(あいずも しらせも
       番号を 見て いない)。子供が 見る のは 頭の 上の ちからゲージの
       いろ(みどり/きいろ/あか)だけ で、番号は 判断に つながらない。
       字が 読めない子には 意味の ない 文字が 4つ ならぶ だけ で、
       絵の じゃまに なって いた。 */
    c.setSize(90, 130);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => tap(i));
    area.add(c);
    shoulders.push(c);
    const g = scene.add.graphics();
    area.add(g);
    gauges.push(g);
  }

  const drawGauges = (): void => {
    for (let i = 0; i < SHOULDERS; i++) {
      const g = gauges[i];
      const [x, y] = POS[i];
      g.clear();
      g.fillStyle(0xffffff, 0.6);
      g.fillRoundedRect(x - 22, y - 78, 44, 14, 7);
      const p = power[i];
      g.fillStyle(p > LIFT_LINE ? 0x6fbf44 : p > 0.35 ? 0xffd34d : 0xe05b5b, 1);
      fillBar(g, x - 22, y - 78, 44 * p, 14, 7);
    }
  };
  drawGauges();

  const info = scene.add
    .text(CX, 600, '', { fontFamily: FONT, fontSize: '15px', color: '#5a4632', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(info);

  /* ---------- さしあげ ---------- */
  let lifting = false;
  let liftSince = 0;
  let lifts = 0;

  const tap = (i: number): void => {
    if (session.isEnded()) return;
    // ちからが みちている かたを たたいても 点は 入らない。
    // (どこでも れんだするだけで 点が つみあがると 「さがった かたを 見つける」
    //  ゲームに ならず、★も 実力と 合わなくなる。おしても おこられはしない)
    const wasFull = power[i] > FULL_LINE;
    power[i] = Math.min(1, power[i] + RECOVER);
    SFX.pop();
    scene.tweens.add({ targets: shoulders[i], y: POS[i][1] - 10, duration: 110, yoyo: true });
    drawGauges();
    if (wasFull) return;
    burst(scene, POS[i][0], POS[i][1] + api.areaY - 40, 3, [0xffd34d, 0xffffff]);
    session.addPoints(TAP_PTS, POS[i][0], POS[i][1] + api.areaY - 90);
  };

  const doLift = (): void => {
    lifts++;
    SFX.fanfare();
    bigImpact(scene, CX, DAI_Y + api.areaY, 0xffd34d);
    confetti(scene, 18);
    session.addPoints(LIFT_PTS, CX, DAI_Y + api.areaY - 90, false);
    floatUp(scene, CX, DAI_Y + api.areaY - 130, UI_TEXT.fest.chousaLift, '#e0812a');
    scene.tweens.add({ targets: dai, y: DAI_Y - 70, duration: 500, yoyo: true, ease: 'Sine.easeOut' });
    // さしあげの あとは みんな すこし つかれる
    for (let i = 0; i < SHOULDERS; i++) power[i] = 0.55;
    liftSince = 0;
    drawGauges();
  };

  const onUpdate = (_t: number, dtMs: number): void => {
    if (session.isEnded()) return;
    const dt = Math.min(dtMs, 33) / 1000;
    const drop = DROP_START + (DROP_END - DROP_START) * session.progress();
    let low = false;
    for (let i = 0; i < SHOULDERS; i++) {
      // かたごとに さがりかたが すこし ちがう
      power[i] = Math.max(0, power[i] - drop * dt * (0.7 + i * 0.2));
      if (power[i] <= 0.001) low = true;
    }
    const allHigh = power.every((p) => p >= LIFT_LINE);
    if (allHigh) {
      if (!liftSince) liftSince = Date.now();
      if (!lifting) {
        lifting = true;
        floatUp(scene, CX, 240 + api.areaY, UI_TEXT.fest.chousaReady, '#3f7d2c');
        impactRing(scene, CX, DAI_Y + api.areaY, 0x9ccb6f, 14);
      }
      if (Date.now() - liftSince >= LIFT_HOLD_MS) doLift();
    } else {
      lifting = false;
      liftSince = 0;
    }
    if (low && lifting) {
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      floatUp(scene, CX, DAI_Y + api.areaY - 60, UI_TEXT.fest.chousaTilt, '#c04545');
    }
    // かたむき: ひだり2つと みぎ2つの ちからの さ
    const tilt = (power[0] + power[1] - power[2] - power[3]) * 6;
    dai.setAngle(-tilt);
    dai.y = DAI_Y + (1 - (power[0] + power[1] + power[2] + power[3]) / 4) * 26;
    info.setText(UI_TEXT.fest.chousaInfo(lifts));
    drawGauges();
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const cleanup = (): void => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

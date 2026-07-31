/* よさこいまつり(こうち): 両手に「なるこ」を もって おどる。
   なるこは「カチッ カチッ」と 2つ 鳴るのが きほん ― だから これは
   「1つの あいずに 2れんうち」を そろえる ゲーム。
     わっかが ひかったら すばやく 2かい タップ。
     1かいだけ / 3かい いじょう / おそすぎ は そろわない(コンボ切れ。得点は へらない)。
   ときどき「よっちょれ!」の あいずで 3れんうちに なる(よく 見て かぞえる)。
   動作=れんだの「かず」を そろえる。1タップの タイミングゲームとは べつの てざわり */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';
import { SCENERY_NAME } from '../../ui/scenery';

const AREA_H = GAME_AREA_H;
const CX = GAME_W / 2;
const RING_Y = 330;
/** 2れんうちの うけつけ じかん(ms) */
const WINDOW_MS = 900;
const HIT_PTS = 11;
const TRIPLE_PTS = 26;
/** あいずの かんかく */
const GAP_MS_START = 1500;
const GAP_MS_END = 900;

export function renderYosakoi(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x2f4a7a, 0x2f4a7a, 0x7a5a3a, 0x7a5a3a, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  bg.fillStyle(0xd8c69a, 1);
  bg.fillRect(0, 540, GAME_W, AREA_H - 540); // おおどおり
  for (let i = 0; i < 8; i++) {
    bg.fillStyle(0xffd34d, 0.85);
    bg.fillRect(i * 62 + 14, 90, 34, 10);
  }
  area.add(bg.setName(SCENERY_NAME)); // 手描きの 背景が 来たら かくれる

  // おどりて(なるこを もった 4にん)
  const dancers: Phaser.GameObjects.Image[] = [];
  for (const dx of [-160, -55, 55, 160]) {
    const t = addIcon(scene, CX + dx, 500, 'person-dancer:pink', 34);
    area.add(t);
    dancers.push(t);
  }

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'yosakoi',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- なるこの わっか ---------- */
  const ring = scene.add.graphics();
  area.add(ring);
  const naruko = addIcon(scene, CX, RING_Y, 'naruko:red', 46);
  area.add(naruko);
  const needText = scene.add
    .text(CX, RING_Y - 100, '', { fontFamily: FONT, fontSize: '26px', color: '#ffe8b0', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(needText);
  /* ★「なんかい たたくか」を 絵で 見せる。

     まえは needText の ことば('カチッ カチッ (2かい)' / 'よっちょれ! (3かい)')
     と いろ(2かい=#ffe8b0 / 3かい=#ff8a3d)だけ だった。
     いろと かずの むすびつきは どこにも 見せて いない ので、
     字が 読めない子は いつも 2かい に かける しかなく、
     3かいの あいず(22%)は ぜんぶ 0点。
     いちばん おいしい TRIPLE_PTS(26点 = HIT_PTS の 2.4ばい)が
     読める子だけに ひらいて いた。

     なので めざす かずだけ 「まる」を ならべ、たたく ごとに 1つ ぬる。
     のこりが 見えるので かずを 読まなくても わかる。 */
  const MARK_R = 17;
  const MARK_GAP = 48;
  const marks = scene.add.graphics();
  area.add(marks);
  const drawMarks = (want: number, done: number): void => {
    marks.clear();
    if (want <= 0) return;
    const x0 = CX - ((want - 1) * MARK_GAP) / 2;
    for (let i = 0; i < want; i++) {
      const x = x0 + i * MARK_GAP;
      if (i < done) {
        marks.fillStyle(0xffd34d, 1);
        marks.fillCircle(x, RING_Y + 92, MARK_R);
        marks.lineStyle(4, 0xb28f22, 1);
      } else {
        // まだ たたいて いない ぶん。くらい 背景で 見えなく ならない ように
        // すこし あかるく、ふちも ふとく する
        marks.fillStyle(0xffffff, 0.34);
        marks.fillCircle(x, RING_Y + 92, MARK_R);
        marks.lineStyle(4, 0xffe8b0, 1);
      }
      marks.strokeCircle(x, RING_Y + 92, MARK_R);
    }
  };

  let need = 0; // 0 = あいず まち
  let hits = 0;
  let openUntil = 0;
  let cueTimer: Phaser.Time.TimerEvent | undefined;
  let closeTimer: Phaser.Time.TimerEvent | undefined;

  const drawRing = (on: boolean): void => {
    ring.clear();
    ring.lineStyle(6, on ? 0xffd34d : 0xffffff, on ? 0.95 : 0.3);
    ring.strokeCircle(CX, RING_Y, 74);
    if (on) {
      ring.fillStyle(0xffd34d, 0.18);
      ring.fillCircle(CX, RING_Y, 72);
    }
  };
  drawRing(false);

  const gap = (): number => GAP_MS_START + (GAP_MS_END - GAP_MS_START) * session.progress();

  const closeCue = (): void => {
    const wanted = need;
    const got = hits;
    need = 0;
    hits = 0;
    drawRing(false);
    needText.setText('');
    drawMarks(0, 0);
    if (wanted === 0) return;
    if (got === wanted) {
      const triple = wanted === 3;
      SFX.good();
      if (triple) {
        bigImpact(scene, CX, RING_Y + api.areaY, 0xffd34d);
        confetti(scene, 12);
      } else {
        impactRing(scene, CX, RING_Y + api.areaY, 0xffd34d, 14);
      }
      burst(scene, CX, RING_Y + api.areaY, triple ? 12 : 7);
      session.addPoints(triple ? TRIPLE_PTS : HIT_PTS, CX, RING_Y + api.areaY - 90);
      floatUp(
        scene,
        CX,
        RING_Y + api.areaY - 120,
        triple ? UI_TEXT.fest.yosakoiYocchore : UI_TEXT.fest.yosakoiOk,
        '#e0812a',
      );
      for (const [i, d] of dancers.entries()) {
        scene.tweens.add({ targets: d, y: 500 - 22, duration: 140, yoyo: true, delay: i * 40 });
      }
    } else {
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      floatUp(
        scene,
        CX,
        RING_Y + api.areaY - 90,
        got < wanted ? UI_TEXT.fest.yosakoiFew : UI_TEXT.fest.yosakoiMany,
        '#c04545',
      );
    }
    cueTimer = scene.time.delayedCall(gap(), nextCue);
  };

  const nextCue = (): void => {
    if (session.isEnded()) return;
    need = Math.random() < 0.22 ? 3 : 2;
    hits = 0;
    openUntil = Date.now() + WINDOW_MS;
    drawRing(true);
    needText.setText(need === 3 ? UI_TEXT.fest.yosakoiCue3 : UI_TEXT.fest.yosakoiCue2);
    drawMarks(need, 0);
    needText.setColor(need === 3 ? '#ff8a3d' : '#ffe8b0');
    scene.tweens.add({ targets: needText, scale: { from: 1.3, to: 1 }, duration: 180 });
    SFX.hint();
    closeTimer = scene.time.delayedCall(WINDOW_MS, closeCue);
  };
  scene.time.delayedCall(900, nextCue);

  const onDown = (): void => {
    if (session.isEnded()) return;
    if (need === 0 || Date.now() > openUntil) {
      // あいずの ないときに たたく = コンボ切れ
      session.resetCombo();
      SFX.pop();
      return;
    }
    hits++;
    drawMarks(need, hits);
    SFX.pop();
    burst(scene, CX + (hits % 2 ? -40 : 40), RING_Y + api.areaY, 3, [0xffd34d, 0xffffff]);
    scene.tweens.add({
      targets: naruko,
      angle: { from: hits % 2 ? -22 : 22, to: 0 },
      duration: 120,
    });
    if (hits === need) {
      // ちょうど そろった: すぐ はんてい(はやい ほうが きもちいい)
      closeTimer?.remove();
      scene.time.delayedCall(160, closeCue);
    } else if (hits > need) {
      closeTimer?.remove();
      closeCue();
    }
  };
  scene.input.on('pointerdown', onDown);

  const cleanup = (): void => {
    scene.input.off('pointerdown', onDown);
    cueTimer?.remove();
    closeTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

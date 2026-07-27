/* ろくがつどう(かごしま): なつの よに、絵を かいた とうろうを じんじゃに かける ぎょうじ。
   だから これは「とうろうに 絵を かく」ゲーム。
     ・したえの てんが すうじの じゅんに ならんでいる ― 1 → 2 → 3 … と タップして つないでいく
     ・じゅんばんを まちがえると せんが つながらない(コンボが きれるだけ)
     ・ぜんぶ つなぐと 絵が ひかって、とうろうが じんじゃに かかる
   絵は「さくらじま」「ねこ」「はなび」など いろいろ。
   動作=すうじの じゅんに てんを つなぐ(てんつなぎ)。ほかの おまつりに ない てざわり */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { FONT, GAME_AREA_H, GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = GAME_AREA_H;
const DOT_PTS = 6;
const DONE_BONUS = 46;
/** かみの わく */
const PX = 70;
const PY = 250;
const PW = GAME_W - 140;
const PH = 250;

interface Dot {
  x: number;
  y: number;
  obj: Phaser.GameObjects.Container;
  done: boolean;
}

/** したえ(0〜1の せいきか座標。じゅんばんに つなぐと 絵に なる)。
    おなじ ばしょを 2かい とおる したえは てんが かさなって タップできなく なるので、
    どの てんも かさならない ように つくる(さいごの てんから 1に もどる せんは じどうで ひく) */
const PICTURES: { name: string; pts: [number, number][] }[] = [
  // さくらじま(やまと けむり)
  { name: 'さくらじま', pts: [[0.1, 0.82], [0.28, 0.45], [0.45, 0.22], [0.62, 0.45], [0.9, 0.82], [0.5, 0.9]] },
  // ねこ
  { name: 'ねこ', pts: [[0.3, 0.32], [0.36, 0.12], [0.46, 0.28], [0.6, 0.28], [0.7, 0.12], [0.76, 0.32], [0.78, 0.7], [0.28, 0.7]] },
  // はなび(8つの とがった ほし)
  { name: 'はなび', pts: [[0.5, 0.1], [0.58, 0.34], [0.82, 0.26], [0.7, 0.48], [0.9, 0.66], [0.62, 0.66], [0.5, 0.9], [0.38, 0.66], [0.1, 0.66], [0.3, 0.48], [0.18, 0.26], [0.42, 0.34]] },
  // さかな
  { name: 'さかな', pts: [[0.18, 0.5], [0.42, 0.28], [0.68, 0.38], [0.86, 0.2], [0.86, 0.8], [0.68, 0.62], [0.42, 0.72]] },
];

export function renderRokugatsudo(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x1f2a4a, 0x1f2a4a, 0x4a3a5a, 0x4a3a5a, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  for (let i = 0; i < 26; i++) {
    bg.fillStyle(0xffffff, 0.4 + Math.random() * 0.5);
    bg.fillCircle(Math.random() * GAME_W, Math.random() * 200, Math.random() * 1.5 + 0.5);
  }
  area.add(bg);
  // じんじゃの さんどう(できた とうろうを かける ところ)
  const rail = scene.add.graphics();
  rail.lineStyle(6, 0x8a6a4a, 1);
  rail.lineBetween(0, 150, GAME_W, 150);
  area.add(rail);
  const hung: Phaser.GameObjects.Container[] = [];

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'rokugatsudo',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- とうろうの かみ ---------- */
  const paper = scene.add.graphics();
  area.add(paper);
  const line = scene.add.graphics();
  area.add(line);
  const title = scene.add
    .text(GAME_W / 2, PY - 34, '', { fontFamily: FONT, fontSize: '16px', color: '#ffe8b0', fontStyle: 'bold' })
    .setOrigin(0.5);
  area.add(title);

  const drawPaper = (): void => {
    paper.clear();
    paper.fillStyle(0xfff4dc, 0.95);
    paper.fillRoundedRect(PX, PY, PW, PH, 10);
    paper.lineStyle(6, 0x8a2f2f, 1);
    paper.strokeRoundedRect(PX, PY, PW, PH, 10);
  };

  const dots: Dot[] = [];
  let picIdx = 0;
  let made = 0;

  const build = (): void => {
    for (const d of dots) d.obj.destroy();
    dots.length = 0;
    line.clear();
    drawPaper();
    const pic = PICTURES[picIdx % PICTURES.length];
    picIdx++;
    title.setText(UI_TEXT.fest.rokuPicture(pic.name));
    for (const [i, [nx, ny]] of pic.pts.entries()) {
      const x = PX + nx * PW;
      const y = PY + ny * PH;
      const c = scene.add.container(x, y);
      const g = scene.add.graphics();
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(0, 0, 15);
      g.lineStyle(2, 0x8a2f2f, 0.8);
      g.strokeCircle(0, 0, 15);
      c.add(g);
      c.add(
        scene.add
          .text(0, 0, `${i + 1}`, { fontFamily: FONT, fontSize: '15px', color: '#8a2f2f', fontStyle: 'bold' })
          .setOrigin(0.5),
      );
      c.setSize(56, 56);
      c.setInteractive({ useHandCursor: true });
      const idx = i;
      c.on('pointerdown', () => tap(idx));
      area.add(c);
      dots.push({ x, y, obj: c, done: false });
      // つぎに おす 点だけに 名まえを つける。あそびかたの ゆびマークが これを 追う
      if (i === 0) c.setName('mg-dot');
    }
  };

  const redrawLine = (): void => {
    line.clear();
    line.lineStyle(5, 0xe05b5b, 0.95);
    let started = false;
    for (const d of dots) {
      if (!d.done) break;
      if (!started) {
        line.beginPath();
        line.moveTo(d.x, d.y);
        started = true;
      } else {
        line.lineTo(d.x, d.y);
      }
    }
    // ぜんぶ つないだら さいごの てんから 1に もどして かたちを とじる
    if (started && dots.every((x) => x.done)) line.lineTo(dots[0].x, dots[0].y);
    if (started) line.strokePath();
  };

  const finish = (): void => {
    made++;
    SFX.fanfare();
    bigImpact(scene, GAME_W / 2, PY + PH / 2 + api.areaY, 0xffd34d);
    confetti(scene, 18);
    session.addPoints(DONE_BONUS, GAME_W / 2, PY + api.areaY - 10, false);
    floatUp(scene, GAME_W / 2, PY + api.areaY - 50, UI_TEXT.fest.rokuDone, '#e0812a');
    // できた とうろうを さんどうに かける
    const t = scene.add.container(50 + ((made - 1) % 6) * 76, 180);
    const g = scene.add.graphics();
    g.fillStyle(0xfff4dc, 1);
    g.fillRoundedRect(-18, -22, 36, 44, 6);
    g.lineStyle(3, 0x8a2f2f, 1);
    g.strokeRoundedRect(-18, -22, 36, 44, 6);
    t.add(g);
    t.add(addIcon(scene, 0, 0, 'lantern:crimson', 20));
    area.add(t);
    hung.push(t);
    scene.tweens.add({ targets: t, y: 188, duration: 900, yoyo: true, repeat: -1 });
    scene.time.delayedCall(800, () => {
      if (!session.isEnded()) build();
    });
  };

  const tap = (i: number): void => {
    if (session.isEnded()) return;
    const nextIdx = dots.findIndex((d) => !d.done);
    if (i !== nextIdx) {
      // じゅんばん ちがい: せんは つながらない
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      floatUp(scene, dots[i].x, dots[i].y + api.areaY - 26, UI_TEXT.fest.rokuOrder(nextIdx + 1), '#c04545');
      return;
    }
    dots[i].done = true;
    // つないだ 点は もう おせない ように する。
    // まえは うすく なる だけで まだ おせた ので、さっき おした ところを
    // 確かめるように もう一度 ふれる = 「じゅんばん ちがい」あつかいで
    // コンボが きれる、という 罰に なって いた
    dots[i].obj.disableInteractive();
    // 名まえを つぎの 点へ わたす(ゆびマークが いつも 「つぎ」を さす ように)
    dots[i].obj.setName('');
    dots.find((d) => !d.done)?.obj.setName('mg-dot');
    SFX.pop();
    impactRing(scene, dots[i].x, dots[i].y + api.areaY, 0xffd34d, 8);
    burst(scene, dots[i].x, dots[i].y + api.areaY, 3, [0xe05b5b, 0xffffff]);
    session.addPoints(DOT_PTS, dots[i].x, dots[i].y + api.areaY - 22);
    // すんだ 点は 「白い まる + すうじ」= ボタンの みため を やめて、
    // せんと 同じ 赤い 点に する(おせない ことが 絵で わかる)
    const done = dots[i].obj;
    for (const child of [...done.list]) child.destroy();
    const dg = scene.add.graphics();
    dg.fillStyle(0x8a2f2f, 1);
    dg.fillCircle(0, 0, 7);
    done.add(dg);
    done.setAlpha(0.85);
    redrawLine();
    if (dots.every((d) => d.done)) finish();
  };

  build();

  const cleanup = (): void => undefined;
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
}

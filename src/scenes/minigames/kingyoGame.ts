/* やない きんぎょちょうちん(やまぐち): 竹ひごの わくに 和紙を はって きんぎょちょうちんを つくる。
   わくの「おび」の 中を ゆびで なぞって のりを つける ゲーム。
   おびから はみ出すと しわに なる(そこは やりなおし。得点は へらない)。
   ひとつの ちょうちんを なぞりきると 色が つき、川に うかんでいく。
   動作=きめられた みちを はみ出さず なぞる(せいみつ トレース)。
   himatsuri(点から点へ ドラッグ)や owara(止めてキープ)とは ちがう てざわり */
import Phaser from 'phaser';
import { addIcon } from '../../ui/icons';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import { offPointerRelease, onPointerRelease } from './input';
import type { MinigameApi } from './types';

const AREA_H = 660;
const CX = GAME_W / 2;
const CY = 380;
/** おびの ひろさ(px。はみ出し はんてい) */
const BAND = 34;
/** チェックポイントの かず */
const POINTS = 22;
const CP_PTS = 5;
const DONE_BONUS = 42;

export function renderKingyo(api: MinigameApi, prompt: string): void {
  const { scene, area } = api;

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0xfdf3d8, 0xfdf3d8, 0xf5e0b8, 0xf5e0b8, 1);
  bg.fillRect(0, 0, GAME_W, AREA_H);
  area.add(bg);
  // できあがった ちょうちんが つるされる バー
  const bar = scene.add.graphics();
  bar.lineStyle(6, 0x8a6a4a, 1);
  bar.lineBetween(0, 130, GAME_W, 130);
  area.add(bar);
  const done: Phaser.GameObjects.Image[] = [];

  api.sign(prompt);
  const session = new ArcadeSession(api, {
    engine: 'kingyo',
    onEnd: () => {
      cleanup();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  /* ---------- きんぎょの わく(なぞる みち) ---------- */
  const guide = scene.add.graphics();
  area.add(guide);
  const ink = scene.add.graphics();
  area.add(ink);
  const fish = addIcon(scene, CX, CY, 'fish:sky', 54).setAlpha(0.18);
  area.add(fish);

  /** きんぎょの かたちの みち(からだの まわり+しっぽ) */
  const path: { x: number; y: number; hit: boolean }[] = [];
  const buildPath = (): void => {
    path.length = 0;
    for (let i = 0; i < POINTS; i++) {
      const t = (i / POINTS) * Math.PI * 2;
      // たまご形の からだ + しっぽの ふくらみ
      const rx = 110 + Math.cos(t * 2) * 8;
      const ry = 74;
      const x = CX + Math.cos(t) * rx;
      const y = CY + Math.sin(t) * ry;
      path.push({ x, y, hit: false });
    }
  };
  buildPath();

  const drawGuide = (): void => {
    guide.clear();
    guide.lineStyle(BAND, 0xd8c69a, 0.55);
    guide.beginPath();
    guide.moveTo(path[0].x, path[0].y);
    for (const p of path.slice(1)) guide.lineTo(p.x, p.y);
    guide.closePath();
    guide.strokePath();
    // つぎに なぞる ところを ひからせる
    const next = path.find((p) => !p.hit);
    if (next) {
      guide.fillStyle(0xffd34d, 0.9);
      guide.fillCircle(next.x, next.y, 12);
    }
    ink.clear();
    ink.lineStyle(BAND - 12, 0xe05b5b, 0.85);
    let started = false;
    for (const p of path) {
      if (!p.hit) {
        started = false;
        continue;
      }
      if (!started) {
        ink.beginPath();
        ink.moveTo(p.x, p.y);
        started = true;
      } else {
        ink.lineTo(p.x, p.y);
      }
      ink.strokePath();
    }
  };
  drawGuide();

  /* ---------- なぞる ---------- */
  let drawing = false;
  let made = 0;

  /** みちから いちばん ちかい てんまでの きょり */
  const nearest = (x: number, y: number): { p: (typeof path)[number]; d: number } => {
    let best = path[0];
    let bd = Infinity;
    for (const p of path) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return { p: best, d: bd };
  };

  const finish = (): void => {
    made++;
    SFX.fanfare();
    bigImpact(scene, CX, CY + api.areaY, 0xe05b5b);
    confetti(scene, 14);
    session.addPoints(DONE_BONUS, CX, CY + api.areaY - 120, false);
    floatUp(scene, CX, CY + api.areaY - 150, UI_TEXT.fest.kingyoDone, '#e0812a');
    // できた ちょうちんを バーに つるす
    const t = addIcon(scene, 40 + ((made - 1) % 6) * 78, 160, 'fish:sky', 34);
    t.setTint(0xe05b5b);
    area.add(t);
    done.push(t);
    scene.tweens.add({ targets: t, y: 172, duration: 900, yoyo: true, repeat: -1 });
    scene.time.delayedCall(700, () => {
      if (session.isEnded()) return;
      buildPath();
      drawGuide();
    });
  };

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded()) return;
    drawing = true;
    void p;
  };

  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!drawing || !p.isDown || session.isEnded()) return;
    const x = p.worldX;
    const y = p.worldY - api.areaY;
    const { p: near, d } = nearest(x, y);
    if (d > BAND) {
      // おびから はみ出した: しわに なる(そこは また なぞりなおし)
      if (near.hit) return;
      SFX.bad();
      missShake(scene);
      session.resetCombo();
      floatUp(scene, x, y + api.areaY - 30, UI_TEXT.fest.kingyoOut, '#c04545');
      drawing = false;
      return;
    }
    if (near.hit) return;
    // じゅんばんに なぞる(とびこしは しない)
    const idx = path.indexOf(near);
    const prev = path[(idx - 1 + path.length) % path.length];
    const first = path.every((q) => !q.hit);
    if (!first && !prev.hit && !path[(idx + 1) % path.length].hit) return;
    near.hit = true;
    SFX.pop();
    burst(scene, near.x, near.y + api.areaY, 3, [0xe05b5b, 0xffffff]);
    session.addPoints(CP_PTS, near.x, near.y + api.areaY - 20);
    fish.setAlpha(0.18 + 0.6 * (path.filter((q) => q.hit).length / path.length));
    drawGuide();
    if (path.every((q) => q.hit)) finish();
  };

  const onUp = (): void => {
    drawing = false;
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

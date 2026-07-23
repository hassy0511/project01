/* つみとり(いちご・まゆ): じゅくした実を おさえて、下に ゆっくり ひっぱる。
   びよ〜ん…と のびて「ぷちっ!」で収穫。はやく ひっぱりすぎると くきが切れて
   実を落としてしまう(コンボが切れるだけ=成功保証)。あおい実は ぷるんと もどるだけ。
   ときどき実る「まぼろしの おおつぶ」(ながく ひっぱる+大得点)が C 要素。
   chain(色の見分け)との違い = 指の「うごかしかた」そのものが本体 */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { bigImpact, burst, confetti, floatUp, impactRing, missShake } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { drawMeadow } from '../../ui/scenery';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const HIT_RADIUS = 42;
const PLUCK_PTS = 10;
const BIG_PTS = 40;
/** ひっぱる距離(px): ふつうの実 / おおつぶ */
const PULL_DIST = 84;
const PULL_DIST_BIG = 150;
/** くき切れ判定: この速さ(px/ms)を超えて引くと切れる。判定窓と発動最低距離 */
const VEL_BREAK = 1.1;
const VEL_WINDOW_MS = 70;
const VEL_MIN_DY = 30;
/** 切れたあと一瞬手が止まる時間 */
const BREAK_STUN_MS = 450;
/** 実の生育サイクル(ms) */
const RIPEN_MIN_MS = 900;
const RIPEN_MAX_MS = 2000;
const RESPAWN_MIN_MS = 600;
const RESPAWN_MAX_MS = 1500;
/** まぼろしの おおつぶ の出現間隔 */
const BIG_EVERY_MS = 12000;
const TINT_UNRIPE = 0x86c26a;

type Stage = 'empty' | 'unripe' | 'ripe';

interface Spot {
  x: number;
  y: number;
  stage: Stage;
  big: boolean;
  obj?: Phaser.GameObjects.Text;
  ring?: Phaser.GameObjects.Arc;
  timer?: Phaser.Time.TimerEvent;
}

export function renderPluck(api: MinigameApi, target: string, prompt: string): void {
  const { scene, area } = api;
  drawMeadow(scene, area, AREA_H);
  api.sign(prompt);

  const session = new ArcadeSession(api, {
    engine: 'pluck',
    onEnd: () => {
      cleanupInput();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  // うねと株: 4列×3株(chain と同じ配置文法。遊びは「ひっぱり」で差別化)
  const spots: Spot[] = [];
  const rowsG = scene.add.graphics();
  for (let r = 0; r < 4; r++) {
    const y = 170 + r * 118;
    rowsG.fillStyle(0xa8895c, 0.55);
    rowsG.fillRoundedRect(30, y + 24, GAME_W - 60, 20, 10);
    for (let c = 0; c < 3; c++) {
      const x = 100 + c * 140 + (r % 2) * 24;
      rowsG.fillStyle(0x5e9c43, 1);
      rowsG.fillEllipse(x, y + 18, 64, 30);
      rowsG.fillStyle(0x7bbf5a, 1);
      rowsG.fillEllipse(x - 14, y + 10, 40, 24);
      rowsG.fillEllipse(x + 16, y + 12, 38, 22);
      spots.push({ x, y, stage: 'empty', big: false });
    }
  }
  area.add(rowsG);
  // ひっぱり中の くき を描くレイヤー
  const stemG = scene.add.graphics();
  area.add(stemG);

  const clearSpot = (s: Spot): void => {
    s.timer?.remove();
    s.ring?.destroy();
    s.obj?.destroy();
    s.obj = undefined;
    s.ring = undefined;
    s.stage = 'empty';
    s.big = false;
  };

  const schedule = (s: Spot, delayMs: number, fn: () => void): void => {
    s.timer = scene.time.delayedCall(delayMs, () => {
      if (!session.isEnded()) fn();
    });
  };

  const sprout = (s: Spot): void => {
    if (session.isEnded()) return;
    s.stage = 'unripe';
    s.obj = scene.add.text(s.x, s.y, target, { fontSize: '34px' }).setOrigin(0.5).setScale(0);
    s.obj.setTint(TINT_UNRIPE);
    area.add(s.obj);
    scene.tweens.add({ targets: s.obj, scale: 0.8, ease: 'Back.easeOut', duration: 260 });
    schedule(s, RIPEN_MIN_MS + Math.random() * (RIPEN_MAX_MS - RIPEN_MIN_MS), () => ripen(s));
  };

  const ripen = (s: Spot): void => {
    if (!s.obj) return;
    s.stage = 'ripe';
    s.obj.clearTint();
    scene.tweens.add({ targets: s.obj, scale: { from: 1.15, to: 1 }, ease: 'Back.easeOut', duration: 220 });
    // ゆらゆら(つみごろの合図)
    scene.tweens.add({ targets: s.obj, angle: { from: -5, to: 5 }, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  };

  /** まぼろしの おおつぶ(C要素): あいている株に きらきらの大玉が実る */
  const spawnBig = (): void => {
    if (session.isEnded()) return;
    // 空き株を優先。なければ熟した実を1つ置きかえる(ゆっくりな子にも必ず出会わせる)
    let pool = spots.filter((s) => s.stage === 'empty');
    if (!pool.length) pool = spots.filter((s) => s.stage === 'ripe' && !s.big && s !== grab?.spot);
    if (pool.length) {
      const s = pool[Math.floor(Math.random() * pool.length)];
      clearSpot(s);
      s.stage = 'ripe';
      s.big = true;
      s.obj = scene.add.text(s.x, s.y - 8, target, { fontSize: '34px' }).setOrigin(0.5).setScale(0);
      area.add(s.obj);
      scene.tweens.add({ targets: s.obj, scale: 1.6, ease: 'Back.easeOut', duration: 400 });
      s.ring = scene.add.circle(s.x, s.y - 8, 40).setStrokeStyle(4, 0xffd34d, 0.9);
      area.add(s.ring);
      scene.tweens.add({ targets: s.ring, scale: { from: 1, to: 1.25 }, alpha: { from: 0.9, to: 0.3 }, duration: 600, yoyo: true, repeat: -1 });
      floatUp(scene, s.x, s.y + api.areaY - 44, UI_TEXT.arcade.bigFruit, '#e0812a');
      SFX.fanfare();
    }
    scene.time.delayedCall(BIG_EVERY_MS, spawnBig);
  };
  scene.time.delayedCall(BIG_EVERY_MS, spawnBig);

  /* ---------- ひっぱり(グラブ)状態 ---------- */
  let grab: { spot: Spot; startY: number; dy: number; t0: number; lastT: number; lastDy: number } | null = null;
  let stunnedUntil = 0;

  const drawStem = (s: Spot, dy: number): void => {
    stemG.clear();
    if (dy <= 0) return;
    const topY = s.y - (s.big ? 30 : 22);
    const fy = s.y + dy * 0.42;
    // のびるほど くきが細くなる=切れそうのサイン
    const need = s.big ? PULL_DIST_BIG : PULL_DIST;
    const w = Math.max(2, 7 - (dy / need) * 5);
    stemG.lineStyle(w, 0x4c7a35, 1);
    stemG.lineBetween(s.x, topY, s.x, fy - 16);
  };

  const releaseVisual = (s: Spot): void => {
    stemG.clear();
    if (!s.obj) return;
    scene.tweens.add({ targets: s.obj, y: s.big ? s.y - 8 : s.y, scaleY: s.big ? 1.6 : 1, scaleX: s.big ? 1.6 : 1, ease: 'Elastic.easeOut', duration: 500 });
  };

  const pop = (s: Spot): void => {
    const { x } = s;
    const wy = (s.obj?.y ?? s.y) + api.areaY;
    const big = s.big;
    SFX.pop();
    if (big) SFX.good();
    impactRing(scene, x, wy, big ? 0xffd34d : 0xffffff, 12);
    burst(scene, x, wy, big ? 14 : 7);
    session.addPoints(big ? BIG_PTS : PLUCK_PTS, x, wy - 24);
    floatUp(scene, x + 44, wy - 6, UI_TEXT.arcade.pluckPop, '#3f7d2c');
    if (big) {
      bigImpact(scene, x, wy - 20);
      confetti(scene, 12);
    }
    const obj = s.obj;
    if (obj) {
      scene.tweens.killTweensOf(obj);
      scene.tweens.add({ targets: obj, y: obj.y - 60, scale: 0.3, alpha: 0, duration: 240, onComplete: () => obj.destroy() });
      s.obj = undefined;
    }
    clearSpot(s);
    schedule(s, RESPAWN_MIN_MS + Math.random() * (RESPAWN_MAX_MS - RESPAWN_MIN_MS), () => sprout(s));
    grab = null;
    stemG.clear();
  };

  const stemBreak = (s: Spot): void => {
    grab = null;
    stemG.clear();
    stunnedUntil = Date.now() + BREAK_STUN_MS;
    session.resetCombo();
    missShake(scene);
    SFX.bad();
    floatUp(scene, s.x, s.y + api.areaY - 30, UI_TEXT.arcade.stemBreak, '#c04545');
    const obj = s.obj;
    if (obj) {
      scene.tweens.killTweensOf(obj);
      // 実が ぽとっと落ちて ころがる(なくすだけ。ペナルティは コンボ切れのみ)
      scene.tweens.add({ targets: obj, y: obj.y + 46, angle: 120, alpha: 0, duration: 500, ease: 'Quad.easeIn', onComplete: () => obj.destroy() });
      s.obj = undefined;
    }
    clearSpot(s);
    schedule(s, RESPAWN_MIN_MS + Math.random() * (RESPAWN_MAX_MS - RESPAWN_MIN_MS), () => sprout(s));
  };

  const onDown = (p: Phaser.Input.Pointer): void => {
    if (session.isEnded() || Date.now() < stunnedUntil) return;
    const py = p.worldY - api.areaY;
    for (const s of spots) {
      if (!s.obj || s.stage === 'empty') continue;
      if (Math.hypot(p.worldX - s.x, py - s.y) > HIT_RADIUS + (s.big ? 14 : 0)) continue;
      if (s.stage === 'ripe') {
        scene.tweens.killTweensOf(s.obj);
        s.obj.setAngle(0);
        const now = Date.now();
        grab = { spot: s, startY: p.worldY, dy: 0, t0: now, lastT: now, lastDy: 0 };
      } else {
        // まだ あおい: ぷるんと ふるえるだけ(ペナルティなし。chain との差)
        scene.tweens.add({ targets: s.obj, angle: { from: -12, to: 12 }, duration: 70, yoyo: true, repeat: 2, onComplete: () => s.obj?.setAngle(0) });
        if (Math.random() < 0.5) floatUp(scene, s.x, s.y + api.areaY - 30, UI_TEXT.arcade.notRipe, '#8a7a62');
      }
      return;
    }
  };

  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!grab || !p.isDown || session.isEnded()) return;
    const s = grab.spot;
    if (!s.obj) {
      grab = null;
      return;
    }
    const need = s.big ? PULL_DIST_BIG : PULL_DIST;
    grab.dy = Phaser.Math.Clamp(p.worldY - grab.startY, 0, need + 20);
    // くき切れ: 短い時間窓での引きの速さで判定(ゆっくりなら ぜったい切れない)
    const now = Date.now();
    if (now - grab.lastT >= VEL_WINDOW_MS) {
      const v = (grab.dy - grab.lastDy) / (now - grab.lastT);
      grab.lastT = now;
      grab.lastDy = grab.dy;
      if (v > VEL_BREAK && grab.dy > VEL_MIN_DY) {
        stemBreak(s);
        return;
      }
    }
    // びよ〜ん: 実が下にのびる
    const base = s.big ? 1.6 : 1;
    s.obj.setY((s.big ? s.y - 8 : s.y) + grab.dy * 0.42);
    s.obj.setScale(base * (1 - grab.dy / 600), base * (1 + grab.dy / 240));
    s.ring?.setY(s.obj.y);
    drawStem(s, grab.dy);
    // 速度判定の窓(70ms)より速く引ききる「超高速ヤンク」も くき切れ扱いにする
    if (grab.dy >= need) {
      if (now - grab.t0 < need / VEL_BREAK) stemBreak(s);
      else pop(s);
    }
  };

  const onUp = (): void => {
    if (!grab) return;
    // とちゅうで はなした: ぷるんと もどるだけ(ペナルティなし)
    releaseVisual(grab.spot);
    grab = null;
  };

  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);
  const cleanupInput = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupInput);

  // 開始: 時間差で実らせる
  spots.forEach((s, i) => schedule(s, i * 240 + Math.random() * 400, () => sprout(s)));
}

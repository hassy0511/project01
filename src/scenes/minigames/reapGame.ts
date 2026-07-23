/* いねかり(こめ・こまつな): 畑の列をなぞって刈る。
   1列を一筆(指を離さず)で刈りきると「ひとふでがり!」ボーナス。
   列には🐸カエルが 刈りラインの上に すわっている(1列に最大2匹)。
   カエルは ぴょんぴょん はねて場所を変えるので、先にタップで逃がすか、
   タイミングを見て なぞるかの判断が入る(まっすぐ引くだけにならない)。
   刈った列は少しずつ生えてくるので、45秒間 刈りつづける */
import Phaser from 'phaser';
import { SFX } from '../../audio/sfx';
import { burst, floatUp, missShake, padHitArea } from '../../ui/effects';
import { UI_TEXT } from '../../data/uiText';
import { GAME_W } from '../../ui/theme';
import { ArcadeSession } from './arcade';
import type { MinigameApi } from './types';

const AREA_H = 660;
const ROWS = 4;
const STALKS_PER_ROW = 6;
const ROW_Y0 = 180;
const ROW_GAP = 122;
const CUT_RADIUS = 34;
const STALK_PTS = 3;
const ROW_BONUS = 20;
const REGROW_MS = 1600;
/** カエル: 1匹目/2匹目が列に座っている基本確率(+進行で上がる) */
const FROG_CHANCE_1 = 0.6;
const FROG_CHANCE_2 = 0.2;
const FROG_CHANCE_RAMP = 0.35;
/** カエルに触れた時のかたまり時間と当たり判定 */
const FROG_STUN_MS = 650;
const FROG_RADIUS = 36;
/** カエルが はねて場所を変える間隔(ms) */
const FROG_HOP_MIN_MS = 1200;
const FROG_HOP_MAX_MS = 2200;
/** とり: 初回・出現間隔・飛行時間(進行で速くなる) */
const BIRD_FIRST_MS = 4500;
const BIRD_MIN_MS = 6000;
const BIRD_MAX_MS = 9000;
const BIRD_FLY_FROM_MS = 1700;
const BIRD_FLY_TO_MS = 1100;

interface Stalk {
  obj: Phaser.GameObjects.Text;
  alive: boolean;
  strokeId: number; // どの一筆で刈られたか
}

interface Frog {
  obj: Phaser.GameObjects.Text;
  row: number;
  col: number;
  hopTimer?: Phaser.Time.TimerEvent;
}

export function renderReap(api: MinigameApi, targetEmoji: string, prompt: string): void {
  const { scene, area } = api;
  // たんぼ背景: 空+水を張った田(横縞)
  const g = scene.add.graphics();
  g.fillGradientStyle(0xaee3f7, 0xaee3f7, 0xd7efc3, 0xd7efc3, 1);
  g.fillRect(0, 0, GAME_W, 130);
  g.fillGradientStyle(0x9fd0b5, 0x9fd0b5, 0x7fbf9c, 0x7fbf9c, 1);
  g.fillRect(0, 130, GAME_W, AREA_H - 130);
  for (let r = 0; r < ROWS; r++) {
    const y = ROW_Y0 + r * ROW_GAP;
    g.fillStyle(0x6faf8b, 0.8);
    g.fillRoundedRect(16, y + 20, GAME_W - 32, 16, 8);
    g.fillStyle(0xbfe3d1, 0.5);
    g.fillRoundedRect(16, y + 40, GAME_W - 32, 6, 3);
  }
  area.add(g);
  api.sign(prompt);

  const session = new ArcadeSession(api, {
    engine: 'reap',
    onEnd: () => {
      cleanupInput();
      api.addScore(session.score);
      api.advance(400);
    },
  });

  const rows: Stalk[][] = [];
  const frogs: Frog[] = [];
  const stalkX = (c: number): number => 62 + c * ((GAME_W - 124) / (STALKS_PER_ROW - 1));

  const removeFrog = (f: Frog, jumpDx: number): void => {
    const idx = frogs.indexOf(f);
    if (idx >= 0) frogs.splice(idx, 1);
    f.hopTimer?.remove();
    f.obj.disableInteractive();
    // ぴょんと放物線でにげる
    scene.tweens.add({ targets: f.obj, x: f.obj.x + jumpDx, duration: 500, ease: 'Sine.easeOut' });
    scene.tweens.add({
      targets: f.obj,
      y: f.obj.y - 70,
      duration: 250,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => scene.tweens.add({ targets: f.obj, alpha: 0, duration: 200, onComplete: () => f.obj.destroy() }),
    });
    SFX.pop();
  };

  /** カエルの すわる高さ = 刈りラインの上(なぞりの通り道をふさぐ) */
  const frogY = (r: number): number => ROW_Y0 + r * ROW_GAP - 12;

  /** ぴょんと同じ列の別の場所へ はねる(定期的に呼ばれる) */
  const hopFrog = (f: Frog): void => {
    if (session.isEnded() || !f.obj.active) return;
    let next = Math.floor(Math.random() * STALKS_PER_ROW);
    if (next === f.col) next = (next + 1 + Math.floor(Math.random() * (STALKS_PER_ROW - 1))) % STALKS_PER_ROW;
    f.col = next;
    scene.tweens.add({ targets: f.obj, x: stalkX(next), duration: 360, ease: 'Sine.easeInOut' });
    scene.tweens.add({
      targets: f.obj,
      y: frogY(f.row) - 46,
      duration: 180,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => f.obj.setY(frogY(f.row)),
    });
    scheduleHop(f);
  };

  const scheduleHop = (f: Frog): void => {
    f.hopTimer = scene.time.delayedCall(
      FROG_HOP_MIN_MS + Math.random() * (FROG_HOP_MAX_MS - FROG_HOP_MIN_MS),
      () => hopFrog(f),
    );
  };

  const placeFrog = (r: number, col: number): void => {
    const obj = scene.add.text(stalkX(col), frogY(r), '🐸', { fontSize: '30px' }).setOrigin(0.5);
    padHitArea(obj, 10); // タップで逃がしやすく(子供の指)
    area.add(obj);
    const frog: Frog = { obj, row: r, col };
    frogs.push(frog);
    scheduleHop(frog);
    // タップで先に逃がせる(ペナルティなし)
    obj.on('pointerdown', () => {
      if (session.isEnded() || !obj.active) return;
      scene.tweens.killTweensOf(obj);
      removeFrog(frog, (Math.random() < 0.5 ? -1 : 1) * 120);
    });
  };

  /** 列にカエルを配置: 1匹目はほぼ確実、2匹目は進行に応じて(列あたり最大2匹) */
  const placeFrogs = (r: number): void => {
    const p = session.progress();
    const existing = frogs.filter((f) => f.row === r).length;
    const cols = shufflePick(STALKS_PER_ROW);
    if (existing < 1 && Math.random() < FROG_CHANCE_1 + p * FROG_CHANCE_RAMP) placeFrog(r, cols[0]);
    if (existing < 2 && Math.random() < FROG_CHANCE_2 + p * FROG_CHANCE_RAMP) placeFrog(r, cols[1]);
  };

  /** 0..n-1 をシャッフルした配列(かぶらない列選びに使う) */
  const shufflePick = (n: number): number[] => {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const plantRow = (r: number, animate: boolean): void => {
    const y = ROW_Y0 + r * ROW_GAP;
    rows[r] = [];
    for (let c = 0; c < STALKS_PER_ROW; c++) {
      const obj = scene.add.text(stalkX(c), y, targetEmoji, { fontSize: '36px' }).setOrigin(0.5, 0.8);
      area.add(obj);
      if (animate) {
        obj.setScale(0);
        scene.tweens.add({ targets: obj, scale: 1, ease: 'Back.easeOut', duration: 300, delay: c * 60 });
      }
      scene.tweens.add({
        targets: obj,
        angle: { from: -4, to: 4 },
        duration: 900 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      rows[r].push({ obj, alive: true, strokeId: -1 });
    }
    placeFrogs(r);
  };
  for (let r = 0; r < ROWS; r++) plantRow(r, false);

  /* ---------- とり(挙動の違う邪魔いきもの)
     カエル=なぞりの通り道の「通せんぼ」/ とり=時間制限つきの「よこどり」。
     横から飛んできて 稲を1本くわえて にげる。飛んでいるあいだに タップすれば阻止。
     ぬすまれても 稲が1本へるだけ(コンボは切れない=成功保証) ---------- */
  let birdTimer: Phaser.Time.TimerEvent | undefined;
  const scheduleBird = (delayMs?: number): void => {
    birdTimer = scene.time.delayedCall(
      delayMs ?? BIRD_MIN_MS + Math.random() * (BIRD_MAX_MS - BIRD_MIN_MS),
      spawnBird,
    );
  };
  const spawnBird = (): void => {
    if (session.isEnded()) return;
    const targets: { r: number; st: Stalk }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (const st of rows[r] ?? []) if (st.alive && st.obj.active) targets.push({ r, st });
    }
    if (!targets.length) {
      scheduleBird(1200);
      return;
    }
    const { r, st } = targets[Math.floor(Math.random() * targets.length)];
    const fromLeft = Math.random() < 0.5;
    const bird = scene.add
      .text(fromLeft ? -40 : GAME_W + 40, frogY(r) - 130, '🐦', { fontSize: '32px' })
      .setOrigin(0.5);
    bird.setFlipX(!fromLeft);
    padHitArea(bird, 12);
    area.add(bird);
    floatUp(scene, fromLeft ? 70 : GAME_W - 70, frogY(r) + api.areaY - 130, UI_TEXT.arcade.birdCome, '#c04545');
    // はばたき
    scene.tweens.add({ targets: bird, angle: { from: -8, to: 8 }, duration: 160, yoyo: true, repeat: -1 });
    let stopped = false;
    const flee = (): void => {
      scene.tweens.killTweensOf(bird);
      bird.disableInteractive();
      scene.tweens.add({
        targets: bird,
        y: bird.y - 170,
        x: bird.x + (fromLeft ? -90 : 90),
        alpha: 0,
        duration: 450,
        ease: 'Quad.easeIn',
        onComplete: () => bird.destroy(),
      });
    };
    // タップで阻止(ぬすまれる前なら いつでも)
    bird.on('pointerdown', () => {
      if (stopped || session.isEnded()) return;
      stopped = true;
      SFX.pop();
      burst(scene, bird.x, bird.y + api.areaY, 5, [0x9ad0f5, 0xffffff]);
      floatUp(scene, bird.x, bird.y + api.areaY - 26, UI_TEXT.arcade.birdSafe, '#3f7d2c');
      flee();
    });
    scene.tweens.add({
      targets: bird,
      x: st.obj.x,
      y: st.obj.y - 26,
      duration: Phaser.Math.Linear(BIRD_FLY_FROM_MS, BIRD_FLY_TO_MS, session.progress()),
      ease: 'Sine.easeIn',
      onComplete: () => {
        if (stopped) return;
        stopped = true;
        // ねらった稲が もう刈られていたら 手ぶらで帰る
        if (session.isEnded() || !st.alive || !st.obj.active) {
          flee();
          return;
        }
        st.alive = false;
        scene.tweens.killTweensOf(st.obj);
        scene.tweens.killTweensOf(bird);
        bird.disableInteractive();
        SFX.bad();
        floatUp(scene, st.obj.x, st.obj.y + api.areaY - 44, UI_TEXT.arcade.birdSteal, '#c04545');
        scene.tweens.add({
          targets: [bird, st.obj],
          y: '-=190',
          x: fromLeft ? '-=110' : '+=110',
          alpha: 0,
          duration: 600,
          ease: 'Quad.easeIn',
          onComplete: () => {
            bird.destroy();
            st.obj.destroy();
          },
        });
        // ぬすまれて列が からになったら 生やしなおす(ひとふでボーナスは付かない)
        if (rows[r].every((x) => !x.alive)) {
          scene.time.delayedCall(REGROW_MS, () => {
            if (!session.isEnded()) plantRow(r, true);
          });
        }
      },
    });
    scheduleBird();
  };
  scheduleBird(BIRD_FIRST_MS);

  let strokeId = 0;
  let strokeActive = false;

  let stunnedUntil = 0;

  const cutAt = (px: number, py: number): void => {
    if (session.isEnded() || Date.now() < stunnedUntil) return;
    const y = py - api.areaY;
    // なぞりの途中でカエルに触れた: びっくりして一筆が途切れる+しばらく かたまる
    if (strokeActive) {
      for (const f of frogs) {
        if (!f.obj.active) continue;
        if (Math.hypot(px - f.obj.x, y - f.obj.y) < FROG_RADIUS) {
          strokeActive = false;
          stunnedUntil = Date.now() + FROG_STUN_MS;
          session.resetCombo();
          missShake(scene);
          SFX.bad();
          floatUp(scene, f.obj.x, f.obj.y + api.areaY - 26, UI_TEXT.arcade.miss, '#c04545');
          scene.tweens.killTweensOf(f.obj);
          removeFrog(f, (Math.random() < 0.5 ? -1 : 1) * 140);
          return;
        }
      }
    }
    for (let r = 0; r < ROWS; r++) {
      const rowY = ROW_Y0 + r * ROW_GAP;
      if (Math.abs(y - rowY + 12) > 44) continue;
      for (const st of rows[r]) {
        if (!st.alive || Math.abs(px - st.obj.x) > CUT_RADIUS || Math.abs(y - st.obj.y) > 46) continue;
        st.alive = false;
        st.strokeId = strokeId;
        SFX.pop();
        burst(scene, st.obj.x, st.obj.y + api.areaY - 14, 5, [0xffd34d, 0xe8c66a, 0xbfa14a]);
        session.addPoints(STALK_PTS, st.obj.x, st.obj.y + api.areaY - 30);
        scene.tweens.killTweensOf(st.obj);
        // 刈った稲は横に倒れて消える
        scene.tweens.add({
          targets: st.obj,
          angle: 80,
          y: st.obj.y + 14,
          alpha: 0,
          duration: 320,
          onComplete: () => st.obj.destroy(),
        });
        // 列を刈りきった?
        if (rows[r].every((x) => !x.alive)) {
          const oneStroke = rows[r].every((x) => x.strokeId === strokeId);
          if (oneStroke) {
            session.addPoints(ROW_BONUS, GAME_W / 2, rowY + api.areaY - 40, false);
            floatUp(scene, GAME_W / 2, rowY + api.areaY - 66, UI_TEXT.arcade.cleanRow, '#3f7d2c');
            SFX.good();
          }
          scene.time.delayedCall(REGROW_MS, () => {
            if (!session.isEnded()) plantRow(r, true);
          });
        }
      }
    }
  };

  let lastTrail: { x: number; y: number } | null = null;
  const onDown = (p: Phaser.Input.Pointer): void => {
    strokeId++;
    strokeActive = true;
    lastTrail = { x: p.worldX, y: p.worldY };
    cutAt(p.worldX, p.worldY);
  };
  const onMove = (p: Phaser.Input.Pointer): void => {
    if (!p.isDown || !strokeActive) return;
    cutAt(p.worldX, p.worldY);
    // 鎌の軌跡: 指のあとを ひとすじの光が追いかける
    if (lastTrail) {
      const seg = scene.add.graphics();
      seg.lineStyle(7, 0xffffff, 0.6);
      seg.lineBetween(lastTrail.x, lastTrail.y - api.areaY, p.worldX, p.worldY - api.areaY);
      area.add(seg);
      scene.tweens.add({ targets: seg, alpha: 0, duration: 230, onComplete: () => seg.destroy() });
    }
    lastTrail = { x: p.worldX, y: p.worldY };
  };
  const onUp = (): void => {
    strokeActive = false;
    lastTrail = null;
  };
  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);
  const cleanupInput = (): void => {
    scene.input.off('pointerdown', onDown);
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
    birdTimer?.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupInput);
}

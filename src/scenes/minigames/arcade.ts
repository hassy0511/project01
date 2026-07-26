/* アーケード共通フレームワーク: 制限時間・スコア・コンボ倍率・HUD・終了処理。
   各ミニゲームは ArcadeSession を作り、addPoints/breakCombo を呼ぶだけでよい */
import Phaser from 'phaser';
import { comboMultiplier } from '../../core/stars';
import { scaledDuration, type ArcadeEngine } from '../../data/arcadeTuning';
import { setHook } from '../../game/testHooks';
import { UI_TEXT } from '../../data/uiText';
import { SFX } from '../../audio/sfx';
import { fillBar, floatUp } from '../../ui/effects';
import { FONT, GAME_W, TEXT_COLORS } from '../../ui/theme';
import type { MinigameApi } from './types';

const HUD_H = 44;

/** 「?」で あそびかたを 開いた/とじた の しらせ(ui/howto.ts が 出す)。
   文字列を 2か所に 書かない ように ここで もつ */
export const HELP_OPEN = 'mq-help-open';
export const HELP_CLOSE = 'mq-help-close';

export interface ArcadeOpts {
  engine: ArcadeEngine;
  /** 残り時間わずか(5秒)で毎秒鳴らすかどうか */
  onEnd: () => void;
}

export class ArcadeSession {
  readonly scene: Phaser.Scene;
  readonly area: Phaser.GameObjects.Container;
  private engine: ArcadeEngine;
  private durationSec: number;
  private startedAt: number;
  private ended = false;

  score = 0;
  combo = 0;
  private lastHitAt = 0;
  /** 「?」で あそびかたを 読んでいる あいだ(0 = 読んでいない)。
      読んでいる うちに 時間切れに なるのは かわいそう なので 時計を 止める */
  private pausedAt = 0;

  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private timerFill!: Phaser.GameObjects.Graphics;
  private timerLabel!: Phaser.GameObjects.Text;
  private onEnd: () => void;

  /** コンボが切れるまでの猶予(ms) */
  static readonly COMBO_TIMEOUT_MS = 2600;

  constructor(api: MinigameApi, opts: ArcadeOpts) {
    this.scene = api.scene;
    this.area = api.area;
    this.engine = opts.engine;
    this.onEnd = opts.onEnd;
    this.durationSec = scaledDuration(opts.engine);
    this.startedAt = Date.now();
    this.buildHud();
    setHook({ kind: 'arcade', engine: this.engine, score: 0, secLeft: this.durationSec });

    // あそびかたを 見ている あいだは 時計を 止める(ui/howto.ts の 「?」が しらせる)
    this.scene.events.on(HELP_OPEN, this.onHelpOpen, this);
    this.scene.events.on(HELP_CLOSE, this.onHelpClose, this);

    const tick = this.scene.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (this.ended) {
          tick.remove();
          return;
        }
        if (this.pausedAt) return; // あそびかたを 読んでいる あいだは すすめない
        const left = this.secLeft();
        this.drawTimer(left / this.durationSec);
        this.timerLabel.setText(`${Math.ceil(left)}`);
        if (this.combo > 0 && Date.now() - this.lastHitAt > ArcadeSession.COMBO_TIMEOUT_MS) this.resetCombo();
        setHook({ kind: 'arcade', engine: this.engine, score: this.score, secLeft: left });
        if (left <= 0) this.finish();
      },
    });
  }

  private onHelpOpen(): void {
    if (!this.ended && !this.pausedAt) this.pausedAt = Date.now();
  }

  private onHelpClose(): void {
    if (!this.pausedAt) return;
    // 止まって いた ぶんだけ 「はじまり」を 後ろに ずらす
    this.startedAt += Date.now() - this.pausedAt;
    this.lastHitAt += Date.now() - this.pausedAt;
    this.pausedAt = 0;
  }

  secLeft(): number {
    return Math.max(0, this.durationSec - (Date.now() - this.startedAt) / 1000);
  }

  /** 経過率 0→1(難易度の escalation 用) */
  progress(): number {
    return Phaser.Math.Clamp((Date.now() - this.startedAt) / 1000 / this.durationSec, 0, 1);
  }

  isEnded(): boolean {
    return this.ended;
  }

  private buildHud(): void {
    const g = this.scene.add.graphics();
    g.fillStyle(0xffffff, 0.75);
    g.fillRoundedRect(10, 4, GAME_W - 20, HUD_H, 12);
    this.area.add(g);

    this.scoreText = this.scene.add
      .text(24, 4 + HUD_H / 2, UI_TEXT.arcade.score(0), {
        fontFamily: FONT,
        fontSize: '18px',
        color: TEXT_COLORS.main,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.area.add(this.scoreText);

    this.comboText = this.scene.add
      .text(GAME_W / 2 + 30, 4 + HUD_H / 2, '', {
        fontFamily: FONT,
        fontSize: '15px',
        color: TEXT_COLORS.accent,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.area.add(this.comboText);

    // タイマー(右側の帯+残り秒)
    const barX = GAME_W - 150;
    const barBg = this.scene.add.graphics();
    barBg.fillStyle(0xe6e0d0, 1);
    barBg.fillRoundedRect(barX, 4 + HUD_H / 2 - 7, 100, 14, 7);
    this.area.add(barBg);
    this.timerFill = this.scene.add.graphics();
    this.area.add(this.timerFill);
    this.drawTimer(1);
    this.timerLabel = this.scene.add
      .text(GAME_W - 26, 4 + HUD_H / 2, `${this.durationSec}`, {
        fontFamily: FONT,
        fontSize: '16px',
        color: TEXT_COLORS.main,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.area.add(this.timerLabel);
  }

  private drawTimer(ratio: number): void {
    const barX = GAME_W - 150;
    this.timerFill.clear();
    this.timerFill.fillStyle(ratio < 0.2 ? 0xe05b5b : 0x6fbf44, 1);
    fillBar(this.timerFill, barX, 4 + HUD_H / 2 - 7, 100 * ratio, 14, 7);
  }

  /**
   * 得点を加算する(コンボ倍率込み)。実際に加算された点を返す。
   * useCombo=false のゲーム(採掘・フリック等)は素点のまま加算する
   */
  addPoints(base: number, x: number, y: number, useCombo = true): number {
    let pts = base;
    if (useCombo) {
      this.combo++;
      this.lastHitAt = Date.now();
      const mult = comboMultiplier(this.combo);
      pts = base * mult;
      if (mult >= 2) {
        this.comboText.setText(UI_TEXT.arcade.combo(this.combo, mult));
        this.scene.tweens.add({ targets: this.comboText, scale: { from: 1.3, to: 1 }, duration: 160 });
      }
    }
    this.score += pts;
    this.scoreText.setText(UI_TEXT.arcade.score(this.score));
    this.scene.tweens.add({ targets: this.scoreText, scale: { from: 1.18, to: 1 }, duration: 140 });
    floatUp(this.scene, x, y, `+${pts}`);
    return pts;
  }

  /** コンボを切る(ミス時) */
  resetCombo(): void {
    this.combo = 0;
    this.comboText.setText('');
  }

  /** 時間切れ or ゲーム側の完了で呼ぶ。二重呼び出しは無視 */
  finish(): void {
    if (this.ended) return;
    this.ended = true;
    this.scene.events.off(HELP_OPEN, this.onHelpOpen, this);
    this.scene.events.off(HELP_CLOSE, this.onHelpClose, this);
    SFX.fanfare();
    const banner = this.scene.add
      .text(GAME_W / 2, 200, UI_TEXT.arcade.timeUp, {
        fontFamily: FONT,
        fontSize: '34px',
        color: TEXT_COLORS.accent,
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScale(0);
    this.area.add(banner);
    this.scene.tweens.add({ targets: banner, scale: 1, ease: 'Back.easeOut', duration: 320 });
    this.scene.time.delayedCall(1000, () => this.onEnd());
  }
}

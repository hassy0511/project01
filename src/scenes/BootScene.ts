/* 起動: セーブ読み込み・地図データ取得・管理者API登録 → MapScene へ */
import Phaser from 'phaser';
import { UI_TEXT } from '../data/uiText';
import { loadMapAsset } from '../game/mapData';
import { installAdminApi, store } from '../game/store';
import { FONT, GAME_H, GAME_W, TEXT_COLORS, COLORS } from '../ui/theme';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.ground);
    this.add
      .text(GAME_W / 2, GAME_H / 2, `🐤\n${UI_TEXT.loading}`, {
        fontFamily: FONT,
        fontSize: '22px',
        color: TEXT_COLORS.main,
        align: 'center',
      })
      .setOrigin(0.5);

    store.load();
    installAdminApi(() => this.game.events.emit('mq-refresh'));

    loadMapAsset(import.meta.env.BASE_URL)
      // はじめての起動は 導入ストーリー(スキップ可)から。以降は地図へ直行
      .then(() => this.scene.start(store.state.flags.introSeen ? 'MapScene' : 'StoryScene'))
      .catch((err: unknown) => {
        this.add
          .text(GAME_W / 2, GAME_H / 2 + 60, String(err), {
            fontFamily: FONT,
            fontSize: '13px',
            color: TEXT_COLORS.bad,
            wordWrap: { width: 400 },
          })
          .setOrigin(0.5);
      });
  }
}

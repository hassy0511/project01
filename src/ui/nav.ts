/* 下部ナビ(ちず/ずかん/もちもの)+ ヘッダー + せってい(管理者⏩・保護者ゲートリセット) */
import Phaser from 'phaser';
import { GAME_DATA } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { store } from '../game/store';
import { isMuted, setMuted, SFX } from '../audio/sfx';
import { COLORS, DEPTH, FONT, GAME_H, GAME_W, TEXT_COLORS } from './theme';
import { Modal, showToast } from './widgets';

export const NAV_H = 72;
export const HEADER_H = 56;

export type NavKey = 'map' | 'zukan' | 'inv';

const NAV_SCENES: Record<NavKey, string> = { map: 'MapScene', zukan: 'ZukanScene', inv: 'InvScene' };

/** ずかん進捗(集めた数/総数) */
export function zukanProgress(): { got: number; total: number } {
  const s = store.state;
  const got = Object.keys(s.zukanMat).length + Object.keys(s.zukanProd).length + s.fest.length;
  const total = GAME_DATA.materials.length + GAME_DATA.recipes.length;
  return { got, total };
}

/** 画面上部ヘッダー(タイトル+ずかんカウント) */
export function buildHeader(scene: Phaser.Scene): void {
  const c = scene.add.container(0, 0).setDepth(DEPTH.header);
  const bg = scene.add.rectangle(GAME_W / 2, HEADER_H / 2, GAME_W, HEADER_H, COLORS.headerBg);
  const title = scene.add
    .text(16, HEADER_H / 2, `🐤 ${GAME_DATA.meta.title}`, {
      fontFamily: FONT,
      fontSize: '19px',
      color: TEXT_COLORS.main,
      fontStyle: 'bold',
    })
    .setOrigin(0, 0.5);
  const { got, total } = zukanProgress();
  const count = scene.add
    .text(GAME_W - 16, HEADER_H / 2, UI_TEXT.zukanCount(got, total), {
      fontFamily: FONT,
      fontSize: '14px',
      color: TEXT_COLORS.sub,
    })
    .setOrigin(1, 0.5);
  c.add([bg, title, count]);
}

/** 画面下部ナビバー */
export function buildNav(scene: Phaser.Scene, active: NavKey): void {
  const c = scene.add.container(0, GAME_H - NAV_H).setDepth(DEPTH.nav);
  const bg = scene.add.rectangle(GAME_W / 2, NAV_H / 2, GAME_W, NAV_H, COLORS.navBg);
  bg.setStrokeStyle(2, COLORS.panelLine);
  c.add(bg);

  const entries: { key: NavKey; label: string; emoji: string }[] = [
    { key: 'map', label: UI_TEXT.nav.map, emoji: '🗾' },
    { key: 'zukan', label: UI_TEXT.nav.zukan, emoji: '📖' },
    { key: 'inv', label: UI_TEXT.nav.inv, emoji: '🎒' },
  ];
  entries.forEach((e, i) => {
    const x = 70 + i * 110;
    const isActive = e.key === active;
    const t = scene.add
      .text(x, NAV_H / 2, `${e.emoji}\n${e.label}`, {
        fontFamily: FONT,
        fontSize: '14px',
        color: isActive ? TEXT_COLORS.good : TEXT_COLORS.sub,
        align: 'center',
        fontStyle: isActive ? 'bold' : 'normal',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    t.on('pointerup', () => {
      if (e.key !== active) scene.scene.start(NAV_SCENES[e.key]);
    });
    c.add(t);
  });

  const snd = scene.add
    .text(GAME_W - 100, NAV_H / 2, isMuted() ? '🔇' : '🔊', { fontSize: '26px' })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  snd.on('pointerup', () => {
    setMuted(!isMuted());
    snd.setText(isMuted() ? '🔇' : '🔊');
    if (!isMuted()) SFX.good();
  });
  c.add(snd);

  const gear = scene.add
    .text(GAME_W - 44, NAV_H / 2, '⚙️', { fontSize: '26px' })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  gear.on('pointerup', () => openSettings(scene));
  c.add(gear);
}

/** せってい: 管理者⏩まんたん + 保護者ゲート(足し算)つきリセット */
export function openSettings(scene: Phaser.Scene): void {
  const modal = new Modal(scene, UI_TEXT.settings.title, true);
  modal.addText(UI_TEXT.settings.version(GAME_DATA.meta.version), 14, TEXT_COLORS.sub);
  modal.addButton(
    UI_TEXT.settings.boostBtn,
    COLORS.orange,
    () => {
      window.__mqAdmin?.boostAll();
      modal.close();
      showToast(scene, UI_TEXT.settings.boosted);
    },
    380,
    48,
  );
  modal.addButton(
    UI_TEXT.settings.unlockBtn,
    COLORS.orange,
    () => {
      window.__mqAdmin?.unlockAll();
      modal.close();
      showToast(scene, UI_TEXT.settings.unlocked);
    },
    380,
    48,
  );
  modal.addButton(
    UI_TEXT.settings.resetBtn,
    COLORS.gray,
    () => {
      const a = 2 + Math.floor(Math.random() * 7);
      const b = 2 + Math.floor(Math.random() * 7);
      const ans = window.prompt(UI_TEXT.settings.parentGate(a, b));
      if (ans !== null && parseInt(ans, 10) === a + b) {
        if (window.confirm(UI_TEXT.settings.resetConfirm)) {
          store.reset();
          modal.close();
          scene.scene.start('MapScene');
          showToast(scene, UI_TEXT.settings.resetDone);
        }
      } else if (ans !== null) {
        showToast(scene, UI_TEXT.settings.wrongAnswer);
      }
    },
    380,
    48,
  );
  modal.show();
}

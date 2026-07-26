/* 下部ナビ(ちず/ずかん/もちもの)+ ヘッダー + せってい(管理者⏩・保護者ゲートリセット) */
import Phaser from 'phaser';
import { GAME_DATA } from '../data/gameData';
import { UI_TEXT } from '../data/uiText';
import { store } from '../game/store';
import { isMuted, setMuted, SFX } from '../audio/sfx';
import { COLORS, DEPTH, FONT, GAME_H, GAME_W, TEXT_COLORS } from './theme';
import { addIcon, setIcon } from './icons';
import { Modal, showToast } from './widgets';
import { showParentGate } from './parentGate';

export const NAV_H = 72;
export const HEADER_H = 56;

/** ナビの アイコン・文字の 大きさ(ベタ書き きんし) */
const NAV_ICON = 26;
const NAV_ICON_Y = 26;
const NAV_LABEL_Y = 48;
const NAV_TOOL_ICON = 30;

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
  const pikke = addIcon(scene, 28, HEADER_H / 2, 'chick:amber', 34);
  const title = scene.add
    .text(50, HEADER_H / 2, GAME_DATA.meta.title, {
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
  c.add([bg, pikke, title, count]);
}

/** 画面下部ナビバー */
export function buildNav(scene: Phaser.Scene, active: NavKey): void {
  const c = scene.add.container(0, GAME_H - NAV_H).setDepth(DEPTH.nav);
  const bg = scene.add.rectangle(GAME_W / 2, NAV_H / 2, GAME_W, NAV_H, COLORS.navBg);
  bg.setStrokeStyle(2, COLORS.panelLine);
  c.add(bg);

  const entries: { key: NavKey; label: string; icon: string; iconOff: string }[] = [
    { key: 'map', label: UI_TEXT.nav.map, icon: 'pin:red', iconOff: 'pin:gray' },
    { key: 'zukan', label: UI_TEXT.nav.zukan, icon: 'book:teal', iconOff: 'book:gray' },
    { key: 'inv', label: UI_TEXT.nav.inv, icon: 'bag:brown', iconOff: 'bag:gray' },
  ];
  entries.forEach((e, i) => {
    const x = 70 + i * 110;
    const isActive = e.key === active;
    const icon = addIcon(scene, x, NAV_ICON_Y, isActive ? e.icon : e.iconOff, NAV_ICON);
    const t = scene.add
      .text(x, NAV_LABEL_Y, e.label, {
        fontFamily: FONT,
        fontSize: '14px',
        color: isActive ? TEXT_COLORS.good : TEXT_COLORS.sub,
        align: 'center',
        fontStyle: isActive ? 'bold' : 'normal',
      })
      .setOrigin(0.5);
    // アイコンと 文字を まとめて おせる ように、見えない あたり判定を かぶせる
    const hit = scene.add.zone(x, NAV_H / 2, 92, NAV_H - 8).setInteractive({ useHandCursor: true });
    hit.on('pointerup', () => {
      if (e.key !== active) scene.scene.start(NAV_SCENES[e.key]);
    });
    c.add([icon, t, hit]);
  });

  const sndIcon = (): string => (isMuted() ? 'sound-off:gray' : 'sound-on:navy');
  const snd = addIcon(scene, GAME_W - 100, NAV_H / 2, sndIcon(), NAV_TOOL_ICON).setInteractive({
    useHandCursor: true,
  });
  snd.on('pointerup', () => {
    setMuted(!isMuted());
    setIcon(snd, sndIcon());
    if (!isMuted()) SFX.good();
  });
  c.add(snd);

  const gear = addIcon(scene, GAME_W - 44, NAV_H / 2, 'gear:gray', NAV_TOOL_ICON).setInteractive({
    useHandCursor: true,
  });
  gear.on('pointerup', () => openSettings(scene));
  c.add(gear);
}

/** せってい(子供も開ける): 情報表示+「おうちのひとメニュー」入口のみ。
    管理者機能・リセットは保護者ゲート(ui/parentGate.ts)の先に置く */
export function openSettings(scene: Phaser.Scene): void {
  const modal = new Modal(scene, UI_TEXT.settings.title, true);
  modal.addText(UI_TEXT.settings.version(GAME_DATA.meta.version), 14, TEXT_COLORS.sub);
  // 音が でない という 相談が いちばん 多いので、せってい に 直接 ヒントを 出す
  modal.addText(isMuted() ? UI_TEXT.settings.soundOff : UI_TEXT.settings.soundOn, 14, TEXT_COLORS.accent);
  modal.addText(`${UI_TEXT.settings.soundHintTitle}\n${UI_TEXT.settings.soundHint}`, 12, TEXT_COLORS.sub);
  modal.addButton(
    UI_TEXT.settings.parentMenuBtn,
    COLORS.gray,
    () => {
      modal.close();
      showParentGate(scene, () => openParentMenu(scene));
    },
    380,
    48,
  );
  modal.show();
}

/** 保護者メニュー(ゲートの先): 動作確認用の管理者機能+ポリシー+リセット */
function openParentMenu(scene: Phaser.Scene): void {
  const modal = new Modal(scene, UI_TEXT.settings.parentTitle, true);
  modal.addText(UI_TEXT.settings.parentInfo(GAME_DATA.meta.version), 13, TEXT_COLORS.sub);
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
    UI_TEXT.settings.privacyBtn,
    COLORS.primary,
    () => {
      modal.close();
      openPrivacy(scene);
    },
    380,
    48,
  );
  modal.addButton(
    UI_TEXT.settings.resetBtn,
    COLORS.gray,
    () => {
      modal.close();
      openResetConfirm(scene);
    },
    380,
    48,
  );
  modal.show();
}

function openPrivacy(scene: Phaser.Scene): void {
  const modal = new Modal(scene, UI_TEXT.settings.privacyTitle, true);
  modal.addText(UI_TEXT.settings.privacyBody, 13, TEXT_COLORS.main);
  modal.addButton(UI_TEXT.settings.close, COLORS.primary, () => modal.close());
  modal.show();
}

function openResetConfirm(scene: Phaser.Scene): void {
  const modal = new Modal(scene, UI_TEXT.settings.resetTitle, true);
  modal.addText(UI_TEXT.settings.resetConfirm, 15, TEXT_COLORS.main);
  modal.addButton(
    UI_TEXT.settings.resetYes,
    COLORS.gray,
    () => {
      store.reset();
      modal.close();
      scene.scene.start('MapScene');
      showToast(scene, UI_TEXT.settings.resetDone);
    },
    380,
    48,
  );
  modal.addButton(UI_TEXT.settings.resetNo, COLORS.primary, () => modal.close(), 380, 48);
  modal.show();
}

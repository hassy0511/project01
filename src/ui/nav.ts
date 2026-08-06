/* 下部ナビ(ちず/ずかん/もちもの)+ ヘッダー + せってい(管理者の 早送り・保護者ゲートリセット) */
import Phaser from 'phaser';
import { GAME_DATA } from '../data/gameData';
import { earnedKazari } from '../core/orders';
import { backupFileName, exportBackup, importBackup } from '../core/backup';
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

/** ずかん進捗(集めた数/総数)。ちゅうもんの おれい(かざり)も ずかんの あつめもの */
export function zukanProgress(): { got: number; total: number } {
  const s = store.state;
  const got =
    Object.keys(s.zukanMat).length +
    Object.keys(s.zukanProd).length +
    s.fest.length +
    earnedKazari(s, GAME_DATA).length;
  const total = GAME_DATA.materials.length + GAME_DATA.recipes.length + GAME_DATA.kazari.length;
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

/** 「おした 指が その ボタンの 上で はなれた とき」だけ うごく ボタンに する。
    Phaser の pointerup は 「はなした ときに 上に あった もの」で 発火する ので、
    一覧を スクロールした 指が ナビの 上で はなれると ずかんが かってに ひらいて いた
    (子供の 実機で 度々 おきた)。pointerdown も 同じ ボタンで 始まって いる ことを 見る */
export function onPress(obj: Phaser.GameObjects.GameObject, handler: () => void): void {
  let armed = false;
  obj.on('pointerdown', () => {
    armed = true;
  });
  obj.on('pointerout', () => {
    armed = false;
  });
  obj.on('pointerup', () => {
    if (!armed) return;
    armed = false;
    handler();
  });
}

/** ナビで ねむらせた シーンの 目ざめかた:
    ねむって いる あいだに セーブが 変わって いたら 作りなおし(restart)、
    変わって いなければ そのまま 目ざめる(= 一瞬で もどれる)。
    ナビの ある シーンの create() で よぶ。restart で SHUTDOWN が 走ると
    ききみみは はずれ、つぎの create() が あたらしい 番号で つけなおす */
export function rebuildOnWakeIfChanged(scene: Phaser.Scene, data: () => object = () => ({})): void {
  const builtRev = store.rev;
  const onWake = (): void => {
    if (store.rev !== builtRev) scene.scene.restart(data());
  };
  scene.events.on(Phaser.Scenes.Events.WAKE, onWake);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.WAKE, onWake);
  });
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
    onPress(hit, () => {
      // start でなく switch: いまの シーンを こわさず ねむらせ、行き先が ねむって
      // いれば そのまま 起こす。ずかん(セル505個)や もちものを ひらく たびに
      // ぜんぶ 作りなおして いたのが、ふるい iPad で 「行ったり来たりで 固まる」
      // 原因だった(子供の 実機で 報告)。作りなおしは 目ざめた ときに セーブが
      // 変わって いた とき だけ(rebuildOnWakeIfChanged)
      if (e.key !== active) scene.scene.switch(NAV_SCENES[e.key]);
    });
    c.add([icon, t, hit]);
  });

  const sndIcon = (): string => (isMuted() ? 'sound-off:gray' : 'sound-on:navy');
  // name は E2E から アイコンを 見つける ための 目じるし(画面には 出ない)
  const snd = addIcon(scene, GAME_W - 100, NAV_H / 2, sndIcon(), NAV_TOOL_ICON)
    .setName('nav-sound')
    .setInteractive({ useHandCursor: true });
  onPress(snd, () => {
    setMuted(!isMuted());
    setIcon(snd, sndIcon());
    if (!isMuted()) SFX.good();
  });
  c.add(snd);

  const gear = addIcon(scene, GAME_W - 44, NAV_H / 2, 'gear:gray', NAV_TOOL_ICON)
    .setName('nav-gear')
    .setInteractive({ useHandCursor: true });
  onPress(gear, () => openSettings(scene));
  c.add(gear);
}

/** せってい(子供も開ける): 情報表示+「おうちのひとメニュー」入口のみ。
    管理者機能・リセットは保護者ゲート(ui/parentGate.ts)の先に置く */
export function openSettings(scene: Phaser.Scene): void {
  const modal = new Modal(scene, UI_TEXT.settings.title, true);
  modal.addText(UI_TEXT.settings.version(GAME_DATA.meta.version), 14, TEXT_COLORS.sub);
  // おもいで: 導入の おはなしは いつでも、エンディングは 見たあとから 見かえせる
  modal.addButton(
    UI_TEXT.settings.omoideBtn,
    COLORS.primary,
    () => {
      modal.close();
      openOmoide(scene);
    },
    380,
    48,
  );
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

/** おもいで: ストーリーの 見かえし。エンディングは クリア後に ふえる */
function openOmoide(scene: Phaser.Scene): void {
  const modal = new Modal(scene, UI_TEXT.settings.omoideBtn, true);
  modal.addButton(
    UI_TEXT.story.introTitle,
    COLORS.primary,
    () => {
      modal.close();
      scene.scene.start('StoryScene', { mode: 'intro', replay: true });
    },
    380,
    48,
  );
  if (store.state.flags.endingSeen) {
    modal.addButton(
      UI_TEXT.story.endingTitle,
      COLORS.orange,
      () => {
        modal.close();
        scene.scene.start('StoryScene', { mode: 'ending', replay: true });
      },
      380,
      48,
    );
  }
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
    UI_TEXT.settings.backupBtn,
    COLORS.primary,
    () => {
      downloadBackup();
      modal.close();
      showToast(scene, UI_TEXT.settings.backupDone);
    },
    380,
    48,
  );
  modal.addButton(
    UI_TEXT.settings.restoreBtn,
    COLORS.primary,
    () => {
      modal.close();
      pickBackupFile(scene);
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

/* --- セーブの バックアップ(保護者メニュー)。
   端末の localStorage は ブラウザの データ消去や 機種変えで きえる ので、
   ファイルに のこして いつでも もどせる ように する(docs/STORE_REVIEW.md ST-2)。
   封筒の 形と 検証は core/backup.ts(純ロジック・テストずみ)に ある --- */

/** いまの セーブを JSON ファイルとして ダウンロードする */
function downloadBackup(): void {
  const blob = new Blob([exportBackup(store.state, Date.now())], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName(new Date());
  a.click();
  // すぐ revoke すると iOS Safari で ダウンロードが 空に なる ことが ある ため 少し まつ
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** ファイルを えらんで もらい、確認の うえで セーブを 置きかえる */
function pickBackupFile(scene: Phaser.Scene): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    void file.text().then((text) => {
      const result = importBackup(text);
      if (!result.ok) {
        showToast(scene, result.reason === 'notOurs' ? UI_TEXT.settings.restoreBadFile : UI_TEXT.settings.restoreBroken);
        return;
      }
      const modal = new Modal(scene, UI_TEXT.settings.restoreTitle, true);
      const d = result.at ? new Date(result.at).toLocaleDateString('ja-JP') : '?';
      modal.addText(UI_TEXT.settings.restoreConfirm(d), 15, TEXT_COLORS.main);
      modal.addButton(
        UI_TEXT.settings.restoreYes,
        COLORS.gray,
        () => {
          store.state = result.save;
          store.save();
          modal.close();
          scene.scene.start('MapScene');
          showToast(scene, UI_TEXT.settings.restoreDone);
        },
        380,
        48,
      );
      modal.addButton(UI_TEXT.settings.resetNo, COLORS.primary, () => modal.close(), 380, 48);
      modal.show();
    });
  };
  input.click();
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

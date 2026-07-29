/* セーブ状態のシングルトンストア(シーンから使う薄いラッパ)。
   ロジックは core/ の純関数に委譲し、ここでは保持と保存だけを担う */
import { GAME_DATA } from '../data/gameData';
import { runtimeTuning } from '../data/arcadeTuning';
import { hitStop } from '../ui/effects';
import { boostAll, halfGrow } from '../core/plots';
import {
  adminUnlockAll,
  defaultState,
  hareFlagKey,
  loadState,
  regionCompFlagKey,
  regionOpenFlagKey,
  saveState,
  type SaveState,
} from '../core/state';

class Store {
  state: SaveState = defaultState();

  load(): void {
    this.state = loadState(localStorage);
  }

  save(): void {
    saveState(this.state, localStorage);
  }

  reset(): void {
    this.state = defaultState();
    this.save();
  }
}

export const store = new Store();

/** E2E むけの ストーリー抑止。
    E2E は おまつりを 何本も 連続で あそぶ ので、そのたび 地図で
    晴れシネマ(入力を 数秒 とめる)が 走ると ぜんぶの 台本が こわれる。
    skipGuides で 立てる。
    ★セーブ(SAVE_KEY)とは べつの キーに おく:
      - 台本は とちゅうで page.goto(フルリロード)する ので、
        実行時変数だけ だと そこで きえて シネマが 走りだす(実際に おきた)
      - セーブに まぜると ほんものの データに テスト用の しるしが まざる
    テストは さいしょに localStorage.clear() する ので、まいかい まっさらに もどる */
const STORY_MUTE_KEY = 'meisanquest-mute-story';
export const runtimeStory = {
  muted: typeof localStorage !== 'undefined' && localStorage.getItem(STORY_MUTE_KEY) === '1',
};

declare global {
  interface Window {
    __mqAdmin?: {
      boostAll: () => void;
      halfGrow: () => void;
      fastMode: (scale?: number) => void;
      unlockAll: () => void;
      skipGuides: () => void;
      fest: (prefId: string) => void;
      festAllButOne: () => void;
      hitStopTest: () => { paused: boolean; tweenScale: number } | null;
    };
  }
}

/** コンソールAPI __mqAdmin(⏩まんたん / ぜんぶ解放 / おせわ検証 / E2E用の時間短縮)を公開する */
export function installAdminApi(onChange: () => void): void {
  window.__mqAdmin = {
    boostAll: () => {
      boostAll(store.state, GAME_DATA, Date.now());
      store.save();
      onChange();
    },
    halfGrow: () => {
      halfGrow(store.state, GAME_DATA, Date.now());
      store.save();
      onChange();
    },
    // E2E の 時間短縮。scale を わたせば もとの はやさ(1)に もどせる
    // (ゆびマークの 5びょう など、実時間の しくみを ためす とき に つかう)
    fastMode: (scale = 8) => {
      runtimeTuning.timeScale = scale;
    },
    unlockAll: () => {
      adminUnlockAll(store.state, GAME_DATA);
      store.save();
      onChange();
    },
    // あそびかたの 案内を 見たことに する(E2E で じゃまに ならない ように)。
    // 晴れシネマ・エリア演出・エンディングも ここで とめる(runtimeStory)
    skipGuides: () => {
      store.state.seenPrefGuide = true;
      runtimeStory.muted = true;
      localStorage.setItem(STORY_MUTE_KEY, '1');
      store.save();
    },
    // その県の おまつりを 1回 ひらいた ことに する(晴れシネマの E2E 用)。
    // シネマの 既読フラグは 立てない ので、つぎに 地図を ひらくと シネマが 走る
    fest: (prefId: string) => {
      const p = GAME_DATA.prefectures.find((x) => x.id === prefId);
      if (!p?.festivalId) return;
      if (!store.state.unlocked.includes(p.id)) store.state.unlocked.push(p.id);
      if (!store.state.fest.includes(p.festivalId)) store.state.fest.push(p.festivalId);
      // ほんものの あそびと 同じ 副作用に そろえる:
      // エリア解放は festBest の 種類数で 数える ので、ここも つけておく
      store.state.festBest[p.festivalId] ??= 1;
      store.save();
      onChange();
    },
    // 46県ぶんを 晴れた ことに して(シネマ既読も 立てる)、
    // さいごの 1県(いばらき)だけ のこす ── エンディングの E2E 用
    festAllButOne: () => {
      const actives = GAME_DATA.prefectures.filter((x) => x.active && x.festivalId);
      for (const p of actives.slice(1)) {
        if (!store.state.unlocked.includes(p.id)) store.state.unlocked.push(p.id);
        if (p.festivalId && !store.state.fest.includes(p.festivalId)) store.state.fest.push(p.festivalId);
        if (p.festivalId) store.state.festBest[p.festivalId] ??= 1;
        store.state.flags[hareFlagKey(p.id)] = true;
      }
      for (const r of GAME_DATA.regions) {
        store.state.flags[regionOpenFlagKey(r.id)] = true;
        store.state.flags[regionCompFlagKey(r.id)] = true;
      }
      // さいごの 1県が ある エリアの コンプは まだ
      const last = actives[0];
      delete store.state.flags[regionCompFlagKey(last.region)];
      store.state.flags.introSeen = true;
      store.save();
      onChange();
    },
    // 「でかい一撃の 間」(hitStop)を その場で 出す。
    // ど真ん中・金の実は 運しだい なので、固まりの 回帰テストは ここから 叩く。
    // かえす: そのとき シーンが 止まって いないか / トゥイーンの はやさ
    hitStopTest: () => {
      const scene = window.__game?.scene.getScenes(true)[0];
      if (!scene) return null;
      hitStop(scene, 70);
      return { paused: scene.scene.isPaused(), tweenScale: scene.tweens.timeScale };
    },
  };
}

/* セーブ状態のシングルトンストア(シーンから使う薄いラッパ)。
   ロジックは core/ の純関数に委譲し、ここでは保持と保存だけを担う */
import { GAME_DATA } from '../data/gameData';
import { boostAll, halfGrow } from '../core/plots';
import { defaultState, loadState, saveState, type SaveState } from '../core/state';

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

declare global {
  interface Window {
    __mqAdmin?: { boostAll: () => void; halfGrow: () => void };
  }
}

/** コンソールAPI __mqAdmin.boostAll() / halfGrow()(おせわチャンス検証用)を公開する */
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
  };
}

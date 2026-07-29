/* 固まりの さいごの とりで(ウォッチドッグ)。

   固まる 原因は 見つけしだい 1つずつ 直す。けれど あそぶのは 4〜8さいの 子供で、
   「なにを した ときに 止まった」を 説明できない し、大人が 見ていない ことも 多い。
   なので 原因が わからない 固まりからも 自力で 立ち直れる ように しておく。

   見はる もの:
     1. シーンが なぜか 止まったまま(PAUSED)に なって いないか
        → 1.5びょう つづいたら その場で 起こす。
          Phaser の scene.pause()/resume() は キュー ごしで、
          「たのんだ つもりで きいて いない」が 起きうる ので、
          ここでは キューを 通さない sys.resume() で 直に 起こす。
     2. 画面を 見ている のに 1コマも 進んで いないか
        → ゲームループが 死んで いる(update の 中で 例外が 出ると こうなる)。
          セーブは 済んで いる ので、読みこみ直して 地図まで もどす。
          なんども くりかえさない ように 1回の あそびで 3かいまで。

   どちらも ふだんは なにも しない。console に あとを のこすので、
   おかしな ことが 起きたら ここを 見れば わかる。 */
import Phaser from 'phaser';

/** シーンが 止まったままで 許す 時間(ms)。「?」の 説明などは シーンを 止めない */
const STUCK_PAUSE_MS = 1500;
/** 画面を 見ている のに コマが 進まないで 許す 時間(ms) */
const DEAD_LOOP_MS = 4000;
/** 見はる 間かく(ms) */
const TICK_MS = 500;
/** 1回の あそびで 読みこみ直す 上限(こわれ続ける ときに 無限ループに しない) */
const MAX_RELOADS = 3;
const RELOAD_KEY = 'meisanquest-watchdog-reloads';

const reloadCount = (): number => {
  try {
    return Number(sessionStorage.getItem(RELOAD_KEY) ?? '0');
  } catch {
    return MAX_RELOADS; // つかえない ときは 読みこみ直しを あきらめる
  }
};

export function installWatchdog(game: Phaser.Game): void {
  /** シーンごとの 「いつから 止まって いるか」 */
  const pausedSince = new Map<string, number>();
  let lastFrame = -1;
  let lastFrameAt = Date.now();

  // 画面に もどった 直後は コマが 進んで いなくて あたりまえ。数えなおす
  document.addEventListener('visibilitychange', () => {
    lastFrame = -1;
    lastFrameAt = Date.now();
  });

  setInterval(() => {
    const now = Date.now();

    // 1. 止まったままの シーンを 起こす
    for (const s of game.scene.scenes) {
      const key = s.scene.key;
      if (s.sys.settings.status !== Phaser.Scenes.PAUSED) {
        pausedSince.delete(key);
        continue;
      }
      const since = pausedSince.get(key) ?? now;
      pausedSince.set(key, since);
      if (now - since >= STUCK_PAUSE_MS) {
        console.warn(`[watchdog] シーンが 止まったままなので 起こす: ${key}`);
        pausedSince.delete(key);
        s.sys.resume();
      }
    }

    // 2. ゲームループが 生きて いるか(画面を 見ている ときだけ)
    if (document.hidden) {
      lastFrame = -1;
      lastFrameAt = now;
      return;
    }
    const frame = game.loop.frame;
    if (frame !== lastFrame) {
      lastFrame = frame;
      lastFrameAt = now;
      return;
    }
    if (now - lastFrameAt < DEAD_LOOP_MS) return;
    const n = reloadCount();
    if (n >= MAX_RELOADS) {
      console.error('[watchdog] ゲームループが 止まっている(読みこみ直しの 上限に 達した)');
      lastFrameAt = now; // 何度も 出さない
      return;
    }
    console.error('[watchdog] ゲームループが 止まっているので 読みこみ直す');
    try {
      sessionStorage.setItem(RELOAD_KEY, String(n + 1));
    } catch {
      /* noop */
    }
    location.reload();
  }, TICK_MS);
}

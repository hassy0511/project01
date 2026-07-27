/* ながおし・ドラッグの「指を はなした」を とりこぼさない ための ちいさな しくみ。

   Phaser の 'pointerup' は キャンバスの 中で はなした ときだけ とんでくる。
   子供は 画面の ふちを こえて 指を うごかしがち なので、そのまま だと
     ・ゆかけ(ゆを ためる ながおし)が ためっぱなしで とまる
     ・つなひき・おわら・ろくろ などが 「ずっと おしている」ことに なる
   という 固まりかたを する。
   キャンバスの そとで はなした とき('pointerupoutside')と、
   ポインタが キャンバスから 出た とき('gameout')も ひろって、
   どの ゲームでも かならず はなした ことに する。

   ★'gameout' だけは Pointer を わたして こない。
     そのまま つなぐと うけとる 側で p が undefined に なり、
     p.worldX を 読んだ ところで NaN が 走りだす。
     じっさいに フリックが 「二度と みが 出ない」状態に なっていた
     (画面の そとへ 指を 出す → power=NaN → とんだ ことにも ならず 固まる)。
     なので gameout は つつんで、いまの ポインタを わたす。 */
import Phaser from 'phaser';

type Release = (p: Phaser.Input.Pointer) => void;

/** gameout 用に つつんだ ものを おぼえておく(はずす とき 同じ 関数を わたす ため) */
const wrapped = new WeakMap<Release, Release>();

/** 指を はなした ことを うけとる(そとで はなしても・そとへ 出ても とどく) */
export function onPointerRelease(scene: Phaser.Scene, fn: Release): void {
  scene.input.on(Phaser.Input.Events.POINTER_UP, fn);
  scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, fn);
  // gameout は ひきすうが ない ので、いまの ポインタを つめて わたす
  const out: Release = () => fn(scene.input.activePointer);
  wrapped.set(fn, out);
  scene.input.on(Phaser.Input.Events.GAME_OUT, out);
}

/** onPointerRelease で つけた ものを はずす(シーンを かたづける とき) */
export function offPointerRelease(scene: Phaser.Scene, fn: Release): void {
  scene.input.off(Phaser.Input.Events.POINTER_UP, fn);
  scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, fn);
  const out = wrapped.get(fn);
  if (out) {
    scene.input.off(Phaser.Input.Events.GAME_OUT, out);
    wrapped.delete(fn);
  }
}

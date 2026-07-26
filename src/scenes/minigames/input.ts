/* ながおし・ドラッグの「指を はなした」を とりこぼさない ための ちいさな しくみ。

   Phaser の 'pointerup' は キャンバスの 中で はなした ときだけ とんでくる。
   子供は 画面の ふちを こえて 指を うごかしがち なので、そのまま だと
     ・ゆかけ(ゆを ためる ながおし)が ためっぱなしで とまる
     ・つなひき・おわら・ろくろ などが 「ずっと おしている」ことに なる
   という 固まりかたを する。
   キャンバスの そとで はなした とき('pointerupoutside')と、
   ポインタが キャンバスから 出た とき('gameout')も ひろって、
   どの ゲームでも かならず はなした ことに する。 */
import Phaser from 'phaser';

/** 指を はなした ことを うけとる(そとで はなしても・そとへ 出ても とどく) */
export function onPointerRelease(scene: Phaser.Scene, fn: (p: Phaser.Input.Pointer) => void): void {
  scene.input.on(Phaser.Input.Events.POINTER_UP, fn);
  scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, fn);
  scene.input.on(Phaser.Input.Events.GAME_OUT, fn);
}

/** onPointerRelease で つけた ものを はずす(シーンを かたづける とき) */
export function offPointerRelease(scene: Phaser.Scene, fn: (p: Phaser.Input.Pointer) => void): void {
  scene.input.off(Phaser.Input.Events.POINTER_UP, fn);
  scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, fn);
  scene.input.off(Phaser.Input.Events.GAME_OUT, fn);
}

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

/* ゆびごとの おぼえがき。

   ドラッグや スワイプを 見る ゲームは 「おしはじめの ばしょ」や
   「まえの ばしょ」を おぼえて おく 必要が ある。
   これを シーンで 1つの へんすうに して しまうと、
   2本目の ゆびが おりた しゅんかんに 1本目の きろくが うわがきされ、

     ・ありもしない スワイプに なる(ふくおとこ: 2本指タップで こける)
     ・ドラッグの むきが めちゃくちゃに なる(おうぎみこし)
     ・かたほうの ゆびを はなすと もう かたほうも 死ぬ(いねかり)

   という「同時に つかうと こわれる」ゲームに なる。
   子供は 平気で 2本 3本 つかうので、ゆびごと(p.id ごと)に わけて おぼえる。

   Phaser 側の 同時タッチ数は main.ts の input.activePointers で ふやして ある。 */
export class PerPointer<T> {
  private readonly byId = new Map<number, T>();

  set(p: Phaser.Input.Pointer, v: T): void {
    this.byId.set(p.id, v);
  }

  get(p: Phaser.Input.Pointer): T | undefined {
    return this.byId.get(p.id);
  }

  /** よみだして わすれる(その ゆびを はなした とき) */
  take(p: Phaser.Input.Pointer): T | undefined {
    const v = this.byId.get(p.id);
    this.byId.delete(p.id);
    return v;
  }

  /** その ゆびの きろくだけ すてる(なぞりが とぎれた とき など) */
  drop(p: Phaser.Input.Pointer): void {
    this.byId.delete(p.id);
  }
}

/* =====================================================
   あそびかたの 「ゆびマーク」データ。

   4〜8歳は 字が 読めない。だから 説明を 読ませるのでは なく、
   **半とうめいの ゆびが 実際の 操作を やって みせる**。
   ここには 「どんな 動きを して みせるか」だけを 書く。
   絵を 出すのは src/ui/howto.ts の 1つの 関数(コードに ゲームごとの 分岐は 書かない)。

   ざひょうは **ゲームの area の 中の ばしょ**(theme の GAME_AREA_Y だけ 下に ずれた
   コンテナの ローカル座標)。ミニゲームの コードが つかっている ものさしと 同じなので、
   ゲームの 定数(ROW_Y0 など)を そのまま 写せる。
   ===================================================== */

/** 画面の ばしょ [よこ, たて] */
export type Pt = readonly [number, number];

export type HowTo =
  /** きまった ばしょを 順に トン、トン */
  | { readonly kind: 'tap'; readonly at: readonly Pt[] }
  /** うごく ものを トン(setName した 名まえで さがす。うごきに ついていく) */
  | { readonly kind: 'tapTarget'; readonly name: string }
  /** すーっと なぞる */
  | { readonly kind: 'drag'; readonly from: Pt; readonly to: Pt }
  /** うごく ものを つかんで ひっぱる(名まえで さがし、そこから dx,dy だけ 動かす) */
  | { readonly kind: 'dragTarget'; readonly name: string; readonly dx?: number; readonly dy?: number }
  /** おしたまま まつ */
  | { readonly kind: 'hold'; readonly at: Pt; readonly ms: number }
  /** さっと はじく */
  | { readonly kind: 'swipe'; readonly at: Pt; readonly dir: 'up' | 'down' | 'left' | 'right' }
  /** ぐるっと まわす */
  | { readonly kind: 'circle'; readonly at: Pt; readonly r: number }
  /** 2つの ばしょを こうごに トン、トン */
  | { readonly kind: 'alternate'; readonly at: readonly [Pt, Pt] };

/* -----------------------------------------------------
   しゅうかくゲーム(12エンジン)。
   キーは arcadeTuning の ArcadeEngine 名。
   ----------------------------------------------------- */
export const HOW_TO: Record<string, HowTo> = {
  /** すいり掘り: マスを タップして 掘りすすむ(mineGame の originX/originY = 56/229) */
  mine: { kind: 'tap', at: [[56, 229], [148, 229]] },
  /** キャッチ: かごを よこに 動かして 落ちてくる みを うける(BASKET_Y=590) */
  catch: { kind: 'drag', from: [140, 590], to: [340, 590] },
  /** つながり つみ: おなじ いろの みを 順に タップ */
  chain: { kind: 'tapTarget', name: 'mg-fruit' },
  /** いねかり: いねの 上を なぞって かる(ROW_Y0=180、stalkX は 62〜418) */
  reap: { kind: 'drag', from: [62, 180], to: [418, 180] },
  /** つみとり: みを つかんで そっと 下に ひっぱる */
  pluck: { kind: 'dragTarget', name: 'mg-target', dy: 70 },
  /** リズムづみ: わくに かさなった しゅんかんに タップ(TARGET_X=118, LEAF_Y=330) */
  rhythm: { kind: 'tap', at: [[118, 330]] },
  /** ゆきはらい: ゆきの 上を よこに なぞって はらう(spots の 1れつめ y=190) */
  sweep: { kind: 'drag', from: [80, 190], to: [400, 190] },
  /** すくいあげ: ざるを よこに 動かして ながれてくる ものを うける(ZARU_Y=380) */
  scoop: { kind: 'drag', from: [140, 380], to: [340, 380] },
  /** かいむき: まず ロープを つかんで 上に ひきあげる(START_Y=600 → DECK_Y=250) */
  shell: { kind: 'drag', from: [240, 590], to: [240, 300] },
  /** フリック: したから うえへ さっと はじく(START_Y=580) */
  flick: { kind: 'swipe', at: [240, 580], dir: 'up' },
  /** つりあげ: うきが しずんだ しゅんかんに タップ */
  fish: { kind: 'tapTarget', name: 'mg-target' },
  /** おせわ(むしとり): やってきた むしを タップ */
  care: { kind: 'tapTarget', name: 'mg-pest' },
};

/** その ゲームの ゆびマークが あるか */
export const hasHowTo = (key: string): boolean => key in HOW_TO;

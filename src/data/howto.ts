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

  /* ---------------------------------------------------
     おまつりゲーム(47本)。
     ざひょうは E2E の 台本(点が 入る ことを たしかめた 動き)から 写した もの。
     台本が 画面ぜんたいの y を つかって いる ところは 52 を ひいて area の 中に なおす。
     --------------------------------------------------- */

  /** やたいラッシュ: ほしい しなものの やたいを タップ */
  yatai: { kind: 'tap', at: [[110, 572], [240, 572], [370, 572]] },
  /** だるま つみ: ゆれる だるまを タップで おとす */
  daruma: { kind: 'tap', at: [[240, 168]] },
  /** はなび: わっかが かさなった ときに タップ */
  hanabi: { kind: 'tap', at: [[240, 320]] },
  /** だし引き: つなを タップれんだで ひく */
  dashi: { kind: 'tap', at: [[240, 590], [240, 590]] },
  /** みこし: かたむいた ほうの はんたいがわを おして バランスを とる */
  mikoshi: { kind: 'alternate', at: [[120, 470], [360, 470]] },
  /** ろくろ: わくに あわせて うつわを かたちづくる */
  rokuro: { kind: 'tap', at: [[240, 380]] },
  /** 操船: ふねを よこに 動かして ゲートを くぐる */
  sousen: { kind: 'drag', from: [140, 500], to: [340, 500] },
  /** ねぶた: わっかが かさなった ときに タップ */
  nebuta: { kind: 'tap', at: [[240, 470]] },
  /** さんさおどり: ひだり・みぎの たいこを こうごに たたく */
  sansa: { kind: 'alternate', at: [[140, 520], [340, 520]] },
  /** たなばた: かざりを つかんで フックまで はこぶ */
  tanabata: { kind: 'drag', from: [120, 600], to: [120, 300] },
  /** かんとう: さおの したを よこに 動かして ささえる */
  kantou: { kind: 'drag', from: [180, 608], to: [300, 608] },
  /** はながさ: かさを ぐるっと まわす */
  hanagasa: { kind: 'circle', at: [240, 340], r: 70 },
  /** わらじ: ひだり・みぎを こうごに おして あゆむ */
  waraji: { kind: 'alternate', at: [[130, 580], [350, 580]] },
  /** ゆきまつり: 「けずる」マスを タップ。
      1れつめの はしの 2マスは 3つの 型 ぜんぶで '.'(=けずる)なので、
      どの ゆきぞうでも 正しい 手本に なる。
      まえは (0,1) を さして いたが そこは 'X'(=ぞうの ぶぶん。叩くと ミス)だった */
  yukimatsuri: { kind: 'tap', at: [[92, 207], [388, 207]] },
  /** みんよう: お手本と おなじ ボタンを 順に おす */
  minyou: { kind: 'tap', at: [[70, 560], [185, 560]] },
  /** おわら: ひかる わに ゆびを おいたまま ついていく */
  owara: { kind: 'hold', at: [240, 250], ms: 1500 },
  /** とうろう: とうろうを そっと おして ながす */
  tourou: { kind: 'drag', from: [240, 554], to: [240, 354] },
  /** かに: あしに 出る わっかを タップして わり、もう一度 タップで みを とる。
      わっかは あしの 上(x=60〜130 / 350〜420)に 出る。かにの まん中には 何も ない */
  kani: { kind: 'tapTarget', name: 'mg-spot' },
  /** ひまつり: たいまつの 上を なぞって ひを うつす */
  himatsuri: { kind: 'drag', from: [120, 250], to: [360, 250] },
  /** おんばしら: ひだり・みぎを こうごに おして 木を すすめる */
  onbashira: { kind: 'alternate', at: [[120, 348], [360, 348]] },
  /** からくり: ひかった ボタンを おす */
  karakuri: { kind: 'tap', at: [[90, 470], [180, 470]] },
  /** たこあげ: おしたまま いとを のばす */
  tako: { kind: 'hold', at: [240, 348], ms: 900 },
  /** まきわら: ひかった ちょうちんを 順に タップ */
  makiwara: { kind: 'tap', at: [[240, 377], [134, 404]] },
  /** いしどり: かねと たいこを こうごに たたく */
  ishidori: { kind: 'alternate', at: [[145, 400], [335, 400]] },
  /** かぶき: あいずが きたら タップ */
  kabuki: { kind: 'tap', at: [[240, 548]] },
  /** ぎおん: たけを しいて、やまほこを ぐるっと まわす */
  gion: { kind: 'tap', at: [[180, 478], [240, 478], [300, 478]] },
  /** だんじり: めもりが ゾーンに きたら タップ */
  danjiri: { kind: 'tap', at: [[240, 568]] },
  /** ふくおとこ: したから うえへ はじいて はしる */
  fukuotoko: { kind: 'swipe', at: [240, 548], dir: 'up' },
  /** やまやき: ひの となりを なぞって もやす */
  yamayaki: { kind: 'drag', from: [75, 548], to: [405, 548] },
  /** おうぎ: たいまつを 上下に ふる */
  ougi: { kind: 'drag', from: [240, 470], to: [240, 380] },
  /** しゃんしゃん: あいずの ときだけ かさを タップ */
  shanshan: { kind: 'tap', at: [[240, 568]] },
  /** かぐら: やじるしの ほうへ はじく */
  kagura: { kind: 'swipe', at: [240, 568], dir: 'up' },
  /** えよう: しんぎを うばいに タップ */
  eyou: { kind: 'tapTarget', name: 'mg-shingi' },
  /** べっちゃー: にげる 子を タップ */
  betcha: { kind: 'tapTarget', name: 'mg-kid' },
  /** きんぎょちょうちん: ちょうちんを ぐるっと まわす */
  kingyo: { kind: 'circle', at: [240, 380], r: 90 },
  /** あわおどり: ながれてくる ふしに あわせて タップ */
  awaodori: { kind: 'tap', at: [[240, 568]] },
  /** ちょうさ: 4つの かたを 順に タップして かつぐ */
  chousa: { kind: 'tap', at: [[90, 470], [190, 470], [290, 470], [390, 470]] },
  /** うしおに: あたまを つかんで ゲートへ 向ける */
  ushioni: { kind: 'dragTarget', name: 'mg-head', dx: 80 },
  /** よさこい: あいずの かずだけ タップ */
  yosakoi: { kind: 'tap', at: [[240, 568], [240, 568]] },
  /** やまかさ: タップれんだで はしり、ときどき かつぎ手を こうたい */
  yamakasa: { kind: 'tap', at: [[240, 250], [240, 250]] },
  /** ねつききゅう: バーナーを おしたまま 上へ */
  balloon: { kind: 'hold', at: [115, 620], ms: 800 },
  /** こっこでしょ: なげ上げて、うけとめる(2回 タップ) */
  kokkodesho: { kind: 'tap', at: [[240, 248], [240, 248]] },
  /** かざりうま: すすむ ボタンを おす */
  kazariuma: { kind: 'tap', at: [[240, 610]] },
  /** ゆかけ: おしたまま おゆを かける(あつめの ときは 長め) */
  yukake: { kind: 'hold', at: [240, 648], ms: 1200 },
  /** ひょっとこ: あいずの おめんを タップ */
  hyottoko: { kind: 'tap', at: [[90, 440], [240, 440], [390, 440]] },
  /** ろくがつどう: すうじの ある てんを 順に タップ。
      てんは 絵ごとに ばしょが かわる ので、「つぎに おす てん」を 名まえで 追う */
  rokugatsudo: { kind: 'tapTarget', name: 'mg-dot' },
  /** つなひき: タップれんだで ひく(「せーの!」は ながおし) */
  tsunahiki: { kind: 'tap', at: [[240, 568], [240, 568]] },
};

/** その ゲームの ゆびマークが あるか */
export const hasHowTo = (key: string): boolean => key in HOW_TO;

/* -----------------------------------------------------
   ずかんの 「あそびかた」に ならべる ときの 絵。
   おまつりは レシピの icon を つかう(データから ひける)ので、
   ここは しゅうかくゲームの ぶんだけ。
   ----------------------------------------------------- */
export const HARVEST_ICON: Record<string, string> = {
  mine: 'pick:gray',
  catch: 'basket:tan',
  chain: 'berry:purple',
  reap: 'grain:amber',
  pluck: 'strawberry:red',
  rhythm: 'tealeaf:deepgreen',
  sweep: 'snow:white',
  scoop: 'net:tan',
  shell: 'shell:cream',
  flick: 'melon:lime',
  fish: 'fish:sky',
  care: 'bug:green',
};

/* ミニゲームの 背景の 絵の 名まえ。Phaser に よらない ただの 対応表。

   背景は 「public/art/bg/ に 置く だけで 出る」つくり(ui/bgArt.ts)。
   だから 名まえが 1文字でも ちがうと、絵は 届いて いるのに 永遠に 出ない。
   しかも 画面は こわれないので だれも 気づかない ── そこで
   ここを 1か所に して、bgName.test.ts が 発注リストと つき合わせる。 */

/* 絵の 名まえと、ゲームを よぶ ときの 名まえが ちがう ものだけ。

   発注リスト(docs/ART_ASSET_LIST.md)の 背景の 名まえは ソースの ファイル名から
   つくられて いる(defenseGame.ts → bg-defense)。いっぽう ゲームを よぶ ときの
   名まえは データの キー(care / yatai)。ふつうは 同じだが、この 2つだけ ずれる。 */
const ALIAS: Record<string, string> = {
  care: 'defense', // おせわ(むしとり)= defenseGame.ts
  yatai: 'festival', // ふつうの おまつり(屋台まわり)= festivalGame.ts
};

/** ゲームの キー(エンジン名 / おまつり名)から 背景の 絵の 名まえに する */
export const bgNameOf = (key: string): string => `bg-${ALIAS[key] ?? key}`;

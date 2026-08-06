/* =====================================================
   手描き SVG の 本体(202個・すなおに 文字列で もつ)。

   ★ このファイルは svg.ts から **動的 import** で よみこむ。
   まえは メインの たばに 埋めこんで いて、SVG だけで 約800KB —
   たばが 2MB に ふくらみ、起動の 読みこみが おそく なって いた
   (docs/STORE_REVIEW.md ST-6)。
   べつの たばに 分けると、メインは 先に 動きだし、絵は うしろから とどく。
   とどく までは コード描画の 絵が 出る ので 見た目は こわれない。
   一度 とどけば サービスワーカーが おぼえる ので、オフラインでも 出る。
   ===================================================== */

/** SVG の 文字列を この たばに 入れる(fetch 202回 しない ための まとめ焼き)。
    public/ に 置く のは 絵を たのむ ときの 決めごと(docs/ART_DIRECTION.md §6)。 */
const SOURCES = import.meta.glob('../../../public/art/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** かたちの 名まえ → SVG の 文字列 */
export const SVG_OF: Record<string, string> = {};
for (const [p, text] of Object.entries(SOURCES)) {
  const name = p.split('/').pop()?.replace(/\.svg$/, '');
  if (name) SVG_OF[name] = text;
}

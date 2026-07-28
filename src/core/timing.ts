/* タップの タイミングを はんていする ための 純ロジック(Phaser 非依存)。

   ── なぜ これが 必要か ──

   ふりこ型の 3本(だるま・山車・だんじり)は
   「タップした しゅんかんの ばしょの ずれ(px)」で はんていして いた。
   ずれを px で 見ると、しんどうが はやく なるほど
   「あたり窓」は じかんとして せまく なる:

     だるま  OK_PX=36  しんぷく148  しゅうき1700→950ms(とくだい ×0.8)
             → 窓 132ms → 74ms → 59ms(PERFECT は 37→20→16ms)
     山車    ゾーン±64→±40  しんぷく164  1500→900ms(曳っかわせ ×0.85)
             → 窓 186ms → 70ms → 59ms(JUST は 41→25→21ms)
     だんじり ゾーン54  カーソル 680px/s
             → 窓 79ms(PERFECT 38ms)

   59ms は 60fps で 3〜4フレーム。4〜8歳の タップでは まぐれ しか ない。
   おなじ 「タップの しゅんかん」型 でも、わっかが ちぢむ ねぶたは
   OK 窓が 561ms → 359ms あって、けたが ちがって いた。

   ── なおしかた ──

   ずれ(px)では なく 「ねらいに いちばん ちかづく しゅんかん までの
   じかん(ms)」で はんていする。じかんで はかる ので、
   しんどうが はやく なっても 窓は せまく ならない。
   むずかしさは 「はやい = かんがえる ひまが へる・かいすうが ふえる」で 出す。

   px の ままでは この 2つは 両立 しない:
     ・大きく うごいて 見える しんどう(= しんぷくが 大きい)
     ・px の こまかい せいど(= OK_PX が ちいさい)
   はやい しゅうきで この 2つを ならべると 窓は かならず ミリ秒で つぶれる。

   ※ここの 数字は 子供テストで 再調整する 前提(docs/ROADMAP.md)。 */

/** 「ぴったり」の 窓の 上かぎり(±ms)。 */
export const PERFECT_MS = 75;

/** 「いいね」の 窓の 上かぎり(±ms)。
    ねぶた(わっかが ちぢむ 型)の JUST 124ms 〜 OK 359ms の あいだ。 */
export const OK_MS = 165;

/* ── 上かぎり だけでは だめな 理由 ──
   窓を いつも 165ms に すると、はやい しんどうでは 1はくの ほとんどが
   「あたり」に なって しまう(山車の 曳っかわせは 1はく 382ms なので
   ±165ms = 86%)。それでは どこを タップしても あたる ゲームに なる。
   なので 「1はくの なんわり まで」の うわぎりも つける。 */

/* ★わりあいは 「かたがわ」の 大きさ。
   窓は ±ratio なので、1はくの うち あたる わりあいは その 2ばい。
   OK_RATIO 0.20 → 1はくの 40% が 「いいね」以上、
   PERFECT_RATIO 0.09 → 1はくの 18% が 「ぴったり」。
   (ここを 0.42 に して 「4わり」の つもりに すると じつは 84% で、
    どこを タップしても あたる ゲームに なる) */

/** 「ぴったり」は 1はくの これだけ まで(かたがわ) */
export const PERFECT_RATIO = 0.09;
/** 「いいね」は 1はくの これだけ まで(かたがわ) */
export const OK_RATIO = 0.2;

export interface Windows {
  perfectMs: number;
  okMs: number;
}

/**
 * 「1はく」の ながさから あたり窓を きめる。
 *
 * 1はく = ねらいを とおる かんかく。
 * サインの ふりこ(だるま・山車)は 1しゅうきで 中心を 2かい とおる ので
 * 1はく = しゅうき / 2。まっすぐ 往復する カーソル(だんじり)は
 * 1はく = はしから はしまで の じかん。
 *
 * 上かぎり(PERFECT_MS / OK_MS)= 人の 手が とどく ひろさ、
 * わりあい(PERFECT_RATIO / OK_RATIO)= あたりまえに ならない ための うわぎり。
 * 両方の ちいさい ほうを とる。
 */
export function windowsFor(beatMs: number): Windows {
  const beat = Number.isFinite(beatMs) && beatMs > 0 ? beatMs : Infinity;
  return {
    perfectMs: Math.min(PERFECT_MS, beat * PERFECT_RATIO),
    okMs: Math.min(OK_MS, beat * OK_RATIO),
  };
}

export type TimingGrade = 'perfect' | 'ok' | 'miss';

/** ねらいに いちばん ちかづく しゅんかんまでの じかん(ms)で できばえを きめる。
    @param dtMs マイナス = もう すぎた / プラス = これから ちかづく
    @param w    windowsFor(1はく)で つくった 窓 */
export function judgeByTime(dtMs: number, w: Windows = windowsFor(Infinity)): TimingGrade {
  const a = Math.abs(dtMs);
  if (!Number.isFinite(a)) return 'miss';
  if (a <= w.perfectMs) return 'perfect';
  if (a <= w.okMs) return 'ok';
  return 'miss';
}

export interface Approach {
  /** ねらいに いちばん ちかづく しゅんかんまでの じかん(ms)。マイナス = すぎた */
  dtMs: number;
  /** そのときの ばしょ */
  pos: number;
  /** そのときの ずれ(ぜったい値) */
  miss: number;
}

/** さがす はんい(±ms)。

    ★はんていの 窓(OK_MS)より ひろく とる こと。
      おなじ ひろさに すると、ねらいに ぜんぜん とどいて いない ときでも
      「はんいの ふち」が いちばん ちかい ことに なって dtMs = ±OK_MS が
      かえり、judgeByTime が ok と 言って しまう
      (= どこを タップしても あたる)。
      ひろく さがせば ほんとうの 「いちばん ちかづく しゅんかん」が
      見つかり、それが OK_MS の 外なら ちゃんと miss に なる。

      サインの ゼロ点は どんなに おそい しんどうでも 1/4しゅうき いない に
      ある。いちばん おそいのは だるまの 1700ms → 425ms なので それより 長く。 */
export const SEARCH_MS = 500;

/**
 * うごく ものが ねらいに 「いちばん ちかづく しゅんかん」を さがす。
 *
 * ゆびを おろした いま(t=0)を まん中に、まえ後 searchMs を しらべる。
 * まえ(マイナス)も 見るのは、子供は だいたい 早おし に なる ため。
 *
 * @param posAt    t ミリ秒後の ばしょ(マイナスは まえ)。いま が t=0
 * @param target   ねらいの ばしょ
 * @param searchMs しらべる はんい(±ms)。SEARCH_MS の せつめいを 見る こと
 * @param stepMs   しらべる きざみ。5ms = 60fps の 1フレームより こまかい
 */
export function closestApproach(
  posAt: (tMs: number) => number,
  target: number,
  searchMs: number = SEARCH_MS,
  stepMs = 5,
): Approach {
  const step = Math.max(1, stepMs);
  let best: Approach = { dtMs: 0, pos: posAt(0), miss: Math.abs(posAt(0) - target) };
  for (let t = -searchMs; t <= searchMs; t += step) {
    const pos = posAt(t);
    const miss = Math.abs(pos - target);
    // おなじ ちかさ なら いま に ちかい ほうを のこす(|t| が ちいさい ほう)
    if (miss < best.miss || (miss === best.miss && Math.abs(t) < Math.abs(best.dtMs))) {
      best = { dtMs: t, pos, miss };
    }
  }
  return best;
}

/**
 * できばえを 「見た目の ずれ」に なおす(だるまの ように 積みかたが 見える もの用)。
 *
 * いつも ど真ん中に おくと、タップが ぎりぎりでも きれいに 積まれて しまい
 * 「うまく できた/あぶなかった」が 絵から きえる。
 * じかんの ずれに ひれいさせて よこに ずらす と、
 * 上手いほど まっすぐ・へたなほど ぐらぐらの とうに なる。
 *
 * @param dtMs   ねらいに ちかづく しゅんかんまでの じかん
 * @param side   どちら がわに ずらすか(+1 / -1)
 * @param maxPx  OK ぎりぎりの ときの ずれ(px)
 */
export function visualOffset(dtMs: number, side: number, maxPx: number, okMs = OK_MS): number {
  const r = Math.min(1, Math.abs(dtMs) / Math.max(1, okMs));
  return Math.sign(side || 1) * maxPx * r;
}

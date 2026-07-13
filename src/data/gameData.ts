/* =====================================================
   めいさんクエスト(仮) マスタデータ
   reference/data.js (v0.4) の TypeScript 移植。
   ここを書き換える/追記するだけでコンテンツが増える。
   将来は Google Sheets → このJSON形式に書き出す運用を想定。
   ===================================================== */

export type PrefectureId = string;
export type MaterialId = string;
export type RecipeId = string;

export interface Prefecture {
  id: PrefectureId;
  name: string;
  kanji: string;
  active: boolean;
  color?: string;
  festivalId?: RecipeId;
}

export type Rarity = 'common' | 'local' | 'unique';

/**
 * 収穫の操作方式(素材の実在の性質に合わせて選ぶ。コード側に品種分岐は書かない):
 *   swipe = なぞって集める(まめ・べりーなど小さく群生するもの)
 *   shake = 木をゆさぶって落として集める(木の実)
 *   roll  = つかんで かごまで ドラッグする(重く数が少ないもの)
 *   reap  = れつに なった ものを なぞって かりとる(いね)
 *   dig   = 1箇所を連続タップして掘り進める
 */
export interface HarvestSpec {
  engine: 'swipe' | 'shake' | 'roll' | 'reap' | 'dig';
  target?: string;
  prompt: string;
  success?: string;
}

export interface CareSpec {
  target: string;
  label: string;
}

export interface TimingTheme {
  intro: string;
  prompt: string;
  stopBtn: string;
  marker: string;
  success: string;
  stages: string[];
}

export interface DigTheme {
  intro: string;
  prompt: string;
  success: string;
  stages: string[];
}

export interface InfraGather {
  type: 'infra';
  building: string;
  bEmoji: string;
  rateSec: number;
  max: number;
  collectVerb: string;
}

export interface PlantGather {
  type: 'plant';
  verb: string;
  growSec: number;
  harvest: HarvestSpec;
  care: CareSpec;
  /** 畑の呼び名(既定は「はたけ」。米は「たんぼ」等) */
  fieldLabel?: string;
}

export interface TimingGather {
  type: 'timing';
  verb: string;
  theme: TimingTheme;
}

export interface DigGather {
  type: 'dig';
  verb: string;
  theme: DigTheme;
}

export type Gather = InfraGather | PlantGather | TimingGather | DigGather;

export interface Material {
  id: MaterialId;
  name: string;
  emoji: string;
  origins: PrefectureId[];
  rarity: Rarity;
  gather: Gather;
}

export interface Ingredient {
  ref: MaterialId | RecipeId;
  count: number;
  /** 産地指定(例: かさまやき=いばらき産ねんど必須) */
  origin?: PrefectureId;
  /** ★指定(収穫特化型。例: ブランドメロン=★3) */
  quality?: number;
}

export type RecipeType = 'kakou' | 'gattai' | 'kougei' | 'syukaku' | 'matsuri';

export interface Recipe {
  id: RecipeId;
  name: string;
  emoji: string;
  tier: 2 | 3 | 4;
  type: RecipeType;
  pref: PrefectureId;
  ingredients: Ingredient[];
  /** tier4のみ: false は「じゅんびちゅう」表示 */
  implemented?: boolean;
  /** tier4のみ: だんどりパズルの正順 */
  steps?: string[];
}

export interface Trivia {
  target: MaterialId | RecipeId;
  text: string;
  /** 裏取り未了マーク。文言を断定強化しないこと */
  check?: string;
}

export type QuizKind = 'kaitaku' | 'sozai' | 'bunka';

export interface Quiz {
  id: string;
  kind: QuizKind;
  /** shape=県のかたち / position=ちずで ひかる いち(kaitaku専用) */
  type?: 'shape' | 'position';
  tags: string[];
  q: string;
  choices: string[];
  answer: number;
}

export interface GameData {
  meta: { version: string; title: string; subtitle: string };
  prefectures: Prefecture[];
  materials: Material[];
  recipes: Recipe[];
  trivia: Trivia[];
  quizzes: Quiz[];
}

export const GAME_DATA: GameData = {
  meta: { version: '0.4.0', title: 'めいさんクエスト', subtitle: 'にっぽん かいたく!' },

  /* ---------- 県マスタ ---------- */
  prefectures: [
    { id: 'ibaraki', name: 'いばらき', kanji: '茨城', active: true, color: '#A9DC76', festivalId: 'rf1' },
    { id: 'tochigi', name: 'とちぎ', kanji: '栃木', active: true, color: '#FF9EB5', festivalId: 'rf3' },
    { id: 'chiba', name: 'ちば', kanji: '千葉', active: true, color: '#FFD166', festivalId: 'rf2' },
    { id: 'gunma', name: 'ぐんま', kanji: '群馬', active: false },
    { id: 'saitama', name: 'さいたま', kanji: '埼玉', active: false },
    { id: 'tokyo', name: 'とうきょう', kanji: '東京', active: false },
    { id: 'kanagawa', name: 'かながわ', kanji: '神奈川', active: false },
  ],

  /* ---------- そざいマスタ(Tier1) ---------- */
  materials: [
    { id: 'm01', name: 'みず', emoji: '💧', origins: ['ibaraki', 'tochigi', 'chiba'], rarity: 'common',
      gather: { type: 'infra', building: 'いど', bEmoji: '⛲', rateSec: 120, max: 3, collectVerb: 'くみあげる' } },
    { id: 'm02', name: 'こめ', emoji: '🌾', origins: ['ibaraki', 'tochigi', 'chiba'], rarity: 'common',
      gather: { type: 'plant', verb: 'いねを うえる', growSec: 240, fieldLabel: 'たんぼ',
        harvest: { engine: 'reap', target: '🌾', prompt: 'いねを なぞって かりとろう!' },
        care: { target: '🦗', label: 'いなごが きた! タップで おいはらえ!' } } },
    { id: 'm03', name: 'だいず', emoji: '🫘', origins: ['ibaraki', 'tochigi'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 300,
        harvest: { engine: 'swipe', target: '🫘', prompt: 'さやを なぞって ぷちぷち はじこう!' },
        care: { target: '🐛', label: 'むしが ついてる! タップで とろう!' } } },
    { id: 'm04', name: 'さつまいも', emoji: '🍠', origins: ['ibaraki', 'chiba'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねいもを うえる', growSec: 420,
        harvest: { engine: 'dig', prompt: 'つちの なかの いもを ほりだそう!', success: 'いもほり せいこう!' },
        care: { target: '🐗', label: 'いのししが きた! タップで おいはらえ!' } } },
    { id: 'm05', name: 'メロン', emoji: '🍈', origins: ['ibaraki'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 600,
        harvest: { engine: 'roll', target: '🍈', prompt: 'おもい メロンを かごまで ころがそう!' },
        care: { target: '🌀', label: 'つるが のびすぎ! タップで ととのえよう!' } } },
    { id: 'm06', name: 'うめ', emoji: '🌸', origins: ['ibaraki'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 1200,
        harvest: { engine: 'shake', target: '🫒', prompt: 'きを ゆさぶって うめを おとそう!' },
        care: { target: '🐛', label: 'むしが えだに ついてる! タップで とろう!' } } },
    { id: 'm07', name: 'ねんど', emoji: '🧱', origins: ['ibaraki', 'tochigi'], rarity: 'local',
      gather: { type: 'dig', verb: 'ほりに いく',
        theme: { intro: 'いい ねんどが ねむる つちばを みつけた!', prompt: 'ドンドン ほって みつけよう!', success: 'ほりあて せいこう!', stages: ['⛰️', '⛏️', '✨'] } } },
    { id: 'm08', name: 'らっかせい', emoji: '🥜', origins: ['chiba'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 360,
        harvest: { engine: 'swipe', target: '🥜', prompt: 'つちの なかの まめを なぞって ひろおう!' },
        care: { target: '🐜', label: 'ありが あつまってきた! タップで はらおう!' } } },
    { id: 'm09', name: 'いわし', emoji: '🐟', origins: ['chiba'], rarity: 'local',
      gather: { type: 'timing', verb: 'りょうに でる',
        theme: { intro: 'いわしの むれが やってきた!', prompt: 'なみに あわせて、いい ところで あみを ひこう!', stopBtn: 'あみを ひく!', marker: '🐟', success: 'たいりょうだ!', stages: ['⛵', '🌊', '🐟'] } } },
    { id: 'm10', name: 'なし', emoji: '🍐', origins: ['chiba', 'tochigi'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 1500,
        harvest: { engine: 'shake', target: '🍐', prompt: 'きを ゆさぶって なしを おとそう!' },
        care: { target: '🐝', label: 'はちが みに あつまってる! タップで はらおう!' } } },
    { id: 'm11', name: 'いちご', emoji: '🍓', origins: ['tochigi', 'ibaraki'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 300,
        harvest: { engine: 'swipe', target: '🍓', prompt: 'いちごを なぞって つみとろう!' },
        care: { target: '🐦', label: 'とりが いちごを ねらってる! タップで おいはらえ!' } } },
    { id: 'm12', name: 'ゆうがお', emoji: '🥒', origins: ['tochigi'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 420,
        harvest: { engine: 'roll', target: '🥒', prompt: 'おおきな みを かごまで ころがそう!' },
        care: { target: '🌀', label: 'つるが あばれてる! タップで しちゅうに とめよう!' } } },
  ],

  /* ---------- レシピマスタ(Tier2〜4) ---------- */
  recipes: [
    /* --- いばらき --- */
    { id: 'r01', name: 'なっとう', emoji: '🥣', tier: 2, type: 'kakou', pref: 'ibaraki',
      ingredients: [{ ref: 'm03', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r02', name: 'ほしいも', emoji: '🍯', tier: 2, type: 'kakou', pref: 'ibaraki',
      ingredients: [{ ref: 'm04', count: 2 }] },
    { id: 'r03', name: 'うめジュース', emoji: '🧃', tier: 2, type: 'kakou', pref: 'ibaraki',
      ingredients: [{ ref: 'm06', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r04', name: 'なっとうていしょく', emoji: '🍱', tier: 3, type: 'gattai', pref: 'ibaraki',
      ingredients: [{ ref: 'r01', count: 1 }, { ref: 'm02', count: 1 }, { ref: 'r07', count: 1 }] },
    { id: 'r05', name: 'かさまやき', emoji: '🏺', tier: 3, type: 'kougei', pref: 'ibaraki',
      ingredients: [{ ref: 'm07', count: 2, origin: 'ibaraki' }, { ref: 'm01', count: 1 }] },
    { id: 'r06', name: 'ブランドメロン', emoji: '👑', tier: 3, type: 'syukaku', pref: 'ibaraki',
      ingredients: [{ ref: 'm05', count: 1, quality: 3 }] },
    { id: 'rf1', name: 'かいらくえん うめまつり', emoji: '🏮', tier: 4, type: 'matsuri', pref: 'ibaraki',
      implemented: true,
      ingredients: [{ ref: 'r03', count: 1 }, { ref: 'r05', count: 1 }],
      steps: ['かいじょうを おそうじ', 'うめのきを かざる', 'ちょうちんを つける', 'おきゃくさんを おむかえ'] },

    /* --- ちば --- */
    { id: 'r07', name: 'しょうゆ', emoji: '🍶', tier: 2, type: 'kakou', pref: 'chiba',
      ingredients: [{ ref: 'm03', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r08', name: 'みそ', emoji: '🍲', tier: 2, type: 'kakou', pref: 'chiba',
      ingredients: [{ ref: 'm03', count: 1 }, { ref: 'm02', count: 1 }] },
    { id: 'r09', name: 'ゆでらっかせい', emoji: '🥜', tier: 2, type: 'kakou', pref: 'chiba',
      ingredients: [{ ref: 'm08', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r10', name: 'なめろう', emoji: '🍽️', tier: 3, type: 'gattai', pref: 'chiba',
      ingredients: [{ ref: 'm09', count: 2 }, { ref: 'r08', count: 1 }] },
    { id: 'r11', name: 'ブランドなし', emoji: '✨', tier: 3, type: 'syukaku', pref: 'chiba',
      ingredients: [{ ref: 'm10', count: 1, quality: 3 }] },
    { id: 'rf2', name: 'ちょうし みなとまつり', emoji: '🎆', tier: 4, type: 'matsuri', pref: 'chiba',
      implemented: false,
      ingredients: [{ ref: 'r10', count: 1 }, { ref: 'r09', count: 1 }],
      steps: [] },

    /* --- とちぎ --- */
    { id: 'r12', name: 'かんぴょう', emoji: '🌀', tier: 2, type: 'kakou', pref: 'tochigi',
      ingredients: [{ ref: 'm12', count: 2 }] },
    { id: 'r13', name: 'いちごジャム', emoji: '🫙', tier: 2, type: 'kakou', pref: 'tochigi',
      ingredients: [{ ref: 'm11', count: 2 }] },
    { id: 'r14', name: 'かんぴょうまき', emoji: '🍣', tier: 3, type: 'gattai', pref: 'tochigi',
      ingredients: [{ ref: 'r12', count: 1 }, { ref: 'm02', count: 1 }, { ref: 'r07', count: 1 }] },
    { id: 'r15', name: 'ましこやき', emoji: '🍵', tier: 3, type: 'kougei', pref: 'tochigi',
      ingredients: [{ ref: 'm07', count: 2, origin: 'tochigi' }, { ref: 'm01', count: 1 }] },
    { id: 'rf3', name: 'ましこ とうきいち', emoji: '🎪', tier: 4, type: 'matsuri', pref: 'tochigi',
      implemented: false,
      ingredients: [{ ref: 'r15', count: 1 }, { ref: 'r13', count: 1 }],
      steps: [] },
  ],

  /* ---------- ものしりカード(checkは裏取り未了マーク) ---------- */
  trivia: [
    { target: 'm01', text: 'おいしい みずが、おいしい たべものを つくるよ。みずは たんけんの きほん!' },
    { target: 'm02', text: 'こめは にほんじゅうで つくられている、みんなの しゅしょくだよ。' },
    { target: 'm03', text: 'だいずは「はたけの おにく」と よばれるくらい えいようまんてん!' },
    { target: 'm04', text: 'いばらきや ちばでは、あまい さつまいもづくりが とても さかんだよ。' },
    { target: 'm05', text: 'いばらきけんは メロンづくりが にほんでも トップクラス!', check: '統計裏取り' },
    { target: 'm06', text: 'みとの かいらくえんには、うめのきが たーくさん うえられているよ。' },
    { target: 'm07', text: 'かさま(いばらき)と ましこ(とちぎ)は、やきものの まちとして ゆうめいだよ。' },
    { target: 'm08', text: 'ちばけんは らっかせいづくりが にほんいち!', check: '統計裏取り' },
    { target: 'm09', text: 'ちばの ちょうしこうには、いわしが たくさん みずあげされるよ。', check: '統計裏取り' },
    { target: 'm10', text: 'ちばや とちぎでは、みずみずしい なしが たくさん とれるよ。' },
    { target: 'm11', text: 'とちぎけんは いちごづくりが にほんいち!「とちおとめ」が ゆうめいだよ。', check: '統計裏取り' },
    { target: 'm12', text: 'ゆうがおの みから、かんぴょうが つくられるよ。とちぎが だいさんち!', check: '統計裏取り' },
    { target: 'r01', text: 'なっとうは だいずを はっこうさせた たべもの。みとの なっとうは とっても ゆうめい!' },
    { target: 'r02', text: 'ほしいもは さつまいもを おひさまで ほして、あまーく した おやつだよ。' },
    { target: 'r03', text: 'うめの みで つくる ジュースは、あまずっぱくて げんきが でる!' },
    { target: 'r04', text: 'ほかほか ごはんに なっとうと しょうゆ。さいきょうの あさごはん、かんせい!' },
    { target: 'r05', text: 'かさまやきは いばらきけん かさまし の やきもの。ひとつひとつ てづくりだよ。' },
    { target: 'r06', text: 'こころを こめて そだてた メロンは、たからものだね!' },
    { target: 'r07', text: 'しょうゆは だいずから つくる にほんの あじ。ちばの のだや ちょうしが ゆうめいだよ。' },
    { target: 'r08', text: 'みそは だいずと こめから つくる、はっこうの ちからで できる ちょうみりょうだよ。' },
    { target: 'r09', text: 'ちばでは とれたての らっかせいを ゆでて たべるよ。ほっくほくで おいしい!' },
    { target: 'r10', text: 'なめろうは いわしを たたいて みそと まぜる、りょうしさんの りょうりだよ。' },
    { target: 'r11', text: 'じっくり そだてた なしは、シャリシャリで あまーい!' },
    { target: 'r12', text: 'かんぴょうは ゆうがおの みを ほそーく むいて、ほした たべものだよ。' },
    { target: 'r13', text: 'とれたての いちごで つくる ジャムは、いい かおり!' },
    { target: 'r14', text: 'かんぴょうまきは おすしの なかま。とちぎの かんぴょうが かつやくするよ。' },
    { target: 'r15', text: 'ましこやきは とちぎけん ましこまち の やきもの。あたたかみの ある うつわだよ。' },
    { target: 'rf1', text: 'みとの かいらくえんでは、はるに うめまつりが ひらかれるよ。いいかおりで いっぱい!' },
    { target: 'rf2', text: 'みなとまちの おまつりは、うみの めぐみに ありがとうを つたえる ひだよ。', check: '祭り名裏取り' },
    { target: 'rf3', text: 'ましこでは、はると あきに おおきな とうきいちが ひらかれるよ。', check: '裏取り' },
  ],

  /* ---------- クイズバンク ----------
     kind: kaitaku(開拓専用) / sozai(育成・レシピ用) / bunka(レシピ用)
     ※「さんち」カテゴリは廃止。産地を問う問題は、答えがまだ見えていない
       「開拓前」にだけ意味を持つため、kaitakuに統合した。 */
  quizzes: [
    /* --- 開拓: かたち・いち --- */
    { id: 'q01', kind: 'kaitaku', type: 'shape', tags: ['ibaraki'], q: 'この かたちの けんは どこ?', choices: ['いばらき', 'とちぎ', 'ちば'], answer: 0 },
    { id: 'q02', kind: 'kaitaku', type: 'shape', tags: ['tochigi'], q: 'この かたちの けんは どこ?', choices: ['とちぎ', 'ちば', 'いばらき'], answer: 0 },
    { id: 'q03', kind: 'kaitaku', type: 'shape', tags: ['chiba'], q: 'この かたちの けんは どこ?', choices: ['ちば', 'いばらき', 'とちぎ'], answer: 0 },
    { id: 'q01p', kind: 'kaitaku', type: 'position', tags: ['ibaraki'], q: 'ひかっている けんは どこ?', choices: ['いばらき', 'とちぎ', 'ちば'], answer: 0 },
    { id: 'q02p', kind: 'kaitaku', type: 'position', tags: ['tochigi'], q: 'ひかっている けんは どこ?', choices: ['とちぎ', 'いばらき', 'ちば'], answer: 0 },
    { id: 'q03p', kind: 'kaitaku', type: 'position', tags: ['chiba'], q: 'ひかっている けんは どこ?', choices: ['ちば', 'とちぎ', 'いばらき'], answer: 0 },

    /* --- 開拓: いばらき --- */
    { id: 'q04', kind: 'kaitaku', tags: ['ibaraki'], q: 'いばらきけんに ある ゆうめいな にわは?', choices: ['かいらくえん', 'けんろくえん', 'こうらくえん'], answer: 0 },
    { id: 'qk11', kind: 'kaitaku', tags: ['ibaraki'], q: 'いばらきけんで たくさん つくられる くだものは?', choices: ['メロン', 'りんご', 'さくらんぼ'], answer: 0 },
    { id: 'qk12', kind: 'kaitaku', tags: ['ibaraki'], q: 'かさまやきは いばらきけんの なに?', choices: ['やきもの', 'おかし', 'おまつり'], answer: 0 },
    { id: 'qk13', kind: 'kaitaku', tags: ['ibaraki'], q: 'いばらきけんの ゆうめいな たべものは?', choices: ['なっとう', 'たこやき', 'ぎょうざ'], answer: 0 },

    /* --- 開拓: ちば --- */
    { id: 'q05', kind: 'kaitaku', tags: ['chiba'], q: 'ちばけんで たくさん とれる まめは?', choices: ['らっかせい', 'あずき', 'そらまめ'], answer: 0 },
    { id: 'qk21', kind: 'kaitaku', tags: ['chiba'], q: 'ちばけんの ちょうしこうで たくさん とれる さかなは?', choices: ['いわし', 'まぐろ', 'うなぎ'], answer: 0 },
    { id: 'qk22', kind: 'kaitaku', tags: ['chiba'], q: 'ちばけんの のだしや ちょうししで むかしから つくられているのは?', choices: ['しょうゆ', 'バター', 'チーズ'], answer: 0 },
    { id: 'qk23', kind: 'kaitaku', tags: ['chiba'], q: 'うみに ぐるっと かこまれた ちばけんの かたちは?', choices: ['はんとう', 'しま', 'やま'], answer: 0 },

    /* --- 開拓: とちぎ --- */
    { id: 'q06', kind: 'kaitaku', tags: ['tochigi'], q: 'とちぎけんで にほんいち とれる くだものは?', choices: ['いちご', 'みかん', 'りんご'], answer: 0 },
    { id: 'qk31', kind: 'kaitaku', tags: ['tochigi'], q: 'ましこやきは とちぎけんの なに?', choices: ['やきもの', 'たべもの', 'おどり'], answer: 0 },
    { id: 'qk32', kind: 'kaitaku', tags: ['tochigi'], q: 'とちぎけんで つくられる、おすしに まく たべものは?', choices: ['かんぴょう', 'たまご', 'きゅうり'], answer: 0 },
    { id: 'qk33', kind: 'kaitaku', tags: ['tochigi'], q: 'とちぎけんに うみは ある?', choices: ['ない', 'ある', 'はんぶん ある'], answer: 0 },

    /* --- 育成・レシピ: そざい --- */
    { id: 'q20', kind: 'sozai', tags: ['m03', 'r01'], q: 'なっとうは なにから できる?', choices: ['だいず', 'こめ', 'むぎ'], answer: 0 },
    { id: 'q21', kind: 'sozai', tags: ['m03', 'r07'], q: 'しょうゆの おもな ざいりょうは?', choices: ['だいず', 'いちご', 'なし'], answer: 0 },
    { id: 'q22', kind: 'sozai', tags: ['m12', 'r12'], q: 'かんぴょうは なにから できる?', choices: ['ゆうがお', 'きゅうり', 'かぼちゃ'], answer: 0 },
    { id: 'q23', kind: 'sozai', tags: ['m04', 'r02'], q: 'ほしいもは なにから できる?', choices: ['さつまいも', 'じゃがいも', 'かぼちゃ'], answer: 0 },
    { id: 'q24', kind: 'sozai', tags: ['m06', 'r03'], q: 'うめジュースは なにから つくる?', choices: ['うめ', 'もも', 'ぶどう'], answer: 0 },
    { id: 'q25', kind: 'sozai', tags: ['m02', 'm03', 'r08'], q: 'みそは だいずと なにから つくる?', choices: ['こめ', 'さとう', 'しお'], answer: 0 },
    { id: 'q26', kind: 'sozai', tags: ['m07', 'r05', 'r15'], q: 'やきものは なにから つくる?', choices: ['ねんど', 'すな', 'いし'], answer: 0 },
    { id: 'q27', kind: 'sozai', tags: ['m11', 'r13'], q: 'いちごジャムは なにから つくる?', choices: ['いちご', 'りんご', 'みかん'], answer: 0 },
    { id: 'q28', kind: 'sozai', tags: ['m09', 'r10'], q: 'なめろうに つかう さかなは?', choices: ['いわし', 'さけ', 'まぐろ'], answer: 0 },
    { id: 'q29', kind: 'sozai', tags: ['m02', 'r14'], q: 'かんぴょうまきの ごはんの もとは?', choices: ['こめ', 'むぎ', 'そば'], answer: 0 },
    { id: 'qs1', kind: 'sozai', tags: ['m08', 'r09'], q: 'らっかせいは どこに できる?', choices: ['つちの なか', 'きの うえ', 'うみの なか'], answer: 0 },
    { id: 'qs2', kind: 'sozai', tags: ['m10', 'r11'], q: 'なしは どこに できる?', choices: ['きの うえ', 'つちの なか', 'みずの なか'], answer: 0 },
    { id: 'qs3', kind: 'sozai', tags: ['m09', 'r10'], q: 'いわしは どこに すんでいる?', choices: ['うみ', 'かわ', 'みずうみ'], answer: 0 },
    { id: 'qs4', kind: 'sozai', tags: ['m02'], q: 'おこめを そだてる ばしょは どこ?', choices: ['たんぼ', 'すなば', 'もり'], answer: 0 },
    { id: 'qs5', kind: 'sozai', tags: ['m06', 'r03', 'rf1'], q: 'うめの はなが さくのは いつごろ?', choices: ['はるの はじめごろ', 'まなつ', 'あき'], answer: 0 },

    /* --- レシピ: ぶんか --- */
    { id: 'q30', kind: 'bunka', tags: ['ibaraki', 'rf1', 'm06'], q: 'かいらくえんで ゆうめいな はなは?', choices: ['うめ', 'さくら', 'ひまわり'], answer: 0 },
    { id: 'q31', kind: 'bunka', tags: ['tochigi', 'rf3'], q: 'ましこで ひらかれる いちは?', choices: ['とうきいち', 'さかないち', 'はないち'], answer: 0 },
    { id: 'q32', kind: 'bunka', tags: ['chiba', 'r10', 'm09'], q: 'なめろうは だれの りょうりと いわれている?', choices: ['りょうしさん', 'おとのさま', 'おいしゃさん'], answer: 0 },
    { id: 'q33', kind: 'bunka', tags: ['ibaraki', 'rf1'], q: 'おまつりの ちょうちんに ともすのは?', choices: ['あかり', 'みず', 'すな'], answer: 0 },
    { id: 'qb1', kind: 'bunka', tags: ['ibaraki', 'chiba', 'tochigi', 'rf1', 'rf2', 'rf3'], q: 'おまつりで ドンドン ならす がっきは?', choices: ['たいこ', 'ピアノ', 'リコーダー'], answer: 0 },
    { id: 'qb2', kind: 'bunka', tags: ['m07', 'r05', 'r15', 'rf3'], q: 'やきものを やく ばしょを なんと いう?', choices: ['かま', 'れいぞうこ', 'おふろ'], answer: 0 },
    { id: 'qb3', kind: 'bunka', tags: ['m03', 'r01'], q: 'なっとうの ねばねばは なにの ちから?', choices: ['はっこう', 'こおり', 'かぜ'], answer: 0 },
    { id: 'qb4', kind: 'bunka', tags: ['r07', 'm03'], q: 'しょうゆの いろは どんな いろ?', choices: ['こい ちゃいろ', 'みずいろ', 'みどり'], answer: 0 },
  ],
};

/* ---------- データ参照ヘルパ ---------- */
export const findPref = (data: GameData, id: PrefectureId): Prefecture | undefined =>
  data.prefectures.find((p) => p.id === id);
export const findMaterial = (data: GameData, id: MaterialId): Material | undefined =>
  data.materials.find((m) => m.id === id);
export const findRecipe = (data: GameData, id: RecipeId): Recipe | undefined =>
  data.recipes.find((r) => r.id === id);
export const findEntity = (data: GameData, ref: string): Material | Recipe | undefined =>
  findMaterial(data, ref) ?? findRecipe(data, ref);
export const findTrivia = (data: GameData, ref: string): Trivia | undefined =>
  data.trivia.find((t) => t.target === ref);

export const TIER_LABEL: Record<number, string> = { 2: 'さんぶつ', 3: 'めいぶつ', 4: 'おまつり' };
export const RARITY_LABEL: Record<Rarity, string> = { unique: 'ここだけ!', local: 'レア', common: '' };

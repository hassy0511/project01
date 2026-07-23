/* =====================================================
   めいさんクエスト(仮) マスタデータ
   reference/data.js (v0.4) の TypeScript 移植。
   ここを書き換える/追記するだけでコンテンツが増える。
   将来は Google Sheets → このJSON形式に書き出す運用を想定。
   ===================================================== */

export type PrefectureId = string;
export type MaterialId = string;
export type RecipeId = string;
export type RegionId = string;

/** 地方(エリア)。にほんぜんこく画面に実形シルエット(regions-gen.json)で表示する */
export interface Region {
  id: RegionId;
  name: string;
  kanji: string;
  emoji: string;
  /** true のエリアだけ地図に入れる(フリーミアム/開発順の線引きに使う) */
  active: boolean;
  color: string;
}

export interface Prefecture {
  id: PrefectureId;
  name: string;
  kanji: string;
  region: RegionId;
  active: boolean;
  color?: string;
  festivalId?: RecipeId;
  /** 「けん」以外の よびかた(とうきょう=と / おおさか・きょうと=ふ / ほっかいどうは suffix なし)。省略時は けん */
  suffix?: string;
}

export type Rarity = 'common' | 'local' | 'unique';

/**
 * 収穫アーケードの種別。実在の植物の性質に合わせて選ぶ(コード側に品種分岐は書かない):
 *   chain = 畑の実が緑→色づく→食べごろ と変化。食べごろだけ摘む(いちご・だいず等の畑もの)
 *   reap  = 列をなぞって刈る。一筆で1列刈るとボーナス(いね)
 *   catch = 木から降ってくる実をかごでキャッチ(うめ・なし等の木の実)
 *   flick = 実をはじいて岩を避けてかごに入れる(メロン等の重い実)
 *   mine  = シャベル回数制限+数字ヒントの推理掘り(さつまいも・らっかせい等の土中もの・ねんど)
 */
export interface HarvestSpec {
  engine: 'chain' | 'reap' | 'catch' | 'flick' | 'mine';
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
  /** tier4のみ: (旧)だんどりパズルの正順。屋台ラッシュ移行後は未使用 */
  steps?: string[];
  /** tier4のみ: 屋台ラッシュに並ぶ しなもの(未指定なら ingredients の ref)。その県のめいぶつを並べる */
  menu?: (MaterialId | RecipeId)[];
  /** tier4のみ: おまつりのゲーム種別(未指定なら yatai)。
      実在の祭りで「実際にやること」を動詞にする方針(docs/ACTION_DESIGN.md) */
  festGame?: FestGameKind;
}

export type FestGameKind = 'yatai' | 'daruma' | 'hanabi' | 'dashi' | 'mikoshi' | 'rokuro' | 'sousen';

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
  regions: Region[];
  prefectures: Prefecture[];
  materials: Material[];
  recipes: Recipe[];
  trivia: Trivia[];
  quizzes: Quiz[];
}

export const GAME_DATA: GameData = {
  meta: { version: '0.4.0', title: 'めいさんクエスト', subtitle: 'にっぽん かいたく!' },

  /* ---------- 地方マスタ(にほんぜんこく画面) ----------
     実形シルエットは public/assets/regions-gen.json(scripts/gen-region-map.mjs で生成)。
     active な地方だけ地図に入れる。今は かんとう のみ */
  regions: [
    { id: 'hokkaido', name: 'ほっかいどう', kanji: '北海道', emoji: '❄️', active: false, color: '#B3E5FC' },
    { id: 'tohoku', name: 'とうほく', kanji: '東北', emoji: '🍎', active: false, color: '#C5E1A5' },
    { id: 'kanto', name: 'かんとう', kanji: '関東', emoji: '🗼', active: true, color: '#A9DC76' },
    { id: 'chubu', name: 'ちゅうぶ', kanji: '中部', emoji: '🗻', active: false, color: '#FFE0B2' },
    { id: 'kinki', name: 'きんき', kanji: '近畿', emoji: '🦌', active: false, color: '#F8BBD0' },
    { id: 'chugoku', name: 'ちゅうごく', kanji: '中国', emoji: '⛩️', active: false, color: '#FFF59D' },
    { id: 'shikoku', name: 'しこく', kanji: '四国', emoji: '🍊', active: false, color: '#B2DFDB' },
    { id: 'kyushu', name: 'きゅうしゅう・おきなわ', kanji: '九州・沖縄', emoji: '🌺', active: false, color: '#FFCC80' },
  ],

  /* ---------- 県マスタ ---------- */
  prefectures: [
    { id: 'ibaraki', name: 'いばらき', kanji: '茨城', region: 'kanto', active: true, color: '#A9DC76', festivalId: 'rf1' },
    { id: 'tochigi', name: 'とちぎ', kanji: '栃木', region: 'kanto', active: true, color: '#FF9EB5', festivalId: 'rf3' },
    { id: 'chiba', name: 'ちば', kanji: '千葉', region: 'kanto', active: true, color: '#FFD166', festivalId: 'rf2' },
    { id: 'gunma', name: 'ぐんま', kanji: '群馬', region: 'kanto', active: true, color: '#B39DDB', festivalId: 'rf4' },
    { id: 'saitama', name: 'さいたま', kanji: '埼玉', region: 'kanto', active: true, color: '#80CBC4', festivalId: 'rf5' },
    { id: 'tokyo', name: 'とうきょう', kanji: '東京', region: 'kanto', active: true, color: '#FFAB91', festivalId: 'rf6', suffix: 'と' },
    { id: 'kanagawa', name: 'かながわ', kanji: '神奈川', region: 'kanto', active: true, color: '#81D4FA', festivalId: 'rf7' },
  ],

  /* ---------- そざいマスタ(Tier1) ---------- */
  materials: [
    { id: 'm01', name: 'みず', emoji: '💧', origins: ['ibaraki', 'tochigi', 'chiba', 'gunma', 'saitama', 'tokyo', 'kanagawa'], rarity: 'common',
      gather: { type: 'infra', building: 'いど', bEmoji: '⛲', rateSec: 120, max: 3, collectVerb: 'くみあげる' } },
    { id: 'm02', name: 'こめ', emoji: '🌾', origins: ['ibaraki', 'tochigi', 'chiba'], rarity: 'common',
      gather: { type: 'plant', verb: 'いねを うえる', growSec: 240, fieldLabel: 'たんぼ',
        harvest: { engine: 'reap', target: '🌾', prompt: 'よこに なぞって いねを かろう! 1れつを ひとふでで かると ボーナス!' },
        care: { target: '🦗', label: 'いなごが きた! タップで おいはらえ!' } } },
    { id: 'm03', name: 'だいず', emoji: '🫘', origins: ['ibaraki', 'tochigi'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 300,
        harvest: { engine: 'chain', target: '🫘', prompt: 'ちゃいろに じゅくした まめだけ つもう! みどりは まだ はやいよ' },
        care: { target: '🐛', label: 'むしが ついてる! タップで とろう!' } } },
    { id: 'm04', name: 'さつまいも', emoji: '🍠', origins: ['ibaraki', 'chiba', 'saitama'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねいもを うえる', growSec: 420,
        harvest: { engine: 'mine', prompt: 'すうじは「まわりに いもが いくつ あるか」の ヒント! すいりして ほろう', success: 'いもほり せいこう!' },
        care: { target: '🐗', label: 'いのししが きた! タップで おいはらえ!' } } },
    { id: 'm05', name: 'メロン', emoji: '🍈', origins: ['ibaraki'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 600,
        harvest: { engine: 'flick', target: '🍈', prompt: 'メロンを ひっぱって はなして、かごに ころがしこもう!' },
        care: { target: '🌀', label: 'つるが のびすぎ! タップで ととのえよう!' } } },
    { id: 'm06', name: 'うめ', emoji: '🫒', origins: ['ibaraki'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 1200,
        harvest: { engine: 'catch', target: '🫒', prompt: 'おちてくる うめを かごで キャッチ! えだは よけてね' },
        care: { target: '🐛', label: 'むしが えだに ついてる! タップで とろう!' } } },
    { id: 'm07', name: 'ねんど', emoji: '🟤', origins: ['ibaraki', 'tochigi'], rarity: 'local',
      gather: { type: 'dig', verb: 'ほりに いく',
        theme: { intro: 'いい ねんどが ねむる つちばを みつけた!', prompt: 'すうじは「まわりに ねんどが いくつ あるか」の ヒント! すいりして ほろう', success: 'ほりあて せいこう!', stages: ['⛰️', '⛏️', '✨'] } } },
    { id: 'm08', name: 'らっかせい', emoji: '🥜', origins: ['chiba'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 360,
        harvest: { engine: 'mine', prompt: 'らっかせいは つちのなかに できるよ。ヒントの すうじで ばしょを すいりして ほろう!' },
        care: { target: '🐜', label: 'ありが あつまってきた! タップで はらおう!' } } },
    { id: 'm09', name: 'いわし', emoji: '🐟', origins: ['chiba', 'kanagawa'], rarity: 'local',
      gather: { type: 'timing', verb: 'りょうに でる',
        theme: { intro: 'いわしの むれが やってきた!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ★3!', stopBtn: 'あみを ひく!', marker: '🐟', success: 'たいりょうだ!', stages: ['⛵', '🌊', '🐟'] } } },
    { id: 'm10', name: 'なし', emoji: '🍐', origins: ['chiba', 'tochigi'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 1500,
        harvest: { engine: 'catch', target: '🍐', prompt: 'おちてくる なしを かごで キャッチ! えだは よけてね' },
        care: { target: '🐝', label: 'はちが みに あつまってる! タップで はらおう!' } } },
    { id: 'm11', name: 'いちご', emoji: '🍓', origins: ['tochigi', 'ibaraki'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 300,
        harvest: { engine: 'chain', target: '🍓', prompt: 'まっかに いろづいた いちごだけ つもう! みどりは まだ はやいよ' },
        care: { target: '🐦', label: 'とりが いちごを ねらってる! タップで おいはらえ!' } } },
    { id: 'm12', name: 'ゆうがお', emoji: '🥒', origins: ['tochigi'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 420,
        harvest: { engine: 'flick', target: '🥒', prompt: 'おおきな みを はじいて、かごに ころがしこもう!' },
        care: { target: '🌀', label: 'つるが あばれてる! タップで しちゅうに とめよう!' } } },

    /* --- ぐんま --- */
    { id: 'm13', name: 'キャベツ', emoji: '🥬', origins: ['gunma'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 360,
        harvest: { engine: 'flick', target: '🥬', prompt: 'まるまる そだった キャベツを はじいて、かごに ころがしこもう!' },
        care: { target: '🐛', label: 'あおむしが はっぱを むしゃむしゃ! タップで とろう!' } } },
    { id: 'm14', name: 'こんにゃくいも', emoji: '🟣', origins: ['gunma'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねいもを うえる', growSec: 480,
        harvest: { engine: 'mine', prompt: 'こんにゃくいもは つちのなか。すうじの ヒントで すいりして ほろう!' },
        care: { target: '🐗', label: 'いのししが きた! タップで おいはらえ!' } } },
    { id: 'm15', name: 'まゆ', emoji: '🧶', origins: ['gunma'], rarity: 'unique',
      gather: { type: 'plant', verb: 'かいこを そだてる', growSec: 300, fieldLabel: 'かいこべや',
        harvest: { engine: 'chain', target: '🧶', prompt: 'まっしろに できあがった まゆだけ あつめよう!' },
        care: { target: '🐦', label: 'とりが かいこを ねらってる! タップで おいはらえ!' } } },

    /* --- さいたま --- */
    { id: 'm16', name: 'ちゃば', emoji: '🍃', origins: ['saitama'], rarity: 'unique',
      gather: { type: 'plant', verb: 'ちゃのきを うえる', growSec: 300,
        harvest: { engine: 'chain', target: '🍃', prompt: 'つみごろに そだった わかばだけ つもう!' },
        care: { target: '🐛', label: 'むしが わかばに ついてる! タップで とろう!' } } },

    /* --- とうきょう --- */
    { id: 'm17', name: 'こまつな', emoji: '🌿', origins: ['tokyo', 'saitama'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 240,
        harvest: { engine: 'reap', target: '🌿', prompt: 'よこに なぞって こまつなを かろう! 1れつを ひとふでで かると ボーナス!' },
        care: { target: '🐦', label: 'とりが はっぱを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm18', name: 'ブルーベリー', emoji: '🫐', origins: ['tokyo'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 900,
        harvest: { engine: 'chain', target: '🫐', prompt: 'むらさきに いろづいた みだけ つもう! あかいのは まだ はやいよ' },
        care: { target: '🐿️', label: 'りすが みを ねらってる! タップで おいはらえ!' } } },

    /* --- かながわ --- */
    { id: 'm19', name: 'みかん', emoji: '🍊', origins: ['kanagawa'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 1200,
        harvest: { engine: 'catch', target: '🍊', prompt: 'おちてくる みかんを かごで キャッチ! えだは よけてね' },
        care: { target: '🐝', label: 'はちが みに あつまってる! タップで はらおう!' } } },
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
      menu: ['r03', 'r05', 'r02'] },

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
      implemented: true, festGame: 'hanabi',
      ingredients: [{ ref: 'r10', count: 1 }, { ref: 'r09', count: 1 }],
      menu: ['r07', 'r10', 'r09'] },

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
      implemented: true, festGame: 'rokuro',
      ingredients: [{ ref: 'r15', count: 1 }, { ref: 'r13', count: 1 }],
      menu: ['r15', 'r12', 'r13'] },

    /* --- ぐんま --- */
    { id: 'r16', name: 'こんにゃく', emoji: '🍢', tier: 2, type: 'kakou', pref: 'gunma',
      ingredients: [{ ref: 'm14', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r17', name: 'きぬの スカーフ', emoji: '🧣', tier: 3, type: 'kougei', pref: 'gunma',
      ingredients: [{ ref: 'm15', count: 2, origin: 'gunma' }, { ref: 'm01', count: 1 }] },
    { id: 'r18', name: 'みそこんにゃく', emoji: '🍡', tier: 3, type: 'gattai', pref: 'gunma',
      ingredients: [{ ref: 'r16', count: 1 }, { ref: 'r08', count: 1 }] },
    { id: 'rf4', name: 'たかさき だるまいち', emoji: '⛩️', tier: 4, type: 'matsuri', pref: 'gunma',
      implemented: true, festGame: 'daruma',
      ingredients: [{ ref: 'r17', count: 1 }, { ref: 'r18', count: 1 }],
      menu: ['r16', 'r17', 'm13'] },

    /* --- さいたま --- */
    { id: 'r19', name: 'さやまちゃ', emoji: '🫖', tier: 2, type: 'kakou', pref: 'saitama',
      ingredients: [{ ref: 'm16', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r20', name: 'いもようかん', emoji: '🍮', tier: 2, type: 'kakou', pref: 'saitama',
      ingredients: [{ ref: 'm04', count: 2, origin: 'saitama' }] },
    { id: 'r21', name: 'くさかせんべい', emoji: '🍘', tier: 3, type: 'gattai', pref: 'saitama',
      ingredients: [{ ref: 'm02', count: 2 }, { ref: 'r07', count: 1 }] },
    { id: 'rf5', name: 'かわごえまつり', emoji: '🎐', tier: 4, type: 'matsuri', pref: 'saitama',
      implemented: true, festGame: 'dashi',
      ingredients: [{ ref: 'r20', count: 1 }, { ref: 'r21', count: 1 }],
      menu: ['r19', 'r20', 'r21'] },

    /* --- とうきょう --- */
    { id: 'r22', name: 'ブルーベリージャム', emoji: '🫙', tier: 2, type: 'kakou', pref: 'tokyo',
      ingredients: [{ ref: 'm18', count: 2 }] },
    { id: 'r23', name: 'こまつなの おひたし', emoji: '🥗', tier: 3, type: 'gattai', pref: 'tokyo',
      ingredients: [{ ref: 'm17', count: 2 }, { ref: 'r07', count: 1 }] },
    { id: 'rf6', name: 'かんだまつり', emoji: '🎌', tier: 4, type: 'matsuri', pref: 'tokyo',
      implemented: true, festGame: 'mikoshi',
      ingredients: [{ ref: 'r22', count: 1 }, { ref: 'r23', count: 1 }],
      menu: ['r22', 'r23', 'm18'] },

    /* --- かながわ --- */
    { id: 'r24', name: 'かまぼこ', emoji: '🍥', tier: 2, type: 'kakou', pref: 'kanagawa',
      ingredients: [{ ref: 'm09', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r25', name: 'ブランドみかん', emoji: '🏵️', tier: 3, type: 'syukaku', pref: 'kanagawa',
      ingredients: [{ ref: 'm19', count: 1, quality: 3 }] },
    { id: 'rf7', name: 'よこはま みなとまつり', emoji: '🎇', tier: 4, type: 'matsuri', pref: 'kanagawa',
      implemented: true, festGame: 'sousen',
      ingredients: [{ ref: 'r24', count: 1 }, { ref: 'r25', count: 1 }],
      menu: ['r24', 'r25', 'm19'] },
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
    { target: 'm13', text: 'ぐんまの つまごいむらは、すずしい こうげんで そだてる なつキャベツが とっても ゆうめい!', check: '統計裏取り' },
    { target: 'm14', text: 'ぷるぷるの こんにゃくは「こんにゃくいも」という いもから できるよ。ぐんまが だいさんち!', check: '統計裏取り' },
    { target: 'm15', text: 'かいこが つくる まゆから、きぬの いとが とれるよ。ぐんまの とみおかせいしじょうは せかいいさん!' },
    { target: 'm16', text: 'さいたまの さやまちゃは、こい あじと かおりが じまんの おちゃだよ。' },
    { target: 'm17', text: 'こまつなの なまえは、とうきょうの「こまつがわ」という ばしょから ついたと いわれているよ。' },
    { target: 'm18', text: 'とうきょうの こだいらは、ブルーベリーつみが たのしめる のうえんで ゆうめいだよ。', check: '発祥表現裏取り' },
    { target: 'm19', text: 'かながわの うみぞいは ひあたりが よくて、みかんづくりが さかんだよ。' },
    { target: 'r16', text: 'こんにゃくいもを すりつぶして かためると、ぷるんぷるんの こんにゃくの できあがり!' },
    { target: 'r17', text: 'きぬは まゆから とれる いと。かるくて つやつやで、むかしから たからものだったよ。' },
    { target: 'r18', text: 'あまい みそを つけた こんにゃくは、ぐんまの だいにんきの おやつだよ。', check: 'みそおでん呼称裏取り' },
    { target: 'r19', text: '「いろは しずおか、かは うじよ、あじは さやまで とどめさす」と うたわれた おちゃだよ。', check: '茶摘み歌の文言裏取り' },
    { target: 'r20', text: 'さいたまの かわごえは「いもの まち」。さつまいもの おかしが いーっぱい あるよ。' },
    { target: 'r21', text: 'おこめを ついて、しょうゆを ぬって やく。さいたまの そうかで うまれた せんべいだよ。', check: '発祥表現裏取り' },
    { target: 'r22', text: 'ブルーベリーを ことこと につめると、パンに ぴったりの あまい ジャムに なるよ。' },
    { target: 'r23', text: 'こまつなは カルシウムが たっぷりの やさい。おひたしで もりもり たべよう!' },
    { target: 'r24', text: 'かながわの おだわらは かまぼこの まち。しんせんな さかなから つくられるよ。' },
    { target: 'r25', text: 'おひさまを いっぱい あびた ★3の みかんだけが、ブランドみかんに えらばれるよ。' },
    { target: 'rf4', text: 'たかさきの だるまいちは、ねがいを こめて だるまを えらぶ、おしょうがつの おおきな いちだよ。', check: '開催時期裏取り' },
    { target: 'rf5', text: 'かわごえまつりでは、おおきくて りっぱな だしが まちを ねりあるくよ。' },
    { target: 'rf6', text: 'かんだまつりは、えどの じだいから つづく とうきょうの おおきな おまつりだよ。' },
    { target: 'rf7', text: 'よこはまの みなとの おまつりでは、うみの うえに おおきな はなびが あがるよ。', check: '祭り名裏取り' },
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
    { id: 'q07', kind: 'kaitaku', type: 'shape', tags: ['gunma'], q: 'この かたちの けんは どこ?', choices: ['ぐんま', 'とちぎ', 'さいたま'], answer: 0 },
    { id: 'q08', kind: 'kaitaku', type: 'shape', tags: ['saitama'], q: 'この かたちの けんは どこ?', choices: ['さいたま', 'ぐんま', 'とうきょう'], answer: 0 },
    { id: 'q09', kind: 'kaitaku', type: 'shape', tags: ['tokyo'], q: 'この かたちは どこ?', choices: ['とうきょう', 'かながわ', 'さいたま'], answer: 0 },
    { id: 'q10', kind: 'kaitaku', type: 'shape', tags: ['kanagawa'], q: 'この かたちの けんは どこ?', choices: ['かながわ', 'とうきょう', 'ちば'], answer: 0 },
    { id: 'q01b', kind: 'kaitaku', type: 'shape', tags: ['ibaraki'], q: 'この かたちの けんは どこ?', choices: ['いばらき', 'ちば', 'さいたま'], answer: 0 },
    { id: 'q02b', kind: 'kaitaku', type: 'shape', tags: ['tochigi'], q: 'この かたちの けんは どこ?', choices: ['とちぎ', 'ぐんま', 'いばらき'], answer: 0 },
    { id: 'q03b', kind: 'kaitaku', type: 'shape', tags: ['chiba'], q: 'この かたちの けんは どこ?', choices: ['ちば', 'かながわ', 'いばらき'], answer: 0 },
    { id: 'q01p', kind: 'kaitaku', type: 'position', tags: ['ibaraki'], q: 'ひかっている けんは どこ?', choices: ['いばらき', 'とちぎ', 'ちば'], answer: 0 },
    { id: 'q02p', kind: 'kaitaku', type: 'position', tags: ['tochigi'], q: 'ひかっている けんは どこ?', choices: ['とちぎ', 'いばらき', 'ちば'], answer: 0 },
    { id: 'q03p', kind: 'kaitaku', type: 'position', tags: ['chiba'], q: 'ひかっている けんは どこ?', choices: ['ちば', 'とちぎ', 'いばらき'], answer: 0 },
    { id: 'q07p', kind: 'kaitaku', type: 'position', tags: ['gunma'], q: 'ひかっている けんは どこ?', choices: ['ぐんま', 'とちぎ', 'さいたま'], answer: 0 },
    { id: 'q08p', kind: 'kaitaku', type: 'position', tags: ['saitama'], q: 'ひかっている けんは どこ?', choices: ['さいたま', 'とうきょう', 'ぐんま'], answer: 0 },
    { id: 'q09p', kind: 'kaitaku', type: 'position', tags: ['tokyo'], q: 'ひかっているのは どこ?', choices: ['とうきょう', 'さいたま', 'かながわ'], answer: 0 },
    { id: 'q10p', kind: 'kaitaku', type: 'position', tags: ['kanagawa'], q: 'ひかっている けんは どこ?', choices: ['かながわ', 'ちば', 'とうきょう'], answer: 0 },

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

    /* --- 開拓: ぐんま --- */
    { id: 'qk41', kind: 'kaitaku', tags: ['gunma'], q: 'ぐんまけんの つまごいむらで なつに たくさん とれる やさいは?', choices: ['キャベツ', 'トマト', 'なす'], answer: 0 },
    { id: 'qk42', kind: 'kaitaku', tags: ['gunma'], q: 'ぐんまけんの とみおかに ある せかいいさんは?', choices: ['いとを つくる こうじょう', 'おおきな おしろ', 'ふるい おてら'], answer: 0 },
    { id: 'qk43', kind: 'kaitaku', tags: ['gunma'], q: 'ぐんまけんの たかさきで つくられる えんぎものは?', choices: ['だるま', 'こけし', 'まねきねこ'], answer: 0 },

    /* --- 開拓: さいたま --- */
    { id: 'qk51', kind: 'kaitaku', tags: ['saitama'], q: 'さいたまけんの さやまで つくられる のみものは?', choices: ['おちゃ', 'コーヒー', 'ぎゅうにゅう'], answer: 0 },
    { id: 'qk52', kind: 'kaitaku', tags: ['saitama'], q: 'さいたまけんの かわごえは なんと よばれる まち?', choices: ['こえど', 'こきょうと', 'こなごや'], answer: 0 },
    { id: 'qk53', kind: 'kaitaku', tags: ['saitama'], q: 'さいたまけんの そうかで ゆうめいな おかしは?', choices: ['せんべい', 'チョコレート', 'あめ'], answer: 0 },

    /* --- 開拓: とうきょう --- */
    { id: 'qk61', kind: 'kaitaku', tags: ['tokyo'], q: 'とうきょうは にほんの なに?', choices: ['しゅと', 'おんせんの まち', 'スキーの まち'], answer: 0 },
    { id: 'qk62', kind: 'kaitaku', tags: ['tokyo'], q: 'とうきょうの えどがわで うまれたと いわれる やさいは?', choices: ['こまつな', 'はくさい', 'ピーマン'], answer: 0 },
    { id: 'qk63', kind: 'kaitaku', tags: ['tokyo'], q: 'とうきょうの むかしの よびなは?', choices: ['えど', 'なにわ', 'みやこ'], answer: 0 },

    /* --- 開拓: かながわ --- */
    { id: 'qk71', kind: 'kaitaku', tags: ['kanagawa'], q: 'かながわけんの よこはまに あるのは?', choices: ['おおきな みなと', 'さばく', 'かざん'], answer: 0 },
    { id: 'qk72', kind: 'kaitaku', tags: ['kanagawa'], q: 'かながわけんの おだわらで ゆうめいな たべものは?', choices: ['かまぼこ', 'なっとう', 'ぎょうざ'], answer: 0 },
    { id: 'qk73', kind: 'kaitaku', tags: ['kanagawa'], q: 'かながわけんの みうらはんとうを かこんでいるのは?', choices: ['うみ', 'たかい やま', 'おおきな かわ'], answer: 0 },

    /* --- 育成・レシピ: そざい --- */
    { id: 'q20', kind: 'sozai', tags: ['m03', 'r01'], q: 'なっとうは なにから できる?', choices: ['だいず', 'こめ', 'むぎ'], answer: 0 },
    { id: 'q21', kind: 'sozai', tags: ['m03', 'r07'], q: 'しょうゆの おもな ざいりょうは?', choices: ['だいず', 'いちご', 'なし'], answer: 0 },
    { id: 'q22', kind: 'sozai', tags: ['m12', 'r12'], q: 'かんぴょうは なにから できる?', choices: ['ゆうがお', 'きゅうり', 'かぼちゃ'], answer: 0 },
    { id: 'q23', kind: 'sozai', tags: ['m04', 'r02'], q: 'ほしいもは なにから できる?', choices: ['さつまいも', 'じゃがいも', 'かぼちゃ'], answer: 0 },
    { id: 'q24', kind: 'sozai', tags: ['m06', 'r03'], q: 'うめジュースは なにから つくる?', choices: ['うめ', 'もも', 'ぶどう'], answer: 0 },
    { id: 'q25', kind: 'sozai', tags: ['m02', 'm03', 'r08'], q: 'みそは だいずと しお、あと なにから つくる?', choices: ['こめ', 'さとう', 'バター'], answer: 0 },
    { id: 'q26', kind: 'sozai', tags: ['m07', 'r05', 'r15'], q: 'やきものは なにから つくる?', choices: ['ねんど', 'すな', 'いし'], answer: 0 },
    { id: 'q27', kind: 'sozai', tags: ['m11', 'r13'], q: 'いちごジャムは なにから つくる?', choices: ['いちご', 'りんご', 'みかん'], answer: 0 },
    { id: 'q28', kind: 'sozai', tags: ['m09', 'r10'], q: 'なめろうに つかう さかなは?', choices: ['いわし', 'さけ', 'まぐろ'], answer: 0 },
    { id: 'q29', kind: 'sozai', tags: ['m02', 'r14'], q: 'かんぴょうまきの ごはんの もとは?', choices: ['こめ', 'むぎ', 'そば'], answer: 0 },
    { id: 'qs1', kind: 'sozai', tags: ['m08', 'r09'], q: 'らっかせいは どこに できる?', choices: ['つちの なか', 'きの うえ', 'うみの なか'], answer: 0 },
    { id: 'qs2', kind: 'sozai', tags: ['m10', 'r11'], q: 'なしは どこに できる?', choices: ['きの うえ', 'つちの なか', 'みずの なか'], answer: 0 },
    { id: 'qs3', kind: 'sozai', tags: ['m09', 'r10'], q: 'いわしは どこに すんでいる?', choices: ['うみ', 'かわ', 'みずうみ'], answer: 0 },
    { id: 'qs4', kind: 'sozai', tags: ['m02'], q: 'おこめを そだてる ばしょは どこ?', choices: ['たんぼ', 'すなば', 'もり'], answer: 0 },
    { id: 'qs5', kind: 'sozai', tags: ['m06', 'r03', 'rf1'], q: 'うめの はなが さくのは いつごろ?', choices: ['はるの はじめごろ', 'まなつ', 'あき'], answer: 0 },
    { id: 'qs6', kind: 'sozai', tags: ['m05', 'r06'], q: 'メロンは どこに できる?', choices: ['つるの うえ', 'きの うえ', 'つちの なか'], answer: 0 },
    { id: 'qs7', kind: 'sozai', tags: ['m04', 'r02'], q: 'ほしいもは さつまいもを どうやって つくる?', choices: ['おひさまに ほす', 'こおらせる', 'あぶらで あげる'], answer: 0 },
    { id: 'qs8', kind: 'sozai', tags: ['m04', 'r02', 'r20'], q: 'さつまいもが できるのは どこ?', choices: ['つちの なか', 'きの うえ', 'みずの なか'], answer: 0 },
    { id: 'qs9', kind: 'sozai', tags: ['m05', 'r06'], q: 'メロンの かわの あみめは いつ できる?', choices: ['そだつ とちゅう', 'たべる まえ', 'おみせに ならぶ とき'], answer: 0 },
    { id: 'qs10', kind: 'sozai', tags: ['m05', 'r06'], q: 'メロンの なかみは なにいろ?', choices: ['みどりや オレンジ', 'まっさお', 'まっくろ'], answer: 0 },
    { id: 'qs11', kind: 'sozai', tags: ['m06', 'r03'], q: 'うめの みは どうやって たべる?', choices: ['ジュースや うめぼしに して', 'そのまま ぱくり', 'かわだけ たべる'], answer: 0 },
    { id: 'qs12', kind: 'sozai', tags: ['m07', 'r05', 'r15'], q: 'ねんどを かまで やくと どうなる?', choices: ['かたくなる', 'とける', 'ふくらむ'], answer: 0 },
    { id: 'qs13', kind: 'sozai', tags: ['m07', 'r05', 'r15'], q: 'うつわの かたちを つくる まわる どうぐは?', choices: ['ろくろ', 'ミキサー', 'せんぷうき'], answer: 0 },
    { id: 'qs14', kind: 'sozai', tags: ['m08', 'r09'], q: 'らっかせいの からは どんな かんじ?', choices: ['でこぼこ', 'つるつる', 'ふわふわ'], answer: 0 },
    { id: 'qs15', kind: 'sozai', tags: ['m08', 'r09'], q: 'らっかせいは はなが さいたあと どこに みが できる?', choices: ['つちの なか', 'えだの さき', 'はっぱの うえ'], answer: 0 },
    { id: 'qs16', kind: 'sozai', tags: ['m09', 'r10', 'r24'], q: 'いわしは どうやって およぐ?', choices: ['おおきな むれで', '1ぴきずつ', 'およがない'], answer: 0 },
    { id: 'qs17', kind: 'sozai', tags: ['m10', 'r11'], q: 'なしの しょっかんは どんな かんじ?', choices: ['シャリシャリ', 'ねばねば', 'ふわふわ'], answer: 0 },
    { id: 'qs18', kind: 'sozai', tags: ['m10', 'r11'], q: 'なしの かわは なにいろ?', choices: ['ちゃいろっぽい', 'まっくろ', 'まっしろ'], answer: 0 },
    { id: 'qs19', kind: 'sozai', tags: ['m11', 'r13'], q: 'いちごの つぶつぶは どこに ある?', choices: ['そとがわ', 'なかの まんなか', 'はっぱの うら'], answer: 0 },
    { id: 'qs20', kind: 'sozai', tags: ['m11', 'r13'], q: 'いちごが あかく なるのは どんな しるし?', choices: ['じゅくした しるし', 'かぜを ひいた しるし', 'おこった しるし'], answer: 0 },
    { id: 'qs21', kind: 'sozai', tags: ['m12', 'r12'], q: 'ゆうがおの はなは いつ さく?', choices: ['ゆうがた', 'あさはやく', 'まひる'], answer: 0 },
    { id: 'qs22', kind: 'sozai', tags: ['m12', 'r12'], q: 'かんぴょうは ゆうがおの みを どうやって つくる?', choices: ['ほそく むいて ほす', 'あぶらで あげる', 'こおらせる'], answer: 0 },

    /* --- そざい: ぐんま --- */
    { id: 'qm13a', kind: 'sozai', tags: ['m13'], q: 'キャベツの はっぱは どんなふうに そだつ?', choices: ['まるく まいて そだつ', 'きの うえに なる', 'つちの なかで そだつ'], answer: 0 },
    { id: 'qm13b', kind: 'sozai', tags: ['m13'], q: 'こうげんの キャベツが すきなのは どんな ところ?', choices: ['すずしい ところ', 'あつい ところ', 'くらい ところ'], answer: 0 },
    { id: 'qm13c', kind: 'sozai', tags: ['m13'], q: 'キャベツと おなじ「はっぱを たべる やさい」は?', choices: ['レタス', 'にんじん', 'じゃがいも'], answer: 0 },
    { id: 'qm14a', kind: 'sozai', tags: ['m14', 'r16', 'r18'], q: 'こんにゃくは なにから つくる?', choices: ['こんにゃくいも', 'こめ', 'だいず'], answer: 0 },
    { id: 'qm14b', kind: 'sozai', tags: ['m14', 'r16'], q: 'こんにゃくいもは どこに できる?', choices: ['つちの なか', 'きの うえ', 'うみの なか'], answer: 0 },
    { id: 'qm14c', kind: 'sozai', tags: ['m14', 'r16'], q: 'こんにゃくの さわりごこちは?', choices: ['ぷるぷる', 'かちかち', 'ざらざら'], answer: 0 },
    { id: 'qm15a', kind: 'sozai', tags: ['m15', 'r17'], q: 'まゆを つくる いきものは?', choices: ['かいこ', 'はち', 'あり'], answer: 0 },
    { id: 'qm15b', kind: 'sozai', tags: ['m15', 'r17'], q: 'まゆから とれる いとは?', choices: ['きぬ', 'ウール', 'ゴム'], answer: 0 },
    { id: 'qm15c', kind: 'sozai', tags: ['m15', 'r17'], q: 'かいこが たべる はっぱは?', choices: ['くわの は', 'さくらの は', 'まつの は'], answer: 0 },

    /* --- そざい: さいたま --- */
    { id: 'qm16a', kind: 'sozai', tags: ['m16', 'r19'], q: 'おちゃは ちゃのきの どこから つくる?', choices: ['はっぱ', 'ねっこ', 'たね'], answer: 0 },
    { id: 'qm16b', kind: 'sozai', tags: ['m16', 'r19'], q: 'ちゃつみで つむのは どんな はっぱ?', choices: ['やわらかい わかば', 'かたい ふるい は', 'おちば'], answer: 0 },
    { id: 'qm16c', kind: 'sozai', tags: ['m16', 'r19'], q: 'りょくちゃの いろは?', choices: ['みどり', 'まっか', 'むらさき'], answer: 0 },

    /* --- そざい: とうきょう --- */
    { id: 'qm17a', kind: 'sozai', tags: ['m17', 'r23'], q: 'こまつなは どんな やさい?', choices: ['はっぱの やさい', 'みの やさい', 'ねっこの やさい'], answer: 0 },
    { id: 'qm17b', kind: 'sozai', tags: ['m17', 'r23'], q: 'こまつなに たっぷり はいっている えいようは?', choices: ['カルシウム', 'あぶら', 'さとう'], answer: 0 },
    { id: 'qm17c', kind: 'sozai', tags: ['m17', 'r23'], q: 'こまつなを そだてる ばしょは?', choices: ['はたけ', 'うみの なか', 'きの うえ'], answer: 0 },
    { id: 'qm18a', kind: 'sozai', tags: ['m18', 'r22'], q: 'たべごろの ブルーベリーは なにいろ?', choices: ['むらさき', 'みどり', 'しろ'], answer: 0 },
    { id: 'qm18b', kind: 'sozai', tags: ['m18', 'r22'], q: 'ブルーベリーは どこに できる?', choices: ['きの えだ', 'つちの なか', 'みずの なか'], answer: 0 },
    { id: 'qm18c', kind: 'sozai', tags: ['m18', 'r22'], q: 'ジャムは ブルーベリーを どうやって つくる?', choices: ['ことこと につめる', 'こおらせる', 'おひさまに ほす'], answer: 0 },

    /* --- そざい: かながわ --- */
    { id: 'qm19a', kind: 'sozai', tags: ['m19', 'r25'], q: 'みかんは どこに できる?', choices: ['きの うえ', 'つちの なか', 'つるの うえ'], answer: 0 },
    { id: 'qm19b', kind: 'sozai', tags: ['m19', 'r25'], q: 'みかんが あまく なるために たいせつなのは?', choices: ['おひさまの ひかり', 'つめたい ゆき', 'つよい かぜ'], answer: 0 },
    { id: 'qm19c', kind: 'sozai', tags: ['m19', 'r25'], q: 'みかんの なかみは どうなっている?', choices: ['ふさに わかれている', 'ぜんぶ たね', 'からっぽ'], answer: 0 },
    { id: 'qm09d', kind: 'sozai', tags: ['m09', 'r24'], q: 'かまぼこは なにから つくる?', choices: ['さかな', 'おにく', 'まめ'], answer: 0 },

    /* --- レシピ: ぶんか --- */
    { id: 'q30', kind: 'bunka', tags: ['ibaraki', 'rf1', 'm06'], q: 'かいらくえんで ゆうめいな はなは?', choices: ['うめ', 'さくら', 'ひまわり'], answer: 0 },
    { id: 'q31', kind: 'bunka', tags: ['tochigi', 'rf3'], q: 'ましこで ひらかれる いちは?', choices: ['とうきいち', 'さかないち', 'はないち'], answer: 0 },
    { id: 'q32', kind: 'bunka', tags: ['chiba', 'r10', 'm09'], q: 'なめろうは だれの りょうりと いわれている?', choices: ['りょうしさん', 'おとのさま', 'おいしゃさん'], answer: 0 },
    { id: 'qb2', kind: 'bunka', tags: ['m07', 'r05', 'r15', 'rf3'], q: 'やきものを やく ばしょを なんと いう?', choices: ['かま', 'れいぞうこ', 'おふろ'], answer: 0 },
    { id: 'qb3', kind: 'bunka', tags: ['m03', 'r01'], q: 'なっとうの ねばねばは なにの ちから?', choices: ['はっこう', 'こおり', 'かぜ'], answer: 0 },
    { id: 'qb4', kind: 'bunka', tags: ['r07', 'm03'], q: 'しょうゆの いろは どんな いろ?', choices: ['こい ちゃいろ', 'みずいろ', 'みどり'], answer: 0 },
    { id: 'qb5', kind: 'bunka', tags: ['m15', 'r17'], q: 'きぬの ぬのは どんな てざわり?', choices: ['つやつや すべすべ', 'ちくちく', 'ごわごわ'], answer: 0 },
    { id: 'qb6', kind: 'bunka', tags: ['m16', 'r19'], q: 'おちゃを いれる どうぐは?', choices: ['きゅうす', 'フライパン', 'じょうろ'], answer: 0 },
    { id: 'qb7', kind: 'bunka', tags: ['r21', 'r07'], q: 'せんべいを やく とき ぬるのは?', choices: ['しょうゆ', 'ジャム', 'はちみつ'], answer: 0 },
    { id: 'qb8', kind: 'bunka', tags: ['r18', 'r16'], q: 'おでんの こんにゃくに よく つけるのは?', choices: ['みそ', 'ジャム', 'さとうだけ'], answer: 0 },
    { id: 'qb9', kind: 'bunka', tags: ['r20', 'm04'], q: 'いもようかんの あまさは なにの あじ?', choices: ['さつまいも', 'メロン', 'ぶどう'], answer: 0 },
    { id: 'qb10', kind: 'bunka', tags: ['r24', 'm09'], q: 'かまぼこは なにに のせて むす?', choices: ['いた', 'はっぱ', 'おさら'], answer: 0 },
  ],
};

/* ---------- データ参照ヘルパ ---------- */
export const findPref = (data: GameData, id: PrefectureId): Prefecture | undefined =>
  data.prefectures.find((p) => p.id === id);
/** 表示用の正式なよびかた(いばらきけん・とうきょうと 等)。「けん」ベタ書き事故を防ぐ */
export const prefTitle = (p: Prefecture): string => `${p.name}${p.suffix ?? 'けん'}`;
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

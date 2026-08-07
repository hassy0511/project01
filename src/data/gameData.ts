/* =====================================================
   はれはれクエスト マスタデータ
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
  /** エリアの アイコン(かたち:いろ)。絵文字の 置きかえ先 */
  icon: string;
  /** true のエリアだけ地図に入れる(フリーミアム/開発順の線引きに使う) */
  active: boolean;
  color: string;
  /** 県形マップのファイル名(public/assets/ 配下)。active な地方は必須 */
  mapFile?: string;
  /** 解放条件: これまでに あそびきった おまつりの種類数(festBest ベース)。未指定は無条件 */
  unlockFests?: number;
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
 *   pluck = 熟した実を押さえて下にゆっくり引く。速すぎるとくき切れ(いちご・まゆ)
 *   rhythm= 的の輪に流れてくる葉をタイミングよくタップ(ちゃば)
 *   sweep = こすって雪をはらい、出てきた作物をタップで集める。吹雪で再び積もる(とうほくの雪下野菜)
 *   scoop = ざるを動かして群れをすくい上げる(しらす・しろえび。ちゅうぶの海)
 *   shell = つるしたロープ/かごを ちょうどよい速さで引き上げ、貝をはずす
 *           (かき・ほたて・かに。「貝を釣り竿で釣る」のはおかしいので専用エンジン)
 *   catch = 木から降ってくる実をかごでキャッチ(うめ・なし等の木の実)
 *   flick = 実をはじいて岩を避けてかごに入れる(メロン等の重い実)
 *   mine  = シャベル回数制限+数字ヒントの推理掘り(さつまいも・らっかせい等の土中もの・ねんど)
 */
export interface HarvestSpec {
  engine: 'chain' | 'reap' | 'pluck' | 'rhythm' | 'sweep' | 'scoop' | 'shell' | 'catch' | 'flick' | 'mine';
  /** しゅうかくで つかむ ものの アイコン(かたち:いろ)。しょうりゃくすると そざいの icon を つかう */
  targetIcon?: string;
  /** まだ はやい ときの アイコン。しょうりゃくすると 色を うすい みどりに かえるだけ。
      もとの 色が こい もの(なす・ブルーベリー・しいたけ など)は 色かえでは 見わけが
      つかないので、ここで はっきり ちがう いろを 指定する */
  unripeIcon?: string;
  /** いろづきかけ(chain だけ)。しょうりゃくすると 色を きいろに かえるだけ */
  turningIcon?: string;
  prompt: string;
  success?: string;
}

export interface CareSpec {
  /** おせわで 追いはらう じゃまものの アイコン(かたち:いろ) */
  targetIcon: string;
  label: string;
}

export interface TimingTheme {
  intro: string;
  prompt: string;
  stopBtn: string;
  /** ねらう ものの アイコン(かたち:いろ) */
  markerIcon: string;
  success: string;
  /** 3だんかいの えんしゅつアイコン(かたち:いろ) */
  stageIcons: string[];
}

export interface DigTheme {
  intro: string;
  prompt: string;
  success: string;
  /** 3だんかいの えんしゅつアイコン(かたち:いろ) */
  stageIcons: string[];
}

export interface InfraGather {
  type: 'infra';
  building: string;
  /** たてものの アイコン(かたち:いろ) */
  bIcon: string;
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
  /** そざいの アイコン(かたち:いろ)。絵文字の 置きかえ先 */
  icon: string;
  origins: PrefectureId[];
  rarity: Rarity;
  gather: Gather;
  /** どうぐの 材料(たけ・き など)。県ごとの ボリューム下限の 数には 入れない */
  dougu?: true;
  /** しんの めいさん(第2章)。おまつりを ひらいた 県で 追加で とれる。
      ゲームは 格段に むずかしく(SHIN_TUNING)、そだつ 時間も 長い。
      県ボリュームの 数には 入れない(docs/DOUGU_SHIN_PLAN.md) */
  shin?: true;
  /** 季節限定(しんの めいさん の 激レアのみ)。季節外れは とれないが 枯れない */
  season?: 'haru' | 'natsu' | 'aki' | 'fuyu';
}

export interface Ingredient {
  ref: MaterialId | RecipeId;
  count: number;
  /** 産地指定(例: かさまやき=いばらき産ねんど必須) */
  origin?: PrefectureId;
  /** ★指定(収穫特化型。例: ブランドメロン=★3) */
  quality?: number;
}

export type RecipeType = 'kakou' | 'gattai' | 'kougei' | 'syukaku' | 'matsuri' | 'dougu';

/** どうぐが きく あそび(収穫アーケード)。fish は timing がわの エンジン */
export type ToolEngine = HarvestSpec['engine'] | 'fish';

export interface Recipe {
  id: RecipeId;
  name: string;
  /** めいぶつ・りょうりの アイコン(かたち:いろ)。絵文字の 置きかえ先 */
  icon: string;
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
  /** type 'dougu' のみ: 作ると save.tools[engine] が level に なる(もちものには 入らない)。
      効果は core/tools.ts(あそびの じかんが すこし のびる。上限つき) */
  tool?: { engine: ToolEngine; level: 2 | 3 };
  /** しんの めいさんの レシピ。おまつりを ひらいた 県で 現れる。県ボリュームの 数には 入れない */
  shin?: true;
}

export type FestGameKind =
  | 'yatai'
  | 'daruma'
  | 'hanabi'
  | 'dashi'
  | 'mikoshi'
  | 'rokuro'
  | 'sousen'
  | 'nebuta'
  | 'sansa'
  | 'tanabata'
  | 'kantou'
  | 'hanagasa'
  | 'waraji'
  | 'yukimatsuri'
  | 'minyou'
  | 'owara'
  | 'tourou'
  | 'kani'
  | 'himatsuri'
  | 'onbashira'
  | 'karakuri'
  | 'tako'
  | 'makiwara'
  | 'ishidori'
  | 'kabuki'
  | 'gion'
  | 'danjiri'
  | 'fukuotoko'
  | 'yamayaki'
  | 'ougi'
  | 'shanshan'
  | 'kagura'
  | 'eyou'
  | 'betcha'
  | 'kingyo'
  | 'awaodori'
  | 'chousa'
  | 'ushioni'
  | 'yosakoi'
  | 'yamakasa'
  | 'balloon'
  | 'kokkodesho'
  | 'kazariuma'
  | 'yukake'
  | 'hyottoko'
  | 'rokugatsudo'
  | 'tsunahiki';

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

/** ちゅうもんの おれい(県ごとの かざり)。ずかんの あつめもの */
export interface Kazari {
  id: string;
  name: string;
  /** かざりの アイコン(かたち:いろ)。既存の かたちを つかいまわす */
  icon: string;
  pref: PrefectureId;
}

/** ちゅうもんの 通算数で もらえる 称号(count の 小さい 順に ならべる) */
export interface OrderTitle {
  count: number;
  name: string;
}

export interface GameData {
  meta: { version: string; title: string; subtitle: string };
  regions: Region[];
  prefectures: Prefecture[];
  materials: Material[];
  recipes: Recipe[];
  trivia: Trivia[];
  quizzes: Quiz[];
  /** ちゅうもんの おれい(47県ぶん) */
  kazari: Kazari[];
  /** ちゅうもんの 称号 */
  orderTitles: OrderTitle[];
}

export const GAME_DATA: GameData = {
  meta: { version: '0.4.0', title: 'はれはれクエスト', subtitle: 'にっぽん めいさん たんけん' },

  /* ---------- 地方マスタ(にほんぜんこく画面) ----------
     実形シルエットは public/assets/regions-gen.json(scripts/gen-region-map.mjs で生成)。
     active な地方だけ地図に入れる。今は かんとう のみ */
  regions: [
    /* ほっかいどうは1道だけなので、独立エリアにせず「とうほく」に含める(ユーザー決定 2026-07) */
    { id: 'tohoku', name: 'ほっかいどう・とうほく', kanji: '北海道・東北', icon: 'snowflake:sky', active: true, color: '#C5E1A5', mapFile: 'map-tohoku.json', unlockFests: 3 },
    { id: 'kanto', name: 'かんとう', kanji: '関東', icon: 'tower:red', active: true, color: '#A9DC76', mapFile: 'map-gen.json' },
    { id: 'chubu', name: 'ちゅうぶ', kanji: '中部', icon: 'mountain:sky', active: true, color: '#FFE0B2', mapFile: 'map-chubu.json', unlockFests: 6 },
    { id: 'kinki', name: 'きんき', kanji: '近畿', icon: 'deer:brown', active: true, color: '#F8BBD0', mapFile: 'map-kinki.json', unlockFests: 9 },
    { id: 'chugoku', name: 'ちゅうごく', kanji: '中国', icon: 'shrine:red', active: true, color: '#FFF59D', mapFile: 'map-chugoku.json', unlockFests: 12 },
    { id: 'shikoku', name: 'しこく', kanji: '四国', icon: 'wave:teal', active: true, color: '#B2DFDB', mapFile: 'map-shikoku.json', unlockFests: 15 },
    { id: 'kyushu', name: 'きゅうしゅう・おきなわ', kanji: '九州・沖縄', icon: 'hibiscus:pink', active: true, color: '#FFCC80', mapFile: 'map-kyushu.json', unlockFests: 18 },
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
    { id: 'hokkaido', name: 'ほっかいどう', kanji: '北海道', region: 'tohoku', active: true, color: '#B3E5FC', festivalId: 'rf14', suffix: '' },
    { id: 'aomori', name: 'あおもり', kanji: '青森', region: 'tohoku', active: true, color: '#EF9A9A', festivalId: 'rf8' },
    { id: 'iwate', name: 'いわて', kanji: '岩手', region: 'tohoku', active: true, color: '#A5D6A7', festivalId: 'rf9' },
    { id: 'miyagi', name: 'みやぎ', kanji: '宮城', region: 'tohoku', active: true, color: '#90CAF9', festivalId: 'rf10' },
    { id: 'akita', name: 'あきた', kanji: '秋田', region: 'tohoku', active: true, color: '#FFE082', festivalId: 'rf11' },
    { id: 'yamagata', name: 'やまがた', kanji: '山形', region: 'tohoku', active: true, color: '#F48FB1', festivalId: 'rf12' },
    { id: 'fukushima', name: 'ふくしま', kanji: '福島', region: 'tohoku', active: true, color: '#FFCC80', festivalId: 'rf13' },
    { id: 'niigata', name: 'にいがた', kanji: '新潟', region: 'chubu', active: true, color: '#AED581', festivalId: 'rf15' },
    { id: 'toyama', name: 'とやま', kanji: '富山', region: 'chubu', active: true, color: '#80DEEA', festivalId: 'rf16' },
    { id: 'ishikawa', name: 'いしかわ', kanji: '石川', region: 'chubu', active: true, color: '#F48FB1', festivalId: 'rf17' },
    { id: 'fukui', name: 'ふくい', kanji: '福井', region: 'chubu', active: true, color: '#CE93D8', festivalId: 'rf18' },
    { id: 'yamanashi', name: 'やまなし', kanji: '山梨', region: 'chubu', active: true, color: '#FFAB91', festivalId: 'rf19' },
    { id: 'nagano', name: 'ながの', kanji: '長野', region: 'chubu', active: true, color: '#A5D6A7', festivalId: 'rf20' },
    { id: 'gifu', name: 'ぎふ', kanji: '岐阜', region: 'chubu', active: true, color: '#FFE082', festivalId: 'rf21' },
    { id: 'shizuoka', name: 'しずおか', kanji: '静岡', region: 'chubu', active: true, color: '#9FA8DA', festivalId: 'rf22' },
    { id: 'aichi', name: 'あいち', kanji: '愛知', region: 'chubu', active: true, color: '#EF9A9A', festivalId: 'rf23' },
    { id: 'mie', name: 'みえ', kanji: '三重', region: 'kinki', active: true, color: '#80DEEA', festivalId: 'rf24' },
    { id: 'shiga', name: 'しが', kanji: '滋賀', region: 'kinki', active: true, color: '#90CAF9', festivalId: 'rf25' },
    { id: 'kyoto', name: 'きょうと', kanji: '京都', region: 'kinki', active: true, color: '#CE93D8', festivalId: 'rf26', suffix: 'ふ' },
    { id: 'osaka', name: 'おおさか', kanji: '大阪', region: 'kinki', active: true, color: '#FFAB91', festivalId: 'rf27', suffix: 'ふ' },
    { id: 'hyogo', name: 'ひょうご', kanji: '兵庫', region: 'kinki', active: true, color: '#A5D6A7', festivalId: 'rf28' },
    { id: 'nara', name: 'なら', kanji: '奈良', region: 'kinki', active: true, color: '#FFE082', festivalId: 'rf29' },
    { id: 'wakayama', name: 'わかやま', kanji: '和歌山', region: 'kinki', active: true, color: '#F48FB1', festivalId: 'rf30' },
    { id: 'tottori', name: 'とっとり', kanji: '鳥取', region: 'chugoku', active: true, color: '#FFE082', festivalId: 'rf31' },
    { id: 'shimane', name: 'しまね', kanji: '島根', region: 'chugoku', active: true, color: '#A5D6A7', festivalId: 'rf32' },
    { id: 'okayama', name: 'おかやま', kanji: '岡山', region: 'chugoku', active: true, color: '#F48FB1', festivalId: 'rf33' },
    { id: 'hiroshima', name: 'ひろしま', kanji: '広島', region: 'chugoku', active: true, color: '#90CAF9', festivalId: 'rf34' },
    { id: 'yamaguchi', name: 'やまぐち', kanji: '山口', region: 'chugoku', active: true, color: '#CE93D8', festivalId: 'rf35' },
    { id: 'tokushima', name: 'とくしま', kanji: '徳島', region: 'shikoku', active: true, color: '#80DEEA', festivalId: 'rf36' },
    { id: 'kagawa', name: 'かがわ', kanji: '香川', region: 'shikoku', active: true, color: '#FFCC80', festivalId: 'rf37' },
    { id: 'ehime', name: 'えひめ', kanji: '愛媛', region: 'shikoku', active: true, color: '#EF9A9A', festivalId: 'rf38' },
    { id: 'kochi', name: 'こうち', kanji: '高知', region: 'shikoku', active: true, color: '#AED581', festivalId: 'rf39' },
    { id: 'fukuoka', name: 'ふくおか', kanji: '福岡', region: 'kyushu', active: true, color: '#EF9A9A', festivalId: 'rf40' },
    { id: 'saga', name: 'さが', kanji: '佐賀', region: 'kyushu', active: true, color: '#FFE082', festivalId: 'rf41' },
    { id: 'nagasaki', name: 'ながさき', kanji: '長崎', region: 'kyushu', active: true, color: '#90CAF9', festivalId: 'rf42' },
    { id: 'kumamoto', name: 'くまもと', kanji: '熊本', region: 'kyushu', active: true, color: '#A5D6A7', festivalId: 'rf43' },
    { id: 'oita', name: 'おおいた', kanji: '大分', region: 'kyushu', active: true, color: '#80DEEA', festivalId: 'rf44' },
    { id: 'miyazaki', name: 'みやざき', kanji: '宮崎', region: 'kyushu', active: true, color: '#FFCC80', festivalId: 'rf45' },
    { id: 'kagoshima', name: 'かごしま', kanji: '鹿児島', region: 'kyushu', active: true, color: '#F48FB1', festivalId: 'rf46' },
    { id: 'okinawa', name: 'おきなわ', kanji: '沖縄', region: 'kyushu', active: true, color: '#CE93D8', festivalId: 'rf47' },
  ],

  /* ---------- そざいマスタ(Tier1) ---------- */
  materials: [
    { id: 'm01', name: 'みず', icon: 'drop:sky', origins: ['ibaraki', 'akita', 'yamanashi', 'shiga', 'tottori', 'kochi', 'oita'], rarity: 'common',
      gather: { type: 'infra', building: 'いど', bIcon: 'well:gray', rateSec: 120, max: 3, collectVerb: 'くみあげる' } },
    { id: 'm02', name: 'こめ', icon: 'grain:amber', origins: ['chiba', 'akita', 'miyagi', 'fukushima', 'niigata', 'toyama', 'fukui', 'gifu', 'shiga', 'saga', 'kumamoto'], rarity: 'common',
      gather: { type: 'plant', verb: 'いねを うえる', growSec: 240, fieldLabel: 'たんぼ',
        harvest: { engine: 'reap', targetIcon: 'grain:amber', prompt: 'よこに なぞって いねを かろう! 1れつを ひとふでで かると ボーナス!' },
        care: { targetIcon: 'bug:lime', label: 'いなごが きた! タップで おいはらえ!' } } },
    { id: 'm03', name: 'だいず', icon: 'pod:tan', origins: ['tochigi', 'aichi', 'hyogo'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 300,
        harvest: { engine: 'chain', targetIcon: 'pod:tan', prompt: 'ちゃいろに じゅくした まめだけ つもう! みどりは まだ はやいよ' },
        care: { targetIcon: 'bug:green', label: 'むしが ついてる! タップで とろう!' } } },
    { id: 'm04', name: 'さつまいも', icon: 'tuber:purple', origins: ['ibaraki', 'chiba', 'saitama', 'tokushima', 'kagoshima'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねいもを うえる', growSec: 420,
        harvest: { engine: 'mine', prompt: 'すうじは「まわりに いもが いくつ あるか」の ヒント! すいりして ほろう', success: 'いもほり せいこう!' },
        care: { targetIcon: 'boar:brown', label: 'いのししが きた! タップで おいはらえ!' } } },
    { id: 'm05', name: 'メロン', icon: 'melon:lime', origins: ['ibaraki'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 600,
        harvest: { engine: 'flick', targetIcon: 'melon:lime', prompt: 'メロンを ひっぱって はなして、かごに ころがしこもう!' },
        care: { targetIcon: 'wind:teal', label: 'つるが のびすぎ! タップで ととのえよう!' } } },
    { id: 'm06', name: 'うめ', icon: 'round:lime', origins: ['ibaraki', 'gunma', 'tokyo', 'fukui', 'wakayama'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 1200,
        harvest: { engine: 'catch', targetIcon: 'round:lime', prompt: 'おちてくる うめを かごで キャッチ! えだは よけてね' },
        care: { targetIcon: 'bug:green', label: 'むしが えだに ついてる! タップで とろう!' } } },
    { id: 'm07', name: 'ねんど', icon: 'clay:brown', origins: ['ibaraki', 'tochigi', 'ishikawa', 'gifu', 'shiga', 'okayama', 'saga'], rarity: 'local',
      gather: { type: 'dig', verb: 'ほりに いく',
        theme: { intro: 'いい ねんどが ねむる つちばを みつけた!', prompt: 'すうじは「まわりに ねんどが いくつ あるか」の ヒント! すいりして ほろう', success: 'ほりあて せいこう!', stageIcons: ['mountain:gray', 'pick:silver', 'sparkle:gold'] } } },
    { id: 'm08', name: 'らっかせい', icon: 'nut:tan', origins: ['chiba'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 360,
        harvest: { engine: 'mine', prompt: 'らっかせいは つちのなかに できるよ。ヒントの すうじで ばしょを すいりして ほろう!' },
        care: { targetIcon: 'ant:dark', label: 'ありが あつまってきた! タップで はらおう!' } } },
    { id: 'm09', name: 'いわし', icon: 'fish:silver', origins: ['chiba', 'kanagawa', 'kagawa'], rarity: 'local',
      gather: { type: 'timing', verb: 'りょうに でる',
        theme: { intro: 'いわしの むれが やってきた!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'fish:silver', success: 'たいりょうだ!', stageIcons: ['boat:white', 'wave:sky', 'fish:silver'] } } },
    { id: 'm10', name: 'なし', icon: 'round:tan', origins: ['chiba', 'tochigi', 'fukushima', 'yamagata', 'tottori'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 1500,
        harvest: { engine: 'catch', targetIcon: 'round:tan', prompt: 'おちてくる なしを かごで キャッチ! えだは よけてね' },
        care: { targetIcon: 'bee:amber', label: 'はちが みに あつまってる! タップで はらおう!' } } },
    { id: 'm11', name: 'いちご', icon: 'strawberry:red', origins: ['tochigi', 'miyagi', 'nara', 'fukuoka', 'saga'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 300,
        harvest: { engine: 'pluck', targetIcon: 'strawberry:red', unripeIcon: 'strawberry:cream', prompt: 'まっかな いちごを おさえて、したに ゆーっくり ひっぱろう! はやいと くきが きれちゃう' },
        care: { targetIcon: 'bird:sky', label: 'とりが いちごを ねらってる! タップで おいはらえ!' } } },
    { id: 'm12', name: 'ゆうがお', icon: 'cucumber:cream', origins: ['tochigi'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 420,
        harvest: { engine: 'flick', targetIcon: 'cucumber:cream', prompt: 'おおきな みを はじいて、かごに ころがしこもう!' },
        care: { targetIcon: 'wind:teal', label: 'つるが あばれてる! タップで しちゅうに とめよう!' } } },

    /* --- ぐんま --- */
    { id: 'm13', name: 'キャベツ', icon: 'leafy:lime', origins: ['gunma', 'gifu', 'aichi'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 360,
        harvest: { engine: 'flick', targetIcon: 'leafy:lime', prompt: 'まるまる そだった キャベツを はじいて、かごに ころがしこもう!' },
        care: { targetIcon: 'bug:green', label: 'あおむしが はっぱを むしゃむしゃ! タップで とろう!' } } },
    { id: 'm14', name: 'こんにゃくいも', icon: 'tuber:dark', origins: ['gunma'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねいもを うえる', growSec: 480,
        harvest: { engine: 'mine', prompt: 'こんにゃくいもは つちのなか。すうじの ヒントで すいりして ほろう!' },
        care: { targetIcon: 'boar:brown', label: 'いのししが きた! タップで おいはらえ!' } } },
    { id: 'm15', name: 'まゆ', icon: 'silk:white', origins: ['gunma'], rarity: 'unique',
      gather: { type: 'plant', verb: 'かいこを そだてる', growSec: 300, fieldLabel: 'かいこべや',
        harvest: { engine: 'pluck', targetIcon: 'silk:white', unripeIcon: 'silk:cream', prompt: 'まっしろな まゆを おさえて、ゆーっくり ひっぱって とろう! はやいと いとが きれちゃう' },
        care: { targetIcon: 'bird:sky', label: 'とりが かいこを ねらってる! タップで おいはらえ!' } } },

    /* --- さいたま --- */
    { id: 'm16', name: 'ちゃば', icon: 'tealeaf:deepgreen', origins: ['saitama', 'kanagawa', 'ishikawa', 'shizuoka', 'aichi', 'mie', 'shiga', 'kyoto', 'nara', 'fukuoka', 'nagasaki', 'miyazaki', 'kagoshima'], rarity: 'local',
      gather: { type: 'plant', verb: 'ちゃのきを うえる', growSec: 300,
        harvest: { engine: 'rhythm', targetIcon: 'tealeaf:deepgreen', prompt: 'わっかに わかばが きたら タップ! リズムよく ちゃつみ しよう' },
        care: { targetIcon: 'bug:green', label: 'むしが わかばに ついてる! タップで とろう!' } } },

    /* --- とうきょう --- */
    { id: 'm17', name: 'こまつな', icon: 'leafy:green', origins: ['tokyo', 'saitama'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 240,
        harvest: { engine: 'reap', targetIcon: 'leafy:green', prompt: 'よこに なぞって こまつなを かろう! 1れつを ひとふでで かると ボーナス!' },
        care: { targetIcon: 'bird:sky', label: 'とりが はっぱを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm18', name: 'ブルーベリー', icon: 'berry:navy', origins: ['tokyo'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 900,
        harvest: { engine: 'chain', targetIcon: 'berry:navy', unripeIcon: 'berry:green', turningIcon: 'berry:crimson', prompt: 'むらさきに いろづいた みだけ つもう! あかいのは まだ はやいよ' },
        care: { targetIcon: 'squirrel:tan', label: 'りすが みを ねらってる! タップで おいはらえ!' } } },

    /* --- かながわ --- */
    { id: 'm19', name: 'みかん', icon: 'citrus:orange', origins: ['kanagawa', 'shizuoka', 'aichi', 'wakayama', 'yamaguchi', 'ehime'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 1200,
        harvest: { engine: 'catch', targetIcon: 'citrus:orange', prompt: 'おちてくる みかんを かごで キャッチ! えだは よけてね' },
        care: { targetIcon: 'bee:amber', label: 'はちが みに あつまってる! タップで はらおう!' } } },

    /* --- あおもり --- */
    { id: 'm20', name: 'りんご', icon: 'round:red', origins: ['aomori', 'iwate', 'nagano'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 1200,
        harvest: { engine: 'catch', targetIcon: 'round:red', prompt: 'おちてくる りんごを かごで キャッチ! えだは よけてね' },
        care: { targetIcon: 'bird:sky', label: 'とりが りんごを つついてる! タップで おいはらえ!' } } },
    { id: 'm21', name: 'にんにく', icon: 'onion:white', origins: ['aomori'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを うえる', growSec: 420,
        harvest: { engine: 'mine', prompt: 'にんにくは つちのなか。すうじの ヒントで ばしょを すいりして ほろう!' },
        care: { targetIcon: 'bug:green', label: 'むしが きた! タップで とろう!' } } },
    { id: 'm22', name: 'ゆきしたにんじん', icon: 'root:orange', origins: ['aomori'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 480, fieldLabel: 'ゆきばたけ',
        harvest: { engine: 'sweep', targetIcon: 'root:orange', prompt: 'ゆきを こすって はらうと にんじんが でてくる! でてきたら タップで あつめよう' },
        care: { targetIcon: 'rabbit:white', label: 'うさぎが にんじんを ねらってる! タップで おいはらえ!' } } },

    /* --- いわて --- */
    { id: 'm23', name: 'ぎゅうにゅう', icon: 'milk:white', origins: ['iwate', 'hokkaido', 'kumamoto'], rarity: 'local',
      gather: { type: 'infra', building: 'ぼくじょう', bIcon: 'cow:white', rateSec: 300, max: 3, collectVerb: 'しぼる' } },
    { id: 'm24', name: 'てついし', icon: 'stone:gray', origins: ['iwate', 'shimane'], rarity: 'unique',
      gather: { type: 'dig', verb: 'ほりに いく',
        theme: { intro: 'いい てつが ねむる やまを みつけた!', prompt: 'すうじは「まわりに てついしが いくつ あるか」の ヒント! すいりして ほろう', success: 'ほりあて せいこう!', stageIcons: ['mountain:gray', 'pick:silver', 'sparkle:gold'] } } },

    /* --- みやぎ --- */
    { id: 'm25', name: 'えだまめ', icon: 'pod:green', origins: ['miyagi', 'yamagata', 'akita', 'niigata'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 300,
        harvest: { engine: 'chain', targetIcon: 'pod:green', unripeIcon: 'pod:cream', turningIcon: 'pod:yellow', prompt: 'ぷっくり ふくらんだ さやだけ つもう! ぺたんこは まだ はやいよ' },
        care: { targetIcon: 'bug:green', label: 'むしが さやに ついてる! タップで とろう!' } } },
    { id: 'm26', name: 'かき', icon: 'shell:gray', origins: ['miyagi', 'hiroshima'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねがいを つるす', growSec: 480, fieldLabel: 'かきの いかだ',
        harvest: { engine: 'shell', targetIcon: 'shell:gray', prompt: 'ロープを ちょうどよい はやさで ひきあげて、デッキで かきを はずそう! はやすぎると おちるよ' },
        care: { targetIcon: 'hawk:brown', label: 'とりが いかだを ねらってる! タップで おいはらえ!' } } },

    /* --- あきた --- */
    { id: 'm27', name: 'はたはた', icon: 'fish:amber', origins: ['akita'], rarity: 'unique',
      gather: { type: 'timing', verb: 'りょうに でる',
        theme: { intro: 'ふゆの うみに はたはたが やってきた!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'fish:amber', success: 'たいりょうだ!', stageIcons: ['boat:white', 'wave:sky', 'fish:amber'] } } },

    /* --- やまがた --- */
    { id: 'm28', name: 'さくらんぼ', icon: 'berry:crimson', origins: ['yamagata'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 900,
        harvest: { engine: 'pluck', targetIcon: 'berry:crimson', unripeIcon: 'berry:lime', prompt: 'まっかな さくらんぼを おさえて、ゆーっくり ひっぱろう! はやいと えだが きれちゃう' },
        care: { targetIcon: 'bird:sky', label: 'とりが さくらんぼを ねらってる! タップで おいはらえ!' } } },
    { id: 'm29', name: 'さといも', icon: 'tuber:brown', origins: ['yamagata'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねいもを うえる', growSec: 420,
        harvest: { engine: 'mine', prompt: 'さといもは つちのなか。すうじの ヒントで すいりして ほろう!' },
        care: { targetIcon: 'boar:brown', label: 'いのししが きた! タップで おいはらえ!' } } },

    /* --- ふくしま --- */
    { id: 'm30', name: 'もも', icon: 'round:pink', origins: ['fukushima', 'yamanashi', 'okayama'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 1200,
        harvest: { engine: 'pluck', targetIcon: 'round:pink', unripeIcon: 'round:lime', prompt: 'いいにおいの ももを おさえて、ゆーっくり ひっぱろう! はやいと えだが きれちゃう' },
        care: { targetIcon: 'bee:amber', label: 'はちが みに あつまってる! タップで はらおう!' } } },
    { id: 'm31', name: 'トマト', icon: 'round:crimson', origins: ['fukushima'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 360,
        harvest: { engine: 'chain', targetIcon: 'round:crimson', unripeIcon: 'round:green', turningIcon: 'round:amber', prompt: 'まっかに いろづいた トマトだけ つもう! みどりは まだ はやいよ' },
        care: { targetIcon: 'bug:green', label: 'むしが ついてる! タップで とろう!' } } },

    /* --- バランス調整で追加(2026-07): 各県 そざい5種(みず ふくむ)以上に そろえる ---
       ひとつの そざいを 複数の 産地で 共有する(ねぎ = ふかや/しもにた/しらかみ 等)。
       産地の追加は origins に足すだけ = データ駆動 */
    { id: 'm34', name: 'ねぎ', icon: 'stalk:white', origins: ['saitama', 'gunma', 'akita', 'kyoto', 'tottori', 'oita'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 360,
        harvest: { engine: 'pluck', targetIcon: 'stalk:white', prompt: 'そだった ねぎを おさえて、ゆーっくり ひきぬこう! はやいと ちぎれちゃう' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱに ついてる! タップで とろう!' } } },
    { id: 'm35', name: 'すいか', icon: 'melon:deepgreen', origins: ['kanagawa'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 660,
        harvest: { engine: 'flick', targetIcon: 'melon:deepgreen', prompt: 'おもい すいかを はじいて、かごに ころがしこもう!' },
        care: { targetIcon: 'bird:sky', label: 'とりが すいかを つついてる! タップで おいはらえ!' } } },
    { id: 'm36', name: 'かに', icon: 'crab:red', origins: ['hokkaido', 'ishikawa', 'fukui', 'kyoto', 'tottori'], rarity: 'local',
      gather: { type: 'plant', verb: 'かにかごを しずめる', growSec: 540, fieldLabel: 'かにかごば',
        harvest: { engine: 'shell', targetIcon: 'crab:red', prompt: 'かごの ロープを ちょうどよい はやさで ひきあげて、デッキで かにを とりだそう!' },
        care: { targetIcon: 'octopus:red', label: 'たこが かごに はいってる! タップで だそう!' } } },
    { id: 'm37', name: 'ほたて', icon: 'shell:cream', origins: ['aomori'], rarity: 'unique',
      gather: { type: 'plant', verb: 'かごを つるす', growSec: 480, fieldLabel: 'ほたての いかだ',
        harvest: { engine: 'shell', targetIcon: 'shell:cream', prompt: 'ロープを ちょうどよい はやさで ひきあげて、デッキで ほたてを はずそう!' },
        care: { targetIcon: 'hawk:brown', label: 'とりが いかだを ねらってる! タップで おいはらえ!' } } },
    { id: 'm38', name: 'わかめ', icon: 'seaweed:deepgreen', origins: ['iwate', 'tokushima'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねなわを しずめる', growSec: 480, fieldLabel: 'いかだ',
        harvest: { engine: 'reap', targetIcon: 'seaweed:deepgreen', prompt: 'よこに なぞって わかめを かりとろう! 1れつを ひとふでで かると ボーナス!' },
        care: { targetIcon: 'fish:orange', label: 'さかなが わかめを たべにきた! タップで おいはらえ!' } } },
    { id: 'm39', name: 'せり', icon: 'stalk:green', origins: ['miyagi'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 300, fieldLabel: 'みずた',
        harvest: { engine: 'pluck', targetIcon: 'stalk:green', unripeIcon: 'stalk:cream', prompt: 'せりは ねっこも おいしい! おさえて ゆーっくり ひきぬこう' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱに ついてる! タップで とろう!' } } },
    { id: 'm40', name: 'べにばな', icon: 'flower:orange', origins: ['yamagata'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 420,
        harvest: { engine: 'chain', targetIcon: 'flower:orange', unripeIcon: 'flower:lime', turningIcon: 'flower:yellow', prompt: 'きいろから あかに かわった はなだけ つもう! きいろは まだ はやいよ' },
        care: { targetIcon: 'bee:amber', label: 'はちが はなに あつまってる! タップで はらおう!' } } },
    { id: 'm41', name: 'わさび', icon: 'root:lime', origins: ['tokyo', 'nagano', 'shizuoka'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 900, fieldLabel: 'さわ',
        harvest: { engine: 'pluck', targetIcon: 'root:lime', unripeIcon: 'root:cream', prompt: 'きれいな みずで そだった わさびを、ゆーっくり ひきぬこう!' },
        care: { targetIcon: 'snail:tan', label: 'かたつむりが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm43', name: 'ブロッコリー', icon: 'flower:deepgreen', origins: ['saitama'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 420,
        harvest: { engine: 'chain', targetIcon: 'flower:deepgreen', unripeIcon: 'flower:lime', turningIcon: 'flower:green', prompt: 'つぼみが きゅっと しまった ブロッコリーだけ つもう! きいろい はなは おそいよ' },
        care: { targetIcon: 'bug:green', label: 'あおむしが つぼみを たべてる! タップで とろう!' } } },
    { id: 'm44', name: 'いか', icon: 'squid:cream', origins: ['hokkaido', 'aomori', 'toyama', 'yamaguchi'], rarity: 'local',
      gather: { type: 'timing', verb: 'いかつりに でる',
        theme: { intro: 'よるの うみに いかつりの あかりを つけたよ!', prompt: 'いかを タップして つりあげよう! おおきい いかほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'いとを あげる!', markerIcon: 'squid:cream', success: 'たいりょうだ!', stageIcons: ['boat:white', 'wave:sky', 'squid:cream'] } } },
    { id: 'm45', name: 'やまぶどう', icon: 'berry:violet', origins: ['iwate'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 720,
        harvest: { engine: 'pluck', targetIcon: 'berry:violet', unripeIcon: 'berry:lime', prompt: 'むらさきに じゅくした ふさを おさえて、ゆーっくり ひっぱろう!' },
        care: { targetIcon: 'bird:sky', label: 'とりが みを ねらってる! タップで おいはらえ!' } } },
    { id: 'm46', name: 'そば', icon: 'grain:brown', origins: ['fukushima', 'fukui', 'nagano', 'shimane'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 360, fieldLabel: 'そばばたけ',
        harvest: { engine: 'reap', targetIcon: 'grain:brown', prompt: 'よこに なぞって そばを かりとろう! 1れつを ひとふでで かると ボーナス!' },
        care: { targetIcon: 'bird:sky', label: 'とりが みを たべにきた! タップで おいはらえ!' } } },
    { id: 'm42', name: 'うど', icon: 'stalk:cream', origins: ['tokyo'], rarity: 'unique',
      gather: { type: 'plant', verb: 'かぶを うえる', growSec: 480, fieldLabel: 'むろ',
        harvest: { engine: 'mine', prompt: 'とうきょうの うどは ちかの あなで そだつよ。ヒントの すうじで ばしょを すいりして ほろう!' },
        care: { targetIcon: 'wind:teal', label: 'むろの ひかりが もれてる! タップで ふさごう!' } } },

    /* --- ちゅうぶ(2026-07 追加) --- */
    { id: 'm47', name: 'さけ', icon: 'bigfish:pink', origins: ['niigata', 'toyama'], rarity: 'local',
      gather: { type: 'timing', verb: 'りょうに でる',
        theme: { intro: 'かわを のぼる さけの きせつが きた!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'bigfish:pink', success: 'たいりょうだ!', stageIcons: ['boat:white', 'wave:sky', 'bigfish:pink'] } } },
    { id: 'm48', name: 'なす', icon: 'eggplant:violet', origins: ['niigata'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 360,
        harvest: { engine: 'chain', targetIcon: 'eggplant:violet', unripeIcon: 'eggplant:lime', turningIcon: 'eggplant:pink', prompt: 'つやつやの むらさきに なった なすだけ つもう! みどりは まだ はやいよ' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm49', name: 'チューリップ', icon: 'tulip:red', origins: ['niigata', 'toyama'], rarity: 'unique',
      gather: { type: 'plant', verb: 'きゅうこんを うえる', growSec: 480, fieldLabel: 'はなばたけ',
        harvest: { engine: 'pluck', targetIcon: 'tulip:red', unripeIcon: 'tulip:green', prompt: 'さきごろの はなを おさえて、ゆーっくり ひきぬこう! はやいと くきが おれちゃう' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱに ついてる! タップで とろう!' } } },
    { id: 'm50', name: 'しろえび', icon: 'shrimp:white', origins: ['toyama'], rarity: 'unique',
      gather: { type: 'plant', verb: 'あみを しかける', growSec: 420, fieldLabel: 'あみば',
        harvest: { engine: 'scoop', targetIcon: 'shrimp:white', prompt: 'ざるを うごかして、ひかる しろえびの むれを すくいとろう!' },
        care: { targetIcon: 'hawk:brown', label: 'とんびが あみを ねらってる! タップで おいはらえ!' } } },
    { id: 'm51', name: 'しお', icon: 'salt:white', origins: ['ishikawa', 'hyogo'], rarity: 'unique',
      gather: { type: 'infra', building: 'えんでん', bIcon: 'salt:cream', rateSec: 180, max: 3, collectVerb: 'かきあつめる' } },
    { id: 'm52', name: 'れんこん', icon: 'lotus:cream', origins: ['ishikawa'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねばすを うえる', growSec: 540, fieldLabel: 'はすだ',
        harvest: { engine: 'mine', prompt: 'れんこんは どろの なか。すうじの ヒントで ばしょを すいりして ほろう!' },
        care: { targetIcon: 'bird:sky', label: 'とりが はっぱを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm53', name: 'チタン', icon: 'stone:silver', origins: ['fukui'], rarity: 'unique',
      gather: { type: 'dig', verb: 'ほりに いく',
        theme: { intro: 'かるくて つよい きんぞくの こうせきを みつけた!', prompt: 'すうじは「まわりに こうせきが いくつ あるか」の ヒント! すいりして ほろう', success: 'ほりあて せいこう!', stageIcons: ['mountain:gray', 'pick:silver', 'sparkle:gold'] } } },
    { id: 'm54', name: 'ぶどう', icon: 'berry:purple', origins: ['yamanashi', 'nagano', 'osaka', 'shimane', 'okayama'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 900,
        harvest: { engine: 'pluck', targetIcon: 'berry:purple', unripeIcon: 'berry:lime', prompt: 'むらさきに じゅくした ふさを おさえて、ゆーっくり ひっぱろう!' },
        care: { targetIcon: 'bird:sky', label: 'とりが みを ねらってる! タップで おいはらえ!' } } },
    { id: 'm55', name: 'すいしょう', icon: 'gem:sky', origins: ['yamanashi'], rarity: 'unique',
      gather: { type: 'dig', verb: 'ほりに いく',
        theme: { intro: 'きらきら ひかる いしが ねむる やまを みつけた!', prompt: 'すうじは「まわりに すいしょうが いくつ あるか」の ヒント! すいりして ほろう', success: 'ほりあて せいこう!', stageIcons: ['mountain:gray', 'pick:silver', 'sparkle:gold'] } } },
    { id: 'm56', name: 'かぼちゃ', icon: 'round:deepgreen', origins: ['yamanashi'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 600,
        harvest: { engine: 'flick', targetIcon: 'round:deepgreen', prompt: 'おもい かぼちゃを はじいて、かごに ころがしこもう!' },
        care: { targetIcon: 'boar:brown', label: 'いのししが かぼちゃを ねらってる! タップで おいはらえ!' } } },
    { id: 'm57', name: 'きのこ', icon: 'mushroom:brown', origins: ['nagano'], rarity: 'unique',
      gather: { type: 'plant', verb: 'ほだぎを ならべる', growSec: 420, fieldLabel: 'きのこごや',
        harvest: { engine: 'chain', targetIcon: 'mushroom:brown', unripeIcon: 'mushroom:cream', turningIcon: 'mushroom:tan', prompt: 'かさが ぴんと ひらいた きのこだけ つもう! ちいさいのは まだ はやいよ' },
        care: { targetIcon: 'snail:tan', label: 'なめくじが きのこを たべてる! タップで とろう!' } } },
    { id: 'm58', name: 'こうぞ', icon: 'log:tan', origins: ['gifu'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 660, fieldLabel: 'こうぞばたけ',
        harvest: { engine: 'reap', targetIcon: 'log:tan', prompt: 'よこに なぞって こうぞを かりとろう! 1れつを ひとふでで かると ボーナス!' },
        care: { targetIcon: 'bug:green', label: 'むしが かわを かじってる! タップで とろう!' } } },
    { id: 'm59', name: 'あゆ', icon: 'fish:teal', origins: ['gifu', 'nara'], rarity: 'unique',
      gather: { type: 'timing', verb: 'うかいに でる',
        theme: { intro: 'ながらがわの うかい(かがり火の りょう)が はじまる!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'fish:teal', success: 'たいりょうだ!', stageIcons: ['boat:white', 'wave:sky', 'fish:teal'] } } },
    { id: 'm60', name: 'しらす', icon: 'fish:white', origins: ['shizuoka'], rarity: 'unique',
      gather: { type: 'plant', verb: 'あみを しかける', growSec: 300, fieldLabel: 'あみば',
        harvest: { engine: 'scoop', targetIcon: 'fish:white', prompt: 'ざるを うごかして、しらすの むれを すくいとろう!' },
        care: { targetIcon: 'hawk:brown', label: 'とんびが あみを ねらってる! タップで おいはらえ!' } } },
    { id: 'm62', name: 'さくらえび', icon: 'shrimp:pink', origins: ['shizuoka'], rarity: 'unique',
      gather: { type: 'plant', verb: 'あみを しかける', growSec: 480, fieldLabel: 'あみば',
        harvest: { engine: 'scoop', targetIcon: 'shrimp:pink', prompt: 'ざるを うごかして、うすピンクの さくらえびを すくいとろう!' },
        care: { targetIcon: 'hawk:brown', label: 'とんびが あみを ねらってる! タップで おいはらえ!' } } },
    { id: 'm61', name: 'うずらのたまご', icon: 'egg:cream', origins: ['aichi'], rarity: 'unique',
      gather: { type: 'infra', building: 'うずらごや', bIcon: 'chick:amber', rateSec: 150, max: 3, collectVerb: 'あつめる' } },

    /* --- ほっかいどう --- */
    { id: 'm32', name: 'とうもろこし', icon: 'grain:yellow', origins: ['hokkaido'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 420,
        harvest: { engine: 'chain', targetIcon: 'grain:yellow', prompt: 'ひげが ちゃいろに なった とうもろこしだけ つもう!' },
        care: { targetIcon: 'bird:sky', label: 'とりが みを ねらってる! タップで おいはらえ!' } } },
    { id: 'm33', name: 'じゃがいも', icon: 'tuber:tan', origins: ['hokkaido', 'nagasaki', 'kanagawa'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねいもを うえる', growSec: 420,
        harvest: { engine: 'mine', prompt: 'じゃがいもは つちのなか。すうじの ヒントで ばしょを すいりして ほろう!' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱに ついてる! タップで とろう!' } } },

    /* --- きんき(2026-07 追加) --- */
    { id: 'm63', name: 'しんじゅ', icon: 'pearl:white', origins: ['mie'], rarity: 'unique',
      gather: { type: 'plant', verb: 'アコヤがいを つるす', growSec: 540, fieldLabel: 'しんじゅの いかだ',
        harvest: { engine: 'shell', targetIcon: 'pearl:white', prompt: 'ロープを ちょうどよい はやさで ひきあげて、デッキで たまを とりだそう! はやすぎると おちるよ' },
        care: { targetIcon: 'wind:teal', label: 'あかしおが きそう! タップで いかだを うごかせ!' } } },
    { id: 'm64', name: 'いせえび', icon: 'shrimp:crimson', origins: ['mie'], rarity: 'unique',
      gather: { type: 'plant', verb: 'あみを しかける', growSec: 480, fieldLabel: 'あみば',
        harvest: { engine: 'scoop', targetIcon: 'shrimp:crimson', prompt: 'ざるを うごかして、いわばに あつまった いせえびを すくいとろう!' },
        care: { targetIcon: 'shark:gray', label: 'おおきな さかなが あみを ねらってる! タップで おいはらえ!' } } },
    { id: 'm65', name: 'のり', icon: 'seaweed:dark', origins: ['mie', 'fukuoka', 'saga'], rarity: 'local',
      gather: { type: 'plant', verb: 'のりあみを はる', growSec: 420, fieldLabel: 'のりひび',
        harvest: { engine: 'reap', targetIcon: 'seaweed:dark', prompt: 'よこに なぞって のりを つみとろう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'duck:brown', label: 'かもが のりを たべにきた! タップで おいはらえ!' } } },
    { id: 'm66', name: 'わぎゅう', icon: 'cow:dark', origins: ['mie'], rarity: 'unique',
      gather: { type: 'infra', building: 'ぼくじょう', bIcon: 'hut:brown', rateSec: 180, max: 3, collectVerb: 'せわを する' } },
    { id: 'm67', name: 'ふな', icon: 'fish:gray', origins: ['shiga'], rarity: 'unique',
      gather: { type: 'timing', verb: 'ふなを つる',
        theme: { intro: 'びわこの ふなが およいでいる!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'fish:gray', success: 'たいりょうだ!', stageIcons: ['rowboat:brown', 'wave:sky', 'fish:gray'] } } },
    { id: 'm68', name: 'たけのこ', icon: 'bamboo:cream', origins: ['kyoto', 'fukuoka'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たけやまを ととのえる', growSec: 480, fieldLabel: 'たけやま',
        harvest: { engine: 'mine', prompt: 'たけのこは つちの なか。すうじの ヒントで ばしょを すいりして ほろう!' },
        care: { targetIcon: 'boar:brown', label: 'いのししが たけのこを ほりにきた! タップで おいはらえ!' } } },
    { id: 'm69', name: 'まつたけ', icon: 'mushroom:tan', origins: ['kyoto'], rarity: 'unique',
      gather: { type: 'plant', verb: 'あかまつの やまを まもる', growSec: 600, fieldLabel: 'あかまつの やま',
        harvest: { engine: 'sweep', targetIcon: 'mushroom:tan', prompt: 'おちばを こすって かきわけて、かくれている まつたけを さがそう!' },
        care: { targetIcon: 'boar:brown', label: 'いのししが やまを あらしてる! タップで おいはらえ!' } } },
    { id: 'm70', name: 'たこ', icon: 'octopus:crimson', origins: ['osaka', 'hyogo'], rarity: 'local',
      gather: { type: 'plant', verb: 'たこつぼを しずめる', growSec: 420, fieldLabel: 'たこつぼば',
        harvest: { engine: 'shell', targetIcon: 'octopus:crimson', prompt: 'ロープを ちょうどよい はやさで ひきあげて、デッキで たこを つぼから だそう!' },
        care: { targetIcon: 'hawk:brown', label: 'とんびが つぼを ねらってる! タップで おいはらえ!' } } },
    { id: 'm79', name: 'みずなす', icon: 'eggplant:purple', origins: ['osaka'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 360, fieldLabel: 'せんしゅうの はたけ',
        harvest: { engine: 'chain', targetIcon: 'eggplant:purple', unripeIcon: 'eggplant:lime', turningIcon: 'eggplant:pink', prompt: 'つやつやの まるい みずなすだけ つもう! みどりは まだ はやいよ' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm71', name: 'しゅんぎく', icon: 'leafy:teal', origins: ['osaka'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 300, fieldLabel: 'なにわの はたけ',
        harvest: { engine: 'reap', targetIcon: 'leafy:teal', prompt: 'よこに なぞって しゅんぎくを かりとろう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm72', name: 'たまねぎ', icon: 'onion:tan', origins: ['osaka', 'hyogo'], rarity: 'local',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 420, fieldLabel: 'たまねぎばたけ',
        harvest: { engine: 'pluck', targetIcon: 'onion:tan', prompt: 'おおきく なった たまねぎを おさえて、ゆーっくり ひきぬこう! はやいと はっぱが ちぎれる' },
        care: { targetIcon: 'bird:sky', label: 'とりが なえを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm73', name: 'いかなご', icon: 'fish:cream', origins: ['hyogo'], rarity: 'unique',
      gather: { type: 'plant', verb: 'あみを しかける', growSec: 300, fieldLabel: 'あみば',
        harvest: { engine: 'scoop', targetIcon: 'fish:cream', prompt: 'ざるを うごかして、ひかる いかなごの むれを すくいとろう!' },
        care: { targetIcon: 'hawk:brown', label: 'かもめが あみを ねらってる! タップで おいはらえ!' } } },
    { id: 'm74', name: 'かきのみ', icon: 'round:orange', origins: ['nara'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 540, fieldLabel: 'かきばたけ',
        harvest: { engine: 'catch', targetIcon: 'round:orange', prompt: 'おちてくる かきを かごで うけとめよう! きんの かきは とくてん おおい!' },
        care: { targetIcon: 'bird:sky', label: 'とりが みを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm75', name: 'よしのすぎ', icon: 'tree:deepgreen', origins: ['nara'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 600, fieldLabel: 'すぎの やま',
        harvest: { engine: 'reap', targetIcon: 'tree:deepgreen', prompt: 'よこに なぞって のこぎりで すぎを きりだそう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'wind:teal', label: 'えだが しげって ひが とどかない! タップで えだうち!' } } },
    { id: 'm76', name: 'さんしょう', icon: 'berry:lime', origins: ['wakayama'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 420, fieldLabel: 'さんしょうばたけ',
        harvest: { engine: 'chain', targetIcon: 'berry:lime', unripeIcon: 'berry:cream', turningIcon: 'berry:yellow', prompt: 'みどりが こくなった つぶだけ つもう! まだ うすいのは はやいよ' },
        care: { targetIcon: 'bug:green', label: 'あおむしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm77', name: 'まぐろ', icon: 'bigfish:navy', origins: ['wakayama'], rarity: 'unique',
      gather: { type: 'timing', verb: 'りょうに でる',
        theme: { intro: 'おきに まぐろの むれが きた!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'bigfish:navy', success: 'たいりょうだ!', stageIcons: ['boat:white', 'wave:sky', 'bigfish:navy'] } } },
    { id: 'm78', name: 'びんちょうたん', icon: 'log:dark', origins: ['wakayama'], rarity: 'unique',
      gather: { type: 'infra', building: 'すみやきがま', bIcon: 'kiln:brown', rateSec: 180, max: 3, collectVerb: 'とりだす' } },

    /* --- ちゅうごく・しこく(2026-07 追加) --- */
    { id: 'm80', name: 'らっきょう', icon: 'onion:cream', origins: ['tottori'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを うえる', growSec: 480, fieldLabel: 'すなおかの はたけ',
        harvest: { engine: 'mine', prompt: 'らっきょうは すなの なか。すうじの ヒントで ばしょを すいりして ほろう!' },
        care: { targetIcon: 'bird:sky', label: 'とりが なえを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm81', name: 'しじみ', icon: 'shell:dark', origins: ['shimane'], rarity: 'unique',
      gather: { type: 'plant', verb: 'じょれんを しずめる', growSec: 420, fieldLabel: 'しじみの りょうば',
        harvest: { engine: 'shell', targetIcon: 'shell:dark', prompt: 'じょれんの ロープを ちょうどよい はやさで ひきあげて、ふねで しじみを えらぼう!' },
        care: { targetIcon: 'duck:brown', label: 'かもが しじみを たべにきた! タップで おいはらえ!' } } },
    { id: 'm82', name: 'のどぐろ', icon: 'fish:crimson', origins: ['shimane'], rarity: 'unique',
      gather: { type: 'timing', verb: 'りょうに でる',
        theme: { intro: 'ふかい うみに のどぐろが いる!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'fish:crimson', success: 'たいりょうだ!', stageIcons: ['boat:white', 'wave:sky', 'fish:crimson'] } } },
    { id: 'm83', name: 'ままかり', icon: 'fish:blue', origins: ['okayama'], rarity: 'unique',
      gather: { type: 'timing', verb: 'りょうに でる',
        theme: { intro: 'せとうちに ままかりの むれが きた!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'fish:blue', success: 'たいりょうだ!', stageIcons: ['rowboat:brown', 'wave:sky', 'fish:blue'] } } },
    { id: 'm84', name: 'きにら', icon: 'stalk:yellow', origins: ['okayama'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 360, fieldLabel: 'くらの はたけ',
        harvest: { engine: 'reap', targetIcon: 'stalk:yellow', prompt: 'よこに なぞって きにらを かりとろう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'wind:teal', label: 'ひかりが もれて みどりに なっちゃう! タップで ふさごう!' } } },
    { id: 'm85', name: 'レモン', icon: 'citrus:yellow', origins: ['hiroshima'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 480, fieldLabel: 'レモンばたけ',
        harvest: { engine: 'catch', targetIcon: 'citrus:yellow', prompt: 'おちてくる レモンを かごで うけとめよう! きんの レモンは とくてん おおい!' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm86', name: 'ひろしまな', icon: 'leafy:deepgreen', origins: ['hiroshima'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 300, fieldLabel: 'なばたけ',
        harvest: { engine: 'reap', targetIcon: 'leafy:deepgreen', prompt: 'よこに なぞって ひろしまなを かりとろう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'bug:green', label: 'あおむしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm87', name: 'あなご', icon: 'eel:tan', origins: ['hiroshima'], rarity: 'unique',
      gather: { type: 'timing', verb: 'りょうに でる',
        theme: { intro: 'みやじまの おきに あなごが いる!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'eel:tan', success: 'たいりょうだ!', stageIcons: ['boat:white', 'wave:sky', 'eel:tan'] } } },
    { id: 'm88', name: 'わけぎ', icon: 'stalk:lime', origins: ['hiroshima'], rarity: 'unique',
      gather: { type: 'plant', verb: 'きゅうこんを うえる', growSec: 300, fieldLabel: 'わけぎばたけ',
        harvest: { engine: 'pluck', targetIcon: 'stalk:lime', unripeIcon: 'stalk:cream', prompt: 'そっと おさえて、ゆーっくり ひきぬこう! はやいと ちぎれちゃう' },
        care: { targetIcon: 'bird:sky', label: 'とりが はっぱを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm89', name: 'ふぐ', icon: 'pufferfish:cream', origins: ['yamaguchi', 'nagasaki'], rarity: 'unique',
      gather: { type: 'timing', verb: 'りょうに でる',
        theme: { intro: 'しものせきの うみに ふぐが きた!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'pufferfish:cream', success: 'たいりょうだ!', stageIcons: ['boat:white', 'wave:sky', 'pufferfish:cream'] } } },
    { id: 'm104', name: 'いわくにれんこん', icon: 'lotus:white', origins: ['yamaguchi'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねばすを うえる', growSec: 540, fieldLabel: 'はすだ',
        harvest: { engine: 'mine', prompt: 'れんこんは どろの なか。すうじの ヒントで ばしょを すいりして ほろう!' },
        care: { targetIcon: 'bird:sky', label: 'とりが はっぱを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm90', name: 'はなっこりー', icon: 'flower:lime', origins: ['yamaguchi'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 360, fieldLabel: 'はなっこりーばたけ',
        harvest: { engine: 'chain', targetIcon: 'flower:lime', unripeIcon: 'flower:cream', turningIcon: 'flower:yellow', prompt: 'つぼみが ふくらんだ ものだけ つもう! ちいさいのは まだ はやいよ' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm91', name: 'すだち', icon: 'citrus:deepgreen', origins: ['tokushima'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 420, fieldLabel: 'すだちばたけ',
        harvest: { engine: 'catch', targetIcon: 'citrus:deepgreen', prompt: 'おちてくる すだちを かごで うけとめよう! きんの すだちは とくてん おおい!' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm92', name: 'あい', icon: 'leaf:navy', origins: ['tokushima'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 480, fieldLabel: 'あいばたけ',
        harvest: { engine: 'reap', targetIcon: 'leaf:navy', prompt: 'よこに なぞって あいの はっぱを かりとろう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm93', name: 'たい', icon: 'fish:pink', origins: ['tokushima', 'ehime'], rarity: 'local',
      gather: { type: 'timing', verb: 'りょうに でる',
        theme: { intro: 'うずしおの ながれに たいが いる!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'fish:pink', success: 'たいりょうだ!', stageIcons: ['boat:white', 'wave:sky', 'fish:pink'] } } },
    { id: 'm94', name: 'こむぎ', icon: 'grain:tan', origins: ['kagawa'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 420, fieldLabel: 'むぎばたけ',
        harvest: { engine: 'reap', targetIcon: 'grain:tan', prompt: 'よこに なぞって こむぎを かりとろう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'bird:sky', label: 'すずめが ほを たべにきた! タップで おいはらえ!' } } },
    { id: 'm95', name: 'オリーブ', icon: 'berry:deepgreen', origins: ['kagawa'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 540, fieldLabel: 'オリーブばたけ',
        harvest: { engine: 'pluck', targetIcon: 'berry:deepgreen', unripeIcon: 'berry:lime', prompt: 'いろの ついた みを おさえて、ゆーっくり つみとろう! はやいと えだが おれる' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm96', name: 'きんときにんじん', icon: 'root:crimson', origins: ['kagawa'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 420, fieldLabel: 'にんじんばたけ',
        harvest: { engine: 'pluck', targetIcon: 'root:crimson', unripeIcon: 'root:cream', prompt: 'はっぱを おさえて、ゆーっくり ひきぬこう! はやいと ちぎれちゃう' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm97', name: 'わた', icon: 'cloth:white', origins: ['ehime', 'kagawa'], rarity: 'local',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 480, fieldLabel: 'わたばたけ',
        harvest: { engine: 'chain', targetIcon: 'cloth:white', prompt: 'まっしろに はじけた わただけ つもう! みどりの みは まだ はやいよ' },
        care: { targetIcon: 'bug:green', label: 'むしが みを たべてる! タップで とろう!' } } },
    { id: 'm98', name: 'キウイ', icon: 'kiwi:brown', origins: ['ehime'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 540, fieldLabel: 'キウイの たな',
        harvest: { engine: 'pluck', targetIcon: 'kiwi:brown', unripeIcon: 'kiwi:lime', prompt: 'そっと おさえて、ゆーっくり つみとろう! はやいと つるが きれちゃう' },
        care: { targetIcon: 'bird:sky', label: 'とりが みを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm99', name: 'はだかむぎ', icon: 'grain:cream', origins: ['ehime'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 420, fieldLabel: 'むぎばたけ',
        harvest: { engine: 'reap', targetIcon: 'grain:cream', prompt: 'よこに なぞって はだかむぎを かりとろう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'bird:sky', label: 'すずめが ほを たべにきた! タップで おいはらえ!' } } },
    { id: 'm100', name: 'ゆず', icon: 'citrus:amber', origins: ['kochi'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 540, fieldLabel: 'ゆずばたけ',
        harvest: { engine: 'catch', targetIcon: 'citrus:amber', prompt: 'おちてくる ゆずを かごで うけとめよう! きんの ゆずは とくてん おおい!' },
        care: { targetIcon: 'bird:sky', label: 'とりが みを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm101', name: 'かつお', icon: 'bigfish:blue', origins: ['kochi', 'miyazaki'], rarity: 'unique',
      gather: { type: 'timing', verb: 'いっぽんづりに でる',
        theme: { intro: 'とさの おきに かつおの むれが きた!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'さおを あげる!', markerIcon: 'bigfish:blue', success: 'たいりょうだ!', stageIcons: ['boat:white', 'wave:sky', 'bigfish:blue'] } } },
    { id: 'm102', name: 'しょうが', icon: 'ginger:tan', origins: ['kochi'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねしょうがを うえる', growSec: 480, fieldLabel: 'しょうがばたけ',
        harvest: { engine: 'mine', prompt: 'しょうがは つちの なか。すうじの ヒントで ばしょを すいりして ほろう!' },
        care: { targetIcon: 'wind:teal', label: 'つちが かわいてる! タップで みずを やろう!' } } },
    { id: 'm103', name: 'ししとう', icon: 'pepper:green', origins: ['kochi'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 360, fieldLabel: 'ハウスの はたけ',
        harvest: { engine: 'chain', targetIcon: 'pepper:green', unripeIcon: 'pepper:cream', turningIcon: 'pepper:yellow', prompt: 'つやつやの みどりの ししとうだけ つもう! ちいさいのは まだ はやいよ' },
        care: { targetIcon: 'bug:green', label: 'むしが みを たべてる! タップで とろう!' } } },

    /* --- きゅうしゅう・おきなわ(2026-07 追加) --- */
    { id: 'm105', name: 'かつおな', icon: 'leafy:lime', origins: ['fukuoka'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 300, fieldLabel: 'はかたの はたけ',
        harvest: { engine: 'reap', targetIcon: 'leafy:lime', prompt: 'よこに なぞって かつおなを かりとろう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm106', name: 'むつごろう', icon: 'fish:brown', origins: ['saga'], rarity: 'unique',
      gather: { type: 'timing', verb: 'ひがたに でる',
        theme: { intro: 'ありあけの ひがたに むつごろうが いる!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'さおを あげる!', markerIcon: 'fish:brown', success: 'たいりょうだ!', stageIcons: ['raft:tan', 'wave:sky', 'fish:brown'] } } },
    { id: 'm107', name: 'びわ', icon: 'round:amber', origins: ['nagasaki'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 540, fieldLabel: 'びわばたけ',
        harvest: { engine: 'catch', targetIcon: 'round:amber', prompt: 'おちてくる びわを かごで うけとめよう! きんの びわは とくてん おおい!' },
        care: { targetIcon: 'bird:sky', label: 'とりが みを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm108', name: 'あじ', icon: 'fish:navy', origins: ['nagasaki', 'oita'], rarity: 'local',
      gather: { type: 'timing', verb: 'りょうに でる',
        theme: { intro: 'はやい しおの ところに あじの むれが きた!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'fish:navy', success: 'たいりょうだ!', stageIcons: ['boat:white', 'wave:sky', 'fish:navy'] } } },
    { id: 'm109', name: 'いぐさ', icon: 'stalk:deepgreen', origins: ['kumamoto'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 480, fieldLabel: 'いぐさだ',
        harvest: { engine: 'reap', targetIcon: 'stalk:deepgreen', prompt: 'よこに なぞって いぐさを かりとろう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'wind:teal', label: 'みずが へってる! タップで みずを 入れよう!' } } },
    { id: 'm110', name: 'デコポン', icon: 'citrus:orange', origins: ['kumamoto'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 540, fieldLabel: 'デコポンばたけ',
        harvest: { engine: 'catch', targetIcon: 'citrus:orange', prompt: 'おちてくる デコポンを かごで うけとめよう! きんの みは とくてん おおい!' },
        care: { targetIcon: 'bird:sky', label: 'とりが みを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm111', name: 'くり', icon: 'chestnut:brown', origins: ['kumamoto'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 540, fieldLabel: 'くりばたけ',
        harvest: { engine: 'chain', targetIcon: 'nut:brown', unripeIcon: 'nut:lime', turningIcon: 'nut:tan', prompt: 'いがが ひらいた くりだけ ひろおう! まだ とじているのは はやいよ' },
        care: { targetIcon: 'boar:brown', label: 'いのししが くりを たべにきた! タップで おいはらえ!' } } },
    { id: 'm112', name: 'かぼす', icon: 'citrus:lime', origins: ['oita'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 480, fieldLabel: 'かぼすばたけ',
        harvest: { engine: 'catch', targetIcon: 'citrus:lime', prompt: 'おちてくる かぼすを かごで うけとめよう! きんの みは とくてん おおい!' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm113', name: 'しいたけ', icon: 'mushroom:dark', origins: ['oita'], rarity: 'unique',
      gather: { type: 'plant', verb: 'ほだぎを ならべる', growSec: 480, fieldLabel: 'ほだばの もり',
        harvest: { engine: 'pluck', targetIcon: 'mushroom:dark', unripeIcon: 'mushroom:cream', prompt: 'かさが ひらいた しいたけを おさえて、ゆーっくり もぎとろう!' },
        care: { targetIcon: 'wind:teal', label: 'ほだぎが かわいてる! タップで みずを かけよう!' } } },
    { id: 'm114', name: 'マンゴー', icon: 'mango:orange', origins: ['miyazaki'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 600, fieldLabel: 'ハウスの きばたけ',
        harvest: { engine: 'catch', targetIcon: 'mango:orange', prompt: 'じゅくして おちる マンゴーを ネットで うけとめよう! きんの みは とくてん おおい!' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm115', name: 'きゅうり', icon: 'cucumber:green', origins: ['miyazaki'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 300, fieldLabel: 'きゅうりの ハウス',
        harvest: { engine: 'pluck', targetIcon: 'cucumber:green', unripeIcon: 'cucumber:cream', prompt: 'ちょうど よい ながさの きゅうりを おさえて、ゆーっくり もぎとろう!' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm116', name: 'ピーマン', icon: 'pepper:deepgreen', origins: ['miyazaki'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 360, fieldLabel: 'ピーマンの ハウス',
        harvest: { engine: 'chain', targetIcon: 'pepper:deepgreen', unripeIcon: 'pepper:lime', turningIcon: 'pepper:green', prompt: 'つやつやの みどりの ピーマンだけ つもう! ちいさいのは まだ はやいよ' },
        care: { targetIcon: 'bug:green', label: 'むしが みを たべてる! タップで とろう!' } } },
    { id: 'm117', name: 'うなぎ', icon: 'eel:dark', origins: ['kagoshima'], rarity: 'unique',
      gather: { type: 'timing', verb: 'いけすに いく',
        theme: { intro: 'あたたかい みずの いけすで うなぎが そだった!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'eel:dark', success: 'たいりょうだ!', stageIcons: ['bucket:silver', 'wave:sky', 'eel:dark'] } } },
    { id: 'm118', name: 'そらまめ', icon: 'pod:lime', origins: ['kagoshima'], rarity: 'unique',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 420, fieldLabel: 'そらまめばたけ',
        harvest: { engine: 'chain', targetIcon: 'pod:lime', unripeIcon: 'pod:cream', turningIcon: 'pod:yellow', prompt: 'そらを むいた さやが ふくらんだら つもう! ちいさいのは まだ はやいよ' },
        care: { targetIcon: 'bug:green', label: 'むしが さやを たべてる! タップで とろう!' } } },
    { id: 'm119', name: 'きんかん', icon: 'citrus:amber', origins: ['kagoshima'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 480, fieldLabel: 'きんかんばたけ',
        harvest: { engine: 'catch', targetIcon: 'citrus:amber', prompt: 'おちてくる きんかんを かごで うけとめよう! きんの みは とくてん おおい!' },
        care: { targetIcon: 'bird:sky', label: 'とりが みを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm120', name: 'さとうきび', icon: 'bamboo:lime', origins: ['okinawa'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 600, fieldLabel: 'さとうきびばたけ',
        harvest: { engine: 'reap', targetIcon: 'bamboo:lime', prompt: 'よこに なぞって さとうきびを かりとろう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'wind:teal', label: 'たいふうが きそう! タップで ささえよう!' } } },
    { id: 'm121', name: 'ゴーヤー', icon: 'cucumber:deepgreen', origins: ['okinawa'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 360, fieldLabel: 'ゴーヤーの たな',
        harvest: { engine: 'chain', targetIcon: 'cucumber:deepgreen', unripeIcon: 'cucumber:lime', turningIcon: 'cucumber:green', prompt: 'こい みどりで ぶつぶつが そろった ゴーヤーだけ つもう!' },
        care: { targetIcon: 'bug:green', label: 'むしが はっぱを たべてる! タップで とろう!' } } },
    { id: 'm122', name: 'パイナップル', icon: 'pineapple:amber', origins: ['okinawa'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 600, fieldLabel: 'パインばたけ',
        harvest: { engine: 'catch', targetIcon: 'pineapple:amber', prompt: 'かりとった パイナップルを かごで うけとめよう! きんの みは とくてん おおい!' },
        care: { targetIcon: 'bird:sky', label: 'とりが みを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm123', name: 'もずく', icon: 'seaweed:brown', origins: ['okinawa'], rarity: 'unique',
      gather: { type: 'plant', verb: 'あみを はる', growSec: 420, fieldLabel: 'もずくの あみば',
        harvest: { engine: 'reap', targetIcon: 'seaweed:brown', prompt: 'よこに なぞって もずくを つみとろう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'wind:teal', label: 'なみが たかい! タップで あみを なおそう!' } } },
    { id: 'm124', name: 'べにいも', icon: 'tuber:violet', origins: ['okinawa'], rarity: 'unique',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 480, fieldLabel: 'べにいもばたけ',
        harvest: { engine: 'mine', prompt: 'べにいもは つちの なか。すうじの ヒントで ばしょを すいりして ほろう!' },
        care: { targetIcon: 'boar:brown', label: 'いのししが はたけを あらしてる! タップで おいはらえ!' } } },

    /* --- どうぐの 材料(dougu: 県ボリュームの 数には 入れない) ---
       てついし(m24)・わた(m97)は ふつうの そざいを つかいまわす。
       産地を 複数の エリアに 置くのは 「材料は レシピの エリアより 先に
       ひらく エリアで とれる」テストを みたす ため */
    { id: 'm125', name: 'たけ', icon: 'bamboo:lime', origins: ['shizuoka', 'kyoto', 'oita'], rarity: 'local', dougu: true,
      gather: { type: 'plant', verb: 'たけを うえる', growSec: 300, fieldLabel: 'たけばやし',
        harvest: { engine: 'reap', targetIcon: 'bamboo:lime', prompt: 'よこに なぞって たけを かりとろう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'boar:brown', label: 'いのししが たけばやしを あらしてる! タップで おいはらえ!' } } },
    { id: 'm126', name: 'き', icon: 'log:brown', origins: ['aomori', 'nagano', 'nara'], rarity: 'local', dougu: true,
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 600, fieldLabel: 'もり',
        harvest: { engine: 'reap', targetIcon: 'log:brown', prompt: 'よこに なぞって きを きりだそう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'bug:brown', label: 'むしが きを かじってる! タップで おいはらえ!' } } },

    /* --- しんの めいさん(かんとう試作。shin: 県ボリュームの 数には 入れない) ---
       おまつりを ひらいた 県で 追加で とれる。そだつ 時間は 30〜60分級、
       ゲームは 格段に むずかしい(SHIN_TUNING)。季節つきは 激レアのみ。
       docs/DOUGU_SHIN_PLAN.md */
    /* いばらき */
    { id: 'm127', name: 'れんこん', icon: 'lotus:cream', origins: ['ibaraki'], rarity: 'unique', shin: true,
      gather: { type: 'plant', verb: 'たねばすを うえる', growSec: 2400, fieldLabel: 'はすだ',
        harvest: { engine: 'mine', prompt: 'れんこんは どろの なか。すうじの ヒントで ばしょを すいりして ほろう!' },
        care: { targetIcon: 'duck:white', label: 'かもが はすを ついばんでる! タップで おいはらえ!' } } },
    { id: 'm128', name: 'あんこう', icon: 'ankou:navy', origins: ['ibaraki'], rarity: 'unique', shin: true, season: 'fuyu',
      gather: { type: 'timing', verb: 'りょうに でる',
        theme: { intro: 'ふゆの うみに あんこうが やってきた!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'ankou:navy', success: 'たいりょうだ!', stageIcons: ['boat:white', 'wave:navy', 'ankou:navy'] } } },
    /* とちぎ */
    { id: 'm129', name: 'かんぴょう', icon: 'kanpyo:tan', origins: ['tochigi'], rarity: 'unique', shin: true,
      gather: { type: 'plant', verb: 'ゆうがおを うえる', growSec: 2100, fieldLabel: 'ゆうがおばたけ',
        harvest: { engine: 'reap', targetIcon: 'kanpyo:tan', prompt: 'よこに なぞって かんぴょうを けずりとろう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'bird:sky', label: 'とりが みを つついてる! タップで おいはらえ!' } } },
    { id: 'm130', name: 'にら', icon: 'stalk:green', origins: ['tochigi'], rarity: 'unique', shin: true,
      gather: { type: 'plant', verb: 'たねを まく', growSec: 1800, fieldLabel: 'にらばたけ',
        harvest: { engine: 'reap', targetIcon: 'stalk:green', prompt: 'よこに なぞって にらを かりとろう! 1れつを ひとふででボーナス!' },
        care: { targetIcon: 'bug:green', label: 'むしが はを かじってる! タップで おいはらえ!' } } },
    /* ぐんま */
    { id: 'm131', name: 'しもにたねぎ', icon: 'stalk:white', origins: ['gunma'], rarity: 'unique', shin: true, season: 'fuyu',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 2400, fieldLabel: 'ねぎばたけ',
        harvest: { engine: 'pluck', targetIcon: 'stalk:white', unripeIcon: 'stalk:lime', prompt: 'ふとった ねぎを おさえて、ゆーっくり ひきぬこう! はやいと おれちゃう' },
        care: { targetIcon: 'frog:green', label: 'かえるが はたけで あばれてる! タップで おいはらえ!' } } },
    { id: 'm132', name: 'まいたけ', icon: 'mushroom:brown', origins: ['gunma'], rarity: 'unique', shin: true,
      gather: { type: 'plant', verb: 'げんぼくを おく', growSec: 2100, fieldLabel: 'きのこの ほだば',
        harvest: { engine: 'chain', targetIcon: 'mushroom:brown', unripeIcon: 'mushroom:cream', prompt: 'ひらいた まいたけだけ つもう! ちいさいのは まだ はやいよ' },
        care: { targetIcon: 'snail:brown', label: 'かたつむりが きのこを かじってる! タップで おいはらえ!' } } },
    /* さいたま */
    { id: 'm133', name: 'くわい', icon: 'kuwai:teal', origins: ['saitama'], rarity: 'unique', shin: true, season: 'fuyu',
      gather: { type: 'plant', verb: 'たねいもを うえる', growSec: 2400, fieldLabel: 'くわいだ',
        harvest: { engine: 'mine', prompt: 'くわいは どろの なか。すうじの ヒントで ばしょを すいりして ほろう!' },
        care: { targetIcon: 'duck:white', label: 'かもが たんぼを あらしてる! タップで おいはらえ!' } } },
    { id: 'm134', name: 'さといも', icon: 'tuber:gray', origins: ['saitama'], rarity: 'unique', shin: true,
      gather: { type: 'plant', verb: 'たねいもを うえる', growSec: 1800, fieldLabel: 'さといもばたけ',
        harvest: { engine: 'mine', prompt: 'さといもは つちの なか。すうじの ヒントで ばしょを すいりして ほろう!' },
        care: { targetIcon: 'boar:brown', label: 'いのししが はたけを あらしてる! タップで おいはらえ!' } } },
    /* とうきょう */
    { id: 'm135', name: 'あしたば', icon: 'leafy:deepgreen', origins: ['tokyo'], rarity: 'unique', shin: true,
      gather: { type: 'plant', verb: 'たねを まく', growSec: 1800, fieldLabel: 'しまの はたけ',
        harvest: { engine: 'pluck', targetIcon: 'leafy:deepgreen', unripeIcon: 'leafy:lime', prompt: 'そだった はっぱを おさえて、ゆーっくり つみとろう! はやいと ちぎれちゃう' },
        care: { targetIcon: 'bug:green', label: 'むしが はを かじってる! タップで おいはらえ!' } } },
    { id: 'm136', name: 'パッションフルーツ', icon: 'passionfruit:violet', origins: ['tokyo'], rarity: 'unique', shin: true, season: 'natsu',
      gather: { type: 'plant', verb: 'なえを うえる', growSec: 2400, fieldLabel: 'しまの かじゅえん',
        harvest: { engine: 'catch', targetIcon: 'passionfruit:violet', prompt: 'おちてくる みを かごで キャッチ! えだは よけてね' },
        care: { targetIcon: 'bird:sky', label: 'とりが みを ついばんでる! タップで おいはらえ!' } } },
    /* ちば */
    { id: 'm137', name: 'きんめだい', icon: 'fish:red', origins: ['chiba'], rarity: 'unique', shin: true,
      gather: { type: 'timing', verb: 'りょうに でる',
        theme: { intro: 'ふかい うみに きんめだいが ひかってる!', prompt: 'さかなを タップして つりあげよう! おおきい さかなほど なんかいも タップ! ぬしを つると ほし3つ!', stopBtn: 'あみを ひく!', markerIcon: 'fish:red', success: 'たいりょうだ!', stageIcons: ['boat:white', 'wave:navy', 'fish:red'] } } },
    { id: 'm138', name: 'なばな', icon: 'flower:yellow', origins: ['chiba'], rarity: 'unique', shin: true, season: 'haru',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 1800, fieldLabel: 'なばなばたけ',
        harvest: { engine: 'pluck', targetIcon: 'flower:yellow', unripeIcon: 'leafy:lime', prompt: 'さいた なばなを おさえて、ゆーっくり つみとろう! はやいと くきが きれちゃう' },
        care: { targetIcon: 'bee:amber', label: 'はちが はなに あつまってる! タップで はらおう!' } } },
    /* かながわ */
    { id: 'm139', name: 'みうらだいこん', icon: 'root:white', origins: ['kanagawa'], rarity: 'unique', shin: true, season: 'fuyu',
      gather: { type: 'plant', verb: 'たねを まく', growSec: 2400, fieldLabel: 'だいこんばたけ',
        harvest: { engine: 'pluck', targetIcon: 'root:white', unripeIcon: 'leafy:lime', prompt: 'ふとった だいこんを おさえて、ゆーっくり ひきぬこう! はやいと おれちゃう' },
        care: { targetIcon: 'bird:sky', label: 'とりが はを つついてる! タップで おいはらえ!' } } },
    { id: 'm140', name: 'しょうなんゴールド', icon: 'citrus:gold', origins: ['kanagawa'], rarity: 'unique', shin: true, season: 'haru',
      gather: { type: 'plant', verb: 'なえぎを うえる', growSec: 2100, fieldLabel: 'みかんやま',
        harvest: { engine: 'catch', targetIcon: 'citrus:gold', prompt: 'おちてくる みを かごで キャッチ! えだは よけてね' },
        care: { targetIcon: 'bird:sky', label: 'とりが みを ついばんでる! タップで おいはらえ!' } } },
  ],

  /* ---------- レシピマスタ(Tier2〜4) ---------- */
  recipes: [
    /* --- いばらき --- */
    { id: 'r01', name: 'なっとう', icon: 'bowl:tan', tier: 2, type: 'kakou', pref: 'ibaraki',
      ingredients: [{ ref: 'm03', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r02', name: 'ほしいも', icon: 'sweet:amber', tier: 2, type: 'kakou', pref: 'ibaraki',
      ingredients: [{ ref: 'm04', count: 2 }] },
    { id: 'r03', name: 'うめジュース', icon: 'bottle:lime', tier: 2, type: 'kakou', pref: 'ibaraki',
      ingredients: [{ ref: 'm06', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r05', name: 'かさまやき', icon: 'pottery:brown', tier: 3, type: 'kougei', pref: 'ibaraki',
      ingredients: [{ ref: 'm07', count: 2, origin: 'ibaraki' }, { ref: 'm01', count: 1 }] },
    { id: 'r06', name: 'ブランドメロン', icon: 'melon:gold', tier: 3, type: 'syukaku', pref: 'ibaraki',
      ingredients: [{ ref: 'm05', count: 1, quality: 3 }] },
    { id: 'rf1', name: 'かいらくえん うめまつり', icon: 'flower:pink', tier: 4, type: 'matsuri', pref: 'ibaraki',
      implemented: true,
      ingredients: [{ ref: 'r03', count: 1 }, { ref: 'r05', count: 1 }],
      menu: ['r03', 'r05', 'r02'] },

    /* --- ちば --- */
    { id: 'r07', name: 'しょうゆ', icon: 'bottle:dark', tier: 2, type: 'kakou', pref: 'chiba',
      ingredients: [{ ref: 'm03', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r08', name: 'みそ', icon: 'jar:brown', tier: 2, type: 'kakou', pref: 'chiba',
      ingredients: [{ ref: 'm03', count: 1 }, { ref: 'm02', count: 1 }] },
    { id: 'r09', name: 'ゆでらっかせい', icon: 'nut:cream', tier: 2, type: 'kakou', pref: 'chiba',
      ingredients: [{ ref: 'm08', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r10', name: 'なめろう', icon: 'plate:gray', tier: 3, type: 'gattai', pref: 'chiba',
      ingredients: [{ ref: 'm09', count: 2 }, { ref: 'r08', count: 1 }] },
    { id: 'r11', name: 'ブランドなし', icon: 'round:gold', tier: 3, type: 'syukaku', pref: 'chiba',
      ingredients: [{ ref: 'm10', count: 1, quality: 3 }] },
    { id: 'rf2', name: 'ちょうし みなとまつり', icon: 'sparkle:pink', tier: 4, type: 'matsuri', pref: 'chiba',
      implemented: true, festGame: 'hanabi',
      ingredients: [{ ref: 'r10', count: 1 }, { ref: 'r09', count: 1 }],
      menu: ['r07', 'r10', 'r09'] },

    /* --- とちぎ --- */
    { id: 'r12', name: 'かんぴょう', icon: 'kanpyo:cream', tier: 2, type: 'kakou', pref: 'tochigi',
      ingredients: [{ ref: 'm12', count: 2 }] },
    { id: 'r13', name: 'いちごジャム', icon: 'jar:red', tier: 2, type: 'kakou', pref: 'tochigi',
      ingredients: [{ ref: 'm11', count: 2 }] },
    { id: 'r14', name: 'かんぴょうまき', icon: 'onigiri:dark', tier: 3, type: 'gattai', pref: 'tochigi',
      ingredients: [{ ref: 'r12', count: 1 }, { ref: 'm02', count: 1 }, { ref: 'r07', count: 1 }] },
    { id: 'r15', name: 'ましこやき', icon: 'pottery:gray', tier: 3, type: 'kougei', pref: 'tochigi',
      ingredients: [{ ref: 'm07', count: 2, origin: 'tochigi' }, { ref: 'm01', count: 1 }] },
    { id: 'rf3', name: 'ましこ とうきいち', icon: 'stall:brown', tier: 4, type: 'matsuri', pref: 'tochigi',
      implemented: true, festGame: 'rokuro',
      ingredients: [{ ref: 'r15', count: 1 }, { ref: 'r13', count: 1 }],
      menu: ['r15', 'r12', 'r13'] },

    /* --- ぐんま --- */
    { id: 'r16', name: 'こんにゃく', icon: 'sweet:gray', tier: 2, type: 'kakou', pref: 'gunma',
      ingredients: [{ ref: 'm14', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r17', name: 'きぬの スカーフ', icon: 'cloth:pink', tier: 3, type: 'kougei', pref: 'gunma',
      ingredients: [{ ref: 'm15', count: 2, origin: 'gunma' }, { ref: 'm01', count: 1 }] },
    { id: 'r18', name: 'みそこんにゃく', icon: 'skewer:brown', tier: 3, type: 'gattai', pref: 'gunma',
      ingredients: [{ ref: 'r16', count: 1 }, { ref: 'r08', count: 1 }] },
    { id: 'rf4', name: 'たかさき だるまいち', icon: 'mask:red', tier: 4, type: 'matsuri', pref: 'gunma',
      implemented: true, festGame: 'daruma',
      ingredients: [{ ref: 'r17', count: 1 }, { ref: 'r18', count: 1 }],
      menu: ['r16', 'r17', 'm13'] },

    /* --- さいたま --- */
    { id: 'r19', name: 'さやまちゃ', icon: 'pot:green', tier: 2, type: 'kakou', pref: 'saitama',
      ingredients: [{ ref: 'm16', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r20', name: 'いもようかん', icon: 'pudding:violet', tier: 2, type: 'kakou', pref: 'saitama',
      ingredients: [{ ref: 'm04', count: 2, origin: 'saitama' }] },
    { id: 'r21', name: 'くさかせんべい', icon: 'senbei:tan', tier: 3, type: 'gattai', pref: 'saitama',
      ingredients: [{ ref: 'm02', count: 2 }, { ref: 'r07', count: 1 }] },
    { id: 'rf5', name: 'かわごえまつり', icon: 'cart:brown', tier: 4, type: 'matsuri', pref: 'saitama',
      implemented: true, festGame: 'dashi',
      ingredients: [{ ref: 'r20', count: 1 }, { ref: 'r21', count: 1 }],
      menu: ['r19', 'r20', 'r21'] },

    /* --- とうきょう --- */
    { id: 'r22', name: 'ブルーベリージャム', icon: 'jar:navy', tier: 2, type: 'kakou', pref: 'tokyo',
      ingredients: [{ ref: 'm18', count: 2 }] },
    { id: 'r23', name: 'こまつなの おひたし', icon: 'bowl:green', tier: 3, type: 'gattai', pref: 'tokyo',
      ingredients: [{ ref: 'm17', count: 2 }, { ref: 'r07', count: 1 }] },
    { id: 'rf6', name: 'かんだまつり', icon: 'shrine:gold', tier: 4, type: 'matsuri', pref: 'tokyo',
      implemented: true, festGame: 'mikoshi',
      ingredients: [{ ref: 'r22', count: 1 }, { ref: 'r23', count: 1 }],
      menu: ['r22', 'r23', 'm18'] },

    /* --- かながわ --- */
    { id: 'r24', name: 'かまぼこ', icon: 'kamaboko:pink', tier: 2, type: 'kakou', pref: 'kanagawa',
      ingredients: [{ ref: 'm09', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r25', name: 'ブランドみかん', icon: 'citrus:gold', tier: 3, type: 'syukaku', pref: 'kanagawa',
      ingredients: [{ ref: 'm19', count: 1, quality: 3 }] },
    { id: 'rf7', name: 'よこはま みなとまつり', icon: 'boat:navy', tier: 4, type: 'matsuri', pref: 'kanagawa',
      implemented: true, festGame: 'sousen',
      ingredients: [{ ref: 'r24', count: 1 }, { ref: 'r25', count: 1 }],
      menu: ['r24', 'r25', 'm19'] },

    /* --- あおもり --- */
    { id: 'r26', name: 'りんごジュース', icon: 'bottle:red', tier: 2, type: 'kakou', pref: 'aomori',
      ingredients: [{ ref: 'm20', count: 2, origin: 'aomori' }] },
    { id: 'r27', name: 'くろにんにく', icon: 'onion:dark', tier: 2, type: 'kakou', pref: 'aomori',
      ingredients: [{ ref: 'm21', count: 2 }] },
    { id: 'rf8', name: 'あおもり ねぶたまつり', icon: 'lantern:crimson', tier: 4, type: 'matsuri', pref: 'aomori',
      implemented: true, festGame: 'nebuta',
      ingredients: [{ ref: 'r26', count: 1 }, { ref: 'r27', count: 1 }],
      menu: ['r26', 'r27', 'm22'] },

    /* --- いわて --- */
    { id: 'r28', name: 'のむヨーグルト', icon: 'cup:white', tier: 2, type: 'kakou', pref: 'iwate',
      ingredients: [{ ref: 'm23', count: 2 }] },
    { id: 'r29', name: 'なんぶてっきの てつびん', icon: 'pot:dark', tier: 3, type: 'kougei', pref: 'iwate',
      ingredients: [{ ref: 'm24', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'rf9', name: 'もりおか さんさおどり', icon: 'drum:brown', tier: 4, type: 'matsuri', pref: 'iwate',
      implemented: true, festGame: 'sansa',
      ingredients: [{ ref: 'r28', count: 1 }, { ref: 'r29', count: 1 }],
      menu: ['r28', 'r29', 'm20'] },

    /* --- みやぎ --- */
    { id: 'r30', name: 'ずんだもち', icon: 'sweet:lime', tier: 3, type: 'gattai', pref: 'miyagi',
      ingredients: [{ ref: 'r60', count: 1 }, { ref: 'm02', count: 1 }] },
    { id: 'r31', name: 'やきがき', icon: 'shell:amber', tier: 2, type: 'kakou', pref: 'miyagi',
      ingredients: [{ ref: 'm26', count: 2 }] },
    { id: 'rf10', name: 'せんだい たなばたまつり', icon: 'banner:pink', tier: 4, type: 'matsuri', pref: 'miyagi',
      implemented: true, festGame: 'tanabata',
      ingredients: [{ ref: 'r30', count: 1 }, { ref: 'r31', count: 1 }],
      menu: ['r30', 'r31', 'm25'] },

    /* --- あきた --- */
    { id: 'r32', name: 'きりたんぽ', icon: 'skewer:cream', tier: 2, type: 'kakou', pref: 'akita',
      ingredients: [{ ref: 'm02', count: 2, origin: 'akita' }] },
    { id: 'r33', name: 'しょっつるなべ', icon: 'pot:amber', tier: 3, type: 'gattai', pref: 'akita',
      ingredients: [{ ref: 'm27', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'rf11', name: 'あきた かんとうまつり', icon: 'lantern:gold', tier: 4, type: 'matsuri', pref: 'akita',
      implemented: true, festGame: 'kantou',
      ingredients: [{ ref: 'r32', count: 1 }, { ref: 'r33', count: 1 }],
      menu: ['r32', 'r33', 'm27'] },

    /* --- やまがた --- */
    { id: 'r34', name: 'さくらんぼジャム', icon: 'jar:crimson', tier: 2, type: 'kakou', pref: 'yamagata',
      ingredients: [{ ref: 'm28', count: 2 }] },
    { id: 'r35', name: 'いもに', icon: 'pot:brown', tier: 3, type: 'gattai', pref: 'yamagata',
      ingredients: [{ ref: 'm29', count: 2 }, { ref: 'r07', count: 1 }] },
    { id: 'r36', name: 'ブランドさくらんぼ', icon: 'berry:gold', tier: 3, type: 'syukaku', pref: 'yamagata',
      ingredients: [{ ref: 'm28', count: 1, quality: 3 }] },
    { id: 'rf12', name: 'やまがた はながさまつり', icon: 'flower:crimson', tier: 4, type: 'matsuri', pref: 'yamagata',
      implemented: true, festGame: 'hanagasa',
      ingredients: [{ ref: 'r34', count: 1 }, { ref: 'r35', count: 1 }],
      menu: ['r34', 'r35', 'm28'] },

    /* --- ふくしま --- */
    { id: 'r37', name: 'ももジュース', icon: 'bottle:pink', tier: 2, type: 'kakou', pref: 'fukushima',
      ingredients: [{ ref: 'm30', count: 2 }] },
    { id: 'r38', name: 'トマトジュース', icon: 'bottle:crimson', tier: 2, type: 'kakou', pref: 'fukushima',
      ingredients: [{ ref: 'm31', count: 2 }] },
    { id: 'rf13', name: 'ふくしま わらじまつり', icon: 'rope:tan', tier: 4, type: 'matsuri', pref: 'fukushima',
      implemented: true, festGame: 'waraji',
      ingredients: [{ ref: 'r37', count: 1 }, { ref: 'r38', count: 1 }],
      menu: ['r37', 'r38', 'm30'] },

    /* --- ほっかいどう --- */
    { id: 'r39', name: 'バター', icon: 'milk:yellow', tier: 2, type: 'kakou', pref: 'hokkaido',
      ingredients: [{ ref: 'm23', count: 2, origin: 'hokkaido' }] },
    { id: 'r40', name: 'コーンスープ', icon: 'bowl:yellow', tier: 3, type: 'gattai', pref: 'hokkaido',
      ingredients: [{ ref: 'm32', count: 2 }, { ref: 'm23', count: 1 }] },
    { id: 'rf14', name: 'さっぽろ ゆきまつり', icon: 'snowman:white', tier: 4, type: 'matsuri', pref: 'hokkaido',
      implemented: true, festGame: 'yukimatsuri',
      ingredients: [{ ref: 'r39', count: 1 }, { ref: 'r40', count: 1 }],
      menu: ['r39', 'r40', 'm33'] },

    /* --- バランス調整で追加(2026-07): 各県 tier2×2・tier3×2 に そろえる --- */
    /* ぐんま */
    { id: 'r41', name: 'うめぼし', icon: 'onigiri:crimson', tier: 2, type: 'kakou', pref: 'gunma',
      ingredients: [{ ref: 'm06', count: 2, origin: 'gunma' }] },
    /* さいたま */
    { id: 'r42', name: 'ねぎの まるやき', icon: 'stalk:amber', tier: 3, type: 'gattai', pref: 'saitama',
      ingredients: [{ ref: 'm34', count: 2, origin: 'saitama' }, { ref: 'r08', count: 1 }] },
    /* とうきょう */
    { id: 'r43', name: 'わさびづけ', icon: 'jar:teal', tier: 2, type: 'kakou', pref: 'tokyo',
      ingredients: [{ ref: 'm41', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r44', name: 'つくだに', icon: 'bowl:dark', tier: 3, type: 'gattai', pref: 'tokyo',
      ingredients: [{ ref: 'm09', count: 2 }, { ref: 'r07', count: 1 }] },
    /* かながわ */
    { id: 'r45', name: 'あしがらちゃ', icon: 'cup:green', tier: 2, type: 'kakou', pref: 'kanagawa',
      ingredients: [{ ref: 'm16', count: 2, origin: 'kanagawa' }, { ref: 'm01', count: 1 }] },
    { id: 'r46', name: 'よこすか カレー', icon: 'plate:brown', tier: 3, type: 'gattai', pref: 'kanagawa',
      ingredients: [{ ref: 'm33', count: 2 }, { ref: 'm01', count: 1 }] },
    /* ほっかいどう */
    { id: 'r47', name: 'チーズ', icon: 'cheese:yellow', tier: 2, type: 'kakou', pref: 'hokkaido',
      ingredients: [{ ref: 'm23', count: 2, origin: 'hokkaido' }] },
    { id: 'r48', name: 'かにめし', icon: 'bowl:crimson', tier: 3, type: 'gattai', pref: 'hokkaido',
      ingredients: [{ ref: 'm36', count: 2 }, { ref: 'm02', count: 1 }] },
    /* あおもり */
    { id: 'r49', name: 'ほたての かいやき', icon: 'shell:orange', tier: 3, type: 'gattai', pref: 'aomori',
      ingredients: [{ ref: 'm37', count: 2 }, { ref: 'r08', count: 1 }] },
    { id: 'r50', name: 'アップルパイ', icon: 'cake:tan', tier: 3, type: 'gattai', pref: 'aomori',
      ingredients: [{ ref: 'm20', count: 2, origin: 'aomori' }, { ref: 'r39', count: 1 }] },
    /* いわて */
    { id: 'r51', name: 'ほしわかめ', icon: 'seaweed:navy', tier: 2, type: 'kakou', pref: 'iwate',
      ingredients: [{ ref: 'm38', count: 2 }] },
    { id: 'r52', name: 'わかめの おにぎり', icon: 'onigiri:green', tier: 3, type: 'gattai', pref: 'iwate',
      ingredients: [{ ref: 'm38', count: 1 }, { ref: 'm02', count: 1 }, { ref: 'm01', count: 1 }] },
    /* みやぎ */
    { id: 'r53', name: 'ささかまぼこ', icon: 'kamaboko:cream', tier: 2, type: 'kakou', pref: 'miyagi',
      ingredients: [{ ref: 'm09', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r54', name: 'せりなべ', icon: 'pot:lime', tier: 3, type: 'gattai', pref: 'miyagi',
      ingredients: [{ ref: 'm39', count: 2 }, { ref: 'r08', count: 1 }] },
    /* あきた */
    { id: 'r55', name: 'しょっつる', icon: 'bottle:tan', tier: 2, type: 'kakou', pref: 'akita',
      ingredients: [{ ref: 'm27', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r56', name: 'はたはたずし', icon: 'onigiri:amber', tier: 3, type: 'gattai', pref: 'akita',
      ingredients: [{ ref: 'm27', count: 2 }, { ref: 'm02', count: 1, origin: 'akita' }] },
    /* やまがた */
    { id: 'r57', name: 'たまこんにゃく', icon: 'skewer:gray', tier: 2, type: 'kakou', pref: 'yamagata',
      ingredients: [{ ref: 'm14', count: 2 }, { ref: 'r07', count: 1 }] },
    /* ふくしま */
    { id: 'r58', name: 'いかにんじん', icon: 'bowl:orange', tier: 3, type: 'gattai', pref: 'fukushima',
      ingredients: [{ ref: 'm22', count: 2 }, { ref: 'r07', count: 1 }] },
    { id: 'r59', name: 'ブランドもも', icon: 'round:gold', tier: 3, type: 'syukaku', pref: 'fukushima',
      ingredients: [{ ref: 'm30', count: 1, quality: 3 }] },

    /* --- 数そろえ(2026-07): 全県 tier2×3 に そろえる ---
       いばらき・ちば が 3品だったので、そこに あわせて 各県に 1品ずつ 足した */
    { id: 'r60', name: 'ずんだ', icon: 'bowl:lime', tier: 2, type: 'kakou', pref: 'miyagi',
      ingredients: [{ ref: 'm25', count: 2, origin: 'miyagi' }, { ref: 'm01', count: 1 }] },
    { id: 'r61', name: 'にっこうゆば', icon: 'plate:cream', tier: 2, type: 'kakou', pref: 'tochigi',
      ingredients: [{ ref: 'm03', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r62', name: 'きいと', icon: 'silk:cream', tier: 2, type: 'kakou', pref: 'gunma',
      ingredients: [{ ref: 'm15', count: 2, origin: 'gunma' }, { ref: 'm01', count: 1 }] },
    { id: 'r63', name: 'いもせんべい', icon: 'senbei:amber', tier: 2, type: 'kakou', pref: 'saitama',
      ingredients: [{ ref: 'm04', count: 2, origin: 'saitama' }, { ref: 'm01', count: 1 }] },
    { id: 'r64', name: 'うどの きんぴら', icon: 'bowl:cream', tier: 2, type: 'kakou', pref: 'tokyo',
      ingredients: [{ ref: 'm42', count: 2 }, { ref: 'r07', count: 1 }] },
    { id: 'r65', name: 'ひもの', icon: 'fish:tan', tier: 2, type: 'kakou', pref: 'kanagawa',
      ingredients: [{ ref: 'm09', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r66', name: 'ソフトクリーム', icon: 'icecream:white', tier: 2, type: 'kakou', pref: 'hokkaido',
      ingredients: [{ ref: 'm23', count: 2, origin: 'hokkaido' }] },
    { id: 'r67', name: 'するめ', icon: 'squid:tan', tier: 2, type: 'kakou', pref: 'aomori',
      ingredients: [{ ref: 'm44', count: 2, origin: 'aomori' }] },
    { id: 'r68', name: 'やまぶどうジュース', icon: 'bottle:violet', tier: 2, type: 'kakou', pref: 'iwate',
      ingredients: [{ ref: 'm45', count: 2 }] },
    { id: 'r69', name: 'あまざけ', icon: 'sake:cream', tier: 2, type: 'kakou', pref: 'akita',
      ingredients: [{ ref: 'm02', count: 2, origin: 'akita' }, { ref: 'm01', count: 1 }] },
    { id: 'r70', name: 'べにばなぞめ', icon: 'cloth:red', tier: 2, type: 'kakou', pref: 'yamagata',
      ingredients: [{ ref: 'm40', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r71', name: 'てうちそば', icon: 'noodle:tan', tier: 2, type: 'kakou', pref: 'fukushima',
      ingredients: [{ ref: 'm46', count: 2 }, { ref: 'm01', count: 1 }] },

    /* ===== ちゅうぶ9県(2026-07 追加) ===== */
    /* --- にいがた --- */
    { id: 'r72', name: 'こめせんべい', icon: 'senbei:cream', tier: 2, type: 'kakou', pref: 'niigata',
      ingredients: [{ ref: 'm02', count: 2, origin: 'niigata' }] },
    { id: 'r73', name: 'しおびきざけ', icon: 'bigfish:tan', tier: 2, type: 'kakou', pref: 'niigata',
      ingredients: [{ ref: 'm47', count: 2, origin: 'niigata' }, { ref: 'm51', count: 1 }] },
    { id: 'r74', name: 'なすの つけもの', icon: 'jar:violet', tier: 2, type: 'kakou', pref: 'niigata',
      ingredients: [{ ref: 'm48', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r75', name: 'わっぱめし', icon: 'bowl:brown', tier: 3, type: 'gattai', pref: 'niigata',
      ingredients: [{ ref: 'm47', count: 1 }, { ref: 'm02', count: 1 }, { ref: 'm01', count: 1 }] },
    { id: 'r76', name: 'チューリップの はなたば', icon: 'tulip:pink', tier: 3, type: 'kougei', pref: 'niigata',
      ingredients: [{ ref: 'm49', count: 2, origin: 'niigata' }, { ref: 'm01', count: 1 }] },
    { id: 'rf15', name: 'にいがた まつり', icon: 'person-dancer:pink', tier: 4, type: 'matsuri', pref: 'niigata',
      implemented: true, festGame: 'minyou',
      ingredients: [{ ref: 'r72', count: 1 }, { ref: 'r75', count: 1 }],
      menu: ['r72', 'r75', 'r74'] },

    /* --- とやま --- */
    { id: 'r77', name: 'しろえびせんべい', icon: 'senbei:white', tier: 2, type: 'kakou', pref: 'toyama',
      ingredients: [{ ref: 'm50', count: 2 }] },
    { id: 'r78', name: 'ほたるいかの おきづけ', icon: 'squid:navy', tier: 2, type: 'kakou', pref: 'toyama',
      ingredients: [{ ref: 'm44', count: 2, origin: 'toyama' }, { ref: 'm51', count: 1 }] },
    { id: 'r79', name: 'いろどりかまぼこ', icon: 'kamaboko:red', tier: 2, type: 'kakou', pref: 'toyama',
      ingredients: [{ ref: 'm47', count: 2, origin: 'toyama' }, { ref: 'm51', count: 1 }] },
    { id: 'r80', name: 'ますのすし', icon: 'onigiri:pink', tier: 3, type: 'gattai', pref: 'toyama',
      ingredients: [{ ref: 'm47', count: 2, origin: 'toyama' }, { ref: 'm02', count: 1 }] },
    { id: 'r81', name: 'ブランドしろえび', icon: 'shrimp:gold', tier: 3, type: 'syukaku', pref: 'toyama',
      ingredients: [{ ref: 'm50', count: 1, quality: 3 }] },
    { id: 'rf16', name: 'おわら かぜの ぼん', icon: 'person-kimono:navy', tier: 4, type: 'matsuri', pref: 'toyama',
      implemented: true, festGame: 'owara',
      ingredients: [{ ref: 'r80', count: 1 }, { ref: 'r77', count: 1 }],
      menu: ['r77', 'r80', 'r79'] },

    /* --- いしかわ --- */
    { id: 'r82', name: 'かがぼうちゃ', icon: 'pot:tan', tier: 2, type: 'kakou', pref: 'ishikawa',
      ingredients: [{ ref: 'm16', count: 2, origin: 'ishikawa' }, { ref: 'm01', count: 1 }] },
    { id: 'r83', name: 'れんこんもち', icon: 'sweet:tan', tier: 2, type: 'kakou', pref: 'ishikawa',
      ingredients: [{ ref: 'm52', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r84', name: 'かにの しおゆで', icon: 'crab:crimson', tier: 2, type: 'kakou', pref: 'ishikawa',
      ingredients: [{ ref: 'm36', count: 2, origin: 'ishikawa' }, { ref: 'm51', count: 1 }] },
    { id: 'r85', name: 'くたにやき', icon: 'pottery:red', tier: 3, type: 'kougei', pref: 'ishikawa',
      ingredients: [{ ref: 'm07', count: 2, origin: 'ishikawa' }, { ref: 'm01', count: 1 }] },
    { id: 'r86', name: 'はすむし', icon: 'pot:white', tier: 3, type: 'gattai', pref: 'ishikawa',
      ingredients: [{ ref: 'm52', count: 1 }, { ref: 'm36', count: 1 }, { ref: 'm51', count: 1 }] },
    { id: 'rf17', name: 'かなざわ ひゃくまんごく まつり', icon: 'lantern:amber', tier: 4, type: 'matsuri', pref: 'ishikawa',
      implemented: true, festGame: 'tourou',
      ingredients: [{ ref: 'r85', count: 1 }, { ref: 'r86', count: 1 }],
      menu: ['r82', 'r83', 'r85'] },

    /* --- ふくい --- */
    { id: 'r87', name: 'そばこ', icon: 'grain:gray', tier: 2, type: 'kakou', pref: 'fukui',
      ingredients: [{ ref: 'm46', count: 2, origin: 'fukui' }] },
    { id: 'r88', name: 'うめシロップ', icon: 'bottle:green', tier: 2, type: 'kakou', pref: 'fukui',
      ingredients: [{ ref: 'm06', count: 2, origin: 'fukui' }, { ref: 'm01', count: 1 }] },
    { id: 'r89', name: 'かにの こうらやき', icon: 'crab:amber', tier: 2, type: 'kakou', pref: 'fukui',
      ingredients: [{ ref: 'm36', count: 2, origin: 'fukui' }, { ref: 'm51', count: 1 }] },
    { id: 'r90', name: 'おろしそば', icon: 'noodle:gray', tier: 3, type: 'gattai', pref: 'fukui',
      ingredients: [{ ref: 'r87', count: 1 }, { ref: 'm01', count: 1 }] },
    { id: 'r91', name: 'さばえの めがね', icon: 'glasses:silver', tier: 3, type: 'kougei', pref: 'fukui',
      ingredients: [{ ref: 'm53', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'rf18', name: 'えちぜん がにまつり', icon: 'crab:gold', tier: 4, type: 'matsuri', pref: 'fukui',
      implemented: true, festGame: 'kani',
      ingredients: [{ ref: 'r89', count: 1 }, { ref: 'r90', count: 1 }],
      menu: ['r89', 'r90', 'r91'] },

    /* --- やまなし --- */
    { id: 'r92', name: 'ほしぶどう', icon: 'berry:dark', tier: 2, type: 'kakou', pref: 'yamanashi',
      ingredients: [{ ref: 'm54', count: 2, origin: 'yamanashi' }] },
    { id: 'r93', name: 'ももの コンポート', icon: 'jar:orange', tier: 2, type: 'kakou', pref: 'yamanashi',
      ingredients: [{ ref: 'm30', count: 2, origin: 'yamanashi' }, { ref: 'm01', count: 1 }] },
    { id: 'r94', name: 'かぼちゃの にもの', icon: 'bowl:amber', tier: 2, type: 'kakou', pref: 'yamanashi',
      ingredients: [{ ref: 'm56', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r95', name: 'ほうとう', icon: 'noodle:amber', tier: 3, type: 'gattai', pref: 'yamanashi',
      ingredients: [{ ref: 'm56', count: 1 }, { ref: 'r08', count: 1 }, { ref: 'm01', count: 1 }] },
    { id: 'r96', name: 'すいしょうざいく', icon: 'gem:violet', tier: 3, type: 'kougei', pref: 'yamanashi',
      ingredients: [{ ref: 'm55', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'rf19', name: 'よしだの ひまつり', icon: 'torch:orange', tier: 4, type: 'matsuri', pref: 'yamanashi',
      implemented: true, festGame: 'himatsuri',
      ingredients: [{ ref: 'r95', count: 1 }, { ref: 'r96', count: 1 }],
      menu: ['r92', 'r95', 'r96'] },

    /* --- ながの --- */
    { id: 'r97', name: 'ほしきのこ', icon: 'mushroom:cream', tier: 2, type: 'kakou', pref: 'nagano',
      ingredients: [{ ref: 'm57', count: 2 }] },
    { id: 'r98', name: 'ぶどうジャム', icon: 'jar:purple', tier: 2, type: 'kakou', pref: 'nagano',
      ingredients: [{ ref: 'm54', count: 2, origin: 'nagano' }] },
    { id: 'r99', name: 'りんごバター', icon: 'jar:amber', tier: 2, type: 'kakou', pref: 'nagano',
      ingredients: [{ ref: 'm20', count: 2, origin: 'nagano' }, { ref: 'r39', count: 1 }] },
    { id: 'r100', name: 'しんしゅうそば', icon: 'noodle:brown', tier: 3, type: 'gattai', pref: 'nagano',
      ingredients: [{ ref: 'm46', count: 2, origin: 'nagano' }, { ref: 'm01', count: 1 }] },
    { id: 'r101', name: 'きのこなべ', icon: 'pot:cream', tier: 3, type: 'gattai', pref: 'nagano',
      ingredients: [{ ref: 'm57', count: 2 }, { ref: 'r08', count: 1 }] },
    { id: 'rf20', name: 'すわの おんばしら', icon: 'log:brown', tier: 4, type: 'matsuri', pref: 'nagano',
      implemented: true, festGame: 'onbashira',
      ingredients: [{ ref: 'r100', count: 1 }, { ref: 'r101', count: 1 }],
      menu: ['r97', 'r100', 'r101'] },

    /* --- ぎふ --- */
    { id: 'r102', name: 'みのわし', icon: 'scroll:cream', tier: 2, type: 'kakou', pref: 'gifu',
      ingredients: [{ ref: 'm58', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r103', name: 'ひだの つけもの', icon: 'jar:cream', tier: 2, type: 'kakou', pref: 'gifu',
      ingredients: [{ ref: 'm13', count: 2, origin: 'gifu' }, { ref: 'm51', count: 1 }] },
    { id: 'r104', name: 'あゆの しおやき', icon: 'skewer:tan', tier: 2, type: 'kakou', pref: 'gifu',
      ingredients: [{ ref: 'm59', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r105', name: 'みのやき', icon: 'pottery:cream', tier: 3, type: 'kougei', pref: 'gifu',
      ingredients: [{ ref: 'm07', count: 2, origin: 'gifu' }, { ref: 'm01', count: 1 }] },
    { id: 'r106', name: 'あゆめし', icon: 'bowl:teal', tier: 3, type: 'gattai', pref: 'gifu',
      ingredients: [{ ref: 'm59', count: 2 }, { ref: 'm02', count: 1 }] },
    { id: 'rf21', name: 'たかやままつり', icon: 'cart:gold', tier: 4, type: 'matsuri', pref: 'gifu',
      implemented: true, festGame: 'karakuri',
      ingredients: [{ ref: 'r105', count: 1 }, { ref: 'r106', count: 1 }],
      menu: ['r102', 'r104', 'r105'] },

    /* --- しずおか --- */
    { id: 'r107', name: 'しずおかちゃ', icon: 'cup:deepgreen', tier: 2, type: 'kakou', pref: 'shizuoka',
      ingredients: [{ ref: 'm16', count: 2, origin: 'shizuoka' }, { ref: 'm01', count: 1 }] },
    { id: 'r108', name: 'しらすぼし', icon: 'plate:white', tier: 2, type: 'kakou', pref: 'shizuoka',
      ingredients: [{ ref: 'm60', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r109', name: 'みかんジュース', icon: 'bottle:orange', tier: 2, type: 'kakou', pref: 'shizuoka',
      ingredients: [{ ref: 'm19', count: 2, origin: 'shizuoka' }] },
    { id: 'r110', name: 'しらすどん', icon: 'bowl:silver', tier: 3, type: 'gattai', pref: 'shizuoka',
      ingredients: [{ ref: 'm60', count: 2 }, { ref: 'm02', count: 1 }] },
    { id: 'r111', name: 'さくらえびの かきあげ', icon: 'shrimp:amber', tier: 3, type: 'gattai', pref: 'shizuoka',
      ingredients: [{ ref: 'm62', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'rf22', name: 'はままつまつり', icon: 'kite:sky', tier: 4, type: 'matsuri', pref: 'shizuoka',
      implemented: true, festGame: 'tako',
      ingredients: [{ ref: 'r107', count: 1 }, { ref: 'r110', count: 1 }],
      menu: ['r107', 'r108', 'r110'] },

    /* --- あいち --- */
    { id: 'r112', name: 'はっちょうみそ', icon: 'jar:tan', tier: 2, type: 'kakou', pref: 'aichi',
      ingredients: [{ ref: 'm03', count: 2, origin: 'aichi' }, { ref: 'm51', count: 1 }] },
    { id: 'r113', name: 'にしおの まっちゃ', icon: 'tealeaf:lime', tier: 2, type: 'kakou', pref: 'aichi',
      ingredients: [{ ref: 'm16', count: 2, origin: 'aichi' }] },
    { id: 'r114', name: 'ゆでうずらたまご', icon: 'egg:white', tier: 2, type: 'kakou', pref: 'aichi',
      ingredients: [{ ref: 'm61', count: 2 }] },
    { id: 'r115', name: 'まっちゃアイス', icon: 'icecream:green', tier: 3, type: 'gattai', pref: 'aichi',
      ingredients: [{ ref: 'r113', count: 1 }, { ref: 'm23', count: 1 }] },
    { id: 'r116', name: 'たまごプリン', icon: 'pudding:gold', tier: 3, type: 'gattai', pref: 'aichi',
      ingredients: [{ ref: 'm61', count: 2 }, { ref: 'm23', count: 1 }] },
    { id: 'rf23', name: 'つしま てんのうさい', icon: 'lantern:white', tier: 4, type: 'matsuri', pref: 'aichi',
      implemented: true, festGame: 'makiwara',
      ingredients: [{ ref: 'r112', count: 1 }, { ref: 'r115', count: 1 }],
      menu: ['r112', 'r113', 'r115'] },
    /* ===== きんき7県(2026-07 追加) ===== */
    /* --- みえ --- */
    { id: 'r117', name: 'いせちゃ', icon: 'cup:brown', tier: 2, type: 'kakou', pref: 'mie',
      ingredients: [{ ref: 'm16', count: 2, origin: 'mie' }, { ref: 'm01', count: 1 }] },
    { id: 'r118', name: 'やきのり', icon: 'seaweed:green', tier: 2, type: 'kakou', pref: 'mie',
      ingredients: [{ ref: 'm65', count: 2 }] },
    { id: 'r119', name: 'まつざかぎゅうの しぐれに', icon: 'pot:crimson', tier: 2, type: 'kakou', pref: 'mie',
      ingredients: [{ ref: 'm66', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r120', name: 'いせえびの しおやき', icon: 'shrimp:red', tier: 3, type: 'gattai', pref: 'mie',
      ingredients: [{ ref: 'm64', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r121', name: 'しんじゅの ネックレス', icon: 'pearl:silver', tier: 3, type: 'kougei', pref: 'mie',
      ingredients: [{ ref: 'm63', count: 2, quality: 3 }] },
    { id: 'rf24', name: 'くわなの いしどりまつり', icon: 'cart:red', tier: 4, type: 'matsuri', pref: 'mie',
      implemented: true, festGame: 'ishidori',
      ingredients: [{ ref: 'r118', count: 1 }, { ref: 'r120', count: 1 }],
      menu: ['r117', 'r118', 'r120'] },

    /* --- しが --- */
    { id: 'r122', name: 'おうみまいの おにぎり', icon: 'onigiri:white', tier: 2, type: 'kakou', pref: 'shiga',
      ingredients: [{ ref: 'm02', count: 2, origin: 'shiga' }, { ref: 'm51', count: 1 }] },
    { id: 'r123', name: 'あさみやちゃ', icon: 'cup:amber', tier: 2, type: 'kakou', pref: 'shiga',
      ingredients: [{ ref: 'm16', count: 2, origin: 'shiga' }, { ref: 'm01', count: 1 }] },
    { id: 'r124', name: 'ふなずし', icon: 'onigiri:tan', tier: 2, type: 'kakou', pref: 'shiga',
      ingredients: [{ ref: 'm67', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r125', name: 'しがらきやきの たぬき', icon: 'pottery:tan', tier: 3, type: 'kougei', pref: 'shiga',
      ingredients: [{ ref: 'm07', count: 2, origin: 'shiga' }, { ref: 'm01', count: 1 }] },
    { id: 'r126', name: 'おうみの ちゃがゆ', icon: 'bowl:sky', tier: 3, type: 'gattai', pref: 'shiga',
      ingredients: [{ ref: 'r123', count: 1 }, { ref: 'm02', count: 1, origin: 'shiga' }] },
    { id: 'rf25', name: 'ながはま ひきやままつり', icon: 'cart:cream', tier: 4, type: 'matsuri', pref: 'shiga',
      implemented: true, festGame: 'kabuki',
      ingredients: [{ ref: 'r122', count: 1 }, { ref: 'r126', count: 1 }],
      menu: ['r122', 'r124', 'r126'] },

    /* --- きょうと --- */
    { id: 'r127', name: 'うじまっちゃ', icon: 'bowl:deepgreen', tier: 2, type: 'kakou', pref: 'kyoto',
      ingredients: [{ ref: 'm16', count: 2, origin: 'kyoto' }, { ref: 'm01', count: 1 }] },
    { id: 'r128', name: 'くじょうねぎの やきねぎ', icon: 'stalk:yellow', tier: 2, type: 'kakou', pref: 'kyoto',
      ingredients: [{ ref: 'm34', count: 2, origin: 'kyoto' }, { ref: 'm51', count: 1 }] },
    { id: 'r129', name: 'たけのこの にもの', icon: 'bamboo:tan', tier: 2, type: 'kakou', pref: 'kyoto',
      ingredients: [{ ref: 'm68', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r130', name: 'まつたけごはん', icon: 'bowl:tan', tier: 3, type: 'gattai', pref: 'kyoto',
      ingredients: [{ ref: 'm69', count: 2 }, { ref: 'm02', count: 1 }] },
    { id: 'r131', name: 'まっちゃの わらびもち', icon: 'sweet:deepgreen', tier: 3, type: 'gattai', pref: 'kyoto',
      ingredients: [{ ref: 'r127', count: 1 }, { ref: 'm01', count: 1 }] },
    { id: 'rf26', name: 'ぎおんまつり', icon: 'cart:crimson', tier: 4, type: 'matsuri', pref: 'kyoto',
      implemented: true, festGame: 'gion',
      ingredients: [{ ref: 'r127', count: 1 }, { ref: 'r130', count: 1 }],
      menu: ['r127', 'r129', 'r131'] },

    /* --- おおさか --- */
    { id: 'r132', name: 'たこやき', icon: 'round:brown', tier: 2, type: 'kakou', pref: 'osaka',
      ingredients: [{ ref: 'm70', count: 2, origin: 'osaka' }, { ref: 'm01', count: 1 }] },
    { id: 'r133', name: 'みずなすの あさづけ', icon: 'jar:blue', tier: 2, type: 'kakou', pref: 'osaka',
      ingredients: [{ ref: 'm79', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r134', name: 'しゅんぎくの おひたし', icon: 'bowl:green', tier: 2, type: 'kakou', pref: 'osaka',
      ingredients: [{ ref: 'm71', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r135', name: 'せんしゅうたまねぎの スープ', icon: 'bowl:white', tier: 3, type: 'gattai', pref: 'osaka',
      ingredients: [{ ref: 'm72', count: 2, origin: 'osaka' }, { ref: 'm01', count: 1 }] },
    { id: 'r136', name: 'デラウェアの ゼリー', icon: 'cup:purple', tier: 3, type: 'gattai', pref: 'osaka',
      ingredients: [{ ref: 'm54', count: 2, origin: 'osaka' }, { ref: 'm01', count: 1 }] },
    { id: 'rf27', name: 'きしわだ だんじりまつり', icon: 'cart:dark', tier: 4, type: 'matsuri', pref: 'osaka',
      implemented: true, festGame: 'danjiri',
      ingredients: [{ ref: 'r132', count: 1 }, { ref: 'r135', count: 1 }],
      menu: ['r132', 'r133', 'r135'] },

    /* --- ひょうご --- */
    { id: 'r137', name: 'たんばの くろまめに', icon: 'pod:dark', tier: 2, type: 'kakou', pref: 'hyogo',
      ingredients: [{ ref: 'm03', count: 2, origin: 'hyogo' }, { ref: 'm51', count: 1, origin: 'hyogo' }] },
    { id: 'r138', name: 'あかしやき', icon: 'round:cream', tier: 2, type: 'kakou', pref: 'hyogo',
      ingredients: [{ ref: 'm70', count: 2, origin: 'hyogo' }, { ref: 'm01', count: 1 }] },
    { id: 'r139', name: 'いかなごの くぎに', icon: 'bowl:brown', tier: 2, type: 'kakou', pref: 'hyogo',
      ingredients: [{ ref: 'm73', count: 2 }, { ref: 'm51', count: 1, origin: 'hyogo' }] },
    { id: 'r140', name: 'あわじたまねぎの まるやき', icon: 'onion:amber', tier: 3, type: 'gattai', pref: 'hyogo',
      ingredients: [{ ref: 'm72', count: 2, origin: 'hyogo' }, { ref: 'm51', count: 1, origin: 'hyogo' }] },
    { id: 'r141', name: 'たこめし', icon: 'bowl:pink', tier: 3, type: 'gattai', pref: 'hyogo',
      ingredients: [{ ref: 'm70', count: 2, origin: 'hyogo' }, { ref: 'm02', count: 1 }] },
    { id: 'rf28', name: 'にしのみやの とおかえびす', icon: 'person-runner:white', tier: 4, type: 'matsuri', pref: 'hyogo',
      implemented: true, festGame: 'fukuotoko',
      ingredients: [{ ref: 'r137', count: 1 }, { ref: 'r141', count: 1 }],
      menu: ['r137', 'r139', 'r141'] },

    /* --- なら --- */
    { id: 'r142', name: 'やまとちゃ', icon: 'cup:tan', tier: 2, type: 'kakou', pref: 'nara',
      ingredients: [{ ref: 'm16', count: 2, origin: 'nara' }, { ref: 'm01', count: 1 }] },
    { id: 'r143', name: 'あすかルビーの ジャム', icon: 'jar:pink', tier: 2, type: 'kakou', pref: 'nara',
      ingredients: [{ ref: 'm11', count: 2, origin: 'nara' }, { ref: 'm01', count: 1 }] },
    { id: 'r144', name: 'ほしがき', icon: 'sweet:orange', tier: 2, type: 'kakou', pref: 'nara',
      ingredients: [{ ref: 'm74', count: 2 }] },
    { id: 'r145', name: 'よしのがわの あゆやき', icon: 'skewer:teal', tier: 3, type: 'gattai', pref: 'nara',
      ingredients: [{ ref: 'm59', count: 2, origin: 'nara' }, { ref: 'm51', count: 1 }] },
    { id: 'r146', name: 'よしのすぎの わりばし', icon: 'craft:tan', tier: 3, type: 'kougei', pref: 'nara',
      ingredients: [{ ref: 'm75', count: 2 }] },
    { id: 'rf29', name: 'わかくさやまの やまやき', icon: 'fire:orange', tier: 4, type: 'matsuri', pref: 'nara',
      implemented: true, festGame: 'yamayaki',
      ingredients: [{ ref: 'r142', count: 1 }, { ref: 'r145', count: 1 }],
      menu: ['r142', 'r144', 'r145'] },

    /* --- わかやま --- */
    { id: 'r147', name: 'なんこううめの うめぼし', icon: 'round:crimson', tier: 2, type: 'kakou', pref: 'wakayama',
      ingredients: [{ ref: 'm06', count: 2, origin: 'wakayama' }, { ref: 'm51', count: 1 }] },
    { id: 'r148', name: 'ありたみかんの ジュース', icon: 'bottle:amber', tier: 2, type: 'kakou', pref: 'wakayama',
      ingredients: [{ ref: 'm19', count: 2, origin: 'wakayama' }] },
    { id: 'r149', name: 'さんしょうの つくだに', icon: 'jar:deepgreen', tier: 2, type: 'kakou', pref: 'wakayama',
      ingredients: [{ ref: 'm76', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r150', name: 'まぐろの づけどん', icon: 'bowl:navy', tier: 3, type: 'gattai', pref: 'wakayama',
      ingredients: [{ ref: 'm77', count: 2 }, { ref: 'm02', count: 1 }] },
    { id: 'r151', name: 'すみびやきの まぐろ', icon: 'skewer:crimson', tier: 3, type: 'gattai', pref: 'wakayama',
      ingredients: [{ ref: 'm77', count: 1 }, { ref: 'm78', count: 2 }] },
    { id: 'rf30', name: 'なちの おうぎまつり', icon: 'fan:gold', tier: 4, type: 'matsuri', pref: 'wakayama',
      implemented: true, festGame: 'ougi',
      ingredients: [{ ref: 'r147', count: 1 }, { ref: 'r150', count: 1 }],
      menu: ['r147', 'r148', 'r150'] },
    /* ===== ちゅうごく5県・しこく4県(2026-07 追加) ===== */
    /* --- とっとり --- */
    { id: 'r152', name: 'にじゅっせいきなしの ゼリー', icon: 'cup:yellow', tier: 2, type: 'kakou', pref: 'tottori',
      ingredients: [{ ref: 'm10', count: 2, origin: 'tottori' }, { ref: 'm01', count: 1 }] },
    { id: 'r153', name: 'らっきょうづけ', icon: 'jar:white', tier: 2, type: 'kakou', pref: 'tottori',
      ingredients: [{ ref: 'm80', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r154', name: 'しろねぎの やきねぎ', icon: 'stalk:tan', tier: 2, type: 'kakou', pref: 'tottori',
      ingredients: [{ ref: 'm34', count: 2, origin: 'tottori' }, { ref: 'm51', count: 1 }] },
    { id: 'r155', name: 'まつばがにの しおゆで', icon: 'crab:orange', tier: 3, type: 'gattai', pref: 'tottori',
      ingredients: [{ ref: 'm36', count: 2, origin: 'tottori' }, { ref: 'm51', count: 1 }] },
    { id: 'r156', name: 'まつばがにの かにめし', icon: 'bowl:red', tier: 3, type: 'gattai', pref: 'tottori',
      ingredients: [{ ref: 'm36', count: 2, origin: 'tottori' }, { ref: 'm02', count: 1 }] },
    { id: 'rf31', name: 'とっとり しゃんしゃんまつり', icon: 'umbrella:pink', tier: 4, type: 'matsuri', pref: 'tottori',
      implemented: true, festGame: 'shanshan',
      ingredients: [{ ref: 'r153', count: 1 }, { ref: 'r155', count: 1 }],
      menu: ['r152', 'r153', 'r155'] },

    /* --- しまね --- */
    { id: 'r157', name: 'しじみの みそしる', icon: 'bowl:dark', tier: 2, type: 'kakou', pref: 'shimane',
      ingredients: [{ ref: 'm81', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r158', name: 'いずもそば', icon: 'noodle:dark', tier: 2, type: 'kakou', pref: 'shimane',
      ingredients: [{ ref: 'm46', count: 2, origin: 'shimane' }, { ref: 'm01', count: 1 }] },
    { id: 'r159', name: 'のどぐろの しおやき', icon: 'skewer:red', tier: 2, type: 'kakou', pref: 'shimane',
      ingredients: [{ ref: 'm82', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r160', name: 'たたらの ほうちょう', icon: 'knife:silver', tier: 3, type: 'kougei', pref: 'shimane',
      ingredients: [{ ref: 'm24', count: 2, origin: 'shimane' }] },
    { id: 'r161', name: 'デラウェアの ジュース', icon: 'bottle:purple', tier: 3, type: 'gattai', pref: 'shimane',
      ingredients: [{ ref: 'm54', count: 2, origin: 'shimane' }, { ref: 'm01', count: 1 }] },
    { id: 'rf32', name: 'いわみかぐら', icon: 'dragon:red', tier: 4, type: 'matsuri', pref: 'shimane',
      implemented: true, festGame: 'kagura',
      ingredients: [{ ref: 'r157', count: 1 }, { ref: 'r158', count: 1 }],
      menu: ['r157', 'r158', 'r159'] },

    /* --- おかやま --- */
    { id: 'r162', name: 'マスカットの ゼリー', icon: 'cup:lime', tier: 2, type: 'kakou', pref: 'okayama',
      ingredients: [{ ref: 'm54', count: 2, origin: 'okayama' }, { ref: 'm01', count: 1 }] },
    { id: 'r163', name: 'はくとうの コンポート', icon: 'jar:silver', tier: 2, type: 'kakou', pref: 'okayama',
      ingredients: [{ ref: 'm30', count: 2, origin: 'okayama' }, { ref: 'm01', count: 1 }] },
    { id: 'r164', name: 'ままかりずし', icon: 'onigiri:silver', tier: 2, type: 'kakou', pref: 'okayama',
      ingredients: [{ ref: 'm83', count: 2 }, { ref: 'm02', count: 1 }] },
    { id: 'r165', name: 'きにらの スープ', icon: 'bowl:yellow', tier: 3, type: 'gattai', pref: 'okayama',
      ingredients: [{ ref: 'm84', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r166', name: 'びぜんやきの つぼ', icon: 'pottery:dark', tier: 3, type: 'kougei', pref: 'okayama',
      ingredients: [{ ref: 'm07', count: 2, origin: 'okayama' }] },
    { id: 'rf33', name: 'さいだいじ えよう', icon: 'log:cream', tier: 4, type: 'matsuri', pref: 'okayama',
      implemented: true, festGame: 'eyou',
      ingredients: [{ ref: 'r164', count: 1 }, { ref: 'r165', count: 1 }],
      menu: ['r162', 'r164', 'r166'] },

    /* --- ひろしま --- */
    { id: 'r167', name: 'かきの どてなべ', icon: 'pot:orange', tier: 2, type: 'kakou', pref: 'hiroshima',
      ingredients: [{ ref: 'm26', count: 2, origin: 'hiroshima' }, { ref: 'm51', count: 1 }] },
    { id: 'r168', name: 'レモンの はちみつづけ', icon: 'jar:yellow', tier: 2, type: 'kakou', pref: 'hiroshima',
      ingredients: [{ ref: 'm85', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r169', name: 'ひろしまなの つけもの', icon: 'jar:lime', tier: 2, type: 'kakou', pref: 'hiroshima',
      ingredients: [{ ref: 'm86', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r170', name: 'あなごめし', icon: 'bowl:amber', tier: 3, type: 'gattai', pref: 'hiroshima',
      ingredients: [{ ref: 'm87', count: 2 }, { ref: 'm02', count: 1 }] },
    { id: 'r171', name: 'わけぎの ぬた', icon: 'bowl:lime', tier: 3, type: 'gattai', pref: 'hiroshima',
      ingredients: [{ ref: 'm88', count: 2 }, { ref: 'm03', count: 1 }] },
    { id: 'rf34', name: 'おのみち べっちゃーまつり', icon: 'oni:crimson', tier: 4, type: 'matsuri', pref: 'hiroshima',
      implemented: true, festGame: 'betcha',
      ingredients: [{ ref: 'r167', count: 1 }, { ref: 'r170', count: 1 }],
      menu: ['r167', 'r168', 'r170'] },

    /* --- やまぐち --- */
    { id: 'r172', name: 'ふぐの さしみ', icon: 'plate:teal', tier: 2, type: 'kakou', pref: 'yamaguchi',
      ingredients: [{ ref: 'm89', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r173', name: 'なつみかんの ママレード', icon: 'jar:gold', tier: 2, type: 'kakou', pref: 'yamaguchi',
      ingredients: [{ ref: 'm19', count: 2, origin: 'yamaguchi' }, { ref: 'm01', count: 1 }] },
    { id: 'r174', name: 'いわくにれんこんの きんぴら', icon: 'bowl:white', tier: 2, type: 'kakou', pref: 'yamaguchi',
      ingredients: [{ ref: 'm104', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r175', name: 'はなっこりーの おひたし', icon: 'bowl:teal', tier: 3, type: 'gattai', pref: 'yamaguchi',
      ingredients: [{ ref: 'm90', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r176', name: 'けんさきいかの いかそうめん', icon: 'noodle:white', tier: 3, type: 'gattai', pref: 'yamaguchi',
      ingredients: [{ ref: 'm44', count: 2, origin: 'yamaguchi' }, { ref: 'm51', count: 1 }] },
    { id: 'rf35', name: 'やない きんぎょちょうちんまつり', icon: 'lantern:orange', tier: 4, type: 'matsuri', pref: 'yamaguchi',
      implemented: true, festGame: 'kingyo',
      ingredients: [{ ref: 'r172', count: 1 }, { ref: 'r176', count: 1 }],
      menu: ['r172', 'r173', 'r176'] },

    /* --- とくしま --- */
    { id: 'r177', name: 'すだちの しぼり', icon: 'bottle:teal', tier: 2, type: 'kakou', pref: 'tokushima',
      ingredients: [{ ref: 'm91', count: 2 }] },
    { id: 'r178', name: 'なるときんときの やきいも', icon: 'tuber:amber', tier: 2, type: 'kakou', pref: 'tokushima',
      ingredients: [{ ref: 'm04', count: 2, origin: 'tokushima' }] },
    { id: 'r179', name: 'なるとわかめの すのもの', icon: 'bowl:deepgreen', tier: 2, type: 'kakou', pref: 'tokushima',
      ingredients: [{ ref: 'm38', count: 2, origin: 'tokushima' }, { ref: 'm51', count: 1 }] },
    { id: 'r180', name: 'あわあいぞめの ハンカチ', icon: 'cloth:navy', tier: 3, type: 'kougei', pref: 'tokushima',
      ingredients: [{ ref: 'm92', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r181', name: 'なるとだいの しおやき', icon: 'skewer:pink', tier: 3, type: 'gattai', pref: 'tokushima',
      ingredients: [{ ref: 'm93', count: 2, origin: 'tokushima' }, { ref: 'm51', count: 1 }] },
    { id: 'rf36', name: 'あわおどり', icon: 'person-dancer:crimson', tier: 4, type: 'matsuri', pref: 'tokushima',
      implemented: true, festGame: 'awaodori',
      ingredients: [{ ref: 'r178', count: 1 }, { ref: 'r181', count: 1 }],
      menu: ['r177', 'r178', 'r181'] },

    /* --- かがわ --- */
    { id: 'r182', name: 'さぬきうどん', icon: 'noodle:cream', tier: 2, type: 'kakou', pref: 'kagawa',
      ingredients: [{ ref: 'm94', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r183', name: 'オリーブの つけもの', icon: 'jar:green', tier: 2, type: 'kakou', pref: 'kagawa',
      ingredients: [{ ref: 'm95', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r184', name: 'いりこだし', icon: 'bottle:gray', tier: 2, type: 'kakou', pref: 'kagawa',
      ingredients: [{ ref: 'm09', count: 2, origin: 'kagawa' }, { ref: 'm01', count: 1 }] },
    { id: 'r185', name: 'きんときにんじんの にもの', icon: 'bowl:crimson', tier: 3, type: 'gattai', pref: 'kagawa',
      ingredients: [{ ref: 'm96', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r186', name: 'さぬきの てぶくろ', icon: 'glove:white', tier: 3, type: 'kougei', pref: 'kagawa',
      ingredients: [{ ref: 'm97', count: 2, origin: 'kagawa' }] },
    { id: 'rf37', name: 'さぬき ちょうさまつり', icon: 'drum:gold', tier: 4, type: 'matsuri', pref: 'kagawa',
      implemented: true, festGame: 'chousa',
      ingredients: [{ ref: 'r182', count: 1 }, { ref: 'r185', count: 1 }],
      menu: ['r182', 'r183', 'r185'] },

    /* --- えひめ --- */
    { id: 'r187', name: 'いよかんジュース', icon: 'bottle:yellow', tier: 2, type: 'kakou', pref: 'ehime',
      ingredients: [{ ref: 'm19', count: 2, origin: 'ehime' }] },
    { id: 'r188', name: 'まだいの かぶとに', icon: 'pot:pink', tier: 2, type: 'kakou', pref: 'ehime',
      ingredients: [{ ref: 'm93', count: 2, origin: 'ehime' }, { ref: 'm51', count: 1 }] },
    { id: 'r189', name: 'キウイの ジャム', icon: 'jar:sky', tier: 2, type: 'kakou', pref: 'ehime',
      ingredients: [{ ref: 'm98', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r190', name: 'いまばりの タオル', icon: 'towel:white', tier: 3, type: 'kougei', pref: 'ehime',
      ingredients: [{ ref: 'm97', count: 2, origin: 'ehime' }, { ref: 'm01', count: 1 }] },
    { id: 'r191', name: 'はだかむぎの むぎみそ', icon: 'jar:tan', tier: 3, type: 'gattai', pref: 'ehime',
      ingredients: [{ ref: 'm99', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'rf38', name: 'うわじま うしおにまつり', icon: 'oni:brown', tier: 4, type: 'matsuri', pref: 'ehime',
      implemented: true, festGame: 'ushioni',
      ingredients: [{ ref: 'r187', count: 1 }, { ref: 'r188', count: 1 }],
      menu: ['r187', 'r188', 'r190'] },

    /* --- こうち --- */
    { id: 'r192', name: 'ゆずポン', icon: 'bottle:brown', tier: 2, type: 'kakou', pref: 'kochi',
      ingredients: [{ ref: 'm100', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r193', name: 'かつおの たたき', icon: 'plate:crimson', tier: 2, type: 'kakou', pref: 'kochi',
      ingredients: [{ ref: 'm101', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r194', name: 'しょうがの あめに', icon: 'sweet:amber', tier: 2, type: 'kakou', pref: 'kochi',
      ingredients: [{ ref: 'm102', count: 2 }, { ref: 'm01', count: 1, origin: 'kochi' }] },
    { id: 'r195', name: 'ししとうの やきびたし', icon: 'plate:lime', tier: 3, type: 'gattai', pref: 'kochi',
      ingredients: [{ ref: 'm103', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r196', name: 'かつおめし', icon: 'bowl:navy', tier: 3, type: 'gattai', pref: 'kochi',
      ingredients: [{ ref: 'm101', count: 2 }, { ref: 'm02', count: 1 }] },
    { id: 'rf39', name: 'よさこいまつり', icon: 'naruko:red', tier: 4, type: 'matsuri', pref: 'kochi',
      implemented: true, festGame: 'yosakoi',
      ingredients: [{ ref: 'r193', count: 1 }, { ref: 'r196', count: 1 }],
      menu: ['r192', 'r193', 'r196'] },
    /* ===== きゅうしゅう・おきなわ8県(2026-07 追加。これで 47都道府県 コンプリート) ===== */
    /* --- ふくおか --- */
    { id: 'r197', name: 'あまおうの ジャム', icon: 'jar:crimson', tier: 2, type: 'kakou', pref: 'fukuoka',
      ingredients: [{ ref: 'm11', count: 2, origin: 'fukuoka' }, { ref: 'm01', count: 1 }] },
    { id: 'r198', name: 'やめちゃ', icon: 'cup:teal', tier: 2, type: 'kakou', pref: 'fukuoka',
      ingredients: [{ ref: 'm16', count: 2, origin: 'fukuoka' }, { ref: 'm01', count: 1 }] },
    { id: 'r199', name: 'ありあけの やきのり', icon: 'seaweed:teal', tier: 2, type: 'kakou', pref: 'fukuoka',
      ingredients: [{ ref: 'm65', count: 2, origin: 'fukuoka' }] },
    { id: 'r200', name: 'たけのこの わかたけに', icon: 'bamboo:green', tier: 3, type: 'gattai', pref: 'fukuoka',
      ingredients: [{ ref: 'm68', count: 2, origin: 'fukuoka' }, { ref: 'm01', count: 1 }] },
    { id: 'r201', name: 'かつおなの ぞうに', icon: 'pot:teal', tier: 3, type: 'gattai', pref: 'fukuoka',
      ingredients: [{ ref: 'm105', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'rf40', name: 'はかた ぎおん やまかさ', icon: 'person-carry:white', tier: 4, type: 'matsuri', pref: 'fukuoka',
      implemented: true, festGame: 'yamakasa',
      ingredients: [{ ref: 'r199', count: 1 }, { ref: 'r200', count: 1 }],
      menu: ['r197', 'r198', 'r200'] },

    /* --- さが --- */
    { id: 'r202', name: 'のりの つくだに', icon: 'jar:dark', tier: 2, type: 'kakou', pref: 'saga',
      ingredients: [{ ref: 'm65', count: 2, origin: 'saga' }, { ref: 'm51', count: 1 }] },
    { id: 'r203', name: 'さがびよりの おにぎり', icon: 'onigiri:cream', tier: 2, type: 'kakou', pref: 'saga',
      ingredients: [{ ref: 'm02', count: 2, origin: 'saga' }, { ref: 'm51', count: 1 }] },
    { id: 'r204', name: 'いちごさんの タルト', icon: 'cake:red', tier: 2, type: 'kakou', pref: 'saga',
      ingredients: [{ ref: 'm11', count: 2, origin: 'saga' }, { ref: 'm01', count: 1 }] },
    { id: 'r205', name: 'ありたやきの おさら', icon: 'plate:sky', tier: 3, type: 'kougei', pref: 'saga',
      ingredients: [{ ref: 'm07', count: 2, origin: 'saga' }] },
    { id: 'r206', name: 'むつごろうの かばやき', icon: 'skewer:brown', tier: 3, type: 'gattai', pref: 'saga',
      ingredients: [{ ref: 'm106', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'rf41', name: 'さが バルーンフェスタ', icon: 'balloon:red', tier: 4, type: 'matsuri', pref: 'saga',
      implemented: true, festGame: 'balloon',
      ingredients: [{ ref: 'r203', count: 1 }, { ref: 'r206', count: 1 }],
      menu: ['r202', 'r203', 'r206'] },

    /* --- ながさき --- */
    { id: 'r207', name: 'びわの ゼリー', icon: 'cup:amber', tier: 2, type: 'kakou', pref: 'nagasaki',
      ingredients: [{ ref: 'm107', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r208', name: 'あじの ひらき', icon: 'plate:silver', tier: 2, type: 'kakou', pref: 'nagasaki',
      ingredients: [{ ref: 'm108', count: 2, origin: 'nagasaki' }, { ref: 'm51', count: 1 }] },
    { id: 'r209', name: 'そのぎちゃ', icon: 'cup:sky', tier: 2, type: 'kakou', pref: 'nagasaki',
      ingredients: [{ ref: 'm16', count: 2, origin: 'nagasaki' }, { ref: 'm01', count: 1 }] },
    { id: 'r210', name: 'ちゃんぽん', icon: 'noodle:yellow', tier: 3, type: 'gattai', pref: 'nagasaki',
      ingredients: [{ ref: 'm94', count: 2 }, { ref: 'm108', count: 1, origin: 'nagasaki' }] },
    { id: 'r211', name: 'とらふぐの てっさ', icon: 'pufferfish:white', tier: 3, type: 'gattai', pref: 'nagasaki',
      ingredients: [{ ref: 'm89', count: 2, origin: 'nagasaki' }, { ref: 'm51', count: 1 }] },
    { id: 'rf42', name: 'ながさきくんち', icon: 'dragon:gold', tier: 4, type: 'matsuri', pref: 'nagasaki',
      implemented: true, festGame: 'kokkodesho',
      ingredients: [{ ref: 'r208', count: 1 }, { ref: 'r210', count: 1 }],
      menu: ['r207', 'r209', 'r210'] },

    /* --- くまもと --- */
    { id: 'r212', name: 'いぐさの コースター', icon: 'mat:cream', tier: 2, type: 'kougei', pref: 'kumamoto',
      ingredients: [{ ref: 'm109', count: 2 }] },
    { id: 'r213', name: 'デコポンの ジュース', icon: 'bottle:orange', tier: 2, type: 'kakou', pref: 'kumamoto',
      ingredients: [{ ref: 'm110', count: 2 }] },
    { id: 'r214', name: 'くまもとの こめせんべい', icon: 'senbei:brown', tier: 2, type: 'kakou', pref: 'kumamoto',
      ingredients: [{ ref: 'm02', count: 2, origin: 'kumamoto' }, { ref: 'm51', count: 1 }] },
    { id: 'r215', name: 'くりの きんとん', icon: 'sweet:cream', tier: 3, type: 'gattai', pref: 'kumamoto',
      ingredients: [{ ref: 'm111', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'r216', name: 'らくのうの ミルクプリン', icon: 'pudding:pink', tier: 3, type: 'gattai', pref: 'kumamoto',
      ingredients: [{ ref: 'm23', count: 2, origin: 'kumamoto' }, { ref: 'm01', count: 1 }] },
    { id: 'rf43', name: 'ふじさきはちまんぐうの あきまつり', icon: 'horse:brown', tier: 4, type: 'matsuri', pref: 'kumamoto',
      implemented: true, festGame: 'kazariuma',
      ingredients: [{ ref: 'r213', count: 1 }, { ref: 'r216', count: 1 }],
      menu: ['r212', 'r213', 'r216'] },

    /* --- おおいた --- */
    { id: 'r217', name: 'かぼすの ぽんず', icon: 'bottle:deepgreen', tier: 2, type: 'kakou', pref: 'oita',
      ingredients: [{ ref: 'm112', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r218', name: 'ほししいたけ', icon: 'mushroom:gray', tier: 2, type: 'kakou', pref: 'oita',
      ingredients: [{ ref: 'm113', count: 2 }] },
    { id: 'r219', name: 'せきあじの さしみ', icon: 'plate:pink', tier: 2, type: 'kakou', pref: 'oita',
      ingredients: [{ ref: 'm108', count: 2, origin: 'oita' }, { ref: 'm51', count: 1 }] },
    { id: 'r220', name: 'おんせんたまご', icon: 'egg:amber', tier: 3, type: 'gattai', pref: 'oita',
      ingredients: [{ ref: 'm61', count: 2 }, { ref: 'm01', count: 1, origin: 'oita' }] },
    { id: 'r221', name: 'しいたけの にもの', icon: 'bowl:gray', tier: 3, type: 'gattai', pref: 'oita',
      ingredients: [{ ref: 'm113', count: 2 }, { ref: 'm34', count: 1, origin: 'oita' }] },
    { id: 'rf44', name: 'べっぷ おんせんまつり', icon: 'hotspring:sky', tier: 4, type: 'matsuri', pref: 'oita',
      implemented: true, festGame: 'yukake',
      ingredients: [{ ref: 'r218', count: 1 }, { ref: 'r220', count: 1 }],
      menu: ['r217', 'r218', 'r220'] },

    /* --- みやざき --- */
    { id: 'r222', name: 'たいようのタマゴ', icon: 'mango:crimson', tier: 2, type: 'kakou', pref: 'miyazaki',
      ingredients: [{ ref: 'm114', count: 2 }] },
    { id: 'r223', name: 'みやざきの ちゃ', icon: 'tealeaf:green', tier: 2, type: 'kakou', pref: 'miyazaki',
      ingredients: [{ ref: 'm16', count: 2, origin: 'miyazaki' }, { ref: 'm01', count: 1 }] },
    { id: 'r224', name: 'きゅうりの あさづけ', icon: 'jar:green', tier: 2, type: 'kakou', pref: 'miyazaki',
      ingredients: [{ ref: 'm115', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r225', name: 'ピーマンの やきびたし', icon: 'plate:deepgreen', tier: 3, type: 'gattai', pref: 'miyazaki',
      ingredients: [{ ref: 'm116', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r226', name: 'マンゴーの スムージー', icon: 'cup:orange', tier: 3, type: 'gattai', pref: 'miyazaki',
      ingredients: [{ ref: 'm114', count: 2 }, { ref: 'm23', count: 1 }] },
    { id: 'rf45', name: 'ひゅうが ひょっとこ なつまつり', icon: 'mask:cream', tier: 4, type: 'matsuri', pref: 'miyazaki',
      implemented: true, festGame: 'hyottoko',
      ingredients: [{ ref: 'r222', count: 1 }, { ref: 'r225', count: 1 }],
      menu: ['r222', 'r223', 'r225'] },

    /* --- かごしま --- */
    { id: 'r227', name: 'さつまいもの かりんとう', icon: 'sweet:brown', tier: 2, type: 'kakou', pref: 'kagoshima',
      ingredients: [{ ref: 'm04', count: 2, origin: 'kagoshima' }, { ref: 'm01', count: 1 }] },
    { id: 'r228', name: 'ちらんちゃ', icon: 'cup:cream', tier: 2, type: 'kakou', pref: 'kagoshima',
      ingredients: [{ ref: 'm16', count: 2, origin: 'kagoshima' }, { ref: 'm01', count: 1 }] },
    { id: 'r229', name: 'そらまめの しおゆで', icon: 'pod:cream', tier: 2, type: 'kakou', pref: 'kagoshima',
      ingredients: [{ ref: 'm118', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r230', name: 'うなぎの かばやき', icon: 'eel:amber', tier: 3, type: 'gattai', pref: 'kagoshima',
      ingredients: [{ ref: 'm117', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r231', name: 'きんかんの あまに', icon: 'jar:orange', tier: 3, type: 'gattai', pref: 'kagoshima',
      ingredients: [{ ref: 'm119', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'rf46', name: 'かごしまの ろくがつどう', icon: 'lantern:violet', tier: 4, type: 'matsuri', pref: 'kagoshima',
      implemented: true, festGame: 'rokugatsudo',
      ingredients: [{ ref: 'r227', count: 1 }, { ref: 'r230', count: 1 }],
      menu: ['r227', 'r230', 'r231'] },

    /* --- おきなわ --- */
    { id: 'r232', name: 'くろざとう', icon: 'sweet:dark', tier: 2, type: 'kakou', pref: 'okinawa',
      ingredients: [{ ref: 'm120', count: 2 }] },
    { id: 'r233', name: 'ゴーヤーチャンプルー', icon: 'plate:green', tier: 2, type: 'kakou', pref: 'okinawa',
      ingredients: [{ ref: 'm121', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r234', name: 'パイナップルの ジュース', icon: 'bottle:gold', tier: 2, type: 'kakou', pref: 'okinawa',
      ingredients: [{ ref: 'm122', count: 2 }] },
    { id: 'r235', name: 'もずくの すのもの', icon: 'bowl:gray', tier: 3, type: 'gattai', pref: 'okinawa',
      ingredients: [{ ref: 'm123', count: 2 }, { ref: 'm51', count: 1 }] },
    { id: 'r236', name: 'べにいもの タルト', icon: 'cake:violet', tier: 3, type: 'gattai', pref: 'okinawa',
      ingredients: [{ ref: 'm124', count: 2 }, { ref: 'm23', count: 1 }] },
    /* --- どうぐ(type 'dougu') ---
       各地の ほんものの 工芸の 県で 作る(docs/DOUGU_SHIN_PLAN.md)。
       作ると save.tools[engine] = 2 に なり、その あそびの じかんが すこし のびる。
       もちものには 入らない(なんども 作れない ように 県ページで 出しわけ) */
    { id: 'rd01', name: 'えちごの かま', icon: 'sickle:silver', tier: 2, type: 'dougu', pref: 'niigata',
      tool: { engine: 'reap', level: 2 },
      ingredients: [{ ref: 'm24', count: 2 }, { ref: 'm126', count: 1 }] },
    { id: 'rd02', name: 'みきの つみとりばさみ', icon: 'scissors:red', tier: 2, type: 'dougu', pref: 'hyogo',
      tool: { engine: 'pluck', level: 2 },
      ingredients: [{ ref: 'm24', count: 2 }] },
    { id: 'rd03', name: 'べっぷの たけかご', icon: 'basket:tan', tier: 2, type: 'dougu', pref: 'oita',
      tool: { engine: 'catch', level: 2 },
      ingredients: [{ ref: 'm125', count: 2 }] },
    { id: 'rd04', name: 'するがの ちゃつみかご', icon: 'basket:lime', tier: 2, type: 'dougu', pref: 'shizuoka',
      tool: { engine: 'rhythm', level: 2 },
      ingredients: [{ ref: 'm125', count: 2 }] },
    { id: 'rd05', name: 'てっきの つるはし', icon: 'pick:silver', tier: 2, type: 'dougu', pref: 'iwate',
      tool: { engine: 'mine', level: 2 },
      ingredients: [{ ref: 'm24', count: 2 }, { ref: 'm126', count: 1 }] },
    { id: 'rd06', name: 'えっちゅうの すくいあみ', icon: 'net:teal', tier: 2, type: 'dougu', pref: 'toyama',
      tool: { engine: 'scoop', level: 2 },
      ingredients: [{ ref: 'm126', count: 1 }, { ref: 'm24', count: 1 }] },
    { id: 'rd07', name: 'みかわの くまで', icon: 'rake:tan', tier: 2, type: 'dougu', pref: 'aichi',
      tool: { engine: 'shell', level: 2 },
      ingredients: [{ ref: 'm126', count: 1 }, { ref: 'm24', count: 1 }] },
    { id: 'rd08', name: 'あきたの ゆきべら', icon: 'shovel:sky', tier: 2, type: 'dougu', pref: 'akita',
      tool: { engine: 'sweep', level: 2 },
      ingredients: [{ ref: 'm126', count: 2 }] },
    { id: 'rd09', name: 'きょうの しゅうかくかご', icon: 'basket:brown', tier: 2, type: 'dougu', pref: 'kyoto',
      tool: { engine: 'chain', level: 2 },
      ingredients: [{ ref: 'm125', count: 2 }] },
    { id: 'rd10', name: 'かがわの てぶくろ', icon: 'glove:white', tier: 2, type: 'dougu', pref: 'kagawa',
      tool: { engine: 'flick', level: 2 },
      ingredients: [{ ref: 'm97', count: 2 }] },
    { id: 'rd11', name: 'きしゅうの つりざお', icon: 'rod:tan', tier: 2, type: 'dougu', pref: 'wakayama',
      tool: { engine: 'fish', level: 2 },
      ingredients: [{ ref: 'm125', count: 1 }, { ref: 'm24', count: 1 }] },

    /* --- きわみの どうぐ(Lv3) ---
       Lv2 の どうぐを 20回 つかいこむと レシピが 目を さます(core/tools.ts の
       TOOL_LV3_USES)。材料は どうぐの 材料の ★3(うでまえの あかし)。
       ※設計時は 「しんの めいさん級の 素材」の 予定だったが、どうぐの 県と
         しんの 県が はなれて いて 不自然なので ★3指定に かえた */
    { id: 'rd21', name: 'きわみの かま', icon: 'sickle:gold', tier: 2, type: 'dougu', pref: 'niigata',
      tool: { engine: 'reap', level: 3 },
      ingredients: [{ ref: 'm24', count: 2, quality: 3 }, { ref: 'm126', count: 1, quality: 3 }] },
    { id: 'rd22', name: 'きわみの つみとりばさみ', icon: 'scissors:amber', tier: 2, type: 'dougu', pref: 'hyogo',
      tool: { engine: 'pluck', level: 3 },
      ingredients: [{ ref: 'm24', count: 2, quality: 3 }] },
    { id: 'rd23', name: 'きわみの たけかご', icon: 'basket:gold', tier: 2, type: 'dougu', pref: 'oita',
      tool: { engine: 'catch', level: 3 },
      ingredients: [{ ref: 'm125', count: 2, quality: 3 }] },
    { id: 'rd24', name: 'きわみの ちゃつみかご', icon: 'basket:amber', tier: 2, type: 'dougu', pref: 'shizuoka',
      tool: { engine: 'rhythm', level: 3 },
      ingredients: [{ ref: 'm125', count: 2, quality: 3 }] },
    { id: 'rd25', name: 'きわみの つるはし', icon: 'pick:gold', tier: 2, type: 'dougu', pref: 'iwate',
      tool: { engine: 'mine', level: 3 },
      ingredients: [{ ref: 'm24', count: 2, quality: 3 }, { ref: 'm126', count: 1, quality: 3 }] },
    { id: 'rd26', name: 'きわみの すくいあみ', icon: 'net:gold', tier: 2, type: 'dougu', pref: 'toyama',
      tool: { engine: 'scoop', level: 3 },
      ingredients: [{ ref: 'm126', count: 1, quality: 3 }, { ref: 'm24', count: 1, quality: 3 }] },
    { id: 'rd27', name: 'きわみの くまで', icon: 'rake:gold', tier: 2, type: 'dougu', pref: 'aichi',
      tool: { engine: 'shell', level: 3 },
      ingredients: [{ ref: 'm126', count: 1, quality: 3 }, { ref: 'm24', count: 1, quality: 3 }] },
    { id: 'rd28', name: 'きわみの ゆきべら', icon: 'shovel:gold', tier: 2, type: 'dougu', pref: 'akita',
      tool: { engine: 'sweep', level: 3 },
      ingredients: [{ ref: 'm126', count: 2, quality: 3 }] },
    { id: 'rd29', name: 'きわみの しゅうかくかご', icon: 'basket:crimson', tier: 2, type: 'dougu', pref: 'kyoto',
      tool: { engine: 'chain', level: 3 },
      ingredients: [{ ref: 'm125', count: 2, quality: 3 }] },
    { id: 'rd30', name: 'きわみの てぶくろ', icon: 'glove:gold', tier: 2, type: 'dougu', pref: 'kagawa',
      tool: { engine: 'flick', level: 3 },
      ingredients: [{ ref: 'm97', count: 2, quality: 3 }] },
    { id: 'rd31', name: 'きわみの つりざお', icon: 'rod:gold', tier: 2, type: 'dougu', pref: 'wakayama',
      tool: { engine: 'fish', level: 3 },
      ingredients: [{ ref: 'm125', count: 1, quality: 3 }, { ref: 'm24', count: 1, quality: 3 }] },

    /* --- しんの めいさんの レシピ(かんとう試作。shin) ---
       材料は かんとうで そろう ものだけ(進行順テストの 約束) */
    { id: 'rs01', name: 'れんこんの きんぴら', icon: 'bowl:brown', tier: 3, type: 'gattai', pref: 'ibaraki', shin: true,
      ingredients: [{ ref: 'm127', count: 2 }] },
    { id: 'rs02', name: 'あんこうなべ', icon: 'pot:orange', tier: 3, type: 'gattai', pref: 'ibaraki', shin: true,
      ingredients: [{ ref: 'm128', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'rs03', name: 'かんぴょうまき', icon: 'onigiri:navy', tier: 3, type: 'gattai', pref: 'tochigi', shin: true,
      ingredients: [{ ref: 'm129', count: 2 }, { ref: 'm02', count: 1 }] },
    { id: 'rs04', name: 'にらの おひたし', icon: 'plate:green', tier: 3, type: 'gattai', pref: 'tochigi', shin: true,
      ingredients: [{ ref: 'm130', count: 2 }] },
    { id: 'rs05', name: 'しもにたねぎの やきねぎ', icon: 'plate:lime', tier: 3, type: 'gattai', pref: 'gunma', shin: true,
      ingredients: [{ ref: 'm131', count: 2 }] },
    { id: 'rs06', name: 'まいたけごはん', icon: 'bowl:cream', tier: 3, type: 'gattai', pref: 'gunma', shin: true,
      ingredients: [{ ref: 'm132', count: 2 }, { ref: 'm02', count: 1 }] },
    { id: 'rs07', name: 'くわいの にもの', icon: 'bowl:sky', tier: 3, type: 'gattai', pref: 'saitama', shin: true,
      ingredients: [{ ref: 'm133', count: 2 }] },
    { id: 'rs08', name: 'さといもの にっころがし', icon: 'bowl:gray', tier: 3, type: 'gattai', pref: 'saitama', shin: true,
      ingredients: [{ ref: 'm134', count: 2 }] },
    { id: 'rs09', name: 'あしたばの おひたし', icon: 'plate:deepgreen', tier: 3, type: 'gattai', pref: 'tokyo', shin: true,
      ingredients: [{ ref: 'm135', count: 2 }] },
    { id: 'rs10', name: 'パッションフルーツジュース', icon: 'bottle:violet', tier: 3, type: 'kakou', pref: 'tokyo', shin: true,
      ingredients: [{ ref: 'm136', count: 2 }, { ref: 'm01', count: 1 }] },
    { id: 'rs11', name: 'きんめだいの につけ', icon: 'plate:red', tier: 3, type: 'gattai', pref: 'chiba', shin: true,
      ingredients: [{ ref: 'm137', count: 2 }] },
    { id: 'rs12', name: 'なばなの からしあえ', icon: 'bowl:yellow', tier: 3, type: 'gattai', pref: 'chiba', shin: true,
      ingredients: [{ ref: 'm138', count: 2 }] },
    { id: 'rs13', name: 'みうらだいこんの ふろふき', icon: 'bowl:white', tier: 3, type: 'gattai', pref: 'kanagawa', shin: true,
      ingredients: [{ ref: 'm139', count: 2 }] },
    { id: 'rs14', name: 'しょうなんゴールドの ゼリー', icon: 'pudding:amber', tier: 3, type: 'kakou', pref: 'kanagawa', shin: true,
      ingredients: [{ ref: 'm140', count: 2 }, { ref: 'm01', count: 1 }] },

    { id: 'rf47', name: 'なは おおづなひき', icon: 'rope:crimson', tier: 4, type: 'matsuri', pref: 'okinawa',
      implemented: true, festGame: 'tsunahiki',
      ingredients: [{ ref: 'r232', count: 1 }, { ref: 'r236', count: 1 }],
      menu: ['r232', 'r233', 'r236'] },
  ],

  /* ---------- ものしりカード(checkは裏取り未了マーク) ---------- */
  trivia: [
    { target: 'm01', text: 'おいしい みずが、おいしい たべものを つくるよ。めいすいの さとで くんだ みずは、ほかの けんの めいぶつづくりにも つかえるんだ!' },
    { target: 'm02', text: 'こめは にほんじゅうで つくられている、みんなの しゅしょくだよ。' },
    { target: 'm03', text: 'だいずは「はたけの おにく」と よばれるくらい えいようまんてん!' },
    { target: 'm04', text: 'いばらきや ちばでは、あまい さつまいもづくりが とても さかんだよ。' },
    { target: 'm05', text: 'いばらきけんは メロンの しゅうかくりょうが にほんいち! なんじゅうねんも 1いを つづけているよ。' },
    { target: 'm06', text: 'みとの かいらくえんには、うめのきが たーくさん うえられているよ。' },
    { target: 'm07', text: 'かさま(いばらき)と ましこ(とちぎ)は、やきものの まちとして ゆうめいだよ。' },
    { target: 'm08', text: 'ちばけんは らっかせいづくりが にほんいち! ぜんこくの 8わり いじょうが ちばさんだよ。' },
    { target: 'm09', text: 'ちばの ちょうしこうは、さかなの みずあげが にほんいちの みなと。いわしも たくさん あがるよ。' },
    { target: 'm10', text: 'ちばや とちぎ、ふくしまでは みずみずしい なしが とれるよ。やまがたの ようなしは にほんいち!' },
    { target: 'm11', text: 'とちぎけんは いちごの しゅうかくりょうが にほんいち! 50ねん いじょう 1いを つづけているよ。' },
    { target: 'm12', text: 'ゆうがおの みから、かんぴょうが つくられるよ。ぜんこくの ほとんどが とちぎさん!' },
    { target: 'r01', text: 'なっとうは だいずを はっこうさせた たべもの。みとの なっとうは とっても ゆうめい!' },
    { target: 'r02', text: 'ほしいもは さつまいもを おひさまで ほして、あまーく した おやつだよ。' },
    { target: 'r03', text: 'うめの みで つくる ジュースは、あまずっぱくて げんきが でる!' },
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
    { target: 'rf2', text: 'ちょうしの みなとまつりは、むかしから つづく うみの ぎょうじに はなびが くわわって うまれた おまつりだよ。' },
    { target: 'rf3', text: 'ましこでは、はると あきの 2かい、おおきな とうきいちが ひらかれるよ。' },
    { target: 'm13', text: 'ぐんまの つまごいむらは、すずしい こうげんで そだてる なつの キャベツが にほんいちだよ。' },
    { target: 'm14', text: 'ぷるぷるの こんにゃくは「こんにゃくいも」という いもから できるよ。ぜんこくの 9わりが ぐんまさん!' },
    { target: 'm15', text: 'かいこが つくる まゆから、きぬの いとが とれるよ。ぐんまの とみおかせいしじょうは せかいいさん!' },
    { target: 'm16', text: 'さいたまの さやまちゃは、こい あじと かおりが じまんの おちゃだよ。' },
    { target: 'm17', text: 'こまつなの なまえは、とうきょうの「こまつがわ」という ばしょから ついたと いわれているよ。' },
    { target: 'm18', text: 'とうきょうの こだいらは、にほんで はじめて ブルーベリーを そだてた まちなんだ。' },
    { target: 'm19', text: 'かながわの うみぞいは ひあたりが よくて、みかんづくりが さかんだよ。' },
    { target: 'r16', text: 'こんにゃくいもを すりつぶして かためると、ぷるんぷるんの こんにゃくの できあがり!' },
    { target: 'r17', text: 'きぬは まゆから とれる いと。かるくて つやつやで、むかしから たからものだったよ。' },
    { target: 'r18', text: 'こんにゃくの さんち ぐんまでは、あまい みそを つけた こんにゃくが だいにんきの おやつだよ。' },
    { target: 'r19', text: '「いろは しずおか、かおりは うじよ、あじは さやまで とどめさす」と うたわれた おちゃだよ。' },
    { target: 'r20', text: 'さいたまの かわごえは「いもの まち」。さつまいもの おかしが いーっぱい あるよ。' },
    { target: 'r21', text: 'おこめを ついて、しょうゆを ぬって やく。さいたまの そうかは せんべいの まちとして ゆうめいだよ。' },
    { target: 'r22', text: 'ブルーベリーを ことこと につめると、パンに ぴったりの あまい ジャムに なるよ。' },
    { target: 'r23', text: 'こまつなは カルシウムが たっぷりの やさい。おひたしで もりもり たべよう!' },
    { target: 'r24', text: 'かながわの おだわらは かまぼこの まち。しんせんな さかなから つくられるよ。' },
    { target: 'r25', text: 'おひさまを いっぱい あびた ほし3つの みかんだけが、ブランドみかんに えらばれるよ。' },
    { target: 'rf4', text: 'たかさきの だるまいちは、ねがいを こめて だるまを えらぶ、おしょうがつの にほんいち おおきな いちだよ。' },
    { target: 'rf5', text: 'かわごえまつりでは、おおきくて りっぱな だしが まちを ねりあるくよ。' },
    { target: 'rf6', text: 'かんだまつりは、えどの じだいから つづく とうきょうの おおきな おまつりだよ。' },
    { target: 'rf7', text: 'よこはまは にほんを だいひょうする みなとまち。みなとの おまつりでは パレードや はなびで にぎわうよ。' },

    /* --- とうほく --- */
    { target: 'm20', text: 'あおもりけんは りんごづくりが にほんいち! ぜんこくの 6わり いじょうを つくっているよ。' },
    { target: 'm21', text: 'あおもりの たっこまちは「にんにくの さと」と よばれる、ゆうめいな さんちだよ。' },
    { target: 'm22', text: 'ゆきの したで ふゆを こした にんじんは、さむさから みを まもろうとして あまーく なるんだ。' },
    { target: 'm23', text: 'いわてには ひろーい ぼくじょうが あって、うしさんが のんびり くらしているよ。' },
    { target: 'm24', text: 'いわての なんぶてっきは、てつから つくる でんとうこうげい。400ねん いじょうの れきしが あるよ。' },
    { target: 'm25', text: 'ずんだは えだまめを すりつぶした みやぎの あじ。あざやかな みどりいろが きれい!' },
    { target: 'm26', text: 'かきは いかだから つるした ロープに くっついて そだつよ。つりざおでは とらないんだ!' },
    { target: 'm27', text: 'はたはたは あきたを だいひょうする さかな。ふゆの あらしの ころに やってくるよ。' },
    { target: 'm28', text: 'やまがたけんは さくらんぼづくりが にほんいち! ぜんこくの 8わりくらいが やまがたさんだよ。' },
    { target: 'm29', text: 'さといもは ねばねばが おいしい おいも。やまがたの あきの なべに かかせない!' },
    { target: 'm30', text: 'ふくしまけんは ももの しゅうかくりょうが ぜんこく2い!「あかつき」という ももが ゆうめいだよ。' },
    { target: 'm31', text: 'ふくしまの やまあいでは、ひると よるの おんどの さで あまい トマトが そだつよ。' },
    { target: 'r26', text: 'あおもりの りんごを ぎゅっと しぼった ジュースは、あまくて さっぱり!' },
    { target: 'r27', text: 'にんにくを じっくり ねかせると、まっくろで あまーい くろにんにくに へんしんするよ。' },
    { target: 'r28', text: 'しぼりたての ぎゅうにゅうから つくる のむヨーグルト。ぼくじょうの あじだよ。' },
    { target: 'r29', text: 'なんぶてっきの てつびんで わかした おゆは、まろやかで おいしいと いわれているよ。' },
    { target: 'r30', text: 'ずんだもちは えだまめの あんを おもちに たっぷり のせた みやぎの めいぶつだよ。' },
    { target: 'r31', text: 'やきがきは かいがらごと やく ごちそう! うみの かおりが ふわーっと ひろがるよ。' },
    { target: 'r32', text: 'きりたんぽは ごはんを ぼうに まきつけて やいた あきたの めいぶつだよ。' },
    { target: 'r33', text: 'しょっつるは はたはたから つくる あきたの ちょうみりょう。なべに いれると うまみたっぷり!' },
    { target: 'r34', text: 'まっかな さくらんぼを ことこと につめた、たからものみたいな ジャムだよ。' },
    { target: 'r35', text: 'やまがたの あきは「いもにかい」! かわらで おおきな なべを かこんで いもにを たべるよ。' },
    { target: 'r36', text: 'つやつやの ほし3つの さくらんぼは まるで ほうせき。「あかい ほうせき」と よばれるよ。' },
    { target: 'r37', text: 'ふくしまの ももを まるごと しぼった ジュースは、あまくて とろーり!' },
    { target: 'r38', text: 'かんじゅくトマトを しぼった ジュースは、えいよう まんてんの あかい ジュースだよ。' },
    { target: 'rf8', text: 'ねぶたまつりでは、おおきな ひかる ねぶたが まちを すすむよ。「ラッセラー!」の かけごえで はねて おどるんだ。' },
    { target: 'rf9', text: 'さんさおどりは たいこを たたきながら おどる もりおかの おまつり。たいこの かずは ギネスせかいきろくだよ!' },
    { target: 'rf10', text: 'せんだいたなばたでは、おおきな かみかざりが まちいっぱいに ゆれるよ。ねがいごとも かざるんだ。' },
    { target: 'rf11', text: 'かんとうまつりは、ちょうちんを いっぱい つけた ながい さおを、てのひらや おでこで バランスを とって ささえる おまつりだよ。' },
    { target: 'rf12', text: 'はながさまつりは、はなの かさを くるくる まわして おどる やまがたの おまつりだよ。' },
    { target: 'rf13', text: 'わらじまつりでは、ながさ 12メートルの にほんいちの おおわらじを みんなで かついで あるくよ。' },
    { target: 'm32', text: 'ほっかいどうは あまい とうもろこしづくりが にほんいち! ぜんこくの やくはんぶんを つくっているよ。' },
    { target: 'm33', text: 'ほっかいどうは じゃがいもづくりが にほんいち! ぜんこくの 8わりくらいが ほっかいどうさんだよ。' },
    { target: 'r39', text: 'しぼりたての ぎゅうにゅうから つくる バター。ほっかいどうの ぼくじょうの めぐみだよ。' },
    { target: 'r40', text: 'あまい とうもろこしと ぎゅうにゅうで つくる、あったか〜い スープだよ。' },
    { target: 'rf14', text: 'さっぽろ ゆきまつりでは、ゆきで つくった おおきな ぞうが まちに ずらーっと ならぶよ。' },

    /* --- バランス調整で追加した そざい・めいぶつ(2026-07) --- */
    { target: 'm34', text: 'ねぎは まちごとに めいさんが あるよ。さいたまの ふかや、ぐんまの しもにた、あきたの しらかみ!' },
    { target: 'm35', text: 'かながわの みうら はんとうでは、あまい すいかが そだつよ。' },
    { target: 'm36', text: 'かには「かにかご」を うみに しずめて とるよ。ロープを ひきあげて とりだすんだ。' },
    { target: 'm37', text: 'ほたては うみに つるした かごの なかで そだてるよ。ひきあげて ひとつずつ はずすんだ。' },
    { target: 'm38', text: 'いわての さんりくの うみは わかめの めいさんち。なみに ゆられて そだつよ。' },
    { target: 'm39', text: 'せんだいの せりは「ねっこまで たべる」のが とくちょう。しゃきしゃきで おいしいよ。' },
    { target: 'm40', text: 'べにばなは さいた ときは きいろ、だんだん あかく なる ふしぎな はな。やまがたけんの はなだよ。' },
    { target: 'm41', text: 'わさびは とても きれいな みずの ところでしか そだたないよ。とうきょうの おくたまが めいさんち。' },
    { target: 'm42', text: 'とうきょうの うどは、ひかりを いれない ちかの あなぐら(むろ)で まっしろに そだてるよ。' },
    { target: 'r41', text: 'うめを しおに つけて ほすと、すっぱい うめぼしに なるよ。おにぎりに ぴったり!' },
    { target: 'r42', text: 'ふかやねぎを まるごと やくと、なかが とろとろ あまーくなる さいたまの たべかただよ。' },
    { target: 'r43', text: 'わさびを こまかく して つけものに。ちょっぴり ぴりっとする おとなの あじ!' },
    { target: 'r44', text: 'つくだには とうきょうの つくだじまで うまれた ごはんの おとも。えどじだいからの あじだよ。' },
    { target: 'r45', text: 'あしがらちゃは かながわの やまで そだつ おちゃ。かおりが いいんだ。' },
    { target: 'r46', text: 'よこすかは「カレーの まち」を せんげんした まち。じゃがいもが ごろごろ はいっているよ!' },
    { target: 'r47', text: 'ぎゅうにゅうを かためて ねかせると チーズに へんしん! ほっかいどうは チーズづくりが さかん。' },
    { target: 'r48', text: 'ほっかいどうの おしゃまんべの えきで うられてきた かにめしは、むかしから ゆうめいな えきべんだよ。' },
    { target: 'r49', text: 'ほたてを かいがらの まま みそで やく「かいやき」は、あおもりの きょうどりょうりだよ。' },
    { target: 'r50', text: 'あおもりの ひろさきは アップルパイの まち。40しゅるい いじょうの アップルパイが あるんだ!' },
    { target: 'r51', text: 'わかめを おひさまで ほすと、ながく ほぞんできる ほしわかめに なるよ。' },
    { target: 'r52', text: 'わかめを まぜこんだ おにぎりは、うみの かおりが して おいしいよ。' },
    { target: 'r53', text: 'ささかまぼこは、ささの はっぱの かたちを した みやぎの めいぶつだよ。' },
    { target: 'r54', text: 'せりなべは、せりを ねっこごと どーんと いれる せんだいの なべりょうりだよ。' },
    { target: 'r55', text: 'しょっつるは はたはたから つくる あきたの ちょうみりょう。うまみが たっぷり!' },
    { target: 'r56', text: 'はたはたずしは、はたはたと おこめを いっしょに ねかせて つくる あきたの ごちそうだよ。' },
    { target: 'r57', text: 'たまこんにゃくは まるい こんにゃくを しょうゆで にた やまがたの おやつ。くしで たべるよ!' },
    { target: 'r58', text: 'いかにんじんは、にんじんを ほそく きって つける ふくしまの きょうどりょうりだよ。' },
    { target: 'r59', text: 'たいようを いっぱい あびた ほし3つの ももだけが、ブランドももに えらばれるよ。' },
    { target: 'm43', text: 'さいたまけんは ブロッコリーの しゅうかくりょうが ぜんこく2い! つぼみを たべる やさいだよ。' },
    { target: 'm44', text: 'いかつりの ふねは、よるに あかりを つけて いかを あつめるよ。はこだてや はちのへが ゆうめい!' },
    { target: 'm45', text: 'やまぶどうは やまに はえる ちいさな ぶどう。すっぱくて、いわてでは ジュースに するよ。' },
    { target: 'm46', text: 'そばの はなは しろくて、はたけが ゆきのように みえるよ。あいづの そばは ゆうめい!' },
    { target: 'r60', text: 'ずんだは えだまめを すりつぶして つくる みどりの あん。みやぎの あじだよ。' },
    { target: 'r61', text: 'ゆばは だいずの しるの うわずみから できるよ。にっこうの ゆばは あつくて ゆうめい!' },
    { target: 'r62', text: 'まゆから ほそい いとを ひきだすと きいとに なるよ。ぐんまの とみおかは いとの まち!' },
    { target: 'r63', text: 'かわごえの いもせんべいは、さつまいもを うすく きって やいた ぱりぱりの おやつだよ。' },
    { target: 'r64', text: 'まっしろな うどを しょうゆで いためた きんぴら。しゃきしゃきの はごたえ!' },
    { target: 'r65', text: 'おだわらの ひものは、さかなを ひらいて ほした めいぶつだよ。' },
    { target: 'r66', text: 'ほっかいどうの ぎゅうにゅうで つくる ソフトクリームは、こくが あって おいしいよ!' },
    { target: 'r67', text: 'いかを ひらいて ほすと するめに なるよ。かむほど あじが でるんだ。' },
    { target: 'r68', text: 'やまぶどうの ジュースは あかむらさきいろ。すっぱくて えいようまんてん!' },
    { target: 'r69', text: 'あまざけは おこめから つくる あまい のみもの。あきたは おこめの めいさんちだよ。' },
    { target: 'r70', text: 'べにばなで そめると、あざやかな あかや オレンジに なるよ。やまがたの でんとうの わざ!' },
    { target: 'r71', text: 'そばの こなを みずで こねて ほそく きると、てうちそばの かんせい!' },
    /* --- ちゅうぶ9県(2026-07) --- */
    { target: 'm47', text: 'にいがたの むらかみでは、かわを のぼる さけを むかしから たいせつに してきたよ。' },
    { target: 'm48', text: 'にいがたけんは なすの さくづけめんせきが ぜんこく トップクラス。とれた なすは じもとで ほとんど たべられちゃうんだって!' },
    { target: 'm49', text: 'にいがたと とやまは チューリップの きゅうこんの さんち。はるは はなが いちめんに さくよ。' },
    { target: 'm50', text: 'しろえびは とやまわんの そこに すむ すきとおった えび。「とやまわんの ほうせき」と よばれるよ。' },
    { target: 'm51', text: 'のとの しおは、うみみずを すなに まいて おひさまで かわかす むかしからの つくりかただよ。' },
    { target: 'm52', text: 'かがれんこんは どろの なかで そだつよ。ほるのが たいへんだけど もちもちで おいしい!' },
    { target: 'm53', text: 'かるくて さびにくい チタンは、めがねの わくに ぴったり。ふくいの さばえは めがねの まち!' },
    { target: 'm54', text: 'やまなしけんと ながのけんは ぶどうの めいさんち。あまい きょほうや シャインマスカットが とれるよ。' },
    { target: 'm55', text: 'こうしゅう(やまなし)の すいしょうざいくは、いしを みがいて つくる でんとうこうげいだよ。' },
    { target: 'm56', text: 'やまなしの ほうとうには、あまい かぼちゃが かかせないよ。' },
    { target: 'm57', text: 'ながのけんは きのこづくりが にほんいち! えのきたけや しめじが たくさん とれるよ。' },
    { target: 'm58', text: 'こうぞの きの かわから、じょうぶな みのわしが つくられるよ。みずに つけて たたいて つくるんだ。' },
    { target: 'm59', text: 'ぎふの ながらがわでは、かがり火の あかりと うを つかった「うかい」で あゆを とるよ。' },
    { target: 'm60', text: 'しらすは いわしの あかちゃん。しずおかの するがわんで たくさん とれるよ。' },
    { target: 'm61', text: 'あいちけんは うずらの たまごが にほんいち! にわとりの たまごより ずっと ちいさいよ。' },
    { target: 'r72', text: 'にいがたは こめの めいさんち。おこめから せんべいや あられも たくさん つくられるよ。' },
    { target: 'r73', text: 'しおびきざけは、さけを しおに つけて かぜで かわかす むらかみの ほぞんしょくだよ。' },
    { target: 'r74', text: 'なすを しおで つけると、ぱりぱりの つけものに なるよ。' },
    { target: 'r75', text: 'わっぱめしは まるい きの いれものに ごはんと さけを のせた にいがたの めいぶつだよ。' },
    { target: 'r76', text: 'にいがたは チューリップの きりばなの しゅっかも おおい。はなたばに すると はなやかだね!' },
    { target: 'r77', text: 'しろえびを まるごと やきこんだ せんべいは、とやまの にんきの おみやげだよ。' },
    { target: 'r78', text: 'ほたるいかは よるに あおく ひかる ふしぎな いか。とやまわんの はるの めいぶつだよ。' },
    { target: 'r79', text: 'とやまの かまぼこは、いろどりや もようが きれいで、おいわいごとに つかわれるよ。' },
    { target: 'r80', text: 'ますのすしは、まるい わっぱに さけの なかまを ならべて おしずしに した とやまの えきべんだよ。' },
    { target: 'r81', text: 'とくべつに おおきくて すきとおった ほし3つの しろえびだけが ブランドに えらばれるよ。' },
    { target: 'r82', text: 'かがぼうちゃは、ちゃの くきを つかって ふかく いった かなざわの おちゃだよ。' },
    { target: 'r83', text: 'れんこんを すりおろして やくと、もちもちの れんこんもちに なるよ。' },
    { target: 'r84', text: 'いしかわの かには「かのうガニ」と よばれる ブランド。しおで ゆでるのが いちばん!' },
    { target: 'r85', text: 'くたにやきは、あかや あおの あざやかな えが とくちょうの いしかわの やきものだよ。' },
    { target: 'r86', text: 'はすむしは、すりおろした れんこんで ぐを つつんで むした かなざわの りょうりだよ。' },
    { target: 'r87', text: 'そばの みを こまかく ひくと そばこに なるよ。これが おそばの もとだよ。' },
    { target: 'r88', text: 'ふくいの うめは つぶが おおきくて かおりが よいと いわれるよ。' },
    { target: 'r89', text: 'えちぜんがには ふくいの ふゆの ごちそう。こうらの なかまで あじが つまっているよ。' },
    { target: 'r90', text: 'おろしそばは、つめたい そばに だいこんおろしを のせた ふくいの たべかただよ。' },
    { target: 'r91', text: 'にほんで つくられる めがねフレームの 9わりは、ふくいの さばえせいだよ。' },
    { target: 'r92', text: 'ぶどうを おひさまで かわかすと、あまい ほしぶどう(レーズン)に なるよ。' },
    { target: 'r93', text: 'ももを シロップで にると、つるんと した コンポートに なるよ。' },
    { target: 'r94', text: 'かぼちゃを あまく にると、ほくほくの おかずに なるよ。' },
    { target: 'r95', text: 'ほうとうは、ひらたい めんと かぼちゃを みそで にこんだ やまなしの きょうどりょうりだよ。' },
    { target: 'r96', text: 'こうしゅうの しょくにんは、かたい すいしょうを みがいて どうぶつや はなの かたちに するよ。' },
    { target: 'r97', text: 'きのこを ほすと、うまみが ぎゅっと つまって ながく ほぞんできるよ。' },
    { target: 'r98', text: 'ぶどうを ことこと につめると、こうばしい ジャムに なるよ。' },
    { target: 'r99', text: 'りんごと バターを あわせた りんごバターは、パンに ぬると さいこうだよ!' },
    { target: 'r100', text: 'しんしゅうそばは ながのを だいひょうする めんりょうり。すずしい たかちで そばが よく そだつんだ。' },
    { target: 'r101', text: 'とれたての きのこを みそで にると、あきの かおりの なべに なるよ。' },
    { target: 'r102', text: 'みのわしは 1300ねん いじょうの れきしが あると いわれる ぎふの かみ。とても じょうぶだよ。' },
    { target: 'r103', text: 'ひだの つけものは、こうげんで そだった やさいを しおで つけた ぎふの あじだよ。' },
    { target: 'r104', text: 'とれたての あゆに しおを ふって やくと、かわが ぱりっと して おいしいよ。' },
    { target: 'r105', text: 'にほんで つくられる やきものの うつわの 半分いじょうは、ぎふの みのやきだよ。' },
    { target: 'r106', text: 'あゆめしは、あゆを ごはんと いっしょに たいた ぎふの ごちそうだよ。' },
    { target: 'r107', text: 'しずおかけんは おちゃの めいさんち。ふじさんの ふもとに ちゃばたけが ひろがるよ。' },
    { target: 'r108', text: 'しらすを しおゆでして ほすと しらすぼし。ごはんに かけると おいしいよ。' },
    { target: 'r109', text: 'しずおかの みかんを しぼった ジュースは、あまくて さわやか!' },
    { target: 'r110', text: 'あつあつの ごはんに しらすを どーんと のせた どんぶりは、するがわんの ごちそうだよ。' },
    { target: 'r111', text: 'さくらえびを まとめて あげた かきあげは、するがわんの ごちそうだよ。' },
    { target: 'm62', text: 'さくらえびは うすピンクの ちいさな えび。にほんでは するがわんだけで とれるんだ。' },
    { target: 'r112', text: 'はっちょうみそは だいずと しおだけで ながい あいだ ねかせる あいちの くろい みそだよ。' },
    { target: 'r113', text: 'あいちの にしおは まっちゃの めいさんち。ちゃばを こまかく ひいて つくるよ。' },
    { target: 'r114', text: 'うずらの たまごは ちいさいけれど えいようたっぷり。ゆでると つるんと むけるよ。' },
    { target: 'r115', text: 'まっちゃと ぎゅうにゅうで つくる アイスは、ほんのり にがくて あまい おとなの あじ。' },
    { target: 'r116', text: 'たまごと ぎゅうにゅうで つくる プリンは、つるつる ぷりぷり!' },
    { target: 'rf15', text: 'にいがた まつりの「だいみんようながし」では、たくさんの ひとが おなじ おどりで まちを ながれていくよ。' },
    { target: 'rf16', text: 'おわら かぜの ぼんは、こきゅうと しゃみせんの しずかな ねいろで よどおし おどる とやまの おまつりだよ。' },
    { target: 'rf17', text: 'かなざわの ひゃくまんごく まつりでは、かわに とうろうを ながす ぎょうじも あるよ。' },
    { target: 'rf18', text: 'えちぜんの がにまつりでは、とれたての かにが ずらりと ならぶよ。' },
    { target: 'rf19', text: 'よしだの ひまつりは、おおきな たいまつに ひを つけて まちを あかるく てらす やまなしの おまつり。にほんの きさいの ひとつと いわれるよ。' },
    { target: 'rf20', text: 'すわの おんばしらでは、やまから きった おおきな きを みんなで ひいて、さかを すべりおろすよ。' },
    { target: 'rf21', text: 'たかやままつりの やたいには、いとで うごく「からくりにんぎょう」が のっているよ。' },
    { target: 'rf22', text: 'はままつまつりでは、おおきな たこを あげて いとを からめあう「たこあげ合戦」を するよ。' },
    { target: 'rf23', text: 'つしま てんのうさいの よいまつりでは、ふねに たくさんの ちょうちんを はんえんの かたちに かざるよ。' },

    /* --- きんき(2026-07 追加) --- */
    { target: 'm63', text: 'しんじゅは アコヤがいの なかで そだつ たま。みえの しまで せかいで はじめて そだてる ことに せいこうしたんだ。' },
    { target: 'm64', text: 'いせえびは いわばの あなに かくれて、よるに でてくる。ながい ひげと とげとげの からが とくちょうだよ。' },
    { target: 'm65', text: 'のりは うみの なかの あみで そだつ そうるい。かんそうさせて うすい かみのように するんだ。' },
    { target: 'm66', text: 'まつざかぎゅうは みえで そだてられる わぎゅう。1とう1とう なまえを つけて たいせつに そだてるよ。' },
    { target: 'm67', text: 'びわこは にほんで いちばん おおきな みずうみ。ふなや あゆなど、ここだけの さかなも すんでいる。' },
    { target: 'm68', text: 'たけのこは たけの あかちゃん。1にちで 1メートル いじょう のびる ことも あるんだ!' },
    { target: 'm69', text: 'まつたけは あかまつの ねっこと なかよく くらす きのこ。にんげんが たねを まいて そだてる ことが とても むずかしいよ。' },
    { target: 'm70', text: 'たこは あしが 8ほん。あなや つぼに かくれるのが すきだから、たこつぼで とるんだ。' },
    { target: 'm79', text: 'せんしゅうの みずなすは まるくて かわが うすい なす。しぼると しるが でるほど みずみずしいよ。' },
    { target: 'm71', text: 'しゅんぎくは きくの なかま。はっぱの かおりが とても よくて、なべに いれると おいしいよ。' },
    { target: 'm72', text: 'たまねぎは つちの なかで そだつ「くきの あつまり」。かわを むくと なみだが でるのは からい せいぶんの せいだよ。' },
    { target: 'm73', text: 'いかなごは はるに とれる ちいさな さかな。ひょうごでは あまく にて「くぎに」に するんだ。' },
    { target: 'm74', text: 'かきは あまい くだもの。ならの ごじょうや にしよしのは かきの さんちとして ゆうめいだよ。' },
    { target: 'm75', text: 'よしのすぎは ならの やまで そだつ まっすぐな すぎ。たるや わりばしに つかわれてきた。' },
    { target: 'm76', text: 'さんしょうは ぴりっと したしびれる かおりの みのなかま。わかやまの ありたがわで たくさん そだてているよ。' },
    { target: 'm77', text: 'まぐろは うみを ずっと およぎつづける さかな。とまると いきが できないから、ねながら およぐんだ。' },
    { target: 'm78', text: 'びんちょうたんは ウバメガシの きを かまで ゆっくり やいて つくる かたい すみ。たたくと キンキンと なるよ。' },
    { target: 'r117', text: 'いせちゃは みえで つくられる おちゃ。にほんで 3ばんめに たくさん つくられているんだ。' },
    { target: 'r118', text: 'のりを あぶると みどりから くろっぽく かわって、かおりが ふわっと たつよ。' },
    { target: 'r119', text: 'しぐれには おにくを あまく ぎゅっと にた たべもの。ごはんが すすむね。' },
    { target: 'r120', text: 'いせえびは おめでたい ときの ごちそう。しおを ふって やくだけで あまい あじが するよ。' },
    { target: 'r121', text: 'しんじゅは おおきさや かたち、つやで ねだんが かわる。まるくて つやつやなものが とくべつだよ。' },
    { target: 'rf24', text: 'いしどりまつりは かねと たいこを ならしつづける よまつり。「にほんいち やかましい まつり」と よばれているよ。' },
    { target: 'r122', text: 'おうみまいは しがで そだつ おこめ。びわこの みずと やまの つちで そだつんだ。' },
    { target: 'r123', text: 'しがの あさみやちゃは にほんで とても ふるい おちゃの さんちの ひとつと いわれているよ。' },
    { target: 'r124', text: 'ふなずしは ふなと ごはんを ながい あいだ ねかせて つくる、しがの ふるい ほぞんしょく。' },
    { target: 'r125', text: 'しがらきやきは しがの やきもの。たぬきの おきものが ゆうめいだね。' },
    { target: 'r126', text: 'ちゃがゆは おちゃで たいた おかゆ。さらっとして からだが あたたまるよ。' },
    { target: 'rf25', text: 'ながはま ひきやままつりでは、こどもたちが 曳山の ぶたいで かぶきを えんじるよ。' },
    { target: 'r127', text: 'うじは まっちゃの ゆうめいな まち。まっちゃは おちゃの はを こまかい こなに ひいて つくるんだ。' },
    { target: 'r128', text: 'くじょうねぎは きょうとの やさい。やくと とろっと あまくなるよ。' },
    { target: 'r129', text: 'きょうとの たけのこは やわらかいと ゆうめい。はたけの ように たけやまを ていねいに せわ するんだ。' },
    { target: 'r130', text: 'まつたけごはんは あきの ごちそう。かおりを たのしむ りょうりだよ。' },
    { target: 'r131', text: 'わらびもちは ぷるぷるした おかし。まっちゃを かけると にがあまい あじに なるよ。' },
    { target: 'rf26', text: 'ぎおんまつりの やまほこは かどを まがれないので、竹を しいて 水を まき、みんなで まわす「つじまわし」を するよ。' },
    { target: 'r132', text: 'たこやきは おおさかで うまれた こなもん。まるく かえすのが うでの みせどころ!' },
    { target: 'r133', text: 'せんしゅうの みずなすは みずみずしくて、しぼると しるが でるほど。あさづけが おいしいよ。' },
    { target: 'r134', text: 'しゅんぎくは おおさかで たくさん つくられている やさい。かおりが よくて おひたしに あうよ。' },
    { target: 'r135', text: 'たまねぎを ゆっくり にると、あまみが でて とろとろに なるよ。' },
    { target: 'r136', text: 'デラウェアは たねの ない ちいさな ぶどう。おおさかは デラウェアの さんちとして ゆうめいだよ。' },
    { target: 'rf27', text: 'だんじりまつりの「やりまわし」は、はしりながら かどを 直角に まわす はくしゅの みどころだよ。' },
    { target: 'r137', text: 'たんばの くろまめは つぶが おおきい くろい だいず。おしょうがつの ごちそうに なるよ。' },
    { target: 'r138', text: 'あかしやきは たまごを たくさん つかった とろとろの たこやき。だしに つけて たべるんだ。' },
    { target: 'r139', text: 'くぎには にた いかなごが おれた くぎのように みえるから この なまえ。はるの あじだよ。' },
    { target: 'r140', text: 'あわじしまは たまねぎの さんち。あまくて まるやきに すると とろけるよ。' },
    { target: 'r141', text: 'たこめしは たこの だしが ごはんに しみた りょうり。あかしの めいぶつだよ。' },
    { target: 'rf28', text: 'にしのみやじんじゃの かいもんしんじでは、もんが ひらくと ほんでんまで はしって いちばんを きめるよ。' },
    { target: 'r142', text: 'やまとちゃは ならの おちゃ。すずしい たかちで ゆっくり そだつんだ。' },
    { target: 'r143', text: 'あすかルビーは ならで うまれた いちご。まるくて おおきいのが とくちょうだよ。' },
    { target: 'r144', text: 'ほしがきは かきを ほして あまくした おかし。しろい こなは かきの あまみだよ。' },
    { target: 'r145', text: 'あゆは かわの きれいな みずに すむ さかな。しおやきに すると かおりが よいよ。' },
    { target: 'r146', text: 'よしのすぎの わりばしは まっすぐで、きの よい かおりが するんだ。' },
    { target: 'rf29', text: 'わかくさやまやきは、ふゆの おわりに 山ぜんたいの かれくさを もやす ならの ぎょうじだよ。' },
    { target: 'r147', text: 'なんこううめは わかやまで うまれた おおつぶの うめ。うめぼしに すると かわが やわらかいよ。' },
    { target: 'r148', text: 'ありたみかんは わかやまの みかん。ひあたりの よい やまの しゃめんで そだつんだ。' },
    { target: 'r149', text: 'つくだには あまからく にた ほぞんしょく。さんしょうを いれると ぴりっと するよ。' },
    { target: 'r150', text: 'づけどんは しょうゆに つけた さかなを ごはんに のせた どんぶり。かつうらは なままぐろの みなとだよ。' },
    { target: 'rf30', text: 'なちの おうぎまつりは、12ほんの おおたいまつで おうぎみこしを むかえる 火の まつりだよ。' },
    { target: 'r151', text: 'びんちょうたんの ひは とおくまで つよく とおるので、そとは こうばしく なかは ふっくら やけるんだ。' },

    /* --- ちゅうごく・しこく(2026-07 追加) --- */
    { target: 'm80', text: 'らっきょうは すなの ような つちで よく そだつ。とっとりの すなおかで たくさん つくられているよ。' },
    { target: 'm81', text: 'しじみは しんじこに すむ ちいさな かい。しまねは しじみが にほんで いちばん とれるんだ。' },
    { target: 'm82', text: 'のどぐろは のどの なかが くろい さかな。あぶらが のって とても おいしいよ。' },
    { target: 'm83', text: 'ままかりは「ごはん(まま)を かりに いくほど おいしい」から この なまえに なったと いわれるよ。' },
    { target: 'm84', text: 'きにらは ひかりを あてずに そだてた にら。きいろで やわらかく、おかやまの めいぶつだよ。' },
    { target: 'm85', text: 'ひろしまは にほんで いちばん レモンが とれる ところ。あたたかい しまで そだつんだ。' },
    { target: 'm86', text: 'ひろしまなは おおきな はっぱの やさい。つけものに すると ごはんが すすむよ。' },
    { target: 'm87', text: 'あなごは ほそながい さかな。うなぎに にているけど べつの さかなだよ。' },
    { target: 'm88', text: 'わけぎは ねぎの なかま。ひろしまは わけぎが にほんいち たくさん とれるんだ。' },
    { target: 'm89', text: 'ふぐは ふくらむ さかな。どくが あるので、めんきょを もった ひとだけが りょうりできるんだ。' },
    { target: 'm104', text: 'いわくにれんこんは あなが ふつうより 1つ おおい 9つと いわれる やまぐちの れんこんだよ。' },
    { target: 'm90', text: 'はなっこりーは やまぐちで うまれた やさい。ブロッコリーと なばなを かけあわせたんだよ。' },
    { target: 'm91', text: 'すだちは とくしまの みどりの かんきつ。にほんで とれる すだちの ほとんどが とくしまさんだよ。' },
    { target: 'm92', text: 'あいの はっぱから あおい いろが とれる。とくしまの「あわあい」は むかしから ゆうめいだよ。' },
    { target: 'm93', text: 'たいは おめでたい ときの さかな。なるとの はやい しおの ながれで そだつと みが しまるんだ。' },
    { target: 'm94', text: 'こむぎを こなに して みずと しおで こねると、うどんの きじに なるよ。' },
    { target: 'm95', text: 'オリーブは あたたかくて あまり あめの ふらない ところが すき。しょうどしまで にほん はじめて そだったんだ。' },
    { target: 'm96', text: 'きんときにんじんは まっかで ほそながい にんじん。おしょうがつの りょうりに つかうよ。' },
    { target: 'm97', text: 'わたの みが はじけると、まっしろな けが でてくる。それを つむいで いとに するんだ。' },
    { target: 'm98', text: 'キウイは けの ある みの なかが みどり。えひめは キウイが にほんいち たくさん とれるよ。' },
    { target: 'm99', text: 'はだかむぎは かわが むけやすい むぎ。えひめは はだかむぎの さんちとして ゆうめいだよ。' },
    { target: 'm100', text: 'ゆずは ぶつぶつの かわが かおる かんきつ。こうちは ゆずが にほんいち たくさん とれるんだ。' },
    { target: 'm101', text: 'かつおは とても はやく およぐ さかな。とさでは さおで 1ぴきずつ つる「いっぽんづり」が ゆうめい。' },
    { target: 'm102', text: 'しょうがは つちの なかの くき。こうちは しょうがが にほんいち たくさん とれるよ。' },
    { target: 'm103', text: 'ししとうは ピーマンの なかま。ときどき からいのが まざっているよ。' },
    { target: 'r152', text: 'にじゅっせいきなしは みどりいろで みずみずしい なし。とっとりの めいぶつだよ。' },
    { target: 'r153', text: 'らっきょうづけは カリカリした つけもの。カレーの となりに よく のっているね。' },
    { target: 'r154', text: 'とっとりの しろねぎは しろい ところが ながい。やくと あまくなるよ。' },
    { target: 'r155', text: 'まつばがには ずわいがにの おす。とっとりは まつばがにの みずあげが にほんいち。' },
    { target: 'r156', text: 'かにめしは かにの みを ごはんに のせた どんぶり。とっとりの ごちそうだよ。' },
    { target: 'r157', text: 'しじみの みそしるは しじみの だしが よく でる。あさごはんに ぴったり。' },
    { target: 'r158', text: 'いずもそばは わりごという うつわに もりつける、しまねの そばだよ。' },
    { target: 'r159', text: 'のどぐろの しおやきは あぶらが じゅわっと でて とても おいしいよ。' },
    { target: 'r160', text: 'たたらは すなてつと きの すみで てつを つくる むかしの ぎじゅつ。しまねの おくいずもで さかんだったんだ。' },
    { target: 'r161', text: 'デラウェアは たねの ない ちいさな ぶどう。しまねの さんちが ゆうめいだよ。' },
    { target: 'r162', text: 'マスカットは みどりの おおきな ぶどう。おかやまは「くだもの おうこく」と よばれるよ。' },
    { target: 'r163', text: 'はくとうは しろくて やわらかい もも。ふくろを かけて そだてると しろく なるんだ。' },
    { target: 'r164', text: 'ままかりずしは おすで しめた ままかりを ごはんに のせた おかやまの りょうり。' },
    { target: 'r165', text: 'きにらは かおりが やさしいので スープに よく あうよ。' },
    { target: 'r166', text: 'びぜんやきは ゆうやくを つかわず、つちと ひだけで いろを だす やきものだよ。' },
    { target: 'r167', text: 'どてなべは なべの ふちに みそを ぬって にる かきの りょうり。ひろしまの ふゆの あじ。' },
    { target: 'r168', text: 'レモンを はちみつに つけると、すっぱさが まろやかに なるよ。' },
    { target: 'r169', text: 'ひろしまなの つけものは にほんの さんだいづけなの ひとつと いわれているよ。' },
    { target: 'r170', text: 'あなごめしは みやじまの めいぶつえきべん。ごはんに あなごの かばやきを のせるんだ。' },
    { target: 'r171', text: 'ぬたは みそと あえた りょうり。わけぎの あまみが よく あうよ。' },
    { target: 'r172', text: 'ふぐの さしみは うすく きって おさらに はなの ように ならべるよ。' },
    { target: 'r173', text: 'なつみかんは はぎの まちに たくさん ある すこし すっぱい かんきつ。ママレードに するよ。' },
    { target: 'r174', text: 'いわくにれんこんは あなが ふつうより 1つ おおいと いわれる やまぐちの れんこんだよ。' },
    { target: 'r175', text: 'はなっこりーは くきまで やわらかいので、まるごと おひたしに できるよ。' },
    { target: 'r176', text: 'いかそうめんは いかを そうめんの ように ほそく きった りょうり。すきとおって きれいだよ。' },
    { target: 'r177', text: 'すだちを しぼると さわやかな かおり。やきざかなや うどんに かけるよ。' },
    { target: 'r178', text: 'なるときんときは あまくて ほくほくの さつまいも。すなじで そだつんだ。' },
    { target: 'r179', text: 'なるとの はやい しおで そだった わかめは こしが つよいよ。' },
    { target: 'r180', text: 'あいぞめは そめる たびに あおが こくなる。「ジャパンブルー」と よばれるよ。' },
    { target: 'r181', text: 'なるとだいは うずしおで もまれて そだつので、みが ひきしまっているんだ。' },
    { target: 'r182', text: 'さぬきうどんは こしの つよい ふとい うどん。かがわは うどんの けんと よばれるよ。' },
    { target: 'r183', text: 'オリーブの みは そのままでは にがいので、しおに つけて たべられる ように するよ。' },
    { target: 'r184', text: 'いりこは いわしを にて ほした もの。だしを とると うまみが でるよ。' },
    { target: 'r185', text: 'きんときにんじんは にると あまく、いろが きれいに のこるよ。' },
    { target: 'r186', text: 'ひがしかがわは てぶくろづくりが にほんいち。おおくの てぶくろが ここで つくられているよ。' },
    { target: 'r187', text: 'いよかんは えひめの かんきつ。あまくて じょうずに むけると うれしいね。' },
    { target: 'r188', text: 'かぶとには たいの あたまを あまからく にた りょうり。みが ほっぺたに あるよ。' },
    { target: 'r189', text: 'キウイの ジャムは みどりいろ。ヨーグルトに あうよ。' },
    { target: 'r190', text: 'いまばりは タオルの まち。ふわふわで みずを よく すう タオルを つくっているよ。' },
    { target: 'r191', text: 'むぎみそは むぎで つくった みそ。あまくて かおりが やさしいよ。' },
    { target: 'r192', text: 'ゆずポンは ゆずの しるで つくった ポンず。なべに かけると おいしいよ。' },
    { target: 'r193', text: 'かつおの たたきは そとを わらの ひで あぶって、なかは なまの まま。とさの めいぶつ。' },
    { target: 'r194', text: 'しょうがを あまく にると、からさが やわらいで おかしに なるよ。' },
    { target: 'r195', text: 'やきびたしは やいてから だしに つける りょうり。ししとうが やわらかくなるよ。' },
    { target: 'r196', text: 'かつおめしは かつおの みを ごはんに まぜた とさの りょうりだよ。' },
    { target: 'rf31', text: 'しゃんしゃんまつりでは、すずを つけた かさを もって、たくさんの ひとが おどるよ。' },
    { target: 'rf32', text: 'いわみかぐらは しまねの まいで、やまたのおろちを たいじする ばめんが 大人気だよ。' },
    { target: 'rf33', text: 'さいだいじ えようは まよなかに なげこまれる「しんぎ」を とりあう おかやまの まつり。' },
    { target: 'rf34', text: 'べっちゃーまつりは おにが ささらで こどもを つくと、1ねん げんきに すごせると いわれる おのみちの まつり。' },
    { target: 'rf35', text: 'やないの きんぎょちょうちんまつりでは、たくさんの きんぎょちょうちんが まちを かざるよ。' },
    { target: 'rf36', text: 'あわおどりは「えらいやっちゃ」の かけごえで まちを ながれる、とくしまの なつの まつり。' },
    { target: 'rf37', text: 'ちょうさまつりでは、おおきな たいこだいを たくさんの ひとで かつぎ上げるよ。' },
    { target: 'rf38', text: 'うわじまの うしおには くびの ながい おおきな はりこ。まちを ねりあるいて わるいものを おいはらうんだ。' },
    { target: 'rf39', text: 'よさこいまつりでは「なるこ」を りょうてに もって、カチカチ ならしながら おどるよ。' },

    /* --- きゅうしゅう・おきなわ(2026-07 追加) --- */
    { target: 'm105', text: 'かつおなは はかたの でんとうやさい。おぞうにに 入れる はっぱだよ。' },
    { target: 'm106', text: 'むつごろうは ありあけかいの ひがたで はねる さかな。めが とびだしていて、どろの うえを あるくよ。' },
    { target: 'm107', text: 'びわは オレンジいろの あまい み。ながさきは びわが にほんいち たくさん とれるんだ。' },
    { target: 'm108', text: 'あじは はやい しおの ところで そだつと みが しまる。ほうそうかいの「せきあじ」は とくに ゆうめい。' },
    { target: 'm109', text: 'いぐさは たたみに つかう くさ。くまもとは にほんの いぐさの ほとんどを つくっているよ。' },
    { target: 'm110', text: 'デコポンは あたまが でこっと でた かんきつ。あまくて じょうずに むけるよ。' },
    { target: 'm111', text: 'くりは いがの なかに 入っている み。いがが ひらいたら たべごろだよ。' },
    { target: 'm112', text: 'かぼすは みどりの かんきつ。おおいたで にほんの ほとんどが つくられているんだ。' },
    { target: 'm113', text: 'しいたけは ほだぎ(きの まるた)で そだつ きのこ。おおいたは ほししいたけが にほんいちだよ。' },
    { target: 'm114', text: 'マンゴーは あまい なんごくの くだもの。みやざきでは じゅくして おちた みを ネットで うけとめるんだ。' },
    { target: 'm115', text: 'きゅうりは 95パーセントが みず。みやざきは きゅうりが にほんいち たくさん とれるよ。' },
    { target: 'm116', text: 'ピーマンは あおい うちに とる みの やさい。みやざきは ピーマンの さんちとして ゆうめい。' },
    { target: 'm117', text: 'うなぎは あたたかい みずの いけすで そだてる。かごしまは うなぎの そだてかたが にほんいちだよ。' },
    { target: 'm118', text: 'そらまめは さやが そらを むいて そだつから この なまえ。' },
    { target: 'm119', text: 'きんかんは かわごと たべられる ちいさな かんきつ。かごしまが にほんいちだよ。' },
    { target: 'm120', text: 'さとうきびは あまい しるが とれる おおきな くさ。くろざとうの もとに なるよ。' },
    { target: 'm121', text: 'ゴーヤーは にがい みの やさい。あついところでも げんきに そだつよ。' },
    { target: 'm122', text: 'パイナップルは 1つの みが たくさんの はなから できている ふしぎな くだもの。' },
    { target: 'm123', text: 'もずくは ぬるぬるした うみの そうるい。おきなわで たくさん そだてられているよ。' },
    { target: 'm124', text: 'べにいもは なかが むらさきいろの さつまいも。おきなわの おかしに よく つかわれるよ。' },
    { target: 'r197', text: 'あまおうは ふくおかで うまれた おおきな いちご。「あかい・まるい・おおきい・うまい」の あたまもじだよ。' },
    { target: 'r198', text: 'やめちゃは ふくおかの やめで つくられる おちゃ。たかきゅうな ぎょくろで ゆうめい。' },
    { target: 'r199', text: 'ありあけかいは しおの みちひきが おおきい うみ。のりが よく そだつんだ。' },
    { target: 'r200', text: 'わかたけには たけのこと わかめを いっしょに にた りょうり。はるの あじだよ。' },
    { target: 'r201', text: 'はかたの おぞうには かつおなを 入れるのが とくちょうだよ。' },
    { target: 'rf40', text: 'はかた ぎおん やまかさの「おいやま」では、1トンちかい かきやまを かついで まちを はしるよ。' },
    { target: 'r202', text: 'のりの つくだには のりを あまからく にた ごはんの おとも。' },
    { target: 'r203', text: 'さがびよりは さがで うまれた おこめ。つぶが しっかりしているよ。' },
    { target: 'r204', text: 'いちごさんは さがで うまれた いちご。あまくて かおりが よいんだ。' },
    { target: 'r205', text: 'ありたやきは しろい はだに あおや あかで えを かく やきもの。にほんで はじめての じきだよ。' },
    { target: 'r206', text: 'ありあけかいの むつごろうは くしに さして やく のが むかしからの たべかた。' },
    { target: 'rf41', text: 'さがの バルーンフェスタは アジアさいだいきゅうの ききゅうの たいかい。あさの そらに 100きいじょうが あがるよ。' },
    { target: 'r207', text: 'びわの ゼリーは つめたく ひやすと とても おいしいよ。' },
    { target: 'r208', text: 'あじの ひらきは あじを ひらいて ほした もの。やくと こうばしいよ。' },
    { target: 'r209', text: 'そのぎちゃは ながさきの まるい かたちの おちゃ。「たまりょくちゃ」と いうよ。' },
    { target: 'r210', text: 'ちゃんぽんは ながさきで うまれた めんりょうり。やさいや かいさんぶつを たっぷり 入れるよ。' },
    { target: 'r211', text: 'てっさは ふぐの さしみ。うすく きって おさらに はなの ように ならべるんだ。' },
    { target: 'rf42', text: 'ながさきくんちの「コッコデショ」は、たいこやまを そらへ ほうり上げて かた手で うける だしもの。' },
    { target: 'r212', text: 'いぐさで あんだ コースターは いい かおりが して、なつに ぴったり。' },
    { target: 'r213', text: 'デコポンの ジュースは あまくて すこし すっぱい。' },
    { target: 'r214', text: 'こめせんべいは ごはんを うすく のばして やいた おかし。' },
    { target: 'r215', text: 'きんとんは くりを つぶして あまく した おかし。おしょうがつにも たべるよ。' },
    { target: 'r216', text: 'くまもとは らくのうも さかん。しぼりたての ぎゅうにゅうで プリンを つくるよ。' },
    { target: 'rf43', text: 'ふじさきはちまんぐうの あきまつりでは、きれいに かざった うまを ひいて まちを ねりあるくよ。' },
    { target: 'r217', text: 'かぼすの ぽんずは やきざかなに かけると さっぱりするよ。' },
    { target: 'r218', text: 'しいたけを ほすと うまみが ぐっと ふえる。だしにも つかえるんだ。' },
    { target: 'r219', text: 'せきあじは ほうそうかいの はやい しおで そだった あじ。みが ひきしまっているよ。' },
    { target: 'r220', text: 'おんせんたまごは おんせんの ねつで ゆっくり ゆでた たまご。しろみが とろとろに なるよ。' },
    { target: 'r221', text: 'しいたけを ねぎと いっしょに にると、うまみが しみて おいしいよ。' },
    { target: 'rf44', text: 'べっぷは おんせんの まち。おんせんまつりでは ゆを かけあう「ゆかけ」の ぎょうじが あるよ。' },
    { target: 'r222', text: 'たいようのタマゴは みやざきの とくに あまい マンゴーだけに つく なまえだよ。' },
    { target: 'r223', text: 'みやざきは ひが よく あたるので、おちゃも よく そだつんだ。' },
    { target: 'r224', text: 'きゅうりの あさづけは パリパリして みずみずしいよ。' },
    { target: 'r225', text: 'やきびたしは やいてから だしに つける りょうり。ピーマンが あまくなるよ。' },
    { target: 'r226', text: 'マンゴーと ぎゅうにゅうを まぜると、とろっとした スムージーに なるよ。' },
    { target: 'rf45', text: 'ひゅうがの ひょっとこ なつまつりでは、おかしな おめんを つけた ひとたちが たくさん おどるよ。' },
    { target: 'r227', text: 'かりんとうは あまい ころもを つけて あげた おかし。' },
    { target: 'r228', text: 'ちらんちゃは かごしまの ちらんで つくられる おちゃ。あさつみが ゆうめいだよ。' },
    { target: 'r229', text: 'そらまめは しおゆでに すると ほくほくで あまいよ。' },
    { target: 'r230', text: 'かばやきは たれを ぬって やく りょうり。うなぎは あぶらが のって こうばしいよ。' },
    { target: 'r231', text: 'きんかんは かわごと あまく にると、まるごと たべられる おかしに なるよ。' },
    { target: 'rf46', text: 'ろくがつどうは、絵を かいた とうろうを じんじゃに かける かごしまの なつの ぎょうじだよ。' },
    { target: 'r232', text: 'くろざとうは さとうきびの しるを につめて つくる、こくの ある さとうだよ。' },
    { target: 'r233', text: 'チャンプルーは おきなわの ことばで「まぜたもの」。ゴーヤーの にがみが いい あじに なるよ。' },
    { target: 'r234', text: 'パイナップルの ジュースは あまずっぱくて なんごくの あじ。' },
    { target: 'r235', text: 'もずくの すのものは ぬるぬるして のどごしが いいよ。' },
    { target: 'r236', text: 'べにいもの タルトは むらさきいろが きれいな おきなわの おかしだよ。' },
    { target: 'rf47', text: 'なはの おおづなひきは とても おおきな つなを ひきあう ぎょうじ。まちが ひがしと にしに わかれて しょうぶするよ。' },

    /* --- どうぐと どうぐの 材料 --- */
    { target: 'm125', text: 'たけは せいちょうが とても はやい しょくぶつ。1にちで 1メートル ちかく のびる ことも あるよ。' },
    { target: 'm126', text: 'あおもりの ひば、きその ひのき、よしのの すぎ。にっぽんには じまんの もりが たくさん あるよ。' },
    { target: 'rd01', text: 'にいがたの つばめさんじょうは かなものづくりの まち。ほうちょうや のうぐが せかいでも ゆうめいだよ。' },
    { target: 'rd02', text: 'ひょうごの みきは 「かなものの まち」。だいくどうぐづくりの ながい れきしが あるよ。' },
    { target: 'rd03', text: 'おおいたの べっぷたけざいくは くにが みとめた でんとうこうげい。しなやかで じょうぶな かごに なるよ。' },
    { target: 'rd04', text: 'しずおかの するがたけせんすじざいくは ほそい たけひごで つくる こうげい。むかしは むしかごや はなかごが 旅の おみやげに にんきだったよ。' },
    { target: 'rd05', text: 'いわての なんぶてっきは てつの こうげいひん。てつびんが とくに ゆうめいだよ。' },
    { target: 'rd06', text: 'とやまわんの しろえびは、ふかい うみの そこで あみを ひいて とるんだ。「うみの ほうせき」と よばれるよ。' },
    { target: 'rd07', text: 'あいちの みかわわんは しおひがりの めいしょ。くまでで すなを ほって あさりを さがすよ。' },
    { target: 'rd08', text: 'ゆきべらは ゆきを おしたり はらったり する どうぐ。ちほうに よって ジョンバや コスキなど なまえが かわるんだよ。' },
    { target: 'rd09', text: 'きょうとは たけの めいさんち。たけざいくの かごは かるくて じょうぶだよ。' },
    { target: 'rd10', text: 'かがわの ひがしかがわしは てぶくろづくりが にほんいち。にっぽんの てぶくろの 9わりが ここで つくられるよ。' },
    { target: 'rd11', text: 'わかやまの きしゅうへらざおは たけで つくる つりざお。しょくにんさんが たけを えらんで ていねいに つくるよ。' },
    { target: 'rd21', text: 'いい かじやは いい てつを えらぶ。ほし3の てついしで うった かまは きれあじが ちがうよ。' },
    { target: 'rd22', text: 'よく きれる はさみは ちからを いれなくても すっと きれる。だから やさしく つみとれるんだ。' },
    { target: 'rd23', text: 'たけかごの あみめが こまかい ほど じょうぶ。いい たけで あんだ かごは ながもち するよ。' },
    { target: 'rd24', text: 'ちゃつみの めいじんは かごも とくべつ。かるくて おおきい かごで どんどん つめるよ。' },
    { target: 'rd25', text: 'かたい いわも いい つるはしなら へっちゃら。はがねの さきは かじやの じまんだよ。' },
    { target: 'rd26', text: 'いい あみは みずを すっと きって かるい。ながく つかっても つかれにくいんだ。' },
    { target: 'rd27', text: 'くまでの はの ならびが そろって いると、すなの なかの かいを のがさないよ。' },
    { target: 'rd28', text: 'よく すべる ゆきべらは ゆきかきの つよい みかた。ロウを ぬって すべりを よくする くふうも あるんだ。' },
    { target: 'rd29', text: 'きょうの たけかごは めが こまかくて うつくしい。しゅうかくの みを きずつけないよ。' },
    { target: 'rd30', text: 'ぬいめの ていねいな てぶくろは てに ぴったり。こまかい しごとも できるんだ。' },
    { target: 'rd31', text: 'つりの めいじんの さおは しなりが ちがう。いい たけを ほし3まで そだてた あかしだよ。' },

    /* --- しんの めいさん(かんとう) --- */
    { target: 'm127', text: 'いばらきけんは れんこんの しゅうかくりょうが にほんいち! どろの なかで そだつから あなが あくんだよ。' },
    { target: 'm128', text: 'あんこうは ふゆの いばらきの ごちそう。「うみの フォアグラ」と よばれる きもが ゆうめいだよ。' },
    { target: 'm129', text: 'とちぎけんは かんぴょうづくりが にほんいち! ゆうがおの みを ほそく けずって ほして つくるよ。' },
    { target: 'm130', text: 'とちぎけんは にらの さんちとして ゆうめい。スタミナ たっぷりの やさいだよ。' },
    { target: 'm131', text: 'しもにたねぎは ぐんまの しもにたまちの ねぎ。にると とろっと あまくなる ふゆの あじだよ。' },
    { target: 'm132', text: 'まいたけは 「みつけると まいおどる ほど うれしい」から この なまえに なった と いわれるよ。' },
    { target: 'm133', text: 'くわいは 「めが でる」えんぎものとして おしょうがつに たべる やさい。さいたまの めいさんだよ。' },
    { target: 'm134', text: 'さといもは やまいもと ちがって さとで そだてる いも だから 「さといも」と いうんだ。' },
    { target: 'm135', text: 'あしたばは 「きょう つんでも あしたには はえる」と いわれる ほど げんきな とうきょうの しまの やさいだよ。' },
    { target: 'm136', text: 'パッションフルーツは とうきょうの みなみの しまで そだつ トロピカルフルーツ。なつが しゅんだよ。' },
    { target: 'm137', text: 'きんめだいは ふかい うみに すむ まっかな さかな。おおきな めが きんいろに ひかるよ。' },
    { target: 'm138', text: 'ちばけんは なばなの さんちとして ゆうめい。はるの ぼうそうはんとうは なのはなで まっきいろに なるよ。' },
    { target: 'm139', text: 'みうらだいこんは かながわの みうらはんとうの ふゆの めいぶつ。ずっしり おおきくて あまいんだ。' },
    { target: 'm140', text: 'しょうなんゴールドは かながわ うまれの きいろい かんきつ。はるに しゅんを むかえる さわやかな あじだよ。' },
    { target: 'rs01', text: 'きんぴらは しゃきしゃきに いためる りょうり。れんこんの あなから むこうが みえるよ。' },
    { target: 'rs02', text: 'あんこうなべは いばらきの ふゆの ごちそう。さむい ひに からだが あたたまるよ。' },
    { target: 'rs03', text: 'かんぴょうまきは あまく にた かんぴょうを まいた おすし。おべんとうの ていばんだよ。' },
    { target: 'rs04', text: 'おひたしは ゆでて だしに ひたす りょうり。にらの かおりが ひきたつよ。' },
    { target: 'rs05', text: 'しもにたねぎは やくと とろとろに あまくなる。「ねぎの おうさま」とも よばれるよ。' },
    { target: 'rs06', text: 'まいたけごはんは きのこの うまみが ごはんに しみた あきの あじだよ。' },
    { target: 'rs07', text: 'くわいの にものは おしょうがつの りょうり。めが でた かたちの まま にるんだ。' },
    { target: 'rs08', text: 'にっころがしは しるが なくなるまで ころがしながら にる りょうり。ほくほくに なるよ。' },
    { target: 'rs09', text: 'あしたばの おひたしは しまの ていばんりょうり。ほろにがさが おいしいんだ。' },
    { target: 'rs10', text: 'パッションフルーツの なかは つぶつぶの ゼリーみたい。ジュースに すると とっても かおるよ。' },
    { target: 'rs11', text: 'につけは しょうゆと さとうで あまからく にる りょうり。きんめだいの いちばん ゆうめいな たべかただよ。' },
    { target: 'rs12', text: 'なばなの からしあえは はるの あじ。ほんのり にがくて おとなの あじ かも?' },
    { target: 'rs13', text: 'ふろふきだいこんは あつあつの だいこんに みそだれを かける りょうり。ゆげまで おいしいよ。' },
    { target: 'rs14', text: 'しょうなんゴールドの ゼリーは さわやかな かんきつの かおり。ひんやり つるんと たべられるよ。' },
  ],

  /* ---------- クイズバンク ----------
     kind: kaitaku(開拓専用) / sozai(育成・レシピ用) / bunka(レシピ用)
     ※「さんち」カテゴリは廃止。産地を問う問題は、答えがまだ見えていない
       「開拓前」にだけ意味を持つため、kaitakuに統合した。 */
  quizzes: [
    /* --- とうほく: 開拓(形・位置) --- */
    { id: 'qt01', kind: 'kaitaku', type: 'shape', tags: ['aomori'], q: 'この かたちの けんは どこ?', choices: ['あおもり', 'あきた', 'いわて'], answer: 0 },
    { id: 'qt02', kind: 'kaitaku', type: 'position', tags: ['aomori'], q: 'ひかっている けんは どこ?', choices: ['あおもり', 'いわて', 'やまがた'], answer: 0 },
    { id: 'qt03', kind: 'kaitaku', type: 'shape', tags: ['iwate'], q: 'この かたちの けんは どこ?', choices: ['いわて', 'みやぎ', 'あおもり'], answer: 0 },
    { id: 'qt04', kind: 'kaitaku', type: 'position', tags: ['iwate'], q: 'ひかっている けんは どこ?', choices: ['いわて', 'あきた', 'ふくしま'], answer: 0 },
    { id: 'qt05', kind: 'kaitaku', type: 'shape', tags: ['miyagi'], q: 'この かたちの けんは どこ?', choices: ['みやぎ', 'ふくしま', 'やまがた'], answer: 0 },
    { id: 'qt06', kind: 'kaitaku', type: 'position', tags: ['miyagi'], q: 'ひかっている けんは どこ?', choices: ['みやぎ', 'いわて', 'あきた'], answer: 0 },
    { id: 'qt07', kind: 'kaitaku', type: 'shape', tags: ['akita'], q: 'この かたちの けんは どこ?', choices: ['あきた', 'あおもり', 'やまがた'], answer: 0 },
    { id: 'qt08', kind: 'kaitaku', type: 'position', tags: ['akita'], q: 'ひかっている けんは どこ?', choices: ['あきた', 'いわて', 'みやぎ'], answer: 0 },
    { id: 'qt09', kind: 'kaitaku', type: 'shape', tags: ['yamagata'], q: 'この かたちの けんは どこ?', choices: ['やまがた', 'あきた', 'ふくしま'], answer: 0 },
    { id: 'qt10', kind: 'kaitaku', type: 'position', tags: ['yamagata'], q: 'ひかっている けんは どこ?', choices: ['やまがた', 'みやぎ', 'あおもり'], answer: 0 },
    { id: 'qt11', kind: 'kaitaku', type: 'shape', tags: ['fukushima'], q: 'この かたちの けんは どこ?', choices: ['ふくしま', 'みやぎ', 'やまがた'], answer: 0 },
    { id: 'qt12', kind: 'kaitaku', type: 'position', tags: ['fukushima'], q: 'ひかっている けんは どこ?', choices: ['ふくしま', 'やまがた', 'いわて'], answer: 0 },

    /* --- とうほく: 開拓(知識) --- */
    { id: 'qt50', kind: 'kaitaku', tags: ['aomori'], q: 'あおもりけんで にほんいち たくさん つくられる くだものは?', choices: ['りんご', 'みかん', 'バナナ'], answer: 0 },
    { id: 'qt51', kind: 'kaitaku', tags: ['aomori'], q: 'あおもりけんの ゆうめいな おまつりは?', choices: ['ねぶたまつり', 'だるまいち', 'ぎおんまつり'], answer: 0 },
    { id: 'qt52', kind: 'kaitaku', tags: ['aomori'], q: 'あおもりけんは ほんしゅうの どこに ある?', choices: ['いちばん きた', 'いちばん みなみ', 'まんなか'], answer: 0 },
    { id: 'qt53', kind: 'kaitaku', tags: ['iwate'], q: 'いわてけんの でんとうこうげいは?', choices: ['なんぶてっき', 'ガラスざいく', 'かみねんど'], answer: 0 },
    { id: 'qt54', kind: 'kaitaku', tags: ['iwate'], q: 'いわてけんの おおきさは にほんの けんで どれくらい?', choices: ['いちばん おおきい', 'いちばん ちいさい', 'ふつう'], answer: 0 },
    { id: 'qt55', kind: 'kaitaku', tags: ['iwate'], q: 'いわてけんの もりおかの おまつりは?', choices: ['さんさおどり', 'かんとうまつり', 'はなびたいかい'], answer: 0 },
    { id: 'qt56', kind: 'kaitaku', tags: ['miyagi'], q: 'みやぎけんの おおきな まちは?', choices: ['せんだい', 'よこはま', 'なごや'], answer: 0 },
    { id: 'qt57', kind: 'kaitaku', tags: ['miyagi'], q: 'みやぎけんの ゆうめいな たべものは?', choices: ['ずんだもち', 'たこやき', 'ラーメン'], answer: 0 },
    { id: 'qt58', kind: 'kaitaku', tags: ['miyagi'], q: 'みやぎけんの まつしまわんで そだてているのは?', choices: ['かき', 'メロン', 'りんご'], answer: 0 },
    { id: 'qt59', kind: 'kaitaku', tags: ['akita'], q: 'あきたけんの ゆうめいな おこめは?', choices: ['あきたこまち', 'とちおとめ', 'さとうにしき'], answer: 0 },
    { id: 'qt60', kind: 'kaitaku', tags: ['akita'], q: 'あきたけんの ふゆの うみで とれる さかなは?', choices: ['はたはた', 'まぐろ', 'たい'], answer: 0 },
    { id: 'qt61', kind: 'kaitaku', tags: ['akita'], q: 'あきたけんの おまつりで ささえる ものは?', choices: ['ちょうちんの さお', 'おおきな たる', 'こいのぼり'], answer: 0 },
    { id: 'qt62', kind: 'kaitaku', tags: ['yamagata'], q: 'やまがたけんで にほんいち たくさん とれる くだものは?', choices: ['さくらんぼ', 'メロン', 'いちご'], answer: 0 },
    { id: 'qt63', kind: 'kaitaku', tags: ['yamagata'], q: 'やまがたけんの あきの たのしみは?', choices: ['いもにかい', 'うめみ', 'ちゃつみ'], answer: 0 },
    { id: 'qt64', kind: 'kaitaku', tags: ['yamagata'], q: 'やまがたけんの おまつりで もって おどるのは?', choices: ['はなの かさ', 'たいこ', 'かたな'], answer: 0 },
    { id: 'qt65', kind: 'kaitaku', tags: ['fukushima'], q: 'ふくしまけんで たくさん つくられる くだものは?', choices: ['もも', 'パイナップル', 'キウイ'], answer: 0 },
    { id: 'qt66', kind: 'kaitaku', tags: ['fukushima'], q: 'ふくしまけんの おまつりで かつぐのは?', choices: ['おおきな わらじ', 'おおきな だるま', 'おおきな かがみ'], answer: 0 },
    { id: 'qt67', kind: 'kaitaku', tags: ['fukushima'], q: 'ふくしまけんは とうほくの どこに ある?', choices: ['いちばん みなみ', 'いちばん きた', 'うみの うえ'], answer: 0 },

    /* ===== ちゅうぶ9県(2026-07) ===== */
    /* 開拓: かたち */
    { id: 'qc01', kind: 'kaitaku', type: 'shape', tags: ['niigata'], q: 'この かたちの けんは どこ?', choices: ['にいがた', 'ながの', 'とやま'], answer: 0 },
    { id: 'qc02', kind: 'kaitaku', type: 'position', tags: ['niigata'], q: 'ひかっている けんは どこ?', choices: ['にいがた', 'とやま', 'ぎふ'], answer: 0 },
    { id: 'qc03', kind: 'kaitaku', type: 'shape', tags: ['toyama'], q: 'この かたちの けんは どこ?', choices: ['とやま', 'いしかわ', 'ふくい'], answer: 0 },
    { id: 'qc04', kind: 'kaitaku', type: 'position', tags: ['toyama'], q: 'ひかっている けんは どこ?', choices: ['とやま', 'にいがた', 'ながの'], answer: 0 },
    { id: 'qc05', kind: 'kaitaku', type: 'shape', tags: ['ishikawa'], q: 'この かたちの けんは どこ?', choices: ['いしかわ', 'ふくい', 'とやま'], answer: 0 },
    { id: 'qc06', kind: 'kaitaku', type: 'position', tags: ['ishikawa'], q: 'ひかっている けんは どこ?', choices: ['いしかわ', 'ふくい', 'ぎふ'], answer: 0 },
    { id: 'qc07', kind: 'kaitaku', type: 'shape', tags: ['fukui'], q: 'この かたちの けんは どこ?', choices: ['ふくい', 'いしかわ', 'やまなし'], answer: 0 },
    { id: 'qc08', kind: 'kaitaku', type: 'position', tags: ['fukui'], q: 'ひかっている けんは どこ?', choices: ['ふくい', 'いしかわ', 'あいち'], answer: 0 },
    { id: 'qc09', kind: 'kaitaku', type: 'shape', tags: ['yamanashi'], q: 'この かたちの けんは どこ?', choices: ['やまなし', 'ながの', 'しずおか'], answer: 0 },
    { id: 'qc10', kind: 'kaitaku', type: 'position', tags: ['yamanashi'], q: 'ひかっている けんは どこ?', choices: ['やまなし', 'しずおか', 'ながの'], answer: 0 },
    { id: 'qc11', kind: 'kaitaku', type: 'shape', tags: ['nagano'], q: 'この かたちの けんは どこ?', choices: ['ながの', 'にいがた', 'ぎふ'], answer: 0 },
    { id: 'qc12', kind: 'kaitaku', type: 'position', tags: ['nagano'], q: 'ひかっている けんは どこ?', choices: ['ながの', 'やまなし', 'とやま'], answer: 0 },
    { id: 'qc13', kind: 'kaitaku', type: 'shape', tags: ['gifu'], q: 'この かたちの けんは どこ?', choices: ['ぎふ', 'ながの', 'あいち'], answer: 0 },
    { id: 'qc14', kind: 'kaitaku', type: 'position', tags: ['gifu'], q: 'ひかっている けんは どこ?', choices: ['ぎふ', 'あいち', 'ふくい'], answer: 0 },
    { id: 'qc15', kind: 'kaitaku', type: 'shape', tags: ['shizuoka'], q: 'この かたちの けんは どこ?', choices: ['しずおか', 'あいち', 'やまなし'], answer: 0 },
    { id: 'qc16', kind: 'kaitaku', type: 'position', tags: ['shizuoka'], q: 'ひかっている けんは どこ?', choices: ['しずおか', 'あいち', 'やまなし'], answer: 0 },
    { id: 'qc17', kind: 'kaitaku', type: 'shape', tags: ['aichi'], q: 'この かたちの けんは どこ?', choices: ['あいち', 'しずおか', 'ぎふ'], answer: 0 },
    { id: 'qc18', kind: 'kaitaku', type: 'position', tags: ['aichi'], q: 'ひかっている けんは どこ?', choices: ['あいち', 'ぎふ', 'しずおか'], answer: 0 },
    /* 開拓: ちしき(各県3問以上) */
    { id: 'qc20', kind: 'kaitaku', tags: ['niigata'], q: 'にいがたけんで たくさん とれるのは?', choices: ['おこめ', 'パイナップル', 'コーヒーまめ'], answer: 0 },
    { id: 'qc21', kind: 'kaitaku', tags: ['niigata'], q: 'にいがたけんの ふゆの てんきは?', choices: ['ゆきが たくさん ふる', 'あつくて かんそうする', 'ずっと はれ'], answer: 0 },
    { id: 'qc22', kind: 'kaitaku', tags: ['niigata'], q: 'にいがたの かわを のぼってくる さかなは?', choices: ['さけ', 'まぐろ', 'たい'], answer: 0 },
    { id: 'qc23', kind: 'kaitaku', tags: ['toyama'], q: 'とやまわんで とれる すきとおった えびは?', choices: ['しろえび', 'いせえび', 'ざりがに'], answer: 0 },
    { id: 'qc24', kind: 'kaitaku', tags: ['toyama'], q: 'とやまけんで にほんいち おおく つくられる はなの もとは?', choices: ['チューリップの きゅうこん', 'ひまわりの たね', 'さくらの なえ'], answer: 0 },
    { id: 'qc25', kind: 'kaitaku', tags: ['toyama'], q: 'とやまけんの ゆうめいな えきべんは?', choices: ['ますのすし', 'かにめし', 'ぎゅうたんべんとう'], answer: 0 },
    { id: 'qc26', kind: 'kaitaku', tags: ['ishikawa'], q: 'いしかわけんの おおきな まちは?', choices: ['かなざわ', 'せんだい', 'ふくおか'], answer: 0 },
    { id: 'qc27', kind: 'kaitaku', tags: ['ishikawa'], q: 'いしかわの のとで むかしから つくられているのは?', choices: ['しお', 'さとう', 'こむぎこ'], answer: 0 },
    { id: 'qc28', kind: 'kaitaku', tags: ['ishikawa'], q: 'いしかわの あざやかな やきものは?', choices: ['くたにやき', 'ましこやき', 'かさまやき'], answer: 0 },
    { id: 'qc29', kind: 'kaitaku', tags: ['fukui'], q: 'ふくいけんの さばえで にほんいち つくられているのは?', choices: ['めがね', 'じてんしゃ', 'とけい'], answer: 0 },
    { id: 'qc30', kind: 'kaitaku', tags: ['fukui'], q: 'ふくいけんの ふゆの ごちそうは?', choices: ['えちぜんがに', 'すいか', 'メロン'], answer: 0 },
    { id: 'qc31', kind: 'kaitaku', tags: ['fukui'], q: 'ふくいけんの ゆうめいな めんりょうりは?', choices: ['おろしそば', 'たこやき', 'ちゃんぽん'], answer: 0 },
    { id: 'qc32', kind: 'kaitaku', tags: ['yamanashi'], q: 'やまなしけんの となりに ある にほんいち たかい やまは?', choices: ['ふじさん', 'たてやま', 'ぼんだいさん'], answer: 0 },
    { id: 'qc33', kind: 'kaitaku', tags: ['yamanashi'], q: 'やまなしけんで にほんいち つくられている くだものは?', choices: ['もも', 'みかん', 'りんご'], answer: 0 },
    { id: 'qc34', kind: 'kaitaku', tags: ['yamanashi'], q: 'やまなしの きょうどりょうりは?', choices: ['ほうとう', 'ずんだもち', 'きりたんぽ'], answer: 0 },
    { id: 'qc35', kind: 'kaitaku', tags: ['nagano'], q: 'ながのけんで にほんいち つくられているのは?', choices: ['きのこ', 'バナナ', 'さとうきび'], answer: 0 },
    { id: 'qc36', kind: 'kaitaku', tags: ['nagano'], q: 'ながのけんの ゆうめいな めんりょうりは?', choices: ['しんしゅうそば', 'おろしそば', 'てうちそば'], answer: 0 },
    { id: 'qc37', kind: 'kaitaku', tags: ['nagano'], q: 'ながのけんは うみが ある? ない?', choices: ['うみが ない けん', 'うみが ある けん', 'しまの けん'], answer: 0 },
    { id: 'qc38', kind: 'kaitaku', tags: ['gifu'], q: 'ぎふの ながらがわで あゆを とる りょうの なまえは?', choices: ['うかい', 'ていちあみ', 'いかつり'], answer: 0 },
    { id: 'qc39', kind: 'kaitaku', tags: ['gifu'], q: 'ぎふけんの ゆうめいな かみは?', choices: ['みのわし', 'コピーよう紙', 'だんボール'], answer: 0 },
    { id: 'qc40', kind: 'kaitaku', tags: ['gifu'], q: 'ぎふけんの たかやままつりに のっているのは?', choices: ['からくりにんぎょう', 'おおきな だるま', 'ゆきの ぞう'], answer: 0 },
    { id: 'qc41', kind: 'kaitaku', tags: ['shizuoka'], q: 'しずおかけんの めいさんの のみものは?', choices: ['おちゃ', 'あまざけ', 'ぎゅうにゅう'], answer: 0 },
    { id: 'qc42', kind: 'kaitaku', tags: ['shizuoka'], q: 'にほんでは するがわんだけで とれる えびは?', choices: ['さくらえび', 'いせえび', 'しろえび'], answer: 0 },
    { id: 'qc43', kind: 'kaitaku', tags: ['shizuoka'], q: 'しずおかけんから よく みえる やまは?', choices: ['ふじさん', 'あそさん', 'たてやま'], answer: 0 },
    { id: 'qc44', kind: 'kaitaku', tags: ['aichi'], q: 'あいちけんの おおきな まちは?', choices: ['なごや', 'かなざわ', 'せんだい'], answer: 0 },
    { id: 'qc45', kind: 'kaitaku', tags: ['aichi'], q: 'あいちけんの くろい みその なまえは?', choices: ['はっちょうみそ', 'しろみそ', 'あわせみそ'], answer: 0 },
    { id: 'qc46', kind: 'kaitaku', tags: ['aichi'], q: 'あいちけんで にほんいち たくさん とれる たまごは?', choices: ['うずらの たまご', 'ダチョウの たまご', 'アヒルの たまご'], answer: 0 },
    { id: 'qc47', kind: 'sozai', tags: ['m62', 'r111'], q: 'さくらえびは なにいろ?', choices: ['うすピンク', 'まっくろ', 'みどり'], answer: 0 },
    /* そざい */
    { id: 'qc50', kind: 'sozai', tags: ['m47', 'r73', 'r75'], q: 'さけは うみと かわの どちらも およぐ?', choices: ['どちらも およぐ', 'うみだけ', 'かわだけ'], answer: 0 },
    { id: 'qc51', kind: 'sozai', tags: ['m48', 'r74'], q: 'たべごろの なすは なにいろ?', choices: ['つやつやの むらさき', 'まっしろ', 'みずいろ'], answer: 0 },
    { id: 'qc52', kind: 'sozai', tags: ['m49', 'r76'], q: 'チューリップは なにを うえて そだてる?', choices: ['きゅうこん', 'えだ', 'いし'], answer: 0 },
    { id: 'qc53', kind: 'sozai', tags: ['m50', 'r77', 'r81'], q: 'しろえびは どこに すんでいる?', choices: ['とやまわんの ふかい うみ', 'かわの あさせ', 'たんぼ'], answer: 0 },
    { id: 'qc54', kind: 'sozai', tags: ['m51'], q: 'しおは なにから つくる?', choices: ['うみみず', 'あまみず', 'ゆき'], answer: 0 },
    { id: 'qc55', kind: 'sozai', tags: ['m52', 'r83'], q: 'れんこんは どこで そだつ?', choices: ['どろの なか', 'きの うえ', 'いわの うえ'], answer: 0 },
    { id: 'qc56', kind: 'sozai', tags: ['m53', 'r91'], q: 'チタンは どんな きんぞく?', choices: ['かるくて さびにくい', 'おもくて すぐ さびる', 'みずに とける'], answer: 0 },
    { id: 'qc57', kind: 'sozai', tags: ['m54', 'r92', 'r98'], q: 'ぶどうは どうやって そだつ?', choices: ['つるを のばして ふさに なる', 'つちの なかで ふくらむ', 'みずの なかで そだつ'], answer: 0 },
    { id: 'qc58', kind: 'sozai', tags: ['m55', 'r96'], q: 'すいしょうは どうやって かたちを つくる?', choices: ['みがいて けずる', 'おゆで とかす', 'おって まげる'], answer: 0 },
    { id: 'qc59', kind: 'sozai', tags: ['m56', 'r94', 'r95'], q: 'かぼちゃの なかみは なにいろ?', choices: ['きいろや オレンジ', 'まっくろ', 'あお'], answer: 0 },
    { id: 'qc60', kind: 'sozai', tags: ['m57', 'r97', 'r101'], q: 'きのこは どこで よく そだつ?', choices: ['くらくて しめった ところ', 'あつくて かわいた ところ', 'こおりの うえ'], answer: 0 },
    { id: 'qc61', kind: 'sozai', tags: ['m58', 'r102'], q: 'かみは なにから つくる?', choices: ['きの かわ', 'いし', 'すな'], answer: 0 },
    { id: 'qc62', kind: 'sozai', tags: ['m59', 'r104', 'r106'], q: 'あゆは どこに すんでいる?', choices: ['きれいな かわ', 'ふかい うみ', 'たんぼ'], answer: 0 },
    { id: 'qc63', kind: 'sozai', tags: ['m60', 'r108', 'r110'], q: 'しらすは なんの こども?', choices: ['いわし', 'まぐろ', 'さめ'], answer: 0 },
    { id: 'qc64', kind: 'sozai', tags: ['m61', 'r114', 'r116'], q: 'うずらの たまごは にわとりの たまごと くらべて?', choices: ['ずっと ちいさい', 'ずっと おおきい', 'おなじ おおきさ'], answer: 0 },
    /* ぶんか(おまつり) */
    { id: 'qc70', kind: 'bunka', tags: ['rf15', 'r75'], q: 'にいがた まつりで みんなが するのは?', choices: ['おなじ おどりで まちを ながれる', 'ふねに のる', 'ゆきぞうを つくる'], answer: 0 },
    { id: 'qc71', kind: 'bunka', tags: ['rf16', 'r80'], q: 'おわら かぜの ぼんの おどりは?', choices: ['しずかで ゆったり', 'はやくて はげしい', 'とびはねる'], answer: 0 },
    { id: 'qc72', kind: 'bunka', tags: ['rf17', 'r85'], q: 'かなざわの まつりで かわに ながすのは?', choices: ['とうろう', 'ふうせん', 'こいのぼり'], answer: 0 },
    { id: 'qc73', kind: 'bunka', tags: ['rf18', 'r89'], q: 'えちぜんの まつりの しゅやくは?', choices: ['かに', 'いか', 'たい'], answer: 0 },
    { id: 'qc74', kind: 'bunka', tags: ['rf19', 'r95'], q: 'よしだの ひまつりで つかうのは?', choices: ['おおきな たいまつ', 'おおきな かさ', 'おおきな たいこ'], answer: 0 },
    { id: 'qc75', kind: 'bunka', tags: ['rf20', 'r100'], q: 'おんばしらで さかを すべりおろすのは?', choices: ['おおきな き', 'おおきな いし', 'おおきな ふね'], answer: 0 },
    { id: 'qc76', kind: 'bunka', tags: ['rf21', 'r105'], q: 'たかやままつりの にんぎょうは なにで うごく?', choices: ['いと', 'でんき', 'かぜ'], answer: 0 },
    { id: 'qc77', kind: 'bunka', tags: ['rf22', 'r107'], q: 'はままつまつりで あげるのは?', choices: ['たこ', 'ふうせん', 'はなび だけ'], answer: 0 },
    { id: 'qc78', kind: 'bunka', tags: ['rf23', 'r112'], q: 'つしま てんのうさいの ふねに かざるのは?', choices: ['ちょうちん', 'ゆきぞう', 'はなび'], answer: 0 },
    /* --- バランス調整で追加した そざいの クイズ(2026-07) --- */
    { id: 'qz01', kind: 'sozai', tags: ['m34', 'r42'], q: 'ねぎは どこを たべる?', choices: ['しろい くきの ところ', 'ねっこの つち', 'はなの たね'], answer: 0 },
    { id: 'qz02', kind: 'sozai', tags: ['m35'], q: 'すいかは どこに できる?', choices: ['つるの うえ', 'きの うえ', 'つちの なか'], answer: 0 },
    { id: 'qz03', kind: 'sozai', tags: ['m36', 'r48'], q: 'かには あしが なんぼん?', choices: ['10ぽん', '6ぽん', '4ほん'], answer: 0 },
    { id: 'qz04', kind: 'sozai', tags: ['m37', 'r49'], q: 'ほたては どこで そだてる?', choices: ['うみに つるした かご', 'たんぼ', 'やまの はたけ'], answer: 0 },
    { id: 'qz05', kind: 'sozai', tags: ['m38', 'r51'], q: 'わかめは どこで そだつ?', choices: ['うみ', 'かわ', 'つちの なか'], answer: 0 },
    { id: 'qz06', kind: 'sozai', tags: ['m39', 'r54'], q: 'せんだいの せりは どこまで たべる?', choices: ['ねっこまで', 'はっぱだけ', 'たねだけ'], answer: 0 },
    { id: 'qz07', kind: 'sozai', tags: ['m40'], q: 'べにばなの はなの いろは どう かわる?', choices: ['きいろから あか', 'あおから しろ', 'みどりの まま'], answer: 0 },
    { id: 'qz08', kind: 'sozai', tags: ['m41', 'r43'], q: 'わさびが そだつのは どんな ところ?', choices: ['きれいな みずの ところ', 'あつい すなば', 'くらい へや'], answer: 0 },
    { id: 'qz09', kind: 'sozai', tags: ['m42'], q: 'とうきょうの うどは どこで そだてる?', choices: ['ちかの あなぐら', 'やまの うえ', 'うみの なか'], answer: 0 },
    { id: 'qz10', kind: 'bunka', tags: ['r47', 'r39'], q: 'チーズと バターは なにから つくる?', choices: ['ぎゅうにゅう', 'たまご', 'こむぎ'], answer: 0 },
    { id: 'qz11', kind: 'bunka', tags: ['r53'], q: 'ささかまぼこは なんの かたち?', choices: ['ささの はっぱ', 'まつの き', 'さくらの はな'], answer: 0 },
    { id: 'qz12', kind: 'bunka', tags: ['r57'], q: 'たまこんにゃくは どうやって たべる?', choices: ['くしに さして', 'コップで のんで', 'パンに ぬって'], answer: 0 },
    { id: 'qz13', kind: 'bunka', tags: ['r41', 'r03'], q: 'うめぼしの あじは?', choices: ['すっぱい', 'あまい', 'からい'], answer: 0 },
    { id: 'qz14', kind: 'kaitaku', tags: ['saitama'], q: 'さいたまけんの ふかやで ゆうめいな やさいは?', choices: ['ねぎ', 'すいか', 'わさび'], answer: 0 },
    { id: 'qz15', kind: 'kaitaku', tags: ['tokyo'], q: 'とうきょうの おくたまで そだつ からい やくみは?', choices: ['わさび', 'こしょう', 'とうがらし'], answer: 0 },
    { id: 'qz16', kind: 'kaitaku', tags: ['kanagawa'], q: 'かながわの みうらで そだつ あまい くだものは?', choices: ['すいか', 'メロン', 'りんご'], answer: 0 },
    { id: 'qz17', kind: 'kaitaku', tags: ['hokkaido'], q: 'ほっかいどうの うみで とれる おおきな いきものは?', choices: ['かに', 'くじら', 'いか だけ'], answer: 0 },
    { id: 'qz18', kind: 'kaitaku', tags: ['aomori'], q: 'あおもりの むつわんで そだてているのは?', choices: ['ほたて', 'こんぶ だけ', 'えび'], answer: 0 },
    { id: 'qz19', kind: 'kaitaku', tags: ['iwate'], q: 'いわての さんりくの うみの めいさんは?', choices: ['わかめ', 'すいか', 'ちゃば'], answer: 0 },
    { id: 'qz21', kind: 'sozai', tags: ['m43'], q: 'ブロッコリーの どこを たべる?', choices: ['つぼみ', 'ねっこ', 'たね'], answer: 0 },
    { id: 'qz22', kind: 'sozai', tags: ['m44'], q: 'いかつりの ふねは よる なにを つける?', choices: ['あかり', 'おんがく', 'はなび'], answer: 0 },
    { id: 'qz23', kind: 'sozai', tags: ['m45'], q: 'やまぶどうは どこに はえる?', choices: ['やま', 'うみ', 'すなはま'], answer: 0 },
    { id: 'qz24', kind: 'sozai', tags: ['m46'], q: 'そばの はなは なにいろ?', choices: ['しろ', 'あか', 'あお'], answer: 0 },
    { id: 'qz25', kind: 'sozai', tags: ['m01'], q: 'めいぶつづくりに かかせない ものは?', choices: ['きれいな みず', 'こおり', 'すな'], answer: 0 },
    { id: 'qz26', kind: 'kaitaku', tags: ['akita'], q: 'あきたけんの ろくごうで ゆうめいなのは?', choices: ['わきみず(めいすい)', 'おおきな みずうみ', 'すなの やま'], answer: 0 },
    { id: 'qz27', kind: 'kaitaku', tags: ['fukushima'], q: 'ふくしまの あいづで ゆうめいな めんは?', choices: ['そば', 'パスタ', 'ビーフン'], answer: 0 },
    { id: 'qz28', kind: 'kaitaku', tags: ['miyagi'], q: 'みやぎの わたりで そだつ あまい くだものは?', choices: ['いちご', 'すいか', 'りんご'], answer: 0 },
    { id: 'qz20', kind: 'kaitaku', tags: ['yamagata'], q: 'やまがたけんの はな「べにばな」は なにに つかう?', choices: ['あかい そめもの', 'たべる あぶら だけ', 'いえを たてる'], answer: 0 },

    /* --- ほっかいどう --- */
    { id: 'qh01', kind: 'kaitaku', type: 'shape', tags: ['hokkaido'], q: 'この かたちは どこ?', choices: ['ほっかいどう', 'あおもり', 'いわて'], answer: 0 },
    { id: 'qh02', kind: 'kaitaku', type: 'position', tags: ['hokkaido'], q: 'ひかっている ところは どこ?', choices: ['ほっかいどう', 'あおもり', 'あきた'], answer: 0 },
    { id: 'qh03', kind: 'kaitaku', tags: ['hokkaido'], q: 'にほんの いちばん きたに あるのは?', choices: ['ほっかいどう', 'おきなわ', 'とうきょう'], answer: 0 },
    { id: 'qh04', kind: 'kaitaku', tags: ['hokkaido'], q: 'ほっかいどうの ふゆの おまつりで つくるのは?', choices: ['ゆきの ぞう(ゆきぞう)', 'すなの おしろ', 'こおりの プール'], answer: 0 },
    { id: 'qh05', kind: 'kaitaku', tags: ['hokkaido'], q: 'ほっかいどうで さかんなのは?', choices: ['らくのう(うしを そだてる)', 'パイナップルづくり', 'さとうきびづくり'], answer: 0 },
    { id: 'qh06', kind: 'sozai', tags: ['m32', 'r40'], q: 'とうもろこしの みは どこに つく?', choices: ['くきの とちゅう', 'つちの なか', 'ねっこ'], answer: 0 },
    { id: 'qh07', kind: 'sozai', tags: ['m33'], q: 'じゃがいもは どこに できる?', choices: ['つちの なか', 'きの うえ', 'みずの なか'], answer: 0 },
    { id: 'qh08', kind: 'sozai', tags: ['m23', 'r39'], q: 'バターは なにから つくる?', choices: ['ぎゅうにゅう', 'みず', 'たまご'], answer: 0 },
    { id: 'qh09', kind: 'bunka', tags: ['rf14', 'r39'], q: 'さっぽろ ゆきまつりで ならぶのは?', choices: ['おおきな ゆきぞう', 'おおきな すなやま', 'おおきな かかし'], answer: 0 },

    /* --- とうほく: そざい(育成・レシピ用) --- */
    { id: 'qt20', kind: 'sozai', tags: ['m20', 'r26'], q: 'りんごが よく そだつのは どんな きこう?', choices: ['すずしい ところ', 'あつい ところ', 'うみの なか'], answer: 0 },
    { id: 'qt21', kind: 'sozai', tags: ['m20', 'r26'], q: 'りんごは どこに できる?', choices: ['きの うえ', 'つちの なか', 'みずの なか'], answer: 0 },
    { id: 'qt22', kind: 'sozai', tags: ['m21', 'r27'], q: 'にんにくは どこに できる?', choices: ['つちの なか', 'きの うえ', 'うみの なか'], answer: 0 },
    { id: 'qt23', kind: 'sozai', tags: ['m22'], q: 'ゆきの したで ふゆを こした にんじんは どうなる?', choices: ['あまく なる', 'にがく なる', 'かたく なる'], answer: 0 },
    { id: 'qt24', kind: 'sozai', tags: ['m23', 'r28'], q: 'ぎゅうにゅうは どの どうぶつから もらう?', choices: ['うし', 'ぶた', 'にわとり'], answer: 0 },
    { id: 'qt25', kind: 'sozai', tags: ['m24', 'r29'], q: 'てついしから つくれるのは どれ?', choices: ['てつびん', 'ガラスの コップ', 'きの おさら'], answer: 0 },
    { id: 'qt26', kind: 'sozai', tags: ['m25', 'r30'], q: 'ずんだは なにから つくる?', choices: ['えだまめ', 'こめ', 'とうもろこし'], answer: 0 },
    { id: 'qt27', kind: 'sozai', tags: ['m26', 'r31'], q: 'かきは どこで そだてる?', choices: ['うみ', 'かわ', 'たんぼ'], answer: 0 },
    { id: 'qt28', kind: 'sozai', tags: ['m27', 'r33'], q: 'はたはたは どこに すんでいる?', choices: ['うみ', 'かわ', 'みずうみ'], answer: 0 },
    { id: 'qt29', kind: 'sozai', tags: ['m28', 'r34', 'r36'], q: 'さくらんぼは どこに できる?', choices: ['きの うえ', 'つちの なか', 'つるの うえ'], answer: 0 },
    { id: 'qt30', kind: 'sozai', tags: ['m29', 'r35'], q: 'さといもは どこに できる?', choices: ['つちの なか', 'きの うえ', 'みずの なか'], answer: 0 },
    { id: 'qt31', kind: 'sozai', tags: ['m30', 'r37'], q: 'ももジュースは なにから つくる?', choices: ['もも', 'りんご', 'ぶどう'], answer: 0 },
    { id: 'qt32', kind: 'sozai', tags: ['m31', 'r38'], q: 'たべごろの トマトは なにいろ?', choices: ['あか', 'あお', 'しろ'], answer: 0 },
    { id: 'qt33', kind: 'sozai', tags: ['m02', 'r32'], q: 'きりたんぽは なにから つくる?', choices: ['ごはん', 'こむぎこ', 'いも'], answer: 0 },

    /* --- とうほく: ぶんか(おまつり・めいぶつ) --- */
    { id: 'qt40', kind: 'bunka', tags: ['rf8', 'r26'], q: 'ねぶたまつりの かけごえは どれ?', choices: ['ラッセラー', 'わっしょい', 'そいや'], answer: 0 },
    { id: 'qt41', kind: 'bunka', tags: ['rf9', 'r28'], q: 'さんさおどりで たたく がっきは?', choices: ['たいこ', 'ピアノ', 'ラッパ'], answer: 0 },
    { id: 'qt42', kind: 'bunka', tags: ['rf10', 'r30'], q: 'せんだいたなばたで まちに かざるのは?', choices: ['かみかざり', 'ゆきだるま', 'かぼちゃ'], answer: 0 },
    { id: 'qt43', kind: 'bunka', tags: ['rf11', 'r32'], q: 'かんとうまつりで ささえる ながい さおに ついているのは?', choices: ['ちょうちん', 'ふうせん', 'こいのぼり'], answer: 0 },
    { id: 'qt44', kind: 'bunka', tags: ['rf12', 'r34'], q: 'はながさまつりで まわしながら おどるのは?', choices: ['はなの かさ', 'ぼうし', 'うちわ'], answer: 0 },
    { id: 'qt45', kind: 'bunka', tags: ['rf13', 'r37'], q: 'ふくしまの わらじまつりで かつぐのは?', choices: ['おおきな わらじ', 'おおきな げた', 'おおきな くつした'], answer: 0 },
    { id: 'qt46', kind: 'bunka', tags: ['r29'], q: 'なんぶてっきは どこの でんとうこうげい?', choices: ['いわて', 'とうきょう', 'おきなわ'], answer: 0 },
    { id: 'qt47', kind: 'bunka', tags: ['r35'], q: 'やまがたの あきの たのしみ「いもにかい」は どこで やることが おおい?', choices: ['かわらで', 'がっこうの なかで', 'うみの うえで'], answer: 0 },

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
    { id: 'qsn13', kind: 'sozai', tags: ['m07', 'r05', 'r15'], q: 'うつわの かたちを つくる まわる どうぐは?', choices: ['ろくろ', 'ミキサー', 'せんぷうき'], answer: 0 },
    { id: 'qsn14', kind: 'sozai', tags: ['m08', 'r09'], q: 'らっかせいの からは どんな かんじ?', choices: ['でこぼこ', 'つるつる', 'ふわふわ'], answer: 0 },
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
    /* --- きんき7県(2026-07 追加) --- */
    { id: 'qn01', kind: 'kaitaku', type: 'shape', tags: ['mie'], q: 'この かたちの けんは どこ?', choices: ['みえ', 'わかやま', 'しが'], answer: 0 },
    { id: 'qn02', kind: 'kaitaku', type: 'position', tags: ['mie'], q: 'ひかっている けんは どこ?', choices: ['みえ', 'なら', 'あいち'], answer: 0 },
    { id: 'qn03', kind: 'kaitaku', type: 'shape', tags: ['shiga'], q: 'この かたちの けんは どこ?', choices: ['しが', 'きょうと', 'なら'], answer: 0 },
    { id: 'qn04', kind: 'kaitaku', type: 'position', tags: ['shiga'], q: 'ひかっている けんは どこ?', choices: ['しが', 'ぎふ', 'きょうと'], answer: 0 },
    { id: 'qn05', kind: 'kaitaku', type: 'shape', tags: ['kyoto'], q: 'この かたちは どこ?', choices: ['きょうと', 'ひょうご', 'おおさか'], answer: 0 },
    { id: 'qn06', kind: 'kaitaku', type: 'position', tags: ['kyoto'], q: 'ひかっているのは どこ?', choices: ['きょうと', 'しが', 'なら'], answer: 0 },
    { id: 'qn07', kind: 'kaitaku', type: 'shape', tags: ['osaka'], q: 'この かたちは どこ?', choices: ['おおさか', 'なら', 'ひょうご'], answer: 0 },
    { id: 'qn08', kind: 'kaitaku', type: 'position', tags: ['osaka'], q: 'ひかっているのは どこ?', choices: ['おおさか', 'きょうと', 'わかやま'], answer: 0 },
    { id: 'qn09', kind: 'kaitaku', type: 'shape', tags: ['hyogo'], q: 'この かたちの けんは どこ?', choices: ['ひょうご', 'きょうと', 'おおさか'], answer: 0 },
    { id: 'qn10', kind: 'kaitaku', type: 'position', tags: ['hyogo'], q: 'ひかっている けんは どこ?', choices: ['ひょうご', 'おおさか', 'しが'], answer: 0 },
    { id: 'qn11', kind: 'kaitaku', type: 'shape', tags: ['nara'], q: 'この かたちの けんは どこ?', choices: ['なら', 'みえ', 'わかやま'], answer: 0 },
    { id: 'qn12', kind: 'kaitaku', type: 'position', tags: ['nara'], q: 'ひかっている けんは どこ?', choices: ['なら', 'おおさか', 'みえ'], answer: 0 },
    { id: 'qn13', kind: 'kaitaku', type: 'shape', tags: ['wakayama'], q: 'この かたちの けんは どこ?', choices: ['わかやま', 'みえ', 'なら'], answer: 0 },
    { id: 'qn14', kind: 'kaitaku', type: 'position', tags: ['wakayama'], q: 'ひかっている けんは どこ?', choices: ['わかやま', 'なら', 'ひょうご'], answer: 0 },

    { id: 'qn15', kind: 'kaitaku', tags: ['mie'], q: 'せかいで はじめて しんじゅを そだてる ことに せいこうしたのは どこ?', choices: ['みえの しま', 'ほっかいどう', 'おきなわ'], answer: 0 },
    { id: 'qn16', kind: 'kaitaku', tags: ['mie'], q: 'みえに ある ゆうめいな じんじゃは?', choices: ['いせじんぐう', 'いずもたいしゃ', 'めいじじんぐう'], answer: 0 },
    { id: 'qn17', kind: 'kaitaku', tags: ['mie'], q: 'みえの まつざかぎゅうは なに?', choices: ['うし', 'ぶた', 'にわとり'], answer: 0 },
    { id: 'qn18', kind: 'kaitaku', tags: ['shiga'], q: 'しがに ある にほんいち おおきな みずうみは?', choices: ['びわこ', 'かすみがうら', 'とわだこ'], answer: 0 },
    { id: 'qn19', kind: 'kaitaku', tags: ['shiga'], q: 'しがの やきものは?', choices: ['しがらきやき', 'ましこやき', 'くたにやき'], answer: 0 },
    { id: 'qn20', kind: 'kaitaku', tags: ['shiga'], q: 'びわこの みずは どこへ ながれていく?', choices: ['おおさかわん', 'にほんかい', 'ふじさん'], answer: 0 },
    { id: 'qn21', kind: 'kaitaku', tags: ['kyoto'], q: 'きょうとの うじで ゆうめいな のみものは?', choices: ['まっちゃ', 'コーヒー', 'ミルク'], answer: 0 },
    { id: 'qn22', kind: 'kaitaku', tags: ['kyoto'], q: 'きょうとで なつに ある ゆうめいな まつりは?', choices: ['ぎおんまつり', 'ねぶたまつり', 'たなばたまつり'], answer: 0 },
    { id: 'qn23', kind: 'kaitaku', tags: ['kyoto'], q: 'きょうとの きたのほうの うみは?', choices: ['にほんかい', 'たいへいよう', 'せとないかい'], answer: 0 },
    { id: 'qn24', kind: 'kaitaku', tags: ['osaka'], q: 'おおさかの めいぶつ「こなもん」と いえば?', choices: ['たこやき', 'ラーメン', 'すし'], answer: 0 },
    { id: 'qn25', kind: 'kaitaku', tags: ['osaka'], q: 'おおさかに ある おおきな おしろは?', choices: ['おおさかじょう', 'ひめじじょう', 'まつもとじょう'], answer: 0 },
    { id: 'qn26', kind: 'kaitaku', tags: ['osaka'], q: 'おおさかは きんきの なかで どんな まち?', choices: ['いちばん ひとが おおい まち', 'ゆきが いちばん ふる まち', 'いちばん ひろい けん'], answer: 0 },
    { id: 'qn27', kind: 'kaitaku', tags: ['hyogo'], q: 'ひょうごに ある しろい おしろは?', choices: ['ひめじじょう', 'なごやじょう', 'くまもとじょう'], answer: 0 },
    { id: 'qn28', kind: 'kaitaku', tags: ['hyogo'], q: 'ひょうごの あわじしまで たくさん とれるのは?', choices: ['たまねぎ', 'すいか', 'りんご'], answer: 0 },
    { id: 'qn29', kind: 'kaitaku', tags: ['hyogo'], q: 'ひょうごは ふたつの うみに めんしている。それは?', choices: ['にほんかいと せとないかい', 'たいへいようだけ', 'みずうみだけ'], answer: 0 },
    { id: 'qn30', kind: 'kaitaku', tags: ['nara'], q: 'ならこうえんに たくさん いる どうぶつは?', choices: ['しか', 'さる', 'うさぎ'], answer: 0 },
    { id: 'qn31', kind: 'kaitaku', tags: ['nara'], q: 'ならの とうだいじに ある おおきな ものは?', choices: ['だいぶつ', 'とうだい', 'かんらんしゃ'], answer: 0 },
    { id: 'qn32', kind: 'kaitaku', tags: ['nara'], q: 'ならの よしのは なにで ゆうめい?', choices: ['さくらと すぎ', 'ゆきまつり', 'おんせんの うみ'], answer: 0 },
    { id: 'qn33', kind: 'kaitaku', tags: ['wakayama'], q: 'わかやまで にほんいち たくさん とれる くだものは?', choices: ['うめ', 'りんご', 'さくらんぼ'], answer: 0 },
    { id: 'qn34', kind: 'kaitaku', tags: ['wakayama'], q: 'わかやまの こうやさんは なにが ある ところ?', choices: ['おてらが たくさん ある やま', 'おおきな みずうみ', 'すなはま'], answer: 0 },
    { id: 'qn35', kind: 'kaitaku', tags: ['wakayama'], q: 'わかやまの かつうらの みなとに あがるのは?', choices: ['まぐろ', 'ほたて', 'こんぶ'], answer: 0 },

    { id: 'qn36', kind: 'sozai', tags: ['m63', 'r121'], q: 'しんじゅは どこで できる?', choices: ['かいの なか', 'いしの なか', 'きの みの なか'], answer: 0 },
    { id: 'qn37', kind: 'sozai', tags: ['m64', 'r120'], q: 'いせえびは どこに かくれている?', choices: ['いわばの あな', 'すなの うえ', 'きの うえ'], answer: 0 },
    { id: 'qn38', kind: 'sozai', tags: ['m65', 'r118'], q: 'のりは どこで そだつ?', choices: ['うみの あみ', 'やまの はたけ', 'かわの いし'], answer: 0 },
    { id: 'qn39', kind: 'sozai', tags: ['m66', 'r119'], q: 'まつざかぎゅうは どんな どうぶつ?', choices: ['うし', 'ひつじ', 'うま'], answer: 0 },
    { id: 'qn40', kind: 'sozai', tags: ['m67', 'r124'], q: 'ふなが すんでいるのは?', choices: ['みずうみや かわ', 'ふかい うみ', 'つちの なか'], answer: 0 },
    { id: 'qn41', kind: 'sozai', tags: ['m68', 'r129'], q: 'たけのこは なにの あかちゃん?', choices: ['たけ', 'まつ', 'すぎ'], answer: 0 },
    { id: 'qn42', kind: 'sozai', tags: ['m69', 'r130'], q: 'まつたけは どんな ところに はえる?', choices: ['あかまつの やま', 'すなはま', 'たんぼの みず'], answer: 0 },
    { id: 'qn43', kind: 'sozai', tags: ['m70', 'r132', 'r138', 'r141'], q: 'たこの あしは なんぼん?', choices: ['8ほん', '6ぽん', '10ぽん'], answer: 0 },
    { id: 'qn61', kind: 'sozai', tags: ['m79', 'r133'], q: 'せんしゅうの みずなすは どんな なす?', choices: ['みずみずしくて まるい', 'とても かたい', 'あおくて ほそい'], answer: 0 },
    { id: 'qn44', kind: 'sozai', tags: ['m71', 'r134'], q: 'しゅんぎくの たべる ところは?', choices: ['かおりの よい はっぱ', 'ねっこ', 'たね'], answer: 0 },
    { id: 'qn45', kind: 'sozai', tags: ['m72', 'r135', 'r140'], q: 'たまねぎは どこで そだつ?', choices: ['つちの なか', 'きの うえ', 'みずの なか'], answer: 0 },
    { id: 'qn46', kind: 'sozai', tags: ['m73', 'r139'], q: 'いかなごが とれるのは どの きせつ?', choices: ['はる', 'ふゆの ゆきのひ', 'なつの まんなか'], answer: 0 },
    { id: 'qn47', kind: 'sozai', tags: ['m74', 'r144'], q: 'ほしがきの しろい こなは なに?', choices: ['かきの あまみ', 'ゆき', 'こむぎこ'], answer: 0 },
    { id: 'qn48', kind: 'sozai', tags: ['m75', 'r146'], q: 'よしのすぎは なにに つかわれる?', choices: ['わりばしや たる', 'ガラス', 'ゴム'], answer: 0 },
    { id: 'qn49', kind: 'sozai', tags: ['m76', 'r149'], q: 'さんしょうを たべると どんな かんじ?', choices: ['ぴりっと しびれる', 'あまい', 'すっぱい'], answer: 0 },
    { id: 'qn50', kind: 'sozai', tags: ['m77', 'r150', 'r151'], q: 'まぐろは ねむるとき どうしている?', choices: ['およぎながら ねる', 'いわに つかまる', 'すなに もぐる'], answer: 0 },
    { id: 'qn51', kind: 'sozai', tags: ['m78', 'r151'], q: 'びんちょうたんは なにから つくる?', choices: ['きを かまで やいて つくる', 'いしを けずる', 'すなを かためる'], answer: 0 },
    { id: 'qn52', kind: 'sozai', tags: ['m01', 'r125', 'r126', 'r131'], q: 'びわこの みずは なにに つかわれている?', choices: ['のみみずや はたけの みず', 'ガソリン', 'でんき'], answer: 0 },
    { id: 'qn53', kind: 'sozai', tags: ['m51', 'r137', 'r147'], q: 'しおは なにから つくる?', choices: ['うみの みず', 'あまみず', 'ゆき'], answer: 0 },

    { id: 'qn54', kind: 'bunka', tags: ['rf24', 'r117'], q: 'くわなの いしどりまつりで ならすのは?', choices: ['かねと たいこ', 'ラッパ', 'ピアノ'], answer: 0 },
    { id: 'qn55', kind: 'bunka', tags: ['rf25', 'r122'], q: 'ながはま ひきやままつりで こどもたちが するのは?', choices: ['かぶき', 'サッカー', 'なわとび'], answer: 0 },
    { id: 'qn56', kind: 'bunka', tags: ['rf26', 'r127'], q: 'ぎおんまつりの やまほこが かどで するのは?', choices: ['竹を しいて ぐるっと まわる', 'ジャンプする', 'そらを とぶ'], answer: 0 },
    { id: 'qn57', kind: 'bunka', tags: ['rf27', 'r132'], q: 'だんじりまつりの「やりまわし」は?', choices: ['はしりながら かどを まがる', 'ゆっくり あるく', 'とまって うたう'], answer: 0 },
    { id: 'qn58', kind: 'bunka', tags: ['rf28', 'r137'], q: 'にしのみやの かいもんしんじで きめるのは?', choices: ['いちばんに ついた ふくおとこ', 'いちばん おおきな こえ', 'いちばん たかい ジャンプ'], answer: 0 },
    { id: 'qn59', kind: 'bunka', tags: ['rf29', 'r142'], q: 'わかくさやまやきで するのは?', choices: ['やまの かれくさを もやす', 'ゆきを つみあげる', 'たこを あげる'], answer: 0 },
    { id: 'qn60', kind: 'bunka', tags: ['rf30', 'r147'], q: 'なちの おうぎまつりで つかうのは?', choices: ['おおきな たいまつ', 'ふうせん', 'こま'], answer: 0 },
    /* --- ちゅうごく・しこく9県(2026-07 追加) --- */
    { id: 'qg01', kind: 'kaitaku', type: 'shape', tags: ['tottori'], q: 'この かたちの けんは どこ?', choices: ['とっとり', 'しまね', 'おかやま'], answer: 0 },
    { id: 'qg02', kind: 'kaitaku', type: 'position', tags: ['tottori'], q: 'ひかっている けんは どこ?', choices: ['とっとり', 'しまね', 'ひょうご'], answer: 0 },
    { id: 'qg03', kind: 'kaitaku', type: 'shape', tags: ['shimane'], q: 'この かたちの けんは どこ?', choices: ['しまね', 'とっとり', 'やまぐち'], answer: 0 },
    { id: 'qg04', kind: 'kaitaku', type: 'position', tags: ['shimane'], q: 'ひかっている けんは どこ?', choices: ['しまね', 'ひろしま', 'とっとり'], answer: 0 },
    { id: 'qg05', kind: 'kaitaku', type: 'shape', tags: ['okayama'], q: 'この かたちの けんは どこ?', choices: ['おかやま', 'ひろしま', 'とっとり'], answer: 0 },
    { id: 'qg06', kind: 'kaitaku', type: 'position', tags: ['okayama'], q: 'ひかっている けんは どこ?', choices: ['おかやま', 'かがわ', 'とっとり'], answer: 0 },
    { id: 'qg07', kind: 'kaitaku', type: 'shape', tags: ['hiroshima'], q: 'この かたちの けんは どこ?', choices: ['ひろしま', 'おかやま', 'しまね'], answer: 0 },
    { id: 'qg08', kind: 'kaitaku', type: 'position', tags: ['hiroshima'], q: 'ひかっている けんは どこ?', choices: ['ひろしま', 'やまぐち', 'えひめ'], answer: 0 },
    { id: 'qg09', kind: 'kaitaku', type: 'shape', tags: ['yamaguchi'], q: 'この かたちの けんは どこ?', choices: ['やまぐち', 'ひろしま', 'しまね'], answer: 0 },
    { id: 'qg10', kind: 'kaitaku', type: 'position', tags: ['yamaguchi'], q: 'ひかっている けんは どこ?', choices: ['やまぐち', 'ひろしま', 'ふくおか'], answer: 0 },
    { id: 'qg11', kind: 'kaitaku', type: 'shape', tags: ['tokushima'], q: 'この かたちの けんは どこ?', choices: ['とくしま', 'こうち', 'かがわ'], answer: 0 },
    { id: 'qg12', kind: 'kaitaku', type: 'position', tags: ['tokushima'], q: 'ひかっている けんは どこ?', choices: ['とくしま', 'かがわ', 'えひめ'], answer: 0 },
    { id: 'qg13', kind: 'kaitaku', type: 'shape', tags: ['kagawa'], q: 'この かたちの けんは どこ?', choices: ['かがわ', 'とくしま', 'えひめ'], answer: 0 },
    { id: 'qg14', kind: 'kaitaku', type: 'position', tags: ['kagawa'], q: 'ひかっている けんは どこ?', choices: ['かがわ', 'おかやま', 'こうち'], answer: 0 },
    { id: 'qg15', kind: 'kaitaku', type: 'shape', tags: ['ehime'], q: 'この かたちの けんは どこ?', choices: ['えひめ', 'こうち', 'やまぐち'], answer: 0 },
    { id: 'qg16', kind: 'kaitaku', type: 'position', tags: ['ehime'], q: 'ひかっている けんは どこ?', choices: ['えひめ', 'こうち', 'ひろしま'], answer: 0 },
    { id: 'qg17', kind: 'kaitaku', type: 'shape', tags: ['kochi'], q: 'この かたちの けんは どこ?', choices: ['こうち', 'えひめ', 'とくしま'], answer: 0 },
    { id: 'qg18', kind: 'kaitaku', type: 'position', tags: ['kochi'], q: 'ひかっている けんは どこ?', choices: ['こうち', 'とくしま', 'かがわ'], answer: 0 },

    { id: 'qg19', kind: 'kaitaku', tags: ['tottori'], q: 'とっとりに ある おおきな すなの ばしょは?', choices: ['とっとり さきゅう', 'ゆきの はら', 'いわの もり'], answer: 0 },
    { id: 'qg20', kind: 'kaitaku', tags: ['tottori'], q: 'とっとりで にほんいち みずあげされる かには?', choices: ['まつばがに', 'たらばがに', 'さわがに'], answer: 0 },
    { id: 'qg21', kind: 'kaitaku', tags: ['tottori'], q: 'とっとりの ゆうめいな なしは?', choices: ['にじゅっせいきなし', 'ラフランス', 'あきづき'], answer: 0 },
    { id: 'qg22', kind: 'kaitaku', tags: ['shimane'], q: 'しまねに ある ゆうめいな じんじゃは?', choices: ['いずもたいしゃ', 'いせじんぐう', 'めいじじんぐう'], answer: 0 },
    { id: 'qg23', kind: 'kaitaku', tags: ['shimane'], q: 'しまねの しんじこで とれる かいは?', choices: ['しじみ', 'ほたて', 'あさり'], answer: 0 },
    { id: 'qg24', kind: 'kaitaku', tags: ['shimane'], q: 'しまねの おくいずもで むかし さかんだった しごとは?', choices: ['たたら(てつづくり)', 'ガラスづくり', 'ゴムづくり'], answer: 0 },
    { id: 'qg25', kind: 'kaitaku', tags: ['okayama'], q: 'おかやまは なにの おうこくと よばれる?', choices: ['くだもの', 'ゆき', 'すな'], answer: 0 },
    { id: 'qg26', kind: 'kaitaku', tags: ['okayama'], q: 'おかやまの むかしばなしと いえば?', choices: ['ももたろう', 'かさじぞう', 'つるの おんがえし'], answer: 0 },
    { id: 'qg27', kind: 'kaitaku', tags: ['okayama'], q: 'おかやまの やきものは?', choices: ['びぜんやき', 'ましこやき', 'しがらきやき'], answer: 0 },
    { id: 'qg28', kind: 'kaitaku', tags: ['hiroshima'], q: 'ひろしまの みやじまに ある ゆうめいな ものは?', choices: ['うみに たつ とりい', 'すなの やま', 'おおきな みずうみ'], answer: 0 },
    { id: 'qg29', kind: 'kaitaku', tags: ['hiroshima'], q: 'ひろしまで にほんいち とれる かいは?', choices: ['かき', 'ほたて', 'しじみ'], answer: 0 },
    { id: 'qg30', kind: 'kaitaku', tags: ['hiroshima'], q: 'ひろしまで にほんいち とれる くだものは?', choices: ['レモン', 'りんご', 'さくらんぼ'], answer: 0 },
    { id: 'qg31', kind: 'kaitaku', tags: ['yamaguchi'], q: 'やまぐちの しものせきで ゆうめいな さかなは?', choices: ['ふぐ', 'さけ', 'たら'], answer: 0 },
    { id: 'qg32', kind: 'kaitaku', tags: ['yamaguchi'], q: 'やまぐちの あきよしだいは どんな ところ?', choices: ['ひろい くさはらと しょうにゅうどう', 'すなの おか', 'ゆきの やま'], answer: 0 },
    { id: 'qg33', kind: 'kaitaku', tags: ['yamaguchi'], q: 'やまぐちの いわくにに ある ゆうめいな はしは?', choices: ['きんたいきょう', 'レインボーブリッジ', 'せとおおはし'], answer: 0 },
    { id: 'qg34', kind: 'kaitaku', tags: ['tokushima'], q: 'とくしまの なつの まつりは?', choices: ['あわおどり', 'ねぶたまつり', 'ぎおんまつり'], answer: 0 },
    { id: 'qg35', kind: 'kaitaku', tags: ['tokushima'], q: 'とくしまの なるとで 見られる ものは?', choices: ['うずしお', 'かざんの けむり', 'りゅうひょう'], answer: 0 },
    { id: 'qg36', kind: 'kaitaku', tags: ['tokushima'], q: 'とくしまで ほとんどが つくられる かんきつは?', choices: ['すだち', 'ゆず', 'レモン'], answer: 0 },
    { id: 'qg37', kind: 'kaitaku', tags: ['kagawa'], q: 'かがわで ゆうめいな めんは?', choices: ['さぬきうどん', 'そば', 'ラーメン'], answer: 0 },
    { id: 'qg38', kind: 'kaitaku', tags: ['kagawa'], q: 'かがわは にほんの けんの なかで どんな けん?', choices: ['いちばん ちいさい', 'いちばん ひろい', 'いちばん さむい'], answer: 0 },
    { id: 'qg39', kind: 'kaitaku', tags: ['kagawa'], q: 'かがわの しょうどしまで にほん はじめて そだった みは?', choices: ['オリーブ', 'バナナ', 'コーヒー'], answer: 0 },
    { id: 'qg40', kind: 'kaitaku', tags: ['ehime'], q: 'えひめで たくさん とれる くだものは?', choices: ['みかん', 'りんご', 'もも'], answer: 0 },
    { id: 'qg41', kind: 'kaitaku', tags: ['ehime'], q: 'えひめの まつやまに ある ふるい おんせんは?', choices: ['どうごおんせん', 'くさつおんせん', 'べっぷおんせん'], answer: 0 },
    { id: 'qg42', kind: 'kaitaku', tags: ['ehime'], q: 'えひめの いまばりで つくられる ものは?', choices: ['タオル', 'じてんしゃの タイヤ', 'ガラスの コップ'], answer: 0 },
    { id: 'qg43', kind: 'kaitaku', tags: ['kochi'], q: 'こうちの おきで ゆうめいな さかなは?', choices: ['かつお', 'さんま', 'ほっけ'], answer: 0 },
    { id: 'qg44', kind: 'kaitaku', tags: ['kochi'], q: 'こうちの しまんとがわは どんな かわ?', choices: ['みずが きれいな にほん さいごの せいりゅう', 'にほんで いちばん ながい かわ', 'こおった かわ'], answer: 0 },
    { id: 'qg45', kind: 'kaitaku', tags: ['kochi'], q: 'こうちで にほんいち たくさん とれるのは?', choices: ['ゆずと しょうが', 'りんごと なし', 'こんぶと わかめ'], answer: 0 },

    { id: 'qg46', kind: 'sozai', tags: ['m80', 'r153'], q: 'らっきょうは どこで そだつ?', choices: ['すなの ような つち', 'うみの なか', 'きの うえ'], answer: 0 },
    { id: 'qg47', kind: 'sozai', tags: ['m81', 'r157'], q: 'しじみは どこに すんでいる?', choices: ['みずうみや かわの すな', 'ふかい うみ', 'やまの つち'], answer: 0 },
    { id: 'qg48', kind: 'sozai', tags: ['m82', 'r159'], q: 'のどぐろの なまえの りゆうは?', choices: ['のどの なかが くろい', 'せなかが くろい', 'よるだけ およぐ'], answer: 0 },
    { id: 'qg49', kind: 'sozai', tags: ['m83', 'r164'], q: 'ままかりの なまえは なにから きている?', choices: ['ごはんを かりに いくほど おいしい', 'ままの すきな さかな', 'かりに いく さかな'], answer: 0 },
    { id: 'qg50', kind: 'sozai', tags: ['m84', 'r165'], q: 'きにらは どうして きいろい?', choices: ['ひかりを あてずに そだてる', 'きいろい たねを つかう', 'あぶらを ぬる'], answer: 0 },
    { id: 'qg51', kind: 'sozai', tags: ['m85', 'r168'], q: 'レモンは どんな あじ?', choices: ['すっぱい', 'からい', 'にがいだけ'], answer: 0 },
    { id: 'qg52', kind: 'sozai', tags: ['m86', 'r169'], q: 'ひろしまなは なにに するのが ゆうめい?', choices: ['つけもの', 'ジュース', 'あめ'], answer: 0 },
    { id: 'qg53', kind: 'sozai', tags: ['m87', 'r170'], q: 'あなごは どんな かたち?', choices: ['ほそながい', 'まるくて ひらたい', 'とげとげ'], answer: 0 },
    { id: 'qg54', kind: 'sozai', tags: ['m88', 'r171'], q: 'わけぎは なにの なかま?', choices: ['ねぎ', 'にんじん', 'いも'], answer: 0 },
    { id: 'qg55', kind: 'sozai', tags: ['m89', 'r172'], q: 'ふぐは あぶないとき どうなる?', choices: ['ふくらむ', 'いろが きえる', 'とぶ'], answer: 0 },
    { id: 'qg80', kind: 'sozai', tags: ['m104', 'r174'], q: 'いわくにれんこんの あなは いくつと いわれる?', choices: ['9つ', '3つ', '20こ'], answer: 0 },
    { id: 'qg56', kind: 'sozai', tags: ['m90', 'r175'], q: 'はなっこりーは どこで うまれた やさい?', choices: ['やまぐち', 'ほっかいどう', 'おきなわ'], answer: 0 },
    { id: 'qg57', kind: 'sozai', tags: ['m91', 'r177'], q: 'すだちは どんな いろで つかう?', choices: ['みどりの うちに つかう', 'まっかに なってから', 'しろく なってから'], answer: 0 },
    { id: 'qg58', kind: 'sozai', tags: ['m92', 'r180'], q: 'あいの はっぱから とれる いろは?', choices: ['あお', 'あか', 'きいろ'], answer: 0 },
    { id: 'qg59', kind: 'sozai', tags: ['m93', 'r181', 'r188'], q: 'なるとの たいが おいしい りゆうは?', choices: ['はやい しおで もまれて そだつ', 'つめたい こおりの したに いる', 'かわで そだつ'], answer: 0 },
    { id: 'qg60', kind: 'sozai', tags: ['m94', 'r182'], q: 'うどんは なにから つくる?', choices: ['こむぎこ', 'こめ', 'いも'], answer: 0 },
    { id: 'qg61', kind: 'sozai', tags: ['m95', 'r183'], q: 'オリーブの みは そのままでは どんな あじ?', choices: ['にがい', 'あまい', 'すっぱい'], answer: 0 },
    { id: 'qg62', kind: 'sozai', tags: ['m96', 'r185'], q: 'きんときにんじんの いろは?', choices: ['まっか', 'むらさき', 'しろ'], answer: 0 },
    { id: 'qg63', kind: 'sozai', tags: ['m97', 'r186', 'r190'], q: 'わたから つくる ものは?', choices: ['いとや ぬの', 'ガラス', 'てつ'], answer: 0 },
    { id: 'qg64', kind: 'sozai', tags: ['m98', 'r189'], q: 'キウイの なかの いろは?', choices: ['みどり', 'あお', 'くろ'], answer: 0 },
    { id: 'qg65', kind: 'sozai', tags: ['m99', 'r191'], q: 'はだかむぎは どんな むぎ?', choices: ['かわが むけやすい', 'あおい むぎ', 'みずに うかぶ むぎ'], answer: 0 },
    { id: 'qg66', kind: 'sozai', tags: ['m100', 'r192'], q: 'ゆずの かわは どんな かんじ?', choices: ['ぶつぶつして かおる', 'つるつるで かおらない', 'とげとげ'], answer: 0 },
    { id: 'qg67', kind: 'sozai', tags: ['m101', 'r193', 'r196'], q: 'とさの かつおの つりかたは?', choices: ['さおで 1ぴきずつ つる', 'あみで まとめて とる', 'かごを しずめる'], answer: 0 },
    { id: 'qg68', kind: 'sozai', tags: ['m102', 'r194'], q: 'しょうがは どこを たべる?', choices: ['つちの なかの くき', 'はっぱ', 'はな'], answer: 0 },
    { id: 'qg69', kind: 'sozai', tags: ['m103', 'r195'], q: 'ししとうは なにの なかま?', choices: ['ピーマン', 'なす', 'きゅうり'], answer: 0 },
    { id: 'qg70', kind: 'sozai', tags: ['m36', 'r155', 'r156'], q: 'かには どうやって そだつ?', choices: ['からを ぬいで おおきくなる', 'かわが のびる', 'はねが はえる'], answer: 0 },

    { id: 'qg71', kind: 'bunka', tags: ['rf31', 'r153'], q: 'しゃんしゃんまつりで もつのは?', choices: ['すずの ついた かさ', 'ちょうちん', 'たいこ'], answer: 0 },
    { id: 'qg72', kind: 'bunka', tags: ['rf32', 'r158'], q: 'いわみかぐらで たいじするのは?', choices: ['やまたのおろち', 'おおきな くま', 'かみなり'], answer: 0 },
    { id: 'qg73', kind: 'bunka', tags: ['rf33', 'r164'], q: 'さいだいじ えようで とりあうのは?', choices: ['しんぎ', 'ボール', 'かさ'], answer: 0 },
    { id: 'qg74', kind: 'bunka', tags: ['rf34', 'r167'], q: 'べっちゃーまつりで おにに つかれると?', choices: ['1ねん げんきに すごせる', 'ねむく なる', 'せが のびる'], answer: 0 },
    { id: 'qg75', kind: 'bunka', tags: ['rf35', 'r172'], q: 'やないの まつりで まちを かざるのは?', choices: ['きんぎょちょうちん', 'ゆきだるま', 'こいのぼり'], answer: 0 },
    { id: 'qg76', kind: 'bunka', tags: ['rf36', 'r178'], q: 'あわおどりの かけごえは?', choices: ['えらいやっちゃ', 'ラッセラー', 'よいさ'], answer: 0 },
    { id: 'qg77', kind: 'bunka', tags: ['rf37', 'r182'], q: 'ちょうさまつりで かつぎ上げるのは?', choices: ['たいこだい', 'ふね', 'おおきな かさ'], answer: 0 },
    { id: 'qg78', kind: 'bunka', tags: ['rf38', 'r187'], q: 'うわじまの うしおにの とくちょうは?', choices: ['くびが とても ながい', 'そらを とぶ', 'こおりで できている'], answer: 0 },
    { id: 'qg79', kind: 'bunka', tags: ['rf39', 'r193'], q: 'よさこいまつりで りょうてに もつのは?', choices: ['なるこ', 'すず', 'せんす'], answer: 0 },
    /* --- きゅうしゅう・おきなわ8県(2026-07 追加) --- */
    { id: 'qy01', kind: 'kaitaku', type: 'shape', tags: ['fukuoka'], q: 'この かたちの けんは どこ?', choices: ['ふくおか', 'さが', 'くまもと'], answer: 0 },
    { id: 'qy02', kind: 'kaitaku', type: 'position', tags: ['fukuoka'], q: 'ひかっている けんは どこ?', choices: ['ふくおか', 'さが', 'おおいた'], answer: 0 },
    { id: 'qy03', kind: 'kaitaku', type: 'shape', tags: ['saga'], q: 'この かたちの けんは どこ?', choices: ['さが', 'ながさき', 'ふくおか'], answer: 0 },
    { id: 'qy04', kind: 'kaitaku', type: 'position', tags: ['saga'], q: 'ひかっている けんは どこ?', choices: ['さが', 'ながさき', 'くまもと'], answer: 0 },
    { id: 'qy05', kind: 'kaitaku', type: 'shape', tags: ['nagasaki'], q: 'この かたちの けんは どこ?', choices: ['ながさき', 'さが', 'おきなわ'], answer: 0 },
    { id: 'qy06', kind: 'kaitaku', type: 'position', tags: ['nagasaki'], q: 'ひかっている けんは どこ?', choices: ['ながさき', 'さが', 'ふくおか'], answer: 0 },
    { id: 'qy07', kind: 'kaitaku', type: 'shape', tags: ['kumamoto'], q: 'この かたちの けんは どこ?', choices: ['くまもと', 'おおいた', 'みやざき'], answer: 0 },
    { id: 'qy08', kind: 'kaitaku', type: 'position', tags: ['kumamoto'], q: 'ひかっている けんは どこ?', choices: ['くまもと', 'かごしま', 'さが'], answer: 0 },
    { id: 'qy09', kind: 'kaitaku', type: 'shape', tags: ['oita'], q: 'この かたちの けんは どこ?', choices: ['おおいた', 'みやざき', 'くまもと'], answer: 0 },
    { id: 'qy10', kind: 'kaitaku', type: 'position', tags: ['oita'], q: 'ひかっている けんは どこ?', choices: ['おおいた', 'ふくおか', 'みやざき'], answer: 0 },
    { id: 'qy11', kind: 'kaitaku', type: 'shape', tags: ['miyazaki'], q: 'この かたちの けんは どこ?', choices: ['みやざき', 'かごしま', 'おおいた'], answer: 0 },
    { id: 'qy12', kind: 'kaitaku', type: 'position', tags: ['miyazaki'], q: 'ひかっている けんは どこ?', choices: ['みやざき', 'くまもと', 'かごしま'], answer: 0 },
    { id: 'qy13', kind: 'kaitaku', type: 'shape', tags: ['kagoshima'], q: 'この かたちの けんは どこ?', choices: ['かごしま', 'みやざき', 'くまもと'], answer: 0 },
    { id: 'qy14', kind: 'kaitaku', type: 'position', tags: ['kagoshima'], q: 'ひかっている けんは どこ?', choices: ['かごしま', 'みやざき', 'ながさき'], answer: 0 },
    { id: 'qy15', kind: 'kaitaku', type: 'shape', tags: ['okinawa'], q: 'この かたちの けんは どこ?', choices: ['おきなわ', 'ながさき', 'かごしま'], answer: 0 },
    { id: 'qy16', kind: 'kaitaku', type: 'position', tags: ['okinawa'], q: 'ひかっている けんは どこ?', choices: ['おきなわ', 'かごしま', 'こうち'], answer: 0 },

    { id: 'qy17', kind: 'kaitaku', tags: ['fukuoka'], q: 'ふくおかで うまれた おおきな いちごは?', choices: ['あまおう', 'とちおとめ', 'べにほっぺ'], answer: 0 },
    { id: 'qy18', kind: 'kaitaku', tags: ['fukuoka'], q: 'ふくおかの なつの まつりは?', choices: ['はかた ぎおん やまかさ', 'ねぶたまつり', 'ゆきまつり'], answer: 0 },
    { id: 'qy19', kind: 'kaitaku', tags: ['fukuoka'], q: 'ふくおかは きゅうしゅうの なかで どんな けん?', choices: ['いちばん ひとが おおい', 'いちばん さむい', 'いちばん ちいさい'], answer: 0 },
    { id: 'qy20', kind: 'kaitaku', tags: ['saga'], q: 'さがの ありあけかいで たくさん とれるのは?', choices: ['のり', 'こんぶ', 'ほたて'], answer: 0 },
    { id: 'qy21', kind: 'kaitaku', tags: ['saga'], q: 'さがの ゆうめいな やきものは?', choices: ['ありたやき', 'びぜんやき', 'ましこやき'], answer: 0 },
    { id: 'qy22', kind: 'kaitaku', tags: ['saga'], q: 'さがで あきに ひらかれる おおきな たいかいは?', choices: ['ききゅうの たいかい', 'ゆきまつり', 'マラソンの せかいたいかい'], answer: 0 },
    { id: 'qy23', kind: 'kaitaku', tags: ['nagasaki'], q: 'ながさきに たくさん あるものは?', choices: ['しま', 'ゆきやま', 'すなおか'], answer: 0 },
    { id: 'qy24', kind: 'kaitaku', tags: ['nagasaki'], q: 'ながさきで にほんいち たくさん とれる くだものは?', choices: ['びわ', 'りんご', 'さくらんぼ'], answer: 0 },
    { id: 'qy25', kind: 'kaitaku', tags: ['nagasaki'], q: 'ながさきで うまれた めんりょうりは?', choices: ['ちゃんぽん', 'そば', 'うどん'], answer: 0 },
    { id: 'qy26', kind: 'kaitaku', tags: ['kumamoto'], q: 'くまもとに ある おおきな かざんは?', choices: ['あそさん', 'ふじさん', 'さくらじま'], answer: 0 },
    { id: 'qy27', kind: 'kaitaku', tags: ['kumamoto'], q: 'くまもとで にほんの ほとんどが つくられる くさは?', choices: ['いぐさ(たたみの くさ)', 'わた', 'あい'], answer: 0 },
    { id: 'qy28', kind: 'kaitaku', tags: ['kumamoto'], q: 'くまもとの あたまが でこっと でた かんきつは?', choices: ['デコポン', 'レモン', 'ゆず'], answer: 0 },
    { id: 'qy29', kind: 'kaitaku', tags: ['oita'], q: 'おおいたの べっぷに たくさん あるものは?', choices: ['おんせん', 'すなおか', 'こおりの みずうみ'], answer: 0 },
    { id: 'qy30', kind: 'kaitaku', tags: ['oita'], q: 'おおいたで にほんの ほとんどが つくられる かんきつは?', choices: ['かぼす', 'すだち', 'レモン'], answer: 0 },
    { id: 'qy31', kind: 'kaitaku', tags: ['oita'], q: 'おおいたで にほんいちの ほしたきのこは?', choices: ['ほししいたけ', 'ほしまつたけ', 'ほしえのき'], answer: 0 },
    { id: 'qy32', kind: 'kaitaku', tags: ['miyazaki'], q: 'みやざきの あまい なんごくの くだものは?', choices: ['マンゴー', 'りんご', 'なし'], answer: 0 },
    { id: 'qy33', kind: 'kaitaku', tags: ['miyazaki'], q: 'みやざきで にほんいち たくさん とれる やさいは?', choices: ['きゅうり', 'だいこん', 'キャベツ'], answer: 0 },
    { id: 'qy34', kind: 'kaitaku', tags: ['miyazaki'], q: 'みやざきの たかちほで つたわる ものは?', choices: ['よかぐら(よるの まい)', 'ゆきまつり', 'ききゅう'], answer: 0 },
    { id: 'qy35', kind: 'kaitaku', tags: ['kagoshima'], q: 'かごしまに ある けむりを あげる かざんは?', choices: ['さくらじま', 'あそさん', 'やりがたけ'], answer: 0 },
    { id: 'qy36', kind: 'kaitaku', tags: ['kagoshima'], q: 'かごしまで にほんいち たくさん とれる いもは?', choices: ['さつまいも', 'じゃがいも', 'さといも'], answer: 0 },
    { id: 'qy37', kind: 'kaitaku', tags: ['kagoshima'], q: 'かごしまで にほんいち そだてられている さかなは?', choices: ['うなぎ', 'さけ', 'たら'], answer: 0 },
    { id: 'qy38', kind: 'kaitaku', tags: ['okinawa'], q: 'おきなわは にほんの どこに ある?', choices: ['いちばん みなみの ほう', 'いちばん きたの ほう', 'まんなか'], answer: 0 },
    { id: 'qy39', kind: 'kaitaku', tags: ['okinawa'], q: 'おきなわの にがい やさいは?', choices: ['ゴーヤー', 'キャベツ', 'ねぎ'], answer: 0 },
    { id: 'qy40', kind: 'kaitaku', tags: ['okinawa'], q: 'おきなわの くろざとうは なにから つくる?', choices: ['さとうきび', 'こめ', 'いも'], answer: 0 },

    { id: 'qy41', kind: 'sozai', tags: ['m105', 'r201'], q: 'かつおなは なにに 入れる やさい?', choices: ['はかたの おぞうに', 'アイス', 'ジュース'], answer: 0 },
    { id: 'qy42', kind: 'sozai', tags: ['m106', 'r206'], q: 'むつごろうは どこに すんでいる?', choices: ['ありあけかいの ひがた', 'ふかい うみ', 'やまの かわ'], answer: 0 },
    { id: 'qy43', kind: 'sozai', tags: ['m107', 'r207'], q: 'びわは どんな いろの み?', choices: ['オレンジいろ', 'あお', 'むらさき'], answer: 0 },
    { id: 'qy44', kind: 'sozai', tags: ['m108', 'r208', 'r219'], q: 'あじが おいしくなるのは どんな ところ?', choices: ['しおの ながれが はやい うみ', 'つめたい みずうみ', 'つちの なか'], answer: 0 },
    { id: 'qy45', kind: 'sozai', tags: ['m109', 'r212'], q: 'いぐさは なにに つかう?', choices: ['たたみ', 'ガラス', 'くつ'], answer: 0 },
    { id: 'qy46', kind: 'sozai', tags: ['m110', 'r213'], q: 'デコポンの とくちょうは?', choices: ['あたまが でこっと でている', 'まっしろ', 'とげとげ'], answer: 0 },
    { id: 'qy47', kind: 'sozai', tags: ['m111', 'r215'], q: 'くりは なにの なかに 入っている?', choices: ['いが', 'かい', 'さや'], answer: 0 },
    { id: 'qy48', kind: 'sozai', tags: ['m112', 'r217'], q: 'かぼすは どんな いろで つかう?', choices: ['みどりの うちに つかう', 'まっかに なってから', 'くろく なってから'], answer: 0 },
    { id: 'qy49', kind: 'sozai', tags: ['m113', 'r218', 'r221'], q: 'しいたけは どこで そだつ?', choices: ['ほだぎ(きの まるた)', 'うみの なか', 'すなの うえ'], answer: 0 },
    { id: 'qy50', kind: 'sozai', tags: ['m114', 'r222', 'r226'], q: 'みやざきの マンゴーの とりかたは?', choices: ['じゅくして おちた みを ネットで うける', 'つちを ほる', 'あみで すくう'], answer: 0 },
    { id: 'qy51', kind: 'sozai', tags: ['m115', 'r224'], q: 'きゅうりの ほとんどは なに?', choices: ['みず', 'あぶら', 'さとう'], answer: 0 },
    { id: 'qy52', kind: 'sozai', tags: ['m116', 'r225'], q: 'ピーマンは いつ とる?', choices: ['まだ あおい うちに とる', 'くろく なってから', 'ゆきが ふってから'], answer: 0 },
    { id: 'qy53', kind: 'sozai', tags: ['m117', 'r230'], q: 'うなぎは どんな かたち?', choices: ['ほそながい', 'まるくて ひらたい', 'とげとげ'], answer: 0 },
    { id: 'qy54', kind: 'sozai', tags: ['m118', 'r229'], q: 'そらまめの なまえの りゆうは?', choices: ['さやが そらを むいて そだつ', 'そらから おちてくる', 'そらいろに なる'], answer: 0 },
    { id: 'qy55', kind: 'sozai', tags: ['m119', 'r231'], q: 'きんかんの たべかたは?', choices: ['かわごと たべられる', 'かわを ぜんぶ むく', 'たねだけ たべる'], answer: 0 },
    { id: 'qy56', kind: 'sozai', tags: ['m120', 'r232'], q: 'さとうきびから とれるのは?', choices: ['あまい しる', 'あぶら', 'しお'], answer: 0 },
    { id: 'qy57', kind: 'sozai', tags: ['m121', 'r233'], q: 'ゴーヤーは どんな あじ?', choices: ['にがい', 'あまい', 'すっぱい'], answer: 0 },
    { id: 'qy58', kind: 'sozai', tags: ['m122', 'r234'], q: 'パイナップルは どこで そだつ?', choices: ['あたたかい ところの つちの うえ', 'きの たかい ところ', 'うみの なか'], answer: 0 },
    { id: 'qy59', kind: 'sozai', tags: ['m123', 'r235'], q: 'もずくは どこで そだつ?', choices: ['うみ', 'かわ', 'つちの なか'], answer: 0 },
    { id: 'qy60', kind: 'sozai', tags: ['m124', 'r236'], q: 'べにいもの なかの いろは?', choices: ['むらさき', 'しろ', 'みどり'], answer: 0 },

    { id: 'qy61', kind: 'bunka', tags: ['rf40', 'r197'], q: 'はかた ぎおん やまかさで するのは?', choices: ['かきやまを かついで はしる', 'ふねを こぐ', 'たこを あげる'], answer: 0 },
    { id: 'qy62', kind: 'bunka', tags: ['rf41', 'r203'], q: 'さがの バルーンフェスタで そらに あがるのは?', choices: ['ききゅう', 'はなび', 'たこ'], answer: 0 },
    { id: 'qy63', kind: 'bunka', tags: ['rf42', 'r210'], q: 'ながさきくんちの コッコデショで するのは?', choices: ['たいこやまを ほうり上げて うける', 'つなを ひく', 'ゆきぞうを つくる'], answer: 0 },
    { id: 'qy64', kind: 'bunka', tags: ['rf43', 'r213'], q: 'くまもとの あきまつりで まちを ねりあるくのは?', choices: ['かざった うま', 'ふね', 'ぞう'], answer: 0 },
    { id: 'qy65', kind: 'bunka', tags: ['rf44', 'r218'], q: 'べっぷ おんせんまつりの「ゆかけ」で かけあうのは?', choices: ['おんせんの ゆ', 'すな', 'はなびら'], answer: 0 },
    { id: 'qy66', kind: 'bunka', tags: ['rf45', 'r222'], q: 'ひょっとこ なつまつりで つけるのは?', choices: ['おかしな おめん', 'かんむり', 'つの'], answer: 0 },
    { id: 'qy67', kind: 'bunka', tags: ['rf46', 'r227'], q: 'ろくがつどうで じんじゃに かけるのは?', choices: ['絵を かいた とうろう', 'ふうせん', 'こいのぼり'], answer: 0 },
    { id: 'qy68', kind: 'bunka', tags: ['rf47', 'r232'], q: 'なはの おおづなひきで するのは?', choices: ['おおきな つなを ひきあう', 'たいこを たたく', 'はなびを あげる'], answer: 0 },

    /* --- どうぐと どうぐの 材料 --- */
    { id: 'qd01', kind: 'sozai', tags: ['m125', 'rd03', 'rd04', 'rd09'], q: 'たけの せいちょうの はやさは?', choices: ['1にちで 1メートル ちかく のびる ことも ある', '1ねんで 1センチ', 'ぜんぜん のびない'], answer: 0 },
    { id: 'qd02', kind: 'sozai', tags: ['m125'], q: 'たけから つくる ものは?', choices: ['かごや ざる', 'ガラスの コップ', 'ぬいぐるみ'], answer: 0 },
    { id: 'qd03', kind: 'sozai', tags: ['m126', 'rd08'], q: 'きを きった あと、もりの ために する ことは?', choices: ['あたらしい きを うえる', 'なにも しない', 'いしを ならべる'], answer: 0 },
    { id: 'qd04', kind: 'sozai', tags: ['m126'], q: 'ひのきや すぎは なにに つかう?', choices: ['いえや どうぐを つくる', 'たべる', 'のみものに する'], answer: 0 },
    { id: 'qd05', kind: 'bunka', tags: ['rd01'], q: 'にいがたの つばめさんじょうが ゆうめいなのは?', choices: ['かなものづくり', 'ガラスざいく', 'おりもの'], answer: 0 },
    { id: 'qd06', kind: 'bunka', tags: ['rd10'], q: 'かがわの ひがしかがわしで にほんいち つくられて いるのは?', choices: ['てぶくろ', 'くつした', 'ぼうし'], answer: 0 },
    { id: 'qd07', kind: 'bunka', tags: ['rd11'], q: 'わかやまの きしゅうへらざおは なにで つくる?', choices: ['たけ', 'てつ', 'ガラス'], answer: 0 },

    /* --- しんの めいさん(かんとう) --- */
    { id: 'qsh01', kind: 'sozai', tags: ['m127', 'rs01'], q: 'れんこんに あなが あいて いるのは なぜ?', choices: ['どろの なかで いきを するため', 'むしが たべた あと', 'かざりの ため'], answer: 0 },
    { id: 'qsh02', kind: 'sozai', tags: ['m128', 'rs02'], q: 'あんこうが いちばん おいしい きせつは?', choices: ['ふゆ', 'なつ', 'はる'], answer: 0 },
    { id: 'qsh03', kind: 'sozai', tags: ['m129', 'rs03'], q: 'かんぴょうは なにから つくる?', choices: ['ゆうがおの み', 'かぼちゃの たね', 'きゅうりの かわ'], answer: 0 },
    { id: 'qsh04', kind: 'sozai', tags: ['m130', 'rs04'], q: 'にらは どんな やさい?', choices: ['ほそながい はっぱの やさい', 'まるい みの やさい', 'つちの なかの いも'], answer: 0 },
    { id: 'qsh05', kind: 'sozai', tags: ['m131', 'rs05'], q: 'しもにたねぎは にると どうなる?', choices: ['とろっと あまくなる', 'かたくなる', 'あおくなる'], answer: 0 },
    { id: 'qsh06', kind: 'sozai', tags: ['m132', 'rs06'], q: 'まいたけは どんな たべもの?', choices: ['きのこ', 'かいそう', 'くだもの'], answer: 0 },
    { id: 'qsh07', kind: 'sozai', tags: ['m133', 'rs07'], q: 'くわいを おしょうがつに たべるのは なぜ?', choices: ['「めが でる」えんぎものだから', 'あかい いろだから', 'ほしが つくから'], answer: 0 },
    { id: 'qsh08', kind: 'sozai', tags: ['m134', 'rs08'], q: 'さといもは どこに できる?', choices: ['つちの なか', 'きの うえ', 'うみの なか'], answer: 0 },
    { id: 'qsh09', kind: 'sozai', tags: ['m135', 'rs09'], q: 'あしたばの なまえの ゆらいは?', choices: ['あしたには あたらしい はが でるから', 'あしの かたちだから', 'あさに さくから'], answer: 0 },
    { id: 'qsh10', kind: 'sozai', tags: ['m136', 'rs10'], q: 'パッションフルーツの なかみは?', choices: ['つぶつぶの ゼリーみたい', 'ほくほくの いもみたい', 'ふわふわの パンみたい'], answer: 0 },
    { id: 'qsh11', kind: 'sozai', tags: ['m137', 'rs11'], q: 'きんめだいは どんな さかな?', choices: ['ふかい うみの まっかな さかな', 'かわの ちいさな さかな', 'みどりいろの さかな'], answer: 0 },
    { id: 'qsh12', kind: 'sozai', tags: ['m138', 'rs12'], q: 'なばなは いつの きせつの やさい?', choices: ['はる', 'ふゆ', 'なつ'], answer: 0 },
    { id: 'qsh13', kind: 'sozai', tags: ['m139', 'rs13'], q: 'みうらだいこんは どんな だいこん?', choices: ['ずっしり おおきくて あまい', 'ちいさくて からい', 'まっかな いろ'], answer: 0 },
    { id: 'qsh14', kind: 'sozai', tags: ['m140', 'rs14'], q: 'しょうなんゴールドは どんな くだもの?', choices: ['きいろい かんきつ', 'むらさきの ぶどう', 'あかい りんご'], answer: 0 },
  ],

  /* ---------- ちゅうもんの おれい(県ごとの かざり) ----------
     晴れた 県で ちゅうもんに こたえると、はじめの 1回で その県の かざりが もらえる。
     アイコンは 既存の かたちの つかいまわし(あたらしい 絵は いらない)。
     名まえは その県の おまつり・名物に ちなむ */
  kazari: [
    { id: 'k01', name: 'ゆきの けっしょうかざり', icon: 'snowflake:sky', pref: 'hokkaido' },
    { id: 'k02', name: 'ミニねぶたの あかり', icon: 'lantern:orange', pref: 'aomori' },
    { id: 'k03', name: 'てつびんの おまもり', icon: 'pot:dark', pref: 'iwate' },
    { id: 'k04', name: 'たなばたの ふきながし', icon: 'tassel:teal', pref: 'miyagi' },
    { id: 'k05', name: 'かんとうの ミニちょうちん', icon: 'lantern:amber', pref: 'akita' },
    { id: 'k06', name: 'はながさの はな', icon: 'flower:red', pref: 'yamagata' },
    { id: 'k07', name: 'あかべこの おきもの', icon: 'cow:red', pref: 'fukushima' },
    { id: 'k08', name: 'うめの かんざし', icon: 'sakura:pink', pref: 'ibaraki' },
    { id: 'k09', name: 'ましこやきの こざら', icon: 'plate:gray', pref: 'tochigi' },
    { id: 'k10', name: 'ミニだるま', icon: 'round:crimson', pref: 'gunma' },
    { id: 'k11', name: 'だしの ミニばた', icon: 'flag:crimson', pref: 'saitama' },
    { id: 'k12', name: 'はなびの おもいでカード', icon: 'star-night:navy', pref: 'chiba' },
    { id: 'k13', name: 'みこしの すず', icon: 'bell:gold', pref: 'tokyo' },
    { id: 'k14', name: 'ミニおふね', icon: 'boat:sky', pref: 'kanagawa' },
    { id: 'k15', name: 'チューリップの おしばな', icon: 'tulip:pink', pref: 'niigata' },
    { id: 'k16', name: 'あみがさの かざり', icon: 'fan:cream', pref: 'toyama' },
    { id: 'k17', name: 'きんぱくの こざら', icon: 'plate:gold', pref: 'ishikawa' },
    { id: 'k18', name: 'かにの おきもの', icon: 'crab:red', pref: 'fukui' },
    { id: 'k19', name: 'ふじさんの おきもの', icon: 'mountain:sky', pref: 'yamanashi' },
    { id: 'k20', name: 'おんばしらの きの おまもり', icon: 'log:brown', pref: 'nagano' },
    { id: 'k21', name: 'からくりの はぐるま', icon: 'gear:gray', pref: 'gifu' },
    { id: 'k22', name: 'ミニだこ', icon: 'kite:red', pref: 'shizuoka' },
    { id: 'k23', name: 'まきわらぶねの ちょうちん', icon: 'lantern:gold', pref: 'aichi' },
    { id: 'k24', name: 'しんじゅの たま', icon: 'pearl:white', pref: 'mie' },
    { id: 'k25', name: 'かぶきの くまどりの えふだ', icon: 'mask:red', pref: 'shiga' },
    { id: 'k26', name: 'ミニやまぼこ', icon: 'tower:crimson', pref: 'kyoto' },
    { id: 'k27', name: 'だんじりの ミニぐるま', icon: 'cart:brown', pref: 'osaka' },
    { id: 'k28', name: 'ふくの おまもり', icon: 'shrine:crimson', pref: 'hyogo' },
    { id: 'k29', name: 'こじかの おきもの', icon: 'deer:brown', pref: 'nara' },
    { id: 'k30', name: 'まいおうぎ', icon: 'fan:red', pref: 'wakayama' },
    { id: 'k31', name: 'すなの こびん', icon: 'jar:tan', pref: 'tottori' },
    { id: 'k32', name: 'かぐらの おめん', icon: 'mask:white', pref: 'shimane' },
    { id: 'k33', name: 'きびだんごの つつみ', icon: 'sweet:tan', pref: 'okayama' },
    { id: 'k34', name: 'かちまつりの しゃもじ', icon: 'ladle:brown', pref: 'hiroshima' },
    { id: 'k35', name: 'きんぎょちょうちんの ミニかざり', icon: 'lantern:red', pref: 'yamaguchi' },
    { id: 'k36', name: 'おどりの てぬぐい', icon: 'towel:sky', pref: 'tokushima' },
    { id: 'k37', name: 'まるがめうちわ', icon: 'fan:sky', pref: 'kagawa' },
    { id: 'k38', name: 'うしおにの おまもり', icon: 'horn:crimson', pref: 'ehime' },
    { id: 'k39', name: 'なるこ', icon: 'naruko:red', pref: 'kochi' },
    { id: 'k40', name: 'ミニやまかさ', icon: 'banner:gold', pref: 'fukuoka' },
    { id: 'k41', name: 'ミニバルーン', icon: 'balloon:red', pref: 'saga' },
    { id: 'k42', name: 'りゅうの ミニかざり', icon: 'dragon:green', pref: 'nagasaki' },
    { id: 'k43', name: 'かざりうまの ミニうま', icon: 'horse:brown', pref: 'kumamoto' },
    { id: 'k44', name: 'ゆけむりの おまもり', icon: 'hotspring:orange', pref: 'oita' },
    { id: 'k45', name: 'ひょっとこの おめん', icon: 'mask:amber', pref: 'miyazaki' },
    { id: 'k46', name: 'ミニとうろう', icon: 'lantern:violet', pref: 'kagoshima' },
    { id: 'k47', name: 'ハイビスカスの かみかざり', icon: 'hibiscus:red', pref: 'okinawa' },
  ],

  /* ---------- ちゅうもんの 称号(通算の とどけた 数) ---------- */
  orderTitles: [
    { count: 1, name: 'はいたつ みならい' },
    { count: 5, name: 'まちの はいたつやさん' },
    { count: 15, name: 'たびする はいたつやさん' },
    { count: 30, name: 'にっぽん はいたつめいじん' },
    { count: 47, name: 'でんせつの おとどけやさん' },
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

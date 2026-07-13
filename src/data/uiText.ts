/* ゲーム内テキスト集約(ひらがな中心・分かち書き)。シーン内にベタ書きしない */

export const TITLE_TEXT = 'めいさんクエスト';

export const UI_TEXT = {
  subtitle: 'にっぽん かいたく!',
  loading: 'じゅんびちゅう…',

  nav: { map: 'ちず', zukan: 'ずかん', inv: 'もちもの' },
  zukanCount: (got: number, total: number) => `ずかん ${got}/${total}`,

  map: {
    inactivePref: 'ここは じゅんびちゅう! おたのしみに🚧',
    aria: 'かんとうの ちず',
  },

  kaitaku: {
    modalTitle: 'あたらしい けん!',
    intro: (name: string) => `${name}けんを かいたく しよう!\nクイズに ちょうせんだ!`,
    challenge: 'ちょうせん する!',
    quizTitle: (name: string) => `${name}けん かいたく!`,
    successTitle: 'かいたく せいこう!',
    successBody: (name: string) => `${name}けん かいたく せいこう!`,
    successGuide: 'ちずに いろが ついたよ!\nたねを まいて、レシピを あつめよう!',
    goPref: (name: string) => `${name}けんに いく!`,
  },

  guide: {
    firstMap: 'くもの かかった けんを タップ! ぼうけんの はじまりだ!',
    plotReady: 'しゅうかくできる はたけが あるよ! みに いこう!',
    careChance: '⚡おせわチャンスが きてる! いそげ〜!',
    infraFull: 'ストックが まんたんの いどや たんぼが あるよ!',
    nextKaitaku: 'つぎの けんも かいたく できるよ! ちずを タップ!',
    tips: [
      '★3で しゅうかくすると、おまけが 1こ もらえるよ!',
      'レシピの ざいりょうは、よその けんに ある ことも…!',
      'まっている あいだに、ほかの けんを かいたく しよう!',
      'ずかんの さんちを コンプすると、いい ことが あるかも?',
    ],
  },

  pref: {
    sozaiHead: '🌱 そざい',
    recipeHead: '📜 レシピ',
    back: '← ちず',
    progress: (got: number, total: number) => `📖 ${got}/${total}`,
    infraAlways: 'いつでも',
    stock: (st: number, max: number) => `ストック ${st}/${max}`,
    stockFull: '・まんたん!',
    stockNext: (wait: string) => `・つぎまで ${wait}`,
    notYet: 'まだ たまっていないよ…',
    fieldName: (name: string, fieldLabel = 'はたけ') => `${name}の ${fieldLabel}`,
    notObtained: 'まだ てにいれていない',
    bestStars: (stars: string) => `さいこう ${stars}`,
    growing: (wait: string) => `そだちちゅう… あと ${wait}`,
    growingBtn: 'そだちちゅう',
    growingToast: 'すくすく そだってるよ🌱 まってる あいだに ほかの ぼうけんを しよう!',
    careBtn: 'おせわに いく!',
    ready: 'たべごろ! しゅうかくの ときだ!',
    harvestBtn: 'しゅうかく!',
    planted: (emoji: string, name: string) => `${emoji} ${name}を うえた! そだつまで ほかの ぼうけんを しよう🌱`,
    collected: (emoji: string, name: string, n: number) => `${emoji} ${name} ×${n} かいしゅう!`,
    soonWait: 'まもなく!',
    minutesWait: (min: number) => `やく${min}ふん`,
  },

  recipe: {
    unknownName: '？？？',
    sleeping: (tier: string) => `${tier}の レシピが ねむっている…`,
    searchBtn: 'レシピを さがす',
    searchTitle: 'レシピを さがす',
    searchGuide: 'ものしりクイズに こたえて\nレシピを てにいれよう!',
    searchChallenge: 'クイズに ちょうせん!',
    searchQuizTitle: 'レシピを さがせ!',
    getTitle: 'レシピ ゲット!',
    found: (name: string) => `レシピ はっけん!\n「${name}」`,
    ingredients: (list: string) => `ざいりょう: ${list}`,
    yay: 'やったー!',
    craftBtn: 'つくる',
    notEnough: 'そざいが たりないみたい…',
    jimotoChip: '🥇じもと',
    originChip: (name: string) => `${name}さん`,
    star3Chip: '★3',
  },

  craft: {
    confirmTitle: 'つくる',
    confirm: (name: string) => `「${name}」を つくる?`,
    doIt: 'つくる!',
    doneTitle: 'かんせい!',
    done: (name: string) => `「${name}」かんせい!`,
    jimotoBanner: '🥇 ぜんぶ じもとの そざい! じもとメダル ゲット!',
  },

  fest: {
    preparing: 'じゅんびちゅう… アップデートで あそべるように なるよ!',
    held: '🏮 かいさいずみ!',
    heldSub: (name: string) => `${name}けん、だいにぎわい!`,
    openBtn: 'ひらく!',
    needMeibutsu: 'めいぶつを そろえよう!',
    introBody: 'おまつりの じゅんびを しよう!\nただしい じゅんばんに タップしてね!',
    startBtn: 'じゅんびスタート!',
    puzzleTitle: 'じゅんび だんどりパズル',
    puzzleGuide: '1ばんめから じゅんばんに おしてね!',
    wrongOrder: 'あれれ? じゅんばんが ちがうみたい',
    doneTitle: '🎉 おまつり かいさい! 🎉',
    doneBody: (name: string) => `${name} かいさい!`,
    doneGuide: (pref: string) => `${pref}けんが おおにぎわい!\nちずを みてみよう!`,
    goMap: 'ちずを みる!',
  },

  session: {
    instantTitle: (emoji: string, name: string, verb: string) => `${emoji} ${name}を ${verb}`,
    harvestTitle: (emoji: string, name: string) => `${emoji} ${name}の しゅうかく!`,
    careTitle: '⚡ おせわチャンス!',
    back: '← もどる',
    quizSign: '💡 ものしりクイズ! せいかいで スコアボーナス!',
    careDoneToast: 'おせわ ばっちり! しゅうかくの とき スコアボーナス!',
    resultTitle: 'できた!',
    harvestSuccess: 'しゅうかく せいこう!',
    scoreLine: (n: number) => `スコア: ${n}`,
    gotItems: (name: string, n: number) => `${name} ×${n} を てにいれた!`,
    star3Note: '✨さいこうの できばえ! おまけ つき!',
    star2Note: 'なかなかの できばえ!',
    star1Note: 'つぎは もっと じょうずに できるかも!',
    backBtn: 'もどる',
    sanchiComp: (name: string) => `🗾 ${name}の さんちコンプ! すごい!`,
  },

  arcade: {
    score: (n: number) => `スコア ${n}`,
    combo: (c: number, mult: number) => `${c}コンボ ×${mult}!`,
    timeUp: 'おわり〜!',
    wave: (n: number) => `ウェーブ ${n}!`,
    miss: 'あちゃ!',
    escaped: 'にげられた!',
    again: 'もういっかい!',
    center: 'どまんなか!',
    stopped: 'とまった…',
    timeBonus: (n: number) => `タイムボーナス +${n}!`,
    careResult: (bopped: number, leaked: number) => `おいはらった: ${bopped}ひき\nたべられた: ${leaked}かい`,
  },

  quiz: {
    progress: (i: number, n: number) => `もんだい ${i} / ${n}`,
    answerIs: (ans: string) => `こたえは「${ans}」だよ!`,
  },

  trivia: {
    modalTitle: 'あたらしい はっけん!',
    found: 'ものしりカードを みつけたよ!',
    head: '📖 ものしりカード',
    register: 'ずかんに とうろく!',
  },

  zukan: {
    tabs: { mat: 'そざい', t2: 'さんぶつ', t3: 'めいぶつ', t4: 'でんとう' },
    unknown: '？？？',
    comp: '🗾さんちコンプ!',
    jimoto: '🥇じもと',
  },

  inv: {
    empty: 'まだ なにも もっていないよ。\nけんに いって そざいを そだてよう!',
  },

  settings: {
    title: 'せってい',
    version: (v: string) => `めいさんクエスト(かり) v${v}\nデータは この たんまつの なかにだけ ほぞんされます。`,
    boostBtn: '⏩ かんりしゃ: せいちょう&ストックを まんたんに',
    boosted: '⏩ ぜんぶ まんたんに した(かんりしゃ)',
    resetBtn: 'データを リセットする(おうちのひと よう)',
    parentGate: (a: number, b: number) => `おうちのひとに かくにん: ${a} + ${b} = ?`,
    resetConfirm: 'ほんとうに さいしょから はじめますか?',
    resetDone: 'リセットしました',
    wrongAnswer: 'こたえが ちがうみたい',
    close: 'とじる',
  },
} as const;

/* ゲーム内テキスト集約(ひらがな中心・分かち書き)。シーン内にベタ書きしない */

export const TITLE_TEXT = 'はれはれクエスト';

export const UI_TEXT = {
  subtitle: 'にっぽん かいたく!',
  loading: 'じゅんびちゅう…',

  nav: { map: 'ちず', zukan: 'ずかん', inv: 'もちもの' },
  zukanCount: (got: number, total: number) => `ずかん ${got}/${total}`,

  story: {
    skip: 'スキップ',
    tap: 'タップで つぎへ',
    start: 'ぼうけんに しゅっぱつ!',
    slides: [
      'ある あさ、ふしぎな「もやもやぐも」が\nにっぽんじゅうを つつんで しまった…',
      'くもの したでは、まちの めいさんや おまつりが\nすこしずつ わすれられて いく…',
      'ものしりはかせは、たんけんヒヨコの ぴっけと きみに\nたいせつな「めいさんずかん」を たくした!',
      'そざいを そだてて めいさんを つくり、\nおまつりの あかりで くもを はらおう!',
    ],
    /** エンディング(47県 ぜんぶ 晴れた とき)。みじかく、余韻は 絵に まかせる */
    endingSlides: [
      'さいごの もやもやぐもが とんでいった!\nにっぽんじゅうが まぶしい あさに つつまれた!',
      'どの まちにも おまつりの あかりが ともって、\nみんなの めいさんが かがやいて いる。',
      'ほっほう…きみは でんせつの かいたくだんちょう じゃ!\nでも ずかんには まだ あいた ページが あるのう…',
    ],
    endingStart: 'これからも ぼうけんを つづける!',
    /** せっていの 「おもいで」から もういちど 見る とき の なまえ */
    introTitle: 'はじまりの おはなし',
    endingTitle: 'はれの おいわい',
  },

  /** 県が 晴れた とき(地図の シネマ)と はれメーター */
  hare: {
    line: (prefTitle: string) => `はれた〜! ${prefTitle}の みんなが\nおまつりを おもいだしたよ!`,
    meter: (n: number, total: number) => `はれた けん ${n}/${total}`,
  },

  map: {
    inactivePref: 'ここは まだ くもの なか。ぼうけんが すすむと はれるよ!',
    japanBtn: 'にっぽん',
    /** 地図の 上に 出す「いま どこの エリアか」の 帯 */
    nowRegion: (name: string) => `${name} エリア`,
  },

  region: {
    title: 'にっぽん ぜんこく',
    back: 'ちずへ もどる',
    guide: 'にっぽんは 7つの エリアに わかれているよ。\nまずは かんとうから ぼうけんだ!',
    lockedToast: 'ここは まだ もやもやぐもの なか! まずは かんとうの くもを はらおう!',
    preparing: 'くもの なか',
    prog: (got: number, total: number) => `かいたく ${got}/${total}`,
    festCount: (n: number) => `おまつり×${n}`,
    go: 'いってみよう!',
    unlockHint: (need: number, have: number) =>
      `おまつりを ${need}かい ひらくと くもが はれるよ!(いま ${have}かい)`,
    almostOpen: (need: number) => `おまつり×${need}で はれる!`,
    /** あたらしい エリアが ひらいた ときの おしらせ(1エリア 1回だけ) */
    openTitle: 'くもの すきまが ひらいた!',
    openBody: (name: string) => `${name}が みえてきた!\nあたらしい けんと おまつりが まっているよ!`,
    openGo: 'いってみよう!',
    /** エリアの 全県が 晴れた とき、はかせが くれる バッジ */
    compTitle: 'ちほうバッジ ゲット!',
    compBody: (name: string) =>
      `ほっほう! ${name}の そらは もう まっさお じゃ!\n「${name}バッジ」を さずけよう!`,
    compClose: 'やったー!',
  },

  kaitaku: {
    modalTitle: 'あたらしい ばしょ!',
    intro: 'くもの むこうに あたらしい まちが みえるよ。\nどこか わかるかな?',
    challenge: 'ちょうせん する!',
    quizTitle: 'ここは どこ?',
    failTitle: 'かいたく しっぱい…',
    failGuide: 'くもは はれなかった…。\nこたえを おぼえて、もういちど ちょうせんだ!',
    retry: 'もういちど ちょうせん!',
    successTitle: 'かいたく せいこう!',
    successBody: (title: string) => `${title} かいたく せいこう!`,
    successGuide: 'もやもやぐもが すこし うすくなった!\nおまつりを ひらくと、すっきり はれるよ!',
    goPref: (title: string) => `${title}に いく!`,
  },

  guide: {
    firstMap: 'くもの かかった ところを タップ! ぼうけんの はじまりだ!',
    plotReady: 'しゅうかくできる はたけが あるよ! みに いこう!',
    careChance: 'おせわチャンスが きてる! いそげ〜!',
    infraFull: 'ストックが まんたんの いどや たんぼが あるよ!',
    nextKaitaku: 'つぎの けんも かいたく できるよ! ちずを タップ!',
    tips: [
      'ほし3つで しゅうかくすると、おまけが 1こ もらえるよ!',
      'レシピの ざいりょうは、よその けんに ある ことも…!',
      'まっている あいだに、ほかの けんを かいたく しよう!',
      'ずかんの さんちを コンプすると、いい ことが あるかも?',
    ],
  },

  pref: {
    /** 県ページの うえに つねに 出す 「いま やること」。core/nextTask.ts の 種類ごとに 1行 */
    task: {
      care: (name: string) => `${name}の おせわチャンス! いそげ〜!`,
      harvest: (name: string) => `${name}が しゅうかくできるよ!`,
      infraFull: (name: string) => `${name}が まんたん! かいしゅうしよう!`,
      festival: (name: string) => `「${name}」が ひらけるよ! おまつりだ!`,
      craft: (name: string) => `「${name}」が つくれるよ!`,
      findRecipe: 'レシピを さがして みよう!',
      plant: (name: string) => `まずは ${name}を うえてみよう!`,
      growing: 'そだつまで ほかの けんへ いってみよう!',
      done: 'この けんは バッチリ! ほかの けんへ いってみよう!',
    },
    /** はじめて けんに ついた ときの 3コマ */
    firstGuide: {
      title: 'この まちで やること',
      steps: [
        'まずは そざいを そだてよう!\nたねを まく、すこし まつ、そして しゅうかく!',
        'そざいが そろったら めいぶつを つくろう!\nレシピを さがして、つくる!',
        'めいぶつが できたら おまつりだ!\nおまつりを ひらくと もやもやぐもが はれるよ!',
      ],
      wait: 'そだつのを まっている あいだは、\nほかの けんへ いくのが おすすめ!',
      next: 'つぎへ',
      start: 'やってみる!',
    },
    sozaiHead: 'そざい',
    recipeHead: 'レシピ',
    back: 'ちずへ',
    progress: (got: number, total: number) => `ずかん ${got}/${total}`,
    infraAlways: 'いつでも',
    stock: (st: number, max: number) => `ストック ${st}/${max}`,
    stockFull: '・まんたん!',
    stockNext: (wait: string) => `・つぎまで ${wait}`,
    notYet: 'まだ たまっていないよ…',
    /** 「そざいの ばしょ」の 見だし。ばしょの 名まえに そざいの 名まえが 入っている ときは
        かさねない(「かきの かきの いかだ」に なって しまっていた) */
    fieldName: (name: string, fieldLabel = 'はたけ') =>
      fieldLabel.includes(name) ? fieldLabel : `${name}の ${fieldLabel}`,
    notObtained: 'まだ てにいれていない',
    bestStars: (stars: string) => `さいこう ${stars}`,
    growing: (wait: string) => `そだちちゅう… あと ${wait}`,
    growingBtn: 'そだちちゅう',
    growingToast: 'すくすく そだってるよ! まってる あいだに ほかの ぼうけんを しよう!',
    careBtn: 'おせわに いく!',
    ready: 'たべごろ! しゅうかくの ときだ!',
    harvestBtn: 'しゅうかく!',
    planted: (_emoji: string, name: string) => `${name}を うえた! そだつまで ほかの ぼうけんを しよう!`,
    collected: (_emoji: string, name: string, n: number) => `${name} ×${n} かいしゅう!`,
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
    jimotoChip: 'じもと',
    originChip: (name: string) => `${name}さん`,
    star3Chip: 'ほし3',
    craftedChip: 'つくった!',
    /** この県で とれない ざいりょうの 行き先。とれる 県が いくつも あれば「ほか」 */
    whereChip: (pref: string, count: number) => (count > 1 ? `〈${pref}ほか〉` : `〈${pref}〉`),
  },

  /** どうぐ(各地の 工芸で 作る。docs/DOUGU_SHIN_PLAN.md) */
  dougu: {
    /** レシピカードの たぐい札(TIER_LABEL の かわり) */
    tier: 'どうぐ',
    /** 作った ときの せつめい */
    done: (name: string) => `「${name}」を てに いれた!\nこの あそびの じかんが すこし のびるよ!`,
    /** アーケードHUDの しるし */
    hudLv: (lv: number) => `どうぐ Lv${lv}`,
    /** もちものの どうぐ欄 */
    invHead: 'どうぐ',
    lvChip: (lv: number) => `Lv${lv}`,
    /** まだ 作って いない どうぐの 案内(どこで 作れるか) */
    craftAt: (pref: string) => `${pref}で つくれるよ`,
    /** ふつうの どうぐ(Lv1)の 名まえ */
    basicName: 'ふつうの どうぐ',
    /** きわみ(Lv3)レシピが まだ ねむって いる カード */
    lv3Sleeping: (n: number) => `つかいこむと めを さます…(あと ${n}かい)`,
  },

  /** しんの めいさん(第2章)と 季節 */
  shin: {
    /** 県ページの 見出し。いまの 季節も そえる */
    head: (season: string) => `しんの めいさん 〜いまは ${season}〜`,
    /** そざいの 名まえに そえる 札 */
    chip: 'しん',
    /** 季節外れの あんない(そだてはじめられない) */
    seasonWait: (season: string) => `${season}に なったら とれるよ`,
    /** ずかんの 旬マーク */
    seasonChip: (season: string) => `しゅん: ${season}`,
  },

  /** ちゅうもん(晴れた 県の まちの ひとの おねがい。core/orders.ts) */
  order: {
    head: 'ちゅうもん',
    /** カードの 題字(たのむ ひとの ことば) */
    ask: (item: string, count: number) => `${item}を ${count}こ ほしいなあ!`,
    /** ここでは とれない ことの そえがき */
    note: 'この まちでは てに はいらない みたい',
    deliverBtn: 'とどける!',
    collectingBtn: 'あつめちゅう',
    notEnough: 'まだ たりないみたい。よその けんで あつめて こよう!',
    thanksTitle: 'ありがとう!',
    thanks: (item: string) => `${item}を とどけた!\nまちの ひとは おおよろこび!`,
    kazariGet: (name: string) => `おれいに 「${name}」を もらった!`,
    titleGet: (name: string) => `しょうごう 「${name}」に なった!`,
    totalLine: (n: number) => `とどけた かず: ${n}`,
  },

  craft: {
    confirmTitle: 'つくる',
    confirm: (name: string) => `「${name}」を つくる?`,
    doIt: 'つくる!',
    doneTitle: 'かんせい!',
    done: (name: string) => `「${name}」かんせい!`,
    jimotoBanner: 'ぜんぶ じもとの そざい! じもとメダル ゲット!',
  },

  /** あそびかた(ゆびマーク・「?」ボタン・ずかんの あそびかた) */
  howto: {
    /** ゲーム中の 「?」を おした ときの みだし */
    title: 'あそびかた',
    /** 説明を 読みおわった ときの ボタン */
    gotIt: 'わかった!',
    /** ずかんの タブ名 */
    tab: 'あそびかた',
    /** まだ あそんでいない ゲーム(ネタバレを しない) */
    locked: '？？？',
    lockedNote: 'まだ あそんでいないよ',
    /** ずかんの あそびかたの ならびが 空の とき */
    empty: 'ゲームを あそぶと ここに あそびかたが ならぶよ!',
    /** 見本の 中の 案内 */
    demoNote: 'ゆびの うごきを まねしてみよう!',
    /** しゅうかくゲームの 名まえと あそびかた(おまつりは レシピの 名まえと
        fest.intro… を つかうので ここには 書かない) */
    harvest: {
      mine: { name: 'すいりで ほる', intro: 'すうじは 「まわりに いくつ あるか」の ヒント!\nあんぜんな マスを えらんで ほりすすもう!' },
      catch: { name: 'かごで うける', intro: 'かごを よこに うごかして、\nおちてくる みを うけとめよう!\nえだは よけてね!' },
      chain: { name: 'つなげて つむ', intro: 'うれた みを つづけて タップ!\nつなげると どんどん てんが ふえるよ!' },
      reap: { name: 'いねを かる', intro: 'いねの うえを ゆびで なぞって かろう!\nひとふりで たくさん かると おおきい てん!' },
      pluck: { name: 'つみとる', intro: 'みを つかんで そっと したに ひっぱろう!\nいそぐと ちぎれちゃうよ。' },
      rhythm: { name: 'リズムで つむ', intro: 'ながれてきた はっぱが わくに かさなった\nしゅんかんに タップ!' },
      sweep: { name: 'ゆきを はらう', intro: 'ゆきの うえを なぞって はらおう!\nしたから やさいが でてきたら タップ!' },
      scoop: { name: 'すくいとる', intro: 'ざるを よこに うごかして あつめ、\nタップで すくいあげよう!' },
      shell: { name: 'かいを むく', intro: 'ロープを つかんで うえに ひきあげよう!\nあがったら かいを タップして むく!' },
      flick: { name: 'はじいて とばす', intro: 'したから うえへ さっと はじいて、\nかごに いれよう!' },
      fish: { name: 'つりあげる', intro: 'うきが しずんだ しゅんかんに タップ!\nはやすぎても おそすぎても にげちゃう。' },
      care: { name: 'むしを まもる', intro: 'やってきた むしを タップして\nそざいを まもろう!' },
    },
  },

  fest: {
    preparing: 'まだ くもの むこう… ぼうけんが すすむと ひらくよ!',
    held: 'かいさいずみ',
    openBtn: 'ひらく!',
    againBtn: 'もういちど!',
    needMeibutsu: 'めいぶつを そろえよう!',
    introBody: 'めいぶつを もちよって、おまつりを ひらこう!\nやたいに おきゃくさんが やってくるよ。\nふきだしの しなものを わたして あげてね!',
    startBtn: 'おまつり スタート!',
    prompt: 'ふきだしを みて、おなじ しなものの やたいを タップ!',
    wrongItem: 'それじゃ ないみたい…',
    quick: 'はやわざ!',
    vipCome: 'とくべつな おきゃくさん!',
    finale: 'フィナーレ!',
    sadLeave: 'かえっちゃった…',
    introDaruma: 'だるまいちの はじまり!\nゆれる だるまを タップで おとして、\nたかーく つみあげよう!',
    introHanabi: 'みなとの よぞらに はなびを あげよう!\nわっかの なかで タップすると\nおおきく さくよ!',
    introDashi: 'かわごえまつりの はじまり!\nみんなで つなを ひいて、\nりっぱな だしを うごかそう!',
    introMikoshi: 'かんだまつりの はじまり!\nみこしが かたむかないように\nバランスを とって すすもう!',
    introRokuro: 'とうきいちの はじまり!\nろくろで うつわを かたちづくって、\nかまで やきあげよう!',
    introNebuta:
      'よるの まちを ひかる ねぶたが すすむよ。\nわっかが かさなった しゅんかんに タップして、\n「ラッセラー!」と はねよう!',
    introSansa: 'たいこの ねが ひびく さんさおどり!\nながれてくる まるに あわせて、\nひだりと みぎの たいこを たたこう!',
    introTanabata:
      'まちいっぱいの たなばたかざり!\nひかっている ところに おなじ いろの かざりを\nドラッグして つるしていこう!',
    introKantou:
      'ちょうちんを いっぱい つけた ながい さお。\nたおれないように てを うごかして ささえよう!\nながく ささえると さおが たかくなるよ!',
    introHanagasa:
      'はなの かさを くるくる まわして おどろう!\nやじるしの むきに ゆびを まわしてね。\nときどき むきが かわるよ!',
    introYukimatsuri:
      'ゆきと こおりの おまつり!\nかたの まわりの ゆきを けずって、\nおおきな ゆきぞうを かんせいさせよう!',
    introWaraji:
      'にほんいちの おおわらじを みんなで かつぐよ!\nひだり・みぎ・こうごに タップして\nリズムよく すすもう!',
    introMinyou:
      'まちじゅうが おなじ おどりで ながれていく!\nでてくる ふりの じゅんばんを おぼえて、\nおなじ ように タップしよう!',
    introOwara:
      'こきゅうの しずかな ねいろで おどる よまつり。\nひかる わくの なかに てを おいたまま、\nそっと ながく キープしよう!',
    introTourou:
      'かわに とうろうを ながす ぎょうじ。\nそっと ドラッグして てを はなすと ながれていくよ。\nはやすぎると たおれちゃう!',
    introKani:
      'とれたての かにを ほぐそう!\nひかった ところを タップして からを わり、\nみを とりだして おさらに もりつけよう!',
    introHimatsuri:
      'おおきな たいまつに ひを つけて まちを てらす おまつり!\nひを もった てを ドラッグして、つぎの たいまつへ。\nかぜで きえないように いそいで!',
    introOnbashira:
      'やまから きった おおきな きを、\nさかから すべりおろすよ!\nかたむいたら はんたいがわを タップして たてなおそう!',
    introKarakuri:
      'やたいの うえの からくりにんぎょう。\nひかった いとを じゅんばんに ひいて、\nにんぎょうに げいを させよう!',
    introTako:
      'おおきな たこを あげて、あいての いとと からめる!\nいとの はりを ちょうどよく たもって、\nたかく あげよう!',
    introMakiwara:
      'ふねに ちょうちんを はんえんに かざる よいまつり。\nひかった ばしょを タップして、\nちょうちんを つけていこう!',
    introSousen: 'みなとまつりの はじまり!\nふねを あやつって みなとを パレード!\nはたの ゲートを くぐろう!',
    darumaPrompt: 'タップで だるまを おとす! まんなかに のせると ぴったりボーナス!',
    hanabiPrompt: 'はなびだまが わっかに はいったら タップ! ジャストで おおきな はなび!',
    dashiPrompt: 'めもりが まんなかに きたら タップ! つなを ひいて だしを すすめよう!',
    mikoshiPrompt: 'かたむいたら はんたいがわを おして バランス! みこしを おとさず すすもう!',
    rokuroPrompt: 'ひかる おびを ゆびで おさえて かたちづくり! さいごは いい ひかげんで タップ!',
    sousenPrompt: 'ゆびで ふねを うごかして はたの あいだを くぐろう! ブイに ぶつからないでね!',
    minyouPrompt: 'でてきた ふりの じゅんばんを おぼえて、おなじ ように タップしよう!',
    owaraPrompt: 'ひかる わくの なかに てを おいたまま、そっと ながく キープしよう!',
    tourouPrompt: 'とうろうを そっと ドラッグして、かわに ながそう! はやすぎると たおれるよ',
    kaniPrompt: 'ひかった ところを タップして からを わり、みを とりだそう!',
    himatsuriPrompt: 'ひを もった てを ドラッグして、つぎの たいまつに ひを つけよう!',
    onbashiraPrompt: 'かたむいたら はんたいがわを タップ! おおきな きで さかを すべりおりよう',
    karakuriPrompt: 'ひかった いとを じゅんばんに ひいて、にんぎょうに げいを させよう!',
    takoPrompt: 'いとの はりを ちょうどよく たもって、たこを たかく あげよう!',
    makiwaraPrompt: 'ひかった ばしょを タップして、ふねに ちょうちんを かざろう!',

    /* --- きんき7県(2026-07 追加) --- */
    introIshidori:
      '「にほんいち やかましい」と いわれる よまつり。\nひかった かねと たいこを たたきわけよう!\nふたつ ひかったら りょうほう たたくんだ!',
    ishidoriPrompt: 'ひかった かねと たいこを たたきわけよう! ふたつ ひかったら りょうほう たたく!',
    ishidoriKane: 'かね',
    ishidoriTaiko: 'たいこ',
    ishidoriMiss: 'おとが ずれた!',
    ishidoriBoth: 'そろった! かね と たいこ!',
    ishidoriFinale: 'いちばん! (2ばい)',
    introKabuki:
      'ひきやまの ぶたいで する こども かぶき。\nせりふが ながれて わくに きたら タップ!\nちょうどで キメると「みえ」が きまるよ!',
    kabukiPrompt: 'せりふが わくに きたら タップ! ちょうどで キメると みえが きまる!',
    kabukiHere: 'ここで キメる',
    kabukiPerfect: 'みえが きまった!',
    kabukiOk: 'まあまあ!',
    kabukiEarly: 'タイミングが ずれた!',
    kabukiShow: 'みせばだ! 3れんぞく!',
    kabukiShowDone: 'みせば かんぺき!',
    introGion:
      'おおきな やまほこは かどを まがれない。\nだから たけを しいて、みんなで ぐるっと まわす!\nたけを タップして しいたら、ゆっくり ドラッグで まわそう!',
    gionPrompt: 'たけを タップして しこう! そのあと やまほこを ゆっくり ぐるっと まわす!',
    gionCorner: (n: number) => `${n}つめの かど`,
    gionReady: 'たけが しけた! まわそう!',
    gionTurnNow: 'ゆっくり ぐるっと!',
    gionSlip: 'はやすぎて たけが すべった!',
    gionDone: 'つじまわし せいこう!',
    gionClean: 'いちども すべらず! きれい!',
    introDanjiri:
      'だんじりは とまらない!\nはしりながら かどを かくっと まわす「やりまわし」。\nめもりが みどりの ゾーンに きたら タップ!',
    danjiriPrompt: 'めもりが みどりの ゾーンに きたら タップ! きいろは ぴったり!',
    danjiriSpeed: (pct: number, turns: number) => `スピード ${pct}%  /  まわった かず ${turns}`,
    danjiriPerfect: 'やりまわし ぴったり!',
    danjiriOk: 'まわれた!',
    danjiriWide: 'ふくらんだ〜!',
    danjiriDash: 'そうこう! (2ばい)',
    introFukuotoko:
      'もんが ひらいたら ほんでんまで かけっこ!\nタップを れんだして はしろう。\nいしや ひとが きたら、うえに スワイプで とび、\nよこに スワイプで かわすんだ!',
    fukuotokoPrompt: 'タップれんだで はしる! いしは うえスワイプで とび、ひとは よこスワイプで かわす!',
    fukuotokoMeter: (m: number, total: number, goals: number) => `${m}m / ${total}m   ゴール ${goals}かい`,
    fukuotokoJump: 'とんだ!',
    fukuotokoSide: 'かわした!',
    fukuotokoFall: 'ころんじゃった…',
    fukuotokoGoal: 'いちばん! ふくおとこだ!',
    introYamayaki:
      'やまの かれくさに ひを つけて もやす ぎょうじ。\nまず たいまつを タップして ひつけ。\nそのあと ひの となりを なぞって もえひろげよう!\n(みどりの きは もやさないでね)',
    yamayakiPrompt: 'たいまつを タップして ひつけ! そのあと ひの となりを なぞって もえひろげよう',
    yamayakiLight: 'たいまつを タップ!',
    yamayakiGuide: 'ひの となりを なぞろう',
    yamayakiRow: 'よこ1れつ もえた!',
    yamayakiAll: 'やまぜんぶ もえた!',
    yamayakiStop: 'きは もやさない!',
    introOugi:
      'おおたいまつで おうぎみこしを むかえる ひの まつり。\nたいまつを うえしたに ふって ひを おおきく!\nとんでくる ひのこは タップで はらってね!',
    ougiPrompt: 'たいまつを うえしたに ふって ひを おおきく! ひのこは タップで はらう!',
    ougiFlame: (pct: number, greeted: number) => `ひの おおきさ ${pct}%  /  おむかえ ${greeted}かい`,
    ougiGreet: 'おうぎみこしを おむかえ!',
    ougiSpark: 'はらった!',
    ougiBurn: 'ひのこが ついた!',
    /* --- ちゅうごく・しこく9県(2026-07 追加) --- */
    introShanshan:
      'すずの ついた かさで おどる まつり。\nあいずを みて、かさを ひらいたり とじたり!\n「そのまま」の ときは なにも しないのが せいかい!',
    shanshanPrompt: 'あいずのとおりに タップで かさを ひらく/とじる! 「そのまま」は タップしない!',
    shanshanCueOpen: 'シャン! で ひらく',
    shanshanCueClose: 'シャシャン! で とじる',
    shanshanCueKeep: 'そのまま!',
    shanshanRing: 'しゃんしゃん!',
    shanshanKeepOk: 'そのままで せいかい!',
    shanshanWrong: 'あいずと ちがう!',
    shanshanLate: 'まにあわなかった!',
    shanshanStreak: (n: number) => `${n}れんぞく そろった!`,
    introKagura:
      'かぐらの ぶたいに やまたのおろちが あらわれた!\nあたまの そばの やじるしを みて、\nその むきに スワイプして つるぎを ふろう!',
    kaguraPrompt: 'やじるしの むきに スワイプして つるぎを ふろう! 8つの あたまを たいじ!',
    kaguraCut: 'たいじ!',
    kaguraDodge: 'かわされた!',
    kaguraAll: 'やまたのおろち たいじ かんりょう!',
    introEyou:
      'まよなかの おどうに「しんぎ」が なげこまれる!\nひかりの すじの したを タップして うけとって、\nおされる むきの はんたいに スワイプして ふんばろう!',
    eyouPrompt: 'おちてくる しんぎを タップで うけとる! おされたら はんたいがわに スワイプ!',
    eyouCatchHint: 'ひかりの したを タップ!',
    eyouCatch: 'しんぎを うけとった!',
    eyouLost: 'とられちゃった!',
    eyouPushLeft: 'ひだりから おされる! みぎに スワイプ!',
    eyouPushRight: 'みぎから おされる! ひだりに スワイプ!',
    eyouHold: 'ふんばった!',
    eyouWrong: 'むきが ちがう!',
    eyouDrop: 'しんぎを はなしちゃった!',
    eyouGoal: 'もんまで はこんだ! ふくおとこ!',
    eyouHoldInfo: (h: number, total: number, carried: number) => `ふんばり ${h}/${total}   はこんだ ${carried}かい`,
    introBetcha:
      'おにが ささらで こどもを つくと、\n1ねん びょうきを しないと いわれる まつり。\nにげる こどもを タップして つかまえよう!',
    betchaPrompt: 'にげる こどもを タップして つかまえよう! ちかづくと はやく にげるよ',
    betchaTouch: 'ごりやく!',
    betchaAll: (n: number) => `ぜんいん ごりやく! ${n}くみめ!`,
    introKingyo:
      'たけの わくに わしを はって きんぎょちょうちんを つくるよ。\nおびの なかを ゆびで なぞって のりを つけよう。\nはみでると しわに なるから ゆっくりね!',
    kingyoPrompt: 'おびの なかを なぞって のりを つけよう! はみでると しわに なるよ',
    kingyoDone: 'きんぎょちょうちん かんせい!',
    kingyoOut: 'はみでて しわに なった!',
    introAwaodori:
      '「えらいやっちゃ」の 2びょうしで まちを ながれる おどり。\nながれてくる しるしを みて、\nてのマークは タップ、あしのマークは うえに スワイプ!',
    awaodoriPrompt: 'てのマークは タップ、あしのマークは うえスワイプ! わくに きた しゅんかんに うちわけよう!',
    awaodoriHow: 'て= タップ  /  あし= うえに スワイプ',
    awaodoriOk: 'よし!',
    awaodoriEraiya: 'えらいやっちゃ!',
    awaodoriMiss: 'タイミングが ずれた!',
    awaodoriNeedHand: 'そこは て! タップ!',
    awaodoriNeedFoot: 'そこは あし! うえスワイプ!',
    awaodoriZomeki: 'ぞめきタイム! (2ばい)',
    introChousa:
      'おおきな たいこだいを 4すみの かたで かつぎあげる!\nちからが さがった かたを タップして もどそう。\n4つ ぜんぶ たかいまま そろえると「さしあげ」だ!',
    chousaPrompt: 'ちからが さがった かたを タップ! 4つ そろえて さしあげ!',
    chousaReady: 'そろった! そのまま!',
    chousaLift: 'さしあげ せいこう!',
    chousaTilt: 'かたむいた!',
    chousaInfo: (lifts: number) => `さしあげ ${lifts}かい`,
    introUshioni:
      'ながい くびの うしおにが まちを ねりあるく!\nあたまを ドラッグして のばして、\nひかっている いえの もんに いれて おはらいしよう!',
    ushioniPrompt: 'あたまを ドラッグして のばし、ひかる いえに いれて おはらい!',
    ushioniOharai: 'おはらい!',
    ushioniWrong: 'そこじゃ ないよ!',
    ushioniLimit: 'くびが のびきった!',
    ushioniAll: 'まちぜんぶ おはらい!',
    introYosakoi:
      'なるこは「カチッ カチッ」と 2つ ならすのが きほん。\nわっかが ひかったら すばやく 2かい タップ!\n「よっちょれ!」の ときは 3かいだよ!',
    yosakoiPrompt: 'わっかが ひかったら 2かい タップ! 「よっちょれ!」は 3かい!',
    yosakoiCue2: 'カチッ カチッ (2かい)',
    yosakoiCue3: 'よっちょれ! (3かい)',
    yosakoiOk: 'そろった!',
    yosakoiYocchore: 'よっちょれ! ばっちり!',
    yosakoiFew: 'かずが たりない!',
    yosakoiMany: 'たたきすぎ!',
    /* --- きゅうしゅう・おきなわ8県(2026-07 追加) --- */
    introYamakasa:
      '1トンちかい かきやまを かついで まちを はしる!\nタップれんだで すすもう。\nちからが へった かつぎては あかく なるから、\nつぎの かつぎてを タップして こうたい!',
    yamakasaPrompt: 'タップれんだで はしる! ちからが へったら つぎの かつぎてを タップして こうたい!',
    yamakasaSwap: 'こうたい!',
    yamakasaLow: 'つかれてきた!',
    yamakasaTired: 'ちからが つきた! こうたいだ!',
    yamakasaLap: (n: number) => `${n}しゅうめ かんそう!`,
    yamakasaInfo: (m: number, total: number, laps: number) => `${m}m / ${total}m   まわった ${laps}かい`,
    introBalloon:
      'あさの そらに ききゅうが あがる!\nききゅうは まえに すすめないので、\nたかさを かえて かぜに のるんだ。\nまとの うえに きたら マーカーを おとそう!',
    balloonPrompt: 'バーナー(ながおし)で のぼる! まとの うえで マーカーを おとそう',
    balloonBurn: 'バーナー',
    balloonDrop: 'おとす',
    balloonWindHi: 'かぜは ひがしへ',
    balloonWindMid: 'かぜ ほとんど なし',
    balloonWindLow: 'かぜは にしへ',
    balloonBull: 'ど まんなか!',
    balloonNear: 'ちかい!',
    balloonFar: 'とおかった…',
    balloonInfo: (n: number) => `おとした かず ${n}`,
    introKokkodesho:
      'たいこやまを そらへ ほうりあげて、かたてで うける!\nまず ゲージが みどりに きたら タップして なげる。\nつぎに かげの わっかに かさなったら タップで うける!',
    kokkodeshoPrompt: 'ゲージが みどりで タップして なげあげ! おりてきたら わっかで タップして うける!',
    kokkoAimHint: (n: number) => `なげあげ! (うけとめ ${n}かい)`,
    kokkoCatchHint: 'おりてくる! わっかで タップ!',
    kokkoThrow: 'なげた!',
    kokkoGood: 'いい ちから!',
    kokkoRough: 'あらっぽい なげ!',
    kokkoCatch: 'うけとめた!',
    kokkoOne: 'かたてうけ! コッコデショ!',
    kokkoMiss: 'まだ とどかない!',
    kokkoDrop: 'おちちゃった…',
    introKazariuma:
      'きれいに かざった うまを ひいて まちを ねりあるく!\n「すすむ」で まえへ。\nうまが びっくりしたら、うまを なでて(スワイプ)\nおちつかせよう!',
    kazariumaPrompt: '「すすむ」で まえへ! うまが びっくりしたら なでて(スワイプ)おちつかせよう',
    umaStep: 'すすむ',
    umaCalm: 'よしよし',
    umaScare: 'うまが びっくり!',
    umaStop: 'うまが たちどまった! なでて!',
    umaGoal: (n: number) => `とりいに とうちゃく! ${n}かいめ!`,
    umaInfo: (m: number, total: number, goals: number) => `${m}m / ${total}m   とうちゃく ${goals}かい`,
    introYukake:
      'おんせんの ゆを かけあって みんなを あたためる ぎょうじ!\nゆぶねを ながおしして ひしゃくに ゆを ためて、\nおきゃくさんの のみたい あつさで てを はなそう!',
    yukakePrompt: 'ながおしで ゆを ためる! あつめは たっぷり、ぬるめは すこしで てを はなす!',
    yukakeGuide: 'すこし= ぬるめ      たっぷり= あつめ',
    yukakeWantHot: 'あつめが いい!',
    yukakeWantWarm: 'ぬるめが いい!',
    yukakeOk: 'ちょうど いい!',
    yukakePerfect: 'さいこうの ゆかげん!',
    yukakeTooCool: 'ぬるかった…',
    yukakeTooHot: 'あつすぎた…',
    yukakeInfo: (n: number) => `あたためた ひと ${n}にん`,
    introHyottoko:
      'おかしな おめんで おどる まつり!\nおはやしの あいずと おなじ おめんを\n3つの なかから えらんで タップしよう!',
    hyottokoPrompt: 'あいずと おなじ おめんを えらんで タップ! はやく なるよ!',
    hyottokoNames: ['ひょっとこ', 'おかめ', 'きつね'],
    hyottokoCue: (name: string) => `${name}の ポーズ!`,
    hyottokoSame: 'まねっこ! おなじ もういちど!',
    hyottokoOk: 'そろった!',
    hyottokoWrong: 'ちがう おめん!',
    hyottokoLate: 'おくれちゃった!',
    hyottokoStreak: (n: number) => `${n}れんぞく! おおうけ!`,
    introRokugatsudo:
      'なつの よに、えを かいた とうろうを じんじゃに かける ぎょうじ。\nすうじの じゅんに てんを タップして つないで、\nえを かんせいさせよう!',
    rokugatsudoPrompt: 'すうじの じゅんに てんを タップして つなごう! えが できると とうろうに なるよ',
    rokuPicture: (name: string) => `したえ: ${name}`,
    rokuOrder: (n: number) => `つぎは ${n} だよ!`,
    rokuDone: 'とうろう かんせい!',
    introTsunahiki:
      'まちを ふたつに わけて つなを ひきあう!\nタップれんだで ひこう。\n「せーの!」の あいずの ときは\nながおしで ふんばるんだ!',
    tsunahikiPrompt: 'タップれんだで ひく! あかい「せーの!」の ときは ながおしで ふんばる!',
    tsunaWarn: 'せーの! ふんばれ!',
    tsunaHold: 'ふんばった!',
    tsunaWin: (n: number) => `かった! ${n}しょう!`,
    tsunaLose: 'ひきもどされた…',
    tsunaInfo: (w: number, l: number) => `${w}しょう ${l}ぱい`,
    minyouStep: 'そろった!',
    minyouMiss: 'ちがった〜!',
    minyouRound: (n: number) => `${n}こ そろえる!`,
    owaraKeep: 'いいながれ!',
    kazeTime: 'かぜが とおる! (2ばい)',
    owaraOut: 'はずれちゃった!',
    tourouFlow: 'ながれた!',
    tourouGold: 'きんの とうろう だ!',
    tourouTip: 'たおれちゃった…',
    kaniCrack: 'ぱきっ!',
    kaniMi: 'みが とれた!',
    kaniOozara: 'おおざら もりつけ!',
    /** おさらが きんいろに なって いる あいだの ひとこと(点は 2ばい) */
    kaniBigPlate: 'おおざら! 2ばい',
    kaniPlate: 'もりつけ かんせい!',
    hiLit: 'ひが ついた!',
    hiOut: 'きえちゃった!',
    hiAll: 'まちが あかるい!',
    kiSlide: 'きおとし!',
    kiTilt: 'かたむいた!',
    kiGoal: 'ぶじに おりた!',
    itoPull: 'すーっ',
    itoTrick: 'げいが きまった!',
    takoUp: 'たかく あがった!',
    takoCut: 'いとが きれた!',
    takoWin: 'かちどきだ!',
    takoRival: 'あいての たこが きた!',
    chochinOn: 'ともった!',
    chochinRow: 'はんえん かんせい!',
    nebutaPrompt: 'わっかが かさなった しゅんかんに タップ! ラッセラーで はねよう!',
    sansaPrompt: 'ながれてくる まるが たいこに かさなったら、そのがわを タップ!',
    tanabataPrompt: 'ひかっている ところに おなじ いろの かざりを ドラッグして つるそう!',
    kantouPrompt: 'さおが たおれないように、したの てを うごかして ささえよう!',
    hanagasaPrompt: 'やじるしの むきに ゆびを くるくる! かさを まわして おどろう!',
    warajiPrompt: 'ひだり・みぎ・こうごに タップして おおわらじを かつごう!',
    yukimatsuriPrompt: 'うっすら いろの ついた「ぞうの ぶぶん」を のこして、まわりの ゆきだけ けずろう!',
    /** 何を つくって いるか。おてほんが ボタンに 見えて いた ので 文に した */
    yukiTarget: 'これを つくる',
    yukiDone: 'ゆきぞう かんせい!',
    yukiOops: 'あぶない! そこは ぞうだよ!',
    yukiBig: 'おおきな ゆきぞう! (2ばい)',
    rassera: 'ラッセラー!',
    haneJust: 'おおはね!',
    nebutaTime: 'おおねぶた タイム!',
    sansaDon: 'ドン!',
    sansaParade: 'パレードだ!',
    tanabataHang: 'つるした!',
    tanabataGold: 'きんの ふきながし!',
    tanabataMissHook: 'あれれ、いろが ちがう!',
    kantouUp: (lv: number) => `たかさアップ! レベル${lv}`,
    kantouWobble: 'おっとっと!',
    hanagasaSpin: 'やっしょー まかしょ!',
    hanagasaReverse: 'ぎゃくまわし!',
    hanagasaTime: 'はなふぶき タイム!',
    warajiStep: 'わっしょい!',
    warajiTrip: 'あしが そろっちゃった!',
    warajiHill: 'さかみちだ! いそげ〜!',
    wasshoi: 'わっしょい!',
    hikkawase: 'ひっかわせ だ!',
    stall: 'およよ…',
    wasshoiTime: 'わっしょいタイム!',
    stumble: 'おっとっと!',
    balancePerfect: 'いい かつぎ!',
    shaped: 'いい かたち!',
    fired: 'やきあがり!',
    firedJust: 'さいこうの やきあがり!',
    oozara: 'おおざらに ちょうせん!',
    gatePass: 'とおった!',
    horn: 'ぽーっ!',
    hornBig: 'あいさつの きてき!',
    bump: 'ごつん!',
    pitta: 'ぴったり!',
    slideOff: 'おっとっと…',
    bigDaruma: 'とくだいだるま!',
    just: 'ジャスト!',
    shakudama: 'しゃくだま!',
    fizzle: 'しゅう…',
    doneTitle: 'おまつり だいせいこう!',
    doneBody: (name: string) => `${name} かいさい!`,
    bestScore: (n: number) => `さいこうきろく: ${n}`,
    /** ぼんぼりの できばえ(core/bonbori.ts)。おまつりを くりかえす 目あて */
    rank: { copper: 'どうの ぼんぼり', silver: 'ぎんの ぼんぼり', gold: 'きんの ぼんぼり' },
    /** つぎの いろまで あと 何点か(どうと ぎんの ときだけ 出す) */
    rankNext: (name: string, n: number) => `${name}まで あと ${n}てん!`,
    /** きんに なった しゅんかん */
    rankUp: (name: string) => `${name}に なった!`,
    /** 地図の したの カウンタ */
    goldCount: (n: number, total: number) => `きんの ぼんぼり ${n}/${total}`,
    /** 47県 ぜんぶ きんの おいわい */
    allGoldTitle: 'にっぽんじゅうが きんいろ!',
    allGoldBody:
      'ほっほう! 47の おまつり ぜんぶで\nきんの ぼんぼりを ともした のか!\nこれは もう おまつりの めいじん じゃ!',
    allGoldClose: 'やったー!',
    newRecord: 'きろく こうしん!',
    /** はじめて その県の おまつりを ひらいた とき(=くもが はれる とき)。
        くわしい おいわいは 地図の 晴れシネマが やる ので、ここは 「見に いこう」の 引きだけ */
    doneGuideFirst: (prefTitle: string) =>
      `${prefTitle}の くもが はれていく…!\nちずに もどって みてみよう!`,
    /** 2回目からは やりこみ(スコアアタック)の ことば */
    doneGuideAgain: 'さいこうスコアを めざして なんども あそぼう!',
    goMap: 'ちずを みる!',
  },

  session: {
    instantTitle: (emoji: string, name: string, verb: string) => `${emoji} ${name}を ${verb}`,
    harvestTitle: (emoji: string, name: string) => `${emoji} ${name}の しゅうかく!`,
    careTitle: 'おせわチャンス!',
    back: 'もどる',
    quizSign: 'ものしりクイズ! せいかいで スコアボーナス!',
    careDoneToast: 'おせわ ばっちり! しゅうかくの とき スコアボーナス!',
    resultTitle: 'できた!',
    harvestSuccess: 'しゅうかく せいこう!',
    scoreLine: (n: number) => `スコア: ${n}`,
    gotItems: (name: string, n: number) => `${name} ×${n} を てにいれた!`,
    star3Note: 'さいこうの できばえ! おまけ つき!',
    star2Note: 'なかなかの できばえ!',
    star1Note: 'つぎは もっと じょうずに できるかも!',
    bossNote: 'ぬしを つりあげると ほし3つに なるよ!',
    backBtn: 'もどる',
    sanchiComp: (name: string) => `${name}の さんちコンプ! すごい!`,
  },

  arcade: {
    score: (n: number) => `スコア ${n}`,
    combo: (c: number, mult: number) => `${c}コンボ ×${mult}!`,
    timeUp: 'おわり〜!',
    wave: (n: number) => `ウェーブ ${n}!`,
    miss: 'あちゃ!',
    escaped: 'にげられた!',
    tapsLeft: (n: number) => `あと${n}!`,
    bossAppear: 'ぬしが あらわれた!',
    bossCaught: 'ぬしを つりあげた!',
    center: 'どまんなか!',
    stopped: 'とまった…',
    timeBonus: (n: number) => `タイムボーナス +${n}!`,
    cleanRow: 'ひとふでがり!',
    noShovels: 'シャベルが きれた… あたらしい ほりばへ!',
    shovelBonus: (n: number) => `シャベルのこり ×${n} ボーナス!`,
    careResult: (bopped: number, leaked: number) => `おいはらった: ${bopped}ひき\nたべられた: ${leaked}かい`,
    /* つみとり(pluck) */
    notRipe: 'まだ あおい!',
    stemBreak: 'くきが きれた!',
    pluckPop: 'ぷちっ!',
    bigFruit: 'まぼろしの おおつぶ!',
    /* リズムづみ(rhythm) */
    rhythmPerfect: 'ばっちり!',
    rhythmGood: 'おしい!',
    rhythmWhiff: 'すかっ…',
    goldLeaf: 'きんの わかば!',
    /* ゆきはらい(sweep) */
    sweepReveal: 'でてきた!',
    blizzardWarn: 'ふぶきが くる〜!',
    goldVeg: 'きんいろだ!',
    /* すくいとり(scoop) */
    scoopUp: 'すくいあげた!',
    scoopFull: 'まんたん すくい!',
    spilled: (n: number) => `${n}ぴき こぼれた!`,
    waveWarn: 'なみが くるよ〜!',
    goldSwarm: 'きんの むれ だ!',
    /* かいひきあげ(shell) */
    shellPace: 'いい はやさ!',
    shellDrop: 'おちちゃった!',
    shellDeck: 'デッキに あがった!',
    shellPeel: 'はずせた!',
    shellAll: 'ぜんぶ はずした!',
    shellGold: 'おおつぶ だ!',
    /* いねかりの とり */
    birdCome: 'とりが きた!',
    birdSteal: 'とられた!',
    birdSafe: 'セーフ!',
  },

  quiz: {
    progress: (i: number, n: number) => `もんだい ${i} / ${n}`,
    answerIs: (ans: string) => `こたえは「${ans}」だよ!`,
  },

  trivia: {
    modalTitle: 'あたらしい はっけん!',
    /** よみ手は ものしりはかせ(ずかんと 知識の 係)。ぴっけとは 口調を わける */
    found: 'ほっほう! あたらしい はっけん じゃ!',
    head: 'ものしりカード',
    register: 'ずかんに とうろく!',
  },

  zukan: {
    tabs: { mat: 'そざい', t2: 'さんぶつ', t3: 'めいぶつ', t4: 'でんとう', kazari: 'おれい' },
    /** おれいタブ: 称号の セル */
    noTitle: 'まだ しょうごうは ない',
    nextTitle: (name: string, n: number) => `つぎ: ${name}\nあと ${n}かい`,
    kazariFrom: (pref: string) => `${pref}の おれい`,
    /** ずかん 100%(真コンプ)。ごほうびは 称号だけ ── 作りこみすぎない */
    fullTitle: 'ずかん かんせい!',
    fullBody: 'ほっほう…わしの ずかんを こえたのう。\nきょうから きみが 「ものしりはかせ」じゃ!',
    fullClose: 'えっへん!',
    unknown: '？？？',
    comp: 'さんちコンプ!',
    jimoto: 'じもと',
    sanchi: (got: number, total: number) => `さんち ${got}/${total}`,
    tapHint: 'タップで くわしく',
    notYet: 'まだ',
    detailHead: 'さんちごとの できばえ',
  },

  inv: {
    empty: 'まだ なにも もっていないよ。\nけんに いって そざいを そだてよう!',
    itemsHead: 'そざいと めいさん',
    /** まだ 作って いない どうぐの 名まえ */
    unknownTool: '？？？',
  },

  settings: {
    title: 'せってい',
    version: (v: string) =>
      `はれはれクエスト v${v}\nデータは この たんまつの なかにだけ ほぞんされます。\nちずデータ: svg-maps (© Victor Cazanave, CC BY 4.0)`,
    /** ストーリーの 再生(導入と エンディング)。クリアの 記念を いつでも 見かえせる */
    omoideBtn: 'おもいでを みる',
    parentMenuBtn: 'おうちのひと メニュー',
    /** 音が でない ときの ヒント(iPad は 本体の 消音スイッチで 音が 消える) */
    soundOn: 'おとは オン',
    soundOff: 'おとは オフ',
    soundHintTitle: 'おとが でない ときは',
    soundHint:
      '1. 画面の スピーカーボタンが オンに なっているか\n2. iPad・iPhone の 本体の おとが 小さく なっていないか\n3. サイドの スイッチや「消音モード」に なっていないか\nを たしかめてね。それでも でない ときは アプリを 開きなおしてね。',
    /* --- 保護者ゲート/保護者メニュー ---
       大人向けのため意図的に漢字表記(ひらがな中心ルールの例外)。
       子供が読めない+九九を超える計算で、誤操作・誤課金系の審査要件に対応する */
    gateTitle: '保護者の方へ',
    gateBody: 'お子様の誤操作を防ぐため、次の計算に答えてください。',
    gateQuestion: (a: number, b: number, ans: string) => `${a} × ${b} = ${ans || '?'}`,
    gateWrong: '答えが違います。もう一度どうぞ',
    gateKeyDel: '消す',
    gateKeyOk: 'OK',
    parentTitle: '保護者メニュー',
    parentInfo: (v: string) =>
      `バージョン v${v}\n個人情報の収集・外部送信はありません。\n広告・課金・プッシュ通知もありません。`,
    boostBtn: '成長とストックを満タンにする(動作確認用)',
    boosted: 'ぜんぶ まんたんに なったよ',
    unlockBtn: '全県・全レシピを開放する(動作確認用)',
    unlocked: 'ぜんぶ かいほうされたよ! どの けんも おまつりも すぐ あそべる',
    privacyBtn: 'プライバシーポリシー',
    privacyTitle: 'プライバシーポリシー',
    privacyBody:
      'はれはれクエストは、お子様向けの日本地理学習ゲームです。\n\n' +
      '・個人情報の収集は行いません\n' +
      '・セーブデータは端末内にのみ保存され、外部に送信されません\n' +
      '・広告表示、アプリ内課金、プッシュ通知はありません\n' +
      '・外部サービスとの通信は行いません\n\n' +
      '地図データ: svg-maps(© Victor Cazanave, CC BY 4.0)',
    resetBtn: 'データをリセット',
    resetTitle: 'リセットの確認',
    resetConfirm: '本当に最初からはじめますか?\nこの端末のセーブデータが消えます。',
    resetYes: 'はい、リセットする',
    resetNo: 'やめる',
    resetDone: 'リセットしました',
    close: 'とじる',
  },
} as const;

/* -----------------------------------------------------
   おまつりゲームの 説明文の ひきかた。
   introDaruma / introHanabi … の ように 「intro + ゲーム名(かしら文字だけ 大)」で
   ならべて あるので、名まえの きまりで ひく。
   47行の 対応表を シーンに ベタ書き しない ため(データ駆動の きまり)。
   ----------------------------------------------------- */

/** その おまつりゲームの 説明文。ない ときは undefined(テストで 見つける ため) */
export function festIntroOf(kind: string): string | undefined {
  const key = `intro${kind.charAt(0).toUpperCase()}${kind.slice(1)}`;
  const v = (UI_TEXT.fest as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : undefined;
}

/** その おまつりゲームの 説明文(ない ときは やたいの 説明) */
export function festIntro(kind: string): string {
  return festIntroOf(kind) ?? UI_TEXT.fest.introBody;
}

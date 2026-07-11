# めいさんクエスト(仮) ゲーム仕様書 v0.4

HTML試作版(reference/ 参照)で検証済みの確定仕様。移植時はこの仕様を正とする。

## 1. コンセプト

- ターゲット: 4〜8歳(未就学〜低学年)。保護者が横にいる想定も、一人でも遊べる
- 学習テーマ: 日本地理(県の形・位置・名産・郷土文化)
- コアファンタジー: 「にっぽんを かいたくして、じぶんの ずかんを かんせいさせる」
- マスコット: たんけんヒヨコ「ぴっけ」(仮)。案内・出題・祝福を担当

## 2. コアループ

```
① 県を かいたく(クイズ2問: 形/位置 + 知識)
② そざいを 入手
   - plant: たねをまく → リアル時間で成長 → 収穫アクション
   - infra: いど/たんぼ が時間でストック → 回収のみ
   - timing/dig: 待ちなしミニゲーム
③ レシピを さがす(ものしりクイズ2問)
④ クラフト(Tier2さんぶつ → Tier3めいぶつ)
⑤ おまつり(Tier4)を ひらいて 県コンプ
⑥ ずかんが うまる → つぎの県へ
```

## 3. そざい入手の4方式

| 方式 | 対象 | 流れ | 例 |
|---|---|---|---|
| plant | 作物・木(8種) | まく→成長(作物5〜10分/木20〜25分)→収穫ゲーム+クイズ1問 | いちご、うめ |
| infra | 全国区素材(2種) | 開拓で施設が建つ→rateSec毎に+1(max3)→回収(★2固定、ゲームなし) | みず=いど、こめ=たんぼ |
| timing | 漁(1種) | 往復マーカーを中央で止める×3+クイズ1問 | いわし |
| dig | 土もの(1種) | 光った場所を覚えて掘る×3+クイズ1問 | ねんど |

- 収穫ゲームは pluck(散らばった実を全部タップ、9秒以内=2pt)と dig(2回掘り)の2エンジン
- **おせわチャンス**: plant の成長40%で1回必ず湧く。タップ撃退ミニゲーム(whack)。
  やると収穫時★計算に+1の「保険」。やらなくても枯れない。素材ごとに相手が違う(🐛🐗🌀🐜🐦🐝)

## 4. ★(できばえ)ルール

- セッション得点 pts = 各ステップの成功(pluck成功=2、他=各1)+ おせわ保険(+1)
- ★3 = pts >= maxBase(そのセッションの満点)、★2 = pts >= 2、★1 = それ以外
- ★3収穫は yield 2個(おまけ)。失敗・全損は存在しない(成功保証)
- infra素材は常に★2固定

## 5. レシピ・クラフト

- Tier2(さんぶつ)→ Tier3(めいぶつ)→ Tier4(おまつり)。産物を材料にできる(ref にレシピIDを書く)
- ingredient: `{ ref, count, origin?, quality? }`
  - origin: 産地指定(例: かさまやき=いばらき産ねんど必須)。同じ素材でも産地が意味を持つデモ
  - quality: ★指定(収穫特化型。例: ブランドメロン=メロン★3)
- 消費選択 pickConsume: 産地一致(じもと)優先 → 低★優先で温存
- **じもとメダル**: 消費した素材(材料の産物は除く)が全て自県産なら図鑑で金枠
- 県またぎハブ: しょうゆ(千葉)が いばらき「なっとうていしょく」と とちぎ「かんぴょうまき」の材料

## 6. おまつり(Tier4)

- 必要めいぶつを消費 + だんどりパズル(手順を正しい順にタップ)で開催
- 開催すると地図に🏮・金縁、夜空にちょうちんが昇る演出。MVPは いばらき「うめまつり」のみ実装、
  他2県は implemented:false(じゅんびちゅう表示)

## 7. クイズ設計(v0.4で確定した規律)

| kind | 用途 | 内容 |
|---|---|---|
| kaitaku | 開拓専用 | shape(実形SVG)/position(地図で光る位置)+ 知識(産地・名物を問う) |
| sozai | 育成・レシピ | 「なっとうは なにから できる?」等、場所に依存しない知識 |
| bunka | レシピ | 文化(かま、たいこ、はっこう等) |

- **「産地」カテゴリは廃止済み**。産地を問う問題は「その県にいる」文脈では冗長or矛盾になるため、
  開拓前(kaitaku)にだけ出す。この規律を破る出題ロジックを書かないこと
- 選択肢は表示時に毎回シャッフル(データ上の answer は固定index)
- プール不足時に無関係カテゴリで補充しない(v0.2のバグの再発防止)

## 8. データスキーマ(reference/data.js = 移植元)

- prefectures: id / name / active / color / festivalId。active:false は「じゅんびちゅう」表示
- materials: id / name / emoji / origins[] / rarity(common・local・unique) / gather
  - gather.type: infra{building,bEmoji,rateSec,max,collectVerb} / plant{verb,growSec,harvest,care} /
    timing{theme} / dig{theme}
- recipes: id / name / emoji / tier / type / pref / ingredients[] / (tier4: implemented, steps[])
- trivia: target / text / check?(裏取り未了マーク。文言を断定強化しない)
- quizzes: id / kind / type? / tags[] / q / choices[3] / answer
- 地図: 実際の県境TopoJSONから生成した簡略パス(reference/gen-map.mjs で再生成可能)

## 9. セーブデータ(localStorage "meisanquest-save-v1")

```
{ unlocked:[], inv:[{ref,origin,quality}], recipes:[],
  zukanMat:{matId:{prefId:maxStars}}, zukanProd:{recId:{jimoto}},
  fest:[], seenTrivia:{}, plots:{"pref|mat":{plantedAt,careSpawned,careDone}},
  infra:{"pref|mat":{lastCollect}}, flags:{} }
```

## 10. 管理者・デバッグ機能(維持すること)

- 設定モーダル「⏩ かんりしゃ: せいちょう&ストックを まんたんに」
- コンソールAPI: `__mqAdmin.boostAll()` / `__mqAdmin.halfGrow()`(おせわチャンス検証用)
- リセットは保護者ゲート(足し算)付き

## 11. 健全設計の原則(仕様の一部として扱う)

通知なし / 時間短縮課金なし / 失敗・全損なし / 広告なし / セーブは端末内のみ。
子供向けストア規約(Apple Kids Category / Google Families / COPPA)を将来の前提とする。

## 12. MVPコンテンツ(3県)

- いばらき(梅・メロン・なっとう・かさまやき・うめまつり)/ ちば(らっかせい・いわし・しょうゆ=ハブ)/
  とちぎ(いちご・かんぴょう・ましこやき)。そざい12・レシピ18・トリビア30・クイズ41
- トリビアの `check` 付き項目は農水省統計・県公式での裏取りが未了(ROADMAP参照)

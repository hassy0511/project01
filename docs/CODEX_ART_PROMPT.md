# Codex に わたす プロンプト(絵の 作成)

このファイルは **Codex(コーディングAI)に そのまま 貼る 依頼文**です。
下の 「## プロンプト本体」から 「## 2回目以降の 貼りかえ方」の 前までを
コピーして 貼ってください。

**進め方は 2段構え**です。

1. **images 2.0 で 下絵(PNG)を 生成する** — 絵の 良さは 画像生成に まかせる
2. **その 下絵を 再現する SVG を 手で 書く** — 軽さ・色ちがい対応は SVG で 担保する

下絵は 「見ながら 描く ための 参考」です。**納品物は SVG だけ**。
PNG は アプリでは 使いません(§4 で `<image>` を 禁止しているのは そのため)。

- 絵の 方針: [ART_DIRECTION.md](./ART_DIRECTION.md)
- 何を 何個: [ART_ASSET_LIST.md](./ART_ASSET_LIST.md)(`npm run art:list` で 再生成)
- 納品物の 自己点検: `npm run art:check`

**回ごとに 出す 量が 変わります。** 1回目は 見本5個だけ。
2回目以降は 「### 今回の 範囲」の 行だけ 書きかえて 貼りなおしてください。

---

## プロンプト本体

あなたは 子供向けゲームの **アイコンを 作る** 担当です。
このリポジトリ(`hassy0511/project01`)は 4〜8歳向けの 日本地理学習ゲームです。
いまの 絵は TypeScript コードで 図形を 並べた もので、**絵として 品質が 低い**のが 課題です。

**仕事は 2段階です。**

- **第1段**: 画像生成モデル **images 2.0** で 下絵の PNG を 作る
- **第2段**: その 下絵を **再現する SVG を 手で 書く**(これが 納品物)

いきなり SVG を 書き始めないでください。**先に 下絵を 出してください。**
コードで 図形を 並べる 発想から 離れる ためです。

### 今回の 範囲

**`strawberry` `fish` `person` `lantern` `bowl` の 5個だけ** を 作ってください。
絵柄を 決める ための 見本です。**5個より 多く 作らないでください。**

### 最初に 読むもの(必須)

1. `docs/ART_DIRECTION.md` — 絵柄・SVG仕様・色のしくみ・合格ライン。**これが 正典です**
2. `docs/ART_ASSET_LIST.md` — 今回の 5個の 行を 探し、「何を 描くか」「つかう いろ」
   「出る 大きさ(px)」「どこで つかう」を 読む
3. 参考に したい 場合のみ `src/ui/icons/*.ts` の 該当関数(いまの コード描画)。
   **同じ 見た目に する 必要は ありません。** むしろ 離れて よいです

---

## 第1段: images 2.0 で 下絵を 作る

### 出す ところ

```
docs/art-ref/strawberry.png
docs/art-ref/fish.png
docs/art-ref/person.png
docs/art-ref/lantern.png
docs/art-ref/bowl.png
```

- `docs/` は アプリに 含まれません。ここは **参考置き場**です
- 1024×1024 まで。**正方形**で 生成する
- 1つの かたちに 1枚。色ちがいは 作らない

### 画像生成プロンプト(この ひな形を 使う)

`{OBJECT}` と `{DETAIL}` と `{COLOR}` だけ 差しかえて 使ってください。
`{DETAIL}` は `ART_ASSET_LIST.md` の 「何を 描くか」の 文、
`{COLOR}` は 同じ行の 「つかう いろ」の うち **その ものらしい 色**を 選びます。

```
A single {OBJECT} icon for a children's mobile game, drawn as if cut from thick
colored paper and glued down — flat felt/paper-craft picture book style.

Subject: {DETAIL}
Main color: {COLOR}

Style rules (all mandatory):
- Completely flat fill. One flat color per surface. NO gradient, NO shading,
  NO drop shadow, NO texture, NO 3D rendering, NO glossy highlight.
- Bold, uniform dark outline around the silhouette, in a darker shade of the
  main color. The outline must stay thick and even.
- Extremely simple silhouette made of only 3 to 6 shapes. Must stay readable
  when shrunk to 32x32 pixels.
- Strictly front view or strictly exact side view. No perspective, no 3/4 angle.
- Rounded corners everywhere, except for things that should feel hard
  (stone, knife, gate).
- If it has a face: only two round dots for eyes and one short line for the
  mouth. No eye highlights, no eyelashes, no eyebrows.
- At most one soft white highlight patch, low opacity, on the upper area.
- Centered, filling most of the square frame, with a small even margin.
- Plain solid background, light cream #F2F7E8. Nothing else in the image.
- No text, no numbers, no letters, no logos, no watermark, no border frame.
- Not a real-world brand, mascot, or existing character.
```

### 下絵の 合否(ここで 弾いてください)

次に 当てはまったら **生成しなおし**。SVG に 進まないこと。

- 立体的な 陰影・グラデーション・光沢・ぼかしが 入っている
- 文字・数字・枠・透かしが 入っている
- パーツが 7個以上 あって ごちゃごちゃ している
- ななめから 見た 絵(パースが ついている)
- 縮めると 何か わからない(**512px → 32px 相当に 縮めて 見る**)
- そのものらしく 見えない / 似た ものと 区別が つかない
  (`くり` と `いも`、`わん` と `さら` は まちがえやすい)

---

## 第2段: 下絵を 再現する SVG を 書く

### 出す ところ

```
public/art/icons/strawberry.svg
public/art/icons/fish.svg
public/art/icons/person.svg
public/art/icons/lantern.svg
public/art/icons/bowl.svg
```

- ファイル名は `ART_ASSET_LIST.md` の 名前と **1文字も 変えない**
- 1つの かたちに 1ファイル。**色ちがいの ファイルは 作らない**

### やりかた

**自動ベクター化(potrace 等の トレース)は 使わないでください。**
パスが 何百本にも なり、§4 の 「20以下」を 満たせません。

下絵を 見ながら **手で 座標を 決めて 書く**。下絵の 「良さ」のうち
次の 3つだけを 移せば 十分です。

1. **シルエット**(遠くから 見た 形)
2. **パーツの 分けかた と 位置関係**
3. **どこを 明るく したか**

細かい ゆらぎや 質感は 捨てます。**下絵より 単純に なるのが 正解**です。

### ぜったいに まもる きまり(抜粋。詳細は ART_DIRECTION.md)

- `viewBox="0 0 64 64"` 固定。`width` / `height` 属性は 書かない
- 外側 3 は セーフエリアとして 空ける。**でも 小さく 描かない**
  (高さか 幅の どちらかは 50 以上 使う)。中心に 置く
- **平ぬり**。1つの 面は 1色。グラデーション・影・ぼかし・立体的な 陰影は 禁止
- **太い ふちどり**。`stroke-width` は **2.4〜3**。1.5 未満は 縮小で 消えるので 禁止
- 要素は **3〜6個**の パーツで シルエットを 作る。`<path>` などの 数は **20以下**が 目安
- **正面 か 真横**。ななめ・パースは つけない。角は 丸める
- 顔は **点2つ + 口1本**だけ。目のハイライト・まつげは 禁止
- 使える 要素: `<svg> <g> <path> <circle> <ellipse> <rect> <polygon> <polyline> <line>`
  **使えない**: `<text> <image> <filter> <clipPath> <mask> <use> <style>`、
  グラデーション要素、アニメーション要素、外部フォント
  (下絵の PNG を `<image>` で 埋めこむのは **禁止**です)
- 色は **属性で** 書く(`fill="#MAIN"`)。`style="fill:…"` は 禁止
- 文字・数字を 絵に 入れない。実在の キャラクター・商標・ロゴに 似せない

### 色の しくみ(ここを まちがえると 全部 やり直しに なります)

同じ かたちを **20色ちがいで 使い回します**。だから 色ちがいは 描きません。

| 書く 文字 | 置きかわる もの |
|---|---|
| `#MAIN` | 本体の 色(面の ぬり) |
| `#DARK` | 本体より こい色(ふちどり・影・点) |

**それ以外に 書いた 色は そのまま 出ます。**

下絵から 移す ときの 決め方は こうです。

- 下絵で **`{COLOR}` に した 面** → `#MAIN` に する
- その **ふちどり・影・点** → `#DARK` に する
- 下絵の うち **「その ものの 色が 決まっている」部分**(はっぱの 緑・木の 茶・
  炎の 橙・白い 紙)→ 色を 直接 書く。ただし
  **ART_DIRECTION.md §5 の パレット23色 以外は 使わない**
  (例外として 葉の 緑 `#5AA04A` / `#37702C`、白 `#FFFFFF` は 可)

いちごなら「実 = `#MAIN`、がく = 緑を 直接」。これで `いちご:red` と
`いちご:cream`(まだ 白い いちご)が 1枚で 足ります。

**わな(1回目で 実際に 起きました)**: たね・点・すじ など **小さい しるしを
パレットの 色で 直に 書くと、その 色ちがいの ときだけ 消えます。**
いちごの たねを `#F6E7C4` に した ところ、`いちご:cream` で 実と 同じ 色に なり
たねが 消えました。**小さい しるしは `#DARK` に する**こと。
`npm run art:check` が 自動で 見つけます。

---

## 出す前に 自分で 通すこと

```bash
npm run art:check          # きまりの 自動チェック(これが 通るまで 出さない)
```

`なおす ところ` が 1つでも 出たら 直してから もう一度。
`きをつけたい ところ` は 内容を 読んで 判断してよいです。

さらに **自分の目で** この3つを 確認してください(自動チェックでは わかりません)。

1. **下絵と 見くらべて、同じ ものに 見えるか**。単純化は よいが、別物は だめ
2. **32px に 縮めて 何か わかるか**。「茶色い かたまり」なら やり直し
3. `#MAIN` に `#F6E7C4`(うすいクリーム)と `#4A4A52`(こいグレー)の
   **両方**を 入れて 崩れないか。背景は `#F2F7E8` なので、
   うすい色でも ふちどりで 形が 見えること

## やってはいけないこと

- **下絵を 作らずに SVG を 書き始める**
- 自動ベクター化(トレース)で SVG を 作る
- 下絵の PNG を `public/` に 置く / SVG に 埋めこむ
- `src/` の コードを 変更する(絵の 差しかえ処理は 別途 こちらで 作ります)
- `reference/` を 触る(参照専用)
- `docs/ART_ASSET_LIST.md` を 手で 編集する(自動生成です)
- 一覧に ない 名前の ファイルを 作る / 5個より 多く 作る
- `npm run art:check` が 落ちた 状態で 提出する

## git の 使い方

- ブランチ: `codex/art-sample-01` を 新規作成して そこにだけ コミット
- `main` には push しない
- PNG(`docs/art-ref/`)と SVG(`public/art/icons/`)は **どちらも コミット**する
  (下絵と 出来上がりを 見くらべて レビューします)
- コミットメッセージは 日本語で よい
- PR を 作る場合は 本文に **5個それぞれ 何を 意図して 描いたか 1行ずつ** 書く

## 報告してほしいこと

作業が 終わったら 次を 書いてください。

1. 下絵(PNG)と SVG の ファイルパス
2. **実際に images 2.0 に わたした プロンプト**(5個ぶん。ひな形から 変えた ところが
   わかるように)。何回 生成しなおしたかも 書く
3. `npm run art:check` の 出力(最後の 数行)
4. 各 かたちで **どの 部分を `#MAIN` に し、どの 部分を 直接 色指定に したか**
5. 下絵から **意図的に 落とした もの**(単純化した ところ)
6. 迷った ところ・判断に 困った ところ(遠慮なく 質問に して よい)

## もし images 2.0 が 使えない 環境なら

**推測で SVG を 書き始めないでください。** その旨を 報告して 止めてください。
下絵なしで 進めると、また コードで 図形を 並べたような 絵に 戻ります。

## 大事な 考え方

**「上手い絵」ではなく「4〜8歳が 1秒で わかる絵」**が 正解です。
ゲーム中に 26〜46px で ちらっと 見えるだけ。よく見ると 上手い 絵は この用途では 失敗です。
似た ものと まちがえそうなら、**特徴を 1つ 大げさに** してください
(くり = とがった さき、いも = 土の 点、ふぐ = まるい 体と とげ)。

---

## 2回目以降の 貼りかえ方

「### 今回の 範囲」と 2か所の 「出す ところ」、ブランチ名を 差しかえるだけです。

| 回 | 範囲の 書き方 | ブランチ |
|---|---|---|
| 2 | `ART_ASSET_LIST.md` の 「どこで つかう」が 多い **20個** | `codex/art-common-20` |
| 3 | 「そざい・りょうり」の 章 **ぜんぶ** | `codex/art-food` |
| 4 | 「ひと・いきもの」の 章 ぜんぶ(**顔の 描き方を 5個の 見本に そろえる**) | `codex/art-actors` |
| 5 | 「しぜん・けしき」「どうぐ」「きごう」の 章 | `codex/art-rest` |
| 6 | 背景 59個 | `codex/art-bg` |

### 背景の 回(第6回)だけ 変わる ところ

- 下絵: `docs/art-ref/bg-<ゲーム名>.png`。**よこ長(480:748 に 近い たて長)**で 生成
- 納品: `public/art/bg/bg-<ゲーム名>.svg`、`viewBox="0 0 480 748"`
- ART_DIRECTION.md **§7** を あわせて 読ませる
- 画像生成プロンプトの `Subject:` は **場所だけ**。人・道具・食べものは 描かせない
  (アイコンを 上に 重ねる ので 二重に なる)
- 「Centered, filling most of the square frame」の 行を
  「Wide empty area in the upper 60% of the image; put detail in the lower 40%
  or near the edges. Low contrast so foreground icons stay visible.」に 差しかえる

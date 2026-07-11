# v0.4(HTML) → Phaser 3 + TypeScript + Vite 移植計画

Claude Code はこの計画に沿ってマイルストーン単位で進めること。
各マイルストーンの受け入れ条件を満たしたら停止し、人間の確認を待つ。

## M0: 環境構築とデプロイ疎通

1. `npm create vite@latest . -- --template vanilla-ts` → `npm i phaser` → `npm i -D vitest`
2. package.json scripts: dev / build / test(vitest run)/ typecheck(tsc --noEmit)
3. vite.config.ts: `base: '/<リポジトリ名>/'`(GitHub Pages のプロジェクトページ対応)
4. 最小の Phaser シーン(背景色+「めいさんクエスト」テキスト)を表示
5. .github/workflows/deploy.yml(同梱済み)で main push → Pages 公開を疎通確認
   ※ GitHub 側設定: Settings → Pages → Source = GitHub Actions(人間が実施)

**受け入れ条件**: `npm run dev` でローカル表示 / push で公開URLに反映 / test・typecheck が通る

## M1: ロジック層の移植(Phaser 非依存 + ユニットテスト)

reference/app.js から純ロジックを src/core/ へ TypeScript で移植する。UIコードは持ち込まない。

- state.ts: セーブ型定義・load/save・マイグレーション(既存キー "meisanquest-save-v1" 互換)
- craft.ts: matchItems / craftable / pickConsume(じもと優先→低★温存)/ jimoto 判定
- plots.ts: plotState(empty/growing/ready、40%おせわ湧き)/ infraStock / boostAll・halfGrow
- stars.ts: セッション得点→★変換(maxBase 方式+おせわ保険)
- quiz.ts: kaitaku(shape/position+知識)/ sozai / bunka のプール選択。GAME_SPEC の規律を実装
- data: reference/data.js を src/data/gameData.ts へ(型付き)。地図パスは reference/map-gen.json を
  public/assets/ へコピーし fetch で読む(gen-map.mjs も scripts/ へ移設)

テスト移植(reference/test-play.js・test-cross.js が検証していた項目をユニットテスト化):
産地指定ガード / とちぎ産温存 / 県またぎ材料 / ★計算 / infraストック計算 / 成長状態遷移 /
クイズプール分離(sanchi 不在・形位置の混入なし)/ データ整合性(参照切れ・全レシピ完成可能・
★3指定素材が infra でない・トリビア網羅)

**受け入れ条件**: `npm run test` 全緑(20ケース以上)/ core/ に Phaser への import ゼロ

## M2: シーン骨格(v0.4 と機能同等)

- Boot/Preload → MapScene(実形地図・雲・開拓)→ PrefScene(風景バナー・そざいカード・レシピ)
  → SessionScene(pluck/dig/timing/whack/quiz)→ ZukanScene → 共通UI(モーダル・トースト・ぴっけ)
- 見た目は暫定(絵文字テクスチャ可)。操作フロー・文言は v0.4 準拠
- 管理者機能(⏩まんたん・halfGrow)と保護者ゲートリセットを移植

**受け入れ条件**: 開拓→たねまき→⏩→収穫→レシピ→クラフト→うめまつり の一周が公開URLで遊べる

## M3: ゲームフィール(ここが移植の本目的)

- 収穫pluck: 実がぷるんと揺れる→タップでスカッシュ&ストレッチ+パーティクル+スコアポップ
- dig: 土が舞う、いもが「ずぼっ」と出るトゥイーン。timing: マーカー残像・ジャスト時の画面パルス
- ★演出: 1つずつ弾んで着地+音程上昇。祭り: ちょうちん・花火をパーティクルで
- Phaser の Sound で SFX 差し替え(合成音→短尺サンプル可)。BGM はループ1曲から

**受け入れ条件**: 人間が触って「手応えが変わった」と判定できること(数値基準なし・レビュー制)

## M4: アート差し替え準備

- スプライトアトラス前提のロード設計(テクスチャキーをデータ側の assetKey で参照)
- ぴっけ・そざい12種・産物・背景のプレースホルダを差し替え可能な構造にし、
  スタイルガイド確定後に一括投入できる状態にする

## 進め方の約束

- 1マイルストーン=1ブランチでも main 直でも可。ただしコミットは小さく
- 仕様の解釈に迷ったら docs/GAME_SPEC.md を正とし、矛盾があれば実装せず質問する
- reference/ は編集しない。push は人間が行う

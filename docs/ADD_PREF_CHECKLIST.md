# 1県追加チェックリスト(量産の定型手順)

とうほく6県の追加(F4)で確立した手順。残り39県はこのリストに沿って追記だけで増やせる。
コードに県固有の分岐を書いたら負け(CLAUDE.md データ駆動原則)。

## A. 新しい「地方」を開ける場合だけ(地方につき1回)

1. `node scripts/gen-pref-map.mjs <region>` → `public/assets/map-<region>.json` 生成
2. `gameData.ts` regions: `active: true` + `mapFile` + `unlockFests`(解放条件=おまつり種類数)
3. 新動詞(地方=新ワールド。学習コストは常に+1):
   - `HarvestSpec.engine` union と `ArcadeEngine` union に追加
   - `ARCADE_TUNING` に制限時間と★しきい値
   - `src/scenes/minigames/<verb>Game.ts` 実装 + `SessionScene.renderGame` に分岐
4. BGM が地方テーマに合わないなら `bgm.ts` の TRACKS に曲を足す(任意)

## B. 県ごと(データ追記のみ。コード無変更)

`src/data/gameData.ts`:

1. **prefectures**: id / name / kanji / region / active / color / festivalId / suffix(と・ふ・道は suffix 指定)
2. **materials**: 県の名産そざい 2〜3個
   - 既存そざいの産地追加は `origins` に県 id を足すだけ(例: こめ+akita)
   - engine は実物の性質で選ぶ(gameData.ts 冒頭のコメント参照)
   - みず(m01)の origins に県を足すと いど が建つ
3. **recipes**: tier2〜3 を 2〜3品 + tier4 おまつり(rf◯)
   - おまつりは **実在の祭りで「実際にやること」を動詞化**(ACTION_DESIGN.md)
   - `festGame` 新種別 → `FestGameKind` union + `ARCADE_TUNING` + ミニゲーム実装 +
     `FestivalScene` switch + `PrefScene` INTROS + `uiText.fest`(intro/prompt/float)
   - `menu` はその県のしなものだけ(テストが検証)
4. **quizzes**:
   - kaitaku: 形(shape)1問 + 位置(position)1問 + 知識3問以上 ← テストが強制
   - sozai: そざいごとに1問以上(プールが空だとクイズがスキップされる)
   - bunka: おまつり・工芸に1問以上
5. **trivia**: 全そざい・全レシピに1枚ずつ ← テストが強制。
   統計・発祥・「日本一」表現は `check` フラグを付けて裏取りまで断定しない

## C. 検証(全部グリーンになるまで公開しない)

1. `npm run typecheck` / `npm run test`(参照切れ・完成可能性・クイズ網羅は自動検出)
2. `npm run build` + `node e2e/run.mjs`(通しプレイ)
3. 実ブラウザでスクショ(新ゲームは得点が入るところまで操作して確認)
4. ブランチにコミット → 人間の承認を得てから main へ

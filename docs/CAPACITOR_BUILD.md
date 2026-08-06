# ストアビルドの手順(Capacitor・2026-08-06 導入)

Web 版(GitHub Pages)はこれまで通り `npm run build`。ストア用のネイティブビルドはこのページ。

## しくみ

- `capacitor.config.ts` — アプリID(**仮: io.github.hassy0511.harehare。提出前に確定する**)と表示名
- `ios/` `android/` — ネイティブプロジェクト(`npx cap add` で生成済み。コミット対象)
- `npm run build:app` — ネイティブ用の Web ビルド(`--base ./`。Pages 用の `/project01/` と違う)
- `npm run cap:sync` — 上のビルド+ネイティブ側へのコピーを一括で行う

ネイティブでは全アセットが同梱されるため、サービスワーカーは登録しない
(`src/main.ts` で判定)。Android の戻るボタンはアプリを閉じずにホームへ引っ込める。

## Android(Windows/Mac/Linux どれでも)

1. Android Studio を入れる
2. `npm run cap:sync`
3. `npx cap open android` → Android Studio が開く
4. 実機/エミュレータで動作確認 → `Build > Generate Signed App Bundle` で AAB を作る
5. 署名キーは初回に作成し、**必ずバックアップ**(失うと更新が出せなくなる)

## iOS(Mac + Xcode が必須)

1. Mac に Xcode を入れる(App Store から)
2. `npm run cap:sync`
3. `npx cap open ios` → Xcode が開く
4. Signing & Capabilities で Apple Developer アカウントのチームを選ぶ
5. 実機で動作確認 → `Product > Archive` → App Store Connect へアップロード

Mac が手元にない場合は GitHub Actions の macOS ランナーでのビルドも可能(要: 証明書の
Secrets 登録。やるときは相談)。

## アイコン・スプラッシュ

`@capacitor/assets` で一括生成できる(まだ入れていない):

```
npm i -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#dfeef4' --splashBackgroundColor '#dfeef4'
```

元絵は `scripts/icon.svg` から生成した `public/icons/icon-1024.png` を `assets/icon.png` に置く。

## 動作確認の要点(実機)

- [ ] セーフエリア(ノッチ)で UI が欠けない(レターボックス色 #dfeef4 で馴染む)
- [ ] Android 戻るボタン → アプリがホームへ引っ込む(閉じない)
- [ ] 音: iOS 消音スイッチ・バックグラウンドで BGM 停止(Web で対応済みの挙動が生きるか)
- [ ] セーブがアプリ再起動で残る。**将来: localStorage → Capacitor Preferences 移行を検討**
  (WKWebView の localStorage は OS がまれに消すことがある。いまはファイル書き出しで保険)
- [ ] オフラインで起動できる(同梱なので当然可のはず)

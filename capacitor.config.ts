import type { CapacitorConfig } from '@capacitor/cli';

/* ストアビルド(Capacitor)の設定(docs/STORE_REVIEW.md ST-3)。
   appId は ストアに 出すと あとから 変えられない。
   いまは 仮(GitHub Pages の 逆さ書き)── 提出前に 決めなおして よい */
const config: CapacitorConfig = {
  appId: 'io.github.hassy0511.harehare',
  appName: 'はれはれクエスト',
  webDir: 'dist',
  ios: {
    // 黒帯でなく ゲームの 空色で セーフエリアを うめる
    backgroundColor: '#dfeef4',
  },
  android: {
    backgroundColor: '#dfeef4',
  },
};

export default config;

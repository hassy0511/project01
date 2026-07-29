import { rmSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

/* アイコンの SVG は バンドルに 文字列ごと 埋めこんで いる(src/ui/icons/svg.ts)。
   でも 置き場は public/art/icons/ なので、そのままだと dist にも まるごと コピーされ、
   だれも 取りに こない ファイルが 680KB ぶん デプロイに のる。
   ビルドの さいごに その コピーだけ 消す。

   背景(public/art/bg/)は 消さない。こちらは バンドルに 入れず、
   あそぶ ときに 取りに いく つくり(src/ui/bgArt.ts)なので dist に 必要。 */
const dropInlinedIcons = {
  name: 'drop-inlined-icons',
  apply: 'build' as const,
  closeBundle(): void {
    rmSync('dist/art/icons', { recursive: true, force: true });
  },
};

export default defineConfig({
  base: '/project01/',
  plugins: [dropInlinedIcons],
});

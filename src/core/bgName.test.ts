/* 背景の 絵の 名まえが、ゲームを よぶ ときの 名まえと そろって いるか。

   背景は 「public/art/bg/ に 置く だけで 出る」つくり。だから 名まえが 1文字でも
   ちがうと、絵は 届いて いるのに 永遠に 出ない ── しかも 画面は こわれないので
   だれも 気づかない。実際に care(おせわ)と yatai(ふつうの おまつり)の 2つは
   発注リストの 名まえ(defense / festival)と ずれて いた。

   ここで 「コードが よぶ 名まえ」と 「発注リストに ある 絵の 名まえ」を
   つき合わせて おく。ゲームを 足した ときに ずれたら ここで 落ちる。 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GAME_DATA } from '../data/gameData';
import { bgNameOf } from './bgName';


/** 発注リストに ある 背景の 名まえ(bg-xxx) */
const listed = new Set(
  [...readFileSync('docs/ART_ASSET_LIST.md', 'utf8').matchAll(/`(bg-[a-z0-9]+)\.svg`/g)].map((m) => m[1]),
);

/** ゲームを よぶ ときの 名まえ ぜんぶ(収穫の エンジン + おまつり) */
const runtimeKeys = (): string[] => {
  const keys = new Set<string>(['care', 'fish', 'yatai']); // データに 出てこない 既定の ゲーム
  for (const m of GAME_DATA.materials) {
    const g = m.gather;
    if (g.type === 'plant') keys.add(g.harvest.engine);
  }
  for (const r of GAME_DATA.recipes) {
    if (r.festGame) keys.add(r.festGame);
  }
  return [...keys];
};

describe('背景の 絵の 名まえ', () => {
  it('コードが よぶ 名まえは ぜんぶ 発注リストに ある', () => {
    const missing = runtimeKeys()
      .map((k) => ({ key: k, bg: bgNameOf(k) }))
      .filter((x) => !listed.has(x.bg));
    expect(
      missing,
      `この ゲームの 背景を 置いても 出ない(名まえが 発注リストと ちがう)。\n` +
        `ui/bgArt.ts の ALIAS に 足すか、発注リストの 名まえを そろえること:\n` +
        missing.map((x) => `  ${x.key} → ${x.bg}.svg`).join('\n'),
    ).toEqual([]);
  });

  it('発注リストの 背景は ぜんぶ どこかの ゲームで つかわれる', () => {
    const used = new Set(runtimeKeys().map(bgNameOf));
    const unused = [...listed].filter((b) => !used.has(b));
    expect(unused, `だれも よばない 背景を 発注して いる: ${unused.join(' ')}`).toEqual([]);
  });

  it('名まえの 言いかえは ずれて いる 2つ だけ', () => {
    expect(bgNameOf('care')).toBe('bg-defense');
    expect(bgNameOf('yatai')).toBe('bg-festival');
    expect(bgNameOf('flick')).toBe('bg-flick');
  });
});

/* アイコンの 整合性テスト。
   ねらい:
   1. データが 指している かたちが ほんとうに あるか(つづり違い・消し忘れの 検出)
   2. **絵文字が しのびこんでいない か**(ユーザー要望: 安っぽい 絵文字は つかわない)
      → あたらしい コードで つい 絵文字を 書いたら ここで 落ちる */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAME_DATA } from '../../data/gameData';
import { hasShape } from './registry';

/* ---------- 1. データの アイコンキーが 実在するか ---------- */

/** データの 中から icon 系の フィールドを ぜんぶ 集める */
const collectIconKeys = (): { where: string; key: string }[] => {
  const out: { where: string; key: string }[] = [];
  const walk = (v: unknown, path: string): void => {
    if (Array.isArray(v)) {
      v.forEach((x, i) => walk(x, `${path}[${i}]`));
      return;
    }
    if (!v || typeof v !== 'object') return;
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      const isIconField = /^(icon|targetIcon|unripeIcon|turningIcon|bIcon|markerIcon)$/.test(k);
      if (isIconField && typeof val === 'string') out.push({ where: `${path}.${k}`, key: val });
      else if (k === 'stageIcons' && Array.isArray(val)) {
        val.forEach((s, i) => {
          if (typeof s === 'string') out.push({ where: `${path}.${k}[${i}]`, key: s });
        });
      } else walk(val, `${path}.${k}`);
    }
  };
  walk(GAME_DATA, 'GAME_DATA');
  return out;
};

describe('アイコンキー', () => {
  const keys = collectIconKeys();

  it('データが つかっている かたちは ぜんぶ 実装されている', () => {
    expect(keys.length).toBeGreaterThan(400); // そざい124+レシピ282+エリア7+…
    for (const { where, key } of keys) {
      const [shape] = key.split(':');
      expect(hasShape(shape), `${where} の かたち「${shape}」が ない`).toBe(true);
    }
  });

  it('そざい・レシピ・エリアの ぜんぶに icon が ある', () => {
    for (const m of GAME_DATA.materials) expect(m.icon, `そざい ${m.id}`).toBeTruthy();
    for (const r of GAME_DATA.recipes) expect(r.icon, `レシピ ${r.id}`).toBeTruthy();
    for (const g of GAME_DATA.regions) expect(g.icon, `エリア ${g.id}`).toBeTruthy();
  });
});

/* ---------- 2. 絵文字の しのびこみ 検出 ---------- */

/** 絵文字と、絵文字がわりに つかわれがちな きごう */
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2190}-\u{21FF}\u{2460}-\u{24FF}★☆♪♨]/u;

/** 絵文字を のこして よい ファイル(いまは なし。ふやさない) */
const ALLOW: string[] = [];

const tsFiles = (dir: string, acc: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) tsFiles(p, acc);
    else if (name.endsWith('.ts')) acc.push(p);
  }
  return acc;
};

describe('絵文字を つかっていない', () => {
  it('src 配下の コードに 絵文字が のこっていない', () => {
    const offenders: string[] = [];
    for (const f of tsFiles('src')) {
      const rel = f.replace(/\\/g, '/');
      if (ALLOW.some((a) => rel.endsWith(a))) continue;
      if (rel.endsWith('.test.ts')) continue; // テストの 説明文は 画面に 出ない
      // コメントは 対象外(「なにを 置きかえたか」の 説明で 絵文字を 書くのは OK。
      // 画面に 出るのは コードの 文字列だけ なので、そこだけ 見る)
      const text = readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
        .replace(/\/\/[^\n]*/g, '');
      for (const [i, l] of text.split('\n').entries()) {
        const m = EMOJI_RE.exec(l);
        if (m) offenders.push(`${rel}:${i + 1} 「${m[0]}」 ${l.trim().slice(0, 60)}`);
      }
    }
    expect(offenders, `絵文字を アイコン(src/ui/icons)に かえること:\n${offenders.join('\n')}`).toEqual([]);
  });
});

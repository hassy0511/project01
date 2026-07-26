/* ゲーム内テキストの きまりごとを まもる テスト。
   ・こどもが よむ ぶん(settings より 前)には 漢字を つかわない
   ・「Xの X…」のように そざい名と ばしょ名が かさならない */
import { describe, expect, it } from 'vitest';
import { festIntroOf, TITLE_TEXT, UI_TEXT } from './uiText';
import { GAME_DATA } from './gameData';

/** ひらがな・カタカナ・すうじ・きごう だけで 書く(おうちのひと むけは べつ) */
const KANJI = /[一-鿿]/;

/** UI_TEXT の 中の 文字列を ぜんぶ ならべる(かんすうは よんで みる) */
const collectStrings = (v: unknown, path: string, out: { where: string; text: string }[]): void => {
  if (typeof v === 'string') {
    out.push({ where: path, text: v });
    return;
  }
  if (typeof v === 'function') {
    // ひきすうは 「あ」「1」で ためす(中の 文だけを 見たい)
    const f = v as (...a: unknown[]) => unknown;
    for (const args of [[], ['あ'], ['あ', 'い'], [1], [1, 2], ['あ', 1]]) {
      try {
        const r = f(...args);
        if (typeof r === 'string') {
          out.push({ where: `${path}()`, text: r });
          break;
        }
      } catch {
        // ひきすうが あわなければ つぎの かたちで ためす
      }
    }
    return;
  }
  if (Array.isArray(v)) {
    v.forEach((x, i) => collectStrings(x, `${path}[${i}]`, out));
    return;
  }
  if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      collectStrings(val, `${path}.${k}`, out);
    }
  }
};

describe('uiText', () => {
  it('タイトル文言が定義されている', () => {
    expect(TITLE_TEXT.length).toBeGreaterThan(0);
  });

  it('こどもが よむ ぶんに 漢字が ない', () => {
    const out: { where: string; text: string }[] = [];
    // settings は おうちのひと むけ(漢字で よい)なので のぞく
    for (const [k, v] of Object.entries(UI_TEXT)) {
      if (k === 'settings') continue;
      collectStrings(v, `UI_TEXT.${k}`, out);
    }
    const bad = out.filter((x) => KANJI.test(x.text)).map((x) => `${x.where}: ${x.text.slice(0, 40)}`);
    expect(bad, `ひらがなに かえること:\n${bad.join('\n')}`).toEqual([]);
  });

  it('そざいの ばしょの 見だしが 「Xの X…」に ならない', () => {
    const bad: string[] = [];
    for (const m of GAME_DATA.materials) {
      const g = m.gather;
      const label = g.type === 'plant' ? g.fieldLabel : undefined;
      const shown = UI_TEXT.pref.fieldName(m.name, label);
      // 名まえが 2かい でてきたら かさなっている
      if (shown.split(m.name).length - 1 > 1) bad.push(`${m.id}: ${shown}`);
    }
    expect(bad, `ばしょの 見だしが かさなっている:\n${bad.join('\n')}`).toEqual([]);
  });

  it('おまつりゲームの 説明文が ぜんぶ ある(名まえの きまりで ひける)', () => {
    const missing: string[] = [];
    for (const r of GAME_DATA.recipes) {
      const kind = r.festGame;
      if (!kind || kind === 'yatai') continue; // やたいは introBody を つかう
      if (!festIntroOf(kind)) missing.push(`${r.id}(${kind})`);
    }
    expect(missing, `uiText.fest に intro… が ない:\n${missing.join('\n')}`).toEqual([]);
  });
});

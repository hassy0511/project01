/* 絵の 発注リストを コードと データから 自動生成する。
   手で ならべると すぐ ずれるので、いつでも 作り直せる ように する。

   出力: docs/ART_ASSET_LIST.md
   実行: node scripts/gen-art-list.mjs

   何を あつめているか
     1. かたち(181) … src/ui/icons/*.ts の Record キーと、その 上の JSDoc コメント
     2. いろ         … データ/コードで じっさいに つかわれている `かたち:いろ`
     3. つかいみち   … その かたちを つかう そざい・レシピ・エリア・ミニゲーム
     4. 表示サイズ   … addIcon(..., key, N) の N。小さく 出る ものは 単純に 描く 必要がある
     5. せかい(背景) … ミニゲーム59本の ファイル先頭コメント(何の ゲームか) */
import fs from 'fs';
import path from 'path';

const ICON_DIR = 'src/ui/icons';
const ICON_FILES = ['food.ts', 'actors.ts', 'nature.ts', 'props.ts', 'ui.ts'];
const GROUP_NAME = {
  'food.ts': 'そざい・りょうり',
  'actors.ts': 'ひと・いきもの',
  'nature.ts': 'しぜん・けしき',
  'props.ts': 'どうぐ・おまつりの もの',
  'ui.ts': 'きごう(UI)',
};

/* ---------- 1. かたちと せつめい ---------- */
/** `  /** せつめい *​/\n  なまえ: (g, c) => {` を ひろう */
const shapes = new Map(); // name -> { group, desc }
for (const f of ICON_FILES) {
  const src = fs.readFileSync(path.join(ICON_DIR, f), 'utf8');
  const re = /(?:\/\*\*\s*([\s\S]*?)\s*\*\/\s*)?\n\s{2}'?([a-z][a-z0-9-]*)'?:\s*\(g,\s*c\)\s*=>/g;
  let m;
  while ((m = re.exec(src))) {
    const desc = (m[1] ?? '').replace(/\s*\n\s*/g, ' ').trim();
    shapes.set(m[2], { group: GROUP_NAME[f], desc });
  }
}

/* ---------- 2. つかわれている いろ ---------- */
const walk = (dir, acc = []) => {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) acc.push(p);
  }
  return acc;
};
const srcFiles = walk('src');
const KEY_RE = /'([a-z][a-z0-9-]*:[a-z]+)'/g;
const colorsOf = new Map(); // shape -> Set<color>
const sizesOf = new Map(); // shape -> Set<number>
for (const f of srcFiles) {
  if (f.includes(`${path.sep}icons${path.sep}`)) continue;
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(KEY_RE)) {
    const [shape, color] = m[1].split(':');
    if (!colorsOf.has(shape)) colorsOf.set(shape, new Set());
    colorsOf.get(shape).add(color);
  }
  // addIcon(scene, x, y, KEY, SIZE) / addIcon(..., 'key', 34)
  for (const m of s.matchAll(/addIcon\([^,]+,[^,]+,[^,]+,\s*([^,]+),\s*([A-Za-z0-9_.? :]+)\)/g)) {
    const key = m[1].trim();
    const size = Number.parseInt(m[2].trim(), 10);
    if (!Number.isFinite(size)) continue;
    const lit = key.match(/^'([a-z][a-z0-9-]*):/);
    const shape = lit ? lit[1] : null;
    if (!shape) continue;
    if (!sizesOf.has(shape)) sizesOf.set(shape, new Set());
    sizesOf.get(shape).add(size);
  }
}

/* ---------- 3. つかいみち(データからの 逆引き) ---------- */
const data = fs.readFileSync('src/data/gameData.ts', 'utf8');
const usedBy = new Map(); // shape -> Set<string>
const addUse = (key, label) => {
  if (!key) return;
  const shape = key.split(':')[0];
  if (!usedBy.has(shape)) usedBy.set(shape, new Set());
  usedBy.get(shape).add(label);
};
/** `{ id: 'xNN', name: '…', icon: '…'` から つづく ブロックを 1件ずつ 見る */
for (const block of data.split(/(?=\{ id: '(?:m|r|rf)\d+', name:)/)) {
  const head = block.match(/^\{ id: '((?:m|r|rf)\d+)', name: '([^']+)'/);
  if (!head) continue;
  const body = block;
  const name = head[2];
  for (const m of body.matchAll(/(icon|targetIcon|unripeIcon|turningIcon|bIcon|markerIcon)\s*:\s*'([^']+)'/g)) {
    const what = { icon: '', targetIcon: '(しゅうかく中)', unripeIcon: '(まだ はやい)', turningIcon: '(いろづきかけ)', bIcon: '(たてもの)', markerIcon: '(ねらう もの)' }[m[1]];
    addUse(m[2], `${name}${what}`);
  }
  for (const m of body.matchAll(/stageIcons\s*:\s*\[([^\]]*)\]/g)) {
    const ks = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
    ks.forEach((k, i) => addUse(k, `${name}(えんしゅつ${i + 1})`));
  }
}
for (const m of data.matchAll(/\{ id: '(\w+)', name: '([^']+)', kanji: '[^']*',[^\n]*?icon: '([^']+)'/g)) {
  addUse(m[3], `エリア ${m[2]}`);
}
// コード側: どの ミニゲームで つかうか
for (const f of srcFiles) {
  if (f.includes(`${path.sep}icons${path.sep}`) || f.includes(`${path.sep}data${path.sep}`)) continue;
  const s = fs.readFileSync(f, 'utf8');
  const where = path.basename(f).replace(/\.ts$/, '');
  for (const m of s.matchAll(KEY_RE)) addUse(m[1], `${where}`);
}

/* ---------- 4. せかい(ミニゲームの 背景) ---------- */
const games = [];
for (const f of fs.readdirSync('src/scenes/minigames')) {
  if (!f.endsWith('Game.ts')) continue;
  const s = fs.readFileSync(path.join('src/scenes/minigames', f), 'utf8');
  const head = s.match(/^\/\*([\s\S]*?)\*\//);
  const desc = (head?.[1] ?? '').replace(/\s*\n\s*/g, ' ').trim();
  // 背景に つかっている 色(だいたいの 雰囲気を つかむ ため)
  const cols = [...s.matchAll(/fill(?:Gradient)?Style\((0x[0-9a-f]{6})/g)].map((m) => m[1]);
  games.push({ name: f.replace(/Game\.ts$/, ''), desc, cols: [...new Set(cols)].slice(0, 6) });
}
games.sort((a, b) => a.name.localeCompare(b.name));

/* ---------- 出力 ---------- */
const L = [];
const missing = [];
L.push('<!-- このファイルは scripts/gen-art-list.mjs が つくります。手で 直さないこと。');
L.push('     せつめい文を なおしたい ときは src/ui/icons/*.ts の JSDoc を なおして 作り直す。 -->');
L.push('');
L.push('# 絵の 発注リスト(自動生成)');
L.push('');
L.push('絵の かきかたの きまりは [ART_DIRECTION.md](./ART_DIRECTION.md) を 先に よむこと。');
L.push('この ファイルは 「何を 何個 描くか」だけを ならべた ものです。');
L.push('');
L.push(`- かたち: **${shapes.size}**`);
L.push(`- いろちがいを ふくめた のべ数: **${[...colorsOf.values()].reduce((n, s) => n + s.size, 0)}**`);
L.push(`- せかい(ミニゲームの 背景): **${games.length}**`);
L.push('');
L.push('いろは かたち1つに つき 1まいの SVG を つくり、`#MAIN` / `#DARK` の 2つの');
L.push('プレースホルダを アプリ側が いろに おきかえます(ART_DIRECTION.md の 「いろの しくみ」)。');
L.push('つまり **描くのは かたちの 数だけ**で、いろちがいは 描かなくて よい。');
L.push('');

const byGroup = new Map();
for (const [name, info] of shapes) {
  if (!byGroup.has(info.group)) byGroup.set(info.group, []);
  byGroup.get(info.group).push(name);
}
for (const [group, names] of byGroup) {
  L.push(`## ${group}(${names.length})`);
  L.push('');
  L.push('| ファイル | 何を 描くか | つかう いろ | 出る 大きさ(px) | どこで つかう |');
  L.push('|---|---|---|---|---|');
  for (const name of names.sort()) {
    const info = shapes.get(name);
    const cols = [...(colorsOf.get(name) ?? [])].sort();
    const sizes = [...(sizesOf.get(name) ?? [])].sort((a, b) => a - b);
    const uses = [...(usedBy.get(name) ?? [])].sort();
    if (!info.desc) missing.push(name);
    const sizeCell = sizes.length ? `${sizes[0]}〜${sizes[sizes.length - 1]}` : '—';
    const useCell = uses.length > 4 ? `${uses.slice(0, 4).join(' / ')} ほか${uses.length - 4}` : uses.join(' / ') || '—';
    L.push(`| \`${name}.svg\` | ${info.desc || '**せつめい なし(要記入)**'} | ${cols.join(' ') || '—'} | ${sizeCell} | ${useCell} |`);
  }
  L.push('');
}

L.push('## せかい(ミニゲームの 背景・小道具)');
L.push('');
L.push('いまは コードで しかくと まるを ならべて 描いています。');
L.push('1本ずつ 「その まつり・その しごとの 場所」に 見える 背景が ほしい。');
L.push('画面は たて480×748(アイコンと おなじ 座標系)。人物や 道具は アイコンで のせるので、');
L.push('**背景は 場所だけ**を 描く(人・道具は 描きこまない)。');
L.push('');
L.push('| ファイル | ゲーム | どんな 場所か(コードの せつめいより) | いまの 色 |');
L.push('|---|---|---|---|');
for (const g of games) {
  L.push(`| \`bg-${g.name}.svg\` | ${g.name} | ${g.desc.slice(0, 160)} | ${g.cols.join(' ')} |`);
}
L.push('');

if (missing.length) {
  L.push('## せつめいが 足りない かたち');
  L.push('');
  L.push('下の かたちは JSDoc コメントが ないので 「何を 描くか」が わかりません。');
  L.push('`src/ui/icons/*.ts` に コメントを 足して この ファイルを 作り直してください。');
  L.push('');
  for (const n of missing) L.push(`- \`${n}\``);
  L.push('');
}

fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/ART_ASSET_LIST.md', `${L.join('\n')}\n`);
console.log(`docs/ART_ASSET_LIST.md を つくりました: かたち ${shapes.size} / 背景 ${games.length} / せつめいなし ${missing.length}`);

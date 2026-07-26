/* 絵文字 → ベクターアイコン(src/ui/icons)の 機械置換ツール(開発用・1回かぎりの 移行作業)。
   よくある かきかた
     scene.add.text(x, y, '🐟', { fontSize: '30px' }).setOrigin(0.5)
   を
     addIcon(scene, x, y, 'fish:sky', 30)
   に かえる。むずかしい ところ(setText で 絵を かえる・文の 中の 絵文字)は
   のこして 一覧で 報告するので、人が 手で 直す。

   使い方: node scripts/deemoji.mjs [--write] [ファイル...] */
import fs from 'fs';
import path from 'path';

/** 絵文字 → アイコンキー。実物の「なにもの か」で えらぶ */
export const MAP = {
  // ひと
  '🧑': 'person:teal', '👨': 'person:navy', '👩': 'person:pink', '👴': 'person:gray', '👵': 'person:gray',
  '👦': 'person-child:sky', '👧': 'person-child:pink', '🧒': 'person-child:amber', '🧍': 'person:gray',
  '👘': 'person-kimono:crimson', '💃': 'person-dancer:pink', '🏃': 'person-runner:sky',
  '🚒': 'person-worker:red', '👒': 'person-worker:tan', '🤝': 'crowd:teal', '🙌': 'hand:tan',
  '👐': 'hand:tan', '🤲': 'hand:tan', '🖐': 'hand:tan', '👏': 'hand-clap:tan', '🦶': 'foot:tan', '👣': 'foot:gray',
  // かお・きもち
  '😄': 'face-smile:cream', '🙂': 'face-smile:cream', '😋': 'face-smile:cream', '😢': 'face-sad:cream',
  '😵': 'face-surprised:cream', '😳': 'face-surprised:cream', '💢': 'face-angry:cream',
  '🤡': 'mask:red', '🎭': 'mask:violet', '👹': 'oni:crimson', '👺': 'tengu:red', '🦊': 'foxmask:orange',
  // いきもの
  '🐟': 'fish:sky', '🐠': 'fish:amber', '🐡': 'pufferfish:cream', '🐋': 'whale:blue', '🦀': 'crab:red',
  '🐦': 'bird:teal', '🐸': 'frog:green', '🦌': 'deer:brown', '🐮': 'cow:dark', '🐴': 'horse:brown',
  '🐉': 'dragon:green', '🐤': 'chick:amber',
  // しぜん
  '🔥': 'fire:orange', '✨': 'sparkle:gold', '🌟': 'sparkle:gold', '⭐': 'star:gold', '🌸': 'sakura:pink',
  '🌺': 'hibiscus:pink', '🌲': 'tree:deepgreen', '🌴': 'tree:green', '🌾': 'grain:amber', '🍓': 'strawberry:red',
  '🎍': 'bamboo:lime', '🪵': 'log:tan', '🪨': 'rock:gray', '⬛': 'stone:dark', '⛄': 'snowman:white',
  '💧': 'drop:sky', '💦': 'splash:sky', '♨': 'hotspring:sky', '🗾': 'pin:orange',
  // おまつり・どうぐ
  '🏮': 'lantern:crimson', '⛩': 'shrine:red', '🎎': 'person-kimono:violet', '🥁': 'drum:crimson',
  '🪘': 'drum:brown', '🪭': 'fan:crimson', '🪇': 'naruko:red', '🪈': 'flute:tan', '🎻': 'flute:brown',
  '🎤': 'flute:gray', '🎶': 'note:purple', '🔔': 'lantern:gold', '🎈': 'balloon:red', '🪁': 'kite:sky',
  '⛵': 'boat:navy', '🏯': 'castle:cream', '🏠': 'house:teal', '🧺': 'basket:tan', '🥄': 'ladle:tan',
  '🗡': 'knife:silver', '🎀': 'flag:pink', '🚩': 'flag:red', '🎌': 'flag:crimson', '📯': 'flute:gold',
  '🎉': 'sparkle:gold', '🎆': 'sparkle:amber', '🍽': 'plate:cream', '🤍': 'heart:white',
  '🙆': 'person-dancer:teal', '🙋': 'person-dancer:amber', '🤹': 'person-dancer:violet', '🤕': 'face-sad:cream',
  // きごう
  '★': 'star:gold', '☆': 'star-empty:tan', '✕': 'cross:gray', '✖': 'cross:gray', '✓': 'check:green',
  '🎯': 'target:teal', '⬆': 'arrow-up:navy', '⬇': 'arrow-down:navy', '⬅': 'arrow-left:navy', '➡': 'arrow-right:navy',
};

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const WRITE = process.argv.includes('--write');
const targets = files.length
  ? files
  : fs
      .readdirSync('src/scenes/minigames')
      .filter((f) => f.endsWith('.ts'))
      .map((f) => path.join('src/scenes/minigames', f));

let done = 0;
const leftovers = [];

for (const file of targets) {
  let src = fs.readFileSync(file, 'utf8');
  const before = src;
  const emojiClass = Object.keys(MAP).join('');
  const E = `[${emojiClass}]`;

  /* 1) scene.add.text(x, y, 'E', { fontSize: 'Npx' })(+ .setOrigin(0.5))→ addIcon(scene, x, y, key, N) */
  const rxText = new RegExp(
    `(?<obj>scene|this)\\.add\\s*\\n?\\s*\\.text\\(\\s*(?<x>[^,]+?),\\s*(?<y>[^,]+?),\\s*'(?<e>${E})'\\s*,\\s*\\{[^}]*fontSize:\\s*'(?<sz>\\d+)px'[^}]*\\}\\s*\\)(\\s*\\.setOrigin\\(0\\.5(?:,\\s*0\\.5)?\\))?`,
    'g',
  );
  src = src.replace(rxText, (m, ...rest) => {
    const g = rest[rest.length - 1];
    const key = MAP[g.e];
    if (!key) return m;
    const scene = g.obj === 'this' ? 'this' : 'scene';
    return `addIcon(${scene}, ${g.x.trim()}, ${g.y.trim()}, '${key}', ${g.sz})`;
  });

  /* 2) タプル・setText の 中の 絵文字は 機械的には なおせない(キー文字列が そのまま
        画面に 出てしまう)。--tuples を つけた ときだけ かえて、人が 目で 確かめる */
  if (process.argv.includes('--tuples')) {
    src = src.replace(new RegExp(`'(${E})'`, 'g'), (m, e) => (MAP[e] ? `'${MAP[e]}'` : m));
  }

  if (src !== before) {
    if (!src.includes("from '../../ui/icons'") && !src.includes("from '../ui/icons'")) {
      const rel = file.includes('minigames') ? '../../ui/icons' : '../ui/icons';
      src = src.replace(/(import [^\n]*from 'phaser';\n)/, `$1import { addIcon } from '${rel}';\n`);
    }
    if (WRITE) fs.writeFileSync(file, src);
    done++;
  }
  // のこった 絵文字(手で 直す ぶん)
  const rest = [...src.matchAll(new RegExp(E, 'g'))].map((m) => m[0]);
  if (rest.length) leftovers.push(`${file}: ${[...new Set(rest)].join('')} (${rest.length})`);
}

console.log(`${WRITE ? '書きかえた' : '書きかえ予定'} ファイル: ${done}/${targets.length}`);
if (leftovers.length) {
  console.log('\n手で 直す ぶん:');
  for (const l of leftovers) console.log(' ', l);
}

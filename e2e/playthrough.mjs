/* 受け入れテスト: 開拓→たねまき→⏩→アーケード収穫→レシピ→クラフト→うめまつり の一周を
   実ブラウザのUIクリックでプレイし、セーブ状態を検証する。
   ゲームは fastMode(時間1/8)で回し、全エンジンの完走と成功保証(★1の床)を確認する。
   実行: npm run test:e2e(ビルド+preview サーバー起動込み) */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from './helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('./shots', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
const d = makeDriver(page, SHOTS);
const log = (s) => console.log('✔ ' + s);

/* ---- セーブをリセット・fastMode で開始 ---- */
await page.goto(BASE_URL);
await page.waitForSelector('canvas');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('canvas');
await page.waitForTimeout(1500);
await page.evaluate(() => window.__mqAdmin.fastMode());

/* 0. 導入ストーリー(初回のみ)→ スキップ → にほんぜんこく → かんとうへ */
await d.waitText('スキップ');
await page.screenshot({ path: `${SHOTS}/story-intro.png` });
await d.clickText('スキップ');
await d.waitText('🗾 にっぽん ぜんこく');
await d.clickText('かんとう');
await page.waitForTimeout(600);
await d.waitText('🗾 にっぽん'); // 地図に到着
log('導入ストーリー(スキップ)→ にほんぜんこく → かんとう');

/** 収穫一連(しゅうかく!→アーケード→クイズ正解→もどる→トリビア) */
async function harvestFlow(interact = null) {
  await d.playArcade(interact);
  await d.answerQuiz();
  await d.waitText('もどる');
  await d.clickText('もどる');
  await d.dismissTrivia();
}

/* 1. いばらき開拓(県名を当てる1問。名前は事前に明かされない) */
// 地図クリック座標: MapScene の scale=min(460/364,560/407)≈1.263, offX≈10, offY=80
await page.mouse.click(10 + 276 * 1.263, 80 + 155 * 1.263);
await d.clickText('ちょうせん する!');
await d.answerQuiz();
await d.waitText('かいたく せいこう!');
await d.clickText('いばらきけんに いく!');
log('いばらき開拓(1問制)');

/* 2. こめ(reap): いねを うえる → ⏩ → チェーンなぞり。米はもう infra ストックではない */
await d.waitText('いねを うえる');
await d.clickText('いねを うえる');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.clickText('しゅうかく!');
await harvestFlow(async () => {
  // 熟した🌾をなぞる(タップでも収穫できる)
  const t = await d.findTexts('🌾');
  if (t.length) await page.mouse.click(t[0].x, t[0].y);
});
log('こめ(いねかり=reap アーケード)');

/* 3. うめ(catch): 落ちてくる実をかごでキャッチ */
await d.scrollAndClick('なえを うえる');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await harvestFlow(async () => {
  // 落下中の実の真下へかごを動かす
  const t = await d.findTexts('🫒');
  if (t.length) await page.mouse.move(t[0].x, 700);
});
log('うめ(キャッチ アーケード)');

/* 4. ねんど(mine): 採掘。上の列から掘る */
await d.scrollAndClick('ほりに いく');
await d.playArcade(async () => {
  // 上の列(y≈216+52)を順にタップして掘り進める
  for (let col = 0; col < 5; col++) {
    await page.mouse.click(52 + col * 92 + 43, 268);
  }
});
await d.answerQuiz();
await d.waitText('もどる');
await d.clickText('もどる');
await d.dismissTrivia();
log('ねんど(採掘 アーケード)');

/* 5. いど回収(みず: 唯一の infra) */
await d.scrollAndClick('くみあげる');
await d.dismissTrivia();
log('いど回収(みず×3 ★2)');

/* 6. うめジュース: レシピ取得 → クラフト(うめが★1×1でも うめ2個必要 → もう1回収穫) */
await d.scrollAndClick('なえを うえる');
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await harvestFlow();
log('うめ 2回目(ノー操作でも★1保証で完走)');

await d.scrollAndClick('レシピを さがす', 2); // r01,r02,[r03]
await d.clickText('クイズに ちょうせん!');
await d.answerQuiz();
await d.answerQuiz();
await d.clickText('やったー!');
await d.scrollAndClick('つくる');
await d.clickText('つくる!');
await d.waitText('やったー!');
await d.clickText('やったー!');
await d.dismissTrivia();
log('うめジュース(レシピ探索→クラフト)');

/* 7. かさまやき: ねんどをもう1回掘って2個確保 → クラフト */
await d.scrollAndClick('ほりに いく');
await d.playArcade(async () => {
  for (let col = 0; col < 5; col++) await page.mouse.click(52 + col * 92 + 43, 268);
});
await d.answerQuiz();
await d.waitText('もどる');
await d.clickText('もどる');
await d.dismissTrivia();
await d.scrollAndClick('レシピを さがす', 3); // r01,r02,r04,[r05]
await d.clickText('クイズに ちょうせん!');
await d.answerQuiz();
await d.answerQuiz();
await d.clickText('やったー!');
await d.scrollAndClick('つくる', 1); // 0番目は材料切れの うめジュース
await d.clickText('つくる!');
await d.waitText('やったー!');
await d.clickText('やったー!');
await d.dismissTrivia();
log('かさまやき(産地指定クラフト)');

/* 8. うめまつり(やたいラッシュ アーケード) */
await d.scrollAndClick('ひらく!');
await d.clickText('おまつり スタート!');
await d.playArcade(async () => {
  // 3つの屋台(x=110/240/370, y=572+52)を順にタップ。
  // ほしがっている客がいれば得点、いなければコンボが切れるだけ
  for (const x of [110, 240, 370]) await page.mouse.click(x, 624);
});
await d.waitText('ちずを みる!', 10000);
await page.screenshot({ path: `${SHOTS}/festival-done.png` });
await d.clickText('ちずを みる!');
await d.dismissTrivia();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${SHOTS}/map-after-festival.png` });
log('うめまつり開催(やたいラッシュ)→ 地図に🏮');

/* 9. ちば開拓: わざと間違えて失敗 → 再挑戦で成功(失敗しても何度でも挑める) */
await page.mouse.click(10 + 260 * 1.263, 80 + 290 * 1.263);
await d.clickText('ちょうせん する!');
await d.answerQuizWrong();
await d.waitText('かいたく しっぱい…');
await d.clickText('もういちど ちょうせん!');
await d.clickText('ちょうせん する!');
await d.answerQuiz();
await d.waitText('かいたく せいこう!');
await d.clickText('ちばけんに いく!');
await d.scrollAndClick('りょうに でる');
await harvestFlow(async () => {
  const t = await d.findTexts('🐟');
  if (t.length) await page.mouse.click(t[0].x, t[0].y);
});
log('ちば開拓 → いわし(フィッシング アーケード)');

/* 10. おせわ(defense): メロン50%成長 → 害虫防衛 → careDone 記録 */
await d.clickText('← ちず');
await page.waitForTimeout(600);
await page.mouse.click(10 + 276 * 1.263, 80 + 155 * 1.263); // いばらき(開拓済み)
await d.waitText('くみあげる');
await d.scrollAndClick('たねを まく', 1); // だいず, [メロン], いちご
await page.evaluate(() => window.__mqAdmin.halfGrow());
await page.waitForTimeout(1600);
await d.scrollAndClick('おせわに いく!');
await d.playArcade(async () => {
  const t = await d.findTexts('🌀');
  if (t.length) await page.mouse.click(t[0].x, t[0].y);
});
await d.waitText('くみあげる', 12000); // おせわ完了 → 県画面へ戻る
const mid = await page.evaluate(() => JSON.parse(localStorage.getItem('meisanquest-save-v1')));
if (!mid.plots['ibaraki|m05']?.careDone) throw new Error('careDone flag expected');
log('おせわチャンス(ディフェンス)→ careDone 記録');

/* 11. メロン(flick): クイズをわざと間違えても最低★1で完走 */
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await d.playArcade();
await d.answerQuizWrong();
await d.waitText('もどる');
await d.clickText('もどる');
await d.dismissTrivia();
log('メロン(フリック アーケード。クイズ不正解でも★1保証)');

/* 12. いちご(pluck=ひっぱり収穫): ゆっくり下に引けば くきは切れない。
   あおい実を引いても ぷるんと もどるだけなので、どの実を引いても完走できる */
await d.scrollAndClick('たねを まく', 2); // だいず, メロン, [いちご]
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await harvestFlow(async () => {
  const t = await d.findTexts('🍓');
  if (!t.length) return;
  const f = t[0];
  await page.mouse.move(f.x, f.y);
  await page.mouse.down();
  for (let i = 1; i <= 7; i++) {
    await page.mouse.move(f.x, f.y + i * 20);
    await page.waitForTimeout(40);
  }
  await page.mouse.up();
});
log('いちご(つみとり アーケード)');

/* 12b. にほんぜんこく画面: ロック中エリアはトースト、かんとうから地図へ戻れる */
await d.clickText('← ちず');
await page.waitForTimeout(600);
await d.clickText('🗾 にっぽん');
await d.waitText('🗾 にっぽん ぜんこく');
await d.clickText('ほっかいどう'); // じゅんびちゅう(トーストのみ、遷移しない)
await d.waitText('🗾 にっぽん ぜんこく');
await page.screenshot({ path: `${SHOTS}/region-select.png` });
await d.clickText('かんとう');
await page.waitForTimeout(600);
await d.waitText('🗾 にっぽん'); // 地図に戻った(にっぽんボタンが見える)
log('にほんぜんこく画面(エリア選択UI)');

/* 12c. せってい → 保護者ゲート(かけ算テンキー) → 保護者メニュー → プライバシー表示 */
await d.clickText('⚙️');
await d.waitText('🔒 おうちのひと メニュー');
await d.clickText('🔒 おうちのひと メニュー');
await d.waitText('保護者の方へ');
const gateQ = await page.evaluate(() => {
  let v = null;
  for (const scene of window.__game.scene.getScenes(true)) {
    const walk = (list) => {
      for (const o of list) {
        if (o.list) walk(o.list);
        if (typeof o.text === 'string' && /^\d+ × \d+ = /.test(o.text)) v = o.text;
      }
    };
    walk(scene.children.list);
  }
  return v;
});
const gm = gateQ.match(/^(\d+) × (\d+)/);
for (const ch of String(Number(gm[1]) * Number(gm[2]))) {
  const keys = await d.findTexts(ch);
  const k = keys[keys.length - 1]; // 画面奥の数字と重複したらモーダル側(後着)を叩く
  await page.mouse.click(k.x, k.y);
  await page.waitForTimeout(120);
}
await d.clickText('OK');
await d.waitText('保護者メニュー');
await page.screenshot({ path: `${SHOTS}/parent-menu.png` });
await d.clickText('📄 プライバシーポリシー');
await d.waitText('プライバシーポリシー');
await d.clickText('とじる');
await page.waitForTimeout(300);
log('保護者ゲート(かけ算)→ 保護者メニュー → プライバシーポリシー');

/* 12d. 新県: ぐんま開拓(クイズローテーションで再挑戦時は別問題が出る) */
await page.mouse.click(10 + 92 * 1.263, 80 + 122 * 1.263); // ぐんま
await d.clickText('ちょうせん する!');
await d.answerQuiz();
await d.waitText('かいたく せいこう!');
await d.clickText('ぐんまけんに いく!');
await d.waitText('くみあげる'); // ぐんまにも いど(みず)がある
await page.screenshot({ path: `${SHOTS}/gunma-pref.png` });
await d.clickText('← ちず');
await page.waitForTimeout(600);
log('ぐんま開拓(新関東エリア)');

/* 12e. とうほく: おまつり3回までは くもの中(トースト)。全開放後は入れて、
   あおもりの ゆきしたにんじん(sweep=こすって雪はらい)を収穫できる */
await d.clickText('🗾 にっぽん');
await d.waitText('🗾 にっぽん ぜんこく');
await d.clickText('とうほく'); // まだ festBest は 1種 → 解放されずトースト
await d.waitText('🗾 にっぽん ぜんこく');
await page.evaluate(() => window.__mqAdmin.unlockAll());
await page.waitForTimeout(400);
await d.clickText('とうほく'); // 開拓済みの県ができたので入れる
await page.waitForTimeout(700);
await d.waitText('あおもり'); // とうほくの地図に到着
await page.screenshot({ path: `${SHOTS}/tohoku-map.png` });
const aomoriLabel = (await d.findTexts('あおもり'))[0];
await page.mouse.click(aomoriLabel.x, aomoriLabel.y);
await d.waitText('くみあげる'); // あおもりにも いど(みず)がある
await d.scrollAndClick('たねを まく'); // ゆきしたにんじん
await page.evaluate(() => window.__mqAdmin.boostAll());
await page.waitForTimeout(1600);
await d.scrollAndClick('しゅうかく!');
await harvestFlow(async () => {
  // 雪の山を こする(1れつめの あたりを 左右に なぞる)→ でてきた🥕を タップ
  await page.mouse.move(70, 245);
  await page.mouse.down();
  for (let i = 0; i < 10; i++) {
    await page.mouse.move(70 + (i % 2) * 70, 240 + (i % 3) * 6);
    await page.waitForTimeout(35);
  }
  await page.mouse.up();
  const carrots = await d.findTexts('🥕');
  for (const c of carrots.slice(0, 2)) await page.mouse.click(c.x, c.y);
});
log('とうほく解放 → あおもり ゆきしたにんじん(ゆきはらい=sweep アーケード)');
await d.clickText('← ちず');
await page.waitForTimeout(600);

/* 13. セーブ検証 */
const save = await page.evaluate(() => JSON.parse(localStorage.getItem('meisanquest-save-v1')));
const assert = (cond, msg) => {
  if (!cond) throw new Error('assert failed: ' + msg);
};
assert(save.unlocked.includes('ibaraki') && save.unlocked.includes('chiba'), 'unlocked');
assert(save.unlocked.includes('gunma'), 'gunma unlocked (新関東エリア)');
assert(save.fest.includes('rf1'), 'rf1 held');
assert(save.festBest?.rf1 >= 12, 'festival best score recorded');
assert(Array.isArray(save.quizRecent) && save.quizRecent.length > 0, 'quiz rotation history recorded');
assert(save.zukanMat.m22?.aomori >= 1, 'yukishita ninjin swept (tohoku)');
assert(save.currentRegion === 'tohoku', 'currentRegion tracks last visited region');
assert(save.zukanProd.r03 && save.zukanProd.r05, 'crafted r03/r05');
assert(save.zukanProd.r05.jimoto === true, 'r05 jimoto medal');
assert(save.zukanMat.m02?.ibaraki >= 1, 'kome harvested (not infra)');
assert(save.zukanMat.m06?.ibaraki >= 1, 'ume harvested');
assert(save.zukanMat.m07?.ibaraki >= 1, 'clay mined');
assert(save.zukanMat.m01?.ibaraki === 2, 'mizu ★2 (infra)');
assert(save.zukanMat.m09?.chiba >= 1, 'iwashi fished');
assert(save.zukanMat.m05?.ibaraki >= 1, 'melon obtained');
assert(save.zukanMat.m11?.ibaraki >= 1, 'strawberry obtained');
assert(!save.plots['ibaraki|m05'], 'melon plot cleared');
log('セーブ検証 OK');

if (errors.length) {
  console.error('page errors:', errors);
  process.exit(1);
}
console.log('\nALL E2E PLAYTHROUGH PASSED 🎉');
await browser.close();

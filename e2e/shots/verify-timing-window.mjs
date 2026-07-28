/* ふりこ型の 3本(だるま・山車・だんじり)で
   「ふつうの リズムで タップする 子」が ちゃんと 点を とれるか しらべる。

   もとの もんだい: はんていが 「タップした しゅんかんの ばしょの ずれ(px)」
   だった ので、しんどうが はやく なるほど あたり窓が じかんとして つぶれた。
     だるま  132ms → 74ms → とくだい 59ms
     山車    186ms → 70ms → 曳っかわせ 59ms
     だんじり 79ms(しかも 上手く なるほど カーソルが はやく なって せまく なる)
   59ms は 60fps で 3〜4フレーム。4〜8歳には まぐれ しか ない。

   なおしかた: core/timing.ts の じかん(ms)はんていに する。

   しらべかた: バラバラの リズムで 30回 タップして 「あたった かず」を 数える。
     ・0% は だめ(まぐれ しか ない = 直って いない)
     ・100% も だめ(どこを タップしても あたる = やりすぎ)
   ふりこと リズムは あわせて いない ので、あたり率は
   「1はくの なんわり が あたりか」に ちかづく(ねらいは 4わり)。

   実行: node e2e/shots/verify-timing-window.mjs(preview サーバーを 立ててから) */
import { chromium } from 'playwright';
import { CHROMIUM_PATH, makeDriver } from '../helpers.mjs';

const BASE_URL = process.env.MQ_BASE_URL ?? 'http://localhost:4273/project01/';
const SHOTS = new URL('.', import.meta.url).pathname;

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 480, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const d = makeDriver(page, SHOTS);
const problems = [];

const TAPS = 30;
/* ★タップの かんかくは わざと バラバラに する。
   一定リズム(700ms など)に すると ふりこの しゅうき(750ms など)と
   ほとんど 同じ になり、いつも 同じ ところで タップする ことに なる。
   すると 測った 率が 「窓の ひろさ」ではなく 「たまたまの 位相」に なる
   (実測: 直す まえの 山車が 30% と 60% で ばらけた)。
   400〜1000ms で ちらせば 位相が まんべんなく なり、
   率は ほんとうの 「窓 / 1はく」に ちかづく。
   たねは 固定 なので 毎回 同じ ならびに なる(ぶれない しらべ)。 */
const TAP_MIN_MS = 400;
const TAP_MAX_MS = 1000;
/** かんたんな 決まった らんすう(たねは 固定) */
let seed = 12345;
const nextGap = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return TAP_MIN_MS + (seed / 2147483648) * (TAP_MAX_MS - TAP_MIN_MS);
};
/** これより たかいと 「どこを タップしても あたる」 */
const MAX_RATE = 0.95;

/* ★下かぎりは ゲームごと。この しらべで 何が わかって 何が わからないかを
   はっきり させて おく(通ったから ぜんぶ 見た、に しない)。

   px はんていの あたり率は じつは しゅうきに よらず ほぼ 一定 だった:
     窓 = 2×OK_PX / 中心の はやさ、1はく = しゅうき/2。
     どちらも しゅうきに ひれい する ので 比は かわらない
     (だるまは 1700 / 950 / 760ms の どれでも 15.5%)。
   つまり 「率」を 見ても 「窓が 59ms に つぶれて いる」ことは 直接は 見えない。
   見えるのは 直した あと 率が 上がる こと。

   実測(バラバラの リズムで 30回。たねは 固定):
                直す まえ   直した あと
     だるま       7%        30%     ← はっきり さが 出る
     山車        30%        40%     ← さは 小さい
     だんじり     30%        30%     ← さが 出ない

   ・だるま は この しらべで 直った ことを 見られる(下かぎり 0.18)。
   ・山車 は さが 10ポイント しか なく、30回では ばらつき(σ≈9pt)に うもれる。
     下かぎりは 「まるごと こわれて いない か」の 見はり だけ。
   ・だんじり は そもそも さが 出ない。直しの 中身が
     「上手く なる(カーソルが はやく なる)ほど 窓が せまく なる」のを
     やめた こと で、それを 見るには わざと 上手く あそぶ 必要が ある。
   山車と だんじりの ほんとうの 保証は
     ・src/core/timing.test.ts の windowsFor / judgeByTime の ユニットテスト
     ・zoneW() を cursorSpeed() から 出して いる コード そのもの
   の 2つ。 */
const MIN_RATE = { daruma: 0.18, dashi: 0.2, danjiri: 0.15 };

const arcade = () =>
  page.evaluate(() => {
    const h = window.__mq;
    return h && h.kind === 'arcade' ? { engine: h.engine, score: h.score } : null;
  });

/** エリアを えらんで 県の おまつりに 入る */
const goFest = async (area, pref) => {
  await page.goto(BASE_URL);
  await page.waitForSelector('canvas');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__mqAdmin.skipGuides());
  await d.clickText('スキップ');
  await d.waitText('にっぽん ぜんこく');
  await d.clickText('かんとう');
  await page.waitForTimeout(700);
  await page.evaluate(() => window.__mqAdmin.unlockAll());
  await page.waitForTimeout(400);
  if (area) {
    await d.clickText('にっぽん');
    await d.clickText(area);
    await page.waitForTimeout(900);
  }
  const t = (await d.findTexts(pref))[0];
  if (!t) throw new Error(`県が みつからない: ${pref}`);
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(800);
  await d.startFest();
  await page.waitForTimeout(1600);
};

/** 一定リズムで タップして 「点が ふえた かず」を 数える */
const tapRhythm = async (x, y) => {
  let hits = 0;
  let prev = (await arcade())?.score ?? 0;
  for (let i = 0; i < TAPS; i++) {
    await page.mouse.click(x, y);
    await page.waitForTimeout(nextGap());
    const now = (await arcade())?.score ?? prev;
    if (now > prev) hits++;
    prev = now;
  }
  return hits;
};

const CASES = [
  { name: 'だるま',   engine: 'daruma',  area: null,   pref: 'ぐんま',   x: 240, y: 400 },
  { name: '山車',     engine: 'dashi',   area: null,   pref: 'さいたま', x: 240, y: 620 },
  { name: 'だんじり', engine: 'danjiri', area: 'きんき', pref: 'おおさか', x: 240, y: 560 },
];

for (const c of CASES) {
  await goFest(c.area, c.pref);
  const a = await arcade();
  if (!a) {
    problems.push(`${c.name}: おまつりが 始まって いない`);
    continue;
  }
  if (a.engine !== c.engine) {
    problems.push(`${c.name}: ちがう ゲームが 出た(engine=${a.engine})`);
    continue;
  }
  const hits = await tapRhythm(c.x, c.y);
  const rate = hits / TAPS;
  console.log(`${c.name.padEnd(8)} バラバラの リズムで ${TAPS}回 → あたり ${hits}回(${(rate * 100).toFixed(0)}%)`);
  const floor = MIN_RATE[c.engine];
  if (rate < floor) {
    problems.push(
      `${c.name}: あたり率 ${(rate * 100).toFixed(0)}% ─ せますぎる(${(floor * 100).toFixed(0)}% 以上 の はず)`,
    );
  }
  if (rate > MAX_RATE) {
    problems.push(`${c.name}: あたり率 ${(rate * 100).toFixed(0)}% ─ ひろすぎる(どこでも あたる)`);
  }
  await page.screenshot({ path: `${SHOTS}/timing-${c.engine}.png` });
}

await browser.close();
if (errors.length) console.error('PAGEERROR:', [...new Set(errors)].join(' | '));
if (problems.length) {
  console.error('もんだい:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('TIMING WINDOW OK');

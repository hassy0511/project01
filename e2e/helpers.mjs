/* E2E ヘルパ: Phaser のシーングラフからテキストを探してクリックする。
   ミニゲームの内部状態は window.__mq(src/game/testHooks.ts)を読む */
import { existsSync } from 'node:fs';

export const CHROMIUM_PATH =
  process.env.MQ_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

export function makeDriver(page, shotsDir) {
  const findTexts = (label, interactiveOnly = false) =>
    page.evaluate(({ lbl, io }) => {
      const out = [];
      for (const scene of window.__game.scene.getScenes(true)) {
        const walk = (list) => {
          for (const o of list) {
            if (o.list) walk(o.list);
            if (o.text !== undefined && o.text === lbl && o.visible) {
              if (io && !(o.input && o.input.enabled)) continue; // 演出用ゴーストを除外
              const m = o.getWorldTransformMatrix();
              // 原点が左寄せ等でも見た目の中心をクリックできるよう補正
              const cx = m.tx + (0.5 - (o.originX ?? 0.5)) * (o.displayWidth ?? 0);
              const cy = m.ty + (0.5 - (o.originY ?? 0.5)) * (o.displayHeight ?? 0);
              out.push({ x: cx, y: cy });
            }
          }
        };
        walk(scene.children.list);
      }
      out.sort((a, b) => a.y - b.y || a.x - b.x);
      return out;
    }, { lbl: label, io: interactiveOnly });

  async function waitText(label, timeout = 8000) {
    const t0 = Date.now();
    for (;;) {
      const found = await findTexts(label);
      if (found.length) return found;
      if (Date.now() - t0 > timeout) {
        await page.screenshot({ path: `${shotsDir}/99-fail.png` });
        throw new Error(`text not found: ${label}`);
      }
      await page.waitForTimeout(150);
    }
  }

  async function clickText(label, nth = 0) {
    const found = await waitText(label);
    if (!found[nth]) throw new Error(`text nth=${nth} not found: ${label} (have ${found.length})`);
    await page.mouse.click(found[nth].x, found[nth].y);
    await page.waitForTimeout(250);
  }

  async function answerQuiz() {
    await page.waitForFunction(() => window.__mq?.kind === 'quiz', null, { timeout: 8000 });
    const correct = await page.evaluate(() => {
      const t = window.__mq.correctText;
      window.__mq = { kind: 'done' }; // 次の問題のフックと混同しない
      return t;
    });
    await clickText(correct);
    await page.waitForTimeout(1000);
  }

  /** わざと不正解を選ぶ(★のおせわ保険・開拓失敗の検証用) */
  async function answerQuizWrong() {
    await page.waitForFunction(() => window.__mq?.kind === 'quiz', null, { timeout: 8000 });
    const { correctText, choices } = await page.evaluate(() => {
      const { correctText, choices } = window.__mq;
      window.__mq = { kind: 'done' };
      return { correctText, choices };
    });
    // 画面上に1箇所しか現れない選択肢を優先(開拓クイズの県名は地図ラベルと重複しうる)
    const wrongs = choices.filter((c) => c !== correctText);
    let target = wrongs[0];
    for (const w of wrongs) {
      if ((await findTexts(w)).length === 1) {
        target = w;
        break;
      }
    }
    const found = await waitText(target);
    const hit = found[found.length - 1]; // 重複時はモーダル側(下)を叩く
    await page.mouse.click(hit.x, hit.y);
    await page.waitForTimeout(1800); // 不正解時は遷移が長い
  }

  async function dismissTrivia() {
    const found = await findTexts('ずかんに とうろく!');
    if (found.length) {
      await page.mouse.click(found[0].x, found[0].y);
      await page.waitForTimeout(350);
    }
  }

  async function scrollList(dy) {
    await page.mouse.move(60, 620);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(60, 620 - (dy * i) / 8);
      await page.waitForTimeout(25);
    }
    await page.mouse.up();
    await page.waitForTimeout(250);
  }

  /** リスト内の要素へ: 見える位置までスクロールしてからクリック */
  async function scrollAndClick(label, nth = 0) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const found = await findTexts(label);
      if (found.length > nth) {
        const { x, y } = found[nth];
        if (y >= 170 && y <= 700) {
          await page.mouse.click(x, y);
          await page.waitForTimeout(300);
          return;
        }
        await scrollList(Math.max(-360, Math.min(360, y - 430)));
      } else {
        await scrollList(300);
      }
    }
    await page.screenshot({ path: `${shotsDir}/99-fail.png` });
    throw new Error(`scrollAndClick failed: ${label} nth=${nth}`);
  }

  /** アーケードゲーム: 少し遊んでから時間切れを待つ(fastMode 前提)。
   * interact が指定されればゲーム中に呼び続ける */
  async function playArcade(interact = null, timeout = 30000) {
    await page.waitForFunction(() => window.__mq?.kind === 'arcade', null, { timeout: 8000 });
    const t0 = Date.now();
    for (;;) {
      const hook = await page.evaluate(() => window.__mq);
      if (!hook || hook.kind !== 'arcade') break;
      if (Date.now() - t0 > timeout) throw new Error('arcade did not finish');
      if (interact) await interact(hook);
      await page.waitForTimeout(250);
    }
  }

  return {
    findTexts,
    waitText,
    clickText,
    answerQuiz,
    answerQuizWrong,
    dismissTrivia,
    scrollList,
    scrollAndClick,
    playArcade,
  };
}

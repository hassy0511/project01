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

  /** わざと不正解を選ぶ(★のおせわ保険の検証用) */
  async function answerQuizWrong() {
    await page.waitForFunction(() => window.__mq?.kind === 'quiz', null, { timeout: 8000 });
    const wrong = await page.evaluate(() => {
      const { correctText, choices } = window.__mq;
      window.__mq = { kind: 'done' };
      return choices.find((c) => c !== correctText);
    });
    await clickText(wrong);
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

  /** dig×N+クイズ を最後まで(正解マスは __mq.cell から) */
  async function digAllSteps() {
    for (;;) {
      await page.waitForFunction(() => window.__mq?.kind === 'dig' || window.__mq?.kind === 'quiz', null, {
        timeout: 8000,
      });
      const hook = await page.evaluate(() => window.__mq);
      if (hook.kind === 'quiz') break;
      await page.waitForTimeout(1100); // ✨ヒントが消えるまで
      const cx = 134 + (hook.cell % 3) * 106;
      const cy = 330 + Math.floor(hook.cell / 3) * 106;
      await page.mouse.click(cx, cy);
      await page.waitForTimeout(1000);
    }
    await answerQuiz();
  }

  /** timing×N+クイズ: __mq.pos が中央帯に入った瞬間に止める。
   * 成功時は「ひっぱれ!」連打フェーズ(__mq.kind==='reel')が挟まるので、それも捌く */
  async function timingAllSteps() {
    for (;;) {
      await page.waitForFunction(() => window.__mq?.kind === 'timing' || window.__mq?.kind === 'quiz', null, {
        timeout: 8000,
      });
      const hook = await page.evaluate(() => window.__mq);
      if (hook.kind === 'quiz') break;
      await page.waitForFunction(() => window.__mq?.kind === 'timing' && window.__mq.pos >= 44 && window.__mq.pos <= 56, null, {
        timeout: 8000,
        polling: 10,
      });
      const stop = await findTexts('あみを ひく!');
      if (stop.length) await page.mouse.click(stop[0].x, stop[0].y);
      await page.waitForTimeout(400);
      const afterStop = await page.evaluate(() => window.__mq);
      if (afterStop?.kind === 'reel') {
        for (let i = 0; i < 12; i++) {
          const cur = await page.evaluate(() => window.__mq);
          if (!cur || cur.kind !== 'reel') break;
          // ボタンラベルは「コンテナがinteractive・テキストは子」なので interactiveOnly は使わない
          const pull = await findTexts('ひっぱれ!');
          if (pull.length) await page.mouse.click(pull[0].x, pull[0].y);
          await page.waitForTimeout(200);
        }
        await page.waitForTimeout(900); // 「つれた!」演出 + advance
      } else {
        await page.waitForTimeout(1200); // ミス時の advance
      }
    }
    await answerQuiz();
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
    digAllSteps,
    timingAllSteps,
  };
}

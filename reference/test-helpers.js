/* テスト共通ヘルパー v0.3: infra/plant/harvest/care/instant すべて対応 */
const { JSDOM } = require("jsdom");
const fs = require("fs");

module.exports = function makeEnv(htmlFile = "index.html") {
  const html = fs.readFileSync(htmlFile, "utf8");
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/" });
  const w = dom.window;
  const doc = w.document;
  w.matchMedia = () => ({ matches: true });
  const realST = w.setTimeout.bind(w);
  w.setTimeout = (fn, ms) => realST(fn, 0);
  w.eval(fs.readFileSync("data.js", "utf8"));
  w.eval(fs.readFileSync("app.js", "utf8"));
  doc.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: true }));

  const D = w.GAME_DATA;
  const tick = () => new Promise((r) => realST(r, 5));
  const click = (n) => n.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  async function waitFor(cond, desc, tries = 800) {
    for (let i = 0; i < tries; i++) { const v = cond(); if (v) return v; await tick(); }
    throw new Error("TIMEOUT: " + desc);
  }
  const modalRoot = () => doc.querySelector("#modal-root");
  const modalText = () => modalRoot().textContent || "";
  const btnByText = (root, text) => [...root.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(text));
  const saveData = () => JSON.parse(w.localStorage.getItem("meisanquest-save-v1"));
  const sozaiCard = (name) => [...doc.querySelectorAll("#sozai-list .card")].find((c) => c.textContent.includes(name));

  /* モーダル内クイズを正解で解く(同一問文があるため選択肢一致で特定) */
  async function solveQuizzes() {
    let guard = 0;
    while (true) {
      if (++guard > 2000) throw new Error("solveQuizzes stuck");
      await tick();
      const q = modalRoot().querySelector(".quiz-q");
      if (q) {
        const wrap = modalRoot().querySelector(".choice-wrap");
        const displayed = [...wrap.children].map((b) => b.textContent.trim());
        const data = D.quizzes.find((z) => z.q === q.textContent && z.choices.length === displayed.length && z.choices.every((c) => displayed.includes(c)));
        if (!data) throw new Error("quiz not found: " + q.textContent);
        const correctText = data.choices[data.answer];
        click([...wrap.children].find((b) => b.textContent.trim() === correctText));
        await waitFor(() => !modalRoot().contains(q) || !modalRoot().innerHTML, "quiz advance");
      } else if (!modalRoot().querySelector(".choice")) break;
      if (!modalRoot().innerHTML) break;
    }
  }

  async function unlock(prefId, prefName) {
    click(doc.querySelector(`path[data-pref="${prefId}"]`));
    await waitFor(() => modalText().includes("かいたく しよう"), "kaitaku intro " + prefId);
    click(btnByText(modalRoot(), "ちょうせん する!"));
    await solveQuizzes();
    await waitFor(() => modalText().includes("かいたく せいこう"), "kaitaku success " + prefId);
    click(btnByText(modalRoot(), prefName + "けんに いく!"));
    await waitFor(() => doc.querySelector("#screen-pref.on"), "pref screen " + prefId);
  }

  async function goPref(prefId) {
    click([...doc.querySelectorAll(".nav-btn")].find((b) => b.dataset.go === "map"));
    await waitFor(() => doc.querySelector("#screen-map.on"), "map screen");
    click(doc.querySelector(`path[data-pref="${prefId}"]`));
    await waitFor(() => doc.querySelector("#screen-pref.on") || modalText().includes("かいたく しよう"), "pref or kaitaku " + prefId);
  }

  /* 未開拓なら開拓もこなして県画面へ */
  async function goPrefUnlocking(prefId, prefName) {
    await goPref(prefId);
    await tick();
    if (modalText().includes("かいたく しよう")) {
      click(btnByText(modalRoot(), "ちょうせん する!"));
      await solveQuizzes();
      await waitFor(() => modalText().includes("かいたく せいこう"), "unlocked " + prefId);
      click(btnByText(modalRoot(), prefName + "けんに いく!"));
      await waitFor(() => doc.querySelector("#screen-pref.on"), "pref screen " + prefId);
    }
  }

  /* 管理者ブースト: 設定 → まんたんボタン */
  async function debugBoost() {
    click(doc.querySelector("#btn-settings"));
    await waitFor(() => modalText().includes("せってい"), "settings modal");
    click(btnByText(modalRoot(), "⏩"));
    await waitFor(() => !modalRoot().innerHTML, "settings closed");
    await tick();
  }

  /* トースト/ものしりモーダルの後始末 */
  async function dismissTrivia() {
    await tick();
    if (modalText().includes("ものしりカード")) {
      click(btnByText(modalRoot(), "ずかんに とうろく!"));
      await waitFor(() => !modalRoot().innerHTML, "trivia closed");
    }
  }

  /* インフラ回収 */
  async function collect(matName) {
    const card = await waitFor(() => {
      const c = sozaiCard(matName);
      return c && c.classList.contains("infra") ? c : null;
    }, "infra card " + matName);
    click(card.querySelector("button.btn"));
    await dismissTrivia();
  }

  /* たねまき */
  async function plant(matName) {
    const card = await waitFor(() => {
      const c = sozaiCard(matName + "の はたけ");
      return c || null;
    }, "empty plot " + matName);
    click(card.querySelector("button.btn"));
    await waitFor(() => {
      const c = sozaiCard(matName);
      return c && c.textContent.includes("そだちちゅう");
    }, "growing " + matName);
  }

  /* セッション(grow画面)を解く。perfect=trueで全問正解・全ヒット */
  async function solveSession(perfect = true, tag = "") {
    let guard = 0;
    while (true) {
      if (++guard > 12000) throw new Error("session stuck " + tag + " (kind=" + (w.__mq && w.__mq.kind) + ")");
      await tick();
      if (modalRoot().querySelector(".star-row")) return "modal";
      if (!doc.querySelector("#screen-grow.on")) return "left";
      const mq = w.__mq || {};
      const box = doc.querySelector("#grow-box");
      if (!box) continue;
      if (mq.kind === "quiz") {
        const wrap = box.querySelector(".choice-wrap");
        if (wrap && !wrap.dataset.c) {
          wrap.dataset.c = "1";
          const btns = [...wrap.children];
          const t = perfect
            ? btns.find((b) => b.textContent.trim() === mq.correctText)
            : btns.find((b) => b.textContent.trim() !== mq.correctText);
          click(t);
        }
      } else if (mq.kind === "timing") {
        const btn = box.querySelector(".timing-stop");
        if (btn && !btn.dataset.c && ((perfect && mq.pos >= 45 && mq.pos <= 55) || (!perfect && (mq.pos < 25 || mq.pos > 75)))) {
          btn.dataset.c = "1"; click(btn);
        }
      } else if (mq.kind === "dig") {
        const grid = box.querySelector(".dig-grid");
        if (grid && grid.classList.contains("ready") && !grid.dataset.c) {
          grid.dataset.c = "1";
          click(grid.children[perfect ? mq.cell : (mq.cell + 1) % 9]);
        }
      } else if (mq.kind === "pluck") {
        const t = box.querySelector(".pluck-target:not(.popped)");
        if (t) click(t);
      } else if (mq.kind === "whack") {
        if (mq.active) {
          const t = box.querySelector(".pluck-target:not(.popped)");
          if (t) click(t);
        }
      }
    }
  }

  /* セッション終了処理(収穫モーダル→ものしり→県画面) */
  async function closeSession() {
    click(btnByText(modalRoot(), "もどる"));
    await dismissTrivia();
    await waitFor(() => doc.querySelector("#screen-pref.on") && !modalRoot().innerHTML, "back to pref");
  }

  /* 収穫(readyな畑) */
  async function harvest(matName, perfect = true) {
    const card = await waitFor(() => {
      const c = sozaiCard(matName);
      return c && c.classList.contains("ready") ? c : null;
    }, "ready plot " + matName);
    click(btnByText(card, "しゅうかく!"));
    await waitFor(() => doc.querySelector("#screen-grow.on"), "harvest screen " + matName);
    const res = await solveSession(perfect, "harvest:" + matName);
    if (res !== "modal") throw new Error("harvest should end with modal: " + matName);
    await closeSession();
  }

  /* おせわチャンス */
  async function careVisit(matName) {
    const card = await waitFor(() => {
      const c = sozaiCard(matName);
      return c && btnByText(c, "おせわに いく!") ? c : null;
    }, "care chance " + matName);
    click(btnByText(card, "おせわに いく!"));
    await waitFor(() => doc.querySelector("#screen-grow.on"), "care screen");
    const res = await solveSession(true, "care:" + matName);
    if (res !== "left") throw new Error("care should return to pref");
    await waitFor(() => doc.querySelector("#screen-pref.on"), "pref after care");
  }

  /* 待ちなしミニゲーム(ねんど・いわし) */
  async function growInstant(matName, perfect = true) {
    const card = await waitFor(() => sozaiCard(matName), "sozai card " + matName);
    click(card.querySelector("button.btn"));
    await waitFor(() => doc.querySelector("#screen-grow.on"), "instant screen " + matName);
    const res = await solveSession(perfect, "instant:" + matName);
    if (res !== "modal") throw new Error("instant should end with modal: " + matName);
    await closeSession();
  }

  /* 植えて→ブーストして→収穫 のショートカット */
  async function plantBoostHarvest(matName, perfect = true) {
    await plant(matName);
    await debugBoost();
    await harvest(matName, perfect);
  }

  const ownedCard = (name) => [...doc.querySelectorAll("#recipe-list .card")].find((c) => {
    const n = c.querySelector(".card-name");
    return n && (n.textContent.trim() + " ").includes(name + " ");
  });

  async function getRecipe(recipeName) {
    let guard = 0;
    while (true) {
      if (++guard > 20) throw new Error("getRecipe stuck: " + recipeName);
      if (ownedCard(recipeName)) return;
      const locked = [...doc.querySelectorAll("#recipe-list .card")].find((c) => btnByText(c, "レシピを さがす"));
      if (!locked) throw new Error("no locked recipe left but " + recipeName + " not found");
      click(btnByText(locked, "レシピを さがす"));
      await waitFor(() => modalText().includes("クイズに こたえて") || modalText().includes("クイズに ちょうせん"), "recipe intro");
      click(btnByText(modalRoot(), "クイズに ちょうせん!"));
      await solveQuizzes();
      await waitFor(() => modalText().includes("レシピ はっけん"), "recipe found");
      click(btnByText(modalRoot(), "やったー!"));
      await waitFor(() => !modalRoot().innerHTML, "modal closed");
    }
  }

  async function craft(recipeName) {
    const card = await waitFor(() => {
      const c = ownedCard(recipeName);
      return c && btnByText(c, "つくる") ? c : null;
    }, "craft card " + recipeName);
    click(btnByText(card, "つくる"));
    await waitFor(() => modalText().includes("を つくる?"), "craft confirm " + recipeName);
    click(btnByText(modalRoot(), "つくる!"));
    await waitFor(() => modalText().includes("かんせい!"), "craft done " + recipeName);
    click(btnByText(modalRoot(), "やったー!"));
    await dismissTrivia();
    await waitFor(() => doc.querySelector("#screen-pref.on") && !modalRoot().innerHTML, "back after craft " + recipeName);
  }

  return { w, doc, D, tick, click, waitFor, modalRoot, modalText, btnByText, saveData, sozaiCard,
    solveQuizzes, unlock, goPref, goPrefUnlocking, debugBoost, dismissTrivia,
    collect, plant, harvest, careVisit, growInstant, plantBoostHarvest, solveSession,
    getRecipe, craft, ownedCard };
};

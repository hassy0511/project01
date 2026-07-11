/* めいさんクエスト 自動プレイスルーテスト v0.3 */
const makeEnv = require("./test-helpers.js");
const E = makeEnv();
const { w, doc, D, tick, click, waitFor, modalRoot, modalText, btnByText, saveData, sozaiCard,
  unlock, debugBoost, collect, plant, harvest, careVisit, growInstant, plantBoostHarvest,
  getRecipe, craft } = E;

(async () => {
  const log = (s) => console.log("✔ " + s);

  /* 1. 地図: 実形パスで7県描画 */
  await waitFor(() => doc.querySelectorAll(".pref").length === 7, "map rendered");
  const ibarakiD = doc.querySelector('path[data-pref="ibaraki"]').getAttribute("d");
  if (ibarakiD.split("L").length < 50) throw new Error("ibaraki path too simple");
  log("地図描画: 実形パス(いばらき " + ibarakiD.split("L").length + "点)");

  /* 2. いばらき開拓 */
  await unlock("ibaraki", "いばらき");
  log("いばらき開拓");

  /* 3. インフラ: いど/たんぼが建っていて、初期ストック0 → ブーストで満タン → 回収 */
  const mizuCard = sozaiCard("みず");
  if (!mizuCard.textContent.includes("いど")) throw new Error("well missing: " + mizuCard.textContent);
  if (!mizuCard.textContent.includes("0/3")) throw new Error("initial stock should be 0/3");
  const komeCard = sozaiCard("こめ");
  if (!komeCard.textContent.includes("たんぼ")) throw new Error("paddy missing");
  await debugBoost();
  await waitFor(() => sozaiCard("みず").textContent.includes("3/3"), "well full");
  await collect("みず");
  await collect("こめ");
  let save = saveData();
  if (save.inv.filter((i) => i.ref === "m01" && i.quality === 2).length !== 3) throw new Error("mizu x3 ★2 expected");
  if (save.inv.filter((i) => i.ref === "m02").length !== 3) throw new Error("kome x3 expected");
  log("インフラ: いど/たんぼ → 管理者ブースト → みず・こめ 各3回収(★2)");

  /* 4. 畑: たねまき → そだちちゅう表示 → ブースト → 収穫アクション(pluck) */
  const daizuBtn = sozaiCard("だいず").querySelector("button.btn").textContent.trim();
  if (daizuBtn !== "たねを まく") throw new Error("daizu verb: " + daizuBtn);
  await plant("だいず");
  const growing = sozaiCard("だいず");
  if (!growing.textContent.includes("あと")) throw new Error("countdown missing");
  if (!growing.querySelector(".plot-fill")) throw new Error("progress bar missing");
  await debugBoost();
  await waitFor(() => sozaiCard("だいず").classList.contains("ready"), "daizu ready");
  await harvest("だいず");
  save = saveData();
  if (save.inv.filter((i) => i.ref === "m03" && i.quality === 3).length !== 2) throw new Error("daizu ★3 x2 expected");
  if (save.plots["ibaraki|m03"]) throw new Error("plot should be cleared after harvest");
  log("畑: たねまき → 成長バー/残り時間 → ブースト → pluck収穫 ★3×2 → 畑リセット");

  /* 5. おせわチャンス: 成長50%で湧く → whack → 収穫で★ほけん */
  await plant("メロン");
  w.__mqAdmin.halfGrow();
  await waitFor(() => {
    const c = sozaiCard("メロン");
    return c && btnByText(c, "おせわに いく!");
  }, "care chance spawned");
  await careVisit("メロン");
  save = saveData();
  if (!save.plots["ibaraki|m05"].careDone) throw new Error("careDone flag expected");
  await debugBoost();
  await harvest("メロン", true);
  save = saveData();
  if (save.inv.filter((i) => i.ref === "m05" && i.quality === 3).length !== 2) throw new Error("melon ★3 x2 expected");
  log("おせわチャンス: 50%で出現 → タップ撃退 → careDone → 収穫★3");

  /* 6. うめ(木もの)も 植える→ブースト→収穫 */
  await plantBoostHarvest("うめ");
  log("うめ(なえを うえる → 収穫)");

  /* 7. ねんど: 待ちなしのほりあて */
  await growInstant("ねんど");
  save = saveData();
  if (save.inv.filter((i) => i.ref === "m07" && i.quality === 3).length !== 2) throw new Error("clay ★3 x2 expected");
  log("ねんど: 待ちなし ほりあて ★3×2");

  /* 8. クイズバグ根治の検証: sanchiカテゴリ廃止 + 育成プールに形・位置・開拓が混ざらない */
  if (D.quizzes.some((q) => q.kind === "sanchi")) throw new Error("sanchi kind should be retired");
  for (const m of D.materials) {
    const ok = (q) => !q.type && q.kind === "sozai";
    const pool1 = D.quizzes.filter((q) => ok(q) && q.tags.includes(m.id));
    const pool = pool1.length ? pool1 : D.quizzes.filter(ok);
    if (!pool.length) throw new Error("empty quiz pool for " + m.id);
    if (pool.some((q) => q.type || q.kind === "kaitaku")) throw new Error("wrong quiz leaked for " + m.id);
  }
  /* 開拓クイズが各県に十分あるか(形1+位置1+知識3以上) */
  for (const pid of ["ibaraki", "chiba", "tochigi"]) {
    const know = D.quizzes.filter((q) => q.kind === "kaitaku" && !q.type && q.tags.includes(pid)).length;
    if (know < 3) throw new Error("kaitaku knowledge quizzes for " + pid + ": " + know);
  }
  log("クイズ再設計: sanchi廃止 / 育成=そざい限定 / 開拓知識 各県3問以上");

  /* 9. レシピ → クラフト → じもとメダル */
  await getRecipe("なっとう");
  await getRecipe("うめジュース");
  await getRecipe("かさまやき");
  await craft("なっとう");
  await craft("うめジュース");
  await craft("かさまやき");
  save = saveData();
  if (!save.zukanProd.r01 || !save.zukanProd.r01.jimoto) throw new Error("r01 jimoto expected");
  log("クラフト3種 + じもとメダル🥇(★2のインフラみず使用)");

  /* 10. うめまつり */
  const festCard = [...doc.querySelectorAll("#recipe-list .card")].find((c) => c.textContent.includes("うめまつり"));
  click(btnByText(festCard, "ひらく!"));
  await waitFor(() => modalText().includes("じゅんびを しよう"), "fest intro");
  click(btnByText(modalRoot(), "じゅんびスタート!"));
  await waitFor(() => modalText().includes("だんどりパズル"), "fest puzzle");
  for (const s of D.recipes.find((r) => r.id === "rf1").steps) {
    click([...modalRoot().querySelectorAll(".fest-step")].find((b) => b.textContent.trim().startsWith(s)));
    await tick();
  }
  await waitFor(() => modalText().includes("おまつり かいさい"), "fest done");
  click(btnByText(modalRoot(), "ちずを みる!"));
  await E.dismissTrivia();
  await waitFor(() => doc.querySelector("#screen-map.on"), "map after fest");
  await waitFor(() => doc.querySelector(".fest-mark"), "festival mark");
  log("うめまつり開催 → 地図に🏮");

  /* 11. ずかん */
  click([...doc.querySelectorAll(".nav-btn")].find((b) => b.dataset.go === "zukan"));
  await waitFor(() => doc.querySelector("#screen-zukan.on"), "zukan screen");
  const known = doc.querySelectorAll("#zukan-grid .zcard:not(.unknown)").length;
  if (known < 5) throw new Error("zukan known expected >=5, got " + known);
  log("ずかん: そざい" + known + "種 登録済み");

  console.log("\nALL PLAYTHROUGH TESTS PASSED 🎉");
  process.exit(0);
})().catch((e) => {
  console.error("\n✖ FAILED:", e.message);
  try {
    console.error("--- screen:", [...doc.querySelectorAll(".screen")].filter((s) => s.classList.contains("on")).map((s) => s.id).join(","));
    console.error("--- modal:", (modalRoot().textContent || "(empty)").slice(0, 200));
    console.error("--- __mq:", JSON.stringify(w.__mq));
    console.error("--- sozai:", [...doc.querySelectorAll("#sozai-list .card")].map((c) => c.textContent.trim().slice(0, 40)).join(" / "));
    console.error("--- save:", w.localStorage.getItem("meisanquest-save-v1"));
  } catch (x) { console.error("(diag error)", x.message); }
  process.exit(1);
});

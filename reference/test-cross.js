/* めいさんクエスト クロス県テスト v0.3: 産地指定 & 県またぎ & インフラ */
const makeEnv = require("./test-helpers.js");
const E = makeEnv();
const { w, doc, D, tick, click, waitFor, modalRoot, modalText, btnByText, saveData, sozaiCard,
  unlock, goPrefUnlocking, debugBoost, collect, plantBoostHarvest, growInstant,
  getRecipe, craft, ownedCard } = E;

(async () => {
  const log = (s) => console.log("✔ " + s);
  await waitFor(() => doc.querySelectorAll(".pref").length === 7, "map rendered");

  /* 1. いばらき: だいず(畑)を2サイクル + こめ(たんぼ) */
  await unlock("ibaraki", "いばらき");
  await plantBoostHarvest("だいず");   // ★3×2
  await plantBoostHarvest("だいず");   // ★3×2 → 計4
  await collect("こめ");               // ブースト済みなので3個
  let save = saveData();
  if (save.inv.filter((i) => i.ref === "m03").length !== 4) throw new Error("daizu x4 expected");
  log("いばらき: だいず★3×4(2サイクル) + こめ×3(たんぼ)");

  /* 2. ちば: いど回収 → しょうゆ(いばらき産だいず=県またぎハブ) */
  await goPrefUnlocking("chiba", "ちば");
  await debugBoost();
  await collect("みず");
  await getRecipe("しょうゆ");
  await craft("しょうゆ");
  save = saveData();
  const shoyu = save.inv.find((i) => i.ref === "r07");
  if (!shoyu || shoyu.origin !== "chiba") throw new Error("shoyu chiba origin expected");
  if (save.inv.filter((i) => i.ref === "m03").length !== 2) throw new Error("daizu 2 left expected");
  log("ちば: いばらき産だいずで しょうゆ かんせい(県またぎハブ)");

  /* 3. とちぎ: ねんど(待ちなしdig)★3×2 */
  await goPrefUnlocking("tochigi", "とちぎ");
  await growInstant("ねんど");
  log("とちぎ: ねんど★3×2 入手");

  /* 4. いばらき: かさまやきは とちぎ産ねんどでは不可(産地指定ガード) */
  await goPrefUnlocking("ibaraki", "いばらき");
  await debugBoost();
  await collect("みず");
  await getRecipe("かさまやき");
  let card = ownedCard("かさまやき");
  const btn = btnByText(card, "つくる");
  if (!btn.classList.contains("gray")) throw new Error("kasama should be un-craftable with tochigi clay");
  const chip = [...card.querySelectorAll(".chip")].find((c) => c.textContent.includes("ねんど"));
  if (!chip.textContent.includes("0/2")) throw new Error("clay chip should show 0/2: " + chip.textContent);
  log("産地指定: とちぎ産ねんどでは かさまやき 不可(0/2表示+グレーボタン)");

  /* 5. いばらき産ねんどを掘って かさまやき(とちぎ産は温存) */
  await growInstant("ねんど");
  await craft("かさまやき");
  save = saveData();
  const tochigClay = save.inv.filter((i) => i.ref === "m07" && i.origin === "tochigi");
  if (tochigClay.length !== 2) throw new Error("tochigi clay should be preserved: " + tochigClay.length);
  if (save.inv.some((i) => i.ref === "m07" && i.origin === "ibaraki")) throw new Error("ibaraki clay should be consumed");
  log("いばらき産ねんどを優先消費して かさまやき 完成(とちぎ産2個は温存)");

  /* 6. 県またぎ: ちば産しょうゆで なっとうていしょく */
  await getRecipe("なっとう");
  await craft("なっとう");
  await getRecipe("なっとうていしょく");
  await craft("なっとうていしょく");
  save = saveData();
  if (!save.zukanProd.r04) throw new Error("teishoku not registered");
  if (save.inv.some((i) => i.ref === "r07")) throw new Error("shoyu should be consumed");
  log("県またぎ: ちば産しょうゆで なっとうていしょく 完成 → ずかん登録");

  /* 7. ずかん: ねんど2産地 + みず2産地(インフラ) */
  const zm = save.zukanMat.m07;
  if (!zm || !zm.ibaraki || !zm.tochigi) throw new Error("clay should have 2 origins");
  const zw = save.zukanMat.m01;
  if (!zw || !zw.ibaraki || !zw.chiba) throw new Error("water should have 2 origins: " + JSON.stringify(zw));
  log("ずかん: ねんど2産地 + みず2産地(インフラ経由)登録");

  console.log("\nALL CROSS-PREF TESTS PASSED 🎉");
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

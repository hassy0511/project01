/* =====================================================
   めいさんクエスト(仮) ゲームロジック v0.1
   データは data.js (window.GAME_DATA) から読み込む。
   セーブは localStorage のみ(時間要素・通知なし)。
   ===================================================== */
(function () {
  "use strict";
  const D = window.GAME_DATA;
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const rand = (n) => Math.floor(Math.random() * n);

  /* ---------- 地図パス(実際の県境データから生成: gen-map.mjs) ---------- */
  const MAP_VIEWBOX = "0 0 364 407";
  const PREF_PATHS = {
    tochigi: "M268.4,49.6L266.3,51.7L268.8,67.9L268.8,73.9L267.1,76.5L272.7,87.1L264.1,89.3L262.4,91.4L265.4,97.8L266.3,117.5L268.0,120.0L263.7,123.0L257.7,140.5L253.9,140.5L252.2,137.5L250.0,137.5L246.2,140.9L241.5,139.2L241.9,141.8L238.5,144.4L232.1,143.9L232.6,145.6L230.8,145.6L228.7,143.5L227.4,148.2L220.2,151.2L219.8,156.7L215.9,155.5L216.3,153.3L211.6,155.0L209.5,158.0L210.4,161.4L207.8,167.4L195.0,173.8L193.7,172.1L189.5,174.2L186.1,173.0L186.1,169.1L183.1,167.8L181.4,164.8L183.1,162.7L180.5,161.4L172.4,162.7L171.1,160.6L167.3,159.7L158.8,161.9L157.9,158.9L154.1,158.0L151.9,154.2L152.4,152.5L153.6,152.9L152.4,150.8L145.5,145.6L144.7,142.6L151.1,130.3L154.1,130.3L154.9,127.3L154.1,128.1L152.4,123.0L155.8,117.9L154.5,117.5L154.9,114.9L157.9,114.0L161.3,108.9L158.8,105.1L153.6,105.9L143.8,103.8L142.5,101.7L140.4,101.7L140.0,95.7L146.0,81.2L144.2,80.7L143.4,76.5L146.4,74.8L146.8,71.3L150.6,67.9L143.0,63.2L143.8,59.0L145.5,59.0L151.1,50.4L154.1,50.4L157.9,45.7L157.9,43.2L161.3,42.3L163.0,43.6L168.6,41.5L175.0,35.5L178.8,35.9L180.9,32.5L186.1,31.2L187.3,28.2L198.4,26.1L201.4,22.7L207.8,23.5L207.0,18.0L213.8,13.3L227.0,12.0L246.2,17.1L259.0,27.4L260.3,34.2L266.7,33.8L265.4,38.9L267.1,44.4L265.4,47.4L268.4,49.6Z",
    gunma: "M53.0,82.4L57.2,78.2L66.2,81.6L70.4,78.2L70.4,69.2L84.9,66.6L85.4,56.4L92.2,56.8L90.5,41.9L101.2,40.2L107.1,34.6L108.4,28.2L118.6,38.0L119.5,44.0L126.3,44.9L128.0,50.0L131.4,48.3L148.9,53.4L143.0,63.2L150.6,67.9L143.4,76.5L146.0,81.2L140.0,100.4L149.4,105.5L158.8,105.1L161.3,109.8L154.9,114.9L152.4,123.0L154.5,129.0L151.1,130.3L145.5,145.6L152.4,150.8L154.1,158.0L158.8,161.9L180.5,161.4L186.9,172.1L180.9,176.4L175.8,172.1L160.0,175.9L144.2,164.8L139.1,169.1L112.7,159.7L100.7,186.2L90.1,186.6L87.1,192.2L76.4,194.7L69.2,202.4L61.1,202.0L55.5,210.5L52.1,209.2L44.4,203.3L46.1,187.5L36.7,179.4L44.8,178.9L40.2,160.6L47.4,156.7L46.6,138.8L38.9,135.8L30.8,139.7L21.0,139.2L12.4,134.1L12.0,125.1L16.3,106.8L22.7,98.7L30.3,96.5L28.2,90.6L53.0,82.4Z",
    ibaraki: "M341.3,62.0L343.0,66.6L337.9,68.8L334.9,75.2L330.7,95.7L316.2,125.1L317.9,146.5L310.2,155.5L309.3,166.1L316.2,193.9L328.5,218.6L325.6,221.6L323.4,219.9L325.1,225.5L327.3,228.0L325.1,222.9L329.4,220.8L348.6,252.4L334.9,245.1L329.0,235.3L319.2,231.9L314.9,224.6L302.5,215.2L299.1,220.3L301.2,224.2L295.3,220.3L282.5,225.0L276.1,231.0L270.9,229.3L253.5,234.9L249.2,229.3L242.8,228.9L224.0,218.2L223.2,213.5L216.3,210.1L203.1,190.5L200.6,194.3L195.0,193.0L189.9,173.0L195.0,173.8L207.8,167.4L211.6,155.0L216.3,153.3L219.8,156.7L220.2,151.2L227.4,148.2L228.7,143.5L238.5,144.4L241.5,139.2L246.2,140.9L250.0,137.5L253.9,140.5L258.6,139.2L263.7,123.0L268.0,120.0L262.4,91.4L272.7,87.1L267.1,76.5L268.0,49.6L272.7,49.6L277.3,56.8L282.9,58.5L284.2,65.8L292.7,68.4L296.1,73.5L306.4,62.0L313.6,59.8L309.8,53.0L312.8,47.4L317.0,54.7L341.3,62.0Z",
    chiba: "M201.4,192.6L203.1,190.5L216.3,210.1L223.2,213.5L224.0,218.2L242.8,228.9L249.2,229.3L253.5,234.9L270.9,229.3L276.1,231.0L282.5,225.0L295.3,220.3L301.2,224.2L299.1,220.3L302.5,215.2L314.9,224.6L319.2,231.9L329.0,235.3L334.9,245.1L344.7,252.4L350.7,251.5L352.0,255.8L351.1,260.1L346.5,256.6L322.1,260.9L300.4,279.7L286.7,306.6L289.3,325.8L284.2,347.2L280.3,347.2L276.5,354.4L273.5,352.3L264.5,358.3L259.9,359.1L258.6,356.1L249.2,358.3L243.6,367.2L229.6,375.8L224.4,391.6L216.8,395.0L209.9,394.1L206.5,387.7L198.4,383.9L198.4,381.7L211.2,380.5L212.9,377.5L206.1,371.1L209.1,370.2L207.4,366.8L210.8,362.9L207.0,347.6L213.8,340.7L213.8,334.8L210.4,327.9L202.3,324.5L210.4,321.1L207.8,319.4L212.5,318.1L211.2,314.3L217.6,317.3L221.0,313.0L218.9,304.5L227.0,299.8L226.2,302.3L228.7,301.9L227.4,298.5L230.0,297.2L230.8,301.0L233.0,296.3L235.5,298.5L233.8,295.5L240.7,285.7L246.2,286.5L244.5,284.0L248.3,284.4L244.9,281.8L249.6,281.0L244.1,281.0L243.6,278.0L247.9,280.5L248.3,276.7L244.5,276.7L246.2,275.0L243.6,273.7L243.6,276.7L234.3,266.0L230.4,266.5L232.6,265.6L230.4,260.5L222.7,263.5L224.9,263.9L221.0,266.5L224.0,269.0L218.0,273.3L214.6,271.6L217.2,262.2L221.0,259.2L215.9,248.1L218.5,230.6L201.4,192.6Z",
    tokyo: "M87.1,232.7L87.5,230.2L90.5,228.0L95.2,227.6L98.2,225.5L102.0,228.9L115.7,231.5L120.4,234.9L123.8,234.0L126.3,235.7L135.3,235.7L137.0,238.3L138.3,237.9L139.6,243.0L146.0,243.4L148.5,248.1L163.0,245.5L169.4,240.8L169.4,245.1L166.0,247.7L170.3,246.4L169.8,249.8L175.8,245.5L180.5,247.7L183.1,242.1L189.9,241.7L196.3,245.1L198.9,243.8L198.4,240.0L201.0,239.1L204.4,240.8L207.8,239.6L207.8,242.6L214.6,242.6L214.6,244.7L217.6,245.1L215.9,248.1L221.0,259.2L217.2,262.2L216.8,266.9L214.6,269.4L210.4,268.6L210.4,270.3L207.8,270.3L209.5,268.6L205.7,269.0L204.4,272.4L201.8,269.4L204.4,267.3L201.8,269.0L204.0,266.9L201.0,268.2L199.7,266.5L197.1,277.6L198.4,282.3L202.7,281.0L206.1,286.5L203.5,288.2L198.9,285.2L191.2,286.5L191.6,284.0L188.2,282.3L186.5,278.0L168.6,269.0L167.3,268.6L163.0,272.9L163.4,275.0L158.3,271.6L157.0,275.0L159.2,274.6L164.7,280.1L162.2,282.7L161.7,278.4L159.2,281.8L161.7,286.5L161.3,292.1L159.2,292.5L157.9,288.2L149.8,278.4L133.6,273.7L131.4,275.4L128.0,275.0L123.3,267.3L119.5,268.2L116.9,264.3L113.1,263.9L98.6,255.8L92.6,247.2L90.9,236.6L88.4,235.7L87.1,232.7Z",
    saitama: "M186.1,173.0L189.0,173.4L190.3,175.5L189.9,179.4L195.0,193.0L200.6,194.3L201.4,192.6L203.5,198.1L207.4,202.4L206.5,208.4L218.5,230.6L216.8,237.0L217.6,245.1L214.6,244.7L214.6,242.6L207.8,242.6L207.8,239.6L202.3,240.8L200.6,239.1L198.0,240.4L199.3,242.1L197.6,244.7L189.9,241.7L185.2,241.7L181.4,244.3L180.5,247.7L175.8,245.5L170.3,249.8L170.3,246.4L166.0,247.7L169.4,245.1L169.4,240.8L163.0,245.5L148.5,248.1L146.0,243.4L139.6,243.0L138.3,237.9L137.0,238.3L135.3,235.7L126.3,235.7L123.8,234.0L120.4,234.9L115.7,231.5L102.0,228.9L98.2,225.5L95.2,227.6L90.5,228.0L87.5,230.2L87.1,232.7L82.4,233.2L80.3,235.3L75.1,231.0L69.2,231.5L64.5,225.0L57.6,223.3L58.9,218.6L55.5,210.5L59.8,206.3L61.1,202.0L64.9,201.6L66.2,202.8L71.3,201.6L76.4,194.7L87.1,192.2L90.1,186.6L93.1,188.3L95.6,185.3L100.7,186.2L100.7,182.8L103.7,181.1L103.7,174.7L112.7,159.7L125.5,164.0L128.5,166.6L131.4,167.0L131.9,165.3L136.6,166.1L139.1,169.1L142.5,164.8L144.2,164.8L155.8,174.7L160.0,175.9L167.3,175.5L175.8,172.1L180.9,176.4L184.3,174.7L184.3,172.1L186.1,173.0Z",
    kanagawa: "M113.1,263.9L124.6,268.2L128.0,275.0L133.6,273.7L149.8,278.4L159.2,292.5L161.7,289.5L159.2,281.8L161.7,278.4L162.2,282.7L164.7,280.1L156.6,274.1L158.8,271.6L163.4,275.0L167.3,268.6L186.5,278.0L191.2,286.5L198.9,285.2L203.5,288.2L203.5,291.6L198.0,287.4L200.1,290.8L197.1,289.5L195.9,292.9L194.6,289.9L193.7,294.2L181.8,298.5L188.2,304.9L189.9,303.2L186.9,309.6L180.9,308.3L183.5,309.2L180.9,312.1L184.8,312.1L185.2,319.8L180.5,321.5L185.6,322.0L181.8,327.9L186.1,329.6L187.3,326.7L189.9,332.6L197.6,334.8L193.3,336.1L194.6,342.0L185.2,346.3L188.2,354.0L178.8,354.0L180.9,349.7L177.1,344.6L180.9,341.2L172.8,332.6L173.3,327.9L169.8,325.4L160.5,327.5L160.5,325.0L154.9,323.7L128.9,328.4L115.2,336.9L113.5,346.3L116.9,354.0L99.0,352.3L98.6,348.0L93.1,343.7L91.3,334.8L97.3,322.0L95.2,310.0L83.2,310.0L86.2,301.5L98.6,296.3L101.2,291.2L106.7,290.8L110.5,286.5L113.1,263.9Z"
  };
  const PREF_LABEL = { tochigi: [207, 90], gunma: [92, 122], ibaraki: [276, 155], chiba: [260, 290], tokyo: [155, 256], saitama: [142, 208], kanagawa: [141, 307] };
  const SHAPE_BOX = { tochigi: "134 6 145 174", ibaraki: "184 41 171 217", chiba: "192 184 166 217" };

  /* ---------- セーブ ---------- */
  const KEY = "meisanquest-save-v1";
  function defaultState() {
    return { unlocked: [], inv: [], recipes: [], zukanMat: {}, zukanProd: {}, fest: [], seenTrivia: {}, plots: {}, infra: {}, flags: {} };
  }
  let S = load();
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) return Object.assign(defaultState(), JSON.parse(raw)); } catch (e) { /* 破損時は初期化 */ }
    return defaultState();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 保存不可でも続行 */ } }

  /* ---------- データ参照ヘルパ ---------- */
  const pref = (id) => D.prefectures.find((p) => p.id === id);
  const mat = (id) => D.materials.find((m) => m.id === id);
  const rec = (id) => D.recipes.find((r) => r.id === id);
  const entity = (ref) => mat(ref) || rec(ref);
  const isMat = (ref) => ref.startsWith("m");
  const trivia = (ref) => D.trivia.find((t) => t.target === ref);
  const TIER_LABEL = { 2: "さんぶつ", 3: "めいぶつ", 4: "おまつり" };
  const RARITY_LABEL = { unique: "ここだけ!", local: "レア", common: "" };

  /* ---------- 画面切り替え ---------- */
  let currentPref = null;
  function show(name) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("on"));
    $("#screen-" + name).classList.add("on");
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.go === name));
    window.scrollTo(0, 0);
  }

  /* ---------- ヘッダー進捗 ---------- */
  function collectedCount() {
    let c = Object.keys(S.zukanMat).length + Object.keys(S.zukanProd).length + S.fest.length;
    return c;
  }
  function totalCount() {
    return D.materials.length + D.recipes.filter((r) => r.tier < 4).length + D.recipes.filter((r) => r.tier === 4).length;
  }
  function updateHeader() { $("#zukan-count").textContent = "ずかん " + collectedCount() + "/" + totalCount(); }

  /* =====================================================
     地図画面
     ===================================================== */
  function renderMap() {
    const box = $("#map-box");
    let svg = `<svg viewBox="${MAP_VIEWBOX}" xmlns="http://www.w3.org/2000/svg" id="kanto-map" role="img" aria-label="かんとうの ちず">`;
    /* うみの かざり */
    svg += `<g class="map-sun"><circle cx="330" cy="32" r="13" fill="#FFD34D" stroke="#F0B429" stroke-width="2"/>
      ${[0,45,90,135,180,225,270,315].map((a)=>`<line x1="${330+Math.cos(a*Math.PI/180)*18}" y1="${32+Math.sin(a*Math.PI/180)*18}" x2="${330+Math.cos(a*Math.PI/180)*23}" y2="${32+Math.sin(a*Math.PI/180)*23}" stroke="#F0B429" stroke-width="2.4" stroke-linecap="round"/>`).join("")}</g>`;
    [[26,330],[58,372],[338,300],[344,180],[92,20]].forEach(([wx,wy])=>{
      svg += `<path d="M${wx-10} ${wy} q5 -6 10 0 t10 0" stroke="#8FD0E0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>`;
    });
    svg += `<g opacity=".85"><circle cx="30" cy="386" r="12" fill="#fff" stroke="#9ED3E2" stroke-width="2"/>
      <path d="M30 377 L33 386 L30 384 L27 386 Z" fill="#E05B5B"/><text x="30" y="374" text-anchor="middle" font-size="8" fill="#5a7a86" font-weight="800">N</text></g>`;
    for (const p of D.prefectures) {
      const path = PREF_PATHS[p.id];
      if (!path) continue;
      const unlocked = S.unlocked.includes(p.id);
      const done = S.fest.includes(p.festivalId);
      let fill = "#E7E3D8", cls = "pref inactive";
      if (p.active) { cls = unlocked ? "pref open" : "pref locked"; fill = unlocked ? p.color : "#CFCBC0"; }
      if (done) cls += " done";
      svg += `<path d="${path}" fill="${fill}" class="${cls}" data-pref="${p.id}"/>`;
      const [lx, ly] = PREF_LABEL[p.id];
      if (p.active) {
        const label = unlocked ? p.name : "?";
        svg += `<text x="${lx}" y="${ly}" class="pref-name ${unlocked ? "" : "qmark"}" data-pref="${p.id}">${label}</text>`;
        if (!unlocked) svg += `<text x="${lx - 22}" y="${ly - 16}" class="cloud c1">☁️</text><text x="${lx + 12}" y="${ly + 14}" class="cloud c2">☁️</text>`;
        if (done) svg += `<text x="${lx + 22}" y="${ly - 20}" class="fest-mark" data-pref="${p.id}">🏮</text>`;
      } else {
        svg += `<text x="${lx}" y="${ly}" class="pref-name mini">${p.name}</text>`;
      }
    }
    svg += "</svg>";
    box.innerHTML = svg;
    updateMapGuide();
    box.querySelectorAll("[data-pref]").forEach((node) => {
      node.addEventListener("click", () => {
        const p = pref(node.dataset.pref);
        if (!p.active) { toast("ここは じゅんびちゅう! おたのしみに🚧"); return; }
        if (!S.unlocked.includes(p.id)) startKaitaku(p);
        else openPref(p.id);
      });
    });
    updateHeader();
  }

  /* =====================================================
     クイズランナー(共通)
     list: quizオブジェクト配列 / done(correctCount)
     まちがえても すすめる(せいかいを おしえる)
     ===================================================== */
  function runQuizzes(list, title, done) {
    let i = 0, score = 0;
    const step = () => {
      if (i >= list.length) { closeModal(); done(score); return; }
      const q = list[i];
      const body = el("div");
      body.appendChild(el("div", "quiz-progress", "もんだい " + (i + 1) + " / " + list.length));
      if (q.type === "shape" && SHAPE_BOX[q.tags[0]]) {
        body.appendChild(el("div", "shape-wrap",
          `<svg viewBox="${SHAPE_BOX[q.tags[0]]}" class="shape-svg"><path d="${PREF_PATHS[q.tags[0]]}" fill="#8FCB6B" stroke="#5E9C43" stroke-width="3" stroke-linejoin="round"/></svg>`));
      } else if (q.type === "position") {
        const target = q.tags[0];
        let mini = `<svg viewBox="${MAP_VIEWBOX}" class="pos-svg">`;
        for (const pp of D.prefectures) {
          if (!PREF_PATHS[pp.id]) continue;
          const hit = pp.id === target;
          mini += `<path d="${PREF_PATHS[pp.id]}" fill="${hit ? "#FF9F40" : "#EDE9DD"}" stroke="#fff" stroke-width="2" stroke-linejoin="round" class="${hit ? "pos-hit" : ""}"/>`;
        }
        mini += "</svg>";
        body.appendChild(el("div", "shape-wrap", mini));
      }
      body.appendChild(el("div", "quiz-q", q.q));
      const wrap = el("div", "choice-wrap");
      let answered = false;
      shuffle(q.choices.map((c, ci) => ci)).forEach((ci) => {
        const b = el("button", "btn choice", q.choices[ci]);
        b.addEventListener("click", () => {
          if (answered) return;
          answered = true;
          const ok = ci === q.answer;
          if (ok) { b.classList.add("correct"); score++; sparkle(b); SFX.good(); }
          else {
            b.classList.add("wrong"); SFX.bad();
            const right = [...wrap.children].find((c2) => c2.textContent === q.choices[q.answer]);
            if (right) right.classList.add("correct");
            body.appendChild(el("div", "quiz-hint", "こたえは「" + q.choices[q.answer] + "」だよ!"));
          }
          setTimeout(() => { i++; step(); }, ok ? 800 : 1600);
        });
        wrap.appendChild(b);
      });
      body.appendChild(wrap);
      modal(title, body, null);
    };
    step();
  }

  function pickQuizzes(filter, n) {
    /* プールが足りなくても無関係な問題(形クイズ等)で補充しない */
    return shuffle(D.quizzes.filter(filter)).slice(0, n);
  }

  /* =====================================================
     開拓(かいたく)
     ===================================================== */
  function startKaitaku(p) {
    const idQ = pickQuizzes((q) => (q.type === "shape" || q.type === "position") && q.tags.includes(p.id), 1)[0];
    const knowQ = pickQuizzes((q) => q.kind === "kaitaku" && !q.type && q.tags.includes(p.id), 1)[0];
    const qs = [idQ, knowQ].filter(Boolean);
    const body = el("div");
    body.innerHTML = guideRow(p.name + "けんを かいたく しよう!<br>クイズに ちょうせんだ!", "wow");
    const b = el("button", "btn primary", "ちょうせん する!");
    b.addEventListener("click", () => {
      closeModal();
      runQuizzes(qs, p.name + "けん かいたく!", () => {
        S.unlocked.push(p.id); save();
        confetti();
        SFX.fanfare();
        const body2 = el("div");
        body2.appendChild(el("div", "big-emoji pop", "🎉"));
        body2.appendChild(el("div", "modal-title-inner", p.name + "けん かいたく せいこう!"));
        body2.innerHTML += guideRow("ちずに いろが ついたよ!<br>たねを まいて、レシピを あつめよう!", "happy");
        const go = el("button", "btn primary", p.name + "けんに いく!");
        go.addEventListener("click", () => { closeModal(); renderMap(); openPref(p.id); });
        body2.appendChild(go);
        modal("かいたく せいこう!", body2, null);
        renderMap();
      });
    });
    body.appendChild(b);
    modal("あたらしい けん!", body, true);
  }

  /* =====================================================
     県画面
     ===================================================== */
  function openPref(prefId) {
    currentPref = prefId;
    const p = pref(prefId);
    const scene = $("#pref-scene");
    if (scene) scene.innerHTML = sceneSVG(p);
    const prog = prefProgress(p);
    $("#pref-title").innerHTML = `<span class="pref-chip" style="background:${p.color}">${p.name}けん</span><span class="pref-prog">📖 ${prog.got}/${prog.total}</span>`;
    renderSozai(p);
    renderRecipes(p);
    show("pref");
  }

  function fmtWait(sec) {
    return sec < 60 ? "まもなく!" : "やく" + Math.ceil(sec / 60) + "ふん";
  }

  function renderSozai(p) {
    const wrap = $("#sozai-list");
    wrap.innerHTML = "";
    D.materials.filter((m) => m.origins.includes(p.id)).forEach((m) => {
      const g = m.gather;
      const card = el("div", "card sozai-card");
      const badge = RARITY_LABEL[m.rarity] ? `<span class="badge ${m.rarity}">${RARITY_LABEL[m.rarity]}</span>` : "";
      const known = S.zukanMat[m.id] && S.zukanMat[m.id][p.id];
      const starsTxt = known ? "さいこう " + "★".repeat(known) : "まだ てにいれていない";

      if (g.type === "infra") {
        /* いど・たんぼ: 時間でストックが貯まる。回収のみ */
        const st = infraStock(m, p);
        const key = plotKey(m, p);
        const nextSec = st >= g.max ? 0 : Math.ceil((g.rateSec * 1000 - ((now() - S.infra[key].lastCollect) % (g.rateSec * 1000))) / 1000);
        card.classList.add("infra");
        card.innerHTML = `<div class="card-emoji">${g.bEmoji}</div>
          <div class="card-body"><div class="card-name">${m.name}の ${g.building} <span class="badge infra-b">いつでも</span></div>
          <div class="card-sub">ストック <b>${st}/${g.max}</b>${st >= g.max ? " ・まんたん!" : " ・つぎまで " + fmtWait(nextSec)}</div></div>`;
        const b = el("button", "btn small " + (st > 0 ? "primary" : "gray"), g.collectVerb);
        b.addEventListener("click", () => { if (infraStock(m, p) > 0) collectInfra(m, p); else toast("まだ たまっていないよ…"); });
        card.appendChild(b);

      } else if (g.type === "plant") {
        const ps = plotState(m, p);
        if (ps.st === "empty") {
          card.innerHTML = `<div class="card-emoji">🟫</div>
            <div class="card-body"><div class="card-name">${m.name}の はたけ ${badge}</div>
            <div class="card-sub">${starsTxt}</div></div>`;
          const b = el("button", "btn small primary", g.verb);
          b.addEventListener("click", () => plantSeed(m, p));
          card.appendChild(b);
        } else if (ps.st === "growing") {
          const remain = Math.ceil((g.growSec * 1000 - (now() - ps.pl.plantedAt)) / 1000);
          card.innerHTML = `<div class="card-emoji grow-anim">🌱</div>
            <div class="card-body"><div class="card-name">${m.name} ${badge}</div>
            <div class="card-sub">そだちちゅう… あと ${fmtWait(remain)}</div>
            <div class="plot-bar"><div class="plot-fill" style="width:${Math.round(ps.prog * 100)}%"></div></div></div>`;
          if (ps.care) {
            const b = el("button", "btn small orange", "おせわに いく!");
            b.addEventListener("click", () => startSession(m, p, "care"));
            card.appendChild(b);
          } else {
            const b = el("button", "btn small gray", "そだちちゅう");
            b.addEventListener("click", () => toast("すくすく そだってるよ🌱 まってる あいだに ほかの ぼうけんを しよう!"));
            card.appendChild(b);
          }
        } else {
          card.classList.add("ready");
          card.innerHTML = `<div class="card-emoji">${m.emoji}</div>
            <div class="card-body"><div class="card-name">${m.name} ${badge}</div>
            <div class="card-sub">たべごろ! しゅうかくの ときだ!</div></div>`;
          const b = el("button", "btn small primary", "しゅうかく!");
          b.addEventListener("click", () => startSession(m, p, "harvest"));
          card.appendChild(b);
        }

      } else {
        /* timing / dig: 待ちなしの その場ミニゲーム */
        card.innerHTML = `<div class="card-emoji">${m.emoji}</div>
          <div class="card-body"><div class="card-name">${m.name} ${badge}</div>
          <div class="card-sub">${starsTxt}</div></div>`;
        const b = el("button", "btn small primary", g.verb);
        b.addEventListener("click", () => startSession(m, p, "instant"));
        card.appendChild(b);
      }
      wrap.appendChild(card);
    });
    lastSig = sozaiSig(p);
  }

  /* 県画面の状態シグネチャ: 変化した時だけ再描画(1秒ティッカー用) */
  function sozaiSig(p) {
    return D.materials.filter((m) => m.origins.includes(p.id)).map((m) => {
      const g = m.gather;
      if (g.type === "infra") {
        const st = infraStock(m, p);
        const key = plotKey(m, p);
        const nextSec = st >= g.max ? 0 : Math.ceil((g.rateSec * 1000 - ((now() - S.infra[key].lastCollect) % (g.rateSec * 1000))) / 1000);
        return "i" + st + fmtWait(nextSec);
      }
      if (g.type === "plant") {
        const ps = plotState(m, p);
        if (ps.st === "growing") {
          const remain = Math.ceil((g.growSec * 1000 - (now() - ps.pl.plantedAt)) / 1000);
          return "g" + (ps.care ? "c" : "") + fmtWait(remain);
        }
        return ps.st;
      }
      return "x";
    }).join("|");
  }
  let lastSig = "";
  setInterval(() => {
    if (!currentPref) return;
    const scr = document.querySelector("#screen-pref");
    if (!scr || !scr.classList.contains("on")) return;
    if ($("#modal-root").innerHTML) return; /* モーダル中は再描画しない */
    const p = pref(currentPref);
    if (sozaiSig(p) !== lastSig) renderSozai(p);
  }, 1000);

  function renderRecipes(p) {
    const wrap = $("#recipe-list");
    wrap.innerHTML = "";
    const list = D.recipes.filter((r) => r.pref === p.id).sort((a, b) => a.tier - b.tier);
    list.forEach((r) => {
      if (r.tier === 4) { wrap.appendChild(festivalCard(r, p)); return; }
      const owned = S.recipes.includes(r.id);
      const card = el("div", "card recipe-card" + (owned ? "" : " locked"));
      if (!owned) {
        card.innerHTML = `<div class="card-emoji dim">❓</div>
          <div class="card-body"><div class="card-name">？？？</div>
          <div class="card-sub">${TIER_LABEL[r.tier]}の レシピが ねむっている…</div></div>`;
        const b = el("button", "btn small orange", "レシピを さがす");
        b.addEventListener("click", () => startRecipeGet(r, p));
        card.appendChild(b);
      } else {
        const ing = r.ingredients.map((g) => ingChip(g, r)).join("");
        const crafted = S.zukanProd[r.id];
        card.innerHTML = `<div class="card-emoji">${r.emoji}</div>
          <div class="card-body"><div class="card-name">${r.name} <span class="tier t${r.tier}">${TIER_LABEL[r.tier]}</span>${crafted && crafted.jimoto ? ' <span class="jimoto">🥇じもと</span>' : ""}</div>
          <div class="ing-row">${ing}</div></div>`;
        const ok = craftable(r);
        const b = el("button", "btn small " + (ok ? "primary" : "gray"), "つくる");
        if (ok) b.addEventListener("click", () => openCraft(r));
        else b.addEventListener("click", () => toast("そざいが たりないみたい…"));
        card.appendChild(b);
      }
      wrap.appendChild(card);
    });
  }

  function ingChip(g, r) {
    const e = entity(g.ref);
    const have = matchItems(g, r).length;
    const need = g.count;
    const extra = (g.origin ? "<span class='chip-note'>" + pref(g.origin).name + "さん</span>" : "") + (g.quality ? "<span class='chip-note'>★3</span>" : "");
    return `<span class="chip ${have >= need ? "ok" : ""}">${e.emoji}${e.name}${extra} <b>${Math.min(have, need)}/${need}</b></span>`;
  }

  /* ---------- レシピ取得ミニゲーム ---------- */
  function startRecipeGet(r, p) {
    const refs = r.ingredients.map((g) => g.ref).concat([r.id]);
    /* 産地系は開拓専用。ここでは そざい/ぶんか だけ出す(足りなければ そざい全体から) */
    let pool = D.quizzes.filter((q) => !q.type && (q.kind === "sozai" || q.kind === "bunka") && (q.tags.includes(p.id) || q.tags.some((t) => refs.includes(t))));
    if (pool.length < 2) pool = pool.concat(D.quizzes.filter((q) => q.kind === "sozai" && !pool.includes(q)));
    const qs = shuffle(pool).slice(0, 2);
    const body = el("div");
    body.innerHTML = guideRow("ものしりクイズに こたえて<br>レシピを てにいれよう!", "normal");
    const b = el("button", "btn primary", "クイズに ちょうせん!");
    b.addEventListener("click", () => {
      closeModal();
      runQuizzes(qs, "レシピを さがせ!", () => {
        S.recipes.push(r.id); save();
        confetti(); SFX.fanfare();
        const body2 = el("div");
        body2.appendChild(el("div", "big-emoji", r.emoji));
        body2.appendChild(el("div", "modal-title-inner", "レシピ はっけん!<br>「" + r.name + "」"));
        const ings = r.ingredients.map((g) => { const e = entity(g.ref); return e.emoji + e.name + "×" + g.count; }).join("、");
        body2.appendChild(el("div", "modal-text", "ざいりょう: " + ings));
        const go = el("button", "btn primary", "やったー!");
        go.addEventListener("click", () => { closeModal(); renderRecipes(p); });
        body2.appendChild(go);
        modal("レシピ ゲット!", body2, null);
      });
    });
    body.appendChild(b);
    modal("レシピを さがす", body, true);
  }

  /* =====================================================
     そざい入手 v0.3
     - infra: いど/たんぼ。時間でストックが貯まる(回収のみ・ゲームなし)
     - plant: たねをまく → リアル時間で成長 → 収穫アクションゲーム
       成長40%で「おせわチャンス」が1回わく(やっておくと★の ほけん +1)
     - timing / dig: 待ちなしの その場ミニゲーム
     せいこうは常に保証。できばえで ★1〜3。
     window.__mq(状態) / window.__mqAdmin(時間操作) はテスト・管理者用フック。
     ===================================================== */
  const now = () => Date.now();
  const plotKey = (m, p) => p.id + "|" + m.id;

  function plotState(m, p) {
    const pl = S.plots[plotKey(m, p)];
    if (!pl) return { st: "empty" };
    const prog = Math.min(1, (now() - pl.plantedAt) / (m.gather.growSec * 1000));
    if (prog >= 1) return { st: "ready", pl };
    if (!pl.careSpawned && prog >= 0.4) { pl.careSpawned = true; save(); }
    return { st: "growing", prog, pl, care: pl.careSpawned && !pl.careDone };
  }

  function infraStock(m, p) {
    const key = plotKey(m, p);
    if (!S.infra[key]) { S.infra[key] = { lastCollect: now() }; save(); }
    return Math.min(m.gather.max, Math.floor((now() - S.infra[key].lastCollect) / (m.gather.rateSec * 1000)));
  }

  function plantSeed(m, p) {
    S.plots[plotKey(m, p)] = { plantedAt: now(), careSpawned: false, careDone: false };
    save();
    SFX.plant();
    toast(m.emoji + " " + m.name + "を うえた! そだつまで ほかの ぼうけんを しよう🌱");
    renderSozai(p);
  }

  function collectInfra(m, p) {
    const st = infraStock(m, p);
    if (st <= 0) return;
    for (let i = 0; i < st; i++) S.inv.push({ ref: m.id, origin: p.id, quality: 2 });
    S.infra[plotKey(m, p)].lastCollect = now();
    if (!S.zukanMat[m.id]) S.zukanMat[m.id] = {};
    S.zukanMat[m.id][p.id] = Math.max(S.zukanMat[m.id][p.id] || 0, 2);
    save(); updateHeader();
    SFX.collect();
    toast(m.emoji + " " + m.name + " ×" + st + " かいしゅう!");
    showTriviaOnce(m.id, () => renderSozai(p));
  }

  /* --- 管理者用デバッグAPI(設定のボタン or コンソール: __mqAdmin.boostAll() 等) --- */
  window.__mqAdmin = {
    boostAll() {
      const t = now();
      for (const k of Object.keys(S.plots)) S.plots[k].plantedAt = t - mat(k.split("|")[1]).gather.growSec * 1000;
      for (const k of Object.keys(S.infra)) {
        const g = mat(k.split("|")[1]).gather;
        S.infra[k].lastCollect = t - g.rateSec * g.max * 1000;
      }
      save();
      if (currentPref && document.querySelector("#screen-pref.on")) renderSozai(pref(currentPref));
    },
    halfGrow() {
      const t = now();
      for (const k of Object.keys(S.plots)) S.plots[k].plantedAt = t - mat(k.split("|")[1]).gather.growSec * 500;
      save();
      if (currentPref && document.querySelector("#screen-pref.on")) renderSozai(pref(currentPref));
    }
  };

  let G = null, timingTimer = null, whackTimer = null;
  function clearTimers() { clearInterval(timingTimer); clearInterval(whackTimer); }

  function makeQuizStep(m) {
    /* 形・位置・開拓クイズはここに出さない。そざいクイズのみ */
    const ok = (q) => !q.type && q.kind === "sozai";
    const pool1 = D.quizzes.filter((q) => ok(q) && q.tags.includes(m.id));
    const pool = pool1.length ? pool1 : D.quizzes.filter(ok);
    return { kind: "quiz", q: pool[rand(pool.length)] };
  }

  function startSession(m, p, mode) {
    clearTimers();
    const g = m.gather;
    let steps, title;
    if (mode === "instant") {
      steps = [{ kind: g.type }, { kind: g.type }, { kind: g.type }, makeQuizStep(m)];
      title = `${m.emoji} ${m.name}を ${g.verb}`;
    } else if (mode === "harvest") {
      steps = g.harvest.engine === "dig"
        ? [{ kind: "dig" }, { kind: "dig" }, makeQuizStep(m)]
        : [{ kind: "pluck" }, makeQuizStep(m)];
      title = `${m.emoji} ${m.name}の しゅうかく!`;
    } else {
      steps = [{ kind: "whack" }];
      title = "⚡ おせわチャンス!";
    }
    const maxBase = steps.reduce((a, s) => a + (s.kind === "pluck" ? 2 : 1), 0);
    G = { m, p, g, mode, steps, idx: 0, score: 0, maxBase };
    $("#grow-title").innerHTML = `${title} <span class="pref-chip small" style="background:${p.color}">${p.name}</span>`;
    show("grow");
    renderGrowStep();
  }

  function stepAdvance(delay) {
    setTimeout(() => { G.idx++; renderGrowStep(); }, delay);
  }

  function renderGrowStep() {
    clearTimers();
    const box = $("#grow-box");
    box.innerHTML = "";
    const total = G.steps.length;
    const stages = (G.g.theme && G.g.theme.stages) || (G.mode === "harvest" ? ["🧺", "🧺", "✨"] : ["🌿", "🌿", "🌿"]);
    const stageIdx = Math.min(2, Math.floor((G.idx / total) * 3));
    const stageEmoji = G.idx >= total ? G.m.emoji : stages[stageIdx];
    box.appendChild(el("div", "grow-stage", stageEmoji));
    const dots = el("div", "grow-dots");
    for (let i = 0; i < total; i++) dots.appendChild(el("span", "dot" + (i < G.idx ? " done" : i === G.idx ? " now" : "")));
    box.appendChild(dots);

    if (G.idx >= total) { finishGrow(); return; }
    const st = G.steps[G.idx];
    if (st.kind === "quiz") renderQuizStep(box, st);
    else if (st.kind === "timing") renderTimingStep(box);
    else if (st.kind === "dig") renderDigStep(box);
    else if (st.kind === "pluck") renderPluckStep(box);
    else if (st.kind === "whack") renderWhackStep(box);
  }

  function renderQuizStep(box, st) {
    const q = st.q;
    window.__mq = { kind: "quiz", correctText: q.choices[q.answer] };
    box.appendChild(el("div", "sign-bubble quiz", "💡 ものしりクイズ! せいかいで ぐんと はかどる!"));
    box.appendChild(el("div", "quiz-q", q.q));
    const wrap = el("div", "choice-wrap");
    let answered = false;
    shuffle(q.choices.map((c, ci) => ci)).forEach((ci) => {
      const b = el("button", "btn choice", q.choices[ci]);
      b.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        const ok = ci === q.answer;
        if (ok) { b.classList.add("correct"); G.score++; sparkle(b); SFX.good(); }
        else {
          b.classList.add("wrong"); SFX.bad();
          const right = [...wrap.children].find((c2) => c2.textContent === q.choices[q.answer]);
          if (right) right.classList.add("correct");
          box.appendChild(el("div", "quiz-hint", "こたえは「" + q.choices[q.answer] + "」!"));
        }
        stepAdvance(ok ? 700 : 1600);
      });
      wrap.appendChild(b);
    });
    box.appendChild(wrap);
  }

  /* --- タイミングゲーム(いわし漁など) --- */
  function renderTimingStep(box) {
    const th = G.g.theme;
    box.appendChild(el("div", "sign-bubble", th.prompt));
    const track = el("div", "timing-track");
    track.appendChild(el("div", "timing-zone good"));
    track.appendChild(el("div", "timing-zone perfect"));
    const marker = el("div", "timing-marker", th.marker);
    track.appendChild(marker);
    box.appendChild(track);
    const stopBtn = el("button", "btn orange timing-stop", th.stopBtn);
    box.appendChild(stopBtn);
    let pos = 0, t = Math.random() * Math.PI * 2, stopped = false;
    window.__mq = { kind: "timing", pos: 0 };
    timingTimer = setInterval(() => {
      t += 0.11;
      pos = 50 + 50 * Math.sin(t);
      marker.style.left = pos + "%";
      window.__mq.pos = pos;
    }, 25);
    stopBtn.addEventListener("click", () => {
      if (stopped) return;
      stopped = true;
      clearInterval(timingTimer);
      const perfect = pos >= 42 && pos <= 58;
      const good = pos >= 30 && pos <= 70;
      if (perfect) { G.score++; box.appendChild(el("div", "quiz-hint good", "✨かんぺき!")); sparkle(stopBtn); SFX.good(); }
      else if (good) { G.score++; box.appendChild(el("div", "quiz-hint good", "いいかんじ!")); SFX.good(); }
      else { box.appendChild(el("div", "quiz-hint", "おしい… まんなかで とめてみよう!")); SFX.bad(); }
      stepAdvance(good ? 750 : 1300);
    });
  }

  /* --- ほりあてゲーム(ねんど・いもほり) --- */
  function renderDigStep(box) {
    const th = G.g.theme || G.g.harvest;
    box.appendChild(el("div", "sign-bubble", th.prompt));
    const cell = rand(9);
    window.__mq = { kind: "dig", cell };
    const grid = el("div", "dig-grid");
    let answered = false, hintOn = true;
    for (let i = 0; i < 9; i++) {
      const c = el("button", "dig-cell", i === cell ? "✨" : "");
      c.dataset.cell = i;
      c.addEventListener("click", () => {
        if (answered || hintOn) return;
        answered = true;
        const ok = i === cell;
        if (ok) { c.classList.add("hit"); c.textContent = G.m.emoji; G.score++; sparkle(c); SFX.good(); }
        else {
          SFX.bad();
          c.classList.add("miss"); c.textContent = "🕳️";
          grid.children[cell].classList.add("hit"); grid.children[cell].textContent = G.m.emoji;
          box.appendChild(el("div", "quiz-hint", "ここに あったみたい!"));
        }
        stepAdvance(ok ? 750 : 1400);
      });
      grid.appendChild(c);
    }
    box.appendChild(grid);
    setTimeout(() => {
      hintOn = false;
      grid.children[cell].textContent = "";
      grid.classList.add("ready");
    }, 900);
  }

  /* --- ぽんぽん摘みゲーム(収穫アクション) --- */
  function renderPluckStep(box) {
    const th = G.g.harvest;
    box.appendChild(el("div", "sign-bubble", th.prompt));
    const field = el("div", "pluck-field");
    const N = 6;
    let left = N;
    const t0 = now();
    window.__mq = { kind: "pluck", remaining: N };
    for (let i = 0; i < N; i++) {
      const b = el("button", "pluck-target", th.target);
      b.style.left = (10 + Math.random() * 74) + "%";
      b.style.top = (10 + Math.random() * 66) + "%";
      b.style.animationDelay = (Math.random() * 0.8) + "s";
      b.addEventListener("click", () => {
        if (b.classList.contains("popped")) return;
        b.classList.add("popped");
        SFX.pop();
        floatUp(b, "+1");
        left--; window.__mq.remaining = left;
        if (left === 0) {
          const pts = (now() - t0) <= 9000 ? 2 : 1;
          G.score += pts;
          box.appendChild(el("div", "quiz-hint good", pts === 2 ? "✨はやい! ぜんぶ とれた!" : "ぜんぶ とれた!"));
          stepAdvance(800);
        }
      });
      field.appendChild(b);
    }
    box.appendChild(field);
  }

  /* --- おせわチャンス(タップ撃退) --- */
  function renderWhackStep(box) {
    const th = G.g.care;
    box.appendChild(el("div", "sign-bubble", `<span class="sign-emoji">${th.target}</span> ${th.label}`));
    const field = el("div", "pluck-field whack");
    box.appendChild(field);
    const TOTAL = 5;
    let shown = 0, hits = 0, active = null;
    window.__mq = { kind: "whack", active: false };
    const spawn = () => {
      if (active) { active.remove(); active = null; window.__mq.active = false; }
      if (shown >= TOTAL) {
        clearInterval(whackTimer);
        box.appendChild(el("div", "quiz-hint good", hits > 0 ? "おせわ ばっちり!" : "おつかれさま!"));
        stepAdvance(800);
        return;
      }
      shown++;
      const b = el("button", "pluck-target whack-t", th.target);
      b.style.left = (10 + Math.random() * 74) + "%";
      b.style.top = (10 + Math.random() * 66) + "%";
      b.addEventListener("click", () => {
        if (b.classList.contains("popped")) return;
        b.classList.add("popped");
        SFX.pop();
        floatUp(b, "エイッ!");
        hits++;
        window.__mq.active = false;
      });
      field.appendChild(b);
      active = b;
      window.__mq.active = true;
    };
    spawn();
    whackTimer = setInterval(spawn, 1400);
  }

  function finishGrow() {
    clearTimers();
    window.__mq = { kind: "done" };
    /* おせわチャンス: プロットに記録して県画面へ */
    if (G.mode === "care") {
      const pl = S.plots[plotKey(G.m, G.p)];
      if (pl) { pl.careDone = true; save(); }
      toast("おせわ ばっちり! しゅうかくの とき ★ボーナス!");
      openPref(G.p.id);
      return;
    }
    let pts = G.score;
    if (G.mode === "harvest") {
      const pl = S.plots[plotKey(G.m, G.p)];
      if (pl && pl.careDone) pts += 1; /* おせわの ほけん */
      delete S.plots[plotKey(G.m, G.p)];
    }
    const stars = pts >= G.maxBase ? 3 : pts >= 2 ? 2 : 1;
    const yieldN = stars === 3 ? 2 : 1;
    for (let i = 0; i < yieldN; i++) S.inv.push({ ref: G.m.id, origin: G.p.id, quality: stars });
    if (!S.zukanMat[G.m.id]) S.zukanMat[G.m.id] = {};
    S.zukanMat[G.m.id][G.p.id] = Math.max(S.zukanMat[G.m.id][G.p.id] || 0, stars);
    /* さんちコンプ(全産地で入手)チェック */
    if (!S.flags) S.flags = {};
    const compKey = "comp_" + G.m.id;
    if (!S.flags[compKey] && G.m.origins.every((o) => S.zukanMat[G.m.id][o])) {
      S.flags[compKey] = true;
      setTimeout(() => { toast("🗾 " + G.m.name + "の さんちコンプ! すごい!"); confetti(); SFX.fanfare(); }, 1200);
    }
    save();
    if (stars === 3) confetti();
    const successWord = (G.g.theme && G.g.theme.success) || (G.g.harvest && G.g.harvest.success) || "しゅうかく せいこう!";
    const body = el("div");
    body.appendChild(el("div", "big-emoji pop", G.m.emoji));
    body.appendChild(el("div", "modal-title-inner", successWord));
    body.appendChild(starRow(stars));
    body.appendChild(el("div", "modal-text", G.m.name + " ×" + yieldN + " を てにいれた!" + (stars === 3 ? "<br>✨さいこうの できばえ! おまけ つき!" : stars === 2 ? "<br>なかなかの できばえ!" : "<br>つぎは もっと じょうずに できるかも!")));
    const go = el("button", "btn primary", "もどる");
    go.addEventListener("click", () => {
      closeModal();
      showTriviaOnce(G.m.id, () => { openPref(G.p.id); });
    });
    body.appendChild(go);
    modal("できた!", body, null);
    updateHeader();
  }

  /* =====================================================
     クラフト(つくる)
     ===================================================== */
  function matchItems(g, r) {
    return S.inv.filter((it) =>
      it.ref === g.ref &&
      (!g.origin || it.origin === g.origin) &&
      (!g.quality || (it.quality || 0) >= g.quality)
    );
  }
  function craftable(r) { return r.ingredients.every((g) => matchItems(g, r).length >= g.count); }

  function pickConsume(r) {
    /* 産地一致(じもと)を優先しつつ、低い★から使う */
    const used = [];
    for (const g of r.ingredients) {
      const cands = matchItems(g, r)
        .filter((it) => !used.includes(it))
        .sort((a, b) => ((b.origin === r.pref) - (a.origin === r.pref)) || ((a.quality || 0) - (b.quality || 0)));
      for (let i = 0; i < g.count; i++) used.push(cands[i]);
    }
    return used;
  }

  function openCraft(r) {
    const used = pickConsume(r);
    const body = el("div");
    body.appendChild(el("div", "big-emoji", r.emoji));
    body.appendChild(el("div", "modal-title-inner", "「" + r.name + "」を つくる?"));
    const vis = el("div", "craft-vis");
    vis.innerHTML = r.ingredients.map((g) => `<span class="craft-ing">${entity(g.ref).emoji}<b>×${g.count}</b></span>`).join('<span class="craft-plus">+</span>') + `<span class="craft-arrow">➡</span><span class="craft-out">${r.emoji}</span>`;
    body.appendChild(vis);
    const listBox = el("div", "use-list");
    used.forEach((it) => {
      const e = entity(it.ref);
      listBox.appendChild(el("div", "use-item",
        `${e.emoji} ${e.name} <span class="chip-note">${pref(it.origin).name}さん</span>` + (it.quality ? " " + "★".repeat(it.quality) : "")));
    });
    body.appendChild(listBox);
    const b = el("button", "btn primary", "つくる!");
    b.addEventListener("click", () => {
      used.forEach((it) => S.inv.splice(S.inv.indexOf(it), 1));
      S.inv.push({ ref: r.id, origin: r.pref, quality: null });
      const jimoto = used.filter((it) => isMat(it.ref)).every((it) => it.origin === r.pref) && used.some((it) => isMat(it.ref));
      const prev = S.zukanProd[r.id];
      S.zukanProd[r.id] = { jimoto: (prev && prev.jimoto) || jimoto };
      save();
      confetti(); SFX.fanfare();
      closeModal();
      const body2 = el("div");
      body2.appendChild(el("div", "big-emoji pop", r.emoji));
      body2.appendChild(el("div", "modal-title-inner", "「" + r.name + "」かんせい!"));
      if (jimoto) body2.appendChild(el("div", "jimoto-banner", "🥇 ぜんぶ じもとの そざい! じもとメダル ゲット!"));
      const go = el("button", "btn primary", "やったー!");
      go.addEventListener("click", () => {
        closeModal();
        showTriviaOnce(r.id, () => { openPref(currentPref); });
      });
      body2.appendChild(go);
      modal("かんせい!", body2, null);
      updateHeader();
    });
    body.appendChild(b);
    modal("つくる", body, true);
  }

  /* =====================================================
     おまつり(Tier4)
     ===================================================== */
  function festivalCard(r, p) {
    const done = S.fest.includes(r.id);
    const card = el("div", "card fest-card" + (done ? " done" : ""));
    const ing = r.ingredients.map((g) => ingChip(g, r)).join("");
    if (!r.implemented) {
      card.innerHTML = `<div class="card-emoji dim">${r.emoji}</div>
        <div class="card-body"><div class="card-name">${r.name} <span class="tier t4">おまつり</span></div>
        <div class="card-sub">じゅんびちゅう… アップデートで あそべるように なるよ!</div></div>`;
      return card;
    }
    if (done) {
      card.innerHTML = `<div class="card-emoji">${r.emoji}</div>
        <div class="card-body"><div class="card-name">${r.name} <span class="jimoto">🏮 かいさいずみ!</span></div>
        <div class="card-sub">${p.name}けん、だいにぎわい!</div></div>`;
      return card;
    }
    card.innerHTML = `<div class="card-emoji">${r.emoji}</div>
      <div class="card-body"><div class="card-name">${r.name} <span class="tier t4">おまつり</span></div>
      <div class="ing-row">${ing}</div></div>`;
    const ok = craftable(r);
    const b = el("button", "btn small " + (ok ? "orange" : "gray"), "ひらく!");
    if (ok) b.addEventListener("click", () => startFestival(r, p));
    else b.addEventListener("click", () => toast("めいぶつを そろえよう!"));
    card.appendChild(b);
    return card;
  }

  function startFestival(r, p) {
    const body = el("div");
    body.appendChild(el("div", "big-emoji", r.emoji));
    body.appendChild(el("div", "modal-text", "おまつりの じゅんびを しよう!<br>ただしい じゅんばんに タップしてね!"));
    const b = el("button", "btn orange", "じゅんびスタート!");
    b.addEventListener("click", () => { closeModal(); festivalPuzzle(r, p); });
    body.appendChild(b);
    modal(r.name, body, true);
  }

  function festivalPuzzle(r, p) {
    const order = r.steps;
    let next = 0;
    const body = el("div");
    body.appendChild(el("div", "modal-text", "1ばんめから じゅんばんに おしてね!"));
    const doneRow = el("div", "fest-done-row");
    body.appendChild(doneRow);
    const wrap = el("div", "choice-wrap");
    shuffle(order.map((s, i) => ({ s, i }))).forEach(({ s, i }) => {
      const b = el("button", "btn choice fest-step", s);
      b.addEventListener("click", () => {
        if (b.disabled) return;
        if (i === next) {
          SFX.good();
          b.classList.add("correct"); b.disabled = true;
          doneRow.appendChild(el("span", "fest-badge", "🏮 " + (next + 1) + ". " + s));
          next++;
          sparkle(b);
          if (next >= order.length) setTimeout(() => finishFestival(r, p), 700);
        } else {
          SFX.bad();
          b.classList.add("shake");
          setTimeout(() => b.classList.remove("shake"), 500);
          toast("あれれ? じゅんばんが ちがうみたい");
        }
      });
      wrap.appendChild(b);
    });
    body.appendChild(wrap);
    modal("じゅんび だんどりパズル", body, null);
  }

  function festivalOverlay(cb) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { cb(); return; }
    const ov = el("div", "fest-ov");
    for (let i = 0; i < 8; i++) {
      const l = el("span", "lantern", "🏮");
      l.style.left = (6 + Math.random() * 86) + "%";
      l.style.animationDelay = (Math.random() * 1.3) + "s";
      ov.appendChild(l);
    }
    for (let i = 0; i < 4; i++) {
      const f = el("span", "hanabi", "🎆");
      f.style.left = (12 + Math.random() * 72) + "%";
      f.style.top = (8 + Math.random() * 32) + "%";
      f.style.animationDelay = (0.5 + Math.random() * 1.2) + "s";
      ov.appendChild(f);
    }
    document.body.appendChild(ov);
    setTimeout(() => { ov.remove(); cb(); }, 2700);
  }

  function finishFestival(r, p) {
    const used = pickConsume(r);
    used.forEach((it) => S.inv.splice(S.inv.indexOf(it), 1));
    S.fest.push(r.id);
    save();
    closeModal();
    SFX.fest();
    festivalOverlay(() => {
      confetti(); setTimeout(confetti, 500);
      const body = el("div");
      body.appendChild(el("div", "big-emoji pop", "🏮🎆🏮"));
      body.appendChild(el("div", "modal-title-inner", r.name + " かいさい!"));
      body.innerHTML += guideRow(p.name + "けんが おおにぎわい!<br>ちずを みてみよう!", "happy");
      const go = el("button", "btn orange", "ちずを みる!");
      go.addEventListener("click", () => {
        closeModal();
        showTriviaOnce(r.id, () => { renderMap(); show("map"); });
      });
      body.appendChild(go);
      modal("🎉 おまつり かいさい! 🎉", body, null);
      updateHeader();
    });
  }

  /* =====================================================
     ものしりカード
     ===================================================== */
  function showTriviaOnce(ref, after) {
    if (S.seenTrivia[ref]) { after(); return; }
    const t = trivia(ref);
    if (!t) { after(); return; }
    S.seenTrivia[ref] = true; save();
    const e = entity(ref);
    SFX.hint();
    const body = el("div", "trivia-card");
    body.innerHTML = guideRow("ものしりカードを みつけたよ!", "wow");
    body.appendChild(el("div", "trivia-head", "📖 ものしりカード"));
    body.appendChild(el("div", "big-emoji", e.emoji));
    body.appendChild(el("div", "trivia-name", e.name));
    body.appendChild(el("div", "trivia-text", t.text));
    const go = el("button", "btn primary", "ずかんに とうろく!");
    go.addEventListener("click", () => { closeModal(); after(); });
    body.appendChild(go);
    modal("あたらしい はっけん!", body, null);
  }

  /* =====================================================
     ずかん
     ===================================================== */
  let zukanTab = "mat";
  function renderZukan() {
    const tabs = $("#zukan-tabs");
    tabs.innerHTML = "";
    const tabCount = (id) => {
      if (id === "mat") return [Object.keys(S.zukanMat).length, D.materials.length];
      const tier = { t2: 2, t3: 3, t4: 4 }[id];
      const rs = D.recipes.filter((r) => r.tier === tier);
      const got = rs.filter((r) => tier === 4 ? S.fest.includes(r.id) : S.zukanProd[r.id]).length;
      return [got, rs.length];
    };
    [["mat", "そざい"], ["t2", "さんぶつ"], ["t3", "めいぶつ"], ["t4", "でんとう"]].forEach(([id, label]) => {
      const [g2, t2] = tabCount(id);
      const b = el("button", "tab" + (zukanTab === id ? " on" : ""), label + " " + g2 + "/" + t2);
      b.addEventListener("click", () => { zukanTab = id; renderZukan(); });
      tabs.appendChild(b);
    });
    const grid = $("#zukan-grid");
    grid.innerHTML = "";
    if (zukanTab === "mat") {
      D.materials.forEach((m) => {
        const rec = S.zukanMat[m.id];
        const card = el("div", "zcard" + (rec ? "" : " unknown"));
        if (!rec) { card.innerHTML = `<div class="z-emoji">❓</div><div class="z-name">？？？</div>`; }
        else {
          const chips = m.origins.map((o) => {
            const st = rec[o];
            return `<span class="z-chip ${st ? "got" : ""}">${pref(o).name}${st ? " " + "★".repeat(st) : " ?"}</span>`;
          }).join("");
          const comp = m.origins.every((o) => rec[o]) ? " comp" : "";
          card.className = "zcard" + comp;
          card.innerHTML = `<div class="z-emoji">${m.emoji}</div><div class="z-name">${m.name}</div><div class="z-chips">${chips}</div>` + (comp ? `<div class="z-comp">🗾さんちコンプ!</div>` : "");
        }
        grid.appendChild(card);
      });
    } else {
      const tier = { t2: 2, t3: 3, t4: 4 }[zukanTab];
      D.recipes.filter((r) => r.tier === tier).forEach((r) => {
        const got = tier === 4 ? S.fest.includes(r.id) : S.zukanProd[r.id];
        const card = el("div", "zcard" + (got ? "" : " unknown") + (got && got.jimoto ? " gold" : ""));
        if (!got) card.innerHTML = `<div class="z-emoji">❓</div><div class="z-name">？？？</div><div class="z-chips"><span class="z-chip">${pref(r.pref).name}</span></div>`;
        else card.innerHTML = `<div class="z-emoji">${r.emoji}</div><div class="z-name">${r.name}</div>
          <div class="z-chips"><span class="z-chip got">${pref(r.pref).name}</span>${got.jimoto ? '<span class="z-chip gold-chip">🥇じもと</span>' : ""}</div>`;
        grid.appendChild(card);
      });
    }
  }

  /* =====================================================
     もちもの
     ===================================================== */
  function renderInventory() {
    const grid = $("#inv-grid");
    grid.innerHTML = "";
    const groups = {};
    for (const it of S.inv) {
      const k = it.ref + "|" + it.origin + "|" + (it.quality || 0);
      groups[k] = (groups[k] || 0) + 1;
    }
    const keys = Object.keys(groups).sort();
    if (!keys.length) { grid.appendChild(el("div", "empty-note", "まだ なにも もっていないよ。<br>けんに いって そざいを そだてよう!")); return; }
    for (const k of keys) {
      const [ref, origin, q] = k.split("|");
      const e = entity(ref);
      const card = el("div", "inv-card");
      card.innerHTML = `<div class="z-emoji">${e.emoji}</div><div class="z-name">${e.name} ×${groups[k]}</div>
        <div class="z-chips"><span class="z-chip got">${pref(origin).name}さん</span>${+q ? '<span class="z-chip">' + "★".repeat(+q) + "</span>" : ""}</div>`;
      grid.appendChild(card);
    }
  }

  /* =====================================================
     モーダル・トースト・演出
     ===================================================== */
  function modal(title, bodyEl, closable) {
    const root = $("#modal-root");
    root.innerHTML = "";
    const back = el("div", "modal-back");
    const box = el("div", "modal-box");
    const head = el("div", "modal-head", title);
    if (closable) {
      const x = el("button", "modal-x", "✕");
      x.addEventListener("click", closeModal);
      head.appendChild(x);
    }
    box.appendChild(head);
    box.appendChild(bodyEl);
    back.appendChild(box);
    root.appendChild(back);
  }
  function closeModal() { $("#modal-root").innerHTML = ""; }

  let toastTimer = null;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("on"), 1800);
  }

  const CONF_COLORS = ["#FF9F40", "#6FBF44", "#FF9EB5", "#FFD166", "#8ED4E8", "#B39DDB"];
  function confetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = $("#confetti-root");
    for (let i = 0; i < 26; i++) {
      const c = el("span", "conf");
      c.style.left = rand(100) + "vw";
      c.style.background = CONF_COLORS[rand(CONF_COLORS.length)];
      c.style.animationDelay = (Math.random() * 0.4) + "s";
      c.style.transform = "rotate(" + rand(360) + "deg)";
      root.appendChild(c);
      setTimeout(() => c.remove(), 2200);
    }
  }
  function sparkle(node) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const s = el("span", "spark", "✨");
    node.appendChild(s);
    setTimeout(() => s.remove(), 800);
  }

  /* =====================================================
     サウンド(WebAudio合成・アセット不要・ミュート可)
     ===================================================== */
  const SND_KEY = "meisanquest-mute";
  let audioCtx = null;
  let muted = false;
  try { muted = localStorage.getItem(SND_KEY) === "1"; } catch (e) { /* noop */ }
  function ac() {
    if (muted) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) { try { audioCtx = new AC(); } catch (e) { return null; } }
    if (audioCtx.state === "suspended") { try { audioCtx.resume(); } catch (e) { /* noop */ } }
    return audioCtx;
  }
  function tone(freq, dur, type, vol, when, slide) {
    const ctx = ac(); if (!ctx) return;
    try {
      const t0 = ctx.currentTime + (when || 0);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.16, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0); o.stop(t0 + dur + 0.05);
    } catch (e) { /* noop */ }
  }
  const SFX = {
    pop() { tone(500 + Math.random() * 400, 0.09, "triangle", 0.16, 0, 180); },
    good() { tone(784, 0.09, "sine", 0.13); tone(1175, 0.15, "sine", 0.13, 0.08); },
    bad() { tone(210, 0.2, "triangle", 0.1, 0, 150); },
    plant() { tone(320, 0.12, "sine", 0.14, 0, 200); tone(520, 0.12, "sine", 0.12, 0.11); },
    collect() { tone(1047, 0.07, "square", 0.08); tone(1568, 0.12, "square", 0.08, 0.06); },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "triangle", 0.15, i * 0.09)); },
    star(i) { tone(880 + i * 240, 0.13, "sine", 0.16); },
    fest() { [523, 659, 784, 880, 1047, 1319].forEach((f, i) => tone(f, 0.18, "triangle", 0.14, i * 0.11)); },
    hint() { tone(988, 0.09, "sine", 0.1); tone(1319, 0.09, "sine", 0.08, 0.09); }
  };

  /* =====================================================
     マスコット「ぴっけ」(たんけんヒヨコ)
     ===================================================== */
  function mascotSVG(mood, size) {
    size = size || 60;
    const eyes = mood === "happy"
      ? '<path d="M23 31 q4.5 -5.5 9 0" stroke="#5a4632" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M40 31 q4.5 -5.5 9 0" stroke="#5a4632" stroke-width="2.8" fill="none" stroke-linecap="round"/>'
      : mood === "wow"
        ? '<circle cx="28" cy="31" r="3.6" fill="#5a4632"/><circle cx="44" cy="31" r="3.6" fill="#5a4632"/>'
        : '<circle cx="28" cy="31" r="3" fill="#5a4632"/><circle cx="44" cy="31" r="3" fill="#5a4632"/>';
    const mouth = mood === "wow"
      ? '<ellipse cx="36" cy="40" rx="3.6" ry="4.6" fill="#E8894A"/>'
      : '<path d="M31.5 37 L40.5 37 L36 43 Z" fill="#F2A24B" stroke="#E0812A" stroke-width="1.2" stroke-linejoin="round"/>';
    return `<svg viewBox="0 0 72 74" width="${size}" height="${size}" class="mascot">
      <ellipse cx="36" cy="67" rx="17" ry="4.5" fill="rgba(90,70,50,.13)"/>
      <ellipse cx="14.5" cy="45" rx="7" ry="10" fill="#FFD34D" stroke="#E8B93E" stroke-width="2" transform="rotate(20 14.5 45)"/>
      <ellipse cx="57.5" cy="45" rx="7" ry="10" fill="#FFD34D" stroke="#E8B93E" stroke-width="2" transform="rotate(-20 57.5 45)"/>
      <ellipse cx="36" cy="42" rx="24" ry="23" fill="#FFDE6A" stroke="#E8B93E" stroke-width="2.5"/>
      <ellipse cx="36" cy="51" rx="14" ry="10" fill="#FFF2BC"/>
      <path d="M27 65 l-2 5 M36 66 l0 5 M45 65 l2 5" stroke="#E8894A" stroke-width="2.5" stroke-linecap="round"/>
      ${eyes}${mouth}
      <circle cx="20.5" cy="37" r="3.6" fill="#FFB3C1" opacity=".85"/>
      <circle cx="51.5" cy="37" r="3.6" fill="#FFB3C1" opacity=".85"/>
      <path d="M15 26 q21 -17 42 0 l-3.5 6.5 q-17.5 -11 -35 0 Z" fill="#7BBF5A" stroke="#5E9C43" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="36" cy="15.5" r="4.2" fill="#FF9F40" stroke="#E0812A" stroke-width="1.6"/>
      <path d="M52 22 q7 -7 10 -2" stroke="#E0812A" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    </svg>`;
  }
  function guideRow(text, mood) {
    return `<div class="guide-row">${mascotSVG(mood || "normal", 56)}<div class="guide-bubble">${text}</div></div>`;
  }

  /* ---------- 地図画面の案内(状況に応じてぴっけが話す) ---------- */
  const MAP_TIPS = [
    "★3で しゅうかくすると、おまけが 1こ もらえるよ!",
    "レシピの ざいりょうは、よその けんに ある ことも…!",
    "まっている あいだに、ほかの けんを かいたく しよう!",
    "ずかんの さんちを コンプすると、いい ことが あるかも?"
  ];
  function anyPlotReady() {
    return Object.keys(S.plots).some((k) => {
      const m = mat(k.split("|")[1]);
      return (now() - S.plots[k].plantedAt) >= m.gather.growSec * 1000;
    });
  }
  function anyCareChance() {
    return Object.keys(S.plots).some((k) => {
      const pl = S.plots[k];
      const m = mat(k.split("|")[1]);
      const prog = (now() - pl.plantedAt) / (m.gather.growSec * 1000);
      return pl.careSpawned && !pl.careDone && prog < 1;
    });
  }
  function anyInfraFull() {
    return Object.keys(S.infra).some((k) => {
      const m = mat(k.split("|")[1]);
      return Math.floor((now() - S.infra[k].lastCollect) / (m.gather.rateSec * 1000)) >= m.gather.max;
    });
  }
  function updateMapGuide() {
    const g = document.querySelector("#map-guide");
    if (!g) return;
    let text, mood = "normal";
    if (!S.unlocked.length) { text = "くもの かかった けんを タップ! ぼうけんの はじまりだ!"; mood = "wow"; }
    else if (anyPlotReady()) { text = "しゅうかくできる はたけが あるよ! みに いこう!"; mood = "happy"; }
    else if (anyCareChance()) { text = "⚡おせわチャンスが きてる! いそげ〜!"; mood = "wow"; }
    else if (anyInfraFull()) { text = "ストックが まんたんの いどや たんぼが あるよ!"; }
    else if (S.unlocked.length < D.prefectures.filter((x) => x.active).length) { text = "つぎの けんも かいたく できるよ! ちずを タップ!"; }
    else { text = MAP_TIPS[Math.floor(now() / 9000) % MAP_TIPS.length]; }
    g.innerHTML = guideRow(text, mood);
  }
  setInterval(() => {
    const scr = document.querySelector("#screen-map");
    if (scr && scr.classList.contains("on")) updateMapGuide();
  }, 3000);

  /* ---------- 県の風景バナー ---------- */
  function sceneSVG(p) {
    const c = p.color;
    const scenes = {
      ibaraki: `
        <ellipse cx="285" cy="88" rx="86" ry="14" fill="#8FD0E0"/>
        <path d="M215 84 q35 6 70 0" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>
        ${[52, 104, 156].map((x, i) => `<rect x="${x - 3}" y="${54 - (i % 2) * 5}" width="6" height="24" rx="3" fill="#8A6242"/>
          <circle cx="${x}" cy="${47 - (i % 2) * 5}" r="16" fill="#FFB9CC" stroke="none"/>
          <circle cx="${x - 9}" cy="${52 - (i % 2) * 5}" r="9" fill="#FFCBD9"/>
          <circle cx="${x + 9}" cy="${52 - (i % 2) * 5}" r="9" fill="#FFCBD9"/>`).join("")}`,
      tochigi: `
        <path d="M-6 84 L58 26 L122 84 Z" fill="#B9A7E0"/>
        <path d="M49 34 L58 26 L67 34 L58 41 Z" fill="#fff"/>
        <path d="M76 86 L150 32 L224 86 Z" fill="#9C8AD1"/>
        <path d="M140 42 L150 32 L160 42 L150 50 Z" fill="#fff"/>
        ${[246, 276, 306, 336].map((x) => `<path d="M${x - 4} 72 q4 -6 8 0" stroke="#4E8A2F" stroke-width="2.4" fill="none"/>
          <circle cx="${x}" cy="77" r="5" fill="#FF5D73"/><circle cx="${x - 1.6}" cy="76" r="1" fill="#fff"/>`).join("")}`,
      chiba: `
        <rect x="0" y="60" width="360" height="32" fill="#7EC8E3"/>
        <path d="M0 66 q22 6 44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0" stroke="#fff" stroke-width="2" fill="none" opacity=".55"/>
        <path d="M46 60 L50 28 L62 28 L66 60 Z" fill="#fff" stroke="#D95A5A" stroke-width="2"/>
        <rect x="47.5" y="38" width="17" height="6" fill="#D95A5A"/>
        <rect x="49" y="50" width="14" height="5" fill="#D95A5A"/>
        <circle cx="56" cy="24" r="5" fill="#FFD34D" stroke="#E0812A" stroke-width="1.6"/>
        <path d="M292 56 l-14 8 h30 Z" fill="#F6F1E5" stroke="#C9BFa6" stroke-width="0"/>
        <path d="M292 30 l0 26" stroke="#8A6242" stroke-width="3"/>
        <path d="M292 31 l17 13 -17 5 Z" fill="#FF9F40"/>`
    };
    return `<svg viewBox="0 0 360 92" class="scene" preserveAspectRatio="xMidYMax slice">
      <defs><linearGradient id="sky-${p.id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#CFEFFB"/><stop offset="1" stop-color="#F2F7E8"/>
      </linearGradient></defs>
      <rect width="360" height="92" fill="url(#sky-${p.id})"/>
      <circle cx="325" cy="18" r="11" fill="#FFD34D" stroke="#F0B429" stroke-width="2"/>
      <ellipse cx="80" cy="100" rx="160" ry="36" fill="${c}" opacity=".4"/>
      <ellipse cx="300" cy="106" rx="180" ry="42" fill="${c}" opacity=".85"/>
      ${scenes[p.id] || ""}
    </svg>`;
  }

  /* ---------- 県ごとの ずかん進捗 ---------- */
  function prefProgress(p) {
    const mats = D.materials.filter((m) => m.origins.includes(p.id));
    const recs = D.recipes.filter((r) => r.pref === p.id);
    let got = 0;
    for (const m of mats) if (S.zukanMat[m.id] && S.zukanMat[m.id][p.id]) got++;
    for (const r of recs) {
      if (r.tier === 4 ? S.fest.includes(r.id) : S.zukanProd[r.id]) got++;
    }
    return { got, total: mats.length + recs.length };
  }

  /* ---------- ふわっと浮く +1 ---------- */
  function floatUp(node, text) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const f = el("span", "float-up", text);
    node.appendChild(f);
    setTimeout(() => f.remove(), 900);
  }

  /* ---------- ★を1つずつ ポン♪ と出す ---------- */
  function starRow(stars) {
    const row = el("div", "star-row");
    for (let i = 0; i < 3; i++) row.appendChild(el("span", "star" + (i < stars ? " will" : ""), "★"));
    setTimeout(() => {
      [...row.children].forEach((s, i) => {
        if (!s.classList.contains("will")) return;
        setTimeout(() => { s.classList.add("on", "pop-star"); SFX.star(i); }, i * 280);
      });
    }, 250);
    return row;
  }

  /* =====================================================
     せってい(保護者ゲートつきリセット)
     ===================================================== */
  function openSettings() {
    const body = el("div");
    body.appendChild(el("div", "modal-text", "めいさんクエスト(かり) v" + D.meta.version + "<br>データは この たんまつの なかにだけ ほぞんされます。"));
    const dbg = el("button", "btn orange", "⏩ かんりしゃ: せいちょう&ストックを まんたんに");
    dbg.addEventListener("click", () => {
      window.__mqAdmin.boostAll();
      closeModal();
      toast("⏩ ぜんぶ まんたんに した(かんりしゃ)");
    });
    body.appendChild(dbg);
    const b = el("button", "btn gray", "データを リセットする(おうちのひと よう)");
    b.addEventListener("click", () => {
      const a = 2 + rand(7), c = 2 + rand(7);
      const ans = prompt("おうちのひとに かくにん: " + a + " + " + c + " = ?");
      if (ans !== null && parseInt(ans, 10) === a + c) {
        if (confirm("ほんとうに さいしょから はじめますか?")) {
          S = defaultState(); save(); closeModal(); renderMap(); show("map"); toast("リセットしました");
        }
      } else if (ans !== null) { toast("こたえが ちがうみたい"); }
    });
    body.appendChild(b);
    modal("せってい", body, true);
  }

  /* =====================================================
     初期化
     ===================================================== */
  function init() {
    $("#app-title").textContent = D.meta.title;
    $("#app-subtitle").textContent = D.meta.subtitle;
    document.querySelectorAll(".nav-btn").forEach((b) => {
      b.addEventListener("click", () => {
        const go = b.dataset.go;
        if (go === "map") { renderMap(); show("map"); }
        if (go === "zukan") { renderZukan(); show("zukan"); }
        if (go === "inv") { renderInventory(); show("inv"); }
      });
    });
    $("#btn-settings").addEventListener("click", openSettings);
    const sndBtn = $("#btn-sound");
    if (sndBtn) {
      sndBtn.textContent = muted ? "🔇" : "🔊";
      sndBtn.addEventListener("click", () => {
        muted = !muted;
        try { localStorage.setItem(SND_KEY, muted ? "1" : "0"); } catch (e) { /* noop */ }
        sndBtn.textContent = muted ? "🔇" : "🔊";
        if (!muted) SFX.good();
      });
    }
    document.addEventListener("pointerdown", () => ac(), { once: true });
    $("#btn-back-pref").addEventListener("click", () => { renderMap(); show("map"); });
    $("#btn-back-grow").addEventListener("click", () => { clearTimers(); openPref(currentPref || (G && G.p.id)); });
    renderMap();
    show("map");
  }
  document.addEventListener("DOMContentLoaded", init);
})();

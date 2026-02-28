// app.js — Local + Online + CPU (no bundlers, GitHub Pages friendly)
// Requires firebase.js to define global `db` for online mode. CPU/Local work without Firebase.

(() => {
  const $ = (id) => document.getElementById(id);

  // Screens
  const screens = { home: $("screenHome"), setup: $("screenSetup"), game: $("screenGame") };
  function showScreen(which) {
    Object.entries(screens).forEach(([k, el]) => el && el.classList.toggle("hidden", k !== which));
  }

  function showModal(id, show) {
    const el = $(id);
    if (el) el.classList.toggle("hidden", !show);
  }

  // ------------------------------------------------------------
  // Expanded City DB (small, curated, global; used by CPU mode)
  // ------------------------------------------------------------
  const CITY_DB = [
    // North America
    { name:"New York", country:"United States", continent:"North America", hemi:"N", coastal:true, capital:false, lang:"English" },
    { name:"Los Angeles", country:"United States", continent:"North America", hemi:"N", coastal:true, capital:false, lang:"English" },
    { name:"Chicago", country:"United States", continent:"North America", hemi:"N", coastal:false, capital:false, lang:"English" },
    { name:"Washington, D.C.", country:"United States", continent:"North America", hemi:"N", coastal:false, capital:true, lang:"English" },
    { name:"Toronto", country:"Canada", continent:"North America", hemi:"N", coastal:false, capital:false, lang:"English" },
    { name:"Montreal", country:"Canada", continent:"North America", hemi:"N", coastal:false, capital:false, lang:"French" },
    { name:"Mexico City", country:"Mexico", continent:"North America", hemi:"N", coastal:false, capital:true, lang:"Spanish" },
    { name:"Havana", country:"Cuba", continent:"North America", hemi:"N", coastal:true, capital:true, lang:"Spanish" },

    // South America
    { name:"Montevideo", country:"Uruguay", continent:"South America", hemi:"S", coastal:true, capital:true, lang:"Spanish" },
    { name:"Buenos Aires", country:"Argentina", continent:"South America", hemi:"S", coastal:true, capital:true, lang:"Spanish" },
    { name:"Santiago", country:"Chile", continent:"South America", hemi:"S", coastal:false, capital:true, lang:"Spanish" },
    { name:"Lima", country:"Peru", continent:"South America", hemi:"S", coastal:true, capital:true, lang:"Spanish" },
    { name:"Bogotá", country:"Colombia", continent:"South America", hemi:"N", coastal:false, capital:true, lang:"Spanish" },
    { name:"Rio de Janeiro", country:"Brazil", continent:"South America", hemi:"S", coastal:true, capital:false, lang:"Portuguese" },
    { name:"São Paulo", country:"Brazil", continent:"South America", hemi:"S", coastal:false, capital:false, lang:"Portuguese" },

    // Europe (mix)
    { name:"London", country:"United Kingdom", continent:"Europe", hemi:"N", coastal:true, capital:true, lang:"English" },
    { name:"Dublin", country:"Ireland", continent:"Europe", hemi:"N", coastal:true, capital:true, lang:"English" },
    { name:"Paris", country:"France", continent:"Europe", hemi:"N", coastal:false, capital:true, lang:"French" },
    { name:"Marseille", country:"France", continent:"Europe", hemi:"N", coastal:true, capital:false, lang:"French" },
    { name:"Madrid", country:"Spain", continent:"Europe", hemi:"N", coastal:false, capital:true, lang:"Spanish" },
    { name:"Barcelona", country:"Spain", continent:"Europe", hemi:"N", coastal:true, capital:false, lang:"Spanish" },
    { name:"Lisbon", country:"Portugal", continent:"Europe", hemi:"N", coastal:true, capital:true, lang:"Portuguese" },
    { name:"Rome", country:"Italy", continent:"Europe", hemi:"N", coastal:false, capital:true, lang:"Italian" },
    { name:"Milan", country:"Italy", continent:"Europe", hemi:"N", coastal:false, capital:false, lang:"Italian" },
    { name:"Venice", country:"Italy", continent:"Europe", hemi:"N", coastal:true, capital:false, lang:"Italian" },
    { name:"Berlin", country:"Germany", continent:"Europe", hemi:"N", coastal:false, capital:true, lang:"German" },
    { name:"Amsterdam", country:"Netherlands", continent:"Europe", hemi:"N", coastal:true, capital:true, lang:"Dutch" },
    { name:"Oslo", country:"Norway", continent:"Europe", hemi:"N", coastal:true, capital:true, lang:"Norwegian" },
    { name:"Stockholm", country:"Sweden", continent:"Europe", hemi:"N", coastal:true, capital:true, lang:"Swedish" },
    { name:"Helsinki", country:"Finland", continent:"Europe", hemi:"N", coastal:true, capital:true, lang:"Finnish" },
    { name:"Reykjavík", country:"Iceland", continent:"Europe", hemi:"N", coastal:true, capital:true, lang:"Icelandic" },
    { name:"Athens", country:"Greece", continent:"Europe", hemi:"N", coastal:true, capital:true, lang:"Greek" },

    // Africa
    { name:"Cairo", country:"Egypt", continent:"Africa", hemi:"N", coastal:false, capital:true, lang:"Arabic" },
    { name:"Casablanca", country:"Morocco", continent:"Africa", hemi:"N", coastal:true, capital:false, lang:"Arabic" },
    { name:"Nairobi", country:"Kenya", continent:"Africa", hemi:"S", coastal:false, capital:true, lang:"English" },
    { name:"Cape Town", country:"South Africa", continent:"Africa", hemi:"S", coastal:true, capital:false, lang:"English" },
    { name:"Johannesburg", country:"South Africa", continent:"Africa", hemi:"S", coastal:false, capital:false, lang:"English" },

    // Asia
    { name:"Tokyo", country:"Japan", continent:"Asia", hemi:"N", coastal:true, capital:true, lang:"Japanese" },
    { name:"Osaka", country:"Japan", continent:"Asia", hemi:"N", coastal:true, capital:false, lang:"Japanese" },
    { name:"Seoul", country:"South Korea", continent:"Asia", hemi:"N", coastal:false, capital:true, lang:"Korean" },
    { name:"Beijing", country:"China", continent:"Asia", hemi:"N", coastal:false, capital:true, lang:"Chinese" },
    { name:"Shanghai", country:"China", continent:"Asia", hemi:"N", coastal:true, capital:false, lang:"Chinese" },
    { name:"Hong Kong", country:"China", continent:"Asia", hemi:"N", coastal:true, capital:false, lang:"Chinese" },
    { name:"Singapore", country:"Singapore", continent:"Asia", hemi:"N", coastal:true, capital:true, lang:"English" },
    { name:"Bangkok", country:"Thailand", continent:"Asia", hemi:"N", coastal:false, capital:true, lang:"Thai" },
    { name:"Jakarta", country:"Indonesia", continent:"Asia", hemi:"S", coastal:true, capital:true, lang:"Indonesian" },
    { name:"Delhi", country:"India", continent:"Asia", hemi:"N", coastal:false, capital:true, lang:"Hindi" },
    { name:"Mumbai", country:"India", continent:"Asia", hemi:"N", coastal:true, capital:false, lang:"Hindi" },
    { name:"Istanbul", country:"Turkey", continent:"Eurasia", hemi:"N", coastal:true, capital:false, lang:"Turkish" },

    // Oceania
    { name:"Sydney", country:"Australia", continent:"Oceania", hemi:"S", coastal:true, capital:false, lang:"English" },
    { name:"Melbourne", country:"Australia", continent:"Oceania", hemi:"S", coastal:true, capital:false, lang:"English" },
    { name:"Canberra", country:"Australia", continent:"Oceania", hemi:"S", coastal:false, capital:true, lang:"English" },
    { name:"Auckland", country:"New Zealand", continent:"Oceania", hemi:"S", coastal:true, capital:false, lang:"English" },
    { name:"Wellington", country:"New Zealand", continent:"Oceania", hemi:"S", coastal:true, capital:true, lang:"English" },
  ];

  // Quick questions (unchanged)
  const QUICK = [
    "Is your city in Europe?",
    "Is your city in Asia?",
    "Is your city in Africa?",
    "Is your city in North America?",
    "Is your city in South America?",
    "Is your city in Oceania?",
    "Is your city in the Northern Hemisphere?",
    "Is your city in the Southern Hemisphere?",
    "Is your city coastal?",
    "Is your city a national capital?",
    "Do most people speak Spanish in your city?",
    "Do most people speak English in your city?",
  ];

  // ------------------------------------------------------------
  // Shared elements
  // ------------------------------------------------------------
  const els = {
    btnReset: $("btnReset"),
    btnBackHome: $("btnBackHome"),
    btnStartLocal: $("btnStartLocal"),
    btnCreateRoom: $("btnCreateRoom"),
    btnJoinRoom: $("btnJoinRoom"),
    btnStartCPU: $("btnStartCPU"),
    cpuDifficulty: $("cpuDifficulty"),

    modeLabel: $("modeLabel"),
    setupHint: $("setupHint"),
    roomLabel: $("roomLabel"),
    roleLabel: $("roleLabel"),
    roomLabel2: $("roomLabel2"),
    onlineStatus: $("onlineStatus"),

    p1Name: $("p1Name"),
    p2Name: $("p2Name"),
    btnSetP1: $("btnSetP1"),
    btnSetP2: $("btnSetP2"),
    p1CityStatus: $("p1CityStatus"),
    p2CityStatus: $("p2CityStatus"),
    btnBeginGame: $("btnBeginGame"),

    turnLabel: $("turnLabel"),
    phaseLabel: $("phaseLabel"),

    askArea: $("askArea"),
    answerArea: $("answerArea"),
    guessArea: $("guessArea"),
    endArea: $("endArea"),

    questionInput: $("questionInput"),
    btnAsk: $("btnAsk"),
    btnQuick: $("btnQuick"),
    btnGuess: $("btnGuess"),

    questionDisplay: $("questionDisplay"),
    btnYes: $("btnYes"),
    btnNo: $("btnNo"),

    guessInput: $("guessInput"),
    btnSubmitGuess: $("btnSubmitGuess"),
    btnCancelGuess: $("btnCancelGuess"),

    endMessage: $("endMessage"),
    btnPlayAgain: $("btnPlayAgain"),

    btnClearLog: $("btnClearLog"),
    log: $("log"),

    // modals
    secretCityInput: $("secretCityInput"),
    btnSaveCity: $("btnSaveCity"),
    btnCancelCity: $("btnCancelCity"),
    btnCloseModal: $("btnCloseModal"),
    modalTitle: $("modalTitle"),
    modalHint: $("modalHint"),

    quickList: $("quickList"),
    btnCloseQuick: $("btnCloseQuick"),
  };

  function logLine(text) {
    if (!els.log) return;
    const div = document.createElement("div");
    div.className = "logline";
    div.textContent = text;
    els.log.prepend(div);
  }
  function clearLogUI() { if (els.log) els.log.innerHTML = ""; }

  function normalizeCity(s) {
    return (s || "")
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .replace(/\s+/g, " ");
  }

  // ------------------------------------------------------------
  // Mode state
  // ------------------------------------------------------------
  let activeMode = null; // "local" | "online" | "cpu"
  let localEditing = null; // "P1" | "P2"

  // ------------------------------------------------------------
  // LOCAL MODE (pass-and-play) — same logic as your working version
  // ------------------------------------------------------------
  const local = {
    p1: { name: "Player 1", city: "" },
    p2: { name: "Player 2", city: "" },
    turn: "P1",
    phase: "setup",
    currentQuestion: "",
    winner: null,
  };

  function localSyncSetupUI() {
    els.modeLabel.textContent = "Local";
    els.roomLabel2.textContent = "—";
    els.roomLabel.textContent = "—";
    els.roleLabel.textContent = "—";
    els.onlineStatus.textContent = "—";
    els.setupHint.textContent = "One phone pass-and-play. Hand the phone over when setting cities.";

    els.p1Name.disabled = false;
    els.p2Name.disabled = false;
    els.btnSetP1.disabled = false;
    els.btnSetP2.disabled = false;

    els.p1Name.value = local.p1.name || "Player 1";
    els.p2Name.value = local.p2.name || "Player 2";
    els.p1CityStatus.textContent = local.p1.city ? "set" : "not set";
    els.p2CityStatus.textContent = local.p2.city ? "set" : "not set";
    els.btnBeginGame.disabled = !(!!local.p1.city && !!local.p2.city);
  }

  function localSyncGameUI() {
    els.turnLabel.textContent = local.turn;
    els.phaseLabel.textContent = local.phase;

    const showAsk = local.phase === "ask";
    const showAnswer = local.phase === "answer";
    const showGuess = local.phase === "guess";
    const showEnd = local.phase === "end";

    els.askArea.classList.toggle("hidden", !showAsk);
    els.answerArea.classList.toggle("hidden", !showAnswer);
    els.guessArea.classList.toggle("hidden", !showGuess);
    els.endArea.classList.toggle("hidden", !showEnd);

    els.btnAsk.disabled = !showAsk;
    els.btnQuick.disabled = !showAsk;
    els.btnGuess.disabled = !showAsk;

    els.btnYes.disabled = !showAnswer;
    els.btnNo.disabled = !showAnswer;

    els.questionDisplay.textContent = local.currentQuestion || "—";

    if (showEnd && local.winner) {
      const name = local.winner === "P1" ? local.p1.name : local.p2.name;
      els.endMessage.textContent = `${name} wins!`;
    }
  }

  function localBegin() {
    local.turn = "P1";
    local.phase = "ask";
    local.currentQuestion = "";
    local.winner = null;
    clearLogUI();
    logLine("Game started!");
    showScreen("game");
    localSyncGameUI();
  }

  function localAsk() {
    const q = (els.questionInput.value || "").trim();
    if (!q) return;
    local.currentQuestion = q;
    local.phase = "answer";
    logLine(`${local.turn} asked: ${q}`);
    els.questionInput.value = "";
    localSyncGameUI();
  }

  function localAnswer(ans) {
    const answerer = local.turn === "P1" ? "P2" : "P1";
    logLine(`${answerer} answered: ${ans}`);
    local.currentQuestion = "";
    local.turn = answerer;
    local.phase = "ask";
    localSyncGameUI();
  }

  function localOpenGuess() { local.phase = "guess"; localSyncGameUI(); }
  function localCancelGuess() { local.phase = "ask"; localSyncGameUI(); }

  function localSubmitGuess() {
    const guess = (els.guessInput.value || "").trim();
    if (!guess) return;
    const opponent = local.turn === "P1" ? "P2" : "P1";
    const opponentCity = opponent === "P1" ? local.p1.city : local.p2.city;
    const ok = normalizeCity(guess) === normalizeCity(opponentCity);

    if (ok) {
      local.phase = "end";
      local.winner = local.turn;
      logLine(`${local.turn} guessed "${guess}" — CORRECT!`);
    } else {
      logLine(`${local.turn} guessed "${guess}" — wrong.`);
      local.turn = opponent;
      local.phase = "ask";
    }
    els.guessInput.value = "";
    localSyncGameUI();
  }

  function localNewCities() {
    local.p1.city = "";
    local.p2.city = "";
    local.phase = "setup";
    showScreen("setup");
    localSyncSetupUI();
  }

  // ------------------------------------------------------------
  // ONLINE MODE (two phones) — same as your working version
  // ------------------------------------------------------------
  const LS_KEY = "city_guess_online_identity_v2";
  const online = { gameId:null, role:null, playerKey:null, liveRef:null, logRef:null, logListener:null };

  function ensureIdentity() {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (saved?.playerKey) return saved.playerKey;
    } catch {}
    const pk = "p_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(LS_KEY, JSON.stringify({ playerKey: pk }));
    return pk;
  }

  function onlineRef(path="") { return db.ref("games/" + online.gameId + (path ? "/" + path : "")); }

  async function claimRole() {
    const playersRef = onlineRef("players");
    const snap = await playersRef.once("value");
    const players = snap.val() || {};

    for (const r of ["P1","P2"]) {
      if (players?.[r]?.owner === online.playerKey) {
        online.role = r;
        await playersRef.child(r).update({ online:true, lastSeen: Date.now() });
        return r;
      }
    }
    for (const r of ["P1","P2"]) {
      if (!players?.[r]?.owner) {
        await playersRef.child(r).update({ owner: online.playerKey, online:true, joinedAt: Date.now(), lastSeen: Date.now() });
        online.role = r;
        return r;
      }
    }
    online.role = null;
    return null;
  }

  function syncOnlineSetupUI(hint) {
    els.modeLabel.textContent = "Online";
    els.roomLabel2.textContent = online.gameId || "—";
    els.roomLabel.textContent = online.gameId || "—";
    els.roleLabel.textContent = online.role || "—";
    els.onlineStatus.textContent = "Firebase: connected";
    els.setupHint.textContent = hint || "Set your name & city. Player 1 starts the game.";

    const isP1 = online.role === "P1";
    els.p1Name.disabled = !isP1;
    els.btnSetP1.disabled = !isP1;
    els.p2Name.disabled = isP1;
    els.btnSetP2.disabled = isP1;
    els.btnBeginGame.disabled = !isP1;
  }

  function attachOnlineListeners() {
    if (online.liveRef) online.liveRef.off();
    if (online.logRef && online.logListener) online.logRef.off("child_added", online.logListener);

    online.liveRef = onlineRef();
    online.logRef = onlineRef("log");

    online.liveRef.on("value", (snap) => {
      const g = snap.val();
      if (!g) return;

      const p1Set = !!g.players?.P1?.city;
      const p2Set = !!g.players?.P2?.city;
      els.p1CityStatus.textContent = p1Set ? "set" : "not set";
      els.p2CityStatus.textContent = p2Set ? "set" : "not set";

      if (g.players?.P1?.name && els.p1Name.disabled) els.p1Name.value = g.players.P1.name;
      if (g.players?.P2?.name && els.p2Name.disabled) els.p2Name.value = g.players.P2.name;

      if (online.role === "P1") {
        els.btnBeginGame.disabled = !(p1Set && p2Set && g.phase === "setup");
      }

      if (g.phase && g.phase !== "setup") showScreen("game");

      els.turnLabel.textContent = g.turn || "—";
      els.phaseLabel.textContent = g.phase || "—";

      const myTurn = g.turn === online.role;

      els.askArea.classList.toggle("hidden", g.phase !== "ask");
      els.answerArea.classList.toggle("hidden", g.phase !== "answer");
      els.guessArea.classList.toggle("hidden", g.phase !== "guess");
      els.endArea.classList.toggle("hidden", g.phase !== "end");

      els.btnAsk.disabled = !(myTurn && g.phase === "ask");
      els.btnQuick.disabled = !(myTurn && g.phase === "ask");
      els.btnGuess.disabled = !(myTurn && g.phase === "ask");

      els.btnYes.disabled = !(!myTurn && g.phase === "answer");
      els.btnNo.disabled = !(!myTurn && g.phase === "answer");

      els.questionDisplay.textContent = g.currentQuestion || "—";

      if (g.phase === "end" && g.winner) {
        const nm = g.players?.[g.winner]?.name || g.winner;
        els.endMessage.textContent = `${nm} wins!`;
      }
    });

    clearLogUI();
    online.logListener = (snap) => {
      const v = snap.val();
      if (v?.text) logLine(v.text);
    };
    online.logRef.limitToLast(150).on("child_added", online.logListener);
  }

  async function onlineCreateRoom() {
    if (typeof db === "undefined") { alert("Firebase not ready. Check firebase.js."); return; }
    online.playerKey = ensureIdentity();
    const gid = Math.random().toString(36).slice(2, 8).toUpperCase();
    online.gameId = gid;

    await db.ref("games/" + gid).set({
      status: "setup",
      phase: "setup",
      turn: "P1",
      createdAt: Date.now(),
      players: {
        P1: { owner: online.playerKey, online: true, joinedAt: Date.now(), name: "Player 1", city: null },
        P2: { owner: null, online: false, joinedAt: null, name: "Player 2", city: null }
      }
    });

    await claimRole();
    attachOnlineListeners();
    showScreen("setup");
    syncOnlineSetupUI("You are Player 1. Set your name & city. Share the room code with Player 2.");
    alert("Room Code: " + gid);
  }

  async function onlineJoinRoom() {
    if (typeof db === "undefined") { alert("Firebase not ready. Check firebase.js."); return; }
    online.playerKey = ensureIdentity();

    const code = prompt("Enter Room Code");
    if (!code) return;
    const gid = code.toUpperCase();
    online.gameId = gid;

    const snap = await db.ref("games/" + gid).once("value");
    if (!snap.exists()) { alert("Room not found: " + gid); online.gameId = null; return; }

    await claimRole();
    if (!online.role) { alert("Room is full."); online.gameId = null; return; }

    attachOnlineListeners();
    showScreen("setup");
    syncOnlineSetupUI(`You are ${online.role}. Set your name & city.`);
  }

  async function onlineSaveMyName() {
    if (!online.role) return;
    const input = online.role === "P1" ? els.p1Name : els.p2Name;
    const name = (input.value || "").trim().slice(0, 18) || online.role;
    await onlineRef(`players/${online.role}/name`).set(name);
  }

  async function onlineSaveMyCity(city) {
    if (!online.role) return;
    const clean = (city || "").trim().slice(0, 60);
    if (!clean) return;
    await onlineRef(`players/${online.role}/city`).set(clean);
  }

  async function onlineBeginGame() {
    const snap = await onlineRef().once("value");
    const g = snap.val();
    if (!g?.players?.P1?.city || !g?.players?.P2?.city) { alert("Both players must set a city first."); return; }
    await onlineRef().update({ status:"playing", phase:"ask", turn:"P1", currentQuestion:"", winner:null, lastAnswer:null });
    await onlineRef("log").push({ t: Date.now(), text: "Game started!" });
  }

  async function onlineAskQuestion() {
    const q = (els.questionInput.value || "").trim();
    if (!q) return;
    await onlineRef().update({ currentQuestion: q, phase: "answer" });
    await onlineRef("log").push({ t: Date.now(), text: `${online.role} asked: ${q}` });
    els.questionInput.value = "";
  }

  async function onlineAnswer(ans) {
    const snap = await onlineRef().once("value");
    const g = snap.val();
    if (!g) return;
    const nextTurn = g.turn === "P1" ? "P2" : "P1";
    await onlineRef().update({ lastAnswer: ans, phase:"ask", turn: nextTurn, currentQuestion:"" });
    await onlineRef("log").push({ t: Date.now(), text: `${online.role} answered: ${ans}` });
  }

  async function onlineOpenGuess() { await onlineRef().update({ phase: "guess" }); }
  async function onlineCancelGuess() { await onlineRef().update({ phase: "ask" }); }

  async function onlineSubmitGuess() {
    const guess = (els.guessInput.value || "").trim();
    if (!guess) return;

    const snap = await onlineRef().once("value");
    const g = snap.val();
    if (!g) return;

    const opponent = online.role === "P1" ? "P2" : "P1";
    const opponentCity = g.players?.[opponent]?.city || "";
    const ok = normalizeCity(guess) === normalizeCity(opponentCity);

    if (ok) {
      await onlineRef().update({ phase: "end", winner: online.role });
      await onlineRef("log").push({ t: Date.now(), text: `${online.role} guessed "${guess}" — CORRECT!` });
    } else {
      const nextTurn = g.turn === "P1" ? "P2" : "P1";
      await onlineRef().update({ phase: "ask", turn: nextTurn });
      await onlineRef("log").push({ t: Date.now(), text: `${online.role} guessed "${guess}" — wrong.` });
    }
    els.guessInput.value = "";
  }

  async function onlineNewCities() {
    await onlineRef().update({ phase: "setup", status: "setup", currentQuestion: "", winner: null });
    await onlineRef("players/P1/city").set(null);
    await onlineRef("players/P2/city").set(null);
    await onlineRef("log").push({ t: Date.now(), text: "New cities needed." });
    showScreen("setup");
  }

  async function onlineClearLog() { await onlineRef("log").set(null); clearLogUI(); }

  // ------------------------------------------------------------
  // CPU MODE (solo) — NEW
  // Key fix: Unsupported questions do NOT cost your turn.
  // ------------------------------------------------------------
  const cpu = {
    difficulty: "easy",
    secret: null,
    turn: "YOU",        // YOU always asks, CPU answers
    phase: "ask",       // ask | guess | end
    winner: null,
    lastQ: "",
  };

  function cpuPickCity() {
    // easy: slightly more common cities (first half)
    // medium: full list
    // hard: full list + CPU may "dodge" vague language questions (still answers, but says unsupported more)
    const n = CITY_DB.length;
    if (cpu.difficulty === "easy") return CITY_DB[Math.floor(Math.random() * Math.max(10, Math.floor(n * 0.55)))];
    return CITY_DB[Math.floor(Math.random() * n)];
  }

  function cpuSyncSetupUI() {
    els.modeLabel.textContent = `CPU (${cpu.difficulty})`;
    els.roomLabel2.textContent = "—";
    els.roomLabel.textContent = "—";
    els.roleLabel.textContent = "—";
    els.onlineStatus.textContent = "—";
    els.setupHint.textContent = "Solo mode: Ask questions, then guess the CPU city. (No secret city needed.)";

    // Setup UI isn't used much for CPU — we’ll jump straight into game.
    els.p1Name.disabled = true;
    els.p2Name.disabled = true;
    els.btnSetP1.disabled = true;
    els.btnSetP2.disabled = true;
    els.p1CityStatus.textContent = "—";
    els.p2CityStatus.textContent = "—";
    els.btnBeginGame.disabled = true;
  }

  function cpuStart(difficulty) {
    cpu.difficulty = difficulty || "easy";
    cpu.secret = cpuPickCity();
    cpu.phase = "ask";
    cpu.winner = null;
    cpu.lastQ = "";
    clearLogUI();
    logLine("🦖 CPU has chosen a city…");
    showScreen("game");
    cpuSyncGameUI();
  }

  function cpuSyncGameUI() {
    els.turnLabel.textContent = "YOU";
    els.phaseLabel.textContent = cpu.phase;

    els.askArea.classList.toggle("hidden", cpu.phase !== "ask");
    els.answerArea.classList.add("hidden"); // CPU answers in log; no answer buttons
    els.guessArea.classList.toggle("hidden", cpu.phase !== "guess");
    els.endArea.classList.toggle("hidden", cpu.phase !== "end");

    els.btnAsk.disabled = cpu.phase !== "ask";
    els.btnQuick.disabled = cpu.phase !== "ask";
    els.btnGuess.disabled = cpu.phase !== "ask";

    // hide yes/no for CPU mode
    els.btnYes.disabled = true;
    els.btnNo.disabled = true;

    if (cpu.phase === "end") {
      els.endMessage.textContent = cpu.winner === "YOU" ? "You win! 🏆" : "CPU wins!";
    }
  }

  // CPU question parser (simple but solid)
  function cpuPredicateFromQuestion(qRaw) {
    const q = (qRaw || "").toLowerCase();

    const has = (s) => q.includes(s);

    // Continents
    if (has("north america")) return (c) => c.continent === "North America";
    if (has("south america")) return (c) => c.continent === "South America";
    if (has("europe")) return (c) => c.continent === "Europe";
    if (has("asia")) return (c) => c.continent === "Asia";
    if (has("africa")) return (c) => c.continent === "Africa";
    if (has("oceania") || has("australia")) return (c) => c.continent === "Oceania";

    // Hemisphere
    if (has("northern hemisphere") || (has("north") && has("hemisphere"))) return (c) => c.hemi === "N";
    if (has("southern hemisphere") || (has("south") && has("hemisphere"))) return (c) => c.hemi === "S";

    // Coastal / capital
    if (has("coastal") || has("on the coast") || has("by the sea")) return (c) => !!c.coastal;
    if (has("capital")) return (c) => !!c.capital;

    // Language (loose)
    if (has("spanish")) return (c) => c.lang === "Spanish";
    if (has("english")) return (c) => c.lang === "English";
    if (has("french")) return (c) => c.lang === "French";
    if (has("portuguese")) return (c) => c.lang === "Portuguese";

    // Country mentions (if user asks "in italy", "in japan", etc.)
    const countryMap = [
      ["italy","Italy"],["spain","Spain"],["portugal","Portugal"],["france","France"],
      ["germany","Germany"],["norway","Norway"],["sweden","Sweden"],["finland","Finland"],
      ["iceland","Iceland"],["greece","Greece"],["united states","United States"],["usa","United States"],
      ["canada","Canada"],["mexico","Mexico"],["brazil","Brazil"],["argentina","Argentina"],
      ["uruguay","Uruguay"],["chile","Chile"],["peru","Peru"],["colombia","Colombia"],
      ["egypt","Egypt"],["morocco","Morocco"],["kenya","Kenya"],["south africa","South Africa"],
      ["japan","Japan"],["china","China"],["india","India"],["turkey","Turkey"],
      ["australia","Australia"],["new zealand","New Zealand"],["ireland","Ireland"],["united kingdom","United Kingdom"],
      ["singapore","Singapore"],["thailand","Thailand"],["indonesia","Indonesia"],
    ];
    for (const [needle, country] of countryMap) {
      if (has("in " + needle) || q.trim() === needle || has("in " + needle + "?")) {
        return (c) => c.country === country;
      }
    }

    return null; // unsupported
  }

  function cpuAsk() {
    const q = (els.questionInput.value || "").trim();
    if (!q) return;

    const pred = cpuPredicateFromQuestion(q);

    // LOGIC FIX: Unsupported => do NOT change phase/turn. Just message.
    if (!pred) {
      logLine(`🦭 CPU: “Unsupported question.” Try continent/hemisphere/coastal/capital/country/language.`);
      return;
    }

    const ans = !!pred(cpu.secret);
    logLine(`You asked: ${q}`);
    logLine(`🐉 CPU answers: ${ans ? "YES" : "NO"}`);
    els.questionInput.value = "";
  }

  function cpuOpenGuess() { cpu.phase = "guess"; cpuSyncGameUI(); }
  function cpuCancelGuess() { cpu.phase = "ask"; cpuSyncGameUI(); }

  function cpuSubmitGuess() {
    const guess = (els.guessInput.value || "").trim();
    if (!guess) return;

    const ok = normalizeCity(guess) === normalizeCity(cpu.secret.name);
    if (ok) {
      cpu.phase = "end";
      cpu.winner = "YOU";
      logLine(`You guessed "${guess}" — CORRECT! The city was ${cpu.secret.name}.`);
    } else {
      // In CPU mode, you can keep playing; wrong guess just logs it.
      logLine(`You guessed "${guess}" — nope.`);
      if (cpu.difficulty === "hard") logLine("🦖 CPU: “Keep going.”");
      cpu.phase = "ask";
    }
    els.guessInput.value = "";
    cpuSyncGameUI();
  }

  function cpuPlayAgain() {
    cpuStart(cpu.difficulty);
  }

  // ------------------------------------------------------------
  // Shared modal logic
  // ------------------------------------------------------------
  function openCityModal(forRole, hintText) {
    els.modalTitle.textContent = forRole === "P1" ? "Player 1: secret city" : "Player 2: secret city";
    els.modalHint.textContent = hintText || "Make sure the other player isn't looking 👀";
    els.secretCityInput.value = "";
    showModal("modal", true);
    localEditing = forRole;
    els.secretCityInput.focus();
  }

  function closeCityModal() { showModal("modal", false); localEditing = null; }

  function buildQuickList() {
    els.quickList.innerHTML = "";
    QUICK.forEach((q) => {
      const item = document.createElement("div");
      item.className = "quickitem";
      item.textContent = q;
      item.addEventListener("click", () => {
        els.questionInput.value = q;
        showModal("quickModal", false);
      });
      els.quickList.appendChild(item);
    });
  }

  function resetAll() {
    // Home
    showScreen("home");
    clearLogUI();
    els.questionInput.value = "";
    els.guessInput.value = "";
    els.questionDisplay.textContent = "—";
    els.endMessage.textContent = "—";

    // local reset
    local.p1 = { name: "Player 1", city: "" };
    local.p2 = { name: "Player 2", city: "" };
    local.turn = "P1";
    local.phase = "setup";
    local.currentQuestion = "";
    local.winner = null;

    // online detach
    if (typeof db !== "undefined") {
      if (online.liveRef) online.liveRef.off();
      if (online.logRef && online.logListener) online.logRef.off("child_added", online.logListener);
    }
    online.liveRef = null; online.logRef = null; online.logListener = null;
    online.gameId = null; online.role = null;

    // cpu reset
    cpu.secret = null;
    cpu.phase = "ask";
    cpu.winner = null;

    els.roomLabel.textContent = "—";
    els.roleLabel.textContent = "—";
    els.onlineStatus.textContent = "Firebase: —";
  }

  // ------------------------------------------------------------
  // Wire UI
  // ------------------------------------------------------------
  els.btnReset.addEventListener("click", resetAll);
  els.btnBackHome.addEventListener("click", () => showScreen("home"));

  els.btnStartLocal.addEventListener("click", () => {
    activeMode = "local";
    showScreen("setup");
    localSyncSetupUI();
  });

  els.btnCreateRoom.addEventListener("click", async () => {
    activeMode = "online";
    try { await onlineCreateRoom(); } catch (e) { console.error(e); alert(e?.message || e); }
  });

  els.btnJoinRoom.addEventListener("click", async () => {
    activeMode = "online";
    try { await onlineJoinRoom(); } catch (e) { console.error(e); alert(e?.message || e); }
  });

  els.btnStartCPU.addEventListener("click", () => {
    activeMode = "cpu";
    const diff = (els.cpuDifficulty && els.cpuDifficulty.value) || "easy";
    cpuStart(diff);
  });

  // names blur
  els.p1Name.addEventListener("blur", async () => {
    if (activeMode === "local") local.p1.name = (els.p1Name.value || "Player 1").trim().slice(0, 18);
    if (activeMode === "online" && online.role === "P1") await onlineSaveMyName();
  });
  els.p2Name.addEventListener("blur", async () => {
    if (activeMode === "local") local.p2.name = (els.p2Name.value || "Player 2").trim().slice(0, 18);
    if (activeMode === "online" && online.role === "P2") await onlineSaveMyName();
  });

  // city modals
  els.btnSetP1.addEventListener("click", () => {
    if (activeMode === "local") return openCityModal("P1", "Hand the phone to Player 1 👀");
    if (activeMode === "online" && online.role === "P1") return openCityModal("P1", "Only Player 1 can set this.");
  });
  els.btnSetP2.addEventListener("click", () => {
    if (activeMode === "local") return openCityModal("P2", "Hand the phone to Player 2 👀");
    if (activeMode === "online" && online.role === "P2") return openCityModal("P2", "Only Player 2 can set this.");
  });

  els.btnSaveCity.addEventListener("click", async () => {
    const city = (els.secretCityInput.value || "").trim();
    if (!city) return;

    if (activeMode === "local") {
      if (localEditing === "P1") local.p1.city = city;
      if (localEditing === "P2") local.p2.city = city;
      closeCityModal();
      localSyncSetupUI();
    } else if (activeMode === "online") {
      await onlineSaveMyCity(city);
      await onlineSaveMyName();
      closeCityModal();
    }
  });

  els.btnCancelCity.addEventListener("click", closeCityModal);
  els.btnCloseModal.addEventListener("click", closeCityModal);

  els.btnBeginGame.addEventListener("click", async () => {
    if (activeMode === "local") return localBegin();
    if (activeMode === "online") return onlineBeginGame();
  });

  els.btnQuick.addEventListener("click", () => showModal("quickModal", true));
  els.btnCloseQuick.addEventListener("click", () => showModal("quickModal", false));

  els.btnAsk.addEventListener("click", async () => {
    if (activeMode === "local") return localAsk();
    if (activeMode === "online") return onlineAskQuestion();
    if (activeMode === "cpu") return cpuAsk();
  });

  els.btnYes.addEventListener("click", async () => {
    if (activeMode === "local") return localAnswer("Yes");
    if (activeMode === "online") return onlineAnswer("Yes");
  });

  els.btnNo.addEventListener("click", async () => {
    if (activeMode === "local") return localAnswer("No");
    if (activeMode === "online") return onlineAnswer("No");
  });

  els.btnGuess.addEventListener("click", async () => {
    if (activeMode === "local") return localOpenGuess();
    if (activeMode === "online") return onlineOpenGuess();
    if (activeMode === "cpu") return cpuOpenGuess();
  });

  els.btnCancelGuess.addEventListener("click", async () => {
    if (activeMode === "local") return localCancelGuess();
    if (activeMode === "online") return onlineCancelGuess();
    if (activeMode === "cpu") return cpuCancelGuess();
  });

  els.btnSubmitGuess.addEventListener("click", async () => {
    if (activeMode === "local") return localSubmitGuess();
    if (activeMode === "online") return onlineSubmitGuess();
    if (activeMode === "cpu") return cpuSubmitGuess();
  });

  // Single play-again button (new cities / restart appropriate to mode)
  els.btnPlayAgain.addEventListener("click", async () => {
    if (activeMode === "local") return localNewCities();
    if (activeMode === "online") return onlineNewCities();
    if (activeMode === "cpu") return cpuPlayAgain();
  });

  els.btnClearLog.addEventListener("click", async () => {
    if (activeMode === "local" || activeMode === "cpu") { clearLogUI(); return; }
    if (activeMode === "online") return onlineClearLog();
  });

  // boot
  buildQuickList();
  showScreen("home");
})();
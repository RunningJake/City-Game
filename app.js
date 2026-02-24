// app.js — rebuilt from scratch (Local + Online)
// Online uses Firebase RTDB (db from firebase.js). No bundlers, works on GitHub Pages.

(() => {
  const $ = (id) => document.getElementById(id);

  // Screens
  const screens = {
    home: $("screenHome"),
    setup: $("screenSetup"),
    game: $("screenGame"),
  };
  function showScreen(which) {
    Object.entries(screens).forEach(([k, el]) => {
      if (!el) return;
      el.classList.toggle("hidden", k !== which);
    });
  }

  // Modal helpers
  function showModal(id, show) {
    const el = $(id);
    if (!el) return;
    el.classList.toggle("hidden", !show);
  }

  // Quick questions
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
    "Is your city in a country with over 100M people?",
    "Does your city have a metro population over 2M?",
    "Is your city on an island?",
    "Is your city in the EU?",
    "Is your city in the U.S.?",
    "Do most people speak Spanish in your city?",
    "Do most people speak English in your city?",
  ];

  // ---------------------------
  // Shared UI elements
  // ---------------------------
  const els = {
    btnReset: $("btnReset"),
    btnBackHome: $("btnBackHome"),
    btnStartLocal: $("btnStartLocal"),
    btnCreateRoom: $("btnCreateRoom"),
    btnJoinRoom: $("btnJoinRoom"),

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
    btnRematch: $("btnRematch"),

    btnClearLog: $("btnClearLog"),
    log: $("log"),

    // modals
    modal: $("modal"),
    quickModal: $("quickModal"),
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

  // ---------------------------
  // LOCAL MODE (pass-and-play)
  // ---------------------------
  const local = {
    p1: { name: "Player 1", city: "" },
    p2: { name: "Player 2", city: "" },
    turn: "P1",
    phase: "setup", // setup | ask | answer | guess | end
    currentQuestion: "",
    winner: null,
  };

  let activeMode = null; // "local" | "online"
  let localEditing = null; // "P1" | "P2"

  function localSyncSetupUI() {
    els.modeLabel.textContent = "Local";
    els.roomLabel2.textContent = "—";
    els.setupHint.textContent = "One phone pass-and-play. Hand the phone over when setting cities.";
    els.p1Name.disabled = false;
    els.p2Name.disabled = false;
    els.btnSetP1.disabled = false;
    els.btnSetP2.disabled = false;
    els.btnBeginGame.disabled = !(!!local.p1.city && !!local.p2.city);

    els.p1Name.value = local.p1.name || "Player 1";
    els.p2Name.value = local.p2.name || "Player 2";
    els.p1CityStatus.textContent = local.p1.city ? "set" : "not set";
    els.p2CityStatus.textContent = local.p2.city ? "set" : "not set";
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

  function localRematch() {
    local.turn = "P1";
    local.phase = "ask";
    local.currentQuestion = "";
    local.winner = null;
    clearLogUI();
    logLine("Rematch!");
    localSyncGameUI();
  }

  function localNewCities() {
    local.p1.city = "";
    local.p2.city = "";
    local.phase = "setup";
    showScreen("setup");
    localSyncSetupUI();
  }

  // ---------------------------
  // ONLINE MODE (two phones)
  // ---------------------------
  const LS_KEY = "city_guess_online_identity_v2";
  const online = {
    gameId: null,
    role: null,     // "P1" | "P2"
    playerKey: null,
    liveRef: null,
    logRef: null,
    logListener: null,
  };

  function ensureIdentity() {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (saved?.playerKey) return saved.playerKey;
    } catch {}
    const pk = "p_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(LS_KEY, JSON.stringify({ playerKey: pk }));
    return pk;
  }

  function onlineRef(path="") {
    return db.ref("games/" + online.gameId + (path ? "/" + path : ""));
  }

  async function claimRole() {
    const playersRef = onlineRef("players");
    const snap = await playersRef.once("value");
    const players = snap.val() || {};

    for (const r of ["P1", "P2"]) {
      if (players?.[r]?.owner === online.playerKey) {
        online.role = r;
        await playersRef.child(r).update({ online: true, lastSeen: Date.now() });
        return r;
      }
    }

    for (const r of ["P1", "P2"]) {
      if (!players?.[r]?.owner) {
        await playersRef.child(r).update({
          owner: online.playerKey,
          online: true,
          joinedAt: Date.now(),
          lastSeen: Date.now()
        });
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
    }, (err) => {
      console.error(err);
      els.onlineStatus.textContent = "Firebase: listener error";
      alert("Listener error: " + (err?.message || err));
    });

    clearLogUI();
    online.logListener = (snap) => {
      const v = snap.val();
      if (v?.text) logLine(v.text);
    };
    online.logRef.limitToLast(100).on("child_added", online.logListener);
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
    await onlineRef().update({ status: "playing", phase: "ask", turn: "P1", currentQuestion: "", winner: null, lastAnswer: null });
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
    await onlineRef().update({ lastAnswer: ans, phase: "ask", turn: nextTurn, currentQuestion: "" });
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

  async function onlineRematch() {
    await onlineRef().update({ phase: "ask", turn: "P1", currentQuestion: "", winner: null, lastAnswer: null, status: "playing" });
    await onlineRef("log").push({ t: Date.now(), text: "Rematch!" });
  }

  async function onlineNewCities() {
    await onlineRef().update({ phase: "setup", status: "setup", currentQuestion: "", winner: null });
    await onlineRef("players/P1/city").set(null);
    await onlineRef("players/P2/city").set(null);
    await onlineRef("log").push({ t: Date.now(), text: "New cities needed." });
    showScreen("setup");
  }

  async function onlineClearLog() { await onlineRef("log").set(null); clearLogUI(); }

  // ---------------------------
  // Shared modal logic
  // ---------------------------
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
    if (online.liveRef) online.liveRef.off();
    if (online.logRef && online.logListener) online.logRef.off("child_added", online.logListener);
    online.liveRef = null; online.logRef = null; online.logListener = null;
    online.gameId = null;
    online.role = null;

    els.roomLabel.textContent = "—";
    els.roleLabel.textContent = "—";
    els.onlineStatus.textContent = "Firebase: —";
  }

  // ---------------------------
  // Wire UI
  // ---------------------------
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

  els.p1Name.addEventListener("blur", async () => {
    if (activeMode === "local") local.p1.name = (els.p1Name.value || "Player 1").trim().slice(0, 18);
    if (activeMode === "online" && online.role === "P1") await onlineSaveMyName();
  });
  els.p2Name.addEventListener("blur", async () => {
    if (activeMode === "local") local.p2.name = (els.p2Name.value || "Player 2").trim().slice(0, 18);
    if (activeMode === "online" && online.role === "P2") await onlineSaveMyName();
  });

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
  });

  els.btnCancelGuess.addEventListener("click", async () => {
    if (activeMode === "local") return localCancelGuess();
    if (activeMode === "online") return onlineCancelGuess();
  });

  els.btnSubmitGuess.addEventListener("click", async () => {
    if (activeMode === "local") return localSubmitGuess();
    if (activeMode === "online") return onlineSubmitGuess();
  });

 els.btnRematch.addEventListener("click", async () => {
  // Play Again = require NEW secret cities
  if (activeMode === "local") return localNewCities();
  if (activeMode === "online") return onlineNewCities();
  });

  els.btnClearLog.addEventListener("click", async () => {
    if (activeMode === "local") { clearLogUI(); return; }
    if (activeMode === "online") return onlineClearLog();
  });

  // boot
  buildQuickList();
  showScreen("home");
})();

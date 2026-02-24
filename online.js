/* online.js — Fully Online Mode (Firebase RTDB)
   Requires:
   - firebase.js sets global `db`
   - multiplayer.js provides createGame/joinGame that sets global `gameId`
   - Your existing DOM IDs from index.html
*/

(function () {
  if (typeof db === "undefined") {
    console.error("Firebase db not found. Check script order.");
    return;
  }

  // ---------- Utilities ----------
  const LS_KEY = "city_guess_online_identity_v1";

  const state = {
    gameId: null,
    playerKey: null,
    role: null, // "P1" or "P2"
    unsub: null,
  };

  function normalizeCity(s) {
    return (s || "")
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s]/gu, "") // drop punctuation
      .replace(/\s+/g, " ");
  }

  function $(id) {
    return document.getElementById(id);
  }

  function showScreen(screenId) {
    const ids = ["screenHome", "screenSetup", "screenGame"];
    ids.forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.classList.toggle("hidden", id !== screenId);
    });
  }

  function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  function setDisabled(id, disabled) {
    const el = $(id);
    if (el) el.disabled = !!disabled;
  }

  function setHidden(id, hidden) {
    const el = $(id);
    if (el) el.classList.toggle("hidden", !!hidden);
  }

  function logLine(line) {
    const log = $("log");
    if (!log) return;
    const div = document.createElement("div");
    div.className = "logline";
    div.textContent = line;
    log.prepend(div);
  }

  function gameRef() {
    return db.ref("games/" + state.gameId);
  }

  function ensureIdentity() {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    } catch {
      saved = null;
    }
    if (!saved?.playerKey) {
      saved = { playerKey: "p_" + Math.random().toString(36).slice(2, 10) };
      localStorage.setItem(LS_KEY, JSON.stringify(saved));
    }
    state.playerKey = saved.playerKey;
  }

  async function claimRole(gameId) {
    state.gameId = gameId;

    // Try claim P1 or P2 slot if free, otherwise reuse if already owned by this device.
    const ref = db.ref("games/" + gameId + "/players");
    const snap = await ref.once("value");
    const players = snap.val() || {};

    // If we already own a role, keep it
    for (const r of ["P1", "P2"]) {
      if (players?.[r]?.owner === state.playerKey) {
        state.role = r;
        await ref.child(r + "/online").set(true);
        return r;
      }
    }

    // Claim first open slot
    for (const r of ["P1", "P2"]) {
      if (!players?.[r]?.owner) {
        await ref.child(r).update({
          owner: state.playerKey,
          online: true,
          joinedAt: Date.now(),
        });
        state.role = r;
        return r;
      }
    }

    // Room full
    state.role = null;
    return null;
  }

  async function initRoomUIAfterJoin(gameId) {
    const role = await claimRole(gameId);
    if (!role) {
      alert("Room is full (already has P1 and P2).");
      return;
    }
    showScreen("screenSetup");
    setText("turnLabel", "—");
    setText("phaseLabel", "setup");

    // In fully-online mode we let each device set only its own player name and city.
    const isP1 = role === "P1";
    setDisabled("p1Name", !isP1);
    setDisabled("btnSetP1", !isP1);
    setDisabled("p2Name", isP1);
    setDisabled("btnSetP2", isP1);

    // Button that starts the match only for P1 (optional)
    setDisabled("btnBeginGame", !isP1);

    // Show a hint
    const hint = isP1
      ? "You are Player 1. Set your name & city, then wait for Player 2. Start the game when ready."
      : "You are Player 2. Set your name & city. Wait for Player 1 to start.";
    console.log(hint);
  }

  // ---------- Firebase game state ----------
async function createRoomOnline() {
  // Call the original multiplayer.js function to create the room in Firebase
  if (typeof window.__createGameOrig !== "function") {
    // first time: store original createGame
    if (typeof createGame !== "function") {
      alert("createGame() not found. Make sure multiplayer.js is loaded.");
      return;
    }
    window.__createGameOrig = createGame;
  }

  window.__createGameOrig();

  // Get room code from the global (set by multiplayer.js)
  const gid = window.__CITY_ROOM;
  if (!gid) {
    alert("Room code not available yet. Try again.");
    return;
  }

  // Initialize full schema
  await db.ref("games/" + gid).update({
    status: "setup",
    phase: "setup",
    turn: "P1",
    createdAt: Date.now(),
  });

  ensureIdentity();
  await initRoomUIAfterJoin(gid);
  attachLiveListener();
}

async function joinRoomOnline() {
  if (typeof window.__joinGameOrig !== "function") {
    if (typeof joinGame !== "function") {
      alert("joinGame() not found. Make sure multiplayer.js is loaded.");
      return;
    }
    window.__joinGameOrig = joinGame;
  }

  window.__joinGameOrig();

  // Prefer global room code set by multiplayer.js
  let gid = window.__CITY_ROOM;

  // Fallback: prompt once if missing
  if (!gid) {
    const code = prompt("Enter Room Code");
    if (!code) return;
    gid = code.toUpperCase();
    window.__CITY_ROOM = gid;
    // Also ensure the room label updates
    const roomEl = $("room");
    if (roomEl) roomEl.textContent = "Room: " + gid;
  }

  ensureIdentity();
  await initRoomUIAfterJoin(gid);
  attachLiveListener();
}

  function attachLiveListener() {
    if (!state.gameId) return;

    // Remove previous listener if any
    if (state.unsub) state.unsub.off();

    const ref = gameRef();
    state.unsub = ref;

    ref.on("value", (snap) => {
      const g = snap.val();
      if (!g) return;

      // Setup pill statuses
      const p1Set = !!g.players?.P1?.city;
      const p2Set = !!g.players?.P2?.city;
      setText("p1CityStatus", p1Set ? "set" : "not set");
      setText("p2CityStatus", p2Set ? "set" : "not set");

      // Enable Begin only when both cities are set (P1 controls start)
      if (state.role === "P1") {
        setDisabled("btnBeginGame", !(p1Set && p2Set));
      }

      // Gameplay UI
      if (g.phase && g.phase !== "setup") {
        showScreen("screenGame");
      }

      setText("turnLabel", g.turn || "—");
      setText("phaseLabel", g.phase || "—");

      // Determine whose turn and phase panels
      const myTurn = g.turn === state.role;

      // Show ask vs answer vs guess vs end
      setHidden("askArea", !(g.phase === "ask"));
      setHidden("answerArea", !(g.phase === "answer"));
      setHidden("guessArea", !(g.phase === "guess"));
      setHidden("endArea", !(g.phase === "end"));

      // Ask controls only on your turn
      if ($("btnAsk")) $("btnAsk").disabled = !(myTurn && g.phase === "ask");
      if ($("btnGuess")) $("btnGuess").disabled = !(myTurn && g.phase === "ask");
      if ($("btnQuick")) $("btnQuick").disabled = !(myTurn && g.phase === "ask");

      // Answer controls only if it's NOT your turn (the other player answers)
      if ($("btnYes")) $("btnYes").disabled = !(!myTurn && g.phase === "answer");
      if ($("btnNo")) $("btnNo").disabled = !(!myTurn && g.phase === "answer");

      // Current question display
      if (g.currentQuestion) setText("questionDisplay", g.currentQuestion);

      // End message
      if (g.phase === "end" && g.winner) {
        const winnerName =
          g.players?.[g.winner]?.name || g.winner;
        setText("endMessage", `${winnerName} wins!`);
      }

      // Render log (simple)
      // We won't fully re-render each time; instead, append on child_added below in a later upgrade.
    });
  }

  // ---------- Actions ----------
  async function saveMyName() {
    const nameInput = state.role === "P1" ? $("p1Name") : $("p2Name");
    const name = (nameInput?.value || "").trim().slice(0, 18);
    await gameRef().child(`players/${state.role}/name`).set(name || state.role);
  }

  async function saveMyCity(city) {
    const clean = (city || "").trim().slice(0, 60);
    if (!clean) return;
    await gameRef().child(`players/${state.role}/city`).set(clean);
  }

  async function beginOnlineGame() {
    const snap = await gameRef().once("value");
    const g = snap.val();
    if (!g?.players?.P1?.city || !g?.players?.P2?.city) {
      alert("Both players must set a city first.");
      return;
    }
    await gameRef().update({
      status: "playing",
      phase: "ask",
      turn: "P1",
      currentQuestion: "",
      winner: null,
    });
    await gameRef().child("log").push({ t: Date.now(), text: "Game started!" });
  }

  async function askQuestion() {
    const q = ($("questionInput")?.value || "").trim();
    if (!q) return;

    const ref = gameRef();
    await ref.update({
      currentQuestion: q,
      phase: "answer",
    });
    await ref.child("log").push({ t: Date.now(), text: `${state.role} asked: ${q}` });

    if ($("questionInput")) $("questionInput").value = "";
  }

  async function answerQuestion(ans) {
    const ref = gameRef();
    const snap = await ref.once("value");
    const g = snap.val();
    if (!g) return;

    const nextTurn = g.turn === "P1" ? "P2" : "P1";

    await ref.update({
      lastAnswer: ans,
      phase: "ask",
      turn: nextTurn,
      currentQuestion: "",
    });
    await ref.child("log").push({ t: Date.now(), text: `${state.role} answered: ${ans}` });
  }

  async function openGuess() {
    await gameRef().update({ phase: "guess" });
  }

  async function cancelGuess() {
    await gameRef().update({ phase: "ask" });
  }

  async function submitGuess() {
    const guess = ($("guessInput")?.value || "").trim();
    if (!guess) return;

    const ref = gameRef();
    const snap = await ref.once("value");
    const g = snap.val();
    if (!g) return;

    const opponent = state.role === "P1" ? "P2" : "P1";
    const opponentCity = g.players?.[opponent]?.city || "";
    const ok = normalizeCity(guess) === normalizeCity(opponentCity);

    if (ok) {
      await ref.update({ phase: "end", winner: state.role });
      await ref.child("log").push({ t: Date.now(), text: `${state.role} guessed "${guess}" — CORRECT!` });
    } else {
      const nextTurn = g.turn === "P1" ? "P2" : "P1";
      await ref.update({ phase: "ask", turn: nextTurn });
      await ref.child("log").push({ t: Date.now(), text: `${state.role} guessed "${guess}" — wrong.` });
    }

    if ($("guessInput")) $("guessInput").value = "";
  }

  async function rematch() {
    // Keep same cities; restart
    await gameRef().update({
      phase: "ask",
      turn: "P1",
      currentQuestion: "",
      winner: null,
      lastAnswer: null,
      status: "playing",
    });
    await gameRef().child("log").push({ t: Date.now(), text: "Rematch!" });
  }

  async function newCities() {
    // Clears cities and sends back to setup
    await gameRef().update({
      phase: "setup",
      status: "setup",
      currentQuestion: "",
      winner: null,
    });
    await gameRef().child("players/P1/city").set(null);
    await gameRef().child("players/P2/city").set(null);
    await gameRef().child("log").push({ t: Date.now(), text: "New cities needed." });
    showScreen("screenSetup");
  }

  async function clearLog() {
    await gameRef().child("log").set(null);
    const log = $("log");
    if (log) log.innerHTML = "";
  }

  // ---------- Wire UI ----------
  function wireButtons() {
    // Replace the Home-screen Two Phones buttons (we hook into those by overriding the global handlers)
    // We'll provide new functions with same names so your onclick="createGame()" etc still works
    window.createGame = createRoomOnline;
    window.joinGame = joinRoomOnline;

    // Setup screen inputs save to Firebase on change/blur
    ["p1Name", "p2Name"].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("blur", () => {
        if (!state.role) return;
        saveMyName().catch(console.error);
      });
    });

    // Secret city buttons should only be used by the owning device;
    // We reuse your existing modal and just save the city into Firebase when "Save" is clicked.
    // We detect which role is editing based on state.role.
    const btnSaveCity = $("btnSaveCity");
    if (btnSaveCity) {
      btnSaveCity.addEventListener("click", () => {
        const city = $("secretCityInput")?.value || "";
        saveMyCity(city)
          .then(() => saveMyName())
          .catch(console.error);
      });
    }

    // Begin Game (P1)
    const btnBegin = $("btnBeginGame");
    if (btnBegin) btnBegin.addEventListener("click", () => beginOnlineGame().catch(console.error));

    // Ask / Answer / Guess wiring
    if ($("btnAsk")) $("btnAsk").addEventListener("click", () => askQuestion().catch(console.error));
    if ($("btnYes")) $("btnYes").addEventListener("click", () => answerQuestion("Yes").catch(console.error));
    if ($("btnNo")) $("btnNo").addEventListener("click", () => answerQuestion("No").catch(console.error));

    if ($("btnGuess")) $("btnGuess").addEventListener("click", () => openGuess().catch(console.error));
    if ($("btnCancelGuess")) $("btnCancelGuess").addEventListener("click", () => cancelGuess().catch(console.error));
    if ($("btnSubmitGuess")) $("btnSubmitGuess").addEventListener("click", () => submitGuess().catch(console.error));

    if ($("btnRematch")) $("btnRematch").addEventListener("click", () => rematch().catch(console.error));
    if ($("btnToSetup")) $("btnToSetup").addEventListener("click", () => newCities().catch(console.error));

    if ($("btnClearLog")) $("btnClearLog").addEventListener("click", () => clearLog().catch(console.error));

    // Force Home on load
    showScreen("screenHome");
  }

  // ---------- Start ----------
  ensureIdentity();
  wireButtons();
})();

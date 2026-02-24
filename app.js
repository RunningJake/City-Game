// City Guess Game - Easy Mode (pass-and-play)
// State machine: setup -> game(asking/answering/guessing/end)

const $ = (id) => document.getElementById(id);

const SCREENS = {
  home: $("screenHome"),
  setup: $("screenSetup"),
  game: $("screenGame"),
};

const STORAGE_KEY = "city_guess_game_v1";

const QUICK_QUESTIONS = [
  "Is your city in Africa?",
  "Is your city in Asia?",
  "Is your city in Europe?",
  "Is your city in North America?",
  "Is your city in South America?",
  "Is your city in Oceania?",
  "Is your city in the Eastern Hemisphere?",
  "Is your city in the Western Hemisphere?",
  "Is your city a national capital?",
  "Is your city on the coast?",
  "Is your city on a river?",
  "Is your city landlocked?",
  "Is your city in the EU?",
  "Is your city in the UK?",
  "Is your city in a country with over 100M people?",
  "Is your city in a country with under 20M people?",
  "Do most people speak Spanish in your city?",
  "Do most people speak English in your city?",
  "Is your city in the Southern Hemisphere?",
  "Is your city north of the equator?",
];

function normalize(str){
  return (str || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function fuzzyMatch(a, b){
  // very lightweight: exact normalized or one contains the other (handles "Rio de Janeiro" vs "rio")
  const A = normalize(a);
  const B = normalize(b);
  if(!A || !B) return false;
  if(A === B) return true;
  if(A.includes(B) || B.includes(A)) return true;
  // allow small typos: compare by token overlap
  const ta = new Set(A.split(" "));
  const tb = new Set(B.split(" "));
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  const denom = Math.max(ta.size, tb.size);
  return denom > 0 && overlap / denom >= 0.66;
}

function defaultState(){
  return {
    screen: "home",
    players: {
      p1: { name: "Player 1", city: "" },
      p2: { name: "Player 2", city: "" },
    },
    game: {
      started: false,
      turn: "p1",
      phase: "setup", // setup | asking | answering | guessing | end
      pendingQuestion: "",
      log: [],
      winner: "",
      endMessage: "",
    }
  };
}

let state = loadState() || defaultState();

function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    const s = JSON.parse(raw);
    return s;
  }catch(e){ return null; }
}

function showScreen(name){
  Object.values(SCREENS).forEach(el => el.classList.add("hidden"));
  SCREENS[name].classList.remove("hidden");
  state.screen = name;
  saveState();
}

function setText(id, text){
  $(id).textContent = text;
}

function renderSetup(){
  $("p1Name").value = state.players.p1.name || "Player 1";
  $("p2Name").value = state.players.p2.name || "Player 2";

  setText("p1CityStatus", state.players.p1.city ? "set" : "not set");
  setText("p2CityStatus", state.players.p2.city ? "set" : "not set");

  $("btnBeginGame").disabled = !(state.players.p1.city && state.players.p2.city);
}

function renderGame(){
  const p = state.players;
  const g = state.game;

  const turnName = (g.turn === "p1" ? p.p1.name : p.p2.name);
  setText("turnLabel", turnName);

  const phasePretty = ({
    asking: "Ask",
    answering: "Answer",
    guessing: "Guess",
    end: "End",
    setup: "Setup",
  })[g.phase] || g.phase;

  setText("phaseLabel", phasePretty);

  // areas
  $("askArea").classList.toggle("hidden", g.phase !== "asking");
  $("answerArea").classList.toggle("hidden", g.phase !== "answering");
  $("guessArea").classList.toggle("hidden", g.phase !== "guessing");
  $("endArea").classList.toggle("hidden", g.phase !== "end");

  $("btnAsk").disabled = g.phase !== "asking";
  $("questionInput").disabled = g.phase !== "asking";

  // pending question
  setText("questionDisplay", g.pendingQuestion || "—");

  // end
  if (g.phase === "end") {
    setText("endMessage", g.endMessage || "Game over.");
  }

  renderLog();
}

function renderLog(){
  const log = $("log");
  const items = state.game.log.slice().reverse();
  log.innerHTML = items.map((m) => {
    const who = m.by === "p1" ? state.players.p1.name : state.players.p2.name;
    const target = m.to === "p1" ? state.players.p1.name : state.players.p2.name;
    if (m.type === "qa"){
      return `<div class="item"><span class="tag">${escapeHtml(who)}</span> → <span class="tag2">${escapeHtml(target)}</span><br>
        Q: ${escapeHtml(m.q)}<br>A: <strong>${escapeHtml(m.a)}</strong></div>`;
    }
    if (m.type === "guess"){
      return `<div class="item"><span class="tag">${escapeHtml(who)}</span> guessed <strong>${escapeHtml(m.guess)}</strong> → ${escapeHtml(m.result)}</div>`;
    }
    return `<div class="item">${escapeHtml(JSON.stringify(m))}</div>`;
  }).join("") || `<div class="muted tiny">No questions yet.</div>`;
}

function escapeHtml(s){
  return (s||"").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}

function swapTurn(){
  state.game.turn = state.game.turn === "p1" ? "p2" : "p1";
}

function currentPlayer(){
  return state.game.turn;
}
function otherPlayer(){
  return state.game.turn === "p1" ? "p2" : "p1";
}

function startGame(){
  state.game.started = true;
  state.game.turn = "p1";
  state.game.phase = "asking";
  state.game.pendingQuestion = "";
  state.game.winner = "";
  state.game.endMessage = "";
  // keep log if you want; default keep
  saveState();
  showScreen("game");
  renderGame();
}

function resetAll(){
  state = defaultState();
  saveState();
  showScreen("home");
  renderSetup();
  renderGame();
}

function rematchSameCities(){
  state.game = {
    started: true,
    turn: "p1",
    phase: "asking",
    pendingQuestion: "",
    log: [],
    winner: "",
    endMessage: "",
  };
  saveState();
  showScreen("game");
  renderGame();
}

function newCities(){
  state.players.p1.city = "";
  state.players.p2.city = "";
  state.game = defaultState().game;
  saveState();
  showScreen("setup");
  renderSetup();
}

let modalTarget = null; // "p1" or "p2"

function openCityModal(target){
  modalTarget = target;
  $("secretCityInput").value = "";
  setText("modalTitle", `Enter secret city (${target === "p1" ? state.players.p1.name : state.players.p2.name})`);
  $("modal").classList.remove("hidden");
  setTimeout(()=> $("secretCityInput").focus(), 50);
}
function closeCityModal(){
  $("modal").classList.add("hidden");
  modalTarget = null;
}

function openQuickModal(){
  const list = $("quickList");
  list.innerHTML = QUICK_QUESTIONS.map(q => `<button class="btn btn-secondary btn-block" data-q="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join("");
  $("quickModal").classList.remove("hidden");
}
function closeQuickModal(){
  $("quickModal").classList.add("hidden");
}

function endGame(message, winner){
  state.game.phase = "end";
  state.game.winner = winner || "";
  state.game.endMessage = message || "Game over.";
  saveState();
  renderGame();
}

// --- Events ---
$("btnStart").addEventListener("click", () => {
  showScreen("setup");
  state.game.phase = "setup";
  saveState();
  renderSetup();
});

$("btnBackHome").addEventListener("click", () => {
  showScreen("home");
});

$("p1Name").addEventListener("input", (e) => {
  state.players.p1.name = (e.target.value || "Player 1").trim() || "Player 1";
  saveState();
  renderSetup();
});
$("p2Name").addEventListener("input", (e) => {
  state.players.p2.name = (e.target.value || "Player 2").trim() || "Player 2";
  saveState();
  renderSetup();
});

$("btnSetP1").addEventListener("click", () => openCityModal("p1"));
$("btnSetP2").addEventListener("click", () => openCityModal("p2"));
$("btnCloseModal").addEventListener("click", closeCityModal);
$("btnCancelCity").addEventListener("click", closeCityModal);

$("btnSaveCity").addEventListener("click", () => {
  const city = $("secretCityInput").value.trim();
  if(!city) return;
  if(modalTarget){
    state.players[modalTarget].city = city;
    saveState();
    renderSetup();
  }
  closeCityModal();
});

$("btnBeginGame").addEventListener("click", () => startGame());

$("btnReset").addEventListener("click", () => {
  if(confirm("Reset everything? This clears cities and log.")){
    resetAll();
  }
});

$("btnAsk").addEventListener("click", () => {
  if(state.game.phase !== "asking") return;
  const q = $("questionInput").value.trim();
  if(!q) return;
  state.game.pendingQuestion = q;
  $("questionInput").value = "";
  state.game.phase = "answering";
  saveState();
  renderGame();
});

$("btnQuick").addEventListener("click", () => {
  if(state.game.phase !== "asking") return;
  openQuickModal();
});

$("btnCloseQuick").addEventListener("click", closeQuickModal);
$("quickList").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-q]");
  if(!btn) return;
  const q = btn.getAttribute("data-q");
  $("questionInput").value = q;
  closeQuickModal();
  $("questionInput").focus();
});

function answer(val){
  if(state.game.phase !== "answering") return;
  const by = currentPlayer();      // asker
  const to = otherPlayer();        // answerer
  const q = state.game.pendingQuestion;

  state.game.log.push({
    type: "qa",
    by, to,
    q,
    a: val,
    t: Date.now(),
  });

  state.game.pendingQuestion = "";
  // swap turn after answer
  swapTurn();
  state.game.phase = "asking";
  saveState();
  renderGame();
}

$("btnYes").addEventListener("click", ()=>answer("Yes"));
$("btnNo").addEventListener("click", ()=>answer("No"));

$("btnGuess").addEventListener("click", () => {
  if(state.game.phase !== "asking") return;
  state.game.phase = "guessing";
  $("guessInput").value = "";
  saveState();
  renderGame();
  setTimeout(()=> $("guessInput").focus(), 50);
});

$("btnCancelGuess").addEventListener("click", () => {
  if(state.game.phase !== "guessing") return;
  state.game.phase = "asking";
  saveState();
  renderGame();
});

$("btnSubmitGuess").addEventListener("click", () => {
  if(state.game.phase !== "guessing") return;
  const guess = $("guessInput").value.trim();
  if(!guess) return;

  const by = currentPlayer();
  const target = otherPlayer();
  const secret = state.players[target].city;

  const correct = fuzzyMatch(guess, secret);

  state.game.log.push({
    type: "guess",
    by,
    to: target,
    guess,
    result: correct ? "CORRECT ✅" : "Wrong ❌",
    t: Date.now(),
  });

  if(correct){
    const winnerName = (by === "p1" ? state.players.p1.name : state.players.p2.name);
    const msg = `${winnerName} wins! The city was “${secret}”.`;
    endGame(msg, by);
    return;
  } else {
    // penalty: lose your turn (swap turn) and continue
    swapTurn();
    state.game.phase = "asking";
    saveState();
    renderGame();
  }
});

$("btnClearLog").addEventListener("click", () => {
  if(confirm("Clear the log?")){
    state.game.log = [];
    saveState();
    renderGame();
  }
});

$("btnRematch").addEventListener("click", rematchSameCities);
$("btnToSetup").addEventListener("click", newCities);

// Restore on load
(function boot(){
  // If game was mid-phase, render appropriately
  showScreen(state.screen || "home");

  // ensure phase sanity
  if(state.screen === "setup") renderSetup();
  if(state.screen === "game") renderGame();

  // if cities exist but screen is home, that's okay.
})();

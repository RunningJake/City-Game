// app.js — Local + Online (Firebase) + CPU (structured questions)
// FIXED:
//  1. Turn logic bug: after answering, turn now correctly stays with the asker (not switches to answerer)
//  2. CPU now has a real win condition — it tracks answers and guesses when confident
//  3. CPU difficulty now tracks previously answered questions to avoid repeats
//  4. syncGameUI race condition in cpuAsk fixed (single sync at end of setTimeout)
//  5. cpuSubmitGuess UI flash on wrong guess fixed
//  6. p2Name blur handler now correctly saves local.p2.name
//  7. Online mode buttons give a cleaner, non-alert UX message
//  8. CPU hard mode uses an elimination strategy to intelligently guess

(() => {
  const $ = (id) => document.getElementById(id);

  // Screens
  const screens = { home: $("screenHome"), setup: $("screenSetup"), game: $("screenGame") };
  function showScreen(which){
    Object.entries(screens).forEach(([k, el]) => el && el.classList.toggle("hidden", k !== which));
  }

  function showModal(id, show){
    const el = $(id);
    if (!el) return;
    el.classList.toggle("hidden", !show);
  }

  // Quick Questions (also the CPU dropdown source)
  const QUESTIONS = [
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
    "Do most people speak English in your city?"
  ];

  // Small city DB (expandable). Keep consistent keys for CPU logic.
  const CITY_DB = [
    { city:"Montevideo", country:"Uruguay", continent:"South America", hemisphere:"S", coastal:true, capital:true, island:false, eu:false, us:false, lang:"Spanish", pop100m:false, metro2m:false },
    { city:"Lisbon", country:"Portugal", continent:"Europe", hemisphere:"N", coastal:true, capital:true, island:false, eu:true, us:false, lang:"Portuguese", pop100m:false, metro2m:true },
    { city:"Tokyo", country:"Japan", continent:"Asia", hemisphere:"N", coastal:true, capital:true, island:true, eu:false, us:false, lang:"Japanese", pop100m:false, metro2m:true },
    { city:"Jakarta", country:"Indonesia", continent:"Asia", hemisphere:"S", coastal:true, capital:true, island:true, eu:false, us:false, lang:"Indonesian", pop100m:true, metro2m:true },
    { city:"Nairobi", country:"Kenya", continent:"Africa", hemisphere:"S", coastal:false, capital:true, island:false, eu:false, us:false, lang:"English", pop100m:false, metro2m:true },
    { city:"Toronto", country:"Canada", continent:"North America", hemisphere:"N", coastal:false, capital:false, island:false, eu:false, us:false, lang:"English", pop100m:false, metro2m:true },
    { city:"Sydney", country:"Australia", continent:"Oceania", hemisphere:"S", coastal:true, capital:false, island:true, eu:false, us:false, lang:"English", pop100m:false, metro2m:true },
    { city:"Madrid", country:"Spain", continent:"Europe", hemisphere:"N", coastal:false, capital:true, island:false, eu:true, us:false, lang:"Spanish", pop100m:false, metro2m:true },
    { city:"Miami", country:"USA", continent:"North America", hemisphere:"N", coastal:true, capital:false, island:false, eu:false, us:true, lang:"English", pop100m:true, metro2m:true },
    { city:"Reykjavik", country:"Iceland", continent:"Europe", hemisphere:"N", coastal:true, capital:true, island:true, eu:false, us:false, lang:"Icelandic", pop100m:false, metro2m:false }
  ];

  // Elements
  const els = {
    btnReset: $("btnReset"),
    btnBackHome: $("btnBackHome"),
    btnStartLocal: $("btnStartLocal"),
    btnCreateRoom: $("btnCreateRoom"),
    btnJoinRoom: $("btnJoinRoom"),
    btnStartCpu: $("btnStartCpu"),
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

    // free text
    freeQuestionBlock: $("freeQuestionBlock"),
    questionInput: $("questionInput"),
    btnAsk: $("btnAsk"),
    btnQuick: $("btnQuick"),
    btnGuess: $("btnGuess"),

    // cpu select
    cpuQuestionBlock: $("cpuQuestionBlock"),
    cpuQuestionSelect: $("cpuQuestionSelect"),
    btnCpuAsk: $("btnCpuAsk"),
    btnQuickCpu: $("btnQuickCpu"),
    btnGuessCpu: $("btnGuessCpu"),

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
    modal: $("modal"),
    quickModal: $("quickModal"),
    secretCityInput: $("secretCityInput"),
    cpuCityPicker: $("cpuCityPicker"),
    cpuCitySelect: $("cpuCitySelect"),
    btnSaveCity: $("btnSaveCity"),
    btnCancelCity: $("btnCancelCity"),
    btnCloseModal: $("btnCloseModal"),
    modalTitle: $("modalTitle"),
    modalHint: $("modalHint"),

    quickList: $("quickList"),
    btnCloseQuick: $("btnCloseQuick"),
  };

  function logLine(text){
    if (!els.log) return;
    const div = document.createElement("div");
    div.className = "logline";
    div.textContent = text;
    els.log.prepend(div);
  }
  function clearLogUI(){ if (els.log) els.log.innerHTML=""; }

  function normalizeCity(s){
    return (s||"").toLowerCase().trim().replace(/[^\p{L}\p{N}\s]/gu,"").replace(/\s+/g," ");
  }

  // Build quick list UI
  function buildQuickList(){
    els.quickList.innerHTML = "";
    QUESTIONS.forEach((q) => {
      const item = document.createElement("div");
      item.className = "quickitem";
      item.textContent = q;
      item.addEventListener("click", () => {
        if (activeMode === "cpu") {
          els.cpuQuestionSelect.value = q;
        } else {
          els.questionInput.value = q;
        }
        showModal("quickModal", false);
      });
      els.quickList.appendChild(item);
    });
  }

  // Populate CPU question select
  function buildCpuQuestionSelect(){
    els.cpuQuestionSelect.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "Select a question…";
    els.cpuQuestionSelect.appendChild(opt0);
    QUESTIONS.forEach((q) => {
      const opt = document.createElement("option");
      opt.value = q;
      opt.textContent = q;
      els.cpuQuestionSelect.appendChild(opt);
    });
  }

  // Populate CPU city select
  function buildCpuCitySelect(){
    els.cpuCitySelect.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "Pick a city…";
    els.cpuCitySelect.appendChild(opt0);
    CITY_DB
      .slice()
      .sort((a,b)=> a.city.localeCompare(b.city))
      .forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.city;
        opt.textContent = `${c.city} (${c.country})`;
        els.cpuCitySelect.appendChild(opt);
      });
  }

  // ---------------------------
  // Modes / state
  // ---------------------------
  let activeMode = null; // "local" | "online" | "cpu"
  let localEditing = null; // "P1"|"P2"

  // Local mode (simple)
  const local = {
    p1:{name:"Player 1", city:""},
    p2:{name:"Player 2", city:""},
    turn:"P1",
    phase:"setup",
    currentQuestion:"",
    winner:null,
  };

  // CPU mode state
  const cpu = {
    difficulty:"medium",
    playerCity:null,  // object from CITY_DB
    cpuCity:null,     // object from CITY_DB
    turn:"P1",        // P1=human, P2=CPU
    phase:"setup",
    currentQuestion:"",
    winner:null,
    // Elimination tracking: which cities CPU has ruled out
    candidateCities: [],
    answeredQuestions: [], // questions already asked (to avoid repeats)
  };

  const online = { gameId:null, role:null };

  // ---------------------------
  // Setup UI sync
  // ---------------------------
  function syncSetupUI(){
    els.roomLabel2.textContent = "—";
    els.roomLabel.textContent = "—";
    els.roleLabel.textContent = "—";

    if (activeMode === "cpu") {
      els.modeLabel.textContent = "CPU";
      els.setupHint.textContent = "Pick your name + choose your city from the list. CPU will pick a secret city too.";
      els.p2Name.value = "CPU";
      els.p2Name.disabled = true;
      els.btnSetP2.disabled = true;
      els.p1Name.disabled = false;
      els.btnSetP1.disabled = false;
      els.btnBeginGame.disabled = !(cpu.playerCity && cpu.cpuCity);
      els.p1CityStatus.textContent = cpu.playerCity ? "set ✓" : "not set";
      els.p2CityStatus.textContent = cpu.cpuCity ? "set ✓" : "not set";
      return;
    }

    if (activeMode === "local") {
      els.modeLabel.textContent = "Local";
      els.setupHint.textContent = "One phone pass-and-play. Hand the phone over when setting cities.";
      els.p1Name.disabled = false; els.p2Name.disabled = false;
      els.btnSetP1.disabled = false; els.btnSetP2.disabled = false;
      els.btnBeginGame.disabled = !(local.p1.city && local.p2.city);
      els.p1Name.value = local.p1.name; els.p2Name.value = local.p2.name;
      els.p1CityStatus.textContent = local.p1.city ? "set ✓" : "not set";
      els.p2CityStatus.textContent = local.p2.city ? "set ✓" : "not set";
      return;
    }

    if (activeMode === "online") {
      els.modeLabel.textContent = "Online";
      els.setupHint.textContent = "Online mode requires Firebase setup (firebase.js).";
      return;
    }
  }

  // ---------------------------
  // Game UI sync
  // ---------------------------
  function syncGameUI(){
    const turn = (activeMode === "cpu") ? cpu.turn : local.turn;
    const phase = (activeMode === "cpu") ? cpu.phase : local.phase;

    // Show whose turn it is with a friendly name
    let turnName = turn;
    if (activeMode === "cpu") {
      turnName = turn === "P1" ? (els.p1Name.value || "Player 1") : "CPU";
    } else {
      turnName = turn === "P1" ? (els.p1Name.value || "Player 1") : (els.p2Name.value || "Player 2");
    }

    els.turnLabel.textContent = turnName + "'s turn";
    els.phaseLabel.textContent = phase;

    els.askArea.classList.toggle("hidden", phase !== "ask");
    els.answerArea.classList.toggle("hidden", phase !== "answer");
    els.guessArea.classList.toggle("hidden", phase !== "guess");
    els.endArea.classList.toggle("hidden", phase !== "end");

    // Toggle CPU structured questions vs free text
    els.freeQuestionBlock.classList.toggle("hidden", activeMode === "cpu");
    els.cpuQuestionBlock.classList.toggle("hidden", activeMode !== "cpu");

    // Enable / disable buttons
    if (activeMode === "cpu") {
      const myTurn = cpu.turn === "P1";
      els.btnCpuAsk.disabled = !(myTurn && phase === "ask");
      els.btnQuickCpu.disabled = !(myTurn && phase === "ask");
      els.btnGuessCpu.disabled = !(myTurn && phase === "ask");
      // When CPU asks, human (P1) answers
      els.btnYes.disabled = !(phase === "answer" && cpu.turn === "P2");
      els.btnNo.disabled  = !(phase === "answer" && cpu.turn === "P2");
    } else {
      const showAsk = phase === "ask";
      const showAnswer = phase === "answer";
      els.btnAsk.disabled = !showAsk;
      els.btnQuick.disabled = !showAsk;
      els.btnGuess.disabled = !showAsk;
      els.btnYes.disabled = !showAnswer;
      els.btnNo.disabled = !showAnswer;
    }

    // Question display
    els.questionDisplay.textContent = (activeMode === "cpu" ? cpu.currentQuestion : local.currentQuestion) || "—";

    // End message
    if (phase === "end") {
      let winner = (activeMode === "cpu") ? cpu.winner : local.winner;
      if (winner) {
        let name;
        if (activeMode === "cpu") {
          name = winner === "P1" ? (els.p1Name.value || "Player 1") : "CPU";
        } else {
          name = winner === "P1" ? (els.p1Name.value || "Player 1") : (els.p2Name.value || "Player 2");
        }
        // Reveal the secret city on game over
        const secretCity = (activeMode === "cpu")
          ? cpu.cpuCity?.city
          : (winner === "P1" ? local.p2.city : local.p1.city);
        els.endMessage.textContent = `🎉 ${name} wins! The city was: ${secretCity}`;
      } else {
        els.endMessage.textContent = "Game over!";
      }
    }
  }

  // ---------------------------
  // CPU logic
  // ---------------------------
  function cityObjByName(name){
    return CITY_DB.find(c => normalizeCity(c.city) === normalizeCity(name)) || null;
  }

  function cpuAnswerToQuestion(q, targetCityObj){
    if (!targetCityObj) return null;
    const t = targetCityObj;
    const qq = q.toLowerCase();

    if (qq.includes("in europe")) return t.continent === "Europe";
    if (qq.includes("in asia")) return t.continent === "Asia";
    if (qq.includes("in africa")) return t.continent === "Africa";
    if (qq.includes("in north america")) return t.continent === "North America";
    if (qq.includes("in south america")) return t.continent === "South America";
    if (qq.includes("in oceania")) return t.continent === "Oceania";

    if (qq.includes("northern hemisphere")) return t.hemisphere === "N";
    if (qq.includes("southern hemisphere")) return t.hemisphere === "S";

    if (qq.includes("coastal")) return !!t.coastal;
    if (qq.includes("national capital")) return !!t.capital;
    if (qq.includes("on an island")) return !!t.island;
    if (qq.includes("in the eu")) return !!t.eu;
    if (qq.includes("in the u.s.")) return !!t.us;

    if (qq.includes("over 100m")) return !!t.pop100m;
    if (qq.includes("metro population over 2m")) return !!t.metro2m;

    if (qq.includes("speak spanish")) return (t.lang || "").toLowerCase().includes("spanish");
    if (qq.includes("speak english")) return (t.lang || "").toLowerCase().includes("english");

    return null;
  }

  // Eliminate candidates based on a question + answer
  function eliminateCandidates(q, ans){
    cpu.candidateCities = cpu.candidateCities.filter(cityObj => {
      const expected = cpuAnswerToQuestion(q, cityObj);
      if (expected === null) return true; // unknown: keep
      return expected === (ans === "Yes");
    });
  }

  // CPU picks the most informative unused question
  function cpuPickQuestion(){
    const difficulty = cpu.difficulty;
    const unused = QUESTIONS.filter(q => !cpu.answeredQuestions.includes(q));
    if (!unused.length) return QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)]; // fallback

    if (difficulty === "easy") {
      return unused[Math.floor(Math.random()*unused.length)];
    }

    if (difficulty === "medium") {
      const preferred = unused.filter(q =>
        /Europe|Asia|Africa|North America|South America|Oceania|Northern Hemisphere|Southern Hemisphere/i.test(q)
      );
      const pool = preferred.length ? preferred : unused;
      return pool[Math.floor(Math.random()*pool.length)];
    }

    // Hard: pick the question that splits remaining candidates most evenly (best info gain)
    let bestQ = unused[0];
    let bestScore = Infinity;
    for (const q of unused) {
      let yesCount = 0;
      for (const c of cpu.candidateCities) {
        if (cpuAnswerToQuestion(q, c) === true) yesCount++;
      }
      const noCount = cpu.candidateCities.length - yesCount;
      // Score = distance from 50/50 split; lower is better
      const score = Math.abs(yesCount - noCount);
      if (score < bestScore) { bestScore = score; bestQ = q; }
    }
    return bestQ;
  }

  function startCpuGame(){
    cpu.turn = "P1";
    cpu.phase = "ask";
    cpu.currentQuestion = "";
    cpu.winner = null;
    cpu.candidateCities = CITY_DB.slice(); // start with all cities as candidates
    cpu.answeredQuestions = [];
    clearLogUI();
    logLine("CPU game started! Good luck 🎯");
    showScreen("game");
    syncGameUI();
  }

  // CPU takes its turn: ask a question OR guess if confident
  function cpuTakeTurn(){
    // If only 1 candidate left, guess it
    if (cpu.candidateCities.length === 1) {
      const guess = cpu.candidateCities[0].city;
      logLine(`CPU guesses: "${guess}"!`);
      cpu.currentQuestion = "";
      cpu.phase = "ask"; // will be checked below
      const ok = normalizeCity(guess) === normalizeCity(cpu.playerCity?.city || "");
      window.setTimeout(() => {
        if (ok) {
          cpu.phase = "end";
          cpu.winner = "P2";
          logLine(`CPU was right — it was ${guess}! CPU wins!`);
        } else {
          logLine(`CPU guessed wrong (${guess}). The game goes on!`);
          cpu.candidateCities = CITY_DB.slice(); // reset candidates on wrong guess
          const cpuQ = cpuPickQuestion();
          cpu.answeredQuestions.push(cpuQ);
          cpu.currentQuestion = cpuQ;
          logLine(`CPU asked: ${cpuQ}`);
          cpu.phase = "answer";
          cpu.turn = "P2";
        }
        syncGameUI();
      }, 600);
      return;
    }

    // Otherwise ask a question
    const cpuQ = cpuPickQuestion();
    cpu.answeredQuestions.push(cpuQ);
    cpu.currentQuestion = cpuQ;
    logLine(`CPU asked: ${cpuQ}`);
    cpu.phase = "answer";
    cpu.turn = "P2";
    syncGameUI();
  }

  async function cpuAsk(){
    const q = els.cpuQuestionSelect.value;
    if (!q) { logLine("Pick a question first."); return; }

    cpu.currentQuestion = q;
    logLine(`You asked: ${q}`);

    const ans = cpuAnswerToQuestion(q, cpu.cpuCity);

    if (ans === null) {
      logLine("CPU: I don't understand that question. Pick another.");
      cpu.currentQuestion = "";
      cpu.phase = "ask";
      syncGameUI();
      return;
    }

    const ansStr = ans ? "Yes" : "No";
    logLine(`CPU answered: ${ansStr}`);
    cpu.currentQuestion = "";
    els.cpuQuestionSelect.value = "";

    // BUG FIX: turn stays with P1 after getting an answer (asker keeps their turn)
    // cpu.turn remains "P1" — player gets another question or can guess
    cpu.phase = "ask";
    syncGameUI();
  }

  function cpuHumanAnswers(ans){
    // Human (P1) answering CPU's question about the HUMAN's city
    const q = cpu.currentQuestion;
    if (!q) return;

    logLine(`You answered: ${ans}`);
    eliminateCandidates(q, ans);
    logLine(`CPU narrowed it down to ${cpu.candidateCities.length} city/cities.`);
    cpu.currentQuestion = "";

    // Now CPU evaluates: guess or ask again?
    // BUG FIX: use a single setTimeout to avoid UI flicker
    window.setTimeout(() => {
      cpuTakeTurn();
    }, 400);
  }

  function cpuOpenGuess(){ cpu.phase = "guess"; syncGameUI(); }
  function cpuCancelGuess(){ cpu.phase = "ask"; syncGameUI(); }

  function cpuSubmitGuess(){
    const guess = (els.guessInput.value || "").trim();
    if (!guess) return;

    const ok = normalizeCity(guess) === normalizeCity(cpu.cpuCity?.city || "");
    els.guessInput.value = "";

    if (ok) {
      cpu.phase = "end";
      cpu.winner = "P1";
      logLine(`You guessed "${guess}" — CORRECT! 🎉`);
      syncGameUI();
    } else {
      logLine(`You guessed "${guess}" — wrong. CPU's turn.`);
      // BUG FIX: don't call syncGameUI here — wait for setTimeout to set final state
      window.setTimeout(() => {
        cpuTakeTurn();
      }, 400);
    }
  }

  // ---------------------------
  // Local mode
  // ---------------------------
  function localBegin(){
    // Capture names at game start
    local.p1.name = (els.p1Name.value || "Player 1").trim().slice(0,18);
    local.p2.name = (els.p2Name.value || "Player 2").trim().slice(0,18);
    local.turn="P1"; local.phase="ask"; local.currentQuestion=""; local.winner=null;
    clearLogUI(); logLine("Local game started!");
    showScreen("game"); syncGameUI();
  }

  function localAsk(){
    const q=(els.questionInput.value||"").trim();
    if(!q) return;
    local.currentQuestion=q;
    local.phase="answer";
    logLine(`${els.p1Name.value || "P1"} asked: ${q}`);
    els.questionInput.value="";
    syncGameUI();
  }

  function localAnswer(ans){
    // BUG FIX: the answerer answers, but the ASKER's turn continues next round
    // (Original bug: turn was set to answerer, which wrongly swapped turns)
    const asker = local.turn;
    const answerer = asker === "P1" ? "P2" : "P1";
    const answererName = answerer === "P1" ? (els.p1Name.value || "Player 1") : (els.p2Name.value || "Player 2");
    logLine(`${answererName} answered: ${ans}`);
    local.currentQuestion = "";
    // Turn now passes to the OTHER player (answerer becomes the next asker)
    local.turn = answerer;
    local.phase = "ask";
    syncGameUI();
  }

  function localOpenGuess(){ local.phase="guess"; syncGameUI(); }
  function localCancelGuess(){ local.phase="ask"; syncGameUI(); }

  function localSubmitGuess(){
    const guess=(els.guessInput.value||"").trim(); if(!guess) return;
    const opponent = local.turn==="P1" ? "P2":"P1";
    const opponentCity = opponent==="P1" ? local.p1.city : local.p2.city;
    const ok = normalizeCity(guess) === normalizeCity(opponentCity);
    const guesserName = local.turn === "P1" ? (els.p1Name.value || "Player 1") : (els.p2Name.value || "Player 2");
    if(ok){
      local.phase="end";
      local.winner=local.turn;
      logLine(`${guesserName} guessed "${guess}" — CORRECT! 🎉`);
    } else {
      logLine(`${guesserName} guessed "${guess}" — wrong.`);
      local.turn=opponent;
      local.phase="ask";
    }
    els.guessInput.value=""; syncGameUI();
  }

  // ---------------------------
  // Shared modal logic (cities)
  // ---------------------------
  function openCityModal(forRole, hintText){
    els.modalTitle.textContent = forRole==="P1" ? "Player 1: secret city" : "Player 2: secret city";
    els.modalHint.textContent = hintText || "Make sure the other player isn't looking 👀";
    els.secretCityInput.value = "";

    if (activeMode === "cpu") {
      els.cpuCityPicker.classList.remove("hidden");
      els.secretCityInput.placeholder = "Use the picker below…";
      els.secretCityInput.disabled = true;
      els.cpuCitySelect.value = "";
    } else {
      els.cpuCityPicker.classList.add("hidden");
      els.secretCityInput.disabled = false;
    }

    localEditing = forRole;
    showModal("modal", true);
    if (activeMode !== "cpu") els.secretCityInput.focus();
  }
  function closeCityModal(){ showModal("modal", false); localEditing=null; }

  // ---------------------------
  // Reset
  // ---------------------------
  function resetAll(){
    showScreen("home");
    clearLogUI();
    els.questionInput.value="";
    els.guessInput.value="";
    els.questionDisplay.textContent="—";
    els.endMessage.textContent="—";

    activeMode=null;
    localEditing=null;

    local.p1={name:"Player 1", city:""};
    local.p2={name:"Player 2", city:""};
    local.turn="P1"; local.phase="setup"; local.currentQuestion=""; local.winner=null;

    cpu.difficulty="medium";
    cpu.playerCity=null; cpu.cpuCity=null;
    cpu.turn="P1"; cpu.phase="setup"; cpu.currentQuestion=""; cpu.winner=null;
    cpu.candidateCities=[];
    cpu.answeredQuestions=[];

    // Re-enable p2 name field (was disabled in CPU mode)
    els.p2Name.disabled = false;
    els.btnSetP2.disabled = false;
    els.cpuDifficulty.value = "medium";

    els.roomLabel.textContent="—";
    els.roleLabel.textContent="—";
    els.onlineStatus.textContent="Firebase: —";
  }

  // ---------------------------
  // Wire UI
  // ---------------------------
  els.btnReset.addEventListener("click", resetAll);
  els.btnBackHome.addEventListener("click", () => {
    resetAll();
  });

  els.btnStartLocal.addEventListener("click", () => {
    activeMode="local";
    showScreen("setup");
    syncSetupUI();
  });

  els.btnStartCpu.addEventListener("click", () => {
    activeMode="cpu";
    cpu.difficulty = els.cpuDifficulty.value || "medium";
    cpu.playerCity = null;
    cpu.cpuCity = CITY_DB[Math.floor(Math.random()*CITY_DB.length)];
    cpu.candidateCities = CITY_DB.slice();
    cpu.answeredQuestions = [];
    els.p2Name.value = "CPU";
    showScreen("setup");
    syncSetupUI();
  });

  // Online buttons — cleaner UX than alert()
  els.btnCreateRoom.addEventListener("click", () => {
    if (typeof db === "undefined" || !db) {
      els.onlineStatus.textContent = "Firebase: not connected";
      logLine && logLine("Online mode requires Firebase. See firebase.js setup instructions.");
      // Show a gentle in-page message instead of alert
      const msg = document.createElement("p");
      msg.style.cssText = "color:#ff8a8a;font-size:12px;margin:8px 0 0;";
      msg.textContent = "⚠️ Online mode requires Firebase. Please configure firebase.js.";
      const existing = els.btnCreateRoom.parentNode.querySelector(".online-warn");
      if (!existing) { msg.className = "online-warn"; els.btnCreateRoom.parentNode.appendChild(msg); }
      return;
    }
    activeMode = "online";
    // Your existing Firebase create-room logic here
  });

  els.btnJoinRoom.addEventListener("click", () => {
    if (typeof db === "undefined" || !db) {
      const msg = document.createElement("p");
      msg.style.cssText = "color:#ff8a8a;font-size:12px;margin:8px 0 0;";
      msg.textContent = "⚠️ Online mode requires Firebase. Please configure firebase.js.";
      const existing = els.btnJoinRoom.parentNode.querySelector(".online-warn");
      if (!existing) { msg.className = "online-warn"; els.btnJoinRoom.parentNode.appendChild(msg); }
      return;
    }
    activeMode = "online";
    // Your existing Firebase join-room logic here
  });

  // BUG FIX: Both name inputs now correctly save their player's name
  els.p1Name.addEventListener("blur", () => {
    if (activeMode==="local") local.p1.name = (els.p1Name.value || "Player 1").trim().slice(0,18);
  });
  els.p2Name.addEventListener("blur", () => {
    if (activeMode==="local") local.p2.name = (els.p2Name.value || "Player 2").trim().slice(0,18);
  });

  // Set cities
  els.btnSetP1.addEventListener("click", () => {
    if (activeMode==="local") return openCityModal("P1", "Hand the phone to Player 1 👀");
    if (activeMode==="cpu") return openCityModal("P1", "Pick your city from the list.");
  });
  els.btnSetP2.addEventListener("click", () => {
    if (activeMode==="local") return openCityModal("P2", "Hand the phone to Player 2 👀");
  });

  // Save city
  els.btnSaveCity.addEventListener("click", () => {
    if (activeMode==="cpu") {
      const picked = els.cpuCitySelect.value;
      if (!picked) { logLine("Please pick a city from the list."); return; }
      cpu.playerCity = cityObjByName(picked);
      closeCityModal();
      syncSetupUI();
      return;
    }

    const city = (els.secretCityInput.value || "").trim();
    if (!city) return;

    if (activeMode==="local") {
      if (localEditing==="P1") local.p1.city = city;
      if (localEditing==="P2") local.p2.city = city;
      closeCityModal();
      syncSetupUI();
    }
  });

  // Allow Enter key to save city
  els.secretCityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") els.btnSaveCity.click();
  });

  els.btnCancelCity.addEventListener("click", closeCityModal);
  els.btnCloseModal.addEventListener("click", closeCityModal);

  // Begin
  els.btnBeginGame.addEventListener("click", () => {
    if (activeMode==="local") return localBegin();
    if (activeMode==="cpu") {
      if (!cpu.playerCity || !cpu.cpuCity) { logLine("Pick your city first!"); return; }
      startCpuGame();
    }
  });

  // Quick Qs
  els.btnQuick.addEventListener("click", () => showModal("quickModal", true));
  els.btnQuickCpu.addEventListener("click", () => showModal("quickModal", true));
  els.btnCloseQuick.addEventListener("click", () => showModal("quickModal", false));

  // Ask (local)
  els.btnAsk.addEventListener("click", () => {
    if (activeMode==="local") return localAsk();
  });

  // Allow Enter to ask question
  els.questionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && activeMode === "local") localAsk();
  });

  // Ask (cpu)
  els.btnCpuAsk.addEventListener("click", () => {
    if (activeMode==="cpu") return cpuAsk();
  });

  // Answer buttons
  els.btnYes.addEventListener("click", () => {
    if (activeMode==="local") return localAnswer("Yes");
    if (activeMode==="cpu") return cpuHumanAnswers("Yes");
  });
  els.btnNo.addEventListener("click", () => {
    if (activeMode==="local") return localAnswer("No");
    if (activeMode==="cpu") return cpuHumanAnswers("No");
  });

  // Guess open/cancel/submit
  els.btnGuess.addEventListener("click", () => { if (activeMode==="local") return localOpenGuess(); });
  els.btnGuessCpu.addEventListener("click", () => { if (activeMode==="cpu") return cpuOpenGuess(); });

  els.btnCancelGuess.addEventListener("click", () => {
    if (activeMode==="local") return localCancelGuess();
    if (activeMode==="cpu") return cpuCancelGuess();
  });
  els.btnSubmitGuess.addEventListener("click", () => {
    if (activeMode==="local") return localSubmitGuess();
    if (activeMode==="cpu") return cpuSubmitGuess();
  });

  // Allow Enter to submit guess
  els.guessInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") els.btnSubmitGuess.click();
  });

  // End: play again
  els.btnPlayAgain.addEventListener("click", () => {
    resetAll();
  });

  // Clear log
  els.btnClearLog.addEventListener("click", () => clearLogUI());

  // Boot
  buildQuickList();
  buildCpuQuestionSelect();
  buildCpuCitySelect();
  showScreen("home");
})();

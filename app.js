// app.js — Local + Online (Firebase) + CPU (structured questions)
// CPU mode uses dropdown questions (no unsupported turn loss). Quick Questions modal scrolls.
// Works on GitHub Pages. Online requires firebase.js that sets global `db`.

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
    { city:"Reykjavik", country:"Iceland", continent:"Europe", hemisphere:"N", coastal:true, capital:true, island:true, eu:false, us:false, lang:"English", pop100m:false, metro2m:false }
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
    playerCity:null, // object from CITY_DB
    cpuCity:null,    // object from CITY_DB
    turn:"P1",       // P1=human, P2=CPU
    phase:"setup",
    currentQuestion:"",
    winner:null,
  };

  // Minimal Online placeholders (keep your existing firebase.js/db).
  // This file focuses on CPU UX; Online buttons will warn if db missing.
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
      els.btnSetP2.disabled = true; // CPU city auto
      els.p1Name.disabled = false;
      els.btnSetP1.disabled = false;
      els.btnBeginGame.disabled = !(cpu.playerCity && cpu.cpuCity);
      els.p1CityStatus.textContent = cpu.playerCity ? "set" : "not set";
      els.p2CityStatus.textContent = cpu.cpuCity ? "set" : "not set";
      return;
    }

    if (activeMode === "local") {
      els.modeLabel.textContent = "Local";
      els.setupHint.textContent = "One phone pass-and-play. Hand the phone over when setting cities.";
      els.p1Name.disabled = false; els.p2Name.disabled = false;
      els.btnSetP1.disabled = false; els.btnSetP2.disabled = false;
      els.btnBeginGame.disabled = !(local.p1.city && local.p2.city);
      els.p1Name.value = local.p1.name; els.p2Name.value = local.p2.name;
      els.p1CityStatus.textContent = local.p1.city ? "set" : "not set";
      els.p2CityStatus.textContent = local.p2.city ? "set" : "not set";
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

    els.turnLabel.textContent = turn;
    els.phaseLabel.textContent = phase;

    els.askArea.classList.toggle("hidden", phase !== "ask");
    els.answerArea.classList.toggle("hidden", phase !== "answer");
    els.guessArea.classList.toggle("hidden", phase !== "guess");
    els.endArea.classList.toggle("hidden", phase !== "end");

    // Toggle CPU structured questions vs free text
    const cpuAsking = (activeMode === "cpu" && phase === "ask" && cpu.turn === "P1");
    els.freeQuestionBlock.classList.toggle("hidden", activeMode === "cpu");
    els.cpuQuestionBlock.classList.toggle("hidden", activeMode !== "cpu");

    // Enable / disable buttons
    if (activeMode === "cpu") {
      const myTurn = cpu.turn === "P1";
      els.btnCpuAsk.disabled = !(myTurn && phase === "ask");
      els.btnQuickCpu.disabled = !(myTurn && phase === "ask");
      els.btnGuessCpu.disabled = !(myTurn && phase === "ask");
      els.btnYes.disabled = !(!myTurn && phase === "answer"); // when CPU asks, human answers
      els.btnNo.disabled  = !(!myTurn && phase === "answer");
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
        let name = winner === "P1" ? (els.p1Name.value || "Player 1") : (activeMode === "cpu" ? "CPU" : (els.p2Name.value || "Player 2"));
        els.endMessage.textContent = `${name} wins!`;
      } else {
        els.endMessage.textContent = "Game over!";
      }
    }
  }

  // ---------------------------
  // CPU logic (structured questions)
  // ---------------------------
  function cityObjByName(name){
    return CITY_DB.find(c => normalizeCity(c.city) === normalizeCity(name)) || null;
  }

  function cpuAnswerToQuestion(q, targetCityObj){
    // q is from QUESTIONS (structured), so we can deterministically answer.
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

    return null; // should not happen if we keep QUESTIONS aligned
  }

  function cpuPickQuestion(difficulty){
    // Easy: random; Medium: bias to continent/hemisphere; Hard: picks from remaining informative set (simple heuristic)
    const base = QUESTIONS.slice();
    if (difficulty === "easy") return base[Math.floor(Math.random()*base.length)];

    const preferred = base.filter(q =>
      /Europe|Asia|Africa|North America|South America|Oceania|Northern Hemisphere|Southern Hemisphere/i.test(q)
    );
    if (difficulty === "medium") return (preferred.length ? preferred : base)[Math.floor(Math.random() * (preferred.length ? preferred.length : base.length))];

    // hard: include coastal/capital/island/english/spanish too
    const hard = base.filter(q => /coastal|capital|island|English|Spanish|EU|U\.S\./i.test(q)).concat(preferred);
    const pool = hard.length ? hard : base;
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function startCpuGame(){
    cpu.turn = "P1";
    cpu.phase = "ask";
    cpu.currentQuestion = "";
    cpu.winner = null;
    clearLogUI();
    logLine("CPU game started!");
    showScreen("game");
    syncGameUI();
  }

  async function cpuAsk(){
    const q = els.cpuQuestionSelect.value;
    if (!q) return;

    // CPU answers based on its secret city
    cpu.currentQuestion = q;
    logLine(`P1 asked: ${q}`);

    const ans = cpuAnswerToQuestion(q, cpu.cpuCity);

    // SAFETY: if something ever returns null, DO NOT steal turn.
    if (ans === null) {
      logLine("CPU: I don't know that question. Pick another.");
      cpu.currentQuestion = "";
      cpu.phase = "ask"; // keep player's turn
      syncGameUI();
      return;
    }

    // show answer phase briefly in log, then switch to CPU turn
    logLine(`CPU answered: ${ans ? "Yes" : "No"}`);
    cpu.currentQuestion = "";
    cpu.turn = "P2";
    cpu.phase = "ask";

    // CPU asks immediately
    window.setTimeout(() => {
      const cpuQ = cpuPickQuestion(cpu.difficulty);
      cpu.currentQuestion = cpuQ;
      logLine(`CPU asked: ${cpuQ}`);
      cpu.phase = "answer";
      cpu.turn = "P2"; // still CPU's question
      syncGameUI();
    }, 250);

    // reset select for next time
    els.cpuQuestionSelect.value = "";
    syncGameUI();
  }

  function cpuHumanAnswers(ans){
    // Human answering CPU's question about HUMAN city
    const q = cpu.currentQuestion;
    if (!q) return;

    logLine(`P1 answered: ${ans}`);
    cpu.currentQuestion = "";
    cpu.phase = "ask";
    cpu.turn = "P1";
    syncGameUI();
  }

  function cpuOpenGuess(){ cpu.phase = "guess"; syncGameUI(); }
  function cpuCancelGuess(){ cpu.phase = "ask"; syncGameUI(); }

  function cpuSubmitGuess(){
    const guess = (els.guessInput.value || "").trim();
    if (!guess) return;

    const ok = normalizeCity(guess) === normalizeCity(cpu.cpuCity?.city || "");
    if (ok) {
      cpu.phase = "end";
      cpu.winner = "P1";
      logLine(`P1 guessed "${guess}" — CORRECT!`);
    } else {
      logLine(`P1 guessed "${guess}" — wrong.`);
      // DO NOT auto-penalize more; just continue with CPU asking next
      cpu.turn = "P2";
      cpu.phase = "ask";
      // CPU asks again
      window.setTimeout(() => {
        const cpuQ = cpuPickQuestion(cpu.difficulty);
        cpu.currentQuestion = cpuQ;
        logLine(`CPU asked: ${cpuQ}`);
        cpu.phase = "answer";
        cpu.turn = "P2";
        syncGameUI();
      }, 250);
    }
    els.guessInput.value = "";
    syncGameUI();
  }

  // ---------------------------
  // Local mode (simple)
  // ---------------------------
  function localBegin(){
    local.turn="P1"; local.phase="ask"; local.currentQuestion=""; local.winner=null;
    clearLogUI(); logLine("Local game started!");
    showScreen("game"); syncGameUI();
  }
  function localAsk(){
    const q=(els.questionInput.value||"").trim();
    if(!q) return;
    local.currentQuestion=q; local.phase="answer";
    logLine(`${local.turn} asked: ${q}`);
    els.questionInput.value="";
    syncGameUI();
  }
  function localAnswer(ans){
    const answerer = local.turn==="P1" ? "P2":"P1";
    logLine(`${answerer} answered: ${ans}`);
    local.currentQuestion="";
    local.turn=answerer;
    local.phase="ask";
    syncGameUI();
  }
  function localOpenGuess(){ local.phase="guess"; syncGameUI(); }
  function localCancelGuess(){ local.phase="ask"; syncGameUI(); }
  function localSubmitGuess(){
    const guess=(els.guessInput.value||"").trim(); if(!guess) return;
    const opponent = local.turn==="P1" ? "P2":"P1";
    const opponentCity = opponent==="P1" ? local.p1.city : local.p2.city;
    const ok = normalizeCity(guess) === normalizeCity(opponentCity);
    if(ok){ local.phase="end"; local.winner=local.turn; logLine(`${local.turn} guessed "${guess}" — CORRECT!`); }
    else { logLine(`${local.turn} guessed "${guess}" — wrong.`); local.turn=opponent; local.phase="ask"; }
    els.guessInput.value=""; syncGameUI();
  }

  // ---------------------------
  // Shared modal logic (cities)
  // ---------------------------
  function openCityModal(forRole, hintText){
    els.modalTitle.textContent = forRole==="P1" ? "Player 1: secret city" : "Player 2: secret city";
    els.modalHint.textContent = hintText || "Make sure the other player isn't looking 👀";
    els.secretCityInput.value = "";

    // CPU mode: show picker for P1 city, hide free text
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

    els.roomLabel.textContent="—";
    els.roleLabel.textContent="—";
    els.onlineStatus.textContent="Firebase: —";
  }

  // ---------------------------
  // Wire UI
  // ---------------------------
  els.btnReset.addEventListener("click", resetAll);
  els.btnBackHome.addEventListener("click", () => showScreen("home"));

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
    els.p2Name.value = "CPU";
    showScreen("setup");
    syncSetupUI();
  });

  // Online buttons (optional)
  els.btnCreateRoom.addEventListener("click", () => {
    activeMode="online";
    alert("Online mode in this bundle expects your existing firebase.js + online logic. If you want, I can merge this CPU upgrade into your current full multiplayer app.js.");
  });
  els.btnJoinRoom.addEventListener("click", () => {
    activeMode="online";
    alert("Online mode in this bundle expects your existing firebase.js + online logic. If you want, I can merge this CPU upgrade into your current full multiplayer app.js.");
  });

  // Names blur
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
      if (!picked) return;
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

  els.btnCancelCity.addEventListener("click", closeCityModal);
  els.btnCloseModal.addEventListener("click", closeCityModal);

  // Begin
  els.btnBeginGame.addEventListener("click", () => {
    if (activeMode==="local") return localBegin();
    if (activeMode==="cpu") {
      if (!cpu.playerCity || !cpu.cpuCity) { alert("Pick your city first."); return; }
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

  // End: play again (new cities)
  els.btnPlayAgain.addEventListener("click", () => {
    // Return to home for mode pick
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

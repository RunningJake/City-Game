// app.js — City Guess
// Modes: Local pass-and-play | Online (Firebase Realtime DB) | vs CPU
// ─────────────────────────────────────────────────────────────────────
// CPU turn flow: P1 asks → CPU answers → CPU immediately asks P1 back → P1 answers → repeat
// CPU uses candidate-elimination to guess when it narrows down to 1 city.
// Online: host creates a room code, guest joins; Firebase syncs game state in real-time.

(() => {
  const $ = (id) => document.getElementById(id);

  // ── Screens ────────────────────────────────────────────────────────
  const screens = { home: $("screenHome"), setup: $("screenSetup"), game: $("screenGame") };
  function showScreen(which) {
    Object.entries(screens).forEach(([k, el]) => el && el.classList.toggle("hidden", k !== which));
  }
  function showModal(id, show) {
    const el = $(id); if (!el) return;
    el.classList.toggle("hidden", !show);
  }

  // ── Questions (expanded) ───────────────────────────────────────────
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
    "Is your city landlocked?",
    "Is your city on an island?",
    "Is your city on a major river?",
    "Is your city a national capital?",
    "Is your city in the EU?",
    "Is your city in the U.S.?",
    "Is your city in a G7 country?",
    "Is your city in a country with over 100M people?",
    "Does your city have a metro population over 2M?",
    "Does your city have a metro population over 10M?",
    "Do most people speak Spanish in your city?",
    "Do most people speak English in your city?",
    "Do most people speak French in your city?",
    "Do most people speak Arabic in your city?",
    "Do most people speak Portuguese in your city?",
    "Do most people speak Mandarin in your city?",
    "Does your city have a tropical climate?",
    "Does your city get snow in winter?",
    "Is your city in a desert region?",
    "Is your city a major financial hub?",
    "Is your city famous for tourism?",
    "Is your city in a country with a monarchy?",
    "Was your city founded before 1500 AD?",
    "Is your city in a predominantly Muslim country?",
    "Is your city in a predominantly Christian country?",
    "Is your city in a predominantly Buddhist country?",
  ];

  // ── City database (40 cities) ──────────────────────────────────────
  const CITY_DB = [
    { city:"Montevideo",   country:"Uruguay",      continent:"South America", hemisphere:"S", coastal:true,  landlocked:false, island:false, river:false, capital:true,  eu:false, us:false, g7:false, pop100m:false, metro2m:false, metro10m:false, lang:"Spanish",    tropical:false, snow:false, desert:false, financialHub:false, tourism:false, monarchy:false, founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Lisbon",       country:"Portugal",     continent:"Europe",        hemisphere:"N", coastal:true,  landlocked:false, island:false, river:true,  capital:true,  eu:true,  us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"Portuguese", tropical:false, snow:false, desert:false, financialHub:false, tourism:true,  monarchy:false, founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Tokyo",        country:"Japan",        continent:"Asia",          hemisphere:"N", coastal:true,  landlocked:false, island:true,  river:false, capital:true,  eu:false, us:false, g7:true,  pop100m:false, metro2m:true,  metro10m:true,  lang:"Japanese",   tropical:false, snow:true,  desert:false, financialHub:true,  tourism:true,  monarchy:true,  founded1500:true,  muslim:false, christian:false, buddhist:true  },
    { city:"Jakarta",      country:"Indonesia",    continent:"Asia",          hemisphere:"S", coastal:true,  landlocked:false, island:true,  river:true,  capital:true,  eu:false, us:false, g7:false, pop100m:true,  metro2m:true,  metro10m:true,  lang:"Indonesian", tropical:true,  snow:false, desert:false, financialHub:false, tourism:false, monarchy:false, founded1500:true,  muslim:true,  christian:false, buddhist:false },
    { city:"Nairobi",      country:"Kenya",        continent:"Africa",        hemisphere:"S", coastal:false, landlocked:true,  island:false, river:false, capital:true,  eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"English",    tropical:true,  snow:false, desert:false, financialHub:false, tourism:true,  monarchy:false, founded1500:false, muslim:false, christian:true,  buddhist:false },
    { city:"Toronto",      country:"Canada",       continent:"North America", hemisphere:"N", coastal:false, landlocked:false, island:false, river:false, capital:false, eu:false, us:false, g7:true,  pop100m:false, metro2m:true,  metro10m:false, lang:"English",    tropical:false, snow:true,  desert:false, financialHub:true,  tourism:true,  monarchy:true,  founded1500:false, muslim:false, christian:true,  buddhist:false },
    { city:"Sydney",       country:"Australia",    continent:"Oceania",       hemisphere:"S", coastal:true,  landlocked:false, island:true,  river:false, capital:false, eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"English",    tropical:false, snow:false, desert:false, financialHub:true,  tourism:true,  monarchy:true,  founded1500:false, muslim:false, christian:true,  buddhist:false },
    { city:"Madrid",       country:"Spain",        continent:"Europe",        hemisphere:"N", coastal:false, landlocked:true,  island:false, river:false, capital:true,  eu:true,  us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"Spanish",    tropical:false, snow:true,  desert:false, financialHub:true,  tourism:true,  monarchy:true,  founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Miami",        country:"USA",          continent:"North America", hemisphere:"N", coastal:true,  landlocked:false, island:false, river:false, capital:false, eu:false, us:true,  g7:true,  pop100m:true,  metro2m:true,  metro10m:false, lang:"English",    tropical:true,  snow:false, desert:false, financialHub:false, tourism:true,  monarchy:false, founded1500:false, muslim:false, christian:true,  buddhist:false },
    { city:"Reykjavik",    country:"Iceland",      continent:"Europe",        hemisphere:"N", coastal:true,  landlocked:false, island:true,  river:false, capital:true,  eu:false, us:false, g7:false, pop100m:false, metro2m:false, metro10m:false, lang:"Icelandic",  tropical:false, snow:true,  desert:false, financialHub:false, tourism:true,  monarchy:false, founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Buenos Aires", country:"Argentina",    continent:"South America", hemisphere:"S", coastal:true,  landlocked:false, island:false, river:true,  capital:true,  eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:true,  lang:"Spanish",    tropical:false, snow:false, desert:false, financialHub:true,  tourism:true,  monarchy:false, founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Cairo",        country:"Egypt",        continent:"Africa",        hemisphere:"N", coastal:false, landlocked:true,  island:false, river:true,  capital:true,  eu:false, us:false, g7:false, pop100m:true,  metro2m:true,  metro10m:true,  lang:"Arabic",     tropical:false, snow:false, desert:true,  financialHub:false, tourism:true,  monarchy:false, founded1500:true,  muslim:true,  christian:false, buddhist:false },
    { city:"Lagos",        country:"Nigeria",      continent:"Africa",        hemisphere:"N", coastal:true,  landlocked:false, island:false, river:false, capital:false, eu:false, us:false, g7:false, pop100m:true,  metro2m:true,  metro10m:true,  lang:"English",    tropical:true,  snow:false, desert:false, financialHub:false, tourism:false, monarchy:false, founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Bangkok",      country:"Thailand",     continent:"Asia",          hemisphere:"N", coastal:false, landlocked:true,  island:false, river:true,  capital:true,  eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:true,  lang:"Thai",       tropical:true,  snow:false, desert:false, financialHub:false, tourism:true,  monarchy:true,  founded1500:false, muslim:false, christian:false, buddhist:true  },
    { city:"Istanbul",     country:"Turkey",       continent:"Europe",        hemisphere:"N", coastal:true,  landlocked:false, island:false, river:false, capital:false, eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:true,  lang:"Turkish",    tropical:false, snow:true,  desert:false, financialHub:true,  tourism:true,  monarchy:false, founded1500:true,  muslim:true,  christian:false, buddhist:false },
    { city:"Paris",        country:"France",       continent:"Europe",        hemisphere:"N", coastal:false, landlocked:true,  island:false, river:true,  capital:true,  eu:true,  us:false, g7:true,  pop100m:false, metro2m:true,  metro10m:true,  lang:"French",     tropical:false, snow:true,  desert:false, financialHub:true,  tourism:true,  monarchy:false, founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"London",       country:"UK",           continent:"Europe",        hemisphere:"N", coastal:false, landlocked:true,  island:true,  river:true,  capital:true,  eu:false, us:false, g7:true,  pop100m:false, metro2m:true,  metro10m:true,  lang:"English",    tropical:false, snow:true,  desert:false, financialHub:true,  tourism:true,  monarchy:true,  founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"New York",     country:"USA",          continent:"North America", hemisphere:"N", coastal:true,  landlocked:false, island:false, river:false, capital:false, eu:false, us:true,  g7:true,  pop100m:true,  metro2m:true,  metro10m:true,  lang:"English",    tropical:false, snow:true,  desert:false, financialHub:true,  tourism:true,  monarchy:false, founded1500:false, muslim:false, christian:true,  buddhist:false },
    { city:"Mumbai",       country:"India",        continent:"Asia",          hemisphere:"N", coastal:true,  landlocked:false, island:false, river:false, capital:false, eu:false, us:false, g7:false, pop100m:true,  metro2m:true,  metro10m:true,  lang:"Hindi",      tropical:true,  snow:false, desert:false, financialHub:true,  tourism:true,  monarchy:false, founded1500:true,  muslim:false, christian:false, buddhist:false },
    { city:"Beijing",      country:"China",        continent:"Asia",          hemisphere:"N", coastal:false, landlocked:true,  island:false, river:false, capital:true,  eu:false, us:false, g7:false, pop100m:true,  metro2m:true,  metro10m:true,  lang:"Mandarin",   tropical:false, snow:true,  desert:false, financialHub:true,  tourism:true,  monarchy:false, founded1500:true,  muslim:false, christian:false, buddhist:false },
    { city:"Seoul",        country:"South Korea",  continent:"Asia",          hemisphere:"N", coastal:false, landlocked:true,  island:false, river:true,  capital:true,  eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:true,  lang:"Korean",     tropical:false, snow:true,  desert:false, financialHub:true,  tourism:true,  monarchy:false, founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Mexico City",  country:"Mexico",       continent:"North America", hemisphere:"N", coastal:false, landlocked:true,  island:false, river:false, capital:true,  eu:false, us:false, g7:false, pop100m:true,  metro2m:true,  metro10m:true,  lang:"Spanish",    tropical:false, snow:false, desert:false, financialHub:true,  tourism:true,  monarchy:false, founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"São Paulo",    country:"Brazil",       continent:"South America", hemisphere:"S", coastal:false, landlocked:true,  island:false, river:false, capital:false, eu:false, us:false, g7:false, pop100m:true,  metro2m:true,  metro10m:true,  lang:"Portuguese", tropical:true,  snow:false, desert:false, financialHub:true,  tourism:true,  monarchy:false, founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Casablanca",   country:"Morocco",      continent:"Africa",        hemisphere:"N", coastal:true,  landlocked:false, island:false, river:false, capital:false, eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"Arabic",     tropical:false, snow:false, desert:false, financialHub:false, tourism:true,  monarchy:true,  founded1500:true,  muslim:true,  christian:false, buddhist:false },
    { city:"Karachi",      country:"Pakistan",     continent:"Asia",          hemisphere:"N", coastal:true,  landlocked:false, island:false, river:false, capital:false, eu:false, us:false, g7:false, pop100m:true,  metro2m:true,  metro10m:true,  lang:"Urdu",       tropical:false, snow:false, desert:true,  financialHub:false, tourism:false, monarchy:false, founded1500:false, muslim:true,  christian:false, buddhist:false },
    { city:"Dhaka",        country:"Bangladesh",   continent:"Asia",          hemisphere:"N", coastal:false, landlocked:true,  island:false, river:true,  capital:true,  eu:false, us:false, g7:false, pop100m:true,  metro2m:true,  metro10m:true,  lang:"Bengali",    tropical:true,  snow:false, desert:false, financialHub:false, tourism:false, monarchy:false, founded1500:true,  muslim:true,  christian:false, buddhist:false },
    { city:"Lima",         country:"Peru",         continent:"South America", hemisphere:"S", coastal:true,  landlocked:false, island:false, river:false, capital:true,  eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"Spanish",    tropical:false, snow:false, desert:true,  financialHub:false, tourism:true,  monarchy:false, founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Bogotá",       country:"Colombia",     continent:"South America", hemisphere:"N", coastal:false, landlocked:true,  island:false, river:false, capital:true,  eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"Spanish",    tropical:false, snow:false, desert:false, financialHub:false, tourism:false, monarchy:false, founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Johannesburg", country:"South Africa", continent:"Africa",        hemisphere:"S", coastal:false, landlocked:true,  island:false, river:false, capital:false, eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"English",    tropical:false, snow:false, desert:false, financialHub:true,  tourism:true,  monarchy:false, founded1500:false, muslim:false, christian:true,  buddhist:false },
    { city:"Amsterdam",    country:"Netherlands",  continent:"Europe",        hemisphere:"N", coastal:false, landlocked:true,  island:false, river:true,  capital:true,  eu:true,  us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"Dutch",      tropical:false, snow:true,  desert:false, financialHub:true,  tourism:true,  monarchy:true,  founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Vienna",       country:"Austria",      continent:"Europe",        hemisphere:"N", coastal:false, landlocked:true,  island:false, river:true,  capital:true,  eu:true,  us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"German",     tropical:false, snow:true,  desert:false, financialHub:true,  tourism:true,  monarchy:false, founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Singapore",    country:"Singapore",    continent:"Asia",          hemisphere:"N", coastal:true,  landlocked:false, island:true,  river:false, capital:true,  eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"English",    tropical:true,  snow:false, desert:false, financialHub:true,  tourism:true,  monarchy:false, founded1500:false, muslim:false, christian:false, buddhist:false },
    { city:"Dubai",        country:"UAE",          continent:"Asia",          hemisphere:"N", coastal:true,  landlocked:false, island:false, river:false, capital:false, eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"Arabic",     tropical:false, snow:false, desert:true,  financialHub:true,  tourism:true,  monarchy:true,  founded1500:false, muslim:true,  christian:false, buddhist:false },
    { city:"Havana",       country:"Cuba",         continent:"North America", hemisphere:"N", coastal:true,  landlocked:false, island:true,  river:false, capital:true,  eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"Spanish",    tropical:true,  snow:false, desert:false, financialHub:false, tourism:true,  monarchy:false, founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Accra",        country:"Ghana",        continent:"Africa",        hemisphere:"N", coastal:true,  landlocked:false, island:false, river:false, capital:true,  eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"English",    tropical:true,  snow:false, desert:false, financialHub:false, tourism:false, monarchy:false, founded1500:false, muslim:false, christian:true,  buddhist:false },
    { city:"Oslo",         country:"Norway",       continent:"Europe",        hemisphere:"N", coastal:true,  landlocked:false, island:false, river:false, capital:true,  eu:false, us:false, g7:false, pop100m:false, metro2m:false, metro10m:false, lang:"Norwegian",  tropical:false, snow:true,  desert:false, financialHub:true,  tourism:true,  monarchy:true,  founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Addis Ababa",  country:"Ethiopia",     continent:"Africa",        hemisphere:"N", coastal:false, landlocked:true,  island:false, river:false, capital:true,  eu:false, us:false, g7:false, pop100m:true,  metro2m:true,  metro10m:false, lang:"Amharic",    tropical:false, snow:false, desert:false, financialHub:false, tourism:false, monarchy:false, founded1500:false, muslim:false, christian:true,  buddhist:false },
    { city:"Tehran",       country:"Iran",         continent:"Asia",          hemisphere:"N", coastal:false, landlocked:true,  island:false, river:false, capital:true,  eu:false, us:false, g7:false, pop100m:true,  metro2m:true,  metro10m:true,  lang:"Persian",    tropical:false, snow:true,  desert:true,  financialHub:false, tourism:false, monarchy:false, founded1500:true,  muslim:true,  christian:false, buddhist:false },
    { city:"Kyiv",         country:"Ukraine",      continent:"Europe",        hemisphere:"N", coastal:false, landlocked:true,  island:false, river:true,  capital:true,  eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"Ukrainian",  tropical:false, snow:true,  desert:false, financialHub:false, tourism:false, monarchy:false, founded1500:true,  muslim:false, christian:true,  buddhist:false },
    { city:"Kabul",        country:"Afghanistan",  continent:"Asia",          hemisphere:"N", coastal:false, landlocked:true,  island:false, river:false, capital:true,  eu:false, us:false, g7:false, pop100m:false, metro2m:true,  metro10m:false, lang:"Dari",       tropical:false, snow:true,  desert:true,  financialHub:false, tourism:false, monarchy:false, founded1500:true,  muslim:true,  christian:false, buddhist:false },
    { city:"Chicago",      country:"USA",          continent:"North America", hemisphere:"N", coastal:false, landlocked:true,  island:false, river:false, capital:false, eu:false, us:true,  g7:true,  pop100m:true,  metro2m:true,  metro10m:false, lang:"English",    tropical:false, snow:true,  desert:false, financialHub:true,  tourism:true,  monarchy:false, founded1500:false, muslim:false, christian:true,  buddhist:false },
  ];

  // ── DOM elements ───────────────────────────────────────────────────
  const els = {
    btnReset:$("btnReset"), btnBackHome:$("btnBackHome"),
    btnStartLocal:$("btnStartLocal"), btnCreateRoom:$("btnCreateRoom"),
    btnJoinRoom:$("btnJoinRoom"), btnStartCpu:$("btnStartCpu"),
    cpuDifficulty:$("cpuDifficulty"),
    modeLabel:$("modeLabel"), setupHint:$("setupHint"),
    roomLabel:$("roomLabel"), roleLabel:$("roleLabel"),
    roomLabel2:$("roomLabel2"), onlineStatus:$("onlineStatus"),
    p1Name:$("p1Name"), p2Name:$("p2Name"),
    btnSetP1:$("btnSetP1"), btnSetP2:$("btnSetP2"),
    p1CityStatus:$("p1CityStatus"), p2CityStatus:$("p2CityStatus"),
    btnBeginGame:$("btnBeginGame"),
    turnLabel:$("turnLabel"), phaseLabel:$("phaseLabel"),
    askArea:$("askArea"), answerArea:$("answerArea"),
    guessArea:$("guessArea"), endArea:$("endArea"),
    freeQuestionBlock:$("freeQuestionBlock"),
    questionInput:$("questionInput"),
    btnAsk:$("btnAsk"), btnQuick:$("btnQuick"), btnGuess:$("btnGuess"),
    cpuQuestionBlock:$("cpuQuestionBlock"),
    cpuQuestionSelect:$("cpuQuestionSelect"),
    btnCpuAsk:$("btnCpuAsk"), btnQuickCpu:$("btnQuickCpu"), btnGuessCpu:$("btnGuessCpu"),
    questionDisplay:$("questionDisplay"),
    btnYes:$("btnYes"), btnNo:$("btnNo"),
    guessInput:$("guessInput"),
    btnSubmitGuess:$("btnSubmitGuess"), btnCancelGuess:$("btnCancelGuess"),
    endMessage:$("endMessage"), btnPlayAgain:$("btnPlayAgain"),
    btnClearLog:$("btnClearLog"), log:$("log"),
    modal:$("modal"), quickModal:$("quickModal"),
    secretCityInput:$("secretCityInput"),
    cpuCityPicker:$("cpuCityPicker"), cpuCitySelect:$("cpuCitySelect"),
    btnSaveCity:$("btnSaveCity"), btnCancelCity:$("btnCancelCity"),
    btnCloseModal:$("btnCloseModal"),
    modalTitle:$("modalTitle"), modalHint:$("modalHint"),
    quickList:$("quickList"), btnCloseQuick:$("btnCloseQuick"),
  };

  // ── Helpers ────────────────────────────────────────────────────────
  function logLine(text) {
    if (!els.log) return;
    const div = document.createElement("div");
    div.className = "logline";
    div.textContent = text;
    els.log.prepend(div);
  }
  function clearLogUI() { if (els.log) els.log.innerHTML = ""; }
  function normalizeCity(s) {
    return (s || "").toLowerCase().trim().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ");
  }
  function randomCode() {
    return Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  // ── Build UI lists ─────────────────────────────────────────────────
  function buildQuickList() {
    els.quickList.innerHTML = "";
    QUESTIONS.forEach((q) => {
      const item = document.createElement("div");
      item.className = "quickitem";
      item.textContent = q;
      item.addEventListener("click", () => {
        if (activeMode === "cpu") els.cpuQuestionSelect.value = q;
        else els.questionInput.value = q;
        showModal("quickModal", false);
      });
      els.quickList.appendChild(item);
    });
  }

  function buildCpuQuestionSelect() {
    els.cpuQuestionSelect.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = ""; opt0.textContent = "Select a question…";
    els.cpuQuestionSelect.appendChild(opt0);
    QUESTIONS.forEach((q) => {
      const opt = document.createElement("option");
      opt.value = q; opt.textContent = q;
      els.cpuQuestionSelect.appendChild(opt);
    });
  }

  function buildCpuCitySelect() {
    els.cpuCitySelect.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = ""; opt0.textContent = "Pick a city…";
    els.cpuCitySelect.appendChild(opt0);
    CITY_DB.slice().sort((a, b) => a.city.localeCompare(b.city)).forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.city; opt.textContent = `${c.city} (${c.country})`;
      els.cpuCitySelect.appendChild(opt);
    });
  }

  // ── State ──────────────────────────────────────────────────────────
  let activeMode = null; // "local" | "online" | "cpu"
  let localEditing = null;

  const local = {
    p1: { name: "Player 1", city: "" },
    p2: { name: "Player 2", city: "" },
    turn: "P1", phase: "setup", currentQuestion: "", winner: null,
  };

  const cpu = {
    difficulty: "medium",
    playerCity: null,   // city obj from CITY_DB — human's secret city
    cpuCity: null,      // city obj from CITY_DB — CPU's secret city
    turn: "P1",         // P1 = human, P2 = CPU
    phase: "setup",
    currentQuestion: "",
    winner: null,
    candidates: [],     // cities CPU still considers for the human's city
    askedQs: [],        // questions CPU has already asked
  };

  // ── Online (Firebase Realtime DB) ──────────────────────────────────
  // Stored at /games/{roomCode}: { p1city, p2city, p1name, p2name,
  //   turn, phase, currentQuestion, winner, log:[] }
  const online = {
    roomCode: null,
    role: null,       // "P1" (host) or "P2" (guest)
    ref: null,
    unsubscribe: null,
    state: {},
  };

  function dbAvailable() {
    return typeof db !== "undefined" && db && typeof db.ref === "function";
  }
  function onlineSetStatus(text) {
    els.onlineStatus.textContent = "Firebase: " + text;
  }
  function onlinePush(patch) {
    if (!online.ref) return;
    online.ref.update(patch);
  }
  function onlineLogLine(text) {
    if (!online.ref) return;
    online.ref.child("log").transaction((cur) => {
      const arr = Array.isArray(cur) ? cur : [];
      arr.push(text);
      if (arr.length > 80) arr.splice(0, arr.length - 80);
      return arr;
    });
  }

  function onlineSubscribe(code) {
    if (!dbAvailable()) return;
    if (online.unsubscribe) { online.ref.off("value", online.unsubscribe); }
    online.ref = db.ref("games/" + code);
    online.unsubscribe = online.ref.on("value", (snap) => {
      const data = snap.val();
      if (!data) return;
      online.state = data;
      onlineApplyState(data);
    });
  }

  function onlineApplyState(data) {
    if (!data) return;
    if (data.p1name) els.p1Name.value = data.p1name;
    if (data.p2name) els.p2Name.value = data.p2name;
    els.roomLabel.textContent  = online.roomCode || "—";
    els.roleLabel.textContent  = online.role || "—";
    els.roomLabel2.textContent = online.roomCode || "—";

    const p1set = !!(data.p1city);
    const p2set = !!(data.p2city);
    els.p1CityStatus.textContent = p1set ? "set ✓" : "not set";
    els.p2CityStatus.textContent = p2set ? "set ✓" : "not set";
    els.btnBeginGame.disabled = !(p1set && p2set);

    if (data.phase === "setup") { syncSetupUI(); return; }

    // ── Game is live ──
    showScreen("game");

    // Mirror into local state so syncGameUI works
    local.turn            = data.turn || "P1";
    local.phase           = data.phase || "ask";
    local.currentQuestion = data.currentQuestion || "";
    local.winner          = data.winner || null;

    // Rebuild log
    if (Array.isArray(data.log)) {
      clearLogUI();
      [...data.log].reverse().forEach(line => logLine(line));
    }

    const p1Name = els.p1Name.value || "Player 1";
    const p2Name = els.p2Name.value || "Player 2";
    els.turnLabel.textContent = (local.turn === "P1" ? p1Name : p2Name) + "'s turn";
    els.phaseLabel.textContent = local.phase;

    els.askArea.classList.toggle("hidden",    local.phase !== "ask");
    els.answerArea.classList.toggle("hidden", local.phase !== "answer");
    els.guessArea.classList.toggle("hidden",  local.phase !== "guess");
    els.endArea.classList.toggle("hidden",    local.phase !== "end");

    // Free-text block always shown in online mode
    els.freeQuestionBlock.classList.remove("hidden");
    els.cpuQuestionBlock.classList.add("hidden");

    const myTurn     = (local.turn === online.role);
    const iAmAsking  = myTurn && local.phase === "ask";
    const iAmGuessing = myTurn && local.phase === "guess";
    // I answer when it's NOT my turn and there's a pending question
    const iAmAnswering = !myTurn && local.phase === "answer";

    els.btnAsk.disabled   = !iAmAsking;
    els.btnQuick.disabled = !iAmAsking;
    els.btnGuess.disabled = !iAmAsking;
    els.btnYes.disabled   = !iAmAnswering;
    els.btnNo.disabled    = !iAmAnswering;
    els.btnSubmitGuess.disabled = !iAmGuessing;
    els.btnCancelGuess.disabled = !iAmGuessing;

    els.questionDisplay.textContent = local.currentQuestion || "—";

    if (local.phase === "end" && local.winner) {
      const winnerName = local.winner === "P1" ? p1Name : p2Name;
      const secretCity = online.role === "P1" ? (data.p2city || "?") : (data.p1city || "?");
      els.endMessage.textContent = `🎉 ${winnerName} wins! The secret city was: ${secretCity}`;
    }
  }

  function onlineCreateRoom() {
    if (!dbAvailable()) {
      onlineSetStatus("not connected — check firebase.js");
      return;
    }
    const code = randomCode();
    online.roomCode = code;
    online.role = "P1";
    activeMode = "online";
    onlineSetStatus("hosting " + code);

    db.ref("games/" + code).set({
      phase: "setup", turn: "P1", currentQuestion: "", winner: null,
      p1city: "", p2city: "",
      p1name: (els.p1Name.value || "Player 1"),
      p2name: "Player 2",
      log: [],
    });

    onlineSubscribe(code);
    showScreen("setup");
    syncSetupUI();
    logLine("Room created: " + code + " — share this code with your opponent.");
  }

  function onlineJoinRoom() {
    if (!dbAvailable()) {
      onlineSetStatus("not connected — check firebase.js");
      return;
    }
    const code = prompt("Enter room code:");
    if (!code) return;
    const codeUpper = code.trim().toUpperCase();

    db.ref("games/" + codeUpper).once("value", (snap) => {
      if (!snap.val()) { alert("Room not found: " + codeUpper); return; }
      online.roomCode = codeUpper;
      online.role = "P2";
      activeMode = "online";
      onlineSetStatus("joined " + codeUpper);
      db.ref("games/" + codeUpper).update({ p2name: els.p2Name.value || "Player 2" });
      onlineSubscribe(codeUpper);
      showScreen("setup");
      syncSetupUI();
    });
  }

  // ── Setup UI sync ──────────────────────────────────────────────────
  function syncSetupUI() {
    if (activeMode === "cpu") {
      els.modeLabel.textContent = "CPU";
      els.setupHint.textContent = "Pick your name and choose your city from the list. CPU picks a secret city too.";
      els.p2Name.value = "CPU"; els.p2Name.disabled = true;
      els.btnSetP2.disabled = true;
      els.p1Name.disabled = false; els.btnSetP1.disabled = false;
      els.btnBeginGame.disabled = !(cpu.playerCity && cpu.cpuCity);
      els.p1CityStatus.textContent = cpu.playerCity ? "set ✓" : "not set";
      els.p2CityStatus.textContent = cpu.cpuCity    ? "set ✓" : "not set";
      return;
    }
    if (activeMode === "local") {
      els.modeLabel.textContent = "Local";
      els.setupHint.textContent = "Pass-and-play. Hand the phone over when setting cities.";
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
      els.roomLabel2.textContent = online.roomCode || "—";
      els.setupHint.textContent = online.role === "P1"
        ? `You're the host. Room code: ${online.roomCode} — share it with your opponent, then both set your cities.`
        : `You joined room ${online.roomCode}. Set your city and wait for host to begin.`;
      els.btnSetP1.disabled = (online.role !== "P1");
      els.btnSetP2.disabled = (online.role !== "P2");
      els.p1Name.disabled = (online.role !== "P1");
      els.p2Name.disabled = (online.role !== "P2");
      return;
    }
  }

  // ── Game UI sync (local + cpu only; online uses onlineApplyState) ──
  function syncGameUI() {
    const turn  = activeMode === "cpu" ? cpu.turn  : local.turn;
    const phase = activeMode === "cpu" ? cpu.phase : local.phase;
    const p1Name = els.p1Name.value || "Player 1";
    const p2Name = activeMode === "cpu" ? "CPU" : (els.p2Name.value || "Player 2");

    els.turnLabel.textContent  = (turn === "P1" ? p1Name : p2Name) + "'s turn";
    els.phaseLabel.textContent = phase;

    els.askArea.classList.toggle("hidden",    phase !== "ask");
    els.answerArea.classList.toggle("hidden", phase !== "answer");
    els.guessArea.classList.toggle("hidden",  phase !== "guess");
    els.endArea.classList.toggle("hidden",    phase !== "end");

    els.freeQuestionBlock.classList.toggle("hidden", activeMode === "cpu");
    els.cpuQuestionBlock.classList.toggle("hidden",  activeMode !== "cpu");

    if (activeMode === "cpu") {
      const humanTurn = cpu.turn === "P1";
      els.btnCpuAsk.disabled   = !(humanTurn && phase === "ask");
      els.btnQuickCpu.disabled = !(humanTurn && phase === "ask");
      els.btnGuessCpu.disabled = !(humanTurn && phase === "ask");
      // Yes/No only active when CPU has asked and human must answer
      els.btnYes.disabled = !(phase === "answer" && cpu.turn === "P2");
      els.btnNo.disabled  = !(phase === "answer" && cpu.turn === "P2");
    } else {
      els.btnAsk.disabled   = !(phase === "ask");
      els.btnQuick.disabled = !(phase === "ask");
      els.btnGuess.disabled = !(phase === "ask");
      els.btnYes.disabled   = !(phase === "answer");
      els.btnNo.disabled    = !(phase === "answer");
    }

    els.questionDisplay.textContent =
      (activeMode === "cpu" ? cpu.currentQuestion : local.currentQuestion) || "—";

    if (phase === "end") {
      const winner = activeMode === "cpu" ? cpu.winner : local.winner;
      if (winner) {
        const winnerName = winner === "P1" ? p1Name : p2Name;
        const secretCity = activeMode === "cpu"
          ? (winner === "P1" ? cpu.cpuCity?.city : cpu.playerCity?.city)
          : (winner === "P1" ? local.p2.city : local.p1.city);
        els.endMessage.textContent = `🎉 ${winnerName} wins! The secret city was: ${secretCity}`;
      } else {
        els.endMessage.textContent = "Game over!";
      }
    }
  }

  // ── CPU answer engine ──────────────────────────────────────────────
  function cityObjByName(name) {
    return CITY_DB.find(c => normalizeCity(c.city) === normalizeCity(name)) || null;
  }

  function cpuAnswerQ(q, cityObj) {
    if (!cityObj) return null;
    const t = cityObj, qq = q.toLowerCase();
    if (qq.includes("in europe"))            return t.continent === "Europe";
    if (qq.includes("in asia"))              return t.continent === "Asia";
    if (qq.includes("in africa"))            return t.continent === "Africa";
    if (qq.includes("in north america"))     return t.continent === "North America";
    if (qq.includes("in south america"))     return t.continent === "South America";
    if (qq.includes("in oceania"))           return t.continent === "Oceania";
    if (qq.includes("northern hemisphere"))  return t.hemisphere === "N";
    if (qq.includes("southern hemisphere"))  return t.hemisphere === "S";
    if (qq.includes("coastal"))              return !!t.coastal;
    if (qq.includes("landlocked"))           return !!t.landlocked;
    if (qq.includes("on an island"))         return !!t.island;
    if (qq.includes("on a major river"))     return !!t.river;
    if (qq.includes("national capital"))     return !!t.capital;
    if (qq.includes("in the eu"))            return !!t.eu;
    if (qq.includes("in the u.s."))          return !!t.us;
    if (qq.includes("g7"))                   return !!t.g7;
    if (qq.includes("over 100m"))            return !!t.pop100m;
    if (qq.includes("over 2m"))              return !!t.metro2m;
    if (qq.includes("over 10m"))             return !!t.metro10m;
    if (qq.includes("speak spanish"))        return t.lang.toLowerCase().includes("spanish");
    if (qq.includes("speak english"))        return t.lang.toLowerCase().includes("english");
    if (qq.includes("speak french"))         return t.lang.toLowerCase().includes("french");
    if (qq.includes("speak arabic"))         return t.lang.toLowerCase().includes("arabic");
    if (qq.includes("speak portuguese"))     return t.lang.toLowerCase().includes("portuguese");
    if (qq.includes("speak mandarin"))       return t.lang.toLowerCase().includes("mandarin");
    if (qq.includes("tropical"))             return !!t.tropical;
    if (qq.includes("snow"))                 return !!t.snow;
    if (qq.includes("desert"))               return !!t.desert;
    if (qq.includes("financial hub"))        return !!t.financialHub;
    if (qq.includes("tourism"))              return !!t.tourism;
    if (qq.includes("monarchy"))             return !!t.monarchy;
    if (qq.includes("founded before 1500"))  return !!t.founded1500;
    if (qq.includes("muslim country"))       return !!t.muslim;
    if (qq.includes("christian country"))    return !!t.christian;
    if (qq.includes("buddhist country"))     return !!t.buddhist;
    return null;
  }

  function cpuEliminate(q, ans) {
    cpu.candidates = cpu.candidates.filter(c => {
      const expected = cpuAnswerQ(q, c);
      if (expected === null) return true; // unknown: keep
      return expected === (ans === "Yes");
    });
  }

  function cpuPickQ() {
    const unused = QUESTIONS.filter(q => !cpu.askedQs.includes(q));
    const pool = unused.length ? unused : QUESTIONS;
    if (cpu.difficulty === "easy") return pool[Math.floor(Math.random() * pool.length)];
    if (cpu.difficulty === "medium") {
      const pref = pool.filter(q => /europe|asia|africa|north america|south america|oceania|hemisphere/i.test(q));
      const src = pref.length ? pref : pool;
      return src[Math.floor(Math.random() * src.length)];
    }
    // Hard: max information gain — pick question that splits candidates most evenly
    let best = pool[0], bestScore = Infinity;
    for (const q of pool) {
      let yes = 0;
      for (const c of cpu.candidates) if (cpuAnswerQ(q, c) === true) yes++;
      const score = Math.abs(yes - (cpu.candidates.length - yes));
      if (score < bestScore) { bestScore = score; best = q; }
    }
    return best;
  }

  // ── CPU game flow ──────────────────────────────────────────────────
  function startCpuGame() {
    cpu.turn = "P1"; cpu.phase = "ask";
    cpu.currentQuestion = ""; cpu.winner = null;
    cpu.candidates = CITY_DB.slice(); cpu.askedQs = [];
    clearLogUI();
    logLine("Game started — you go first! 🎯");
    showScreen("game"); syncGameUI();
  }

  // Human asks → CPU answers → CPU immediately asks back
  function cpuAsk() {
    const q = els.cpuQuestionSelect.value;
    if (!q) { logLine("Pick a question first."); return; }

    logLine(`You asked: ${q}`);
    const ans = cpuAnswerQ(q, cpu.cpuCity);
    if (ans === null) { logLine("CPU: I can't answer that one. Pick another."); return; }

    logLine(`CPU answered: ${ans ? "Yes ✓" : "No ✗"}`);
    els.cpuQuestionSelect.value = "";
    cpu.currentQuestion = "";

    // ── CPU's turn to ask back ──
    cpu.turn = "P2";
    cpu.phase = "ask"; // brief interim; will be set to "answer" in setTimeout
    syncGameUI();      // show "CPU's turn" while we wait

    window.setTimeout(() => {
      // Check if CPU is confident enough to guess
      if (cpu.candidates.length === 1) {
        cpuGuessNow(); return;
      }
      const cpuQ = cpuPickQ();
      cpu.askedQs.push(cpuQ);
      cpu.currentQuestion = cpuQ;
      logLine(`CPU asks: ${cpuQ}`);
      cpu.phase = "answer"; // human must now answer
      // turn stays "P2" so Yes/No buttons enable correctly
      syncGameUI();
    }, 400);
  }

  // Human answers CPU's question
  function cpuHumanAnswers(ans) {
    const q = cpu.currentQuestion;
    if (!q) return;
    logLine(`You answered: ${ans}`);
    cpuEliminate(q, ans);
    const remaining = cpu.candidates.length;
    logLine(`CPU has ${remaining} city${remaining === 1 ? "" : "/cities"} left.`);
    cpu.currentQuestion = "";
    // Turn passes back to human
    cpu.turn = "P1";
    cpu.phase = "ask";
    syncGameUI();
  }

  function cpuGuessNow() {
    const guess = cpu.candidates[0].city;
    logLine(`CPU guesses: "${guess}"!`);
    const ok = normalizeCity(guess) === normalizeCity(cpu.playerCity?.city || "");
    window.setTimeout(() => {
      if (ok) {
        cpu.phase = "end"; cpu.winner = "P2";
        logLine(`CPU was right — it was ${guess}! CPU wins 🤖`);
      } else {
        logLine(`CPU guessed wrong (${guess}). Back to you!`);
        cpu.candidates = CITY_DB.slice(); // reset candidates
        cpu.turn = "P1"; cpu.phase = "ask";
      }
      syncGameUI();
    }, 400);
  }

  function cpuOpenGuess()   { cpu.phase = "guess"; syncGameUI(); }
  function cpuCancelGuess() { cpu.phase = "ask";   syncGameUI(); }

  function cpuSubmitGuess() {
    const guess = (els.guessInput.value || "").trim();
    if (!guess) return;
    els.guessInput.value = "";
    const ok = normalizeCity(guess) === normalizeCity(cpu.cpuCity?.city || "");
    if (ok) {
      cpu.phase = "end"; cpu.winner = "P1";
      logLine(`You guessed "${guess}" — CORRECT! 🎉`);
      syncGameUI();
    } else {
      logLine(`You guessed "${guess}" — wrong. CPU's turn!`);
      cpu.turn = "P2"; cpu.phase = "ask";
      window.setTimeout(() => {
        if (cpu.candidates.length === 1) { cpuGuessNow(); return; }
        const cpuQ = cpuPickQ();
        cpu.askedQs.push(cpuQ);
        cpu.currentQuestion = cpuQ;
        logLine(`CPU asks: ${cpuQ}`);
        cpu.phase = "answer";
        syncGameUI();
      }, 400);
    }
  }

  // ── Local mode ─────────────────────────────────────────────────────
  function localBegin() {
    local.p1.name = (els.p1Name.value || "Player 1").trim().slice(0, 18);
    local.p2.name = (els.p2Name.value || "Player 2").trim().slice(0, 18);
    local.turn = "P1"; local.phase = "ask";
    local.currentQuestion = ""; local.winner = null;
    clearLogUI(); logLine("Game started!");
    showScreen("game"); syncGameUI();
  }

  function localAsk() {
    const q = (els.questionInput.value || "").trim(); if (!q) return;
    local.currentQuestion = q; local.phase = "answer";
    const askerName = local.turn === "P1" ? (els.p1Name.value||"P1") : (els.p2Name.value||"P2");
    logLine(`${askerName} asked: ${q}`);
    els.questionInput.value = "";
    syncGameUI();
  }

  function localAnswer(ans) {
    const asker    = local.turn;
    const answerer = asker === "P1" ? "P2" : "P1";
    const aName    = answerer === "P1" ? (els.p1Name.value||"P1") : (els.p2Name.value||"P2");
    logLine(`${aName} answered: ${ans}`);
    local.currentQuestion = "";
    local.turn  = answerer; // answerer becomes next asker
    local.phase = "ask";
    syncGameUI();
  }

  function localOpenGuess()   { local.phase = "guess"; syncGameUI(); }
  function localCancelGuess() { local.phase = "ask";   syncGameUI(); }

  function localSubmitGuess() {
    const guess = (els.guessInput.value || "").trim(); if (!guess) return;
    const opponent     = local.turn === "P1" ? "P2" : "P1";
    const opponentCity = opponent === "P1" ? local.p1.city : local.p2.city;
    const ok = normalizeCity(guess) === normalizeCity(opponentCity);
    const gName = local.turn === "P1" ? (els.p1Name.value||"P1") : (els.p2Name.value||"P2");
    if (ok) {
      local.phase = "end"; local.winner = local.turn;
      logLine(`${gName} guessed "${guess}" — CORRECT! 🎉`);
    } else {
      logLine(`${gName} guessed "${guess}" — wrong.`);
      local.turn = opponent; local.phase = "ask";
    }
    els.guessInput.value = ""; syncGameUI();
  }

  // ── Online ask/answer/guess ────────────────────────────────────────
  function onlineAsk() {
    const q = (els.questionInput.value || "").trim(); if (!q) return;
    if (local.turn !== online.role) return;
    const askerName = online.role === "P1" ? (els.p1Name.value||"P1") : (els.p2Name.value||"P2");
    onlinePush({ currentQuestion: q, phase: "answer" });
    onlineLogLine(`${askerName} asked: ${q}`);
    els.questionInput.value = "";
  }

  function onlineAnswer(ans) {
    if (local.phase !== "answer") return;
    if (local.turn === online.role) return; // you don't answer your own question
    const aName = online.role === "P1" ? (els.p1Name.value||"P1") : (els.p2Name.value||"P2");
    const nextTurn = local.turn === "P1" ? "P2" : "P1";
    onlinePush({ phase: "ask", turn: nextTurn, currentQuestion: "" });
    onlineLogLine(`${aName} answered: ${ans}`);
  }

  function onlineOpenGuess()   { if (local.turn === online.role) onlinePush({ phase: "guess" }); }
  function onlineCancelGuess() { onlinePush({ phase: "ask" }); }

  function onlineSubmitGuess() {
    const guess = (els.guessInput.value || "").trim(); if (!guess) return;
    if (local.turn !== online.role) return;
    online.ref.once("value", (snap) => {
      const data = snap.val() || {};
      const opponentRole = online.role === "P1" ? "P2" : "P1";
      const opponentCity = opponentRole === "P1" ? data.p1city : data.p2city;
      const ok = normalizeCity(guess) === normalizeCity(opponentCity || "");
      const gName = online.role === "P1" ? (els.p1Name.value||"P1") : (els.p2Name.value||"P2");
      if (ok) {
        onlinePush({ phase: "end", winner: online.role });
        onlineLogLine(`${gName} guessed "${guess}" — CORRECT! 🎉`);
      } else {
        onlinePush({ phase: "ask", turn: opponentRole });
        onlineLogLine(`${gName} guessed "${guess}" — wrong.`);
      }
      els.guessInput.value = "";
    });
  }

  // ── City modal ─────────────────────────────────────────────────────
  function openCityModal(forRole, hintText) {
    els.modalTitle.textContent = forRole === "P1" ? "Player 1: secret city" : "Player 2: secret city";
    els.modalHint.textContent  = hintText || "Make sure the other player isn't looking 👀";
    els.secretCityInput.value  = "";
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
  function closeCityModal() { showModal("modal", false); localEditing = null; }

  // ── Reset ──────────────────────────────────────────────────────────
  function resetAll() {
    if (online.ref && online.unsubscribe) online.ref.off("value", online.unsubscribe);
    online.roomCode = null; online.role = null;
    online.ref = null; online.unsubscribe = null; online.state = {};

    showScreen("home"); clearLogUI();
    els.questionInput.value = ""; els.guessInput.value = "";
    els.questionDisplay.textContent = "—"; els.endMessage.textContent = "—";
    activeMode = null; localEditing = null;

    local.p1 = { name: "Player 1", city: "" };
    local.p2 = { name: "Player 2", city: "" };
    local.turn = "P1"; local.phase = "setup"; local.currentQuestion = ""; local.winner = null;

    cpu.difficulty = "medium"; cpu.playerCity = null; cpu.cpuCity = null;
    cpu.turn = "P1"; cpu.phase = "setup"; cpu.currentQuestion = ""; cpu.winner = null;
    cpu.candidates = []; cpu.askedQs = [];

    els.p2Name.disabled = false; els.btnSetP2.disabled = false;
    els.btnSetP1.style.display = ""; els.btnSetP2.style.display = "";
    els.p1Name.value = "Player 1"; els.p2Name.value = "Player 2";
    els.roomLabel.textContent = "—"; els.roleLabel.textContent = "—";
    els.onlineStatus.textContent = "Firebase: —";
    els.cpuDifficulty.value = "medium";
  }

  // ── Wire events ────────────────────────────────────────────────────
  els.btnReset.addEventListener("click", resetAll);
  els.btnBackHome.addEventListener("click", resetAll);

  els.btnStartLocal.addEventListener("click", () => {
    activeMode = "local"; showScreen("setup"); syncSetupUI();
  });
  els.btnStartCpu.addEventListener("click", () => {
    activeMode = "cpu";
    cpu.difficulty = els.cpuDifficulty.value || "medium";
    cpu.playerCity = null;
    cpu.cpuCity = CITY_DB[Math.floor(Math.random() * CITY_DB.length)];
    cpu.candidates = CITY_DB.slice(); cpu.askedQs = [];
    els.p2Name.value = "CPU";
    showScreen("setup"); syncSetupUI();
  });

  els.btnCreateRoom.addEventListener("click", onlineCreateRoom);
  els.btnJoinRoom.addEventListener("click",   onlineJoinRoom);

  els.p1Name.addEventListener("blur", () => {
    if (activeMode === "local")  local.p1.name = (els.p1Name.value||"Player 1").trim().slice(0,18);
    if (activeMode === "online" && online.ref) online.ref.update({ p1name: els.p1Name.value });
  });
  els.p2Name.addEventListener("blur", () => {
    if (activeMode === "local")  local.p2.name = (els.p2Name.value||"Player 2").trim().slice(0,18);
    if (activeMode === "online" && online.ref) online.ref.update({ p2name: els.p2Name.value });
  });

  els.btnSetP1.addEventListener("click", () => {
    if (activeMode === "local")                          return openCityModal("P1", "Hand the phone to Player 1 👀");
    if (activeMode === "cpu")                            return openCityModal("P1", "Pick your city from the list.");
    if (activeMode === "online" && online.role === "P1") return openCityModal("P1", "Your secret city — don't show your opponent!");
  });
  els.btnSetP2.addEventListener("click", () => {
    if (activeMode === "local")                          return openCityModal("P2", "Hand the phone to Player 2 👀");
    if (activeMode === "online" && online.role === "P2") return openCityModal("P2", "Your secret city — don't show your opponent!");
  });

  els.btnSaveCity.addEventListener("click", () => {
    if (activeMode === "cpu") {
      const picked = els.cpuCitySelect.value; if (!picked) return;
      cpu.playerCity = cityObjByName(picked);
      closeCityModal(); syncSetupUI(); return;
    }
    const city = (els.secretCityInput.value || "").trim(); if (!city) return;
    if (activeMode === "local") {
      if (localEditing === "P1") local.p1.city = city;
      if (localEditing === "P2") local.p2.city = city;
      closeCityModal(); syncSetupUI(); return;
    }
    if (activeMode === "online" && online.ref) {
      const field = online.role === "P1" ? "p1city" : "p2city";
      online.ref.update({ [field]: city });
      closeCityModal(); return;
    }
  });

  els.secretCityInput.addEventListener("keydown", (e) => { if (e.key === "Enter") els.btnSaveCity.click(); });
  els.btnCancelCity.addEventListener("click", closeCityModal);
  els.btnCloseModal.addEventListener("click", closeCityModal);

  els.btnBeginGame.addEventListener("click", () => {
    if (activeMode === "local") return localBegin();
    if (activeMode === "cpu") {
      if (!cpu.playerCity || !cpu.cpuCity) { logLine("Pick your city first!"); return; }
      startCpuGame();
    }
    if (activeMode === "online") {
      // Only P1 (host) can begin
      if (online.role !== "P1") return;
      onlinePush({ phase: "ask", turn: "P1" });
    }
  });

  els.btnQuick.addEventListener("click",      () => showModal("quickModal", true));
  els.btnQuickCpu.addEventListener("click",   () => showModal("quickModal", true));
  els.btnCloseQuick.addEventListener("click", () => showModal("quickModal", false));

  els.btnAsk.addEventListener("click", () => {
    if (activeMode === "local")  return localAsk();
    if (activeMode === "online") return onlineAsk();
  });
  els.questionInput.addEventListener("keydown", (e) => { if (e.key === "Enter") els.btnAsk.click(); });

  els.btnCpuAsk.addEventListener("click", () => { if (activeMode === "cpu") cpuAsk(); });

  els.btnYes.addEventListener("click", () => {
    if (activeMode === "local")  return localAnswer("Yes");
    if (activeMode === "cpu")    return cpuHumanAnswers("Yes");
    if (activeMode === "online") return onlineAnswer("Yes");
  });
  els.btnNo.addEventListener("click", () => {
    if (activeMode === "local")  return localAnswer("No");
    if (activeMode === "cpu")    return cpuHumanAnswers("No");
    if (activeMode === "online") return onlineAnswer("No");
  });

  els.btnGuess.addEventListener("click", () => {
    if (activeMode === "local")  return localOpenGuess();
    if (activeMode === "online") return onlineOpenGuess();
  });
  els.btnGuessCpu.addEventListener("click", () => { if (activeMode === "cpu") cpuOpenGuess(); });

  els.btnCancelGuess.addEventListener("click", () => {
    if (activeMode === "local")  return localCancelGuess();
    if (activeMode === "cpu")    return cpuCancelGuess();
    if (activeMode === "online") return onlineCancelGuess();
  });
  els.btnSubmitGuess.addEventListener("click", () => {
    if (activeMode === "local")  return localSubmitGuess();
    if (activeMode === "cpu")    return cpuSubmitGuess();
    if (activeMode === "online") return onlineSubmitGuess();
  });
  els.guessInput.addEventListener("keydown", (e) => { if (e.key === "Enter") els.btnSubmitGuess.click(); });

  els.btnPlayAgain.addEventListener("click", resetAll);
  els.btnClearLog.addEventListener("click", clearLogUI);

  // ── Boot ───────────────────────────────────────────────────────────
  buildQuickList();
  buildCpuQuestionSelect();
  buildCpuCitySelect();
  showScreen("home");

})();

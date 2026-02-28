// app.js — City Guess (Online Multiplayer + Local + Vs CPU)
// Works on GitHub Pages (no bundlers). Online uses Firebase RTDB via global `db` from firebase.js.

(() => {
  const $ = (id) => document.getElementById(id);

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

  function showModal(id, show) {
    const el = $(id);
    if (!el) return;
    el.classList.toggle("hidden", !show);
  }

  const QUICK = ["Is your city in Europe?", "Is your city in Asia?", "Is your city in Africa?", "Is your city in North America?", "Is your city in South America?", "Is your city in Oceania?", "Is your city in the Northern Hemisphere?", "Is your city in the Southern Hemisphere?", "Is your city in the Western Hemisphere?", "Is your city in the Eastern Hemisphere?", "Is your city coastal?", "Is your city a national capital?", "Is your city in the EU?", "Is your city on an island?", "Do most people speak English in your city?", "Do most people speak Spanish in your city?", "Do most people speak French in your city?", "Do most people speak German in your city?", "Do most people speak Italian in your city?", "Do most people speak Portuguese in your city?", "Does your city have over ~2M metro population?", "Does your city have over 10M people (mega city)?"];

  const els = {
    btnReset: $("btnReset"),
    btnBackHome: $("btnBackHome"),
    btnBackHome2: $("btnBackHome2"),
    btnStartLocal: $("btnStartLocal"),
    btnStartCPU: $("btnStartCPU"),
    cpuDifficulty: $("cpuDifficulty"),
    btnCreateRoom: $("btnCreateRoom"),
    btnJoinRoom: $("btnJoinRoom"),

    modeLabel: $("modeLabel"),
    setupMode: $("setupMode"),
    setupRoom: $("setupRoom"),
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

    modal: $("modal"),
    quickModal: $("quickModal"),
    secretCityInput: $("secretCityInput"),
    btnSaveCity: $("btnSaveCity"),
    btnCancelCity: $("btnCancelCity"),
    btnCloseModal: $("btnCloseModal"),
    modalTitle: $("modalTitle"),
    modalHint: $("modalHint"),
    cpuCityHint: $("cpuCityHint"),
    cityList: $("cityList"),

    quickList: $("quickList"),
    btnCloseQuick: $("btnCloseQuick"),
  };

  function setText(el, text) { if (el) el.textContent = text; }

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

  const CITY_DB = [
  { name: "London", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: false, island: false, lang: "english", pop: "mega" },
  { name: "Paris", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: true, island: false, lang: "french", pop: "mega" },
  { name: "Berlin", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: true, island: false, lang: "german", pop: "mega" },
  { name: "Madrid", continent: "europe", hemiNS: "north", hemiEW: "west", coastal: false, capital: true, eu: true, island: false, lang: "spanish", pop: "mega" },
  { name: "Rome", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: true, island: false, lang: "italian", pop: "mega" },
  { name: "Lisbon", continent: "europe", hemiNS: "north", hemiEW: "west", coastal: true, capital: true, eu: true, island: false, lang: "portuguese", pop: "big" },
  { name: "Dublin", continent: "europe", hemiNS: "north", hemiEW: "west", coastal: true, capital: true, eu: true, island: true, lang: "english", pop: "mid" },
  { name: "Manchester", continent: "europe", hemiNS: "north", hemiEW: "west", coastal: false, capital: false, eu: false, island: true, lang: "english", pop: "big" },
  { name: "Glasgow", continent: "europe", hemiNS: "north", hemiEW: "west", coastal: true, capital: false, eu: false, island: true, lang: "english", pop: "big" },
  { name: "Oslo", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: true, capital: true, eu: false, island: false, lang: "other", pop: "mid" },
  { name: "Stockholm", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: true, capital: true, eu: true, island: false, lang: "other", pop: "big" },
  { name: "Helsinki", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: true, capital: true, eu: true, island: false, lang: "other", pop: "mid" },
  { name: "Copenhagen", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: true, capital: true, eu: true, island: false, lang: "other", pop: "big" },
  { name: "Reykjavik", continent: "europe", hemiNS: "north", hemiEW: "west", coastal: true, capital: true, eu: false, island: true, lang: "other", pop: "small" },
  { name: "Amsterdam", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: true, capital: true, eu: true, island: false, lang: "other", pop: "big" },
  { name: "Brussels", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: true, island: false, lang: "other", pop: "big" },
  { name: "Vienna", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: true, island: false, lang: "german", pop: "big" },
  { name: "Prague", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: true, island: false, lang: "other", pop: "big" },
  { name: "Warsaw", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: true, island: false, lang: "other", pop: "big" },
  { name: "Budapest", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: true, island: false, lang: "other", pop: "big" },
  { name: "Athens", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: true, capital: true, eu: true, island: false, lang: "other", pop: "big" },
  { name: "Zurich", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: false, capital: false, eu: false, island: false, lang: "german", pop: "big" },
  { name: "Geneva", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: false, capital: false, eu: false, island: false, lang: "french", pop: "mid" },
  { name: "Barcelona", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: true, capital: false, eu: true, island: false, lang: "spanish", pop: "mega" },
  { name: "Porto", continent: "europe", hemiNS: "north", hemiEW: "west", coastal: true, capital: false, eu: true, island: false, lang: "portuguese", pop: "mid" },
  { name: "Nice", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: true, capital: false, eu: true, island: false, lang: "french", pop: "big" },
  { name: "Menton", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: true, capital: false, eu: true, island: false, lang: "french", pop: "small" },
  { name: "Marseille", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: true, capital: false, eu: true, island: false, lang: "french", pop: "mega" },
  { name: "Lyon", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: false, capital: false, eu: true, island: false, lang: "french", pop: "mega" },
  { name: "Tallinn", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: true, capital: true, eu: true, island: false, lang: "other", pop: "small" },
  { name: "Riga", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: true, capital: true, eu: true, island: false, lang: "other", pop: "small" },
  { name: "Vilnius", continent: "europe", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: true, island: false, lang: "other", pop: "small" },
  { name: "New York", continent: "north_america", hemiNS: "north", hemiEW: "west", coastal: true, capital: false, eu: false, island: false, lang: "english", pop: "mega" },
  { name: "Washington, DC", continent: "north_america", hemiNS: "north", hemiEW: "west", coastal: false, capital: true, eu: false, island: false, lang: "english", pop: "big" },
  { name: "Boston", continent: "north_america", hemiNS: "north", hemiEW: "west", coastal: true, capital: false, eu: false, island: false, lang: "english", pop: "big" },
  { name: "Chicago", continent: "north_america", hemiNS: "north", hemiEW: "west", coastal: false, capital: false, eu: false, island: false, lang: "english", pop: "mega" },
  { name: "Los Angeles", continent: "north_america", hemiNS: "north", hemiEW: "west", coastal: true, capital: false, eu: false, island: false, lang: "english", pop: "mega" },
  { name: "San Francisco", continent: "north_america", hemiNS: "north", hemiEW: "west", coastal: true, capital: false, eu: false, island: false, lang: "english", pop: "big" },
  { name: "Seattle", continent: "north_america", hemiNS: "north", hemiEW: "west", coastal: true, capital: false, eu: false, island: false, lang: "english", pop: "big" },
  { name: "Miami", continent: "north_america", hemiNS: "north", hemiEW: "west", coastal: true, capital: false, eu: false, island: false, lang: "english", pop: "big" },
  { name: "Toronto", continent: "north_america", hemiNS: "north", hemiEW: "west", coastal: false, capital: false, eu: false, island: false, lang: "english", pop: "mega" },
  { name: "Vancouver", continent: "north_america", hemiNS: "north", hemiEW: "west", coastal: true, capital: false, eu: false, island: false, lang: "english", pop: "big" },
  { name: "Ottawa", continent: "north_america", hemiNS: "north", hemiEW: "west", coastal: false, capital: true, eu: false, island: false, lang: "english", pop: "mid" },
  { name: "Mexico City", continent: "north_america", hemiNS: "north", hemiEW: "west", coastal: false, capital: true, eu: false, island: false, lang: "spanish", pop: "mega" },
  { name: "Havana", continent: "north_america", hemiNS: "north", hemiEW: "west", coastal: true, capital: true, eu: false, island: true, lang: "spanish", pop: "big" },
  { name: "Bogotá", continent: "south_america", hemiNS: "north", hemiEW: "west", coastal: false, capital: true, eu: false, island: false, lang: "spanish", pop: "mega" },
  { name: "Lima", continent: "south_america", hemiNS: "south", hemiEW: "west", coastal: true, capital: true, eu: false, island: false, lang: "spanish", pop: "mega" },
  { name: "Santiago", continent: "south_america", hemiNS: "south", hemiEW: "west", coastal: false, capital: true, eu: false, island: false, lang: "spanish", pop: "mega" },
  { name: "Buenos Aires", continent: "south_america", hemiNS: "south", hemiEW: "west", coastal: true, capital: true, eu: false, island: false, lang: "spanish", pop: "mega" },
  { name: "Montevideo", continent: "south_america", hemiNS: "south", hemiEW: "west", coastal: true, capital: true, eu: false, island: false, lang: "spanish", pop: "mid" },
  { name: "São Paulo", continent: "south_america", hemiNS: "south", hemiEW: "west", coastal: false, capital: false, eu: false, island: false, lang: "portuguese", pop: "mega" },
  { name: "Rio de Janeiro", continent: "south_america", hemiNS: "south", hemiEW: "west", coastal: true, capital: false, eu: false, island: false, lang: "portuguese", pop: "mega" },
  { name: "Brasília", continent: "south_america", hemiNS: "south", hemiEW: "west", coastal: false, capital: true, eu: false, island: false, lang: "portuguese", pop: "big" },
  { name: "Tokyo", continent: "asia", hemiNS: "north", hemiEW: "east", coastal: true, capital: true, eu: false, island: true, lang: "other", pop: "mega" },
  { name: "Seoul", continent: "asia", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: false, island: false, lang: "other", pop: "mega" },
  { name: "Beijing", continent: "asia", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: false, island: false, lang: "other", pop: "mega" },
  { name: "Shanghai", continent: "asia", hemiNS: "north", hemiEW: "east", coastal: true, capital: false, eu: false, island: false, lang: "other", pop: "mega" },
  { name: "Hong Kong", continent: "asia", hemiNS: "north", hemiEW: "east", coastal: true, capital: false, eu: false, island: true, lang: "other", pop: "mega" },
  { name: "Taipei", continent: "asia", hemiNS: "north", hemiEW: "east", coastal: true, capital: true, eu: false, island: true, lang: "other", pop: "mega" },
  { name: "Singapore", continent: "asia", hemiNS: "north", hemiEW: "east", coastal: true, capital: true, eu: false, island: true, lang: "other", pop: "mid" },
  { name: "Bangkok", continent: "asia", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: false, island: false, lang: "other", pop: "mega" },
  { name: "Hanoi", continent: "asia", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: false, island: false, lang: "other", pop: "mega" },
  { name: "Manila", continent: "asia", hemiNS: "north", hemiEW: "east", coastal: true, capital: true, eu: false, island: true, lang: "other", pop: "mega" },
  { name: "Jakarta", continent: "asia", hemiNS: "south", hemiEW: "east", coastal: true, capital: true, eu: false, island: true, lang: "other", pop: "mega" },
  { name: "Kuala Lumpur", continent: "asia", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: false, island: false, lang: "other", pop: "mega" },
  { name: "Dubai", continent: "asia", hemiNS: "north", hemiEW: "east", coastal: true, capital: false, eu: false, island: false, lang: "other", pop: "big" },
  { name: "Abu Dhabi", continent: "asia", hemiNS: "north", hemiEW: "east", coastal: true, capital: true, eu: false, island: false, lang: "other", pop: "mid" },
  { name: "Riyadh", continent: "asia", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: false, island: false, lang: "other", pop: "big" },
  { name: "Sydney", continent: "oceania", hemiNS: "south", hemiEW: "east", coastal: true, capital: false, eu: false, island: true, lang: "english", pop: "big" },
  { name: "Melbourne", continent: "oceania", hemiNS: "south", hemiEW: "east", coastal: true, capital: false, eu: false, island: true, lang: "english", pop: "big" },
  { name: "Canberra", continent: "oceania", hemiNS: "south", hemiEW: "east", coastal: false, capital: true, eu: false, island: true, lang: "english", pop: "small" },
  { name: "Auckland", continent: "oceania", hemiNS: "south", hemiEW: "east", coastal: true, capital: false, eu: false, island: true, lang: "english", pop: "big" },
  { name: "Wellington", continent: "oceania", hemiNS: "south", hemiEW: "east", coastal: true, capital: true, eu: false, island: true, lang: "english", pop: "small" },
  { name: "Cairo", continent: "africa", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: false, island: false, lang: "other", pop: "mega" },
  { name: "Casablanca", continent: "africa", hemiNS: "north", hemiEW: "west", coastal: true, capital: false, eu: false, island: false, lang: "other", pop: "mega" },
  { name: "Rabat", continent: "africa", hemiNS: "north", hemiEW: "west", coastal: true, capital: true, eu: false, island: false, lang: "other", pop: "mid" },
  { name: "Algiers", continent: "africa", hemiNS: "north", hemiEW: "east", coastal: true, capital: true, eu: false, island: false, lang: "other", pop: "mega" },
  { name: "Lagos", continent: "africa", hemiNS: "north", hemiEW: "east", coastal: true, capital: false, eu: false, island: false, lang: "english", pop: "mega" },
  { name: "Abuja", continent: "africa", hemiNS: "north", hemiEW: "east", coastal: false, capital: true, eu: false, island: false, lang: "english", pop: "mid" },
  { name: "Nairobi", continent: "africa", hemiNS: "south", hemiEW: "east", coastal: false, capital: true, eu: false, island: false, lang: "english", pop: "mega" },
  { name: "Johannesburg", continent: "africa", hemiNS: "south", hemiEW: "east", coastal: false, capital: false, eu: false, island: false, lang: "english", pop: "mega" },
  { name: "Cape Town", continent: "africa", hemiNS: "south", hemiEW: "east", coastal: true, capital: false, eu: false, island: false, lang: "english", pop: "big" }
];


  function populateCityDatalist() {
    if (!els.cityList) return;
    els.cityList.innerHTML = "";
    const frag = document.createDocumentFragment();
    CITY_DB.map(c => c.name).sort((a,b)=>a.localeCompare(b)).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      frag.appendChild(opt);
    });
    els.cityList.appendChild(frag);
  }

  function findCityObjByName(name) {
    const n = normalizeCity(name);
    return CITY_DB.find(c => normalizeCity(c.name) === n) || null;
  }

  const local = {
    p1: { name: "Player 1", city: "" },
    p2: { name: "Player 2", city: "" },
    turn: "P1",
    phase: "setup",
    currentQuestion: "",
    winner: null,
  };

  let activeMode = null;
  let localEditing = null;

  const cpu = {
    enabled: false,
    difficulty: "medium",
    secret: null,
    candidates: [],
    lastAskedKey: null,
  };

  function cpuReset() {
    cpu.enabled = false;
    cpu.difficulty = "medium";
    cpu.secret = null;
    cpu.candidates = [];
    cpu.lastAskedKey = null;
  }

  function cpuPickSecret() {
    cpu.secret = CITY_DB[Math.floor(Math.random() * CITY_DB.length)];
    setText(els.p2CityStatus, "set");
  }

  function cpuResetCandidates() {
    cpu.candidates = CITY_DB.slice();
    cpu.lastAskedKey = null;
  }

  function parseQuestionKey(qRaw) {
    const q = (qRaw || "").toLowerCase();

    if (q.includes("in europe")) return "continent:europe";
    if (q.includes("in asia")) return "continent:asia";
    if (q.includes("in africa")) return "continent:africa";
    if (q.includes("in north america")) return "continent:north_america";
    if (q.includes("in south america")) return "continent:south_america";
    if (q.includes("in oceania") || q.includes("in australia")) return "continent:oceania";

    if (q.includes("northern hemisphere")) return "hemiNS:north";
    if (q.includes("southern hemisphere")) return "hemiNS:south";
    if (q.includes("western hemisphere")) return "hemiEW:west";
    if (q.includes("eastern hemisphere")) return "hemiEW:east";

    if (q.includes("capital")) return "capital:true";
    if (q.includes("coastal") || q.includes("on the coast") || q.includes("by the sea")) return "coastal:true";
    if (q.includes("island")) return "island:true";
    if (q.includes(" in the eu") || q.includes(" in eu") || q.includes(" in the e.u")) return "eu:true";

    if (q.includes("speak english")) return "lang:english";
    if (q.includes("speak spanish")) return "lang:spanish";
    if (q.includes("speak french")) return "lang:french";
    if (q.includes("speak german")) return "lang:german";
    if (q.includes("speak italian")) return "lang:italian";
    if (q.includes("speak portuguese")) return "lang:portuguese";

    if (q.includes("over 10m") || (q.includes("mega") && q.includes("city"))) return "pop:mega";
    if (q.includes("over") && q.includes("2") && (q.includes("metro") || q.includes("2m") || q.includes("2 m"))) return "pop:big_or_mega";
    if (q.includes("over 2m") || q.includes("over ~2m")) return "pop:big_or_mega";

    if (q.includes("pigs") || (q.includes("portugal") && q.includes("italy") && q.includes("greece") && q.includes("spain"))) return "group:pigs";

    return null;
  }

  function evalPredicate(cityObj, key) {
    const [k, v] = key.split(":");
    if (k === "continent") return cityObj.continent === v;
    if (k === "capital") return cityObj.capital === (v === "true");
    if (k === "coastal") return cityObj.coastal === (v === "true");
    if (k === "eu") return cityObj.eu === (v === "true");
    if (k === "island") return cityObj.island === (v === "true");
    if (k === "hemiNS") return cityObj.hemiNS === v;
    if (k === "hemiEW") return cityObj.hemiEW === v;
    if (k === "lang") return cityObj.lang === v;
    if (k === "pop") {
      if (v === "mega") return cityObj.pop === "mega";
      if (v === "big_or_mega") return cityObj.pop === "big" || cityObj.pop === "mega";
    }
    if (k === "group" && v === "pigs") {
      return cityObj.eu && (cityObj.lang === "portuguese" || cityObj.lang === "italian" || cityObj.lang === "spanish" || cityObj.name === "Athens");
    }
    return false;
  }

  function cpuChooseBestQuestionKey() {
    const keys = [
      "continent:europe","continent:asia","continent:africa","continent:north_america","continent:south_america","continent:oceania",
      "capital:true","coastal:true","island:true","eu:true",
      "hemiNS:north","hemiNS:south","hemiEW:west","hemiEW:east",
      "lang:english","lang:spanish","lang:french","lang:german","lang:italian","lang:portuguese",
      "pop:mega","pop:big_or_mega",
      "group:pigs"
    ].filter(k => k !== cpu.lastAskedKey);

    if (cpu.difficulty === "easy") {
      return keys[Math.floor(Math.random() * keys.length)];
    }

    let best = keys[0], bestScore = Infinity;
    for (const k of keys) {
      let yes = 0;
      for (const c of cpu.candidates) if (evalPredicate(c, k)) yes++;
      const no = cpu.candidates.length - yes;
      if (yes === 0 || no === 0) continue;
      const score = Math.abs(yes - no);
      if (score < bestScore) { bestScore = score; best = k; }
    }
    return best;
  }

  function keyToQuestionText(key) {
    const [k, v] = key.split(":");
    if (k === "continent") {
      const map = {
        europe:"Europe", asia:"Asia", africa:"Africa",
        north_america:"North America", south_america:"South America", oceania:"Oceania"
      };
      return `Is your city in ${map[v]}?`;
    }
    if (k === "capital") return "Is your city a national capital?";
    if (k === "coastal") return "Is your city coastal?";
    if (k === "island") return "Is your city on an island?";
    if (k === "eu") return "Is your city in the EU?";
    if (k === "hemiNS") return v === "north" ? "Is your city in the Northern Hemisphere?" : "Is your city in the Southern Hemisphere?";
    if (k === "hemiEW") return v === "west" ? "Is your city in the Western Hemisphere?" : "Is your city in the Eastern Hemisphere?";
    if (k === "lang") return `Do most people speak ${v[0].toUpperCase()+v.slice(1)} in your city?`;
    if (k === "pop") return v === "mega" ? "Does your city have over 10M people (mega city)?" : "Does your city have over ~2M metro population?";
    if (k === "group" && v === "pigs") return "Is your city in PIGS? (Portugal/Italy/Greece/Spain)";
    return "Is your city ...?";
  }

  function localSyncSetupUI() {
    setText(els.modeLabel, cpu.enabled ? `CPU (${cpu.difficulty})` : "Local");
    setText(els.setupMode, cpu.enabled ? `CPU (${cpu.difficulty})` : "Local");
    setText(els.roomLabel2, "—");
    setText(els.setupRoom, "—");

    setText(els.setupHint, cpu.enabled
      ? "CPU mode: Set YOUR name & secret city (from the list). CPU sets its own city automatically. Player 1 starts."
      : "One phone pass-and-play. Hand the phone over when setting cities."
    );

    els.p1Name.disabled = false;
    els.p1Name.value = local.p1.name || "Player 1";

    if (cpu.enabled) {
      els.p2Name.value = "CPU";
      els.p2Name.disabled = true;
      els.btnSetP2.disabled = true;
    } else {
      els.p2Name.disabled = false;
      els.p2Name.value = local.p2.name || "Player 2";
      els.btnSetP2.disabled = false;
    }

    els.btnSetP1.disabled = false;

    setText(els.p1CityStatus, local.p1.city ? "set" : "not set");
    setText(els.p2CityStatus, cpu.enabled ? (cpu.secret ? "set" : "not set") : (local.p2.city ? "set" : "not set"));

    els.btnBeginGame.disabled = cpu.enabled ? !local.p1.city : !(!!local.p1.city && !!local.p2.city);
  }

  function localSyncGameUI() {
    setText(els.turnLabel, local.turn);
    setText(els.phaseLabel, local.phase);

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

    setText(els.questionDisplay, local.currentQuestion || "—");

    if (showEnd && local.winner) {
      const name = local.winner === "P1" ? local.p1.name : (cpu.enabled ? "CPU" : local.p2.name);
      setText(els.endMessage, `${name} wins!`);
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

    if (cpu.enabled && local.turn === "P1") {
      const key = parseQuestionKey(q);
      const supports = !!key && cpu.secret;
      let ans = "No";
      if (supports) ans = evalPredicate(cpu.secret, key) ? "Yes" : "No";

      if (cpu.difficulty === "easy" && supports && Math.random() < 0.08) ans = ans === "Yes" ? "No" : "Yes";

      setTimeout(() => {
        logLine(`CPU answered: ${ans}${supports ? "" : " (unsupported question)"}`);
        local.currentQuestion = "";
        local.turn = "P2";
        local.phase = "ask";
        localSyncGameUI();
        setTimeout(cpuTakeTurn, 420);
      }, 420);
    }
  }

  function localAnswer(ans) {
    const answerer = local.turn === "P1" ? "P2" : "P1";
    logLine(`${answerer} answered: ${ans}`);

    if (cpu.enabled && local.turn === "P2") {
      const yes = ans === "Yes";
      const key = cpu.lastAskedKey;
      if (key) cpu.candidates = cpu.candidates.filter(c => evalPredicate(c, key) === yes);
    }

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
    const opponentCity = cpu.enabled ? (cpu.secret?.name || "") : (opponent === "P1" ? local.p1.city : local.p2.city);
    const ok = normalizeCity(guess) === normalizeCity(opponentCity);

    if (ok) {
      local.phase = "end";
      local.winner = local.turn;
      logLine(`${local.turn} guessed "${guess}" — CORRECT!`);
    } else {
      logLine(`${local.turn} guessed "${guess}" — wrong.`);
      local.turn = opponent;
      local.phase = "ask";
      if (cpu.enabled && local.turn === "P2") setTimeout(cpuTakeTurn, 420);
    }
    els.guessInput.value = "";
    localSyncGameUI();
  }

  function localNewCities() {
    local.p1.city = "";
    local.p2.city = "";
    local.phase = "setup";
    showScreen("setup");
    if (cpu.enabled) {
      cpuPickSecret();
      cpuResetCandidates();
    }
    localSyncSetupUI();
  }

  function cpuTakeTurn() {
    if (!cpu.enabled) return;
    if (local.phase !== "ask" || local.turn !== "P2") return;

    const t = cpu.difficulty === "hard" ? 4 : cpu.difficulty === "medium" ? 3 : 2;
    if (cpu.candidates.length <= t) {
      const g = cpu.candidates[Math.floor(Math.random() * cpu.candidates.length)];
      logLine(`CPU guesses: "${g.name}"`);
      const ok = normalizeCity(g.name) === normalizeCity(local.p1.city);
      if (ok) {
        local.phase = "end";
        local.winner = "P2";
        localSyncGameUI();
      } else {
        logLine("P1 answered: No (wrong)");
        cpu.candidates = cpu.candidates.filter(x => normalizeCity(x.name) !== normalizeCity(g.name));
        local.turn = "P1";
        local.phase = "ask";
        localSyncGameUI();
      }
      return;
    }

    const key = cpuChooseBestQuestionKey();
    cpu.lastAskedKey = key;
    const text = keyToQuestionText(key);

    local.currentQuestion = text;
    local.phase = "answer";
    localSyncGameUI();
    logLine(`CPU asked: ${text}`);
  }

  // --- Online Multiplayer ---
  const LS_KEY = "city_guess_online_identity_v3";
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

  function onlineRef(path="") {
    return db.ref("games/" + online.gameId + (path ? "/" + path : ""));
  }

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
        await playersRef.child(r).update({ owner: online.playerKey, online:true, joinedAt:Date.now(), lastSeen:Date.now() });
        online.role = r;
        return r;
      }
    }
    online.role = null;
    return null;
  }

  function syncOnlineSetupUI(hint) {
    setText(els.modeLabel, "Online");
    setText(els.setupMode, "Online");
    setText(els.roomLabel2, online.gameId || "—");
    setText(els.setupRoom, online.gameId || "—");
    setText(els.roomLabel, online.gameId || "—");
    setText(els.roleLabel, online.role || "—");
    setText(els.onlineStatus, "Firebase: connected");
    setText(els.setupHint, hint || "Set your name & city. Player 1 starts the game.");

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
      setText(els.p1CityStatus, p1Set ? "set" : "not set");
      setText(els.p2CityStatus, p2Set ? "set" : "not set");

      if (g.players?.P1?.name && els.p1Name.disabled) els.p1Name.value = g.players.P1.name;
      if (g.players?.P2?.name && els.p2Name.disabled) els.p2Name.value = g.players.P2.name;

      if (online.role === "P1") {
        els.btnBeginGame.disabled = !(p1Set && p2Set && g.phase === "setup");
      }

      if (g.phase && g.phase !== "setup") showScreen("game");

      setText(els.turnLabel, g.turn || "—");
      setText(els.phaseLabel, g.phase || "—");

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

      setText(els.questionDisplay, g.currentQuestion || "—");
      if (g.phase === "end" && g.winner) {
        const nm = g.players?.[g.winner]?.name || g.winner;
        setText(els.endMessage, `${nm} wins!`);
      }
    });
    clearLogUI();
    online.logListener = (snap) => {
      const v = snap.val();
      if (v?.text) logLine(v.text);
    };
    online.logRef.limitToLast(100).on("child_added", online.logListener);
  }

  async function onlineCreateRoom() {
    if (typeof db === "undefined") return alert("Firebase not ready. Check firebase.js.");
    online.playerKey = ensureIdentity();
    const gid = Math.random().toString(36).slice(2, 8).toUpperCase();
    online.gameId = gid;

    await db.ref("games/" + gid).set({
      status: "setup", phase: "setup", turn: "P1", createdAt: Date.now(),
      players: {
        P1: { owner: online.playerKey, online:true, joinedAt: Date.now(), name:"Player 1", city:null },
        P2: { owner:null, online:false, joinedAt:null, name:"Player 2", city:null }
      }
    });
    await claimRole();
    attachOnlineListeners();
    showScreen("setup");
    syncOnlineSetupUI("You are Player 1. Set your name & city. Share the room code with Player 2.");
    alert("Room Code: " + gid);
  }

  async function onlineJoinRoom() {
    if (typeof db === "undefined") return alert("Firebase not ready. Check firebase.js.");
    online.playerKey = ensureIdentity();
    const code = prompt("Enter Room Code");
    if (!code) return;
    online.gameId = code.toUpperCase();
    const snap = await db.ref("games/" + online.gameId).once("value");
    if (!snap.exists()) return alert("Room not found: " + online.gameId);

    await claimRole();
    if (!online.role) return alert("Room is full.");

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
    if (!g?.players?.P1?.city || !g?.players?.P2?.city) return alert("Both players must set a city first.");
    await onlineRef().update({ status:"playing", phase:"ask", turn:"P1", currentQuestion:"", winner:null, lastAnswer:null });
    await onlineRef("log").push({ t: Date.now(), text: "Game started!" });
  }
  async function onlineAskQuestion() {
    const q = (els.questionInput.value || "").trim();
    if (!q) return;
    await onlineRef().update({ currentQuestion:q, phase:"answer" });
    await onlineRef("log").push({ t: Date.now(), text: `${online.role} asked: ${q}` });
    els.questionInput.value = "";
  }
  async function onlineAnswer(ans) {
    const snap = await onlineRef().once("value");
    const g = snap.val(); if (!g) return;
    const nextTurn = g.turn === "P1" ? "P2" : "P1";
    await onlineRef().update({ lastAnswer: ans, phase:"ask", turn: nextTurn, currentQuestion:"" });
    await onlineRef("log").push({ t: Date.now(), text: `${online.role} answered: ${ans}` });
  }
  async function onlineOpenGuess() { await onlineRef().update({ phase:"guess" }); }
  async function onlineCancelGuess() { await onlineRef().update({ phase:"ask" }); }
  async function onlineSubmitGuess() {
    const guess = (els.guessInput.value || "").trim();
    if (!guess) return;
    const snap = await onlineRef().once("value");
    const g = snap.val(); if (!g) return;
    const opponent = online.role === "P1" ? "P2" : "P1";
    const opponentCity = g.players?.[opponent]?.city || "";
    const ok = normalizeCity(guess) === normalizeCity(opponentCity);
    if (ok) {
      await onlineRef().update({ phase:"end", winner: online.role });
      await onlineRef("log").push({ t: Date.now(), text: `${online.role} guessed "${guess}" — CORRECT!` });
    } else {
      const nextTurn = g.turn === "P1" ? "P2" : "P1";
      await onlineRef().update({ phase:"ask", turn: nextTurn });
      await onlineRef("log").push({ t: Date.now(), text: `${online.role} guessed "${guess}" — wrong.` });
    }
    els.guessInput.value = "";
  }
  async function onlineNewCities() {
    await onlineRef().update({ phase:"setup", status:"setup", currentQuestion:"", winner:null });
    await onlineRef("players/P1/city").set(null);
    await onlineRef("players/P2/city").set(null);
    await onlineRef("log").push({ t: Date.now(), text: "New cities needed." });
    showScreen("setup");
  }
  async function onlineClearLog() { await onlineRef("log").set(null); clearLogUI(); }

  // ---------------------------
  // Shared modal logic / UX
  // ---------------------------
  function openCityModal(forRole, hintText) {
    setText(els.modalTitle, forRole === "P1" ? "Player 1: secret city" : "Player 2: secret city");
    setText(els.modalHint, hintText || "Make sure the other player isn't looking 👀");
    els.secretCityInput.value = "";
    if (els.cpuCityHint) els.cpuCityHint.style.display = (cpu.enabled && forRole === "P1") ? "block" : "none";
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
    setText(els.questionDisplay, "—");
    setText(els.endMessage, "—");

    local.p1 = { name: "Player 1", city: "" };
    local.p2 = { name: "Player 2", city: "" };
    local.turn = "P1";
    local.phase = "setup";
    local.currentQuestion = "";
    local.winner = null;

    cpuReset();

    if (online.liveRef) online.liveRef.off();
    if (online.logRef && online.logListener) online.logRef.off("child_added", online.logListener);
    online.liveRef = null; online.logRef = null; online.logListener = null;
    online.gameId = null; online.role = null;

    setText(els.roomLabel, "—");
    setText(els.roleLabel, "—");
    setText(els.roomLabel2, "—");
    setText(els.onlineStatus, "Firebase: —");
    setText(els.modeLabel, "—");
    setText(els.setupMode, "—");
    setText(els.setupRoom, "—");
  }

  // ---------------------------
  // Wire UI
  // ---------------------------
  els.btnReset.addEventListener("click", resetAll);
  els.btnBackHome.addEventListener("click", resetAll);
  els.btnBackHome2.addEventListener("click", resetAll);

  els.btnStartLocal.addEventListener("click", () => {
    activeMode = "local";
    cpuReset();
    showScreen("setup");
    localSyncSetupUI();
  });

  els.btnStartCPU.addEventListener("click", () => {
    activeMode = "local";
    cpu.enabled = true;
    cpu.difficulty = (els.cpuDifficulty?.value || "medium");
    local.p2.name = "CPU";
    cpuPickSecret();
    cpuResetCandidates();
    showScreen("setup");
    localSyncSetupUI();
  });

  els.btnCreateRoom.addEventListener("click", async () => {
    activeMode = "online";
    cpuReset();
    try { await onlineCreateRoom(); } catch (e) { console.error(e); alert(e?.message || e); }
  });

  els.btnJoinRoom.addEventListener("click", async () => {
    activeMode = "online";
    cpuReset();
    try { await onlineJoinRoom(); } catch (e) { console.error(e); alert(e?.message || e); }
  });

  els.p1Name.addEventListener("blur", async () => {
    local.p1.name = (els.p1Name.value || "Player 1").trim().slice(0, 18);
    if (activeMode === "online" && online.role === "P1") await onlineSaveMyName();
  });
  els.p2Name.addEventListener("blur", async () => {
    local.p2.name = (els.p2Name.value || "Player 2").trim().slice(0, 18);
    if (activeMode === "online" && online.role === "P2") await onlineSaveMyName();
  });

  els.btnSetP1.addEventListener("click", () => {
    if (activeMode === "local") return openCityModal("P1", cpu.enabled ? "Pick a city from the list (CPU mode)." : "Hand the phone to Player 1 👀");
    if (activeMode === "online" && online.role === "P1") return openCityModal("P1", "Only Player 1 can set this.");
  });
  els.btnSetP2.addEventListener("click", () => {
    if (activeMode === "local") {
      if (cpu.enabled) return;
      return openCityModal("P2", "Hand the phone to Player 2 👀");
    }
    if (activeMode === "online" && online.role === "P2") return openCityModal("P2", "Only Player 2 can set this.");
  });

  els.btnSaveCity.addEventListener("click", async () => {
    const city = (els.secretCityInput.value || "").trim();
    if (!city) return;

    if (activeMode === "local") {
      if (localEditing === "P1") {
        if (cpu.enabled) {
          const obj = findCityObjByName(city);
          if (!obj) return alert("CPU mode: please pick a city from the dropdown list.");
          local.p1.city = obj.name;
        } else {
          local.p1.city = city;
        }
      }
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
    if (activeMode === "local") {
      if (cpu.enabled && !local.p1.city) return alert("Set your secret city first (from the list).");
      if (!cpu.enabled && (!local.p1.city || !local.p2.city)) return alert("Both players must set a city first.");
      return localBegin();
    }
    if (activeMode === "online") return onlineBeginGame();
  });

  els.btnQuick.addEventListener("click", () => showModal("quickModal", true));
  els.btnCloseQuick.addEventListener("click", () => showModal("quickModal", false));

  els.btnAsk.addEventListener("click", async () => {
    if (activeMode === "local") return localAsk();
    if (activeMode === "online") return onlineAskQuestion();
  });

  els.btnYes.addEventListener("click", async () => {
    if (activeMode === "local") {
      localAnswer("Yes");
      if (cpu.enabled && local.turn === "P2") setTimeout(cpuTakeTurn, 420);
      return;
    }
    if (activeMode === "online") return onlineAnswer("Yes");
  });

  els.btnNo.addEventListener("click", async () => {
    if (activeMode === "local") {
      localAnswer("No");
      if (cpu.enabled && local.turn === "P2") setTimeout(cpuTakeTurn, 420);
      return;
    }
    if (activeMode === "online") return onlineAnswer("No");
  });

  els.btnGuess.addEventListener("click", async () => {
    if (activeMode === "local") { localOpenGuess(); return; }
    if (activeMode === "online") return onlineOpenGuess();
  });

  els.btnCancelGuess.addEventListener("click", async () => {
    if (activeMode === "local") { localCancelGuess(); return; }
    if (activeMode === "online") return onlineCancelGuess();
  });

  els.btnSubmitGuess.addEventListener("click", async () => {
    if (activeMode === "local") return localSubmitGuess();
    if (activeMode === "online") return onlineSubmitGuess();
  });

  els.btnRematch.addEventListener("click", async () => {
    if (activeMode === "local") return localNewCities();
    if (activeMode === "online") return onlineNewCities();
  });

  els.btnClearLog.addEventListener("click", async () => {
    if (activeMode === "local") return clearLogUI();
    if (activeMode === "online") return onlineClearLog();
  });

  // boot
  populateCityDatalist();
  buildQuickList();
  resetAll();
})();

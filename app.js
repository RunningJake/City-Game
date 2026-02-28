
const CITY_DB = [
  {name:"Paris", continent:"Europe", coastal:false, capital:true, language:"French"},
  {name:"Tokyo", continent:"Asia", coastal:true, capital:true, language:"Japanese"},
  {name:"Montevideo", continent:"South America", coastal:true, capital:true, language:"Spanish"},
  {name:"New York", continent:"North America", coastal:true, capital:false, language:"English"},
  {name:"Sydney", continent:"Oceania", coastal:true, capital:false, language:"English"},
  {name:"Cairo", continent:"Africa", coastal:false, capital:true, language:"Arabic"},
  {name:"Oslo", continent:"Europe", coastal:true, capital:true, language:"Norwegian"},
  {name:"Buenos Aires", continent:"South America", coastal:true, capital:true, language:"Spanish"},
  {name:"Reykjavik", continent:"Europe", coastal:true, capital:true, language:"Icelandic"},
  {name:"Cape Town", continent:"Africa", coastal:true, capital:false, language:"English"}
];

let cpuCity = null;
let difficulty = "easy";

const home = document.getElementById("homeScreen");
const game = document.getElementById("gameScreen");
const log = document.getElementById("log");
const status = document.getElementById("status");

document.getElementById("startCPU").onclick = () => {
  difficulty = document.getElementById("difficulty").value;
  cpuCity = CITY_DB[Math.floor(Math.random()*CITY_DB.length)];
  home.classList.add("hidden");
  game.classList.remove("hidden");
  writeLog("🦖 CPU has chosen a city...");
};

function writeLog(text){
  const div = document.createElement("div");
  div.textContent = text;
  log.prepend(div);
}

function parseQuestion(q){
  q = q.toLowerCase();
  if(q.includes("europe")) return city => city.continent==="Europe";
  if(q.includes("asia")) return city => city.continent==="Asia";
  if(q.includes("africa")) return city => city.continent==="Africa";
  if(q.includes("coastal")) return city => city.coastal===true;
  if(q.includes("capital")) return city => city.capital===true;
  if(q.includes("spanish")) return city => city.language==="Spanish";
  return null;
}

document.getElementById("askBtn").onclick = () => {
  const q = document.getElementById("questionInput").value;
  if(!q) return;

  const predicate = parseQuestion(q);

  if(!predicate){
    writeLog("🦭 CPU says: I don't understand that question. Try something geographic!");
    return; // FIXED: no turn lost
  }

  const answer = predicate(cpuCity);
  writeLog("You asked: " + q);
  writeLog("🐉 CPU answers: " + (answer ? "YES" : "NO"));
};

document.getElementById("guessBtn").onclick = () => {
  document.getElementById("guessInput").classList.remove("hidden");
  document.getElementById("submitGuess").classList.remove("hidden");
};

document.getElementById("submitGuess").onclick = () => {
  const guess = document.getElementById("guessInput").value.trim().toLowerCase();
  if(!guess) return;

  if(guess === cpuCity.name.toLowerCase()){
    writeLog("🌍 CORRECT! You win!");
    status.textContent = "Victory! 🦖";
  } else {
    writeLog("❌ Wrong guess!");
  }
};

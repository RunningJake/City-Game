let gameId = null;

function createGame() {
  gameId = Math.random().toString(36).substr(2, 6).toUpperCase();
  db.ref("games/" + gameId).set({
    turn: "P1",
    status: "waiting"
  });
  alert("Room Code: " + gameId);
  listenToGame();
}

function joinGame() {
  const code = prompt("Enter Room Code");
  if (!code) return;
  gameId = code.toUpperCase();
  db.ref("games/" + gameId + "/status").set("playing");
  listenToGame();
}

function listenToGame() {
  db.ref("games/" + gameId).on("value", (snap) => {
    const game = snap.val();
    if (!game) return;
    document.getElementById("room").innerText = "Room: " + gameId;
    document.getElementById("turn").innerText = "Turn: " + game.turn;
  });
}

function switchTurn() {
  db.ref("games/" + gameId).once("value").then((snap) => {
    const game = snap.val();
    const next = game.turn === "P1" ? "P2" : "P1";
    db.ref("games/" + gameId + "/turn").set(next);
  });
}

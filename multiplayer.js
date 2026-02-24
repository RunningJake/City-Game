let gameId = null;
const playerKey = "p_" + Math.random().toString(36).slice(2, 8);

function createGame() {
  gameId = Math.random().toString(36).substr(2, 6).toUpperCase();
  window.__CITY_ROOM = gameId; // <-- ADD THIS

  db.ref("games/" + gameId).set({
    turn: "P1",
    status: "waiting",
    players: { [playerKey]: { joinedAt: Date.now() } }
  })
  .then(() => {
    alert("Room Code: " + gameId);
    listenToGame();
  })
  .catch((e) => alert("Create failed: " + (e?.message || e)));
}

function joinGame() {
  const code = prompt("Enter Room Code");
  if (!code) return;

  gameId = code.toUpperCase();
  window.__CITY_ROOM = gameId; // <-- ADD THIS

  const ref = db.ref("games/" + gameId);
  ref.once("value")
    .then((snap) => {
      if (!snap.exists()) {
        alert("Room not found: " + gameId);
        gameId = null;
        return;
      }
      ref.child("status").set("playing");
      ref.child("players/" + playerKey).set({ joinedAt: Date.now() });
      listenToGame();
    })
    .catch((e) => alert("Join failed: " + (e?.message || e)));
}

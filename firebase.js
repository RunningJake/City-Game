// firebase.js
// Firebase config for City Guess (Realtime Database)

const firebaseConfig = {
  apiKey: "AIzaSyCXjYrXjXo5zHBTtfwvfbZHH-TksGEzYlc",
  authDomain: "city-game-d5837.firebaseapp.com",
  databaseURL: "https://city-game-d5837-default-rtdb.firebaseio.com",
  projectId: "city-game-d5837",
  storageBucket: "city-game-d5837.firebasestorage.app",
  messagingSenderId: "951479993023",
  appId: "1:951479993023:web:a32cb80c124882c3ffbc0a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

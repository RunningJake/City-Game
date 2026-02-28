// firebase.js — Firebase config + db handle (compat)
(function(){
  if (typeof firebase === "undefined") {
    console.error("Firebase SDK not loaded. Check script tags in index.html.");
    return;
  }
  // NOTE: Keep your existing firebaseConfig in your repo.
  // If you already have firebase.initializeApp(firebaseConfig) here, you can keep it as-is.
  const firebaseConfig = window.firebaseConfig || {};
  try{
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
    window.db = firebase.database();
  }catch(e){
    console.error("Firebase init error", e);
  }
})();

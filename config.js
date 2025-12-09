// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCtEQ0vzqnwqMi333dVuZRTVJkTRd_Ho_s",
  authDomain: "riskman-b5eeb.firebaseapp.com",
  projectId: "riskman-b5eeb",
  storageBucket: "riskman-b5eeb.firebasestorage.app",
  messagingSenderId: "268232529278",
  appId: "1:268232529278:web:395eef60f64298915d4f2f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Global Firestore reference
const db = firebase.firestore();

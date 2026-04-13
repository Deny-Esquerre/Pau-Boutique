/* ===================================================
   FIREBASE CONFIGURATION & INITIALIZATION
   =================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA24Bo_g5ghQxjZjzoavJkzm0LL57zpJM8",
  authDomain: "pauboutique.firebaseapp.com",
  projectId: "pauboutique",
  storageBucket: "pauboutique.firebasestorage.app",
  messagingSenderId: "322088329733",
  appId: "1:322088329733:web:65256e7dad3fad574f726c",
  measurementId: "G-MDGF2QGQYX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Cloudinary Constants (For future use in Admin Dashboard)
export const CLOUDINARY_CONFIG = {
  cloudName: 'PauBoutique',
  uploadPreset: 'Unsigned' 
};

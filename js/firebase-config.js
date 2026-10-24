/**
 * RUANG LOGIKA — Firebase Configuration & Initialization
 * Menggunakan Firebase Web Modular SDK (v9+ / v10+)
 * Pengembang: Yusuf Nurul Huda
 * 
 * Catatan: Ganti nilai kredensial di bawah ini dengan konfigurasi Firebase Console Anda.
 * Buka https://console.firebase.google.com -> Buat Proyek -> Tambah Web App.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "ruang-logika-sma.firebaseapp.com",
  projectId: "ruang-logika-sma",
  storageBucket: "ruang-logika-sma.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Cek apakah kredensial masih placeholder
export const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && !firebaseConfig.apiKey.includes("YOUR_");

// Inisialisasi Firebase App
let appInstance = null;
let authInstance = null;
let dbInstance = null;

try {
  if (isConfigured) {
    appInstance = initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    console.log("Ruang Logika: Firebase terinisialisasi secara aktif.");
  } else {
    console.warn("Ruang Logika: Firebase credentials masih menggunakan placeholder. Mode Demo & Local Simulators aktif.");
  }
} catch (error) {
  console.error("Gagal menginisialisasi Firebase:", error);
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;

/**
 * RUANG LOGIKA — Authentication & User State Engine
 * Menggunakan Firebase Auth & Firestore Modular API (v9+)
 * Pengembang: Yusuf Nurul Huda
 */

import { auth, db, isConfigured } from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * Registrasi Siswa / Guru / Admin baru
 * Menyimpan data ke Firebase Auth & membuat dokumen di Firestore 'users'
 */
export async function registerUser({ namaLengkap, email, password, role = "siswa", kelas = "Kelas X-1" }) {
  try {
    if (!isConfigured || !auth || !db) {
      // Demo Mode Fallback jika kredensial belum diisi
      console.warn("Mode Demo: Menyimpan user ke LocalStorage (Kredensial Firebase belum dikonfigurasi)");
      const demoUser = {
        uid: "demo-" + Date.now(),
        namaLengkap,
        email,
        role,
        kelas,
        level: 1,
        xp: 100,
        streak: 1,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("ruanglogika_user", JSON.stringify(demoUser));
      return { success: true, user: demoUser, isDemo: true };
    }

    // 1. Buat User di Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Set Profile Display Name
    await updateProfile(user, {
      displayName: namaLengkap
    });

    // 3. Simpan metadata & role pengguna ke koleksi 'users' di Cloud Firestore
    const userRef = doc(db, "users", user.uid);
    const userData = {
      uid: user.uid,
      namaLengkap,
      email,
      role: role.toLowerCase(), // 'siswa' | 'guru' | 'admin'
      kelas: role === "siswa" ? kelas : "Pengajar / Administrator",
      level: 1,
      xp: 0,
      streak: 1,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };

    await setDoc(userRef, userData);

    // Simpan info sesi lokal cepat
    localStorage.setItem("ruanglogika_user", JSON.stringify({
      uid: user.uid,
      namaLengkap,
      email,
      role: userData.role
    }));

    return { success: true, user: userData };
  } catch (error) {
    console.error("Registrasi gagal:", error);
    return { success: false, error: mapAuthError(error.code) || error.message };
  }
}

/**
 * Login Pengguna
 * Memeriksa password dan mengambil dokumen pengguna dari koleksi 'users'
 */
export async function loginUser(email, password) {
  try {
    if (!isConfigured || !auth || !db) {
      // Demo Mode Fallback
      console.warn("Mode Demo: Login menggunakan data lokal");
      let role = "siswa";
      let name = "Alifia Syahira";

      if (email.includes("guru")) {
        role = "guru";
        name = "Bpk. Hendra Pratama, S.Kom.";
      } else if (email.includes("admin")) {
        role = "admin";
        name = "Yusuf Nurul Huda";
      }

      const demoUser = {
        uid: "demo-" + role,
        namaLengkap: name,
        email,
        role,
        kelas: "Kelas X-1",
        level: 4,
        xp: 850,
        streak: 5
      };

      localStorage.setItem("ruanglogika_user", JSON.stringify(demoUser));
      return { success: true, user: demoUser, isDemo: true };
    }

    // 1. Sign In dengan Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Ambil dokumen detail pengguna dan role dari Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let userData = null;
    if (userSnap.exists()) {
      userData = userSnap.data();
      // Perbarui waktu login terakhir
      await updateDoc(userRef, { lastLogin: serverTimestamp() }).catch(() => {});
    } else {
      // Default fallback jika dokumen belum ada di Firestore
      userData = {
        uid: user.uid,
        namaLengkap: user.displayName || "Siswa Ruang Logika",
        email: user.email,
        role: "siswa",
        kelas: "Kelas X-1"
      };
      await setDoc(userRef, {
        ...userData,
        level: 1,
        xp: 0,
        streak: 1,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
    }

    // Cache info user
    localStorage.setItem("ruanglogika_user", JSON.stringify(userData));

    return { success: true, user: userData };
  } catch (error) {
    console.error("Login gagal:", error);
    return { success: false, error: mapAuthError(error.code) || error.message };
  }
}

/**
 * Login Cepat dengan Akun Belajar / Google SSO
 */
export async function loginWithGoogle() {
  try {
    if (!isConfigured || !auth) {
      alert("Untuk menggunakan Google SSO, silakan isi kredensial Firebase di js/firebase-config.js terlebih dahulu.");
      return { success: false, error: "Firebase belum terkonfigurasi." };
    }

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Cek atau buat dokumen user di Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let userData;
    if (!userSnap.exists()) {
      userData = {
        uid: user.uid,
        namaLengkap: user.displayName || "Siswa Baru",
        email: user.email,
        role: "siswa",
        kelas: "Kelas X-1",
        level: 1,
        xp: 50,
        streak: 1,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };
      await setDoc(userRef, userData);
    } else {
      userData = userSnap.data();
      await updateDoc(userRef, { lastLogin: serverTimestamp() }).catch(() => {});
    }

    localStorage.setItem("ruanglogika_user", JSON.stringify(userData));
    return { success: true, user: userData };
  } catch (error) {
    console.error("Google Auth gagal:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Logout dari Sesi
 */
export async function logoutUser() {
  try {
    if (isConfigured && auth) {
      await signOut(auth);
    }
    localStorage.removeItem("ruanglogika_user");
    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout gagal:", error);
    localStorage.removeItem("ruanglogika_user");
    window.location.href = "login.html";
  }
}

/**
 * Proteksi Halaman (Middleware Client-Side)
 * Mengecek apakah user sudah login melalui onAuthStateChanged
 * Jika belum, redirect ke login.html
 */
export function protectPage(allowedRoles = ["siswa", "guru", "admin"]) {
  // Jika Firebase belum aktif, periksa cache demo localStorage
  if (!isConfigured || !auth) {
    const cached = localStorage.getItem("ruanglogika_user");
    if (!cached) {
      console.warn("Proteksi: User belum login. Mengalihkan ke login.html");
      window.location.href = "login.html";
      return;
    }
    const user = JSON.parse(cached);
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      alert(`Akses ditolak: Halaman ini hanya untuk role [${allowedRoles.join(", ")}].`);
      redirectBasedOnRole(user.role);
      return;
    }
    updateUIUserData(user);
    return;
  }

  // Firebase Real Auth Listener
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      console.warn("Proteksi: Sesi Auth tidak ditemukan. Mengalihkan ke login.html");
      window.location.href = "login.html";
    } else {
      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        let userRole = "siswa";
        let userProfile = {
          uid: firebaseUser.uid,
          namaLengkap: firebaseUser.displayName || "Siswa Ruang Logika",
          email: firebaseUser.email,
          role: "siswa"
        };

        if (userSnap.exists()) {
          userProfile = userSnap.data();
          userRole = userProfile.role || "siswa";
        }

        if (allowedRoles.length && !allowedRoles.includes(userRole)) {
          alert(`Akses dibatasi. Anda tidak memiliki izin untuk halaman ini.`);
          redirectBasedOnRole(userRole);
          return;
        }

        updateUIUserData(userProfile);
      } catch (e) {
        console.error("Error verifikasi role Firestore:", e);
      }
    }
  });
}

/**
 * Pengarah Navigasi Berdasarkan Role
 */
export function redirectBasedOnRole(role) {
  if (role === "guru") {
    window.location.href = "dashboard-guru.html";
  } else if (role === "admin") {
    window.location.href = "dashboard-admin.html";
  } else {
    window.location.href = "dashboard-siswa.html";
  }
}

/**
 * Perbarui UI Header dengan data nama dan role pengguna yang login
 */
function updateUIUserData(userData) {
  if (!userData) return;
  
  const nameElems = document.querySelectorAll(".user-display-name");
  nameElems.forEach(el => el.textContent = userData.namaLengkap);

  const roleElems = document.querySelectorAll(".user-display-role");
  roleElems.forEach(el => {
    const label = userData.role === "guru" ? "Guru Pengampu" : userData.role === "admin" ? "Administrator Lab" : (userData.kelas || "Kelas X SMA");
    el.textContent = label;
  });

  const xpElems = document.querySelectorAll(".user-display-xp");
  xpElems.forEach(el => el.textContent = `Level ${userData.level || 4} • ${userData.xp || 850} XP`);
}

/**
 * Helper Pemetaan Pesan Eror Firebase ke Bahasa Indonesia yang Ramah
 */
function mapAuthError(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "Email ini telah terdaftar. Silakan gunakan email lain atau login.";
    case "auth/invalid-email":
      return "Format email tidak valid. Harap periksa kembali.";
    case "auth/weak-password":
      return "Kata sandi terlalu pendek. Gunakan minimal 6 karakter.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email atau kata sandi yang Anda masukkan salah.";
    case "auth/network-request-failed":
      return "Koneksi jaringan terputus. Harap periksa koneksi internet Anda.";
    default:
      return null;
  }
}

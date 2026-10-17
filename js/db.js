/**
 * RUANG LOGIKA — Database & Dashboard Engine (js/db.js)
 * Firestore CRUD Operations & Real-time Dashboard UI Binding
 * Menggunakan Firebase Web Modular SDK v9+
 * Pengembang: Yusuf Nurul Huda
 */

import { db, auth, isConfigured } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const LOCAL_STORAGE_KEY_PROGRESS = "ruanglogika_quiz_progress_history";

// Data Contoh Demo untuk Rekap Guru/Admin jika Firestore belum terisi
const DEMO_STUDENTS_PROGRESS = [
  { id: "p1", userId: "s1", namaLengkap: "Ahmad Farhan", email: "farhan@student.id", quizTitle: "Evaluasi Konsep Stack & Queue", score: 100, correctCount: 5, totalQuestions: 5, timeSpentSeconds: 95, passed: true, createdAt: "2025-05-10T08:30:00Z" },
  { id: "p2", userId: "s2", namaLengkap: "Bella Safitri", email: "bella@student.id", quizTitle: "Evaluasi Konsep Stack & Queue", score: 80, correctCount: 4, totalQuestions: 5, timeSpentSeconds: 120, passed: true, createdAt: "2025-05-10T08:35:00Z" },
  { id: "p3", userId: "s3", namaLengkap: "Cahyo Nugroho", email: "cahyo@student.id", quizTitle: "Evaluasi Konsep Stack & Queue", score: 100, correctCount: 5, totalQuestions: 5, timeSpentSeconds: 88, passed: true, createdAt: "2025-05-10T09:12:00Z" },
  { id: "p4", userId: "s4", namaLengkap: "Dinda Maharani", email: "dinda@student.id", quizTitle: "Evaluasi Konsep Stack & Queue", score: 60, correctCount: 3, totalQuestions: 5, timeSpentSeconds: 150, passed: false, createdAt: "2025-05-10T10:05:00Z" },
  { id: "p5", userId: "s5", namaLengkap: "Erlangga Putra", email: "erlangga@student.id", quizTitle: "Evaluasi Konsep Stack & Queue", score: 80, correctCount: 4, totalQuestions: 5, timeSpentSeconds: 110, passed: true, createdAt: "2025-05-10T11:20:00Z" },
  { id: "p6", userId: "s6", namaLengkap: "Fani Rahmawati", email: "fani@student.id", quizTitle: "Evaluasi Konsep Stack & Queue", score: 40, correctCount: 2, totalQuestions: 5, timeSpentSeconds: 165, passed: false, createdAt: "2025-05-10T11:45:00Z" }
];

const DEMO_USERS_LIST = [
  { uid: "u1", namaLengkap: "Ahmad Farhan", email: "farhan@student.id", role: "siswa", createdAt: "2025-05-01" },
  { uid: "u2", namaLengkap: "Bella Safitri", email: "bella@student.id", role: "siswa", createdAt: "2025-05-01" },
  { uid: "u3", namaLengkap: "Dinda Maharani", email: "dinda@student.id", role: "siswa", createdAt: "2025-05-02" },
  { uid: "u4", namaLengkap: "Fani Rahmawati", email: "fani@student.id", role: "siswa", createdAt: "2025-05-03" },
  { uid: "u_guru", namaLengkap: "Budi Santoso, M.Kom", email: "budi.guru@ruanglogika.id", role: "guru", createdAt: "2025-04-15" },
  { uid: "u_admin", namaLengkap: "Yusuf Nurul Huda (Lead Developer)", email: "yusufnh@student.uns.ac.id", role: "admin", createdAt: "2025-04-01" }
];

// ==========================================================================
// 1. OPERASI CRUD FIRESTORE DASAR
// ==========================================================================

/**
 * Simpan hasil pengerjaan kuis ke koleksi 'progress' di Firestore.
 */
export async function saveQuizScoreToFirestore(quizData) {
  const user = auth ? auth.currentUser : null;
  const localUserStr = localStorage.getItem("ruanglogika_auth_user");
  const localUser = localUserStr ? JSON.parse(localUserStr) : null;

  const uid = user ? user.uid : (localUser ? localUser.uid : "tamu_" + Date.now());
  const nama = user?.displayName || localUser?.namaLengkap || "Siswa Tamu";
  const email = user?.email || localUser?.email || "tamu@ruanglogika.id";

  const payload = {
    userId: uid,
    namaLengkap: nama,
    email: email,
    quizId: quizData.quizId || "kuis-stack-queue",
    quizTitle: quizData.quizTitle || "Evaluasi Konsep Stack & Queue",
    score: Number(quizData.score) || 0,
    totalQuestions: Number(quizData.totalQuestions) || 5,
    correctCount: Number(quizData.correctCount) || 0,
    wrongCount: Number(quizData.wrongCount) || 0,
    answers: quizData.answers || {},
    timeSpentSeconds: Number(quizData.timeSpentSeconds) || 0,
    passed: (Number(quizData.score) || 0) >= 70,
    createdAt: new Date().toISOString()
  };

  // Simpan selalu ke LocalStorage sebagai cadangan lokal & demo
  try {
    const existingHistory = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_PROGRESS) || "[]");
    existingHistory.unshift({ ...payload, id: "local_" + Date.now() });
    localStorage.setItem(LOCAL_STORAGE_KEY_PROGRESS, JSON.stringify(existingHistory.slice(0, 50)));
  } catch (err) {
    console.warn("Gagal menyimpan ke localStorage:", err);
  }

  // Jika Firebase terkonfigurasi, simpan ke Firestore
  if (isConfigured && db) {
    try {
      const docPayload = {
        ...payload,
        timestamp: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "progress"), docPayload);
      console.log("Skor berhasil disimpan ke Firestore progress dengan ID:", docRef.id);
      return { success: true, mode: "firestore", docId: docRef.id };
    } catch (error) {
      console.error("Gagal menyimpan ke Firestore:", error);
      return { success: false, mode: "local-fallback", error: error.message };
    }
  }

  console.log("Mode Demo/Lokal: Skor disimpan di penyimpanan browser lokal.");
  return { success: true, mode: "local-demo", docId: "local_" + Date.now() };
}

/**
 * Mengambil riwayat progres kuis untuk user tertentu
 */
export async function getUserQuizHistory(userId) {
  if (isConfigured && db && userId) {
    try {
      const q = query(
        collection(db, "progress"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((docSnapshot) => {
        results.push({ id: docSnapshot.id, ...docSnapshot.data() });
      });
      if (results.length > 0) return results;
    } catch (err) {
      console.warn("Gagal query Firestore progress:", err);
    }
  }

  // Fallback dari local storage
  const localHistory = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_PROGRESS) || "[]");
  const filtered = localHistory.filter(item => !userId || item.userId === userId || item.userId.startsWith("tamu_"));
  if (filtered.length > 0) return filtered;

  // Jika masih kosong, berikan satu contoh kuis selesai agar dashboard tampak hidup
  return [
    {
      id: "demo_last_quiz",
      userId: userId || "guest",
      namaLengkap: "Siswa Ruang Logika",
      quizTitle: "Evaluasi Konsep Stack & Queue",
      score: 100,
      totalQuestions: 5,
      correctCount: 5,
      wrongCount: 0,
      passed: true,
      createdAt: new Date().toISOString()
    }
  ];
}

/**
 * Mengambil seluruh data nilai kuis semua siswa (Untuk Guru & Admin)
 */
export async function getAllStudentsProgress() {
  if (isConfigured && db) {
    try {
      const q = query(collection(db, "progress"), orderBy("timestamp", "desc"), limit(50));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      if (list.length > 0) return list;
    } catch (e) {
      console.warn("Gagal mengambil progress semua siswa dari Firestore:", e);
    }
  }

  // Gabungkan riwayat lokal + data demo kelas
  const localHistory = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_PROGRESS) || "[]");
  return [...localHistory, ...DEMO_STUDENTS_PROGRESS];
}

/**
 * Mengambil daftar user untuk Admin Dashboard
 */
export async function getAllUsersList() {
  if (isConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = [];
      snap.forEach(d => list.push({ uid: d.id, ...d.data() }));
      if (list.length > 0) return list;
    } catch (e) {
      console.warn("Gagal mengambil list user dari Firestore:", e);
    }
  }
  return DEMO_USERS_LIST;
}

/**
 * Mengambil profil user
 */
export async function getUserProfile(userId) {
  if (isConfigured && db && userId) {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data();
      }
    } catch (err) {
      console.warn("Gagal mengambil profil Firestore:", err);
    }
  }

  const localUserStr = localStorage.getItem("ruanglogika_auth_user");
  if (localUserStr) {
    return JSON.parse(localUserStr);
  }
  return null;
}

// ==========================================================================
// 2. DASHBOARD BINDING ENGINES
// ==========================================================================

/**
 * Engine untuk Dashboard Siswa (dashboard-siswa.html)
 */
export async function initStudentDashboard() {
  const greetingNameEl = document.getElementById("student-greeting-name");
  const studentRoleBadge = document.getElementById("student-role-badge");
  const statHighestScore = document.getElementById("student-stat-highest");
  const statAverageScore = document.getElementById("student-stat-average");
  const statTotalQuizzes = document.getElementById("student-stat-quizzes");
  const statTotalXP = document.getElementById("student-stat-xp");
  const historyTableBody = document.getElementById("student-history-tbody");
  const certificateNameEl = document.getElementById("cert-student-name");

  // Ambil state user
  const localUserStr = localStorage.getItem("ruanglogika_auth_user");
  let currentUser = localUserStr ? JSON.parse(localUserStr) : {
    uid: "siswa_demo",
    namaLengkap: "Farhan Ardiansyah",
    email: "farhan@student.id",
    role: "siswa"
  };

  if (auth && auth.currentUser) {
    currentUser = {
      uid: auth.currentUser.uid,
      namaLengkap: auth.currentUser.displayName || currentUser.namaLengkap,
      email: auth.currentUser.email,
      role: "siswa"
    };
  }

  // Tampilkan Identitas di Header
  if (greetingNameEl) greetingNameEl.textContent = currentUser.namaLengkap;
  if (studentRoleBadge) studentRoleBadge.textContent = "Siswa Aktif";
  if (certificateNameEl) certificateNameEl.textContent = currentUser.namaLengkap;

  // Ambil riwayat kuis dari Firestore / Local
  const history = await getUserQuizHistory(currentUser.uid);

  // Hitung Metrik
  let maxScore = 0;
  let totalScore = 0;
  history.forEach(item => {
    const sc = Number(item.score) || 0;
    if (sc > maxScore) maxScore = sc;
    totalScore += sc;
  });

  const avgScore = history.length > 0 ? Math.round(totalScore / history.length) : 0;
  const totalXP = (history.length * 50) + (maxScore >= 80 ? 100 : 50);

  if (statHighestScore) statHighestScore.textContent = `${maxScore}`;
  if (statAverageScore) statAverageScore.textContent = `${avgScore}`;
  if (statTotalQuizzes) statTotalQuizzes.textContent = `${history.length}`;
  if (statTotalXP) statTotalXP.textContent = `+${totalXP} XP`;

  // Render Tabel Riwayat Kuis
  if (historyTableBody) {
    historyTableBody.innerHTML = "";
    if (history.length === 0) {
      historyTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="py-8 text-center text-slate-400 font-mono text-xs">
            Belum ada riwayat kuis yang tersimpan. Silakan kerjakan kuis pertama Anda!
          </td>
        </tr>
      `;
      return;
    }

    history.forEach((row, idx) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs";

      const dateStr = row.createdAt ? new Date(row.createdAt).toLocaleDateString("id-ID", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
      }) : "Baru saja";

      const isPassed = (row.score || 0) >= 70;

      tr.innerHTML = `
        <td class="py-3.5 px-4 font-mono font-bold text-[#17324D]">${idx + 1}</td>
        <td class="py-3.5 px-4 font-medium text-slate-800">${escapeHtml(row.quizTitle || "Evaluasi Stack & Queue")}</td>
        <td class="py-3.5 px-4 font-mono text-slate-500">${dateStr}</td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center gap-1 font-mono font-bold text-sm ${
            isPassed ? "text-emerald-700" : "text-rose-600"
          }">
            ${row.score || 0}
            <span class="text-[10px] text-slate-400">/ 100</span>
          </span>
        </td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
            isPassed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
          }">
            <span class="material-symbols-outlined text-xs">${isPassed ? "check_circle" : "cancel"}</span>
            ${isPassed ? "Kompeten" : "Perlu Remediasi"}
          </span>
        </td>
      `;
      historyTableBody.appendChild(tr);
    });
  }
}

/**
 * Engine untuk Dashboard Guru (dashboard-guru.html)
 */
export async function initTeacherDashboard() {
  const teacherNameEl = document.getElementById("teacher-name");
  const statClassAverage = document.getElementById("stat-class-avg");
  const statTotalStudents = document.getElementById("stat-total-students");
  const statPassRate = document.getElementById("stat-pass-rate");
  const statRemediationCount = document.getElementById("stat-remediation-count");
  const gradebookTbody = document.getElementById("teacher-gradebook-tbody");
  const remediationListEl = document.getElementById("teacher-remediation-list");

  // Identitas Guru
  const localUserStr = localStorage.getItem("ruanglogika_auth_user");
  const currentUser = localUserStr ? JSON.parse(localUserStr) : {
    namaLengkap: "Budi Santoso, M.Kom",
    role: "guru"
  };
  if (teacherNameEl) teacherNameEl.textContent = currentUser.namaLengkap;

  // Ambil data progres seluruh siswa
  const progressList = await getAllStudentsProgress();

  // Kalkulasi Statistik Kelas
  let totalScore = 0;
  let passedCount = 0;
  let remediationList = [];
  const uniqueStudents = new Set();

  progressList.forEach(item => {
    const sc = Number(item.score) || 0;
    totalScore += sc;
    uniqueStudents.add(item.userId || item.namaLengkap);

    if (sc >= 70) {
      passedCount++;
    } else {
      remediationList.push(item);
    }
  });

  const totalEvaluations = progressList.length;
  const classAvg = totalEvaluations > 0 ? Math.round(totalScore / totalEvaluations) : 0;
  const passPercent = totalEvaluations > 0 ? Math.round((passedCount / totalEvaluations) * 100) : 0;

  if (statClassAverage) statClassAverage.textContent = `${classAvg}`;
  if (statTotalStudents) statTotalStudents.textContent = `${uniqueStudents.size || totalEvaluations}`;
  if (statPassRate) statPassRate.textContent = `${passPercent}%`;
  if (statRemediationCount) statRemediationCount.textContent = `${remediationList.length}`;

  // Render Buku Nilai (Gradebook)
  if (gradebookTbody) {
    gradebookTbody.innerHTML = "";
    progressList.forEach((row, idx) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs";

      const isPassed = (Number(row.score) || 0) >= 70;
      const dateStr = row.createdAt ? new Date(row.createdAt).toLocaleDateString("id-ID", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
      }) : "Hari ini";

      tr.innerHTML = `
        <td class="py-3 px-4 font-mono font-bold text-slate-400">${idx + 1}</td>
        <td class="py-3 px-4 font-bold text-[#17324D] flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-teal-100 text-[#22A699] flex items-center justify-center font-bold text-xs uppercase">
            ${(row.namaLengkap || "S").charAt(0)}
          </div>
          <span>${escapeHtml(row.namaLengkap || "Siswa")}</span>
        </td>
        <td class="py-3 px-4 font-mono text-slate-500">${escapeHtml(row.email || "-")}</td>
        <td class="py-3 px-4 font-medium text-slate-700">${escapeHtml(row.quizTitle || "Evaluasi Stack & Queue")}</td>
        <td class="py-3 px-4 font-mono text-slate-500">${dateStr}</td>
        <td class="py-3 px-4">
          <span class="font-mono font-bold text-sm ${isPassed ? "text-emerald-700" : "text-rose-600"}">
            ${row.score || 0}
          </span>
        </td>
        <td class="py-3 px-4">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isPassed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
          }">
            ${isPassed ? "Tuntas" : "Remedial"}
          </span>
        </td>
      `;
      gradebookTbody.appendChild(tr);
    });
  }

  // Render Daftar Remediasi
  if (remediationListEl) {
    remediationListEl.innerHTML = "";
    if (remediationList.length === 0) {
      remediationListEl.innerHTML = `<div class="p-4 text-xs text-slate-400 font-mono text-center">Seluruh siswa telah tuntas mencapai KKM!</div>`;
    } else {
      remediationList.slice(0, 5).forEach(item => {
        const div = document.createElement("div");
        div.className = "p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between text-xs";
        div.innerHTML = `
          <div>
            <div class="font-bold text-[#17324D]">${escapeHtml(item.namaLengkap)}</div>
            <div class="text-[10px] text-slate-500 font-mono">Skor: ${item.score}/100 • Butuh bimbingan konsep Queue</div>
          </div>
          <button type="button" onclick="alert('Pemberitahuan latihan remedial telah dikirim ke akun ${escapeHtml(item.namaLengkap)}!')" class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition-all">
            Kirim Remedial
          </button>
        `;
        remediationListEl.appendChild(div);
      });
    }
  }
}

/**
 * Engine untuk Dashboard Admin (dashboard-admin.html)
 */
export async function initAdminDashboard() {
  const adminNameEl = document.getElementById("admin-name");
  const statTotalUsers = document.getElementById("admin-stat-total-users");
  const statTotalQuizzes = document.getElementById("admin-stat-total-quizzes");
  const statDbStatus = document.getElementById("admin-db-status");
  const usersTbody = document.getElementById("admin-users-tbody");

  // Identitas Admin
  const localUserStr = localStorage.getItem("ruanglogika_auth_user");
  const currentUser = localUserStr ? JSON.parse(localUserStr) : {
    namaLengkap: "Yusuf Nurul Huda (Lead Developer)",
    role: "admin"
  };
  if (adminNameEl) adminNameEl.textContent = currentUser.namaLengkap;

  // Status Firebase Database
  if (statDbStatus) {
    if (isConfigured && db) {
      statDbStatus.innerHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Firebase Terkoneksi Aktif
      </span>`;
    } else {
      statDbStatus.innerHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
        <span class="w-2 h-2 rounded-full bg-amber-500"></span> Mode Sandbox Demo
      </span>`;
    }
  }

  // Data User & Sesi
  const usersList = await getAllUsersList();
  const progressList = await getAllStudentsProgress();

  if (statTotalUsers) statTotalUsers.textContent = `${usersList.length}`;
  if (statTotalQuizzes) statTotalQuizzes.textContent = `${progressList.length}`;

  // Render Tabel Kelola User
  if (usersTbody) {
    usersTbody.innerHTML = "";
    usersList.forEach((u, idx) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs";

      const roleBadge = u.role === "admin" 
        ? "bg-purple-100 text-purple-800 border-purple-200" 
        : u.role === "guru" 
          ? "bg-blue-100 text-blue-800 border-blue-200" 
          : "bg-teal-100 text-teal-800 border-teal-200";

      tr.innerHTML = `
        <td class="py-3.5 px-4 font-mono font-bold text-slate-400">${idx + 1}</td>
        <td class="py-3.5 px-4 font-bold text-[#17324D]">${escapeHtml(u.namaLengkap)}</td>
        <td class="py-3.5 px-4 font-mono text-slate-600">${escapeHtml(u.email)}</td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleBadge} uppercase tracking-wider font-mono">
            ${u.role}
          </span>
        </td>
        <td class="py-3.5 px-4 font-mono text-slate-500">${u.createdAt || "2025-05-01"}</td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center gap-1 text-emerald-700 font-bold">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Aktif
          </span>
        </td>
      `;
      usersTbody.appendChild(tr);
    });
  }
}

// Utility: Escape HTML
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Auto-detect halaman dashboard mana yang sedang aktif
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("student-dashboard-root")) {
      initStudentDashboard();
    }
    if (document.getElementById("teacher-dashboard-root")) {
      initTeacherDashboard();
    }
    if (document.getElementById("admin-dashboard-root")) {
      initAdminDashboard();
    }
  });
}

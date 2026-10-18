/**
 * RUANG LOGIKA — Mesin Evaluasi Kuis Interaktif Berpikir Komputasional (js/quiz.js)
 * Otomatisasi Perhitungan Skor, Validasi Jawaban (Opsi A-E), dan Sinkronisasi Firestore / LocalStorage
 * Pengembang: Yusuf Nurul Huda
 * Warna Utama: #17324D, #22A699, #F4B942, #F5F7FA
 */

import { db, auth, isConfigured } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { saveQuizScoreToFirestore, getCurrentUser } from "./db.js";

// Helper Sanitasi HTML agar bebas ReferenceError dan XSS
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

// ============================================================================
// BANK SOAL BERPIKIR KOMPUTASIONAL: STACK (LIFO) & QUEUE (FIFO) — OPSI A SAMPAI E
// ============================================================================
export const QUIZ_QUESTIONS = [
  {
    id: 1,
    topic: "Karakteristik Mekanis Stack (LIFO)",
    question: "Struktur data Stack menerapkan prinsip Last-In, First-Out (LIFO). Manakah skenario di bawah ini yang paling akurat merepresentasikan penerapan prinsip Stack dalam pemecahan masalah komputasi?",
    options: [
      "Pelayanan tiket pada loket bioskop dengan sistem nomor antrean pertama datang pertama dilayani",
      "Penyimpanan riwayat perintah (Undo Stack) pada teks editor untuk membatalkan aksi pengetikan terakhir",
      "Penjadwalan cetak dokumen oleh server printer lokal secara berurutan sesuai waktu pengiriman",
      "Transmisi paket data video streaming melalui protokol UDP yang diurutkan oleh receiver buffer",
      "Penyimpanan kontak telepon pada buku alamat yang diurutkan menurut abjad nama depan"
    ],
    correctAnswer: 1,
    explanation: "Fitur Undo pada teks editor menerapkan prinsip Stack (LIFO). Setiap aksi pengetikan yang baru saja dilakukan akan di-PUSH ke puncak tumpukan (TOP). Saat pengguna menekan Ctrl+Z (Undo), aksi paling akhir di posisi TOP langsung di-POP untuk dibatalkan terlebih dahulu."
  },
  {
    id: 2,
    topic: "Penelusuran Operasi Stack (Tracing Algorithm)",
    question: "Diberikan sebuah Stack S yang awalnya kosong. Dijalankan serangkaian operasi berikut: PUSH(15), PUSH(24), POP(), PUSH(38), PUSH(42), POP(), PUSH(19). Berapakah nilai elemen pada posisi TOP (puncak) dan berapakah total elemen yang tersisa di dalam Stack saat ini?",
    options: [
      "Nilai TOP = 42 dan sisa elemen = 4",
      "Nilai TOP = 38 dan sisa elemen = 2",
      "Nilai TOP = 19 dan sisa elemen = 3",
      "Nilai TOP = 15 dan sisa elemen = 1",
      "Nilai TOP = 24 dan sisa elemen = 3"
    ],
    correctAnswer: 2,
    explanation: "Penelusuran langkah per langkah:\n1. PUSH(15) → [15]\n2. PUSH(24) → [15, 24]\n3. POP() → 24 keluar, sisa [15]\n4. PUSH(38) → [15, 38]\n5. PUSH(42) → [15, 38, 42]\n6. POP() → 42 keluar, sisa [15, 38]\n7. PUSH(19) → [15, 38, 19].\nMaka nilai TOP = 19 dan jumlah elemen = 3 ([15, 38, 19])."
  },
  {
    id: 3,
    topic: "Karakteristik Mekanis Queue (FIFO)",
    question: "Pada struktur data Queue murni (antrean FIFO), dimanakah operasi penambahan elemen baru (Enqueue) dan pengambilan elemen selesai (Dequeue) harus dilakukan agar asas keterurutan tetap terjaga?",
    options: [
      "Enqueue di FRONT (ujung depan) dan Dequeue di REAR (ujung belakang)",
      "Enqueue di TOP (puncak) dan Dequeue di BOTTOM (dasar)",
      "Enqueue di REAR (ujung belakang) dan Dequeue di FRONT (ujung depan)",
      "Enqueue dan Dequeue keduanya dilakukan secara bebas di sembarang indeks array",
      "Enqueue di posisi tengah (MIDDLE) dan Dequeue di posisi awal (HEAD)"
    ],
    correctAnswer: 2,
    explanation: "Queue memiliki dua titik kendali pointer: elemen baru masuk mengantre melalui ujung belakang (REAR via operasi Enqueue), sedangkan elemen yang paling lama berada di depan dilayani dan dikeluarkan melalui ujung depan (FRONT via operasi Dequeue)."
  },
  {
    id: 4,
    topic: "Penelusuran Operasi Queue (FIFO Simulation)",
    question: "Sebuah antrean Queue Q awalnya kosong. Dijalankan operasi: ENQUEUE('A'), ENQUEUE('B'), DEQUEUE(), ENQUEUE('C'), ENQUEUE('D'), DEQUEUE(), ENQUEUE('E'). Elemen manakah yang saat ini berada di posisi FRONT (terdepan) siap dilayani berikutnya?",
    options: [
      "Elemen 'A'",
      "Elemen 'B'",
      "Elemen 'C'",
      "Elemen 'D'",
      "Elemen 'E'"
    ],
    correctAnswer: 2,
    explanation: "Penelusuran antrean FIFO:\n1. ENQUEUE('A') → [A]\n2. ENQUEUE('B') → [A, B]\n3. DEQUEUE() → 'A' keluar (dilayani), tersisa [B]\n4. ENQUEUE('C') → [B, C]\n5. ENQUEUE('D') → [B, C, D]\n6. DEQUEUE() → 'B' keluar (dilayani), tersisa [C, D]\n7. ENQUEUE('E') → [C, D, E].\nElemen di posisi FRONT (paling depan) saat ini adalah 'C'."
  },
  {
    id: 5,
    topic: "Analisis Batasan Memori (Overflow & Underflow)",
    question: "Kondisi di mana sistem program berusaha menyisipkan data baru ke dalam Stack yang kapasitas memorinya telah mencapai batas maksimal, serta kondisi saat mencoba mengambil data dari Stack yang kosong berturut-turut dinamakan...",
    options: [
      "Deadlock dan Memory Leak",
      "Stack Overflow dan Stack Underflow",
      "Segmentation Fault dan Infinite Loop",
      "Out of Bounds Exception dan Null Pointer Exception",
      "Buffer Starvation dan Thrashing System"
    ],
    correctAnswer: 1,
    explanation: "Stack Overflow adalah kondisi kegagalan sistem ketika program mencoba melakukan PUSH ke dalam wadah memori yang sudah penuh. Sebaliknya, Stack Underflow terjadi saat operasi POP dijalankan pada tumpukan yang sama sekali tidak memiliki elemen (kosong)."
  },
  {
    id: 6,
    topic: "Aplikasi Algoritma: Parsing Ekspresi Matematika",
    question: "Kompilator bahasa pemrograman memanfaatkan Stack untuk memvalidasi keseimbangan tanda kurung (Balanced Parentheses) seperti pada ekspresi '{ [ ( a + b ) * c ] }'. Mengapa Stack sangat tepat untuk fungsi ini?",
    options: [
      "Karena tanda kurung yang dibuka paling terakhir harus ditutup paling pertama sesuai prinsip LIFO",
      "Karena tanda kurung pertama yang dibuka harus ditutup pertama kali sesuai prinsip FIFO",
      "Karena Stack dapat menghitung nilai numerik secara langsung tanpa membaca simbol tanda kurung",
      "Karena Stack mengabaikan seluruh urutan operator dan operand secara otomatis",
      "Karena kapasitas Stack tidak terbatas sehingga tidak memerlukan alokasi memori"
    ],
    correctAnswer: 0,
    explanation: "Setiap kurung buka ('(', '[', '{') di-PUSH ke Stack. Ketika ditemukan kurung tutup, kurung buka paling mutakhir yang berada di posisi TOP di-POP dan dicocokkan jenisnya. Hal ini sesuai dengan hierarki pembungkusan LIFO (yang terakhir dibuka harus pertama ditutup)."
  },
  {
    id: 7,
    topic: "Aplikasi Nyata Queue: Sistem Operasi & Jaringan",
    question: "Fitur antrean cetak dokumen (Printer Spooling) dan penanganan permintaan panggilan (Call Center Queue) dirancang menggunakan Queue karena pertimbangan etika komputasi yaitu...",
    options: [
      "Memberikan prioritas eksklusif bagi dokumen berukuran paling kecil untuk dicetak terlebih dahulu",
      "Menjamin prinsip FCFS (First-Come, First-Served) sehingga tidak ada proses yang mengalami kelaparan (starvation) secara tidak adil",
      "Mengacak urutan dokumen agar beban pemrosesan prosesor terdistribusi secara seimbang",
      "Menyimpan hanya satu berkas dalam memori penyimpanan sementara untuk menghemat biaya RAM",
      "Menghapus dokumen secara otomatis jika waktu cetak melampaui 10 detik"
    ],
    correctAnswer: 1,
    explanation: "Struktur data Queue menjamin prinsip keadilan sistemik First-Come First-Served (FCFS). Permintaan komputasi yang tiba lebih awal wajib dieksekusi lebih dahulu sehingga tidak ada tugas pengguna yang tertahan tanpa batas (starvation) oleh permintaan yang baru tiba."
  },
  {
    id: 8,
    topic: "Komparasi Kritis: Stack vs Queue",
    question: "Perhatikan pernyataan-pernyataan berikut:\n(1) Stack menggunakan satu ujung akses tunggal (TOP) untuk penyisipan dan penghapusan.\n(2) Queue menggunakan dua ujung akses terpisah (FRONT untuk keluar, REAR untuk masuk).\n(3) Stack cocok untuk membalik urutan string (Reverse Algorithm).\n(4) Queue cocok untuk simulasi antrean tiket tol.\nPernyataan yang BENAR mengenai perbedaan Stack dan Queue adalah...",
    options: [
      "Hanya (1) dan (3)",
      "Hanya (2) dan (4)",
      "Hanya (1), (2), dan (3)",
      "Hanya (2), (3), dan (4)",
      "(1), (2), (3), dan (4) semuanya benar"
    ],
    correctAnswer: 4,
    explanation: "Semua pernyataan bernilai BENAR. Stack hanya memanipulasi satu titik ujung (TOP) sehingga membalik urutan data (LIFO), sedangkan Queue memanipulasi dua titik ujung (FRONT dan REAR) sehingga menjaga urutan kedatangan secara konsisten (FIFO)."
  }
];

// State Global Kuis dengan Fallback Bank Soal
export const quizState = {
  questions: (Array.isArray(QUIZ_QUESTIONS) && QUIZ_QUESTIONS.length > 0) ? QUIZ_QUESTIONS : [],
  currentIndex: 0,
  userAnswers: {}, // index soal (0..7) -> index opsi (0..4 untuk A..E)
  timeSpentSeconds: 0,
  timerInterval: null,
  isFinished: false,
  currentUser: null
};

// Inisialisasi Kuis secara Sinkron saat DOM siap (Mencegah tersangkut di status loading)
function runQuizBootstrapper() {
  initQuizEngine();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runQuizBootstrapper);
} else {
  runQuizBootstrapper();
}

/**
 * 1. INISIALISASI MESIN KUIS
 * Render soal ke DOM secara instan dan sinkron
 */
export function initQuizEngine() {
  const quizActivePanel = document.getElementById("quiz-active-panel");
  if (!quizActivePanel) return;

  // Pastikan koleksi butir soal tersedia
  if (!quizState.questions || quizState.questions.length === 0) {
    quizState.questions = QUIZ_QUESTIONS;
  }

  // Reset State Kuis
  quizState.currentIndex = 0;
  quizState.userAnswers = {};
  quizState.timeSpentSeconds = 0;
  quizState.isFinished = false;

  // 1. Render Tampilan Soal Pertama secara SINKRON (0ms, langsung muncul)
  renderCurrentQuestion();

  // 2. Pasang Listener Tombol Navigasi
  setupNavigationButtons();

  // 3. Pasang Listener Tombol Ulangi Kuis
  const restartBtn = document.getElementById("btn-restart-quiz");
  if (restartBtn) {
    restartBtn.onclick = () => restartQuiz();
  }

  // 4. Mulai Timer
  startQuizTimer();

  // 5. Cek Pengguna Aktif secara Asinkron (Non-blocking agar tidak menahan UI)
  try {
    loadCurrentUserProfile();
  } catch (err) {
    console.warn("Profil pengguna kuis dialihkan ke mode latihan:", err);
  }
}

/**
 * Memuat identitas pengguna aktif untuk banner kuis
 */
function loadCurrentUserProfile() {
  const userGreetingEl = document.getElementById("quiz-user-greeting");
  const currentUser = getCurrentUser();

  if (userGreetingEl) {
    if (currentUser && currentUser.uid !== "siswa_demo") {
      userGreetingEl.innerHTML = `Mengerjakan sebagai: <strong class="text-secondary font-bold">${escapeHtml(currentUser.namaLengkap)}</strong> (${escapeHtml(currentUser.email)})`;
    } else {
      userGreetingEl.innerHTML = `Mode Latihan Siswa • <a href="login.html" class="underline text-tertiary-fixed-dim font-bold hover:text-secondary">Masuk Akun</a> untuk mencatat nilai resmi ke Buku Guru`;
    }
  }

  // Dengarkan auth jika aktif
  if (auth) {
    onAuthStateChanged(auth, (user) => {
      if (user && userGreetingEl) {
        userGreetingEl.innerHTML = `Mengerjakan sebagai: <strong class="text-secondary font-bold">${escapeHtml(user.displayName || "Siswa")}</strong> (${escapeHtml(user.email)})`;
      }
    });
  }
}

/**
 * Timer pengerjaan kuis
 */
function startQuizTimer() {
  const timerDisplay = document.getElementById("quiz-timer-display");
  if (!timerDisplay) return;

  clearInterval(quizState.timerInterval);
  quizState.timeSpentSeconds = 0;

  quizState.timerInterval = setInterval(() => {
    if (quizState.isFinished) {
      clearInterval(quizState.timerInterval);
      return;
    }
    quizState.timeSpentSeconds++;
    const minutes = Math.floor(quizState.timeSpentSeconds / 60);
    const seconds = quizState.timeSpentSeconds % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, 1000);
}

/**
 * 2. RENDER PERTANYAAN AKTIF KE DOM
 */
export function renderCurrentQuestion() {
  const q = quizState.questions[quizState.currentIndex];
  const total = quizState.questions.length;

  const progressBar = document.getElementById("quiz-progress-bar");
  const progressText = document.getElementById("quiz-progress-text");
  const questionNumberEl = document.getElementById("quiz-question-number");
  const questionTopicEl = document.getElementById("quiz-question-topic");
  const questionTextEl = document.getElementById("quiz-question-text");
  const optionsContainer = document.getElementById("quiz-options-container");

  // Progress Bar & Soal Info
  const progressPercent = ((quizState.currentIndex + 1) / total) * 100;
  if (progressBar) progressBar.style.width = `${progressPercent}%`;
  if (progressText) progressText.textContent = `Soal ${quizState.currentIndex + 1} dari ${total}`;
  if (questionNumberEl) questionNumberEl.textContent = `${String(quizState.currentIndex + 1).padStart(2, "0")}`;
  if (questionTopicEl) questionTopicEl.textContent = q.topic;
  if (questionTextEl) questionTextEl.textContent = q.question;

  // Render Pilihan Jawaban A, B, C, D, E
  if (optionsContainer) {
    optionsContainer.innerHTML = "";
    const selectedAnswer = quizState.userAnswers[quizState.currentIndex];

    q.options.forEach((optText, optIndex) => {
      const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D, E
      const isSelected = selectedAnswer === optIndex;

      const optButton = document.createElement("button");
      optButton.type = "button";
      optButton.className = `w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-start gap-3.5 group cursor-pointer ${
        isSelected 
          ? "border-secondary bg-secondary-container/20 shadow-sm ring-2 ring-secondary" 
          : "border-outline-variant/40 bg-surface-container-low hover:border-secondary/60 hover:bg-surface-container"
      }`;

      optButton.innerHTML = `
        <div class="w-8 h-8 rounded-lg flex items-center justify-center font-code-block font-bold text-xs shrink-0 transition-colors ${
          isSelected 
            ? "bg-secondary text-on-secondary shadow-xs" 
            : "bg-surface-container-high text-primary group-hover:bg-secondary group-hover:text-on-secondary"
        }">
          ${optionLetter}
        </div>
        <div class="flex-1 pt-1 text-xs sm:text-sm font-medium leading-relaxed ${isSelected ? "text-primary font-bold" : "text-on-surface"}">
          ${escapeHtml(optText)}
        </div>
        <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors ${
          isSelected ? "border-secondary bg-secondary text-on-secondary" : "border-outline-variant/60 group-hover:border-secondary"
        }">
          ${isSelected ? '<span class="material-symbols-outlined text-sm font-bold">check</span>' : ''}
        </div>
      `;

      optButton.addEventListener("click", () => {
        selectOption(optIndex);
      });

      optionsContainer.appendChild(optButton);
    });
  }

  // Update State Tombol & Palet Soal
  updateNavigationState();
  renderQuestionPillNavigator();
}

/**
 * Handle Pemilihan Opsi
 */
function selectOption(optionIndex) {
  quizState.userAnswers[quizState.currentIndex] = optionIndex;
  renderCurrentQuestion();
}

/**
 * Render Palet Nomor Soal (1 .. 8)
 */
function renderQuestionPillNavigator() {
  const container = document.getElementById("quiz-number-pills");
  if (!container) return;

  container.innerHTML = "";
  quizState.questions.forEach((_, idx) => {
    const isAnswered = quizState.userAnswers[idx] !== undefined;
    const isCurrent = quizState.currentIndex === idx;

    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = `w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-code-block text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
      isCurrent 
        ? "bg-primary-container text-tertiary-fixed-dim ring-2 ring-secondary shadow-sm scale-105" 
        : isAnswered 
          ? "bg-secondary text-on-secondary shadow-xs" 
          : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
    }`;
    pill.textContent = idx + 1;
    pill.title = isAnswered ? `Soal ${idx + 1} (Sudah Dijawab)` : `Soal ${idx + 1} (Belum Dijawab)`;

    pill.addEventListener("click", () => {
      quizState.currentIndex = idx;
      renderCurrentQuestion();
    });

    container.appendChild(pill);
  });
}

/**
 * Pasang Listener Tombol Navigasi Sebelumnya, Selanjutnya, Selesai
 */
function setupNavigationButtons() {
  const prevBtn = document.getElementById("btn-prev-question");
  const nextBtn = document.getElementById("btn-next-question");
  const finishBtn = document.getElementById("btn-finish-quiz");

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (quizState.currentIndex > 0) {
        quizState.currentIndex--;
        renderCurrentQuestion();
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (quizState.currentIndex < quizState.questions.length - 1) {
        quizState.currentIndex++;
        renderCurrentQuestion();
      }
    };
  }

  if (finishBtn) {
    finishBtn.onclick = () => {
      confirmAndSubmitQuiz();
    };
  }
}

/**
 * Update State Tombol Navigasi
 */
function updateNavigationState() {
  const prevBtn = document.getElementById("btn-prev-question");
  const nextBtn = document.getElementById("btn-next-question");
  const finishBtn = document.getElementById("btn-finish-quiz");

  const isFirst = quizState.currentIndex === 0;
  const isLast = quizState.currentIndex === quizState.questions.length - 1;

  if (prevBtn) {
    prevBtn.disabled = isFirst;
    prevBtn.classList.toggle("opacity-40", isFirst);
    prevBtn.classList.toggle("cursor-not-allowed", isFirst);
  }

  if (nextBtn) {
    nextBtn.classList.toggle("hidden", isLast);
  }

  if (finishBtn) {
    finishBtn.classList.toggle("hidden", !isLast);
  }
}

/**
 * 3. OTOMATISASI PERHITUNGAN SKOR & SINKRONISASI FIRESTORE
 */
async function confirmAndSubmitQuiz() {
  const total = quizState.questions.length;
  const answeredCount = Object.keys(quizState.userAnswers).length;

  if (answeredCount < total) {
    const confirmIncomplete = window.confirm(
      `Perhatian: Kamu baru menjawab ${answeredCount} dari total ${total} soal. Yakin ingin mengakhiri dan mengirimkan jawaban sekarang?`
    );
    if (!confirmIncomplete) return;
  }

  // Tandai selesai dan hentikan timer
  quizState.isFinished = true;
  clearInterval(quizState.timerInterval);

  // 1. Hitung Skor Otomatis: (Jawaban Benar / Total Soal) * 100
  let correctCount = 0;
  quizState.questions.forEach((q, idx) => {
    if (quizState.userAnswers[idx] === q.correctAnswer) {
      correctCount++;
    }
  });

  const wrongCount = total - correctCount;
  const finalScore = Math.round((correctCount / total) * 100);
  const isCompetent = finalScore >= 75; // KKM Kriteria Ketuntasan: >= 75
  const xpEarned = isCompetent ? 100 : 50;

  // 2. Simpan Riwayat ke Firestore & LocalStorage (progress collection)
  const saveStatusEl = document.getElementById("quiz-save-status");
  if (saveStatusEl) {
    saveStatusEl.innerHTML = `
      <div class="inline-flex items-center gap-2 text-on-surface-variant font-code-block text-xs">
        <span class="w-3.5 h-3.5 rounded-full border-2 border-secondary border-t-transparent animate-spin"></span>
        <span>Menyimpan progres evaluasi ke Cloud Firestore...</span>
      </div>
    `;
  }

  const payload = {
    quizId: "evaluasi-stack-queue-sma",
    quizTitle: "Evaluasi Konsep Stack & Queue SMA",
    score: finalScore,
    totalQuestions: total,
    correctCount: correctCount,
    wrongCount: wrongCount,
    answers: quizState.userAnswers,
    timeSpentSeconds: quizState.timeSpentSeconds,
    passed: isCompetent,
    xpEarned: xpEarned
  };

  let saveResult = { success: false, mode: "local-demo" };
  try {
    saveResult = await saveQuizScoreToFirestore(payload);
  } catch (err) {
    console.warn("Gagal sinkronisasi skor ke Firestore:", err);
  }

  // Update XP Pengguna di Header & LocalStorage
  updateUserXpReward(xpEarned);

  // 3. Tampilkan Result View
  renderQuizResultView(finalScore, correctCount, wrongCount, isCompetent, xpEarned, saveResult);
}

/**
 * Menambahkan XP ke sesi user lokal
 */
function updateUserXpReward(xpEarned) {
  try {
    const userStr = localStorage.getItem("ruanglogika_user");
    if (userStr) {
      const u = JSON.parse(userStr);
      u.xp = (Number(u.xp) || 850) + xpEarned;
      localStorage.setItem("ruanglogika_user", JSON.stringify(u));

      const xpBadges = document.querySelectorAll(".user-display-xp");
      xpBadges.forEach(b => {
        b.textContent = `Level 4 • ${u.xp} XP`;
      });
    }
  } catch (e) {
    console.warn("Gagal update reward XP:", e);
  }
}

/**
 * 4. TAMPILAN RINGKASAN HASIL (RESULT VIEW BERDESAIN RUANG LOGIKA)
 */
function renderQuizResultView(score, correctCount, wrongCount, isCompetent, xpEarned, saveResult) {
  const quizActivePanel = document.getElementById("quiz-active-panel");
  const quizResultPanel = document.getElementById("quiz-result-panel");
  
  if (quizActivePanel) quizActivePanel.classList.add("hidden");
  if (quizResultPanel) quizResultPanel.classList.remove("hidden");

  // Isi Komponen Hasil
  const scoreNumberEl = document.getElementById("result-score-number");
  const scoreBadgeEl = document.getElementById("result-score-badge");
  const scoreMsgEl = document.getElementById("result-score-message");
  const correctCountEl = document.getElementById("result-correct-count");
  const wrongCountEl = document.getElementById("result-wrong-count");
  const timeSpentEl = document.getElementById("result-time-spent");
  const saveStatusEl = document.getElementById("quiz-save-status");
  const xpBadgeContainer = document.getElementById("result-xp-reward-badge");

  if (scoreNumberEl) scoreNumberEl.textContent = score;
  if (correctCountEl) correctCountEl.textContent = `${correctCount} Soal`;
  if (wrongCountEl) wrongCountEl.textContent = `${wrongCount} Soal`;
  
  const minutes = Math.floor(quizState.timeSpentSeconds / 60);
  const seconds = quizState.timeSpentSeconds % 60;
  if (timeSpentEl) timeSpentEl.textContent = `${minutes}m ${seconds}s`;

  // Kategori Ketuntasan (KKM >= 75)
  if (scoreBadgeEl && scoreMsgEl) {
    if (isCompetent) {
      scoreBadgeEl.className = "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary text-on-secondary font-headline-md text-xs font-bold uppercase tracking-wider shadow-sm";
      scoreBadgeEl.innerHTML = '<span class="material-symbols-outlined text-base">verified</span> Kategori: Kompeten (Tuntas)';
      scoreMsgEl.textContent = "Luar biasa! Capaian kompetensi Berpikir Komputasionalmu telah memenuhi standar kelulusan KKM (≥ 75). Pemahamanmu pada konsep Stack (LIFO) dan Queue (FIFO) sangat kokoh.";
    } else {
      scoreBadgeEl.className = "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-600 text-white font-headline-md text-xs font-bold uppercase tracking-wider shadow-sm";
      scoreBadgeEl.innerHTML = '<span class="material-symbols-outlined text-base">replay</span> Kategori: Perlu Remediasi';
      scoreMsgEl.textContent = "Skor evaluasimu belum melampaui KKM (≥ 75). Jangan cemas, pelajari kembali ulasan pada setiap butir soal di bawah dan coba eksplorasi laboratorium virtual sebelum mengulang kuis.";
    }
  }

  // Tampilkan Perolehan XP Reward
  if (xpBadgeContainer) {
    xpBadgeContainer.innerHTML = `
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-container-lowest/15 border border-white/20 text-tertiary-fixed-dim font-code-block text-xs font-bold">
        <span class="material-symbols-outlined text-base">military_tech</span>
        <span>+${xpEarned} XP Berhasil Ditambahkan ke Profilmu!</span>
      </div>
    `;
  }

  // Status Penyimpanan Cloud
  if (saveStatusEl) {
    if (saveResult && saveResult.mode === "firestore") {
      saveStatusEl.innerHTML = `
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-medium">
          <span class="material-symbols-outlined text-sm">cloud_done</span>
          <span>Tersimpan permanen di Cloud Firestore (Doc ID: ${saveResult.docId.slice(0, 8)}...)</span>
        </div>
      `;
    } else {
      saveStatusEl.innerHTML = `
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white/90 text-xs font-medium">
          <span class="material-symbols-outlined text-sm">save</span>
          <span>Tersimpan di Riwayat Sesi Lokal (Otomatis tercatat pada Dashboard Siswa &amp; Guru).</span>
        </div>
      `;
    }
  }

  // Render Rincian Pembahasan Setiap Soal
  renderQuizReviewBreakdown();

  // Scroll ke atas dengan mulus
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * 5. REVIEW & PEMBAHASAN SINGKAT SETIAP NOMOR
 */
function renderQuizReviewBreakdown() {
  const container = document.getElementById("quiz-review-container");
  if (!container) return;

  container.innerHTML = "";

  quizState.questions.forEach((q, idx) => {
    const userAnswer = quizState.userAnswers[idx];
    const isCorrect = userAnswer === q.correctAnswer;
    const isUnanswered = userAnswer === undefined;

    const reviewCard = document.createElement("div");
    reviewCard.className = `p-5 rounded-2xl border text-xs sm:text-sm flex flex-col gap-3 ${
      isCorrect 
        ? "bg-secondary-container/15 border-secondary/30" 
        : "bg-rose-50 border-rose-200"
    }`;

    reviewCard.innerHTML = `
      <div class="flex items-center justify-between gap-3 pb-2 border-b ${isCorrect ? "border-secondary/20" : "border-rose-200"}">
        <div class="flex items-center gap-2">
          <span class="font-code-block font-bold text-xs px-2.5 py-0.5 rounded-lg ${
            isCorrect ? "bg-secondary text-on-secondary" : "bg-rose-600 text-white"
          }">
            Soal ${idx + 1}
          </span>
          <span class="text-xs font-semibold text-on-surface-variant font-headline-md">${escapeHtml(q.topic)}</span>
        </div>
        <span class="inline-flex items-center gap-1 font-bold text-xs ${isCorrect ? "text-secondary" : "text-rose-700"}">
          <span class="material-symbols-outlined text-base">${isCorrect ? "check_circle" : "cancel"}</span>
          <span>${isCorrect ? "Jawaban Tepat (+12.5 Poin)" : isUnanswered ? "Tidak Dijawab (0 Poin)" : "Kurang Tepat (0 Poin)"}</span>
        </span>
      </div>

      <div class="font-headline-md font-bold text-primary leading-relaxed text-xs sm:text-sm">
        ${escapeHtml(q.question)}
      </div>

      <div class="flex flex-col gap-1 text-xs">
        <div class="flex items-start gap-1 text-on-surface">
          <strong class="shrink-0 text-slate-500">Jawaban Anda:</strong>
          <span class="${isCorrect ? "text-secondary font-bold" : "text-rose-700 font-bold"}">
            ${isUnanswered ? "Tidak dijawab" : `${String.fromCharCode(65 + userAnswer)}. ${escapeHtml(q.options[userAnswer])}`}
          </span>
        </div>
        ${!isCorrect ? `
          <div class="flex items-start gap-1 text-secondary">
            <strong class="shrink-0 text-primary">Kunci Jawaban Benar:</strong>
            <span class="font-bold">${String.fromCharCode(65 + q.correctAnswer)}. ${escapeHtml(q.options[q.correctAnswer])}</span>
          </div>
        ` : ''}
      </div>

      <div class="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface leading-relaxed">
        <div class="font-headline-md font-bold text-primary flex items-center gap-1.5 mb-1">
          <span class="material-symbols-outlined text-secondary text-sm">tips_and_updates</span>
          <span>Pembahasan Analisis Konseptual:</span>
        </div>
        <p class="font-body-sm text-on-surface-variant">${escapeHtml(q.explanation)}</p>
      </div>
    `;

    container.appendChild(reviewCard);
  });
}

/**
 * 6. RESET & ULANGI KUIS
 */
export function restartQuiz() {
  quizState.currentIndex = 0;
  quizState.userAnswers = {};
  quizState.timeSpentSeconds = 0;
  quizState.isFinished = false;

  const quizActivePanel = document.getElementById("quiz-active-panel");
  const quizResultPanel = document.getElementById("quiz-result-panel");
  
  if (quizActivePanel) quizActivePanel.classList.remove("hidden");
  if (quizResultPanel) quizResultPanel.classList.add("hidden");

  startQuizTimer();
  renderCurrentQuestion();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Pasang Listener tombol Ulangi Kuis
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    const restartBtn = document.getElementById("btn-restart-quiz");
    if (restartBtn) {
      restartBtn.addEventListener("click", () => restartQuiz());
    }
  });
}

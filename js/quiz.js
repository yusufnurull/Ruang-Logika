/**
 * RUANG LOGIKA — Mesin Evaluasi Kuis Interaktif (js/quiz.js)
 * Perhitungan Skor Otomatis & Penyimpanan ke Koleksi 'progress' Firestore
 * Menggunakan Firebase Web Modular SDK v9+
 * Pengembang: Yusuf Nurul Huda
 */

import { db, auth, isConfigured } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { saveQuizScoreToFirestore } from "./db.js";

// ==========================================
// BANK SOAL EVALUASI: STACK & QUEUE (SMA)
// ==========================================
export const QUIZ_QUESTIONS = [
  {
    id: 1,
    topic: "Konsep Dasar Stack",
    question: "Prinsip kerja struktur data Stack adalah LIFO (Last In, First Out). Manakah dari analogi kehidupan sehari-hari berikut yang paling tepat merepresentasikan Stack?",
    options: [
      "Antrean pembeli tiket kereta api di stasiun",
      "Tumpukan piring bersih di meja prasmanan",
      "Panggilan masuk pada pusat layanan pelanggan (call center)",
      "Mobil-mobil yang melintasi jalan tol satu arah tanpa mendahului"
    ],
    correctAnswer: 1,
    explanation: "Pada tumpukan piring, piring yang terakhir kali dicuci dan diletakkan di posisi paling atas (Last In) akan menjadi piring pertama yang diambil oleh pengunjung untuk makan (First Out)."
  },
  {
    id: 2,
    topic: "Penelusuran Operasi Stack",
    question: "Diberikan sebuah Stack kosong. Dilakukan serangkaian operasi berikut berurutan: PUSH(12), PUSH(25), POP(), PUSH(30), PUSH(45), POP(). Nilai elemen yang kini berada pada posisi puncak (TOP) adalah...",
    options: [
      "12",
      "25",
      "30",
      "45"
    ],
    correctAnswer: 2,
    explanation: "Mari kita telusuri: PUSH(12) -> [12]; PUSH(25) -> [12, 25]; POP() mengeluarkan 25 -> [12]; PUSH(30) -> [12, 30]; PUSH(45) -> [12, 30, 45]; POP() mengeluarkan 45 -> tersisa [12, 30]. Posisi TOP saat ini bernilai 30."
  },
  {
    id: 3,
    topic: "Prinsip Kerja Queue",
    question: "Pada struktur data Queue (antrean FIFO), proses penambahan elemen baru selalu dilakukan pada ujung ... sedangkan proses pengambilan/penghapusan elemen dilakukan pada ujung ...",
    options: [
      "FRONT (Depan) ; REAR (Belakang)",
      "TOP (Puncak) ; BOTTOM (Dasar)",
      "REAR (Belakang) ; FRONT (Depan)",
      "HEAD (Kepala) ; MIDDLE (Tengah)"
    ],
    correctAnswer: 2,
    explanation: "Queue memiliki dua pintu: elemen baru masuk mengantre dari belakang (REAR via Enqueue), dan elemen terdepan yang telah selesai dilayani keluar dari depan (FRONT via Dequeue)."
  },
  {
    id: 4,
    topic: "Studi Kasus Sistem Komputer",
    question: "Dalam sistem operasi komputer modern, fitur antrean pencetakan dokumen (Printer Spooling) dan penjadwalan proses CPU (Task Scheduling) menggunakan struktur data Queue karena...",
    options: [
      "Data yang masuk belakangan harus diprioritaskan lebih dulu untuk efisiensi",
      "Menjamin keadilan pelayanan: dokumen atau tugas yang datang pertama kali akan dieksekusi pertama kali (First Come, First Served)",
      "Membutuhkan memori yang paling sedikit dibandingkan semua struktur data lain",
      "Hanya mengizinkan satu elemen yang disimpan dalam satu waktu"
    ],
    correctAnswer: 1,
    explanation: "Queue menganut FIFO (First In First Out), menjamin keadilan sistem di mana tugas yang masuk ke antrean lebih awal diselesaikan terlebih dahulu tanpa diserobot tugas baru."
  },
  {
    id: 5,
    topic: "Analisis Batasan Memori (Overflow & Underflow)",
    question: "Jika sebuah program mencoba mengambil elemen dari struktur data yang sedang kosong (misalnya menjalankan operasi POP() pada Stack yang tidak berisi elemen), maka kondisi ini disebut sebagai...",
    options: [
      "Stack Overflow",
      "Stack Underflow",
      "Memory Leak",
      "Deadlock System"
    ],
    correctAnswer: 1,
    explanation: "Underflow terjadi saat program mencoba mengambil/menghapus data dari tumpukan atau antrean yang sudah kosong. Sebaliknya, Overflow terjadi saat mencoba menyisipkan data ke wadah yang memorinya telah penuh."
  }
];

// State Kuis
const quizState = {
  questions: QUIZ_QUESTIONS,
  currentIndex: 0,
  userAnswers: {}, // index soal -> index jawaban terpilih
  timeSpentSeconds: 0,
  timerInterval: null,
  isFinished: false,
  currentUser: null
};

/**
 * Inisialisasi Kuis saat Halaman Siap
 */
export function initQuizEngine() {
  const quizCard = document.getElementById("quiz-card");
  if (!quizCard) return;

  // Dengarkan autentikasi Firebase
  if (auth) {
    onAuthStateChanged(auth, (user) => {
      quizState.currentUser = user;
      updateUserBadge(user);
    });
  } else {
    // Mode demo / local
    const localUserStr = localStorage.getItem("ruanglogika_auth_user");
    if (localUserStr) {
      quizState.currentUser = JSON.parse(localUserStr);
      updateUserBadge(quizState.currentUser);
    }
  }

  // Mulai Timer
  startQuizTimer();

  // Render Soal Pertama
  renderCurrentQuestion();

  // Pasang Event Listeners
  setupNavigationButtons();
}

/**
 * Update info nama user di banner kuis
 */
function updateUserBadge(user) {
  const userGreetingEl = document.getElementById("quiz-user-greeting");
  if (!userGreetingEl) return;
  if (user) {
    const nama = user.displayName || user.namaLengkap || "Siswa";
    userGreetingEl.innerHTML = `Mengerjakan sebagai: <strong class="text-[#22A699]">${escapeHtml(nama)}</strong>`;
  } else {
    userGreetingEl.innerHTML = `Mode Tamu • <a href="login.html" class="underline text-[#F4B942]">Masuk</a> untuk simpan sertifikat`;
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
 * Render Soal Aktif ke DOM
 */
export function renderCurrentQuestion() {
  const q = quizState.questions[quizState.currentIndex];
  const total = quizState.questions.length;

  // Update Progress Bar & Counter
  const progressPercent = ((quizState.currentIndex + 1) / total) * 100;
  const progressBar = document.getElementById("quiz-progress-bar");
  const progressText = document.getElementById("quiz-progress-text");
  const questionNumberEl = document.getElementById("quiz-question-number");
  const questionTopicEl = document.getElementById("quiz-question-topic");
  const questionTextEl = document.getElementById("quiz-question-text");
  const optionsContainer = document.getElementById("quiz-options-container");

  if (progressBar) progressBar.style.width = `${progressPercent}%`;
  if (progressText) progressText.textContent = `Soal ${quizState.currentIndex + 1} dari ${total}`;
  if (questionNumberEl) questionNumberEl.textContent = `0${quizState.currentIndex + 1}`;
  if (questionTopicEl) questionTopicEl.textContent = q.topic;
  if (questionTextEl) questionTextEl.textContent = q.question;

  // Render Pilihan Jawaban
  if (optionsContainer) {
    optionsContainer.innerHTML = "";
    const selectedAnswer = quizState.userAnswers[quizState.currentIndex];

    q.options.forEach((optText, optIndex) => {
      const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D
      const isSelected = selectedAnswer === optIndex;

      const optButton = document.createElement("button");
      optButton.type = "button";
      optButton.className = `w-full p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-4 group ${
        isSelected 
          ? "border-[#22A699] bg-[#22A699]/10 shadow-md ring-2 ring-[#22A699]/40" 
          : "border-slate-200 bg-white hover:border-[#22A699]/50 hover:bg-slate-50"
      }`;

      optButton.innerHTML = `
        <div class="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 transition-all ${
          isSelected 
            ? "bg-[#22A699] text-white shadow-sm" 
            : "bg-slate-100 text-slate-600 group-hover:bg-[#22A699] group-hover:text-white"
        }">
          ${optionLetter}
        </div>
        <div class="flex-1 pt-1.5 text-sm sm:text-base font-medium ${isSelected ? "text-[#17324D] font-bold" : "text-slate-700"}">
          ${escapeHtml(optText)}
        </div>
        <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1.5 transition-all ${
          isSelected ? "border-[#22A699] bg-[#22A699] text-white" : "border-slate-300 group-hover:border-[#22A699]"
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

  // Update Navigasi Tombol
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
 * Navigasi Pill Soal (1, 2, 3, 4, 5)
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
    pill.className = `w-10 h-10 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center ${
      isCurrent 
        ? "bg-[#17324D] text-[#F4B942] ring-2 ring-[#22A699] shadow-md scale-105" 
        : isAnswered 
          ? "bg-[#22A699] text-white shadow-sm" 
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
    }`;
    pill.textContent = idx + 1;
    pill.title = isAnswered ? `Soal ${idx + 1} (Terjawab)` : `Soal ${idx + 1} (Belum dijawab)`;

    pill.addEventListener("click", () => {
      quizState.currentIndex = idx;
      renderCurrentQuestion();
    });

    container.appendChild(pill);
  });
}

/**
 * Atur Tombol Sebelumnya & Selanjutnya
 */
function setupNavigationButtons() {
  const prevBtn = document.getElementById("btn-prev-question");
  const nextBtn = document.getElementById("btn-next-question");
  const finishBtn = document.getElementById("btn-finish-quiz");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (quizState.currentIndex > 0) {
        quizState.currentIndex--;
        renderCurrentQuestion();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (quizState.currentIndex < quizState.questions.length - 1) {
        quizState.currentIndex++;
        renderCurrentQuestion();
      }
    });
  }

  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      confirmAndSubmitQuiz();
    });
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
 * Konfirmasi dan Hitung Nilai Otomatis & Simpan ke Firestore
 */
async function confirmAndSubmitQuiz() {
  const total = quizState.questions.length;
  const answeredCount = Object.keys(quizState.userAnswers).length;

  if (answeredCount < total) {
    const confirmIncomplete = window.confirm(
      `Kamu baru menjawab ${answeredCount} dari ${total} soal. Yakin ingin menyelesaikan kuis sekarang?`
    );
    if (!confirmIncomplete) return;
  }

  // Tandai selesai
  quizState.isFinished = true;
  clearInterval(quizState.timerInterval);

  // 1. HITUNG SKOR OTOMATIS
  let correctCount = 0;
  quizState.questions.forEach((q, idx) => {
    if (quizState.userAnswers[idx] === q.correctAnswer) {
      correctCount++;
    }
  });

  const wrongCount = total - correctCount;
  const finalScore = Math.round((correctCount / total) * 100);

  // 2. SIMPAN HASIL KE FIRESTORE (Koleksi 'progress')
  const saveStatusEl = document.getElementById("quiz-save-status");
  if (saveStatusEl) {
    saveStatusEl.innerHTML = `<span class="inline-flex items-center gap-2 text-slate-500 font-mono text-xs">
      <span class="w-3 h-3 rounded-full border-2 border-[#22A699] border-t-transparent animate-spin"></span>
      Menyimpan progres ke Cloud Firestore...
    </span>`;
  }

  const payload = {
    quizId: "evaluasi-stack-queue-sma",
    quizTitle: "Evaluasi Konsep Stack & Queue SMA",
    score: finalScore,
    totalQuestions: total,
    correctCount: correctCount,
    wrongCount: wrongCount,
    answers: quizState.userAnswers,
    timeSpentSeconds: quizState.timeSpentSeconds
  };

  let saveResult = { success: false, mode: "local-demo" };
  try {
    saveResult = await saveQuizScoreToFirestore(payload);
  } catch (err) {
    console.warn("Error saat memanggil saveQuizScoreToFirestore:", err);
  }

  // 3. TAMPILKAN PANEL HASIL EVALUASI
  renderQuizResultView(finalScore, correctCount, wrongCount, saveResult);
}

/**
 * Tampilkan Tampilan Hasil Kuis
 */
function renderQuizResultView(score, correctCount, wrongCount, saveResult) {
  const quizActivePanel = document.getElementById("quiz-active-panel");
  const quizResultPanel = document.getElementById("quiz-result-panel");
  
  if (quizActivePanel) quizActivePanel.classList.add("hidden");
  if (quizResultPanel) quizResultPanel.classList.remove("hidden");

  // Isi Data Hasil
  const scoreNumberEl = document.getElementById("result-score-number");
  const scoreBadgeEl = document.getElementById("result-score-badge");
  const scoreMsgEl = document.getElementById("result-score-message");
  const correctCountEl = document.getElementById("result-correct-count");
  const wrongCountEl = document.getElementById("result-wrong-count");
  const timeSpentEl = document.getElementById("result-time-spent");
  const saveStatusEl = document.getElementById("quiz-save-status");

  if (scoreNumberEl) scoreNumberEl.textContent = score;
  if (correctCountEl) correctCountEl.textContent = `${correctCount} Soal`;
  if (wrongCountEl) wrongCountEl.textContent = `${wrongCount} Soal`;
  
  const minutes = Math.floor(quizState.timeSpentSeconds / 60);
  const seconds = quizState.timeSpentSeconds % 60;
  if (timeSpentEl) timeSpentEl.textContent = `${minutes}m ${seconds}s`;

  // Feedback Pesan Nilai
  if (scoreBadgeEl && scoreMsgEl) {
    if (score >= 80) {
      scoreBadgeEl.className = "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider";
      scoreBadgeEl.innerHTML = '<span class="material-symbols-outlined text-sm">verified</span> Sangat Kompeten';
      scoreMsgEl.textContent = "Luar biasa! Kamu telah menguasai konsep dasar Stack dan Queue dengan pemahaman yang sangat mendalam.";
    } else if (score >= 60) {
      scoreBadgeEl.className = "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#F4B942]/20 text-[#17324D] text-xs font-black uppercase tracking-wider";
      scoreBadgeEl.innerHTML = '<span class="material-symbols-outlined text-sm">thumb_up</span> Cukup Kompeten';
      scoreMsgEl.textContent = "Bagus! Kamu sudah memahami konsep utamanya, namun silakan coba simulasi di Laboratorium lagi untuk memperkuat pemahaman.";
    } else {
      scoreBadgeEl.className = "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-wider";
      scoreBadgeEl.innerHTML = '<span class="material-symbols-outlined text-sm">replay</span> Perlu Remediasi';
      scoreMsgEl.textContent = "Jangan patah semangat! Pelajari kembali materi Stack dan Queue, lalu coba ulangi kuis ini untuk meningkatkan nilai.";
    }
  }

  // Status Firebase
  if (saveStatusEl) {
    if (saveResult.mode === "firestore") {
      saveStatusEl.innerHTML = `
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <span class="material-symbols-outlined text-sm">cloud_done</span>
          Skor berhasil tersimpan di Cloud Firestore (ID: ${saveResult.docId.slice(0, 8)}...)
        </div>
      `;
    } else {
      saveStatusEl.innerHTML = `
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          <span class="material-symbols-outlined text-sm">save</span>
          Skor tersimpan di Penyimpanan Sesi Lokal (Siap disinkronkan saat online).
        </div>
      `;
    }
  }

  // Render Rincian Pembahasan
  renderQuizReviewBreakdown();
}

/**
 * Render Pembahasan Soal
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
    reviewCard.className = `p-5 rounded-2xl border ${
      isCorrect ? "bg-emerald-50/50 border-emerald-200" : "bg-rose-50/50 border-rose-200"
    } text-sm space-y-3`;

    reviewCard.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="font-mono font-bold text-xs px-2.5 py-1 rounded-lg ${
            isCorrect ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"
          }">
            Soal ${idx + 1}
          </span>
          <span class="text-xs font-mono text-slate-500">${escapeHtml(q.topic)}</span>
        </div>
        <span class="inline-flex items-center gap-1 font-bold text-xs ${isCorrect ? "text-emerald-700" : "text-rose-700"}">
          <span class="material-symbols-outlined text-sm">${isCorrect ? "check_circle" : "cancel"}</span>
          ${isCorrect ? "Benar (+20 Poin)" : isUnanswered ? "Tidak Dijawab (0 Poin)" : "Salah (0 Poin)"}
        </span>
      </div>

      <div class="font-semibold text-[#17324D] leading-snug">
        ${escapeHtml(q.question)}
      </div>

      <div class="space-y-1 text-xs">
        <div class="text-slate-600">
          <strong>Jawabanmu:</strong> 
          <span class="${isCorrect ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}">
            ${isUnanswered ? "Tidak dijawab" : `${String.fromCharCode(65 + userAnswer)}. ${escapeHtml(q.options[userAnswer])}`}
          </span>
        </div>
        ${!isCorrect ? `
          <div class="text-emerald-800">
            <strong>Kunci Jawaban Benar:</strong> 
            <span class="font-bold">${String.fromCharCode(65 + q.correctAnswer)}. ${escapeHtml(q.options[q.correctAnswer])}</span>
          </div>
        ` : ''}
      </div>

      <div class="p-3 rounded-xl bg-white/80 border border-slate-200 text-xs text-slate-600 leading-relaxed">
        <strong class="text-[#17324D] flex items-center gap-1 mb-1">
          <span class="material-symbols-outlined text-sm text-[#22A699]">info</span>
          Pembahasan Analisis:
        </strong>
        ${escapeHtml(q.explanation)}
      </div>
    `;

    container.appendChild(reviewCard);
  });
}

/**
 * Reset Kuis untuk Mengulang
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

// Auto init saat DOM ready
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    initQuizEngine();
    
    const restartBtn = document.getElementById("btn-restart-quiz");
    if (restartBtn) {
      restartBtn.addEventListener("click", () => restartQuiz());
    }
  });
}

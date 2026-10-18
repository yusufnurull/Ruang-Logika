/**
 * RUANG LOGIKA — Interactive Challenge Engine (js/challenge.js)
 * Aktivitas Interaktif Pemecahan Masalah Algoritma (Studi Kasus 1 & 2) & Umpan Balik Instan
 * Menggunakan Desain Ruang Logika (Navy #17324D, Teal #22A699, Amber #F4B942)
 * Pengembang: Yusuf Nurul Huda
 */

import { auth, db, isConfigured } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// State Tantangan Interaktif
export const ChallengeEngine = {
  totalXP: 850,
  completedChallenges: new Set(),
  
  // Kasus 1: Antrean Kantin Sekolah (Queue - FIFO)
  case1: {
    selectedDataStructure: null,
    selectedOperationFlow: null,
    correctDataStructure: "queue",
    correctOperationFlow: "enqueue-dequeue",
    title: "Kasus 1: Antrean Loket Kantin Sekolah",
    explanation: "Kantin sekolah memerlukan keadilan mutlak: siapa yang datang lebih dulu harus dilayani lebih dulu (First-In, First-Out / FIFO). Siswa baru datang mengantre di posisi REAR melalui operasi ENQUEUE, sedangkan makanan diserahkan kepada siswa terdepan di posisi FRONT melalui operasi DEQUEUE.",
    hint: "Pikirkan asas keadilan pelayanan: Orang yang tiba lebih awal wajib menerima pesanan terlebih dahulu. Struktur data apa yang memiliki pintu masuk di belakang (REAR) dan pintu keluar di depan (FRONT)?"
  },

  // Kasus 2: Fitur Undo/Redo Teks Editor (Stack - LIFO)
  case2: {
    selectedDataStructure: null,
    selectedOperationFlow: null,
    correctDataStructure: "stack",
    correctOperationFlow: "push-pop",
    title: "Kasus 2: Riwayat Pembatalan (Undo) Teks Editor",
    explanation: "Fitur Undo pada perangkat lunak pengolah kata bekerja dengan prinsip Last-In, First-Out (LIFO). Setiap karakter atau perintah pengetikan terbaru di-PUSH ke puncak tumpukan (TOP). Saat pengguna menekan Ctrl+Z (Undo), aksi paling akhir di TOP langsung di-POP untuk dibatalkan terlebih dahulu.",
    hint: "Perhatikan urutan pembatalan: Jika kamu mengetik 'Halo' lalu 'Dunia', saat tombol Undo ditekan, kata 'Dunia' yang harus lenyap duluan. Struktur data apa yang mengeluarkan elemen terakhir masuk terlebih dahulu?"
  }
};

// Inisialisasi saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  loadSavedChallengeProgress();
  initCase1Interactivity();
  initCase2Interactivity();
  initModalListeners();
  initMiniSimulators();
});

/**
 * Memuat progres tantangan tersimpan dari LocalStorage
 */
function loadSavedChallengeProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("ruanglogika_completed_challenges") || "[]");
    saved.forEach(id => {
      ChallengeEngine.completedChallenges.add(id);
      updateCaseStatusBadge(id, true);
    });

    const userStr = localStorage.getItem("ruanglogika_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.xp) ChallengeEngine.totalXP = Number(user.xp);
    }
  } catch (e) {
    console.warn("Gagal memuat progres tantangan lokal:", e);
  }
}

/**
 * 1. INTERAKTIVITAS KASUS 1: ANTREAN KANTIN (QUEUE - FIFO)
 */
function initCase1Interactivity() {
  // Pilihan Struktur Data Kasus 1
  const dsButtons = document.querySelectorAll(".case1-ds-option");
  dsButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      dsButtons.forEach(b => {
        b.classList.remove("border-secondary", "bg-secondary-container/20", "ring-2", "ring-secondary");
        b.classList.add("border-outline-variant/40", "bg-surface-container-low");
        const checkIcon = b.querySelector(".selection-check");
        if (checkIcon) checkIcon.classList.add("opacity-0");
      });
      btn.classList.remove("border-outline-variant/40", "bg-surface-container-low");
      btn.classList.add("border-secondary", "bg-secondary-container/20", "ring-2", "ring-secondary");
      const activeCheck = btn.querySelector(".selection-check");
      if (activeCheck) activeCheck.classList.remove("opacity-0");

      ChallengeEngine.case1.selectedDataStructure = btn.dataset.value;
      updateCase1ReviewPreview();
    });
  });

  // Pilihan Alur Operasi Kasus 1
  const opButtons = document.querySelectorAll(".case1-op-option");
  opButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      opButtons.forEach(b => {
        b.classList.remove("border-secondary", "bg-secondary-container/20", "ring-2", "ring-secondary");
        b.classList.add("border-outline-variant/40", "bg-surface-container-low");
        const checkIcon = b.querySelector(".selection-check");
        if (checkIcon) checkIcon.classList.add("opacity-0");
      });
      btn.classList.remove("border-outline-variant/40", "bg-surface-container-low");
      btn.classList.add("border-secondary", "bg-secondary-container/20", "ring-2", "ring-secondary");
      const activeCheck = btn.querySelector(".selection-check");
      if (activeCheck) activeCheck.classList.remove("opacity-0");

      ChallengeEngine.case1.selectedOperationFlow = btn.dataset.value;
      updateCase1ReviewPreview();
    });
  });

  // Tombol Kirim Jawaban Kasus 1
  const btnSubmit1 = document.getElementById("btn-submit-case1");
  if (btnSubmit1) {
    btnSubmit1.addEventListener("click", () => {
      if (!ChallengeEngine.case1.selectedDataStructure || !ChallengeEngine.case1.selectedOperationFlow) {
        showFeedbackModal({
          status: "incomplete",
          title: "Pilihan Belum Lengkap",
          message: "Harap tentukan satu Struktur Data dan satu Alur Operasi Logika sebelum mengirimkan analisis jawaban.",
          hint: "Klik salah satu kartu Struktur Data dan salah satu kartu Alur Operasi di atas."
        });
        return;
      }

      const isDsCorrect = ChallengeEngine.case1.selectedDataStructure === ChallengeEngine.case1.correctDataStructure;
      const isOpCorrect = ChallengeEngine.case1.selectedOperationFlow === ChallengeEngine.case1.correctOperationFlow;

      if (isDsCorrect && isOpCorrect) {
        handleChallengeSuccess("case1", 50);
      } else {
        showFeedbackModal({
          status: "error",
          title: "Coba Analisis Lagi",
          message: "Kombinasi struktur data atau urutan operasi yang kamu pilih belum tepat untuk menyelesaikan masalah antrean kantin yang adil.",
          hint: ChallengeEngine.case1.hint
        });
      }
    });
  }
}

function updateCase1ReviewPreview() {
  const previewBox = document.getElementById("case1-selection-preview");
  if (!previewBox) return;

  const ds = ChallengeEngine.case1.selectedDataStructure;
  const op = ChallengeEngine.case1.selectedOperationFlow;

  const dsText = ds === "queue" ? "Queue (FIFO)" : ds === "stack" ? "Stack (LIFO)" : ds === "array" ? "Array Statis" : "Belum dipilih";
  const opText = op === "enqueue-dequeue" ? "Enqueue [REAR] & Dequeue [FRONT]" : op === "push-pop" ? "Push & Pop [TOP]" : op === "reverse" ? "Enqueue [FRONT] & Dequeue [REAR]" : "Belum dipilih";

  previewBox.innerHTML = `
    <span class="text-on-surface-variant">Struktur: <strong class="text-primary">${dsText}</strong></span>
    <span class="mx-1 text-slate-300">•</span>
    <span class="text-on-surface-variant">Operasi: <strong class="text-secondary">${opText}</strong></span>
  `;
}

/**
 * 2. INTERAKTIVITAS KASUS 2: UNDO/REDO TEKS EDITOR (STACK - LIFO)
 */
function initCase2Interactivity() {
  // Pilihan Struktur Data Kasus 2
  const dsButtons = document.querySelectorAll(".case2-ds-option");
  dsButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      dsButtons.forEach(b => {
        b.classList.remove("border-secondary", "bg-secondary-container/20", "ring-2", "ring-secondary");
        b.classList.add("border-outline-variant/40", "bg-surface-container-low");
        const checkIcon = b.querySelector(".selection-check");
        if (checkIcon) checkIcon.classList.add("opacity-0");
      });
      btn.classList.remove("border-outline-variant/40", "bg-surface-container-low");
      btn.classList.add("border-secondary", "bg-secondary-container/20", "ring-2", "ring-secondary");
      const activeCheck = btn.querySelector(".selection-check");
      if (activeCheck) activeCheck.classList.remove("opacity-0");

      ChallengeEngine.case2.selectedDataStructure = btn.dataset.value;
      updateCase2ReviewPreview();
    });
  });

  // Pilihan Mekanisme Operasi Kasus 2
  const opButtons = document.querySelectorAll(".case2-op-option");
  opButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      opButtons.forEach(b => {
        b.classList.remove("border-secondary", "bg-secondary-container/20", "ring-2", "ring-secondary");
        b.classList.add("border-outline-variant/40", "bg-surface-container-low");
        const checkIcon = b.querySelector(".selection-check");
        if (checkIcon) checkIcon.classList.add("opacity-0");
      });
      btn.classList.remove("border-outline-variant/40", "bg-surface-container-low");
      btn.classList.add("border-secondary", "bg-secondary-container/20", "ring-2", "ring-secondary");
      const activeCheck = btn.querySelector(".selection-check");
      if (activeCheck) activeCheck.classList.remove("opacity-0");

      ChallengeEngine.case2.selectedOperationFlow = btn.dataset.value;
      updateCase2ReviewPreview();
    });
  });

  // Tombol Kirim Jawaban Kasus 2
  const btnSubmit2 = document.getElementById("btn-submit-case2");
  if (btnSubmit2) {
    btnSubmit2.addEventListener("click", () => {
      if (!ChallengeEngine.case2.selectedDataStructure || !ChallengeEngine.case2.selectedOperationFlow) {
        showFeedbackModal({
          status: "incomplete",
          title: "Pilihan Belum Lengkap",
          message: "Harap pilih satu Struktur Data dan satu Mekanisme Operasi sebelum memvalidasi jawaban.",
          hint: "Klik kartu struktur data dan kartu mekanisme logika yang menurutmu tepat untuk sistem Undo."
        });
        return;
      }

      const isDsCorrect = ChallengeEngine.case2.selectedDataStructure === ChallengeEngine.case2.correctDataStructure;
      const isOpCorrect = ChallengeEngine.case2.selectedOperationFlow === ChallengeEngine.case2.correctOperationFlow;

      if (isDsCorrect && isOpCorrect) {
        handleChallengeSuccess("case2", 50);
      } else {
        showFeedbackModal({
          status: "error",
          title: "Coba Analisis Lagi",
          message: "Konsep yang kamu pilih belum cocok untuk pembatalan pengetikan terakhir pada teks editor.",
          hint: ChallengeEngine.case2.hint
        });
      }
    });
  }
}

function updateCase2ReviewPreview() {
  const previewBox = document.getElementById("case2-selection-preview");
  if (!previewBox) return;

  const ds = ChallengeEngine.case2.selectedDataStructure;
  const op = ChallengeEngine.case2.selectedOperationFlow;

  const dsText = ds === "stack" ? "Stack (LIFO)" : ds === "queue" ? "Queue (FIFO)" : ds === "graph" ? "Graf Berarah" : "Belum dipilih";
  const opText = op === "push-pop" ? "Push Aksi Baru [TOP] & Pop saat Undo [TOP]" : op === "fifo" ? "Enqueue di REAR & Dequeue di FRONT" : op === "flush" ? "Hapus Seluruh Riwayat Teks" : "Belum dipilih";

  previewBox.innerHTML = `
    <span class="text-on-surface-variant">Struktur: <strong class="text-primary">${dsText}</strong></span>
    <span class="mx-1 text-slate-300">•</span>
    <span class="text-on-surface-variant">Mekanisme: <strong class="text-secondary">${opText}</strong></span>
  `;
}

/**
 * Handler Saat Jawaban Kasus Berhasil / Benar
 */
function handleChallengeSuccess(caseId, xpEarned = 50) {
  const isFirstTime = !ChallengeEngine.completedChallenges.has(caseId);
  ChallengeEngine.completedChallenges.add(caseId);

  // Simpan ke LocalStorage
  const completedArr = Array.from(ChallengeEngine.completedChallenges);
  localStorage.setItem("ruanglogika_completed_challenges", JSON.stringify(completedArr));

  // Tambah XP jika baru pertama kali
  if (isFirstTime) {
    ChallengeEngine.totalXP += xpEarned;
    try {
      const userStr = localStorage.getItem("ruanglogika_user");
      if (userStr) {
        const u = JSON.parse(userStr);
        u.xp = ChallengeEngine.totalXP;
        localStorage.setItem("ruanglogika_user", JSON.stringify(u));
      }
    } catch (e) {}

    // Update Header XP Display
    const xpBadges = document.querySelectorAll(".user-display-xp");
    xpBadges.forEach(badge => {
      badge.textContent = `Level 4 • ${ChallengeEngine.totalXP} XP`;
    });

    // Simpan ke Firestore jika aktif
    syncChallengeToFirestore(caseId, xpEarned);
  }

  updateCaseStatusBadge(caseId, true);

  const explanation = caseId === "case1" ? ChallengeEngine.case1.explanation : ChallengeEngine.case2.explanation;
  
  showFeedbackModal({
    status: "success",
    title: "Tepat! Analisis Logikamu Benar",
    message: explanation,
    xpEarned: isFirstTime ? xpEarned : 0,
    caseId: caseId
  });
}

function updateCaseStatusBadge(caseId, isCompleted) {
  const badge = document.getElementById(`${caseId}-status-badge`);
  if (!badge) return;

  if (isCompleted) {
    badge.textContent = "TERSELESAIKAN";
    badge.className = "font-label-md text-xs font-bold text-secondary bg-secondary-container/40 border border-secondary/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1";
    badge.innerHTML = `<span class="material-symbols-outlined text-xs">verified</span> TERSELESAIKAN`;
  }
}

async function syncChallengeToFirestore(caseId, xp) {
  if (!isConfigured || !db) return;
  try {
    const user = auth ? auth.currentUser : null;
    const localUser = JSON.parse(localStorage.getItem("ruanglogika_user") || "{}");
    const uid = user ? user.uid : (localUser.uid || "tamu_challenge");

    await addDoc(collection(db, "progress"), {
      userId: uid,
      namaLengkap: user?.displayName || localUser.namaLengkap || "Siswa",
      challengeId: caseId,
      type: "challenge",
      score: 100,
      xpEarned: xp,
      passed: true,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Gagal sinkron tantangan ke Firestore:", err);
  }
}

/**
 * 3. MODAL UMPAN BALIK INSTAN BERDESAIN RUANG LOGIKA (Navy/Teal)
 */
export function showFeedbackModal({ status, title, message, hint, xpEarned, caseId }) {
  const modal = document.getElementById("challenge-feedback-modal");
  const modalBox = document.getElementById("feedback-modal-box");
  const iconContainer = document.getElementById("feedback-modal-icon-container");
  const iconEl = document.getElementById("feedback-modal-icon");
  const titleEl = document.getElementById("feedback-modal-title");
  const msgEl = document.getElementById("feedback-modal-message");
  const hintContainer = document.getElementById("feedback-modal-hint-container");
  const hintEl = document.getElementById("feedback-modal-hint");
  const xpBadge = document.getElementById("feedback-modal-xp-badge");
  const actionBtn = document.getElementById("feedback-modal-action-btn");

  if (!modal || !titleEl || !msgEl) return;

  titleEl.textContent = title;
  msgEl.textContent = message;

  if (status === "success") {
    // Style Sukses (Navy + Teal)
    iconContainer.className = "w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-on-secondary shadow-lg shadow-secondary/30 mb-2";
    iconEl.textContent = "check_circle";
    titleEl.className = "font-headline-xl text-lg sm:text-xl font-bold text-secondary text-center";
    
    if (hintContainer) hintContainer.classList.add("hidden");
    
    if (xpBadge) {
      if (xpEarned && xpEarned > 0) {
        xpBadge.classList.remove("hidden");
        xpBadge.innerHTML = `<span class="material-symbols-outlined text-sm text-tertiary-fixed-dim">military_tech</span> +${xpEarned} XP Didapatkan!`;
      } else {
        xpBadge.classList.remove("hidden");
        xpBadge.innerHTML = `<span class="material-symbols-outlined text-sm text-secondary">verified</span> Tantangan Sudah Pernah Diselesaikan`;
      }
    }

    if (actionBtn) {
      actionBtn.textContent = caseId === "case1" ? "Lanjut ke Kasus 2" : "Selesai Tantangan";
      actionBtn.className = "w-full py-2.5 px-4 rounded-xl bg-secondary text-on-secondary font-headline-md text-xs sm:text-sm font-bold shadow-md hover:bg-secondary/90 transition flex items-center justify-center gap-1.5 cursor-pointer";
      actionBtn.onclick = () => {
        closeFeedbackModal();
        if (caseId === "case1") {
          const case2Section = document.getElementById("section-case2");
          if (case2Section) {
            case2Section.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      };
    }

  } else if (status === "error") {
    // Style Keliru (Navy + Amber/Rose)
    iconContainer.className = "w-14 h-14 rounded-2xl bg-primary text-tertiary-fixed-dim flex items-center justify-center shadow-lg mb-2";
    iconEl.textContent = "lightbulb";
    titleEl.className = "font-headline-xl text-lg sm:text-xl font-bold text-primary text-center";

    if (hintContainer && hint) {
      hintContainer.classList.remove("hidden");
      hintEl.textContent = hint;
    }

    if (xpBadge) xpBadge.classList.add("hidden");

    if (actionBtn) {
      actionBtn.textContent = "Coba Analisis Ulang";
      actionBtn.className = "w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-headline-md text-xs sm:text-sm font-bold shadow-md hover:bg-primary/90 transition flex items-center justify-center gap-1.5 cursor-pointer";
      actionBtn.onclick = () => closeFeedbackModal();
    }

  } else {
    // Style Incomplete
    iconContainer.className = "w-14 h-14 rounded-2xl bg-surface-container-high text-on-surface flex items-center justify-center mb-2";
    iconEl.textContent = "touch_app";
    titleEl.className = "font-headline-xl text-lg sm:text-xl font-bold text-primary text-center";

    if (hintContainer) hintContainer.classList.add("hidden");
    if (xpBadge) xpBadge.classList.add("hidden");

    if (actionBtn) {
      actionBtn.textContent = "Kembali Pilih Opsi";
      actionBtn.className = "w-full py-2.5 px-4 rounded-xl bg-surface-container-high text-on-surface font-headline-md text-xs sm:text-sm font-semibold hover:bg-surface-container-highest transition cursor-pointer";
      actionBtn.onclick = () => closeFeedbackModal();
    }
  }

  // Tampilkan Modal dengan Transisi Mulus
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  if (modalBox) {
    modalBox.classList.add("scale-100", "opacity-100");
    modalBox.classList.remove("scale-95", "opacity-0");
  }
}

export function closeFeedbackModal() {
  const modal = document.getElementById("challenge-feedback-modal");
  const modalBox = document.getElementById("feedback-modal-box");
  if (modal) {
    if (modalBox) {
      modalBox.classList.remove("scale-100", "opacity-100");
      modalBox.classList.add("scale-95", "opacity-0");
    }
    setTimeout(() => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }, 150);
  }
}

function initModalListeners() {
  const closeBtn = document.getElementById("btn-close-feedback-modal");
  const modal = document.getElementById("challenge-feedback-modal");
  
  if (closeBtn) closeBtn.addEventListener("click", closeFeedbackModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeFeedbackModal();
    });
  }
}

/**
 * 4. MINI SIMULATORS PLAYGROUND (STRING REVERSAL & FIFO TUBE)
 */
function initMiniSimulators() {
  // Simulator 1: Pembalik String LIFO
  const inputRev = document.getElementById("input-reverse-text");
  const btnPushRev = document.getElementById("btn-push-reverse");
  const btnPopRev = document.getElementById("btn-pop-reverse");
  const stackBox = document.getElementById("visual-stack-box");
  const outputRev = document.getElementById("output-reverse-result");
  const logRev = document.getElementById("reverse-log");

  let revStack = [];
  let poppedChars = [];

  if (btnPushRev && inputRev && stackBox) {
    btnPushRev.addEventListener("click", () => {
      const text = inputRev.value.trim().toUpperCase() || "LOGIKA";
      revStack = text.split("");
      poppedChars = [];
      if (outputRev) outputRev.textContent = "---";

      stackBox.innerHTML = "";
      revStack.forEach((char, idx) => {
        const item = document.createElement("div");
        item.className = "w-full py-1 bg-surface-container text-primary font-mono font-bold text-center rounded text-xs border border-secondary/50 animate-bounce";
        item.textContent = `${char} (TOP: ${idx})`;
        stackBox.appendChild(item);
      });

      if (logRev) logRev.textContent = `Status: Berhasil PUSH ${revStack.length} karakter ke Stack. Siap di-POP!`;
    });
  }

  if (btnPopRev && outputRev && stackBox) {
    btnPopRev.addEventListener("click", () => {
      if (revStack.length === 0) {
        if (logRev) logRev.textContent = "Status: Stack kosong! Silakan Push huruf terlebih dahulu.";
        return;
      }

      const popped = revStack.pop();
      poppedChars.push(popped);
      outputRev.textContent = poppedChars.join("");

      // Update Visual Stack
      stackBox.innerHTML = "";
      if (revStack.length === 0) {
        stackBox.innerHTML = `<span class="text-[10px] font-mono text-slate-400 text-center m-auto">Stack Kosong (Semua di-POP)</span>`;
      } else {
        revStack.forEach((char, idx) => {
          const item = document.createElement("div");
          item.className = "w-full py-1 bg-surface-container text-primary font-mono font-bold text-center rounded text-xs border border-secondary/50";
          item.textContent = `${char} (TOP: ${idx})`;
          stackBox.appendChild(item);
        });
      }

      if (logRev) logRev.textContent = `Status: POP '${popped}'. Hasil terbalik saat ini: "${poppedChars.join("")}"`;
    });
  }

  // Simulator 2: Antrean Kafetaria FIFO
  const queueTube = document.getElementById("queue-student-tube");
  const btnEnq = document.getElementById("btn-enqueue-student");
  const btnDeq = document.getElementById("btn-dequeue-student");
  const btnResetQ = document.getElementById("btn-reset-queue-sim");
  const servedNameEl = document.getElementById("queue-served-name");

  let cafeteriaQueue = ["Siswa-1 (Farhan)", "Siswa-2 (Bella)", "Siswa-3 (Cahyo)"];
  let studentCounter = 4;

  function renderQueueTube() {
    if (!queueTube) return;
    queueTube.innerHTML = "";
    if (cafeteriaQueue.length === 0) {
      queueTube.innerHTML = `<span class="text-xs font-mono text-slate-300 italic m-auto">Antrean kosong. Tekan Enqueue untuk menambah siswa.</span>`;
      return;
    }

    cafeteriaQueue.forEach((name, idx) => {
      const node = document.createElement("div");
      const isFront = idx === 0;
      const isRear = idx === cafeteriaQueue.length - 1;
      node.className = `px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 shadow-sm flex items-center gap-1.5 ${
        isFront ? "bg-tertiary-fixed-dim text-on-tertiary-fixed ring-2 ring-tertiary-fixed" : isRear ? "bg-secondary text-on-secondary ring-2 ring-secondary/50" : "bg-surface-container-high text-primary"
      }`;
      node.innerHTML = `
        <span>${name}</span>
        ${isFront ? '<span class="text-[9px] bg-black/20 px-1 rounded uppercase">FRONT</span>' : ''}
        ${isRear ? '<span class="text-[9px] bg-black/20 px-1 rounded uppercase">REAR</span>' : ''}
      `;
      queueTube.appendChild(node);
    });
  }

  renderQueueTube();

  if (btnEnq) {
    btnEnq.addEventListener("click", () => {
      if (cafeteriaQueue.length >= 6) {
        alert("Antrean loket sudah penuh (maksimal 6 siswa)!");
        return;
      }
      const newName = `Siswa-${studentCounter++}`;
      cafeteriaQueue.push(newName);
      renderQueueTube();
    });
  }

  if (btnDeq) {
    btnDeq.addEventListener("click", () => {
      if (cafeteriaQueue.length === 0) {
        alert("Antrean kosong, tidak ada yang bisa dilayani!");
        return;
      }
      const served = cafeteriaQueue.shift();
      if (servedNameEl) servedNameEl.textContent = `${served} (Menerima Pesanan)`;
      renderQueueTube();
    });
  }

  if (btnResetQ) {
    btnResetQ.addEventListener("click", () => {
      cafeteriaQueue = ["Siswa-1 (Farhan)", "Siswa-2 (Bella)"];
      studentCounter = 3;
      if (servedNameEl) servedNameEl.textContent = "Belum ada";
      renderQueueTube();
    });
  }
}

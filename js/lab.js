/**
 * RUANG LOGIKA — Laboratorium Simulasi Interaktif (js/lab.js)
 * Algoritma Struktur Data Linear: Stack (LIFO) & Queue (FIFO)
 * Murni Vanilla JavaScript DOM Manipulation
 * Pengembang: Yusuf Nurul Huda
 */

// Konfigurasi & State Mesin Laboratorium
export const LabEngine = {
  currentMode: "stack", // "stack" | "queue"
  maxCapacity: 5,       // Maksimal 5 elemen virtual
  stackData: ["Data A", "Data B", "Data C"],
  queueData: ["Antrean 1", "Antrean 2", "Antrean 3"],
  animSpeedMs: 400,
  
  sampleVocabulary: [
    "Token-Auth", "Nilai_X", "Node-Alpha", "Proses-OS", "Payload-42",
    "Kueri-SQL", "Fungsi-Rec", "Objek-DOM", "Paket-Data", "Buffer-Mem"
  ]
};

// Inisialisasi saat file dimuat
document.addEventListener("DOMContentLoaded", () => {
  initLabEventListeners();
  renderLabState();
  appendTerminalLog(`Sistem Laboratorium Interaktif diinisialisasi. Mode awal: STACK (LIFO). Kapasitas: ${LabEngine.maxCapacity} elemen.`, "text-secondary-fixed");
});

/**
 * 1. INISIALISASI EVENT LISTENERS KONTROL
 */
function initLabEventListeners() {
  // Mode Switcher Buttons
  const btnModeStack = document.getElementById("btn-mode-stack");
  const btnModeQueue = document.getElementById("btn-mode-queue");

  if (btnModeStack) {
    btnModeStack.addEventListener("click", () => switchLabMode("stack"));
  }
  if (btnModeQueue) {
    btnModeQueue.addEventListener("click", () => switchLabMode("queue"));
  }

  // Stack Action Buttons
  const btnPush = document.getElementById("btn-stack-push");
  const btnPop = document.getElementById("btn-stack-pop");
  const btnPeek = document.getElementById("btn-stack-peek");

  if (btnPush) btnPush.addEventListener("click", handleStackPush);
  if (btnPop) btnPop.addEventListener("click", handleStackPop);
  if (btnPeek) btnPeek.addEventListener("click", handleStackPeek);

  // Queue Action Buttons
  const btnEnqueue = document.getElementById("btn-queue-enqueue");
  const btnDequeue = document.getElementById("btn-queue-dequeue");
  const btnFrontRear = document.getElementById("btn-queue-check");

  if (btnEnqueue) btnEnqueue.addEventListener("click", handleQueueEnqueue);
  if (btnDequeue) btnDequeue.addEventListener("click", handleQueueDequeue);
  if (btnFrontRear) btnFrontRear.addEventListener("click", handleQueueFrontRearCheck);

  // Common Action Buttons
  const btnReset = document.getElementById("btn-reset-lab");
  const btnRandom = document.getElementById("btn-random-input");
  const btnClearLogs = document.getElementById("btn-clear-logs");
  const speedSlider = document.getElementById("anim-speed-slider");

  if (btnReset) btnReset.addEventListener("click", handleResetStructure);
  if (btnRandom) btnRandom.addEventListener("click", generateRandomInput);
  if (btnClearLogs) btnClearLogs.addEventListener("click", clearTerminalLogs);
  if (speedSlider) {
    speedSlider.addEventListener("input", (e) => {
      LabEngine.animSpeedMs = parseInt(e.target.value, 10);
      const speedLabel = document.getElementById("speed-label");
      if (speedLabel) {
        if (LabEngine.animSpeedMs <= 250) speedLabel.textContent = `CEPAT (${LabEngine.animSpeedMs}ms)`;
        else if (LabEngine.animSpeedMs >= 600) speedLabel.textContent = `LAMBAT (${LabEngine.animSpeedMs}ms)`;
        else speedLabel.textContent = `NORMAL (${LabEngine.animSpeedMs}ms)`;
      }
    });
  }

  // Enter key di input text
  const nodeInput = document.getElementById("node-input");
  if (nodeInput) {
    nodeInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (LabEngine.currentMode === "stack") handleStackPush();
        else handleQueueEnqueue();
      }
    });
  }
}

/**
 * 2. PERALIHAN MODE SIMULATOR (Stack vs Queue)
 */
export function switchLabMode(mode) {
  if (LabEngine.currentMode === mode) return;
  LabEngine.currentMode = mode;

  const btnStack = document.getElementById("btn-mode-stack");
  const btnQueue = document.getElementById("btn-mode-queue");
  const stackActions = document.getElementById("stack-actions-group");
  const queueActions = document.getElementById("queue-actions-group");
  const stackCanvas = document.getElementById("stack-canvas-view");
  const queueCanvas = document.getElementById("queue-canvas-view");
  const badgeIndicator = document.getElementById("mode-badge-indicator");
  const canvasTypeTag = document.getElementById("canvas-type-tag");
  const canvasRuleTag = document.getElementById("canvas-rule-tag");
  const canvasDescText = document.getElementById("canvas-instruction-text");
  const resetBtnLabel = document.getElementById("reset-button-label");

  if (mode === "stack") {
    btnStack.className = "flex items-center gap-2 px-4 py-2.5 rounded-lg font-headline-md text-xs sm:text-sm bg-primary text-on-primary transition-all shadow-sm";
    btnQueue.className = "flex items-center gap-2 px-4 py-2.5 rounded-lg font-headline-md text-xs sm:text-sm text-on-surface-variant hover:text-on-surface transition-all";
    stackActions.classList.remove("hidden");
    queueActions.classList.add("hidden");
    stackCanvas.classList.remove("hidden");
    queueCanvas.classList.add("hidden");

    badgeIndicator.textContent = "STACK READY";
    badgeIndicator.className = "font-label-md text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-bold";
    canvasTypeTag.textContent = "TUMPUKAN VERTIKAL (STACK)";
    canvasRuleTag.textContent = "Prinsip LIFO: Last In, First Out";
    canvasDescText.textContent = "Elemen terakhir yang dimasukkan (PUSH) akan menjadi elemen pertama yang diambil (POP).";
    resetBtnLabel.textContent = "Reset Wadah Stack";

    appendTerminalLog("Beralih ke Simulator Stack (LIFO). Pointer vertikal TOP diaktifkan.", "text-tertiary-fixed font-bold");
  } else {
    btnQueue.className = "flex items-center gap-2 px-4 py-2.5 rounded-lg font-headline-md text-xs sm:text-sm bg-primary text-on-primary transition-all shadow-sm";
    btnStack.className = "flex items-center gap-2 px-4 py-2.5 rounded-lg font-headline-md text-xs sm:text-sm text-on-surface-variant hover:text-on-surface transition-all";
    stackActions.classList.add("hidden");
    queueActions.classList.remove("hidden");
    stackCanvas.classList.add("hidden");
    queueCanvas.classList.remove("hidden");

    badgeIndicator.textContent = "QUEUE READY";
    badgeIndicator.className = "font-label-md text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold";
    canvasTypeTag.textContent = "LINTASAN ANTREAN (QUEUE)";
    canvasRuleTag.textContent = "Prinsip FIFO: First In, First Out";
    canvasDescText.textContent = "Elemen pertama yang masuk (ENQUEUE) akan menjadi elemen pertama yang keluar (DEQUEUE).";
    resetBtnLabel.textContent = "Reset Wadah Queue";

    appendTerminalLog("Beralih ke Simulator Queue (FIFO). Pointer horizontal FRONT & REAR diaktifkan.", "text-tertiary-fixed font-bold");
  }

  renderLabState();
}

/**
 * 3. LOGIKA OPERASI STACK (LIFO)
 */
export function handleStackPush() {
  const currentCount = LabEngine.stackData.length;

  // Cek Stack Overflow
  if (currentCount >= LabEngine.maxCapacity) {
    appendTerminalLog(`[OVERFLOW] Gagal PUSH: Stack sudah penuh (${currentCount}/${LabEngine.maxCapacity} elemen)! Lakukan POP terlebih dahulu.`, "text-error-container font-bold");
    triggerWarningShake("stack-canvas-view");
    if (window.showAppToast) window.showAppToast("Stack Overflow! Kapasitas maksimal 5 elemen.", "error");
    return;
  }

  const inputEl = document.getElementById("node-input");
  const value = inputEl.value.trim() || `Node-${currentCount + 1}`;

  // Tambah elemen ke struktur Stack
  LabEngine.stackData.push(value);
  const newIndex = LabEngine.stackData.length - 1;

  document.getElementById("stack-last-op").textContent = `PUSH('${value}')`;
  appendTerminalLog(`[PUSH] Sukses memasukkan '${value}' ke puncak tumpukan. Ukuran sekarang: ${LabEngine.stackData.length}/${LabEngine.maxCapacity}. TOP menunjuk ke Indeks [${newIndex}].`, "text-secondary-fixed");

  if (window.showAppToast) window.showAppToast(`PUSH('${value}') sukses masuk.`, "success");

  renderLabState();
  generateRandomInput();
}

export function handleStackPop() {
  const currentCount = LabEngine.stackData.length;

  // Cek Stack Underflow
  if (currentCount === 0) {
    appendTerminalLog(`[UNDERFLOW] Gagal POP: Stack kosong melompong (0 elemen)! Tidak ada data yang dapat diambil.`, "text-error-container font-bold");
    triggerWarningShake("stack-canvas-view");
    if (window.showAppToast) window.showAppToast("Stack Underflow! Tumpukan sudah kosong.", "error");
    return;
  }

  // Ambil elemen teratas (LIFO)
  const popped = LabEngine.stackData.pop();
  const nextTopIndex = LabEngine.stackData.length - 1;

  document.getElementById("stack-last-op").textContent = `POP('${popped}')`;
  appendTerminalLog(`[POP] Sukses mengeluarkan data teratas '${popped}'. Pointer TOP kini berada di Indeks [${nextTopIndex >= 0 ? nextTopIndex : "KOSONG"}].`, "text-error font-semibold");

  if (window.showAppToast) window.showAppToast(`POP('${popped}') berhasil diambil.`, "info");

  renderLabState();
}

export function handleStackPeek() {
  const currentCount = LabEngine.stackData.length;

  if (currentCount === 0) {
    appendTerminalLog(`[PEEK] Stack saat ini kosong (NULL). Tidak ada elemen di puncak.`, "text-tertiary-fixed");
    if (window.showAppToast) window.showAppToast("Stack kosong, tidak ada elemen puncak.", "warning");
    return;
  }

  const topValue = LabEngine.stackData[currentCount - 1];
  appendTerminalLog(`[PEEK] Elemen teratas (TOP) saat ini adalah '${topValue}' pada Indeks [${currentCount - 1}] (Operasi baca tanpa menghapus).`, "text-tertiary-fixed font-bold");

  // Visual pulse highlight pada top node
  const topNode = document.getElementById("stack-top-node");
  if (topNode) {
    topNode.classList.add("ring-4", "ring-tertiary-fixed-dim");
    setTimeout(() => {
      topNode.classList.remove("ring-4", "ring-tertiary-fixed-dim");
    }, 900);
  }

  if (window.showAppToast) window.showAppToast(`PEEK: Elemen puncak = "${topValue}"`, "info");
}

/**
 * 4. LOGIKA OPERASI QUEUE (FIFO)
 */
export function handleQueueEnqueue() {
  const currentCount = LabEngine.queueData.length;

  // Cek Queue Overflow
  if (currentCount >= LabEngine.maxCapacity) {
    appendTerminalLog(`[OVERFLOW] Gagal ENQUEUE: Antrean sudah penuh (${currentCount}/${LabEngine.maxCapacity} elemen)! Lakukan DEQUEUE terlebih dahulu.`, "text-error-container font-bold");
    triggerWarningShake("queue-canvas-view");
    if (window.showAppToast) window.showAppToast("Queue Overflow! Antrean sudah mencapai batas 5.", "error");
    return;
  }

  const inputEl = document.getElementById("node-input");
  const value = inputEl.value.trim() || `Pelanggan-${currentCount + 1}`;

  // Tambah elemen di posisi REAR (belakang antrean)
  LabEngine.queueData.push(value);
  const rearIndex = LabEngine.queueData.length - 1;

  appendTerminalLog(`[ENQUEUE] '${value}' masuk antrean di posisi REAR (Indeks [${rearIndex}]). Total antrean: ${LabEngine.queueData.length}/${LabEngine.maxCapacity}.`, "text-secondary-fixed");

  if (window.showAppToast) window.showAppToast(`ENQUEUE('${value}') sukses di REAR.`, "success");

  renderLabState();
  generateRandomInput();
}

export function handleQueueDequeue() {
  const currentCount = LabEngine.queueData.length;

  // Cek Queue Underflow
  if (currentCount === 0) {
    appendTerminalLog(`[UNDERFLOW] Gagal DEQUEUE: Antrean kosong (0 elemen)! Tidak ada orang / paket yang mengantre.`, "text-error-container font-bold");
    triggerWarningShake("queue-canvas-view");
    if (window.showAppToast) window.showAppToast("Queue Underflow! Antrean kosong.", "error");
    return;
  }

  // Hapus elemen paling depan (FIFO)
  const dequeued = LabEngine.queueData.shift();

  appendTerminalLog(`[DEQUEUE] Elemen terdepan '${dequeued}' selesai dilayani & keluar dari FRONT (Indeks [0]). Seluruh elemen antrean bergeser maju.`, "text-error font-semibold");

  if (window.showAppToast) window.showAppToast(`DEQUEUE('${dequeued}') keluar dari FRONT.`, "info");

  renderLabState();
}

export function handleQueueFrontRearCheck() {
  const currentCount = LabEngine.queueData.length;

  if (currentCount === 0) {
    appendTerminalLog(`[CHECK] Antrean kosong (FRONT = NULL, REAR = NULL).`, "text-tertiary-fixed");
    return;
  }

  const frontVal = LabEngine.queueData[0];
  const rearVal = LabEngine.queueData[currentCount - 1];

  appendTerminalLog(`[CHECK] Posisi Antrean: FRONT (Indeks 0) = '${frontVal}' | REAR (Indeks ${currentCount - 1}) = '${rearVal}'.`, "text-tertiary-fixed font-bold");

  if (window.showAppToast) window.showAppToast(`FRONT: "${frontVal}" | REAR: "${rearVal}"`, "info");
}

/**
 * 5. RESET DATA STRUKTUR
 */
export function handleResetStructure() {
  if (LabEngine.currentMode === "stack") {
    LabEngine.stackData = [];
    document.getElementById("stack-last-op").textContent = "RESET()";
    appendTerminalLog("[RESET] Wadah Stack dikosongkan total (0 elemen aktif). Memori bersih.", "text-on-primary-container");
    if (window.showAppToast) window.showAppToast("Wadah Stack berhasil di-reset.", "info");
  } else {
    LabEngine.queueData = [];
    appendTerminalLog("[RESET] Lintasan Antrean Queue dikosongkan total (0 elemen aktif).", "text-on-primary-container");
    if (window.showAppToast) window.showAppToast("Lintasan Queue berhasil di-reset.", "info");
  }
  renderLabState();
}

/**
 * 6. RENDER STATE & MANIPULASI DOM VANILLA JS
 */
export function renderLabState() {
  const isStack = LabEngine.currentMode === "stack";
  const activeList = isStack ? LabEngine.stackData : LabEngine.queueData;
  const count = activeList.length;

  // Update Kartu Status Memori
  const statusSize = document.getElementById("status-size");
  const statusIndex = document.getElementById("status-index");
  const statusEmpty = document.getElementById("status-empty");
  const statusFull = document.getElementById("status-full");
  const statusHighlightLabel = document.getElementById("status-highlight-label");
  const statusHighlightVal = document.getElementById("status-highlight-val");
  const canvasCounter = document.getElementById("canvas-items-counter");

  if (statusSize) statusSize.textContent = `${count} / ${LabEngine.maxCapacity}`;
  if (canvasCounter) canvasCounter.textContent = `${count} Elemen Terpasang`;

  // isEmpty Status
  if (statusEmpty) {
    if (count === 0) {
      statusEmpty.textContent = "TRUE";
      statusEmpty.className = "font-label-md text-xs font-bold text-error bg-error-container px-2 py-0.5 rounded-md";
    } else {
      statusEmpty.textContent = "FALSE";
      statusEmpty.className = "font-label-md text-xs font-bold text-secondary bg-secondary-container px-2 py-0.5 rounded-md";
    }
  }

  // isFull Status
  if (statusFull) {
    if (count >= LabEngine.maxCapacity) {
      statusFull.textContent = "TRUE";
      statusFull.className = "font-label-md text-xs font-bold text-error bg-error-container px-2 py-0.5 rounded-md";
    } else {
      statusFull.textContent = "FALSE";
      statusFull.className = "font-label-md text-xs font-bold text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded-md";
    }
  }

  // Indeks & Elemen Terpenting
  if (isStack) {
    if (statusIndex) statusIndex.textContent = count > 0 ? `[${count - 1}]` : "[-1]";
    if (statusHighlightLabel) statusHighlightLabel.textContent = "Elemen Teratas (TOP):";
    if (statusHighlightVal) statusHighlightVal.textContent = count > 0 ? activeList[count - 1] : "(Tumpukan Kosong)";
    renderStackDOM();
  } else {
    if (statusIndex) statusIndex.textContent = count > 0 ? `[0..${count - 1}]` : "[Kosong]";
    if (statusHighlightLabel) statusHighlightLabel.textContent = "Elemen Depan (FRONT):";
    if (statusHighlightVal) statusHighlightVal.textContent = count > 0 ? activeList[0] : "(Antrean Kosong)";
    renderQueueDOM();
  }
}

/**
 * Render DOM Stack Visualizer (Vertikal)
 */
function renderStackDOM() {
  const container = document.getElementById("stack-slots-wrapper");
  const ghostWrapper = document.getElementById("stack-ghost-wrapper");
  const pointerPill = document.getElementById("stack-pointer-pill");
  const addressTop = document.getElementById("stack-address-top");

  if (!container || !ghostWrapper) return;
  container.innerHTML = "";

  const count = LabEngine.stackData.length;

  LabEngine.stackData.forEach((val, idx) => {
    const isTop = idx === count - 1;
    const nodeEl = document.createElement("div");
    nodeEl.className = `w-full h-13 py-2 px-4 rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between transition-all duration-300 border border-outline-variant/30 ${isTop ? "ring-2 ring-secondary shadow-md" : ""}`;
    if (isTop) nodeEl.id = "stack-top-node";

    nodeEl.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="font-label-md text-xs px-2 py-0.5 rounded-md ${isTop ? "bg-secondary text-on-secondary font-bold" : "bg-surface-container text-on-surface-variant font-semibold"}">[${idx}]</span>
        <span class="font-headline-md text-sm font-bold text-primary truncate max-w-[130px] sm:max-w-[160px]">${val}</span>
      </div>
      <div class="flex items-center gap-1.5">
        ${isTop 
          ? `<span class="font-label-md text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-extrabold animate-pulse">TOP NODE</span>` 
          : `<span class="font-label-md text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono">0x00${idx + 1}A</span>`}
      </div>
    `;
    container.appendChild(nodeEl);
  });

  // Render Ghost Slot kosong untuk slot sisa hingga max 5
  ghostWrapper.innerHTML = "";
  for (let i = count; i < LabEngine.maxCapacity; i++) {
    const ghost = document.createElement("div");
    ghost.className = "w-full h-12 rounded-xl border border-dashed border-outline-variant/60 flex items-center justify-center font-label-md text-xs text-on-surface-variant/60 select-none";
    ghost.textContent = `Slot [${i}] Kosong`;
    ghostWrapper.appendChild(ghost);
  }

  // Atur Posisi Indikator Panah TOP secara dinamis
  if (pointerPill) {
    if (count === 0) {
      pointerPill.style.opacity = "0";
      if (addressTop) addressTop.textContent = "Idx: NULL";
    } else {
      pointerPill.style.opacity = "1";
      // Offset per item (kurang lebih 56px per slot + gap)
      const bottomPos = 16 + ((count - 1) * 58);
      pointerPill.style.bottom = `${bottomPos}px`;
      if (addressTop) addressTop.textContent = `Idx: ${count - 1}`;
    }
  }
}

/**
 * Render DOM Queue Visualizer (Horizontal)
 */
function renderQueueDOM() {
  const container = document.getElementById("queue-slots-wrapper");
  if (!container) return;
  container.innerHTML = "";

  const count = LabEngine.queueData.length;

  LabEngine.queueData.forEach((val, idx) => {
    const isFront = idx === 0;
    const isRear = idx === count - 1;

    let ringClass = "border border-outline-variant/30";
    if (isFront && isRear) {
      ringClass = "ring-2 ring-secondary shadow-md";
    } else if (isFront) {
      ringClass = "ring-2 ring-error/70 shadow-md";
    } else if (isRear) {
      ringClass = "ring-2 ring-secondary/70 shadow-md";
    }

    const nodeEl = document.createElement("div");
    nodeEl.className = `w-36 h-24 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between p-3 shrink-0 transition-all duration-300 ${ringClass}`;
    
    nodeEl.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-label-md text-[10px] px-1.5 py-0.5 rounded font-bold ${isFront ? 'bg-error text-on-error' : isRear ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant'}">
          [${idx}] ${isFront ? 'FRONT' : isRear ? 'REAR' : ''}
        </span>
        <span class="font-label-md text-[9px] text-on-surface-variant font-mono">0x00${idx + 1}B</span>
      </div>
      <span class="font-headline-md text-xs font-bold text-primary truncate">${val}</span>
      <div class="flex items-center justify-between">
        <span class="font-label-md text-[9px] ${isFront ? 'text-error font-bold' : isRear ? 'text-secondary font-bold' : 'text-on-surface-variant font-medium'}">
          ${isFront ? 'Prioritas Keluar' : isRear ? 'Baru Masuk' : 'Dalam Antrean'}
        </span>
      </div>
    `;
    container.appendChild(nodeEl);
  });

  // Render Ghost Slot untuk sisa kapasitas hingga 5
  for (let i = count; i < LabEngine.maxCapacity; i++) {
    const ghost = document.createElement("div");
    ghost.className = "w-36 h-24 rounded-xl border border-dashed border-outline-variant/50 flex flex-col items-center justify-center p-3 opacity-40 shrink-0 select-none";
    ghost.innerHTML = `<span class="font-label-md text-xs text-on-surface-variant">[${i}] Kosong</span>`;
    container.appendChild(ghost);
  }
}

/**
 * 7. TERMINAL LOG ACTIVITY ENGINE
 */
function getTimestamp() {
  const d = new Date();
  return `[${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}]`;
}

export function appendTerminalLog(message, colorClass = "text-secondary-fixed") {
  const terminal = document.getElementById("terminal-stream");
  if (!terminal) return;

  const logRow = document.createElement("div");
  logRow.className = "flex items-start gap-2 leading-relaxed text-xs";
  logRow.innerHTML = `
    <span class="text-tertiary-fixed font-mono shrink-0 select-none">${getTimestamp()}</span>
    <span class="${colorClass}">${message}</span>
  `;

  terminal.appendChild(logRow);
  terminal.scrollTop = terminal.scrollHeight;
}

export function clearTerminalLogs() {
  const terminal = document.getElementById("terminal-stream");
  if (!terminal) return;

  terminal.innerHTML = `
    <div class="flex items-start gap-2 text-xs">
      <span class="text-tertiary-fixed font-mono">${getTimestamp()}</span>
      <span class="text-on-primary">Terminal dibersihkan. Memori siap menerima instruksi eksekusi baru.</span>
    </div>
  `;
}

/**
 * 8. UTILITIES (Acak Input & Shake Animation)
 */
export function generateRandomInput() {
  const inputEl = document.getElementById("node-input");
  if (!inputEl) return;
  const rand = LabEngine.sampleVocabulary[Math.floor(Math.random() * LabEngine.sampleVocabulary.length)];
  inputEl.value = rand;
}

function triggerWarningShake(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.add("animate-pulse");
  setTimeout(() => el.classList.remove("animate-pulse"), 600);
}

// Pasang ke window scope untuk kompatibilitas inline onclick jika diperlukan
window.LabEngine = LabEngine;
window.handleStackPush = handleStackPush;
window.handleStackPop = handleStackPop;
window.handleStackPeek = handleStackPeek;
window.handleQueueEnqueue = handleQueueEnqueue;
window.handleQueueDequeue = handleQueueDequeue;
window.handleQueueFrontRearCheck = handleQueueFrontRearCheck;
window.handleResetStructure = handleResetStructure;
window.generateRandomInput = generateRandomInput;
window.clearTerminalLogs = clearTerminalLogs;
window.switchLabMode = switchLabMode;

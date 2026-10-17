/**
 * RUANG LOGIKA — Main UI & Navigation Engine (js/main.js)
 * Platform Pembelajaran Interaktif Struktur Data & Algoritma SMA
 * Pengembang: Yusuf Nurul Huda
 */

import { auth, isConfigured } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Inisialisasi saat DOM siap
document.addEventListener("DOMContentLoaded", () => {
  initNavigationHighlight();
  initSessionCheck();
  initModeSwitcher();
  initLiveStackSandbox();
});

/**
 * 1. PENGATURAN NAVIGASI AKTIF
 * Memberikan class aktif pada tautan navbar yang sesuai dengan halaman saat ini
 */
export function initNavigationHighlight() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll("header nav a");

  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "" && href === "index.html")) {
      link.className = "px-3 py-2 transition-colors bg-primary-container text-on-primary-container font-headline-md text-body-sm rounded-lg shadow-sm";
      link.setAttribute("aria-current", "page");
    } else {
      link.className = "px-3 py-2 rounded-lg font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors";
      link.removeAttribute("aria-current");
    }
  });
}

/**
 * 2. PENGECEKAN SESI PENGGUNA (Firebase Auth + LocalStorage Cache)
 * Memperbarui header dengan avatar, nama pengguna, XP, dan status autentikasi
 */
export function initSessionCheck() {
  const headerAuthContainer = document.getElementById("header-auth-container");
  const userXpBadge = document.querySelector(".user-display-xp");
  const userNameElem = document.querySelector(".user-display-name");
  const userRoleElem = document.querySelector(".user-display-role");
  const userAvatarElem = document.querySelector(".user-display-avatar");

  function renderLoggedIn(userData) {
    if (userNameElem) userNameElem.textContent = userData.namaLengkap || "Siswa Ruang Logika";
    if (userRoleElem) {
      const roleText = userData.role === "guru" ? "Guru Pengampu" : userData.role === "admin" ? "Administrator Lab" : (userData.kelas || "Kelas X-1");
      userRoleElem.textContent = roleText;
    }
    if (userXpBadge) userXpBadge.textContent = `Level ${userData.level || 4} • ${userData.xp || 850} XP`;

    // Render Dropdown / Profil di Header
    if (headerAuthContainer) {
      headerAuthContainer.innerHTML = `
        <div class="relative group">
          <button id="user-profile-menu-btn" class="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-container-high transition">
            <img class="w-8 h-8 rounded-full object-cover ring-2 ring-secondary/40 shadow-xs" src="${userData.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCp5yoZ9-DFdkNzCm73mXsTzRLeADM0-hPTv2h5pgW0AaUfvOZzxN0jbkvq8NzswMk3vfIL-uklAVPFCJQUiapbhNmG9w3-UVxd_vxMVdAMSf7qcQ0JlFr0U6hPCCknQWky8yE9RhAwYkdZA7MOhi7DVvqqL4CpJnklC1ywkq4KZJkj00oxj07bSxUL9aA6r8Cl5-jX6703sSTfy0CgbGPznbCJESzILrCtZvnkeGwTVPlPlGxYbYAN'}" alt="Foto Profil"/>
            <div class="hidden md:flex flex-col text-left">
              <span class="font-label-md text-xs font-bold text-on-surface leading-tight">${userData.namaLengkap ? userData.namaLengkap.split(" ")[0] : "Alifia"}</span>
              <span class="font-label-md text-[10px] text-on-surface-variant leading-none">${userData.role === 'guru' ? 'Guru' : userData.role === 'admin' ? 'Admin' : 'Siswa X'}</span>
            </div>
            <span class="material-symbols-outlined text-xs text-on-surface-variant">expand_more</span>
          </button>
          
          <!-- Dropdown Sesi -->
          <div class="absolute right-0 mt-1 w-52 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/40 py-1.5 hidden group-hover:block hover:block z-50">
            <div class="px-3.5 py-2 border-b border-outline-variant/30">
              <p class="font-headline-md text-xs font-bold text-primary truncate">${userData.namaLengkap || "Siswa"}</p>
              <p class="font-label-md text-[10px] text-on-surface-variant truncate">${userData.email || "siswa@ruanglogika.id"}</p>
            </div>
            <a href="${userData.role === 'guru' ? 'dashboard-guru.html' : userData.role === 'admin' ? 'dashboard-admin.html' : 'dashboard-siswa.html'}" class="flex items-center gap-2 px-3.5 py-2 font-body-sm text-xs text-on-surface hover:bg-surface-container transition">
              <span class="material-symbols-outlined text-base text-secondary">dashboard</span>
              <span>Dashboard Saya</span>
            </a>
            <a href="peta-belajar.html" class="flex items-center gap-2 px-3.5 py-2 font-body-sm text-xs text-on-surface hover:bg-surface-container transition">
              <span class="material-symbols-outlined text-base text-secondary">map</span>
              <span>Peta Belajar</span>
            </a>
            <div class="border-t border-outline-variant/30 my-1"></div>
            <button id="btn-logout-session" class="w-full text-left flex items-center gap-2 px-3.5 py-2 font-body-sm text-xs text-error hover:bg-error-container/20 transition">
              <span class="material-symbols-outlined text-base">logout</span>
              <span>Keluar Sesi</span>
            </button>
          </div>
        </div>
      `;

      const btnLogout = document.getElementById("btn-logout-session");
      if (btnLogout) {
        btnLogout.addEventListener("click", handleLogout);
      }
    }
  }

  function renderLoggedOut() {
    if (headerAuthContainer) {
      headerAuthContainer.innerHTML = `
        <a href="login.html" class="flex items-center gap-1.5 px-3.5 py-2 bg-secondary text-on-secondary rounded-lg font-headline-md text-xs font-bold hover:bg-secondary/90 shadow-sm transition">
          <span class="material-symbols-outlined text-sm">login</span>
          <span>Masuk / Daftar</span>
        </a>
      `;
    }
  }

  // 1. Cek Sesi Cache LocalStorage
  const cachedUser = localStorage.getItem("ruanglogika_user");
  if (cachedUser) {
    try {
      renderLoggedIn(JSON.parse(cachedUser));
    } catch (e) {
      console.error(e);
    }
  } else {
    renderLoggedOut();
  }

  // 2. Cek Real-time Firebase Auth
  if (isConfigured && auth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          namaLengkap: user.displayName || "Siswa Ruang Logika",
          email: user.email,
          role: "siswa"
        };
        renderLoggedIn(userData);
      } else {
        if (!cachedUser) {
          renderLoggedOut();
        }
      }
    });
  }
}

/**
 * Handle Logout
 */
async function handleLogout() {
  if (isConfigured && auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Firebase signout error:", e);
    }
  }
  localStorage.removeItem("ruanglogika_user");
  showAppToast("Berhasil keluar dari akun.", "info");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 600);
}

/**
 * 3. MODE SELECTOR DROPDOWN (Siswa, Guru, Admin, Auth)
 */
export function initModeSwitcher() {
  const modeSelect = document.getElementById("modeSelector");
  if (!modeSelect) return;

  modeSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "siswa") {
      window.location.href = "dashboard-siswa.html";
    } else if (val === "guru") {
      window.location.href = "dashboard-guru.html";
    } else if (val === "admin") {
      window.location.href = "dashboard-admin.html";
    } else if (val === "auth") {
      window.location.href = "login.html";
    }
  });
}

/**
 * 4. INTERAKTIVITAS MINI STACK SIMULATOR (Beranda Sandbox)
 * Mengontrol simulasi LIFO real-time di hero banner Beranda
 */
export function initLiveStackSandbox() {
  const stackContainer = document.getElementById("stack-container");
  const btnPush = document.getElementById("btn-push");
  const btnPop = document.getElementById("btn-pop");
  const statusText = document.getElementById("stack-status-text");

  if (!stackContainer || !btnPush || !btnPop) return;

  const sampleFunctions = [
    "eval_token()",
    "hitung_faktorial()",
    "simpan_checkpoint()",
    "baca_input_keyboard()",
    "validasi_ekspresi()",
    "proses_rekursi()"
  ];

  function updateStackVisuals() {
    const items = stackContainer.children;
    const count = items.length;

    for (let i = 0; i < count; i++) {
      const item = items[i];
      const isTop = (i === count - 1);
      const idxLabel = item.querySelector("span:first-child");
      const iconSpan = item.querySelector("span:last-child");

      if (isTop) {
        item.className = "w-full py-2 px-3 bg-secondary text-on-secondary rounded-lg text-center font-label-md text-xs shadow-md flex items-center justify-between ring-2 ring-secondary-container transition-all duration-300";
        if (idxLabel) {
          idxLabel.textContent = `[TOP ${i}]`;
          idxLabel.className = "opacity-90 text-[10px] font-mono font-bold";
        }
        if (iconSpan) {
          iconSpan.className = "material-symbols-outlined text-xs animate-bounce";
          iconSpan.textContent = "arrow_downward";
        }
      } else {
        item.className = "w-full py-2 px-3 bg-primary-container text-on-primary rounded-lg text-center font-label-md text-xs shadow-sm flex items-center justify-between transition-all duration-300";
        if (idxLabel) {
          idxLabel.textContent = `[idx ${i}]`;
          idxLabel.className = "opacity-60 text-[10px] font-mono";
        }
        if (iconSpan) {
          iconSpan.className = "material-symbols-outlined text-xs text-secondary-container";
          iconSpan.textContent = "layers";
        }
      }
    }

    if (statusText) {
      if (count === 0) {
        statusText.textContent = "Status: Stack Kosong (Underflow condition jika di-Pop).";
        statusText.className = "font-label-md text-[11px] text-error font-semibold text-center";
      } else if (count >= 5) {
        statusText.textContent = `Status: ${count}/5 Kapasitas Maksimal (Stack Penuh).`;
        statusText.className = "font-label-md text-[11px] text-tertiary-fixed-dim font-bold text-center";
      } else {
        statusText.textContent = `Status: ${count} node memory aktif dalam tumpukan LIFO.`;
        statusText.className = "font-label-md text-[11px] text-secondary font-semibold text-center";
      }
    }
  }

  btnPush.addEventListener("click", () => {
    if (stackContainer.children.length >= 5) {
      showAppToast("Batas visual tumpukan penuh! Lakukan Pop() terlebih dahulu.", "warning");
      return;
    }

    const randomFn = sampleFunctions[Math.floor(Math.random() * sampleFunctions.length)];
    const newItem = document.createElement("div");
    newItem.innerHTML = `
      <span></span>
      <span class="font-bold">${randomFn}</span>
      <span></span>
    `;
    stackContainer.appendChild(newItem);
    updateStackVisuals();
    showAppToast(`Push("${randomFn}") berhasil dieksekusi.`, "success");
  });

  btnPop.addEventListener("click", () => {
    if (stackContainer.children.length > 0) {
      const popped = stackContainer.lastElementChild;
      const fnName = popped.querySelector("span:nth-child(2)")?.textContent || "node";
      stackContainer.removeChild(popped);
      updateStackVisuals();
      showAppToast(`Pop() berhasil mengeluarkan: ${fnName}`, "info");
    } else {
      showAppToast("Stack Underflow! Tidak ada node tersisa untuk di-Pop.", "error");
    }
  });

  updateStackVisuals();
}

/**
 * 5. TOAST NOTIFICATION COMPONENT
 * Notifikasi melayang elegan untuk feedback aktivitas pengguna
 */
export function showAppToast(message, type = "info", icon = null) {
  let toastContainer = document.getElementById("app-toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "app-toast-container";
    toastContainer.className = "fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  let bgClass = "bg-primary text-on-primary";
  let defaultIcon = "info";

  if (type === "success") {
    bgClass = "bg-[#006A61] text-white";
    defaultIcon = "check_circle";
  } else if (type === "error") {
    bgClass = "bg-[#BA1A1A] text-white";
    defaultIcon = "error";
  } else if (type === "warning") {
    bgClass = "bg-[#422D00] text-[#FFDEA7]";
    defaultIcon = "warning";
  }

  toast.className = `toast-animate-in flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl font-body-sm text-xs font-semibold ${bgClass} pointer-events-auto transition-all duration-300`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-base">${icon || defaultIcon}</span>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Pasang fungsi ke window scope agar bisa dipanggil dari inline HTML
window.showAppToast = showAppToast;
window.handleLogout = handleLogout;

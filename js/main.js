/**
 * RUANG LOGIKA — Main UI & Navigation Engine (js/main.js)
 * Platform Pembelajaran Interaktif Struktur Data & Algoritma SMA
 * Pengembang: Yusuf Nurul Huda
 * Identitas Warna: #17324D, #22A699, #F4B942, #F5F7FA
 */

import { auth, isConfigured } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Helper escape HTML
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Inisialisasi saat DOM siap atau langsung jika sudah parsed
function runGlobalAppInit() {
  initNavigationHighlight();
  initSessionCheck();
  initModeSwitcher();
  initMobileDrawerNav();
  initLiveStackSandbox();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runGlobalAppInit);
} else {
  runGlobalAppInit();
}

/**
 * 1. PENGATURAN NAVIGASI AKTIF (Desktop Navbar)
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
 * 2. PENGECEKAN SESI PENGGUNA & DROPDOWN PROFIL STABIL (NO FLICKER)
 * Memperbarui header dengan avatar, nama pengguna, XP, dan status autentikasi.
 * Dilengkapi Invisible Hover Bridge dan Click-Outside Toggle agar dropdown tidak menutup tiba-tiba.
 */
export function initSessionCheck() {
  const headerAuthContainer = document.getElementById("header-auth-container");
  const userXpBadge = document.querySelector(".user-display-xp");
  const userNameElem = document.querySelector(".user-display-name");
  const userRoleElem = document.querySelector(".user-display-role");

  function renderLoggedIn(userData) {
    if (userNameElem) userNameElem.textContent = userData.namaLengkap || "Siswa Ruang Logika";
    if (userRoleElem) {
      const roleText = userData.role === "guru" ? "Guru Pengampu" : userData.role === "admin" ? "Administrator Lab" : (userData.kelas || "Kelas X-1");
      userRoleElem.textContent = roleText;
    }
    if (userXpBadge) userXpBadge.textContent = `Level ${userData.level || 4} • ${userData.xp || 850} XP`;

    // Render Dropdown / Profil di Header
    if (headerAuthContainer) {
      const firstName = userData.namaLengkap ? userData.namaLengkap.split(" ")[0] : "Siswa";
      const roleLabel = userData.role === 'guru' ? 'Guru' : userData.role === 'admin' ? 'Admin' : 'Siswa X';
      const dashboardUrl = userData.role === 'guru' ? 'dashboard-guru.html' : userData.role === 'admin' ? 'dashboard-admin.html' : 'dashboard-siswa.html';

      headerAuthContainer.innerHTML = `
        <div class="profile-dropdown-wrapper relative" id="user-profile-menu-container">
          <button id="user-profile-menu-btn" type="button" aria-expanded="false" aria-haspopup="true" class="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-secondary/50 transition cursor-pointer">
            <img class="w-8 h-8 rounded-full object-cover ring-2 ring-secondary/50 shadow-xs pointer-events-none" src="${userData.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCp5yoZ9-DFdkNzCm73mXsTzRLeADM0-hPTv2h5pgW0AaUfvOZzxN0jbkvq8NzswMk3vfIL-uklAVPFCJQUiapbhNmG9w3-UVxd_vxMVdAMSf7qcQ0JlFr0U6hPCCknQWky8yE9RhAwYkdZA7MOhi7DVvqqL4CpJnklC1ywkq4KZJkj00oxj07bSxUL9aA6r8Cl5-jX6703sSTfy0CgbGPznbCJESzILrCtZvnkeGwTVPlPlGxYbYAN'}" alt="Foto Profil"/>
            <div class="hidden md:flex flex-col text-left pointer-events-none">
              <span class="font-label-md text-xs font-bold text-on-surface leading-tight">${escapeHtml(firstName)}</span>
              <span class="font-label-md text-[10px] text-on-surface-variant leading-none">${escapeHtml(roleLabel)}</span>
            </div>
            <span id="user-profile-arrow" class="material-symbols-outlined text-xs text-on-surface-variant transition-transform duration-200 pointer-events-none">expand_more</span>
          </button>
          
          <!-- Dropdown Sesi dengan Invisible Bridge (profile-dropdown-bridge) -->
          <div id="user-profile-dropdown" class="profile-dropdown-menu profile-dropdown-bridge absolute right-0 top-full pt-2 w-56 hidden z-50 transition-all duration-150">
            <div class="bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/40 py-2 overflow-hidden ring-1 ring-black/5">
              <div class="px-4 py-2.5 border-b border-outline-variant/30 bg-surface-container-low/40">
                <p class="font-headline-md text-xs font-bold text-primary truncate">${escapeHtml(userData.namaLengkap || "Siswa")}</p>
                <p class="font-label-md text-[10px] text-on-surface-variant truncate">${escapeHtml(userData.email || "siswa@ruanglogika.id")}</p>
                <div class="mt-1.5 flex items-center gap-1.5 text-[10px] font-label-md font-semibold text-secondary">
                  <span class="material-symbols-outlined text-xs">verified</span>
                  <span>${userData.role === 'guru' ? 'Pendidik Resmi' : userData.role === 'admin' ? 'Administrator' : 'Siswa Terdaftar'}</span>
                </div>
              </div>
              <div class="py-1">
                <a href="${dashboardUrl}" class="flex items-center gap-2.5 px-4 py-2 font-body-sm text-xs text-on-surface hover:bg-surface-container transition">
                  <span class="material-symbols-outlined text-base text-secondary">dashboard</span>
                  <span>Dashboard Saya</span>
                </a>
                <a href="peta-belajar.html" class="flex items-center gap-2.5 px-4 py-2 font-body-sm text-xs text-on-surface hover:bg-surface-container transition">
                  <span class="material-symbols-outlined text-base text-secondary">map</span>
                  <span>Peta Belajar</span>
                </a>
                <a href="kuis.html" class="flex items-center gap-2.5 px-4 py-2 font-body-sm text-xs text-on-surface hover:bg-surface-container transition">
                  <span class="material-symbols-outlined text-base text-secondary">task_alt</span>
                  <span>Uji Kompetensi</span>
                </a>
              </div>
              <div class="border-t border-outline-variant/30 my-1"></div>
              <div class="px-1.5 pb-0.5">
                <button id="btn-logout-session" type="button" class="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg font-body-sm text-xs text-error hover:bg-error-container/20 transition cursor-pointer">
                  <span class="material-symbols-outlined text-base">logout</span>
                  <span>Keluar Sesi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Hubungkan Event Interaktif Dropdown (Click Toggle + Click Outside + Hover Bridge)
      setupProfileDropdown();

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
  const cachedUser = localStorage.getItem("ruanglogika_user") || localStorage.getItem("ruanglogika_auth_user");
  if (cachedUser) {
    try {
      renderLoggedIn(JSON.parse(cachedUser));
    } catch (e) {
      console.error(e);
      renderLoggedOut();
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
 * Pengaturan Logika Dropdown Profil Bebas Flicker:
 * - Click toggle membuka & menutup
 * - Hover tetap berfungsi halus dengan invisible bridge
 * - Menutup otomatis ketika klik di luar container (click outside)
 * - Menutup saat tombol ESC ditekan
 */
function setupProfileDropdown() {
  const container = document.getElementById("user-profile-menu-container");
  const btn = document.getElementById("user-profile-menu-btn");
  const dropdown = document.getElementById("user-profile-dropdown");
  const arrow = document.getElementById("user-profile-arrow");

  if (!container || !btn || !dropdown) return;

  let isOpen = false;

  function openDropdown() {
    isOpen = true;
    dropdown.classList.remove("hidden");
    dropdown.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    if (arrow) arrow.style.transform = "rotate(180deg)";
  }

  function closeDropdown() {
    isOpen = false;
    dropdown.classList.add("hidden");
    dropdown.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    if (arrow) arrow.style.transform = "rotate(0deg)";
  }

  // Toggle on click
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // Hover support without flicker:
  container.addEventListener("mouseenter", () => {
    openDropdown();
  });

  container.addEventListener("mouseleave", () => {
    // Memberikan buffer 150ms agar tidak menutup jika kursor melintas cepat
    setTimeout(() => {
      if (!container.matches(":hover")) {
        closeDropdown();
      }
    }, 150);
  });

  // Click outside to close
  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      closeDropdown();
    }
  });

  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      closeDropdown();
    }
  });
}

/**
 * 3. PERBAIKAN DRAWER NAVIGATION MODE MOBILE (TAMPILAN HP)
 * Menyediakan tombol hamburger responsif dan menu drawer samping yang rapi:
 * - Navigasi Cepat: Beranda, Peta Belajar, Materi, Lab Interaktif, Tantangan, Kuis
 * - Sembunyi secara default di mobile dan hanya terbuka lewat overlay
 */
export function initMobileDrawerNav() {
  const header = document.querySelector("header");
  if (!header) return;

  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  // Periksa apakah tombol hamburger sudah ada, jika belum, buat tombol di header
  let hamburgerBtn = document.getElementById("btn-mobile-nav-toggle");
  if (!hamburgerBtn) {
    const leftLogoContainer = header.querySelector(".h-16 > div:first-child");
    if (leftLogoContainer) {
      hamburgerBtn = document.createElement("button");
      hamburgerBtn.id = "btn-mobile-nav-toggle";
      hamburgerBtn.type = "button";
      hamburgerBtn.setAttribute("aria-label", "Buka Menu Navigasi");
      hamburgerBtn.className = "xl:hidden p-2 -ml-1 rounded-xl text-primary hover:bg-surface-container-high transition cursor-pointer flex items-center justify-center";
      hamburgerBtn.innerHTML = `<span class="material-symbols-outlined text-2xl">menu</span>`;
      leftLogoContainer.insertBefore(hamburgerBtn, leftLogoContainer.firstChild);
    }
  }

  // Cek apakah drawer DOM sudah dibuat
  let drawer = document.getElementById("mobile-nav-drawer");
  let backdrop = document.getElementById("mobile-nav-backdrop");

  if (!drawer) {
    // Backdrop
    backdrop = document.createElement("div");
    backdrop.id = "mobile-nav-backdrop";
    backdrop.className = "fixed inset-0 z-50 bg-primary/50 backdrop-blur-xs hidden mobile-backdrop-transition opacity-0";
    document.body.appendChild(backdrop);

    // Drawer Container
    drawer = document.createElement("aside");
    drawer.id = "mobile-nav-drawer";
    drawer.className = "fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-surface-container-lowest z-50 shadow-2xl flex flex-col justify-between -translate-x-full mobile-nav-drawer-transition border-r border-outline-variant/30";
    
    // Quick Nav Links 6 Item Wajib
    const navItems = [
      { name: "Beranda", url: "index.html", icon: "home" },
      { name: "Peta Belajar", url: "peta-belajar.html", icon: "map" },
      { name: "Materi Pembelajaran", url: "materi.html", icon: "menu_book" },
      { name: "Laboratorium Virtual", url: "laboratorium.html", icon: "science" },
      { name: "Studi Kasus (Tantangan)", url: "tantangan.html", icon: "psychology" },
      { name: "Uji Kompetensi (Kuis)", url: "kuis.html", icon: "task_alt" }
    ];

    let navListHtml = "";
    navItems.forEach(item => {
      const isActive = item.url === currentPath || (currentPath === "" && item.url === "index.html");
      navListHtml += `
        <a href="${item.url}" class="mobile-nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-headline-md font-semibold transition ${
          isActive 
            ? "bg-primary-container text-on-primary-container font-bold shadow-xs" 
            : "text-on-surface hover:bg-surface-container"
        }">
          <span class="material-symbols-outlined text-lg ${isActive ? "text-secondary" : "text-on-surface-variant"}">${item.icon}</span>
          <span>${item.name}</span>
        </a>
      `;
    });

    drawer.innerHTML = `
      <div class="flex flex-col h-full overflow-y-auto">
        <!-- Header Drawer -->
        <div class="h-16 px-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/40">
          <a class="flex items-center gap-2.5" href="index.html">
            <div class="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-on-secondary shadow-xs">
              <span class="material-symbols-outlined text-lg">account_tree</span>
            </div>
            <div class="flex flex-col">
              <span class="font-headline-md text-base font-bold text-primary leading-none">Ruang Logika</span>
              <span class="font-label-md text-[10px] text-secondary font-semibold mt-0.5">Media Belajar SMA</span>
            </div>
          </a>
          <button id="btn-close-mobile-drawer" type="button" aria-label="Tutup Menu" class="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Section Label & Navigasi Cepat -->
        <div class="p-4 flex flex-col gap-1.5">
          <div class="px-2 pb-1.5">
            <span class="font-label-md text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Navigasi Cepat</span>
          </div>
          <nav class="flex flex-col gap-1">
            ${navListHtml}
          </nav>

          <!-- Portal Akses -->
          <div class="mt-4 pt-4 border-t border-outline-variant/30 flex flex-col gap-1">
            <div class="px-2 pb-1">
              <span class="font-label-md text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Portal Pengguna</span>
            </div>
            <a href="dashboard-siswa.html" class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-body-sm text-on-surface hover:bg-surface-container transition">
              <span class="material-symbols-outlined text-lg text-secondary">school</span>
              <span>Dashboard Siswa</span>
            </a>
            <a href="dashboard-guru.html" class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-body-sm text-on-surface hover:bg-surface-container transition">
              <span class="material-symbols-outlined text-lg text-primary">co_present</span>
              <span>Dashboard Guru</span>
            </a>
            <a href="dashboard-admin.html" class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-body-sm text-on-surface hover:bg-surface-container transition">
              <span class="material-symbols-outlined text-lg text-purple-700">admin_panel_settings</span>
              <span>Dashboard Admin</span>
            </a>
          </div>
        </div>

        <!-- Footer Drawer Profil & Identitas -->
        <div class="mt-auto p-4 border-t border-outline-variant/30 bg-surface-container-low/30 flex flex-col gap-2">
          <div class="flex items-center gap-2 text-xs">
            <span class="material-symbols-outlined text-secondary text-base">verified</span>
            <span class="font-label-md text-[11px] text-on-surface-variant font-medium user-display-xp">Level 4 • 850 XP</span>
          </div>
          <div class="font-label-md text-[10px] text-on-surface-variant">
            Pengembang: <strong class="text-primary">Yusuf Nurul Huda</strong>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(drawer);
  }

  // Toggle Functionality
  function openMobileDrawer() {
    backdrop.classList.remove("hidden");
    requestAnimationFrame(() => {
      backdrop.classList.remove("opacity-0");
      backdrop.classList.add("opacity-100");
      drawer.classList.remove("-translate-x-full");
      drawer.classList.add("translate-x-0");
    });
    document.body.classList.add("overflow-hidden");
  }

  function closeMobileDrawer() {
    backdrop.classList.remove("opacity-100");
    backdrop.classList.add("opacity-0");
    drawer.classList.remove("translate-x-0");
    drawer.classList.add("-translate-x-full");
    document.body.classList.remove("overflow-hidden");
    setTimeout(() => {
      backdrop.classList.add("hidden");
    }, 280);
  }

  if (hamburgerBtn) {
    hamburgerBtn.onclick = (e) => {
      e.stopPropagation();
      openMobileDrawer();
    };
  }

  const closeBtn = document.getElementById("btn-close-mobile-drawer");
  if (closeBtn) {
    closeBtn.onclick = closeMobileDrawer;
  }

  if (backdrop) {
    backdrop.onclick = closeMobileDrawer;
  }

  // Close when clicking any nav link
  const navLinks = drawer.querySelectorAll("a");
  navLinks.forEach(link => {
    link.addEventListener("click", closeMobileDrawer);
  });

  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !drawer.classList.contains("-translate-x-full")) {
      closeMobileDrawer();
    }
  });
}

/**
 * Handle Logout: Hancurkan sesi Firebase Auth & LocalStorage lalu alihkan ke login.html
 */
export async function handleLogout() {
  if (confirm("Apakah Anda yakin ingin keluar dari akun Ruang Logika?")) {
    if (isConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("Firebase signout error:", e);
      }
    }
    localStorage.removeItem("ruanglogika_user");
    localStorage.removeItem("ruanglogika_auth_user");
    showAppToast("Sesi berhasil diakhiri. Mengalihkan ke halaman masuk...", "info");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 400);
  }
}

// Pasang event listener logout global ke semua tombol logout
document.addEventListener("DOMContentLoaded", () => {
  const logoutButtons = document.querySelectorAll("#btn-logout, .btn-logout-action, #btn-logout-session");
  logoutButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogout();
    });
  });
});

/**
 * 4. MODE SELECTOR DROPDOWN (Siswa, Guru, Admin, Auth)
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
 * 5. INTERAKTIVITAS MINI STACK SIMULATOR (Beranda Sandbox)
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
 * 6. TOAST NOTIFICATION COMPONENT
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

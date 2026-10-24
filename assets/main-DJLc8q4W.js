import{r as e,t}from"./firebase-config-DMOTfB5-.js";import{onAuthStateChanged as n,signOut as r}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";function i(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}function a(){o(),s(),d(),l(),f()}document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,a):a();function o(){let e=window.location.pathname.split(`/`).pop()||`index.html`;document.querySelectorAll(`header nav a`).forEach(t=>{let n=t.getAttribute(`href`);n===e||e===``&&n===`index.html`?(t.className=`px-3 py-2 transition-colors bg-primary-container text-on-primary-container font-headline-md text-body-sm rounded-lg shadow-sm`,t.setAttribute(`aria-current`,`page`)):(t.className=`px-3 py-2 rounded-lg font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors`,t.removeAttribute(`aria-current`))})}function s(){let r=document.getElementById(`header-auth-container`),a=document.querySelector(`.user-display-xp`),o=document.querySelector(`.user-display-name`),s=document.querySelector(`.user-display-role`);function l(e){if(o&&(o.textContent=e.namaLengkap||`Siswa Ruang Logika`),s){let t=e.role===`guru`?`Guru Pengampu`:e.role===`admin`?`Administrator Lab`:e.kelas||`Kelas X-1`;s.textContent=t}if(a&&(a.textContent=`Level ${e.level||4} • ${e.xp||850} XP`),r){let t=e.namaLengkap?e.namaLengkap.split(` `)[0]:`Siswa`,n=e.role===`guru`?`Guru`:e.role===`admin`?`Admin`:`Siswa X`,a=e.role===`guru`?`dashboard-guru.html`:e.role===`admin`?`dashboard-admin.html`:`dashboard-siswa.html`;r.innerHTML=`
        <div class="profile-dropdown-wrapper relative" id="user-profile-menu-container">
          <button id="user-profile-menu-btn" type="button" aria-expanded="false" aria-haspopup="true" class="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-secondary/50 transition cursor-pointer">
            <img class="w-8 h-8 rounded-full object-cover ring-2 ring-secondary/50 shadow-xs pointer-events-none" src="${e.avatarUrl||`https://lh3.googleusercontent.com/aida-public/AB6AXuCp5yoZ9-DFdkNzCm73mXsTzRLeADM0-hPTv2h5pgW0AaUfvOZzxN0jbkvq8NzswMk3vfIL-uklAVPFCJQUiapbhNmG9w3-UVxd_vxMVdAMSf7qcQ0JlFr0U6hPCCknQWky8yE9RhAwYkdZA7MOhi7DVvqqL4CpJnklC1ywkq4KZJkj00oxj07bSxUL9aA6r8Cl5-jX6703sSTfy0CgbGPznbCJESzILrCtZvnkeGwTVPlPlGxYbYAN`}" alt="Foto Profil"/>
            <div class="hidden md:flex flex-col text-left pointer-events-none">
              <span class="font-label-md text-xs font-bold text-on-surface leading-tight">${i(t)}</span>
              <span class="font-label-md text-[10px] text-on-surface-variant leading-none">${i(n)}</span>
            </div>
            <span id="user-profile-arrow" class="material-symbols-outlined text-xs text-on-surface-variant transition-transform duration-200 pointer-events-none">expand_more</span>
          </button>
          
          <!-- Dropdown Sesi dengan Invisible Bridge (profile-dropdown-bridge) -->
          <div id="user-profile-dropdown" class="profile-dropdown-menu profile-dropdown-bridge absolute right-0 top-full pt-2 w-56 hidden z-50 transition-all duration-150">
            <div class="bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/40 py-2 overflow-hidden ring-1 ring-black/5">
              <div class="px-4 py-2.5 border-b border-outline-variant/30 bg-surface-container-low/40">
                <p class="font-headline-md text-xs font-bold text-primary truncate">${i(e.namaLengkap||`Siswa`)}</p>
                <p class="font-label-md text-[10px] text-on-surface-variant truncate">${i(e.email||`siswa@ruanglogika.id`)}</p>
                <div class="mt-1.5 flex items-center gap-1.5 text-[10px] font-label-md font-semibold text-secondary">
                  <span class="material-symbols-outlined text-xs">verified</span>
                  <span>${e.role===`guru`?`Pendidik Resmi`:e.role===`admin`?`Administrator`:`Siswa Terdaftar`}</span>
                </div>
              </div>
              <div class="py-1">
                <a href="${a}" class="flex items-center gap-2.5 px-4 py-2 font-body-sm text-xs text-on-surface hover:bg-surface-container transition">
                  <span class="material-symbols-outlined text-base text-secondary">dashboard</span>
                  <span>Dashboard Saya</span>
                </a>
                ${e.role!==`guru`&&e.role!==`admin`?`
                <a href="peta-belajar.html" class="flex items-center gap-2.5 px-4 py-2 font-body-sm text-xs text-on-surface hover:bg-surface-container transition">
                  <span class="material-symbols-outlined text-base text-secondary">map</span>
                  <span>Peta Belajar</span>
                </a>
                <a href="kuis.html" class="flex items-center gap-2.5 px-4 py-2 font-body-sm text-xs text-on-surface hover:bg-surface-container transition">
                  <span class="material-symbols-outlined text-base text-secondary">task_alt</span>
                  <span>Uji Kompetensi</span>
                </a>
                `:``}
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
      `,c();let o=document.getElementById(`btn-logout-session`);o&&o.addEventListener(`click`,u)}}function d(){r&&(r.innerHTML=`
        <a href="login.html" class="flex items-center gap-1.5 px-3.5 py-2 bg-secondary text-on-secondary rounded-lg font-headline-md text-xs font-bold hover:bg-secondary/90 shadow-sm transition">
          <span class="material-symbols-outlined text-sm">login</span>
          <span>Masuk / Daftar</span>
        </a>
      `)}let f=localStorage.getItem(`ruanglogika_user`)||localStorage.getItem(`ruanglogika_auth_user`);if(f)try{l(JSON.parse(f))}catch(e){console.error(e),d()}else d();e&&t&&n(t,e=>{e?l({uid:e.uid,namaLengkap:e.displayName||`Siswa Ruang Logika`,email:e.email,role:`siswa`}):f||d()})}function c(){let e=document.getElementById(`user-profile-menu-container`),t=document.getElementById(`user-profile-menu-btn`),n=document.getElementById(`user-profile-dropdown`),r=document.getElementById(`user-profile-arrow`);if(!e||!t||!n)return;let i=!1;function a(){i=!0,n.classList.remove(`hidden`),n.classList.add(`is-open`),t.setAttribute(`aria-expanded`,`true`),r&&(r.style.transform=`rotate(180deg)`)}function o(){i=!1,n.classList.add(`hidden`),n.classList.remove(`is-open`),t.setAttribute(`aria-expanded`,`false`),r&&(r.style.transform=`rotate(0deg)`)}t.addEventListener(`click`,e=>{e.stopPropagation(),i?o():a()}),e.addEventListener(`mouseenter`,()=>{a()}),e.addEventListener(`mouseleave`,()=>{setTimeout(()=>{e.matches(`:hover`)||o()},150)}),document.addEventListener(`click`,t=>{e.contains(t.target)||o()}),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&i&&o()})}function l(){let e=document.querySelector(`header`);if(!e||document.getElementById(`dashboard-sidebar`))return;let t=window.location.pathname.split(`/`).pop()||`index.html`,n=document.getElementById(`btn-mobile-nav-toggle`);if(!n){let t=e.querySelector(`.h-16 > div:first-child`);t&&(n=document.createElement(`button`),n.id=`btn-mobile-nav-toggle`,n.type=`button`,n.setAttribute(`aria-label`,`Buka Menu Navigasi`),n.className=`xl:hidden p-2 -ml-1 rounded-xl text-primary hover:bg-surface-container-high transition cursor-pointer flex items-center justify-center`,n.innerHTML=`<span class="material-symbols-outlined text-2xl">menu</span>`,t.insertBefore(n,t.firstChild))}let r=document.getElementById(`mobile-nav-drawer`),i=document.getElementById(`mobile-nav-backdrop`);if(!r){i=document.createElement(`div`),i.id=`mobile-nav-backdrop`,i.className=`fixed inset-0 z-50 bg-primary/50 backdrop-blur-xs hidden mobile-backdrop-transition opacity-0`,document.body.appendChild(i),r=document.createElement(`aside`),r.id=`mobile-nav-drawer`,r.className=`fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-surface-container-lowest z-50 shadow-2xl flex flex-col justify-between -translate-x-full mobile-nav-drawer-transition border-r border-outline-variant/30`;let e=[{name:`Beranda`,url:`index.html`,icon:`home`},{name:`Peta Belajar`,url:`peta-belajar.html`,icon:`map`},{name:`Materi Pembelajaran`,url:`materi.html`,icon:`menu_book`},{name:`Laboratorium Virtual`,url:`laboratorium.html`,icon:`science`},{name:`Studi Kasus (Tantangan)`,url:`tantangan.html`,icon:`psychology`},{name:`Uji Kompetensi (Kuis)`,url:`kuis.html`,icon:`task_alt`}],n=``;e.forEach(e=>{let r=e.url===t||t===``&&e.url===`index.html`;n+=`
        <a href="${e.url}" class="mobile-nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-headline-md font-semibold transition ${r?`bg-primary-container text-on-primary-container font-bold shadow-xs`:`text-on-surface hover:bg-surface-container`}">
          <span class="material-symbols-outlined text-lg ${r?`text-secondary`:`text-on-surface-variant`}">${e.icon}</span>
          <span>${e.name}</span>
        </a>
      `}),r.innerHTML=`
      <div class="flex flex-col h-full overflow-y-auto">
        <!-- Header Drawer -->
        <div class="h-16 px-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/40">
          <a class="flex items-center gap-2.5" href="index.html">
            <div class="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-on-secondary shadow-xs">
              <span class="material-symbols-outlined text-lg">account_tree</span>
            </div>
            <span class="font-headline-md text-base font-bold text-primary">Ruang Logika</span>
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
            ${n}
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
    `,document.body.appendChild(r)}function a(){i.classList.remove(`hidden`),requestAnimationFrame(()=>{i.classList.remove(`opacity-0`),i.classList.add(`opacity-100`),r.classList.remove(`-translate-x-full`),r.classList.add(`translate-x-0`)}),document.body.classList.add(`overflow-hidden`)}function o(){i.classList.remove(`opacity-100`),i.classList.add(`opacity-0`),r.classList.remove(`translate-x-0`),r.classList.add(`-translate-x-full`),document.body.classList.remove(`overflow-hidden`),setTimeout(()=>{i.classList.add(`hidden`)},280)}n&&(n.onclick=e=>{e.stopPropagation(),a()});let s=document.getElementById(`btn-close-mobile-drawer`);s&&(s.onclick=o),i&&(i.onclick=o),r.querySelectorAll(`a`).forEach(e=>{e.addEventListener(`click`,o)}),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&!r.classList.contains(`-translate-x-full`)&&o()})}async function u(){if(confirm(`Apakah Anda yakin ingin keluar dari akun Ruang Logika?`)){if(e&&t)try{await r(t)}catch(e){console.warn(`Firebase signout error:`,e)}localStorage.removeItem(`ruanglogika_user`),localStorage.removeItem(`ruanglogika_auth_user`),p(`Sesi berhasil diakhiri. Mengalihkan ke halaman masuk...`,`info`),setTimeout(()=>{window.location.href=`login.html`},400)}}document.addEventListener(`DOMContentLoaded`,()=>{document.querySelectorAll(`#btn-logout, .btn-logout-action, #btn-logout-session`).forEach(e=>{e.addEventListener(`click`,e=>{e.preventDefault(),u()})})});function d(){let e=document.getElementById(`modeSelector`);e&&e.addEventListener(`change`,e=>{let t=e.target.value;t===`siswa`?window.location.href=`dashboard-siswa.html`:t===`guru`?window.location.href=`dashboard-guru.html`:t===`admin`?window.location.href=`dashboard-admin.html`:t===`auth`&&(window.location.href=`login.html`)})}function f(){let e=document.getElementById(`stack-container`),t=document.getElementById(`btn-push`),n=document.getElementById(`btn-pop`),r=document.getElementById(`stack-status-text`);if(!e||!t||!n)return;let i=[`eval_token()`,`hitung_faktorial()`,`simpan_checkpoint()`,`baca_input_keyboard()`,`validasi_ekspresi()`,`proses_rekursi()`];function a(){let t=e.children,n=t.length;for(let e=0;e<n;e++){let r=t[e],i=e===n-1,a=r.querySelector(`span:first-child`),o=r.querySelector(`span:last-child`);i?(r.className=`w-full py-2 px-3 bg-secondary text-on-secondary rounded-lg text-center font-label-md text-xs shadow-md flex items-center justify-between ring-2 ring-secondary-container transition-all duration-300`,a&&(a.textContent=`[TOP ${e}]`,a.className=`opacity-90 text-[10px] font-mono font-bold`),o&&(o.className=`material-symbols-outlined text-xs animate-bounce`,o.textContent=`arrow_downward`)):(r.className=`w-full py-2 px-3 bg-primary-container text-on-primary rounded-lg text-center font-label-md text-xs shadow-sm flex items-center justify-between transition-all duration-300`,a&&(a.textContent=`[idx ${e}]`,a.className=`opacity-60 text-[10px] font-mono`),o&&(o.className=`material-symbols-outlined text-xs text-secondary-container`,o.textContent=`layers`))}r&&(n===0?(r.textContent=`Status: Stack Kosong (Underflow condition jika di-Pop).`,r.className=`font-label-md text-[11px] text-error font-semibold text-center`):n>=5?(r.textContent=`Status: ${n}/5 Kapasitas Maksimal (Stack Penuh).`,r.className=`font-label-md text-[11px] text-tertiary-fixed-dim font-bold text-center`):(r.textContent=`Status: ${n} node memory aktif dalam tumpukan LIFO.`,r.className=`font-label-md text-[11px] text-secondary font-semibold text-center`))}t.addEventListener(`click`,()=>{if(e.children.length>=5){p(`Batas visual tumpukan penuh! Lakukan Pop() terlebih dahulu.`,`warning`);return}let t=i[Math.floor(Math.random()*i.length)],n=document.createElement(`div`);n.innerHTML=`
      <span></span>
      <span class="font-bold">${t}</span>
      <span></span>
    `,e.appendChild(n),a(),p(`Push("${t}") berhasil dieksekusi.`,`success`)}),n.addEventListener(`click`,()=>{if(e.children.length>0){let t=e.lastElementChild,n=t.querySelector(`span:nth-child(2)`)?.textContent||`node`;e.removeChild(t),a(),p(`Pop() berhasil mengeluarkan: ${n}`,`info`)}else p(`Stack Underflow! Tidak ada node tersisa untuk di-Pop.`,`error`)}),a()}function p(e,t=`info`,n=null){let r=document.getElementById(`app-toast-container`);r||(r=document.createElement(`div`),r.id=`app-toast-container`,r.className=`fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none`,document.body.appendChild(r));let i=document.createElement(`div`),a=`bg-primary text-on-primary`,o=`info`;t===`success`?(a=`bg-[#006A61] text-white`,o=`check_circle`):t===`error`?(a=`bg-[#BA1A1A] text-white`,o=`error`):t===`warning`&&(a=`bg-[#422D00] text-[#FFDEA7]`,o=`warning`),i.className=`toast-animate-in flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl font-body-sm text-xs font-semibold ${a} pointer-events-auto transition-all duration-300`,i.innerHTML=`
    <span class="material-symbols-outlined text-base">${n||o}</span>
    <span>${e}</span>
  `,r.appendChild(i),setTimeout(()=>{i.style.opacity=`0`,i.style.transform=`translateY(10px)`,setTimeout(()=>{i.parentElement&&i.parentElement.removeChild(i)},300)},3e3)}window.showAppToast=p,window.handleLogout=u;
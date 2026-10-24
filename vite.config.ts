import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          login: path.resolve(__dirname, 'login.html'),
          register: path.resolve(__dirname, 'register.html'),
          lab: path.resolve(__dirname, 'laboratorium.html'),
          peta: path.resolve(__dirname, 'peta-belajar.html'),
          materi: path.resolve(__dirname, 'materi.html'),
          tantangan: path.resolve(__dirname, 'tantangan.html'),
          kuis: path.resolve(__dirname, 'kuis.html'),
          dashboardSiswa: path.resolve(__dirname, 'dashboard-siswa.html'),
          dashboardGuru: path.resolve(__dirname, 'dashboard-guru.html'),
          dashboardAdmin: path.resolve(__dirname, 'dashboard-admin.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

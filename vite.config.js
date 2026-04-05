import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'mpa',
  server: { open: true },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        tirads: resolve(__dirname, 'src/tools/tirads/tirads.html'),
        lirads: resolve(__dirname, 'src/tools/lirads/lirads.html'),
      },
    },
  },
});

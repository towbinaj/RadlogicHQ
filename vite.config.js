import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  appType: 'mpa',
  server: { open: true },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        tirads: resolve(__dirname, 'src/tools/tirads/tirads.html'),
        lirads: resolve(__dirname, 'src/tools/lirads/lirads.html'),
        profile: resolve(__dirname, 'src/pages/profile.html'),
        bosniak: resolve(__dirname, 'src/tools/bosniak/bosniak.html'),
        fleischner: resolve(__dirname, 'src/tools/fleischner/fleischner.html'),
        leglength: resolve(__dirname, 'src/tools/leglength/leglength.html'),
        reimers: resolve(__dirname, 'src/tools/reimers/reimers.html'),
        pirads: resolve(__dirname, 'src/tools/pirads/pirads.html'),
        orads: resolve(__dirname, 'src/tools/orads/orads.html'),
        lungrads: resolve(__dirname, 'src/tools/lungrads/lungrads.html'),
        pretext: resolve(__dirname, 'src/tools/pretext/pretext.html'),
        'adrenal-washout': resolve(__dirname, 'src/tools/adrenal-washout/adrenal-washout.html'),
        idrf: resolve(__dirname, 'src/tools/idrf/idrf.html'),
        privacy: resolve(__dirname, 'src/pages/privacy.html'),
      },
    },
  },
});

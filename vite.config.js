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
        recist: resolve(__dirname, 'src/tools/recist/recist.html'),
        curie: resolve(__dirname, 'src/tools/curie/curie.html'),
        deauville: resolve(__dirname, 'src/tools/deauville/deauville.html'),
        scoliosis: resolve(__dirname, 'src/tools/scoliosis/scoliosis.html'),
        rapno: resolve(__dirname, 'src/tools/rapno/rapno.html'),
        'aast-kidney': resolve(__dirname, 'src/tools/aast-kidney/aast-kidney.html'),
        'aast-liver': resolve(__dirname, 'src/tools/aast-liver/aast-liver.html'),
        'aast-spleen': resolve(__dirname, 'src/tools/aast-spleen/aast-spleen.html'),
        aspects: resolve(__dirname, 'src/tools/aspects/aspects.html'),
        birads: resolve(__dirname, 'src/tools/birads/birads.html'),
        nascet: resolve(__dirname, 'src/tools/nascet/nascet.html'),
        balthazar: resolve(__dirname, 'src/tools/balthazar/balthazar.html'),
        privacy: resolve(__dirname, 'src/pages/privacy.html'),
      },
    },
  },
});

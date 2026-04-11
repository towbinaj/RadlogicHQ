import { resolve } from 'path';
import { readdirSync } from 'fs';
import { defineConfig } from 'vite';

// Auto-discover all HTML entry points
const input = { main: resolve(__dirname, 'index.html') };

// Tools: src/tools/{toolId}/{toolId}.html
for (const dir of readdirSync('src/tools', { withFileTypes: true })) {
  if (dir.isDirectory()) {
    const html = `src/tools/${dir.name}/${dir.name}.html`;
    try { readdirSync(resolve(__dirname, `src/tools/${dir.name}`)).includes(`${dir.name}.html`) && (input[dir.name] = resolve(__dirname, html)); } catch {}
  }
}

// Pages: src/pages/{pageId}.html
for (const file of readdirSync('src/pages', { withFileTypes: true })) {
  if (file.isFile() && file.name.endsWith('.html')) {
    const name = file.name.replace('.html', '');
    input[name] = resolve(__dirname, `src/pages/${file.name}`);
  }
}

export default defineConfig({
  plugins: [],
  appType: 'mpa',
  server: { open: true },
  build: {
    outDir: 'dist',
    rollupOptions: { input },
  },
  test: {
    include: ['src/**/*.test.js'],
  },
});

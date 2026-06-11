// IDEIGLENES config mobilos teszthez — sima HTTP, SSL plugin nélkül.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 3001,
    host: true,
    strictPort: true,
    https: false,
  },
  resolve: {
    alias: {
      'fuse.js': path.resolve(__dirname, 'node_modules/fuse.js/dist/fuse.mjs'),
      'util': 'util',
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: { include: ['fuse.js'] },
});

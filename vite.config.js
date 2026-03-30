import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    port: 3000,
    host: true, // Listen on all addresses
    strictPort: true,
  },
  resolve: {
    alias: {
      'fuse.js': path.resolve(__dirname, 'node_modules/fuse.js/dist/fuse.mjs'),
      'util': 'util'
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    include: ['fuse.js']
  }
});

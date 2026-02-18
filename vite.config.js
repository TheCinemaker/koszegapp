import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Listen on all addresses
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      clientPort: 9999, // Connect via the Netlify proxy port
    },
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

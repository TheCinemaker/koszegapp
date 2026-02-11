import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      'fuse.js': path.resolve(__dirname, 'node_modules/fuse.js/dist/fuse.mjs'),
      'util': 'util'
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // Avoid exposing all process.env to prevent secret leaks
    'process.env': {}
  },
  optimizeDeps: {
    include: ['fuse.js']
  },
  build: {
    rollupOptions: {
      external: [
        'node-fetch',
        'openai',
        'cheerio',
        'google-it',
        'googlethis',
        'pdf-parse',
        'fs',
        'path',
        'os'
      ]
    }
  }
});

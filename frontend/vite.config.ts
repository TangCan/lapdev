import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3333',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('monaco-editor')) {
            return 'monaco';
          }
          if (id.includes('@xterm')) {
            return 'xterm';
          }
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react';
          }
          if (id.includes('lucide-react')) {
            return 'lucide';
          }
          if (id.includes('diff2html')) {
            return 'diff2html';
          }
          if (id.includes('js-yaml')) {
            return 'yaml';
          }
          if (id.includes('vscode-languageserver-types')) {
            return 'vendors';
          }
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  },
});

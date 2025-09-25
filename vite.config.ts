import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '$/amplify/*': path.resolve(__dirname, './amplify/*'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    sourcemap: true,
  }
});

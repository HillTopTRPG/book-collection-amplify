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
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-aws': ['aws-amplify', '@aws-amplify/ui-react'],
          'vendor-libs': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-dialog',
            '@radix-ui/react-icons',
            '@radix-ui/react-label',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@dnd-kit/core',
            '@dnd-kit/modifiers',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
            'framer-motion',
            'motion',
            'clsx',
            'class-variance-authority',
            'tailwind-merge',
            'es-toolkit',
            'uuid',
            'usehooks-ts'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});

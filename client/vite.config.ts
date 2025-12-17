import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - separate large libraries
          if (id.includes('node_modules')) {
            // React and React DOM - MUST be loaded first, keep together
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('scheduler')
            ) {
              return 'react-vendor';
            }
            // Recharts (charting library - can be large)
            if (id.includes('recharts')) {
              return 'recharts';
            }
            // Radix UI components - keep together
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            // TanStack Query
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            // Other large dependencies
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // Put everything else in vendor - Vite will handle loading order
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));

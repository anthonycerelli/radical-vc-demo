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
            // React and React DOM
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Recharts (charting library - can be large)
            if (id.includes('recharts')) {
              return 'recharts';
            }
            // Radix UI components
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
            // Everything else from node_modules
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase limit slightly since we're splitting
  },
}));

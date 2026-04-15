import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'terser',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom', 'react-router-dom'],
              ui: ['framer-motion', 'lucide-react'],
              charts: ['recharts'],
            }
          }
        },
        // Optimize for mobile
        target: 'es2020',
        cssCodeSplit: true,
        chunkSizeWarningLimit: 1000,
      },
      // Optimize dependencies for mobile
      optimizeDeps: {
        include: ['react', 'react-dom', 'framer-motion', 'lucide-react'],
      },
    };
});

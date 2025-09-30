import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client', 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  root: path.resolve(import.meta.dirname, 'client'),
  publicDir: path.resolve(import.meta.dirname, 'client', 'public'),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        // Optimize chunk file naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Manual chunk splitting for optimal caching
        manualChunks: id => {
          // Vendor chunks - separate large libraries
          if (id.includes('node_modules')) {
            // React ecosystem in one chunk
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            // React Query and related
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            // UI libraries (shadcn/ui, radix)
            if (
              id.includes('@radix-ui') ||
              id.includes('class-variance-authority') ||
              id.includes('clsx')
            ) {
              return 'vendor-ui';
            }
            // Routing
            if (id.includes('wouter')) {
              return 'vendor-router';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
            // All other vendor code
            return 'vendor-misc';
          }

          // App code - split by route
          if (id.includes('/pages/admin/')) {
            return 'pages-admin';
          }
          if (id.includes('/pages/auth/')) {
            return 'pages-auth';
          }
          if (id.includes('/pages/')) {
            return 'pages-public';
          }

          // Shared components
          if (id.includes('/components/admin/')) {
            return 'components-admin';
          }
          if (id.includes('/components/ui/')) {
            return 'components-ui';
          }

          // Default - let Vite decide
          return undefined;
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
    // Stricter chunk size limit for better performance
    chunkSizeWarningLimit: 300,
    cssCodeSplit: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ['**/.*'],
    },
    // No proxy needed - API and frontend served from same Express server
  },
});

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
  },
  root: path.resolve(import.meta.dirname, 'client'),
  publicDir: path.resolve(import.meta.dirname, 'client', 'public'),
  optimizeDeps: {
    // Pre-bundle these dependencies to prevent chunk loading issues
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'wouter',
      '@tanstack/react-query',
      '@radix-ui/react-dialog',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-slot',
      '@radix-ui/react-popover',
      '@radix-ui/react-avatar',
      '@radix-ui/react-separator',
      'lucide-react',
      'date-fns',
      'class-variance-authority',
    ],
    // Force dependency optimization on every server start in development
    force: process.env.NODE_ENV === 'development',
  },
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        manualChunks: {
          // Split vendor code into stable chunks
          'vendor-react': ['react', 'react-dom', 'react-dom/client'],
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-slot',
            '@radix-ui/react-popover',
            '@radix-ui/react-avatar',
            '@radix-ui/react-separator',
          ],
          'vendor-utils': ['date-fns', 'class-variance-authority', 'lucide-react'],
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces (allows IP address access)
    fs: {
      strict: true,
      deny: ['**/.*'],
    },
    // Force a full reload on dependency changes
    watch: {
      // Watch for changes in node_modules for better HMR
      ignored: ['!**/node_modules/@radix-ui/**'],
    },
    // No proxy needed - API and frontend served from same Express server
  },
});

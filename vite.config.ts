import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React chunks
          'react-vendor': ['react', 'react-dom'],
          'react-router': ['wouter'],

          // Authentication and data
          'auth-vendor': ['@supabase/supabase-js', '@supabase/auth-ui-react', '@supabase/auth-ui-shared'],
          'query-vendor': ['@tanstack/react-query'],

          // UI component chunks
          'ui-core': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-slot',
            '@radix-ui/react-toast'
          ],
          'ui-forms': [
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-switch',
            '@radix-ui/react-checkbox',
            'react-hook-form',
            '@hookform/resolvers'
          ],
          'ui-layout': [
            '@radix-ui/react-tabs',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
            '@radix-ui/react-accordion'
          ],
          'ui-feedback': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-progress'
          ],

          // Admin-specific chunks (lazy loaded)
          'admin-core': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities'
          ],

          // Utility chunks
          'utility-core': ['clsx', 'tailwind-merge', 'class-variance-authority'],
          'utility-date': ['date-fns'],
          'utility-validation': ['zod'],

          // Feature chunks
          'charts': ['recharts'],
          'carousel': ['embla-carousel-react'],
          'animations': ['framer-motion'],
          'icons': ['lucide-react'],

          // Mobile-specific utilities (will be lazy loaded)
          'mobile-utils': [] // Will be populated by dynamic imports
        },
        // Optimize chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild',
    // Optimize for mobile
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
    // Enable tree shaking
    treeshake: {
      moduleSideEffects: false
    }
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Proxy static image requests to the backend server
      '^/(itinerary-images|event-images|talent-images|cruise-images)': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});

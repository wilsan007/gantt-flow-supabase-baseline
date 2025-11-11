import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
    headers: {
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://qliinxtanjdnwxlvnxji.supabase.co wss://qliinxtanjdnwxlvnxji.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),

      // Autres headers de sécurité
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    },
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
        manualChunks: {
          // Vendor chunks - bibliothèques principales
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],

          // UI Components - Radix UI
          'ui-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],

          // DnD - Drag and Drop
          'vendor-dnd': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
            '@hello-pangea/dnd',
          ],

          // Charts et visualisation
          'vendor-charts': ['recharts'],

          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],

          // Utilitaires
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],

          // 🔥 OPTIMISATIONS BUNDLE - Libs lourdes en chunks séparés
          'vendor-excel': ['xlsx'], // 420KB - Lazy load
          'vendor-pdf': ['jspdf', 'jspdf-autotable'], // 405KB - Lazy load
          'vendor-canvas': ['html2canvas'], // 198KB - Lazy load
          'vendor-icons': ['lucide-react'], // 148KB - À tree-shake
        },
      },
    },
    // Optimisations supplémentaires
    chunkSizeWarningLimit: 1000,
    sourcemap: mode === 'development',
    // Minification agressive
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Supprimer console.log en prod
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
  },
}));

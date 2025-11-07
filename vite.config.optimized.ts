import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: false,
    hmr: {
      host: "localhost",
      protocol: "ws",
    },
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://qliinxtanjdnwxlvnxji.supabase.co wss://qliinxtanjdnwxlvnxji.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    },
  },
  
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // ⚡ OPTIMISATIONS AJOUTÉES
  cacheDir: '.vite',
  
  optimizeDeps: {
    // Pre-bundle les dépendances fréquentes
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'date-fns',
      'lucide-react',
      'clsx',
      'tailwind-merge'
    ],
    // Force uniquement si problème de cache
    force: false,
    esbuildOptions: {
      target: 'es2020'
    }
  },
  
  build: {
    // ⚡ MINIFICATION RAPIDE
    minify: 'esbuild', // Plus rapide que 'terser' (default)
    
    // ⚡ DÉSACTIVER SOURCEMAPS EN PRODUCTION
    sourcemap: mode === 'development',
    
    // ⚡ TARGET MODERNE
    target: 'es2020',
    
    // ⚡ NE PAS REPORTER LA TAILLE COMPRESSÉE (gagne du temps)
    reportCompressedSize: false,
    
    // ⚡ DÉSACTIVER POLYFILLS INUTILES
    modulePreload: { polyfill: false },
    
    // Limite de taille des chunks
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // ⚡ TAILLE MINIMALE DE CHUNK (réduit le nombre de fichiers)
        experimentalMinChunkSize: 10000,
        
        // Code splitting optimisé
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
          
          // Charts et visualisation (lazy loaded dans code)
          'vendor-charts': ['recharts'],
          
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          
          // Utilitaires
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
          
          // ⚡ ISOLER LES LIBRAIRIES LOURDES
          'vendor-pdf': ['jspdf'],
          'vendor-excel': ['xlsx'],
          'vendor-canvas': ['html2canvas'],
        },
      },
    },
  },
}));

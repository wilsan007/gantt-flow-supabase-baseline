# 🎯 Plan d'Action Sprint Actuel

## Sprint : Court Terme (1-2 semaines)

---

## 1️⃣ TESTS E2E SUR DEVICES RÉELS ✅

### Objectif

Valider que les 17 pages optimisées fonctionnent parfaitement sur iPhone et Android

### Configuration Existante

✅ **Playwright déjà configuré** avec :

- Desktop Chrome, Firefox, Safari
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

### Tests à Créer

#### A. Tests Pages Critiques (Priorité Haute)

**Fichier** : `e2e/critical-pages.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Pages Critiques - Mobile Responsive', () => {
  test('Analytics - Design futuriste et responsive', async ({ page }) => {
    await page.goto('/analytics');

    // Vérifier présence header gradient
    const header = page.locator('h1');
    await expect(header).toBeVisible();

    // Vérifier 4 stats cards
    const statsCards = page.locator('[data-testid="stat-card"]');
    await expect(statsCards).toHaveCount(4);

    // Vérifier barres activité
    const activityBars = page.locator('[data-testid="activity-bar"]');
    await expect(activityBars).toHaveCount(7);

    // Vérifier badges achievements
    const badges = page.locator('[data-testid="achievement-badge"]');
    await expect(badges).toBeVisible();
  });

  test('Settings - Tabs responsive', async ({ page }) => {
    await page.goto('/settings');

    // Vérifier 4 tabs
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(4);

    // Cliquer sur chaque tab
    for (let i = 0; i < 4; i++) {
      await tabs.nth(i).click();
      await expect(tabs.nth(i)).toHaveAttribute('data-state', 'active');
    }
  });

  test('Inbox - Navigation et filtres', async ({ page }) => {
    await page.goto('/inbox');

    // Vérifier tabs scroll horizontal
    const tabsList = page.locator('[role="tablist"]');
    await expect(tabsList).toBeVisible();

    // Vérifier boutons actions visibles
    const actionButtons = page.locator('button[data-testid^="action-"]');
    await expect(actionButtons.first()).toBeVisible();
  });
});
```

**Commande** :

```bash
npm run test:e2e -- --project="Mobile Safari"
npm run test:e2e -- --project="Mobile Chrome"
```

#### B. Tests Touch Targets (Priorité Haute)

**Fichier** : `e2e/touch-targets.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Touch Targets - Conformité 44px', () => {
  test('Boutons principaux >= 44px', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button:visible');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        // Vérifier hauteur >= 40px (44px idéal)
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('Inputs touch-friendly mobile', async ({ page }) => {
    await page.goto('/signup');

    const inputs = page.locator('input[type="email"], input[type="password"]');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const box = await input.boundingBox();

      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});
```

#### C. Tests Performance Mobile (Priorité Moyenne)

**Fichier** : `e2e/performance.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Performance Mobile', () => {
  test('Temps de chargement Analytics < 3s', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('Lazy loading fonctionne', async ({ page }) => {
    await page.goto('/');

    // Analytics ne doit pas être chargée au départ
    const analyticsScript = page.locator('script[src*="Analytics"]');
    await expect(analyticsScript).toHaveCount(0);

    // Naviguer vers Analytics
    await page.goto('/analytics');

    // Maintenant le script doit être chargé
    await page.waitForLoadState('networkidle');
  });
});
```

### Dispositifs Réels à Tester

#### iPhone (iOS)

- [ ] iPhone 12 Pro (iOS 17)
- [ ] iPhone 14 (iOS 17)
- [ ] iPhone SE (petit écran)

#### Android

- [ ] Samsung Galaxy S21
- [ ] Google Pixel 7
- [ ] Xiaomi Redmi Note 11

### Outils de Test Réel

**BrowserStack** (Recommandé)

```bash
# Installation
npm install -D @browserstack/playwright

# Configuration
export BROWSERSTACK_USERNAME="your_username"
export BROWSERSTACK_ACCESS_KEY="your_key"

# Lancer tests
npm run test:e2e -- --config=playwright.browserstack.config.ts
```

**LambdaTest**

```bash
npm install -D @lambdatest/playwright
```

### Checklist Tests E2E

- [ ] Tests créés pour 17 pages optimisées
- [ ] Touch targets validés (>= 40px)
- [ ] Responsive breakpoints testés
- [ ] Navigation mobile fluide
- [ ] Formulaires accessibles
- [ ] Performance < 3s chargement
- [ ] Lazy loading vérifié
- [ ] Tests passent sur iPhone
- [ ] Tests passent sur Android

---

## 2️⃣ AUDIT ACCESSIBILITÉ WCAG AA ♿

### Objectif

Atteindre niveau AA WCAG 2.1 sur toutes les pages

### Outils Automatisés

#### A. Axe DevTools (Chrome Extension)

**Installation** :

1. Chrome Web Store → "axe DevTools"
2. Ouvrir DevTools (F12)
3. Onglet "axe DevTools"
4. Cliquer "Scan ALL of my page"

**Pages à auditer** :

- [ ] /analytics
- [ ] /settings
- [ ] /inbox
- [ ] / (dashboard)
- [ ] /projects
- [ ] /hr
- [ ] /my-timesheets
- [ ] /approvals

#### B. Lighthouse CI

**Fichier** : `lighthouserc.js`

```javascript
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:5173/',
        'http://localhost:5173/analytics',
        'http://localhost:5173/settings',
        'http://localhost:5173/inbox',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        onlyCategories: ['accessibility', 'performance', 'best-practices'],
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

**Commande** :

```bash
npm install -D @lhci/cli
npx lhci autorun
```

#### C. Pa11y (Automated Testing)

**Installation** :

```bash
npm install -D pa11y pa11y-ci
```

**Configuration** : `.pa11yci.json`

```json
{
  "defaults": {
    "standard": "WCAG2AA",
    "timeout": 10000,
    "wait": 2000,
    "chromeLaunchConfig": {
      "args": ["--no-sandbox"]
    }
  },
  "urls": [
    "http://localhost:5173/",
    "http://localhost:5173/analytics",
    "http://localhost:5173/settings",
    "http://localhost:5173/inbox",
    "http://localhost:5173/projects",
    "http://localhost:5173/hr",
    "http://localhost:5173/my-timesheets"
  ]
}
```

**Commande** :

```bash
npm run dev &
npx pa11y-ci
```

### Corrections Accessibilité Prioritaires

#### A. ARIA Labels Manquants

**Fichiers à vérifier** :

```bash
# Trouver boutons sans labels
grep -r "button.*onClick" src/ | grep -v "aria-label"
```

**Exemple correction** :

```tsx
// ❌ Avant
<Button onClick={handleDelete}>
  <Trash className="h-4 w-4" />
</Button>

// ✅ Après
<Button onClick={handleDelete} aria-label="Supprimer l'élément">
  <Trash className="h-4 w-4" />
</Button>
```

#### B. Contraste Couleurs

**Outil** : https://webaim.org/resources/contrastchecker/

**Ratios requis WCAG AA** :

- Texte normal : >= 4.5:1
- Texte large : >= 3:1

**Vérifier** :

- Textes sur gradients
- Badges colorés
- Boutons outline
- Textes muted-foreground

#### C. Navigation Clavier

**Tests manuels** :

- [ ] Tab parcourt tous éléments interactifs
- [ ] Ordre logique du focus
- [ ] Skip links fonctionnent
- [ ] Modals/dialogs trappent le focus
- [ ] Esc ferme les dialogs

**Corrections** :

```tsx
// Focus trap dans Dialog
import { Dialog } from '@headlessui/react';

<Dialog onClose={handleClose}>
  <Dialog.Panel>{/* Le focus reste dans le panel */}</Dialog.Panel>
</Dialog>;
```

### Checklist Accessibilité

- [ ] 0 erreurs critiques Axe DevTools
- [ ] Score Lighthouse Accessibility >= 90
- [ ] Pa11y 0 erreur WCAG AA
- [ ] Tous boutons ont aria-label
- [ ] Contraste >= 4.5:1 partout
- [ ] Navigation clavier complète
- [ ] Screen reader testé (NVDA/JAWS)
- [ ] Focus visible sur tous éléments
- [ ] Formulaires ont labels associés
- [ ] Images ont alt text

---

## 3️⃣ OPTIMISATION BUNDLE SIZE (<200KB) 📦

### Objectif

Réduire bundle initial de ~431KB à <200KB

### Analyse Actuelle

**Commande** :

```bash
npm run build
npm run analyze
```

**Outil** : `vite-plugin-bundle-analyzer`

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

### Optimisations à Appliquer

#### A. Code Splitting Agressif

**Séparer libs lourdes** :

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React + libs UI
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI Components
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-select'],

          // Date libs
          'date-vendor': ['date-fns'],

          // Forms
          'form-vendor': ['react-hook-form', 'zod'],

          // Icons séparés
          icons: ['lucide-react'],
        },
      },
    },
  },
});
```

#### B. Tree Shaking Icons

**Actuellement** : Import complet lucide-react (≈50KB)

**Optimisé** :

```typescript
// ❌ Avant
import { Calendar, User, Settings, Trash } from 'lucide-react';

// ✅ Après - Imports individuels
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import User from 'lucide-react/dist/esm/icons/user';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Trash from 'lucide-react/dist/esm/icons/trash';
```

**Script automatique** :

```bash
# Créer script optimize-icons.sh
find src -name "*.tsx" -exec sed -i "s/import { \(.*\) } from 'lucide-react'/import \1 from 'lucide-react\/dist\/esm\/icons\/\L\1'/g" {} \;
```

#### C. Lazy Loading Composants Lourds

```typescript
// App.tsx - Déjà fait ✅
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));

// À ajouter - Composants lourds
const TaskCalendar = lazy(() => import('./components/tasks/TaskCalendar'));
const GanttChart = lazy(() => import('./components/vues/gantt/GanttChart'));
```

#### D. Compression Gzip/Brotli

**vite.config.ts** :

```typescript
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
});
```

#### E. Minification Agressive

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer console.log en prod
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
  },
});
```

### Checklist Bundle Optimization

- [ ] Analyse bundle actuel (vite-plugin-bundle-analyzer)
- [ ] Code splitting appliqué (5+ chunks)
- [ ] Icons tree-shaking (imports individuels)
- [ ] Lazy loading composants lourds
- [ ] Compression gzip + brotli
- [ ] Console.log supprimés en prod
- [ ] CSS purgé (unused styles)
- [ ] Images optimisées (WebP)
- [ ] Bundle initial < 200KB
- [ ] Bundle total < 1MB

**Objectif** :

- Initial : 431KB → **<200KB** (≈54% réduction)
- Total : ~1.2MB → **<800KB** (≈33% réduction)

---

## 4️⃣ TESTS PERFORMANCE LIGHTHOUSE (>90) ⚡

### Objectif

Score Lighthouse >= 90 sur Performance, Accessibility, Best Practices

### Configuration Lighthouse CI

**Fichier** : `lighthouserc.js` (déjà créé ci-dessus)

### Optimisations Performance

#### A. Images Next-Gen Format

**Convertir en WebP** :

```bash
# Installation
npm install -D sharp

# Script conversion
node scripts/convert-to-webp.js
```

**Script** : `scripts/convert-to-webp.js`

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

fs.readdirSync(publicDir).forEach(file => {
  if (file.match(/\.(jpg|jpeg|png)$/)) {
    sharp(path.join(publicDir, file))
      .webp({ quality: 80 })
      .toFile(path.join(publicDir, file.replace(/\.(jpg|jpeg|png)$/, '.webp')));
  }
});
```

#### B. Lazy Loading Images

```tsx
// Composant Image optimisé
const OptimizedImage = ({ src, alt, ...props }) => (
  <img src={src} alt={alt} loading="lazy" decoding="async" {...props} />
);
```

#### C. Prefetch Critical Routes

```typescript
// App.tsx
import { useEffect } from 'react';

useEffect(() => {
  // Prefetch pages critiques
  const prefetchPages = ['/analytics', '/settings', '/inbox'];

  prefetchPages.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });
}, []);
```

#### D. Service Worker (PWA)

**Installation** :

```bash
npm install -D vite-plugin-pwa
```

**vite.config.ts** :

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 an
              },
            },
          },
        ],
      },
    }),
  ],
});
```

### Metrics Cibles Lighthouse

| Métrique                           | Cible  | Actuel | Amélioration     |
| ---------------------------------- | ------ | ------ | ---------------- |
| **FCP** (First Contentful Paint)   | <1.8s  | ?      | Lazy load        |
| **LCP** (Largest Contentful Paint) | <2.5s  | ?      | Images WebP      |
| **TBT** (Total Blocking Time)      | <200ms | ?      | Code split       |
| **CLS** (Cumulative Layout Shift)  | <0.1   | ?      | Dimensions fixes |
| **SI** (Speed Index)               | <3.4s  | ?      | Prefetch         |

### Checklist Performance

- [ ] Lighthouse Score Performance >= 90
- [ ] FCP < 1.8s
- [ ] LCP < 2.5s
- [ ] TBT < 200ms
- [ ] CLS < 0.1
- [ ] Images en WebP
- [ ] Lazy loading images
- [ ] Service Worker configuré
- [ ] Critical CSS inline
- [ ] Fonts préchargées

---

## 📊 DASHBOARD DE SUIVI

### Métriques à Tracker

| Métrique                      | Baseline | Cible  | Actuel | Status |
| ----------------------------- | -------- | ------ | ------ | ------ |
| **Tests E2E passants**        | 0%       | 100%   | ?      | 🔴     |
| **Score Accessibility**       | ?        | 90+    | ?      | 🟡     |
| **Bundle Size (initial)**     | 431KB    | <200KB | ?      | 🟡     |
| **Lighthouse Performance**    | ?        | 90+    | ?      | 🔴     |
| **Lighthouse Accessibility**  | ?        | 90+    | ?      | 🔴     |
| **Lighthouse Best Practices** | ?        | 90+    | ?      | 🔴     |

**Légende** : 🟢 Atteint | 🟡 En cours | 🔴 À faire

---

## ⏱️ TIMELINE ESTIMÉE

| Tâche                     | Durée   | Responsable | Status |
| ------------------------- | ------- | ----------- | ------ |
| Tests E2E (création)      | 2 jours | Dev         | ⏳     |
| Tests E2E (exécution)     | 1 jour  | QA          | ⏳     |
| Audit Accessibilité       | 1 jour  | Dev         | ⏳     |
| Corrections Accessibilité | 2 jours | Dev         | ⏳     |
| Optimisation Bundle       | 2 jours | Dev         | ⏳     |
| Tests Performance         | 1 jour  | Dev         | ⏳     |
| Validation Lighthouse     | 1 jour  | QA          | ⏳     |

**Total** : ~10 jours ouvrés (2 semaines)

---

## 🚀 COMMANDES RAPIDES

```bash
# Tests E2E
npm run test:e2e                    # Tous devices
npm run test:e2e:mobile             # Mobile uniquement
npm run test:e2e:iphone             # iPhone 12
npm run test:e2e:android            # Pixel 5

# Accessibilité
npx lhci autorun                    # Lighthouse CI
npx pa11y-ci                        # Pa11y tests
npm run a11y:audit                  # Audit complet

# Bundle
npm run build                       # Build production
npm run analyze                     # Analyser bundle
npm run optimize                    # Optimisations auto

# Performance
npx lighthouse http://localhost:5173 --view
npm run perf:test                   # Tests performance
```

---

## ✅ DEFINITION OF DONE

### Sprint considéré terminé quand :

- [ ] Tests E2E passent sur iPhone et Android (100% success)
- [ ] Score Lighthouse Accessibility >= 90 sur toutes pages
- [ ] Bundle initial < 200KB (vérifiable via build)
- [ ] Score Lighthouse Performance >= 90
- [ ] Documentation tests créée
- [ ] CI/CD intègre les tests
- [ ] Rapport final généré

---

**Créé le** : 11 novembre 2025  
**Sprint** : Court Terme (2 semaines)  
**Priorité** : HAUTE 🔴

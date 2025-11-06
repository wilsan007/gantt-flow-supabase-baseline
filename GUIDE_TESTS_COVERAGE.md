# 📚 GUIDE COMPLET - TESTS & COVERAGE

**Date:** 7 Novembre 2025  
**Pour:** Wadashaqeen SaaS

---

## 🚀 **COMMANDES RAPIDES**

### **Lancer les Tests**
```bash
# Tous les tests (mode watch)
npm run test

# Tests une seule fois
npm run test -- --run

# Tests avec UI interactive
npm run test:ui

# Tests spécifiques
npm run test -- src/__tests__/auth/
```

### **Coverage**
```bash
# Générer rapport coverage complet
npm run test:coverage

# Coverage avec UI
npm run test:coverage -- --ui

# Coverage d'un module spécifique
npm run test:coverage -- src/__tests__/hooks/
```

### **Voir les Rapports**
```bash
# Ouvrir le rapport HTML
open coverage/index.html  # Mac
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

---

## 📊 **ÉTAT ACTUEL**

### **Tests Disponibles: 96**
```
✅ Auth (14 tests)
✅ Hooks Supabase (11 tests)
✅ Routes Protégées (8 tests)
✅ Permissions (17 tests)
✅ Helpers (10 tests)
✅ ErrorBoundary (5 tests)
✅ UI Components (22 tests)
✅ Utils (7 tests) - 100% coverage
✅ Supabase Client (7 tests)
✅ Pages (3 tests)
```

### **Coverage Global: ~5-10%**
```
Target: 90%+
Modules testés à 100%:
- src/lib/utils.ts ✅
```

---

## 🎯 **COMMENT AUGMENTER LA COVERAGE**

### **Étape 1: Identifier les Modules Non Testés**
```bash
npm run test:coverage -- --run
# Regarder les fichiers avec 0% coverage
```

### **Étape 2: Créer des Tests**
```typescript
// Exemple: Tester un nouveau hook
// Fichier: src/__tests__/hooks/monHook.test.ts

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { monHook } from '@/hooks/monHook';

describe('monHook', () => {
  it('should work', async () => {
    const { result } = renderHook(() => monHook());
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### **Étape 3: Lancer et Vérifier**
```bash
# Lancer le nouveau test
npm run test -- src/__tests__/hooks/monHook.test.ts

# Vérifier la coverage
npm run test:coverage -- --run
```

---

## 🔧 **PATTERNS DE TESTS**

### **1. Tester un Composant React**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MonComposant } from '@/components/MonComposant';

it('should render correctly', () => {
  render(<MonComposant titre="Test" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});

it('should handle click', () => {
  const handleClick = vi.fn();
  render(<MonComposant onClick={handleClick} />);
  
  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalled();
});
```

### **2. Tester un Hook**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { monHook } from '@/hooks/monHook';

it('should fetch data', async () => {
  const { result } = renderHook(() => monHook());
  
  expect(result.current.loading).toBe(true);
  
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();
  });
});
```

### **3. Tester avec Supabase (Mocked)**
```typescript
import { vi } from 'vitest';

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: '1' } },
        error: null
      }))
    }
  }
}));

// Dans votre test
mockFrom.mockReturnValue({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockResolvedValue({ data: [], error: null })
});
```

### **4. Tester des Routes**
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

it('should navigate to page', () => {
  render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
  
  // Tester la navigation
});
```

---

## 📈 **ROADMAP VERS 90%**

### **Phase 1: Hooks Enterprise (Semaine 1-2)**
```bash
# Créer ces tests en priorité
src/__tests__/hooks/useTasksEnterprise.test.ts
src/__tests__/hooks/useProjectsEnterprise.test.ts
src/__tests__/hooks/useHRMinimal.test.ts

# Impact: +30-40% coverage
```

### **Phase 2: Composants Business (Semaine 3-4)**
```bash
src/__tests__/components/tasks/TaskTableEnterprise.test.tsx
src/__tests__/components/kanban/KanbanBoardEnterprise.test.tsx
src/__tests__/components/gantt/GanttChartEnterprise.test.tsx

# Impact: +20-30% coverage
```

### **Phase 3: Pages (Semaine 5-6)**
```bash
src/__tests__/pages/Index.test.tsx
src/__tests__/pages/ProjectPage.test.tsx
src/__tests__/pages/HRPage.test.tsx
src/__tests__/pages/Settings.test.tsx

# Impact: +15-20% coverage
```

### **Phase 4: Utilitaires (Semaine 7)**
```bash
src/__tests__/lib/permissions.test.ts (✅ fait)
src/__tests__/lib/roleCache.test.ts
src/__tests__/lib/cacheManager.test.ts
src/__tests__/lib/logger.test.ts

# Impact: +10-15% coverage
```

---

## 🐛 **DEBUGGING TESTS**

### **Test qui Échoue**
```bash
# Voir les détails
npm run test -- --reporter=verbose

# Mode debug
npm run test -- --inspect-brk

# Isoler un test
npm run test -- -t "nom du test"
```

### **Coverage Incorrecte**
```bash
# Nettoyer le cache
rm -rf coverage node_modules/.vite

# Rebuild
npm run build

# Relancer coverage
npm run test:coverage -- --run
```

### **Timeout Issues**
```typescript
// Augmenter le timeout
it('slow test', async () => {
  await waitFor(() => {
    // ...
  }, { timeout: 10000 }); // 10 secondes
});
```

---

## 📚 **RESSOURCES**

### **Documentation**
- [Vitest](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Playwright](https://playwright.dev)

### **Fichiers Importants**
```
vitest.config.ts          - Configuration tests
.github/workflows/ci.yml  - CI/CD
src/test/setup.ts         - Setup global
```

### **Commandes Utiles**
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format

# Build
npm run build

# Tests + Coverage
npm run test:coverage
```

---

## ✅ **CHECKLIST AVANT COMMIT**

```bash
# 1. Linter
npm run lint

# 2. Type check
npm run type-check

# 3. Tests
npm run test -- --run

# 4. Build
npm run build

# ✅ Si tout passe, commit!
git add .
git commit -m "feat: add tests for X"
git push
```

---

## 🎯 **OBJECTIFS**

### **Court Terme (1 mois)**
- [ ] 96 tests → 200 tests
- [ ] 5% coverage → 40% coverage
- [ ] Tous les hooks testés

### **Moyen Terme (3 mois)**
- [ ] 200 tests → 400 tests
- [ ] 40% coverage → 70% coverage
- [ ] Composants critiques testés

### **Long Terme (6 mois)**
- [ ] 400 tests → 600+ tests
- [ ] 70% coverage → 90%+ coverage
- [ ] Tests E2E complets

---

**🎉 Bon courage pour les tests! Chaque test compte! 🚀**

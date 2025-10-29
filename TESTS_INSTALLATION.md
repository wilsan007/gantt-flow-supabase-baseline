# 🧪 Installation de la Suite de Tests

## 📦 Dépendances à Installer

### **1. Installer les dépendances de test**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test
```

### **2. Mettre à jour package.json**

Ajoutez ces scripts dans la section `"scripts"`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

---

## 🚀 Lancer les Tests

### **Tests Unitaires (Vitest)**

```bash
# Mode watch (re-run automatique)
npm run test

# Interface UI interactive
npm run test:ui

# Run une seule fois
npm run test:run

# Avec couverture de code
npm run test:coverage
```

### **Tests E2E (Playwright)**

```bash
# Installer les navigateurs (première fois)
npx playwright install

# Lancer les tests E2E
npm run test:e2e

# Mode UI interactif
npm run test:e2e:ui

# Voir le navigateur (mode headé)
npm run test:e2e:headed
```

---

## 📊 Structure des Tests Créée

```
/src
├── test/
│   ├── setup.ts                    # Configuration globale
│   └── mocks/
│       └── supabase.ts             # Mocks Supabase
│
├── hooks/
│   └── __tests__/
│       ├── useOperationalActivities.test.ts
│       ├── useOperationalSchedules.test.ts
│       └── useOperationalActionTemplates.test.ts
│
├── components/
│   └── operations/
│       └── __tests__/
│           ├── OperationsPage.test.tsx
│           ├── ActivityForm.test.tsx
│           ├── ActivityCard.test.tsx
│           └── OneOffActivityDialog.test.tsx
│
/e2e/
├── operations.spec.ts              # Tests E2E complets
├── operational-flow.spec.ts        # Tests de flux utilisateur
└── playwright.config.ts            # Configuration Playwright
```

---

## ✅ Vérification

Après installation, vérifiez que tout fonctionne :

```bash
# Vérifier Vitest
npm run test -- --version

# Vérifier Playwright
npx playwright --version
```

Devrait afficher les versions installées sans erreur.

---

## 🎯 Commandes Utiles

### **Vitest**
```bash
# Lancer un fichier spécifique
npm run test -- useOperationalActivities

# Lancer avec rapport détaillé
npm run test -- --reporter=verbose

# Générer rapport HTML de couverture
npm run test:coverage
# Puis ouvrir: coverage/index.html
```

### **Playwright**
```bash
# Lancer un test spécifique
npm run test:e2e -- operations.spec.ts

# Mode debug
npm run test:e2e -- --debug

# Générer le rapport
npx playwright show-report
```

---

## 📝 Prochaines Étapes

1. ✅ Installer les dépendances
2. ✅ Vérifier que `npm run test` fonctionne
3. ✅ Lancer un test de hook
4. ✅ Lancer un test de composant
5. ✅ Lancer les tests E2E

---

**Date :** 2025-01-13  
**Status :** Prêt pour installation

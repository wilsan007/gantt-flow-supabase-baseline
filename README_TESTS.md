# 🧪 Guide Rapide - Tests Module Opérations

## ⚡ Installation (2 minutes)

```bash
# 1. Installer les dépendances de test
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test

# 2. Installer les navigateurs Playwright
npx playwright install
```

---

## 🚀 Lancer les Tests

### **Tests Unitaires (Recommandé pour débuter)**

```bash
# Interface UI interactive (meilleure expérience)
npm run test:ui
```

**Puis ouvrir :** `http://localhost:51204/__vitest__/`

---

### **Tests E2E (Après avoir testé manuellement)**

```bash
# Mode UI interactif
npm run test:e2e:ui
```

---

## 📊 Ce qui est Testé

### ✅ **Tests Unitaires (45+ tests)**
- Hooks `useOperationalActivities`
- Fetch, create, update, delete
- Filtres et cache
- Gestion d'erreurs
- Métriques

### ✅ **Tests E2E (18+ scénarios)**
- Création activités récurrentes
- Création activités ponctuelles
- Actions templates (CRUD + drag & drop)
- Filtres et recherche
- Performance
- Gestion d'erreurs

---

## 📈 Couverture

```bash
# Générer le rapport de couverture
npm run test:coverage

# Ouvrir le rapport HTML
open coverage/index.html
```

**Objectif :** ≥ 80% de couverture

---

## 🎯 Commandes Utiles

```bash
# Tests unitaires watch mode
npm run test

# Tests une seule fois
npm run test:run

# Tests E2E headed (voir le navigateur)
npm run test:e2e:headed

# Tout lancer
npm run test:all
```

---

## 📁 Structure

```
src/
├── test/
│   ├── setup.ts              # Configuration globale
│   └── mocks/supabase.ts     # Mocks Supabase
├── hooks/__tests__/          # Tests unitaires hooks
└── components/operations/__tests__/  # Tests composants

e2e/
└── operations.spec.ts        # Tests E2E
```

---

## 📚 Documentation Complète

- **Guide complet :** `SUITE_TESTS_COMPLETE.md`
- **Installation détaillée :** `TESTS_INSTALLATION.md`
- **Récapitulatif final :** `RECAPITULATIF_FINAL_INITIATIVE_A.md`

---

## ✅ Validation Rapide

```bash
# 1. Tests unitaires
npm run test:run
# → Devrait afficher: ✅ 45+ tests passés

# 2. Lancer l'app
npm run dev

# 3. Tests E2E (dans un autre terminal)
npm run test:e2e
# → Devrait afficher: ✅ 18+ tests passés
```

---

**🎉 Suite de tests professionnelle prête ! 🚀**

**Frameworks utilisés :** Vitest • React Testing Library • Playwright

# 🏗️ Architecture des Hooks Optimisés

## 📐 Principe : Single Responsibility + Composition

### **Problème Ancien**
```
useTasks.ts (49 lignes)
  ↓ importe
useTaskDatabase.ts (138 lignes) ← Fetch + Permissions + Realtime
  ↓ importe
useTaskActions.ts (200+ lignes) ← CRUD + Logique métier
```

**Problèmes :**
- ❌ Responsabilités mélangées
- ❌ Difficile à tester
- ❌ Pas de réutilisation
- ❌ Pas d'optimisations

---

### **Solution Nouvelle**

```
Couche 1 : Utilitaires Réutilisables (< 130 lignes chacun)
├── useCache.ts              # Cache intelligent
├── useAbortController.ts    # Annulation requêtes
├── useMetrics.ts            # Métriques performance
├── useFetchProtection.ts    # Anti-boucle
└── useQueryBuilder.ts       # Construction requêtes

Couche 2 : Hooks Spécialisés (< 165 lignes chacun)
├── useTasksOptimized.ts     # Lecture tâches optimisée
├── useProjectsOptimized.ts  # Lecture projets optimisée
└── useTaskActions.ts        # Actions CRUD

Couche 3 : Hooks de Composition (< 100 lignes)
├── useTasks.ts              # Combine lecture + actions
└── useProjects.ts           # Combine lecture + actions
```

---

## 🎯 Responsabilités Claires

### **useCache.ts** (67 lignes)
**Responsabilité unique** : Gestion du cache avec TTL

```typescript
// ✅ Fait UNE chose bien
const cache = useCache({ ttl: 3 * 60 * 1000 });

cache.set('key', data);      // Stocker
cache.get('key');            // Récupérer
cache.invalidate('key');     // Invalider
cache.clear();               // Tout vider
cache.isStale('key');        // Vérifier fraîcheur
cache.getStats();            // Statistiques
```

---

### **useAbortController.ts** (40 lignes)
**Responsabilité unique** : Annulation des requêtes

```typescript
// ✅ Gère uniquement l'annulation
const { getSignal, abort } = useAbortController();

const signal = getSignal(); // Nouveau signal
// ... utiliser dans fetch
abort(); // Annuler manuellement
// Cleanup automatique au démontage
```

---

### **useMetrics.ts** (55 lignes)
**Responsabilité unique** : Métriques de performance

```typescript
// ✅ Mesure uniquement les performances
const { metrics, startTimer, recordMetrics } = useMetrics();

const timer = startTimer();
// ... opération
recordMetrics(timer, data, cacheHit, complexity);
```

---

### **useFetchProtection.ts** (38 lignes)
**Responsabilité unique** : Protection anti-boucle

```typescript
// ✅ Évite uniquement les refetch inutiles
const { shouldFetch, markAsFetched, reset } = useFetchProtection();

if (shouldFetch(params)) {
  // Fetch autorisé
  markAsFetched(params);
}
```

---

### **useQueryBuilder.ts** (130 lignes)
**Responsabilité unique** : Construction de requêtes Supabase

```typescript
// ✅ Construit uniquement les requêtes
const { buildTasksQuery, buildProjectsQuery, getComplexity } = useQueryBuilder();

const query = buildTasksQuery(tenantId, isSuperAdmin, filters);
// Applique automatiquement :
// - Isolation tenant
// - Filtres avancés
// - Tri et ordre
```

---

### **useTasksOptimized.ts** (165 lignes)
**Responsabilité unique** : Lecture optimisée des tâches

```typescript
// ✅ Lecture seule avec optimisations
const {
  tasks,           // Données
  stats,           // Statistiques calculées
  loading,         // État
  error,           // Erreurs
  metrics,         // Métriques
  refresh,         // Rafraîchir
  clearCache,      // Vider cache
  isStale          // Vérifier fraîcheur
} = useTasksOptimized(filters);

// Utilise en interne :
// - useCache (cache intelligent)
// - useAbortController (annulation)
// - useMetrics (performance)
// - useFetchProtection (anti-boucle)
// - useQueryBuilder (requêtes)
```

---

### **useTaskActions.ts** (155 lignes)
**Responsabilité unique** : Actions CRUD sur les tâches

```typescript
// ✅ Mutations uniquement
const {
  createTask,
  updateTask,
  deleteTask,
  duplicateTask,
  updateTaskStatus,
  updateTaskProgress
} = useTaskActions();

// Pas de lecture, uniquement des mutations
// Gestion d'erreurs avec toast
// Validation des données
```

---

### **useTasks.ts** (50 lignes)
**Responsabilité unique** : Composition simple

```typescript
// ✅ Combine lecture + actions
export const useTasks = (filters) => {
  const data = useTasksOptimized(filters);  // Lecture
  const actions = useTaskActions();         // Actions
  
  return { ...data, ...actions };           // API unifiée
};

// Pure composition, pas de logique
// API compatible avec ancien hook
// Facile à tester et maintenir
```

---

## 📊 Avantages de l'Architecture

### **1. Testabilité**
```typescript
// Tester le cache indépendamment
test('useCache stores and retrieves data', () => {
  const { result } = renderHook(() => useCache({ ttl: 1000 }));
  result.current.set('key', 'value');
  expect(result.current.get('key')).toBe('value');
});

// Tester les actions indépendamment
test('useTaskActions creates task', async () => {
  const { result } = renderHook(() => useTaskActions());
  await result.current.createTask(mockData);
  expect(supabase.from).toHaveBeenCalled();
});
```

### **2. Réutilisabilité**
```typescript
// Utiliser useCache pour d'autres données
const projectCache = useCache({ ttl: 5 * 60 * 1000 });
const userCache = useCache({ ttl: 10 * 60 * 1000 });

// Utiliser useMetrics partout
const { metrics } = useMetrics();
```

### **3. Maintenabilité**
```typescript
// Modifier le cache sans toucher aux tâches
// Modifier les métriques sans toucher au cache
// Chaque fichier < 200 lignes
// Responsabilité claire
```

### **4. Performance**
```typescript
// Optimisations isolées et composables
// Cache réutilisable
// Abort controllers automatiques
// Métriques temps réel
```

---

## 🔄 Flux de Données

```
Composant
    ↓
useTasks(filters)
    ↓
┌─────────────────┬──────────────┐
│                 │              │
useTasksOptimized  useTaskActions
│                 │              │
├─ useCache       └─ supabase
├─ useAbortController  (mutations)
├─ useMetrics
├─ useFetchProtection
└─ useQueryBuilder
       ↓
   supabase
   (lecture)
```

---

## 📏 Respect des Contraintes

### ✅ **Limite de 200 lignes**
| Fichier | Lignes | Status |
|---------|--------|--------|
| useCache.ts | 67 | ✅ |
| useAbortController.ts | 40 | ✅ |
| useMetrics.ts | 55 | ✅ |
| useFetchProtection.ts | 38 | ✅ |
| useQueryBuilder.ts | 130 | ✅ |
| useTasksOptimized.ts | 165 | ✅ |
| useTaskActions.ts | 155 | ✅ |
| useTasks.ts | 50 | ✅ |
| useProjectsOptimized.ts | 155 | ✅ |
| useProjects.ts | 100 | ✅ |

### ✅ **Single Responsibility**
Chaque fichier a UNE responsabilité claire

### ✅ **Composition**
Les hooks complexes composent les simples

### ✅ **Réutilisabilité**
Les utilitaires sont utilisables partout

---

## 🎨 Patterns Appliqués

### **Pattern Composition**
```typescript
// Au lieu de tout mettre dans un fichier
// On compose des petits hooks spécialisés
const useTasks = () => {
  const data = useTasksOptimized();
  const actions = useTaskActions();
  return { ...data, ...actions };
};
```

### **Pattern Hook Utilitaire**
```typescript
// Hooks réutilisables sans logique métier
const cache = useCache({ ttl: 3000 });
const { getSignal } = useAbortController();
const { metrics } = useMetrics();
```

### **Pattern Separation of Concerns**
```typescript
// Lecture séparée des mutations
useTasksOptimized();  // Lecture seule
useTaskActions();     // Mutations seules
```

---

## 🚀 Évolution Future

### **Facile d'ajouter des fonctionnalités**
```typescript
// Nouveau : useTaskSubscriptions.ts (< 200 lignes)
export const useTaskSubscriptions = () => {
  // Realtime uniquement
};

// Composer avec l'existant
export const useTasks = () => {
  const data = useTasksOptimized();
  const actions = useTaskActions();
  const subscriptions = useTaskSubscriptions(); // Nouveau
  return { ...data, ...actions, ...subscriptions };
};
```

### **Facile de remplacer une partie**
```typescript
// Remplacer le cache par Redis
// Modifier uniquement useCache.ts
// Tout le reste fonctionne sans changement
```

---

## 📝 Conclusion

**Architecture modulaire avec :**
- ✅ Fichiers courts (< 200 lignes)
- ✅ Responsabilités claires (Single Responsibility)
- ✅ Composition (pas de duplication)
- ✅ Réutilisabilité (hooks utilitaires)
- ✅ Testabilité (isolation)
- ✅ Maintenabilité (clarté)
- ✅ Performance (optimisations isolées)

**Résultat : Code professionnel, scalable et maintenable**

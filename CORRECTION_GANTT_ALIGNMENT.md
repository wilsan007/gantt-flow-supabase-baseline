# 🔧 Correction de l'Alignement des Barres Gantt

## 🐛 Problème Identifié

Les barres de tâches dans la vue Gantt ne correspondaient pas aux bonnes lignes. Il y avait une confusion entre les tâches et leurs barres.

### Cause Racine

**Décalage entre la liste des tâches et la timeline** :

- **Liste de gauche (GanttTaskList)** : Affiche les tâches **regroupées par projet** avec des en-têtes de projet
  ```
  📁 Application Mobile          ← Header (ligne 0)
    - Design UI/UX               ← Tâche (ligne 1)
    - Backend API                ← Tâche (ligne 2)
  📁 Migration Cloud             ← Header (ligne 3)
    - Configuration Serveurs     ← Tâche (ligne 4)
  ```

- **Timeline de droite (GanttTimeline)** : Affichait les barres avec un simple `index` du tableau
  ```
  Barre 0 → Design UI/UX         ← Ligne 0 (ERREUR!)
  Barre 1 → Backend API          ← Ligne 1 (ERREUR!)
  Barre 2 → Configuration        ← Ligne 2 (ERREUR!)
  ```

**Résultat** : Les barres étaient décalées car elles ne tenaient pas compte des headers de projet !

## ✅ Solution Implémentée

### 1. Fonction `getTaskRealIndex()` 

Calcule l'index réel de chaque tâche en tenant compte des headers de projet :

```typescript
const getTaskRealIndex = (taskId: string): number => {
  if (displayMode === 'projects') {
    return tasks.findIndex(t => t.id === taskId);
  }
  
  // Regrouper par projet
  const groupedTasks = tasks.reduce((groups, task) => {
    const projectName = task.projectName || 'Sans projet';
    if (!groups[projectName]) groups[projectName] = [];
    groups[projectName].push(task);
    return groups;
  }, {});
  
  let currentIndex = 0;
  for (const [projectName, projectTasks] of Object.entries(groupedTasks)) {
    currentIndex++; // +1 pour le header du projet
    
    const taskIndex = projectTasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      return currentIndex + taskIndex;
    }
    
    currentIndex += projectTasks.length;
  }
  return 0;
};
```

### 2. Fonction `getTotalHeight()`

Calcule la hauteur totale en incluant les headers de projet :

```typescript
const getTotalHeight = (): number => {
  if (displayMode === 'projects') {
    return tasks.length * rowHeight;
  }
  
  const groupedTasks = tasks.reduce((groups, task) => {
    const projectName = task.projectName || 'Sans projet';
    if (!groups[projectName]) groups[projectName] = [];
    groups[projectName].push(task);
    return groups;
  }, {});
  
  const projectCount = Object.keys(groupedTasks).length;
  return (projectCount + tasks.length) * rowHeight;
};
```

### 3. Utilisation de l'Index Réel

```typescript
{tasks.map((task) => (
  <GanttTaskBar
    key={task.id}
    task={task}
    index={getTaskRealIndex(task.id)}  // ✅ Index correct !
    rowHeight={rowHeight}
    startDate={startDate}
    config={config}
    isDragging={draggedTask === task.id}
    isResizing={resizeTask?.taskId === task.id}
    onMouseDown={onTaskMouseDown}
  />
))}
```

### 4. Lignes Horizontales Corrigées

```typescript
{/* Lignes horizontales - une par ligne (projets + tâches) */}
{Array.from({ length: Math.ceil(getTotalHeight() / rowHeight) }).map((_, index) => (
  <div
    key={index}
    className="absolute w-full border-b border-gantt-grid/60"
    style={{ top: (index + 1) * rowHeight }}
  />
))}
```

## 📊 Résultat Final

### Avant la Correction
```
Liste Gauche          Timeline Droite
─────────────────────────────────────
📁 Projet A           [Barre 0] ← DÉCALAGE!
  - Tâche 1           [Barre 1] ← DÉCALAGE!
  - Tâche 2           [Barre 2] ← DÉCALAGE!
📁 Projet B
  - Tâche 3
```

### Après la Correction
```
Liste Gauche          Timeline Droite
─────────────────────────────────────
📁 Projet A           (pas de barre)
  - Tâche 1           [Barre Tâche 1] ✅
  - Tâche 2           [Barre Tâche 2] ✅
📁 Projet B           (pas de barre)
  - Tâche 3           [Barre Tâche 3] ✅
```

## 🎯 Fichiers Modifiés

1. **`src/components/vues/gantt/GanttTimeline.tsx`**
   - Ajout de `displayMode` prop
   - Ajout de `getTaskRealIndex()`
   - Ajout de `getTotalHeight()`
   - Utilisation de l'index réel pour les barres
   - Correction des lignes horizontales

2. **`src/components/vues/gantt/GanttTaskList.tsx`**
   - Ajout de `getTaskRealIndex()` (pour cohérence)
   - Ajout de `onTaskIndexMap` prop (optionnel)

3. **`src/components/vues/gantt/GanttChart.tsx`**
   - Passage de `displayMode` à `GanttTimeline`

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. **Mode Tâches** : Les barres doivent s'aligner avec les tâches (pas les headers)
2. **Mode Projets** : Les barres doivent s'aligner directement avec les projets
3. **Drag & Drop** : Les tâches doivent rester alignées pendant le déplacement
4. **Resize** : Les barres doivent rester à leur position correcte

## 🚀 Améliorations Futures

- [ ] Ajouter des barres pour les headers de projet (optionnel)
- [ ] Permettre de replier/déplier les projets
- [ ] Ajouter des indicateurs visuels pour les dépendances entre tâches
- [ ] Optimiser le calcul d'index avec un Map pré-calculé

## 📝 Notes Techniques

- **Complexité** : O(n) pour `getTaskRealIndex()` - acceptable pour <1000 tâches
- **Performance** : Pas de re-calcul inutile grâce à la fonction pure
- **Compatibilité** : Fonctionne en mode "tasks" et "projects"
- **Responsive** : S'adapte automatiquement à la hauteur calculée

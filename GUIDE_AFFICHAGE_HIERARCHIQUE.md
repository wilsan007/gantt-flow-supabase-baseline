# 📚 Guide - Affichage Hiérarchique des Tâches

## 🎯 Problème Résolu

**Avant** : Les tâches et sous-tâches étaient mélangées dans l'affichage, rendant difficile la compréhension de la hiérarchie.

**Maintenant** : Affichage organisé avec chaque tâche principale suivie de ses sous-tâches.

## ✅ Solution Implémentée

### Architecture de l'Affichage

```
📋 Tâche Principale 1
  └─ 📌 Sous-tâche 1.1
  └─ 📌 Sous-tâche 1.2
📋 Tâche Principale 2
  └─ 📌 Sous-tâche 2.1
📋 Tâche Principale 3
```

## 🔧 Modifications Apportées

### 1. Interface Task Étendue

**Fichier** : `/src/hooks/optimized/useTasksOptimized.ts`

```typescript
export interface Task {
  // ... champs existants
  parent_id?: string;        // Colonne principale pour hiérarchie
  task_level?: number;       // Niveau (0 = principale, 1+ = sous-tâche)
  display_order?: string;    // Ordre d'affichage (ex: "3.1", "3.2")
  subtasks?: Task[];         // Sous-tâches associées
  isSubtask?: boolean;       // Indicateur pour l'affichage
  department_id?: string;    // ID du département
}
```

### 2. Fonction d'Organisation Hiérarchique

```typescript
const organizeTasksHierarchy = useCallback((taskList: Task[]): Task[] => {
  // 1. Séparer tâches principales et sous-tâches
  const mainTasks = taskList.filter(t => !t.parent_id);
  const subtasks = taskList.filter(t => t.parent_id);
  
  // 2. Grouper les sous-tâches par parent_id
  const subtasksByParent = new Map<string, Task[]>();
  subtasks.forEach(subtask => {
    const parentId = subtask.parent_id!;
    if (!subtasksByParent.has(parentId)) {
      subtasksByParent.set(parentId, []);
    }
    subtasksByParent.get(parentId)!.push({
      ...subtask,
      isSubtask: true  // Marquer comme sous-tâche
    });
  });
  
  // 3. Trier les sous-tâches par display_order
  subtasksByParent.forEach(subs => {
    subs.sort((a, b) => {
      const orderA = parseFloat(a.display_order || '999');
      const orderB = parseFloat(b.display_order || '999');
      return orderA - orderB;
    });
  });
  
  // 4. Construire la liste finale organisée
  const organizedTasks: Task[] = [];
  
  // Trier les tâches principales par display_order
  const sortedMainTasks = [...mainTasks].sort((a, b) => {
    const orderA = parseFloat(a.display_order || '999');
    const orderB = parseFloat(b.display_order || '999');
    return orderA - orderB;
  });
  
  // 5. Pour chaque tâche principale, ajouter ses sous-tâches
  sortedMainTasks.forEach(mainTask => {
    // Ajouter la tâche principale avec ses sous-tâches
    const taskWithSubtasks = {
      ...mainTask,
      subtasks: subtasksByParent.get(mainTask.id) || [],
      isSubtask: false
    };
    organizedTasks.push(taskWithSubtasks);
    
    // Ajouter les sous-tâches juste après
    const taskSubtasks = subtasksByParent.get(mainTask.id) || [];
    organizedTasks.push(...taskSubtasks);
  });
  
  return organizedTasks;
}, []);
```

### 3. Intégration dans fetchTasks

```typescript
const fetchTasks = useCallback(async (forceRefresh = false) => {
  // ... récupération des données
  
  const { data, error: fetchError } = await query;
  if (fetchError) throw fetchError;

  // Cast des données brutes
  const rawTasks = (data || []) as unknown as Task[];
  
  // ✨ ORGANISATION HIÉRARCHIQUE
  const organizedTasks = organizeTasksHierarchy(rawTasks);
  
  // Calculer les stats sur toutes les tâches
  const taskStats = calculateStats(rawTasks);

  // Mettre en cache et afficher
  cache.set(cacheKey, { tasks: organizedTasks, stats: taskStats });
  setTasks(organizedTasks);
  setStats(taskStats);
}, [/* deps */]);
```

### 4. Query Builder Amélioré

**Fichier** : `/src/hooks/utils/useQueryBuilder.ts`

```typescript
export interface QueryFilters {
  // ... filtres existants
  includeSubtasks?: boolean;  // Inclure les sous-tâches
  onlyMainTasks?: boolean;    // Uniquement tâches principales
}

const buildTasksQuery = useCallback((
  tenantId: string | null,
  isSuperAdmin: boolean,
  filters?: QueryFilters
) => {
  let query = supabase.from('tasks').select('*, task_actions!task_actions_task_id_fkey(*)');

  // Filtres hiérarchiques
  if (filters) {
    if (filters.onlyMainTasks) {
      query = query.is('parent_id', null);  // Uniquement principales
    } else if (filters.parentId !== undefined) {
      if (filters.parentId === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', filters.parentId);
      }
    }
    // Sinon, récupérer toutes les tâches
  }

  // Tri par display_order pour respecter la hiérarchie
  return query.order('display_order', { ascending: true, nullsFirst: false });
}, []);
```

## 📊 Exemple de Données

### Données Brutes (Base de Données)

```json
[
  {
    "id": "task-1",
    "title": "Backend API",
    "parent_id": null,
    "task_level": 0,
    "display_order": "3"
  },
  {
    "id": "subtask-1-1",
    "title": "Authentification",
    "parent_id": "task-1",
    "task_level": 1,
    "display_order": "3.1"
  },
  {
    "id": "subtask-1-2",
    "title": "Base de données",
    "parent_id": "task-1",
    "task_level": 1,
    "display_order": "3.2"
  },
  {
    "id": "task-2",
    "title": "Frontend UI",
    "parent_id": null,
    "task_level": 0,
    "display_order": "4"
  }
]
```

### Données Organisées (Après organizeTasksHierarchy)

```json
[
  {
    "id": "task-1",
    "title": "Backend API",
    "parent_id": null,
    "task_level": 0,
    "display_order": "3",
    "isSubtask": false,
    "subtasks": [
      {
        "id": "subtask-1-1",
        "title": "Authentification",
        "parent_id": "task-1",
        "task_level": 1,
        "display_order": "3.1",
        "isSubtask": true
      },
      {
        "id": "subtask-1-2",
        "title": "Base de données",
        "parent_id": "task-1",
        "task_level": 1,
        "display_order": "3.2",
        "isSubtask": true
      }
    ]
  },
  {
    "id": "subtask-1-1",
    "title": "Authentification",
    "parent_id": "task-1",
    "task_level": 1,
    "display_order": "3.1",
    "isSubtask": true
  },
  {
    "id": "subtask-1-2",
    "title": "Base de données",
    "parent_id": "task-1",
    "task_level": 1,
    "display_order": "3.2",
    "isSubtask": true
  },
  {
    "id": "task-2",
    "title": "Frontend UI",
    "parent_id": null,
    "task_level": 0,
    "display_order": "4",
    "isSubtask": false,
    "subtasks": []
  }
]
```

## 🎨 Affichage dans les Composants

### Utilisation dans un Tableau

```tsx
import { useTasksOptimized } from '@/hooks/optimized/useTasksOptimized';

function TaskTable() {
  const { tasks, loading } = useTasksOptimized();

  return (
    <table>
      <tbody>
        {tasks.map(task => (
          <tr 
            key={task.id}
            className={task.isSubtask ? 'pl-8 bg-gray-50' : 'font-semibold'}
          >
            <td>
              {task.isSubtask && '└─ '}
              {task.isSubtask ? '📌' : '📋'} {task.title}
            </td>
            <td>{task.status}</td>
            <td>{task.assigned_name}</td>
            <td>
              {task.subtasks && task.subtasks.length > 0 && (
                <span className="text-xs text-gray-500">
                  {task.subtasks.length} sous-tâche(s)
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Affichage avec Indentation

```tsx
function TaskList() {
  const { tasks } = useTasksOptimized();

  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <div 
          key={task.id}
          className={cn(
            "p-3 border rounded",
            task.isSubtask ? "ml-8 border-l-4 border-blue-500" : "bg-white"
          )}
        >
          <div className="flex items-center gap-2">
            {task.isSubtask ? (
              <>
                <span className="text-gray-400">└─</span>
                <span>📌</span>
              </>
            ) : (
              <span>📋</span>
            )}
            <span className={task.isSubtask ? '' : 'font-semibold'}>
              {task.title}
            </span>
          </div>
          
          {!task.isSubtask && task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {task.subtasks.length} sous-tâche(s)
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## 🔍 Filtrage et Recherche

### Afficher Uniquement les Tâches Principales

```typescript
const { tasks } = useTasksOptimized({ 
  onlyMainTasks: true 
});
```

### Afficher les Sous-Tâches d'une Tâche Spécifique

```typescript
const { tasks } = useTasksOptimized({ 
  parentId: 'task-id-here' 
});
```

### Recherche dans Toutes les Tâches

```typescript
const { tasks } = useTasksOptimized({ 
  search: 'authentification' 
});
// Retourne tâches principales ET sous-tâches correspondantes
```

## 📈 Statistiques

Les statistiques sont calculées sur **toutes les tâches** (principales + sous-tâches) :

```typescript
const { stats } = useTasksOptimized();

console.log(stats);
// {
//   total: 10,        // Total de toutes les tâches
//   active: 7,        // Tâches non terminées
//   completed: 3,     // Tâches terminées
//   overdue: 2        // Tâches en retard
// }
```

## 🎯 Avantages

### 1. **Clarté Visuelle**
- ✅ Hiérarchie immédiatement visible
- ✅ Indentation et icônes distinctives
- ✅ Compteur de sous-tâches sur la tâche principale

### 2. **Performance**
- ✅ Organisation côté client (pas de requêtes multiples)
- ✅ Cache intelligent avec hiérarchie pré-calculée
- ✅ Tri optimisé par `display_order`

### 3. **Flexibilité**
- ✅ Affichage plat ou hiérarchique selon le besoin
- ✅ Filtrage par niveau (principales, sous-tâches, toutes)
- ✅ Recherche dans toute la hiérarchie

### 4. **Cohérence**
- ✅ Même logique dans tous les composants
- ✅ Types TypeScript robustes
- ✅ Propriété `subtasks` disponible sur chaque tâche principale

## 🚀 Utilisation dans Vos Composants

### Import

```typescript
import { useTasksOptimized, Task } from '@/hooks/optimized/useTasksOptimized';
```

### Hook de Base

```typescript
const { tasks, stats, loading, error, refresh } = useTasksOptimized();
```

### Avec Filtres

```typescript
const { tasks } = useTasksOptimized({
  projectId: 'project-123',
  status: ['doing', 'todo'],
  onlyMainTasks: false  // Inclure les sous-tâches
});
```

### Accès aux Sous-Tâches

```typescript
tasks.forEach(task => {
  if (!task.isSubtask && task.subtasks) {
    console.log(`${task.title} a ${task.subtasks.length} sous-tâche(s)`);
    task.subtasks.forEach(sub => {
      console.log(`  - ${sub.title}`);
    });
  }
});
```

## 📝 Notes Importantes

1. **display_order** : Crucial pour le tri correct (format "3", "3.1", "3.2", "4")
2. **parent_id** : Colonne principale pour la hiérarchie (pas `parent_task_id`)
3. **task_level** : 0 = principale, 1+ = sous-tâche
4. **isSubtask** : Ajouté dynamiquement pour faciliter l'affichage
5. **subtasks** : Array des sous-tâches, vide si aucune

## 🔗 Fichiers Modifiés

- ✅ `/src/hooks/optimized/useTasksOptimized.ts` - Hook principal
- ✅ `/src/hooks/utils/useQueryBuilder.ts` - Construction des requêtes
- ✅ `/src/components/vues/hooks/useTaskCRUD.ts` - Héritage lors de la création

**L'affichage hiérarchique est maintenant opérationnel dans toute l'application !** 🎉

# 🔍 DEBUG - ACTIONS VIDES

## Problème observé:

"Aucune colonne d'action" s'affiche dans les deux environnements (local ET production)

## Flux de chargement des actions:

1. **Hook: useTasksEnterprise**

   ```typescript
   task_actions!task_id(*)
   ```

   Charge les actions liées via la foreign key `task_id`

2. **Helper: getUniqueActions(tasks)**

   ```typescript
   tasks.forEach(task => {
     task.task_actions?.forEach(action => {
       allActions.add(action.title);
     });
   });
   ```

3. **Component: TaskActionColumns**
   - Si `orderedActions.length === 0` → Affiche le message vide

## Causes possibles:

### 1️⃣ Aucune action dans la base de données

- Les tâches n'ont pas d'actions liées
- Table `task_actions` vide ou non reliée

### 2️⃣ Problème de requête Supabase

- Foreign key `task_id` incorrecte
- Permissions RLS bloquent la lecture

### 3️⃣ Structure de données incorrecte

- `task.task_actions` est null/undefined
- Format de données inattendu

## Tests à effectuer:

### Test 1: Vérifier la base de données

```sql
-- Compter les actions
SELECT COUNT(*) FROM task_actions;

-- Voir les actions liées aux tâches
SELECT t.title, ta.title as action_title
FROM tasks t
LEFT JOIN task_actions ta ON ta.task_id = t.id
LIMIT 10;
```

### Test 2: Ajouter du logging

Dans `DynamicTable.tsx`:

```typescript
console.log('Tasks loaded:', tasks.length);
console.log('First task actions:', tasks[0]?.task_actions);
console.log('Unique actions:', getUniqueActions(tasks));
```

### Test 3: Créer une action manuellement

Via l'interface: "Action Détaillée" ou "Action rapide"

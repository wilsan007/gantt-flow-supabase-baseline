# 🎯 Logique Actions → Progression Tâches

**Date** : 30 octobre 2025  
**Problème Résolu** : Colonnes d'actions non visibles  
**Solution** : Ajouter `task_actions(*)` dans SELECT Enterprise

---

## 📊 Relation Tâches ↔ Actions ↔ Progression

### Architecture Base de Données

```
┌─────────────────────┐
│      TASKS          │
│─────────────────────│
│ id (PK)             │
│ title               │
│ progress (0-100)    │◄─── Calculé automatiquement
│ status              │◄─── Calculé automatiquement
│ ...                 │
└─────────────────────┘
         ▲
         │ 1:N
         │
┌─────────────────────┐
│   TASK_ACTIONS      │
│─────────────────────│
│ id (PK)             │
│ task_id (FK)        │
│ title               │
│ weight_percentage   │◄─── Important !
│ is_done (boolean)   │◄─── Important !
│ ...                 │
└─────────────────────┘
```

---

## ⚙️ Calcul Automatique de la Progression

### 1. Fonction `compute_task_progress`

```sql
CREATE OR REPLACE FUNCTION public.compute_task_progress(p_task_id uuid)
RETURNS integer AS
$$
  SELECT CASE 
    WHEN SUM(weight_percentage) = 0 THEN 0
    ELSE ROUND(SUM(
      CASE WHEN is_done = true 
      THEN weight_percentage 
      ELSE 0 
      END
    )::NUMERIC)
  END::INTEGER
  FROM public.task_actions
  WHERE task_id = p_task_id;
$$;
```

**Logique** :
- Somme les `weight_percentage` des actions où `is_done = true`
- Si action1 (30%) ✅ + action2 (20%) ✅ → `progress = 50%`
- Si action3 (50%) ❌ → pas comptée

### 2. Fonction `compute_task_status`

```sql
CREATE OR REPLACE FUNCTION public.compute_task_status(p_task_id uuid)
RETURNS text AS
$$
  SELECT CASE 
    WHEN compute_task_progress(p_task_id) = 100 THEN 'done'
    WHEN compute_task_progress(p_task_id) > 0 THEN 'doing'
    ELSE 'todo'
  END;
$$;
```

**Logique** :
- `progress = 100%` → `status = 'done'`
- `progress > 0%` → `status = 'doing'`
- `progress = 0%` → `status = 'todo'`

### 3. Trigger Automatique

```sql
CREATE TRIGGER trigger_on_task_action_change
    AFTER INSERT OR UPDATE OR DELETE ON task_actions
    FOR EACH ROW
    EXECUTE FUNCTION on_task_action_change();
```

**Fonction trigger** :
```sql
CREATE OR REPLACE FUNCTION on_task_action_change()
RETURNS TRIGGER AS
$$
BEGIN
    UPDATE tasks 
    SET 
        progress = compute_task_progress(target_task_id),
        status = compute_task_status(target_task_id),
        updated_at = now()
    WHERE id = target_task_id;
    
    RETURN NEW;
END;
$$;
```

**Déclenchement** :
- Quand une action est **créée** → recalcul auto
- Quand une action est **cochée/décochée** → recalcul auto
- Quand une action est **supprimée** → recalcul auto

---

## 🎯 Exemple Concret

### Tâche : "Développement Backend API"

**Actions créées** :
```
┌──────────────────────────────────┬────────┬─────────┐
│ Action                           │ Poids  │ is_done │
├──────────────────────────────────┼────────┼─────────┤
│ 1. Setup projet                  │ 20%    │ ✅      │
│ 2. Modèles de données            │ 30%    │ ✅      │
│ 3. Routes API                    │ 30%    │ ❌      │
│ 4. Tests unitaires               │ 20%    │ ❌      │
└──────────────────────────────────┴────────┴─────────┘
```

**Calcul Progression** :
```
progress = 20% (action 1 ✅) + 30% (action 2 ✅) = 50%
status = 'doing' (car 0% < 50% < 100%)
```

**Si on coche action 3** :
```
progress = 20% + 30% + 30% = 80%
status = 'doing'
```

**Si on coche action 4** :
```
progress = 20% + 30% + 30% + 20% = 100%
status = 'done'  ✅ AUTOMATIQUEMENT !
```

---

## 🔧 Distribution des Poids

### Fonction `distribute_equal_weights`

```sql
CREATE OR REPLACE FUNCTION distribute_equal_weights(p_task_id uuid)
RETURNS void AS
$$
DECLARE
    action_count INTEGER;
    base_weight INTEGER;
    remainder INTEGER;
BEGIN
    SELECT COUNT(*) INTO action_count
    FROM task_actions WHERE task_id = p_task_id;
    
    base_weight := 100 / action_count;
    remainder := 100 - (base_weight * action_count);
    
    -- Distribuer équitablement
    UPDATE task_actions 
    SET weight_percentage = base_weight + (ajustement pour remainder)
    WHERE task_id = p_task_id;
END;
$$;
```

**Exemples** :
- 3 actions → 34%, 33%, 33% (total = 100%)
- 4 actions → 25%, 25%, 25%, 25%
- 5 actions → 20%, 20%, 20%, 20%, 20%

**Validation** :
```sql
-- Trigger vérifie que SUM(weight_percentage) ≤ 100%
IF total_weight > 100 THEN
    RAISE EXCEPTION 'Somme > 100%';
END IF;
```

---

## ✅ Correction Appliquée

### Avant (Problème)

```typescript
// useTasksEnterprise.ts
let query = supabase.from('tasks').select(`
  *,
  projects:project_id(name),
  assignee:assignee_id(full_name)
  // ❌ Pas de task_actions !
`);
```

**Résultat** : `tasks[0].task_actions = undefined` → Colonnes vides

### Après (Solution)

```typescript
// useTasksEnterprise.ts
let query = supabase.from('tasks').select(`
  *,
  projects:project_id(name),
  assignee:assignee_id(full_name),
  task_actions(*)  // ✅ AJOUTÉ !
`);
```

**Résultat** : `tasks[0].task_actions = [...]` → Colonnes visibles

---

## 🧪 Test de Validation

### 1. Créer une tâche
```typescript
const task = await createTask({
  title: "Ma tâche test",
  progress: 0,  // Initial
  status: "todo"
});
```

### 2. Ajouter des actions
```typescript
await addActionColumn("Setup", task.id);
await addActionColumn("Development", task.id);
await addActionColumn("Testing", task.id);

// Distribution automatique : 34%, 33%, 33%
```

### 3. Cocher une action
```typescript
await toggleAction(task.id, action1.id);

// ✅ TRIGGER automatique :
// - is_done = true
// - tasks.progress = 34%
// - tasks.status = 'doing'
```

### 4. Cocher toutes les actions
```typescript
await toggleAction(task.id, action2.id);
await toggleAction(task.id, action3.id);

// ✅ TRIGGER automatique :
// - tasks.progress = 100%
// - tasks.status = 'done'
```

---

## 📊 Flux Complet

```
User coche action
    ↓
toggleAction(taskId, actionId)
    ↓
UPDATE task_actions SET is_done = true
    ↓
TRIGGER: on_task_action_change()
    ↓
compute_task_progress(taskId)
    ↓
UPDATE tasks SET progress = X, status = Y
    ↓
refetch() dans React
    ↓
UI se met à jour automatiquement
```

---

## 🎯 Points Clés

1. **100% automatique** : Pas besoin de calculer manuellement
2. **Cohérence garantie** : Trigger SQL assure la cohérence
3. **Performance** : Index sur `(task_id, weight_percentage)`
4. **Validation** : Somme des poids ne peut pas dépasser 100%
5. **Temps réel** : Trigger AFTER → mise à jour immédiate

---

## 🔍 Vérification Console

Après correction, vous devriez voir :

```javascript
console.log(tasks[0]);
{
  id: "xxx",
  title: "Ma tâche",
  progress: 50,  // ✅ Calculé
  status: "doing",  // ✅ Calculé
  task_actions: [  // ✅ CHARGÉES !
    { id: "a1", title: "Action 1", weight_percentage: 34, is_done: true },
    { id: "a2", title: "Action 2", weight_percentage: 33, is_done: true },
    { id: "a3", title: "Action 3", weight_percentage: 33, is_done: false }
  ]
}
```

---

**Fichier** : `/ACTIONS_PROGRESSION_LOGIQUE.md`

**Rechargez le navigateur et les colonnes d'actions devraient apparaître !** 🚀

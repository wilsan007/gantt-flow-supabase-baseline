# 📚 Guide - Hiérarchie des Tâches (Parent/Enfant)

## 🔍 Système de Détection

### Colonnes Clés dans la Table `tasks`

```sql
-- Colonnes pour la hiérarchie
parent_id UUID          -- ID de la tâche parente (NULL = tâche principale)
task_level INTEGER      -- Niveau hiérarchique (0 = principale, 1 = sous-tâche, etc.)
display_order TEXT      -- Ordre d'affichage (ex: "3.1", "3.2" pour sous-tâches)
```

### Règles de Détection

#### ⭐ **Tâche Principale**
```typescript
{
  parent_id: null,           // Pas de parent
  task_level: 0,             // Niveau 0
  display_order: "3"         // Format entier
}
```

#### 📌 **Sous-Tâche**
```typescript
{
  parent_id: "uuid-parent",  // Pointe vers la tâche parente
  task_level: 1,             // Niveau 1 ou plus
  display_order: "3.1"       // Format décimal (X.Y)
}
```

## 📊 Résultats du Projet "Migration Cloud"

### Analyse Complète

**Projet** : Migration Cloud  
**ID** : `c5ffe07c-a3c7-4a6d-89dd-375b4bbc3b3b`  
**Progression** : 86%

### Composition

- **Total tâches** : 3
- **Tâches principales** : 0
- **Sous-tâches** : 3

### Détails des Sous-Tâches

#### 1. "Sous-tâche de Backend API"
```json
{
  "id": "757927a7-40ea-4bf3-a7ee-28138e4f63aa",
  "title": "Sous-tâche de Backend API",
  "task_level": 1,
  "display_order": "3.1",
  "parent_id": "24d58517-cf61-4030-90c1-93a69a49c0a9",
  "progress": 0,
  "assigned_name": "Marie Dupont"
}
```

**Tâche Principale** :
- Titre : "Backend API"
- ID : `24d58517-cf61-4030-90c1-93a69a49c0a9`
- Projet : **Application Mobile** (pas Migration Cloud !)
- Display Order : "3"

#### 2. "Sous-tâche de test11"
```json
{
  "id": "5b46e3cc-1359-43bb-ae1d-36ca1e767e44",
  "title": "Sous-tâche de test11",
  "task_level": 1,
  "display_order": "4.1",
  "parent_id": "f5ae1645-e34c-4e08-be18-4d666cce9aae",
  "progress": 100,
  "assigned_name": "Non Assigné"
}
```

**Tâche Principale** :
- Titre : "Tests et Déploiement"
- ID : `f5ae1645-e34c-4e08-be18-4d666cce9aae`
- Projet : **Refonte Site Web** (pas Migration Cloud !)
- Display Order : "4"

#### 3. "Sous-tâche de Design Interface Utilisateur"
```json
{
  "id": "3fc4c48d-55e1-44a2-98d4-3b0bc10827fc",
  "title": "Sous-tâche de Design Interface Utilisateur",
  "task_level": 1,
  "display_order": "8.1",
  "parent_id": "37b92e01-7f3e-491a-80fe-1690bf6b977a",
  "progress": 0,
  "assigned_name": "Pierre Moreau"
}
```

**Tâche Principale** :
- Titre : "Design Interface Utilisateur"
- ID : `37b92e01-7f3e-491a-80fe-1690bf6b977a`
- Projet : **Application Mobile** (pas Migration Cloud !)
- Display Order : "8"

## 🚨 Problème Identifié

### Incohérence des Données

Les 3 tâches du projet "Migration Cloud" sont **toutes des sous-tâches** dont les tâches principales appartiennent à **d'autres projets** :

| Sous-tâche | Projet Actuel | Tâche Principale | Projet Parent |
|------------|---------------|------------------|---------------|
| Sous-tâche de Backend API | Migration Cloud | Backend API | Application Mobile |
| Sous-tâche de test11 | Migration Cloud | Tests et Déploiement | Refonte Site Web |
| Sous-tâche de Design Interface Utilisateur | Migration Cloud | Design Interface Utilisateur | Application Mobile |

### Conséquences

1. **Affichage Gantt** : Ces sous-tâches apparaissent sous "Migration Cloud" mais leurs parents sont ailleurs
2. **Hiérarchie cassée** : Les tâches principales ne sont pas dans le même projet
3. **Confusion utilisateur** : Difficile de comprendre la structure

## 🛠️ Solutions Possibles

### Option 1 : Corriger les project_id
Déplacer les sous-tâches vers les projets de leurs parents :
```sql
UPDATE tasks 
SET project_id = (SELECT project_id FROM tasks WHERE id = parent_id)
WHERE id IN (
  '757927a7-40ea-4bf3-a7ee-28138e4f63aa',
  '5b46e3cc-1359-43bb-ae1d-36ca1e767e44',
  '3fc4c48d-55e1-44a2-98d4-3b0bc10827fc'
);
```

### Option 2 : Convertir en tâches principales
Supprimer les liens parent pour en faire des tâches indépendantes :
```sql
UPDATE tasks 
SET parent_id = NULL, task_level = 0
WHERE id IN (
  '757927a7-40ea-4bf3-a7ee-28138e4f63aa',
  '5b46e3cc-1359-43bb-ae1d-36ca1e767e44',
  '3fc4c48d-55e1-44a2-98d4-3b0bc10827fc'
);
```

### Option 3 : Déplacer les parents vers Migration Cloud
Déplacer les tâches principales vers Migration Cloud :
```sql
UPDATE tasks 
SET project_id = 'c5ffe07c-a3c7-4a6d-89dd-375b4bbc3b3b',
    project_name = 'Migration Cloud'
WHERE id IN (
  '24d58517-cf61-4030-90c1-93a69a49c0a9',
  'f5ae1645-e34c-4e08-be18-4d666cce9aae',
  '37b92e01-7f3e-491a-80fe-1690bf6b977a'
);
```

## 📝 Utilisation du Script

### Commande de Base
```bash
node check-migration-cloud.js
```

### Vérifier un Autre Projet
```bash
node check-migration-cloud.js "Application Mobile"
node check-migration-cloud.js "Refonte Site Web"
```

### Sortie du Script

Le script affiche :
1. **Statistiques** : Nombre de tâches principales vs sous-tâches
2. **Tableau hiérarchique** : Vue d'ensemble avec indentation
3. **Détails complets** : Informations détaillées de chaque tâche
4. **Vérification des liens** : Validation des relations parent/enfant
5. **Résumé final** : Récapitulatif du projet

## 🎯 Recommandations

### Pour le Gantt

1. **Afficher la hiérarchie complète** : Inclure les tâches principales même si elles sont dans un autre projet
2. **Indicateur visuel** : Montrer clairement les liens cross-projet
3. **Filtrage intelligent** : Permettre de voir toute la hiérarchie ou seulement le projet

### Pour la Base de Données

1. **Contrainte de cohérence** : Ajouter une règle pour que sous-tâches et parents soient dans le même projet
2. **Migration des données** : Nettoyer les incohérences existantes
3. **Validation à la création** : Empêcher la création de sous-tâches dans un projet différent

## 🔗 Requêtes SQL Utiles

### Trouver toutes les sous-tâches orphelines
```sql
SELECT t.id, t.title, t.project_name, t.parent_id
FROM tasks t
LEFT JOIN tasks parent ON t.parent_id = parent.id
WHERE t.parent_id IS NOT NULL AND parent.id IS NULL;
```

### Trouver les sous-tâches dans un projet différent du parent
```sql
SELECT 
  t.id as subtask_id,
  t.title as subtask_title,
  t.project_name as subtask_project,
  parent.title as parent_title,
  parent.project_name as parent_project
FROM tasks t
JOIN tasks parent ON t.parent_id = parent.id
WHERE t.project_id != parent.project_id;
```

### Compter les tâches par niveau
```sql
SELECT 
  project_name,
  task_level,
  COUNT(*) as count
FROM tasks
GROUP BY project_name, task_level
ORDER BY project_name, task_level;
```

## 📚 Références

- **Colonne clé** : `parent_id` (pas `parent_task_id`)
- **Niveau hiérarchique** : `task_level` (0 = principale, 1+ = sous-tâche)
- **Ordre d'affichage** : `display_order` (format "X" ou "X.Y")
- **Script de vérification** : `check-migration-cloud.js`

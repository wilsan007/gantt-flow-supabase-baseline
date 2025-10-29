# 🔧 Guide de Migration - Normalisation project_name

## 📋 Problème Actuel

- **6 tâches** utilisent `project_name` (texte redondant)
- **3 tâches** utilisent `project_id` (clé étrangère correcte)
- **Calcul de progression incorrect** : 25% au lieu de 35%

## ✅ Solution

Transformer `project_name` en **colonne générée automatiquement** depuis `project_id`.

## 🚀 Étapes d'Application

### Option 1: Via Supabase Dashboard (RECOMMANDÉ)

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Ouvrir SQL Editor**
   - Menu latéral → SQL Editor
   - Cliquer sur "New query"

3. **Copier-coller le contenu du fichier**
   ```
   supabase/migrations/20251008001000_normalize_tasks_project_relation.sql
   ```

4. **Exécuter** (bouton "Run" ou Ctrl+Enter)

5. **Vérifier les résultats** dans l'output

### Option 2: Via CLI Supabase

```bash
# Se connecter à votre projet
supabase link --project-ref qliinxtanjdnwxlvnxji

# Appliquer la migration
supabase db push
```

## 📊 Résultats Attendus

### Avant Migration
```
Application Mobile: 25% (basé sur 3 tâches)
```

### Après Migration
```
Application Mobile: 35% (basé sur 6 tâches)
- Backend API: 60h × 57% = 34.20h
- Configuration Serveurs: 16h × 40% = 6.40h  
- Design Interface: 10h × 25% = 2.50h
- Design UI/UX: 40h × 52% = 20.80h
- Développement Backend: 12h × 40% = 4.80h
- Développement Frontend: 80h × 10% = 8.00h
TOTAL: 76.70h / 218h = 35%
```

## 🔍 Vérification Post-Migration

Exécuter cette requête pour vérifier :

```sql
-- Vérifier que project_name est bien généré
SELECT 
    t.title,
    t.project_id,
    t.project_name as nom_genere,
    p.name as nom_reel,
    CASE 
        WHEN t.project_name = p.name THEN '✅ OK'
        ELSE '❌ ERREUR'
    END as statut
FROM tasks t
JOIN projects p ON p.id = t.project_id
WHERE p.name = 'Application Mobile';
```

## ⚠️ Points d'Attention

1. **Backup recommandé** avant migration
2. **Tâches orphelines** : Les tâches avec `project_name` mais sans projet correspondant seront signalées
3. **Colonne GENERATED** : Ne plus jamais insérer/mettre à jour `project_name` manuellement
4. **Triggers** : Seront automatiquement mis à jour

## 🎯 Avantages

- ✅ **Source unique de vérité** : `project_id` uniquement
- ✅ **Pas de redondance** : `project_name` généré automatiquement
- ✅ **Calcul correct** : Toutes les tâches incluses
- ✅ **Maintenance facile** : Renommer un projet met à jour toutes les tâches
- ✅ **Performance** : Index optimisé sur `project_name`

## 📝 Code Frontend à Mettre à Jour

Après la migration, le code frontend n'a **PAS besoin** d'être modifié car :

- `project_name` existe toujours (colonne générée)
- Les requêtes fonctionnent exactement pareil
- La seule différence : `project_name` est maintenant **read-only**

### ⚠️ À NE PLUS FAIRE :
```typescript
// ❌ ANCIEN CODE (ne marchera plus)
await supabase
  .from('tasks')
  .update({ project_name: 'Nouveau Nom' })
  .eq('id', taskId);
```

### ✅ À FAIRE :
```typescript
// ✅ NOUVEAU CODE (utiliser project_id)
await supabase
  .from('tasks')
  .update({ project_id: projectId })
  .eq('id', taskId);
```

## 🔄 Rollback (si nécessaire)

Si vous devez annuler la migration :

```sql
-- Recréer project_name comme colonne normale
ALTER TABLE tasks DROP COLUMN project_name;
ALTER TABLE tasks ADD COLUMN project_name TEXT;

-- Remplir avec les données
UPDATE tasks t
SET project_name = p.name
FROM projects p
WHERE t.project_id = p.id;
```

## ✅ Checklist

- [ ] Backup de la base de données effectué
- [ ] Migration exécutée dans SQL Editor
- [ ] Vérification des résultats OK
- [ ] Progression "Application Mobile" = 35%
- [ ] 6 tâches visibles dans l'interface
- [ ] Tests de création/modification de tâches OK

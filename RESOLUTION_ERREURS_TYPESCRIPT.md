# 🔧 Résolution des Erreurs TypeScript

## 🎯 Problème Identifié

Les types TypeScript générés par Supabase ne connaissent pas encore les **nouvelles tables et RPC functions** créées pour le module Opérations :

### **Tables manquantes dans les types :**
- ❌ `operational_activities`
- ❌ `operational_schedules`  
- ❌ `operational_action_templates`

### **RPC Functions manquantes dans les types :**
- ❌ `instantiate_one_off_activity`
- ❌ `clone_operational_actions_to_task`
- ❌ `pause_activity`
- ❌ `get_activity_statistics`
- ❌ `delete_activity_with_future_occurrences`

---

## ✅ Solution 1 : Régénérer les Types (RECOMMANDÉ)

### **Commande rapide**
```bash
npm run db:types
```

### **Détails**
Cette commande va :
1. Se connecter à votre projet Supabase
2. Analyser le schéma de base de données
3. Générer les types TypeScript à jour
4. Enregistrer dans `src/integrations/supabase/types.ts`

### **Vérification**
Après génération, vous devriez voir :
```typescript
// Dans src/integrations/supabase/types.ts

export interface Database {
  public: {
    Tables: {
      operational_activities: { ... }
      operational_schedules: { ... }
      operational_action_templates: { ... }
      // ... autres tables
    }
    Functions: {
      instantiate_one_off_activity: { ... }
      clone_operational_actions_to_task: { ... }
      // ... autres RPC
    }
  }
}
```

---

## ⚡ Solution 2 : Assertions de Type (TEMPORAIRE)

Si vous ne pouvez pas régénérer les types immédiatement, voici comment contourner les erreurs :

### **Pour les requêtes de table**

**Avant (erreur) :**
```typescript
const { data } = await supabase
  .from('operational_action_templates')
  .select('*');
```

**Après (contournement) :**
```typescript
const { data } = await (supabase as any)
  .from('operational_action_templates')
  .select('*');
```

### **Pour les appels RPC**

**Avant (erreur) :**
```typescript
const { data } = await supabase.rpc('instantiate_one_off_activity', {
  p_activity_id: id,
  p_due_date: date
});
```

**Après (contournement) :**
```typescript
const { data } = await (supabase as any).rpc('instantiate_one_off_activity', {
  p_activity_id: id,
  p_due_date: date
});
```

---

## 🔍 Erreurs Spécifiques Détectées

### **1. useOperationalActionTemplates.ts**

**Ligne 30-33 : "Type instantiation is excessively deep"**

**Correction :**
```typescript
// Ajouter en haut du fichier
import type { SupabaseClient } from '@supabase/supabase-js';

// Puis utiliser le type any temporairement
const { data, error: fetchError } = await (supabase as any)
  .from('operational_action_templates')
  .select('*')
  .eq('activity_id', activityId)
  .order('position', { ascending: true });
```

### **2. OneOffActivityDialog.tsx**

**Ligne 90 : Table non reconnue**

**Correction :**
```typescript
await (supabase as any)
  .from('operational_action_templates')
  .insert({
    activity_id: activityData.id,
    title: template.title,
    description: template.description || null,
    position: template.position,
  });
```

**Ligne 101 : RPC non reconnue**

**Correction :**
```typescript
const { error: rpcError } = await (supabase as any).rpc('instantiate_one_off_activity', {
  p_activity_id: activityData.id,
  p_due_date: format(dueDate, 'yyyy-MM-dd'),
  p_title_override: null,
});
```

### **3. ActivityForm.tsx**

**Ligne 233 : Syntaxe JSX incorrecte** ✅ **CORRIGÉ**

Changé de :
```tsx
Variables: {'{'}{'{'} date{'}'}{'}'}, ...
```

À :
```tsx
Variables: {'{{date}}'}, {'{{isoWeek}}'}, ...
```

---

## 📋 Checklist de Résolution

### **Étape 1 : Régénérer les types**
```bash
npm run db:types
```

### **Étape 2 : Vérifier le fichier généré**
```bash
# Vérifier que le fichier existe
ls -la src/integrations/supabase/types.ts

# Vérifier que les tables sont présentes
grep "operational_activities" src/integrations/supabase/types.ts
```

### **Étape 3 : Redémarrer le serveur**
```bash
# Arrêter le serveur (Ctrl+C)
# Relancer
npm run dev
```

### **Étape 4 : Vérifier les erreurs TypeScript**
```bash
# Vérifier la compilation
npx tsc --noEmit
```

---

## 🚨 Si la Régénération Échoue

### **Problème : Supabase CLI non installé**
```bash
npm install -g supabase
```

### **Problème : Pas lié au projet**
```bash
supabase link --project-ref qliinxtanjdnwxlvnxji
```

### **Problème : Erreur d'authentification**
```bash
# Se connecter
supabase login

# Puis relancer
npm run db:types
```

### **Problème : Schéma non à jour**
Vérifier que les scripts SQL ont bien été exécutés :
```sql
-- Dans Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'operational%';
```

Devrait retourner :
- operational_activities
- operational_schedules
- operational_action_templates

---

## 🎯 Solution Alternative : Types Manuels (DERNIER RECOURS)

Si vraiment aucune solution ne fonctionne, créer un fichier de types manuels :

```typescript
// src/types/operational.ts

export interface OperationalActivity {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  kind: 'recurring' | 'one_off';
  scope: 'org' | 'department' | 'team' | 'person';
  department_id: string | null;
  owner_id: string | null;
  project_id: string | null;
  task_title_template: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface OperationalSchedule {
  id: string;
  tenant_id: string;
  activity_id: string;
  timezone: string;
  rrule: string | null;
  start_date: string;
  until: string | null;
  generate_window_days: number;
  created_at: string;
  updated_at: string;
}

export interface OperationalActionTemplate {
  id: string;
  tenant_id: string;
  activity_id: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
}
```

Puis utiliser ces types au lieu des types Supabase générés.

---

## ✅ Validation Finale

Une fois les types régénérés :

```bash
# Compiler TypeScript
npx tsc --noEmit

# Si aucune erreur :
✅ Types corrects !

# Lancer l'app
npm run dev
```

---

**Date :** 2025-01-13  
**Status :** Documentation complète  
**Prochaine action :** `npm run db:types`

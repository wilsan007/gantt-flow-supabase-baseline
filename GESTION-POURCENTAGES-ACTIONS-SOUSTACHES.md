# 📊 Gestion des Pourcentages d'Actions pour les Sous-tâches

## 🎯 Objectif

Implémenter la même logique de gestion des pourcentages pour les actions des sous-tâches que pour les tâches principales :
1. **Somme obligatoire à 100%** : Total des pourcentages doit être exactement 100%
2. **Redistribution automatique** : Réajustement automatique lors d'ajout/suppression d'actions
3. **Validation stricte** : Impossible de créer une sous-tâche avec des pourcentages incorrects

## ✅ **Modifications Implémentées**

### **1. Redistribution Automatique - Frontend**

#### **Fonction `addAction()` Améliorée**
```typescript
const addAction = () => {
  if (!newActionTitle.trim()) return;

  const newAction: ActionData = {
    id: `temp-${Date.now()}`,
    title: newActionTitle.trim(),
    weight_percentage: newActionWeight[0], // Sera recalculé automatiquement
    due_date: newActionDueDate?.toISOString(),
    notes: newActionNotes.trim() || undefined,
  };

  const updatedActions = [...actions, newAction];
  
  // Redistribution automatique des poids pour atteindre 100%
  const equalWeight = Math.floor(100 / updatedActions.length);
  const remainder = 100 - (equalWeight * updatedActions.length);
  
  const redistributedActions = updatedActions.map((action, index) => ({
    ...action,
    weight_percentage: index === 0 ? equalWeight + remainder : equalWeight
  }));
  
  setActions(redistributedActions);
  // ... reset form
};
```

#### **Fonction `removeAction()` Améliorée**
```typescript
const removeAction = (actionId: string) => {
  const updatedActions = actions.filter(action => action.id !== actionId);
  
  // Redistribution automatique des poids après suppression
  if (updatedActions.length > 0) {
    const equalWeight = Math.floor(100 / updatedActions.length);
    const remainder = 100 - (equalWeight * updatedActions.length);
    
    const redistributedActions = updatedActions.map((action, index) => ({
      ...action,
      weight_percentage: index === 0 ? equalWeight + remainder : equalWeight
    }));
    
    setActions(redistributedActions);
  } else {
    setActions([]);
  }
};
```

### **2. Validation Stricte - Frontend**

#### **Validation à la Soumission**
```typescript
const handleSubmit = () => {
  if (!title.trim()) return;
  if (!assignee || assignee === 'Non assigné') {
    alert('Un responsable doit être assigné à la sous-tâche');
    return;
  }

  // Validation des pourcentages d'actions si des actions sont définies
  if (actions.length > 0) {
    const totalWeight = actions.reduce((sum, action) => sum + action.weight_percentage, 0);
    if (totalWeight !== 100) {
      alert(`La somme des pourcentages des actions doit être égale à 100% (actuellement: ${totalWeight}%)`);
      return;
    }
  }
  
  // ... suite du traitement
};
```

#### **Bouton Désactivé si Invalide**
```typescript
<Button 
  onClick={handleSubmit} 
  disabled={
    !title.trim() || 
    !assignee || 
    assignee === 'Non assigné' ||
    (actions.length > 0 && actions.reduce((sum, action) => sum + action.weight_percentage, 0) !== 100)
  }
>
  Créer la Sous-tâche
</Button>
```

### **3. Redistribution Backend - PostgreSQL**

#### **Fonction `createSubTaskWithActions()` Renforcée**
```typescript
// Après création des actions
console.log('Actions created successfully');

// Redistribuer les poids pour s'assurer qu'ils totalisent 100%
console.log('Redistributing weights for subtask actions...');
await supabase.rpc('distribute_equal_weights', { p_task_id: newSubtask.id });
```

#### **Fonction PostgreSQL `distribute_equal_weights`**
```sql
CREATE OR REPLACE FUNCTION public.distribute_equal_weights(p_task_id UUID)
RETURNS VOID AS $$
DECLARE
    action_count INTEGER;
    base_weight INTEGER;
    remainder INTEGER;
    action_record RECORD;
    current_index INTEGER := 0;
BEGIN
    -- Compter le nombre d'actions pour cette tâche
    SELECT COUNT(*) INTO action_count
    FROM public.task_actions
    WHERE task_id = p_task_id;
    
    IF action_count = 0 THEN
        RETURN;
    END IF;
    
    -- Calculer la répartition
    base_weight := 100 / action_count;
    remainder := 100 - (base_weight * action_count);
    
    -- Mettre à jour chaque action
    FOR action_record IN 
        SELECT id FROM public.task_actions 
        WHERE task_id = p_task_id 
        ORDER BY created_at
    LOOP
        UPDATE public.task_actions 
        SET weight_percentage = base_weight + (CASE WHEN current_index < remainder THEN 1 ELSE 0 END)
        WHERE id = action_record.id;
        
        current_index := current_index + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### **4. Interface Utilisateur Améliorée**

#### **Indicateur Visuel en Temps Réel**
```typescript
{actions.length > 0 && (() => {
  const totalWeight = actions.reduce((sum, action) => sum + action.weight_percentage, 0);
  const isValid = totalWeight === 100;
  return (
    <div className={`text-xs p-2 rounded ${
      isValid 
        ? 'text-green-700 bg-green-50 border border-green-200' 
        : 'text-red-700 bg-red-50 border border-red-200'
    }`}>
      {isValid ? '✅' : '⚠️'} <strong>Total des poids: {totalWeight}%</strong>
      {isValid 
        ? ' (Parfait ! Les actions totalisent 100%)' 
        : ' (Doit être égal à 100% pour valider)'
      }
    </div>
  );
})()}
```

## 🏗️ **Architecture de la Solution**

### **Flux de Gestion des Pourcentages**

```mermaid
graph TD
    A[Utilisateur ajoute une action] --> B[addAction() appelée]
    B --> C[Nouvelle action ajoutée à la liste]
    C --> D[Redistribution automatique des poids]
    D --> E[Chaque action = 100/nombre_actions]
    E --> F[Reste distribué à la première action]
    F --> G[Interface mise à jour en temps réel]
    G --> H{Total = 100%?}
    H -->|Oui| I[Indicateur vert + Bouton actif]
    H -->|Non| J[Indicateur rouge + Bouton désactivé]
    
    K[Utilisateur supprime une action] --> L[removeAction() appelée]
    L --> M[Action supprimée de la liste]
    M --> D
```

### **Validation Multicouches**

1. **Interface (Temps Réel)**
   - Indicateur visuel du total
   - Bouton désactivé si total ≠ 100%
   - Messages d'aide contextuels

2. **Frontend (Soumission)**
   - Validation avant envoi
   - Message d'erreur explicite
   - Blocage si pourcentages incorrects

3. **Backend (Base de Données)**
   - Redistribution automatique via RPC
   - Garantie de cohérence des données
   - Fonction PostgreSQL sécurisée

## 📊 **Exemples de Fonctionnement**

### **Scénario 1 : Ajout d'Actions**
```
Aucune action → Ajout "Action A" → 100%
1 action (100%) → Ajout "Action B" → 50% / 50%
2 actions (50%/50%) → Ajout "Action C" → 34% / 33% / 33%
3 actions (34%/33%/33%) → Ajout "Action D" → 25% / 25% / 25% / 25%
```

### **Scénario 2 : Suppression d'Actions**
```
4 actions (25%/25%/25%/25%) → Suppression → 34% / 33% / 33%
3 actions (34%/33%/33%) → Suppression → 50% / 50%
2 actions (50%/50%) → Suppression → 100%
```

### **Scénario 3 : Validation**
```
✅ Total = 100% → Bouton "Créer" actif + Indicateur vert
❌ Total ≠ 100% → Bouton "Créer" désactivé + Indicateur rouge
```

## 🎯 **Avantages de la Solution**

### **✅ Cohérence avec les Tâches Principales**
- Même logique de redistribution
- Même validation stricte à 100%
- Même fonction PostgreSQL utilisée

### **✅ Expérience Utilisateur Optimale**
- Redistribution automatique (pas de calcul manuel)
- Feedback visuel immédiat
- Validation préventive (bouton désactivé)

### **✅ Intégrité des Données**
- Validation frontend ET backend
- Fonction PostgreSQL sécurisée
- Impossible de créer des données incohérentes

### **✅ Maintenance Simplifiée**
- Code réutilisé entre tâches et sous-tâches
- Logique centralisée dans PostgreSQL
- Tests automatiques possibles

## 🚀 **Résultat Final**

### **Comportement Unifié**
- ✅ **Tâches principales** : Redistribution automatique à 100%
- ✅ **Sous-tâches** : Redistribution automatique à 100%
- ✅ **Validation stricte** : Impossible de créer avec total ≠ 100%
- ✅ **Interface cohérente** : Même expérience utilisateur partout

### **Garanties Obtenues**
1. **Somme toujours égale à 100%** : Redistribution automatique
2. **Validation multicouches** : Frontend + Backend
3. **Feedback temps réel** : Indicateurs visuels
4. **Cohérence système** : Même logique partout

---

## 🎉 **Mission Accomplie**

✅ **Redistribution automatique** : Ajout/suppression redistribue les poids  
✅ **Validation à 100%** : Somme obligatoirement égale à 100%  
✅ **Interface intuitive** : Indicateurs visuels et validation temps réel  
✅ **Cohérence système** : Même comportement que les tâches principales  

**Les sous-tâches respectent maintenant exactement les mêmes règles de gestion des pourcentages que les tâches principales !** 🎯

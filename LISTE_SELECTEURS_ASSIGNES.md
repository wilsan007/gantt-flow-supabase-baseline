# 📋 LISTE COMPLÈTE - Sélecteurs d'Assignés à Mettre à Jour

**Date** : 1er novembre 2025 01:33 UTC+03:00  
**Objectif** : Ajouter "➕ Inviter quelqu'un" partout où on sélectionne une personne

---

## ✅ LISTE COMPLÈTE CONFIRMÉE

### 🎯 CATÉGORIE 1 : TÂCHES CLASSIQUES (5 composants)

#### 1. ✅ TaskCreationDialog.tsx

- **Chemin** : `/src/components/tasks/TaskCreationDialog.tsx`
- **Status** : ✅ **DÉJÀ IMPLÉMENTÉ**
- **Ligne sélecteur** : 313-363
- **Label** : "Assigné à"
- **Type** : Select avec liste employees
- **Note** : Bouton "➕ Inviter quelqu'un" ajouté ✅

#### 2. ⏳ TaskEditDialog.tsx

- **Chemin** : `/src/components/dialogs/TaskEditDialog.tsx`
- **Status** : ⏳ À IMPLÉMENTER
- **Label** : "Assigné à"
- **Type** : Select avec liste employees
- **Priorité** : 🔴 HAUTE (édition tâche)

#### 3. ⏳ QuickTaskForm.tsx

- **Chemin** : `/src/components/tasks/QuickTaskForm.tsx`
- **Status** : ⏳ À IMPLÉMENTER
- **Label** : "Assigné à"
- **Type** : Select rapide
- **Priorité** : 🟡 MOYENNE (formulaire rapide)

#### 4. ⏳ SubtaskCreationDialog.tsx

- **Chemin** : `/src/components/vues/table/SubtaskCreationDialog.tsx`
- **Status** : ⏳ À IMPLÉMENTER
- **Label** : "Assigné à"
- **Type** : Select avec héritage parent
- **Priorité** : 🟠 HAUTE (sous-tâches fréquentes)

#### 5. ⏳ TaskCreationDialog.tsx (Ancien - /dialogs/)

- **Chemin** : `/src/components/dialogs/TaskCreationDialog.tsx`
- **Status** : ⏳ À VÉRIFIER SI UTILISÉ
- **Label** : "Assigné à"
- **Note** : Possiblement obsolète, à vérifier
- **Priorité** : 🟢 BASSE (doublon possible)

---

### 📁 CATÉGORIE 2 : PROJETS (2 composants)

#### 6. ⏳ ProjectCreationDialog.tsx

- **Chemin** : `/src/components/projects/ProjectCreationDialog.tsx`
- **Status** : ⏳ À IMPLÉMENTER
- **Ligne sélecteur** : 128-139
- **Label** : "Manager" / "Chef de projet"
- **Type** : Select avec availableManagers
- **Priorité** : 🔴 HAUTE (création projet)
- **Note** : Liste hardcodée `['Ahmed Waleh', 'Sarah Martin'...]` à remplacer

#### 7. ⏳ ProjectDetailsDialog.tsx

- **Chemin** : `/src/components/projects/ProjectDetailsDialog.tsx`
- **Status** : ⏳ À IMPLÉMENTER
- **Label** : "Manager" (édition)
- **Priorité** : 🟡 MOYENNE (édition projet)

---

### ⚙️ CATÉGORIE 3 : OPÉRATIONS / ACTIVITÉS (4 composants)

#### 8. ⏳ ActionTemplateForm.tsx

- **Chemin** : `/src/components/operations/ActionTemplateForm.tsx`
- **Status** : ⏳ À IMPLÉMENTER
- **Ligne sélecteur** : ~306-320
- **Label** : "Assigné" (avec switch héritage)
- **Type** : Select avec inherit_assignee option
- **Priorité** : 🔴 HAUTE (actions template)
- **Particularité** : Gère l'héritage de l'assigné parent

#### 9. ⏳ OneOffActivityDialog.tsx

- **Chemin** : `/src/components/operations/OneOffActivityDialog.tsx`
- **Status** : ⏳ À IMPLÉMENTER
- **Label** : "Responsable"
- **Type** : Select employees
- **Priorité** : 🟠 HAUTE (activités ponctuelles)

#### 10. ⏳ ActivityForm.tsx

- **Chemin** : `/src/components/operations/ActivityForm.tsx`
- **Status** : ⏳ À IMPLÉMENTER
- **Label** : "Responsable principal"
- **Priorité** : 🟠 HAUTE (activités récurrentes)

#### 11. ⏳ ActivityDetailDialog.tsx

- **Chemin** : `/src/components/operations/ActivityDetailDialog.tsx`
- **Status** : ⏳ À IMPLÉMENTER
- **Label** : "Responsable" (édition)
- **Priorité** : 🟡 MOYENNE (édition activité)

---

### 🗂️ CATÉGORIE 4 : ANCIENS COMPOSANTS /vues/ (3 composants)

#### 12. ⏳ TaskCreationDialog.tsx (vues)

- **Chemin** : `/src/components/vues/dialogs/TaskCreationDialog.tsx`
- **Status** : ⚠️ À VÉRIFIER SI ENCORE UTILISÉ
- **Priorité** : 🟢 BASSE (possiblement obsolète)
- **Note** : Composant dans /vues/ (ancienne architecture)

#### 13. ⏳ TaskEditDialog.tsx (vues)

- **Chemin** : `/src/components/vues/dialogs/TaskEditDialog.tsx`
- **Status** : ⚠️ À VÉRIFIER SI ENCORE UTILISÉ
- **Priorité** : 🟢 BASSE (possiblement obsolète)

#### 14. ⏳ ActionCreationDialog.tsx (vues)

- **Chemin** : `/src/components/vues/table/ActionCreationDialog.tsx`
- **Status** : ⚠️ À VÉRIFIER SI ENCORE UTILISÉ
- **Priorité** : 🟢 BASSE (possiblement obsolète)

---

## 📊 STATISTIQUES FINALES

### Répartition par Statut

- ✅ **Implémenté** : 1 composant (7%)
- ⏳ **À implémenter (HAUTE priorité)** : 6 composants (43%)
- ⏳ **À implémenter (MOYENNE priorité)** : 3 composants (21%)
- ⚠️ **À vérifier si utilisé** : 4 composants (29%)
- **TOTAL** : 14 composants

### Répartition par Catégorie

- 🎯 **Tâches** : 5 composants (36%)
- 📁 **Projets** : 2 composants (14%)
- ⚙️ **Opérations** : 4 composants (29%)
- 🗂️ **Anciens /vues/** : 3 composants (21%)

### Priorités d'Implémentation

- 🔴 **HAUTE** (à faire en premier) : 6 composants
- 🟡 **MOYENNE** (à faire ensuite) : 3 composants
- 🟢 **BASSE** (après vérification) : 4 composants

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1 : Composants HAUTE Priorité (6) 🔴

1. **TaskEditDialog.tsx** (édition tâche)
2. **SubtaskCreationDialog.tsx** (sous-tâches)
3. **ProjectCreationDialog.tsx** (création projet)
4. **ActionTemplateForm.tsx** (actions template)
5. **OneOffActivityDialog.tsx** (activités ponctuelles)
6. **ActivityForm.tsx** (activités récurrentes)

### Phase 2 : Composants MOYENNE Priorité (3) 🟡

7. **QuickTaskForm.tsx** (formulaire rapide)
8. **ProjectDetailsDialog.tsx** (édition projet)
9. **ActivityDetailDialog.tsx** (édition activité)

### Phase 3 : Vérification Anciens Composants (4) 🟢

10-14. **Composants /vues/** (vérifier utilisation)

---

## ✅ PROCHAINES ÉTAPES

1. ✅ Liste complète créée
2. ✅ Priorités établies
3. ⏳ **EN COURS** : Implémentation Phase 1
4. ⏳ Tests après chaque implémentation
5. ⏳ Documentation finale

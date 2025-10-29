# 📎 Systèmes de Gestion de Fichiers - Vue d'Ensemble

L'application dispose de **DEUX systèmes de gestion de fichiers distincts et indépendants**.

---

## 🎯 Vue d'Ensemble Rapide

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   TABLEAU DYNAMIQUE D'EXÉCUTION                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┬──────────────┬──────────────────────────────────────┐│
│  │   PARTIE     │   PARTIE     │         PARTIE DROITE               ││
│  │   FIXE       │   GAUCHE     │         (ACTIONS)                   ││
│  │              │  (COLONNES)  │                                     ││
│  ├──────────────┼──────────────┼──────────────────────────────────────┤│
│  │ Titre        │ Progression  │ Analyse  │ Conception │ Implém.    ││
│  │              │              │ Besoins  │            │            ││
│  ├──────────────┼──────────────┼──────────────────────────────────────┤│
│  │ Ma tâche     │ [===40%===]  │ ○ 40% + │  ○ 35% +  │ ✓ 25% + (2)││
│  │              │    + (1)     │         │            │            ││
│  │              │     ↑        │    ↑        ↑            ↑         ││
│  │              │  SYSTÈME 1   │         SYSTÈME 2                  ││
│  │              │  (Tâches)    │    (Actions Opérationnelles)       ││
│  └──────────────┴──────────────┴──────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 SYSTÈME 1 : Fichiers de Tâches

### **🎯 Objectif**
Gérer les fichiers de preuve **globaux** pour une **tâche entière**.

### **📍 Localisation**
- **Colonne** : "Progression" (partie gauche du tableau)
- **Position** : À côté de la barre de progression (`[===40%===] + (1)`)

### **📁 Fichiers Concernés**
- **Migration** : `supabase/migrations/20241026_task_attachments.sql`
- **Composant UI** : `src/components/tasks/TaskAttachmentUpload.tsx`
- **Composant Table** : `src/components/tasks/TaskTableEnterprise.tsx`
- **Table SQL** : `task_attachments`
- **Bucket Storage** : `task-attachments`

### **🔑 Caractéristiques**
- **1 bouton "+"** par tâche
- Compteur global de fichiers de la tâche
- Validation : Tâche non validable sans au moins 1 fichier
- Utilisation : Preuves générales (captures d'écran, rapports, etc.)

### **📊 Exemple d'Usage**
```
Tâche : "Migration Base de Données"
Progression : [===40%===] + (3)
                           ↑
                    3 fichiers uploadés :
                    - screenshot_migration.png
                    - rapport_migration.pdf
                    - logs_erreurs.txt
```

### **💡 Cas d'Utilisation**
- Documents généraux de la tâche
- Captures d'écran globales
- Rapports de synthèse
- Logs d'erreurs
- Fichiers de configuration

---

## 🎬 SYSTÈME 2 : Fichiers d'Actions Opérationnelles ✅

### **🎯 Objectif**
Gérer les fichiers de preuve **spécifiques** pour chaque **action opérationnelle**.

### **📍 Localisation**
- **Colonnes** : "Analyse des besoins", "Conception", "Implémentation", etc. (partie droite dynamique)
- **Position** : À côté de chaque cercle d'action (`○ 40% + (2)`)

### **📁 Fichiers Concernés**
- **Migration** : `supabase/migrations/20241026_action_attachments.sql`
- **Composant UI** : `src/components/operations/ActionAttachmentUpload.tsx`
- **Composant Table** : `src/components/vues/table/TaskActionColumns.tsx` ⚠️
- **Table SQL** : `operational_action_attachments`
- **Bucket Storage** : `action-attachments`

### **🔑 Caractéristiques**
- **1 bouton "+"** par action opérationnelle
- Compteur individuel par action
- **Validation STRICTE** : Cercle désactivé sans fichier
- **Toast d'erreur** si tentative de validation sans fichier
- Utilisation : Preuves spécifiques par étape

### **📊 Exemple d'Usage**
```
Tâche : "Migration Base de Données"

Action 1 : "Analyse des besoins" 
  → ○ 40% + (2)
     - analyse_besoins.pdf
     - schéma_actuel.png

Action 2 : "Conception"
  → ○ 35% + (1)
     - schema_migration.png

Action 3 : "Implémentation"
  → ✓ 25% + (3) ← Validée
     - script_migration.sql
     - logs_migration.txt
     - screenshot_resultat.png
```

### **💡 Cas d'Utilisation**
- **Analyse** : Documents d'analyse, schémas
- **Conception** : Maquettes, diagrammes
- **Implémentation** : Code, scripts
- **Tests** : Rapports de tests, captures
- **Protection** : Audits, certifications

### **🔒 Règle de Validation**
```
SI fichiers_uploadés = 0:
  ❌ Cercle désactivé (opacité 50%, non cliquable)
  🚨 Toast : "Document requis"
  
SI fichiers_uploadés >= 1:
  ✅ Cercle actif (cliquable)
  ✅ Validation possible
```

---

## 🔄 Comparaison des Deux Systèmes

| Aspect | SYSTÈME 1 (Tâches) | SYSTÈME 2 (Actions) |
|--------|-------------------|---------------------|
| **Localisation** | Colonne Progression (gauche) | Colonnes Actions (droite) |
| **Granularité** | Par tâche (global) | Par action (spécifique) |
| **Nombre de "+"** | 1 par tâche | 1 par action (plusieurs par tâche) |
| **Table SQL** | `task_attachments` | `operational_action_attachments` |
| **Bucket Storage** | `task-attachments` | `action-attachments` |
| **Composant Upload** | `TaskAttachmentUpload.tsx` | `ActionAttachmentUpload.tsx` |
| **Composant Table** | `TaskTableEnterprise.tsx` | `TaskActionColumns.tsx` |
| **Validation** | Optionnelle | **OBLIGATOIRE** ✅ |
| **Cercle désactivé** | Non | **Oui** (sans fichier) |
| **Toast d'erreur** | Non | **Oui** (tentative sans fichier) |
| **Usage** | Preuves générales | Preuves spécifiques par étape |

---

## 🎯 Quand Utiliser Chaque Système ?

### **✅ Utiliser SYSTÈME 1 (Tâches)** si :
- Document concerne **toute la tâche**
- Preuve générale (rapport global, synthèse)
- Pas lié à une action spécifique
- Exemple : "Rapport final de migration"

### **✅ Utiliser SYSTÈME 2 (Actions)** si :
- Document concerne **une étape précise**
- Preuve spécifique (analyse, conception, test)
- Validation granulaire requise
- Exemple : "Schéma de conception v2.1"

---

## 🛠️ Architecture Technique

### **Base de Données**

#### **Table 1 : task_attachments**
```sql
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  task_id UUID NOT NULL,         ← Lien vers la tâche
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  ...
);
```

#### **Table 2 : operational_action_attachments**
```sql
CREATE TABLE operational_action_attachments (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  action_template_id UUID NOT NULL,  ← Lien vers l'action
  task_id UUID NOT NULL,              ← Lien vers la tâche
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  ...
);
```

### **Différence Clé**
- **Système 1** : 1 fichier → 1 tâche
- **Système 2** : 1 fichier → 1 action + 1 tâche (plus granulaire)

---

## 📊 Workflow Complet

### **Étape 1 : Créer une Tâche**
```
Tâche : "Développer API REST"
```

### **Étape 2 : Ajouter des Actions Opérationnelles**
```
Action 1 : Analyse des besoins (40%)
Action 2 : Conception (35%)
Action 3 : Implémentation (25%)
```

### **Étape 3 : Uploader des Fichiers d'Actions (SYSTÈME 2)**
```
Action 1 : ○ 40% + (2) ← 2 fichiers spécifiques
Action 2 : ○ 35% + (1) ← 1 fichier spécifique
Action 3 : ○ 25% +     ← Aucun fichier (cercle désactivé ❌)
```

### **Étape 4 : Valider les Actions**
```
Action 1 : ✓ 40% + (2) ← Validée
Action 2 : ✓ 35% + (1) ← Validée
Action 3 : ○ 25% +     ← Non validable (pas de fichier)
```

### **Étape 5 : Uploader des Fichiers de Tâche (SYSTÈME 1)**
```
Progression : [===75%===] + (3) ← 3 fichiers globaux
```

### **Étape 6 : Valider la Tâche**
```
Tâche complète : ✓ 100%
Toutes les actions validées
Fichiers globaux uploadés
```

---

## ✅ Checklist Développeur

### **Pour SYSTÈME 1 (Tâches)**
- [ ] Migration `20241026_task_attachments.sql` appliquée
- [ ] Bucket `task-attachments` créé (privé)
- [ ] Composant `TaskAttachmentUpload.tsx` fonctionnel
- [ ] Bouton "+" visible dans colonne Progression
- [ ] Compteur s'affiche correctement

### **Pour SYSTÈME 2 (Actions)** ✅
- [ ] Migration `20241026_action_attachments.sql` appliquée
- [ ] Bucket `action-attachments` créé (privé)
- [ ] Composant `ActionAttachmentUpload.tsx` fonctionnel
- [ ] Bouton "+" visible à côté de chaque cercle
- [ ] Compteur s'affiche correctement
- [ ] **Cercle désactivé sans fichier** ✅
- [ ] **Toast d'erreur si tentative sans fichier** ✅
- [ ] Validation strictement bloquée ✅

---

## 🚀 Commandes de Test

### **1. Appliquer les Migrations**
```bash
cd supabase
supabase db push
```

### **2. Créer les Buckets Storage**
Dans Supabase Dashboard → Storage :
- Créer `task-attachments` (privé)
- Créer `action-attachments` (privé)

### **3. Tester SYSTÈME 1**
1. Ouvrir le tableau
2. Cliquer sur le "+" dans la colonne Progression
3. Uploader un fichier
4. Vérifier que le compteur s'affiche : `+ (1)`

### **4. Tester SYSTÈME 2** ✅
1. Ouvrir le tableau
2. Essayer de cliquer sur un cercle sans fichier → ❌ Toast d'erreur
3. Cliquer sur le "+" à côté d'un cercle
4. Uploader un fichier
5. Vérifier que le compteur s'affiche : `+ (1)`
6. Vérifier que le cercle est maintenant cliquable ✅
7. Cliquer sur le cercle → Action validée ✓

---

## 🎉 Conclusion

**Deux systèmes complémentaires et indépendants** :

1. **SYSTÈME 1 (Tâches)** : Preuves globales, optionnelles, colonne gauche
2. **SYSTÈME 2 (Actions)** : Preuves spécifiques, **obligatoires**, colonnes droites ✅

Les deux systèmes coexistent sans conflit et offrent une **granularité maximale** dans la gestion des preuves de réalisation.

---

**Date de documentation** : 27 Octobre 2025  
**Statut** : ✅ **Les deux systèmes sont opérationnels**  
**Implémentation correcte** : ✅ **SYSTÈME 2 au bon endroit (partie droite)** 🚀

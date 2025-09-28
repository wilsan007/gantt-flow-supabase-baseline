# 📊 Guide du Tableau Dynamique - Gantt Flow Next

## Vue d'ensemble

Le tableau dynamique est le cœur du système de gestion des tâches. Il permet de visualiser et gérer les tâches avec leurs actions associées de manière interactive et intuitive.

## 🏗️ Architecture

### Composants Principaux

1. **DynamicTable.tsx** - Composant orchestrateur principal
2. **TaskFixedColumns.tsx** - Colonnes fixes (tâche, responsable, dates, etc.)
3. **TaskActionColumns.tsx** - Colonnes dynamiques pour les actions
4. **TaskTableHeader.tsx** - En-tête avec outils de création
5. **TaskRow.tsx** - Ligne individuelle avec gestion hiérarchique

### Nouveaux Composants Ajoutés

6. **ActionCreationDialog.tsx** - Dialog pour créer des actions détaillées
7. **SubtaskCreationDialog.tsx** - Dialog pour créer des sous-tâches personnalisées

## ✨ Fonctionnalités

### 🎯 Gestion des Actions

#### Actions Rapides
- **Sélectionner une tâche** : Cliquer sur une ligne
- **Saisir le nom** : Dans le champ "Action rapide..."
- **Ajouter** : Bouton `+` ou touche Entrée
- **Poids automatique** : Redistribution équitable

#### Actions Détaillées
- **Bouton "Action Détaillée"** : Ouvre un dialog complet
- **Paramètres configurables** :
  - Titre personnalisé
  - Poids spécifique (1-100%)
  - Date d'échéance optionnelle
  - Notes descriptives

### 🌳 Gestion des Sous-tâches

#### Création Rapide
- **Bouton `+`** : Dans la colonne "Tâche"
- **Paramètres par défaut** :
  - Titre : "Sous-tâche de [Parent]"
  - Mêmes dates que le parent
  - Charge : 1h
  - Statut : "todo"
  - **Aucune action** : Sous-tâche vide

#### Création Personnalisée avec Actions
- **Bouton `⚙️`** : À côté du bouton `+`
- **Paramètres configurables** :
  - Titre personnalisé
  - Dates de début/fin
  - Charge estimée
  - **Actions intégrées** : Ajout d'actions directement
- **Gestion des actions** :
  - Titre et poids personnalisés
  - Dates d'échéance optionnelles
  - Notes descriptives
  - Redistribution automatique des poids
  - Prévisualisation en temps réel

### 📋 Interface Utilisateur

#### En-tête du Tableau
```
[🎯 Tableau Dynamique d'Exécution]    [Tâche sélectionnée] [Action rapide...] [+] [Action Détaillée]
```

#### Colonnes Fixes
- **Tâche** : Titre avec hiérarchie et boutons d'action
- **Responsable** : Sélecteur déroulant
- **Début/Échéance** : Dates avec icônes
- **Priorité/Statut** : Badges colorés
- **Charge** : Heures estimées
- **Progression** : Barre de progression automatique
- **Documents/Commentaires** : Liens et compteurs
- **Actions** : Menu déroulant (dupliquer/supprimer)

#### Colonnes Dynamiques
- **Actions** : Checkboxes avec poids
- **Réorganisation** : Actions de la tâche sélectionnée en premier
- **Mise à jour optimiste** : Interface réactive

## 🔄 Flux de Données

### Création d'Action
```
1. Utilisateur sélectionne une tâche
2. Saisit le nom de l'action
3. Système crée l'action avec tenant_id
4. Redistribution automatique des poids
5. Mise à jour temps réel via Supabase
```

### Création de Sous-tâche
```
1. Utilisateur clique sur + ou ⚙️
2. Système génère display_order hiérarchique
3. Création avec parent_id et task_level
4. Héritage des propriétés du parent
5. Affichage avec indentation visuelle
```

### Toggle d'Action
```
1. Utilisateur clique sur checkbox
2. Mise à jour optimiste de l'interface
3. Calcul automatique de la progression
4. Mise à jour du statut (todo/doing/done)
5. Synchronisation avec la base de données
```

## 🎨 Styles et UX

### Hiérarchie Visuelle
- **Indentation** : 20px par niveau
- **Taille des éléments** : Sous-tâches plus petites
- **Couleurs** : Tâche sélectionnée en surbrillance

### Feedback Utilisateur
- **Tooltips** : Explications contextuelles
- **Animations** : Transitions fluides
- **États** : Boutons désactivés si conditions non remplies

### Responsive Design
- **Version mobile** : MobileDynamicTable.tsx
- **Adaptation automatique** : Hook useIsMobile

## 🛠️ Utilisation Technique

### Hooks Principaux
```typescript
const {
  tasks,
  loading,
  error,
  addActionColumn,        // Action rapide
  addDetailedAction,      // Action détaillée
  createSubTask,          // Sous-tâche
  toggleAction,           // Basculer état
  refetch                 // Actualiser
} = useTasks();
```

### Types TypeScript
```typescript
interface TaskAction {
  id: string;
  title: string;
  is_done: boolean;
  weight_percentage: number;
  due_date?: string;
  notes?: string;
}

interface Task {
  id: string;
  title: string;
  task_actions?: TaskAction[];
  parent_id?: string;
  task_level: number;
  display_order: string;
  // ... autres propriétés
}
```

## 📝 Exemples d'Usage

### Ajouter une Action Rapide
1. Cliquer sur une tâche pour la sélectionner
2. Taper "Tests unitaires" dans le champ
3. Appuyer sur Entrée ou cliquer sur `+`
4. L'action apparaît dans toutes les colonnes

### Créer une Action Détaillée
1. Sélectionner une tâche
2. Cliquer sur "Action Détaillée"
3. Remplir le formulaire :
   - Titre : "Révision du code"
   - Poids : 30%
   - Échéance : Dans 3 jours
   - Notes : "Focus sur la sécurité"
4. Valider

### Créer une Sous-tâche avec Actions
1. Cliquer sur `⚙️` à côté d'une tâche parent
2. Personnaliser la sous-tâche :
   - Titre : "Analyse des besoins"
   - Dates : Semaine prochaine
   - Charge : 4h
3. Ajouter des actions :
   - "Recherche documentaire" (40%)
   - "Entretiens utilisateurs" (35%)
   - "Synthèse" (25%)
4. Valider → Sous-tâche créée avec actions intégrées

## 🚀 Améliorations Futures

### Fonctionnalités Prévues
- **Glisser-déposer** : Réorganisation des actions
- **Actions en lot** : Opérations sur plusieurs tâches
- **Templates** : Actions prédéfinies par type de projet
- **Notifications** : Alertes sur échéances d'actions
- **Statistiques** : Métriques de performance

### Optimisations
- **Virtualisation** : Pour de grandes listes
- **Cache intelligent** : Réduction des requêtes
- **Synchronisation offline** : Travail hors ligne
- **Export** : PDF/Excel des tableaux

## 🔧 Maintenance

### Points d'Attention
- **Politiques RLS** : Vérifier l'isolation des tenants
- **Performance** : Surveiller les requêtes complexes
- **Cohérence** : Validation des display_order
- **Sécurité** : Contrôle des permissions

### Debugging
- **Logs** : Console pour les opérations CRUD
- **États** : Vérification des hooks
- **Réseau** : Monitoring Supabase
- **UI** : Validation des états de chargement

---

*Ce guide sera mis à jour au fur et à mesure des évolutions du système.*

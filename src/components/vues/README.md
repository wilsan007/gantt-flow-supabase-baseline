# 📁 Répertoire VUES - Gantt Flow Next

Ce répertoire contient une copie organisée des 49 fichiers principaux qui gèrent les 3 vues de l'application.

## 📊 Structure du Répertoire

```
vues/
├── 📁 gantt/           (7 fichiers)  - Vue Diagramme de Gantt
├── 📁 kanban/          (1 fichier)   - Vue Kanban
├── 📁 table/           (16 fichiers) - Vue Tableau Dynamique
├── 📁 dialogs/         (5 fichiers)  - Dialogs partagés
├── 📁 projects/        (1 fichier)   - Vue projets
├── 📁 responsive/      (4 fichiers)  - Versions mobile
├── 📁 hooks/           (11 fichiers) - Hooks personnalisés
├── 📁 contexts/        (2 fichiers)  - Contextes React
├── 📁 lib/             (1 fichier)   - Utilitaires
├── 📁 shared/          (1 fichier)   - Composants partagés
└── 📄 README.md        - Ce fichier
```

---

## 📂 Détail des Dossiers

### 🎨 gantt/ (Vue Gantt - 7 fichiers)
```
├── GanttChart.tsx              (Composant principal)
├── GanttHeader.tsx             (En-tête avec sélecteur de vue)
├── GanttStates.tsx             (États loading/error)
├── GanttTaskBar.tsx            (Barre de tâche draggable)
├── GanttTaskList.tsx           (Liste des tâches)
└── GanttTimeline.tsx           (Timeline avec grille)
```

**Fonctionnalités:**
- Drag & drop des tâches
- Resize des barres
- Modes: jour/semaine/mois
- Toggle tâches/projets

---

### 🎯 kanban/ (Vue Kanban - 1 fichier)
```
└── KanbanBoard.tsx             (Composant principal avec KanbanCard et KanbanColumn internes)
```

**Fonctionnalités:**
- Drag & drop entre colonnes
- 4 colonnes pour tâches (todo, doing, blocked, done)
- 4 colonnes pour projets (planning, active, on_hold, completed)
- Badges de priorité
- Progression visuelle

---

### 📋 table/ (Vue Tableau - 16 fichiers)
```
├── DynamicTable.tsx            (Composant principal)
├── TaskTableHeader.tsx         (En-tête avec actions)
├── TaskFixedColumns.tsx        (Colonnes fixes)
├── TaskActionColumns.tsx       (Colonnes d'actions dynamiques)
├── TaskTableBody.tsx           (Corps du tableau)
├── TaskRow.tsx                 (Ligne de tâche)
├── SubTaskRow.tsx              (Ligne de sous-tâche)
├── TaskRowActions.tsx          (Menu d'actions)
├── AssigneeSelect.tsx          (Sélecteur responsable)
├── DocumentCellColumn.tsx      (Colonne documents)
├── CommentCellColumn.tsx       (Colonne commentaires)
├── DocumentsColumn.tsx         (Gestion documents)
├── CommentsColumn.tsx          (Gestion commentaires)
├── TaskDialogManager.tsx       (Gestionnaire dialogs)
├── ActionCreationDialog.tsx    (Création d'action)
├── SubtaskCreationDialog.tsx   (Création sous-tâche)
├── LoadingState.tsx            (État chargement)
└── ErrorState.tsx              (État erreur)
```

**Fonctionnalités:**
- Colonnes fixes et dynamiques
- Hiérarchie de sous-tâches
- Actions avec checkboxes
- Documents et commentaires
- Mise à jour optimiste

---

### 💬 dialogs/ (Dialogs - 5 fichiers)
```
├── TaskCreationDialog.tsx      (Création tâche)
├── TaskEditDialog.tsx          (Édition tâche)
├── TaskDetailsDialog.tsx       (Détails tâche)
├── TaskSelectionDialog.tsx     (Sélection tâche)
└── EnhancedTaskDetailsDialog.tsx (Détails enrichis)
```

---

### 📁 projects/ (Vue Projets - 1 fichier)
```
└── ProjectTableView.tsx        (Affichage projets en tableau)
```

---

### 📱 responsive/ (Versions Mobile - 4 fichiers)
```
├── ResponsiveLayout.tsx        (Container responsive)
├── MobileGanttChart.tsx        (Gantt mobile)
├── MobileKanbanBoard.tsx       (Kanban mobile)
└── MobileDynamicTable.tsx      (Table mobile)
```

**Détection:** Breakpoint à 768px via `useIsMobile()`

---

### 🔧 hooks/ (Hooks - 11 fichiers)
```
├── useTasks.ts                 (Agrégateur principal)
├── useTaskDatabase.ts          (Récupération Supabase)
├── useTaskActions.ts           (Actions CRUD)
├── useTaskCRUD.ts              (Opérations de base)
├── useProjects.ts              (Gestion projets)
├── useEmployees.ts             (Gestion employés)
├── use-mobile.tsx              (Détection responsive)
├── useGanttDrag.ts             (Drag & drop Gantt)
├── useTaskDetails.ts           (Détails tâche)
├── useTaskHistory.ts           (Historique)
└── useTaskAuditLogs.ts         (Logs audit)
```

---

### 🌐 contexts/ (Contextes - 2 fichiers)
```
├── ViewModeContext.tsx         (Mode d'affichage par défaut)
└── TenantContext.tsx           (Contexte tenant)
```

---

### 🛠️ lib/ (Utilitaires - 1 fichier)
```
└── ganttHelpers.ts             (Helpers Gantt: calculs, configs)
```

---

### 🔗 shared/ (Partagés - 1 fichier)
```
└── Index.tsx                   (Page principale avec 3 onglets)
```

---

## 📊 Statistiques

| Catégorie | Nombre de fichiers |
|-----------|-------------------|
| Vue Gantt | 7 |
| Vue Kanban | 1 |
| Vue Table | 16 |
| Dialogs | 5 |
| Projects | 1 |
| Responsive | 4 |
| Hooks | 11 |
| Contexts | 2 |
| Lib | 1 |
| Shared | 1 |
| **TOTAL** | **49** |

---

## 🔄 Flux de Données

```
Index.tsx (Page principale)
    ↓
┌───────────────────────────────────────┐
│   ViewModeProvider + TenantProvider   │
└───────────────────────────────────────┘
    ↓
┌─────────────┬─────────────┬─────────────┐
│ GanttChart  │ KanbanBoard │DynamicTable │
└─────────────┴─────────────┴─────────────┘
         ↓           ↓            ↓
    ┌────────────────────────────────┐
    │   useTasks() + useProjects()   │
    └────────────────────────────────┘
                   ↓
         ┌──────────────────┐
         │  Supabase (RLS)  │
         └──────────────────┘
```

---

## 🎯 Points d'Entrée

### Pour modifier une vue:
- **Gantt**: `gantt/GanttChart.tsx`
- **Kanban**: `kanban/KanbanBoard.tsx`
- **Table**: `table/DynamicTable.tsx`

### Pour ajouter une fonctionnalité:
- **Hook de données**: `hooks/`
- **Composant UI**: Dossier de la vue concernée
- **Dialog**: `dialogs/`
- **Utilitaire**: `lib/`

### Pour modifier les données:
- **Types**: `hooks/useTasks.ts`
- **Requêtes**: `hooks/useTaskDatabase.ts`
- **Mutations**: `hooks/useTaskActions.ts`

---

## 🚀 Utilisation

Ce répertoire est une **copie de référence** pour:
- 📚 Documentation de l'architecture
- 🔍 Analyse du code
- 🎓 Formation des développeurs
- 📦 Backup organisé

**Note**: Les fichiers sources restent dans `src/`. Ce répertoire est pour référence uniquement.

---

## 📝 Notes

- Tous les fichiers sont des **copies** des sources
- Structure organisée par **fonctionnalité**
- Facilite la **navigation** et la **compréhension**
- Voir `ARCHITECTURE_3_VUES.md` pour plus de détails

---

**Créé le**: 2025-10-07  
**Total fichiers**: 49  
**Projet**: Gantt Flow Next

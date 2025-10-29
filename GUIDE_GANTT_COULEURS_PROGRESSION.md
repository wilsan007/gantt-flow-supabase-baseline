# 📚 Guide - Système de Couleurs et Progression Gantt

## 🎯 Problème Résolu

**Avant** :
- ❌ Couleurs aléatoires ou basées sur le statut
- ❌ Progression affichée uniquement en texte (50% complété)
- ❌ Pas de cohérence visuelle entre projets et tâches
- ❌ Difficile de distinguer les projets visuellement

**Maintenant** :
- ✅ 35 couleurs distinctes attribuées par projet
- ✅ Progression visuelle dans les barres (couleur foncée = complété)
- ✅ Toutes les tâches d'un projet ont la même couleur
- ✅ Affichage uniquement du nom de l'assigné (pas de % dans la liste)

## ✅ Solution Implémentée

### 1. Palette de 35 Couleurs

**Fichier** : `/src/lib/ganttColors.ts`

```typescript
export const GANTT_COLORS = [
  // Bleus (1-5)
  '#3b82f6', '#60a5fa', '#2563eb', '#1e40af', '#0ea5e9',
  
  // Verts (6-10)
  '#10b981', '#34d399', '#059669', '#84cc16', '#22c55e',
  
  // Oranges/Jaunes (11-15)
  '#f59e0b', '#fbbf24', '#f97316', '#fb923c', '#eab308',
  
  // Rouges/Roses (16-20)
  '#ef4444', '#f87171', '#dc2626', '#ec4899', '#f43f5e',
  
  // Violets/Indigos (21-25)
  '#8b5cf6', '#a78bfa', '#7c3aed', '#6366f1', '#818cf8',
  
  // Cyans/Teals (26-30)
  '#06b6d4', '#22d3ee', '#0891b2', '#14b8a6', '#2dd4bf',
  
  // Couleurs supplémentaires (31-35)
  '#d946ef', '#c026d3', '#a855f7', '#f472b6', '#fb7185',
];
```

### 2. Attribution des Couleurs

#### Règle 1 : Projets

Les projets reçoivent des couleurs **dans l'ordre** :
- **Projet 1** → Couleur 1 (#3b82f6 - Bleu vif)
- **Projet 2** → Couleur 2 (#60a5fa - Bleu clair)
- **Projet 3** → Couleur 3 (#2563eb - Bleu royal)
- ...
- **Projet 35** → Couleur 35 (#fb7185 - Rose saumon)
- **Projet 36** → Couleur 1 (wrap-around)

```typescript
export function assignProjectColors(projects: Array<{ id: string; name: string }>): ProjectColorMap {
  const colorMap: ProjectColorMap = {};
  
  projects.forEach((project, index) => {
    colorMap[project.id] = GANTT_COLORS[index % GANTT_COLORS.length];
  });
  
  return colorMap;
}
```

#### Règle 2 : Tâches avec Projet (y compris Sous-tâches)

Les tâches **héritent la couleur de leur projet** :
- Tâche du Projet 1 → Couleur 1
- Sous-tâche du Projet 1 → Couleur 1 (hérite du parent)
- Toutes les tâches du même projet → Même couleur

**Héritage Automatique pour les Sous-tâches** :
```typescript
// Dans useTaskCRUD.ts - Lors de la création d'une sous-tâche
if (parentTaskData) {
  insertData.project_id = parentTaskData.project_id;  // ✅ Héritage obligatoire
  insertData.department_id = parentTaskData.department_id;
  insertData.project_name = parentTaskData.project_name;
  // ...
}
```

**Attribution de la Couleur** :
```typescript
// Dans ganttColors.ts - La sous-tâche utilise son project_id hérité
if (task.project_id && projectColorMap[task.project_id]) {
  return projectColorMap[task.project_id];  // ✅ Même couleur que le parent
}
```

#### Règle 3 : Tâches sans Projet

Les tâches **sans projet** utilisent les couleurs restantes :
- Commencer après le nombre de projets
- Exemple : 5 projets → Tâche sans projet 1 → Couleur 6

```typescript
// Pour les tâches sans projet, utiliser les couleurs restantes
const colorIndex = (totalProjects + taskIndex) % GANTT_COLORS.length;
return GANTT_COLORS[colorIndex];
```

### 3. Affichage de la Progression

#### Barre de Progression Visuelle

```typescript
// Couleurs pour la progression
const baseColor = task.color;                    // Couleur du projet
const completedColor = darkenColor(baseColor, 20); // Partie complétée (foncée)
const remainingColor = lightenColor(baseColor, 40); // Partie restante (claire)
```

**Exemple visuel** :
```
┌─────────────────────────────────────────┐
│████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░│  50% complété
│← Foncé →   ← Clair →                   │
│ (complété)  (restant)                   │
└─────────────────────────────────────────┘
```

#### Fonctions de Manipulation des Couleurs

```typescript
// Assombrir une couleur (partie complétée)
export function darkenColor(hex: string, percent: number = 30): string {
  const rgb = hexToRgb(hex);
  const factor = (100 - percent) / 100;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Éclaircir une couleur (partie restante)
export function lightenColor(hex: string, percent: number = 50): string {
  const rgb = hexToRgb(hex);
  const factor = percent / 100;
  const r = Math.round(rgb.r + (255 - rgb.r) * factor);
  const g = Math.round(rgb.g + (255 - rgb.g) * factor);
  const b = Math.round(rgb.b + (255 - rgb.b) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
```

### 4. Affichage dans la Liste

**Avant** :
```
📁 Projet Alpha
   50% complété - Marie Dupont
```

**Maintenant** :
```
📁 Projet Alpha
   Marie Dupont
```

**Code** :
```tsx
<div className="text-sm text-foreground/70">
  {task.assignee}
</div>
```

## 📊 Architecture Complète

### Flux de Données

```
1. Récupération des Projets
   ↓
2. Attribution des Couleurs (assignProjectColors)
   ↓
3. Création du ProjectColorMap
   ↓
4. Pour chaque tâche :
   - Si project_id existe → Couleur du projet
   - Sinon → Couleur restante
   ↓
5. Affichage dans GanttTaskBar :
   - Fond clair (partie restante)
   - Overlay foncé (partie complétée)
```

### Composants Modifiés

#### 1. GanttChart.tsx

```typescript
// Créer le map de couleurs pour les projets
const projectColorMap: ProjectColorMap = React.useMemo(() => {
  return assignProjectColors(projects);
}, [projects]);

// Obtenir la couleur pour chaque tâche
const getGanttTask = (task: Task, index: number): GanttTask => {
  const taskColor = getTaskColor(
    { project_id: task.project_id, project_name: task.project_name },
    projectColorMap,
    index,
    projects.length
  );

  return {
    // ...
    color: taskColor,
    // ...
  };
};
```

#### 2. GanttTaskBar.tsx

```typescript
// Couleurs pour la progression
const baseColor = task.color;
const completedColor = darkenColor(baseColor, 20);
const remainingColor = lightenColor(baseColor, 40);

<div style={{ backgroundColor: remainingColor, borderColor: baseColor }}>
  {/* Partie complétée */}
  <div
    style={{
      width: `${task.progress}%`,
      backgroundColor: completedColor
    }}
  />
</div>
```

#### 3. ganttColors.ts (Nouveau)

Fonctions utilitaires :
- `GANTT_COLORS` : Palette de 35 couleurs
- `assignProjectColors()` : Attribution aux projets
- `getTaskColor()` : Obtenir la couleur d'une tâche
- `darkenColor()` : Assombrir pour progression
- `lightenColor()` : Éclaircir pour partie restante
- `hexToRgb()` : Conversion hex → RGB

## 🎨 Exemples Visuels

### Exemple 1 : 3 Projets avec Tâches et Sous-tâches

**Projets** :
- Projet A (ID: proj-1) → Couleur 1 (#3b82f6 - Bleu vif)
- Projet B (ID: proj-2) → Couleur 2 (#60a5fa - Bleu clair)
- Projet C (ID: proj-3) → Couleur 3 (#2563eb - Bleu royal)

**Hiérarchie Complète** :
```
📁 Projet A (#3b82f6 - Bleu vif)
  ├─ 📋 Tâche 1 → Couleur 1 (Bleu vif)
  │   ├─ 📌 Sous-tâche 1.1 → Couleur 1 (héritée du parent)
  │   └─ 📌 Sous-tâche 1.2 → Couleur 1 (héritée du parent)
  └─ 📋 Tâche 2 → Couleur 1 (Bleu vif)
      └─ 📌 Sous-tâche 2.1 → Couleur 1 (héritée du parent)

📁 Projet B (#60a5fa - Bleu clair)
  └─ 📋 Tâche 3 → Couleur 2 (Bleu clair)
      ├─ 📌 Sous-tâche 3.1 → Couleur 2 (héritée du parent)
      └─ 📌 Sous-tâche 3.2 → Couleur 2 (héritée du parent)

📁 Projet C (#2563eb - Bleu royal)
  └─ 📋 Tâche 4 → Couleur 3 (Bleu royal)

Sans projet
  ├─ 📋 Tâche 5 → Couleur 4 (#1e40af - Bleu foncé)
  │   └─ 📌 Sous-tâche 5.1 → Couleur 4 (pas de projet parent)
  └─ 📋 Tâche 6 → Couleur 5 (#0ea5e9 - Bleu ciel)
```

**Points Clés** :
- ✅ Toutes les sous-tâches héritent du `project_id` de leur parent
- ✅ Les sous-tâches ont donc la même couleur que leur tâche parente
- ✅ Cohérence visuelle totale au sein d'un projet
- ✅ Les sous-tâches sans projet héritent de la couleur de leur parent (pas de projet)

### Exemple 2 : Progression Visuelle

**Tâche à 30%** :
```
┌─────────────────────────────────────────┐
│██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│← 30% →← 70% restant →                  │
└─────────────────────────────────────────┘
```

**Tâche à 75%** :
```
┌─────────────────────────────────────────┐
│██████████████████████████████░░░░░░░░░░│
│← 75% complété →      ← 25% →           │
└─────────────────────────────────────────┘
```

**Tâche à 100%** :
```
┌─────────────────────────────────────────┐
│████████████████████████████████████████│
│← 100% complété →                        │
└─────────────────────────────────────────┘
```

## 🔧 Configuration

### Ajouter Plus de Couleurs

Pour ajouter des couleurs supplémentaires :

```typescript
// Dans ganttColors.ts
export const GANTT_COLORS = [
  // ... couleurs existantes
  '#nouvelle-couleur-36',
  '#nouvelle-couleur-37',
  // ...
];
```

### Ajuster l'Intensité de la Progression

```typescript
// Dans GanttTaskBar.tsx
const completedColor = darkenColor(baseColor, 30); // Plus foncé
const remainingColor = lightenColor(baseColor, 60); // Plus clair
```

### Personnaliser les Couleurs par Projet

```typescript
// Attribution manuelle
const customColorMap: ProjectColorMap = {
  'project-id-1': '#custom-color-1',
  'project-id-2': '#custom-color-2',
  // ...
};
```

## 🔗 Héritage des Couleurs pour les Sous-tâches

### Processus Complet

#### 1. Création d'une Sous-tâche

Lorsqu'une sous-tâche est créée, elle hérite automatiquement du `project_id` :

```typescript
// useTaskCRUD.ts - Fonction createTask
if (taskData.parent_id) {
  const { data: parentTask } = await supabase
    .from('tasks')
    .select('project_id, department_id, assignee_id, project_name, department_name, assigned_name')
    .eq('id', taskData.parent_id)
    .single();
  
  // Héritage obligatoire
  insertData.project_id = parentTaskData.project_id;  // ✅
  insertData.project_name = parentTaskData.project_name;
  // ...
}
```

#### 2. Attribution de la Couleur

La sous-tâche utilise son `project_id` hérité pour obtenir la couleur :

```typescript
// GanttChart.tsx
const getGanttTask = (task: Task, index: number): GanttTask => {
  const taskColor = getTaskColor(
    { 
      project_id: task.project_id,  // ✅ project_id hérité du parent
      project_name: task.project_name 
    },
    projectColorMap,
    index,
    projects.length
  );
  
  return {
    // ...
    color: taskColor,  // ✅ Même couleur que le parent
    // ...
  };
};
```

#### 3. Résultat Visuel

```
Gantt Chart:
┌─────────────────────────────────────────────────────────┐
│ Tâche 1 (Projet A)    ████████████████░░░░░░░░░  75%   │ Bleu vif
│   Sous-tâche 1.1      ██████░░░░░░░░░░░░░░░░░░  30%   │ Bleu vif (même)
│   Sous-tâche 1.2      ████████████████████████ 100%   │ Bleu vif (même)
│ Tâche 2 (Projet B)    ████████░░░░░░░░░░░░░░░░  40%   │ Bleu clair
│   Sous-tâche 2.1      ████░░░░░░░░░░░░░░░░░░░░  20%   │ Bleu clair (même)
└─────────────────────────────────────────────────────────┘
```

### Cas Particuliers

#### Cas 1 : Sous-tâche d'une Tâche avec Projet
```typescript
Tâche Parent:
  - project_id: "proj-1"
  - Couleur: #3b82f6 (Bleu vif)

Sous-tâche:
  - project_id: "proj-1" (hérité) ✅
  - Couleur: #3b82f6 (Bleu vif) ✅
```

#### Cas 2 : Sous-tâche d'une Tâche sans Projet
```typescript
Tâche Parent:
  - project_id: null
  - Couleur: #1e40af (Couleur 4)

Sous-tâche:
  - project_id: null (hérité) ✅
  - Couleur: #1e40af (Couleur 4) ✅
```

#### Cas 3 : Hiérarchie à Plusieurs Niveaux
```typescript
Tâche Principale (Projet A):
  - project_id: "proj-1"
  - Couleur: #3b82f6 ✅

  └─ Sous-tâche Niveau 1:
      - project_id: "proj-1" (hérité)
      - Couleur: #3b82f6 ✅
      
      └─ Sous-tâche Niveau 2:
          - project_id: "proj-1" (hérité)
          - Couleur: #3b82f6 ✅
```

**Toute la hiérarchie partage la même couleur !**

## 📈 Avantages

### 1. **Clarté Visuelle**
- ✅ Identification immédiate des projets par couleur
- ✅ Progression visible d'un coup d'œil
- ✅ Cohérence visuelle entre tâches du même projet
- ✅ Sous-tâches visuellement liées à leur parent

### 2. **Scalabilité**
- ✅ 35 couleurs distinctes (suffisant pour la plupart des cas)
- ✅ Wrap-around automatique si plus de 35 projets
- ✅ Gestion intelligente des tâches sans projet

### 3. **Accessibilité**
- ✅ Couleurs contrastées et distinctes
- ✅ Bordures pour meilleure visibilité
- ✅ Texte lisible sur toutes les couleurs

### 4. **Performance**
- ✅ Calcul des couleurs en useMemo (pas de recalcul)
- ✅ Manipulation des couleurs côté client
- ✅ Pas de requêtes supplémentaires

## 🚀 Utilisation

### Affichage Standard

Le système fonctionne **automatiquement** :
1. Les projets sont chargés
2. Les couleurs sont attribuées
3. Les tâches héritent des couleurs
4. La progression est affichée visuellement

### Personnalisation

Pour personnaliser les couleurs d'un projet spécifique :

```typescript
// Dans GanttChart.tsx
const projectColorMap = React.useMemo(() => {
  const map = assignProjectColors(projects);
  
  // Override pour un projet spécifique
  map['project-special-id'] = '#custom-color';
  
  return map;
}, [projects]);
```

## 📝 Notes Techniques

### Ordre d'Attribution

L'ordre des couleurs est déterminé par :
1. **L'ordre de récupération des projets** (généralement par date de création)
2. **L'index dans le tableau** (0, 1, 2, ...)
3. **Modulo 35** pour wrap-around

### Cohérence

Pour garantir la cohérence :
- Les couleurs sont calculées dans `useMemo`
- Le `projectColorMap` est stable entre les renders
- Les tâches utilisent toujours la même couleur

### Performance

- **Calcul initial** : O(n) où n = nombre de projets
- **Lookup** : O(1) grâce au Map
- **Manipulation couleurs** : O(1) par tâche

## 🎯 Résultat Final

**Le Gantt Chart offre maintenant :**
- ✅ 35 couleurs distinctes pour les projets
- ✅ Progression visuelle dans les barres
- ✅ Cohérence visuelle par projet
- ✅ **Héritage automatique des couleurs pour les sous-tâches**
- ✅ Affichage épuré (uniquement assigné)
- ✅ Gestion intelligente des tâches sans projet
- ✅ Performance optimale avec useMemo

**Prêt pour la production avec une expérience visuelle professionnelle !** 🚀

## 🔍 Vérification du Système

Pour vérifier que les sous-tâches héritent correctement des couleurs :

### 1. Vérifier l'Héritage du project_id

```sql
-- Dans Supabase SQL Editor
SELECT 
  t.id,
  t.title,
  t.parent_id,
  t.project_id,
  t.project_name,
  p.title as parent_title,
  p.project_id as parent_project_id
FROM tasks t
LEFT JOIN tasks p ON t.parent_id = p.id
WHERE t.parent_id IS NOT NULL
ORDER BY t.project_id, t.parent_id;
```

**Résultat attendu** : `t.project_id` = `p.project_id` pour toutes les sous-tâches

### 2. Tester la Création d'une Sous-tâche

1. Créer une tâche principale dans un projet
2. Créer une sous-tâche de cette tâche
3. Vérifier dans le Gantt que les deux ont la même couleur
4. Vérifier dans la base de données que `project_id` est identique

### 3. Tester l'Affichage

**Dans le Gantt Chart** :
- Toutes les barres d'un même projet doivent avoir la même couleur de base
- Les sous-tâches doivent avoir exactement la même couleur que leur parent
- La progression doit être visible (partie foncée vs claire)

**Exemple visuel attendu** :
```
Projet Alpha (Bleu vif #3b82f6)
├─ Tâche 1     [████████████░░░░░░░░] 60% - Bleu vif
│  ├─ ST 1.1   [██████░░░░░░░░░░░░░░] 30% - Bleu vif (même)
│  └─ ST 1.2   [████████████████████] 100% - Bleu vif (même)
└─ Tâche 2     [████░░░░░░░░░░░░░░░░] 20% - Bleu vif
```

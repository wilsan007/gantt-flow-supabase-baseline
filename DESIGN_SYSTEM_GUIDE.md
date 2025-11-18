# 🎨 Guide du Système de Design - Wadashaqayn SaaS

## Vue d'ensemble

Système de design moderne inspiré des meilleurs SaaS B2B du marché : **Linear**, **Monday.com**, **Notion**, et **Asana**.

---

## 🎯 Palette de Couleurs

### **Couleurs de Priorité** (Tasks/Projects)

```tsx
// High Priority - Rouge vif
className = 'bg-priority-high text-white';
className = 'text-priority-high';
className = 'border-priority-high';

// Medium Priority - Orange/Jaune
className = 'bg-priority-medium text-white';

// Low Priority - Vert
className = 'bg-priority-low text-white';

// Critical Priority - Rose/Rouge foncé
className = 'bg-priority-critical text-white';
```

**Exemples d'utilisation :**

```tsx
// Badge de priorité
<span className="px-2 py-1 rounded-full bg-priority-high text-white text-xs font-medium">
  High
</span>

// Indicateur visuel
<div className="w-2 h-2 rounded-full bg-priority-medium" />
```

---

### **Couleurs de Statut** (Workflow states)

```tsx
// À faire (To Do) - Gris
className = 'bg-status-todo';

// En cours (Doing) - Bleu
className = 'bg-status-doing text-white';

// Bloqué (Blocked) - Rouge
className = 'bg-status-blocked text-white';

// Terminé (Done) - Vert
className = 'bg-status-done text-white';

// En révision (Review) - Jaune
className = 'bg-status-review text-white';

// Backlog - Gris clair
className = 'bg-status-backlog';
```

**Exemples d'utilisation :**

```tsx
// Badge de statut (style Monday.com)
<span className="px-3 py-1 rounded-md bg-status-doing text-white font-medium">
  En cours
</span>

// Colonne Kanban
<div className="rounded-t-lg bg-status-todo p-2">
  <h3>À faire</h3>
</div>
```

---

### **Couleurs de Badge** (Labels/Tags style Notion)

```tsx
// Bleu
className = 'bg-badge-blue/10 text-badge-blue border-badge-blue/20';

// Violet
className = 'bg-badge-purple/10 text-badge-purple';

// Rose
className = 'bg-badge-pink/10 text-badge-pink';

// Vert
className = 'bg-badge-green/10 text-badge-green';

// Jaune
className = 'bg-badge-yellow/10 text-badge-yellow';

// Orange
className = 'bg-badge-orange/10 text-badge-orange';

// Rouge
className = 'bg-badge-red/10 text-badge-red';

// Gris
className = 'bg-badge-gray/10 text-badge-gray';
```

**Exemples d'utilisation :**

```tsx
// Badge style Notion (background léger + texte coloré)
<span className="px-2 py-1 rounded bg-badge-blue/10 text-badge-blue text-sm">
  Frontend
</span>

// Badge avec bordure
<span className="px-2 py-1 rounded border bg-badge-purple/10 text-badge-purple border-badge-purple/20">
  Design
</span>
```

---

### **Couleurs Techniques** (Actions/UI)

```tsx
// Succès - Vert
className = 'bg-success text-white';

// Avertissement - Jaune
className = 'bg-warning text-white';

// Danger/Erreur - Rouge
className = 'bg-danger text-white';

// Information - Bleu
className = 'bg-info text-white';
```

---

## 📦 Composants Exemple

### **1. Badge de Priorité (Linear/Monday.com style)**

```tsx
interface PriorityBadgeProps {
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const styles = {
    critical: 'bg-priority-critical text-white',
    high: 'bg-priority-high text-white',
    medium: 'bg-priority-medium text-white',
    low: 'bg-priority-low text-white',
  };

  const labels = {
    critical: '🔥 Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[priority]}`}>
      {labels[priority]}
    </span>
  );
};
```

### **2. Badge de Statut (Monday.com style)**

```tsx
interface StatusBadgeProps {
  status: 'todo' | 'doing' | 'blocked' | 'done' | 'review' | 'backlog';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const styles = {
    todo: 'bg-status-todo text-gray-700',
    doing: 'bg-status-doing text-white',
    blocked: 'bg-status-blocked text-white',
    done: 'bg-status-done text-white',
    review: 'bg-status-review text-white',
    backlog: 'bg-status-backlog text-gray-600',
  };

  const labels = {
    todo: 'À faire',
    doing: '⚡ En cours',
    blocked: '🚫 Bloqué',
    done: '✅ Terminé',
    review: '👀 En révision',
    backlog: 'Backlog',
  };

  return (
    <span className={`rounded-md px-3 py-1 text-sm font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};
```

### **3. Tag/Label (Notion style)**

```tsx
interface LabelProps {
  color: 'blue' | 'purple' | 'pink' | 'green' | 'yellow' | 'orange' | 'red' | 'gray';
  children: React.ReactNode;
}

export const Label = ({ color, children }: LabelProps) => {
  const styles = {
    blue: 'bg-badge-blue/10 text-badge-blue border-badge-blue/20',
    purple: 'bg-badge-purple/10 text-badge-purple border-badge-purple/20',
    pink: 'bg-badge-pink/10 text-badge-pink border-badge-pink/20',
    green: 'bg-badge-green/10 text-badge-green border-badge-green/20',
    yellow: 'bg-badge-yellow/10 text-badge-yellow border-badge-yellow/20',
    orange: 'bg-badge-orange/10 text-badge-orange border-badge-orange/20',
    red: 'bg-badge-red/10 text-badge-red border-badge-red/20',
    gray: 'bg-badge-gray/10 text-badge-gray border-badge-gray/20',
  };

  return (
    <span className={`rounded border px-2 py-1 text-xs font-medium ${styles[color]}`}>
      {children}
    </span>
  );
};
```

### **4. Carte de Tâche Kanban (Linear style)**

```tsx
interface TaskCardProps {
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee?: string;
  progress?: number;
}

export const TaskCard = ({ title, priority, assignee, progress }: TaskCardProps) => {
  return (
    <div className="modern-card transition-smooth cursor-pointer rounded-lg p-4 hover:shadow-lg">
      {/* Header avec priorité */}
      <div className="mb-2 flex items-center justify-between">
        <PriorityBadge priority={priority} />
        {assignee && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
            {assignee[0]}
          </div>
        )}
      </div>

      {/* Titre */}
      <h4 className="mb-2 text-sm font-medium">{title}</h4>

      {/* Barre de progression */}
      {progress !== undefined && (
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Progression</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-status-doing transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 🎨 Exemples Visuels d'Application

### **Tableau de Bord RH**

```tsx
<div className="grid grid-cols-4 gap-4">
  {/* Carte avec badge coloré */}
  <div className="modern-card rounded-lg p-4">
    <div className="mb-2 flex items-center justify-between">
      <span className="text-2xl font-bold">8</span>
      <div className="rounded-lg bg-badge-blue/10 p-2">
        <UsersIcon className="h-5 w-5 text-badge-blue" />
      </div>
    </div>
    <p className="text-sm text-muted-foreground">Total Employés</p>
  </div>

  {/* Carte avec badge vert */}
  <div className="modern-card rounded-lg p-4">
    <div className="mb-2 flex items-center justify-between">
      <span className="text-2xl font-bold">8</span>
      <div className="rounded-lg bg-badge-green/10 p-2">
        <CheckCircleIcon className="h-5 w-5 text-badge-green" />
      </div>
    </div>
    <p className="text-sm text-muted-foreground">CDI</p>
  </div>

  {/* Carte avec badge orange */}
  <div className="modern-card rounded-lg p-4">
    <div className="mb-2 flex items-center justify-between">
      <span className="text-2xl font-bold">0</span>
      <div className="rounded-lg bg-badge-orange/10 p-2">
        <ClockIcon className="h-5 w-5 text-badge-orange" />
      </div>
    </div>
    <p className="text-sm text-muted-foreground">Temporaires</p>
  </div>

  {/* Carte avec badge bleu clair */}
  <div className="modern-card rounded-lg p-4">
    <div className="mb-2 flex items-center justify-between">
      <span className="text-2xl font-bold">0</span>
      <div className="rounded-lg bg-badge-blue/10 p-2">
        <UserPlusIcon className="h-5 w-5 text-badge-blue" />
      </div>
    </div>
    <p className="text-sm text-muted-foreground">Nouveaux (3m)</p>
  </div>
</div>
```

### **Vue Kanban**

```tsx
<div className="flex gap-4">
  {/* Colonne À faire */}
  <div className="flex-1 rounded-lg bg-card p-4">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-status-todo"></div>
        <h3 className="font-semibold">À faire</h3>
        <span className="rounded-full bg-status-todo/20 px-2 py-0.5 text-xs">4</span>
      </div>
    </div>
    <div className="space-y-2">
      <TaskCard title="Sous-tâche de Backend API" priority="high" />
      <TaskCard title="Sous-tâche de Documentation" priority="low" />
    </div>
  </div>

  {/* Colonne En cours */}
  <div className="flex-1 rounded-lg bg-card p-4">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-status-doing"></div>
        <h3 className="font-semibold">En cours</h3>
        <span className="rounded-full bg-status-doing/20 px-2 py-0.5 text-xs">11</span>
      </div>
    </div>
    <div className="space-y-2">
      <TaskCard title="Design UI/UX" priority="high" progress={52} />
      <TaskCard title="Développement Frontend" priority="medium" progress={10} />
      <TaskCard title="Backend API" priority="high" progress={57} />
    </div>
  </div>

  {/* Colonne Terminé */}
  <div className="flex-1 rounded-lg bg-card p-4">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-status-done"></div>
        <h3 className="font-semibold">Terminé</h3>
        <span className="rounded-full bg-status-done/20 px-2 py-0.5 text-xs">1</span>
      </div>
    </div>
    <div className="space-y-2">
      <TaskCard title="Sous-tâche de test11" priority="medium" progress={100} />
    </div>
  </div>
</div>
```

### **Dashboard Analytics**

```tsx
<div className="space-y-6">
  {/* Métriques avec icônes colorées */}
  <div className="grid grid-cols-4 gap-4">
    <div className="modern-card rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-badge-blue/10 p-3">
          <TrendingUpIcon className="h-6 w-6 text-badge-blue" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Créées</p>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-badge-blue">Cette semaine</p>
        </div>
      </div>
    </div>

    <div className="modern-card rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-badge-green/10 p-3">
          <CheckCircleIcon className="h-6 w-6 text-badge-green" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Terminées</p>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-badge-green">Cette semaine</p>
        </div>
      </div>
    </div>

    <div className="modern-card rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-badge-red/10 p-3">
          <AlertCircleIcon className="h-6 w-6 text-badge-red" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">En retard</p>
          <p className="text-2xl font-bold">9</p>
          <p className="text-xs text-badge-red">Nécessitent action</p>
        </div>
      </div>
    </div>

    <div className="modern-card rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-badge-orange/10 p-3">
          <PercentIcon className="h-6 w-6 text-badge-orange" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Taux</p>
          <p className="text-2xl font-bold">0%</p>
          <p className="text-xs text-badge-orange">↘ Faible</p>
        </div>
      </div>
    </div>
  </div>

  {/* Performance par priorité */}
  <div className="modern-card rounded-lg p-6">
    <h3 className="mb-4 flex items-center gap-2 font-semibold">
      <BarChartIcon className="h-5 w-5" />
      Performance par Priorité
    </h3>
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex justify-between text-sm">
          <span className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-priority-high"></div>
            Haute
          </span>
          <span>0% (0/6)</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-priority-high" style={{ width: '0%' }}></div>
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-sm">
          <span className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-priority-medium"></div>
            Moyenne
          </span>
          <span>13% (1/8)</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-priority-medium" style={{ width: '13%' }}></div>
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-sm">
          <span className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-priority-low"></div>
            Basse
          </span>
          <span>0% (0/2)</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-priority-low" style={{ width: '0%' }}></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## ✅ Bonnes Pratiques

### **1. Contraste**

- Toujours utiliser `text-white` sur les backgrounds colorés foncés
- Utiliser l'opacity (`/10`, `/20`) pour les backgrounds légers avec texte coloré

### **2. Cohérence**

- Priorité = Couleurs vives (rouge, orange, vert)
- Statut = Couleurs variées selon l'état
- Labels/Tags = Backgrounds légers + texte coloré

### **3. Accessibilité**

- Ratio de contraste minimum : 4.5:1
- Toujours ajouter des icônes avec les couleurs pour les daltoniens

### **4. Dark Mode**

- Toutes les couleurs s'adaptent automatiquement
- Les couleurs sont plus lumineuses en mode sombre

---

## 🚀 Application sur Toute l'App

Les couleurs sont maintenant disponibles globalement via :

- **Tailwind** : `className="bg-status-doing"`
- **CSS Variables** : `var(--status-doing)`
- **HSL** : Toutes les couleurs en HSL pour facilité de customisation

**Prochaine étape** : Appliquer ces couleurs sur tous les composants existants (Kanban, Gantt, Tableaux, Dashboards).

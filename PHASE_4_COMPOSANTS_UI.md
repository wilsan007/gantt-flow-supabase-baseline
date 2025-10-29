# ✅ Phase 4 : Composants UI React - En Cours

## 🎯 Objectif

Créer une interface utilisateur complète pour gérer les **activités opérationnelles** (récurrentes + ponctuelles) et leurs **templates d'actions**.

---

## ✅ Hooks Enterprise Créés (Pattern Stripe/Linear)

### **1. useOperationalActivities** ✅
- **Cache intelligent** (TTL 3 min)
- **Filtres avancés** (kind, scope, isActive, search)
- **Métriques temps réel** (fetchTime, cacheHit, counts)
- **CRUD complet** (create, update, delete, toggleActive)
- **Statistiques** (getStatistics RPC)

### **2. useOperationalSchedules** ✅
- **CRUD planifications** (get, upsert, delete)
- **Support RRULE** (DAILY, WEEKLY, MONTHLY)
- **Gestion timezone** (Africa/Djibouti par défaut)

### **3. useOperationalActionTemplates** ✅
- **CRUD templates** (create, update, delete)
- **Réorganisation** (drag & drop avec reorderTemplates)
- **Positions automatiques**

---

## 🎨 Composants UI à Créer

### **Architecture Proposée**

```
src/components/operations/
├── OperationsPage.tsx              # Page principale (/operations)
├── ActivityList.tsx                # Liste des activités avec filtres
├── ActivityCard.tsx                # Carte d'une activité
├── ActivityForm.tsx                # Formulaire création/édition
├── ScheduleForm.tsx                # Formulaire RRULE
├── ActionTemplateList.tsx          # Liste templates (drag & drop)
├── ActivityDetailDialog.tsx        # Dialog détails complet
├── OccurrencesList.tsx             # Liste des tâches générées
└── ActivityStatisticsCard.tsx      # Statistiques visuelles
```

---

## 📋 Composant 1 : OperationsPage (Page Principale)

### **Fonctionnalités :**
- ✅ Liste des activités (récurrentes + ponctuelles)
- ✅ Filtres : Type (recurring/one_off), Scope, Statut (active/inactive), Recherche
- ✅ Bouton "Nouvelle Activité Récurrente"
- ✅ Bouton "Nouvelle Activité Ponctuelle"
- ✅ Métriques en header : Total, Actives, Récurrentes, Ponctuelles
- ✅ Vue grille (cards) ou liste (table)

### **Props :**
```tsx
interface OperationsPageProps {
  // Aucune prop (page standalone)
}
```

---

## 📋 Composant 2 : ActivityForm (Formulaire)

### **Fonctionnalités :**
- ✅ **Onglet 1 : Informations**
  - Nom, Description
  - Type (recurring / one_off)
  - Scope (org / department / team / person)
  - Owner (sélection utilisateur)
  - Projet (optionnel)
  - Template de titre (avec variables)

- ✅ **Onglet 2 : Planification** (si recurring)
  - Type : Quotidien / Hebdomadaire / Mensuel
  - Jours de la semaine (si hebdomadaire)
  - Jours du mois (si mensuel)
  - Date de début
  - Date de fin (optionnel)
  - Fenêtre de génération (30 jours par défaut)
  - Timezone

- ✅ **Onglet 3 : Actions Templates**
  - Liste drag & drop
  - Ajouter / Modifier / Supprimer
  - Position automatique

### **Props :**
```tsx
interface ActivityFormProps {
  activity?: OperationalActivity; // undefined = création
  onSave: (activity: OperationalActivity) => void;
  onCancel: () => void;
}
```

---

## 📋 Composant 3 : ScheduleForm (RRULE UI)

### **Fonctionnalités :**
- ✅ Sélection type : DAILY / WEEKLY / MONTHLY
- ✅ **Si WEEKLY :** Checkboxes jours (MO, TU, WE, TH, FR, SA, SU)
- ✅ **Si MONTHLY :** Input jours du mois (1, 15, etc.)
- ✅ Date picker début / fin
- ✅ Génération automatique RRULE string
- ✅ Preview des 5 prochaines occurrences

### **Props :**
```tsx
interface ScheduleFormProps {
  schedule?: OperationalSchedule;
  activityId: string;
  onChange: (schedule: Partial<OperationalSchedule>) => void;
}
```

---

## 📋 Composant 4 : ActionTemplateList (Drag & Drop)

### **Fonctionnalités :**
- ✅ Liste réordonnablepar drag & drop (@hello-pangea/dnd)
- ✅ Ajouter une action
- ✅ Modifier inline
- ✅ Supprimer avec confirmation
- ✅ Compteur : "3 actions"

### **Props :**
```tsx
interface ActionTemplateListProps {
  activityId: string;
  templates: OperationalActionTemplate[];
  onChange: (templates: OperationalActionTemplate[]) => void;
}
```

---

## 📋 Composant 5 : OccurrencesList (Tâches Générées)

### **Fonctionnalités :**
- ✅ Liste des tâches avec `activity_id = X`
- ✅ Filtres : Statut (todo/doing/done), Dates
- ✅ Lien vers la tâche (ouvre TaskDetailDialog)
- ✅ Badge "Opération" pour distinction visuelle
- ✅ Pagination (20 par page)

### **Props :**
```tsx
interface OccurrencesListProps {
  activityId: string;
  activityName: string;
}
```

---

## 📋 Composant 6 : ActivityStatisticsCard

### **Fonctionnalités :**
- ✅ Appel RPC `get_activity_statistics`
- ✅ Affichage :
  - Total occurrences générées
  - Tâches terminées / En cours / Bloquées
  - Taux de complétion (%)
  - Temps moyen de complétion
  - Prochaine occurrence
  - Dernière occurrence

### **Props :**
```tsx
interface ActivityStatisticsCardProps {
  activityId: string;
}
```

---

## 🎨 Design System (shadcn/ui + Tailwind)

### **Composants shadcn à utiliser :**
- ✅ Card, CardHeader, CardContent
- ✅ Button (primary, secondary, ghost, destructive)
- ✅ Dialog, DialogContent, DialogHeader
- ✅ Form, FormField, FormControl, FormLabel
- ✅ Input, Textarea, Select
- ✅ Tabs, TabsList, TabsContent
- ✅ Badge (pour statuts)
- ✅ Calendar (date picker)
- ✅ Checkbox (jours de la semaine)
- ✅ Switch (actif/inactif)
- ✅ DropdownMenu (actions)

### **Icônes Lucide :**
- ✅ CalendarClock (récurrent)
- ✅ CalendarDays (ponctuel)
- ✅ Plus, Edit, Trash2, Copy
- ✅ Play, Pause (activer/désactiver)
- ✅ CheckSquare (actions)
- ✅ BarChart3 (statistiques)

---

## 🚀 Ordre de Création Recommandé

### **Priorité 1 : Fonctionnalités Core (4-6h)**
1. ✅ OperationsPage.tsx
2. ✅ ActivityCard.tsx
3. ✅ ActivityForm.tsx (onglet 1 : Informations)

### **Priorité 2 : Planification (2-3h)**
4. ✅ ScheduleForm.tsx (RRULE UI)
5. ✅ ActivityForm.tsx (onglet 2 : Planification)

### **Priorité 3 : Actions Templates (2-3h)**
6. ✅ ActionTemplateList.tsx (drag & drop)
7. ✅ ActivityForm.tsx (onglet 3 : Actions)

### **Priorité 4 : Visualisation (2-3h)**
8. ✅ OccurrencesList.tsx
9. ✅ ActivityStatisticsCard.tsx
10. ✅ ActivityDetailDialog.tsx (dialog complet)

---

## 📱 Routing (React Router)

### **Routes à ajouter :**
```tsx
// src/App.tsx ou router config
<Route path="/operations" element={<OperationsPage />} />
<Route path="/operations/:id" element={<ActivityDetailPage />} />
```

### **Navigation dans la sidebar :**
```tsx
{
  title: "Opérations",
  icon: CalendarClock,
  href: "/operations",
  badge: activeCount // nombre d'activités actives
}
```

---

## ✅ État Actuel (Phase 4)

```
✅ Hooks Enterprise créés (3/3)
⏳ Composants UI (0/10)

Prochaine étape :
Créer OperationsPage.tsx + ActivityCard.tsx
```

---

**Voulez-vous que je commence par créer :**
- **A)** OperationsPage.tsx (page principale)
- **B)** ActivityForm.tsx (formulaire complet 3 onglets)
- **C)** Les deux en parallèle

Quelle option ? 🚀

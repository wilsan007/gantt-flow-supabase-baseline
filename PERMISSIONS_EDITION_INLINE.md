# 🔒 Système de Permissions - Édition Inline

## 📋 Vue d'Ensemble

Ce système implémente des permissions restrictives basées sur les best practices de Monday.com, Asana et ClickUp pour sécuriser l'édition inline des tâches.

---

## 🎯 Matrice de Permissions

### Par Rôle et Action

| Rôle                | Créer Tâche    | Modifier Titre | Modifier Dates | Modifier Priorité | Modifier Statut | Supprimer      |
| ------------------- | -------------- | -------------- | -------------- | ----------------- | --------------- | -------------- |
| **Super Admin**     | ✅ Tout        | ✅ Tout        | ✅ Tout        | ✅ Tout           | ✅ Tout         | ✅ Tout        |
| **Tenant Owner**    | ✅ Tout        | ✅ Tout        | ✅ Tout        | ✅ Tout           | ✅ Tout         | ✅ Tout        |
| **Admin**           | ✅ Tout        | ✅ Tout        | ✅ Tout        | ✅ Tout           | ✅ Tout         | ✅ Tout        |
| **Project Manager** | ✅ Ses projets | ✅ Ses projets | ✅ Ses projets | ✅ Ses projets    | ✅ Ses projets  | ✅ Ses projets |
| **Team Lead**       | ✅ Son équipe  | ✅ Son équipe  | ✅ Son équipe  | ❌ Non            | ✅ Son équipe   | ❌ Non         |
| **Employee**        | ✅ Nouvelles   | ✅ Ses tâches  | ❌ Non         | ❌ Non            | ✅ Si assigné   | ❌ Non         |
| **Collaborator**    | ✅ Nouvelles   | ✅ Ses tâches  | ❌ Non         | ❌ Non            | ✅ Si assigné   | ❌ Non         |
| **Viewer/Intern**   | ❌ Non         | ❌ Non         | ❌ Non         | ❌ Non            | ❌ Non          | ❌ Non         |

### Règles Spéciales

✅ **Créateur** : Peut toujours modifier sa propre tâche (même si rôle limité)  
✅ **Assignee** : Peut changer le statut et la progression de la tâche assignée  
❌ **Dates** : Modifiables uniquement par PM+ ou créateur (prévention incohérences)  
❌ **Priorité** : Modifiable uniquement par PM+ (décision stratégique)

---

## 🏗️ Architecture

### Fichiers Créés

```
src/
├── hooks/
│   └── useTaskEditPermissions.ts      # Hook de gestion des permissions
├── components/
│   └── permissions/
│       └── PermissionGate.tsx          # Composant de protection UI
└── components/vues/table/cells/
    ├── EditableTitleCell.tsx           # Titre avec permissions
    ├── EditableCellWithDebounce.tsx    # Texte/nombre avec permissions
    ├── EditableDateCell.tsx            # Dates avec permissions
    └── EditableSelectCell.tsx          # Sélecteurs avec permissions
```

### Flow de Permissions

```
┌──────────────────────────────────────────┐
│   User clique sur cellule éditable      │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│   useTaskEditPermissions({ task })       │
│   ├─ Récupère rôle utilisateur          │
│   ├─ Vérifie si créateur/assignee       │
│   └─ Calcule permissions par champ      │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│   permissions.canEditTitle?              │
│   ├─ OUI → Cellule éditable              │
│   └─ NON → Cellule en lecture seule     │
└──────────────────────────────────────────┘
```

---

## 🛠️ Utilisation

### Hook useTaskEditPermissions

```typescript
import { useTaskEditPermissions } from '@/hooks/useTaskEditPermissions';

function TaskRow({ task }) {
  const permissions = useTaskEditPermissions({ task });

  return (
    <>
      {/* Titre */}
      <EditableTitleCell
        value={task.title}
        onChange={(value) => updateTask(task.id, { title: value })}
        readOnly={!permissions.canEditTitle}  // 🔒
      />

      {/* Dates */}
      <EditableDateCell
        value={task.due_date}
        onChange={(value) => updateTask(task.id, { due_date: value })}
        readOnly={!permissions.canEditDates}  // 🔒
      />

      {/* Priorité */}
      <EditableSelectCell
        value={task.priority}
        onChange={(value) => updateTask(task.id, { priority: value })}
        readOnly={!permissions.canEditPriority}  // 🔒
      />
    </>
  );
}
```

### Composant PermissionGate

```typescript
import { PermissionGate } from '@/components/permissions/PermissionGate';

function Example() {
  const permissions = useTaskEditPermissions({ task });

  return (
    <PermissionGate
      hasPermission={permissions.canDelete}
      mode="lock"  // 'hide' | 'disable' | 'lock'
      deniedMessage="Seuls les administrateurs peuvent supprimer"
    >
      <Button onClick={handleDelete}>Supprimer</Button>
    </PermissionGate>
  );
}
```

### Modes de PermissionGate

**1. Mode `hide`** (défaut) - Style Monday.com

```typescript
// Si pas de permission → n'affiche rien
<PermissionGate hasPermission={false} mode="hide">
  <Button>Éditer</Button>  // Ne sera pas rendu
</PermissionGate>
```

**2. Mode `disable`** - Style Linear

```typescript
// Si pas de permission → affiche grisé avec tooltip
<PermissionGate hasPermission={false} mode="disable">
  <Button>Éditer</Button>  // Rendu grisé et non cliquable
</PermissionGate>
```

**3. Mode `lock`** - Style Asana

```typescript
// Si pas de permission → affiche icône cadenas
<PermissionGate hasPermission={false} mode="lock">
  <Button>Éditer</Button>  // Remplacé par icône 🔒
</PermissionGate>
```

---

## 🎨 Indicateurs Visuels

### Cellule Éditable (Permission Accordée)

```
┌─────────────────────────────────────┐
│ Nom de la tâche... [hover: gris]   │ ← Hover gris
└─────────────────────────────────────┘
```

### Cellule Non Éditable (Permission Refusée)

```
┌─────────────────────────────────────┐
│ Nom de la tâche... [opacity: 60%]  │ ← Opacité réduite
│ Cursor: not-allowed                 │ ← Curseur interdit
│ Title: "Modification non autorisée" │ ← Tooltip
└─────────────────────────────────────┘
```

### État de Sauvegarde

```
Édition    → Icône rien
Saving...  → 🔄 Animation de rotation
Saved ✓    → ✅ Vert pendant 2s
Error      → ❌ Rouge avec message
```

---

## 🔧 Configuration

### Ajouter une Permission Personnalisée

**1. Modifier le hook `useTaskEditPermissions`**

```typescript
export interface TaskEditPermissions {
  // ... permissions existantes
  canEditCustomField: boolean;  // Nouvelle permission
}

// Dans useEffect
if (userRole === 'custom_role') {
  setPermissions({
    ...
    canEditCustomField: true,  // Logique personnalisée
  });
}
```

**2. Utiliser dans le composant**

```typescript
<EditableCell
  value={task.customField}
  onChange={handleChange}
  readOnly={!permissions.canEditCustomField}
/>
```

### Modifier les Règles de Rôles

**Fichier : `src/hooks/useTaskEditPermissions.ts`**

```typescript
// Modifier les règles existantes
if (userRole === 'employee') {
  setPermissions({
    ...
    canEditDates: isCreator,  // Autoriser employé à éditer dates si créateur
  });
}
```

---

## 🧪 Tests

### Test des Permissions par Rôle

```typescript
// Test automatisé
import { renderHook } from '@testing-library/react-hooks';
import { useTaskEditPermissions } from '@/hooks/useTaskEditPermissions';

test('Super Admin peut tout éditer', () => {
  const { result } = renderHook(() =>
    useTaskEditPermissions({
      task: mockTask,
      userRole: 'super_admin',
    })
  );

  expect(result.current.canEditTitle).toBe(true);
  expect(result.current.canEditDates).toBe(true);
  expect(result.current.canDelete).toBe(true);
});

test('Employee ne peut éditer que ses tâches', () => {
  const { result } = renderHook(() =>
    useTaskEditPermissions({
      task: { ...mockTask, created_by: 'autre_user' },
      userRole: 'employee',
    })
  );

  expect(result.current.canEditTitle).toBe(false);
  expect(result.current.canView).toBe(false);
});
```

### Test Manuel

**1. Connexion avec différents rôles**

```
Super Admin   → Peut tout éditer
Tenant Owner  → Peut tout éditer dans son tenant
Project Manager → Peut éditer ses projets uniquement
Employee      → Peut éditer seulement ses tâches créées
Viewer        → Aucune édition possible
```

**2. Scénarios à Tester**

- ✅ Créateur peut modifier titre de sa tâche
- ✅ Assignee peut changer statut mais pas titre
- ✅ PM peut changer priorité, Employee non
- ✅ Viewer voit cellules en lecture seule
- ✅ Tooltip explicatif s'affiche au survol

---

## 📊 Métriques & Monitoring

### Console Logs (Mode Dev)

```typescript
// Les permissions sont loggées automatiquement
🔒 Permissions calculées pour tâche:
   - Rôle: employee
   - Peut éditer: false
   - Raison: Tâche non assignée à vous
```

### Audit Trail (À Implémenter)

```typescript
// Log chaque modification avec permissions
{
  userId: "123",
  action: "edit_task_title",
  taskId: "456",
  permission: "canEditTitle",
  granted: true,
  timestamp: "2025-11-13T15:00:00Z"
}
```

---

## 🚀 Améliorations Futures

### Phase 2

- [ ] Permissions par projet (isolation stricte)
- [ ] Permissions temporelles (ex: bloquer après deadline)
- [ ] Permissions par champ personnalisé
- [ ] Audit log complet avec historique
- [ ] Notifications de refus de permission

### Phase 3

- [ ] Système de délégation de permissions
- [ ] Permissions granulaires par département
- [ ] Permissions conditionnelles (ex: si tâche en cours)
- [ ] Interface de gestion des permissions (UI)
- [ ] Export des logs de permissions

---

## 📚 Ressources

### Best Practices Suivies

- **Monday.com** : Permissions par rôle + édition inline
- **Asana** : Séparation créateur/assignee/viewer
- **ClickUp** : Permissions granulaires par champ
- **Linear** : Indicateurs visuels clairs

### Documentation Technique

- [React Hooks for Permissions](https://react.dev/reference/react/useEffect)
- [TypeScript Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ⚠️ Sécurité

### ⚠️ Règles Importantes

1. **Double Validation** : Toujours valider côté backend
2. **Pas de Secrets Frontend** : Permissions = UI only
3. **RLS Supabase** : Implémenter Row Level Security
4. **Audit Trail** : Logger toutes les tentatives

### Backend Validation Required

```typescript
// ❌ MAUVAIS : Seulement côté frontend
if (permissions.canEdit) {
  await updateTask(id, data);
}

// ✅ BON : Frontend + Backend
if (permissions.canEdit) {
  await updateTask(id, data); // Backend vérifie aussi
}
```

### Supabase RLS Policy Example

```sql
-- Politique RLS pour les tâches
CREATE POLICY "Users can only edit their own tasks or if admin"
ON tasks FOR UPDATE
USING (
  auth.uid() = created_by
  OR
  auth.uid() IN (
    SELECT user_id FROM user_roles
    WHERE role IN ('admin', 'tenant_owner')
  )
);
```

---

## 📞 Support

- **Questions** : Voir documentation dans `/docs/permissions`
- **Bugs** : Ouvrir une issue avec label `permissions`
- **Feature Requests** : Proposer via `/docs/roadmap.md`

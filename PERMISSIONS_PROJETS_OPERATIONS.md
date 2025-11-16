# 🔒 Système de Permissions - Projets & Tâches Opérationnelles

## 📋 Vue d'Ensemble

Extension du système de permissions pour couvrir :

- **Projets** : Gestion de portefeuille de projets
- **Tâches Opérationnelles** : Activités quotidiennes et récurrentes

---

## 📁 1. PERMISSIONS PROJETS

### Matrice de Permissions

| Rôle                | Créer Projet | Modifier Nom   | Modifier Budget | Modifier Dates | Supprimer      | Archiver       |
| ------------------- | ------------ | -------------- | --------------- | -------------- | -------------- | -------------- |
| **Super Admin**     | ✅ Tout      | ✅ Tout        | ✅ Tout         | ✅ Tout        | ✅ Tout        | ✅ Tout        |
| **Tenant Owner**    | ✅ Tout      | ✅ Tout        | ✅ Tout         | ✅ Tout        | ✅ Tout        | ✅ Tout        |
| **Admin**           | ✅ Tout      | ✅ Tout        | ✅ Tout         | ✅ Tout        | ✅ Tout        | ✅ Tout        |
| **Project Manager** | ✅ Oui       | ✅ Ses projets | ✅ Ses projets  | ✅ Ses projets | ✅ Ses projets | ✅ Ses projets |
| **Team Lead**       | ❌ Non       | ❌ Non         | ❌ Non          | ❌ Non         | ❌ Non         | ❌ Non         |
| **Employee**        | ❌ Non       | ❌ Non         | ❌ Non          | ❌ Non         | ❌ Non         | ❌ Non         |
| **Viewer**          | ❌ Non       | ❌ Non         | ❌ Non          | ❌ Non         | ❌ Non         | ❌ Non         |

### Règles Spéciales

#### Chef de Projet (Manager)

```typescript
const isManager = project.manager_id === user.id;
if (isManager) {
  // Peut tout modifier SAUF changer le chef de projet
  canEdit: true,
  canEditManager: false, // Seul admin peut changer le manager
}
```

#### Créateur du Projet

```typescript
const isCreator = project.created_by === user.id;
if (isCreator && userRole === 'project_manager') {
  // Peut gérer son projet même si pas assigné comme manager
  canEdit: true,
}
```

#### Budget et Dates Critiques

```typescript
// Seuls PM+ peuvent modifier budget et dates
if (userRole in ['employee', 'team_lead']) {
  canEditBudget: false,
  canEditDates: false,
}
```

### Utilisation

```typescript
import { useProjectEditPermissions } from '@/hooks/useProjectEditPermissions';

function ProjectCard({ project }) {
  const permissions = useProjectEditPermissions({ project });

  return (
    <div>
      {/* Nom du projet */}
      {permissions.canEditName ? (
        <EditableInput
          value={project.name}
          onChange={(value) => updateProject(project.id, { name: value })}
        />
      ) : (
        <span className="opacity-60">{project.name}</span>
      )}

      {/* Budget */}
      {permissions.canEditBudget ? (
        <EditableNumber
          value={project.budget}
          onChange={(value) => updateProject(project.id, { budget: value })}
        />
      ) : (
        <span className="opacity-60">{project.budget} €</span>
      )}

      {/* Actions */}
      {permissions.canArchive && (
        <Button onClick={() => archiveProject(project.id)}>
          Archiver
        </Button>
      )}
    </div>
  );
}
```

---

## ⚙️ 2. PERMISSIONS TÂCHES OPÉRATIONNELLES

### Matrice de Permissions

| Rôle                | Créer Tâche | Modifier Titre | Modifier Priorité | Modifier Statut | Supprimer     | Assigner      |
| ------------------- | ----------- | -------------- | ----------------- | --------------- | ------------- | ------------- |
| **Super Admin**     | ✅ Tout     | ✅ Tout        | ✅ Tout           | ✅ Tout         | ✅ Tout       | ✅ Tout       |
| **Tenant Owner**    | ✅ Tout     | ✅ Tout        | ✅ Tout           | ✅ Tout         | ✅ Tout       | ✅ Tout       |
| **Admin**           | ✅ Tout     | ✅ Tout        | ✅ Tout           | ✅ Tout         | ✅ Tout       | ✅ Tout       |
| **Project Manager** | ✅ Oui      | ✅ Son dépt    | ✅ Son dépt       | ✅ Son dépt     | ✅ Son dépt   | ✅ Son dépt   |
| **Team Lead**       | ✅ Oui      | ✅ Son équipe  | ✅ Son équipe     | ✅ Son équipe   | ✅ Son équipe | ✅ Son équipe |
| **Employee**        | ✅ Oui      | ✅ Ses tâches  | ❌ Non            | ✅ Si assigné   | ✅ Siennes    | ❌ Non        |
| **Viewer**          | ❌ Non      | ❌ Non         | ❌ Non            | ❌ Non          | ❌ Non        | ❌ Non        |

### Différences avec Tâches Projets

#### Plus de Flexibilité

```typescript
// Tâches Opérationnelles sont plus flexibles
if (taskType === 'operational') {
  // Employee peut supprimer ses propres tâches
  canDelete: isCreator,

  // Employee peut modifier dates (moins critique)
  canEditDates: isCreator,

  // Team Lead peut modifier priorité
  canEditPriority: userRole >= 'team_lead',
}
```

#### Focus Département/Équipe

```typescript
// Filtrage par département plutôt que projet
const sameDepartment = task.department === user.department;
if (userRole === 'project_manager' && sameDepartment) {
  canEdit: true,
}

// Team Lead gère son équipe
const isTeamTask = task.team_id === user.team_id;
if (userRole === 'team_lead' && isTeamTask) {
  canEdit: true,
  canDelete: true,
}
```

#### Récurrence et Catégories

```typescript
// Champs spécifiques aux tâches opérationnelles
canEditRecurrence: isCreator || isTeamLead || isManager,
canEditCategory: isCreator || isTeamLead || isManager,
```

### Utilisation

```typescript
import { useOperationalTaskPermissions } from '@/hooks/useOperationalTaskPermissions';

function OperationalTaskRow({ task }) {
  const permissions = useOperationalTaskPermissions({ task });

  return (
    <tr>
      {/* Titre */}
      <td>
        {permissions.canEditTitle ? (
          <EditableInput
            value={task.title}
            onChange={(value) => updateTask(task.id, { title: value })}
          />
        ) : (
          <span className="opacity-60">{task.title}</span>
        )}
      </td>

      {/* Statut - Assignee peut modifier */}
      <td>
        {permissions.canEditStatus ? (
          <StatusSelect
            value={task.status}
            onChange={(value) => updateTask(task.id, { status: value })}
          />
        ) : (
          <Badge>{task.status}</Badge>
        )}
      </td>

      {/* Priorité - Seulement TL+ */}
      <td>
        {permissions.canEditPriority ? (
          <PrioritySelect
            value={task.priority}
            onChange={(value) => updateTask(task.id, { priority: value })}
          />
        ) : (
          <Badge>{task.priority}</Badge>
        )}
      </td>

      {/* Actions */}
      <td>
        {permissions.canDelete && (
          <Button variant="destructive" size="sm" onClick={() => deleteTask(task.id)}>
            Supprimer
          </Button>
        )}
      </td>
    </tr>
  );
}
```

---

## 🔄 3. COMPARAISON DES 3 SYSTÈMES

### Tableau Comparatif

| Aspect                    | Tâches Projets  | Projets               | Tâches Opérationnelles    |
| ------------------------- | --------------- | --------------------- | ------------------------- |
| **Création**              | PM+ ou assigné  | PM+ uniquement        | Employee+ (plus flexible) |
| **Modification dates**    | PM+ ou créateur | PM+ ou manager        | Créateur (flexible)       |
| **Modification priorité** | PM+ uniquement  | PM+ ou manager        | TL+ (Team Lead+)          |
| **Suppression**           | PM+ uniquement  | PM+ ou manager        | Créateur (Employee OK)    |
| **Focus**                 | Projet          | Portfolio             | Département/Équipe        |
| **Rigidité**              | ⭐⭐⭐ Stricte  | ⭐⭐⭐⭐ Très stricte | ⭐⭐ Flexible             |

### Hiérarchie des Permissions

```
┌─────────────────────────────────────────┐
│         SUPER ADMIN / OWNER             │ → Accès total partout
├─────────────────────────────────────────┤
│              ADMIN                       │ → Accès total tenant
├─────────────────────────────────────────┤
│         PROJECT MANAGER                  │ → Gestion projets + département
├─────────────────────────────────────────┤
│           TEAM LEAD                      │ → Gestion équipe (flexible sur ops)
├─────────────────────────────────────────┤
│          EMPLOYEE                        │ → Tâches assignées + ops personnelles
├─────────────────────────────────────────┤
│           VIEWER                         │ → Lecture seule
└─────────────────────────────────────────┘
```

---

## 🛠️ 4. EXEMPLES D'INTÉGRATION

### Composant Projet avec Permissions

```typescript
import { useProjectEditPermissions } from '@/hooks/useProjectEditPermissions';
import { EditableWithPermission } from '@/components/permissions/PermissionGate';

function ProjectDetailsPanel({ project }) {
  const permissions = useProjectEditPermissions({ project });

  return (
    <div className="space-y-4">
      {/* Nom du projet */}
      <div>
        <label>Nom du projet</label>
        <EditableWithPermission
          canEdit={permissions.canEditName}
          readOnlyValue={<span>{project.name}</span>}
          deniedMessage="Seuls les chefs de projet peuvent modifier le nom"
        >
          <Input
            value={project.name}
            onChange={(e) => updateProject(project.id, { name: e.target.value })}
          />
        </EditableWithPermission>
      </div>

      {/* Budget */}
      <div>
        <label>Budget</label>
        <EditableWithPermission
          canEdit={permissions.canEditBudget}
          readOnlyValue={<span>{project.budget} €</span>}
          deniedMessage="Seuls les chefs de projet peuvent modifier le budget"
        >
          <Input
            type="number"
            value={project.budget}
            onChange={(e) => updateProject(project.id, { budget: e.target.value })}
          />
        </EditableWithPermission>
      </div>

      {/* Dates */}
      <div>
        <label>Date de début</label>
        <EditableWithPermission
          canEdit={permissions.canEditDates}
          readOnlyValue={<span>{formatDate(project.start_date)}</span>}
          deniedMessage="Seuls les chefs de projet peuvent modifier les dates"
        >
          <DatePicker
            value={project.start_date}
            onChange={(date) => updateProject(project.id, { start_date: date })}
          />
        </EditableWithPermission>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {permissions.canArchive && (
          <Button onClick={() => archiveProject(project.id)}>
            Archiver
          </Button>
        )}

        {permissions.canDelete && (
          <Button variant="destructive" onClick={() => deleteProject(project.id)}>
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}
```

### Composant Tâche Opérationnelle avec Permissions

```typescript
import { useOperationalTaskPermissions } from '@/hooks/useOperationalTaskPermissions';

function OperationalTaskCard({ task }) {
  const permissions = useOperationalTaskPermissions({ task });

  if (!permissions.canView) {
    return null; // Masquer si pas de permission de vue
  }

  return (
    <Card>
      <CardHeader>
        {/* Titre */}
        {permissions.canEditTitle ? (
          <EditableInput
            value={task.title}
            onChange={(value) => updateTask(task.id, { title: value })}
            debounce={800}
          />
        ) : (
          <h3 className="opacity-60">{task.title}</h3>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Description */}
        {permissions.canEditDescription ? (
          <EditableTextarea
            value={task.description}
            onChange={(value) => updateTask(task.id, { description: value })}
          />
        ) : (
          <p className="opacity-60">{task.description}</p>
        )}

        {/* Statut - Modifiable par assignee */}
        <div className="flex items-center gap-2">
          <label>Statut:</label>
          {permissions.canEditStatus ? (
            <StatusSelect
              value={task.status}
              onChange={(value) => updateTask(task.id, { status: value })}
            />
          ) : (
            <Badge>{task.status}</Badge>
          )}
        </div>

        {/* Priorité - Seulement TL+ */}
        <div className="flex items-center gap-2">
          <label>Priorité:</label>
          {permissions.canEditPriority ? (
            <PrioritySelect
              value={task.priority}
              onChange={(value) => updateTask(task.id, { priority: value })}
            />
          ) : (
            <Badge variant={getPriorityVariant(task.priority)}>
              {task.priority}
            </Badge>
          )}
        </div>

        {/* Récurrence */}
        {permissions.canEditRecurrence ? (
          <RecurrenceEditor
            value={task.recurrence}
            onChange={(value) => updateTask(task.id, { recurrence: value })}
          />
        ) : (
          task.recurrence && <span>🔄 {task.recurrence}</span>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {/* Commentaires - Tout le monde peut commenter sur ses tâches */}
        {permissions.canComment && (
          <Button variant="ghost" size="sm">
            💬 Commenter
          </Button>
        )}

        {/* Supprimer - Créateur uniquement */}
        {permissions.canDelete && (
          <Button variant="destructive" size="sm" onClick={() => deleteTask(task.id)}>
            Supprimer
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

---

## 🔐 5. SÉCURITÉ BACKEND (RLS)

### Policies Supabase pour Projets

```sql
-- Lecture des projets
CREATE POLICY "Users can view projects based on role"
ON projects FOR SELECT
USING (
  -- Super Admin voit tout
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'super_admin')
  OR
  -- Tenant users voient projets de leur tenant
  tenant_id = (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
  OR
  -- Manager du projet
  manager_id = auth.uid()
  OR
  -- Membres du projet
  id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);

-- Modification des projets
CREATE POLICY "Only PM+ can edit projects"
ON projects FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles
    WHERE role IN ('super_admin', 'tenant_owner', 'admin', 'project_manager')
  )
  AND (
    manager_id = auth.uid() OR created_by = auth.uid()
  )
);

-- Suppression des projets
CREATE POLICY "Only Admin+ can delete projects"
ON projects FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles
    WHERE role IN ('super_admin', 'tenant_owner', 'admin')
  )
  OR
  (
    manager_id = auth.uid()
    AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'project_manager')
  )
);
```

### Policies Supabase pour Tâches Opérationnelles

```sql
-- Lecture des tâches opérationnelles
CREATE POLICY "Users can view operational tasks based on role"
ON operational_tasks FOR SELECT
USING (
  -- Super Admin / Admin voient tout
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'admin'))
  OR
  -- PM voit département
  (
    department = (SELECT department FROM profiles WHERE user_id = auth.uid())
    AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'project_manager')
  )
  OR
  -- Team Lead voit équipe
  (
    team_id = (SELECT team_id FROM profiles WHERE user_id = auth.uid())
    AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'team_lead')
  )
  OR
  -- Créateur ou assignee
  created_by = auth.uid() OR assigned_to = auth.uid()
);

-- Modification des tâches opérationnelles (plus flexible)
CREATE POLICY "Users can edit their operational tasks"
ON operational_tasks FOR UPDATE
USING (
  -- Admin+ peut tout
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'admin'))
  OR
  -- PM peut modifier département
  (
    department = (SELECT department FROM profiles WHERE user_id = auth.uid())
    AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'project_manager')
  )
  OR
  -- Team Lead peut modifier équipe
  (
    team_id = (SELECT team_id FROM profiles WHERE user_id = auth.uid())
    AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'team_lead')
  )
  OR
  -- Créateur peut modifier
  created_by = auth.uid()
  OR
  -- Assignee peut modifier statut (vérification côté application)
  assigned_to = auth.uid()
);

-- Suppression (Employee peut supprimer ses propres tâches)
CREATE POLICY "Users can delete their operational tasks"
ON operational_tasks FOR DELETE
USING (
  -- Admin+ peut tout
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'admin'))
  OR
  -- Créateur peut supprimer
  created_by = auth.uid()
  OR
  -- PM/TL peuvent supprimer dans leur scope
  (
    department = (SELECT department FROM profiles WHERE user_id = auth.uid())
    AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('project_manager', 'team_lead'))
  )
);
```

---

## 📊 6. MONITORING ET AUDIT

### Événements à Logger

```typescript
// Log des actions sur projets
{
  eventType: 'project.updated',
  projectId: '123',
  userId: '456',
  userRole: 'project_manager',
  field: 'budget',
  oldValue: 50000,
  newValue: 75000,
  permission: 'canEditBudget',
  granted: true,
  timestamp: '2025-11-13T18:00:00Z'
}

// Log des actions sur tâches opérationnelles
{
  eventType: 'operational_task.status_changed',
  taskId: '789',
  userId: '456',
  userRole: 'employee',
  field: 'status',
  oldValue: 'todo',
  newValue: 'done',
  permission: 'canEditStatus',
  granted: true,
  isAssignee: true,
  timestamp: '2025-11-13T18:05:00Z'
}
```

---

## 🚀 7. DÉPLOIEMENT

### Checklist

- [ ] Hooks de permissions créés
- [ ] Composants UI mis à jour avec permissions
- [ ] RLS Policies Supabase déployées
- [ ] Tests unitaires pour chaque rôle
- [ ] Tests d'intégration E2E
- [ ] Documentation utilisateur
- [ ] Formation des Project Managers
- [ ] Monitoring et alertes configurés

### Migration

```sql
-- Migration pour ajouter champs nécessaires
ALTER TABLE projects ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id);
ALTER TABLE operational_tasks ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE operational_tasks ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE operational_tasks ADD COLUMN IF NOT EXISTS recurrence VARCHAR(50);

-- Index pour performance
CREATE INDEX idx_projects_manager ON projects(manager_id);
CREATE INDEX idx_ops_tasks_department ON operational_tasks(department);
CREATE INDEX idx_ops_tasks_team ON operational_tasks(team_id);
```

---

## 📞 Support

- **Documentation** : `/docs/permissions-projets-operations`
- **Issues** : Label `permissions-projects` ou `permissions-operations`
- **Questions** : Slack #help-permissions

# 📋 Contextes dans user_roles - Guide Complet

## 🎯 Vue d'Ensemble

La table `user_roles` utilise deux colonnes pour définir la **portée** d'un rôle :
- `context_type` : Type de contexte (`'global'`, `'project'`, `'department'`)
- `context_id` : ID de l'entité concernée (UUID ou NULL)

---

## 📊 Les 3 Types de Contextes

### **1. Context Type: `'global'`**

**Définition** : Rôle qui s'applique à **tout le tenant**

```sql
context_type = 'global'
context_id = NULL  -- Toujours NULL pour global
```

**Tables concernées** : Aucune (pas de référence externe)

**Exemples** :
```sql
-- Tenant Admin (accès à tout)
INSERT INTO user_roles (user_id, role_id, context_type, context_id, tenant_id)
VALUES ('alice-123', 'role-tenant-admin', 'global', NULL, 'tenant-456');

-- Super Admin (accès système)
INSERT INTO user_roles (user_id, role_id, context_type, context_id, tenant_id)
VALUES ('admin-001', 'role-super-admin', 'global', NULL, NULL);

-- HR Manager (gère tous les employés du tenant)
INSERT INTO user_roles (user_id, role_id, context_type, context_id, tenant_id)
VALUES ('bob-456', 'role-hr-manager', 'global', NULL, 'tenant-456');
```

**Permissions** : L'utilisateur a accès à **toutes les ressources** du tenant

---

### **2. Context Type: `'project'`**

**Définition** : Rôle limité à **un projet spécifique**

```sql
context_type = 'project'
context_id = '<project_id>'  -- UUID du projet
```

**Table de référence** : `public.projects`

```sql
CREATE TABLE public.projects (
  id UUID PRIMARY KEY,              -- ← context_id pointe ici
  name TEXT NOT NULL,
  description TEXT,
  department_id UUID,
  manager_id UUID,
  start_date DATE,
  end_date DATE,
  budget NUMERIC(10,2),
  status TEXT DEFAULT 'planning',
  priority TEXT DEFAULT 'medium',
  tenant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Exemples** :
```sql
-- Alice est Project Manager du projet "Website Redesign"
INSERT INTO user_roles (user_id, role_id, context_type, context_id, tenant_id)
VALUES (
  'alice-123',
  'role-project-manager',
  'project',
  'proj-website-001',  -- ← ID du projet dans la table projects
  'tenant-456'
);

-- Bob est Team Member du projet "Mobile App"
INSERT INTO user_roles (user_id, role_id, context_type, context_id, tenant_id)
VALUES (
  'bob-456',
  'role-team-member',
  'project',
  'proj-mobile-002',  -- ← ID d'un autre projet
  'tenant-456'
);

-- Alice peut être manager de PLUSIEURS projets
INSERT INTO user_roles (user_id, role_id, context_type, context_id, tenant_id)
VALUES (
  'alice-123',
  'role-project-manager',
  'project',
  'proj-mobile-002',  -- ← Deuxième projet
  'tenant-456'
);
```

**Permissions** : L'utilisateur a accès **uniquement** aux ressources de ce projet :
- Tâches du projet
- Documents du projet
- Membres de l'équipe du projet
- Budget du projet

**Requête pour lister les projets d'un utilisateur** :
```sql
SELECT p.id, p.name, r.name as role_name
FROM user_roles ur
JOIN projects p ON p.id = ur.context_id
JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = 'alice-123'
  AND ur.context_type = 'project'
  AND ur.tenant_id = 'tenant-456';
```

---

### **3. Context Type: `'department'`**

**Définition** : Rôle limité à **un département spécifique**

```sql
context_type = 'department'
context_id = '<department_id>'  -- UUID du département
```

**Table de référence** : `public.departments`

```sql
CREATE TABLE public.departments (
  id UUID PRIMARY KEY,              -- ← context_id pointe ici
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID,
  budget NUMERIC(10,2),
  tenant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Exemples** :
```sql
-- Charlie est Department Manager du département IT
INSERT INTO user_roles (user_id, role_id, context_type, context_id, tenant_id)
VALUES (
  'charlie-789',
  'role-department-manager',
  'department',
  'dept-it-001',  -- ← ID du département dans la table departments
  'tenant-456'
);

-- Diana est HR Specialist pour le département Sales
INSERT INTO user_roles (user_id, role_id, context_type, context_id, tenant_id)
VALUES (
  'diana-012',
  'role-hr-specialist',
  'department',
  'dept-sales-002',  -- ← ID d'un autre département
  'tenant-456'
);

-- Charlie peut gérer PLUSIEURS départements
INSERT INTO user_roles (user_id, role_id, context_type, context_id, tenant_id)
VALUES (
  'charlie-789',
  'role-department-manager',
  'department',
  'dept-engineering-003',  -- ← Deuxième département
  'tenant-456'
);
```

**Permissions** : L'utilisateur a accès **uniquement** aux ressources de ce département :
- Employés du département
- Budget du département
- Projets du département
- Congés des employés du département

**Requête pour lister les départements d'un utilisateur** :
```sql
SELECT d.id, d.name, r.name as role_name
FROM user_roles ur
JOIN departments d ON d.id = ur.context_id
JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = 'charlie-789'
  AND ur.context_type = 'department'
  AND ur.tenant_id = 'tenant-456';
```

---

## 🔗 Relations entre les Tables

```
┌─────────────────┐
│   user_roles    │
├─────────────────┤
│ id              │
│ user_id         │
│ role_id         │
│ context_type    │────┐
│ context_id      │────┼─────────────────────────────┐
│ tenant_id       │    │                             │
└─────────────────┘    │                             │
                       │                             │
        ┌──────────────┼─────────────────┐           │
        │              │                 │           │
        ▼              ▼                 ▼           │
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│   global    │  │  projects   │  │ departments │  │
│  (aucune    │  ├─────────────┤  ├─────────────┤  │
│   table)    │  │ id ◄────────┼──┼─────────────┼──┘
│             │  │ name        │  │ id ◄────────┘
│ context_id  │  │ description │  │ name        │
│  = NULL     │  │ manager_id  │  │ description │
└─────────────┘  │ tenant_id   │  │ manager_id  │
                 └─────────────┘  │ tenant_id   │
                                  └─────────────┘
```

---

## 📝 Exemples Complets

### **Exemple 1 : Utilisateur avec Rôles Multiples**

```sql
-- Alice a 3 rôles différents :

-- 1. Admin global du tenant
INSERT INTO user_roles VALUES (
  gen_random_uuid(),
  'alice-123',
  'role-tenant-admin',
  'global',
  NULL,
  'tenant-456',
  true
);

-- 2. Manager du projet "Website"
INSERT INTO user_roles VALUES (
  gen_random_uuid(),
  'alice-123',
  'role-project-manager',
  'project',
  'proj-website-001',
  'tenant-456',
  true
);

-- 3. Manager du projet "Mobile App"
INSERT INTO user_roles VALUES (
  gen_random_uuid(),
  'alice-123',
  'role-project-manager',
  'project',
  'proj-mobile-002',
  'tenant-456',
  true
);
```

**Résultat** : Alice peut :
- ✅ Gérer tout le tenant (rôle global)
- ✅ Gérer spécifiquement le projet Website
- ✅ Gérer spécifiquement le projet Mobile App

---

### **Exemple 2 : Vérification des Permissions**

```sql
-- Fonction has_permission avec contexte
SELECT has_permission(
  'tasks',           -- resource
  'update',          -- action
  'project',         -- context
  'proj-website-001' -- context_id
);

-- Logique interne :
-- 1. Cherche les rôles de l'utilisateur
-- 2. Vérifie si l'un des rôles correspond :
--    a) Rôle global (context_type = 'global') → Accès partout
--    b) Rôle projet spécifique (context_type = 'project' AND context_id = 'proj-website-001')
-- 3. Vérifie les permissions du rôle
```

---

### **Exemple 3 : Requête pour Lister Tous les Contextes d'un Utilisateur**

```sql
SELECT 
  ur.id,
  r.name as role_name,
  r.display_name,
  ur.context_type,
  CASE 
    WHEN ur.context_type = 'global' THEN 'Tout le tenant'
    WHEN ur.context_type = 'project' THEN p.name
    WHEN ur.context_type = 'department' THEN d.name
  END as context_name,
  ur.is_active
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
LEFT JOIN projects p ON p.id = ur.context_id AND ur.context_type = 'project'
LEFT JOIN departments d ON d.id = ur.context_id AND ur.context_type = 'department'
WHERE ur.user_id = 'alice-123'
  AND ur.tenant_id = 'tenant-456'
  AND ur.is_active = true
ORDER BY ur.context_type, context_name;
```

**Résultat** :
```
role_name          | context_type | context_name
-------------------+--------------+------------------
tenant_admin       | global       | Tout le tenant
project_manager    | project      | Website Redesign
project_manager    | project      | Mobile App
department_manager | department   | Engineering
```

---

## 🔒 Contrainte UNIQUE

```sql
UNIQUE (user_id, role_id, tenant_id, context_type, context_id)
```

**Signification** :
- ✅ **AUTORISÉ** : Même rôle pour différents projets
- ✅ **AUTORISÉ** : Même rôle pour différents départements
- ✅ **AUTORISÉ** : Rôle global + rôles contextuels
- ❌ **BLOQUÉ** : Même rôle + même contexte (doublon réel)

---

## 📊 Statistiques Utiles

### **Compter les rôles par type de contexte**
```sql
SELECT 
  context_type,
  COUNT(*) as total_roles,
  COUNT(DISTINCT user_id) as unique_users
FROM user_roles
WHERE tenant_id = 'tenant-456'
GROUP BY context_type;
```

### **Utilisateurs avec le plus de rôles contextuels**
```sql
SELECT 
  user_id,
  COUNT(*) as total_roles,
  COUNT(*) FILTER (WHERE context_type = 'global') as global_roles,
  COUNT(*) FILTER (WHERE context_type = 'project') as project_roles,
  COUNT(*) FILTER (WHERE context_type = 'department') as department_roles
FROM user_roles
WHERE tenant_id = 'tenant-456'
GROUP BY user_id
ORDER BY total_roles DESC;
```

---

## 🎯 Résumé

| context_type | context_id | Table de référence | Portée |
|--------------|------------|-------------------|--------|
| `'global'`   | `NULL`     | Aucune           | Tout le tenant |
| `'project'`  | UUID       | `projects`       | Un projet spécifique |
| `'department'` | UUID     | `departments`    | Un département spécifique |

**Un utilisateur peut avoir** :
- ✅ Plusieurs rôles globaux
- ✅ Plusieurs rôles pour différents projets
- ✅ Plusieurs rôles pour différents départements
- ✅ Combinaison de tous les types ci-dessus

**Un utilisateur NE PEUT PAS avoir** :
- ❌ Le même rôle deux fois pour le même contexte (doublon)

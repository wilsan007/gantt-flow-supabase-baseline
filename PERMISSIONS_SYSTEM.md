# 🔐 Système de Permissions - Documentation Complète

## 🏗️ Architecture du Système

Le système de permissions dans Wadashaqeen suit une architecture **Role-Based Access Control (RBAC)** avec isolation par tenant.

---

## 📊 Structure des Tables

### **1. Tables Principales**
```
profiles              ← Profil utilisateur
  ├─ user_id (FK → auth.users)
  └─ tenant_id (FK → tenants)

user_roles            ← Rôles attribués à l'utilisateur
  ├─ user_id (FK → profiles.user_id)
  ├─ role_id (FK → roles.id)
  ├─ tenant_id (FK → tenants)
  └─ is_active (boolean)

roles                 ← Définition des rôles
  ├─ id
  └─ name (ex: 'super_admin', 'tenant_admin', 'hr_admin', etc.)

role_permissions      ← Permissions liées aux rôles
  ├─ role_id (FK → roles.id)
  └─ permission_id (FK → permissions.id)

permissions           ← Définition des permissions
  ├─ id
  └─ name (ex: 'create_employee', 'delete_task', etc.)
```

---

## 🔑 Fonctions SQL Principales

### **1. `public.is_super_admin()`**
Vérifie si l'utilisateur est **Super Admin**.

```sql
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = COALESCE($1, auth.uid())
      AND r.name = 'super_admin'
      AND ur.is_active = true
  );
$$;
```

**Flux de vérification :**
1. ✅ Récupère l'utilisateur connecté (`auth.uid()`)
2. ✅ Cherche dans `user_roles` les rôles actifs de l'utilisateur
3. ✅ Vérifie si le nom du rôle est `'super_admin'`
4. ✅ Retourne `true` si trouvé, `false` sinon

---

### **2. `public.user_has_role()`**
Vérifie si l'utilisateur a un (ou plusieurs) rôle(s) spécifique(s).

```sql
CREATE OR REPLACE FUNCTION public.user_has_role(role_names TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = ANY($1)  -- Vérifie si le rôle est dans le tableau
      AND ur.is_active = true
  );
$$;
```

**Exemple d'utilisation :**
```sql
-- Vérifier si l'utilisateur est HR Admin OU Tenant Admin
SELECT public.user_has_role(ARRAY['hr_admin', 'tenant_admin']);
```

---

### **3. `public.get_current_tenant_id()`**
Récupère le tenant_id de l'utilisateur connecté.

```sql
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id 
  FROM public.profiles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;
```

---

### **4. `public.has_global_access()`**
Vérifie si l'utilisateur a un accès global (cross-tenant).

```sql
CREATE OR REPLACE FUNCTION public.has_global_access(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.is_super_admin($1);
$$;
```

---

## 🛡️ Patterns de Policies RLS

### **Pattern 1 : Isolation Tenant Stricte**
Utilisateurs normaux voient uniquement les données de leur tenant.

```sql
CREATE POLICY "Tenant isolation for employees"
  ON employees
  FOR SELECT
  USING (
    tenant_id = public.get_current_tenant_id()
  );
```

**Flux :**
1. Récupère le `tenant_id` de l'utilisateur
2. Compare avec le `tenant_id` de la ligne
3. Autorise seulement si égaux

---

### **Pattern 2 : Isolation Tenant + Super Admin**
Utilisateurs normaux = tenant uniquement, Super Admin = tout.

```sql
CREATE POLICY "Hybrid access for tasks"
  ON tasks
  FOR SELECT
  USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_super_admin()
  );
```

**Flux :**
1. Vérifie si c'est le tenant de l'utilisateur → ✅ OK
2. Sinon, vérifie si Super Admin → ✅ OK
3. Sinon → ❌ Refusé

---

### **Pattern 3 : Rôles Spécifiques + Super Admin**
Seuls certains rôles peuvent effectuer l'action.

```sql
CREATE POLICY "HR can create employees"
  ON employees
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.user_has_role(ARRAY['hr_admin', 'tenant_admin'])
  );
```

**Flux :**
1. Vérifie que c'est le bon tenant
2. Vérifie que l'utilisateur a le rôle `hr_admin` OU `tenant_admin`
3. Autorise seulement si les deux conditions sont vraies

---

### **Pattern 4 : Super Admin Uniquement**
Accès réservé aux Super Admin.

```sql
CREATE POLICY "Super Admin only for tenants"
  ON tenants
  FOR ALL
  USING (
    public.is_super_admin()
  );
```

**Flux :**
1. Vérifie si l'utilisateur est Super Admin
2. Autorise uniquement si oui

---

## 🎯 Exemples Concrets

### **Exemple 1 : Fichiers d'Actions Opérationnelles**

```sql
-- ✅ CORRECT : Utilisation de is_super_admin()
CREATE POLICY "Super Admin full access to action attachments"
  ON operational_action_attachments
  FOR ALL
  USING (
    public.is_super_admin()
  );

-- ❌ INCORRECT : profiles.is_super_admin n'existe pas
CREATE POLICY "Super Admin full access to action attachments"
  ON operational_action_attachments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_super_admin = true  -- ❌ Colonne inexistante !
    )
  );
```

---

### **Exemple 2 : Fichiers de Tâches**

```sql
-- ✅ CORRECT
CREATE POLICY "Users can view task attachments in their tenant"
  ON task_attachments
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super Admin full access to task attachments"
  ON task_attachments
  FOR ALL
  USING (
    public.is_super_admin()
  );
```

**Flux combiné :**
1. **Utilisateur normal** : Voit uniquement les fichiers de son tenant
2. **Super Admin** : Voit TOUS les fichiers (cross-tenant)

---

### **Exemple 3 : Multi-Rôles**

```sql
-- Seuls les RH, Finance et Admins peuvent créer des employés
CREATE POLICY "Authorized roles can create employees"
  ON employees
  FOR INSERT
  WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND (
      public.user_has_role(ARRAY['hr_admin', 'finance_manager', 'tenant_admin'])
      OR public.is_super_admin()
    )
  );
```

---

## 🔍 Comment Débugger les Permissions

### **1. Vérifier le rôle de l'utilisateur**
```sql
SELECT 
  ur.user_id,
  r.name as role_name,
  ur.is_active,
  ur.tenant_id
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = auth.uid();
```

### **2. Vérifier si l'utilisateur est Super Admin**
```sql
SELECT public.is_super_admin();
```

### **3. Vérifier les rôles actifs**
```sql
SELECT public.user_has_role(ARRAY['hr_admin', 'tenant_admin']);
```

### **4. Vérifier le tenant de l'utilisateur**
```sql
SELECT public.get_current_tenant_id();
```

### **5. Lister toutes les policies d'une table**
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'operational_action_attachments';
```

---

## 🚨 Erreurs Courantes

### **Erreur 1 : `column profiles.is_super_admin does not exist`**
**Cause :** Utilisation d'une colonne qui n'existe pas.

**❌ Mauvais :**
```sql
WHERE profiles.is_super_admin = true
```

**✅ Bon :**
```sql
WHERE public.is_super_admin()
```

---

### **Erreur 2 : `infinite recursion detected in policy`**
**Cause :** Policy qui appelle récursivement une autre policy.

**Solution :** Utiliser `SECURITY DEFINER` dans les fonctions.

---

### **Erreur 3 : `permission denied for table`**
**Cause :** RLS activé mais aucune policy ne correspond.

**Solution :** Vérifier les policies avec :
```sql
SELECT * FROM pg_policies WHERE tablename = 'nom_table';
```

---

## 📝 Bonnes Pratiques

### ✅ **DO**
1. Utiliser `public.is_super_admin()` pour vérifier les Super Admin
2. Utiliser `public.user_has_role(ARRAY['role1', 'role2'])` pour vérifier les rôles
3. Utiliser `public.get_current_tenant_id()` pour l'isolation tenant
4. Toujours activer RLS : `ALTER TABLE xxx ENABLE ROW LEVEL SECURITY;`
5. Tester les policies avec différents utilisateurs

### ❌ **DON'T**
1. ❌ Ne PAS chercher `profiles.is_super_admin` (colonne inexistante)
2. ❌ Ne PAS faire de requêtes récursives dans les policies
3. ❌ Ne PAS oublier `SECURITY DEFINER` dans les fonctions critiques
4. ❌ Ne PAS mélanger logique métier et RLS
5. ❌ Ne PAS donner accès global sans vérifier le rôle

---

## 🎓 Résumé

### **Architecture :**
```
Utilisateur (auth.uid)
  ↓
Profile (tenant_id)
  ↓
User_Roles (role_id, is_active)
  ↓
Roles (name: 'super_admin', 'tenant_admin', etc.)
  ↓
Permissions (create, read, update, delete)
```

### **Fonctions Clés :**
- `is_super_admin()` → Vérifie si Super Admin
- `user_has_role(['role1', 'role2'])` → Vérifie si a un rôle
- `get_current_tenant_id()` → Récupère le tenant
- `has_global_access()` → Vérifie accès cross-tenant

### **Patterns de Policies :**
1. **Tenant strict** : `tenant_id = get_current_tenant_id()`
2. **Tenant + Super Admin** : `... OR is_super_admin()`
3. **Rôles spécifiques** : `user_has_role(ARRAY[...])`
4. **Super Admin only** : `is_super_admin()`

---

**Toujours utiliser les fonctions SQL existantes au lieu de chercher des colonnes inexistantes !** ✅

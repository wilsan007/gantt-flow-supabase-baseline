# 🔄 Flux Complet : Rôles et Permissions - Architecture Réelle

## 📊 **Structure de la Base de Données (Réelle)**

### **Tables et Relations**

```
auth.users
    ↓ user_id
profiles (tenant_id ici !)
    ↓ user_id
user_roles (role_id, pas role !)
    ↓ role_id
roles (name ici !)
    ↓ id
role_permissions (permission_id ici !)
    ↓ permission_id
permissions (name ici !)
```

---

## 🎯 **Flux de Récupération Complet**

### **Étape 1 : Récupérer le Tenant depuis Profiles**

```sql
-- ❌ INCORRECT (ancienne logique)
SELECT tenant_id FROM user_roles WHERE user_id = $1;

-- ✅ CORRECT (nouvelle logique)
SELECT tenant_id FROM profiles WHERE user_id = $1;
```

**Explication** :
- Le `tenant_id` est stocké dans `profiles.tenant_id`
- C'est la **source de vérité** pour le tenant d'un utilisateur

---

### **Étape 2 : Récupérer les Rôles de l'Utilisateur**

```sql
-- ❌ INCORRECT (ancienne logique)
SELECT role FROM user_roles WHERE user_id = $1;
-- Problème: user_roles n'a pas de colonne "role"

-- ✅ CORRECT (nouvelle logique)
SELECT 
  ur.id,
  ur.user_id,
  ur.role_id,           -- ← C'est une FK vers roles.id
  r.name as role_name,  -- ← Le nom du rôle est dans roles.name
  r.description,
  ur.tenant_id,
  ur.is_active
FROM user_roles ur
INNER JOIN roles r ON ur.role_id = r.id  -- ← JOIN obligatoire
WHERE ur.user_id = $1
  AND ur.is_active = true
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
```

**Explication** :
- `user_roles.role_id` → FK vers `roles.id`
- `roles.name` → Nom du rôle ('super_admin', 'tenant_admin', etc.)
- **JOIN obligatoire** pour récupérer le nom du rôle

---

### **Étape 3 : Récupérer les Permissions de l'Utilisateur**

```sql
-- ✅ FLUX COMPLET (4 JOINs nécessaires)
SELECT DISTINCT
  p.id as permission_id,
  p.name as permission_name,
  p.description as permission_description,
  p.category as permission_category,
  r.name as role_name,
  ur.tenant_id
FROM user_roles ur
INNER JOIN roles r ON ur.role_id = r.id                    -- 1. user_roles → roles
INNER JOIN role_permissions rp ON r.id = rp.role_id        -- 2. roles → role_permissions
INNER JOIN permissions p ON rp.permission_id = p.id        -- 3. role_permissions → permissions
WHERE ur.user_id = $1
  AND ur.is_active = true
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
ORDER BY p.category, p.name;
```

**Explication du Flux** :
1. `user_roles` → Récupère les `role_id` de l'utilisateur
2. `roles` → Récupère les détails du rôle via `role_id`
3. `role_permissions` → Récupère les `permission_id` pour ce rôle
4. `permissions` → Récupère les détails des permissions

---

## 🔍 **Fonctions SQL Corrigées**

### **1. Récupérer le Tenant**

```sql
CREATE OR REPLACE FUNCTION get_user_tenant_from_profile(p_user_id UUID)
RETURNS UUID AS $$
  SELECT tenant_id 
  FROM profiles 
  WHERE user_id = p_user_id
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### **2. Vérifier un Rôle (Corrigée)**

```sql
CREATE OR REPLACE FUNCTION user_has_role_corrected(
  p_user_id UUID,
  p_role_names TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id  -- ← JOIN obligatoire
    WHERE ur.user_id = p_user_id
      AND r.name = ANY(p_role_names)         -- ← roles.name, pas ur.role
      AND ur.is_active = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### **3. Vérifier une Permission**

```sql
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_permission_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    INNER JOIN role_permissions rp ON r.id = rp.role_id
    INNER JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND p.name = p_permission_name
      AND ur.is_active = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## 📋 **Schéma Détaillé des Tables**

### **Table: profiles**
```sql
profiles {
  id: UUID (PK)
  user_id: UUID (FK → auth.users.id) ← UNIQUE
  tenant_id: UUID (FK → tenants.id)  ← SOURCE DE VÉRITÉ
  role: TEXT (deprecated, ne pas utiliser)
  full_name: TEXT
  created_at: TIMESTAMPTZ
}
```

### **Table: user_roles**
```sql
user_roles {
  id: UUID (PK)
  user_id: UUID (FK → auth.users.id)
  role_id: UUID (FK → roles.id)      ← PAS "role" !
  tenant_id: UUID (FK → tenants.id)
  is_active: BOOLEAN
  assigned_at: TIMESTAMPTZ
  expires_at: TIMESTAMPTZ (nullable)
}
```

### **Table: roles**
```sql
roles {
  id: UUID (PK)
  name: TEXT                          ← NOM DU RÔLE ICI
  description: TEXT
  is_active: BOOLEAN
  created_at: TIMESTAMPTZ
}
```

### **Table: role_permissions**
```sql
role_permissions {
  id: UUID (PK)
  role_id: UUID (FK → roles.id)
  permission_id: UUID (FK → permissions.id)  ← PAS "permission" !
  granted_at: TIMESTAMPTZ
}
```

### **Table: permissions**
```sql
permissions {
  id: UUID (PK)
  name: TEXT                          ← NOM DE LA PERMISSION ICI
  display_name: TEXT
  description: TEXT
  resource: TEXT                      ← Type de ressource (employee, project, etc.)
  action: TEXT                        ← Action (create, read, update, delete)
  context: TEXT
  created_at: TIMESTAMPTZ
}
```

---

## 🎯 **Exemple Concret : Utilisateur 5c5731ce-75d0-4455-8184-bc42c626cb17**

### **Diagnostic Complet**

```sql
-- 1. Vérifier auth.users
SELECT id, email FROM auth.users 
WHERE id = '5c5731ce-75d0-4455-8184-bc42c626cb17';
-- Résultat attendu: ✅ Utilisateur existe

-- 2. Vérifier profiles (tenant_id ici !)
SELECT user_id, tenant_id, full_name FROM profiles 
WHERE user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17';
-- Résultat actuel: ❌ Aucun profil (PROBLÈME)

-- 3. Vérifier user_roles (role_id, pas role !)
SELECT 
  ur.user_id,
  ur.role_id,
  r.name as role_name,
  ur.tenant_id
FROM user_roles ur
INNER JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17';
-- Résultat actuel: ❌ Aucun rôle (PROBLÈME)

-- 4. Vérifier permissions (flux complet)
SELECT 
  p.name as permission_name,
  p.category,
  r.name as role_name
FROM user_roles ur
INNER JOIN roles r ON ur.role_id = r.id
INNER JOIN role_permissions rp ON r.id = rp.role_id
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17';
-- Résultat actuel: ❌ Aucune permission (PROBLÈME)
```

---

## 🛠️ **Solution : Réparer l'Utilisateur**

### **Étape 1 : Créer un Tenant**

```sql
INSERT INTO tenants (id, name, slug, owner_id)
VALUES (
  gen_random_uuid(),
  'Mon Entreprise',
  'mon-entreprise',
  '5c5731ce-75d0-4455-8184-bc42c626cb17'
)
RETURNING id;
-- Supposons que le tenant_id retourné est: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
```

### **Étape 2 : Créer le Profile**

```sql
INSERT INTO profiles (user_id, tenant_id, full_name, role)
VALUES (
  '5c5731ce-75d0-4455-8184-bc42c626cb17',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',  -- tenant_id créé ci-dessus
  'Nom Utilisateur',
  'tenant_admin'  -- deprecated mais requis
);
```

### **Étape 3 : Assigner un Rôle (via role_id !)**

```sql
-- D'abord, récupérer le role_id pour 'tenant_admin'
SELECT id FROM roles WHERE name = 'tenant_admin';
-- Supposons que le role_id est: 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr'

-- Ensuite, créer l'assignation
INSERT INTO user_roles (user_id, role_id, tenant_id, is_active)
VALUES (
  '5c5731ce-75d0-4455-8184-bc42c626cb17',
  'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr',  -- role_id (pas le nom !)
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',  -- tenant_id
  true
);
```

### **Étape 4 : Vérifier les Permissions**

```sql
-- Les permissions sont automatiquement disponibles via role_permissions
SELECT 
  p.name as permission_name,
  p.category
FROM user_roles ur
INNER JOIN roles r ON ur.role_id = r.id
INNER JOIN role_permissions rp ON r.id = rp.role_id
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17';
-- Résultat attendu: ✅ Liste des permissions du rôle tenant_admin
```

---

## 🚀 **Utilisation des Nouvelles Fonctions**

### **Diagnostic Automatique**

```sql
-- Utiliser la fonction de diagnostic v2
SELECT * FROM diagnose_user_access_v2('5c5731ce-75d0-4455-8184-bc42c626cb17');
```

**Résultat Attendu (Utilisateur Complet)** :
```
check_name       | status | details
-----------------+--------+--------------------------------------------------
AUTH_USER        | OK     | {"email": "user@example.com"}
PROFILE          | OK     | {"tenant_id": "aaaa...", "profile_data": {...}}
USER_ROLES       | OK     | {"roles_count": 1, "roles": [{"role_name": "tenant_admin", ...}]}
PERMISSIONS      | OK     | {"permissions_count": 25, "sample_permissions": [...]}
RECOMMENDATION   | OK     | {"message": "Utilisateur complet et fonctionnel"}
```

**Résultat Actuel (Utilisateur Incomplet)** :
```
check_name       | status  | details
-----------------+---------+--------------------------------------------------
AUTH_USER        | OK      | {"email": "user@example.com"}
PROFILE          | MISSING | {"message": "Aucun profil trouvé - PROBLÈME CRITIQUE"}
USER_ROLES       | MISSING | {"message": "Aucun rôle assigné - PROBLÈME CRITIQUE"}
PERMISSIONS      | MISSING | {"message": "Aucune permission trouvée"}
RECOMMENDATION   | ACTION_REQUIRED | {"message": "Utilisateur incomplet - Données manquantes"}
```

---

## 📊 **Résumé des Corrections**

### **Avant (Incorrect)**
```sql
-- ❌ Cherchait "role" dans user_roles (n'existe pas)
SELECT role FROM user_roles WHERE user_id = $1;

-- ❌ Cherchait tenant_id dans user_roles (pas la source de vérité)
SELECT tenant_id FROM user_roles WHERE user_id = $1;
```

### **Après (Correct)**
```sql
-- ✅ Récupère tenant_id depuis profiles
SELECT tenant_id FROM profiles WHERE user_id = $1;

-- ✅ Récupère role_name via JOIN avec roles
SELECT r.name 
FROM user_roles ur
INNER JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = $1;

-- ✅ Récupère permissions via flux complet (4 tables)
SELECT p.name
FROM user_roles ur
INNER JOIN roles r ON ur.role_id = r.id
INNER JOIN role_permissions rp ON r.id = rp.role_id
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = $1;
```

---

## 🎯 **Points Clés à Retenir**

1. **tenant_id** → Récupérer depuis `profiles.tenant_id`
2. **role_name** → Récupérer via `user_roles.role_id → roles.name`
3. **permission_name** → Récupérer via flux complet (4 JOINs)
4. **Toujours utiliser les FK** : `role_id`, `permission_id` (pas les noms directement)
5. **JOINs obligatoires** pour récupérer les noms depuis les tables de référence

---

## 🔧 **Prochaines Étapes**

1. **Déployer la migration 225**
   ```bash
   supabase db push
   ```

2. **Tester le diagnostic**
   ```sql
   SELECT * FROM diagnose_user_access_v2('5c5731ce-75d0-4455-8184-bc42c626cb17');
   ```

3. **Réparer l'utilisateur si nécessaire**
   - Créer tenant
   - Créer profile avec tenant_id
   - Assigner role via role_id
   - Vérifier permissions automatiques

**Cette logique est maintenant sauvegardée et documentée pour utilisation future !** 🚀

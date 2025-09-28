# SECURITY DEFINER vs RLS : Pourquoi le trigger peut encore être bloqué

## 🔍 Le problème fondamental

Même avec `SECURITY DEFINER`, le trigger `auto_create_tenant_owner()` peut être bloqué par RLS car **SECURITY DEFINER ne désactive pas automatiquement RLS**.

## 📋 Différence entre SECURITY DEFINER et RLS

### SECURITY DEFINER
- **Rôle d'exécution** : La fonction s'exécute avec les privilèges du **propriétaire** (généralement `postgres`)
- **Permissions** : Contourne les restrictions de permissions sur les tables
- **RLS** : **N'affecte PAS** les politiques RLS par défaut

### RLS (Row Level Security)
- **Filtrage des lignes** : Appliqué même aux super-utilisateurs dans certains contextes
- **Politiques** : Restent actives même avec SECURITY DEFINER
- **Contexte utilisateur** : Utilise toujours le contexte de l'utilisateur connecté

## ⚠️ Cas problématiques pour tenant owner creation

### 1. Fonction `get_user_tenant_id()` dans les politiques RLS

```sql
-- Politique RLS typique sur employees
CREATE POLICY "employees_tenant_isolation" ON employees
FOR ALL USING (tenant_id = get_user_tenant_id());
```

**Problème** :
- Le trigger s'exécute avec `SECURITY DEFINER`
- Mais `get_user_tenant_id()` est appelée dans le contexte de l'utilisateur
- Si l'utilisateur n'a pas encore de profil → `get_user_tenant_id()` retourne NULL
- La politique RLS bloque l'insertion car `tenant_id = NULL` est faux

### 2. Contexte d'authentification

```sql
-- Politique utilisant auth.uid()
CREATE POLICY "profiles_own_data" ON profiles
FOR ALL USING (user_id = auth.uid());
```

**Problème** :
- `auth.uid()` retourne l'ID de l'utilisateur connecté
- Même avec `SECURITY DEFINER`, `auth.uid()` reste dans le contexte utilisateur
- Si les politiques vérifient `auth.uid()`, elles s'appliquent toujours

### 3. Politiques restrictives sur tables globales

```sql
-- Politique sur roles (table globale)
CREATE POLICY "roles_read_only" ON roles
FOR SELECT USING (true);
-- Pas de politique INSERT → bloqué par défaut
```

**Problème** :
- Même avec `SECURITY DEFINER`, si aucune politique INSERT n'existe
- L'insertion est bloquée par défaut RLS

## 🛠️ Solutions pour contourner RLS

### Solution 1 : Désactiver RLS temporairement (NON RECOMMANDÉ)

```sql
CREATE OR REPLACE FUNCTION auto_create_tenant_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Désactiver RLS temporairement
    SET row_security = off;
    
    -- Opérations de création
    INSERT INTO profiles (...) VALUES (...);
    INSERT INTO employees (...) VALUES (...);
    
    -- Réactiver RLS
    SET row_security = on;
    
    RETURN NEW;
END;
$$;
```

**Risques** : Désactive RLS pour toute la session

### Solution 2 : Créer des politiques spéciales pour SECURITY DEFINER

```sql
-- Politique permettant les insertions via fonctions SECURITY DEFINER
CREATE POLICY "profiles_system_insert" ON profiles
FOR INSERT WITH CHECK (
    -- Permettre si exécuté par une fonction SECURITY DEFINER
    current_setting('role') = 'postgres' OR
    -- Ou si c'est un tenant owner en création
    tenant_id IS NOT NULL
);
```

### Solution 3 : Utiliser des fonctions avec SECURITY DEFINER pour chaque table

```sql
-- Fonction spéciale pour insérer dans profiles
CREATE OR REPLACE FUNCTION system_insert_profile(
    p_user_id UUID,
    p_tenant_id UUID,
    p_email TEXT,
    p_full_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_id UUID;
BEGIN
    INSERT INTO profiles (user_id, tenant_id, email, full_name)
    VALUES (p_user_id, p_tenant_id, p_email, p_full_name)
    RETURNING id INTO profile_id;
    
    RETURN profile_id;
END;
$$;
```

### Solution 4 : Modifier les politiques RLS existantes

```sql
-- Modifier la politique pour permettre la création initiale
CREATE POLICY "employees_tenant_access" ON employees
FOR ALL USING (
    tenant_id = get_user_tenant_id() OR
    -- Permettre si pas encore de tenant (création initiale)
    get_user_tenant_id() IS NULL
);
```

## 🎯 Solution recommandée pour votre cas

### Étape 1 : Analyser les politiques bloquantes

```sql
-- Vérifier les politiques sur profiles
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Vérifier les politiques sur employees
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'employees';
```

### Étape 2 : Créer des politiques spéciales pour tenant owner creation

```sql
-- Politique pour permettre la création de profil initial
CREATE POLICY "profiles_initial_creation" ON profiles
FOR INSERT WITH CHECK (
    -- Permettre si c'est une création initiale (pas de profil existant)
    NOT EXISTS (
        SELECT 1 FROM profiles p2 
        WHERE p2.user_id = profiles.user_id
    )
);

-- Politique pour permettre la création d'employé initial
CREATE POLICY "employees_initial_creation" ON employees
FOR INSERT WITH CHECK (
    -- Permettre si c'est une création initiale
    tenant_id IS NOT NULL AND
    NOT EXISTS (
        SELECT 1 FROM employees e2 
        WHERE e2.user_id = employees.user_id
    )
);
```

### Étape 3 : Modifier le trigger pour utiliser des fonctions spécialisées

```sql
CREATE OR REPLACE FUNCTION auto_create_tenant_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Utiliser des fonctions spécialisées qui contournent RLS
    PERFORM system_create_tenant_owner(NEW.id, NEW.email);
    RETURN NEW;
END;
$$;
```

## 📊 Diagnostic de votre situation

Votre trigger échoue probablement car :

1. **Fonction `get_user_tenant_id()`** retourne NULL pendant la création
2. **Politiques RLS** sur `profiles` et `employees` bloquent les insertions
3. **Tables globales** (`roles`, `permissions`) ont des politiques restrictives
4. **Contexte d'authentification** ne permet pas l'accès initial

La solution est de modifier les politiques RLS pour permettre la création initiale ou d'utiliser des fonctions spécialisées avec `SECURITY DEFINER` pour chaque table.

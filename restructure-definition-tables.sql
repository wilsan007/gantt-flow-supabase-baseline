-- ==============================================
-- Restructuration des Tables de Définition
-- ==============================================
-- Ce script nettoie et restructure les tables roles, permissions, et role_permissions
-- pour qu'elles soient de pures tables de définition sans données utilisateur

-- 1. NETTOYER LES DONNÉES DUPLIQUÉES
-- Supprimer tous les enregistrements dupliqués, ne garder qu'une seule instance de chaque

-- Nettoyer la table role_permissions (supprimer toutes les liaisons dupliquées)
DELETE FROM public.role_permissions 
WHERE ctid NOT IN (
  SELECT MIN(ctid) 
  FROM public.role_permissions 
  GROUP BY role_id, permission_id
);

-- Nettoyer la table permissions (supprimer toutes les permissions dupliquées)
DELETE FROM public.permissions 
WHERE ctid NOT IN (
  SELECT MIN(ctid) 
  FROM public.permissions 
  GROUP BY name
);

-- Nettoyer la table roles (supprimer tous les rôles dupliqués)
DELETE FROM public.roles 
WHERE ctid NOT IN (
  SELECT MIN(ctid) 
  FROM public.roles 
  GROUP BY name
);

-- 2. SUPPRIMER LES COLONNES LIÉES AUX UTILISATEURS/TENANTS
-- Si ces colonnes existent, les supprimer (certaines peuvent ne pas exister)

-- Supprimer tenant_id de roles si elle existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'roles' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.roles DROP COLUMN tenant_id;
    END IF;
END $$;

-- Supprimer user_id de roles si elle existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'roles' AND column_name = 'user_id') THEN
        ALTER TABLE public.roles DROP COLUMN user_id;
    END IF;
END $$;

-- Supprimer tenant_id de permissions si elle existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'permissions' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.permissions DROP COLUMN tenant_id;
    END IF;
END $$;

-- Supprimer user_id de permissions si elle existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'permissions' AND column_name = 'user_id') THEN
        ALTER TABLE public.permissions DROP COLUMN user_id;
    END IF;
END $$;

-- 3. CONFIGURER LES POLITIQUES RLS POUR ACCÈS GLOBAL
-- Les tables de définition doivent être accessibles à tous les utilisateurs de tous les tenants

-- Supprimer toutes les politiques RLS existantes sur ces tables
DROP POLICY IF EXISTS "Enable read access for all users" ON public.roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.roles;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.roles;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.roles;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.permissions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.permissions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.permissions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.permissions;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.role_permissions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.role_permissions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.role_permissions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.role_permissions;

-- Créer des politiques RLS restrictives pour les tables de définition
-- Lecture libre pour tous, mais écriture restreinte aux administrateurs système

-- Politiques pour la table roles
CREATE POLICY "Global read access for roles" 
ON public.roles FOR SELECT 
USING (true);

CREATE POLICY "Restrict write access for roles" 
ON public.roles FOR ALL 
USING (false) 
WITH CHECK (false);

-- Politiques pour la table permissions
CREATE POLICY "Global read access for permissions" 
ON public.permissions FOR SELECT 
USING (true);

CREATE POLICY "Restrict write access for permissions" 
ON public.permissions FOR ALL 
USING (false) 
WITH CHECK (false);

-- Politiques pour la table role_permissions
CREATE POLICY "Global read access for role_permissions" 
ON public.role_permissions FOR SELECT 
USING (true);

CREATE POLICY "Restrict write access for role_permissions" 
ON public.role_permissions FOR ALL 
USING (false) 
WITH CHECK (false);

-- 4. AJOUTER DES CONTRAINTES POUR ÉVITER LES DOUBLONS
ALTER TABLE public.roles ADD CONSTRAINT unique_role_name UNIQUE (name);
ALTER TABLE public.permissions ADD CONSTRAINT unique_permission_name UNIQUE (name);
ALTER TABLE public.role_permissions ADD CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id);

SELECT 'Tables de définition restructurées avec succès. Elles sont maintenant en lecture seule et accessibles globalement.' as status;

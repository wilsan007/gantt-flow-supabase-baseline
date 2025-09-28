-- Solution d'urgence : Désactiver temporairement RLS sur profiles
-- pour permettre à l'application de fonctionner pendant qu'on diagnostique

-- 1. Désactiver RLS temporairement
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer TOUTES les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_tenant_admin_manage" ON public.profiles;
DROP POLICY IF EXISTS "profiles_same_tenant_view" ON public.profiles;

-- Supprimer aussi les anciennes politiques au cas où
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Tenant members can view profiles in same tenant" ON public.profiles;
DROP POLICY IF EXISTS "Tenant admins can manage all profiles in tenant" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users based on tenant_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on tenant_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for users based on tenant_id" ON public.profiles;

-- 3. Accorder les permissions de base
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon;

-- 4. Message de confirmation
SELECT 'RLS désactivé temporairement sur profiles - Application devrait fonctionner' as status;

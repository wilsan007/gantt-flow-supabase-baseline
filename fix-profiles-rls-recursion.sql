-- Correction de la récursion infinie dans les politiques RLS de la table profiles
-- Le problème vient des politiques qui se référencent mutuellement

-- 1. Supprimer toutes les politiques RLS existantes sur profiles
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

-- 2. Créer des politiques RLS simplifiées et non récursives
-- Politique pour voir son propre profil (basée uniquement sur user_id)
CREATE POLICY "profiles_select_own" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

-- Politique pour mettre à jour son propre profil
CREATE POLICY "profiles_update_own" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Politique pour insérer son propre profil (pour le trigger)
CREATE POLICY "profiles_insert_own" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Politique pour les super admins (basée sur JWT claim)
CREATE POLICY "profiles_super_admin_all" 
ON public.profiles FOR ALL 
USING (
  COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean,
    false
  ) = true
);

-- Politique pour les tenant admins (utiliser une fonction helper)
CREATE OR REPLACE FUNCTION public.is_tenant_admin_for_profile(profile_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier si l'utilisateur connecté est tenant_admin du même tenant
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND ur.tenant_id = profile_tenant_id
    AND r.name = 'tenant_admin'
    AND ur.is_active = true
  );
END;
$$;

-- Politique pour les tenant admins
CREATE POLICY "profiles_tenant_admin_manage" 
ON public.profiles FOR ALL 
USING (public.is_tenant_admin_for_profile(tenant_id));

-- 3. Créer une version non-récursive de get_user_tenant_id() sans la supprimer
-- Utiliser une approche directe sans référencer profiles dans les politiques profiles

-- Créer une fonction alternative qui évite la récursion
CREATE OR REPLACE FUNCTION public.get_user_tenant_id_safe()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT ur.tenant_id
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  AND ur.is_active = true
  LIMIT 1;
$$;

-- Garder l'ancienne fonction mais la rendre plus simple
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT ur.tenant_id
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  AND ur.is_active = true
  LIMIT 1;
$$;

-- Politique pour voir les profils du même tenant (utiliser user_roles pour éviter la récursion)
CREATE POLICY "profiles_same_tenant_view" 
ON public.profiles FOR SELECT 
USING (
  tenant_id IN (
    SELECT ur.tenant_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.is_active = true
  )
);

-- 4. S'assurer que RLS est activé
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Accorder les permissions nécessaires
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin_for_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id_safe() TO authenticated;

-- 6. Créer un index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- Test des politiques
-- SELECT 'Politiques RLS profiles corrigées avec succès' as status;

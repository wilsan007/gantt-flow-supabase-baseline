-- Recréer les politiques RLS de manière ultra-simple pour éviter la récursion
-- Cette approche évite complètement les fonctions qui pourraient causer des problèmes

-- 1. D'abord, désactiver RLS et nettoyer complètement
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer TOUTES les politiques existantes
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- 3. Supprimer les fonctions problématiques temporairement
DROP FUNCTION IF EXISTS public.get_user_tenant_id();
DROP FUNCTION IF EXISTS public.get_user_tenant_id_safe();
DROP FUNCTION IF EXISTS public.is_tenant_admin_for_profile(UUID);

-- 4. Créer des politiques ultra-simples sans fonctions
-- Politique de base : utilisateur peut voir/modifier son propre profil
CREATE POLICY "profiles_own_access" 
ON public.profiles FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Politique pour super admin basée uniquement sur JWT
CREATE POLICY "profiles_super_admin" 
ON public.profiles FOR ALL 
USING (
  COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean,
    false
  ) = true
);

-- 5. Réactiver RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Permissions de base
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- 7. Test simple
SELECT 'Politiques RLS ultra-simples créées - Test de fonctionnement' as status;

-- 8. Recréer les fonctions de manière sécurisée (sans référencer profiles)
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

-- Accorder les permissions sur la fonction
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;

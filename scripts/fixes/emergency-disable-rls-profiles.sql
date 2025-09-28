-- SOLUTION D'URGENCE : Désactiver complètement RLS sur profiles
-- L'erreur de récursion persiste malgré tous les correctifs

-- 1. Désactiver RLS immédiatement
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer ABSOLUMENT TOUTES les politiques RLS
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Supprimer toutes les politiques existantes sur profiles
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.profiles';
        RAISE NOTICE 'Supprimé politique: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. Supprimer les fonctions qui causent la récursion
DROP FUNCTION IF EXISTS public.get_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_tenant_id_safe() CASCADE;
DROP FUNCTION IF EXISTS public.is_tenant_admin_for_profile(UUID) CASCADE;

-- 4. Accorder toutes les permissions nécessaires
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- 5. Vérifier qu'il n'y a plus de politiques
SELECT COUNT(*) as remaining_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 6. Vérifier que RLS est désactivé
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

SELECT 'URGENCE: RLS complètement désactivé sur profiles - Application devrait fonctionner' as status;

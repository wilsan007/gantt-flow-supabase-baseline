-- Créer la fonction is_super_admin manquante pour la Edge Function

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.is_super_admin(UUID);

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier si l'utilisateur a le rôle super_admin
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = $1
      AND r.name = 'super_admin'
      AND ur.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO anon;

-- Tester la fonction avec le Super Admin
SELECT 
  'Test is_super_admin' as test_name,
  public.is_super_admin('5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID) as result,
  CASE 
    WHEN public.is_super_admin('5c5731ce-75d0-4455-8184-bc42c626cb17'::UUID) THEN '✅ SUCCESS'
    ELSE '❌ FAILED'
  END as status;

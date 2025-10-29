-- =====================================================
-- CORRECTION DE LA FONCTION is_super_admin
-- Le rôle s'appelle 'super_admin' et non 'Super Admin'
-- =====================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);

-- Recréer avec le bon nom de rôle
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = $1 
    AND r.name = 'super_admin'  -- Changé de 'Super Admin' à 'super_admin'
    AND ur.is_active = true
  );
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

-- Commentaire
COMMENT ON FUNCTION public.is_super_admin(uuid) IS 'Vérifie si un utilisateur a le rôle super_admin';

-- Test de la fonction
-- SELECT is_super_admin('5c5731ce-75d0-4455-8184-bc42c626cb17');

-- =====================================================
-- FIN DE LA CORRECTION
-- =====================================================

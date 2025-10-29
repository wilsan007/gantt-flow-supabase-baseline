-- =====================================================
-- CORRECTION SIMPLE DE LA FONCTION is_super_admin
-- Modification directe sans suppression pour éviter les conflits de politiques
-- =====================================================

-- Modifier directement la fonction existante
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

-- Test de la fonction
-- SELECT is_super_admin('5c5731ce-75d0-4455-8184-bc42c626cb17');

-- =====================================================
-- VÉRIFICATION : Cette requête devrait retourner true
-- =====================================================
-- SELECT 
--   ur.user_id,
--   r.name as role_name,
--   ur.is_active,
--   is_super_admin(ur.user_id) as is_super_admin_result
-- FROM user_roles ur
-- JOIN roles r ON ur.role_id = r.id
-- WHERE ur.user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17'
-- AND ur.is_active = true;

-- =====================================================
-- FIN DE LA CORRECTION SIMPLE
-- =====================================================

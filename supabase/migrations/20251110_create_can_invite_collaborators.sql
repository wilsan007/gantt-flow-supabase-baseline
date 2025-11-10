-- Migration: Fonction can_invite_collaborators
-- Date: 2025-11-10
-- Description: Vérifie si un utilisateur a les permissions pour inviter des collaborateurs
-- Note: Utilisée par policy RLS "Authorized users can create collaborator invitations"

-- Fonction: can_invite_collaborators
-- Rôles autorisés: tenant_admin, manager, hr_manager
CREATE OR REPLACE FUNCTION public.can_invite_collaborators(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  has_permission BOOLEAN := FALSE;
BEGIN
  -- MÉTHODE 1: Vérifier dans user_roles (nouvelle architecture)
  SELECT r.name INTO user_role
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = $1
    AND ur.is_active = TRUE
  LIMIT 1;
  
  -- MÉTHODE 2: Si non trouvé, vérifier dans profiles.role (ancienne architecture)
  IF user_role IS NULL THEN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE user_id = $1
    LIMIT 1;
  END IF;
  
  -- Vérifier si le rôle a la permission d'inviter
  IF user_role IN ('tenant_admin', 'manager', 'hr_manager') THEN
    has_permission := TRUE;
  END IF;
  
  RETURN has_permission;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, refuser l'accès par sécurité
    RETURN FALSE;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.can_invite_collaborators(UUID) IS 
'Vérifie si un utilisateur a les permissions pour inviter des collaborateurs. Rôles autorisés: tenant_admin, manager, hr_manager';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.can_invite_collaborators(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_invite_collaborators(UUID) TO service_role;

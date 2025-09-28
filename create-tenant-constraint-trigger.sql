-- Script pour créer un trigger qui valide la contrainte tenant_id
-- À exécuter APRÈS 01_create_invitations_system.sql

-- Fonction de validation pour la contrainte tenant_id
CREATE OR REPLACE FUNCTION validate_tenant_or_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Si tenant_id est NULL, vérifier que l'utilisateur est Super Admin
  IF NEW.tenant_id IS NULL THEN
    -- Vérifier d'abord si c'est un INSERT et si le rôle super_admin sera assigné
    -- Dans ce cas, on permet la création du profil
    IF TG_OP = 'INSERT' THEN
      -- Pour les nouveaux profils, on permet temporairement tenant_id NULL
      -- La validation se fera lors de l'assignation du rôle
      RETURN NEW;
    END IF;
    
    -- Pour les UPDATE, vérifier que l'utilisateur a le rôle super_admin
    IF NOT EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = NEW.user_id
        AND r.name = 'super_admin'
        AND ur.is_active = true
    ) THEN
      RAISE EXCEPTION 'Un utilisateur doit avoir un tenant_id sauf s''il est Super Admin';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table profiles
CREATE TRIGGER trigger_validate_tenant_or_super_admin
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_tenant_or_super_admin();

COMMENT ON FUNCTION validate_tenant_or_super_admin() IS 
'Valide que seuls les Super Admin peuvent avoir tenant_id NULL';

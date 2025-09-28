-- Système automatique de création de tenant à la première connexion
-- Ce trigger se déclenche quand un utilisateur se connecte pour la première fois

-- 1. Fonction pour créer automatiquement un tenant owner à la première connexion
CREATE OR REPLACE FUNCTION auto_create_tenant_owner()
RETURNS TRIGGER AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  created_employee_id UUID;
  employee_id_counter INTEGER;
  generated_employee_id TEXT;
  company_name TEXT;
BEGIN
  -- Vérifier si l'utilisateur a déjà un profil (pas première connexion)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Chercher une invitation en attente pour cet email
  SELECT * INTO invitation_data
  FROM public.invitations
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
    AND invitation_type = 'tenant_owner';
    
  -- Si pas d'invitation tenant_owner, ne rien faire
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Récupérer l'ID du rôle tenant_admin
  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Rôle tenant_admin non trouvé';
  END IF;

  -- Extraire le nom de l'entreprise depuis les métadonnées ou utiliser un défaut
  company_name := COALESCE(
    invitation_data.metadata->>'company_name',
    invitation_data.full_name || ' Company'
  );

  -- Créer le tenant avec l'ID de l'invitation
  INSERT INTO public.tenants (
    id,
    name,
    status,
    created_at,
    updated_at
  ) VALUES (
    invitation_data.tenant_id,
    company_name,
    'active',
    now(),
    now()
  );

  -- Créer le profil utilisateur
  INSERT INTO public.profiles (
    user_id,
    tenant_id,
    full_name,
    email,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    invitation_data.tenant_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', invitation_data.full_name),
    NEW.email,
    'tenant_admin',
    now(),
    now()
  );

  -- Assigner le rôle tenant_admin à l'utilisateur
  INSERT INTO public.user_roles (
    user_id,
    role_id,
    tenant_id,
    is_active,
    created_at
  ) VALUES (
    NEW.id,
    tenant_admin_role_id,
    invitation_data.tenant_id,
    true,
    now()
  );

  -- Générer un employee_id unique pour ce tenant
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1
  INTO employee_id_counter
  FROM public.employees 
  WHERE tenant_id = invitation_data.tenant_id 
    AND employee_id ~ '^EMP[0-9]+$';
  
  generated_employee_id := 'EMP' || LPAD(employee_id_counter::TEXT, 3, '0');

  -- Créer l'enregistrement employé pour le tenant owner
  INSERT INTO public.employees (
    user_id,
    employee_id,
    full_name,
    email,
    job_title,
    hire_date,
    contract_type,
    status,
    tenant_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    generated_employee_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', invitation_data.full_name),
    NEW.email,
    'Directeur Général',
    CURRENT_DATE,
    'CDI',
    'active',
    invitation_data.tenant_id,
    now(),
    now()
  );

  -- Marquer l'invitation comme acceptée
  UPDATE public.invitations
  SET 
    status = 'accepted',
    accepted_at = now(),
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{completed_by}',
      to_jsonb(NEW.id)
    )
  WHERE id = invitation_data.id;

  -- Log de succès
  RAISE NOTICE 'Tenant owner créé automatiquement: user_id=%, tenant_id=%, company=%', 
    NEW.id, invitation_data.tenant_id, company_name;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log de l'erreur mais ne pas bloquer la connexion
    RAISE WARNING 'Erreur création automatique tenant owner: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Créer le trigger sur auth.users (déclenché à chaque INSERT)
DROP TRIGGER IF EXISTS auto_tenant_creation_trigger ON auth.users;

CREATE TRIGGER auto_tenant_creation_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tenant_owner();

-- 3. Fonction pour vérifier si un utilisateur est un tenant owner en attente
CREATE OR REPLACE FUNCTION is_pending_tenant_owner(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.invitations
    WHERE email = user_email
      AND status = 'pending'
      AND expires_at > now()
      AND invitation_type = 'tenant_owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour obtenir les infos d'invitation d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_invitation_info(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  invitation_data RECORD;
BEGIN
  SELECT * INTO invitation_data
  FROM public.invitations
  WHERE email = user_email
    AND status = 'pending'
    AND expires_at > now()
    AND invitation_type = 'tenant_owner'
  LIMIT 1;
    
  IF NOT FOUND THEN
    RETURN json_build_object('found', false);
  END IF;
  
  RETURN json_build_object(
    'found', true,
    'full_name', invitation_data.full_name,
    'tenant_id', invitation_data.tenant_id,
    'invitation_type', invitation_data.invitation_type,
    'expires_at', invitation_data.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION is_pending_tenant_owner TO authenticated;
GRANT EXECUTE ON FUNCTION is_pending_tenant_owner TO anon;
GRANT EXECUTE ON FUNCTION get_user_invitation_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_invitation_info TO anon;

-- Commentaires d'utilisation
COMMENT ON FUNCTION auto_create_tenant_owner IS 'Crée automatiquement un tenant owner à la première connexion si invitation valide';
COMMENT ON FUNCTION is_pending_tenant_owner IS 'Vérifie si un email a une invitation tenant_owner en attente';
COMMENT ON FUNCTION get_user_invitation_info IS 'Récupère les informations d''invitation pour un email donné';

-- Instructions d'utilisation :
-- 1. Ce trigger se déclenche automatiquement quand un utilisateur se connecte pour la première fois
-- 2. Il vérifie s'il y a une invitation tenant_owner valide pour cet email
-- 3. Si oui, il crée automatiquement : tenant, profil, rôles, employé
-- 4. L'utilisateur est directement opérationnel après sa première connexion

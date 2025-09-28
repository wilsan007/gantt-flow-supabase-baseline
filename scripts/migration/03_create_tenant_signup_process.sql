-- Migration 03: Processus d'inscription tenant owner
-- Fonctions pour gérer l'inscription des tenant owners via invitation

-- 1. Fonction pour créer un tenant owner complet
CREATE OR REPLACE FUNCTION create_tenant_owner_from_invitation(
  invitation_token TEXT,
  user_id UUID,
  company_name TEXT,
  company_slug TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  created_tenant_id UUID;
  result JSON;
BEGIN
  -- Valider le token d'invitation
  SELECT * INTO invitation_data
  FROM public.invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now()
    AND invitation_type = 'tenant_owner';
    
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Token d''invitation invalide ou expiré');
  END IF;
  
  -- Récupérer l'ID du rôle tenant_admin
  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Rôle tenant_admin non trouvé');
  END IF;
  
  -- Générer le slug si non fourni
  IF company_slug IS NULL THEN
    company_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g'));
    company_slug := regexp_replace(company_slug, '-+', '-', 'g');
    company_slug := trim(company_slug, '-');
  END IF;
  
  -- Créer le tenant
  INSERT INTO public.tenants (
    id,
    name,
    slug,
    status,
    created_at,
    updated_at
  ) VALUES (
    invitation_data.tenant_id,
    company_name,
    company_slug,
    'active',
    now(),
    now()
  );
  
  created_tenant_id := invitation_data.tenant_id;
  
  -- Créer le profil utilisateur
  INSERT INTO public.profiles (
    user_id,
    tenant_id,
    full_name,
    email,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    created_tenant_id,
    invitation_data.full_name,
    invitation_data.email,
    now(),
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    tenant_id = created_tenant_id,
    full_name = invitation_data.full_name,
    email = invitation_data.email,
    updated_at = now();
  
  -- Assigner le rôle tenant_admin
  INSERT INTO public.user_roles (
    user_id,
    role_id,
    tenant_id,
    is_active,
    created_at
  ) VALUES (
    user_id,
    tenant_admin_role_id,
    created_tenant_id,
    true,
    now()
  ) ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE SET
    is_active = true,
    updated_at = now();
  
  -- Marquer l'invitation comme acceptée
  UPDATE public.invitations
  SET 
    status = 'accepted',
    accepted_at = now(),
    metadata = jsonb_build_object(
      'company_name', company_name,
      'company_slug', company_slug,
      'user_id', user_id
    )
  WHERE id = invitation_data.id;
  
  -- Retourner le résultat
  result := json_build_object(
    'success', true,
    'tenant_id', created_tenant_id,
    'tenant_name', company_name,
    'tenant_slug', company_slug,
    'user_id', user_id,
    'role', 'tenant_admin'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Erreur lors de la création: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonction pour valider un token et récupérer les infos
CREATE OR REPLACE FUNCTION get_invitation_info(invitation_token TEXT)
RETURNS JSON AS $$
DECLARE
  invitation_data RECORD;
BEGIN
  SELECT 
    id,
    email,
    full_name,
    tenant_id,
    invitation_type,
    status,
    expires_at,
    created_at
  INTO invitation_data
  FROM public.invitations
  WHERE token = invitation_token;
  
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Token non trouvé');
  END IF;
  
  IF invitation_data.status != 'pending' THEN
    RETURN json_build_object(
      'valid', false, 
      'error', 'Invitation déjà utilisée ou annulée',
      'status', invitation_data.status
    );
  END IF;
  
  IF invitation_data.expires_at <= now() THEN
    RETURN json_build_object('valid', false, 'error', 'Invitation expirée');
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'email', invitation_data.email,
    'full_name', invitation_data.full_name,
    'tenant_id', invitation_data.tenant_id,
    'invitation_type', invitation_data.invitation_type,
    'expires_at', invitation_data.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction pour générer un slug unique
CREATE OR REPLACE FUNCTION generate_unique_tenant_slug(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Nettoyer le nom de base
  base_slug := lower(regexp_replace(base_name, '[^a-zA-Z0-9]', '-', 'g'));
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  -- Limiter la longueur
  base_slug := substring(base_slug, 1, 50);
  
  final_slug := base_slug;
  
  -- Vérifier l'unicité et ajouter un numéro si nécessaire
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger pour générer automatiquement le slug des tenants
CREATE OR REPLACE FUNCTION generate_tenant_slug_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_unique_tenant_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_slug_trigger
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION generate_tenant_slug_trigger();

-- 5. Fonction pour nettoyer les invitations expirées
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE public.invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at <= now();
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Commentaires pour documentation
COMMENT ON FUNCTION create_tenant_owner_from_invitation IS 'Crée un tenant owner complet à partir d''une invitation valide';
COMMENT ON FUNCTION get_invitation_info IS 'Récupère et valide les informations d''une invitation';
COMMENT ON FUNCTION generate_unique_tenant_slug IS 'Génère un slug unique pour un tenant';
COMMENT ON FUNCTION cleanup_expired_invitations IS 'Marque les invitations expirées comme expirées';

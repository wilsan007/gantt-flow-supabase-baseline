-- Corriger l'erreur "column reference user_id is ambiguous" dans create_tenant_owner_from_invitation
-- Le problème vient du ON CONFLICT qui référence user_id sans qualifier la table

-- Recréer la fonction avec la correction
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
  
  -- Assigner le rôle tenant_admin (CORRECTION: ajouter tenant_id dans ON CONFLICT)
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

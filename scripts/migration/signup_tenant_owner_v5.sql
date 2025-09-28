-- Fonction finale pour l'inscription d'un tenant owner avec user_id passé en paramètre
-- Cette fonction est appelée après la création du compte via supabase.auth.signUp()

CREATE OR REPLACE FUNCTION signup_tenant_owner_v5(
  invitation_token TEXT,
  user_email TEXT,
  user_full_name TEXT,
  company_name TEXT,
  user_id UUID
)
RETURNS JSON AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
BEGIN
  -- 1. Valider le token d'invitation
  SELECT * INTO invitation_data
  FROM public.invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now()
    AND invitation_type = 'tenant_owner';
    
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Token d''invitation invalide ou expiré'
    );
  END IF;
  
  -- 2. Récupérer l'ID du rôle tenant_admin
  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Rôle tenant_admin non trouvé'
    );
  END IF;
  
  -- 3. Créer le tenant avec l'ID de l'invitation
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
  
  -- 4. Créer le profil utilisateur
  INSERT INTO public.profiles (
    user_id,
    tenant_id,
    full_name,
    email,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    invitation_data.tenant_id,
    user_full_name,
    user_email,
    now(),
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    tenant_id = invitation_data.tenant_id,
    full_name = user_full_name,
    email = user_email,
    updated_at = now();
  
  -- 5. Assigner le rôle tenant_admin à l'utilisateur
  INSERT INTO public.user_roles (
    user_id,
    role_id,
    tenant_id,
    is_active,
    created_at
  ) VALUES (
    user_id,
    tenant_admin_role_id,
    invitation_data.tenant_id,
    true,
    now()
  ) ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE SET
    is_active = true,
    updated_at = now();
  
  -- 6. Marquer l'invitation comme acceptée
  UPDATE public.invitations
  SET 
    status = 'accepted',
    accepted_at = now(),
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{completed_by}',
      to_jsonb(user_id)
    )
  WHERE id = invitation_data.id;
  
  -- 7. Retourner le résultat de succès
  RETURN json_build_object(
    'success', true,
    'message', 'Inscription réussie',
    'user_id', user_id,
    'tenant_id', invitation_data.tenant_id,
    'tenant_name', company_name,
    'email', user_email
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Gestion des erreurs avec rollback automatique
    RETURN json_build_object(
      'success', false, 
      'error', 'Erreur lors de la finalisation de l''inscription: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION signup_tenant_owner_v5 TO authenticated;
GRANT EXECUTE ON FUNCTION signup_tenant_owner_v5 TO anon;

-- Commentaire d'utilisation :
-- Cette fonction accepte l'user_id en paramètre, ce qui permet de l'utiliser
-- même si l'utilisateur n'est pas encore connecté (session pas encore établie).

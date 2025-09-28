-- Fonction finale pour l'inscription d'un tenant owner avec Supabase Auth
-- Cette fonction est appelée après que l'utilisateur soit authentifié via le token de confirmation

CREATE OR REPLACE FUNCTION signup_tenant_owner_v4(
  invitation_token TEXT,
  user_email TEXT,
  user_full_name TEXT,
  company_name TEXT
)
RETURNS JSON AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  current_user_id UUID;
BEGIN
  -- 1. Récupérer l'utilisateur authentifié (doit être connecté via Supabase Auth)
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Utilisateur non authentifié. Veuillez vous connecter d''abord.'
    );
  END IF;
  
  -- 2. Valider le token d'invitation
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
  
  -- 3. Récupérer l'ID du rôle tenant_admin
  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Rôle tenant_admin non trouvé'
    );
  END IF;
  
  -- 4. Créer le tenant avec l'ID de l'invitation
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
  
  -- 5. Créer ou mettre à jour le profil utilisateur
  INSERT INTO public.profiles (
    user_id,
    tenant_id,
    full_name,
    email,
    created_at,
    updated_at
  ) VALUES (
    current_user_id,
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
  
  -- 6. Assigner le rôle tenant_admin à l'utilisateur
  INSERT INTO public.user_roles (
    user_id,
    role_id,
    tenant_id,
    is_active,
    created_at
  ) VALUES (
    current_user_id,
    tenant_admin_role_id,
    invitation_data.tenant_id,
    true,
    now()
  ) ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE SET
    is_active = true,
    updated_at = now();
  
  -- 7. Marquer l'invitation comme acceptée
  UPDATE public.invitations
  SET 
    status = 'accepted',
    accepted_at = now(),
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{completed_by}',
      to_jsonb(current_user_id)
    )
  WHERE id = invitation_data.id;
  
  -- 8. Retourner le résultat de succès
  RETURN json_build_object(
    'success', true,
    'message', 'Inscription réussie',
    'user_id', current_user_id,
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
GRANT EXECUTE ON FUNCTION signup_tenant_owner_v4 TO authenticated;

-- Commentaire d'utilisation :
-- Cette fonction doit être appelée après que l'utilisateur ait cliqué sur le lien d'invitation
-- et se soit connecté avec Supabase Auth. Elle finalise l'inscription en créant le tenant,
-- le profil et en assignant les rôles appropriés.

-- Fonction signup_tenant_owner pour l'inscription complète via invitation
-- Cette fonction gère l'inscription d'un tenant owner avec création d'utilisateur et tenant

CREATE OR REPLACE FUNCTION signup_tenant_owner(
  invitation_token TEXT,
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT,
  company_name TEXT
)
RETURNS JSON AS $$
DECLARE
  invitation_data RECORD;
  new_user_id UUID;
  auth_result RECORD;
  tenant_result JSON;
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
  
  -- 2. Créer l'utilisateur dans auth.users
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    gen_random_uuid(),
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    json_build_object('full_name', user_full_name)
  )
  RETURNING id INTO new_user_id;
  
  -- 3. Créer le tenant owner complet
  SELECT create_tenant_owner_from_invitation(
    invitation_token,
    new_user_id,
    company_name
  ) INTO tenant_result;
  
  -- 4. Vérifier le succès
  IF (tenant_result->>'success')::boolean = false THEN
    -- Supprimer l'utilisateur créé en cas d'échec
    DELETE FROM auth.users WHERE id = new_user_id;
    RETURN tenant_result;
  END IF;
  
  -- 5. Retourner le résultat complet
  RETURN json_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', user_email,
    'tenant_id', tenant_result->>'tenant_id',
    'tenant_name', company_name,
    'message', 'Inscription réussie'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Nettoyer en cas d'erreur
    IF new_user_id IS NOT NULL THEN
      DELETE FROM auth.users WHERE id = new_user_id;
    END IF;
    
    RETURN json_build_object(
      'success', false, 
      'error', 'Erreur lors de l''inscription: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION signup_tenant_owner TO anon, authenticated;

-- Commentaire pour documentation
COMMENT ON FUNCTION signup_tenant_owner IS 'Inscription complète d''un tenant owner via invitation avec création d''utilisateur et tenant';

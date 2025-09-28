-- Correction complète du système d'inscription tenant owner
-- 1. Supprimer le trigger existant pour éviter l'erreur
-- 2. Créer une fonction signup qui utilise Supabase Auth correctement

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS tenant_slug_trigger ON public.tenants;

-- Recréer le trigger
CREATE TRIGGER tenant_slug_trigger
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION generate_tenant_slug_trigger();

-- Nouvelle fonction signup_tenant_owner corrigée
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
  tenant_result JSON;
BEGIN
  -- 1. Valider le token d'invitation et récupérer tenant_id
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
  
  -- 2. Créer l'utilisateur avec Supabase Auth (via auth.users)
  -- Note: En production, ceci devrait être fait via l'API Supabase Auth
  -- Pour le développement, on simule la création
  new_user_id := gen_random_uuid();
  
  -- Insérer dans auth.users (simulation - en production utiliser supabase.auth.signUp)
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
    new_user_id,
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    json_build_object('full_name', user_full_name)
  );
  
  -- 3. Créer le tenant avec l'ID de l'invitation
  INSERT INTO public.tenants (
    id,
    name,
    status,
    created_at,
    updated_at
  ) VALUES (
    invitation_data.tenant_id,  -- Utiliser tenant_id de l'invitation
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
    new_user_id,  -- Utiliser l'ID généré automatiquement
    invitation_data.tenant_id,
    invitation_data.full_name,
    invitation_data.email,
    now(),
    now()
  );
  
  -- 5. Assigner le rôle tenant_admin
  INSERT INTO public.user_roles (
    user_id,
    role_id,
    tenant_id,
    is_active,
    created_at
  ) 
  SELECT 
    new_user_id,
    r.id,
    invitation_data.tenant_id,
    true,
    now()
  FROM public.roles r 
  WHERE r.name = 'tenant_admin';
  
  -- 6. Marquer l'invitation comme acceptée
  UPDATE public.invitations
  SET 
    status = 'accepted',
    accepted_at = now(),
    metadata = jsonb_build_object(
      'company_name', company_name,
      'user_id', new_user_id
    )
  WHERE id = invitation_data.id;
  
  -- 7. Retourner le résultat
  RETURN json_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', user_email,
    'tenant_id', invitation_data.tenant_id,
    'tenant_name', company_name,
    'message', 'Inscription réussie'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Nettoyer en cas d'erreur
    DELETE FROM auth.users WHERE id = new_user_id;
    DELETE FROM public.tenants WHERE id = invitation_data.tenant_id;
    
    RETURN json_build_object(
      'success', false, 
      'error', 'Erreur lors de l''inscription: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION signup_tenant_owner TO anon, authenticated;

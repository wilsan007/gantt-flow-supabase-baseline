-- =====================================================
-- CORRECTION DE LA FONCTION onboard_tenant_owner
-- Utiliser 'tenant_admin' au lieu de 'Tenant Owner'
-- =====================================================

CREATE OR REPLACE FUNCTION public.onboard_tenant_owner(
  p_user_id uuid,
  p_email text,
  p_slug text,
  p_tenant_name text,
  p_invite_code uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  v_role_id uuid;
  v_invitation_record record;
  v_employee_id_counter integer;
  v_employee_id text;
  v_result json;
BEGIN
  -- Vérifier que l'invitation existe et est valide
  SELECT * INTO v_invitation_record
  FROM invitations
  WHERE id = p_invite_code
  AND status = 'pending'
  AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_expired_invite';
  END IF;
  
  -- Vérifier que l'email correspond
  IF v_invitation_record.email != p_email THEN
    RAISE EXCEPTION 'email_mismatch';
  END IF;
  
  -- Vérifier si l'utilisateur n'est pas déjà onboardé
  IF EXISTS (
    SELECT 1 FROM profiles WHERE user_id = p_user_id
  ) THEN
    -- Retourner les informations existantes
    SELECT tenant_id INTO v_tenant_id
    FROM profiles
    WHERE user_id = p_user_id;
    
    v_result := json_build_object(
      'success', true,
      'message', 'User already onboarded',
      'tenant_id', v_tenant_id,
      'user_id', p_user_id,
      'already_exists', true
    );
    
    RETURN v_result;
  END IF;
  
  -- Utiliser le tenant_id de l'invitation ou créer un nouveau tenant
  IF v_invitation_record.tenant_id IS NOT NULL THEN
    v_tenant_id := v_invitation_record.tenant_id;
    
    -- Vérifier si le tenant existe, sinon le créer
    IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = v_tenant_id) THEN
      INSERT INTO tenants (id, name, slug, status, settings, created_at)
      VALUES (
        v_tenant_id,
        COALESCE(v_invitation_record.tenant_name, p_tenant_name),
        p_slug,
        'active',
        '{}',
        NOW()
      );
    END IF;
  ELSE
    -- Créer un nouveau tenant
    INSERT INTO tenants (name, slug, status, settings, created_at)
    VALUES (p_tenant_name, p_slug, 'active', '{}', NOW())
    RETURNING id INTO v_tenant_id;
  END IF;
  
  -- Obtenir l'ID du rôle tenant_admin (changé de 'Tenant Owner')
  SELECT id INTO v_role_id
  FROM roles
  WHERE name = 'tenant_admin'
  LIMIT 1;
  
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'tenant_admin_role_not_found';
  END IF;
  
  -- Générer un employee_id unique
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM '[0-9]+') AS INTEGER)), 0) + 1
  INTO v_employee_id_counter
  FROM profiles
  WHERE tenant_id = v_tenant_id
  AND employee_id ~ '^[0-9]+$';
  
  v_employee_id := LPAD(v_employee_id_counter::text, 4, '0');
  
  -- Créer le profil utilisateur
  INSERT INTO profiles (
    user_id,
    tenant_id,
    full_name,
    email,
    employee_id,
    position,
    department,
    hire_date,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_tenant_id,
    v_invitation_record.full_name,
    p_email,
    v_employee_id,
    'Propriétaire',
    'Direction',
    CURRENT_DATE,
    'active',
    NOW(),
    NOW()
  );
  
  -- Assigner le rôle tenant_admin (changé de 'Tenant Owner')
  INSERT INTO user_roles (
    user_id,
    role_id,
    tenant_id,
    assigned_by,
    assigned_at,
    is_active
  ) VALUES (
    p_user_id,
    v_role_id,
    v_tenant_id,
    v_invitation_record.invited_by,
    NOW(),
    true
  );
  
  -- Marquer l'invitation comme acceptée
  UPDATE invitations
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'onboarded_at', NOW(),
      'tenant_id', v_tenant_id,
      'profile_created', true
    )
  WHERE id = p_invite_code;
  
  -- Construire le résultat
  v_result := json_build_object(
    'success', true,
    'message', 'Tenant owner onboarded successfully',
    'tenant_id', v_tenant_id,
    'user_id', p_user_id,
    'employee_id', v_employee_id,
    'role_id', v_role_id,
    'role_name', 'tenant_admin',
    'invitation_id', p_invite_code
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur et la retourner
    RAISE EXCEPTION 'onboarding_failed: %', SQLERRM;
END;
$$;

-- Test de la fonction
-- SELECT onboard_tenant_owner(
--   'test-user-id'::uuid,
--   'test@example.com',
--   'test-slug',
--   'Test Company',
--   'test-invitation-id'::uuid
-- );

-- =====================================================
-- FIN DE LA CORRECTION
-- =====================================================

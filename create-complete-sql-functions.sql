-- =====================================================
-- FONCTIONS SQL COMPLÈTES POUR LE SYSTÈME D'ONBOARDING
-- À exécuter dans Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. FONCTION is_super_admin
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = $1 
    AND r.name = 'Super Admin'
    AND ur.is_active = true
  );
END;
$$;

-- 2. FONCTION onboard_tenant_owner (version complète)
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
  
  -- Obtenir l'ID du rôle Tenant Owner
  SELECT id INTO v_role_id
  FROM roles
  WHERE name = 'Tenant Owner'
  LIMIT 1;
  
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'tenant_owner_role_not_found';
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
  
  -- Assigner le rôle Tenant Owner
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
    'invitation_id', p_invite_code
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur et la retourner
    RAISE EXCEPTION 'onboarding_failed: %', SQLERRM;
END;
$$;

-- 3. FONCTION get_user_tenant_info
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_tenant_info(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'user_id', p.user_id,
    'tenant_id', p.tenant_id,
    'tenant_name', t.name,
    'tenant_slug', t.slug,
    'full_name', p.full_name,
    'email', p.email,
    'employee_id', p.employee_id,
    'position', p.position,
    'roles', (
      SELECT json_agg(
        json_build_object(
          'role_id', r.id,
          'role_name', r.name,
          'permissions', r.permissions
        )
      )
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = p.user_id
      AND ur.is_active = true
    )
  ) INTO v_result
  FROM profiles p
  JOIN tenants t ON p.tenant_id = t.id
  WHERE p.user_id = $1;
  
  RETURN COALESCE(v_result, '{}'::json);
END;
$$;

-- 4. FONCTION validate_invitation
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_invitation(invite_code uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation record;
  v_result json;
BEGIN
  SELECT * INTO v_invitation
  FROM invitations
  WHERE id = invite_code;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'invitation_not_found'
    );
  END IF;
  
  IF v_invitation.status != 'pending' THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'invitation_already_used',
      'status', v_invitation.status
    );
  END IF;
  
  IF v_invitation.expires_at < NOW() THEN
    -- Marquer comme expirée
    UPDATE invitations
    SET status = 'expired'
    WHERE id = invite_code;
    
    RETURN json_build_object(
      'valid', false,
      'error', 'invitation_expired'
    );
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'invitation', json_build_object(
      'id', v_invitation.id,
      'email', v_invitation.email,
      'full_name', v_invitation.full_name,
      'tenant_name', v_invitation.tenant_name,
      'invitation_type', v_invitation.invitation_type,
      'expires_at', v_invitation.expires_at
    )
  );
END;
$$;

-- 5. FONCTION cleanup_expired_invitations
-- =====================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- 6. PERMISSIONS ET SÉCURITÉ
-- =====================================================

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.onboard_tenant_owner(uuid, text, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invitation(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_invitations() TO service_role;

-- Commentaires pour la documentation
COMMENT ON FUNCTION public.is_super_admin(uuid) IS 'Vérifie si un utilisateur a le rôle Super Admin';
COMMENT ON FUNCTION public.onboard_tenant_owner(uuid, text, text, text, uuid) IS 'Finalise l''onboarding d''un propriétaire de tenant';
COMMENT ON FUNCTION public.get_user_tenant_info(uuid) IS 'Récupère les informations complètes d''un utilisateur et son tenant';
COMMENT ON FUNCTION public.validate_invitation(uuid) IS 'Valide une invitation et retourne ses détails';
COMMENT ON FUNCTION public.cleanup_expired_invitations() IS 'Marque les invitations expirées comme telles';

-- =====================================================
-- FIN DES FONCTIONS SQL
-- =====================================================

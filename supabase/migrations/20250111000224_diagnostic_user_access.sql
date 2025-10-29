-- Migration 224: Fonction de diagnostic utilisateur
-- Date: 2025-01-11
-- Description: Diagnostic complet de l'accès RLS pour un utilisateur
-- Usage: SELECT * FROM diagnose_user_access('5c5731ce-75d0-4455-8184-bc42c626cb17');

BEGIN;

-- ============================================
-- FONCTION DE DIAGNOSTIC UTILISATEUR
-- ============================================

CREATE OR REPLACE FUNCTION public.diagnose_user_access(p_user_id UUID)
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_email TEXT;
  v_user_metadata JSONB;
  v_profile_exists BOOLEAN;
  v_user_roles_count INTEGER;
  v_employee_exists BOOLEAN;
  v_tenant_id UUID;
  v_is_super_admin BOOLEAN;
BEGIN
  -- 1. Vérifier l'utilisateur dans auth.users
  SELECT email, raw_user_meta_data 
  INTO v_user_email, v_user_metadata
  FROM auth.users 
  WHERE id = p_user_id;
  
  IF v_user_email IS NULL THEN
    RETURN QUERY SELECT 
      'AUTH_USER'::TEXT,
      'ERROR'::TEXT,
      jsonb_build_object('message', 'Utilisateur non trouvé dans auth.users');
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    'AUTH_USER'::TEXT,
    'OK'::TEXT,
    jsonb_build_object(
      'email', v_user_email,
      'metadata', v_user_metadata
    );
  
  -- 2. Vérifier le profil
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = p_user_id)
  INTO v_profile_exists;
  
  IF v_profile_exists THEN
    RETURN QUERY SELECT 
      'PROFILE'::TEXT,
      'OK'::TEXT,
      (SELECT jsonb_build_object(
        'role', role,
        'full_name', full_name
      ) FROM public.profiles WHERE user_id = p_user_id);
  ELSE
    RETURN QUERY SELECT 
      'PROFILE'::TEXT,
      'MISSING'::TEXT,
      jsonb_build_object('message', 'Aucun profil trouvé - PROBLÈME RLS');
  END IF;
  
  -- 3. Vérifier user_roles
  SELECT COUNT(*) INTO v_user_roles_count
  FROM public.user_roles WHERE user_id = p_user_id;
  
  IF v_user_roles_count > 0 THEN
    RETURN QUERY SELECT 
      'USER_ROLES'::TEXT,
      'OK'::TEXT,
      (SELECT jsonb_agg(jsonb_build_object(
        'role', role,
        'tenant_id', tenant_id
      )) FROM public.user_roles WHERE user_id = p_user_id);
  ELSE
    RETURN QUERY SELECT 
      'USER_ROLES'::TEXT,
      'MISSING'::TEXT,
      jsonb_build_object('message', 'Aucun rôle assigné - PROBLÈME CRITIQUE');
  END IF;
  
  -- 4. Vérifier employee
  SELECT EXISTS(SELECT 1 FROM public.employees WHERE user_id = p_user_id)
  INTO v_employee_exists;
  
  IF v_employee_exists THEN
    RETURN QUERY SELECT 
      'EMPLOYEE'::TEXT,
      'OK'::TEXT,
      (SELECT jsonb_build_object(
        'employee_id', employee_id,
        'tenant_id', tenant_id,
        'status', status
      ) FROM public.employees WHERE user_id = p_user_id LIMIT 1);
  ELSE
    RETURN QUERY SELECT 
      'EMPLOYEE'::TEXT,
      'MISSING'::TEXT,
      jsonb_build_object('message', 'Aucun employé trouvé');
  END IF;
  
  -- 5. Vérifier tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM public.user_roles 
  WHERE user_id = p_user_id 
  LIMIT 1;
  
  IF v_tenant_id IS NOT NULL THEN
    RETURN QUERY SELECT 
      'TENANT'::TEXT,
      'OK'::TEXT,
      (SELECT jsonb_build_object(
        'tenant_id', id,
        'tenant_name', name,
        'is_owner', owner_id = p_user_id
      ) FROM public.tenants WHERE id = v_tenant_id);
  ELSE
    RETURN QUERY SELECT 
      'TENANT'::TEXT,
      'MISSING'::TEXT,
      jsonb_build_object('message', 'Aucun tenant associé');
  END IF;
  
  -- 6. Vérifier super admin
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id AND role = 'super_admin'
  ) INTO v_is_super_admin;
  
  RETURN QUERY SELECT 
    'SUPER_ADMIN'::TEXT,
    CASE WHEN v_is_super_admin THEN 'YES' ELSE 'NO' END::TEXT,
    jsonb_build_object('is_super_admin', v_is_super_admin);
  
  -- 7. Test d'accès aux tâches
  RETURN QUERY SELECT 
    'TASKS_ACCESS'::TEXT,
    'INFO'::TEXT,
    jsonb_build_object(
      'total_tasks', (SELECT COUNT(*) FROM public.tasks),
      'accessible_tasks', (
        SELECT COUNT(*) FROM public.tasks 
        WHERE tenant_id = v_tenant_id OR v_is_super_admin
      ),
      'message', CASE 
        WHEN v_tenant_id IS NULL AND NOT v_is_super_admin 
        THEN 'AUCUN ACCÈS - Pas de tenant ni super admin'
        WHEN v_is_super_admin 
        THEN 'ACCÈS COMPLET - Super Admin'
        ELSE 'ACCÈS LIMITÉ - Tenant ' || v_tenant_id::TEXT
      END
    );
  
  -- 8. Recommandations
  IF NOT v_profile_exists OR v_user_roles_count = 0 THEN
    RETURN QUERY SELECT 
      'RECOMMENDATION'::TEXT,
      'ACTION_REQUIRED'::TEXT,
      jsonb_build_object(
        'message', 'Utilisateur incomplet - Exécuter repair_incomplete_users()',
        'sql', format('SELECT repair_incomplete_users(''%s'');', p_user_id)
      );
  END IF;
  
END;
$$;

-- ============================================
-- EXÉCUTION DU DIAGNOSTIC
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔍 DIAGNOSTIC UTILISATEUR 5c5731ce-75d0-4455-8184-bc42c626cb17';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
END $$;

-- Afficher le diagnostic
SELECT 
  check_name,
  status,
  details
FROM diagnose_user_access('5c5731ce-75d0-4455-8184-bc42c626cb17');

COMMIT;

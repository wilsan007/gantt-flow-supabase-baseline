-- Migration 225: Correction de la logique d'accès utilisateur
-- Date: 2025-01-11
-- Description: Correction complète de la logique de récupération des rôles et permissions
-- Impact: Suit la vraie structure DB (profiles → user_roles → roles → role_permissions → permissions)

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔧 MIGRATION 225 - CORRECTION LOGIQUE ACCÈS UTILISATEUR';
  RAISE NOTICE '';
  RAISE NOTICE 'Flux correct: profiles → user_roles → roles → role_permissions → permissions';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- ============================================
-- FONCTION 1: Récupération du Tenant depuis Profiles
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_tenant_from_profile(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  -- Récupère le tenant_id depuis la table profiles
  SELECT tenant_id 
  FROM public.profiles 
  WHERE user_id = p_user_id
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_tenant_from_profile IS 
'Récupère le tenant_id depuis profiles.tenant_id pour un utilisateur donné';

-- ============================================
-- FONCTION 2: Récupération des Rôles (Corrigée)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_roles_complete(p_user_id UUID)
RETURNS TABLE (
  user_role_id UUID,
  user_id UUID,
  role_id UUID,
  role_name TEXT,
  role_description TEXT,
  tenant_id UUID,
  is_active BOOLEAN,
  assigned_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  -- Flux: user_roles → roles (via role_id)
  SELECT 
    ur.id as user_role_id,
    ur.user_id,
    ur.role_id,
    r.name as role_name,
    r.description as role_description,
    ur.tenant_id,
    ur.is_active,
    ur.assigned_at
  FROM public.user_roles ur
  INNER JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY ur.assigned_at DESC;
$$;

COMMENT ON FUNCTION public.get_user_roles_complete IS 
'Récupère tous les rôles actifs d''un utilisateur avec leurs détails depuis user_roles → roles';

-- ============================================
-- FONCTION 3: Récupération des Permissions (Corrigée)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_permissions_complete(p_user_id UUID)
RETURNS TABLE (
  permission_id UUID,
  permission_name TEXT,
  permission_description TEXT,
  permission_resource TEXT,
  permission_action TEXT,
  role_id UUID,
  role_name TEXT,
  tenant_id UUID
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  -- Flux complet: user_roles → roles → role_permissions → permissions
  SELECT DISTINCT
    p.id as permission_id,
    p.name as permission_name,
    p.description as permission_description,
    p.resource as permission_resource,
    p.action as permission_action,
    r.id as role_id,
    r.name as role_name,
    ur.tenant_id
  FROM public.user_roles ur
  INNER JOIN public.roles r ON ur.role_id = r.id
  INNER JOIN public.role_permissions rp ON r.id = rp.role_id
  INNER JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY p.resource, p.action, p.name;
$$;

COMMENT ON FUNCTION public.get_user_permissions_complete IS 
'Récupère toutes les permissions d''un utilisateur via: user_roles → roles → role_permissions → permissions';

-- ============================================
-- FONCTION 4: Vérification Permission Spécifique
-- ============================================

CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id UUID,
  p_permission_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Vérifier si l'utilisateur a la permission via le flux complet
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.roles r ON ur.role_id = r.id
    INNER JOIN public.role_permissions rp ON r.id = rp.role_id
    INNER JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND p.name = p_permission_name
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
END;
$$;

COMMENT ON FUNCTION public.user_has_permission IS 
'Vérifie si un utilisateur a une permission spécifique (flux complet)';

-- ============================================
-- FONCTION 5: Vérification Rôle (Corrigée)
-- ============================================

CREATE OR REPLACE FUNCTION public.user_has_role_corrected(
  p_user_id UUID,
  p_role_names TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Flux correct: user_roles → roles (via role_id, pas role directement)
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND r.name = ANY(p_role_names)
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
END;
$$;

COMMENT ON FUNCTION public.user_has_role_corrected IS 
'Vérifie si un utilisateur a un des rôles spécifiés (flux correct via role_id)';

-- ============================================
-- FONCTION 6: Diagnostic Complet Utilisateur (Mise à Jour)
-- ============================================

CREATE OR REPLACE FUNCTION public.diagnose_user_access_v2(p_user_id UUID)
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
  v_profile_tenant_id UUID;
  v_roles_count INTEGER;
  v_permissions_count INTEGER;
BEGIN
  -- 1. Vérifier auth.users
  SELECT email INTO v_user_email
  FROM auth.users WHERE id = p_user_id;
  
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
    jsonb_build_object('email', v_user_email);
  
  -- 2. Vérifier profiles et récupérer tenant_id
  SELECT tenant_id INTO v_profile_tenant_id
  FROM public.profiles WHERE user_id = p_user_id;
  
  IF v_profile_tenant_id IS NULL THEN
    RETURN QUERY SELECT 
      'PROFILE'::TEXT,
      'MISSING'::TEXT,
      jsonb_build_object('message', 'Aucun profil trouvé - PROBLÈME CRITIQUE');
  ELSE
    RETURN QUERY SELECT 
      'PROFILE'::TEXT,
      'OK'::TEXT,
      jsonb_build_object(
        'tenant_id', v_profile_tenant_id,
        'profile_data', (SELECT row_to_json(p.*) FROM public.profiles p WHERE p.user_id = p_user_id)
      );
  END IF;
  
  -- 3. Vérifier user_roles (via role_id)
  SELECT COUNT(*) INTO v_roles_count
  FROM public.user_roles ur
  INNER JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id AND ur.is_active = true;
  
  IF v_roles_count > 0 THEN
    RETURN QUERY SELECT 
      'USER_ROLES'::TEXT,
      'OK'::TEXT,
      jsonb_build_object(
        'roles_count', v_roles_count,
        'roles', (
          SELECT jsonb_agg(jsonb_build_object(
            'role_id', ur.role_id,
            'role_name', r.name,
            'tenant_id', ur.tenant_id
          ))
          FROM public.user_roles ur
          INNER JOIN public.roles r ON ur.role_id = r.id
          WHERE ur.user_id = p_user_id AND ur.is_active = true
        )
      );
  ELSE
    RETURN QUERY SELECT 
      'USER_ROLES'::TEXT,
      'MISSING'::TEXT,
      jsonb_build_object('message', 'Aucun rôle assigné - PROBLÈME CRITIQUE');
  END IF;
  
  -- 4. Vérifier permissions (flux complet)
  SELECT COUNT(DISTINCT p.id) INTO v_permissions_count
  FROM public.user_roles ur
  INNER JOIN public.roles r ON ur.role_id = r.id
  INNER JOIN public.role_permissions rp ON r.id = rp.role_id
  INNER JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = p_user_id AND ur.is_active = true;
  
  IF v_permissions_count > 0 THEN
    RETURN QUERY SELECT 
      'PERMISSIONS'::TEXT,
      'OK'::TEXT,
      jsonb_build_object(
        'permissions_count', v_permissions_count,
        'sample_permissions', (
          SELECT jsonb_agg(jsonb_build_object(
            'permission_name', p.name,
            'resource', p.resource,
            'action', p.action,
            'role_name', r.name
          ))
          FROM (
            SELECT DISTINCT p.name, p.resource, p.action, r.name
            FROM public.user_roles ur
            INNER JOIN public.roles r ON ur.role_id = r.id
            INNER JOIN public.role_permissions rp ON r.id = rp.role_id
            INNER JOIN public.permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = p_user_id AND ur.is_active = true
            LIMIT 5
          ) AS sub(name, resource, action, name)
        )
      );
  ELSE
    RETURN QUERY SELECT 
      'PERMISSIONS'::TEXT,
      'MISSING'::TEXT,
      jsonb_build_object('message', 'Aucune permission trouvée');
  END IF;
  
  -- 5. Recommandations
  IF v_profile_tenant_id IS NULL OR v_roles_count = 0 THEN
    RETURN QUERY SELECT 
      'RECOMMENDATION'::TEXT,
      'ACTION_REQUIRED'::TEXT,
      jsonb_build_object(
        'message', 'Utilisateur incomplet - Données manquantes',
        'missing', jsonb_build_object(
          'profile', v_profile_tenant_id IS NULL,
          'roles', v_roles_count = 0,
          'permissions', v_permissions_count = 0
        )
      );
  ELSE
    RETURN QUERY SELECT 
      'RECOMMENDATION'::TEXT,
      'OK'::TEXT,
      jsonb_build_object('message', 'Utilisateur complet et fonctionnel');
  END IF;
  
END;
$$;

COMMENT ON FUNCTION public.diagnose_user_access_v2 IS 
'Diagnostic complet v2 avec flux correct: profiles → user_roles → roles → role_permissions → permissions';

-- ============================================
-- RÉSUMÉ ET TEST
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fonctions créées/mises à jour:';
  RAISE NOTICE '   1. get_user_tenant_from_profile() - Récupère tenant depuis profiles';
  RAISE NOTICE '   2. get_user_roles_complete() - Rôles via user_roles.role_id → roles';
  RAISE NOTICE '   3. get_user_permissions_complete() - Permissions via flux complet';
  RAISE NOTICE '   4. user_has_permission() - Vérification permission spécifique';
  RAISE NOTICE '   5. user_has_role_corrected() - Vérification rôle (flux correct)';
  RAISE NOTICE '   6. diagnose_user_access_v2() - Diagnostic complet v2';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Flux de Données Correct:';
  RAISE NOTICE '   profiles.user_id → profiles.tenant_id';
  RAISE NOTICE '   user_roles.user_id → user_roles.role_id → roles.name';
  RAISE NOTICE '   roles.id → role_permissions.role_id → role_permissions.permission_id';
  RAISE NOTICE '   permissions.id → permissions.name';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Test du diagnostic:';
  RAISE NOTICE '   SELECT * FROM diagnose_user_access_v2(''5c5731ce-75d0-4455-8184-bc42c626cb17'');';
  RAISE NOTICE '';
END $$;

COMMIT;

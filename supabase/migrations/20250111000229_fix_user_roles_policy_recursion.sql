-- Migration 229: Correction de la boucle infinie dans les policies user_roles
-- Date: 2025-01-11
-- Problème: La policy user_roles appelle user_has_role() qui essaie de lire user_roles → boucle infinie
-- Solution: Policy simple basée uniquement sur user_id et tenant_id

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔧 MIGRATION 229 - CORRECTION BOUCLE INFINIE user_roles';
  RAISE NOTICE '';
  RAISE NOTICE 'Problème identifié:';
  RAISE NOTICE '  • Policy user_roles appelle user_has_role()';
  RAISE NOTICE '  • user_has_role() essaie de lire user_roles';
  RAISE NOTICE '  • Résultat: Boucle infinie → data: []';
  RAISE NOTICE '';
  RAISE NOTICE 'Solution:';
  RAISE NOTICE '  • Policy simple basée sur user_id uniquement';
  RAISE NOTICE '  • Pas d''appel récursif aux fonctions';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- ============================================
-- CORRECTION: Policy user_roles sans récursion
-- ============================================

DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (
    -- Simple: L'utilisateur peut voir ses propres rôles
    user_id = auth.uid()
  );

COMMENT ON POLICY "Users can view own roles" ON user_roles IS 
'Policy simplifiée sans récursion - Permet à chaque utilisateur de voir ses propres rôles';

-- ============================================
-- CORRECTION: Policy roles (lecture publique)
-- ============================================

DROP POLICY IF EXISTS "Users can view roles" ON roles;
CREATE POLICY "Users can view roles"
  ON roles FOR SELECT
  USING (
    -- Tous les utilisateurs authentifiés peuvent lire la table roles
    auth.uid() IS NOT NULL
  );

COMMENT ON POLICY "Users can view roles" ON roles IS 
'Permet à tous les utilisateurs authentifiés de lire les définitions de rôles';

-- ============================================
-- CORRECTION: Policy role_permissions (lecture publique)
-- ============================================

DROP POLICY IF EXISTS "Users can view role permissions" ON role_permissions;
CREATE POLICY "Users can view role permissions"
  ON role_permissions FOR SELECT
  USING (
    -- Tous les utilisateurs authentifiés peuvent lire les permissions
    auth.uid() IS NOT NULL
  );

COMMENT ON POLICY "Users can view role permissions" ON role_permissions IS 
'Permet à tous les utilisateurs authentifiés de lire les permissions des rôles';

-- ============================================
-- CORRECTION: Policy permissions (lecture publique)
-- ============================================

DROP POLICY IF EXISTS "Users can view permissions" ON permissions;
CREATE POLICY "Users can view permissions"
  ON permissions FOR SELECT
  USING (
    -- Tous les utilisateurs authentifiés peuvent lire les permissions
    auth.uid() IS NOT NULL
  );

COMMENT ON POLICY "Users can view permissions" ON permissions IS 
'Permet à tous les utilisateurs authentifiés de lire les définitions de permissions';

-- ============================================
-- RÉSUMÉ FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ MIGRATION 229 COMPLÉTÉE AVEC SUCCÈS';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policies Corrigées:';
  RAISE NOTICE '   • user_roles: Policy simple (user_id = auth.uid())';
  RAISE NOTICE '   • roles: Lecture publique pour utilisateurs authentifiés';
  RAISE NOTICE '   • role_permissions: Lecture publique pour utilisateurs authentifiés';
  RAISE NOTICE '   • permissions: Lecture publique pour utilisateurs authentifiés';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Résultat Attendu:';
  RAISE NOTICE '   • Utilisateurs peuvent lire leurs propres rôles';
  RAISE NOTICE '   • Plus de boucle infinie';
  RAISE NOTICE '   • Requête retourne les données correctes';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Test:';
  RAISE NOTICE '   SELECT * FROM user_roles WHERE user_id = auth.uid();';
  RAISE NOTICE '   → Devrait retourner les rôles de l''utilisateur';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

COMMIT;

-- Migration 213: Création fonction helper get_current_tenant_id()
-- Date: 2025-01-11
-- Description: Fonction helper pour remplacer current_setting() dans les policies
-- Impact: Base pour résoudre 100%% des avertissements "Auth RLS InitPlan"

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🎯 MIGRATION 213 - FONCTION HELPER get_current_tenant_id()';
  RAISE NOTICE '';
  RAISE NOTICE 'Cette fonction remplace current_setting() dans toutes les policies';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- ============================================
-- CRÉATION: Fonction helper get_current_tenant_id()
-- ============================================

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT current_setting('app.current_tenant_id', true)::uuid;
$$;

-- ============================================
-- MISE À JOUR: user_has_role() avec get_current_tenant_id()
-- ============================================

CREATE OR REPLACE FUNCTION public.user_has_role(role_names TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = (SELECT auth.uid())
      AND r.name = ANY(role_names)
      AND ur.tenant_id = public.get_current_tenant_id()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fonctions créées/mises à jour:';
  RAISE NOTICE '   • get_current_tenant_id() - Fonction helper STABLE';
  RAISE NOTICE '   • user_has_role() - Utilise maintenant get_current_tenant_id()';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Prochaine étape: Migrations 214-217 pour recréer les policies';
  RAISE NOTICE '';
END $$;

COMMIT;

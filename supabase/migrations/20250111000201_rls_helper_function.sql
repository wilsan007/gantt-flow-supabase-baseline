-- Migration: RLS Helper Function
-- Date: 2025-01-11
-- Description: Fonction helper pour vérifier les rôles utilisateur
-- Partie 1/3 de la configuration RLS

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '🔐 Création de la fonction helper RLS...';
END $$;

-- ============================================
-- FONCTION HELPER: Vérifier le rôle utilisateur
-- ============================================

-- Note: On utilise le schéma public au lieu de auth pour éviter les problèmes de permissions
CREATE OR REPLACE FUNCTION public.user_has_role(role_names TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name = ANY(role_names)
      AND ur.tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction alternative sans tenant_id (pour Super Admin)
CREATE OR REPLACE FUNCTION public.user_has_role_any_tenant(role_names TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name = ANY(role_names)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fonctions helper créées:';
  RAISE NOTICE '   • public.user_has_role(role_names)';
  RAISE NOTICE '   • public.user_has_role_any_tenant(role_names)';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Utilisation:';
  RAISE NOTICE '   WHERE public.user_has_role(ARRAY[''hr_admin'', ''tenant_admin''])';
  RAISE NOTICE '';
END $$;

COMMIT;

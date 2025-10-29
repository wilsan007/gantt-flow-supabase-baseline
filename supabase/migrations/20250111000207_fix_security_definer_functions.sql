-- Migration: Correction SECURITY DEFINER - Fonctions au lieu de Vues
-- Date: 2025-01-11
-- Description: Si les "vues" sont en fait des fonctions, les recréer sans SECURITY DEFINER
-- Référence: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '🔍 Diagnostic des objets onboarding_metrics et invitation_status_summary...';
  RAISE NOTICE '';
END $$;

-- ============================================
-- DIAGNOSTIC: Vérifier le type des objets
-- ============================================

DO $$
DECLARE
  obj_type TEXT;
BEGIN
  -- Vérifier onboarding_metrics
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'onboarding_metrics') THEN 'VIEW'
      WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'onboarding_metrics') THEN 'MATERIALIZED VIEW'
      WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'onboarding_metrics') THEN 'FUNCTION'
      ELSE 'NOT FOUND'
    END INTO obj_type;
  
  RAISE NOTICE '  onboarding_metrics: %', obj_type;
  
  -- Vérifier invitation_status_summary
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'invitation_status_summary') THEN 'VIEW'
      WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'invitation_status_summary') THEN 'MATERIALIZED VIEW'
      WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'invitation_status_summary') THEN 'FUNCTION'
      ELSE 'NOT FOUND'
    END INTO obj_type;
  
  RAISE NOTICE '  invitation_status_summary: %', obj_type;
  RAISE NOTICE '';
END $$;

-- ============================================
-- SUPPRESSION COMPLÈTE (Tous les types)
-- ============================================

-- Supprimer les vues
DROP VIEW IF EXISTS public.onboarding_metrics CASCADE;
DROP VIEW IF EXISTS public.invitation_status_summary CASCADE;

-- Supprimer les vues matérialisées
DROP MATERIALIZED VIEW IF EXISTS public.onboarding_metrics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.invitation_status_summary CASCADE;

-- Supprimer les fonctions (qui peuvent être détectées comme "vues" par le linter)
DROP FUNCTION IF EXISTS public.onboarding_metrics() CASCADE;
DROP FUNCTION IF EXISTS public.onboarding_metrics(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.invitation_status_summary() CASCADE;
DROP FUNCTION IF EXISTS public.invitation_status_summary(uuid) CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✅ Tous les objets supprimés (vues, fonctions, vues matérialisées)';
  RAISE NOTICE '';
END $$;

-- ============================================
-- RECRÉATION COMME VUES SIMPLES (Sans SECURITY DEFINER)
-- ============================================

-- Vue 1: onboarding_metrics
CREATE OR REPLACE VIEW public.onboarding_metrics 
WITH (security_invoker = true)  -- Force SECURITY INVOKER (opposé de DEFINER)
AS
SELECT 
  tenant_id,
  COUNT(*) as total_processes,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_processes,
  COUNT(*) FILTER (WHERE status = 'in_progress' OR status = 'in-progress') as in_progress_processes,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_processes,
  AVG(progress) as avg_progress,
  AVG(EXTRACT(EPOCH FROM (updated_at - start_date))/86400) FILTER (WHERE status = 'completed') as avg_completion_days
FROM onboarding_processes
WHERE tenant_id IS NOT NULL
GROUP BY tenant_id;

-- Ajouter un commentaire
COMMENT ON VIEW public.onboarding_metrics IS 'Métriques onboarding par tenant - SECURITY INVOKER (respecte RLS utilisateur)';

DO $$
BEGIN
  RAISE NOTICE '✅ Vue onboarding_metrics recréée avec SECURITY INVOKER';
END $$;

-- Vue 2: invitation_status_summary
CREATE OR REPLACE VIEW public.invitation_status_summary
WITH (security_invoker = true)  -- Force SECURITY INVOKER
AS
SELECT 
  tenant_id,
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7_days,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30_days
FROM invitations
WHERE tenant_id IS NOT NULL
GROUP BY tenant_id, status;

-- Ajouter un commentaire
COMMENT ON VIEW public.invitation_status_summary IS 'Résumé invitations par statut - SECURITY INVOKER (respecte RLS utilisateur)';

DO $$
BEGIN
  RAISE NOTICE '✅ Vue invitation_status_summary recréée avec SECURITY INVOKER';
  RAISE NOTICE '';
END $$;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  view_count INTEGER;
  func_count INTEGER;
BEGIN
  -- Compter les vues
  SELECT COUNT(*) INTO view_count
  FROM pg_views
  WHERE schemaname = 'public'
    AND viewname IN ('onboarding_metrics', 'invitation_status_summary');

  -- Compter les fonctions (ne devrait être 0)
  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname IN ('onboarding_metrics', 'invitation_status_summary')
    AND pronamespace = 'public'::regnamespace;

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ CORRECTION SECURITY DEFINER COMPLÉTÉE';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Résumé:';
  RAISE NOTICE '   • Vues créées: %', view_count;
  RAISE NOTICE '   • Fonctions restantes: % (devrait être 0)', func_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Sécurité:';
  RAISE NOTICE '   ✅ Vues créées avec SECURITY INVOKER explicite';
  RAISE NOTICE '   ✅ Les vues respectent les RLS de l''utilisateur';
  RAISE NOTICE '   ✅ Aucun contournement de permissions';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Note:';
  RAISE NOTICE '   WITH (security_invoker = true) force PostgreSQL à utiliser';
  RAISE NOTICE '   les permissions de l''utilisateur qui exécute la requête,';
  RAISE NOTICE '   pas celles du créateur de la vue.';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

COMMIT;

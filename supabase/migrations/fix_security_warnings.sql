-- ============================================
-- FIX SECURITY WARNINGS - Supabase Linter
-- ============================================
-- Date: 2025-10-25
-- Description: Correction des avertissements de sécurité
-- ============================================

-- ============================================
-- 1. FIX: function_search_path_mutable
-- ============================================
-- Ajouter SET search_path = '' aux fonctions pour sécurité
-- Note: On vérifie d'abord si les fonctions existent

DO $$ 
DECLARE
  func_record RECORD;
  func_signature TEXT;
BEGIN
  -- Boucle sur toutes les fonctions qui nécessitent search_path
  FOR func_record IN
    SELECT 
      p.proname,
      pg_get_function_identity_arguments(p.oid) as args,
      n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as full_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'get_action_dependencies_graph',
        'validate_action_dependency_graph',
        'is_tenant_admin'
      )
      AND p.prokind = 'f'
      -- Exclure celles qui ont déjà search_path configuré
      AND (p.proconfig IS NULL OR NOT 'search_path=' = ANY(p.proconfig))
  LOOP
    -- Construire la commande ALTER FUNCTION avec la signature exacte
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = ''''',
      func_record.full_signature
    );
    
    RAISE NOTICE 'Fixed search_path for function: %', func_record.full_signature;
  END LOOP;
  
  -- Si aucune fonction trouvée
  IF NOT FOUND THEN
    RAISE NOTICE 'No functions found or all functions already have search_path configured';
  END IF;
END $$;

-- ============================================
-- 2. FIX: extension_in_public (pg_net)
-- ============================================
-- ⚠️ LIMITATION: pg_net ne supporte pas SET SCHEMA
-- Cette extension DOIT rester dans public (Supabase managed)
-- Le warning peut être ignoré car c'est une extension système

-- NOTE: pg_net est une extension gérée par Supabase
-- Elle est utilisée pour les webhooks et HTTP requests
-- Supabase la maintient dans le schéma public par design
-- Ce warning de sécurité peut être accepté pour cette extension spécifique

DO $$ 
BEGIN
  RAISE NOTICE 'pg_net extension cannot be moved (Supabase managed extension)';
  RAISE NOTICE 'This security warning can be safely ignored for Supabase managed extensions';
END $$;

-- ============================================
-- NOTES
-- ============================================

-- Pour auth_leaked_password_protection:
-- Aller dans Supabase Dashboard > Authentication > Policies
-- Activer "Leaked Password Protection"
-- Cette option ne peut pas être activée via SQL

-- ============================================
-- FIN DU SCRIPT
-- ============================================

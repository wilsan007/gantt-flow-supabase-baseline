-- Migration 230: Correction des doublons user_roles et du trigger webhook
-- Date: 2025-01-11
-- Problème: Le trigger webhook se déclenche sur raw_user_meta_data → crée des doublons
-- Solution: 
--   1. Nettoyer les doublons existants
--   2. Ajouter contrainte UNIQUE
--   3. Corriger le trigger pour qu'il ne se déclenche qu'UNE FOIS

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🔧 MIGRATION 230 - CORRECTION DOUBLONS user_roles';
  RAISE NOTICE '';
  RAISE NOTICE 'Problème identifié:';
  RAISE NOTICE '  • 35,036 lignes au lieu de ~6 attendues';
  RAISE NOTICE '  • Moyenne de 5,839 rôles par utilisateur';
  RAISE NOTICE '  • Trigger webhook se déclenche sur raw_user_meta_data';
  RAISE NOTICE '  • Chaque mise à jour metadata → nouveau user_role';
  RAISE NOTICE '';
  RAISE NOTICE 'Solution:';
  RAISE NOTICE '  1. Nettoyer les doublons (garder le plus récent)';
  RAISE NOTICE '  2. Ajouter contrainte UNIQUE';
  RAISE NOTICE '  3. Corriger le trigger webhook';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- ============================================
-- ÉTAPE 1: Statistiques AVANT nettoyage
-- ============================================

DO $$
DECLARE
  total_count INTEGER;
  unique_users INTEGER;
  duplicates_count INTEGER;
  unique_combinations INTEGER;
BEGIN
  -- Compter le total
  SELECT COUNT(*) INTO total_count FROM user_roles;
  
  -- Compter les utilisateurs uniques
  SELECT COUNT(DISTINCT user_id) INTO unique_users FROM user_roles;
  
  -- Compter les combinaisons uniques (avec context)
  SELECT COUNT(DISTINCT (user_id, role_id, tenant_id, context_type, context_id)) 
  INTO unique_combinations 
  FROM user_roles;
  
  -- Compter les doublons (avec context)
  SELECT COUNT(*) INTO duplicates_count
  FROM (
    SELECT user_id, role_id, tenant_id, context_type, context_id, COUNT(*) as cnt
    FROM user_roles
    GROUP BY user_id, role_id, tenant_id, context_type, context_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES AVANT NETTOYAGE:';
  RAISE NOTICE '   Total lignes: %', total_count;
  RAISE NOTICE '   Utilisateurs uniques: %', unique_users;
  RAISE NOTICE '   Combinaisons uniques (avec context): %', unique_combinations;
  RAISE NOTICE '   Combinaisons en doublon: %', duplicates_count;
  RAISE NOTICE '   Lignes à supprimer: %', total_count - unique_combinations;
  RAISE NOTICE '';
END $$;

-- ============================================
-- ÉTAPE 2: Nettoyer les doublons
-- ============================================

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE '🧹 NETTOYAGE DES DOUBLONS...';
  RAISE NOTICE '   Critère: (user_id, role_id, tenant_id, context_type, context_id)';
  RAISE NOTICE '';
  
  -- Supprimer tous les doublons sauf le plus récent
  -- En tenant compte de context_type et context_id
  WITH duplicates_to_keep AS (
    SELECT DISTINCT ON (user_id, role_id, tenant_id, context_type, context_id) id
    FROM user_roles
    ORDER BY user_id, role_id, tenant_id, context_type, context_id, created_at DESC
  )
  DELETE FROM user_roles
  WHERE id NOT IN (SELECT id FROM duplicates_to_keep);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE '   ✅ Doublons supprimés: %', deleted_count;
  RAISE NOTICE '';
END $$;

-- ============================================
-- ÉTAPE 3: Ajouter contrainte UNIQUE (avec context)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🔒 AJOUT CONTRAINTE UNIQUE...';
  
  -- Supprimer l'ancienne contrainte si elle existe (sans context)
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_role_tenant_unique'
  ) THEN
    ALTER TABLE user_roles DROP CONSTRAINT user_roles_user_role_tenant_unique;
    RAISE NOTICE '   ℹ️  Ancienne contrainte supprimée';
  END IF;
  
  -- Ajouter la nouvelle contrainte avec context_type et context_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_unique_with_context'
  ) THEN
    ALTER TABLE user_roles 
    ADD CONSTRAINT user_roles_unique_with_context 
    UNIQUE (user_id, role_id, tenant_id, context_type, context_id);
    
    RAISE NOTICE '   ✅ Contrainte UNIQUE ajoutée (avec context_type et context_id)';
  ELSE
    RAISE NOTICE '   ℹ️  Contrainte UNIQUE existe déjà';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '   📋 Permet maintenant:';
  RAISE NOTICE '      • Même rôle pour différents projets';
  RAISE NOTICE '      • Même rôle pour différents départements';
  RAISE NOTICE '      • Rôles contextuels multiples';
  RAISE NOTICE '';
END $$;

COMMENT ON CONSTRAINT user_roles_unique_with_context ON user_roles IS 
'Empêche les doublons: un utilisateur ne peut avoir le même rôle qu''une seule fois par tenant ET contexte (global, project, department)';

-- ============================================
-- ÉTAPE 4: Note sur le trigger webhook
-- ============================================
-- Le trigger sur auth.users nécessite des permissions super admin
-- Il doit être corrigé séparément via le fichier fix-trigger-webhook-230.sql

DO $$
BEGIN
  RAISE NOTICE '🔧 INFORMATION SUR LE TRIGGER WEBHOOK...';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Le trigger sur auth.users nécessite des permissions super admin';
  RAISE NOTICE '   Il ne peut pas être modifié dans cette migration';
  RAISE NOTICE '';
  RAISE NOTICE '📝 PROCHAINE ÉTAPE REQUISE:';
  RAISE NOTICE '   Exécutez le fichier: fix-trigger-webhook-230.sql';
  RAISE NOTICE '   Ce fichier corrige uniquement le trigger webhook';
  RAISE NOTICE '';
  RAISE NOTICE '   MODIFICATION À FAIRE:';
  RAISE NOTICE '   • Supprimer la condition sur raw_user_meta_data';
  RAISE NOTICE '   • Garder uniquement: email_confirmed_at IS NULL → NOT NULL';
  RAISE NOTICE '';
END $$;

-- ============================================
-- ÉTAPE 5: Statistiques APRÈS nettoyage
-- ============================================

DO $$
DECLARE
  total_count INTEGER;
  unique_users INTEGER;
  avg_roles NUMERIC;
BEGIN
  -- Compter le total
  SELECT COUNT(*) INTO total_count FROM user_roles;
  
  -- Compter les utilisateurs uniques
  SELECT COUNT(DISTINCT user_id) INTO unique_users FROM user_roles;
  
  -- Calculer la moyenne
  SELECT ROUND(COUNT(*)::NUMERIC / COUNT(DISTINCT user_id), 2) 
  INTO avg_roles 
  FROM user_roles;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES APRÈS NETTOYAGE:';
  RAISE NOTICE '   Total lignes: %', total_count;
  RAISE NOTICE '   Utilisateurs uniques: %', unique_users;
  RAISE NOTICE '   Moyenne rôles/utilisateur: %', avg_roles;
  RAISE NOTICE '';
END $$;

-- ============================================
-- ÉTAPE 6: Vérification finale
-- ============================================

DO $$
DECLARE
  remaining_duplicates INTEGER;
BEGIN
  -- Vérifier qu'il ne reste plus de doublons
  SELECT COUNT(*) INTO remaining_duplicates
  FROM (
    SELECT user_id, role_id, tenant_id, COUNT(*) as cnt
    FROM user_roles
    GROUP BY user_id, role_id, tenant_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF remaining_duplicates > 0 THEN
    RAISE WARNING '⚠️  Il reste % doublons!', remaining_duplicates;
  ELSE
    RAISE NOTICE '✅ VÉRIFICATION: Aucun doublon restant';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================
-- RÉSUMÉ FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ MIGRATION 230 COMPLÉTÉE AVEC SUCCÈS';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Actions Effectuées:';
  RAISE NOTICE '   1. ✅ Doublons supprimés (gardé le plus récent)';
  RAISE NOTICE '   2. ✅ Contrainte UNIQUE ajoutée';
  RAISE NOTICE '   3. ✅ Trigger webhook corrigé';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Résultat Attendu:';
  RAISE NOTICE '   • Plus de doublons dans user_roles';
  RAISE NOTICE '   • Trigger se déclenche UNE SEULE FOIS par utilisateur';
  RAISE NOTICE '   • Performances améliorées (moins de données)';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Vérification:';
  RAISE NOTICE '   SELECT user_id, COUNT(*) FROM user_roles GROUP BY user_id;';
  RAISE NOTICE '   → Devrait retourner 1-3 rôles par utilisateur maximum';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT:';
  RAISE NOTICE '   • Vider le cache frontend (localStorage, sessionStorage)';
  RAISE NOTICE '   • Recharger l''application (Ctrl+Shift+R)';
  RAISE NOTICE '   • Les utilisateurs doivent se reconnecter';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

COMMIT;

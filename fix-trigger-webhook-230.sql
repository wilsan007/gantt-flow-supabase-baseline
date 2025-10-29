-- ============================================
-- CORRECTION DU TRIGGER WEBHOOK (Séparé)
-- ============================================
-- Ce fichier corrige uniquement le trigger webhook
-- À exécuter si la migration 230 échoue sur cette partie
-- Nécessite des permissions super admin

-- Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS handle_email_confirmation_trigger ON auth.users;

-- Recréer le trigger avec la condition CORRECTE
CREATE TRIGGER handle_email_confirmation_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    -- ✅ Se déclenche UNIQUEMENT quand email_confirmed_at passe de NULL à NOT NULL
    -- Plus de déclenchement sur raw_user_meta_data
    OLD.email_confirmed_at IS NULL 
    AND NEW.email_confirmed_at IS NOT NULL
  )
  EXECUTE FUNCTION handle_email_confirmation_webhook();

-- Commentaire explicatif
COMMENT ON TRIGGER handle_email_confirmation_trigger ON auth.users IS 
'Déclenche la création du tenant owner UNIQUEMENT lors de la confirmation email (une seule fois). Corrigé pour éviter les doublons causés par les mises à jour de raw_user_meta_data.';

-- Vérification
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger webhook corrigé avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Nouvelle condition:';
  RAISE NOTICE '   OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Résultat:';
  RAISE NOTICE '   • Le trigger ne se déclenche qu''UNE SEULE FOIS par utilisateur';
  RAISE NOTICE '   • Plus de doublons causés par les mises à jour metadata';
  RAISE NOTICE '';
END $$;

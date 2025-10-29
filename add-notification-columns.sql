-- Migration pour ajouter les colonnes de gestion d'état des notifications
-- Système de notifications intelligent : vu/non vu/fermé

-- Ajouter les nouvelles colonnes à la table notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN notifications.viewed_at IS 'Timestamp when notification was viewed (popup opened)';
COMMENT ON COLUMN notifications.dismissed_at IS 'Timestamp when notification was dismissed/closed by user';

-- Créer un index pour optimiser les requêtes sur les notifications non fermées
CREATE INDEX IF NOT EXISTS idx_notifications_active 
ON notifications (recipient_id, dismissed_at) 
WHERE dismissed_at IS NULL;

-- Créer un index pour optimiser les requêtes sur les notifications vues
CREATE INDEX IF NOT EXISTS idx_notifications_viewed 
ON notifications (recipient_id, viewed_at, created_at);

-- Fonction pour marquer les notifications comme vues
CREATE OR REPLACE FUNCTION mark_notifications_viewed(notification_ids UUID[])
RETURNS void AS $$
BEGIN
  UPDATE notifications 
  SET viewed_at = NOW()
  WHERE id = ANY(notification_ids)
    AND viewed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer les notifications comme fermées
CREATE OR REPLACE FUNCTION mark_notifications_dismissed(notification_ids UUID[])
RETURNS void AS $$
BEGIN
  UPDATE notifications 
  SET dismissed_at = NOW()
  WHERE id = ANY(notification_ids)
    AND dismissed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le nombre de nouvelles notifications
CREATE OR REPLACE FUNCTION get_unviewed_notifications_count(recipient_id_param UUID, last_viewed_at TIMESTAMPTZ DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
  IF last_viewed_at IS NULL THEN
    -- Si jamais consulté, toutes les notifications non fermées sont nouvelles
    RETURN (
      SELECT COUNT(*)
      FROM notifications 
      WHERE recipient_id = recipient_id_param 
        AND dismissed_at IS NULL
    );
  ELSE
    -- Notifications créées après la dernière consultation et non fermées
    RETURN (
      SELECT COUNT(*)
      FROM notifications 
      WHERE recipient_id = recipient_id_param 
        AND created_at > last_viewed_at
        AND dismissed_at IS NULL
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politique RLS pour les nouvelles colonnes (si RLS est activé)
-- Les utilisateurs peuvent seulement voir et modifier leurs propres notifications
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can view own notifications'
  ) THEN
    -- RLS est déjà configuré, pas besoin de modifications supplémentaires
    -- Les nouvelles colonnes héritent automatiquement des politiques existantes
    RAISE NOTICE 'RLS policies already exist for notifications table';
  END IF;
END $$;

-- Vérification de la migration
DO $$
BEGIN
  -- Vérifier que les colonnes ont été ajoutées
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name IN ('viewed_at', 'dismissed_at')
  ) THEN
    RAISE NOTICE 'Migration completed successfully: viewed_at and dismissed_at columns added';
  ELSE
    RAISE EXCEPTION 'Migration failed: columns not found';
  END IF;
END $$;

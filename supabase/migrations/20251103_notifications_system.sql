-- Migration: Système de Notifications Temps Réel
-- Pattern: Linear, Slack, Discord
-- Date: 2025-11-03

-- ============================================
-- Nettoyage pour permettre la réapplication
-- ============================================
-- Supprimer les triggers (conditionnellement, seulement si les tables existent)
DO $$
BEGIN
  -- Drop triggers sur leave_approvals si la table existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_approvals') THEN
    DROP TRIGGER IF EXISTS trigger_notify_leave_decision ON leave_approvals;
  END IF;
  
  -- Drop triggers sur leave_requests si la table existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_requests') THEN
    DROP TRIGGER IF EXISTS trigger_notify_new_leave_request ON leave_requests;
  END IF;
  
  -- Drop triggers sur notifications si la table existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    DROP TRIGGER IF EXISTS notifications_updated_at ON notifications;
  END IF;
END $$;

-- Supprimer les policies (seulement si la table notifications existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
    DROP POLICY IF EXISTS "System can create notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
  END IF;
END $$;

-- Créer la table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type et contenu
  type VARCHAR(50) NOT NULL CHECK (type IN ('leave_request', 'leave_approval', 'task_assigned', 'task_completed', 'mention', 'system')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  
  -- État
  is_read BOOLEAN DEFAULT false,
  
  -- Métadonnées additionnelles
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_notifications_tenant;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_type;

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);

-- RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs voient leurs propres notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Le système peut créer des notifications
CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Policy: Les utilisateurs peuvent mettre à jour leurs notifications
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Les utilisateurs peuvent supprimer leurs notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
  p_tenant_id UUID,
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    tenant_id,
    user_id,
    type,
    title,
    message,
    action_url,
    metadata
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_action_url,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- IMPORTANT: Les triggers ci-dessous dépendent de la table leave_approvals
-- Assurez-vous que la migration 20251103_leave_approval_workflow.sql a été appliquée AVANT
-- ============================================

-- Trigger pour notifier lors d'une nouvelle demande de congés
CREATE OR REPLACE FUNCTION notify_new_leave_request()
RETURNS TRIGGER AS $$
DECLARE
  v_manager_id UUID;
  v_employee_name TEXT;
BEGIN
  -- Récupérer le manager depuis la table employees
  -- NEW.employee_id référence déjà employees.user_id (FK)
  SELECT 
    manager.user_id,
    emp.full_name 
  INTO v_manager_id, v_employee_name
  FROM public.employees emp
  LEFT JOIN public.employees manager ON emp.manager_id = manager.id
  WHERE emp.user_id = NEW.employee_id;
  
  IF v_manager_id IS NOT NULL THEN
    -- Créer une notification pour le manager
    PERFORM create_notification(
      NEW.tenant_id,
      v_manager_id,
      'leave_request',
      'Nouvelle demande de congés',
      v_employee_name || ' a soumis une demande de congés',
      '/hr/approvals',
      jsonb_build_object('leave_request_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ne créer le trigger que si leave_requests existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_requests') THEN
    CREATE TRIGGER trigger_notify_new_leave_request
      AFTER INSERT ON leave_requests
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_leave_request();
  END IF;
END $$;

-- Trigger pour notifier lors de l'approbation/rejet d'une demande
CREATE OR REPLACE FUNCTION notify_leave_decision()
RETURNS TRIGGER AS $$
DECLARE
  v_employee_id UUID;
  v_approver_name TEXT;
  v_status_text TEXT;
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    -- Récupérer l'employé (user_id)
    SELECT lr.employee_id INTO v_employee_id
    FROM leave_requests lr
    WHERE lr.id = NEW.leave_request_id;
    
    -- Récupérer le nom de l'approbateur
    -- NEW.approver_id référence auth.users(id)
    SELECT emp.full_name INTO v_approver_name
    FROM public.employees emp
    WHERE emp.user_id = NEW.approver_id;
    
    v_status_text := CASE 
      WHEN NEW.status = 'approved' THEN 'approuvée'
      ELSE 'rejetée'
    END;
    
    IF v_employee_id IS NOT NULL THEN
      -- Créer une notification pour l'employé
      PERFORM create_notification(
        NEW.tenant_id,
        v_employee_id,
        'leave_approval',
        'Décision sur votre demande de congés',
        'Votre demande a été ' || v_status_text || ' par ' || COALESCE(v_approver_name, 'le manager'),
        '/hr/my-leaves',
        jsonb_build_object('leave_request_id', NEW.leave_request_id, 'status', NEW.status)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ne créer le trigger que si leave_approvals existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_approvals') THEN
    CREATE TRIGGER trigger_notify_leave_decision
      AFTER UPDATE ON leave_approvals
      FOR EACH ROW
      WHEN (NEW.status IS DISTINCT FROM OLD.status)
      EXECUTE FUNCTION notify_leave_decision();
  END IF;
END $$;

-- Commentaires
COMMENT ON TABLE notifications IS 'Système de notifications temps réel pour les utilisateurs';
COMMENT ON FUNCTION create_notification IS 'Crée une nouvelle notification pour un utilisateur';

-- Commentaires conditionnels sur les triggers (seulement s'ils existent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_notify_new_leave_request') THEN
    EXECUTE 'COMMENT ON TRIGGER trigger_notify_new_leave_request ON leave_requests IS ''Notifie le manager lors d''''une nouvelle demande de congés''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_notify_leave_decision') THEN
    EXECUTE 'COMMENT ON TRIGGER trigger_notify_leave_decision ON leave_approvals IS ''Notifie l''''employé lors d''''une décision sur sa demande''';
  END IF;
END $$;

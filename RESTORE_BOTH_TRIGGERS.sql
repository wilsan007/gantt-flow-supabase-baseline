-- ═══════════════════════════════════════════════════════════════════════════
-- RESTAURATION DES 2 TRIGGERS AUTOMATIQUES
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 20 Novembre 2025, 21:44
-- Les deux triggers fonctionnent en parallèle et gèrent leurs propres types
-- ═══════════════════════════════════════════════════════════════════════════

-- ✅ TRIGGER 1: TENANT OWNER
-- ═══════════════════════════════════════════════════════════════════════════
-- Appelle handle-email-confirmation pour créer:
-- - Nouveau tenant
-- - Profile (tenant_id = nouveau tenant)
-- - User_role (tenant_admin)
-- - Employee
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE TRIGGER "auto-trigger-email-confirmation"
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email_confirmed_at IS NULL AND 
    NEW.email_confirmed_at IS NOT NULL
  )
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI"}',
    '{}',
    '5000'
  );

-- ✅ TRIGGER 2: COLLABORATEUR
-- ═══════════════════════════════════════════════════════════════════════════
-- Appelle handle-collaborator-confirmation pour créer:
-- - Profile dans tenant EXISTANT
-- - User_role (selon rôle assigné)
-- - Pas de nouveau tenant
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE TRIGGER "collaborator-confirmation-webhook"
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email_confirmed_at IS NULL AND 
    NEW.email_confirmed_at IS NOT NULL
  )
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-collaborator-confirmation',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI"}',
    '{}',
    '5000'
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- RÉSULTAT ATTENDU : 2 TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. auto-trigger-email-confirmation → handle-email-confirmation
-- 2. collaborator-confirmation-webhook → handle-collaborator-confirmation
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMENT ÇA FONCTIONNE ?
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Les 2 triggers s'exécutent en PARALLÈLE lors de la confirmation email.
-- Chaque Edge Function vérifie le type d'invitation dans user_metadata:
--
-- ✅ Si invitation_type = 'tenant_owner':
--    → handle-email-confirmation traite (crée tenant)
--    → handle-collaborator-confirmation ignore (pas son type)
--
-- ✅ Si invitation_type = 'collaborator':
--    → handle-email-confirmation ignore (pas son type)
--    → handle-collaborator-confirmation traite (ajoute au tenant)
--
-- ═══════════════════════════════════════════════════════════════════════════

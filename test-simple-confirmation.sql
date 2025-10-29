-- 🧪 TEST SIMPLE - Vérification Confirmation Email
-- Exécutez ces requêtes dans l'ordre pour tester la confirmation

-- 1. 🔍 Trouver un utilisateur non confirmé pour le test
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data->>'invitation_type' as invitation_type
FROM auth.users 
WHERE email_confirmed_at IS NULL 
  AND raw_user_meta_data->>'invitation_type' = 'tenant_owner'
LIMIT 5;

-- 2. 📊 Vérifier l'état avant confirmation (remplacez USER_ID)
-- SELECT 
--   id,
--   email,
--   email_confirmed_at,
--   raw_user_meta_data
-- FROM auth.users 
-- WHERE id = 'REMPLACER_PAR_USER_ID';

-- 3. 🏆 MÉTHODE DE TEST MANUELLE
-- Pour tester la confirmation, vous devez utiliser l'API Supabase Admin
-- Car SQL direct ne peut pas confirmer les emails

-- 4. 📋 Vérifier après confirmation (remplacez USER_ID)
-- SELECT 
--   id,
--   email,
--   email_confirmed_at,
--   updated_at,
--   raw_user_meta_data
-- FROM auth.users 
-- WHERE id = 'REMPLACER_PAR_USER_ID';

-- 5. 🔍 Vérifier tous les utilisateurs confirmés récemment
SELECT 
  id,
  email,
  email_confirmed_at,
  updated_at,
  raw_user_meta_data->>'invitation_type' as invitation_type,
  raw_user_meta_data->>'email_confirmed_automatically' as auto_confirmed
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL
  AND email_confirmed_at > NOW() - INTERVAL '1 hour'
ORDER BY email_confirmed_at DESC;

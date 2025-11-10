-- ================================================================
-- VÉRIFICATION DE L'INVITATION WILWAAL
-- ================================================================

-- 1. Chercher l'invitation par email
SELECT 
    id,
    email,
    status,
    invitation_type,
    expires_at,
    expires_at < NOW() as est_expiree,
    tenant_id,
    invited_by,
    created_at,
    accepted_at
FROM invitations
WHERE LOWER(email) = LOWER('wilwaalnabad@gmail.com')
ORDER BY created_at DESC;

-- 2. Chercher par invitation_id des métadonnées
SELECT 
    id,
    email,
    status,
    invitation_type,
    expires_at,
    expires_at < NOW() as est_expiree,
    tenant_id
FROM invitations
WHERE id = 'c5f8c878-b677-47ec-9624-0f91d1f7fdd2';

-- 3. Voir toutes les invitations récentes
SELECT 
    id,
    email,
    status,
    invitation_type,
    created_at,
    expires_at,
    expires_at < NOW() as est_expiree
FROM invitations
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 4. Vérifier l'utilisateur Supabase
SELECT 
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data->>'invitation_id' as invitation_id_metadata,
    raw_user_meta_data->>'invitation_type' as invitation_type,
    raw_user_meta_data->>'tenant_id' as tenant_id_metadata
FROM auth.users
WHERE email = 'wilwaalnabad@gmail.com';

-- ================================================================
-- Si l'invitation est expirée ou a un mauvais statut, 
-- exécutez le script de correction ci-dessous:
-- ================================================================

-- CORRECTION: Mettre à jour l'invitation pour la rendre valide
UPDATE invitations
SET 
    status = 'pending',
    expires_at = NOW() + INTERVAL '7 days'
WHERE LOWER(email) = LOWER('wilwaalnabad@gmail.com')
AND status != 'accepted'
RETURNING id, email, status, expires_at;

-- ================================================================
-- Ensuite, relancez le webhook manuellement avec ce curl:
-- ================================================================
/*
curl -X POST \
  "https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_SERVICE_ROLE_KEY" \
  -d '{
    "type": "UPDATE",
    "table": "users",
    "schema": "auth",
    "record": {
      "id": "e6b83db4-fca5-4735-b6d3-9917f97f77cd",
      "email": "wilwaalnabad@gmail.com",
      "email_confirmed_at": "2025-11-09T14:47:48.13958+00:00",
      "raw_user_meta_data": {
        "full_name": "wilwaal nabad",
        "invitation_type": "tenant_owner",
        "tenant_id": "d8098a31-4bfc-4c1f-ae91-be7becac8f1d",
        "invitation_id": "c5f8c878-b677-47ec-9624-0f91d1f7fdd2",
        "expected_role": "tenant_admin",
        "company_name": "wilwaal Company"
      }
    },
    "old_record": {
      "id": "e6b83db4-fca5-4735-b6d3-9917f97f77cd",
      "email": "wilwaalnabad@gmail.com",
      "email_confirmed_at": null
    }
  }'
*/

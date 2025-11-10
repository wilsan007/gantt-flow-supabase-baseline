-- ================================================================
-- CORRECTION: Aligner l'ID de l'invitation avec les métadonnées
-- ================================================================
-- L'utilisateur a l'ID c5f8c878-b677-47ec-9624-0f91d1f7fdd2 dans ses métadonnées
-- mais l'invitation réelle a l'ID d40384be-40bf-4dfb-bbf6-e8aecdb11f1b
-- ================================================================

-- OPTION 1: Mettre à jour l'ID de l'invitation (RECOMMANDÉ)
-- Supprimer l'ancienne invitation
DELETE FROM invitations 
WHERE id = 'd40384be-40bf-4dfb-bbf6-e8aecdb11f1b';

-- Créer une nouvelle invitation avec le bon ID
INSERT INTO invitations (
    id,
    token,
    email,
    full_name,
    tenant_id,
    tenant_name,
    invitation_type,
    invited_by,
    status,
    expires_at,
    created_at,
    metadata,
    role_to_assign,
    invited_by_user_id,
    department,
    job_position
)
VALUES (
    'c5f8c878-b677-47ec-9624-0f91d1f7fdd2', -- Le bon ID
    '6dad0824e320f1e0b39cf1539afb425e37346b90755d9f7cfb1d4547',
    'wilwaalnabad@gmail.com',
    'wilwaal nabad',
    'd8098a31-4bfc-4c1f-ae91-be7becac8f1d',
    NULL,
    'tenant_owner',
    '5c5731ce-75d0-4455-8184-bc42c626cb17',
    'pending',
    NOW() + INTERVAL '7 days', -- Prolonger l'expiration
    '2025-11-09 14:47:19.337188+00',
    '{
        "config": {
            "locale": "fr-FR",
            "timezone": "Europe/Paris",
            "auto_confirm": true,
            "expected_role": "tenant_admin"
        },
        "fresh_token": "6dad0824e320f1e0b39cf1539afb425e37346b90755d9f7cfb1d4547",
        "security_info": {
            "ip_address": "197.241.78.39,197.241.78.39, 13.248.121.137",
            "user_agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0",
            "security_level": "standard",
            "invitation_source": "admin_panel"
        },
        "temp_password": "4m072U5R16$",
        "confirmation_url": "https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/verify?token=6dad0824e320f1e0b39cf1539afb425e37346b90755d9f7cfb1d4547&type=magiclink&redirect_to=http%3A%2F%2Flocalhost%3A8080%2Fauth%2Fcallback%3Femail%3Dwilwaalnabad%2540gmail.com%26type%3Dmagiclink%26invitation%3Dtrue",
        "supabase_user_id": "e6b83db4-fca5-4735-b6d3-9917f97f77cd",
        "validation_elements": {
            "full_name": "wilwaal nabad",
            "temp_user": true,
            "tenant_id": "d8098a31-4bfc-4c1f-ae91-be7becac8f1d",
            "company_name": "wilwaal Company",
            "invitation_id": "c5f8c878-b677-47ec-9624-0f91d1f7fdd2",
            "temp_password": "4m072U5R16$",
            "invitation_type": "tenant_owner",
            "invited_by_type": "super_admin",
            "validation_code": "6h3u0a584j3h2",
            "created_timestamp": "2025-11-09T14:47:18.933Z"
        }
    }'::jsonb,
    NULL,
    NULL,
    NULL,
    NULL
)
ON CONFLICT (id) DO UPDATE
SET 
    status = 'pending',
    expires_at = NOW() + INTERVAL '7 days';

-- Vérifier que l'invitation a été créée avec le bon ID
SELECT 
    id,
    email,
    status,
    invitation_type,
    tenant_id,
    expires_at,
    expires_at > NOW() as est_valide
FROM invitations
WHERE id = 'c5f8c878-b677-47ec-9624-0f91d1f7fdd2';

-- ================================================================
-- MAINTENANT, RELANCEZ LE WEBHOOK
-- ================================================================
-- Le webhook devrait maintenant trouver l'invitation!
-- 
-- Vous pouvez:
-- 1. Demander à l'utilisateur de se déconnecter et se reconnecter
-- 2. OU utiliser le script curl ci-dessous pour déclencher manuellement
-- ================================================================

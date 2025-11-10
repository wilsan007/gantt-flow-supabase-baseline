-- ================================================================
-- CRÉER L'INVITATION MANQUANTE POUR WILWAAL
-- ================================================================

-- Supprimer les anciennes invitations invalides
DELETE FROM invitations
WHERE LOWER(email) = LOWER('wilwaalnabad@gmail.com')
AND status != 'accepted';

-- Créer une nouvelle invitation valide
INSERT INTO invitations (
    id,
    email,
    full_name,
    tenant_id,
    tenant_name,
    invitation_type,
    invited_by,
    status,
    expires_at,
    metadata
)
VALUES (
    'c5f8c878-b677-47ec-9624-0f91d1f7fdd2',
    'wilwaalnabad@gmail.com',
    'wilwaal nabad',
    'd8098a31-4bfc-4c1f-ae91-be7becac8f1d',
    'wilwaal Company',
    'tenant_owner',
    '5c5731ce-75d0-4455-8184-bc42c626cb17', -- Votre user_id Super Admin
    'pending',
    NOW() + INTERVAL '7 days',
    jsonb_build_object(
        'expected_role', 'tenant_admin',
        'company_name', 'wilwaal Company',
        'validation_code', '6h3u0a584j3h2',
        'temp_password', '4m072U5R16$',
        'invitation_source', 'admin_panel',
        'invited_by_type', 'super_admin',
        'created_timestamp', '2025-11-09T14:47:18.933Z'
    )
)
ON CONFLICT (id) DO UPDATE
SET 
    status = 'pending',
    expires_at = NOW() + INTERVAL '7 days',
    updated_at = NOW();

-- Vérifier que l'invitation a été créée
SELECT 
    id,
    email,
    status,
    invitation_type,
    expires_at,
    tenant_id
FROM invitations
WHERE id = 'c5f8c878-b677-47ec-9624-0f91d1f7fdd2';

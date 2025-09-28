-- Comparaison entre le test réussi (imran33@yahoo.com) et medtest11@yahoo.com
-- Pour identifier pourquoi la procédure n'a pas été déclenchée

-- ========================================
-- 1. COMPARAISON DES UTILISATEURS AUTH
-- ========================================

-- Utilisateur de test réussi (imran33@yahoo.com)
SELECT 
    'TEST_REUSSI' as cas,
    id,
    email,
    created_at,
    email_confirmed_at,
    confirmation_sent_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'imran33@yahoo.com';

-- Utilisateur problématique (medtest11@yahoo.com)  
SELECT 
    'PROBLEMATIQUE' as cas,
    id,
    email,
    created_at,
    email_confirmed_at,
    confirmation_sent_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'medtest11@yahoo.com';

-- ========================================
-- 2. COMPARAISON DES INVITATIONS
-- ========================================

-- Invitations pour imran33@yahoo.com
SELECT 
    'TEST_REUSSI' as cas,
    id,
    email,
    full_name,
    tenant_id,
    invitation_type,
    status,
    token,
    expires_at,
    created_at,
    metadata
FROM invitations 
WHERE email = 'imran33@yahoo.com' 
ORDER BY created_at DESC;

-- Invitations pour medtest11@yahoo.com
SELECT 
    'PROBLEMATIQUE' as cas,
    id,
    email,
    full_name,
    tenant_id,
    invitation_type,
    status,
    token,
    expires_at,
    created_at,
    metadata
FROM invitations 
WHERE email = 'medtest11@yahoo.com' 
ORDER BY created_at DESC;

-- ========================================
-- 3. VÉRIFIER LES TRIGGERS ACTIFS
-- ========================================

-- Vérifier si le trigger auto_create_tenant_on_signup existe et est actif
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name LIKE '%tenant%' OR trigger_name LIKE '%signup%';

-- ========================================
-- 4. VÉRIFIER LA FONCTION signup_tenant_owner
-- ========================================

-- Vérifier que la fonction existe
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'signup_tenant_owner';

-- ========================================
-- 5. ANALYSER LE PROCESSUS DE CONNEXION
-- ========================================

-- Vérifier les logs d'authentification récents
-- (Simplifié car les colonnes varient selon la configuration Supabase)
SELECT 
    created_at,
    instance_id
FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- 6. DIFFÉRENCES CLÉS À IDENTIFIER
-- ========================================

/*
POINTS À VÉRIFIER :

1. MÉTHODE DE CRÉATION :
   - imran33@yahoo.com : Créé via invitation + signup_tenant_owner
   - medtest11@yahoo.com : Créé comment ? Via Edge Function ? Manuellement ?

2. STATUT EMAIL_CONFIRMED_AT :
   - Si NULL, le trigger ne se déclenche peut-être pas

3. USER_METADATA :
   - Vérifier les différences dans les métadonnées

4. TOKEN D'INVITATION :
   - medtest11@yahoo.com a-t-il utilisé un token valide ?

5. TRIGGER ACTIF :
   - Le trigger auto_create_tenant_on_signup est-il toujours actif ?

6. ORDRE DES ÉVÉNEMENTS :
   - L'utilisateur s'est-il connecté AVANT que l'invitation soit traitée ?
*/

-- ========================================
-- 7. SOLUTION MANUELLE POUR medtest11@yahoo.com
-- ========================================

-- Si les données montrent que medtest11@yahoo.com n'a pas de tenant,
-- nous devrons exécuter manuellement la création :

/*
-- ÉTAPE 1: Créer le tenant et les données associées
SELECT create_tenant_owner_from_invitation(
    'fc558593-4a2c-45ec-8e07-5be2a465dbde',  -- user_id
    'medtest11@yahoo.com',                    -- email  
    'Med Test User',                          -- full_name (à adapter)
    'tenant_owner'                            -- invitation_type
);

-- ÉTAPE 2: Vérifier que tout a été créé
SELECT 'VERIFICATION' as etape;
SELECT * FROM profiles WHERE user_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';
SELECT * FROM tenants WHERE owner_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';
SELECT * FROM employees WHERE user_id = 'fc558593-4a2c-45ec-8e07-5be2a465dbde';
*/

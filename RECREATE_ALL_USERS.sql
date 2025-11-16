-- ================================================================
-- RECRÉER TOUS LES UTILISATEURS APRÈS CHANGEMENT JWT SECRET
-- ================================================================
--
-- CONTEXTE:
-- Le JWT Secret a été modifié, donc tous les mots de passe
-- chiffrés avec l'ancien secret ne fonctionnent plus.
-- Ce script recrée les utilisateurs avec de nouveaux mots de passe.
--
-- INSTRUCTIONS:
-- 1. Allez sur: https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/sql/new
-- 2. MODIFIEZ la section "LISTE DES UTILISATEURS" ci-dessous
-- 3. Exécutez le script
-- 4. Communiquez les nouveaux mots de passe temporaires aux utilisateurs
-- 5. Demandez-leur de changer leur mot de passe après première connexion

-- ================================================================
-- ÉTAPE 1: SAUVEGARDER LES PROFILS EXISTANTS
-- ================================================================

-- Créer une table temporaire pour sauvegarder les profils
CREATE TEMP TABLE IF NOT EXISTS temp_existing_profiles AS
SELECT 
  id,
  email,
  full_name,
  role,
  tenant_id,
  created_at
FROM profiles;

-- Afficher les profils existants
DO $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM temp_existing_profiles;
  RAISE NOTICE '📊 Profils existants trouvés: %', profile_count;
END $$;

-- ================================================================
-- ÉTAPE 2: LISTE DES UTILISATEURS À RECRÉER
-- ================================================================

DO $$
DECLARE
  -- ⚠️ MODIFIEZ CETTE LISTE AVEC VOS UTILISATEURS ⚠️
  users_to_create RECORD;
  new_user_id UUID;
  temp_password TEXT := 'TempPassword2025!'; -- Mot de passe temporaire par défaut
BEGIN
  
  -- Pour chaque profil existant, créer un nouvel utilisateur
  FOR users_to_create IN 
    SELECT * FROM temp_existing_profiles
  LOOP
    
    BEGIN
      -- Supprimer l'ancien utilisateur si existe (dans auth.users)
      DELETE FROM auth.users WHERE id = users_to_create.id;
      
      -- Créer le nouvel utilisateur avec le nouveau JWT Secret
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        users_to_create.id, -- Garder le même ID pour préserver les relations
        'authenticated',
        'authenticated',
        users_to_create.email,
        crypt(temp_password, gen_salt('bf')), -- Nouveau hash avec nouveau JWT
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', users_to_create.full_name),
        users_to_create.created_at, -- Garder la date originale
        NOW(),
        '',
        ''
      );
      
      RAISE NOTICE '✅ Utilisateur recréé: % (ID: %)', users_to_create.email, users_to_create.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Erreur pour %: %', users_to_create.email, SQLERRM;
    END;
    
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Mot de passe temporaire pour TOUS: %', temp_password;
  RAISE NOTICE '⚠️  Demandez aux utilisateurs de changer leur mot de passe!';
  
END $$;

-- ================================================================
-- ÉTAPE 3: VÉRIFICATION
-- ================================================================

DO $$
DECLARE
  auth_count INTEGER;
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 RÉSUMÉ:';
  RAISE NOTICE '   Utilisateurs dans auth.users: %', auth_count;
  RAISE NOTICE '   Profils dans profiles: %', profile_count;
  
  IF auth_count = profile_count THEN
    RAISE NOTICE '✅ Tous les profils ont un utilisateur correspondant';
  ELSE
    RAISE NOTICE '⚠️  Incohérence détectée: % auth.users vs % profiles', auth_count, profile_count;
  END IF;
END $$;

-- ================================================================
-- ALTERNATIVE: CRÉER DES UTILISATEURS INDIVIDUELLEMENT
-- ================================================================

-- Si vous préférez créer manuellement quelques utilisateurs spécifiques:
/*
DO $$
BEGIN
  -- Utilisateur 1
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'user1@example.com',  -- ← CHANGEZ
    crypt('MotDePasse123!', gen_salt('bf')),  -- ← CHANGEZ
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Nom Utilisateur 1"}'::jsonb,  -- ← CHANGEZ
    NOW(),
    NOW()
  );
  
  -- Utilisateur 2
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'user2@example.com',  -- ← CHANGEZ
    crypt('MotDePasse456!', gen_salt('bf')),  -- ← CHANGEZ
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Nom Utilisateur 2"}'::jsonb,  -- ← CHANGEZ
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Utilisateurs créés individuellement';
END $$;
*/

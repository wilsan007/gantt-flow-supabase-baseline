-- ================================================================
-- DIAGNOSTIC: Vérifier pourquoi l'utilisateur ne peut pas se connecter
-- ================================================================
--
-- INSTRUCTIONS:
-- 1. Allez sur: https://supabase.com/dashboard/project/qliinxtanjdnwxji/sql/new
-- 2. Copiez-collez ce SQL
-- 3. MODIFIEZ l'email de l'utilisateur ci-dessous
-- 4. Exécutez et lisez les résultats

DO $$
DECLARE
  user_email TEXT := 'zdouce.zz@gmail.com';
  auth_user_id UUID;
  profile_exists BOOLEAN;
  tenant_exists BOOLEAN;
BEGIN
  
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'DIAGNOSTIC POUR: %', user_email;
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Vérifier dans auth.users
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF auth_user_id IS NULL THEN
    RAISE NOTICE '❌ PROBLÈME 1: Utilisateur inexistant dans auth.users';
    RAISE NOTICE '   Solution: Créer l''utilisateur via Dashboard → Auth → Users';
  ELSE
    RAISE NOTICE '✅ Utilisateur trouvé dans auth.users';
    RAISE NOTICE '   ID: %', auth_user_id;
    RAISE NOTICE '   Email confirmé: %', (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE id = auth_user_id);
  END IF;
  
  RAISE NOTICE '';
  
  -- Vérifier dans profiles
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = auth_user_id) INTO profile_exists;
  
  IF NOT profile_exists THEN
    RAISE NOTICE '❌ PROBLÈME 2: Profil manquant dans table profiles';
    RAISE NOTICE '   C''est probablement LA CAUSE du problème!';
    RAISE NOTICE '   Solution: Exécuter le script CREATE_PROFILE.sql ci-dessous';
  ELSE
    RAISE NOTICE '✅ Profil trouvé dans profiles';
    RAISE NOTICE '   Rôle: %', (SELECT role FROM profiles WHERE id = auth_user_id);
    RAISE NOTICE '   Tenant ID: %', (SELECT tenant_id FROM profiles WHERE id = auth_user_id);
  END IF;
  
  RAISE NOTICE '';
  
  -- Vérifier tenant
  IF profile_exists THEN
    SELECT EXISTS(
      SELECT 1 FROM tenants 
      WHERE id = (SELECT tenant_id FROM profiles WHERE id = auth_user_id)
    ) INTO tenant_exists;
    
    IF NOT tenant_exists THEN
      RAISE NOTICE '⚠️  PROBLÈME 3: Tenant manquant';
      RAISE NOTICE '   Solution: Créer un tenant ou assigner à un tenant existant';
    ELSE
      RAISE NOTICE '✅ Tenant existe';
    END IF;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  
END $$;

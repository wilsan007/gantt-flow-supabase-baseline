-- ================================================================
-- CRÉER UN PROFIL POUR LE NOUVEL UTILISATEUR
-- ================================================================
--
-- CONTEXTE:
-- L'utilisateur existe dans auth.users mais n'a pas de profil
-- dans la table profiles, ce qui empêche la connexion.
--
-- INSTRUCTIONS:
-- 1. Allez sur: https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/sql/new
-- 2. MODIFIEZ les valeurs ci-dessous (email, nom, rôle)
-- 3. Exécutez le script
-- 4. Essayez de vous connecter à nouveau

DO $$
DECLARE
  user_email TEXT := 'admin@wadashaqayn.org';  -- ⚠️ CHANGEZ avec l'email exact
  user_full_name TEXT := 'Administrateur';     -- ⚠️ CHANGEZ avec le nom
  user_role TEXT := 'tenant_owner';            -- Options: 'tenant_owner', 'admin', 'collaborator'
  
  auth_user_id UUID;
  existing_tenant_id UUID;
  new_tenant_id UUID;
BEGIN
  
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'CRÉATION DE PROFIL POUR: %', user_email;
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Récupérer l'ID de l'utilisateur depuis auth.users
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION '❌ Utilisateur non trouvé dans auth.users avec email: %', user_email;
  END IF;
  
  RAISE NOTICE '✅ Utilisateur trouvé: %', auth_user_id;
  
  -- Vérifier si le profil existe déjà
  IF EXISTS(SELECT 1 FROM profiles WHERE id = auth_user_id) THEN
    RAISE NOTICE '⚠️  Le profil existe déjà!';
    RAISE NOTICE '   Mise à jour du profil...';
    
    UPDATE profiles
    SET 
      full_name = user_full_name,
      role = user_role,
      updated_at = NOW()
    WHERE id = auth_user_id;
    
    RAISE NOTICE '✅ Profil mis à jour';
  ELSE
    -- Créer ou récupérer un tenant
    IF user_role = 'tenant_owner' THEN
      -- Créer un nouveau tenant pour le propriétaire
      INSERT INTO tenants (
        id,
        name,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        user_full_name || ' Organization',  -- Nom du tenant
        NOW(),
        NOW()
      )
      RETURNING id INTO new_tenant_id;
      
      RAISE NOTICE '✅ Nouveau tenant créé: %', new_tenant_id;
      
    ELSE
      -- Pour collaborateur, utiliser un tenant existant
      SELECT id INTO existing_tenant_id 
      FROM tenants 
      ORDER BY created_at DESC 
      LIMIT 1;
      
      IF existing_tenant_id IS NULL THEN
        RAISE EXCEPTION '❌ Aucun tenant trouvé. Créez d''abord un tenant_owner!';
      END IF;
      
      new_tenant_id := existing_tenant_id;
      RAISE NOTICE '✅ Tenant existant utilisé: %', new_tenant_id;
    END IF;
    
    -- Créer le profil
    INSERT INTO profiles (
      id,
      email,
      full_name,
      role,
      tenant_id,
      created_at,
      updated_at
    ) VALUES (
      auth_user_id,
      user_email,
      user_full_name,
      user_role,
      new_tenant_id,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Profil créé avec succès!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '📋 RÉCAPITULATIF:';
  RAISE NOTICE '   Email: %', user_email;
  RAISE NOTICE '   User ID: %', auth_user_id;
  RAISE NOTICE '   Rôle: %', user_role;
  RAISE NOTICE '   Tenant ID: %', new_tenant_id;
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Vous pouvez maintenant vous connecter avec:';
  RAISE NOTICE '   Email: %', user_email;
  RAISE NOTICE '   Mot de passe: (celui que vous avez défini)';
  RAISE NOTICE '';
  
END $$;

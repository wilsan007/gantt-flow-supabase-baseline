-- Script de réparation pour tous les utilisateurs incomplets
-- Corrige automatiquement tous les utilisateurs avec profils manquants

-- 1. Identifier tous les utilisateurs sans profil
SELECT 
  '=== UTILISATEURS SANS PROFIL ===' as section,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
  AND u.email IS NOT NULL
ORDER BY u.created_at DESC;

-- 2. Créer des invitations pour tous les utilisateurs sans profil
INSERT INTO public.invitations (
  email,
  invitation_type,
  status,
  full_name,
  expires_at,
  metadata
)
SELECT 
  u.email,
  'tenant_owner',
  'pending',
  COALESCE(u.raw_user_meta_data->>'full_name', 'User ' || SPLIT_PART(u.email, '@', 1)),
  now() + interval '30 days',
  ('{"company_name": "' || SPLIT_PART(u.email, '@', 1) || ' Company"}')::jsonb
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.invitations i ON u.email = i.email AND i.invitation_type = 'tenant_owner'
WHERE p.user_id IS NULL
  AND i.email IS NULL
  AND u.email IS NOT NULL
ON CONFLICT (email, invitation_type) DO UPDATE SET
  status = 'pending',
  expires_at = now() + interval '30 days';

-- 3. Exécuter la fonction de réparation globale
DO $$
DECLARE
  user_record RECORD;
  total_users INTEGER := 0;
  repaired_users INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== DÉBUT RÉPARATION GLOBALE ===';
  
  -- Compter les utilisateurs sans profil
  SELECT COUNT(*) INTO total_users
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.user_id
  WHERE p.user_id IS NULL AND u.email IS NOT NULL;
  
  RAISE NOTICE 'Utilisateurs sans profil trouvés: %', total_users;
  
  -- Tenter la fonction de réparation automatique
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'repair_incomplete_users') THEN
    BEGIN
      RAISE NOTICE 'Exécution de repair_incomplete_users()...';
      PERFORM repair_incomplete_users();
      RAISE NOTICE 'SUCCESS: repair_incomplete_users() terminée';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'ERREUR dans repair_incomplete_users(): %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'ATTENTION: repair_incomplete_users() non trouvée, réparation manuelle...';
    
    -- Réparation manuelle pour chaque utilisateur
    FOR user_record IN 
      SELECT u.id, u.email, u.raw_user_meta_data
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.user_id
      WHERE p.user_id IS NULL AND u.email IS NOT NULL
    LOOP
      BEGIN
        -- Créer le profil manuellement
        INSERT INTO public.profiles (
          user_id,
          email,
          full_name,
          role
        ) VALUES (
          user_record.id,
          user_record.email,
          COALESCE(user_record.raw_user_meta_data->>'full_name', 'User ' || SPLIT_PART(user_record.email, '@', 1)),
          'tenant_owner'
        )
        ON CONFLICT (user_id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name;
        
        repaired_users := repaired_users + 1;
        RAISE NOTICE 'SUCCESS: Profil créé pour %', user_record.email;
        
      EXCEPTION
        WHEN OTHERS THEN
          error_count := error_count + 1;
          RAISE NOTICE 'ERREUR pour %: %', user_record.email, SQLERRM;
      END;
    END LOOP;
    
    RAISE NOTICE 'Réparation manuelle terminée: % réussis, % erreurs', repaired_users, error_count;
  END IF;
  
  RAISE NOTICE '=== FIN RÉPARATION GLOBALE ===';
END $$;

-- 4. Attendre et vérifier les résultats
SELECT pg_sleep(2);

-- 5. Résumé final
SELECT 
  '=== RÉSUMÉ FINAL ===' as section,
  COUNT(CASE WHEN p.user_id IS NOT NULL THEN 1 END) as users_with_profile,
  COUNT(CASE WHEN p.user_id IS NULL THEN 1 END) as users_without_profile,
  COUNT(*) as total_users
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.email IS NOT NULL;

-- 6. Lister les utilisateurs encore problématiques
SELECT 
  '=== UTILISATEURS ENCORE SANS PROFIL ===' as section,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
  AND u.email IS NOT NULL
ORDER BY u.created_at DESC;

-- 7. Instructions finales
SELECT 
  '=== INSTRUCTIONS ===' as section,
  'Tous les utilisateurs avec profils peuvent maintenant se connecter' as message
UNION ALL
SELECT 
  '=== INSTRUCTIONS ===' as section,
  'Les utilisateurs encore sans profil nécessitent une investigation manuelle' as message;

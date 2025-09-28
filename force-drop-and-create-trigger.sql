-- Script pour forcer la suppression et recréation du trigger global
-- Résout le problème de trigger déjà existant

-- 1. FORCER LA SUPPRESSION DE TOUS LES TRIGGERS
DO $$
BEGIN
  -- Supprimer tous les triggers possibles sur auth.users
  DROP TRIGGER IF EXISTS auto_tenant_creation_trigger ON auth.users;
  DROP TRIGGER IF EXISTS auto_tenant_creation_trigger_complete ON auth.users;
  DROP TRIGGER IF EXISTS auto_tenant_creation_trigger_complete_with_logs ON auth.users;
  DROP TRIGGER IF EXISTS auto_profile_creation_trigger ON auth.users;
  DROP TRIGGER IF EXISTS global_auto_tenant_creation_trigger ON auth.users;
  
  RAISE NOTICE '✅ Tous les triggers supprimés';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de la suppression: %', SQLERRM;
END $$;

-- 2. FONCTION PRINCIPALE : Auto-création complète tenant owner
CREATE OR REPLACE FUNCTION global_auto_create_tenant_owner()
RETURNS TRIGGER AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  new_tenant_id UUID;
  new_employee_id TEXT;
  company_name TEXT;
  user_full_name TEXT;
  permission_record RECORD;
BEGIN
  -- Extraire le nom complet depuis les métadonnées
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  RAISE NOTICE '🚀 DÉBUT AUTO-CRÉATION TENANT pour % (ID: %)', NEW.email, NEW.id;
  
  -- ÉTAPE 1: Vérifier l'invitation dans la table invitations
  SELECT * INTO invitation_data 
  FROM public.invitations 
  WHERE email = NEW.email 
    AND invitation_type = 'tenant_owner'
    AND status IN ('pending', 'sent')
    AND expires_at > now()
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF invitation_data.id IS NULL THEN
    RAISE NOTICE '📧 Aucune invitation trouvée, création automatique pour %', NEW.email;
    
    company_name := user_full_name || ' Company';
    
    -- Créer invitation automatiquement
    INSERT INTO public.invitations (
      email,
      invitation_type,
      status,
      full_name,
      expires_at,
      metadata
    ) VALUES (
      NEW.email,
      'tenant_owner',
      'pending',
      user_full_name,
      now() + interval '30 days',
      ('{"company_name": "' || company_name || '"}')::jsonb
    ) RETURNING * INTO invitation_data;
    
    RAISE NOTICE '✅ Invitation créée avec ID: %', invitation_data.id;
  ELSE
    company_name := COALESCE(
      invitation_data.metadata->>'company_name',
      user_full_name || ' Company'
    );
    RAISE NOTICE '✅ Invitation existante trouvée: %', invitation_data.id;
  END IF;
  
  -- ÉTAPE 2: Créer le tenant avec l'UUID de l'invitation (ou nouveau)
  IF invitation_data.tenant_id IS NOT NULL THEN
    -- Utiliser le tenant_id existant de l'invitation
    new_tenant_id := invitation_data.tenant_id;
    RAISE NOTICE '🏢 Tenant existant récupéré: %', new_tenant_id;
    
    -- Vérifier si le tenant existe vraiment dans la table tenants
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = new_tenant_id) THEN
      -- Créer le tenant avec l'UUID spécifié
      INSERT INTO public.tenants (id, name, created_by)
      VALUES (new_tenant_id, company_name, NEW.id);
      RAISE NOTICE '🏢 Tenant créé avec UUID existant: %', new_tenant_id;
    END IF;
  ELSE
    -- Créer un nouveau tenant
    INSERT INTO public.tenants (name, created_by)
    VALUES (company_name, NEW.id)
    RETURNING id INTO new_tenant_id;
    
    -- Mettre à jour l'invitation avec le nouveau tenant_id
    UPDATE public.invitations 
    SET tenant_id = new_tenant_id
    WHERE id = invitation_data.id;
    
    RAISE NOTICE '🏢 Nouveau tenant créé: %', new_tenant_id;
  END IF;
  
  -- ÉTAPE 3: Créer le profil de l'utilisateur dans la table profiles
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    tenant_id,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    new_tenant_id,
    'tenant_owner'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    tenant_id = EXCLUDED.tenant_id,
    role = EXCLUDED.role;
  
  RAISE NOTICE '👤 Profil créé pour %', NEW.email;
  
  -- ÉTAPE 4: Création du rôle tenant_admin (si n'existe pas)
  SELECT id INTO tenant_admin_role_id 
  FROM public.roles 
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    INSERT INTO public.roles (name, description) 
    VALUES ('tenant_admin', 'Administrateur de tenant')
    RETURNING id INTO tenant_admin_role_id;
    RAISE NOTICE '🔑 Rôle tenant_admin créé: %', tenant_admin_role_id;
  ELSE
    RAISE NOTICE '🔑 Rôle tenant_admin existant: %', tenant_admin_role_id;
  END IF;
  
  -- ÉTAPE 5: Attribution des permissions au rôle dans les tables permissions et role_permissions
  -- Créer les permissions de base si elles n'existent pas
  INSERT INTO public.permissions (name, description) VALUES
    ('manage_employees', 'Gérer les employés'),
    ('manage_projects', 'Gérer les projets'),
    ('manage_tasks', 'Gérer les tâches'),
    ('view_reports', 'Voir les rapports'),
    ('manage_settings', 'Gérer les paramètres')
  ON CONFLICT (name) DO NOTHING;
  
  -- Attribuer toutes les permissions au rôle tenant_admin
  FOR permission_record IN 
    SELECT id FROM public.permissions 
    WHERE name IN ('manage_employees', 'manage_projects', 'manage_tasks', 'view_reports', 'manage_settings')
  LOOP
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (tenant_admin_role_id, permission_record.id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE '🔐 Permissions attribuées au rôle tenant_admin';
  
  -- ÉTAPE 6: Création dans user_roles
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, tenant_admin_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RAISE NOTICE '👥 Rôle assigné à l''utilisateur %', NEW.email;
  
  -- ÉTAPE 7: Création de l'employé
  -- Générer employee_id unique
  SELECT 'EMP' || LPAD((COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1)::TEXT, 3, '0')
  INTO new_employee_id
  FROM public.employees 
  WHERE employee_id ~ '^EMP[0-9]+$';
  
  INSERT INTO public.employees (
    employee_id,
    email,
    full_name,
    user_id,
    tenant_id
  ) VALUES (
    new_employee_id,
    NEW.email,
    user_full_name,
    NEW.id,
    new_tenant_id
  )
  ON CONFLICT (user_id) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    tenant_id = EXCLUDED.tenant_id;
  
  RAISE NOTICE '👷 Employé créé: % pour %', new_employee_id, NEW.email;
  
  -- ÉTAPE 8: Mise à jour de l'invitation
  UPDATE public.invitations 
  SET status = 'accepted', 
      accepted_at = now()
  WHERE id = invitation_data.id;
  
  RAISE NOTICE '📬 Invitation marquée comme acceptée pour %', NEW.email;
  RAISE NOTICE '🎉 AUTO-CRÉATION TENANT TERMINÉE avec succès pour %', NEW.email;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERREUR AUTO-CRÉATION TENANT pour %: %', NEW.email, SQLERRM;
    RAISE NOTICE '🔍 Code erreur: %', SQLSTATE;
    -- Ne pas bloquer la création de l'utilisateur même en cas d'erreur
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CRÉER LE TRIGGER AVEC GESTION D'ERREUR
DO $$
BEGIN
  CREATE TRIGGER global_auto_tenant_creation_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION global_auto_create_tenant_owner();
  
  RAISE NOTICE '🎯 Trigger global_auto_tenant_creation_trigger créé avec succès';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE '⚠️ Trigger existe déjà, suppression forcée...';
    DROP TRIGGER global_auto_tenant_creation_trigger ON auth.users;
    
    CREATE TRIGGER global_auto_tenant_creation_trigger
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION global_auto_create_tenant_owner();
    
    RAISE NOTICE '🎯 Trigger recréé avec succès après suppression forcée';
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur création trigger: %', SQLERRM;
END $$;

-- 4. FONCTION DE RÉPARATION POUR LES UTILISATEURS EXISTANTS
CREATE OR REPLACE FUNCTION repair_all_existing_users()
RETURNS TEXT AS $$
DECLARE
  user_record RECORD;
  total_users INTEGER := 0;
  repaired_users INTEGER := 0;
  error_count INTEGER := 0;
  result_text TEXT;
BEGIN
  RAISE NOTICE '🔧 DÉBUT RÉPARATION UTILISATEURS EXISTANTS';
  
  -- Compter les utilisateurs sans profil
  SELECT COUNT(*) INTO total_users
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.user_id
  WHERE p.user_id IS NULL AND u.email IS NOT NULL;
  
  RAISE NOTICE 'Utilisateurs sans profil trouvés: %', total_users;
  
  -- Traiter chaque utilisateur sans profil
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.user_id
    WHERE p.user_id IS NULL AND u.email IS NOT NULL
    ORDER BY u.created_at
  LOOP
    BEGIN
      -- Créer manuellement les données pour cet utilisateur
      PERFORM global_auto_create_tenant_owner() FROM (
        SELECT user_record.id as id, 
               user_record.email as email, 
               user_record.raw_user_meta_data as raw_user_meta_data
      ) as NEW;
      
      repaired_users := repaired_users + 1;
      RAISE NOTICE '✅ Utilisateur réparé: %', user_record.email;
      
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE '❌ Erreur pour %: %', user_record.email, SQLERRM;
    END;
  END LOOP;
  
  result_text := format('Réparation terminée: %s/%s utilisateurs réparés, %s erreurs', 
                       repaired_users, total_users, error_count);
  RAISE NOTICE '🎉 %', result_text;
  
  RETURN result_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. PERMISSIONS
GRANT EXECUTE ON FUNCTION global_auto_create_tenant_owner() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION repair_all_existing_users() TO authenticated, anon;

-- 6. VÉRIFICATION FINALE
SELECT '🚀 INSTALLATION TERMINÉE' as status,
       'Trigger global installé avec gestion d''erreurs' as description;

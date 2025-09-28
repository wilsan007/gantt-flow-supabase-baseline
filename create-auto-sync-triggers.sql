-- =====================================================
-- SYSTÈME DE SYNCHRONISATION AUTOMATIQUE
-- profiles.role <-> roles <-> user_roles
-- =====================================================

-- 1. MODIFIER LA TABLE PROFILES POUR RÉFÉRENCER ROLES
-- =====================================================

-- Ajouter une colonne role_id pour référencer la table roles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

-- Créer un index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);

-- 2. FONCTION POUR RÉCUPÉRER LE ROLE_ID À PARTIR DU NOM
-- =====================================================

CREATE OR REPLACE FUNCTION get_role_id_by_name(role_name TEXT, tenant_uuid UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  role_uuid UUID;
BEGIN
  SELECT id INTO role_uuid
  FROM public.roles
  WHERE name = role_name 
  AND tenant_id = tenant_uuid
  LIMIT 1;
  
  RETURN role_uuid;
END;
$$;

-- 3. FONCTION POUR SYNCHRONISER PROFILES -> USER_ROLES
-- =====================================================

CREATE OR REPLACE FUNCTION sync_profile_to_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_role_id UUID;
BEGIN
  -- Cas INSERT : Nouveau profile créé
  IF TG_OP = 'INSERT' THEN
    -- Récupérer le role_id à partir du nom du rôle
    IF NEW.role IS NOT NULL THEN
      target_role_id := get_role_id_by_name(NEW.role, NEW.tenant_id);
      
      -- Mettre à jour role_id dans profiles
      IF target_role_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET role_id = target_role_id 
        WHERE id = NEW.id;
        
        -- Créer l'entrée dans user_roles
        INSERT INTO public.user_roles (
          user_id, 
          role_id, 
          context_type, 
          context_id, 
          tenant_id,
          is_active
        ) VALUES (
          NEW.user_id,
          target_role_id,
          'global',
          NEW.tenant_id,
          NEW.tenant_id,
          true
        ) ON CONFLICT (user_id, role_id, context_type, context_id) DO NOTHING;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;

  -- Cas UPDATE : Profile modifié
  IF TG_OP = 'UPDATE' THEN
    -- Si le rôle a changé
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      -- Supprimer l'ancien rôle dans user_roles
      IF OLD.role IS NOT NULL THEN
        DELETE FROM public.user_roles 
        WHERE user_id = OLD.user_id 
        AND tenant_id = OLD.tenant_id
        AND context_type = 'global';
      END IF;
      
      -- Ajouter le nouveau rôle
      IF NEW.role IS NOT NULL THEN
        target_role_id := get_role_id_by_name(NEW.role, NEW.tenant_id);
        
        IF target_role_id IS NOT NULL THEN
          -- Mettre à jour role_id dans profiles
          NEW.role_id := target_role_id;
          
          -- Créer la nouvelle entrée dans user_roles
          INSERT INTO public.user_roles (
            user_id, 
            role_id, 
            context_type, 
            context_id, 
            tenant_id,
            is_active
          ) VALUES (
            NEW.user_id,
            target_role_id,
            'global',
            NEW.tenant_id,
            NEW.tenant_id,
            true
          ) ON CONFLICT (user_id, role_id, context_type, context_id) DO NOTHING;
        END IF;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;

  -- Cas DELETE : Profile supprimé
  IF TG_OP = 'DELETE' THEN
    -- Supprimer toutes les entrées user_roles pour cet utilisateur
    DELETE FROM public.user_roles 
    WHERE user_id = OLD.user_id 
    AND tenant_id = OLD.tenant_id;
    
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- 4. CRÉER LES TRIGGERS
-- =====================================================

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS trigger_sync_profile_to_user_roles ON public.profiles;

-- Créer le trigger pour synchroniser profiles -> user_roles
CREATE TRIGGER trigger_sync_profile_to_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_user_roles();

-- 5. FONCTION POUR SYNCHRONISER LES DONNÉES EXISTANTES
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_existing_profiles_to_user_roles()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  profile_record RECORD;
  target_role_id UUID;
  migrated_count INTEGER := 0;
BEGIN
  -- Parcourir tous les profiles existants
  FOR profile_record IN 
    SELECT id, user_id, role, tenant_id 
    FROM public.profiles 
    WHERE role IS NOT NULL
  LOOP
    -- Récupérer le role_id
    target_role_id := get_role_id_by_name(profile_record.role, profile_record.tenant_id);
    
    IF target_role_id IS NOT NULL THEN
      -- Mettre à jour role_id dans profiles
      UPDATE public.profiles 
      SET role_id = target_role_id 
      WHERE id = profile_record.id;
      
      -- Créer l'entrée dans user_roles
      INSERT INTO public.user_roles (
        user_id, 
        role_id, 
        context_type, 
        context_id, 
        tenant_id,
        is_active
      ) VALUES (
        profile_record.user_id,
        target_role_id,
        'global',
        profile_record.tenant_id,
        profile_record.tenant_id,
        true
      ) ON CONFLICT (user_id, role_id, context_type, context_id) DO NOTHING;
      
      migrated_count := migrated_count + 1;
    END IF;
  END LOOP;
  
  RETURN format('Migration terminée: %s profiles synchronisés', migrated_count);
END;
$$;

-- 6. FONCTION POUR MAINTENIR LA COHÉRENCE ROLE_ID <-> ROLE
-- =====================================================

CREATE OR REPLACE FUNCTION sync_role_name_from_role_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  role_name_value TEXT;
BEGIN
  -- Si role_id est modifié, mettre à jour le nom du rôle
  IF TG_OP = 'UPDATE' AND OLD.role_id IS DISTINCT FROM NEW.role_id THEN
    IF NEW.role_id IS NOT NULL THEN
      SELECT name INTO role_name_value
      FROM public.roles
      WHERE id = NEW.role_id
      AND tenant_id = NEW.tenant_id;
      
      IF role_name_value IS NOT NULL THEN
        NEW.role := role_name_value;
      END IF;
    ELSE
      NEW.role := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger pour maintenir la cohérence
DROP TRIGGER IF EXISTS trigger_sync_role_name_from_role_id ON public.profiles;

CREATE TRIGGER trigger_sync_role_name_from_role_id
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_name_from_role_id();

-- 7. EXÉCUTER LA MIGRATION DES DONNÉES EXISTANTES
-- =====================================================

SELECT migrate_existing_profiles_to_user_roles();

-- 8. VÉRIFICATION ET STATISTIQUES
-- =====================================================

-- Afficher les statistiques après migration
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_records,
  COUNT(role) as with_role,
  COUNT(role_id) as with_role_id
FROM public.profiles
WHERE tenant_id = '878c5ac9-4e99-4baf-803a-14f8ac964ec4'

UNION ALL

SELECT 
  'user_roles' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_active THEN 1 END) as active_roles,
  COUNT(DISTINCT user_id) as unique_users
FROM public.user_roles
WHERE tenant_id = '878c5ac9-4e99-4baf-803a-14f8ac964ec4';

-- Afficher les correspondances pour vérification
SELECT 
  p.full_name,
  p.role as profile_role,
  r.name as role_name,
  ur.is_active,
  ur.context_type
FROM public.profiles p
LEFT JOIN public.roles r ON r.id = p.role_id
LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role_id = p.role_id
WHERE p.tenant_id = '878c5ac9-4e99-4baf-803a-14f8ac964ec4'
ORDER BY p.full_name;

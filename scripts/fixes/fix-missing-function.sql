-- =====================================================
-- CORRECTION: CRÉER LA FONCTION MANQUANTE get_role_id_by_name
-- =====================================================

-- 1. CRÉER LA FONCTION get_role_id_by_name
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

-- 2. FONCTION CORRIGÉE POUR FIXER LES USER_ROLES EXISTANTS
-- =====================================================

CREATE OR REPLACE FUNCTION fix_existing_user_roles_corrected()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  profile_record RECORD;
  target_role_id UUID;
  fixed_count INTEGER := 0;
BEGIN
  -- Parcourir tous les profiles existants
  FOR profile_record IN 
    SELECT id, user_id, role, tenant_id 
    FROM public.profiles 
    WHERE role IS NOT NULL
  LOOP
    -- Déterminer le role_id
    IF profile_record.role::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      -- C'est déjà un UUID
      target_role_id := profile_record.role::UUID;
    ELSE
      -- C'est un nom de rôle, le convertir
      target_role_id := get_role_id_by_name(profile_record.role, profile_record.tenant_id);
    END IF;
    
    IF target_role_id IS NOT NULL THEN
      -- UPSERT dans user_roles
      INSERT INTO public.user_roles (
        user_id, 
        role_id, 
        context_type, 
        context_id, 
        tenant_id,
        is_active,
        assigned_at,
        updated_at
      ) VALUES (
        profile_record.user_id,
        target_role_id,
        'global',
        profile_record.tenant_id,
        profile_record.tenant_id,
        true,
        now(),
        now()
      ) 
      ON CONFLICT (user_id, role_id, context_type, context_id) 
      DO UPDATE SET
        is_active = true,
        updated_at = now();
      
      fixed_count := fixed_count + 1;
    END IF;
  END LOOP;
  
  RETURN format('Correction terminée: %s profiles synchronisés avec user_roles', fixed_count);
END;
$$;

-- 3. EXÉCUTER LA CORRECTION
-- =====================================================

SELECT fix_existing_user_roles_corrected();

-- 4. CORRIGER LE TRIGGER POUR UTILISER LA BONNE FONCTION
-- =====================================================

CREATE OR REPLACE FUNCTION sync_profile_to_user_roles_corrected()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_role_id UUID;
BEGIN
  -- Cas INSERT : Nouveau profile créé
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS NOT NULL THEN
      -- Si NEW.role est déjà un UUID
      IF NEW.role::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        target_role_id := NEW.role::UUID;
      ELSE
        -- Si NEW.role est un nom de rôle
        target_role_id := get_role_id_by_name(NEW.role, NEW.tenant_id);
      END IF;
      
      IF target_role_id IS NOT NULL THEN
        -- UPSERT dans user_roles
        INSERT INTO public.user_roles (
          user_id, 
          role_id, 
          context_type, 
          context_id, 
          tenant_id,
          is_active,
          assigned_at,
          updated_at
        ) VALUES (
          NEW.user_id,
          target_role_id,
          'global',
          NEW.tenant_id,
          NEW.tenant_id,
          true,
          now(),
          now()
        ) 
        ON CONFLICT (user_id, role_id, context_type, context_id) 
        DO UPDATE SET
          is_active = true,
          updated_at = now();
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;

  -- Cas UPDATE : Profile modifié
  IF TG_OP = 'UPDATE' THEN
    -- Si le rôle a changé
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      
      -- Désactiver tous les anciens rôles pour cet utilisateur dans ce contexte
      UPDATE public.user_roles 
      SET is_active = false,
          updated_at = now()
      WHERE user_id = OLD.user_id 
      AND tenant_id = OLD.tenant_id
      AND context_type = 'global';
      
      -- Ajouter/activer le nouveau rôle
      IF NEW.role IS NOT NULL THEN
        -- Si NEW.role est déjà un UUID
        IF NEW.role::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
          target_role_id := NEW.role::UUID;
        ELSE
          -- Si NEW.role est un nom de rôle
          target_role_id := get_role_id_by_name(NEW.role, NEW.tenant_id);
        END IF;
        
        IF target_role_id IS NOT NULL THEN
          -- UPSERT dans user_roles
          INSERT INTO public.user_roles (
            user_id, 
            role_id, 
            context_type, 
            context_id, 
            tenant_id,
            is_active,
            assigned_at,
            updated_at
          ) VALUES (
            NEW.user_id,
            target_role_id,
            'global',
            NEW.tenant_id,
            NEW.tenant_id,
            true,
            now(),
            now()
          ) 
          ON CONFLICT (user_id, role_id, context_type, context_id) 
          DO UPDATE SET
            is_active = true,
            updated_at = now();
        END IF;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;

  -- Cas DELETE : Profile supprimé
  IF TG_OP = 'DELETE' THEN
    -- Désactiver toutes les entrées user_roles pour cet utilisateur
    UPDATE public.user_roles 
    SET is_active = false,
        updated_at = now()
    WHERE user_id = OLD.user_id 
    AND tenant_id = OLD.tenant_id;
    
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- 5. REMPLACER LE TRIGGER
-- =====================================================

-- Supprimer les anciens triggers
DROP TRIGGER IF EXISTS trigger_sync_profile_to_user_roles ON public.profiles;
DROP TRIGGER IF EXISTS trigger_sync_profile_to_user_roles_v2 ON public.profiles;
DROP TRIGGER IF EXISTS trigger_sync_profile_to_user_roles_fixed ON public.profiles;
DROP TRIGGER IF EXISTS trigger_sync_profile_to_user_roles_final ON public.profiles;
DROP TRIGGER IF EXISTS trigger_sync_profile_to_user_roles_corrected ON public.profiles;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_sync_profile_to_user_roles_corrected
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_user_roles_corrected();

-- 6. VÉRIFICATIONS
-- =====================================================

-- Statistiques après correction
SELECT 
  'Statistiques après correction:' as info,
  (SELECT COUNT(*) FROM public.profiles WHERE role IS NOT NULL) as profiles_with_role,
  (SELECT COUNT(*) FROM public.user_roles WHERE is_active = true) as active_user_roles,
  (SELECT COUNT(DISTINCT user_id) FROM public.user_roles WHERE is_active = true) as users_with_roles;

-- Vérifier l'utilisateur spécifique
SELECT 
  p.full_name,
  p.role as profile_role,
  CASE 
    WHEN p.role::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN 'UUID' 
    ELSE 'TEXT' 
  END as role_type,
  r.name as role_name,
  r.display_name,
  ur.is_active,
  ur.updated_at
FROM public.profiles p
LEFT JOIN public.roles r ON r.id = (
  CASE 
    WHEN p.role::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN p.role::UUID 
    ELSE get_role_id_by_name(p.role, p.tenant_id)
  END
)
LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role_id = r.id AND ur.is_active = true
WHERE p.user_id = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';

SELECT 'Fonction get_role_id_by_name créée et triggers corrigés avec succès!' as result;

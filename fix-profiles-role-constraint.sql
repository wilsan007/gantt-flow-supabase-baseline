-- =====================================================
-- CORRECTION DE LA CONTRAINTE FOREIGN KEY SUR PROFILES.ROLE
-- Supprimer la contrainte incorrecte et recréer proprement
-- =====================================================

-- 1. SUPPRIMER LA CONTRAINTE FOREIGN KEY INCORRECTE
-- =====================================================

-- Identifier et supprimer la contrainte existante
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_id_fkey;

-- 2. CONVERTIR LA COLONNE ROLE DE TEXT VERS UUID
-- =====================================================

-- Créer une colonne temporaire pour stocker les UUIDs
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_uuid UUID;

-- Fonction pour convertir les noms de rôles en UUIDs
CREATE OR REPLACE FUNCTION convert_role_text_to_uuid()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  profile_record RECORD;
  target_role_id UUID;
BEGIN
  -- Parcourir tous les profiles
  FOR profile_record IN 
    SELECT id, user_id, role, tenant_id 
    FROM public.profiles 
    WHERE role IS NOT NULL
  LOOP
    -- Si c'est déjà un UUID, l'utiliser directement
    IF profile_record.role ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      target_role_id := profile_record.role::UUID;
    ELSE
      -- Sinon, chercher le rôle par nom
      SELECT id INTO target_role_id
      FROM public.roles
      WHERE name = profile_record.role 
      AND tenant_id = profile_record.tenant_id
      LIMIT 1;
    END IF;
    
    -- Mettre à jour la colonne temporaire
    IF target_role_id IS NOT NULL THEN
      UPDATE public.profiles 
      SET role_uuid = target_role_id
      WHERE id = profile_record.id;
    END IF;
  END LOOP;
END;
$$;

-- Exécuter la conversion
SELECT convert_role_text_to_uuid();

-- 3. REMPLACER L'ANCIENNE COLONNE PAR LA NOUVELLE
-- =====================================================

-- Sauvegarder l'ancienne colonne
ALTER TABLE public.profiles RENAME COLUMN role TO role_old_text;

-- Renommer la nouvelle colonne
ALTER TABLE public.profiles RENAME COLUMN role_uuid TO role;

-- 4. AJOUTER LA CONTRAINTE FOREIGN KEY CORRECTE
-- =====================================================

-- Ajouter la contrainte foreign key
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_fkey 
FOREIGN KEY (role) REFERENCES public.roles(id) ON DELETE SET NULL;

-- Créer un index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 5. METTRE À JOUR LES TRIGGERS POUR LA NOUVELLE STRUCTURE
-- =====================================================

-- Fonction de trigger mise à jour pour la nouvelle structure
CREATE OR REPLACE FUNCTION sync_profile_to_user_roles_final()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Cas INSERT : Nouveau profile créé
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS NOT NULL THEN
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
        NEW.role,
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
    
    RETURN NEW;
  END IF;

  -- Cas UPDATE : Profile modifié
  IF TG_OP = 'UPDATE' THEN
    -- Si le rôle a changé
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      
      -- Désactiver l'ancien rôle
      IF OLD.role IS NOT NULL THEN
        UPDATE public.user_roles 
        SET is_active = false,
            updated_at = now()
        WHERE user_id = OLD.user_id 
        AND role_id = OLD.role
        AND tenant_id = OLD.tenant_id
        AND context_type = 'global';
      END IF;
      
      -- Activer le nouveau rôle
      IF NEW.role IS NOT NULL THEN
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
          NEW.role,
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

-- Remplacer le trigger
DROP TRIGGER IF EXISTS trigger_sync_profile_to_user_roles ON public.profiles;
DROP TRIGGER IF EXISTS trigger_sync_profile_to_user_roles_v2 ON public.profiles;
DROP TRIGGER IF EXISTS trigger_sync_profile_to_user_roles_fixed ON public.profiles;
DROP TRIGGER IF EXISTS trigger_sync_profile_to_user_roles_final ON public.profiles;

CREATE TRIGGER trigger_sync_profile_to_user_roles_final
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_user_roles_final();

-- 6. SYNCHRONISER LES DONNÉES EXISTANTES
-- =====================================================

-- Fonction pour synchroniser tous les profiles existants
CREATE OR REPLACE FUNCTION sync_all_existing_profiles()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  profile_record RECORD;
  synced_count INTEGER := 0;
BEGIN
  -- Parcourir tous les profiles avec un rôle
  FOR profile_record IN 
    SELECT id, user_id, role, tenant_id 
    FROM public.profiles 
    WHERE role IS NOT NULL
  LOOP
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
      profile_record.role,
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
    
    synced_count := synced_count + 1;
  END LOOP;
  
  RETURN format('Synchronisation terminée: %s profiles traités', synced_count);
END;
$$;

-- Exécuter la synchronisation
SELECT sync_all_existing_profiles();

-- 7. VÉRIFICATIONS FINALES
-- =====================================================

-- Statistiques après correction
SELECT 
  'Statistiques finales:' as info,
  (SELECT COUNT(*) FROM public.profiles WHERE role IS NOT NULL) as profiles_with_role,
  (SELECT COUNT(*) FROM public.user_roles WHERE is_active = true) as active_user_roles,
  (SELECT COUNT(DISTINCT user_id) FROM public.user_roles WHERE is_active = true) as users_with_active_roles;

-- Vérifier la structure pour l'utilisateur spécifique
SELECT 
  p.full_name,
  r.name as role_name,
  r.display_name as role_display,
  ur.is_active,
  ur.updated_at
FROM public.profiles p
LEFT JOIN public.roles r ON r.id = p.role
LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role_id = p.role AND ur.is_active = true
WHERE p.user_id = 'ebb4c3fe-6288-41df-972d-4a6f32ed813d';

-- 8. NETTOYER LES COLONNES TEMPORAIRES (OPTIONNEL)
-- =====================================================

-- Décommenter après vérification que tout fonctionne
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS role_old_text;

-- Message de confirmation
SELECT 'Migration terminée! profiles.role est maintenant un UUID avec contrainte FK correcte' as result;

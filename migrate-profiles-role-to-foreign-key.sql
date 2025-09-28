-- =====================================================
-- MIGRATION: PROFILES.ROLE TEXT -> FOREIGN KEY
-- Convertir la colonne role de TEXT vers UUID (référence vers roles.id)
-- =====================================================

-- 1. SAUVEGARDER LES DONNÉES EXISTANTES
-- =====================================================

-- Créer une table temporaire pour sauvegarder les correspondances
CREATE TEMP TABLE role_mapping AS
SELECT DISTINCT
  p.role as role_text,
  r.id as role_id,
  r.name as role_name,
  p.tenant_id
FROM public.profiles p
LEFT JOIN public.roles r ON r.name = p.role AND r.tenant_id = p.tenant_id
WHERE p.role IS NOT NULL;

-- Afficher les correspondances trouvées
SELECT 
  'Correspondances trouvées:' as info,
  role_text,
  role_name,
  CASE WHEN role_id IS NOT NULL THEN 'TROUVÉ' ELSE 'MANQUANT' END as status
FROM role_mapping;

-- 2. CRÉER LES RÔLES MANQUANTS
-- =====================================================

-- Insérer les rôles manquants basés sur les valeurs texte dans profiles
INSERT INTO public.roles (name, display_name, description, hierarchy_level, tenant_id)
SELECT DISTINCT
  p.role as name,
  INITCAP(p.role) as display_name,
  'Rôle créé automatiquement depuis profiles' as description,
  50 as hierarchy_level, -- Niveau moyen
  p.tenant_id
FROM public.profiles p
WHERE p.role IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.roles r 
  WHERE r.name = p.role 
  AND r.tenant_id = p.tenant_id
)
ON CONFLICT (name, tenant_id) DO NOTHING;

-- 3. AJOUTER LA NOUVELLE COLONNE ROLE_ID
-- =====================================================

-- Ajouter la colonne role_id si elle n'existe pas déjà
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

-- Créer un index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);

-- 4. MIGRER LES DONNÉES EXISTANTES
-- =====================================================

-- Mettre à jour role_id basé sur le texte de la colonne role
UPDATE public.profiles 
SET role_id = r.id
FROM public.roles r
WHERE r.name = profiles.role 
AND r.tenant_id = profiles.tenant_id
AND profiles.role IS NOT NULL;

-- Vérifier la migration
SELECT 
  'Migration status:' as info,
  COUNT(*) as total_profiles,
  COUNT(role) as profiles_with_role_text,
  COUNT(role_id) as profiles_with_role_id,
  COUNT(CASE WHEN role IS NOT NULL AND role_id IS NULL THEN 1 END) as failed_migrations
FROM public.profiles;

-- 5. RENOMMER L'ANCIENNE COLONNE ET CRÉER LA NOUVELLE
-- =====================================================

-- Renommer l'ancienne colonne role en role_legacy
ALTER TABLE public.profiles RENAME COLUMN role TO role_legacy;

-- Créer la nouvelle colonne role comme foreign key
ALTER TABLE public.profiles 
ADD COLUMN role UUID REFERENCES public.roles(id) ON DELETE SET NULL;

-- Copier les données de role_id vers la nouvelle colonne role
UPDATE public.profiles SET role = role_id WHERE role_id IS NOT NULL;

-- Supprimer la colonne role_id temporaire
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role_id;

-- 6. CRÉER UNE VUE POUR LA COMPATIBILITÉ
-- =====================================================

-- Vue pour maintenir la compatibilité avec l'ancien système
CREATE OR REPLACE VIEW profiles_with_role_names AS
SELECT 
  p.*,
  r.name as role_name,
  r.display_name as role_display_name
FROM public.profiles p
LEFT JOIN public.roles r ON r.id = p.role;

-- 7. METTRE À JOUR LES TRIGGERS
-- =====================================================

-- Fonction mise à jour pour utiliser la nouvelle structure
CREATE OR REPLACE FUNCTION sync_profile_to_user_roles_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Cas INSERT : Nouveau profile créé
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS NOT NULL THEN
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
        NEW.role,
        'global',
        NEW.tenant_id,
        NEW.tenant_id,
        true
      ) ON CONFLICT (user_id, role_id, context_type, context_id) DO NOTHING;
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
        AND role_id = OLD.role
        AND tenant_id = OLD.tenant_id
        AND context_type = 'global';
      END IF;
      
      -- Ajouter le nouveau rôle
      IF NEW.role IS NOT NULL THEN
        INSERT INTO public.user_roles (
          user_id, 
          role_id, 
          context_type, 
          context_id, 
          tenant_id,
          is_active
        ) VALUES (
          NEW.user_id,
          NEW.role,
          'global',
          NEW.tenant_id,
          NEW.tenant_id,
          true
        ) ON CONFLICT (user_id, role_id, context_type, context_id) DO NOTHING;
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

-- Remplacer le trigger existant
DROP TRIGGER IF EXISTS trigger_sync_profile_to_user_roles ON public.profiles;
DROP TRIGGER IF EXISTS trigger_sync_profile_to_user_roles_v2 ON public.profiles;

CREATE TRIGGER trigger_sync_profile_to_user_roles_v2
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_user_roles_v2();

-- 8. MIGRER LES DONNÉES EXISTANTES VERS USER_ROLES
-- =====================================================

-- Fonction pour migrer les profiles existants
CREATE OR REPLACE FUNCTION migrate_existing_profiles_v2()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  profile_record RECORD;
  migrated_count INTEGER := 0;
BEGIN
  -- Parcourir tous les profiles existants
  FOR profile_record IN 
    SELECT id, user_id, role, tenant_id 
    FROM public.profiles 
    WHERE role IS NOT NULL
  LOOP
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
      profile_record.role,
      'global',
      profile_record.tenant_id,
      profile_record.tenant_id,
      true
    ) ON CONFLICT (user_id, role_id, context_type, context_id) DO NOTHING;
    
    migrated_count := migrated_count + 1;
  END LOOP;
  
  RETURN format('Migration v2 terminée: %s profiles synchronisés', migrated_count);
END;
$$;

-- Exécuter la migration
SELECT migrate_existing_profiles_v2();

-- 9. VÉRIFICATIONS FINALES
-- =====================================================

-- Vérifier la structure finale
SELECT 
  'Structure finale:' as info,
  COUNT(*) as total_profiles,
  COUNT(role) as profiles_with_role_uuid,
  COUNT(role_legacy) as profiles_with_role_text
FROM public.profiles;

-- Vérifier les user_roles
SELECT 
  'User roles:' as info,
  COUNT(*) as total_user_roles,
  COUNT(DISTINCT user_id) as unique_users
FROM public.user_roles;

-- Afficher quelques exemples
SELECT 
  p.full_name,
  p.role_legacy as old_role_text,
  r.name as new_role_name,
  r.display_name,
  ur.is_active
FROM public.profiles p
LEFT JOIN public.roles r ON r.id = p.role
LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role_id = p.role
LIMIT 5;

-- 10. NETTOYER LES COLONNES TEMPORAIRES (OPTIONNEL)
-- =====================================================

-- Décommenter ces lignes après vérification que tout fonctionne
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS role_legacy;

-- Message de fin
SELECT 'Migration terminée avec succès! La colonne profiles.role est maintenant une foreign key vers roles.id' as result;

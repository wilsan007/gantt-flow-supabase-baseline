-- ==============================================
-- SYSTÈME COMPLET DE CRÉATION TENANT OWNER SÉCURISÉ
-- ==============================================
-- Combine la génération d'employee_id et la création tenant owner
-- Évite les insertions dans les tables de définition globales

BEGIN;

-- ==============================================
-- 1. FONCTION create_tenant_owner_from_invitation SÉCURISÉE
-- ==============================================

CREATE OR REPLACE FUNCTION create_tenant_owner_from_invitation(
  invitation_token TEXT,
  user_id UUID,
  company_name TEXT,
  company_slug TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  created_tenant_id UUID;
  generated_employee_id TEXT;
  max_number INTEGER := 0;
  next_number INTEGER;
  candidate_id TEXT;
  result JSON;
BEGIN
  -- Valider le token d'invitation
  SELECT * INTO invitation_data
  FROM public.invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now()
    AND invitation_type = 'tenant_owner';
    
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Token d''invitation invalide ou expiré');
  END IF;
  
  -- Récupérer l'ID du rôle tenant_admin depuis la table GLOBALE
  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Rôle tenant_admin non trouvé dans les rôles globaux');
  END IF;
  
  -- Générer le slug si non fourni
  IF company_slug IS NULL THEN
    company_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g'));
    company_slug := regexp_replace(company_slug, '-+', '-', 'g');
    company_slug := trim(company_slug, '-');
  END IF;
  
  created_tenant_id := invitation_data.tenant_id;

  -- ÉTAPE 1: Créer le tenant UNIQUEMENT
  INSERT INTO public.tenants (
    id,
    name,
    slug,
    status,
    created_at,
    updated_at
  ) VALUES (
    created_tenant_id,
    company_name,
    company_slug,
    'active',
    now(),
    now()
  );
  
  -- ÉTAPE 2: Créer le profil utilisateur UNIQUEMENT
  INSERT INTO public.profiles (
    user_id,
    tenant_id,
    full_name,
    email,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    created_tenant_id,
    invitation_data.full_name,
    invitation_data.email,
    now(),
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    tenant_id = created_tenant_id,
    full_name = invitation_data.full_name,
    email = invitation_data.email,
    updated_at = now();
  
  -- ÉTAPE 3: Assigner le rôle tenant_admin UNIQUEMENT (référence au rôle global)
  INSERT INTO public.user_roles (
    user_id,
    role_id,
    tenant_id,
    is_active,
    created_at
  ) VALUES (
    user_id,
    tenant_admin_role_id,
    created_tenant_id,
    true,
    now()
  ) ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE SET
    is_active = true,
    updated_at = now();

  -- ÉTAPE 4: Générer un employee_id unique pour ce tenant (logique intégrée)
  -- Trouver le numéro maximum existant pour ce tenant
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN employee_id ~ '^EMP[0-9]{3}$' 
        THEN CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)
        ELSE 0
      END
    ), 0
  ) INTO max_number
  FROM public.employees 
  WHERE tenant_id = created_tenant_id;
  
  -- Commencer à partir du maximum + 1
  next_number := max_number + 1;
  
  -- Boucle de sécurité pour vérifier l'unicité
  LOOP
    candidate_id := 'EMP' || LPAD(next_number::TEXT, 3, '0');
    
    -- Vérifier si cet ID existe déjà
    IF NOT EXISTS (
      SELECT 1 FROM public.employees 
      WHERE tenant_id = created_tenant_id 
      AND employee_id = candidate_id
    ) THEN
      generated_employee_id := candidate_id;
      EXIT; -- Sortir de la boucle
    END IF;
    
    -- Si l'ID existe (cas rare), essayer le suivant
    next_number := next_number + 1;
    
    -- Sécurité : limiter à 999 employés par tenant
    IF next_number > 999 THEN
      RAISE EXCEPTION 'Limite de 999 employés atteinte pour le tenant %', created_tenant_id;
    END IF;
  END LOOP;

  -- ÉTAPE 5: Créer l'enregistrement employé UNIQUEMENT
  INSERT INTO public.employees (
    user_id,
    employee_id,
    full_name,
    email,
    job_title,
    hire_date,
    contract_type,
    status,
    tenant_id,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    generated_employee_id,
    invitation_data.full_name,
    invitation_data.email,
    'Directeur Général',
    CURRENT_DATE,
    'CDI',
    'active',
    created_tenant_id,
    now(),
    now()
  );
  
  -- ÉTAPE 6: Marquer l'invitation comme acceptée
  UPDATE public.invitations
  SET 
    status = 'accepted',
    accepted_at = now(),
    metadata = jsonb_build_object(
      'company_name', company_name,
      'company_slug', company_slug,
      'user_id', user_id,
      'employee_id', generated_employee_id
    )
  WHERE id = invitation_data.id;
  
  -- Retourner le résultat
  result := json_build_object(
    'success', true,
    'tenant_id', created_tenant_id,
    'tenant_name', company_name,
    'tenant_slug', company_slug,
    'user_id', user_id,
    'employee_id', generated_employee_id,
    'role', 'tenant_admin',
    'message', 'Tenant owner créé avec succès - utilise les rôles globaux existants'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Erreur lors de la création: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 2. TRIGGER auto_create_tenant_owner SÉCURISÉ
-- ==============================================

CREATE OR REPLACE FUNCTION auto_create_tenant_owner()
RETURNS TRIGGER AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  generated_employee_id TEXT;
  company_name TEXT;
BEGIN
  -- Vérifier si l'utilisateur a déjà un profil (pas première connexion)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Chercher une invitation en attente pour cet email
  SELECT * INTO invitation_data
  FROM public.invitations
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
    AND invitation_type = 'tenant_owner';
    
  -- Si pas d'invitation tenant_owner, ne rien faire
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Récupérer l'ID du rôle tenant_admin depuis la table GLOBALE
  SELECT id INTO tenant_admin_role_id
  FROM public.roles
  WHERE name = 'tenant_admin';
  
  IF tenant_admin_role_id IS NULL THEN
    RAISE WARNING 'Rôle tenant_admin non trouvé dans les rôles globaux';
    RETURN NEW;
  END IF;

  -- Extraire le nom de l'entreprise depuis les métadonnées ou utiliser un défaut
  company_name := COALESCE(
    invitation_data.metadata->>'company_name',
    invitation_data.full_name || ' Company'
  );

  -- ÉTAPE 1: Créer le tenant UNIQUEMENT
  INSERT INTO public.tenants (
    id,
    name,
    status,
    created_at,
    updated_at
  ) VALUES (
    invitation_data.tenant_id,
    company_name,
    'active',
    now(),
    now()
  );

  -- ÉTAPE 2: Créer le profil utilisateur UNIQUEMENT
  INSERT INTO public.profiles (
    user_id,
    tenant_id,
    full_name,
    email,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    invitation_data.tenant_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', invitation_data.full_name),
    NEW.email,
    'tenant_admin',
    now(),
    now()
  );

  -- ÉTAPE 3: Assigner le rôle tenant_admin UNIQUEMENT (référence au rôle global)
  INSERT INTO public.user_roles (
    user_id,
    role_id,
    tenant_id,
    is_active,
    created_at
  ) VALUES (
    NEW.id,
    tenant_admin_role_id,
    invitation_data.tenant_id,
    true,
    now()
  );

  -- ÉTAPE 4: Générer un employee_id unique pour ce tenant (utilise la fonction sécurisée)
  generated_employee_id := generate_next_employee_id(invitation_data.tenant_id);

  -- ÉTAPE 5: Créer l'enregistrement employé UNIQUEMENT
  INSERT INTO public.employees (
    user_id,
    employee_id,
    full_name,
    email,
    job_title,
    hire_date,
    contract_type,
    status,
    tenant_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    generated_employee_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', invitation_data.full_name),
    NEW.email,
    'Directeur Général',
    CURRENT_DATE,
    'CDI',
    'active',
    invitation_data.tenant_id,
    now(),
    now()
  );

  -- ÉTAPE 6: Marquer l'invitation comme acceptée
  UPDATE public.invitations
  SET 
    status = 'accepted',
    accepted_at = now(),
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{completed_by}',
      to_jsonb(NEW.id)
    )
  WHERE id = invitation_data.id;

  -- Log de succès
  RAISE NOTICE 'Tenant owner créé automatiquement (SÉCURISÉ): user_id=%, tenant_id=%, company=%, employee_id=%', 
    NEW.id, invitation_data.tenant_id, company_name, generated_employee_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log de l'erreur mais ne pas bloquer la connexion
    RAISE WARNING 'Erreur création automatique tenant owner (SÉCURISÉ): %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 4. FONCTIONS UTILITAIRES
-- ==============================================

-- Fonction pour valider un token et récupérer les infos
CREATE OR REPLACE FUNCTION get_invitation_info(invitation_token TEXT)
RETURNS JSON AS $$
DECLARE
  invitation_data RECORD;
BEGIN
  SELECT 
    id,
    email,
    full_name,
    tenant_id,
    invitation_type,
    status,
    expires_at,
    created_at
  INTO invitation_data
  FROM public.invitations
  WHERE token = invitation_token;
  
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Token non trouvé');
  END IF;
  
  IF invitation_data.status != 'pending' THEN
    RETURN json_build_object(
      'valid', false, 
      'error', 'Invitation déjà utilisée ou annulée',
      'status', invitation_data.status
    );
  END IF;
  
  IF invitation_data.expires_at <= now() THEN
    RETURN json_build_object('valid', false, 'error', 'Invitation expirée');
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'email', invitation_data.email,
    'full_name', invitation_data.full_name,
    'tenant_id', invitation_data.tenant_id,
    'invitation_type', invitation_data.invitation_type,
    'expires_at', invitation_data.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour générer un slug unique
CREATE OR REPLACE FUNCTION generate_unique_tenant_slug(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Nettoyer le nom de base
  base_slug := lower(regexp_replace(base_name, '[^a-zA-Z0-9]', '-', 'g'));
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  -- Limiter la longueur
  base_slug := substring(base_slug, 1, 50);
  
  final_slug := base_slug;
  
  -- Vérifier l'unicité et ajouter un numéro si nécessaire
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 5. RECRÉER LE TRIGGER
-- ==============================================

DROP TRIGGER IF EXISTS auto_tenant_creation_trigger ON auth.users;

CREATE TRIGGER auto_tenant_creation_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tenant_owner();

-- ==============================================
-- 6. VÉRIFICATIONS DE SÉCURITÉ
-- ==============================================

-- Vérifier que les rôles globaux existent
SELECT 
  'Vérification rôles globaux' as check_name,
  COUNT(*) as roles_count,
  array_agg(name) as available_roles
FROM public.roles 
WHERE name IN ('tenant_admin', 'admin', 'hr_manager', 'project_manager', 'employee', 'viewer');

-- Vérifier que les permissions globales existent
SELECT 
  'Vérification permissions globales' as check_name,
  COUNT(*) as permissions_count
FROM public.permissions;

-- Vérifier que les liaisons role_permissions globales existent
SELECT 
  'Vérification liaisons globales' as check_name,
  COUNT(*) as role_permissions_count
FROM public.role_permissions;

-- Test de génération employee_id
SELECT 
  'Test génération employee_id' as test_name,
  generate_next_employee_id('00000000-0000-0000-0000-000000000001'::UUID) as sample_id;

COMMIT;

-- ==============================================
-- COMMENTAIRES ET DOCUMENTATION
-- ==============================================

COMMENT ON FUNCTION generate_next_employee_id IS 'Génère un employee_id unique par tenant (EMP001, EMP002, etc.) - Version optimisée';
COMMENT ON FUNCTION generate_unique_employee_id IS 'Génère un employee_id unique par tenant - Version recherche complète';
COMMENT ON FUNCTION create_tenant_owner_from_invitation IS 'Crée un tenant owner complet à partir d''une invitation valide - Version sécurisée';
COMMENT ON FUNCTION auto_create_tenant_owner IS 'Crée automatiquement un tenant owner à la première connexion - Version sécurisée';
COMMENT ON FUNCTION get_invitation_info IS 'Récupère et valide les informations d''une invitation';
COMMENT ON FUNCTION generate_unique_tenant_slug IS 'Génère un slug unique pour un tenant';

/*
==============================================
SYSTÈME COMPLET TENANT OWNER SÉCURISÉ
==============================================

FONCTIONNALITÉS INCLUSES:
✅ Génération employee_id sécurisée (EMP001, EMP002, etc.)
✅ Création tenant owner via invitation
✅ Trigger automatique à la première connexion
✅ Aucune insertion dans les tables de définition globales
✅ Utilisation exclusive des rôles/permissions globaux
✅ Gestion complète des erreurs
✅ Fonctions utilitaires (slug, validation)

ORDRE D'EXÉCUTION:
1. ÉTAPE 1: Créer le tenant
2. ÉTAPE 2: Créer le profil utilisateur
3. ÉTAPE 3: Assigner le rôle tenant_admin
4. ÉTAPE 4: Générer employee_id unique
5. ÉTAPE 5: Créer l'enregistrement employé
6. ÉTAPE 6: Mettre à jour l'invitation

TABLES CRÉÉES:
- tenants (nouveau tenant)
- profiles (profil utilisateur)
- user_roles (attribution rôle tenant_admin)
- employees (employé avec employee_id unique)

SÉCURITÉ:
- Aucun doublon employee_id possible
- Référence aux rôles globaux uniquement
- Compatible avec les 11 tables de définition converties
- Gestion d'erreurs sans blocage
*/
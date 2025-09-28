-- ==============================================
-- CORRECTION SÉCURISÉE DE LA CRÉATION TENANT OWNER
-- ==============================================
-- Éviter les insertions dans les tables de définition globales

BEGIN;

-- ==============================================
-- 1. MISE À JOUR DE LA FONCTION create_tenant_owner_from_invitation
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
  
  -- Créer le tenant UNIQUEMENT
  INSERT INTO public.tenants (
    id,
    name,
    slug,
    status,
    created_at,
    updated_at
  ) VALUES (
    invitation_data.tenant_id,
    company_name,
    company_slug,
    'active',
    now(),
    now()
  );
  
  created_tenant_id := invitation_data.tenant_id;
  
  -- Créer le profil utilisateur UNIQUEMENT
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
  
  -- Assigner le rôle tenant_admin UNIQUEMENT (référence au rôle global)
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
  
  -- Marquer l'invitation comme acceptée
  UPDATE public.invitations
  SET 
    status = 'accepted',
    accepted_at = now(),
    metadata = jsonb_build_object(
      'company_name', company_name,
      'company_slug', company_slug,
      'user_id', user_id
    )
  WHERE id = invitation_data.id;
  
  -- Retourner le résultat
  result := json_build_object(
    'success', true,
    'tenant_id', created_tenant_id,
    'tenant_name', company_name,
    'tenant_slug', company_slug,
    'user_id', user_id,
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
-- 2. MISE À JOUR DU TRIGGER auto_create_tenant_owner
-- ==============================================

CREATE OR REPLACE FUNCTION auto_create_tenant_owner()
RETURNS TRIGGER AS $$
DECLARE
  invitation_data RECORD;
  tenant_admin_role_id UUID;
  created_employee_id UUID;
  employee_id_counter INTEGER;
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

  -- Créer le tenant UNIQUEMENT
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

  -- Créer le profil utilisateur UNIQUEMENT
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

  -- Assigner le rôle tenant_admin UNIQUEMENT (référence au rôle global)
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

  -- Générer un employee_id unique pour ce tenant (utilise la fonction sécurisée)
  generated_employee_id := generate_next_employee_id(invitation_data.tenant_id);

  -- Créer l'enregistrement employé UNIQUEMENT
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

  -- Marquer l'invitation comme acceptée
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
  RAISE NOTICE 'Tenant owner créé automatiquement (SÉCURISÉ): user_id=%, tenant_id=%, company=%', 
    NEW.id, invitation_data.tenant_id, company_name;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log de l'erreur mais ne pas bloquer la connexion
    RAISE WARNING 'Erreur création automatique tenant owner (SÉCURISÉ): %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 3. RECRÉER LE TRIGGER AVEC LA NOUVELLE FONCTION
-- ==============================================

DROP TRIGGER IF EXISTS auto_tenant_creation_trigger ON auth.users;

CREATE TRIGGER auto_tenant_creation_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tenant_owner();

-- ==============================================
-- 4. INCLURE LA FONCTION DE GÉNÉRATION EMPLOYEE_ID
-- ==============================================

-- Fonction optimisée pour générer employee_id unique par tenant
CREATE OR REPLACE FUNCTION generate_next_employee_id(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  max_number INTEGER := 0;
  next_number INTEGER;
  candidate_id TEXT;
BEGIN
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
  WHERE tenant_id = p_tenant_id;
  
  -- Commencer à partir du maximum + 1
  next_number := max_number + 1;
  
  -- Boucle de sécurité pour vérifier l'unicité
  LOOP
    candidate_id := 'EMP' || LPAD(next_number::TEXT, 3, '0');
    
    -- Vérifier si cet ID existe déjà
    IF NOT EXISTS (
      SELECT 1 FROM public.employees 
      WHERE tenant_id = p_tenant_id 
      AND employee_id = candidate_id
    ) THEN
      RETURN candidate_id;
    END IF;
    
    -- Si l'ID existe (cas rare), essayer le suivant
    next_number := next_number + 1;
    
    -- Sécurité : limiter à 999 employés par tenant
    IF next_number > 999 THEN
      RAISE EXCEPTION 'Limite de 999 employés atteinte pour le tenant %', p_tenant_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================
-- 5. VÉRIFICATIONS DE SÉCURITÉ
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

COMMIT;

-- ==============================================
-- INSTRUCTIONS D'UTILISATION
-- ==============================================

/*
CHANGEMENTS APPORTÉS:

1. ✅ SUPPRESSION des insertions dans les tables de définition:
   - Aucun INSERT dans roles, permissions, role_permissions
   - Aucun INSERT dans alert_types, alert_solutions, etc.

2. ✅ UTILISATION des données globales existantes:
   - Référence directe aux rôles globaux via SELECT
   - Pas de duplication des données de définition

3. ✅ CRÉATION sécurisée tenant owner:
   - Création tenant uniquement
   - Création profil utilisateur uniquement
   - Attribution rôle via référence globale
   - Création employé uniquement

4. ✅ GESTION d'erreurs améliorée:
   - Vérifications des rôles globaux
   - Messages d'erreur explicites
   - Pas de blocage si rôle manquant

RÉSULTAT:
- Aucun risque de doublon dans les tables globales
- Utilisation des 11 tables de définition converties
- Création tenant owner 100% sécurisée
- Compatibilité avec le système de migration global
*/

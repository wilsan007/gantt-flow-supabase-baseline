-- ==============================================
-- Nettoyage des Rôles Dupliqués (Multi-Tenant)
-- ==============================================
-- Ce script nettoie les doublons tout en préservant l'architecture multi-tenant

-- 1. NETTOYER LES DOUBLONS DANS role_permissions
-- Supprimer les liaisons dupliquées (même role_id + permission_id)
DELETE FROM public.role_permissions 
WHERE ctid NOT IN (
  SELECT MIN(ctid) 
  FROM public.role_permissions 
  GROUP BY role_id, permission_id
);

-- 2. NETTOYER LES DOUBLONS DANS permissions
-- Supprimer les permissions dupliquées (même name + tenant_id si applicable)
DELETE FROM public.permissions 
WHERE ctid NOT IN (
  SELECT MIN(ctid) 
  FROM public.permissions 
  GROUP BY name, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- 3. NETTOYER LES DOUBLONS DANS roles
-- Supprimer les rôles dupliqués (même name + tenant_id)
DELETE FROM public.roles 
WHERE ctid NOT IN (
  SELECT MIN(ctid) 
  FROM public.roles 
  GROUP BY name, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- 4. METTRE À JOUR les user_roles pour pointer vers les rôles conservés
-- Créer une table temporaire pour mapper les anciens IDs vers les nouveaux
CREATE TEMP TABLE role_mapping AS
SELECT 
  old_role.id as old_id,
  kept_role.id as new_id
FROM public.roles old_role
JOIN (
  SELECT 
    name, 
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid) as tenant_id,
    MIN(ctid) as min_ctid
  FROM public.roles 
  GROUP BY name, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)
) grouped ON (
  old_role.name = grouped.name 
  AND COALESCE(old_role.tenant_id, '00000000-0000-0000-0000-000000000000'::uuid) = grouped.tenant_id
)
JOIN public.roles kept_role ON kept_role.ctid = grouped.min_ctid
WHERE old_role.id != kept_role.id;

-- Mettre à jour les user_roles pour utiliser les bons role_id
UPDATE public.user_roles 
SET role_id = role_mapping.new_id
FROM role_mapping 
WHERE user_roles.role_id = role_mapping.old_id;

-- 5. AJOUTER DES CONTRAINTES pour éviter les futurs doublons
-- Contrainte unique sur (name, tenant_id) pour les rôles
ALTER TABLE public.roles 
ADD CONSTRAINT IF NOT EXISTS unique_role_name_per_tenant 
UNIQUE (name, tenant_id);

-- Contrainte unique sur (name, tenant_id) pour les permissions (si tenant_id existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'permissions' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.permissions 
        ADD CONSTRAINT IF NOT EXISTS unique_permission_name_per_tenant 
        UNIQUE (name, tenant_id);
    ELSE
        ALTER TABLE public.permissions 
        ADD CONSTRAINT IF NOT EXISTS unique_permission_name 
        UNIQUE (name);
    END IF;
END $$;

-- Contrainte unique sur (role_id, permission_id) pour role_permissions
ALTER TABLE public.role_permissions 
ADD CONSTRAINT IF NOT EXISTS unique_role_permission 
UNIQUE (role_id, permission_id);

-- 6. CORRIGER la Edge Function pour qu'elle utilise les rôles existants
-- (Ceci est déjà fait dans la Edge Function corrigée)

SELECT 'Nettoyage des doublons terminé. Architecture multi-tenant préservée.' as status;

-- Afficher un résumé des données nettoyées
SELECT 
  'roles' as table_name,
  COUNT(*) as remaining_records
FROM public.roles
UNION ALL
SELECT 
  'permissions' as table_name,
  COUNT(*) as remaining_records  
FROM public.permissions
UNION ALL
SELECT 
  'role_permissions' as table_name,
  COUNT(*) as remaining_records
FROM public.role_permissions;

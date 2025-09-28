-- Correction des fonctions qui référencent encore tenant_members
-- Remplace toutes les références par la nouvelle logique profiles.tenant_id

-- 1. Corriger get_user_actual_tenant_id() pour utiliser profiles
CREATE OR REPLACE FUNCTION public.get_user_actual_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.tenant_id 
  FROM profiles p
  WHERE p.user_id = auth.uid()
    AND p.tenant_id IS NOT NULL
  LIMIT 1;
$$;

-- 2. Corriger get_user_tenant_id() pour utiliser la nouvelle logique
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.get_user_actual_tenant_id();
$$;

-- 3. Fonction pour vérifier si un utilisateur est admin du tenant
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.user_id
    JOIN roles r ON r.id = ur.role_id
    WHERE p.user_id = auth.uid()
      AND p.tenant_id IS NOT NULL
      AND ur.tenant_id = p.tenant_id
      AND ur.is_active = true
      AND r.name IN ('tenant_admin', 'admin')
  );
$$;

-- 4. Fonction pour vérifier si un utilisateur a une permission spécifique
CREATE OR REPLACE FUNCTION public.has_permission(resource_name TEXT, action_name TEXT)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.user_id
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions perm ON perm.id = rp.permission_id
    WHERE p.user_id = auth.uid()
      AND p.tenant_id IS NOT NULL
      AND ur.tenant_id = p.tenant_id
      AND ur.is_active = true
      AND perm.resource = resource_name
      AND perm.action = action_name
  );
$$;

-- 5. Supprimer les anciennes politiques RLS qui référencent tenant_members
DROP POLICY IF EXISTS "Users can view tenant they belong to" ON public.tenants;

-- 6. Créer une nouvelle politique RLS pour les tenants basée sur profiles
CREATE POLICY "Users can view their tenant"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  id = (
    SELECT p.tenant_id
    FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.tenant_id IS NOT NULL
  )
);

-- 7. Politique pour permettre aux Super Admin de voir tous les tenants
CREATE POLICY "Super admin can view all tenants"
ON public.tenants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.user_id
    JOIN roles r ON r.id = ur.role_id
    WHERE p.user_id = auth.uid()
      AND r.name = 'super_admin'
      AND ur.is_active = true
  )
);

-- 8. Mettre à jour les commentaires
COMMENT ON FUNCTION public.get_user_actual_tenant_id() IS 
'Retourne le tenant_id de l''utilisateur connecté depuis la table profiles';

COMMENT ON FUNCTION public.get_user_tenant_id() IS 
'Fonction de compatibilité qui utilise get_user_actual_tenant_id()';

COMMENT ON FUNCTION public.is_tenant_admin() IS 
'Vérifie si l''utilisateur connecté est admin de son tenant';

COMMENT ON FUNCTION public.has_permission(TEXT, TEXT) IS 
'Vérifie si l''utilisateur connecté a une permission spécifique dans son tenant';

-- 9. Créer une fonction pour obtenir les rôles d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_roles()
RETURNS TABLE(role_name TEXT, role_id UUID, tenant_id UUID)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    r.name as role_name,
    r.id as role_id,
    ur.tenant_id
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.user_id
  JOIN roles r ON r.id = ur.role_id
  WHERE p.user_id = auth.uid()
    AND ur.is_active = true;
$$;

-- 10. Fonction utilitaire pour vérifier si un utilisateur est Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.user_id
    JOIN roles r ON r.id = ur.role_id
    WHERE p.user_id = auth.uid()
      AND r.name = 'super_admin'
      AND ur.is_active = true
  );
$$;

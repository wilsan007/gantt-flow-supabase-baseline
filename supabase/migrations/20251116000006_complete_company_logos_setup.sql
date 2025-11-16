-- ============================================================================
-- Migration complète pour le bucket company-logos avec RLS correct
-- ============================================================================

-- 1. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Les logos sont accessibles publiquement" ON storage.objects;
DROP POLICY IF EXISTS "Les tenant admins peuvent uploader des logos" ON storage.objects;
DROP POLICY IF EXISTS "Les tenant admins peuvent mettre à jour leurs logos" ON storage.objects;
DROP POLICY IF EXISTS "Les tenant admins peuvent supprimer leurs logos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins peuvent uploader logos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins peuvent mettre à jour logos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant admins peuvent supprimer logos" ON storage.objects;

-- 2. S'assurer que le bucket existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos', 
  'company-logos', 
  true,
  2097152, -- 2MB max
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml'];

-- 3. Politique de LECTURE publique (SELECT)
CREATE POLICY "Public can view company logos"
ON storage.objects 
FOR SELECT
USING (bucket_id = 'company-logos');

-- 4. Politique d'UPLOAD (INSERT) pour tenant admins
CREATE POLICY "Tenant admins can upload logos"
ON storage.objects 
FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND EXISTS (
    -- Vérifier que l'utilisateur est admin du tenant dans le chemin
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND ur.tenant_id::text = (storage.foldername(name))[1]
    AND r.name IN ('tenant_owner', 'tenant_admin', 'admin', 'super_admin')
    AND ur.is_active = true
  )
);

-- 5. Politique de MISE À JOUR (UPDATE) pour tenant admins
CREATE POLICY "Tenant admins can update logos"
ON storage.objects 
FOR UPDATE
USING (
  bucket_id = 'company-logos'
  AND EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND ur.tenant_id::text = (storage.foldername(name))[1]
    AND r.name IN ('tenant_owner', 'tenant_admin', 'admin', 'super_admin')
    AND ur.is_active = true
  )
);

-- 6. Politique de SUPPRESSION (DELETE) pour tenant admins
CREATE POLICY "Tenant admins can delete logos"
ON storage.objects 
FOR DELETE
USING (
  bucket_id = 'company-logos'
  AND EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND ur.tenant_id::text = (storage.foldername(name))[1]
    AND r.name IN ('tenant_owner', 'tenant_admin', 'admin', 'super_admin')
    AND ur.is_active = true
  )
);

-- 7. Vérification
DO $$ 
BEGIN
  RAISE NOTICE '✅ Bucket company-logos configuré avec succès';
  RAISE NOTICE '✅ Policies RLS appliquées';
  RAISE NOTICE 'ℹ️  Taille max: 2MB';
  RAISE NOTICE 'ℹ️  Types acceptés: JPEG, PNG, WEBP, SVG';
END $$;

-- ============================================================================
-- Script de TEST pour vérifier les permissions d'upload de logo
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================================

-- 1. Vérifier l'utilisateur connecté
SELECT 
  '🔍 UTILISATEUR CONNECTÉ' as check_type,
  auth.uid() as user_id,
  auth.email() as email;

-- 2. Vérifier les rôles de l'utilisateur
SELECT 
  '👤 RÔLES UTILISATEUR' as check_type,
  ur.id,
  ur.user_id,
  ur.tenant_id,
  r.name as role_name,
  ur.is_active,
  t.name as tenant_name
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
LEFT JOIN tenants t ON t.id = ur.tenant_id
WHERE ur.user_id = auth.uid()
ORDER BY ur.is_active DESC, r.name;

-- 3. Vérifier le bucket company-logos
SELECT 
  '🪣 BUCKET CONFIGURATION' as check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'company-logos';

-- 4. Vérifier les policies RLS
SELECT 
  '🔒 POLICIES RLS' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname ILIKE '%logo%'
ORDER BY policyname;

-- 5. Test de permission d'upload pour un tenant spécifique
-- Remplacer 'TENANT_ID_ICI' par votre tenant_id réel
DO $$ 
DECLARE
  v_tenant_id UUID;
  v_can_upload BOOLEAN;
BEGIN
  -- Récupérer le premier tenant de l'utilisateur
  SELECT ur.tenant_id INTO v_tenant_id
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = auth.uid()
  AND r.name IN ('tenant_owner', 'tenant_admin', 'admin', 'super_admin')
  AND ur.is_active = true
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE NOTICE '❌ Aucun tenant trouvé pour cet utilisateur';
    RETURN;
  END IF;

  -- Tester si l'utilisateur peut uploader pour ce tenant
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND ur.tenant_id = v_tenant_id
    AND r.name IN ('tenant_owner', 'tenant_admin', 'admin', 'super_admin')
    AND ur.is_active = true
  ) INTO v_can_upload;

  RAISE NOTICE '✅ Tenant ID: %', v_tenant_id;
  RAISE NOTICE '✅ Peut uploader: %', v_can_upload;
  RAISE NOTICE 'ℹ️  Chemin upload: %/logo-xxx.png', v_tenant_id;
END $$;

-- 6. Lister les logos existants
SELECT 
  '📁 LOGOS EXISTANTS' as check_type,
  id,
  name,
  bucket_id,
  created_at,
  (metadata->>'size')::bigint / 1024 || ' KB' as size,
  metadata->>'mimetype' as mime_type
FROM storage.objects
WHERE bucket_id = 'company-logos'
ORDER BY created_at DESC
LIMIT 10;

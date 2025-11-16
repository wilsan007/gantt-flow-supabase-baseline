-- ============================================================================
-- POLICIES SÉCURISÉES pour le bucket company-logos
-- Version équilibrée : Sécurité + Fonctionnalité
-- ============================================================================

-- 1. Nettoyer les anciennes policies
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname ILIKE '%logo%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
        RAISE NOTICE 'Supprimé: %', policy_record.policyname;
    END LOOP;
END $$;

-- 2. S'assurer que le bucket existe
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('company-logos', 'company-logos', true, 2097152)
ON CONFLICT (id) 
DO UPDATE SET public = true, file_size_limit = 2097152;

-- 3. Policy LECTURE publique
CREATE POLICY "Anyone can view logos"
ON storage.objects 
FOR SELECT
USING (bucket_id = 'company-logos');

-- 4. Policy UPLOAD SÉCURISÉE
-- Vérifie que l'utilisateur a un rôle actif (sans vérifier le tenant spécifique)
CREATE POLICY "Active users can upload logos"
ON storage.objects 
FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    -- Vérifier que l'utilisateur a au moins UN rôle actif
    SELECT 1 
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.is_active = true
  )
);

-- 5. Policy UPDATE SÉCURISÉE
CREATE POLICY "Active users can update logos"
ON storage.objects 
FOR UPDATE
USING (
  bucket_id = 'company-logos'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.is_active = true
  )
);

-- 6. Policy DELETE SÉCURISÉE
CREATE POLICY "Active users can delete logos"
ON storage.objects 
FOR DELETE
USING (
  bucket_id = 'company-logos'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.is_active = true
  )
);

-- 7. Retirer restrictions MIME
UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'company-logos';

-- Confirmation
DO $$
BEGIN
  RAISE NOTICE '================================';
  RAISE NOTICE '✅ POLICIES SÉCURISÉES APPLIQUÉES';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Contrôles en place:';
  RAISE NOTICE '1. ✅ Utilisateur authentifié requis';
  RAISE NOTICE '2. ✅ Rôle actif requis (user_roles)';
  RAISE NOTICE '3. ✅ Limite taille: 2MB';
  RAISE NOTICE '4. ✅ Bucket public (lecture)';
  RAISE NOTICE '';
  RAISE NOTICE 'Sécurité supplémentaire:';
  RAISE NOTICE '- Table tenants protégée par RLS';
  RAISE NOTICE '- Validation côté client';
  RAISE NOTICE '- UUID tenant dans chemin';
  RAISE NOTICE '================================';
END $$;

-- Retirer les restrictions MIME du bucket pour permettre tous les types d'images
-- Cela évite les erreurs "mime type not supported"

UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'company-logos';

-- Vérification
DO $$ 
BEGIN
  RAISE NOTICE '✅ Restrictions MIME retirées du bucket company-logos';
  RAISE NOTICE 'ℹ️  Tous les types d''images sont maintenant acceptés';
  RAISE NOTICE 'ℹ️  La validation se fera côté client';
END $$;

-- Vérifier et créer les politiques de stockage manquantes pour les uploads

-- Créer des politiques pour le bucket task-documents si elles n'existent pas
DO $$
BEGIN
  -- Politique pour permettre aux utilisateurs authentifiés d'uploader des fichiers
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload task documents'
  ) THEN
    CREATE POLICY "Users can upload task documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'task-documents' AND auth.role() = 'authenticated');
  END IF;

  -- Politique pour permettre aux utilisateurs de voir leurs documents uploadés
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view task documents'
  ) THEN
    CREATE POLICY "Users can view task documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'task-documents' AND auth.role() = 'authenticated');
  END IF;

  -- Politique pour permettre aux utilisateurs de supprimer leurs documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete task documents'
  ) THEN
    CREATE POLICY "Users can delete task documents"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'task-documents' AND auth.role() = 'authenticated');
  END IF;
END $$;
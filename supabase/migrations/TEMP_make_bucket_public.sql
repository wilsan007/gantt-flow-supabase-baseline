-- Solution temporaire: Rendre le bucket public
-- À exécuter dans le SQL Editor du Dashboard Supabase
-- ⚠️ ATTENTION: Ceci rend les fichiers accessibles publiquement

UPDATE storage.buckets 
SET public = true 
WHERE id = 'action-attachments';

-- Une fois que cela fonctionne, vous devriez créer les policies RLS
-- et remettre public = false pour sécuriser vos fichiers

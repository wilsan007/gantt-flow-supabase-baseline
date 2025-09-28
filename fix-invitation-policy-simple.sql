-- Correction simple de la politique RLS pour les invitations
-- Exécuter directement dans Supabase Dashboard > SQL Editor

-- Supprimer l'ancienne politique restrictive
DROP POLICY IF EXISTS "Anyone can validate invitation tokens" ON public.invitations;

-- Créer une nouvelle politique permissive
CREATE POLICY "Anyone can validate invitation tokens" 
ON public.invitations FOR SELECT 
USING (true);

-- Vérification
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'invitations' 
  AND policyname = 'Anyone can validate invitation tokens';

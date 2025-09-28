-- Corriger la politique RLS pour les invitations
-- Permettre l'accès en lecture à tous pour la validation des tokens

-- Supprimer l'ancienne politique restrictive
DROP POLICY IF EXISTS "Anyone can validate invitation tokens" ON public.invitations;

-- Créer une nouvelle politique permissive pour la validation des tokens
CREATE POLICY "Anyone can validate invitation tokens" 
ON public.invitations FOR SELECT 
USING (true);

-- Vérifier que la politique est bien appliquée
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'invitations';

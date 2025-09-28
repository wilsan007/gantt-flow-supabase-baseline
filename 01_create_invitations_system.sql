-- Migration 01: Création du système d'invitations et Super Admin
-- À exécuter après avoir résolu les problèmes RLS avec fix-rls-simple.sql

-- 1. Créer la table des invitations
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  tenant_id UUID NOT NULL, -- UUID pré-généré pour le futur tenant
  tenant_name TEXT, -- Nom de l'entreprise (optionnel au moment de l'invitation)
  invitation_type TEXT NOT NULL CHECK (invitation_type IN ('tenant_owner', 'collaborator')),
  invited_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- 2. Ajouter le rôle Super Admin
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role) 
VALUES ('super_admin', 'Super Admin', 'Super administrateur de la plateforme', 100, true)
ON CONFLICT (name) DO NOTHING;

-- 3. Modifier la table profiles pour permettre NULL tenant_id (Super Admin uniquement)
ALTER TABLE public.profiles 
ALTER COLUMN tenant_id DROP NOT NULL;

-- 4. Créer les fonctions utilitaires
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_invitation_token(token_input TEXT)
RETURNS TABLE(
  invitation_id UUID,
  email TEXT,
  full_name TEXT,
  tenant_id UUID,
  invitation_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.email, i.full_name, i.tenant_id, i.invitation_type
  FROM public.invitations i
  WHERE i.token = token_input 
    AND i.status = 'pending' 
    AND i.expires_at > now();
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancienne fonction is_super_admin si elle existe
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.is_super_admin(UUID);

CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id 
      AND r.name = 'super_admin'
      AND ur.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Activer RLS sur la table invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 6. Créer les politiques RLS pour les invitations
CREATE POLICY "Super admin can manage invitations" 
ON public.invitations FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
      AND r.name = 'super_admin'
      AND ur.is_active = true
  )
);

-- 7. Politique pour permettre la validation des tokens (lecture seule pour tous)
CREATE POLICY "Anyone can validate invitation tokens" 
ON public.invitations FOR SELECT 
USING (true);

-- 8. Contraintes de sécurité
-- Un seul Super Admin autorisé (utiliser une approche différente)
-- Note: L'index partiel sera créé après l'insertion du rôle super_admin

-- 9. Empêcher les utilisateurs sans tenant (sauf Super Admin)
-- Note: La contrainte sera appliquée via trigger au lieu de CHECK constraint

-- 10. Index pour les performances
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_status ON public.invitations(status);
CREATE INDEX idx_invitations_expires_at ON public.invitations(expires_at);

-- 11. Trigger pour updated_at sur invitations (sera créé après vérification de la fonction)
-- CREATE TRIGGER update_invitations_updated_at 
-- BEFORE UPDATE ON public.invitations 
-- FOR EACH ROW 
-- EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Commentaires pour documentation
COMMENT ON TABLE public.invitations IS 'Table des invitations pour tenant owners et collaborateurs';
COMMENT ON COLUMN public.invitations.token IS 'Token unique pour valider l''invitation';
COMMENT ON COLUMN public.invitations.tenant_id IS 'UUID pré-généré pour le futur tenant';
COMMENT ON FUNCTION is_super_admin IS 'Vérifie si un utilisateur est Super Admin';

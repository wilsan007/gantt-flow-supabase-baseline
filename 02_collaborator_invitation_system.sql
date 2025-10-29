-- ============================================================================
-- Migration 02: Système d'Invitation de Collaborateurs
-- Pattern: Stripe, Notion, Linear, Slack
-- ============================================================================

-- 1. Étendre la table invitations pour supporter les collaborateurs
ALTER TABLE public.invitations 
DROP CONSTRAINT IF EXISTS invitations_invitation_type_check;

ALTER TABLE public.invitations 
ADD CONSTRAINT invitations_invitation_type_check 
CHECK (invitation_type IN ('tenant_owner', 'collaborator'));

-- 2. Ajouter colonnes spécifiques aux collaborateurs
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS role_to_assign TEXT,
ADD COLUMN IF NOT EXISTS invited_by_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS job_position TEXT;

-- 3. Créer index pour performance
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON public.invitations(invited_by_user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant_status ON public.invitations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_type_status ON public.invitations(invitation_type, status);

-- 4. Fonction pour valider les permissions d'invitation
-- Note: Utilise get_user_tenant_id existante, pas besoin de recréer
CREATE OR REPLACE FUNCTION can_invite_collaborators(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT r.name INTO user_role
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = can_invite_collaborators.user_id 
    AND ur.is_active = true
  LIMIT 1;
  
  RETURN user_role IN ('tenant_admin', 'manager', 'hr_manager', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Note: La fonction get_user_tenant_id existe déjà et est utilisée par d'autres politiques RLS
-- Pas besoin de la recréer, elle sera réutilisée telle quelle

-- 6. Fonction pour vérifier si un email existe déjà dans un tenant
CREATE OR REPLACE FUNCTION is_email_in_tenant(email_param TEXT, tenant_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE LOWER(p.email) = LOWER(email_param)
      AND p.tenant_id = tenant_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fonction pour valider une invitation collaborateur
CREATE OR REPLACE FUNCTION validate_collaborator_invitation(token_input TEXT)
RETURNS TABLE(
  invitation_id UUID,
  email TEXT,
  full_name TEXT,
  tenant_id UUID,
  role_to_assign TEXT,
  invited_by UUID,
  department TEXT,
  job_position TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.email,
    i.full_name,
    i.tenant_id,
    i.role_to_assign,
    i.invited_by_user_id,
    i.department,
    i.job_position,
    i.metadata
  FROM public.invitations i
  WHERE i.token = token_input 
    AND i.invitation_type = 'collaborator'
    AND i.status = 'pending' 
    AND i.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Politiques RLS pour invitations collaborateurs
CREATE POLICY "Tenant members can view their tenant invitations" 
ON public.invitations FOR SELECT 
USING (
  invitation_type = 'collaborator' 
  AND tenant_id IN (
    SELECT ur.tenant_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
      AND ur.is_active = true
  )
);

CREATE POLICY "Authorized users can create collaborator invitations" 
ON public.invitations FOR INSERT 
WITH CHECK (
  invitation_type = 'collaborator'
  AND can_invite_collaborators(auth.uid())
  AND tenant_id = get_user_tenant_id(auth.uid())
);

CREATE POLICY "Inviter can update their invitations" 
ON public.invitations FOR UPDATE 
USING (
  invitation_type = 'collaborator'
  AND invited_by_user_id = auth.uid()
);

-- 9. Commentaires pour documentation
COMMENT ON FUNCTION can_invite_collaborators IS 'Vérifie si un utilisateur peut inviter des collaborateurs';
-- Note: get_user_tenant_id existe déjà, pas besoin de commentaire
COMMENT ON FUNCTION is_email_in_tenant IS 'Vérifie si un email existe déjà dans un tenant';
COMMENT ON FUNCTION validate_collaborator_invitation IS 'Valide et récupère une invitation collaborateur par token';

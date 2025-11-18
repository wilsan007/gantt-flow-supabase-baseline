# Plan Complet : Système d'Invitation et Gestion des Tenants

## Vue d'ensemble du système

### Architecture des rôles

1. **Super Admin** : Utilisateur unique sans tenant, contrôle toute la plateforme
2. **Tenant Owner/Admin** : Propriétaire d'entreprise avec son tenant
3. **Collaborateurs** : Employés rattachés à un tenant

## Phase 1 : Structure de base des données

### 1.1 Tables à créer/modifier

#### Table `invitations`

```sql
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
```

#### Modification table `roles` - Ajouter Super Admin

```sql
INSERT INTO public.roles (name, description, hierarchy_level, is_system_role)
VALUES ('super_admin', 'Super administrateur de la plateforme', 100, true);
```

#### Modification table `profiles` - Gérer Super Admin

```sql
ALTER TABLE public.profiles
ALTER COLUMN tenant_id DROP NOT NULL; -- Permettre NULL pour Super Admin
```

### 1.2 Fonctions utilitaires

#### Fonction de génération de token

```sql
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;
```

#### Fonction de validation de token

```sql
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
```

## Phase 2 : Système d'authentification Super Admin

### 2.1 Identification du Super Admin

```sql
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
```

### 2.2 Contexte utilisateur étendu

```typescript
// Modifier TenantContext pour gérer Super Admin
interface UserContext {
  isSuperAdmin: boolean;
  currentTenant: Tenant | null;
  userMembership: any;
  tenantId: string | null;
}
```

## Phase 3 : Système d'invitation

### 3.1 API d'invitation (Supabase Edge Function)

```typescript
// supabase/functions/send-invitation/index.ts
export default async function handler(req: Request) {
  const { email, fullName, invitationType } = await req.json();

  // 1. Vérifier que l'utilisateur est Super Admin
  // 2. Générer UUID pour le futur tenant
  // 3. Créer le token d'invitation
  // 4. Enregistrer dans la table invitations
  // 5. Envoyer l'email avec le lien d'invitation
}
```

### 3.2 Template email d'invitation

```html
<!-- Template pour tenant_owner -->
<h2>Invitation à rejoindre Wadashaqayn</h2>
<p>Bonjour {{fullName}},</p>
<p>Vous êtes invité(e) à créer votre compte entreprise sur Wadashaqayn.</p>
<a href="{{platformUrl}}/signup/tenant-owner?token={{token}}"> Créer mon compte entreprise </a>
```

## Phase 4 : Processus d'inscription Tenant Owner

### 4.1 Page d'inscription avec token

```typescript
// pages/signup/tenant-owner.tsx
export default function TenantOwnerSignup() {
  const { token } = useRouter().query;

  useEffect(() => {
    // Valider le token et pré-remplir les données
    validateInvitationToken(token);
  }, [token]);

  // Formulaire avec :
  // - Email (pré-rempli, readonly)
  // - Nom complet (pré-rempli, readonly)
  // - Nom de l'entreprise (à saisir)
  // - Mot de passe (validation 8+ caractères)
  // - Tenant ID (caché)
}
```

### 4.2 Processus de création de compte

```typescript
async function createTenantOwnerAccount(formData) {
  // 1. Créer l'utilisateur dans auth.users (Supabase Auth)
  const { user } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  });

  // 2. Créer le tenant
  await supabase.from('tenants').insert({
    id: formData.tenantId, // UUID pré-généré
    name: formData.companyName,
    slug: generateSlug(formData.companyName),
  });

  // 3. Créer le profil utilisateur
  await supabase.from('profiles').insert({
    user_id: user.id,
    tenant_id: formData.tenantId,
    full_name: formData.fullName,
    email: formData.email,
  });

  // 4. Assigner le rôle tenant_admin
  await supabase.from('user_roles').insert({
    user_id: user.id,
    role_id: getTenantAdminRoleId(),
    tenant_id: formData.tenantId,
  });

  // 5. Marquer l'invitation comme acceptée
  await supabase
    .from('invitations')
    .update({ status: 'accepted', accepted_at: new Date() })
    .eq('token', formData.token);
}
```

## Phase 5 : Interface Super Admin

### 5.1 Dashboard Super Admin

```typescript
// components/super-admin/SuperAdminDashboard.tsx
export default function SuperAdminDashboard() {
  return (
    <div className="super-admin-dashboard">
      <h1>Administration Plateforme</h1>

      <div className="stats-grid">
        <StatCard title="Tenants Actifs" value={tenantCount} />
        <StatCard title="Invitations Envoyées" value={invitationCount} />
        <StatCard title="Utilisateurs Total" value={userCount} />
      </div>

      <InvitationForm />
      <TenantsList />
      <InvitationsList />
    </div>
  );
}
```

### 5.2 Formulaire d'invitation

```typescript
// components/super-admin/InvitationForm.tsx
export default function InvitationForm() {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    invitationType: 'tenant_owner'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendInvitation(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email du futur tenant owner"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      <input
        type="text"
        placeholder="Nom complet"
        value={formData.fullName}
        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
        required
      />
      <button type="submit">Envoyer l'invitation</button>
    </form>
  );
}
```

## Phase 6 : Sécurité et permissions

### 6.1 Politiques RLS pour invitations

```sql
-- Seul le Super Admin peut voir/gérer les invitations
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
```

### 6.2 Protection des routes

```typescript
// middleware/auth.ts
export function requireSuperAdmin(req, res, next) {
  if (!req.user.isSuperAdmin) {
    return res.status(403).json({ error: 'Super Admin access required' });
  }
  next();
}
```

## Phase 7 : Validation et contraintes

### 7.1 Contraintes de sécurité

```sql
-- Un seul Super Admin autorisé
CREATE UNIQUE INDEX idx_single_super_admin
ON public.user_roles (role_id)
WHERE role_id = (SELECT id FROM public.roles WHERE name = 'super_admin');

-- Empêcher les utilisateurs sans tenant (sauf Super Admin)
ALTER TABLE public.profiles
ADD CONSTRAINT check_tenant_or_super_admin
CHECK (
  tenant_id IS NOT NULL OR
  user_id IN (
    SELECT ur.user_id FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE r.name = 'super_admin'
  )
);
```

## Phase 8 : Déploiement et migration

### 8.1 Script de migration

```sql
-- 01_create_invitations_table.sql
-- 02_add_super_admin_role.sql
-- 03_modify_profiles_constraints.sql
-- 04_create_invitation_functions.sql
-- 05_create_rls_policies.sql
```

### 8.2 Création du premier Super Admin

```sql
-- Script à exécuter une seule fois
INSERT INTO public.profiles (user_id, full_name, email, tenant_id)
VALUES ('SUPER_ADMIN_USER_ID', 'Super Admin', 'admin@wadashaqayn.com', NULL);

INSERT INTO public.user_roles (user_id, role_id, is_active)
VALUES ('SUPER_ADMIN_USER_ID', (SELECT id FROM public.roles WHERE name = 'super_admin'), true);
```

## Ordre d'exécution recommandé

1. **Exécuter le script RLS actuel** pour résoudre les erreurs tenant_members
2. **Créer les nouvelles tables** (invitations, modifications roles)
3. **Développer les fonctions Supabase** (send-invitation)
4. **Créer l'interface Super Admin**
5. **Développer le processus d'inscription tenant_owner**
6. **Tester le flux complet**
7. **Créer le premier Super Admin**
8. **Déployer en production**

Ce plan assure une transition progressive et sécurisée vers le nouveau système d'invitation multi-tenant.

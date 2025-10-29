# 📋 Guide Complet - Système d'Invitation de Collaborateurs

## 🎯 Vue d'Ensemble

Ce système permet aux **Tenant Admins, Managers et HR Managers** d'inviter des collaborateurs dans leur entreprise **sans créer de nouveaux tenants**.

### **Différences avec le système Tenant-Owner**

| Aspect | Tenant-Owner | Collaborateur |
|--------|--------------|---------------|
| **Inviteur** | Super Admin | Tenant Admin/Manager |
| **Tenant** | ✅ Crée nouveau | ❌ Utilise existant |
| **Rôle** | `tenant_admin` fixe | Variable (manager, employee, etc.) |
| **Workflow** | Création entreprise | Ajout à l'équipe |

---

## 🏗️ Architecture

### **Pattern inspiré de :**
- ✅ **Stripe** - Validation robuste + Cache intelligent
- ✅ **Notion** - UX moderne + Feedback immédiat
- ✅ **Linear** - Messages d'erreur contextuels
- ✅ **Slack** - Invitations par email

---

## 📦 Fichiers Créés

### **1. Migration SQL**
```
📄 02_collaborator_invitation_system.sql
```
- Extension table `invitations` pour collaborateurs
- Fonctions SQL (permissions, validation, statistiques)
- Politiques RLS pour sécurité par tenant
- Index pour performance

### **2. Edge Functions**

```
📁 supabase/functions/
  ├── send-collaborator-invitation/index.ts
  └── handle-collaborator-confirmation/index.ts
```

**send-collaborator-invitation :**
- Authentification Tenant Admin/Manager
- Validation email unique dans le tenant
- Génération Magic Link
- Envoi email via Resend

**handle-collaborator-confirmation :**
- Webhook déclenché par Magic Link
- Validation éléments d'invitation
- ❌ **PAS de création tenant**
- ✅ Ajout au tenant existant
- Création profil + employé + rôle

### **3. Hooks React**

```
📄 src/hooks/useCollaboratorInvitation.ts
```
- API unifiée pour invitations
- Cache intelligent (Pattern Stripe)
- Gestion états et erreurs
- Statistiques temps réel

### **4. Composants UI**

```
📁 src/components/hr/
  └── CollaboratorInvitation.tsx
```
- Formulaire d'invitation
- Liste invitations en attente
- Statistiques visuelles
- Actions rapides (révocation)

```
📁 src/pages/
  ├── CollaboratorSetup.tsx
  └── HRPageWithCollaboratorInvitation.tsx
```

---

## 🚀 Déploiement

### **Étape 1 : Migration SQL**

```bash
# Exécuter la migration dans Supabase SQL Editor
cd /home/awaleh/Bureau/Wadashaqeen-SaaS/gantt-flow-next
cat 02_collaborator_invitation_system.sql
```

Copier le contenu et exécuter dans :
`https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/sql`

### **Étape 2 : Déployer Edge Functions**

```bash
# Déployer send-collaborator-invitation
supabase functions deploy send-collaborator-invitation

# Déployer handle-collaborator-confirmation  
supabase functions deploy handle-collaborator-confirmation
```

### **Étape 3 : Configurer Webhook SQL**

⚠️ **IMPORTANT:** Créer le trigger SQL pour déclencher automatiquement `handle-collaborator-confirmation`

```sql
-- Créer la fonction webhook
CREATE OR REPLACE FUNCTION handle_collaborator_confirmation_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-collaborator-confirmation';
  payload JSON;
BEGIN
  -- Uniquement pour les invitations collaborateur
  IF NEW.raw_user_meta_data->>'invitation_type' = 'collaborator' THEN
    payload := json_build_object(
      'type', 'UPDATE',
      'table', 'users',
      'schema', 'auth',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    );
    
    PERFORM net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json', 
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
CREATE TRIGGER handle_collaborator_confirmation_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at 
    OR OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
  )
  EXECUTE FUNCTION handle_collaborator_confirmation_webhook();
```

### **Étape 4 : Intégration dans l'Application**

#### **Option A : Remplacer la page RH**

Dans `src/App.tsx`, modifier la route `/hr` :

```tsx
// Remplacer
import HRPage from './pages/HRPage';

// Par
import HRPageWithCollaboratorInvitation from './pages/HRPageWithCollaboratorInvitation';

// Dans les routes
<Route 
  path="/hr" 
  element={
    <ProtectedRoute requiredAccess="canAccessHR">
      <HRPageWithCollaboratorInvitation />
    </ProtectedRoute>
  } 
/>
```

#### **Option B : Nouvelle route dédiée**

Ajouter une route séparée :

```tsx
<Route 
  path="/team/invitations" 
  element={
    <ProtectedRoute requiredAccess="canAccessHR">
      <CollaboratorInvitation />
    </ProtectedRoute>
  } 
/>
```

#### **Option C : Ajouter dans le menu (recommandé)**

Dans `src/App.tsx`, ajouter un lien dans `MemoizedHeader` :

```tsx
{accessRights.canAccessHR && (
  <Link to="/team/invitations" className="text-foreground hover:text-primary">
    Inviter Équipe
  </Link>
)}
```

### **Étape 5 : Ajouter la route CollaboratorSetup**

Dans `src/App.tsx`, ajouter la route publique :

```tsx
import CollaboratorSetup from './pages/CollaboratorSetup';

// Dans les routes publiques (section non authentifiée)
<Route path="/collaborator-setup" element={<CollaboratorSetup />} />
```

---

## 🔄 Workflow Complet

### **1. Invitation par le Tenant Admin**

```
Tenant Admin ouvre /team/invitations
    ↓
Remplit le formulaire:
  - Email
  - Nom complet
  - Rôle (manager, employee, hr_manager)
  - Département (optionnel)
  - Poste (optionnel)
    ↓
Clique "Envoyer l'invitation"
    ↓
Hook useCollaboratorInvitation appelle Edge Function
    ↓
send-collaborator-invitation:
  ✓ Vérifie permissions (can_invite_collaborators)
  ✓ Vérifie email unique dans le tenant
  ✓ Crée utilisateur Supabase
  ✓ Génère Magic Link
  ✓ Crée invitation en base
  ✓ Envoie email via Resend
    ↓
Email envoyé au collaborateur
```

### **2. Acceptation par le Collaborateur**

```
Collaborateur reçoit email
    ↓
Clique sur le Magic Link
    ↓
Redirection /auth/callback?invitation=collaborator
    ↓
Webhook SQL déclenché (auth.users UPDATE)
    ↓
handle-collaborator-confirmation:
  ✓ Vérifie invitation_type = 'collaborator'
  ✓ Valide éléments d'invitation
  ✓ Confirme email automatiquement
  ✓ Vérifie que le tenant existe
  ✓ Récupère le rôle à assigner
  ✓ Crée user_role (tenant existant)
  ✓ Crée profil
  ✓ Génère employee_id unique
  ✓ Crée employé
  ✓ Marque invitation comme acceptée
    ↓
Redirection /collaborator-setup
    ↓
Page affiche:
  - Message de bienvenue
  - Nom de l'entreprise
  - Rôle attribué
    ↓
Redirection automatique vers /dashboard
```

---

## 🔒 Sécurité

### **Permissions RLS**

```sql
-- Seuls les membres autorisés peuvent inviter
CREATE POLICY "Authorized users can create collaborator invitations" 
ON public.invitations FOR INSERT 
WITH CHECK (
  invitation_type = 'collaborator'
  AND can_invite_collaborators(auth.uid())
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- Les membres voient uniquement les invitations de leur tenant
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
```

### **Validations**

1. ✅ **Email unique par tenant** (trigger SQL)
2. ✅ **Permissions inviteur** (RPC function)
3. ✅ **Tenant existant** (vérification Edge Function)
4. ✅ **Rôle valide** (constraint SQL)
5. ✅ **Expiration 7 jours** (nettoyage automatique)

---

## 📊 Métriques et Monitoring

### **Hook useCollaboratorInvitation retourne :**

```typescript
{
  // Statistiques
  stats: {
    total: number,
    pending: number,
    accepted: number,
    expired: number,
    cancelled: number
  },
  
  // Invitations actives
  pendingInvitations: Array,
  
  // États
  isLoading: boolean,
  isSending: boolean,
  error: string | null,
  canInvite: boolean
}
```

### **Logs Edge Functions**

Vérifier dans Supabase Dashboard :
`Functions > send-collaborator-invitation > Logs`
`Functions > handle-collaborator-confirmation > Logs`

---

## 🧪 Tests

### **1. Test Invitation Complète**

```typescript
// Dans la console développeur
const testInvitation = {
  email: 'test@example.com',
  fullName: 'Test User',
  roleToAssign: 'employee',
  department: 'IT',
  position: 'Developer'
};

// Appeler via UI ou directement
await sendInvitation(testInvitation);
```

### **2. Vérifications**

```sql
-- Vérifier l'invitation créée
SELECT * FROM invitations 
WHERE email = 'test@example.com' 
AND invitation_type = 'collaborator';

-- Vérifier après acceptation
SELECT * FROM profiles WHERE email = 'test@example.com';
SELECT * FROM employees WHERE email = 'test@example.com';
SELECT * FROM user_roles WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'test@example.com'
);
```

---

## 🐛 Troubleshooting

### **Problème: Invitation non envoyée**

**Vérifier :**
1. Permissions utilisateur : `SELECT can_invite_collaborators(auth.uid());`
2. Tenant ID valide : `SELECT get_user_tenant_id(auth.uid());`
3. Email unique : `SELECT is_email_in_tenant('email', 'tenant_id');`
4. Logs Edge Function : Dashboard Supabase

### **Problème: Email non reçu**

**Vérifier :**
1. RESEND_API_KEY configurée dans Supabase Secrets
2. Logs Edge Function pour erreurs Resend
3. Email de test autorisé (osman.awaleh.adn@gmail.com)

### **Problème: Webhook ne se déclenche pas**

**Vérifier :**
1. Trigger SQL existe : `SELECT * FROM pg_trigger WHERE tgname = 'handle_collaborator_confirmation_trigger';`
2. Extension pg_net activée : `CREATE EXTENSION IF NOT EXISTS pg_net;`
3. Service Role Key configurée

### **Problème: Profil non créé**

**Vérifier :**
1. Logs `handle-collaborator-confirmation`
2. Validation des 10 éléments d'invitation
3. Tenant existe : `SELECT * FROM tenants WHERE id = 'tenant_id';`
4. Rôle existe : `SELECT * FROM roles WHERE name = 'employee';`

---

## 📝 Notes Importantes

### **⚠️ Différences critiques avec Tenant-Owner**

1. **Pas de création de tenant** - Utilise tenant existant
2. **Rôle variable** - Pas fixé à `tenant_admin`
3. **Inviteur différent** - Tenant Admin au lieu de Super Admin
4. **Webhook séparé** - `handle-collaborator-confirmation` dédié

### **✅ Points communs**

1. Validation des 10 éléments d'invitation
2. Protection anti-boucle infinie
3. Magic Link via Supabase Auth
4. Envoi email via Resend
5. Création profil + employé automatique

---

## 🚦 Checklist de Déploiement

- [ ] Migration SQL exécutée
- [ ] Edge Functions déployées
- [ ] Webhook SQL configuré
- [ ] RESEND_API_KEY configurée
- [ ] Routes ajoutées dans App.tsx
- [ ] Tests d'invitation réussis
- [ ] Workflow complet validé
- [ ] Documentation partagée à l'équipe

---

## 📞 Support

**En cas de problème :**
1. Vérifier les logs Supabase Dashboard
2. Consulter ce guide
3. Vérifier les permissions RLS
4. Tester avec un compte de test

---

**✨ Système prêt pour production !**

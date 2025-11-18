# 🚀 Étapes de Déploiement - Système d'Invitation Collaborateurs

## ✅ Fichiers Créés (Aucune modification des fichiers existants)

### **1. Base de données**

```
📄 02_collaborator_invitation_system.sql
```

### **2. Edge Functions**

```
📁 supabase/functions/
  ├── send-collaborator-invitation/index.ts
  └── handle-collaborator-confirmation/index.ts
```

### **3. Hook React**

```
📄 src/hooks/useCollaboratorInvitation.ts
```

### **4. Composants UI**

```
📄 src/components/hr/CollaboratorInvitation.tsx
📄 src/pages/CollaboratorSetup.tsx
📄 src/pages/HRPageWithCollaboratorInvitation.tsx
```

### **5. Documentation**

```
📄 COLLABORATOR_INVITATION_GUIDE.md
📄 COLLABORATOR_DEPLOYMENT_STEPS.md (ce fichier)
```

---

## 📋 Checklist de Déploiement

### **ÉTAPE 1 : Migration Base de Données** ⏱️ 5 min

1. Ouvrir Supabase SQL Editor :

   ```
   https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/sql
   ```

2. Copier le contenu de `02_collaborator_invitation_system.sql`

3. Exécuter la migration

4. Vérifier que les fonctions sont créées :
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE '%collaborator%';
   ```

**✅ Résultat attendu :**

- `can_invite_collaborators`
- `get_user_tenant_id`
- `is_email_in_tenant`
- `validate_collaborator_invitation`

---

### **ÉTAPE 2 : Déployer Edge Functions** ⏱️ 10 min

```bash
cd /home/awaleh/Bureau/Wadashaqayn-SaaS/gantt-flow-next

# 1. Déployer send-collaborator-invitation
supabase functions deploy send-collaborator-invitation

# 2. Déployer handle-collaborator-confirmation
supabase functions deploy handle-collaborator-confirmation
```

**✅ Vérification :**

```bash
# Tester send-collaborator-invitation
curl -X POST https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/send-collaborator-invitation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","fullName":"Test User","roleToAssign":"employee"}'
```

---

### **ÉTAPE 3 : Configurer Webhook SQL** ⏱️ 5 min

⚠️ **CRITIQUE** : Ce trigger déclenche automatiquement `handle-collaborator-confirmation`

1. Ouvrir Supabase SQL Editor

2. Exécuter ce script :

```sql
-- Extension pg_net (si pas déjà activée)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fonction webhook
CREATE OR REPLACE FUNCTION handle_collaborator_confirmation_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-collaborator-confirmation';
  payload JSON;
  http_request_id BIGINT;
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

    SELECT INTO http_request_id net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload::text
    );

    RAISE LOG 'Webhook collaborator appelé - Request ID: %', http_request_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger (ou le remplacer)
DROP TRIGGER IF EXISTS handle_collaborator_confirmation_trigger ON auth.users;

CREATE TRIGGER handle_collaborator_confirmation_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at
    OR OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
  )
  EXECUTE FUNCTION handle_collaborator_confirmation_webhook();
```

3. Configurer la Service Role Key :

   ```sql
   -- Dans Supabase Dashboard > Project Settings > API
   -- Copier SUPABASE_SERVICE_ROLE_KEY

   ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
   ```

**✅ Vérification :**

```sql
SELECT * FROM pg_trigger WHERE tgname = 'handle_collaborator_confirmation_trigger';
```

---

### **ÉTAPE 4 : Intégration dans App.tsx** ⏱️ 5 min

**Option recommandée : Utiliser la nouvelle page avec tabs**

```typescript
// src/App.tsx

// 1. Importer la nouvelle page
import HRPageWithCollaboratorInvitation from './pages/HRPageWithCollaboratorInvitation';
import CollaboratorSetup from './pages/CollaboratorSetup';

// 2. Dans les routes protégées, remplacer HRPage
<Route
  path="/hr"
  element={
    <ProtectedRoute requiredAccess="canAccessHR">
      <HRPageWithCollaboratorInvitation />
    </ProtectedRoute>
  }
/>

// 3. Ajouter la route publique pour CollaboratorSetup
// Dans la section routes publiques (ligne ~160)
<Route path="/collaborator-setup" element={<CollaboratorSetup />} />
```

**Alternative : Route séparée**

```typescript
<Route
  path="/team/invitations"
  element={
    <ProtectedRoute requiredAccess="canAccessHR">
      <CollaboratorInvitation />
    </ProtectedRoute>
  }
/>
```

---

### **ÉTAPE 5 : Tester le Workflow Complet** ⏱️ 10 min

#### **Test 1 : Envoi d'invitation**

1. Se connecter en tant que Tenant Admin
2. Aller sur `/hr` (onglet "Invitations")
3. Remplir le formulaire :
   - Email : `votre-email-test@example.com`
   - Nom : `Test Collaborateur`
   - Rôle : `employee`
   - Département : `IT` (optionnel)
   - Poste : `Developer` (optionnel)
4. Cliquer "Envoyer l'invitation"

**✅ Vérifications :**

```sql
-- Invitation créée
SELECT * FROM invitations
WHERE email = 'votre-email-test@example.com'
AND invitation_type = 'collaborator';

-- Utilisateur créé dans Supabase Auth
SELECT * FROM auth.users
WHERE email = 'votre-email-test@example.com';
```

#### **Test 2 : Acceptation d'invitation**

1. Vérifier l'email reçu (si RESEND_API_KEY configurée)
2. Cliquer sur le Magic Link
3. Observer la redirection `/auth/callback`
4. Attendre le traitement (2-10 secondes)
5. Vérifier redirection vers `/collaborator-setup`
6. Vérifier le message de bienvenue
7. Attendre redirection automatique vers `/`

**✅ Vérifications :**

```sql
-- Profil créé
SELECT * FROM profiles
WHERE email = 'votre-email-test@example.com';

-- Employé créé
SELECT * FROM employees
WHERE email = 'votre-email-test@example.com';

-- Rôle assigné
SELECT ur.*, r.name as role_name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = (
  SELECT id FROM auth.users
  WHERE email = 'votre-email-test@example.com'
);

-- Invitation acceptée
SELECT * FROM invitations
WHERE email = 'votre-email-test@example.com'
AND status = 'accepted';
```

---

## 🐛 Résolution de Problèmes

### **Problème : Invitation non envoyée**

**Diagnostic :**

```sql
-- Vérifier permissions
SELECT can_invite_collaborators(auth.uid());

-- Vérifier tenant ID
SELECT get_user_tenant_id(auth.uid());

-- Vérifier email unique
SELECT is_email_in_tenant('email@test.com', 'TENANT_ID');
```

**Solution :**

- Vérifier que l'utilisateur a le rôle `tenant_admin`, `manager` ou `hr_manager`
- Vérifier que l'email n'existe pas déjà dans le tenant

---

### **Problème : Webhook ne se déclenche pas**

**Diagnostic :**

```sql
-- Vérifier trigger existe
SELECT * FROM pg_trigger
WHERE tgname = 'handle_collaborator_confirmation_trigger';

-- Vérifier fonction existe
SELECT * FROM pg_proc
WHERE proname = 'handle_collaborator_confirmation_webhook';

-- Vérifier extension pg_net
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

**Solution :**

```sql
-- Réinstaller extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Recréer trigger
-- (Copier le code de l'ÉTAPE 3)
```

---

### **Problème : Email non reçu**

**Diagnostic :**

- Logs Edge Function `send-collaborator-invitation`
- Vérifier RESEND_API_KEY dans Supabase Secrets

**Solution :**

1. Dashboard Supabase > Project Settings > Edge Functions
2. Ajouter secret `RESEND_API_KEY`
3. Redéployer la fonction

---

### **Problème : Profil non créé**

**Diagnostic :**

- Logs Edge Function `handle-collaborator-confirmation`
- Vérifier métadonnées utilisateur

```sql
SELECT raw_user_meta_data
FROM auth.users
WHERE email = 'email@test.com';
```

**Solution :**

- Vérifier que `invitation_type = 'collaborator'`
- Vérifier que les 10 éléments de validation sont présents
- Vérifier que le tenant existe

---

## 📊 Monitoring en Production

### **Métriques à surveiller**

```sql
-- Statistiques invitations
SELECT
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (accepted_at - created_at))/3600) as avg_hours_to_accept
FROM invitations
WHERE invitation_type = 'collaborator'
GROUP BY status;

-- Taux de conversion
SELECT
  COUNT(CASE WHEN status = 'accepted' THEN 1 END)::FLOAT /
  NULLIF(COUNT(*), 0) * 100 as conversion_rate
FROM invitations
WHERE invitation_type = 'collaborator'
AND created_at > NOW() - INTERVAL '30 days';

-- Invitations par tenant
SELECT
  t.name as tenant_name,
  COUNT(*) as total_invitations,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted
FROM invitations i
JOIN tenants t ON i.tenant_id = t.id
WHERE i.invitation_type = 'collaborator'
GROUP BY t.id, t.name
ORDER BY total_invitations DESC;
```

---

## 🎯 Points de Contrôle Finaux

- [ ] Migration SQL exécutée sans erreur
- [ ] Edge Functions déployées et accessibles
- [ ] Webhook SQL configuré avec Service Role Key
- [ ] Trigger SQL actif sur `auth.users`
- [ ] Routes ajoutées dans `App.tsx`
- [ ] Test invitation envoyée avec succès
- [ ] Test acceptation invitation fonctionnelle
- [ ] Profil + Employé + Rôle créés automatiquement
- [ ] Emails envoyés (si RESEND_API_KEY configurée)
- [ ] Logs des Edge Functions accessibles
- [ ] Documentation partagée à l'équipe

---

## 📞 Support

**En cas de blocage :**

1. Consulter `COLLABORATOR_INVITATION_GUIDE.md`
2. Vérifier les logs Supabase :
   - Functions > send-collaborator-invitation > Logs
   - Functions > handle-collaborator-confirmation > Logs
3. Exécuter les requêtes de diagnostic ci-dessus
4. Vérifier les permissions RLS

---

## 🎉 Félicitations !

Votre système d'invitation de collaborateurs est maintenant opérationnel !

**Pattern entreprise complet inspiré de :**

- ✅ Stripe (validation + cache)
- ✅ Notion (UX moderne)
- ✅ Linear (messages d'erreur)
- ✅ Slack (invitations email)

**Prêt pour production ! 🚀**

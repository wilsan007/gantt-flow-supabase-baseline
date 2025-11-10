# 🔧 Configuration Webhook Collaborator Confirmation

## Problème

Le trigger SQL ne peut pas être créé via Dashboard car `auth.users` nécessite des permissions superuser.

## ✅ Solution 1 : Via Dashboard Webhooks (RECOMMANDÉ)

### Étapes :

1. **Aller sur Supabase Dashboard**
   - https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/database/hooks

2. **Créer un nouveau Database Webhook**
   - Cliquer sur **"Create a new hook"**

3. **Configuration** :

   ```
   Name: collaborator-confirmation-webhook
   Table: auth.users
   Events: UPDATE
   Type: HTTP Request
   Method: POST
   URL: https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-collaborator-confirmation

   Headers:
   - Content-Type: application/json
   - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODA5OTMyOSwiZXhwIjoyMDQzNjc1MzI5fQ.vfVFd-wPEjh6n5EjstZ6fKKoTM_5aCPITbhZ7n4Xkx0

   Conditions (SQL WHERE):
   OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at
   AND NEW.email_confirmed_at IS NOT NULL
   AND NEW.raw_user_meta_data->>'invitation_type' = 'collaborator'
   AND (NEW.raw_user_meta_data->>'collaborator_confirmed_automatically' IS NULL
        OR NEW.raw_user_meta_data->>'collaborator_confirmed_automatically' = 'false')
   ```

4. **Sauvegarder**

---

## ✅ Solution 2 : Via CLI Supabase

Appliquer la migration via CLI (nécessite d'approuver la commande) :

```bash
supabase db push --linked
```

Cette commande appliquera la migration `20251110_webhook_collaborator_confirmation.sql` avec les bonnes permissions.

---

## 🧪 Test Après Configuration

1. **Inviter un nouveau collaborateur** via l'interface
2. **L'utilisateur reçoit le Magic Link** par email
3. **Il clique dessus** → `email_confirmed_at` est défini
4. **Le webhook se déclenche automatiquement** → Appelle `handle-collaborator-confirmation`
5. **La fonction crée** :
   - Profil dans `public.profiles`
   - Employé dans `public.employees`
   - Rôle dans `public.user_roles`
   - Met à jour l'invitation en status "accepted"

---

## 📊 Vérifier que ça fonctionne

### Après que l'utilisateur confirme son email :

```sql
-- 1. Vérifier le webhook a été appelé (logs)
SELECT * FROM net._http_response
ORDER BY created DESC
LIMIT 5;

-- 2. Vérifier le profil a été créé
SELECT * FROM public.profiles
WHERE email = 'EMAIL_DU_COLLABORATEUR';

-- 3. Vérifier l'employé a été créé
SELECT * FROM public.employees
WHERE email = 'EMAIL_DU_COLLABORATEUR';

-- 4. Vérifier l'invitation est "accepted"
SELECT status FROM public.invitations
WHERE email = 'EMAIL_DU_COLLABORATEUR';
```

---

## 🎯 Quelle Solution Choisir ?

### **Dashboard Webhooks** (plus simple)

- ✅ Pas besoin de CLI
- ✅ Interface visuelle
- ✅ Modifications faciles
- ⚠️ Configuration manuelle

### **Migration CLI** (plus professionnel)

- ✅ Versionné dans le code
- ✅ Reproductible
- ✅ Infrastructure as Code
- ⚠️ Nécessite approbation CLI

**Recommandation** : Commencez par Dashboard pour tester, puis migrez vers CLI une fois validé.

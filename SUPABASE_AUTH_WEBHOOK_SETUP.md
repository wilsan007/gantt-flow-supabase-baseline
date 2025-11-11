# 🔧 Configuration : Supabase Auth Webhook (Sans Trigger SQL)

## ❌ Problème du Trigger SQL

Erreur : `ERROR: 42501: must be owner of relation users`

**Cause** : La table `auth.users` est une table système protégée.  
**Solution** : Utiliser les **Auth Webhooks** natifs de Supabase.

## ✅ Configuration Auth Webhook (Via Dashboard)

### Étape 1 : Activer le Webhook

1. Allez sur **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. **Authentication** → **Hooks** (dans le menu)
4. Trouvez **"User Identity Verified"** ou **"User Updated"**
5. Activez le hook

### Étape 2 : Configurer l'URL

Dans le champ **Webhook URL**, entrez :

```
https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-collaborator-confirmation
```

### Étape 3 : Sélectionner les Événements

Cochez :

- ✅ **User email confirmed** (quand `email_confirmed_at` change)
- ✅ **User updated** (optionnel, si vous voulez tous les updates)

### Étape 4 : Configurer les Secrets

Le webhook Supabase Auth envoie automatiquement un JWT signé dans le header :

```
Authorization: Bearer <JWT_TOKEN>
```

Votre Edge Function peut le vérifier avec :

```typescript
import { createClient } from '@supabase/supabase-js';

serve(async req => {
  // Vérifier le JWT du webhook
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  // Créer client Supabase
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!, // Anon key suffit
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );

  // Vérifier le token
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response('Invalid token', { status: 401 });
  }

  // Traiter l'événement
  const payload = await req.json();
  console.log('User confirmed:', payload);

  // Votre logique ici
  // Exemple : Créer un profil
  const { error: profileError } = await supabase.from('profiles').insert({
    user_id: user.id,
    email: user.email,
    created_at: new Date().toISOString(),
  });

  if (profileError) {
    console.error('Error creating profile:', profileError);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## 📋 Format du Payload

Supabase Auth envoie ce payload :

```json
{
  "type": "user.updated",
  "created_at": "2024-11-11T10:00:00Z",
  "record": {
    "id": "user-id-uuid",
    "email": "user@example.com",
    "email_confirmed_at": "2024-11-11T10:00:00Z",
    "created_at": "2024-11-10T08:00:00Z",
    "updated_at": "2024-11-11T10:00:00Z",
    ...
  }
}
```

## 🎯 Avantages de Auth Webhooks vs Trigger SQL

| Auth Webhooks                    | Trigger SQL                       |
| -------------------------------- | --------------------------------- |
| ✅ Pas besoin permissions admin  | ❌ Besoin superuser               |
| ✅ Configuration via Dashboard   | ❌ Migration SQL complexe         |
| ✅ JWT automatique pour sécurité | ⚠️ Besoin gérer auth manuellement |
| ✅ Retry automatique si échec    | ❌ Échec silencieux               |
| ✅ Logs dans Dashboard           | ❌ Logs PostgreSQL                |

## 🚀 Déploiement

1. **Créer Edge Function** :

   ```bash
   supabase functions new handle-collaborator-confirmation
   ```

2. **Configurer .env** :

   ```bash
   SUPABASE_URL=https://qliinxtanjdnwxlvnxji.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   ```

3. **Déployer** :

   ```bash
   supabase functions deploy handle-collaborator-confirmation
   ```

4. **Configurer webhook dans Dashboard** (voir Étape 1-3)

5. **Tester** :
   - Inscrivez un nouvel utilisateur
   - Confirmez l'email
   - Vérifiez les logs : Authentication → Hooks → Recent requests

## 🔄 Migration depuis Trigger SQL

Si vous avez déjà le trigger SQL installé :

```sql
-- Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.trigger_collaborator_confirmation();
```

Puis configurez le Auth Webhook via le Dashboard.

## 📚 Ressources

- [Supabase Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Webhook Security](https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook#verify-the-webhook-signature)

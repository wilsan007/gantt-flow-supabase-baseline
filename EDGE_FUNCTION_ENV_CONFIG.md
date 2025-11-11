# 🔐 Configuration Sécurisée : Edge Functions avec Variables d'Environnement

## ✅ BONNE PRATIQUE APPLIQUÉE

**Principe** : Ne JAMAIS stocker de clés dans le code SQL, utiliser les variables d'environnement.

## 📂 Structure

```
supabase/
├── functions/
│   └── handle-collaborator-confirmation/
│       ├── index.ts                    ← Code de l'Edge Function
│       └── .env.example                ← Template des variables
└── .env.local                          ← Variables locales (gitignored)
```

## 🔧 Configuration

### 1. Créer `.env.local` (ou `.env`)

Créez le fichier `supabase/.env.local` (déjà dans `.gitignore`) :

```env
# Supabase API Keys
SUPABASE_URL=https://qliinxtanjdnwxlvnxji.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...votre_service_role_key

# Autres secrets
DATABASE_URL=postgresql://...
SMTP_PASSWORD=...
```

### 2. Edge Function : Lire les Variables

Dans `supabase/functions/handle-collaborator-confirmation/index.ts` :

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async req => {
  try {
    // ✅ Lire depuis les variables d'environnement
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Créer client Supabase avec accès admin
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Traiter le payload du trigger
    const payload = await req.json();
    const { record } = payload;

    // Votre logique ici
    console.log('User confirmed:', record.id);

    // Exemple : Créer un profil utilisateur
    const { error } = await supabase.from('profiles').insert({
      user_id: record.id,
      email: record.email,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

### 3. Déployer avec les Variables

```bash
# Développement local
supabase functions serve handle-collaborator-confirmation --env-file supabase/.env.local

# Production : Définir les secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
supabase secrets set SUPABASE_URL=https://...

# Vérifier les secrets
supabase secrets list

# Déployer
supabase functions deploy handle-collaborator-confirmation
```

## 🔒 Avantages de Cette Approche

| ✅ Avantage        | Description                              |
| ------------------ | ---------------------------------------- |
| **Sécurité**       | Aucune clé exposée dans le code          |
| **Flexibilité**    | Changez les clés sans modifier le code   |
| **Environnements** | Dev, staging, prod avec clés différentes |
| **Audit**          | Les secrets sont gérés centralement      |
| **Rotation**       | Changez une clé compromise facilement    |

## 🎯 Architecture Finale

```
┌─────────────────┐
│   PostgreSQL    │
│     Trigger     │ ← Pas de clé !
└────────┬────────┘
         │ HTTP POST (payload uniquement)
         ↓
┌─────────────────┐
│  Edge Function  │ ← Lit Deno.env.get('SUPABASE_KEY')
│ (Deno Runtime)  │
└────────┬────────┘
         │ Authentifié via env vars
         ↓
┌─────────────────┐
│  Supabase API   │
│   (Operations)  │
└─────────────────┘
```

## 🚀 Checklist de Migration

- [ ] Créer `supabase/.env.local` avec toutes les clés
- [ ] Modifier Edge Function pour lire `Deno.env.get()`
- [ ] Tester localement : `supabase functions serve --env-file`
- [ ] Déployer secrets en production : `supabase secrets set`
- [ ] Déployer fonction : `supabase functions deploy`
- [ ] Supprimer toutes les clés hardcodées du SQL
- [ ] Ajouter `.env.local` dans `.gitignore` ✅ (déjà fait)
- [ ] Fermer l'alerte GitHub Security
- [ ] Révoquer l'ancienne clé compromise

## 📚 Ressources

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Managing Secrets](https://supabase.com/docs/guides/functions/secrets)
- [Deno Environment Variables](https://deno.land/manual/runtime/environment_variables)

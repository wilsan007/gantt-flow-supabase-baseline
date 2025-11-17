# Configuration OAuth Google pour Supabase

## 📋 Informations Projet

- **Project ID**: qliinxtanjdnwxlvnxji
- **Supabase URL**: https://qliinxtanjdnwxlvnxji.supabase.co
- **Callback URL**: https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/callback

---

## 🔧 Configuration Google Cloud Console

### 1. Créer un Projet Google Cloud (si pas encore fait)

1. Aller sur : https://console.cloud.google.com/
2. Créer un nouveau projet : "Wadashaqayn App"
3. Sélectionner le projet

### 2. Activer Google+ API

1. Aller sur : https://console.cloud.google.com/apis/library
2. Chercher "Google+ API"
3. Cliquer "Enable"

### 3. Créer des Identifiants OAuth 2.0

1. Aller sur : https://console.cloud.google.com/apis/credentials
2. Cliquer "Create Credentials" → "OAuth Client ID"
3. Si demandé, configurer l'écran de consentement OAuth :
   - User Type: **External**
   - App name: **Wadashaqayn**
   - User support email: votre email
   - Developer contact: votre email
   - Scopes: email, profile, openid
   - Test users: ajoutez votre email

4. Créer l'OAuth Client ID :
   - Application type: **Web application**
   - Name: **Wadashaqayn - Supabase Auth**
5. **Origines JavaScript autorisées** :

   ```
   http://localhost:8083
   http://localhost:5173
   https://wadashaqayn.com
   https://qliinxtanjdnwxlvnxji.supabase.co
   ```

6. **URI de redirection autorisés** :

   ```
   https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/callback
   ```

7. Cliquer "Create"

8. **COPIEZ** :
   - ✅ Client ID : `XXXXXXX.apps.googleusercontent.com`
   - ✅ Client Secret : `GOCSPX-XXXXXXXXXXXXXXXXX`

---

## 🔧 Configuration Supabase Dashboard

### 1. Activer Google Provider

1. Aller sur : https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/auth/providers

2. Trouver **Google** dans la liste

3. Cliquer pour développer

4. Activer le toggle **"Google Enabled"**

5. Remplir :
   - **Client ID (OAuth)** : `XXXXXXX.apps.googleusercontent.com`
   - **Client Secret (OAuth)** : `GOCSPX-XXXXXXXXXXXXXXXXX`
   - **Skip nonce check** : ❌ Laisser décoché (plus sécurisé)

6. Cliquer **"Save"**

---

## 🧪 Test de Connexion

### Test 1 : En Local (http://localhost:8083)

1. Lancer : `npm run dev`
2. Ouvrir : http://localhost:8083
3. Cliquer "Se connecter avec Google"
4. Sélectionner un compte Google
5. ✅ Redirection vers l'app + connexion réussie

### Test 2 : En Production (après déploiement)

1. Aller sur : https://wadashaqayn.com
2. Cliquer "Se connecter avec Google"
3. Sélectionner un compte Google
4. ✅ Redirection vers l'app + connexion réussie

---

## ⚠️ Problèmes Courants

### Erreur : "redirect_uri_mismatch"

**Cause** : L'URL de callback n'est pas autorisée dans Google Cloud Console

**Solution** :

1. Vérifier les "URI de redirection autorisés" dans Google Cloud Console
2. Doit contenir EXACTEMENT : `https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/callback`
3. Sauvegarder et attendre 5 minutes

### Erreur : "Invalid client"

**Cause** : Client ID ou Client Secret incorrect

**Solution** :

1. Revérifier les valeurs copiées depuis Google Cloud Console
2. Pas d'espaces avant/après
3. Resauvegarder dans Supabase Dashboard

### Erreur : "Access blocked: This app's request is invalid"

**Cause** : Écran de consentement OAuth non configuré

**Solution** :

1. Google Cloud Console → OAuth consent screen
2. Publier l'app (passer en "In Production") OU ajouter votre email dans "Test users"

### Connexion Google fonctionne mais "User not found"

**Cause** : Profil non créé automatiquement après authentification Google

**Solution** :

1. Vérifier que le trigger `handle_new_user` existe dans Supabase
2. Ou créer manuellement le profil après la première connexion Google

---

## 🔒 Sécurité

✅ **Bonnes pratiques** :

- Ne jamais exposer le Client Secret côté client
- Utiliser HTTPS en production
- Activer "Skip nonce check" uniquement si nécessaire
- Limiter les origines JavaScript autorisées

❌ **À éviter** :

- Hardcoder les secrets dans le code
- Désactiver la validation PKCE
- Autoriser `*` dans les origines

---

## 📚 Ressources

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Troubleshooting OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google#troubleshooting)

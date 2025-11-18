# 🔐 Configuration OAuth avec Domaine Personnalisé - Wadashaqayn.org

## ❌ Problème

Lors de la connexion OAuth (Google/Microsoft), le nom du projet Supabase s'affiche au lieu du nom de domaine **wadashaqayn.org**.

## ✅ Solution Complète

### **1. Configuration Supabase Dashboard**

#### **Étape 1 : Accéder aux Authentication Settings**

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Menu **Authentication** → **URL Configuration**

#### **Étape 2 : Configurer le Site URL**

### Étape 1 : Supabase Dashboard

#### A. Accéder aux Paramètres

**URL** : https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/settings/auth

#### B. Configuration URL

Dans **"URL Configuration"** :

**1. Site URL** :

```
https://wadashaqayn.org
```

**2. Redirect URLs** (une par ligne) :

```
https://wadashaqayn.org/*
https://wadashaqayn.org/auth/callback
https://wadashaqayn.org/auth/google/callback
http://localhost:5173/*
http://localhost:5173/auth/callback
```

**3. Additional Redirect URLs** (si la section existe) :

```
https://wadashaqayn.org/**
```

#### C. Sauvegarder

- Cliquez **"Save"** en bas de la page
- Attendez quelques secondes pour que les changements soient appliqués

---

### Étape 2 : Google Cloud Console

#### A. Accéder aux Credentials

**URL** : https://console.cloud.google.com/apis/credentials

1. **Sélectionnez votre projet** (menu déroulant en haut)
2. Trouvez votre **"OAuth 2.0 Client ID"**
3. **Cliquez dessus** pour modifier

#### B. Origines JavaScript Autorisées

Cliquez **"ADD URI"** et ajoutez :

```
https://wadashaqayn.org
https://qliinxtanjdnwxlvnxji.supabase.co
http://localhost:5173
```

**Note** : Gardez l'URL Supabase car elle est nécessaire pour le backend OAuth.

#### C. URI de Redirection Autorisés

Cliquez **"ADD URI"** et ajoutez :

```
https://wadashaqayn.org/auth/callback
https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/callback
http://localhost:5173/auth/callback
```

**Important** : L'URL Supabase `/auth/v1/callback` est **obligatoire** pour le flow OAuth.

#### D. Sauvegarder

- Cliquez **"SAVE"** en bas
- Attendez que la notification "OAuth client updated" apparaisse

---

### Étape 3 : Écran de Consentement OAuth (Personnalisation)

#### A. Accéder à l'Écran de Consentement

**URL** : https://console.cloud.google.com/apis/credentials/consent

OU

**Navigation** : APIs & Services → OAuth consent screen

#### B. Modifier l'Application

Cliquez **"EDIT APP"** ou **"Modifier l'application"**

#### C. Informations de l'Application

**Section "OAuth consent screen"** :

| Champ                  | Valeur à Configurer                   |
| ---------------------- | ------------------------------------- |
| **App name**           | `Wadashaqayn`                         |
| **User support email** | Votre email                           |
| **App logo**           | Logo de votre application (optionnel) |

**Section "App domain"** :

| Champ                                 | Valeur                            |
| ------------------------------------- | --------------------------------- |
| **Application home page**             | `https://wadashaqayn.org`         |
| **Application privacy policy link**   | `https://wadashaqayn.org/privacy` |
| **Application terms of service link** | `https://wadashaqayn.org/terms`   |

**Section "Authorized domains"** :

Cliquez **"ADD DOMAIN"** et ajoutez :

```
wadashaqayn.org
supabase.co
```

**Note** : `supabase.co` doit rester pour le flow OAuth backend.

#### D. Sauvegarder

- Cliquez **"SAVE AND CONTINUE"** en bas
- Passez les autres sections (Scopes, Test users) si déjà configurées
- Cliquez **"BACK TO DASHBOARD"**

---

## 🔍 Vérification de la Configuration

### Test Complet

#### 1. Vider le Cache

Avant de tester, videz le cache du navigateur :

- **Chrome/Firefox** : Ctrl+Shift+Delete
- Cochez "Cookies" et "Cache"
- Dernière heure

#### 2. Tester la Connexion

1. Allez sur : `https://wadashaqayn.org`
2. Cliquez **"Se connecter avec Google"**
3. **Vérifiez ce qui s'affiche** :

**AVANT (incorrect)** :

```
Connexion à : qliinxtanjdnwxlvnxji.supabase.co
```

**APRÈS (correct)** :

```
Connexion à : Wadashaqayn
URL : wadashaqayn.org
```

#### 3. Vérifier la Popup Google

La popup OAuth Google devrait afficher :

```
┌─────────────────────────────────┐
│  Connexion avec Google          │
│                                 │
│  Wadashaqayn souhaite accéder   │
│  à votre compte Google          │
│                                 │
│  wadashaqayn.org               │  ← Votre domaine !
│                                 │
│  [Continuer]  [Annuler]        │
└─────────────────────────────────┘
```

---

## 📊 Récapitulatif des URLs

### Configuration Supabase

| Paramètre          | Valeur                                  |
| ------------------ | --------------------------------------- |
| **Site URL**       | `https://wadashaqayn.org`               |
| **Redirect URL 1** | `https://wadashaqayn.org/*`             |
| **Redirect URL 2** | `https://wadashaqayn.org/auth/callback` |

### Configuration Google OAuth

| Type                    | URL                                                         |
| ----------------------- | ----------------------------------------------------------- |
| **Origine autorisée 1** | `https://wadashaqayn.org`                                   |
| **Origine autorisée 2** | `https://qliinxtanjdnwxlvnxji.supabase.co`                  |
| **Redirect URI 1**      | `https://wadashaqayn.org/auth/callback`                     |
| **Redirect URI 2**      | `https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/callback` |

### Configuration Écran de Consentement

| Champ              | Valeur                  |
| ------------------ | ----------------------- |
| **Nom**            | Wadashaqayn             |
| **Domaine**        | wadashaqayn.org         |
| **Page d'accueil** | https://wadashaqayn.org |

---

## ⚠️ Points Importants

### 1. Ne PAS Supprimer les URLs Supabase

Les URLs `*.supabase.co` sont **nécessaires** pour le flow OAuth backend :

- Supabase gère l'authentification côté serveur
- Il vérifie le token et crée la session
- Puis redirige vers votre domaine

**Flow OAuth complet** :

```
1. User clique "Connexion Google" sur wadashaqayn.org
2. Redirect vers Google OAuth
3. Google valide et redirect vers supabase.co/auth/v1/callback
4. Supabase crée la session JWT
5. Supabase redirect vers wadashaqayn.org/auth/callback
6. Votre app récupère le token et connecte l'utilisateur
```

### 2. Propagation des Changements

Après modification :

- **Google OAuth** : Instantané (quelques secondes)
- **Supabase** : Instantané
- **Cache navigateur** : Peut prendre jusqu'à 1 heure

**Solution** : Testez en navigation privée ou videz le cache.

### 3. HTTPS Obligatoire

OAuth Google **exige HTTPS** en production :

- ✅ `https://wadashaqayn.org` - OK
- ❌ `http://wadashaqayn.org` - Refusé
- ✅ `http://localhost:5173` - OK (exception dev)

---

## 🐛 Dépannage

### Problème 1 : "redirect_uri_mismatch"

**Erreur** :

```
Error: redirect_uri_mismatch
```

**Cause** : L'URI de redirection ne correspond pas exactement.

**Solution** :

1. Vérifiez que dans Google Console, vous avez :
   ```
   https://wadashaqayn.org/auth/callback
   ```
2. **Pas d'espace** avant ou après
3. **Pas de slash** à la fin

### Problème 2 : Domaine Non Autorisé

**Erreur** :

```
Error: unauthorized_client
```

**Cause** : Le domaine n'est pas dans "Authorized domains".

**Solution** :

1. Google Console → OAuth consent screen
2. Section "Authorized domains"
3. Ajoutez `wadashaqayn.org`

### Problème 3 : URL Supabase Toujours Affichée

**Cause** : Cache navigateur ou configuration non propagée.

**Solution** :

1. Videz le cache (Ctrl+Shift+Delete)
2. Testez en navigation privée
3. Vérifiez la configuration Google OAuth (Écran de consentement)
4. Attendez 5 minutes et réessayez

### Problème 4 : "Access Blocked: Authorization Error"

**Erreur** :

```
Access blocked: Authorization Error
Error 400: redirect_uri_mismatch
```

**Cause** : Plusieurs possibilités de mismatch.

**Solution** :

1. Dans Supabase, copiez exactement l'URL de callback :
   ```bash
   # Aller dans Supabase → Authentication → Providers → Google
   # Copier le "Callback URL (for OAuth)"
   ```
2. Collez cette URL exacte dans Google Console

---

## ✅ Checklist Finale

### Supabase

- [ ] Site URL = `https://wadashaqayn.org`
- [ ] Redirect URLs ajoutées
- [ ] Configuration sauvegardée

### Google OAuth Credentials

- [ ] Origine `https://wadashaqayn.org` ajoutée
- [ ] Redirect URI `https://wadashaqayn.org/auth/callback` ajouté
- [ ] URLs Supabase conservées
- [ ] Configuration sauvegardée

### Google OAuth Consent Screen

- [ ] App name = "Wadashaqayn"
- [ ] Home page = `https://wadashaqayn.org`
- [ ] Domain `wadashaqayn.org` autorisé
- [ ] Configuration sauvegardée

### Test

- [ ] Cache navigateur vidé
- [ ] Connexion Google testée
- [ ] Domaine "wadashaqayn.org" affiché ✅
- [ ] Authentification réussie

---

## 📸 Captures d'Écran des Configurations

### Supabase - URL Configuration

```
Site URL: https://wadashaqayn.org

Redirect URLs:
  https://wadashaqayn.org/*
  https://wadashaqayn.org/auth/callback
  http://localhost:5173/*
```

### Google Cloud Console - OAuth Client

**Origines JavaScript autorisées** :

```
1. https://wadashaqayn.org
2. https://qliinxtanjdnwxlvnxji.supabase.co
3. http://localhost:5173
```

**URI de redirection autorisés** :

```
1. https://wadashaqayn.org/auth/callback
2. https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/callback
3. http://localhost:5173/auth/callback
```

### Google Cloud Console - OAuth Consent Screen

```
App name: Wadashaqayn
Application home page: https://wadashaqayn.org
Authorized domains:
  - wadashaqayn.org
  - supabase.co
```

---

**✅ Après ces configurations, votre domaine "wadashaqayn.org" s'affichera lors de la connexion Google ! 🎉**

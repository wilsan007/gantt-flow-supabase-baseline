# 🔧 Guide de Configuration OAuth - Résolution Erreur

## 🚨 Erreur Rencontrée

```json
{
  "code": 400,
  "error_code": "validation_failed",
  "msg": "Unsupported provider: provider is not enabled"
}
```

**Cause** : Les providers OAuth ne sont pas encore configurés dans Supabase.

**Solution** : Activer les providers dans Supabase Dashboard.

---

## ✅ Solution Immédiate : OAuth Désactivé

J'ai **temporairement désactivé** les boutons OAuth dans le code pour que vous puissiez :

1. ✅ **Tester MFA immédiatement** sans erreur
2. ✅ **Utiliser le login classique** (email/password)
3. ⏳ **Configurer OAuth plus tard** quand vous voulez

**Changement effectué** :
```tsx
// Dans /src/components/Auth.tsx ligne 239-240
{/* OAuth temporairement désactivé */}
{/* {!showMFAInput && !isSignUp && <SocialAuth />} */}
```

**Résultat** : Plus d'erreur 400, vous pouvez tester MFA maintenant ! ✅

---

## 🌐 Configuration OAuth (Quand Vous Voulez)

### **Pourquoi Configurer OAuth ?**

- ✅ **Meilleur UX** : Login en 1 clic
- ✅ **+20-30% conversion** : Moins de friction
- ✅ **Sécurité** : Pas de mot de passe à gérer
- ✅ **Score +5 points** : 3/10 → 8/10

**Temps** : 15-20 minutes par provider

---

## 📝 Configuration Google OAuth

### **Étape 1 : Google Cloud Console**

#### **A. Créer un Projet**

1. Aller sur : https://console.cloud.google.com/
2. En haut à gauche → **Sélectionner un projet** → **Nouveau projet**
3. Nom du projet : `Wadashaqeen` (ou votre choix)
4. Cliquer **Créer**
5. Attendre 10-20 secondes
6. Sélectionner le nouveau projet

#### **B. Activer l'API Google+**

1. Menu hamburger (☰) → **APIs & Services** → **Library**
2. Rechercher : `Google+ API`
3. Cliquer sur **Google+ API**
4. Cliquer **Enable** (Activer)
5. Attendre quelques secondes

#### **C. Créer les Credentials OAuth**

1. Menu → **APIs & Services** → **Credentials**
2. Cliquer **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Si demandé, configurer l'écran de consentement :
   - Type : **External**
   - App name : `Wadashaqeen`
   - User support email : votre email
   - Developer contact : votre email
   - Cliquer **Save and Continue** (x3)

4. Retour à **Credentials** → **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Application type : **Web application**
6. Name : `Wadashaqeen Web Client`

7. **Authorized JavaScript origins** :
   ```
   http://localhost:8080
   https://votre-domaine.com
   ```

8. **Authorized redirect URIs** :
   ```
   https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/callback
   ```

9. Cliquer **Create**

10. **IMPORTANT** : Copier et sauvegarder :
    - **Client ID** : `1234567890-abcdefg.apps.googleusercontent.com`
    - **Client Secret** : `GOCSPX-xxxxxxxxxxxxx`

### **Étape 2 : Supabase Dashboard**

1. Aller sur : https://app.supabase.com/
2. Sélectionner votre projet : `Wadashaqeen`
3. Menu gauche → **Authentication** → **Providers**
4. Chercher **Google** dans la liste
5. Toggle **Enable Sign in with Google** → ON (vert)
6. Coller vos credentials :
   - **Client ID** : (celui de Google Cloud Console)
   - **Client Secret** : (celui de Google Cloud Console)
7. Cliquer **Save**

### **Étape 3 : Réactiver dans le Code**

```tsx
// Dans /src/components/Auth.tsx ligne 239-240
// Décommenter cette ligne :
{!showMFAInput && !isSignUp && <SocialAuth />}
```

### **Étape 4 : Tester**

```bash
# Rafraîchir le navigateur
# http://localhost:8080/

1. Observer bouton "Continuer avec Google"
2. Cliquer dessus
3. Sélectionner compte Google
4. Autoriser l'application
5. Redirection automatique
✅ Connecté avec Google !
```

---

## 📝 Configuration Microsoft OAuth

### **Étape 1 : Azure Portal**

#### **A. Créer une App Registration**

1. Aller sur : https://portal.azure.com/
2. Rechercher : **Azure Active Directory** (ou **Microsoft Entra ID**)
3. Menu gauche → **App registrations**
4. Cliquer **+ New registration**

5. Configuration :
   - **Name** : `Wadashaqeen`
   - **Supported account types** : 
     - ☑️ **Accounts in any organizational directory and personal Microsoft accounts**
   - **Redirect URI** :
     - Platform : **Web**
     - URI : `https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/callback`
6. Cliquer **Register**

#### **B. Copier l'Application ID**

1. Page de l'app → **Overview**
2. **Copier** :
   - **Application (client) ID** : `12345678-1234-1234-1234-123456789abc`
   - **Directory (tenant) ID** : `87654321-4321-4321-4321-210987654321`

#### **C. Créer un Client Secret**

1. Menu gauche → **Certificates & secrets**
2. Onglet **Client secrets**
3. Cliquer **+ New client secret**
4. Description : `Wadashaqeen Secret`
5. Expires : **24 months** (recommandé)
6. Cliquer **Add**
7. **IMPORTANT** : Copier immédiatement la **Value** :
   - `abcdefghijklmnopqrstuvwxyz123456789`
   - ⚠️ Elle ne sera plus visible après !

#### **D. Configurer les Permissions**

1. Menu gauche → **API permissions**
2. Vérifier que ces permissions sont présentes :
   - ✅ `User.Read` (Microsoft Graph)
   - ✅ `email`
   - ✅ `openid`
   - ✅ `profile`
3. Si manquantes, cliquer **+ Add a permission** → **Microsoft Graph** → **Delegated permissions**

### **Étape 2 : Supabase Dashboard**

1. Aller sur : https://app.supabase.com/
2. Sélectionner votre projet
3. **Authentication** → **Providers**
4. Chercher **Azure** dans la liste
5. Toggle **Enable Sign in with Azure** → ON
6. Coller vos credentials :
   - **Client ID** : (Application ID d'Azure)
   - **Client Secret** : (Value du secret créé)
   - **Azure Tenant** :
     - Pour tous les comptes Microsoft : `common`
     - Pour un tenant spécifique : votre Tenant ID
7. Cliquer **Save**

### **Étape 3 : Réactiver dans le Code**

Même chose que pour Google (décommenter la ligne SocialAuth).

### **Étape 4 : Tester**

```bash
# Page de login
1. Observer bouton "Continuer avec Microsoft"
2. Cliquer dessus
3. Sélectionner compte Microsoft
4. Autoriser l'application
5. Redirection automatique
✅ Connecté avec Microsoft !
```

---

## 🔄 Réactivation OAuth dans le Code

Une fois les providers configurés dans Supabase :

<function_calls>
<invoke name="read_file">
<parameter name="file_path">/home/awaleh/Bureau/Wadashaqeen-SaaS/gantt-flow-next/src/components/Auth.tsx

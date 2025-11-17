# 🔄 Guide de Migration de Domaine : .org → .com

## 📋 Checklist Complète

### ✅ Phase 1 : Configuration Backend (AVANT le DNS)

#### 1️⃣ Supabase Dashboard

- [ ] Aller sur : https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji
- [ ] **Authentication** → **URL Configuration**
- [ ] Modifier **Site URL** : `https://wadashaqayn.com`
- [ ] **Redirect URLs** - Ajouter :
  - `https://wadashaqayn.com/*`
  - `https://wadashaqayn.com/auth/callback`
  - Garder temporairement les anciennes URLs .org
- [ ] Cliquer **Save**

#### 2️⃣ Google OAuth (Si utilisé)

- [ ] Aller sur : https://console.cloud.google.com/apis/credentials
- [ ] Sélectionner votre **OAuth 2.0 Client ID**
- [ ] **Origines JavaScript autorisées** - Ajouter :
  - `https://wadashaqayn.com`
- [ ] **URI de redirection autorisés** - Ajouter :
  - `https://wadashaqayn.com/auth/callback`
- [ ] Cliquer **Save**

#### 3️⃣ Variables d'Environnement

**AUCUNE modification nécessaire dans `.env` !**

```bash
# .env - NE PAS MODIFIER
VITE_SUPABASE_URL=https://qliinxtanjdnwxlvnxji.supabase.co  ← Ne change PAS
VITE_SUPABASE_ANON_KEY=eyJhbGc...                           ← Ne change PAS
```

#### 4️⃣ GitHub Secrets

**AUCUNE modification nécessaire !**

Les secrets GitHub restent identiques car ils pointent vers Supabase, pas vers votre domaine.

---

### ✅ Phase 2 : Configuration DNS Hostinger

#### 1️⃣ Vérifier que le Domaine .com est Ajouté

- [ ] Connectez-vous à Hostinger
- [ ] **Domaines** → Vérifiez que `wadashaqayn.com` est présent
- [ ] Si non présent, ajoutez-le ou achetez-le

#### 2️⃣ Configuration DNS

- [ ] Allez dans **Domaines** → **wadashaqayn.com** → **DNS/Nameservers**
- [ ] Vérifiez les enregistrements A :

```
Type: A
Nom: @
Pointe vers: [IP du serveur Hostinger]
TTL: 14400
```

```
Type: A
Nom: www
Pointe vers: [IP du serveur Hostinger]
TTL: 14400
```

#### 3️⃣ Configuration FTP (Hostinger)

- [ ] Allez dans **Hébergement** → **wadashaqayn.com**
- [ ] **FTP Accounts** → Notez les nouvelles infos si différentes
- [ ] **OU** : Associer le nouveau domaine au même hébergement que .org

---

### ✅ Phase 3 : Mise à Jour du Code

#### 1️⃣ Workflow GitHub Actions

**Fichier à modifier :** `.github/workflows/main-pipeline.yml`

```yaml
# Ligne 174
environment:
  name: production
  url: https://wadashaqayn.com # ← Changer ici
```

```yaml
# Ligne 215
echo "🌐 **URL:** https://wadashaqayn.com" >> $GITHUB_STEP_SUMMARY # ← Changer ici
```

#### 2️⃣ Fichiers de Documentation (Optionnel)

Mettre à jour dans ces fichiers (pour référence uniquement) :

- `INSTRUCTIONS_DEPLOIEMENT_HOSTINGER.md`
- `DEPLOYMENT_STATUS.md`
- `OAUTH_CONFIG.md`
- `DEPLOIEMENT_MANUEL_HOSTINGER.md`
- `test-ftp-connection.sh`

**Script automatique :**

```bash
# Remplacer .org par .com dans tous les fichiers MD
find . -name "*.md" -type f -exec sed -i 's/wadashaqayn\.org/wadashaqayn.com/g' {} +
```

---

### ✅ Phase 4 : Déploiement

#### Option A : Déploiement Automatique (GitHub Actions)

1. **Commit et Push**

```bash
git add -A
git commit -m "chore: migrate domain from .org to .com"
git push origin main
```

2. **Surveiller le Workflow**

```
https://github.com/wilsan007/gantt-flow-supabase-baseline/actions
```

#### Option B : Déploiement Manuel

1. **Rebuild l'Application**

```bash
npm run build
```

2. **Upload vers Hostinger**
   - Via File Manager : Uploadez `dist/` vers `/public_html/`
   - Via FTP : Transférez tout `dist/` vers `/public_html/`

---

### ✅ Phase 5 : Vérification et Tests

#### 1️⃣ Vérification DNS

```bash
# Vérifier que le domaine .com est résolu
nslookup wadashaqayn.com
# Devrait retourner l'IP du serveur
```

#### 2️⃣ Test du Site

- [ ] Allez sur : `https://wadashaqayn.com`
- [ ] Vérifiez que le site s'affiche
- [ ] Testez la navigation

#### 3️⃣ Test de l'Authentification

- [ ] Essayez de vous **connecter**
- [ ] Vérifiez la **redirection après login**
- [ ] Si OAuth Google : Testez la connexion Google

#### 4️⃣ Test des Fonctionnalités

- [ ] Créer une tâche
- [ ] Accéder aux pages RH
- [ ] Vérifier les permissions

---

### ✅ Phase 6 : Nettoyage (7-30 jours après migration)

#### Après confirmation que tout fonctionne sur .com :

1. **Supabase** : Supprimer les anciennes URLs .org des Redirect URLs
2. **Google OAuth** : Supprimer les anciennes URLs .org
3. **Redirection .org → .com** (Optionnel) :
   - Dans Hostinger, configurer une redirection 301 de .org vers .com
   - Permet aux anciens liens de continuer à fonctionner

---

## 🔑 Points Clés à Retenir

### ✅ Ce qui NE CHANGE PAS :

- ❌ URL Supabase : `https://qliinxtanjdnwxlvnxji.supabase.co`
- ❌ Clé Anon Supabase
- ❌ Secrets GitHub (Supabase)
- ❌ Code de l'application

### ✅ Ce qui CHANGE :

- ✅ Site URL dans Supabase Dashboard
- ✅ Redirect URLs dans Supabase
- ✅ Origines OAuth dans Google Console
- ✅ URLs dans les workflows GitHub Actions
- ✅ Configuration DNS/Domaine sur Hostinger
- ✅ Secrets FTP GitHub (si le serveur FTP change)

---

## 🆘 Dépannage

### ❌ "Connexion impossible après migration"

**Cause :** Site URL ou Redirect URLs mal configurés dans Supabase

**Solution :**

1. Vérifiez Supabase Dashboard → Authentication → URL Configuration
2. Assurez-vous que `https://wadashaqayn.com/*` est dans les Redirect URLs
3. Videz le cache du navigateur

### ❌ "OAuth Google ne fonctionne plus"

**Cause :** Origines JavaScript non mises à jour dans Google Console

**Solution :**

1. Allez sur Google Cloud Console
2. Ajoutez `https://wadashaqayn.com` dans les origines autorisées
3. Ajoutez `https://wadashaqayn.com/auth/callback` dans les URI de redirection

### ❌ "Site inaccessible sur .com"

**Cause :** DNS non configuré ou non propagé

**Solution :**

1. Vérifiez la configuration DNS sur Hostinger
2. Attendez la propagation DNS (24-48h max)
3. Testez avec `nslookup wadashaqayn.com`

---

## 📊 Calendrier Recommandé

| Jour | Action                                        |
| ---- | --------------------------------------------- |
| J-1  | Configurer Supabase + Google OAuth            |
| J0   | Configurer DNS + Déployer                     |
| J+1  | Vérifier et tester toutes les fonctionnalités |
| J+7  | Confirmer que tout fonctionne                 |
| J+30 | Nettoyer les anciennes URLs .org              |

---

## 🚀 Commandes Rapides

### Remplacer .org par .com dans les fichiers MD

```bash
find . -name "*.md" -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -exec sed -i 's/wadashaqayn\.org/wadashaqayn.com/g' {} +
```

### Remplacer dans le workflow GitHub

```bash
sed -i 's/wadashaqayn\.org/wadashaqayn.com/g' .github/workflows/main-pipeline.yml
```

### Rebuild et Redeploy

```bash
npm run build
cd dist && tar -czf ../wadashaqayn-deployment.tar.gz . && cd ..
```

---

**✅ Suivez ce guide étape par étape pour une migration sans problème ! 🎯**

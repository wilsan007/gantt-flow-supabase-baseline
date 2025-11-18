# 🔒 Guide de Sécurité - Variables d'Environnement

## 🚨 ALERTE SÉCURITÉ CRITIQUE

### Clés Compromises Détectées dans l'Historique Git

**Commit `3570b58` contenait :**

- ❌ `SUPABASE_SERVICE_ROLE_KEY` (Accès ADMIN total)
- ❌ `RESEND_API_KEY` (Clé API privée)

**STATUS :** ⚠️ **ACTIONS REQUISES** (Voir ci-dessous)

---

## ✅ Bonnes Pratiques

### 1️⃣ Séparation des Variables

#### Variables FRONTEND (`.env` local)

**Préfixe : `VITE_*`**

```bash
# ✅ OK - Publiques par conception
VITE_SUPABASE_URL=https://qliinxtanjdnwxlvnxji.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_APP_ENV=development
V ITE_APP_URL=http://localhost:8080
```

**Visibilité :**

- ✅ Incluses dans le build final
- ✅ Visibles dans le navigateur (DevTools)
- ✅ Protégées par RLS Supabase

#### Variables BACKEND (Supabase Edge Functions)

**Configuration : Supabase Dashboard → Edge Functions → Secrets**

```bash
# ❌ NE JAMAIS dans .env local ou Git
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Clé ADMIN
RESEND_API_KEY=re_xxx                 # Clé API privée
DATABASE_URL=postgresql://...         # Accès DB direct
STRIPE_SECRET_KEY=sk_live_...         # Clés paiement
```

**Visibilité :**

- ❌ JAMAIS dans le code source
- ❌ JAMAIS dans Git
- ✅ Stockées uniquement sur Supabase

---

## 🚨 Actions Immédiates Requises

### 1️⃣ Révoquer les Clés Compromises

#### A. Supabase Service Role Key

**URL :** https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/settings/api

**Actions :**

1. Cliquez sur "Reset" à côté de "service_role secret"
2. Confirmez la régénération
3. Copiez la nouvelle clé
4. Mettez-la dans **Supabase → Edge Functions → Secrets** (PAS dans .env local)

#### B. Resend API Key

**URL :** https://resend.com/api-keys

**Actions :**

1. Supprimez la clé : `re_D5Dmurzr_D8gKd6vMjwtuzCJdfoYcNZFz`
2. Créez une nouvelle clé
3. Copiez-la
4. Mettez-la dans **Supabase → Edge Functions → Secrets** (PAS dans .env local)

### 2️⃣ Nettoyer l'Historique Git (Recommandé)

⚠️ **ATTENTION :** Réécrit l'historique Git

#### Option 1 : BFG Repo-Cleaner (Recommandé)

```bash
# Installer BFG
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# Nettoyer
cd /home/awaleh/Bureau/Wadashaqayn-SaaS/gantt-flow-next
java -jar ../bfg-1.14.0.jar --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force origin main
```

#### Option 2 : git filter-branch

```bash
cd /home/awaleh/Bureau/Wadashaqayn-SaaS/gantt-flow-next

git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

git push --force --all origin
```

#### Option 3 : Nouveau Repo (Le Plus Sûr)

Si vous êtes seul sur le projet :

```bash
# 1. Backup
cp -r gantt-flow-next gantt-flow-next-backup

# 2. Nouveau repo sans historique
cd gantt-flow-next
rm -rf .git
git init
git add .
git commit -m "chore: clean repository - removed secret history"

# 3. Push vers nouveau repo GitHub
git remote add origin <NOUVEAU_REPO_URL>
git push -u origin main
```

---

## ✅ Vérifications de Sécurité

### Checklist Post-Incident

- [ ] Service Role Key révoquée et régénérée
- [ ] Resend API Key révoquée et régénérée
- [ ] Historique Git nettoyé (si applicable)
- [ ] `.env` dans `.gitignore` (Déjà ✅)
- [ ] Nouvelles clés stockées dans Supabase Secrets
- [ ] `.env` local ne contient QUE des variables `VITE_*`

### Test de Sécurité

```bash
# Vérifier qu'.env n'est pas dans Git
git ls-files | grep .env
# Résultat attendu : Rien (sauf .env.example)

# Vérifier l'historique
git log --all --full-history -- .env
# Résultat attendu : Aucun commit (après nettoyage)
```

---

## 📋 Configuration Recommandée

### `.env` Local (Frontend uniquement)

```bash
# Variables publiques pour le frontend
VITE_SUPABASE_URL=https://qliinxtanjdnwxlvnxji.supabase.co
VITE_SUPABASE_ANON_KEY=<votre_clé_anon>

# Configuration app
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:8080
```

### Supabase Edge Functions Secrets

```
Supabase Dashboard → Edge Functions → Secrets → Add Secret

SUPABASE_SERVICE_ROLE_KEY=<nouvelle_clé_service>
RESEND_API_KEY=<nouvelle_clé_resend>
```

### GitHub Secrets

```
GitHub Repo → Settings → Secrets → Actions

# Variables build
VITE_SUPABASE_URL=https://qliinxtanjdnwxlvnxji.supabase.co
VITE_SUPABASE_ANON_KEY=<votre_clé_anon>

# Credentials FTP
FTP_SERVER=ftp.wadashaqayn.com
FTP_USERNAME=<votre_user>
FTP_PASSWORD=<votre_password>
FTP_REMOTE_DIR=public_html
```

---

## 🛡️ Prévention Future

### 1️⃣ Pre-commit Hook

Créez `.git/hooks/pre-commit` :

```bash
#!/bin/bash

# Vérifier si .env est staged
if git diff --cached --name-only | grep -q "^\.env$"; then
    echo "❌ ERREUR: Tentative de commit de .env détectée!"
    echo "Fichier bloqué pour des raisons de sécurité."
    exit 1
fi
```

```bash
chmod +x .git/hooks/pre-commit
```

### 2️⃣ Git Secrets (Outil GitHub)

```bash
# Installer git-secrets
git clone https://github.com/awslabs/git-secrets
cd git-secrets
sudo make install

# Configurer
cd /home/awaleh/Bureau/Wadashaqayn-SaaS/gantt-flow-next
git secrets --install
git secrets --register-aws
```

### 3️⃣ Audit Régulier

```bash
# Vérifier qu'aucun secret n'est dans le code
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" . --exclude-dir={node_modules,dist,.git}
```

---

## 📊 Résumé des Risques

| Clé                         | Risque          | Impact                | Action                    |
| --------------------------- | --------------- | --------------------- | ------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔴 **CRITIQUE** | Accès admin total DB  | Révoquer immédiatement    |
| `RESEND_API_KEY`            | 🟠 **ÉLEVÉ**    | Envoi emails illimité | Révoquer immédiatement    |
| `VITE_SUPABASE_ANON_KEY`    | 🟢 **FAIBLE**   | Clé publique          | Aucune (protégée par RLS) |
| `VITE_SUPABASE_URL`         | 🟢 **AUCUN**    | URL publique          | Aucune                    |

---

## 🔐 Ressources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [GitHub Secrets Management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

---

**✅ Après avoir suivi ce guide, votre application sera sécurisée selon les meilleures pratiques industrielles.**

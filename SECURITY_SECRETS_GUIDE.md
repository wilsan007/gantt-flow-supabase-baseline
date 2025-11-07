# 🔐 Guide de Sécurité des Secrets - Meilleures Pratiques

## 📋 Table des Matières
1. [Principes Fondamentaux](#principes-fondamentaux)
2. [Secrets Frontend vs Backend](#secrets-frontend-vs-backend)
3. [Configuration par Environnement](#configuration-par-environnement)
4. [Gitleaks et Détection](#gitleaks-et-détection)
5. [Checklist de Sécurité](#checklist-de-sécurité)

---

## 🎯 Principes Fondamentaux

### **Règle d'Or**
> **JAMAIS de secrets sensibles dans Git, même dans .env**

### **Ce qui NE doit JAMAIS être committé:**
❌ Fichiers `.env` avec vraies valeurs  
❌ API Keys privées  
❌ Mots de passe de base de données  
❌ Service Role Keys de Supabase  
❌ Tokens d'authentification  
❌ Clés de chiffrement  
❌ Certificats SSL privés (.key, .pem)  
❌ Credentials JSON (Google, AWS, etc.)  

### **Ce qui PEUT être committé:**
✅ Fichier `.env.example` (template sans valeurs)  
✅ Supabase Anon Key (publique par design)  
✅ URLs publiques d'API  
✅ Configuration non sensible  
✅ Features flags publics  

---

## 🔑 Secrets Frontend vs Backend

### **Frontend (Vite/React)**

#### **Variables Accessibles:**
```typescript
// ✅ OK - Variables publiques avec VITE_ prefix
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

#### **⚠️ ATTENTION:**
- Toutes les variables `VITE_*` sont **incluses dans le bundle**
- Elles sont **visibles dans le code source du navigateur**
- N'utilisez que des **clés publiques** côté frontend

#### **Secrets Frontend Légitimes:**
```env
# ✅ OK - Clé publique Supabase (anon key)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ✅ OK - URLs publiques
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_APP_URL=https://votre-domaine.com

# ✅ OK - IDs publics
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

#### **Secrets INTERDITS Frontend:**
```env
# ❌ INTERDIT - Service Role Key (accès admin total)
VITE_SUPABASE_SERVICE_ROLE_KEY=xxx  # ← NE JAMAIS FAIRE!

# ❌ INTERDIT - Secrets backend
VITE_JWT_SECRET=xxx
VITE_DATABASE_PASSWORD=xxx
VITE_API_SECRET_KEY=xxx
```

---

### **Backend (Edge Functions)**

#### **Configuration Supabase:**
```bash
# Via Supabase CLI
supabase secrets set RESEND_API_KEY="re_xxxxx"
supabase secrets set SERVICE_ROLE_KEY="eyJhbGc..."

# Via Dashboard
# Supabase → Edge Functions → Secrets
```

#### **Accès dans les Edge Functions:**
```typescript
// ✅ OK - Secrets backend via Deno.env
const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
const resendApiKey = Deno.env.get('RESEND_API_KEY');
```

#### **Secrets Backend Typiques:**
```
SERVICE_ROLE_KEY       # Supabase admin key
RESEND_API_KEY         # Email service
STRIPE_SECRET_KEY      # Paiements
DATABASE_URL           # Connection string
JWT_SECRET             # Signature tokens
ENCRYPTION_KEY         # Chiffrement données
```

---

## 🌍 Configuration par Environnement

### **1. Développement Local**

#### **Fichier `.env` (non committé):**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:8080
VITE_ENABLE_DEBUG=true
```

#### **Chargement:**
```typescript
// Vite charge automatiquement .env
const url = import.meta.env.VITE_SUPABASE_URL;
```

---

### **2. GitHub Actions (CI/CD)**

#### **Secrets GitHub:**
```
Repository → Settings → Secrets and variables → Actions
```

**Secrets à configurer:**
| Secret Name | Description | Exemple |
|-------------|-------------|---------|
| `SUPABASE_URL` | URL projet | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Clé publique | `eyJhbGci...` |
| `HOSTINGER_FTP_PASSWORD` | Mot de passe FTP | `P@ssw0rd123` |

#### **Utilisation dans Workflows:**
```yaml
env:
  VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

### **3. Hostinger (Production)**

#### **Option A: Variables d'Environnement (si supporté)**
```
hPanel → Advanced → Environment Variables
```

#### **Option B: Fichier .env sur serveur**
```bash
# Via FTP/SSH, créer /public_html/.env
# ⚠️ S'assurer qu'il n'est PAS accessible publiquement

# .htaccess protection
<Files ".env">
  Order allow,deny
  Deny from all
</Files>
```

#### **Option C: Hardcoder dans le build (NON RECOMMANDÉ)**
```bash
# Seulement pour Anon Key et URLs publiques
VITE_SUPABASE_URL=https://xxx.supabase.co npm run build
```

---

### **4. Vercel/Netlify (Alternative)**

#### **Dashboard:**
```
Project Settings → Environment Variables
```

**Variables par environnement:**
- Production
- Preview (branches)
- Development

---

## 🔍 Gitleaks et Détection

### **Configuration `.gitleaks.toml`**

```toml
title = "Gitleaks Configuration for Wadashaqeen"

[extend]
useDefault = true

# Patterns supplémentaires à détecter
[[rules]]
id = "supabase-service-role-key"
description = "Supabase Service Role Key"
regex = '''eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6'''
tags = ["key", "supabase"]

[[rules]]
id = "resend-api-key"
description = "Resend API Key"
regex = '''re_[a-zA-Z0-9]{32}'''
tags = ["key", "api", "resend"]

[[rules]]
id = "hostinger-ftp-password"
description = "Potential FTP Password in code"
regex = '''(ftp|FTP).*password.*[=:]["']([^"']+)["']'''
tags = ["password", "ftp"]

# Allowlist - Fichiers à ignorer
[allowlist]
paths = [
  '''.env.example''',
  '''README.md''',
  '''.*_GUIDE.md''',
]

# Patterns à ignorer (faux positifs)
regexes = [
  '''example.*secret''',
  '''your.*key.*here''',
  '''xxx+''',
]
```

---

### **Scan Manuel:**

```bash
# Installer Gitleaks
brew install gitleaks  # macOS
# ou télécharger depuis: https://github.com/gitleaks/gitleaks

# Scanner le repo actuel
gitleaks detect --source . --verbose

# Scanner l'historique Git
gitleaks detect --source . --log-opts="--all" --verbose

# Générer un rapport
gitleaks detect --source . --report-format json --report-path gitleaks-report.json
```

---

### **GitHub Actions (Automatique):**

Le workflow `security.yml` exécute Gitleaks automatiquement:
```yaml
- name: 🔍 Run Gitleaks
  uses: gitleaks/gitleaks-action@v2
```

---

## ✅ Checklist de Sécurité

### **Avant Chaque Commit:**
- [ ] ✅ Vérifier qu'aucun fichier `.env` n'est ajouté
- [ ] ✅ Rechercher `password`, `secret`, `key` dans les diffs
- [ ] ✅ Pas de tokens hardcodés dans le code
- [ ] ✅ URLs sensibles remplacées par variables d'env

### **Configuration Repository:**
- [ ] ✅ `.env` dans `.gitignore`
- [ ] ✅ `.env.example` créé avec placeholders
- [ ] ✅ Gitleaks configuré (`.gitleaks.toml`)
- [ ] ✅ Pre-commit hooks actifs (Husky)
- [ ] ✅ GitHub Actions scan secrets

### **Documentation Équipe:**
- [ ] ✅ Guide de configuration `.env` partagé (interne)
- [ ] ✅ Liste des secrets requis documentée
- [ ] ✅ Procédure de rotation des secrets définie
- [ ] ✅ Responsables secrets identifiés

### **Environnements:**
- [ ] ✅ Secrets dev différents de prod
- [ ] ✅ Service Role Key JAMAIS côté frontend
- [ ] ✅ Anon Key Supabase avec RLS activé
- [ ] ✅ GitHub Secrets configurés
- [ ] ✅ Hostinger secrets sécurisés

---

## 🚨 Que Faire en Cas d'Exposition

### **1. Secret Committé par Erreur**

#### **Option A: Commit récent (pas encore pushé)**
```bash
# Modifier le dernier commit
git reset HEAD~1
# Retirer le fichier sensible
git add .gitignore
echo ".env" >> .gitignore
git commit --amend
```

#### **Option B: Déjà pushé (repository public)**
```bash
# 1. RÉVOQUER IMMÉDIATEMENT le secret exposé
#    - Supabase: Dashboard → Settings → API → Reset Key
#    - Autres services: Régénérer la clé/token

# 2. Nettoyer l'historique avec BFG
./clean-git-history.sh

# 3. Force push (coordonner avec l'équipe)
git push --force origin main

# 4. Notifier l'équipe de pull --rebase
```

---

### **2. Secret Détecté par Gitleaks**

```bash
# Lire le rapport
cat gitleaks-report.json | jq '.[0]'

# Identifier le fichier et la ligne
# Commit: abc123
# File: src/config.ts
# Line: 42

# Corriger et re-commit
```

---

### **3. Secret Exposé Publiquement**

#### **Procédure d'Urgence:**
1. **Révoquer immédiatement** (dans les 5 minutes)
2. **Générer nouveau secret**
3. **Mettre à jour tous les environnements**
4. **Auditer les accès** (qui a pu utiliser le secret)
5. **Documenter l'incident**
6. **Revue post-mortem** (comment éviter à l'avenir)

---

## 📊 Outils de Monitoring

### **1. GitHub Secret Scanning**
```
Repository → Settings → Security → Secret scanning
```
**Activé automatiquement** pour les repos publics

### **2. GitGuardian (Optionnel)**
```
https://www.gitguardian.com/
```
Monitoring 24/7 des secrets exposés

### **3. Rotation Automatique**
```bash
# Script cron pour rotation mensuelle
# cron: 0 0 1 * * /usr/local/bin/rotate-secrets.sh

#!/bin/bash
# rotate-secrets.sh
echo "🔄 Rotating secrets..."
# Appeler APIs pour régénérer
# Supabase, Resend, etc.
```

---

## 📚 Ressources

### **Documentation Officielle:**
- [Supabase Security](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Gitleaks](https://github.com/gitleaks/gitleaks)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

### **Outils:**
- [Gitleaks](https://github.com/gitleaks/gitleaks) - Détection secrets
- [git-secrets](https://github.com/awslabs/git-secrets) - AWS secrets
- [trufflehog](https://github.com/trufflesecurity/trufflehog) - Scanner historique
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) - Nettoyer historique

### **Standards:**
- [12 Factor App - Config](https://12factor.net/config)
- [NIST Secrets Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)

---

**📅 Dernière Mise à Jour:** 7 novembre 2025  
**👤 Auteur:** Security Team Wadashaqeen  
**🔖 Version:** 1.0  
**✅ Status:** Production Ready

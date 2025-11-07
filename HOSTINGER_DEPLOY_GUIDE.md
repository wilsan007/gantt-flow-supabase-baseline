# 🚀 Guide Déploiement Automatique Hostinger

## 📋 Vue d'ensemble

Ce guide explique comment configurer le déploiement automatique vers Hostinger après chaque push sur la branche `main`.

---

## ✅ Prérequis

1. **Compte Hostinger actif**
2. **Accès FTP Hostinger**
3. **Dépôt GitHub avec accès admin**

---

## 🔐 Étape 1: Récupérer les Informations FTP Hostinger

### 1.1 Se connecter à Hostinger

1. Allez sur [https://hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Connectez-vous avec vos identifiants
3. Cliquez sur votre hébergement

### 1.2 Obtenir les Credentials FTP

1. Dans le panneau, allez dans **"Fichiers" → "Gestionnaire de fichiers"**
2. Ou allez dans **"Avancé" → "Comptes FTP"**
3. Notez les informations suivantes:

```
FTP Server: ftp.votre-domaine.com (ou IP type: 000.000.000.000)
FTP Username: u123456789 (ou votre-email@domaine.com)
FTP Password: votre-mot-de-passe-ftp
Remote Directory: /public_html (ou /domains/votre-domaine.com/public_html)
```

**⚠️ Important:** 
- Le **Remote Directory** est généralement `/public_html` ou `/domains/votre-domaine.com/public_html`
- Si vous avez plusieurs domaines, choisissez le bon dossier

---

## 🔑 Étape 2: Configurer les Secrets GitHub

### 2.1 Accéder aux Secrets

1. Allez sur votre dépôt GitHub
2. Cliquez sur **"Settings"** (en haut à droite)
3. Dans le menu latéral gauche, cliquez sur **"Secrets and variables" → "Actions"**
4. Cliquez sur **"New repository secret"**

### 2.2 Créer les 4 Secrets

Créez ces 4 secrets un par un:

#### Secret 1: `FTP_SERVER`
```
Name: FTP_SERVER
Value: ftp.votre-domaine.com
```
**Exemple:** `ftp.ganttflow.com` ou `154.12.45.78`

#### Secret 2: `FTP_USERNAME`
```
Name: FTP_USERNAME
Value: u123456789
```
**Exemple:** `u123456789` ou `votre-email@domaine.com`

#### Secret 3: `FTP_PASSWORD`
```
Name: FTP_PASSWORD
Value: votre-mot-de-passe-ftp-tres-securise
```
**⚠️ Important:** Gardez ce mot de passe confidentiel!

#### Secret 4: `FTP_REMOTE_DIR`
```
Name: FTP_REMOTE_DIR
Value: /public_html/
```
**⚠️ Attention:** 
- Le slash final `/` est important: `/public_html/`
- Si sous-dossier: `/public_html/app/` ou `/domains/domaine.com/public_html/`

---

## ✅ Étape 3: Vérifier la Configuration

### 3.1 Secrets Configurés

Vous devriez voir vos 4 secrets dans GitHub:

```
✅ FTP_SERVER         Updated 1 minute ago
✅ FTP_USERNAME       Updated 1 minute ago
✅ FTP_PASSWORD       Updated 1 minute ago
✅ FTP_REMOTE_DIR     Updated 1 minute ago
```

### 3.2 Structure du Dépôt

Votre dépôt doit avoir cette structure:

```
📁 .github/
  📁 workflows/
    📄 deploy-to-hostinger.yml  ✅ (Nouveau workflow)
📄 package.json
📄 vite.config.ts
📄 HOSTINGER_DEPLOY_GUIDE.md  ✅ (Ce fichier)
```

---

## 🚀 Étape 4: Tester le Déploiement

### 4.1 Déploiement Automatique (Push)

1. Faites un changement dans votre code
2. Committez et pushez vers `main`:
   ```bash
   git add .
   git commit -m "test: Déclenchement déploiement Hostinger"
   git push origin main
   ```
3. Le workflow se déclenche automatiquement!

### 4.2 Déploiement Manuel

Vous pouvez aussi déclencher manuellement:

1. Allez sur GitHub → **"Actions"**
2. Cliquez sur **"🚀 Deploy to Hostinger"** dans la liste
3. Cliquez sur **"Run workflow"** → **"Run workflow"**

---

## 📊 Étape 5: Surveiller le Déploiement

### 5.1 Voir les Logs

1. Allez sur GitHub → **"Actions"**
2. Cliquez sur le dernier workflow en cours
3. Vous verrez les étapes en temps réel:
   - ✅ Checkout Code
   - ✅ Setup Node.js
   - ✅ Install Dependencies
   - ✅ Build Application
   - ✅ Deploy to Hostinger
   - ✅ Deployment Summary

### 5.2 Temps de Déploiement

- **Build:** 1-3 minutes
- **Upload FTP:** 1-2 minutes
- **Total:** ~3-5 minutes

---

## 🎯 Workflow Détaillé

Le workflow effectue ces étapes:

```
1️⃣ Checkout du code depuis GitHub
2️⃣ Installation de Node.js 20.x
3️⃣ Installation des dépendances (npm ci)
4️⃣ Build de l'application (npm run build)
5️⃣ Vérification du dossier dist/
6️⃣ Upload via FTP vers Hostinger
7️⃣ Résumé du déploiement
```

---

## 🔍 Résolution des Problèmes

### Erreur: "Authentication failed"

**Cause:** Credentials FTP incorrects

**Solution:**
1. Vérifiez `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` dans GitHub Secrets
2. Testez les credentials avec un client FTP (FileZilla)
3. Vérifiez que le compte FTP est actif dans Hostinger

### Erreur: "Cannot change directory"

**Cause:** `FTP_REMOTE_DIR` incorrect

**Solution:**
1. Vérifiez le chemin exact sur Hostinger
2. Essayez: `/public_html/` ou `/domains/votre-domaine.com/public_html/`
3. Assurez-vous du slash final `/`

### Erreur: "Build failed"

**Cause:** Erreur dans le code TypeScript/React

**Solution:**
1. Testez le build localement: `npm run build`
2. Corrigez les erreurs TypeScript
3. Re-pushez le code

### Erreur: "npm ci failed"

**Cause:** Problème de dépendances

**Solution:**
1. Vérifiez que `package-lock.json` est committé
2. Testez localement: `rm -rf node_modules && npm install`
3. Committez et pushez le nouveau `package-lock.json`

---

## 📁 Structure des Fichiers sur Hostinger

Après déploiement, votre site sera structuré ainsi:

```
/public_html/
  📄 index.html           (Point d'entrée)
  📁 assets/
    📄 index-abc123.js    (JavaScript bundle)
    📄 index-def456.css   (CSS bundle)
  📄 vite.svg
  📄 favicon.ico
```

---

## 🌐 Accès au Site

Après un déploiement réussi:

1. **Votre site est en ligne:**
   ```
   https://votre-domaine.com
   ```

2. **Temps de propagation:**
   - Cache Hostinger: ~5 minutes
   - DNS: 0 minutes (si domaine déjà configuré)

3. **Forcer le rafraîchissement:**
   - Ctrl + Shift + R (Chrome/Firefox)
   - Cmd + Shift + R (Mac)

---

## 🔒 Sécurité

### Bonnes Pratiques

✅ **Ne jamais committer les secrets dans le code**
✅ **Utiliser uniquement GitHub Secrets**
✅ **Changer régulièrement le mot de passe FTP**
✅ **Activer la 2FA sur GitHub**
✅ **Limiter l'accès FTP à une IP si possible**

### Secrets à NE JAMAIS Committer

```
❌ FTP_PASSWORD
❌ SUPABASE_ANON_KEY (si dans .env)
❌ SUPABASE_SERVICE_ROLE_KEY
❌ Tout autre credential
```

---

## 📝 Checklist de Vérification

Avant le premier déploiement:

- [ ] ✅ Compte Hostinger actif
- [ ] ✅ Credentials FTP récupérés
- [ ] ✅ 4 secrets GitHub configurés
- [ ] ✅ Workflow `deploy-to-hostinger.yml` présent
- [ ] ✅ Build local réussi (`npm run build`)
- [ ] ✅ Test FTP avec FileZilla (optionnel mais recommandé)

---

## 🎉 Résultat Final

Après configuration complète:

```
✅ Push sur main → Déploiement automatique
✅ Build réussi en ~2-3 minutes
✅ Upload FTP automatique
✅ Site mis à jour sur Hostinger
✅ Logs détaillés dans GitHub Actions
```

---

## 📞 Support

### Problèmes Hostinger
- **Support Hostinger:** https://www.hostinger.com/support
- **Live Chat:** Disponible 24/7 dans hPanel

### Problèmes GitHub Actions
- **Documentation:** https://docs.github.com/en/actions
- **Community:** https://github.community

### Problèmes Application
- **Issues GitHub:** Créer une issue dans le dépôt
- **Pull Requests:** Pour proposer des corrections

---

## 🔄 Mises à Jour

Ce workflow se met à jour automatiquement quand vous modifiez:
- `.github/workflows/deploy-to-hostinger.yml`

Pour changer le comportement du déploiement, modifiez ce fichier.

---

## ✨ Félicitations!

Votre application est maintenant déployée automatiquement sur Hostinger! 🎉

Chaque push sur `main` déclenche un nouveau déploiement.

---

**Dernière mise à jour:** 8 Novembre 2024  
**Version:** 1.0.0

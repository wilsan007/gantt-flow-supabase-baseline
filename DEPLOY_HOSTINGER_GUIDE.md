# 🚀 Guide Complet: Déploiement Automatique vers Hostinger

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Configuration des Secrets GitHub](#configuration-des-secrets-github)
4. [Configuration Hostinger](#configuration-hostinger)
5. [Test du Déploiement](#test-du-déploiement)
6. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

### **Workflow Automatique**
```
Push vers GitHub (main)
         ↓
    Tests (Vitest)
         ↓
    Lint (ESLint)
         ↓
    Build (Vite)
         ↓
  Upload Artifact
         ↓
Deploy FTP Hostinger
         ↓
   Site en Ligne! 🎉
```

### **Temps Total:** ~5-8 minutes par déploiement

---

## ✅ Prérequis

### **1. Compte Hostinger**
- ✅ Compte actif avec hébergement web
- ✅ Accès FTP activé
- ✅ Domaine configuré (optionnel)

### **2. Repository GitHub**
- ✅ Repository: `wilsan007/gantt-flow-supabase-baseline`
- ✅ Branch principale: `main`
- ✅ Accès administrateur pour configurer secrets

### **3. Fichiers Nécessaires**
- ✅ `.github/workflows/deploy-hostinger.yml` (créé)
- ✅ `vite.config.ts` avec configuration build
- ✅ `.gitignore` avec exclusions appropriées

---

## 🔐 Configuration des Secrets GitHub

### **Étape 1: Récupérer les Informations FTP Hostinger**

1. **Connectez-vous à votre compte Hostinger:**
   - URL: https://hpanel.hostinger.com

2. **Accédez aux détails FTP:**
   - Dashboard → Hosting → Gérer
   - Section "Comptes FTP"
   - Cliquez sur "Détails" ou créez un nouveau compte FTP

3. **Notez les informations suivantes:**
   ```
   Serveur FTP:  ftp.votre-domaine.com (ou IP)
   Nom d'utilisateur:  u123456789
   Port:  21 (FTP) ou 22 (SFTP)
   Chemin du site:  /public_html ou /domains/votre-domaine.com/public_html
   ```

### **Étape 2: Ajouter les Secrets dans GitHub**

1. **Ouvrez votre repository GitHub:**
   ```
   https://github.com/wilsan007/gantt-flow-supabase-baseline
   ```

2. **Accédez aux Settings:**
   - Cliquez sur "Settings" (en haut)
   - Sidebar gauche → "Secrets and variables" → "Actions"

3. **Ajoutez les 4 secrets requis:**

   #### **Secret 1: HOSTINGER_FTP_SERVER**
   ```
   Name: HOSTINGER_FTP_SERVER
   Value: ftp.votre-domaine.com
   ```
   - Exemple: `ftp.ganttflow.com` ou `155.138.xxx.xxx`

   #### **Secret 2: HOSTINGER_FTP_USERNAME**
   ```
   Name: HOSTINGER_FTP_USERNAME
   Value: u123456789
   ```
   - Utilisez le nom d'utilisateur FTP fourni par Hostinger

   #### **Secret 3: HOSTINGER_FTP_PASSWORD**
   ```
   Name: HOSTINGER_FTP_PASSWORD
   Value: VotreMotDePasseFTP123!
   ```
   - ⚠️ **IMPORTANT:** Ne partagez JAMAIS ce mot de passe

   #### **Secret 4: HOSTINGER_FTP_PATH**
   ```
   Name: HOSTINGER_FTP_PATH
   Value: /public_html/
   ```
   - Options courantes:
     - `/public_html/` (domaine principal)
     - `/domains/votre-domaine.com/public_html/` (sous-domaine)
     - `/public_html/app/` (sous-dossier)

4. **Vérifiez les secrets:**
   - Vous devriez voir 4 secrets listés
   - Les valeurs sont masquées (••••••••)

---

## 🛠️ Configuration Hostinger

### **1. Préparer le Dossier de Déploiement**

**Option A: Via Hostinger File Manager**
1. Connectez-vous à hPanel
2. Ouvrez "File Manager"
3. Naviguez vers `/public_html`
4. Créez un dossier `app` (optionnel)
5. Assurez-vous que les permissions sont correctes (755)

**Option B: Via FTP Client (FileZilla)**
1. Téléchargez FileZilla: https://filezilla-project.org/
2. Connectez-vous avec vos identifiants FTP
3. Créez la structure de dossiers souhaitée

### **2. Configurer le Fichier .htaccess**

Créez un fichier `.htaccess` dans le dossier de déploiement:

```apache
# Wadashaqeen SaaS - Configuration Apache

# Activer RewriteEngine pour React Router
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Rediriger toutes les requêtes vers index.html (sauf fichiers existants)
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Compression GZIP
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
  AddOutputFilterByType DEFLATE application/javascript application/json
</IfModule>

# Cache des fichiers statiques
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Sécurité
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

### **3. Vérifier la Configuration PHP (si nécessaire)**

Si vous utilisez des fonctionnalités PHP côté serveur:
1. Hostinger → Dashboard → PHP Configuration
2. Version PHP: 8.0 ou supérieure
3. Extensions activées: json, curl, mbstring

---

## 🚀 Test du Déploiement

### **Test 1: Déploiement Manuel**

1. **Déclenchez le workflow manuellement:**
   ```
   GitHub → Actions → "Deploy to Hostinger" → "Run workflow"
   ```

2. **Surveillez l'exécution:**
   - Ouvrez le workflow en cours
   - Vérifiez chaque étape (Tests, Build, Deploy)
   - Temps estimé: 5-8 minutes

3. **Vérifiez les logs:**
   ```
   ✅ Tests passed
   ✅ Build successful
   ✅ FTP upload complete
   ```

### **Test 2: Déploiement Automatique**

1. **Faites une petite modification:**
   ```bash
   # Éditez README.md ou un fichier de documentation
   git add README.md
   git commit -m "test: Vérification déploiement automatique"
   git push origin main
   ```

2. **Le workflow devrait se déclencher automatiquement:**
   - GitHub → Actions → Nouveau workflow en cours
   - Surveillez l'exécution complète

3. **Vérifiez votre site:**
   ```
   https://votre-domaine.com
   ```

### **Test 3: Vérification Manuelle FTP**

1. **Connectez-vous via FTP**
2. **Vérifiez la structure:**
   ```
   /public_html/
   ├── index.html
   ├── assets/
   │   ├── index-[hash].js
   │   └── index-[hash].css
   ├── favicon.ico
   └── .htaccess
   ```

3. **Vérifiez les timestamps:**
   - Les fichiers doivent avoir la date/heure du dernier déploiement

---

## 🔍 Dépannage

### **Problème 1: "FTP Connection Failed"**

**Cause:** Identifiants FTP incorrects ou serveur inaccessible

**Solution:**
```bash
# Testez la connexion FTP manuellement
ftp ftp.votre-domaine.com
# Entrez username et password

# Si échec, vérifiez:
1. Serveur FTP correct (ftp.domaine.com vs IP)
2. Username exact (u123456789)
3. Password sans espaces
4. Firewall Hostinger (parfois bloque GitHub IPs)
```

**Alternative:** Utiliser SFTP (port 22) au lieu de FTP (port 21)

### **Problème 2: "Tests Failed"**

**Cause:** Tests échouent et bloquent le déploiement

**Solution:**
```bash
# Localement, corrigez les tests
npm run test

# Option temporaire: Allow tests to fail
# Dans deploy-hostinger.yml, ligne "Run Tests":
continue-on-error: true  # ⚠️ Seulement en dev!
```

### **Problème 3: "Build Artifact Not Found"**

**Cause:** Le build a échoué ou le dossier dist/ est vide

**Solution:**
```bash
# Vérifiez le build localement
npm run build
ls -la dist/

# Vérifiez vite.config.ts:
export default defineConfig({
  build: {
    outDir: 'dist',  # ← Doit correspondre
  }
})
```

### **Problème 4: "Site 404 ou Blank Page"**

**Cause:** Fichiers déployés mais React Router ne fonctionne pas

**Solution:**
1. **Vérifiez le fichier .htaccess** (voir section Configuration)
2. **Vérifiez le chemin de base dans vite.config.ts:**
   ```typescript
   export default defineConfig({
     base: '/',  // ou '/app/' si sous-dossier
   })
   ```
3. **Videz le cache du navigateur:** Ctrl+Shift+R

### **Problème 5: "Secrets Not Found"**

**Erreur:**
```
Error: Secret HOSTINGER_FTP_SERVER not found
```

**Solution:**
1. GitHub → Settings → Secrets and variables → Actions
2. Vérifiez que les 4 secrets existent:
   - HOSTINGER_FTP_SERVER
   - HOSTINGER_FTP_USERNAME
   - HOSTINGER_FTP_PASSWORD
   - HOSTINGER_FTP_PATH
3. Les noms doivent correspondre EXACTEMENT (case-sensitive)

---

## 📊 Monitoring et Optimisation

### **1. Vérifier les Déploiements**

**GitHub Actions History:**
```
GitHub → Actions → Filtre par "Deploy to Hostinger"
```

Vous verrez:
- ✅ Déploiements réussis (vert)
- ❌ Déploiements échoués (rouge)
- 🟡 Déploiements en cours (jaune)

### **2. Métriques de Performance**

**Temps de déploiement typique:**
```
Tests:     1-2 minutes
Build:     2-3 minutes
Upload:    1-2 minutes
Total:     5-8 minutes
```

**Optimisations possibles:**
- Activer le cache npm (déjà fait)
- Réduire la taille du build (tree-shaking)
- Utiliser SFTP au lieu de FTP (plus rapide)

### **3. Notifications**

**Ajouter Slack/Discord/Email:**
```yaml
# À la fin de deploy-hostinger.yml
- name: 📧 Notify Team
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🎯 Checklist de Production

### **Avant le Premier Déploiement:**
- [ ] Secrets GitHub configurés (4 secrets)
- [ ] Compte FTP Hostinger vérifié
- [ ] Dossier de déploiement créé
- [ ] Fichier .htaccess configuré
- [ ] Tests locaux passent (npm run test)
- [ ] Build local réussi (npm run build)

### **Après le Premier Déploiement:**
- [ ] Site accessible via navigateur
- [ ] React Router fonctionne (navigation)
- [ ] Assets chargés (CSS, JS, images)
- [ ] Pas d'erreurs console
- [ ] Responsive sur mobile

### **Maintenance Continue:**
- [ ] Monitorer les déploiements (GitHub Actions)
- [ ] Vérifier les logs FTP
- [ ] Tester régulièrement le site
- [ ] Mettre à jour les dépendances
- [ ] Sauvegarder les secrets

---

## 📚 Ressources

### **Documentation Officielle:**
- [GitHub Actions](https://docs.github.com/en/actions)
- [FTP Deploy Action](https://github.com/SamKirkland/FTP-Deploy-Action)
- [Hostinger Help Center](https://support.hostinger.com/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

### **Tutoriels Complémentaires:**
- [Configurer FTP sur Hostinger](https://support.hostinger.com/en/articles/1583217-how-to-use-ftp)
- [React Router avec Apache](https://create-react-app.dev/docs/deployment/#apache)
- [Optimiser Vite Build](https://vitejs.dev/guide/build.html#build-optimizations)

### **Support:**
- **Hostinger:** Live chat 24/7 sur hPanel
- **GitHub:** https://github.com/contact
- **Communauté:** Stack Overflow, Reddit r/webdev

---

## ✨ Résumé

### **Ce que vous avez maintenant:**
✅ **Workflow automatique** complet  
✅ **Tests avant déploiement** (sécurité)  
✅ **Build optimisé** (performance)  
✅ **Déploiement FTP** vers Hostinger  
✅ **Notifications** de succès/échec  

### **Ce qui se passe à chaque push:**
1. 🧪 Tests automatiques
2. 🏗️ Build de production
3. 📤 Upload vers Hostinger
4. 🌐 Site mis à jour automatiquement

### **Temps gagné:**
- ❌ Avant: Build manuel + FTP manuel = 15-20 min
- ✅ Maintenant: Push Git = 5-8 min (automatique)

---

**📅 Créé:** 7 novembre 2025  
**👤 Auteur:** DevOps Team Wadashaqeen  
**🔖 Version:** 1.0  
**✅ Status:** Production Ready

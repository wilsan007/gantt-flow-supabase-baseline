# 🚀 Déploiement Automatique GitHub Actions → Hostinger

## ✅ Configuration Complète

### **Workflow créé** : `.github/workflows/deploy-hostinger.yml`

Ce workflow déploie automatiquement vers Hostinger à chaque push sur `main`.

---

## 🔐 Configuration des Secrets GitHub

### **Étape 1 : Accéder aux Secrets**

1. Allez sur votre repo GitHub : https://github.com/wilsan007/gantt-flow-supabase-baseline
2. **Settings** → **Secrets and variables** → **Actions**
3. Cliquez **"New repository secret"**

### **Étape 2 : Ajouter les Secrets**

Créez ces 6 secrets :

#### **1. FTP_SERVER**

```
ftp.wadashaqayn.org
```

ou

```
wadashaqayn.org
```

(Selon configuration Hostinger)

#### **2. FTP_USERNAME**

```
votre-username-ftp@wadashaqayn.org
```

(Le username FTP fourni par Hostinger)

#### **3. FTP_PASSWORD**

```
votre-mot-de-passe-ftp
```

(Le mot de passe FTP Hostinger)

#### **4. VITE_SUPABASE_URL**

```
https://qliinxtanjdnwxlvnxji.supabase.co
```

#### **5. VITE_SUPABASE_ANON_KEY**

```
votre-anon-key-supabase
```

(Trouvez-la dans Supabase Dashboard → Settings → API)

#### **6. VITE_APP_URL**

```
https://wadashaqayn.org
```

---

## 📋 Checklist Configuration

- [ ] Secrets GitHub configurés (6 secrets)
- [ ] Workflow file commit et push
- [ ] Repository GitHub à jour
- [ ] Accès FTP Hostinger actif
- [ ] Dossier `/public_html/` existe sur Hostinger

---

## 🎯 Comment Déployer

### **Déploiement Automatique**

```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
```

Le déploiement démarre automatiquement ! ⚡

### **Déploiement Manuel**

1. Allez sur GitHub → **Actions**
2. Sélectionnez **"🚀 Deploy to Hostinger"**
3. Cliquez **"Run workflow"**
4. Sélectionnez branch `main`
5. Cliquez **"Run workflow"**

---

## 📊 Surveillance du Déploiement

### **Voir les Logs**

1. GitHub → **Actions**
2. Cliquez sur le workflow en cours
3. Suivez les étapes en temps réel :
   - 📥 Checkout code
   - 📦 Setup Node.js
   - 📚 Install dependencies (avec cache)
   - 🔨 Build application (22 secondes)
   - 📤 Deploy to Hostinger via FTP
   - ✅ Deployment complete

### **Durée Totale Estimée**

- Install dependencies (première fois) : ~2 min
- Install dependencies (avec cache) : ~30 sec
- Build : ~22 sec
- Upload FTP : ~1-3 min (selon taille)

**Total** : 3-5 minutes ⚡

---

## 🛡️ Sécurité

### **✅ Bonnes Pratiques**

- Secrets stockés de manière sécurisée dans GitHub
- Jamais de credentials dans le code
- Build optimisé (esbuild, pas de sourcemaps)
- Exclusion automatique des fichiers sensibles

### **📁 Fichiers Exclus du Déploiement**

- `.git*`
- `node_modules/`
- `.env*`
- Fichiers de développement

---

## 🔧 Troubleshooting

### **Problème : Workflow échoue au build**

**Erreur** : `npm ci` échoue

**Solution** :

```bash
# Localement
rm -rf node_modules package-lock.json
npm install
npm run build
git add package-lock.json
git commit -m "fix: update package-lock"
git push
```

### **Problème : FTP Connection Failed**

**Erreur** : `Error: FTP connection failed`

**Solutions** :

1. Vérifiez `FTP_SERVER` (pas de `ftp://` au début)
2. Vérifiez `FTP_USERNAME` et `FTP_PASSWORD`
3. Testez FTP localement avec FileZilla
4. Contactez support Hostinger si problème persiste

### **Problème : Permission Denied**

**Erreur** : `550 Permission denied`

**Solution** :

- Vérifiez que `/public_html/` existe
- Changez `server-dir` si nécessaire :
  ```yaml
  server-dir: /
  ```

### **Problème : Site ne se met pas à jour**

**Solutions** :

1. Videz le cache navigateur (`Ctrl + Shift + Delete`)
2. Vérifiez les logs GitHub Actions
3. Vérifiez les fichiers sur Hostinger via FTP/File Manager
4. Vérifiez le fichier `.htaccess` sur Hostinger

---

## 📁 Structure de Déploiement

### **Avant Déploiement (Local)**

```
gantt-flow-next/
├── dist/               ← Dossier build
│   ├── index.html
│   ├── assets/
│   └── ...
```

### **Après Déploiement (Hostinger)**

```
/public_html/
├── index.html          ← Page principale
├── assets/             ← CSS, JS, images
│   ├── index-xxx.css
│   ├── index-xxx.js
│   └── ...
└── .htaccess           ← Configuration serveur (créer si absent)
```

---

## 🌐 Fichier .htaccess Recommandé

Créez `/public_html/.htaccess` sur Hostinger avec ce contenu :

```apache
# Activer la réécriture d'URL pour SPA
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Compression GZIP
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>

# Cache navigateur
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Sécurité
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

---

## ✅ Vérification Finale

### **Après Premier Déploiement**

1. ✅ Allez sur https://wadashaqayn.org
2. ✅ La landing page s'affiche
3. ✅ Testez la connexion Google OAuth
4. ✅ Testez la navigation (routes SPA)
5. ✅ Vérifiez la console (pas d'erreurs)

---

## 🎉 Déploiement Réussi !

Une fois configuré, chaque `git push` déploie automatiquement en **3-5 minutes** ! 🚀

**Site en ligne** : https://wadashaqayn.org

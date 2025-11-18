# 🚀 Instructions de Déploiement sur Hostinger

## ✅ Statut : Prêt au déploiement

Votre projet SaaS Wadashaqayn est **100% prêt** à être déployé sur Hostinger \!

---

## 📦 Fichiers Préparés

### 1️⃣ Dossier : `wadashaqayn_deploy_ready/`

- **Emplacement** : `/home/awaleh/Bureau/Wadashaqayn-SaaS/gantt-flow-next/wadashaqayn_deploy_ready/`
- **Contenu** :
  ```
  wadashaqayn_deploy_ready/
  ├── index.html          (1.0 KB)
  ├── .htaccess          (904 B) ✅ Configuration Apache
  ├── favicon.ico        (7.5 KB)
  ├── placeholder.svg    (3.2 KB)
  ├── robots.txt         (160 B)
  └── assets/
      ├── index-Cq8lxsR2.css   (107 KB)
      └── index-Fx5EZ_lQ.js    (1.4 MB)
  ```

### 2️⃣ Archive ZIP : `wadashaqayn_build_ready.zip`

- **Emplacement** : `/home/awaleh/Bureau/Wadashaqayn-SaaS/gantt-flow-next/wadashaqayn_build_ready.zip`
- **Taille** : 409 KB (compressé)
- **Contenu** : Tous les fichiers du dossier ci-dessus

---

## 🎯 Déploiement sur Hostinger (Étapes)

### Option A : Upload via File Manager (Recommandé)

1. **Connexion à Hostinger**
   - Connectez-vous à votre compte Hostinger
   - Allez dans **hPanel** → **File Manager**

2. **Navigation vers public_html**
   - Ouvrez le dossier `/public_html/`
   - ⚠️ **SAUVEGARDEZ** vos fichiers actuels si nécessaire

3. **Nettoyage (Important \!)**
   - Supprimez tous les fichiers existants dans `/public_html/`
   - Gardez uniquement `.htaccess` système si présent (backup avant)

4. **Upload des fichiers**

   **Méthode 1 : Upload du ZIP** (Plus rapide)
   - Cliquez sur **Upload** dans File Manager
   - Sélectionnez `wadashaqayn_build_ready.zip`
   - Une fois uploadé, faites **clic droit** → **Extract**
   - Les fichiers seront extraits dans `/public_html/`

   **Méthode 2 : Upload direct des fichiers**
   - Ouvrez le dossier `wadashaqayn_deploy_ready/` sur votre ordinateur
   - Sélectionnez TOUS les fichiers (y compris `.htaccess`)
   - Glissez-déposez dans le File Manager Hostinger
   - Ou utilisez le bouton **Upload** → Sélectionnez tous les fichiers

5. **Vérification finale**
   - Dans `/public_html/`, vous devez voir :
     ```
     ✅ index.html
     ✅ .htaccess
     ✅ favicon.ico
     ✅ placeholder.svg
     ✅ robots.txt
     ✅ dossier assets/
     ```

6. **Test en ligne**
   - Ouvrez votre navigateur
   - Allez sur `https://wadashaqayn.com`
   - L'application devrait se charger immédiatement
   - Testez la navigation entre les pages (React Router)
   - Testez l'authentification Google OAuth

---

### Option B : Upload via FTP (Alternative)

Si vous préférez utiliser FileZilla ou un client FTP :

1. **Connexion FTP**
   - Host : `ftp.wadashaqayn.com` (ou IP fournie par Hostinger)
   - Username : Votre nom d'utilisateur FTP
   - Password : Votre mot de passe FTP
   - Port : 21 (ou 22 pour SFTP)

2. **Navigation**
   - Allez dans le dossier `/public_html/`

3. **Upload**
   - Uploadez TOUT le contenu de `wadashaqayn_deploy_ready/`
   - Assurez-vous que `.htaccess` est bien transféré (mode Binaire)

---

## 🔧 Configuration du .htaccess

Le fichier `.htaccess` inclus configure automatiquement :

### ✅ Fonctionnalités Activées :

- **React Router** : Toutes les routes redirigent vers `index.html`
- **Cache intelligent** :
  - Assets (JS/CSS/Images) : 1 an de cache
  - `index.html` : Pas de cache (toujours à jour)
- **Sécurité** :
  - Protection XSS
  - Protection Clickjacking
  - Politique de référence stricte

### Contenu du .htaccess :

```apache
# --- Vite React SPA deployment pour Hostinger ---
DirectoryIndex index.html index.php

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ index.html [L]
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  <FilesMatch "\.(js|mjs|css|png|jpg|jpeg|gif|svg|webp|ico|ttf|woff|woff2)$">
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <Files "index.html">
    ExpiresDefault "access plus 0 seconds"
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </Files>
</IfModule>

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

---

## 🧪 Tests Post-Déploiement

Après le déploiement, vérifiez :

1. **Page d'accueil** : `https://wadashaqayn.com`
   - ✅ L'application se charge
   - ✅ Pas d'erreurs dans la console (F12)

2. **Routes React Router** : Testez la navigation
   - ✅ `/dashboard`
   - ✅ `/projects`
   - ✅ `/tasks`
   - ✅ Actualiser la page sur une route → Pas d'erreur 404

3. **Authentification Supabase**
   - ✅ Connexion Google OAuth fonctionne
   - ✅ Redirection après login
   - ✅ Session persistante

4. **Assets**
   - ✅ Images chargées
   - ✅ Styles CSS appliqués
   - ✅ Favicon visible dans l'onglet

5. **Performance**
   - Ouvrez DevTools → Network → Rechargez
   - ✅ Assets servis avec cache (`max-age=31536000`)
   - ✅ `index.html` sans cache (`no-cache`)

---

## 🆘 Dépannage

### Problème 1 : Page blanche

**Cause** : Fichiers non uploadés correctement
**Solution** :

- Vérifiez que `.htaccess` est présent dans `/public_html/`
- Vérifiez que le dossier `assets/` contient bien les fichiers JS/CSS

### Problème 2 : Erreur 404 sur les routes

**Cause** : `.htaccess` non pris en compte
**Solution** :

- Vérifiez que `mod_rewrite` est activé sur Hostinger (normalement activé par défaut)
- Contactez le support Hostinger si nécessaire

### Problème 3 : CSS/JS non chargés

**Cause** : Chemins incorrects ou permissions
**Solution** :

- Vérifiez les permissions des fichiers (644 pour fichiers, 755 pour dossiers)
- Vérifiez dans la console navigateur (F12) les erreurs de chargement

### Problème 4 : OAuth Google ne fonctionne pas

**Cause** : Configuration Supabase
**Solution** :

- Allez dans Supabase Dashboard → Authentication → Settings
- Ajoutez `https://wadashaqayn.com` dans les **Redirect URLs**
- Ajoutez `https://wadashaqayn.com` dans **Site URL**

---

## 📊 Informations Techniques

- **Framework** : React 18 + TypeScript
- **Build Tool** : Vite 5
- **Backend** : Supabase (hébergé séparément)
- **Serveur Web** : Apache (Hostinger)
- **Domaine** : https://wadashaqayn.com
- **Taille totale** : ~1.5 MB (non compressé), 409 KB (ZIP)
- **Temps de chargement estimé** : < 2 secondes

---

## 🎉 C'est Terminé \!

Une fois les fichiers uploadés dans `/public_html/`, votre application sera **immédiatement accessible** sur :

🌐 **https://wadashaqayn.com**

Bonne chance avec votre déploiement \! 🚀

---

**Créé le** : 30 octobre 2025  
**Build version** : Production-ready  
**Support** : En cas de problème, vérifiez d'abord les logs Hostinger (Error Logs dans hPanel)

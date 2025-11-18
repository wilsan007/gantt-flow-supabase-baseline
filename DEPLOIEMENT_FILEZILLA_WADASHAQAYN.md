# 🚀 Guide Complet : Déploiement Manuel via FileZilla vers Hostinger

**Domaine** : wadashaqayn.org  
**Date** : Novembre 2025  
**Dossier à déployer** : `/dist/` (3.2 MB)

---

## 📋 Prérequis

### 1. FileZilla Client

**Télécharger FileZilla** :

```
https://filezilla-project.org/download.php?type=client
```

**Installation** :

- Ubuntu/Linux : `sudo apt install filezilla`
- OU téléchargez depuis le site officiel

### 2. Informations FTP Hostinger

Vous aurez besoin de ces informations (depuis votre panneau Hostinger) :

| Information      | Exemple                     | Où la trouver                 |
| ---------------- | --------------------------- | ----------------------------- |
| **Serveur FTP**  | `ftp.wadashaqayn.org` ou IP | Hostinger → Hébergement → FTP |
| **Utilisateur**  | `u123456789`                | Hostinger → Hébergement → FTP |
| **Mot de passe** | `VotreMotDePasse`           | Hostinger → Hébergement → FTP |
| **Port**         | `21`                        | Standard FTP                  |
| **Répertoire**   | `/public_html/`             | Dossier racine du site        |

---

## 🔧 Étape 1 : Configuration FileZilla

### A. Ouvrir FileZilla

1. Lancez FileZilla Client
2. Vous verrez 4 zones principales :
   - **Haut** : Barre de connexion rapide
   - **Gauche** : Votre ordinateur local
   - **Droite** : Serveur distant (Hostinger)
   - **Bas** : Journal des transferts

### B. Connexion au Serveur Hostinger

#### Option 1 : Connexion Rapide (Recommandée pour test)

Dans la barre en haut de FileZilla :

1. **Hôte** : `ftp.wadashaqayn.org` (ou l'IP Hostinger)
2. **Identifiant** : Votre nom d'utilisateur FTP Hostinger
3. **Mot de passe** : Votre mot de passe FTP Hostinger
4. **Port** : `21`
5. Cliquez sur **"Connexion rapide"**

**Résultat attendu** :

```
Statut: Connexion à ftp.wadashaqayn.org:21...
Statut: Connexion établie, attente du message d'accueil...
Statut: Connecté
Statut: Récupération du contenu du dossier...
Statut: Contenu du dossier "/public_html/" affiché
```

#### Option 2 : Gestionnaire de Sites (Pour sauvegarder la connexion)

1. **Fichier** → **Gestionnaire de sites** (Ctrl+S)
2. Cliquez **"Nouveau site"**
3. Nommez-le : `Hostinger - Wadashaqayn`
4. Configurez :
   - **Protocole** : FTP - File Transfer Protocol
   - **Hôte** : `ftp.wadashaqayn.org`
   - **Port** : `21`
   - **Chiffrement** : Utiliser FTP simple (non sécurisé)
   - **Type d'authentification** : Normale
   - **Identifiant** : Votre user Hostinger
   - **Mot de passe** : Votre password Hostinger
5. Cliquez **"Connexion"**

---

## 📁 Étape 2 : Préparer le Serveur

### A. Nettoyer le Dossier /public_html/ (Important)

Une fois connecté à Hostinger via FileZilla :

1. Dans le **panneau de droite** (serveur distant), naviguez vers `/public_html/`
2. Vous verrez peut-être :

   ```
   public_html/
   ├── index.html          ← Ancien fichier à supprimer
   ├── css/                ← Anciens dossiers à supprimer
   ├── js/                 ← Anciens dossiers à supprimer
   ├── .htaccess          ← Peut être gardé (à vérifier)
   └── cgi-bin/           ← NE PAS TOUCHER
   ```

3. **Sélectionnez TOUS les fichiers SAUF** :
   - `.htaccess` (si vous avez des règles importantes)
   - `cgi-bin/` (dossier système)
   - Autres dossiers système

4. **Clic droit** → **Supprimer**

⚠️ **ATTENTION** : Ne supprimez que les fichiers de l'ancien site web, pas les fichiers système de Hostinger !

### B. Structure Finale Attendue

Après nettoyage, `/public_html/` devrait être vide ou contenir uniquement :

```
public_html/
├── .htaccess          (si existant et nécessaire)
└── cgi-bin/           (dossier système)
```

---

## 📤 Étape 3 : Upload du Build

### A. Localiser le Dossier Local

Dans le **panneau de gauche** (ordinateur local) de FileZilla :

1. Naviguez vers :

   ```
   /home/awaleh/Bureau/Wadashaqayn-SaaS/gantt-flow-next/dist/
   ```

2. Vous devriez voir :
   ```
   dist/
   ├── assets/              (dossier avec JS, CSS)
   ├── index.html           (page principale)
   ├── favicon.ico
   ├── logo-w.svg
   ├── placeholder.svg
   └── robots.txt
   ```

### B. Transférer les Fichiers

**Méthode 1 : Drag & Drop (Recommandée)**

1. Dans le panneau **gauche** (local), entrez dans le dossier `dist/`
2. **Sélectionnez TOUS les fichiers et dossiers** dans `dist/` :
   - `assets/`
   - `index.html`
   - `favicon.ico`
   - `logo-w.svg`
   - `placeholder.svg`
   - `robots.txt`

3. **Glissez-déposez** vers le panneau **droite** (serveur `/public_html/`)

**Méthode 2 : Clic Droit**

1. Sélectionnez tous les fichiers dans `dist/`
2. **Clic droit** → **Envoyer**
3. Les fichiers se transfèrent automatiquement

### C. Vérifier le Transfert

Dans le **panneau du bas** de FileZilla, vous verrez :

```
Transfert de fichier réussi
Statut: Transfert de index.html terminé
Statut: Transfert de assets/index-xxx.js terminé
...
```

**Attendre que tous les fichiers soient transférés** (environ 1-2 minutes pour 3.2 MB).

### D. Vérifier la Structure sur le Serveur

Dans le panneau **droit** (serveur), `/public_html/` devrait maintenant contenir :

```
public_html/
├── assets/                 ← Dossier avec tous les JS/CSS
│   ├── index-CeRxSUww.js
│   ├── index-xxx.css
│   └── ... (autres fichiers)
├── index.html              ← Page principale
├── favicon.ico
├── logo-w.svg
├── placeholder.svg
└── robots.txt
```

✅ **Si vous voyez cette structure, le transfert est réussi !**

---

## 🔧 Étape 4 : Configuration .htaccess (Optionnel mais Recommandé)

### A. Créer ou Modifier .htaccess

Pour éviter les problèmes de cache et améliorer la sécurité :

1. Dans FileZilla, **clic droit** dans `/public_html/` → **Créer un fichier**
2. Nommez-le : `.htaccess`
3. **Clic droit** sur `.htaccess` → **Voir/Éditer**

### B. Contenu du .htaccess

Collez ce contenu :

```apache
# Wadashaqayn.org - Configuration Apache

# ============================================================================
# 1. FORCER HTTPS (SSL)
# ============================================================================
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# ============================================================================
# 2. GESTION DES ROUTES SPA (Single Page Application)
# ============================================================================
# Rediriger toutes les requêtes vers index.html sauf fichiers existants
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# ============================================================================
# 3. CACHE CONTROL (Optimisation Performance)
# ============================================================================
<IfModule mod_expires.c>
  ExpiresActive On

  # Images
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"

  # CSS et JavaScript
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"

  # Fonts
  ExpiresByType font/ttf "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"

  # HTML (pas de cache pour SPA)
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# ============================================================================
# 4. COMPRESSION GZIP
# ============================================================================
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
  AddOutputFilterByType DEFLATE application/javascript application/json
  AddOutputFilterByType DEFLATE application/xml application/xhtml+xml
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# ============================================================================
# 5. SÉCURITÉ
# ============================================================================
# Empêcher l'affichage du contenu des dossiers
Options -Indexes

# Protection contre le clickjacking
Header always set X-Frame-Options "SAMEORIGIN"

# Protection XSS
Header always set X-XSS-Protection "1; mode=block"

# Forcer le type MIME
Header always set X-Content-Type-Options "nosniff"

# ============================================================================
# 6. PAGES D'ERREUR PERSONNALISÉES
# ============================================================================
ErrorDocument 404 /index.html
ErrorDocument 403 /index.html
```

4. **Sauvegardez** et **fermez** l'éditeur
5. FileZilla uploade automatiquement les changements

---

## ✅ Étape 5 : Vérification du Déploiement

### A. Tester le Site

**Ouvrez votre navigateur** et allez sur :

```
https://wadashaqayn.org
```

**Résultat attendu** :

- ✅ Le site s'affiche correctement
- ✅ Le design est bon
- ✅ Les images se chargent
- ✅ Pas d'erreurs dans la console (F12)

### B. Vérifier les Fonctionnalités

1. **Connexion/Inscription** : Testez avec Supabase
2. **Navigation** : Cliquez sur différents menus
3. **Données** : Vérifiez que les données se chargent
4. **Responsive** : Testez sur mobile (F12 → Mode responsive)

### C. Vérifier la Console

Appuyez sur **F12** dans le navigateur :

**Onglet Console** :

- ❌ Aucune erreur rouge
- ✅ Connexion Supabase OK

**Onglet Network** :

- ✅ Tous les fichiers se chargent (200 OK)
- ✅ Pas de 404 (fichiers manquants)

---

## 🔍 Dépannage

### Problème 1 : "Page not found" ou 404

**Cause** : `.htaccess` mal configuré ou absent

**Solution** :

1. Vérifiez que `.htaccess` existe dans `/public_html/`
2. Vérifiez qu'il contient les règles de réécriture SPA
3. Redémarrez Apache (depuis panneau Hostinger)

### Problème 2 : "Site Can't Be Reached"

**Cause** : DNS pas propagé ou mauvaise configuration

**Solution** :

1. Vérifiez que le domaine pointe vers Hostinger :
   ```bash
   nslookup wadashaqayn.org
   ```
2. Attendez la propagation DNS (jusqu'à 24h)
3. Vérifiez la configuration DNS dans Hostinger

### Problème 3 : Page Blanche

**Cause** : Erreurs JavaScript ou chemins incorrects

**Solution** :

1. Ouvrez la console (F12)
2. Regardez les erreurs
3. Vérifiez que tous les fichiers `assets/` sont uploadés
4. Vérifiez les permissions des fichiers

### Problème 4 : "Erreur de Connexion Supabase"

**Cause** : Variables d'environnement non incluses dans le build

**Solution** :
Le build doit être fait avec les variables d'environnement :

```bash
VITE_SUPABASE_URL=https://qliinxtanjdnwxlvnxji.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Si ce n'est pas le cas, refaites un build :

```bash
npm run build
```

### Problème 5 : Fichiers non Transférés

**Cause** : Interruption du transfert ou erreur FTP

**Solution** :

1. Dans FileZilla, allez dans **Transferts échoués** (onglet du bas)
2. **Clic droit** sur les fichiers échoués → **Réessayer**
3. OU refaites le transfert complet

---

## 📊 Récapitulatif

### Ce Que Vous Avez Déployé

- **Application** : Wadashaqayn SaaS (React + Vite)
- **Taille** : 3.2 MB
- **Fichiers** : ~100+ fichiers (HTML, JS, CSS, assets)
- **Backend** : Supabase (https://qliinxtanjdnwxlvnxji.supabase.co)
- **Domaine** : https://wadashaqayn.org

### Structure Finale sur Hostinger

```
public_html/
├── assets/
│   ├── index-CeRxSUww.js (489 KB)
│   ├── vendor-pdf-xxx.js (440 KB)
│   ├── vendor-excel-xxx.js (417 KB)
│   ├── vendor-react-xxx.js (161 KB)
│   ├── ... (autres fichiers JS/CSS)
│   └── index-xxx.css
├── index.html
├── favicon.ico
├── logo-w.svg
├── placeholder.svg
├── robots.txt
└── .htaccess
```

---

## 🎯 Checklist Finale

- [ ] FileZilla installé et configuré
- [ ] Connexion FTP Hostinger réussie
- [ ] Dossier `/public_html/` nettoyé
- [ ] Tous les fichiers de `dist/` uploadés
- [ ] `.htaccess` créé et configuré
- [ ] Site accessible sur https://wadashaqayn.org
- [ ] Connexion Supabase fonctionne
- [ ] Navigation entre pages OK
- [ ] Responsive mobile OK
- [ ] Pas d'erreurs dans la console

---

## 📞 Support

### Ressources Utiles

- **Documentation FileZilla** : https://wiki.filezilla-project.org/
- **Support Hostinger** : https://www.hostinger.com/tutorials/
- **Supabase Docs** : https://supabase.com/docs

### Logs à Vérifier

Si problème, consultez :

1. **FileZilla** : Onglet "Journal" en bas
2. **Navigateur** : Console F12
3. **Hostinger** : Logs d'erreur dans le panneau

---

**✅ Votre site est maintenant déployé sur wadashaqayn.org ! 🎉**

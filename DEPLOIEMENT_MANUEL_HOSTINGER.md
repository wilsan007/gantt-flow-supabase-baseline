# 📦 Guide de Déploiement Manuel sur Hostinger

## 🎯 Fichiers Prêts pour le Déploiement

L'application a été buildée avec succès ! Vous avez **2 options** pour déployer :

---

## ✅ OPTION 1 : Archive Compressée (Recommandé)

### Fichier à Uploader :

```
wadashaqayn-deployment.tar.gz (876 KB)
```

### Étapes :

#### 1️⃣ Télécharger l'Archive

Le fichier se trouve ici :

```
/home/awaleh/Bureau/Wadashaqeen-SaaS/gantt-flow-next/wadashaqayn-deployment.tar.gz
```

#### 2️⃣ Se Connecter à Hostinger

- Allez sur : https://hostinger.com
- Connectez-vous à votre compte
- Allez dans **Hébergement** → **wadashaqayn.com**

#### 3️⃣ Ouvrir le Gestionnaire de Fichiers

- Dans le panneau Hostinger, cliquez sur **"Gestionnaire de fichiers"** (File Manager)
- Naviguez vers le dossier **`public_html`**

#### 4️⃣ Nettoyer le Dossier `public_html`

**IMPORTANT** : Supprimez TOUS les anciens fichiers dans `public_html` :

- Sélectionnez tout (Ctrl+A)
- Cliquez sur **Supprimer** (Delete)
- Confirmez la suppression

#### 5️⃣ Uploader l'Archive

- Cliquez sur **"Upload"** (Télécharger)
- Sélectionnez le fichier `wadashaqayn-deployment.tar.gz`
- Attendez la fin de l'upload

#### 6️⃣ Extraire l'Archive

- Clic droit sur `wadashaqayn-deployment.tar.gz`
- Sélectionnez **"Extract"** (Extraire)
- Confirmez l'extraction
- **Supprimez l'archive** après extraction (optionnel)

#### 7️⃣ Vérifier

- Vous devriez voir :
  - ✅ `index.html`
  - ✅ Dossier `assets/`
  - ✅ `favicon.ico`
  - ✅ `logo-w.svg`
  - ✅ `.htaccess`
  - etc.

---

## ✅ OPTION 2 : Dossier `dist/` Complet

### Dossier à Uploader :

```
/home/awaleh/Bureau/Wadashaqeen-SaaS/gantt-flow-next/dist/
```

### Étapes :

#### 1️⃣ Via le Gestionnaire de Fichiers Hostinger

**Étape A : Nettoyer `public_html`**

- Connectez-vous à Hostinger
- Ouvrez le **Gestionnaire de fichiers**
- Allez dans `public_html`
- Supprimez TOUS les fichiers existants

**Étape B : Uploader le Contenu de `dist/`**

- Cliquez sur **"Upload"**
- Sélectionnez **TOUS les fichiers** du dossier `dist/` sur votre ordinateur
- Attendez la fin de l'upload (peut prendre 2-5 minutes)

#### 2️⃣ Via FTP (FileZilla)

Si vous préférez utiliser un client FTP :

**Configuration FileZilla :**

- **Hôte** : `45.84.205.125`
- **Nom d'utilisateur** : `u643283251`
- **Mot de passe** : Votre mot de passe FTP
- **Port** : `21`

**Upload :**

1. Connectez-vous à FileZilla
2. À gauche : Naviguez vers `gantt-flow-next/dist/`
3. À droite : Naviguez vers `/public_html/`
4. Sélectionnez TOUS les fichiers de `dist/` (à gauche)
5. Glissez-déposez vers `public_html` (à droite)
6. Attendez la fin du transfert

---

## 📋 Liste des Fichiers Attendus dans `public_html`

Après déploiement, vous devriez avoir :

```
public_html/
├── index.html                           (1.77 KB)
├── .htaccess                            (904 B)
├── favicon.ico                          (7.47 KB)
├── logo-w.svg                           (variable)
├── placeholder.svg                      (3.18 KB)
├── robots.txt                           (160 B)
└── assets/
    ├── index-CeRxSUww.js               (489 KB)
    ├── index-DKEcr9lm.css              (156 KB)
    ├── vendor-excel-Daed31RM.js        (417 KB)
    ├── vendor-pdf-9RqEjj88.js          (440 KB)
    └── ... (tous les autres fichiers JS/CSS)
```

**Total : ~60 fichiers, ~2.5 MB**

---

## ✅ Vérification Après Déploiement

### 1️⃣ Vider le Cache du Navigateur

- **Chrome/Edge** : `Ctrl + Shift + R`
- **Firefox** : `Ctrl + F5`
- **Safari** : `Cmd + Shift + R`

### 2️⃣ Tester le Site

- Allez sur : `https://wadashaqayn.com`
- Vérifiez :
  - ✅ Le titre est **"Wadashaqayn"**
  - ✅ Le favicon s'affiche correctement
  - ✅ La page de connexion s'affiche
  - ✅ Pas d'erreur de chargement

### 3️⃣ Tester la Connexion Supabase

- Essayez de vous connecter avec un compte
- Si la connexion échoue → Les variables d'environnement ne sont pas correctes dans le build

---

## 🆘 Dépannage

### ❌ "Page blanche après déploiement"

**Cause** : Fichiers mal placés ou `.htaccess` manquant

**Solution** :

1. Vérifiez que `index.html` est bien dans `public_html/` (pas dans un sous-dossier)
2. Vérifiez que `.htaccess` est présent
3. Vérifiez les permissions des fichiers (644 pour les fichiers, 755 pour les dossiers)

### ❌ "404 sur les routes (/projects, /hr, etc.)"

**Cause** : `.htaccess` manquant ou mal configuré

**Solution** :

1. Vérifiez que `.htaccess` existe dans `public_html/`
2. Son contenu devrait rediriger toutes les routes vers `index.html`

### ❌ "Impossible de se connecter"

**Cause** : Variables d'environnement Supabase non intégrées au build

**Solution** :

1. Vérifiez que votre fichier `.env` local contient :
   ```
   VITE_SUPABASE_URL=https://qliinxtanjdnwxlvnxji.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```
2. Relancez le build : `npm run build`
3. Re-déployez

### ❌ "Ancienne version s'affiche toujours"

**Cause** : Cache du navigateur ou du serveur

**Solution** :

1. Videz le cache du navigateur (`Ctrl + Shift + R`)
2. Essayez en navigation privée
3. Si ça persiste, videz le cache Hostinger depuis le panneau

---

## 📊 Résumé des Fichiers Générés

| Fichier                         | Taille  | Description                     |
| ------------------------------- | ------- | ------------------------------- |
| `dist/`                         | ~2.5 MB | Dossier complet de production   |
| `wadashaqayn-deployment.tar.gz` | 876 KB  | Archive compressée (recommandé) |

---

## 🚀 Commandes Utiles

### Rebuild si Nécessaire

```bash
cd /home/awaleh/Bureau/Wadashaqeen-SaaS/gantt-flow-next
npm run build
```

### Recréer l'Archive

```bash
cd dist
tar -czf ../wadashaqayn-deployment.tar.gz .
cd ..
```

### Créer un ZIP (Alternative)

```bash
cd dist
zip -r ../wadashaqayn-deployment.zip .
cd ..
```

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs du navigateur (F12 → Console)
2. Vérifiez les fichiers dans `public_html` via le gestionnaire de fichiers
3. Testez en navigation privée pour éliminer le cache

---

**✅ Le déploiement manuel est maintenant prêt ! Utilisez l'archive `.tar.gz` ou le dossier `dist/` selon votre préférence.**

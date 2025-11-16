# 🚀 Guide de Déploiement sur Hostinger

## 📋 Prérequis

1. ✅ Compte GitHub avec accès au repository
2. ✅ Compte Hostinger avec hébergement web
3. ✅ Accès FTP/SFTP à votre hébergement

## 🔐 Configuration des Secrets GitHub

### Étape 1 : Obtenir les Informations FTP de Hostinger

1. Connectez-vous à votre **panneau Hostinger**
2. Allez dans **Fichiers** → **Gestionnaire de fichiers** ou **Comptes FTP**
3. Notez les informations suivantes :
   - **Serveur FTP** : `ftp.votredomaine.com` ou `123.456.789.0`
   - **Nom d'utilisateur** : `u123456789` ou votre email
   - **Mot de passe** : Votre mot de passe FTP

### Étape 2 : Ajouter les Secrets dans GitHub

1. Allez sur votre repository GitHub
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu latéral, cliquez sur **Secrets and variables** → **Actions**
4. Cliquez sur **New repository secret**
5. Ajoutez les 3 secrets suivants :

#### Secret 1 : FTP_SERVER

- **Name:** `FTP_SERVER`
- **Value:** `ftp.votredomaine.com` (votre serveur FTP Hostinger)

#### Secret 2 : FTP_USERNAME

- **Name:** `FTP_USERNAME`
- **Value:** `u123456789` (votre nom d'utilisateur FTP)

#### Secret 3 : FTP_PASSWORD

- **Name:** `FTP_PASSWORD`
- **Value:** `votre_mot_de_passe_ftp`

## 📂 Structure de Déploiement

Le workflow déploie automatiquement les fichiers du dossier `dist/` vers `/public_html/` sur Hostinger.

```
Hostinger:
└── public_html/          ← Dossier racine du site
    ├── index.html        ← Point d'entrée
    ├── assets/           ← CSS, JS, images
    └── ...               ← Autres fichiers du build
```

## 🔄 Processus de Déploiement

### Déploiement Automatique (Recommandé)

Chaque fois que vous poussez du code sur la branche `main`, le déploiement se lance automatiquement :

```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
```

✅ **GitHub Actions** va automatiquement :

1. Installer les dépendances
2. Builder l'application
3. Déployer sur Hostinger via FTP

### Déploiement Manuel

Vous pouvez aussi déclencher un déploiement manuellement :

1. Allez sur votre repository GitHub
2. Cliquez sur **Actions**
3. Sélectionnez **Deploy to Hostinger**
4. Cliquez sur **Run workflow** → **Run workflow**

## 📊 Vérifier le Déploiement

### Via GitHub Actions

1. Allez dans l'onglet **Actions** de votre repository
2. Cliquez sur le dernier workflow
3. Vérifiez que toutes les étapes sont vertes ✅

### Sur Hostinger

1. Connectez-vous au gestionnaire de fichiers Hostinger
2. Vérifiez que les fichiers sont dans `/public_html/`
3. Visitez votre site : `https://votredomaine.com`

## ⚙️ Configuration Avancée

### Modifier le Dossier de Destination

Si votre site n'est pas dans `/public_html/`, modifiez dans `.github/workflows/deploy-hostinger.yml` :

```yaml
server-dir: /votre/dossier/public/
```

### Ajouter des Variables d'Environnement

Si vous avez des variables d'environnement de production, créez un fichier `.env.production` :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_publique
```

Puis ajoutez-le dans les secrets GitHub et injectez-le dans le workflow.

## 🔒 Configuration Apache/Nginx (SPA)

Pour que le routing React fonctionne correctement, créez un fichier `.htaccess` dans `/public_html/` :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

## 🐛 Dépannage

### Erreur : "Failed to connect to FTP server"

- ✅ Vérifiez que `FTP_SERVER` est correct
- ✅ Vérifiez que le port FTP est ouvert (généralement 21)
- ✅ Essayez avec l'IP du serveur au lieu du domaine

### Erreur : "Authentication failed"

- ✅ Vérifiez `FTP_USERNAME` et `FTP_PASSWORD`
- ✅ Réinitialisez votre mot de passe FTP dans Hostinger si nécessaire

### Le site affiche une page blanche

- ✅ Vérifiez que tous les fichiers sont bien dans `/public_html/`
- ✅ Ajoutez le fichier `.htaccess` pour le routing SPA
- ✅ Ouvrez la console du navigateur (F12) pour voir les erreurs

### Les modifications ne s'affichent pas

- ✅ Videz le cache du navigateur : `Ctrl + Shift + R`
- ✅ Vérifiez que le workflow GitHub Actions s'est bien exécuté
- ✅ Attendez quelques minutes pour la propagation

## 📞 Support

- **GitHub Actions Docs** : https://docs.github.com/en/actions
- **Hostinger Support** : https://www.hostinger.fr/tutoriels/
- **FTP Deploy Action** : https://github.com/SamKirkland/FTP-Deploy-Action

## ✅ Checklist de Déploiement

- [ ] Secrets GitHub configurés (FTP_SERVER, FTP_USERNAME, FTP_PASSWORD)
- [ ] Workflow GitHub Actions créé (`.github/workflows/deploy-hostinger.yml`)
- [ ] Build réussi localement (`npm run build`)
- [ ] Code poussé sur GitHub (`git push origin main`)
- [ ] Workflow exécuté avec succès dans Actions
- [ ] Fichier `.htaccess` ajouté sur Hostinger
- [ ] Site accessible sur le domaine
- [ ] Navigation et fonctionnalités testées

---

**Bon déploiement ! 🚀**

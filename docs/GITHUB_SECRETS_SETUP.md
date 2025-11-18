# 🔐 Configuration des Secrets GitHub - Guide Complet

## 📋 **Secrets Requis**

Votre projet nécessite les secrets suivants pour le CI/CD :

| Secret             | Description                      | Utilisé dans | Obligatoire  |
| ------------------ | -------------------------------- | ------------ | ------------ |
| `FTP_SERVER`       | Adresse du serveur FTP Hostinger | deploy.yml   | ✅ Oui       |
| `FTP_USERNAME`     | Nom d'utilisateur FTP            | deploy.yml   | ✅ Oui       |
| `FTP_PASSWORD`     | Mot de passe FTP                 | deploy.yml   | ✅ Oui       |
| `GITLEAKS_LICENSE` | Licence Gitleaks Pro (optionnel) | security.yml | ⚠️ Optionnel |

---

## 🚀 **ÉTAPE 1: Accéder aux Secrets GitHub**

### **Méthode 1: Via l'interface web**

1. **Aller sur votre repository GitHub**

   ```
   https://github.com/VOTRE_USERNAME/gantt-flow-next
   ```

2. **Cliquer sur "Settings" (Paramètres)**
   - En haut à droite du repository
   - Nécessite les permissions d'admin

3. **Dans le menu latéral gauche:**
   - Développer "Secrets and variables"
   - Cliquer sur "Actions"

4. **Vous verrez la page "Actions secrets and variables"**

---

## 🔑 **ÉTAPE 2: Obtenir les Informations Hostinger**

### **Accéder au cPanel Hostinger**

1. **Se connecter à Hostinger**

   ```
   https://hpanel.hostinger.com/
   ```

2. **Aller dans "Hosting" ou "Websites"**
   - Sélectionner votre domaine/site

3. **Trouver les informations FTP**

   **Option A - Via FTP Accounts:**
   - Aller dans "Files" → "FTP Accounts"
   - Créer un nouveau compte FTP ou utiliser l'existant

   **Option B - Via File Manager:**
   - Aller dans "Files" → "File Manager"
   - Cliquer sur "FTP Credentials" (en haut à droite)

4. **Récupérer ces informations:**
   ```
   FTP Server: ftp.votredomaine.com  (ou IP: 123.456.789.0)
   FTP Username: votre_username@votredomaine.com
   FTP Password: votre_mot_de_passe_ftp
   ```

> ⚠️ **Important:** Si vous n'avez pas encore de compte FTP, créez-en un avec :
>
> - **Répertoire:** `/public_html` (ou le dossier de votre choix)
> - **Permissions:** Lecture/Écriture/Suppression

---

## ➕ **ÉTAPE 3: Ajouter les Secrets sur GitHub**

### **Pour chaque secret:**

1. **Cliquer sur "New repository secret"** (bouton vert)

2. **Remplir le formulaire:**

   **Secret 1: FTP_SERVER**

   ```
   Name: FTP_SERVER
   Secret: ftp.votredomaine.com
   ```

   **Secret 2: FTP_USERNAME**

   ```
   Name: FTP_USERNAME
   Secret: votre_username@votredomaine.com
   ```

   **Secret 3: FTP_PASSWORD**

   ```
   Name: FTP_PASSWORD
   Secret: votre_mot_de_passe_ftp_sécurisé
   ```

3. **Cliquer sur "Add secret"**

4. **Répéter pour chaque secret**

---

## ✅ **ÉTAPE 4: Vérification**

### **Vérifier que les secrets sont bien configurés:**

1. **Retourner sur la page "Actions secrets"**

2. **Vous devriez voir:**

   ```
   FTP_SERVER          Updated X minutes ago
   FTP_USERNAME        Updated X minutes ago
   FTP_PASSWORD        Updated X minutes ago
   ```

3. **Les valeurs sont cachées** (sécurité GitHub)
   - Vous verrez `•••••••••••••` au lieu des valeurs réelles

---

## 🧪 **ÉTAPE 5: Tester le Déploiement**

### **Option 1: Push sur main (déploiement automatique)**

```bash
git add .
git commit -m "test: Configure FTP deployment"
git push origin main
```

### **Option 2: Déploiement manuel via GitHub Actions**

1. **Aller dans "Actions" sur GitHub**

2. **Sélectionner "Deploy to Hostinger"**

3. **Cliquer sur "Run workflow"**
   - Choisir la branche: `main`
   - Environment: `production`

4. **Cliquer sur "Run workflow" (vert)**

5. **Attendre et vérifier les logs**
   - ✅ Build réussi
   - ✅ Connexion FTP OK
   - ✅ Fichiers uploadés

---

## 🔍 **ÉTAPE 6: Vérification sur Hostinger**

### **Vérifier que les fichiers sont bien uploadés:**

1. **Aller dans File Manager (Hostinger)**

   ```
   Files → File Manager
   ```

2. **Naviguer vers `/public_html`**

3. **Vous devriez voir:**

   ```
   public_html/
   ├── index.html
   ├── assets/
   │   ├── index-[hash].js
   │   ├── index-[hash].css
   │   └── ...
   └── favicon.ico
   ```

4. **Tester le site:**
   ```
   https://votredomaine.com
   ```

---

## ❌ **Dépannage**

### **Problème: "Error: FTP connection failed"**

**Solutions:**

1. Vérifier que `FTP_SERVER` est correct (sans `ftp://`, sans `/`)
   - ✅ Correct: `ftp.votredomaine.com`
   - ❌ Incorrect: `ftp://ftp.votredomaine.com/`

2. Vérifier le port FTP (par défaut: 21)
   - Hostinger utilise généralement le port 21

3. Vérifier le pare-feu Hostinger
   - S'assurer que les connexions FTP sont autorisées

### **Problème: "Authentication failed"**

**Solutions:**

1. Vérifier `FTP_USERNAME` et `FTP_PASSWORD`
2. Réinitialiser le mot de passe FTP sur Hostinger
3. Créer un nouveau compte FTP dédié au déploiement

### **Problème: "Permission denied"**

**Solutions:**

1. Vérifier les permissions du compte FTP
2. S'assurer que le répertoire `/public_html` existe
3. Vérifier les droits d'écriture (chmod 755 ou 775)

---

## 🔒 **Bonnes Pratiques de Sécurité**

### **1. Créer un compte FTP dédié**

- Ne pas utiliser le compte FTP principal
- Limiter les permissions au strict nécessaire
- Restreindre au répertoire `/public_html` uniquement

### **2. Rotation des credentials**

- Changer le mot de passe FTP tous les 3-6 mois
- Mettre à jour le secret GitHub après changement

### **3. Monitoring**

- Activer les logs FTP sur Hostinger
- Surveiller les déploiements dans GitHub Actions
- Vérifier les modifications non autorisées

### **4. Backup**

- Faire des backups réguliers avant déploiement
- Utiliser le système de backup Hostinger
- Garder des copies locales des builds

---

## 📚 **Ressources Supplémentaires**

### **Documentation Hostinger:**

- [Guide FTP Hostinger](https://support.hostinger.com/en/articles/1583245-how-to-use-ftp)
- [File Manager](https://support.hostinger.com/en/articles/1583307-how-to-use-file-manager)

### **Documentation GitHub:**

- [Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Actions Variables](https://docs.github.com/en/actions/learn-github-actions/variables)

### **Support:**

- Hostinger Support: https://www.hostinger.com/contact
- GitHub Support: https://support.github.com/

---

## ✅ **Checklist Finale**

Avant de déployer en production, vérifiez:

- [ ] ✅ Les 3 secrets FTP sont configurés sur GitHub
- [ ] ✅ Le compte FTP fonctionne (testé manuellement)
- [ ] ✅ Le répertoire `/public_html` existe et est accessible
- [ ] ✅ Le workflow `deploy.yml` est présent dans `.github/workflows/`
- [ ] ✅ Un test de déploiement manuel a réussi
- [ ] ✅ Le site est accessible après déploiement
- [ ] ✅ Les fichiers sont corrects (pas de 404)

---

## 🚀 **Prochaines Étapes**

Une fois les secrets configurés:

1. **Tester le déploiement:**

   ```bash
   git push origin main
   ```

2. **Monitorer dans Actions:**
   - Aller sur GitHub → Actions
   - Vérifier le workflow "Deploy to Hostinger"

3. **Vérifier le site:**
   - Visiter https://votredomaine.com
   - Tester les fonctionnalités principales

4. **Configurer les environnements:**
   - Production: branche `main`
   - Staging: branche `develop` (optionnel)

---

**Fait avec ❤️ pour Wadashaqayn SaaS**

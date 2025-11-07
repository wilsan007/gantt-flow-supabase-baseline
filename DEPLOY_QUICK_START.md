# 🚀 DÉMARRAGE RAPIDE - Déploiement Hostinger

## ⚡ En 5 Étapes Simples

### **Étape 1: Configurer les Secrets GitHub (5 min)**

1. **Ouvrez votre repository:**
   ```
   https://github.com/wilsan007/gantt-flow-supabase-baseline/settings/secrets/actions
   ```

2. **Cliquez sur "New repository secret" et ajoutez:**

   | Nom | Valeur | Exemple |
   |-----|--------|---------|
   | `HOSTINGER_FTP_SERVER` | Serveur FTP Hostinger | `ftp.votredomaine.com` |
   | `HOSTINGER_FTP_USERNAME` | Nom d'utilisateur FTP | `u123456789` |
   | `HOSTINGER_FTP_PASSWORD` | Mot de passe FTP | `VotreMdp123!` |
   | `HOSTINGER_FTP_PATH` | Chemin du site | `/public_html/` |

3. **Où trouver ces informations:**
   - Connectez-vous à https://hpanel.hostinger.com
   - Dashboard → Hosting → Gérer → Comptes FTP

---

### **Étape 2: Préparer Hostinger (3 min)**

1. **Connectez-vous à Hostinger hPanel**

2. **Ouvrez le File Manager:**
   - Dashboard → File Manager

3. **Naviguez vers `/public_html`**

4. **Créez/Uploadez le fichier `.htaccess`:**
   - Utilisez le fichier `hostinger.htaccess` fourni
   - Renommez-le en `.htaccess` (avec le point)

---

### **Étape 3: Commit et Push (1 min)**

```bash
# Ajouter les nouveaux fichiers de workflow
git add .github/workflows/deploy-hostinger.yml
git add hostinger.htaccess
git add DEPLOY_*.md

# Commit
git commit -m "feat: Ajout déploiement automatique Hostinger"

# Push vers GitHub
git push origin main
```

---

### **Étape 4: Vérifier le Déploiement (5-8 min)**

1. **Ouvrez GitHub Actions:**
   ```
   https://github.com/wilsan007/gantt-flow-supabase-baseline/actions
   ```

2. **Vous devriez voir le workflow "Deploy to Hostinger" en cours:**
   - 🟡 Jaune = En cours
   - ✅ Vert = Succès
   - ❌ Rouge = Échec

3. **Cliquez sur le workflow pour voir les détails:**
   - Job 1: Tests & Build (~3-4 min)
   - Job 2: Deploy to Hostinger (~2-3 min)

---

### **Étape 5: Tester Votre Site (1 min)**

1. **Ouvrez votre site web:**
   ```
   https://votre-domaine.com
   ```

2. **Vérifications:**
   - ✅ Page d'accueil charge
   - ✅ Navigation fonctionne
   - ✅ Pas d'erreurs dans console (F12)

---

## 🎉 C'est Tout!

### **Maintenant, à chaque push vers `main`:**
1. 🧪 Tests automatiques
2. 🏗️ Build de production
3. 🚀 Déploiement vers Hostinger
4. ✅ Site mis à jour automatiquement

**Temps total:** ~5-8 minutes par déploiement

---

## 🆘 Besoin d'Aide?

### **Problème: Workflow échoue**
```bash
# Voir les logs détaillés dans GitHub Actions
# Cliquez sur le workflow en échec → Cliquez sur le job en échec
```

### **Problème: Secrets manquants**
```
Error: Secret HOSTINGER_FTP_SERVER not found
```
**Solution:** Vérifiez que les 4 secrets sont bien configurés dans GitHub Settings → Secrets

### **Problème: Site affiche une page blanche**
```bash
# Vérifiez que le fichier .htaccess est bien déployé
# Vérifiez la console navigateur (F12) pour les erreurs
```

### **Documentation Complète:**
```bash
cat DEPLOY_HOSTINGER_GUIDE.md
```

---

## 📋 Checklist Rapide

- [ ] ✅ 4 secrets GitHub configurés
- [ ] ✅ Fichier .htaccess uploadé sur Hostinger
- [ ] ✅ Workflow déployé (commit + push)
- [ ] ✅ GitHub Actions montre succès (vert)
- [ ] ✅ Site accessible et fonctionne

---

**🎯 Prêt pour Production!**

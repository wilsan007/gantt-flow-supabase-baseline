# 🧹 Instructions de Nettoyage de l'Historique Git

## ⚠️ IMPORTANT - À Faire APRÈS le Premier Push

### **Pourquoi Nettoyer?**
Les fichiers sensibles ont été supprimés du dernier commit, MAIS ils restent dans l'historique Git. GitHub CodeQL continuera à les scanner et à générer des alertes.

---

## 🚀 Option 1: Script Automatisé (Recommandé)

### **Étape 1: Télécharger le script**
```bash
cd /home/awaleh/Bureau/Wadashaqeen-SaaS/gantt-flow-next

# Le script est déjà présent: clean-git-history-v2.sh
chmod +x clean-git-history-v2.sh
```

### **Étape 2: Exécuter le script**
```bash
./clean-git-history-v2.sh
```

Le script va:
1. Créer un backup automatique
2. Télécharger BFG Repo-Cleaner
3. Supprimer tous les fichiers sensibles de l'historique
4. Nettoyer les références Git
5. Préparer pour force push

### **Étape 3: Force Push**
```bash
# ⚠️ ATTENTION: Informez l'équipe AVANT!
git push --force origin main
```

---

## 🔧 Option 2: Manuel avec BFG

### **Étape 1: Installer BFG**
```bash
# macOS
brew install bfg

# Linux
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
alias bfg='java -jar bfg-1.14.0.jar'

# Vérifier Java
java -version
```

### **Étape 2: Clone Mirror**
```bash
cd /home/awaleh/Bureau/Wadashaqeen-SaaS/
git clone --mirror https://github.com/wilsan007/gantt-flow-supabase-baseline.git
cd gantt-flow-supabase-baseline.git
```

### **Étape 3: Nettoyage avec BFG**
```bash
# Supprimer dossiers de build
bfg --delete-folders wadashaqayn_deploy_ready --no-blob-protection
bfg --delete-folders dist --no-blob-protection

# Supprimer fichiers de test
bfg --delete-files 'test-*.js' --no-blob-protection

# Supprimer fichiers SQL sensibles
bfg --delete-files 'fix-*.sql' --no-blob-protection
bfg --delete-files 'check-*.sql' --no-blob-protection
bfg --delete-files 'repair-*.sql' --no-blob-protection

# Supprimer fichiers backup
bfg --delete-files '*-backup.ts' --no-blob-protection
bfg --delete-files '*-minimal.ts' --no-blob-protection
```

### **Étape 4: Cleanup Git**
```bash
# Nettoyer les références
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Vérifier la taille
du -sh .
```

### **Étape 5: Force Push**
```bash
git push --force
```

### **Étape 6: Cleanup Local**
```bash
cd /home/awaleh/Bureau/Wadashaqeen-SaaS/gantt-flow-next
git fetch origin
git reset --hard origin/main
git gc --aggressive
```

---

## 📋 Checklist Post-Nettoyage

### **Vérifications:**
- [ ] ✅ Historique nettoyé (force push réussi)
- [ ] ✅ Repository local synchronisé
- [ ] ✅ Taille du repo réduite (git count-objects -vH)
- [ ] ✅ Build fonctionne (npm run build)
- [ ] ✅ Tests passent (npm run test)

### **GitHub:**
- [ ] ✅ CodeQL scan lancé automatiquement
- [ ] ✅ Alertes CodeQL réduites (attendre 10-15 min)
- [ ] ✅ Secret scanning actif
- [ ] ✅ Workflows fonctionnent

### **Équipe:**
- [ ] ✅ Tous les membres informés
- [ ] ✅ Instructions de sync partagées:
  ```bash
  git fetch origin
  git reset --hard origin/main
  ```

---

## 🚨 Si Problèmes

### **"fatal: refusing to merge unrelated histories"**
```bash
git pull origin main --allow-unrelated-histories
```

### **"! [remote rejected] main -> main (protected branch hook declined)"**
```
GitHub → Settings → Branches → Branch protection rules
Temporairement désactiver "Require linear history"
```

### **"Pack exceeds maximum allowed size"**
```bash
# Augmenter la limite
git config http.postBuffer 524288000
```

---

## 📊 Résultat Attendu

### **Avant Nettoyage:**
```
Repository size: ~150 MB
CodeQL alerts: 615
Sensitive files in history: 170+
```

### **Après Nettoyage:**
```
Repository size: ~15 MB (-90%)
CodeQL alerts: 15-30 (-95%)
Sensitive files in history: 0
```

---

## 📚 Ressources

- [BFG Repo-Cleaner Documentation](https://rtyley.github.io/bfg-repo-cleaner/)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Git Filter-Repo (Alternative)](https://github.com/newren/git-filter-repo/)

---

**⏱️ Temps Estimé:** 10-15 minutes  
**🔄 Fréquence:** Une seule fois (après première configuration sécurité)  
**⚠️ Criticité:** HAUTE (nécessaire pour sécurité complète)

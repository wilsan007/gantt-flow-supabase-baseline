# ✅ Checklist Migration : wadashaqayn.com → wadashaqayn.com

## 🚨 À FAIRE MAINTENANT (Avant le déploiement)

### 1️⃣ Supabase Dashboard (CRITIQUE ⚠️)

**URL :** https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/settings/auth

**Actions :**

- [ ] Cliquer sur **"Authentication"** dans le menu de gauche
- [ ] Aller dans l'onglet **"URL Configuration"**
- [ ] **Site URL** → Remplacer par : `https://wadashaqayn.com`
- [ ] **Redirect URLs** → Ajouter ces lignes :
  ```
  https://wadashaqayn.com/*
  https://wadashaqayn.com/auth/callback
  ```
- [ ] Garder temporairement les anciennes URLs .org
- [ ] Cliquer **"Save"** en bas de la page

**⚠️ Sans cette configuration, la connexion ne fonctionnera PAS sur le nouveau domaine !**

---

### 2️⃣ Google OAuth (Si vous utilisez Google Login)

**URL :** https://console.cloud.google.com/apis/credentials

**Actions :**

- [ ] Sélectionnez votre projet
- [ ] Cliquez sur votre **OAuth 2.0 Client ID**
- [ ] **Origines JavaScript autorisées** → Cliquez "Add URI" :
  ```
  https://wadashaqayn.com
  ```
- [ ] **URI de redirection autorisés** → Cliquez "Add URI" :
  ```
  https://wadashaqayn.com/auth/callback
  ```
- [ ] Cliquez **"Save"**

---

### 3️⃣ Configuration DNS Hostinger

**URL :** https://hostinger.com → Connexion → Domaines

**Actions :**

- [ ] Vérifier si `wadashaqayn.com` est présent dans vos domaines
- [ ] **Si OUI :**
  - [ ] Cliquer sur `wadashaqayn.com`
  - [ ] Vérifier que les DNS pointent vers votre serveur
  - [ ] Dans **"Hébergement"**, associer le domaine .com au même hébergement que .org
- [ ] **Si NON :**
  - [ ] Acheter le domaine `wadashaqayn.com`
  - [ ] Configurer les DNS pour pointer vers votre serveur Hostinger

**Vérification DNS :**

```bash
nslookup wadashaqayn.com
# Devrait retourner l'IP de votre serveur
```

---

## ✅ Déjà Fait (Code)

- [x] Workflow GitHub Actions mis à jour (.org → .com)
- [x] Variables d'environnement Supabase confirmées (pas de changement nécessaire)

---

## 🔄 À Faire Après Configuration

### 4️⃣ Commit et Déploiement

```bash
# Commit des changements
git add .github/workflows/main-pipeline.yml
git commit -m "chore: migrate domain from wadashaqayn.com to wadashaqayn.com"
git push origin main
```

**OU** déploiement manuel avec les fichiers déjà générés :

```
wadashaqayn-deployment.tar.gz
wadashaqayn-deployment.zip
```

---

### 5️⃣ Vérification Post-Déploiement

- [ ] Aller sur `https://wadashaqayn.com`
- [ ] Vérifier que le site s'affiche
- [ ] Tester la **connexion** (très important !)
- [ ] Vérifier la **navigation** entre les pages
- [ ] Tester les **fonctionnalités principales**

---

## 📊 Résumé des Modifications

| Élément                      | Avant                        | Après             | Statut                  |
| ---------------------------- | ---------------------------- | ----------------- | ----------------------- |
| **Site URL (Supabase)**      | wadashaqayn.com              | wadashaqayn.com   | ⚠️ À FAIRE              |
| **Redirect URLs (Supabase)** | .org uniquement              | .com + .org       | ⚠️ À FAIRE              |
| **Google OAuth**             | .org uniquement              | .com + .org       | ⚠️ À FAIRE (si utilisé) |
| **DNS Hostinger**            | .org configuré               | .com à configurer | ⚠️ À FAIRE              |
| **Workflow GitHub**          | .org                         | .com              | ✅ FAIT                 |
| **Variables Supabase**       | qliinxtanjdnwxji.supabase.co | Aucun changement  | ✅ OK                   |

---

## 🆘 Ordre Recommandé

1. **AVANT tout :** Configurer Supabase + Google OAuth
2. Vérifier/Configurer le DNS sur Hostinger
3. Commit et push le code
4. Attendre la propagation DNS (peut prendre jusqu'à 24h)
5. Tester le nouveau site

---

## ❌ Ce Qui NE CHANGE PAS

```bash
# .env - AUCUNE MODIFICATION
VITE_SUPABASE_URL=https://qliinxtanjdnwxlvnxji.supabase.co  ← Reste identique
VITE_SUPABASE_ANON_KEY=eyJhbGc...                           ← Reste identique

# GitHub Secrets - AUCUNE MODIFICATION
VITE_SUPABASE_URL (secret)      ← Reste identique
VITE_SUPABASE_ANON_KEY (secret) ← Reste identique
FTP_SERVER (secret)             ← Reste identique (sauf si serveur différent)
FTP_USERNAME (secret)           ← Reste identique
FTP_PASSWORD (secret)           ← Reste identique
```

---

## 🎯 Points de Contrôle

Avant de pousser le code, vérifiez :

- [ ] ✅ Supabase Site URL = `wadashaqayn.com`
- [ ] ✅ Supabase Redirect URLs contient `wadashaqayn.com/*`
- [ ] ✅ Google OAuth (si utilisé) contient `wadashaqayn.com`
- [ ] ✅ DNS Hostinger configuré pour `wadashaqayn.com`
- [ ] ✅ Code modifié (.github/workflows/main-pipeline.yml)

**Si tous les ✅ sont cochés, vous pouvez déployer ! 🚀**

---

## 📞 Support Rapide

### Problème : "Connexion impossible après migration"

→ Vérifiez Supabase Dashboard → URL Configuration

### Problème : "Site inaccessible"

→ Vérifiez la configuration DNS et attendez la propagation

### Problème : "OAuth Google ne fonctionne plus"

→ Vérifiez Google Cloud Console → Origines autorisées

---

**✅ Suivez cette checklist point par point pour une migration réussie !**

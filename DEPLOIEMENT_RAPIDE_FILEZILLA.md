# ⚡ Déploiement Rapide : FileZilla vers Hostinger

**Domaine** : wadashaqayn.org  
**Dossier à uploader** : `dist/` (3.2 MB)  
**Destination** : `/public_html/` sur Hostinger

---

## 🚀 3 Étapes Simples

### 1️⃣ Installer FileZilla

**Ubuntu/Linux** :

```bash
sudo apt install filezilla
```

**OU télécharger** : https://filezilla-project.org/

---

### 2️⃣ Connecter à Hostinger

**Dans FileZilla, en haut** :

| Champ            | Valeur                                  |
| ---------------- | --------------------------------------- |
| **Hôte**         | `ftp.wadashaqayn.org` (ou IP Hostinger) |
| **Identifiant**  | Votre username FTP Hostinger            |
| **Mot de passe** | Votre password FTP Hostinger            |
| **Port**         | `21`                                    |

Cliquez **"Connexion rapide"**

---

### 3️⃣ Uploader les Fichiers

**Dans FileZilla** :

1. **Panneau GAUCHE (local)** : Allez dans :

   ```
   /home/awaleh/Bureau/Wadashaqayn-SaaS/gantt-flow-next/dist/
   ```

2. **Panneau DROITE (serveur)** : Allez dans :

   ```
   /public_html/
   ```

3. **Sélectionnez TOUT** dans le dossier `dist/` :
   - `assets/`
   - `index.html`
   - `favicon.ico`
   - `logo-w.svg`
   - `placeholder.svg`
   - `robots.txt`

4. **Glissez-déposez** du panneau gauche vers le panneau droit

5. **Attendez** que le transfert se termine (~2 minutes)

---

## ✅ Vérification

**Ouvrez votre navigateur** :

```
https://wadashaqayn.org
```

**Résultat attendu** :

- ✅ Le site s'affiche
- ✅ Connexion Supabase fonctionne
- ✅ Navigation OK

---

## 📁 Structure Finale sur Hostinger

```
public_html/
├── assets/              ← Dossier avec JS, CSS
│   ├── index-xxx.js
│   ├── vendor-xxx.js
│   └── index-xxx.css
├── index.html           ← Page principale
├── favicon.ico
├── logo-w.svg
├── placeholder.svg
└── robots.txt
```

---

## 🔧 Optionnel : Ajouter .htaccess

Pour améliorer les performances et gérer les routes :

1. **Dans FileZilla**, clic droit dans `/public_html/` → **Créer un fichier**
2. **Nommez-le** : `.htaccess`
3. **Clic droit** sur `.htaccess` → **Voir/Éditer**
4. **Copiez le contenu** du fichier `htaccess-template.txt`
5. **Sauvegardez**

---

## 📞 Informations FTP Hostinger

**Où trouver vos credentials** :

1. Connectez-vous à : https://hpanel.hostinger.com/
2. **Hébergement** → Votre site
3. **FTP Accounts** ou **Gestion FTP**
4. Notez :
   - Serveur FTP
   - Username
   - Mot de passe (ou générez-en un nouveau)

---

## ⏱️ Temps Total

- **Connexion** : 1 minute
- **Upload** : 2-3 minutes
- **Vérification** : 1 minute
- **TOTAL** : ~5 minutes

---

## 🎯 Checklist

- [ ] FileZilla installé
- [ ] Connexion Hostinger réussie
- [ ] Fichiers de `dist/` uploadés
- [ ] Site accessible sur wadashaqayn.org
- [ ] Fonctionnalités testées

---

**📖 Pour un guide détaillé, consultez : `DEPLOIEMENT_FILEZILLA_WADASHAQAYN.md`**

**✅ C'est tout ! Votre site est en ligne ! 🎉**

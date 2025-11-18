# 🔑 Configuration FTP LWS - Wadashaqayn.com

## 📋 Informations FTP Actuelles

D'après votre panneau LWS :

| Paramètre        | Valeur                                      |
| ---------------- | ------------------------------------------- |
| **Identifiant**  | `wadas2665751`                              |
| **Serveur FTP**  | `ftp.wadashaqayn.com` (ou `193.203.239.71`) |
| **Répertoire**   | `/`                                         |
| **Port**         | `21` (standard FTP)                         |
| **Protocole**    | FTP                                         |
| **Mot de passe** | À récupérer depuis LWS                      |

---

## 🔧 Étape 1 : Récupérer le Mot de Passe FTP

### Option A : Générer un Nouveau Mot de Passe

1. **Allez sur votre panneau LWS** : https://panel.lws.fr/
2. **Hébergement** → **Gestion FTP**
3. Trouvez l'utilisateur `wadas2665751`
4. Cliquez sur **"Générer"** (bouton bleu)
5. **Copiez le mot de passe** affiché
6. **Sauvegardez-le** en lieu sûr

### Option B : Changer le Mot de Passe

1. **Panneau LWS** → **Gestion FTP**
2. Cliquez sur **"Changer"**
3. Entrez un **nouveau mot de passe** (fort et sécurisé)
4. Confirmez
5. **Notez ce mot de passe**

---

## 🔧 Étape 2 : Configurer GitHub Secrets

**URL :** https://github.com/wilsan007/gantt-flow-supabase-baseline/settings/secrets/actions

### Secrets à Configurer

#### 1. `FTP_SERVER`

```
ftp.wadashaqayn.com
```

**Comment faire :**

- Cliquez sur `FTP_SERVER` dans la liste
- Cliquez "Update secret"
- Collez : `ftp.wadashaqayn.com`
- Cliquez "Update secret"

#### 2. `FTP_USERNAME`

```
wadas2665751
```

**Comment faire :**

- Cliquez sur `FTP_USERNAME`
- Cliquez "Update secret"
- Collez : `wadas2665751`
- Cliquez "Update secret"

#### 3. `FTP_PASSWORD`

```
[Le mot de passe que vous avez récupéré à l'Étape 1]
```

**Comment faire :**

- Cliquez sur `FTP_PASSWORD`
- Cliquez "Update secret"
- Collez le mot de passe LWS
- Cliquez "Update secret"

#### 4. `FTP_REMOTE_DIR`

⚠️ **IMPORTANT** : Vérifiez d'abord où se trouve votre site web sur LWS.

**Possibilités courantes :**

- `/` (racine - ce qui est indiqué dans votre panneau)
- `/htdocs` (dossier web standard LWS)
- `/public_html`
- `/www`

**Pour vérifier :**

1. Connectez-vous en FTP avec FileZilla
2. Regardez où se trouve le dossier de votre site
3. Utilisez ce chemin dans `FTP_REMOTE_DIR`

**Valeur recommandée (à vérifier) :**

```
/htdocs
```

---

## 🧪 Étape 3 : Tester la Connexion FTP

### Test avec FileZilla (Recommandé)

1. **Téléchargez FileZilla** : https://filezilla-project.org/
2. **Ouvrez FileZilla**
3. **Entrez les informations :**
   - Hôte : `ftp.wadashaqayn.com` (ou `193.203.239.71`)
   - Identifiant : `wadas2665751`
   - Mot de passe : [Votre mot de passe LWS]
   - Port : `21`
4. **Cliquez "Connexion rapide"**

**Résultat attendu :**

- ✅ Connexion réussie
- Vous voyez la structure de dossiers sur LWS
- Notez le chemin où se trouve votre site (ex: `/htdocs/`)

### Test avec le Script

```bash
cd /home/awaleh/Bureau/Wadashaqayn-SaaS/gantt-flow-next
./test-ftp-connection.sh
```

**Entrez :**

- Serveur : `ftp.wadashaqayn.com`
- Username : `wadas2665751`
- Password : [Votre mot de passe LWS]

---

## 🔧 Étape 4 : Redéployer

Une fois les secrets configurés :

### Option A : Redéploiement Automatique

```bash
# Créez un petit changement pour déclencher le pipeline
cd /home/awaleh/Bureau/Wadashaqayn-SaaS/gantt-flow-next
echo "# FTP configured" >> README.md
git add README.md
git commit -m "chore: trigger redeploy after FTP config"
git push origin main
```

### Option B : Déclenchement Manuel

1. Allez sur : https://github.com/wilsan007/gantt-flow-supabase-baseline/actions
2. Sélectionnez **"CI/CD Pipeline - Test & Deploy"**
3. Cliquez sur **"Run workflow"** (bouton à droite)
4. Cliquez **"Run workflow"** (confirmer)

---

## ✅ Vérification Post-Déploiement

Après un déploiement réussi :

### 1. Vérifier avec FileZilla

Connectez-vous et vérifiez que les fichiers du build sont présents :

- `index.html`
- Dossier `assets/`
- Fichiers JS et CSS

### 2. Vérifier le Site

```
https://wadashaqayn.com
```

Devrait afficher votre application.

---

## 🚨 Problèmes Courants

### "530 Login authentication failed"

- ❌ Mot de passe incorrect
- ✅ Régénérez le mot de passe sur LWS
- ✅ Mettez à jour `FTP_PASSWORD` dans GitHub

### "550 Failed to change directory"

- ❌ `FTP_REMOTE_DIR` incorrect
- ✅ Vérifiez avec FileZilla
- ✅ Utilisez le bon chemin (probablement `/htdocs`)

### "Connection timeout"

- ❌ Serveur FTP incorrect
- ✅ Utilisez `ftp.wadashaqayn.com` ou `193.203.239.71`
- ✅ Port `21` (FTP standard)

### "TLS connection failed"

- ⚠️ Votre configuration utilise `security: loose`
- ✅ C'est normal pour FTP simple (pas FTPS)

---

## 📊 Résumé de Configuration

```yaml
# Configuration FTP pour LWS
server: ftp.wadashaqayn.com
username: wadas2665751
password: [MOT_DE_PASSE_LWS]
port: 21
protocol: ftp
local-dir: ./dist/
server-dir: /htdocs/ # À vérifier
```

---

## ✅ Checklist

- [ ] Mot de passe FTP récupéré depuis LWS
- [ ] `FTP_SERVER` configuré : `ftp.wadashaqayn.com`
- [ ] `FTP_USERNAME` configuré : `wadas2665751`
- [ ] `FTP_PASSWORD` configuré avec le mot de passe LWS
- [ ] `FTP_REMOTE_DIR` vérifié avec FileZilla
- [ ] Test de connexion FTP réussi
- [ ] Redéploiement déclenché

---

**Une fois tous les secrets configurés, le déploiement devrait fonctionner ! 🚀**

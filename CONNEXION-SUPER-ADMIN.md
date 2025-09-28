# 🔐 CONNEXION SUPER ADMIN

## 👤 IDENTIFIANTS SUPER ADMIN

**Email :** `awalehnasri@gmail.com`
**Mot de passe :** `Adnadmin@@`
**User ID :** `5c5731ce-75d0-4455-8184-bc42c626cb17`

---

## 🚀 PROCÉDURE DE CONNEXION

### 1. **Démarrer l'application**
```bash
npm run dev
```

### 2. **Se connecter**
- Aller sur : http://localhost:8080 (ou le port affiché)
- Utiliser les identifiants ci-dessus
- Cliquer "Se connecter"

### 3. **Accéder à l'interface Super Admin**
- Une fois connecté, aller sur : `/super-admin`
- Ou cliquer sur le lien "👑 Super Admin" dans la navigation

---

## 📧 CRÉER UNE INVITATION TENANT OWNER

### Dans l'interface Super Admin :

1. **Remplir le formulaire :**
   - Email du futur tenant owner
   - Nom complet
   - Nom de l'entreprise

2. **Cliquer "Envoyer l'invitation"**

3. **Vérifier l'email** (l'invitation sera envoyée à l'adresse spécifiée)

---

## 🧪 TEST COMPLET DU FLUX

### Étape 1 : Invitation
- Connectez-vous comme Super Admin
- Créez une invitation pour un email de test

### Étape 2 : Réception
- Vérifiez l'email d'invitation
- Cliquez sur le lien dans l'email

### Étape 3 : Validation automatique
- Le lien devrait maintenant rediriger vers `/auth/callback`
- Page "Confirmation en cours..." s'affiche
- Redirection automatique vers dashboard

### Étape 4 : Vérification
- Le nouveau tenant owner devrait être connecté
- Tenant, profil, et employé créés automatiquement
- Accès complet à son espace tenant

---

## ⚠️ NOTES IMPORTANTES

- **Super Admin** : Accès global, peut créer des invitations
- **Tenant Owner** : Accès limité à son tenant après invitation
- **Webhook configuré** : Processus automatique après clic sur lien email
- **Page callback** : Gère la transition fluide

---

## 🔧 EN CAS DE PROBLÈME

### Problème de connexion Super Admin :
```sql
-- Vérifier dans Supabase Dashboard > SQL Editor
SELECT email, encrypted_password FROM auth.users 
WHERE email = 'awalehnasri@gmail.com';
```

### Problème d'accès Super Admin :
```sql
-- Vérifier les rôles
SELECT * FROM public.profiles 
WHERE user_id = '5c5731ce-75d0-4455-8184-bc42c626cb17';
```

### Problème d'envoi d'invitation :
- Vérifier que la clé API Resend est configurée
- Vérifier les logs dans Supabase Dashboard > Edge Functions

---

**Vous êtes prêt à tester le système complet !** 🚀

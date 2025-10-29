# 🚀 GUIDE DE DÉPLOIEMENT - SYSTÈME D'ONBOARDING COMPLET

## 📋 **CHECKLIST DE DÉPLOIEMENT**

### **✅ ÉTAPE 1 : FONCTION SQL RPC**
```sql
-- Exécuter dans Supabase Dashboard > SQL Editor
-- Fichier: create-onboard-function.sql
```
- [ ] Fonction `onboard_tenant_owner` créée
- [ ] Test manuel de la fonction avec des données fictives
- [ ] Vérification des contraintes et erreurs

### **✅ ÉTAPE 2 : EDGE FUNCTION**
```bash
# Déployer l'Edge Function
supabase functions deploy onboard-tenant-owner
```
- [ ] Edge Function déployée avec succès
- [ ] Logs accessibles dans Dashboard > Edge Functions
- [ ] Test manuel avec curl ou Postman

### **✅ ÉTAPE 3 : POLITIQUES RLS**
```sql
-- Exécuter dans Supabase Dashboard > SQL Editor
-- Fichier: create-rls-policies.sql
```
- [ ] RLS activé sur toutes les tables principales
- [ ] Politiques basées sur `user_roles` créées
- [ ] Test d'isolation entre tenants

### **✅ ÉTAPE 4 : INTERFACE REACT**
- [ ] Page `/invite` ajoutée et fonctionnelle
- [ ] Route configurée dans `App.tsx`
- [ ] Gestion des erreurs et états de chargement
- [ ] Interface de connexion intégrée

### **✅ ÉTAPE 5 : TESTS AUTOMATISÉS**
```bash
# Exécuter les tests
node test-onboarding-complete.js
```
- [ ] Tests RPC passent
- [ ] Tests Edge Function passent
- [ ] Tests d'idempotence OK
- [ ] Tests de sécurité OK

---

## 🎯 **DEFINITION OF DONE**

### **Flux Complet Fonctionnel**
- [ ] **Création invitation** → Super Admin peut créer des invitations
- [ ] **Email envoyé** → Lien vers `/invite?code=<uuid>`
- [ ] **Clic utilisateur** → Redirection vers page d'invitation
- [ ] **Authentification** → Utilisateur se connecte si nécessaire
- [ ] **Onboarding automatique** → Edge Function → RPC → Tout créé
- [ ] **Redirection dashboard** → Utilisateur arrive sur son espace

### **Données Créées Correctement**
- [ ] **Tenant** créé avec slug unique
- [ ] **Profil** utilisateur lié au tenant
- [ ] **Employé** avec employee_id auto-généré (EMP001, EMP002...)
- [ ] **Rôle tenant_admin** assigné dans `user_roles`
- [ ] **Invitation** marquée comme `accepted_at`

### **Sécurité et Isolation**
- [ ] **RLS actif** sur toutes les tables sensibles
- [ ] **Isolation tenant** → Utilisateur A ne voit pas les données de tenant B
- [ ] **Permissions** → Seuls les admins peuvent créer des invitations
- [ ] **Tokens** → Jamais de service_role côté client

### **Idempotence et Robustesse**
- [ ] **Double clic invitation** → Pas de doublons
- [ ] **Double appel RPC** → Gestion correcte des conflits
- [ ] **Erreurs gracieuses** → Messages d'erreur clairs
- [ ] **Rollback** → En cas d'erreur, pas de données partielles

---

## 🧪 **TESTS DE VALIDATION**

### **Test 1 : Invitation Valide**
```bash
# 1. Créer invitation via Super Admin
# 2. Cliquer sur lien email
# 3. Se connecter si nécessaire
# 4. Vérifier redirection dashboard
# 5. Vérifier données créées en DB
```

### **Test 2 : Invitation Expirée**
```bash
# 1. Créer invitation avec expires_at dans le passé
# 2. Cliquer sur lien
# 3. Vérifier message d'erreur approprié
```

### **Test 3 : Email Mismatch**
```bash
# 1. Créer invitation pour user@example.com
# 2. Se connecter avec autre@example.com
# 3. Vérifier rejet avec message clair
```

### **Test 4 : Isolation Tenant**
```bash
# 1. Créer 2 tenants avec utilisateurs différents
# 2. Vérifier que User A ne voit pas les données de Tenant B
# 3. Tester sur toutes les tables principales
```

### **Test 5 : Idempotence**
```bash
# 1. Accepter une invitation
# 2. Essayer de l'accepter à nouveau
# 3. Vérifier pas de doublons en DB
```

---

## 🔧 **CONFIGURATION REQUISE**

### **Variables d'Environnement**
```env
# Dans .env.local (React)
VITE_SUPABASE_URL=https://qliinxtanjdnwxlvnxji.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Dans Supabase Edge Functions (automatique)
SUPABASE_URL=https://qliinxtanjdnwxlvnxji.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Rôles Requis en DB**
```sql
-- Vérifier que le rôle tenant_admin existe
SELECT * FROM public.roles WHERE name = 'tenant_admin';

-- Si absent, le créer :
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role)
VALUES ('tenant_admin', 'Administrateur Tenant', 'Administrateur complet d\'un tenant', 100, true);
```

---

## 🚨 **DÉPANNAGE COURANT**

### **Erreur : "role_tenant_admin_missing"**
```sql
-- Créer le rôle manquant
INSERT INTO public.roles (name, display_name, description)
VALUES ('tenant_admin', 'Administrateur Tenant', 'Admin complet du tenant');
```

### **Erreur : "invalid_or_expired_invite"**
- Vérifier que l'invitation existe et n'est pas expirée
- Vérifier que `status = 'pending'` et `accepted_at IS NULL`
- Vérifier correspondance email exacte

### **Erreur : Edge Function 401/403**
- Vérifier que le token est bien passé dans Authorization header
- Vérifier que l'utilisateur est authentifié
- Vérifier les permissions de l'Edge Function

### **RLS bloque tout**
- Vérifier que les politiques RLS sont correctes
- Vérifier que `user_roles` contient bien les associations
- Tester avec un utilisateur ayant les bons rôles

---

## 📊 **MONITORING ET LOGS**

### **Logs à Surveiller**
- **Edge Functions** → Dashboard > Edge Functions > Logs
- **Database** → Dashboard > Logs > Database
- **Auth** → Dashboard > Logs > Auth

### **Métriques Importantes**
- Taux de succès des invitations
- Temps de réponse Edge Function
- Erreurs RLS (accès refusé)
- Invitations expirées non utilisées

---

## 🎉 **VALIDATION FINALE**

Une fois tous les éléments déployés :

1. **Créer une vraie invitation** via l'interface Super Admin
2. **Utiliser un email réel** pour recevoir le lien
3. **Suivre le processus complet** de bout en bout
4. **Vérifier l'arrivée sur le dashboard** avec toutes les données
5. **Tester l'isolation** en créant un second tenant

**Si tout fonctionne → Le système d'onboarding est opérationnel ! 🚀**

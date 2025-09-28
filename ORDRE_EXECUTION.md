# Ordre d'exécution - Système d'invitation Wadashaqeen

## ⚠️ IMPORTANT : Ordre strict à respecter

### Phase 1 : Résoudre les problèmes RLS actuels
```bash
# 1. Exécuter dans Supabase SQL Editor
# Copier le contenu de fix-rls-simple.sql et l'exécuter
```
**Fichier :** `fix-rls-simple.sql`
**Status :** ✅ Prêt à exécuter
**Objectif :** Résoudre toutes les erreurs `tenant_members does not exist`

### Phase 1.5 : Corriger les fonctions tenant_members
```bash
# 1.5. Exécuter dans Supabase SQL Editor APRÈS Phase 1
# Copier le contenu de fix-tenant-functions.sql et l'exécuter
```
**Fichier :** `fix-tenant-functions.sql`
**Status :** ✅ Prêt à exécuter
**Objectif :** Corriger get_user_tenant_id() et get_user_actual_tenant_id() pour utiliser profiles.tenant_id

### Phase 2 : Créer le système d'invitations
```bash
# 2. Exécuter dans Supabase SQL Editor
# Copier le contenu de 01_create_invitations_system.sql et l'exécuter
```
**Fichier :** `01_create_invitations_system.sql`
**Status :** ✅ Prêt à exécuter
**Objectif :** Créer table invitations, rôle super_admin, fonctions utilitaires

### Phase 3 : Créer le processus d'inscription
```bash
# 3. Exécuter dans Supabase SQL Editor
# Copier le contenu de 03_create_tenant_signup_process.sql et l'exécuter
```
**Fichier :** `03_create_tenant_signup_process.sql`
**Status :** ✅ Prêt à exécuter
**Objectif :** Fonctions pour inscription tenant owner

### Phase 4 : Déployer la fonction d'invitation
```bash
# 4. Déployer la Edge Function
supabase functions deploy send-invitation
```
**Fichier :** `supabase/functions/send-invitation/index.ts`
**Status :** ✅ Prêt à déployer
**Prérequis :** Configurer RESEND_API_KEY dans Supabase

### Phase 5 : Créer le premier Super Admin
```bash
# 5. Exécuter le script Node.js
node create-super-admin.js
```
**Fichier :** `create-super-admin.js`
**Status :** ✅ Prêt à exécuter
**Prérequis :** Variables d'environnement configurées

### Phase 6 : Développer l'interface Super Admin
- Créer `src/pages/super-admin/dashboard.tsx`
- Créer `src/components/super-admin/InvitationForm.tsx`
- Créer `src/components/super-admin/TenantsList.tsx`
- Modifier le routing pour protéger les routes Super Admin

### Phase 7 : Développer l'inscription tenant owner
- Créer `src/pages/signup/tenant-owner.tsx`
- Créer les hooks pour validation token et inscription
- Modifier `TenantContext` pour gérer Super Admin

## Variables d'environnement requises

```env
# Dans .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Dans Supabase Dashboard > Settings > Edge Functions
RESEND_API_KEY=your_resend_api_key
SITE_URL=https://your-domain.com
```

## Vérifications après chaque phase

### Après Phase 1 :
- [ ] Plus d'erreurs `tenant_members does not exist`
- [ ] Application fonctionne normalement

### Après Phase 2 :
- [ ] Table `invitations` créée
- [ ] Rôle `super_admin` existe
- [ ] Fonctions `is_super_admin()` disponible

### Après Phase 3 :
- [ ] Fonctions d'inscription créées
- [ ] Triggers de slug fonctionnels

### Après Phase 4 :
- [ ] Edge Function déployée
- [ ] Test d'envoi d'email réussi

### Après Phase 5 :
- [ ] Super Admin créé avec succès
- [ ] Connexion Super Admin possible

## Tests recommandés

1. **Test complet du flux :**
   - Connexion Super Admin
   - Envoi invitation
   - Réception email
   - Inscription tenant owner
   - Connexion tenant owner

2. **Test sécurité :**
   - Accès Super Admin restreint
   - Validation tokens
   - Expiration invitations

## Rollback en cas de problème

Si problème en Phase 2+ :
```sql
-- Supprimer les modifications
DROP TABLE IF EXISTS public.invitations;
DELETE FROM public.roles WHERE name = 'super_admin';
-- Restaurer tenant_id NOT NULL si nécessaire
ALTER TABLE public.profiles ALTER COLUMN tenant_id SET NOT NULL;
```

## Support et dépannage

- Logs Supabase : Dashboard > Logs
- Edge Functions : Dashboard > Edge Functions > Logs  
- Database : Dashboard > SQL Editor pour requêtes debug

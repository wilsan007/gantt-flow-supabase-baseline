# 🚀 Plan d'Action Sécurité - Implémentation Concrète

## 📋 Phase 1 : URGENT (1-2 mois)

### **🚨 Action 1 : Implémenter MFA/2FA**

**Priorité** : CRITIQUE  
**Effort** : 3 jours  
**Impact** : +9 points (0→9/10)

#### **Implémentation Supabase (Natif)**

```typescript
// 1. Créer composant MFASetup.tsx
// src/components/auth/MFASetup.tsx

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';

export const MFASetup = () => {
  const [qrCode, setQrCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Étape 1 : Enrollment
  const handleEnroll = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'My Authenticator App'
    });

    if (data) {
      setQrCode(data.totp.qr_code);
      setFactorId(data.id);
    }
  };

  // Étape 2 : Vérification
  const handleVerify = async () => {
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      code: verificationCode
    });

    if (data) {
      alert('MFA activé avec succès !');
    }
  };

  return (
    <div className="space-y-4">
      {!qrCode ? (
        <button onClick={handleEnroll} className="btn-primary">
          Activer l'authentification à deux facteurs
        </button>
      ) : (
        <>
          <h3>Scannez ce QR Code avec votre app authenticator</h3>
          <QRCodeSVG value={qrCode} size={256} />

          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Code à 6 chiffres"
            maxLength={6}
          />

          <button onClick={handleVerify} className="btn-primary">
            Vérifier et activer
          </button>
        </>
      )}
    </div>
  );
};
```

```typescript
// 2. Modifier le processus de login
// src/pages/Login.tsx

const handleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error?.message === 'MFA verification required') {
    // Afficher input pour code MFA
    setShowMFAInput(true);
    return;
  }

  // Login réussi
  navigate('/dashboard');
};

const handleMFAVerification = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.verifyOtp({
    token: mfaCode,
    type: 'totp',
  });

  if (session) {
    navigate('/dashboard');
  }
};
```

```typescript
// 3. Composant Settings pour gérer MFA
// src/components/settings/SecuritySettings.tsx

export const SecuritySettings = () => {
  const [mfaFactors, setMfaFactors] = useState([]);

  useEffect(() => {
    loadMFAFactors();
  }, []);

  const loadMFAFactors = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setMfaFactors(data?.totp || []);
  };

  const handleUnenroll = async (factorId: string) => {
    await supabase.auth.mfa.unenroll({ factorId });
    loadMFAFactors();
  };

  return (
    <div>
      <h2>Authentification à deux facteurs</h2>

      {mfaFactors.length === 0 ? (
        <MFASetup />
      ) : (
        <div>
          <p>✅ MFA activé</p>
          {mfaFactors.map(factor => (
            <div key={factor.id}>
              <span>{factor.friendly_name}</span>
              <button onClick={() => handleUnenroll(factor.id)}>
                Désactiver
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

**Dépendances à installer** :

```bash
npm install qrcode.react
```

**Checklist** :

- [ ] Créer composant `MFASetup.tsx`
- [ ] Modifier `Login.tsx` pour gérer MFA
- [ ] Ajouter page Settings avec `SecuritySettings.tsx`
- [ ] Tester enrollment complet
- [ ] Tester login avec MFA
- [ ] Documenter pour utilisateurs

---

### **🟠 Action 2 : Ajouter OAuth Social**

**Priorité** : HAUTE  
**Effort** : 2 jours  
**Impact** : +5 points (3→8/10)

#### **Configuration Supabase Dashboard**

1. **Google OAuth** :

```
Supabase Dashboard → Authentication → Providers → Google

1. Créer projet Google Cloud Console
2. Activer Google+ API
3. Créer OAuth 2.0 credentials
   - Authorized JavaScript origins : https://votre-domaine.com
   - Authorized redirect URIs :
     https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/callback

4. Copier Client ID et Client Secret dans Supabase

5. Activer "Enable Sign in with Google"
```

2. **Microsoft OAuth** :

```
Supabase Dashboard → Authentication → Providers → Azure

1. Azure Portal → App registrations → New registration
2. Redirect URI : https://qliinxtanjdnwxlvnxji.supabase.co/auth/v1/callback
3. API permissions : User.Read
4. Certificates & secrets → New client secret
5. Copier Application ID et Secret dans Supabase
```

#### **Implémentation Frontend**

```typescript
// src/components/auth/SocialAuth.tsx

export const SocialAuth = () => {
  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  const handleMicrosoftLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email profile openid',
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <img src="/google-icon.svg" className="w-5 h-5" />
        <span>Continuer avec Google</span>
      </button>

      <button
        onClick={handleMicrosoftLogin}
        className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <img src="/microsoft-icon.svg" className="w-5 h-5" />
        <span>Continuer avec Microsoft</span>
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Ou</span>
        </div>
      </div>
    </div>
  );
};
```

```typescript
// src/pages/AuthCallback.tsx (déjà existant, vérifier)

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase gère automatiquement le callback OAuth
    // On vérifie juste la session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Créer profil si première connexion OAuth
        createProfileIfNeeded(session.user);
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    });
  }, []);

  return <div>Connexion en cours...</div>;
};
```

**Checklist** :

- [ ] Configurer Google OAuth dans Supabase
- [ ] Configurer Microsoft OAuth dans Supabase
- [ ] Créer composant `SocialAuth.tsx`
- [ ] Intégrer dans page Login
- [ ] Vérifier `AuthCallback.tsx`
- [ ] Tester flux complet Google
- [ ] Tester flux complet Microsoft
- [ ] Télécharger icônes Google/Microsoft

---

### **⚡ Action 3 : Configurer CSP Headers**

**Priorité** : HAUTE  
**Effort** : 1 heure  
**Impact** : +4 points (5→9/10)

#### **Configuration Vite (vite.config.ts)**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://qliinxtanjdnwxlvnxji.supabase.co wss://qliinxtanjdnwxlvnxji.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),

      // Autres headers sécurité
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    },
  },
});
```

#### **Configuration Production (Nginx)**

```nginx
# /etc/nginx/sites-available/wadashaqayn.com

server {
    listen 443 ssl http2;
    server_name wadashaqayn.com;

    # Headers sécurité
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://qliinxtanjdnwxlvnxji.supabase.co wss://qliinxtanjdnwxlvnxji.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # HSTS (31536000 = 1 an)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # ... reste de la config
}
```

#### **Configuration Cloudflare (Alternative)**

```
Cloudflare Dashboard → votre-site → Security → Custom Rules

1. Créer "Transform Rule" : Modify Response Header

   Header Name : Content-Security-Policy
   Value : default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'...

2. Créer règles pour autres headers (X-Frame-Options, etc.)
```

**Checklist** :

- [ ] Modifier `vite.config.ts`
- [ ] Tester en dev (`npm run dev`)
- [ ] Configurer Nginx en production
- [ ] Ou configurer Cloudflare
- [ ] Tester avec https://securityheaders.com/
- [ ] Vérifier que l'app fonctionne (pas de console errors)
- [ ] Ajuster CSP si nécessaire

---

### **📄 Action 4 : Privacy Policy + Terms of Service**

**Priorité** : HAUTE (Légal)  
**Effort** : 2 jours  
**Impact** : +2 points + Conformité légale

#### **Templates à Créer**

```markdown
# 1. privacy-policy.md

# Politique de Confidentialité

## 1. Responsable du traitement

- Nom : Wadashaqayn SaaS
- Email : privacy@wadashaqayn.com
- Adresse : [Votre adresse]

## 2. Données collectées

### Données d'identification

- Nom, prénom, email
- Mot de passe (hashé avec bcrypt)
- Date de création du compte

### Données d'utilisation

- Logs de connexion (date, IP, user-agent)
- Actions effectuées dans l'application
- Données de navigation (analytics)

### Cookies

- Session : Authentification
- Analytics : Google Analytics (optionnel)

## 3. Finalités du traitement

- Fourniture du service
- Support technique
- Amélioration du produit
- Conformité légale

## 4. Durée de conservation

- Données compte actif : Durée du contrat
- Données compte supprimé : 30 jours (backup)
- Logs : 1 an

## 5. Droits des utilisateurs (GDPR)

- Droit d'accès (export données)
- Droit de rectification
- Droit à l'effacement
- Droit à la portabilité
- Droit d'opposition

Contact : privacy@wadashaqayn.com

## 6. Sous-traitants

- Supabase (hébergement base de données)
  - Localisation : Europe (Ireland)
  - Certifications : SOC 2, ISO 27001

## 7. Sécurité

- Encryption AES-256 at rest
- TLS 1.3 in transit
- Authentification à deux facteurs (optionnel)
- Audit logs

## 8. Notification de breach

En cas de violation de données, nous notifierons :

- Les autorités (CNIL) sous 72h
- Les utilisateurs affectés sous 72h

## 9. Modification de la politique

Dernière mise à jour : [DATE]
Notifications des changements par email

## 10. Contact DPO

Email : dpo@wadashaqayn.com
```

```markdown
# 2. terms-of-service.md

# Conditions Générales d'Utilisation

## 1. Objet

Les présentes CGU régissent l'utilisation de Wadashaqayn SaaS.

## 2. Acceptation

L'utilisation du service implique l'acceptation des CGU.

## 3. Services fournis

- Gestion de projets et tâches
- Collaboration en équipe
- Stockage de fichiers (limites selon plan)
- Support technique

## 4. Inscription

- Email valide requis
- Informations exactes
- Responsabilité du mot de passe

## 5. Utilisation acceptable

Interdit :

- Usage illégal
- Spam, phishing
- Tentatives de hack
- Revente du service

## 6. Propriété intellectuelle

- Le code reste propriété de Wadashaqayn
- Les données client restent propriété du client
- Licence d'utilisation non exclusive

## 7. Tarification

- Plans : Free, Pro, Enterprise
- Facturation mensuelle/annuelle
- Modifications avec préavis 30 jours

## 8. Résiliation

- Par le client : À tout moment
- Par Wadashaqayn : Avec préavis 30 jours
- Export des données disponible

## 9. Garanties et responsabilités

- Service fourni "tel quel"
- Disponibilité : 99.5% (SLA Enterprise)
- Backups quotidiens
- Limitation de responsabilité

## 10. Modifications des CGU

- Notifications par email
- Refus = résiliation possible

## 11. Loi applicable

- Droit français
- Tribunaux de Paris

Contact : legal@wadashaqayn.com
Dernière mise à jour : [DATE]
```

**Pages Web à Créer** :

```tsx
// src/pages/PrivacyPolicy.tsx
// src/pages/TermsOfService.tsx
```

**Checklist** :

- [ ] Rédiger Privacy Policy (adapter template)
- [ ] Rédiger Terms of Service
- [ ] Créer pages web
- [ ] Ajouter liens dans footer
- [ ] Checkbox "J'accepte les CGU" à l'inscription
- [ ] Faire valider par avocat (recommandé)

---

### **🗂️ Action 5 : GDPR Export/Delete**

**Priorité** : HAUTE (Légal)  
**Effort** : 3 jours  
**Impact** : +1 point + Conformité GDPR

#### **API Endpoint Export Données**

```typescript
// src/api/gdpr-export.ts

export const exportUserData = async (userId: string) => {
  const { currentTenant } = useTenant();

  // Récupérer toutes les données utilisateur
  const [profile, tasks, projects, comments, attachments] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).single(),
    supabase.from('tasks').select('*').eq('created_by', userId),
    supabase.from('projects').select('*').eq('created_by', userId),
    supabase.from('comments').select('*').eq('user_id', userId),
    supabase.from('task_attachments').select('*').eq('uploaded_by', userId),
  ]);

  const exportData = {
    export_date: new Date().toISOString(),
    user_id: userId,
    data: {
      profile: profile.data,
      tasks: tasks.data,
      projects: projects.data,
      comments: comments.data,
      attachments: attachments.data?.map(a => ({
        ...a,
        file_url: `Télécharger séparément: ${a.storage_path}`,
      })),
    },
    metadata: {
      format: 'JSON',
      version: '1.0',
      compliance: 'GDPR Article 20 (Right to data portability)',
    },
  };

  // Générer fichier JSON
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });

  // Télécharger
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wadashaqayn-export-${Date.now()}.json`;
  a.click();
};
```

#### **API Endpoint Suppression Compte**

```typescript
// src/api/gdpr-delete.ts

export const deleteUserAccount = async (userId: string) => {
  // Confirmation obligatoire
  const confirmed = window.confirm(
    'Êtes-vous sûr de vouloir supprimer votre compte ? ' +
      'Cette action est irréversible. ' +
      'Toutes vos données seront supprimées dans 30 jours.'
  );

  if (!confirmed) return;

  try {
    // 1. Marquer pour suppression (soft delete)
    await supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        deletion_scheduled: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('user_id', userId);

    // 2. Anonymiser immédiatement les données sensibles
    await supabase
      .from('profiles')
      .update({
        email: `deleted_${userId}@anonymous.local`,
        first_name: 'Deleted',
        last_name: 'User',
        phone: null,
      })
      .eq('user_id', userId);

    // 3. Révoquer toutes les sessions
    await supabase.auth.admin.signOut(userId, 'global');

    // 4. Envoyer email de confirmation
    await sendEmail({
      to: profile.email, // email original
      subject: 'Confirmation de suppression de compte',
      body: 'Votre compte sera définitivement supprimé dans 30 jours...',
    });

    // 5. Déconnecter l'utilisateur
    await supabase.auth.signOut();

    return { success: true };
  } catch (error) {
    console.error('Erreur suppression compte:', error);
    return { success: false, error };
  }
};
```

#### **Cron Job Suppression Définitive**

```sql
-- supabase/migrations/XXXXXX_gdpr_deletion_cron.sql

-- Fonction de suppression définitive
CREATE OR REPLACE FUNCTION gdpr_permanent_delete()
RETURNS void AS $$
BEGIN
  -- Supprimer les comptes marqués pour suppression > 30 jours
  DELETE FROM profiles
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';

  -- Log l'action
  INSERT INTO audit_logs (action, details)
  VALUES ('gdpr_permanent_delete', jsonb_build_object('deleted_at', NOW()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron job : exécuter chaque jour à 2h du matin
SELECT cron.schedule(
  'gdpr-permanent-deletion',
  '0 2 * * *', -- Chaque jour à 2h
  $$SELECT gdpr_permanent_delete()$$
);
```

**Composant UI Settings** :

```tsx
// src/components/settings/AccountDeletion.tsx

export const AccountDeletion = () => {
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    await exportUserData(user.id);
    setExportLoading(false);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    const result = await deleteUserAccount(user.id);
    if (result.success) {
      toast.success('Votre compte sera supprimé dans 30 jours');
      navigate('/');
    } else {
      toast.error('Erreur lors de la suppression');
    }
    setDeleteLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3>Exporter mes données (RGPD)</h3>
        <p>Téléchargez toutes vos données au format JSON</p>
        <button onClick={handleExport} disabled={exportLoading}>
          {exportLoading ? 'Export en cours...' : 'Exporter mes données'}
        </button>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-red-600">Zone de danger</h3>
        <p>Supprimer définitivement votre compte et toutes vos données</p>
        <button onClick={handleDelete} disabled={deleteLoading} className="bg-red-600 text-white">
          {deleteLoading ? 'Suppression...' : 'Supprimer mon compte'}
        </button>
        <p className="text-sm text-gray-500">
          Vos données seront conservées 30 jours avant suppression définitive
        </p>
      </div>
    </div>
  );
};
```

**Checklist** :

- [ ] Créer API `gdpr-export.ts`
- [ ] Créer API `gdpr-delete.ts`
- [ ] Créer migration cron job
- [ ] Créer composant `AccountDeletion.tsx`
- [ ] Ajouter dans Settings
- [ ] Tester export données
- [ ] Tester suppression compte
- [ ] Documenter processus

---

## 📊 Récapitulatif Phase 1

### **Timeline**

```
Semaine 1 :
  ├─ Jour 1-3 : MFA/2FA (3 jours)
  └─ Jour 4-5 : OAuth Social (2 jours)

Semaine 2 :
  ├─ Jour 1 : CSP Headers (1h) + tests
  ├─ Jour 2-3 : Privacy Policy + ToS (2 jours)
  └─ Jour 4-5 : GDPR Export/Delete (3 jours)

Total : 10 jours ouvrés
```

### **Résultat Attendu**

**Avant Phase 1** : 74/100  
**Après Phase 1** : 87/100  
**Gain** : +13 points

**Niveau** : Comparable à Notion (88), Linear (85)

---

## 📝 Checklist Finale Phase 1

```
Sécurité :
  [ ] MFA/2FA implémenté et testé
  [ ] OAuth Google fonctionnel
  [ ] OAuth Microsoft fonctionnel
  [ ] CSP Headers configurés
  [ ] Test securityheaders.com = A+

Légal :
  [ ] Privacy Policy rédigée
  [ ] Terms of Service rédigés
  [ ] Pages web créées
  [ ] Liens dans footer
  [ ] Checkbox CGU à l'inscription

GDPR :
  [ ] Export données fonctionnel
  [ ] Suppression compte fonctionnelle
  [ ] Cron job configuré
  [ ] Emails de confirmation

Tests :
  [ ] Tous les flux testés en dev
  [ ] Tests manuels complets
  [ ] Déploiement en staging
  [ ] Tests utilisateurs beta
  [ ] Déploiement production

Documentation :
  [ ] Guide utilisateur MFA
  [ ] Guide développeur
  [ ] Changelog mis à jour
  [ ] Communication clients
```

---

**Prochaine étape** : Voir `SECURITY_ANALYSIS_PART2.md` pour Phase 2 (SAML/SSO, Monitoring, etc.)

**Date de création** : 29 Octobre 2025  
**Statut** : Plan d'action prêt à exécuter  
**ROI attendu** : 10x à 100x sur 12 mois

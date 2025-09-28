# Configuration des Variables d'Environnement Edge Functions

## 🔧 Variables à configurer dans Supabase Dashboard

### 1. Accéder aux Edge Functions
- Aller dans **Supabase Dashboard** → **Edge Functions** → **Settings**

### 2. Ajouter les variables d'environnement

#### Variable RESEND_API_KEY
- **Nom** : `RESEND_API_KEY`
- **Valeur** : `re_WmDoANsT_P8iwqbiPDq4mTEU1NzPaQipC`
- **Description** : Clé API pour l'envoi d'emails via Resend

#### Variable SITE_URL
- **Nom** : `SITE_URL`
- **Valeur** : `http://localhost:5173`
- **Description** : URL du site

### 3. Redéployer l'Edge Function
Après avoir ajouté les variables, redéployer la fonction `send-invitation` :

```bash
supabase functions deploy send-invitation
```

## ✅ Vérification
Une fois configuré, l'Edge Function `send-invitation` pourra envoyer des emails d'invitation sans erreur 500.

## 📝 Historique des clés API
- Ancienne clé : `re_EMJ1xXvS_8kVFxJDPM561CPuCA23FMpDJ`
- **Nouvelle clé** : `re_WmDoANsT_P8iwqbiPDq4mTEU1NzPaQipC`
## ✅ Une fois configuré :
La Edge Function sera prête à envoyer des emails d'invitation via Resend avec les liens pointant vers votre app locale.

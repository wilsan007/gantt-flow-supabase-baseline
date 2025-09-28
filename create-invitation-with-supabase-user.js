import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function createInvitationWithSupabaseUser() {
  console.log('🚀 CRÉATION INVITATION AVEC UTILISATEUR SUPABASE');
  console.log('================================================\n');

  const invitationData = {
    email: 'newuser@example.com',
    fullName: 'Nouvel Utilisateur',
    companyName: 'Ma Nouvelle Entreprise'
  };

  try {
    // 1. Créer l'utilisateur Supabase avec un mot de passe temporaire
    console.log('1️⃣ Création utilisateur Supabase...');
    
    const tempPassword = generateTempPassword();
    console.log(`   Mot de passe temporaire: ${tempPassword}`);

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: invitationData.email,
      password: tempPassword,
      email_confirm: false, // L'email ne sera pas confirmé automatiquement
      user_metadata: {
        full_name: invitationData.fullName,
        company_name: invitationData.companyName
      }
    });

    if (userError) {
      console.error('❌ Erreur création utilisateur:', userError);
      return;
    }

    console.log('✅ Utilisateur créé:', userData.user.id);

    // 2. Créer le tenant
    console.log('\n2️⃣ Création tenant...');
    
    const tenantId = crypto.randomUUID();
    const { error: tenantError } = await supabase
      .from('tenants')
      .insert({
        id: tenantId,
        name: invitationData.companyName,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (tenantError) {
      console.error('❌ Erreur création tenant:', tenantError);
      return;
    }

    console.log('✅ Tenant créé:', tenantId);

    // 3. Générer le token de confirmation Supabase
    console.log('\n3️⃣ Génération token de confirmation...');
    
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: invitationData.email,
      options: {
        redirectTo: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/tenant-signup`
      }
    });

    if (tokenError) {
      console.error('❌ Erreur génération token:', tokenError);
      return;
    }

    console.log('✅ Token généré:', tokenData.properties.action_link);

    // Extraire le token de l'URL
    const urlParams = new URL(tokenData.properties.action_link);
    const confirmationToken = urlParams.searchParams.get('token');

    // 4. Créer l'invitation avec le token Supabase
    console.log('\n4️⃣ Création invitation...');
    
    const { error: invitationError } = await supabase
      .from('invitations')
      .insert({
        id: crypto.randomUUID(),
        token: confirmationToken, // Utiliser le token Supabase
        email: invitationData.email,
        full_name: invitationData.fullName,
        tenant_id: tenantId,
        tenant_name: invitationData.companyName,
        invitation_type: 'tenant_owner',
        invited_by: '5c5731ce-75d0-4455-8184-bc42c626cb17', // ID de l'admin
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
        metadata: {
          temp_password: tempPassword,
          supabase_user_id: userData.user.id,
          confirmation_url: tokenData.properties.action_link
        }
      });

    if (invitationError) {
      console.error('❌ Erreur création invitation:', invitationError);
      return;
    }

    console.log('✅ Invitation créée avec succès');

    // 5. Afficher le résumé
    console.log('\n📊 RÉSUMÉ:');
    console.log('─────────────────────────────────────');
    console.log(`📧 Email: ${invitationData.email}`);
    console.log(`👤 Nom: ${invitationData.fullName}`);
    console.log(`🏢 Entreprise: ${invitationData.companyName}`);
    console.log(`🔐 Mot de passe temporaire: ${tempPassword}`);
    console.log(`🆔 User ID: ${userData.user.id}`);
    console.log(`🏢 Tenant ID: ${tenantId}`);
    console.log(`🎫 Token: ${confirmationToken}`);
    console.log(`🔗 Lien de confirmation: ${tokenData.properties.action_link}`);

    console.log('\n🎯 PROCESSUS POUR L\'UTILISATEUR:');
    console.log('1. Cliquer sur le lien de confirmation');
    console.log('2. L\'email sera automatiquement confirmé');
    console.log('3. Le trigger créera automatiquement le tenant owner');
    console.log('4. L\'utilisateur pourra se connecter avec le mot de passe temporaire');
    console.log('5. Il pourra ensuite changer son mot de passe');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

function generateTempPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Exécuter la création
createInvitationWithSupabaseUser();

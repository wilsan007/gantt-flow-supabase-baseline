import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function debugEmailConfirmationStatus() {
  console.log('🔍 DIAGNOSTIC: EMAIL NOT CONFIRMED');
  console.log('=================================\n');

  try {
    // 1. Vérifier tous les utilisateurs et leur statut de confirmation
    console.log('1️⃣ Vérification des utilisateurs auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur récupération utilisateurs:', authError);
      return;
    }

    console.log(`📊 Total utilisateurs: ${authUsers.users.length}\n`);

    // Analyser chaque utilisateur
    authUsers.users.forEach((user, index) => {
      console.log(`👤 Utilisateur ${index + 1}:`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Email confirmé: ${user.email_confirmed_at ? '✅ OUI' : '❌ NON'}`);
      console.log(`   - Date confirmation: ${user.email_confirmed_at || 'Non confirmé'}`);
      console.log(`   - Créé le: ${user.created_at}`);
      console.log(`   - Dernière connexion: ${user.last_sign_in_at || 'Jamais'}`);
      console.log(`   - Statut: ${user.banned_until ? 'Banni' : 'Actif'}`);
      console.log('');
    });

    // 2. Chercher spécifiquement l'utilisateur test234@yahoo.com
    console.log('2️⃣ Recherche utilisateur test234@yahoo.com...');
    const testUser = authUsers.users.find(u => u.email === 'test234@yahoo.com');
    
    if (testUser) {
      console.log('✅ Utilisateur trouvé:');
      console.log(`   - ID: ${testUser.id}`);
      console.log(`   - Email confirmé: ${testUser.email_confirmed_at ? '✅ OUI' : '❌ NON'}`);
      console.log(`   - Date confirmation: ${testUser.email_confirmed_at}`);
      
      if (!testUser.email_confirmed_at) {
        console.log('\n🔧 SOLUTION: Email non confirmé !');
        console.log('   Pour confirmer manuellement:');
        console.log(`   1. Aller dans Supabase Dashboard > Authentication > Users`);
        console.log(`   2. Trouver l'utilisateur ${testUser.email}`);
        console.log(`   3. Cliquer sur "Confirm email"`);
        console.log(`   4. Ou utiliser l'API admin pour confirmer`);
        
        // Proposer de confirmer automatiquement
        console.log('\n🚀 Tentative de confirmation automatique...');
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
          testUser.id,
          { email_confirm: true }
        );
        
        if (updateError) {
          console.error('❌ Erreur confirmation automatique:', updateError);
        } else {
          console.log('✅ Email confirmé automatiquement !');
          console.log('   Utilisateur peut maintenant se connecter');
        }
      }
    } else {
      console.log('❌ Utilisateur test234@yahoo.com non trouvé');
    }

    // 3. Vérifier les invitations
    console.log('\n3️⃣ Vérification des invitations...');
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', 'test234@yahoo.com');
    
    if (invError) {
      console.error('❌ Erreur récupération invitations:', invError);
    } else {
      console.log(`📧 Invitations pour test234@yahoo.com: ${invitations.length}`);
      invitations.forEach(inv => {
        console.log(`   - Status: ${inv.status}`);
        console.log(`   - Type: ${inv.invitation_type}`);
        console.log(`   - Token: ${inv.token}`);
        console.log(`   - Expire: ${inv.expires_at}`);
      });
    }

    // 4. Test de connexion après confirmation
    if (testUser && testUser.email_confirmed_at) {
      console.log('\n4️⃣ Test de connexion...');
      // Note: On ne peut pas tester la connexion avec mot de passe ici
      // car on n'a pas le mot de passe de l'utilisateur
      console.log('ℹ️ Email confirmé, connexion devrait fonctionner');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le diagnostic
debugEmailConfirmationStatus();

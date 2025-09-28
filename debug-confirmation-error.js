import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function debugConfirmationError() {
  console.log('🔍 DEBUG: ERREUR CONFIRMATION UTILISATEUR');
  console.log('========================================\n');

  const token = "683423da4b228d5ec39c0c6b2ccf1a71448078027c222cd723a5b088";

  try {
    // 1. Analyser l'erreur de confirmation
    console.log('1️⃣ Analyse de l\'erreur de confirmation...');
    console.log(`Token: ${token}`);
    console.log('Erreur: server_error - unexpected_failure');
    console.log('Description: Error confirming user\n');

    // 2. Vérifier si l'utilisateur existe avec ce token
    console.log('2️⃣ Recherche de l\'invitation avec ce token...');
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (invError) {
      console.error('❌ Erreur recherche invitation:', invError);
    } else {
      console.log('✅ Invitation trouvée:');
      console.log(`   - Email: ${invitation.email}`);
      console.log(`   - Status: ${invitation.status}`);
      console.log(`   - User ID: ${invitation.metadata?.supabase_user_id}`);
      console.log(`   - Expires: ${invitation.expires_at}`);
    }

    // 3. Vérifier l'utilisateur Supabase
    if (invitation?.metadata?.supabase_user_id) {
      console.log('\n3️⃣ Vérification utilisateur Supabase...');
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
        invitation.metadata.supabase_user_id
      );

      if (authError) {
        console.error('❌ Erreur récupération utilisateur:', authError);
      } else {
        console.log('✅ Utilisateur Supabase:');
        console.log(`   - ID: ${authUser.user.id}`);
        console.log(`   - Email: ${authUser.user.email}`);
        console.log(`   - Email confirmé: ${authUser.user.email_confirmed_at ? 'OUI' : 'NON'}`);
        console.log(`   - Créé: ${authUser.user.created_at}`);
      }
    }

    // 4. Solutions possibles
    console.log('\n4️⃣ SOLUTIONS POSSIBLES:');
    console.log('─────────────────────────────────────');
    
    if (invitation?.status === 'pending') {
      console.log('🔧 Solution 1: Confirmer manuellement l\'email');
      console.log('   - Aller dans Supabase Dashboard > Authentication > Users');
      console.log(`   - Chercher l'utilisateur ${invitation.email}`);
      console.log('   - Cliquer sur "Confirm email"');
      
      if (invitation.metadata?.supabase_user_id) {
        console.log('\n🔧 Solution 2: Confirmation automatique...');
        const { data: confirmData, error: confirmError } = await supabase.auth.admin.updateUserById(
          invitation.metadata.supabase_user_id,
          { email_confirm: true }
        );

        if (confirmError) {
          console.error('❌ Erreur confirmation automatique:', confirmError);
        } else {
          console.log('✅ Email confirmé automatiquement !');
          console.log('   Le trigger devrait maintenant s\'exécuter');
        }
      }
    }

    // 5. Vérifier le port de redirection
    console.log('\n5️⃣ PROBLÈME DE PORT:');
    console.log('─────────────────────────────────────');
    console.log('🔍 Port détecté: 8081');
    console.log('🎯 Port attendu: 8080');
    console.log('💡 Cause: window.location.origin détecte le port actuel du serveur');
    console.log('');
    console.log('Solutions:');
    console.log('1. Démarrer le serveur sur le port 8080');
    console.log('2. Ou modifier VITE_APP_URL="http://localhost:8081"');
    console.log('3. Ou utiliser un port fixe dans la configuration');

    // 6. Test de connexion après confirmation
    if (invitation && invitation.metadata?.temp_password) {
      console.log('\n6️⃣ Test de connexion avec mot de passe temporaire...');
      console.log(`Email: ${invitation.email}`);
      console.log(`Mot de passe: ${invitation.metadata.temp_password}`);
      
      // Créer un client avec la clé publique pour tester la connexion
      const publicSupabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY
      );

      const { data: signInData, error: signInError } = await publicSupabase.auth.signInWithPassword({
        email: invitation.email,
        password: invitation.metadata.temp_password
      });

      if (signInError) {
        console.log(`❌ Connexion échouée: ${signInError.message}`);
      } else {
        console.log('✅ Connexion réussie !');
        console.log('   L\'utilisateur peut maintenant se connecter normalement');
        await publicSupabase.auth.signOut();
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le debug
debugConfirmationError();

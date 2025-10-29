/**
 * 🔍 VÉRIFICATION - État de l'invitation dans la base
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkInvitationStatus() {
  console.log('🔍 ===== VÉRIFICATION ÉTAT INVITATION =====');
  
  const userEmail = 'testgser@yahooo.com';
  const userId = '328b48e0-500d-4419-a1cf-2c9986815eee';

  try {
    // Vérifier l'invitation
    console.log('📧 Recherche invitation pour:', userEmail);
    
    const { data: invitations, error: invError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('email', userEmail);

    if (invError) {
      console.error('❌ Erreur recherche invitation:', invError);
      return;
    }

    console.log('📊 Invitations trouvées:', invitations?.length || 0);
    
    if (invitations && invitations.length > 0) {
      invitations.forEach((inv, index) => {
        console.log(`\n📋 Invitation ${index + 1}:`);
        console.log('   - ID:', inv.id);
        console.log('   - Email:', inv.email);
        console.log('   - Status:', inv.status);
        console.log('   - Token présent:', !!inv.token);
        console.log('   - Token (début):', inv.token?.substring(0, 20) + '...');
        console.log('   - Créée le:', inv.created_at);
        console.log('   - Expire le:', inv.expires_at);
        console.log('   - Acceptée le:', inv.accepted_at);
        console.log('   - Metadata présente:', !!inv.metadata);
        
        if (inv.metadata) {
          const metadata = typeof inv.metadata === 'string' ? JSON.parse(inv.metadata) : inv.metadata;
          console.log('   - Supabase User ID:', metadata.supabase_user_id);
          console.log('   - Fresh Token:', metadata.fresh_token ? 'PRÉSENT' : 'ABSENT');
        }
      });
    } else {
      console.log('❌ Aucune invitation trouvée pour cet email');
    }

    // Vérifier l'utilisateur
    console.log('\n👤 Vérification utilisateur:', userId);
    
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError);
      return;
    }

    console.log('📊 État utilisateur:');
    console.log('   - Email:', user.user.email);
    console.log('   - Email confirmé:', user.user.email_confirmed_at ? 'OUI' : 'NON');
    console.log('   - Créé le:', user.user.created_at);
    console.log('   - Metadata présente:', !!user.user.raw_user_meta_data);
    
    if (user.user.raw_user_meta_data) {
      const metadata = user.user.raw_user_meta_data;
      console.log('   - Métadonnées clés:');
      console.log('     - temp_user:', metadata.temp_user);
      console.log('     - invitation_type:', metadata.invitation_type);
      console.log('     - email_confirmed_automatically:', metadata.email_confirmed_automatically);
      console.log('     - confirmation_method:', metadata.confirmation_method);
    }

    // Conclusion
    console.log('\n🎯 ===== DIAGNOSTIC =====');
    
    const hasValidInvitation = invitations && invitations.length > 0 && invitations.some(inv => inv.status === 'pending' && inv.token);
    const isInvitationUser = user.user.raw_user_meta_data?.temp_user === true;
    
    console.log('📊 État du processus:');
    console.log('   - Invitation valide présente:', hasValidInvitation ? 'OUI' : 'NON');
    console.log('   - Utilisateur d\'invitation:', isInvitationUser ? 'OUI' : 'NON');
    console.log('   - Email confirmé:', user.user.email_confirmed_at ? 'OUI' : 'NON');
    
    if (hasValidInvitation && isInvitationUser && !user.user.email_confirmed_at) {
      console.log('\n💡 RECOMMANDATION: Déclencher le processus de confirmation');
      console.log('   - L\'invitation est valide');
      console.log('   - L\'utilisateur n\'est pas confirmé');
      console.log('   - Le webhook devrait traiter cet utilisateur');
    } else if (!hasValidInvitation) {
      console.log('\n⚠️ PROBLÈME: Pas d\'invitation valide');
      console.log('   - Token manquant ou invitation expirée/acceptée');
    } else if (user.user.email_confirmed_at) {
      console.log('\n✅ DÉJÀ TRAITÉ: Utilisateur déjà confirmé');
    }

  } catch (error) {
    console.error('🚨 ERREUR:', error);
  }
}

checkInvitationStatus().then(() => {
  console.log('\n🏁 Vérification terminée');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});

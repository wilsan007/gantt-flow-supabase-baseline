/**
 * 🧪 TEST - email_confirm: true direct
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

async function testEmailConfirmTrue() {
  console.log('🧪 ===== TEST EMAIL_CONFIRM: TRUE =====');
  
  const userId = '328b48e0-500d-4419-a1cf-2c9986815eee';

  try {
    // État initial
    console.log('🔍 État initial...');
    const { data: initialUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    console.log('   - Email confirmé:', initialUser?.user?.email_confirmed_at ? 'OUI' : 'NON');

    // Test email_confirm: true
    console.log('\n🔧 Test email_confirm: true...');
    const { data: updateResult, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true
    });

    console.log('📊 Résultat updateUserById:');
    console.log('   - Erreur:', updateError ? updateError.message : 'AUCUNE');
    console.log('   - Données présentes:', !!updateResult);

    if (updateError) {
      console.error('❌ Erreur détaillée:', updateError);
    }

    // Vérification après
    console.log('\n🔍 Vérification après email_confirm: true...');
    const { data: finalUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    console.log('📊 État final:');
    console.log('   - Email confirmé:', finalUser?.user?.email_confirmed_at ? 'OUI' : 'NON');
    if (finalUser?.user?.email_confirmed_at) {
      console.log('   - Confirmé le:', finalUser.user.email_confirmed_at);
    }

    // Conclusion
    console.log('\n🎯 ===== CONCLUSION =====');
    if (finalUser?.user?.email_confirmed_at) {
      console.log('🎉 SUCCÈS: email_confirm: true fonctionne !');
    } else {
      console.log('❌ ÉCHEC: email_confirm: true ne fonctionne pas');
      console.log('💡 Cet utilisateur a peut-être un problème spécifique');
    }

  } catch (error) {
    console.error('🚨 ERREUR:', error);
  }
}

testEmailConfirmTrue().then(() => {
  console.log('\n🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});

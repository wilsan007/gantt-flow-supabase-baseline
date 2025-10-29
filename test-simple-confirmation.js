/**
 * 🧪 TEST SIMPLE - Juste la confirmation manuelle
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

async function testSimpleConfirmation() {
  console.log('🧪 ===== TEST SIMPLE CONFIRMATION =====');
  
  const userId = '328b48e0-500d-4419-a1cf-2c9986815eee';

  try {
    // État initial
    console.log('🔍 État initial...');
    const { data: initialUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    console.log('   - Email confirmé:', initialUser?.user?.email_confirmed_at ? 'OUI' : 'NON');

    // Test de confirmation manuelle
    console.log('\n🔧 Test confirmation manuelle...');
    const { data: updateResult, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      raw_user_meta_data: {
        ...initialUser.user.raw_user_meta_data,
        email_confirmed_automatically: true,
        confirmation_method: 'manual_test',
        confirmed_at: new Date().toISOString(),
        test_confirmation: true
      }
    });

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError);
      return;
    }

    console.log('✅ Mise à jour métadonnées réussie');

    // Vérification après mise à jour
    console.log('\n🔍 Vérification après mise à jour...');
    const { data: finalUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    console.log('📊 État final:');
    console.log('   - Email confirmé:', finalUser?.user?.email_confirmed_at ? 'OUI' : 'NON');
    console.log('   - Métadonnées test:', finalUser?.user?.raw_user_meta_data?.test_confirmation);
    console.log('   - Confirmation auto:', finalUser?.user?.raw_user_meta_data?.email_confirmed_automatically);

    // Conclusion
    console.log('\n🎯 ===== CONCLUSION =====');
    if (finalUser?.user?.email_confirmed_at) {
      console.log('🎉 SUCCÈS: L\'utilisateur est maintenant confirmé !');
      console.log('💡 La confirmation manuelle fonctionne');
    } else {
      console.log('❌ ÉCHEC: L\'utilisateur n\'est toujours pas confirmé');
      console.log('💡 La mise à jour des métadonnées ne confirme pas l\'email');
      console.log('🔧 Solution: Il faut utiliser email_confirm: true ou une autre méthode');
    }

  } catch (error) {
    console.error('🚨 ERREUR:', error);
  }
}

testSimpleConfirmation().then(() => {
  console.log('\n🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});

/**
 * 🧪 TEST RÉEL HANDLE-EMAIL-CONFIRMATION
 * Test direct de la fonction avec les données du dernier utilisateur créé
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function testHandleConfirmationReal() {
  console.log('🧪 ===== TEST RÉEL HANDLE-EMAIL-CONFIRMATION =====');
  console.log('🎯 Test avec le dernier utilisateur créé');
  console.log('');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Données du dernier utilisateur créé
  const testUserId = 'eb634512-3d80-4796-b69e-36f5940d035e';
  const testEmail = 'test-real-1759443201704@example.com';

  try {
    console.log('🔍 ÉTAPE 1: Récupération utilisateur test...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: user, error: getUserError } = await supabase.auth.admin.getUserById(testUserId);
    
    if (getUserError || !user?.user) {
      console.error('❌ Utilisateur non trouvé:', getUserError?.message);
      return;
    }

    console.log('✅ Utilisateur trouvé:');
    console.log('   - ID:', user.user.id);
    console.log('   - Email:', user.user.email);
    console.log('   - Email confirmé:', user.user.email_confirmed_at || 'NON');
    console.log('   - Invitation type:', user.user.raw_user_meta_data?.invitation_type);
    console.log('');

    console.log('🚀 ÉTAPE 2: Test direct de handle-email-confirmation...');
    
    // Payload simulant le webhook après Magic Link
    const payload = {
      type: 'UPDATE',
      table: 'users',
      schema: 'auth',
      record: {
        id: user.user.id,
        email: user.user.email,
        email_confirmed_at: new Date().toISOString(), // Simuler confirmation
        raw_user_meta_data: user.user.raw_user_meta_data,
        created_at: user.user.created_at,
        updated_at: user.user.updated_at
      },
      old_record: {
        id: user.user.id,
        email: user.user.email,
        email_confirmed_at: null, // Avant confirmation
        raw_user_meta_data: user.user.raw_user_meta_data,
        created_at: user.user.created_at,
        updated_at: user.user.updated_at
      }
    };

    console.log('📤 Appel fonction handle-email-confirmation...');
    
    const functionUrl = `${SUPABASE_URL}/functions/v1/handle-email-confirmation`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(payload)
    });

    console.log('📊 Réponse reçue:');
    console.log('   - Status:', response.status);
    console.log('   - Status Text:', response.statusText);

    const responseText = await response.text();
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ SUCCÈS ! Réponse JSON:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
          console.log('');
          console.log('🎉 PROCESSUS COMPLET RÉUSSI:');
          console.log('   - Tenant créé:', result.data?.tenant_name);
          console.log('   - Employee ID:', result.data?.employee_id);
          console.log('   - Rôle:', result.data?.role);
          console.log('   - Tenant ID:', result.data?.tenant_id);
        }
      } catch (parseError) {
        console.log('✅ Réponse (texte):', responseText);
      }
    } else {
      console.log('❌ ERREUR ! Réponse:');
      console.log(responseText);
    }

    console.log('');
    console.log('🔍 ÉTAPE 3: Vérification résultats en base...');
    
    // Vérifier si le tenant a été créé
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, full_name')
      .eq('user_id', testUserId)
      .single();

    if (profile?.tenant_id) {
      console.log('✅ Profil créé:');
      console.log('   - Tenant ID:', profile.tenant_id);
      console.log('   - Nom:', profile.full_name);
      
      // Vérifier le tenant
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name, status')
        .eq('id', profile.tenant_id)
        .single();

      if (tenant) {
        console.log('✅ Tenant créé:');
        console.log('   - Nom:', tenant.name);
        console.log('   - Status:', tenant.status);
      }

      // Vérifier l'employé
      const { data: employee } = await supabase
        .from('employees')
        .select('employee_id, full_name, job_title')
        .eq('user_id', testUserId)
        .single();

      if (employee) {
        console.log('✅ Employé créé:');
        console.log('   - Employee ID:', employee.employee_id);
        console.log('   - Nom:', employee.full_name);
        console.log('   - Poste:', employee.job_title);
      }
    } else {
      console.log('⚠️ Aucun profil trouvé - Processus non terminé');
    }

  } catch (error) {
    console.error('💥 Erreur test:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('');
  console.log('🏁 Test handle-email-confirmation terminé');
}

testHandleConfirmationReal().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});

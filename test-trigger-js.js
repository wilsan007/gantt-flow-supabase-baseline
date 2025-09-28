import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTriggerValidation() {
  console.log('🔍 Test du trigger de validation token...\n');
  
  const userId = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
  const email = 'test212@yahoo.com';
  
  try {
    // 1. Vérifier l'utilisateur
    console.log('1️⃣ Vérification utilisateur...');
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    console.log('User:', {
      id: user?.user?.id,
      email: user?.user?.email,
      email_confirmed_at: user?.user?.email_confirmed_at,
      created_at: user?.user?.created_at
    });
    
    // 2. Vérifier invitation
    console.log('\n2️⃣ Vérification invitation...');
    const { data: invitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', email)
      .single();
    console.log('Invitation:', invitation);
    
    // 3. Vérifier profil actuel
    console.log('\n3️⃣ Vérification profil actuel...');
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    console.log('Profil existant:', profile);
    
    // 4. Vérifier trigger installé
    console.log('\n4️⃣ Vérification trigger...');
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'auto_tenant_owner_creation_trigger');
    console.log('Trigger installé:', triggers?.length > 0);
    
    // 5. Simuler validation email si pas confirmé
    if (!user?.user?.email_confirmed_at) {
      console.log('\n5️⃣ Simulation validation email...');
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
      );
      
      if (updateError) {
        console.error('Erreur validation:', updateError);
      } else {
        console.log('✅ Email validé - Trigger déclenché');
        
        // Attendre un peu pour le trigger
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } else {
      console.log('\n5️⃣ Email déjà confirmé');
    }
    
    // 6. Vérifier résultat après trigger
    console.log('\n6️⃣ Vérification après trigger...');
    
    const { data: newProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    console.log('Nouveau profil:', newProfile);
    
    if (newProfile) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', newProfile.tenant_id)
        .single();
      console.log('Tenant créé:', tenant);
      
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userId)
        .single();
      console.log('Employé créé:', employee);
    }
    
    // 7. Test fonction réparation si pas de profil
    if (!newProfile) {
      console.log('\n7️⃣ Test fonction réparation...');
      
      const { data, error } = await supabase.rpc('auto_create_tenant_owner_direct', {
        p_user_id: userId,
        p_email: email,
        p_metadata: null
      });
      
      if (error) {
        console.error('Erreur réparation:', error);
      } else {
        console.log('✅ Fonction réparation exécutée');
        
        const { data: repairedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        console.log('Profil après réparation:', repairedProfile);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

testTriggerValidation();

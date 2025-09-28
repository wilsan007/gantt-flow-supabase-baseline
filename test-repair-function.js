import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qliinxtanjdnwxlvnxji.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
);

async function testRepairFunction() {
  console.log('🧪 Test de la fonction de réparation PostgreSQL...\n');
  
  try {
    // Test avec la fonction de réparation complète
    console.log('1️⃣ Appel de la fonction repair_tenant_owner_complete...');
    
    const { data, error } = await supabase.rpc('repair_tenant_owner_complete', {
      p_user_id: '3edb2a4f-7faf-439c-b512-e9d70c7ba34a',
      p_tenant_id: '115d5fa0-006a-4978-8776-c19b4157731a',
      p_email: 'test212@yahoo.com',
      p_full_name: 'Med Osman',
      p_token: '758ac777fb6d8ae23436bd1802c890ef9300b1dafb4559661337f990'
    });
    
    if (error) {
      console.log('❌ Erreur fonction:', error.message);
      
      // Test avec la fonction de test simple
      console.log('\n2️⃣ Tentative avec fonction de test...');
      const { data: testData, error: testError } = await supabase.rpc('test_repair_function');
      
      if (testError) {
        console.log('❌ Erreur fonction test:', testError.message);
      } else {
        console.log('✅ Résultat fonction test:', testData);
      }
    } else {
      console.log('✅ Résultat fonction:', data);
    }
    
    // Vérification finale des données
    console.log('\n🔍 Vérification des données créées...');
    
    const userId = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
    const tenantId = '115d5fa0-006a-4978-8776-c19b4157731a';
    
    // Vérifier profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    // Vérifier employé
    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    // Vérifier rôle
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('*, roles(name)')
      .eq('user_id', userId)
      .maybeSingle();
    
    // Vérifier tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();
    
    console.log('\n📊 Résultats:');
    console.log('Tenant:', tenant ? `✅ ${tenant.name}` : '❌ Manquant');
    console.log('Profil:', profile ? `✅ ${profile.full_name} (${profile.role})` : '❌ Manquant');
    console.log('Employé:', employee ? `✅ ${employee.employee_id} - ${employee.job_title}` : '❌ Manquant');
    console.log('Rôle:', userRole ? `✅ ${userRole.roles?.name}` : '❌ Manquant');
    
    if (tenant && profile && employee && userRole) {
      console.log('\n🎉 SUCCÈS COMPLET: Tenant owner créé avec succès !');
      console.log(`📧 Utilisateur: ${profile.email}`);
      console.log(`🏢 Entreprise: ${tenant.name}`);
      console.log(`👤 Employé: ${employee.employee_id}`);
      console.log(`🔑 Rôle: ${userRole.roles?.name}`);
    } else {
      console.log('\n⚠️  ÉCHEC: Certains éléments manquent');
    }
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

testRepairFunction();

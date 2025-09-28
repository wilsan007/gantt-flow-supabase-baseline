import { createClient } from '@supabase/supabase-js';

async function debugEmployeeDisplay() {
  const supabase = createClient(
    'https://qliinxtanjdnwxlvnxji.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM'
  );
  
  console.log('🔍 Debugging employee display issue...\n');
  
  try {
    // Se connecter
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'zdouce.zz@gmail.com',
      password: 'Test11@@'
    });
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
      return;
    }
    
    console.log('✅ Authenticated successfully\n');
    
    // 1. Vérifier les données brutes des employés
    console.log('📊 Raw employee data from profiles:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
      return;
    }
    
    console.log(`✅ Total profiles: ${profiles.length}`);
    profiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.full_name || 'Sans nom'}`);
      console.log(`      - Contract: ${profile.contract_type || 'Non défini'}`);
      console.log(`      - Hire date: ${profile.hire_date || 'Non défini'}`);
      console.log(`      - Tenant ID: ${profile.tenant_id}`);
    });
    
    // 2. Analyser les types de contrat
    console.log('\n📋 Contract type analysis:');
    const contractTypes = {};
    profiles.forEach(profile => {
      const contractType = profile.contract_type || 'Non défini';
      contractTypes[contractType] = (contractTypes[contractType] || 0) + 1;
    });
    
    Object.entries(contractTypes).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });
    
    // 3. Analyser les dates d'embauche (nouveaux employés)
    console.log('\n📅 Hire date analysis:');
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const newEmployees = profiles.filter(profile => {
      const hireDate = profile.hire_date ? new Date(profile.hire_date) : null;
      return hireDate && hireDate > threeMonthsAgo;
    });
    
    console.log(`   - Employees with hire_date: ${profiles.filter(p => p.hire_date).length}`);
    console.log(`   - New employees (last 3 months): ${newEmployees.length}`);
    console.log(`   - Three months ago: ${threeMonthsAgo.toISOString().split('T')[0]}`);
    
    if (newEmployees.length > 0) {
      console.log('   New employees:');
      newEmployees.forEach(emp => {
        console.log(`     - ${emp.full_name}: ${emp.hire_date}`);
      });
    }
    
    // 4. Vérifier les filtres spécifiques
    console.log('\n🔍 Filter analysis:');
    
    // CDI filter
    const cdiEmployees = profiles.filter(e => e.contract_type === 'CDI');
    console.log(`   - CDI employees: ${cdiEmployees.length}`);
    
    // Temporaires filter
    const tempEmployees = profiles.filter(e => e.contract_type && e.contract_type !== 'CDI');
    console.log(`   - Temporary employees: ${tempEmployees.length}`);
    
    // 5. Simuler le comportement du composant React
    console.log('\n⚛️ React component simulation:');
    console.log(`   - employees.length: ${profiles.length}`);
    console.log(`   - employees.filter(e => e.contract_type === 'CDI').length: ${cdiEmployees.length}`);
    console.log(`   - employees.filter(e => e.contract_type && e.contract_type !== 'CDI').length: ${tempEmployees.length}`);
    console.log(`   - newEmployees.length: ${newEmployees.length}`);
    
    // 6. Vérifier si les données sont bien structurées
    console.log('\n🏗️ Data structure validation:');
    const sampleEmployee = profiles[0];
    if (sampleEmployee) {
      console.log('   Sample employee structure:');
      console.log(`     - id: ${sampleEmployee.id ? '✅' : '❌'}`);
      console.log(`     - full_name: ${sampleEmployee.full_name ? '✅' : '❌'}`);
      console.log(`     - contract_type: ${sampleEmployee.contract_type ? '✅' : '❌'}`);
      console.log(`     - hire_date: ${sampleEmployee.hire_date ? '✅' : '❌'}`);
      console.log(`     - tenant_id: ${sampleEmployee.tenant_id ? '✅' : '❌'}`);
    }
    
    await supabase.auth.signOut();
    console.log('\n🎉 Debug completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugEmployeeDisplay().catch(console.error);

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qliinxtanjdnwxlvnxji.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
);

async function testCleanupAndRecreate() {
  const userId = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
  const email = 'test212@yahoo.com';
  const tenantId = '115d5fa0-006a-4978-8776-c19b4157731a';
  const fullName = 'Med Osman';
  const token = '758ac777fb6d8ae23436bd1802c890ef9300b1dafb4559661337f990';
  
  console.log('🧹 Nettoyage et recréation complète...\n');
  
  try {
    // 1. Nettoyage complet
    console.log('1️⃣ Nettoyage des données existantes...');
    
    await supabase.from('employees').delete().eq('user_id', userId);
    await supabase.from('user_roles').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);
    await supabase.from('tenants').delete().eq('id', tenantId);
    
    console.log('✅ Nettoyage terminé');
    
    // 2. Vérifier structure profiles
    console.log('\n2️⃣ Vérification colonne tenant_id...');
    const { data: testStructure } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (testStructure && testStructure.length > 0) {
      const hastenantId = 'tenant_id' in testStructure[0];
      console.log('✅ Colonne tenant_id existe:', hastenantId);
    } else {
      console.log('Table profiles vide');
    }
    
    // 3. Créer tenant
    console.log('\n3️⃣ Création tenant...');
    const { error: tenantError } = await supabase
      .from('tenants')
      .insert({
        id: tenantId,
        name: 'Entreprise Med Osman',
        status: 'active'
      });
    
    if (tenantError) console.log('❌ Erreur tenant:', tenantError.message);
    else console.log('✅ Tenant créé:', tenantId);
    
    // 4. Créer profil - d'abord sans tenant_id puis update
    console.log('\n4️⃣ Création profil...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        full_name: fullName,
        email: email,
        role: 'tenant_admin'
      });
    
    if (profileError) {
      console.log('❌ Erreur profil:', profileError.message);
    } else {
      console.log('✅ Profil créé, ajout tenant_id...');
      
      // Mettre à jour avec tenant_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ tenant_id: tenantId })
        .eq('user_id', userId);
      
      if (updateError) {
        console.log('❌ Erreur update tenant_id:', updateError.message);
      } else {
        console.log('✅ tenant_id ajouté au profil');
      }
    }
    
    // 5. Récupérer rôle
    console.log('\n5️⃣ Recherche rôle tenant_admin...');
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'tenant_admin')
      .single();
    
    if (roleError) console.log('❌ Erreur rôle:', roleError.message);
    else console.log('✅ Rôle trouvé:', role.id);
    
    // 6. Créer user_roles
    if (role) {
      console.log('\n6️⃣ Attribution rôle...');
      const { error: userRoleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: role.id,
          tenant_id: tenantId,
          is_active: true
        });
      
      if (userRoleError) console.log('❌ Erreur user_roles:', userRoleError.message);
      else console.log('✅ Rôle attribué');
    }
    
    // 7. Générer employee_id unique
    console.log('\n7️⃣ Génération employee_id unique...');
    const { data: existingEmployees } = await supabase
      .from('employees')
      .select('employee_id')
      .like('employee_id', 'EMP%');
    
    let employeeId = 'EMP001';
    for (let i = 1; i <= 999; i++) {
      const testId = 'EMP' + String(i).padStart(3, '0');
      if (!existingEmployees?.some(emp => emp.employee_id === testId)) {
        employeeId = testId;
        break;
      }
    }
    
    console.log('Employee ID généré:', employeeId);
    
    // 8. Créer employé
    console.log('\n8️⃣ Création employé...');
    const { error: employeeError } = await supabase
      .from('employees')
      .insert({
        user_id: userId,
        employee_id: employeeId,
        full_name: fullName,
        email: email,
        job_title: 'Directeur Général',
        hire_date: new Date().toISOString().split('T')[0],
        contract_type: 'CDI',
        status: 'active',
        tenant_id: tenantId
      });
    
    if (employeeError) console.log('❌ Erreur employé:', employeeError.message);
    else console.log('✅ Employé créé avec ID:', employeeId);
    
    // 9. Marquer invitation acceptée
    console.log('\n9️⃣ Marquage invitation...');
    const { error: invUpdateError } = await supabase
      .from('invitations')
      .update({ 
        status: 'accepted', 
        accepted_at: new Date().toISOString() 
      })
      .eq('token', token);
    
    if (invUpdateError) console.log('❌ Erreur invitation update:', invUpdateError.message);
    else console.log('✅ Invitation marquée acceptée');
    
    // 10. Vérification finale
    console.log('\n🔍 Vérification finale...');
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const { data: finalEmployee } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    console.log('✅ Profil final:', finalProfile);
    console.log('✅ Employé final:', finalEmployee);
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

testCleanupAndRecreate();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qliinxtanjdnwxlvnxji.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
);

async function repairWithGlobalTables() {
  const userId = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
  const email = 'test212@yahoo.com';
  const tenantId = '115d5fa0-006a-4978-8776-c19b4157731a';
  const fullName = 'Med Osman';
  const token = '758ac777fb6d8ae23436bd1802c890ef9300b1dafb4559661337f990';
  
  console.log('🔧 Réparation avec tables globales...\n');
  
  try {
    // 1. Nettoyage complet
    console.log('1️⃣ Nettoyage des données existantes...');
    await supabase.from('employees').delete().eq('user_id', userId);
    await supabase.from('user_roles').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);
    await supabase.from('tenants').delete().eq('id', tenantId);
    console.log('✅ Nettoyage terminé');
    
    // 2. Vérifier les tables globales critiques
    console.log('\n2️⃣ Vérification des tables globales...');
    
    // Vérifier tenant_admin role dans la table globale roles
    const { data: tenantAdminRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'tenant_admin')
      .single();
    
    if (roleError || !tenantAdminRole) {
      console.log('❌ Rôle tenant_admin non trouvé dans la table globale roles');
      return;
    }
    
    console.log('✅ Rôle tenant_admin trouvé:', tenantAdminRole.id);
    
    // 3. Créer tenant
    console.log('\n3️⃣ Création tenant...');
    const { error: tenantError } = await supabase
      .from('tenants')
      .insert({
        id: tenantId,
        name: 'Entreprise Med Osman',
        status: 'active'
      });
    
    if (tenantError) {
      console.log('❌ Erreur tenant:', tenantError.message);
      return;
    }
    console.log('✅ Tenant créé:', tenantId);
    
    // 4. Créer profil avec approche step-by-step
    console.log('\n4️⃣ Création profil utilisateur...');
    
    // D'abord créer un profil minimal
    const { data: insertedProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        full_name: fullName,
        email: email,
        role: 'tenant_admin'
      })
      .select()
      .single();
    
    if (profileError) {
      console.log('❌ Erreur création profil:', profileError.message);
      
      // Essayer avec upsert si insert échoue
      console.log('   Tentative avec upsert...');
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          full_name: fullName,
          email: email,
          role: 'tenant_admin'
        });
      
      if (upsertError) {
        console.log('❌ Erreur upsert profil:', upsertError.message);
        return;
      }
      console.log('✅ Profil créé via upsert');
    } else {
      console.log('✅ Profil créé via insert');
    }
    
    // Maintenant ajouter tenant_id
    console.log('   Ajout tenant_id au profil...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ tenant_id: tenantId })
      .eq('user_id', userId);
    
    if (updateError) {
      console.log('❌ Erreur ajout tenant_id:', updateError.message);
    } else {
      console.log('✅ tenant_id ajouté au profil');
    }
    
    // 5. Créer user_roles avec le rôle global
    console.log('\n5️⃣ Attribution du rôle tenant_admin...');
    const { error: userRoleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: tenantAdminRole.id, // Utiliser l'ID du rôle global
        tenant_id: tenantId,
        is_active: true
      });
    
    if (userRoleError) {
      console.log('❌ Erreur user_roles:', userRoleError.message);
    } else {
      console.log('✅ Rôle tenant_admin attribué');
    }
    
    // 6. Générer employee_id unique
    console.log('\n6️⃣ Génération employee_id unique...');
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
    
    // 7. Créer employé
    console.log('\n7️⃣ Création employé...');
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
    
    if (employeeError) {
      console.log('❌ Erreur employé:', employeeError.message);
    } else {
      console.log('✅ Employé créé avec ID:', employeeId);
    }
    
    // 8. Marquer invitation acceptée
    console.log('\n8️⃣ Marquage invitation...');
    const { error: invUpdateError } = await supabase
      .from('invitations')
      .update({ 
        status: 'accepted', 
        accepted_at: new Date().toISOString() 
      })
      .eq('token', token);
    
    if (invUpdateError) {
      console.log('❌ Erreur invitation update:', invUpdateError.message);
    } else {
      console.log('✅ Invitation marquée acceptée');
    }
    
    // 9. Vérification finale complète
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
    
    const { data: finalUserRole } = await supabase
      .from('user_roles')
      .select('*, roles(name)')
      .eq('user_id', userId)
      .single();
    
    console.log('✅ Profil final:', finalProfile ? 'Créé' : 'Manquant');
    console.log('✅ Employé final:', finalEmployee ? `Créé (${finalEmployee.employee_id})` : 'Manquant');
    console.log('✅ Rôle final:', finalUserRole ? `Attribué (${finalUserRole.roles?.name})` : 'Manquant');
    
    if (finalProfile && finalEmployee && finalUserRole) {
      console.log('\n🎉 SUCCÈS: Tenant owner créé avec succès !');
    } else {
      console.log('\n⚠️  PARTIEL: Certains éléments manquent');
    }
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

repairWithGlobalTables();

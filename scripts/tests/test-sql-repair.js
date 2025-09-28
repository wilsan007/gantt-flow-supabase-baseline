import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qliinxtanjdnwxlvnxji.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'
);

async function testSQLRepair() {
  const userId = '3edb2a4f-7faf-439c-b512-e9d70c7ba34a';
  const tenantId = '115d5fa0-006a-4978-8776-c19b4157731a';
  
  console.log('🧪 Test du script SQL de réparation...\n');
  
  try {
    // Exécuter le script SQL de réparation via une fonction
    console.log('1️⃣ Exécution du script de réparation SQL...');
    
    const { data, error } = await supabase.rpc('repair_tenant_owner_direct', {
      p_user_id: userId,
      p_tenant_id: tenantId,
      p_email: 'test212@yahoo.com',
      p_full_name: 'Med Osman',
      p_token: '758ac777fb6d8ae23436bd1802c890ef9300b1dafb4559661337f990'
    });
    
    if (error) {
      console.log('❌ Erreur fonction repair:', error.message);
      
      // Fallback: test manuel des étapes
      console.log('\n2️⃣ Test manuel des étapes...');
      await testManualSteps(userId, tenantId);
    } else {
      console.log('✅ Fonction repair exécutée:', data);
    }
    
    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    await verifyResults(userId, tenantId);
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

async function testManualSteps(userId, tenantId) {
  try {
    // 1. Nettoyage
    console.log('   Nettoyage...');
    await supabase.from('employees').delete().eq('user_id', userId);
    await supabase.from('user_roles').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);
    await supabase.from('tenants').delete().eq('id', tenantId);
    
    // 2. Créer tenant
    console.log('   Création tenant...');
    const { error: tenantError } = await supabase
      .from('tenants')
      .insert({
        id: tenantId,
        name: 'Entreprise Med Osman',
        status: 'active'
      });
    
    if (tenantError) console.log('   ❌ Tenant:', tenantError.message);
    else console.log('   ✅ Tenant créé');
    
    // 3. Test profil avec SQL brut
    console.log('   Test création profil via SQL...');
    const { error: sqlError } = await supabase.rpc('exec_raw_sql', {
      sql: `
        INSERT INTO public.profiles (user_id, tenant_id, full_name, email, role, created_at, updated_at)
        VALUES ('${userId}', '${tenantId}', 'Med Osman', 'test212@yahoo.com', 'tenant_admin', NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          tenant_id = EXCLUDED.tenant_id,
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          updated_at = NOW();
      `
    });
    
    if (sqlError) console.log('   ❌ SQL profil:', sqlError.message);
    else console.log('   ✅ Profil créé via SQL');
    
  } catch (error) {
    console.log('   ❌ Erreur étapes manuelles:', error.message);
  }
}

async function verifyResults(userId, tenantId) {
  try {
    // Vérifier profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError) {
      console.log('❌ Profil:', profileError.message);
    } else {
      console.log('✅ Profil trouvé:', {
        user_id: profile.user_id,
        tenant_id: profile.tenant_id,
        full_name: profile.full_name,
        role: profile.role
      });
    }
    
    // Vérifier employé
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (employeeError) {
      console.log('❌ Employé:', employeeError.message);
    } else {
      console.log('✅ Employé trouvé:', {
        employee_id: employee.employee_id,
        full_name: employee.full_name,
        job_title: employee.job_title
      });
    }
    
    // Vérifier rôle
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('*, roles(name)')
      .eq('user_id', userId)
      .single();
    
    if (roleError) {
      console.log('❌ Rôle:', roleError.message);
    } else {
      console.log('✅ Rôle trouvé:', {
        role_name: userRole.roles?.name,
        is_active: userRole.is_active,
        tenant_id: userRole.tenant_id
      });
    }
    
    // Vérifier tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    
    if (tenantError) {
      console.log('❌ Tenant:', tenantError.message);
    } else {
      console.log('✅ Tenant trouvé:', {
        id: tenant.id,
        name: tenant.name,
        status: tenant.status
      });
    }
    
    // Résumé final
    const hasProfile = !profileError;
    const hasEmployee = !employeeError;
    const hasRole = !roleError;
    const hasTenant = !tenantError;
    
    console.log('\n📊 Résumé:');
    console.log(`Tenant: ${hasTenant ? '✅' : '❌'}`);
    console.log(`Profil: ${hasProfile ? '✅' : '❌'}`);
    console.log(`Employé: ${hasEmployee ? '✅' : '❌'}`);
    console.log(`Rôle: ${hasRole ? '✅' : '❌'}`);
    
    if (hasProfile && hasEmployee && hasRole && hasTenant) {
      console.log('\n🎉 SUCCÈS COMPLET: Tenant owner créé !');
    } else {
      console.log('\n⚠️  PARTIEL: Certains éléments manquent');
    }
    
  } catch (error) {
    console.log('❌ Erreur vérification:', error.message);
  }
}

testSQLRepair();

// Analyse avec identifiants Super Admin pour contourner les politiques RLS
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI'; // Service role key pour contourner RLS

// Utiliser le service role pour contourner les politiques RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeWithSuperAdmin() {
  console.log('🔍 ANALYSE AVEC SUPER ADMIN');
  console.log('Super Admin User ID: 5c5731ce-75d0-4455-8184-bc42c626cb17');
  console.log('Super Admin Tenant: 00000000-0000-0000-0000-000000000000');
  console.log('=' .repeat(60));

  try {
    // 1. Vérifier tous les employés avec EMP001
    console.log('\n1️⃣ TOUS LES EMPLOYÉS AVEC EMP001:');
    const { data: emp001Records, error: emp001Error } = await supabaseAdmin
      .from('employees')
      .select('id, user_id, employee_id, full_name, tenant_id, email, created_at')
      .eq('employee_id', 'EMP001');

    if (emp001Error) {
      console.log('❌ Erreur:', emp001Error.message);
    } else {
      console.log(`📊 Trouvé ${emp001Records?.length || 0} employé(s) avec EMP001:`);
      emp001Records?.forEach((emp, i) => {
        console.log(`  ${i+1}. ID: ${emp.id}`);
        console.log(`     User: ${emp.user_id}`);
        console.log(`     Tenant: ${emp.tenant_id}`);
        console.log(`     Email: ${emp.email}`);
        console.log(`     Nom: ${emp.full_name}`);
        console.log(`     Créé: ${emp.created_at}`);
        console.log('');
      });
    }

    // 2. Vérifier l'employé de notre utilisateur test
    console.log('\n2️⃣ EMPLOYÉ POUR USER a61224ce-6066-4eda-a3e2-399b0e2e36c1:');
    const { data: userEmployee, error: userEmpError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('user_id', 'a61224ce-6066-4eda-a3e2-399b0e2e36c1');

    if (userEmpError) {
      console.log('❌ Erreur:', userEmpError.message);
    } else {
      console.log(`📊 Trouvé ${userEmployee?.length || 0} employé(s):`);
      userEmployee?.forEach((emp, i) => {
        console.log(`  ${i+1}. Employee ID: ${emp.employee_id}`);
        console.log(`     Tenant: ${emp.tenant_id}`);
        console.log(`     Status: ${emp.status}`);
        console.log(`     Créé: ${emp.created_at}`);
      });
    }

    // 3. Compter tous les employee_id pour identifier les conflits
    console.log('\n3️⃣ ANALYSE GLOBALE DES EMPLOYEE_ID:');
    const { data: allEmployees, error: allError } = await supabaseAdmin
      .from('employees')
      .select('employee_id, tenant_id, user_id, full_name')
      .order('employee_id');

    if (allError) {
      console.log('❌ Erreur:', allError.message);
    } else {
      const counts = {};
      allEmployees?.forEach(emp => {
        if (!counts[emp.employee_id]) {
          counts[emp.employee_id] = [];
        }
        counts[emp.employee_id].push({
          user_id: emp.user_id,
          tenant_id: emp.tenant_id,
          full_name: emp.full_name
        });
      });

      console.log('📊 Répartition des employee_id:');
      Object.entries(counts).forEach(([empId, users]) => {
        if (users.length > 1) {
          console.log(`  ⚠️  ${empId}: ${users.length} utilisateurs (CONFLIT!)`);
          users.forEach((user, i) => {
            console.log(`      ${i+1}. ${user.full_name} (${user.user_id})`);
            console.log(`         Tenant: ${user.tenant_id}`);
          });
        } else {
          console.log(`  ✅ ${empId}: 1 utilisateur`);
        }
      });
    }

    // 4. Vérifier le tenant cible
    console.log('\n4️⃣ TENANT CIBLE 73870956-03c5-49a3-b3c3-257bc7e10fc6:');
    const { data: targetTenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', '73870956-03c5-49a3-b3c3-257bc7e10fc6')
      .single();

    if (tenantError) {
      console.log('❌ Erreur:', tenantError.message);
    } else if (targetTenant) {
      console.log('✅ Tenant trouvé:', targetTenant.name);
      console.log('   Status:', targetTenant.status);
    } else {
      console.log('❌ Tenant non trouvé');
    }

    // 5. Vérifier les employés dans le tenant cible
    console.log('\n5️⃣ EMPLOYÉS DANS LE TENANT CIBLE:');
    const { data: tenantEmployees, error: tenantEmpError } = await supabaseAdmin
      .from('employees')
      .select('employee_id, user_id, full_name, email')
      .eq('tenant_id', '73870956-03c5-49a3-b3c3-257bc7e10fc6');

    if (tenantEmpError) {
      console.log('❌ Erreur:', tenantEmpError.message);
    } else {
      console.log(`📊 ${tenantEmployees?.length || 0} employé(s) dans ce tenant:`);
      tenantEmployees?.forEach((emp, i) => {
        console.log(`  ${i+1}. ${emp.employee_id} - ${emp.full_name} (${emp.email})`);
      });
    }

    // 6. Calculer le prochain employee_id disponible
    console.log('\n6️⃣ CALCUL PROCHAIN EMPLOYEE_ID:');
    const { data: maxEmpId, error: maxError } = await supabaseAdmin
      .from('employees')
      .select('employee_id')
      .like('employee_id', 'EMP%')
      .order('employee_id', { ascending: false })
      .limit(1);

    if (maxError) {
      console.log('❌ Erreur:', maxError.message);
    } else if (maxEmpId && maxEmpId.length > 0) {
      const lastId = maxEmpId[0].employee_id;
      const lastNumber = parseInt(lastId.substring(3));
      const nextNumber = lastNumber + 1;
      const nextId = 'EMP' + String(nextNumber).padStart(3, '0');
      console.log('📊 Dernier employee_id:', lastId);
      console.log('📊 Prochain employee_id disponible:', nextId);
    } else {
      console.log('📊 Aucun employee_id trouvé, prochain: EMP001');
    }

    // 7. Test d'insertion directe avec le prochain ID disponible
    console.log('\n7️⃣ TEST INSERTION AVEC ID DISPONIBLE:');
    
    // D'abord calculer l'ID disponible
    const allEmpIds = await supabaseAdmin
      .from('employees')
      .select('employee_id')
      .like('employee_id', 'EMP%');
    
    let nextAvailableId = 'EMP001';
    if (allEmpIds.data && allEmpIds.data.length > 0) {
      const numbers = allEmpIds.data
        .map(emp => parseInt(emp.employee_id.substring(3)))
        .filter(num => !isNaN(num))
        .sort((a, b) => b - a);
      
      const maxNum = numbers[0] || 0;
      nextAvailableId = 'EMP' + String(maxNum + 1).padStart(3, '0');
    }

    console.log('🎯 Tentative avec employee_id:', nextAvailableId);

    const testInsert = await supabaseAdmin
      .from('employees')
      .insert({
        user_id: 'a61224ce-6066-4eda-a3e2-399b0e2e36c1',
        employee_id: nextAvailableId,
        full_name: 'Imran Osman Test',
        email: 'imran33@yahoo.com',
        job_title: 'Directeur Général',
        hire_date: '2025-09-17',
        contract_type: 'CDI',
        status: 'active',
        tenant_id: '73870956-03c5-49a3-b3c3-257bc7e10fc6'
      })
      .select();

    if (testInsert.error) {
      console.log('❌ Erreur insertion:', testInsert.error.message);
      console.log('   Code:', testInsert.error.code);
      console.log('   Details:', testInsert.error.details);
    } else {
      console.log('✅ Insertion réussie!');
      console.log('   ID créé:', testInsert.data[0].id);
      console.log('   Employee ID:', testInsert.data[0].employee_id);
      
      // Nettoyer le test
      await supabaseAdmin
        .from('employees')
        .delete()
        .eq('id', testInsert.data[0].id);
      
      console.log('🗑️ Test nettoyé');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

analyzeWithSuperAdmin();

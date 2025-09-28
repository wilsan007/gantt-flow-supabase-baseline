// Analyse simple de la contrainte employee_id
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleEmployeeAnalysis() {
  console.log('🔍 ANALYSE SIMPLE CONTRAINTE EMPLOYEE_ID');
  console.log('=' .repeat(50));

  try {
    // 1. Chercher tous les employés avec EMP001
    console.log('\n1️⃣ RECHERCHE EMPLOYÉS AVEC EMP001:');
    const { data: emp001, error: emp001Error } = await supabase
      .from('employees')
      .select('id, user_id, employee_id, tenant_id, full_name, email, created_at')
      .eq('employee_id', 'EMP001');

    if (emp001Error) {
      console.log('❌ Erreur:', emp001Error.message);
    } else {
      console.log(`📊 Trouvé ${emp001?.length || 0} employé(s) avec EMP001:`);
      emp001?.forEach((emp, i) => {
        console.log(`  ${i+1}. User: ${emp.user_id}`);
        console.log(`     Tenant: ${emp.tenant_id}`);
        console.log(`     Email: ${emp.email}`);
        console.log(`     Créé: ${emp.created_at}`);
        console.log('');
      });
    }

    // 2. Chercher l'employé de notre utilisateur test
    console.log('\n2️⃣ EMPLOYÉ DE NOTRE USER TEST:');
    const { data: userEmp, error: userEmpError } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', 'a61224ce-6066-4eda-a3e2-399b0e2e36c1');

    if (userEmpError) {
      console.log('❌ Erreur:', userEmpError.message);
    } else {
      console.log(`📊 Trouvé ${userEmp?.length || 0} employé(s) pour ce user:`);
      userEmp?.forEach((emp, i) => {
        console.log(`  ${i+1}. Employee ID: ${emp.employee_id}`);
        console.log(`     Tenant: ${emp.tenant_id}`);
        console.log(`     Status: ${emp.status}`);
      });
    }

    // 3. Compter tous les employés par employee_id
    console.log('\n3️⃣ COMPTAGE PAR EMPLOYEE_ID:');
    const { data: allEmployees, error: allError } = await supabase
      .from('employees')
      .select('employee_id, tenant_id, user_id')
      .order('employee_id');

    if (allError) {
      console.log('❌ Erreur:', allError.message);
    } else {
      const counts = {};
      allEmployees?.forEach(emp => {
        if (!counts[emp.employee_id]) {
          counts[emp.employee_id] = [];
        }
        counts[emp.employee_id].push(`${emp.user_id} (tenant: ${emp.tenant_id})`);
      });

      console.log('📊 Répartition des employee_id:');
      Object.entries(counts).forEach(([empId, users]) => {
        console.log(`  ${empId}: ${users.length} utilisateur(s)`);
        if (users.length > 1) {
          console.log(`    ⚠️  CONFLIT DÉTECTÉ!`);
          users.forEach(user => console.log(`      - ${user}`));
        }
      });
    }

    // 4. Test d'insertion avec ON CONFLICT
    console.log('\n4️⃣ TEST INSERTION AVEC ON CONFLICT:');
    const testResult = await supabase
      .from('employees')
      .upsert({
        user_id: 'a61224ce-6066-4eda-a3e2-399b0e2e36c1',
        employee_id: 'EMP001',
        full_name: 'Imran Osman Test',
        email: 'imran33@yahoo.com',
        job_title: 'Directeur Général',
        hire_date: '2025-09-17',
        contract_type: 'CDI',
        status: 'active',
        tenant_id: '73870956-03c5-49a3-b3c3-257bc7e10fc6'
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (testResult.error) {
      console.log('❌ Erreur upsert:', testResult.error.message);
      console.log('   Code:', testResult.error.code);
    } else {
      console.log('✅ Upsert réussi:', testResult.data?.[0]?.id);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

simpleEmployeeAnalysis();

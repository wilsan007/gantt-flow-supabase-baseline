// Analyse approfondie de la contrainte employee_id
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeEmployeeConstraint() {
  console.log('🔍 ANALYSE APPROFONDIE CONTRAINTE EMPLOYEE_ID');
  console.log('=' .repeat(60));

  try {
    // 1. Vérifier les employés existants avec EMP001
    console.log('\n1️⃣ EMPLOYÉS AVEC EMP001:');
    const { data: emp001Records, error: emp001Error } = await supabase
      .from('employees')
      .select('id, user_id, employee_id, full_name, tenant_id, email')
      .eq('employee_id', 'EMP001');

    if (emp001Error) {
      console.log('❌ Erreur:', emp001Error.message);
    } else {
      console.log(`📊 Nombre d'employés avec EMP001: ${emp001Records?.length || 0}`);
      emp001Records?.forEach((emp, index) => {
        console.log(`  ${index + 1}. ID: ${emp.id}`);
        console.log(`     User ID: ${emp.user_id}`);
        console.log(`     Tenant ID: ${emp.tenant_id}`);
        console.log(`     Email: ${emp.email}`);
        console.log(`     Nom: ${emp.full_name}`);
        console.log('');
      });
    }

    // 2. Vérifier tous les employés du tenant cible
    console.log('\n2️⃣ EMPLOYÉS DU TENANT 73870956-03c5-49a3-b3c3-257bc7e10fc6:');
    const { data: tenantEmployees, error: tenantError } = await supabase
      .from('employees')
      .select('id, user_id, employee_id, full_name, email')
      .eq('tenant_id', '73870956-03c5-49a3-b3c3-257bc7e10fc6');

    if (tenantError) {
      console.log('❌ Erreur:', tenantError.message);
    } else {
      console.log(`📊 Nombre d'employés dans ce tenant: ${tenantEmployees?.length || 0}`);
      tenantEmployees?.forEach((emp, index) => {
        console.log(`  ${index + 1}. Employee ID: ${emp.employee_id} (User: ${emp.user_id})`);
      });
    }

    // 3. Vérifier la structure de la table employees
    console.log('\n3️⃣ STRUCTURE TABLE EMPLOYEES:');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_constraints', { table_name: 'employees' })
      .catch(() => null);

    // Alternative: essayer une requête directe
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'employees')
      .eq('table_schema', 'public')
      .catch(() => null);

    if (constraints) {
      console.log('📋 Contraintes trouvées:');
      constraints.forEach(c => {
        console.log(`  - ${c.constraint_name}: ${c.constraint_type}`);
      });
    }

    // 4. Tester la génération d'employee_id pour ce tenant
    console.log('\n4️⃣ TEST GÉNÉRATION EMPLOYEE_ID:');
    const { data: maxEmployeeId, error: maxError } = await supabase
      .rpc('test_employee_id_generation', { 
        target_tenant_id: '73870956-03c5-49a3-b3c3-257bc7e10fc6' 
      })
      .catch(() => null);

    if (maxError) {
      console.log('❌ Erreur test génération:', maxError.message);
    } else if (maxEmployeeId) {
      console.log('✅ Prochain employee_id:', maxEmployeeId);
    }

    // 5. Vérifier si l'utilisateur a déjà un employé
    console.log('\n5️⃣ EMPLOYÉ EXISTANT POUR USER a61224ce-6066-4eda-a3e2-399b0e2e36c1:');
    const { data: existingEmployee, error: existingError } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', 'a61224ce-6066-4eda-a3e2-399b0e2e36c1');

    if (existingError) {
      console.log('❌ Erreur:', existingError.message);
    } else {
      console.log(`📊 Employés existants: ${existingEmployee?.length || 0}`);
      existingEmployee?.forEach((emp, index) => {
        console.log(`  ${index + 1}. Employee ID: ${emp.employee_id}`);
        console.log(`     Tenant ID: ${emp.tenant_id}`);
        console.log(`     Status: ${emp.status}`);
      });
    }

    // 6. Vérifier les contraintes uniques sur employee_id
    console.log('\n6️⃣ ANALYSE CONTRAINTES UNIQUE:');
    
    // Test d'insertion directe pour comprendre l'erreur
    console.log('\n7️⃣ TEST INSERTION DIRECTE:');
    const testInsert = await supabase
      .from('employees')
      .insert({
        user_id: 'a61224ce-6066-4eda-a3e2-399b0e2e36c1',
        employee_id: 'EMP999', // ID différent pour test
        full_name: 'Test User',
        email: 'test@example.com',
        job_title: 'Test',
        hire_date: '2025-01-01',
        contract_type: 'CDI',
        status: 'active',
        tenant_id: '73870956-03c5-49a3-b3c3-257bc7e10fc6'
      })
      .select();

    if (testInsert.error) {
      console.log('❌ Erreur insertion test:', testInsert.error.message);
      console.log('   Code:', testInsert.error.code);
      console.log('   Details:', testInsert.error.details);
    } else {
      console.log('✅ Insertion test réussie');
      
      // Nettoyer le test
      await supabase
        .from('employees')
        .delete()
        .eq('user_id', 'a61224ce-6066-4eda-a3e2-399b0e2e36c1')
        .eq('employee_id', 'EMP999');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

analyzeEmployeeConstraint();

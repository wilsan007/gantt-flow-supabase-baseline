#!/usr/bin/env node

/**
 * Test de la génération d'employee_id unique
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, serviceKey);

async function testEmployeeIdGeneration() {
  console.log('🧪 TEST GÉNÉRATION EMPLOYEE_ID');
  console.log('=' .repeat(40));

  try {
    // 1. Voir les employee_id existants
    console.log('\n📋 1. Employee_id existants:');
    
    const { data: existingEmployees } = await supabase
      .from('employees')
      .select('employee_id, full_name')
      .like('employee_id', 'EMP%')
      .order('employee_id');

    if (existingEmployees && existingEmployees.length > 0) {
      existingEmployees.forEach(emp => {
        console.log(`   ${emp.employee_id} - ${emp.full_name}`);
      });
    } else {
      console.log('   Aucun employee_id trouvé');
    }

    // 2. Simuler la logique de génération
    console.log('\n🔢 2. Test logique de génération:');
    
    const usedNumbers = new Set();
    if (existingEmployees && existingEmployees.length > 0) {
      existingEmployees.forEach(emp => {
        const match = emp.employee_id.match(/^EMP(\d{3})$/);
        if (match) {
          usedNumbers.add(parseInt(match[1]));
        }
      });
    }

    console.log('   Numéros utilisés:', Array.from(usedNumbers).sort((a, b) => a - b));

    // Trouver le premier numéro disponible
    let employeeIdCounter = 1;
    while (usedNumbers.has(employeeIdCounter)) {
      employeeIdCounter++;
    }

    const nextEmployeeId = `EMP${employeeIdCounter.toString().padStart(3, '0')}`;
    console.log('   Prochain employee_id disponible:', nextEmployeeId);

    // 3. Tester avec plusieurs générations
    console.log('\n🎯 3. Simulation de 5 prochains ID:');
    
    const simulatedUsed = new Set(usedNumbers);
    for (let i = 0; i < 5; i++) {
      let counter = 1;
      while (simulatedUsed.has(counter)) {
        counter++;
      }
      const id = `EMP${counter.toString().padStart(3, '0')}`;
      console.log(`   ${i + 1}. ${id}`);
      simulatedUsed.add(counter);
    }

    // 4. Test avec des trous dans la séquence
    console.log('\n🕳️  4. Test avec trous dans la séquence:');
    
    // Simuler des employee_id avec des trous : EMP001, EMP003, EMP005
    const testUsed = new Set([1, 3, 5, 10, 15]);
    console.log('   Numéros simulés utilisés:', Array.from(testUsed));
    
    for (let i = 0; i < 3; i++) {
      let counter = 1;
      while (testUsed.has(counter)) {
        counter++;
      }
      const id = `EMP${counter.toString().padStart(3, '0')}`;
      console.log(`   Prochain disponible: ${id}`);
      testUsed.add(counter);
    }

    console.log('\n✅ Test de génération terminé');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testEmployeeIdGeneration();

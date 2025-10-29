/**
 * Script de Test - Vérification Assignation Tâches
 * Analyse les données pour comprendre pourquoi les noms n'apparaissent pas
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qliinxtanjdnwxlvnxji.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SERVICE_ROLE_KEY manquant');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const TEST_USER_ID = '5c5731ce-75d0-4455-8184-bc42c626cb17';

async function analyzeTaskAssignees() {
  console.log('\n🔍 ANALYSE ASSIGNATION TÂCHES\n' + '='.repeat(60));

  // 1. Récupérer le tenant
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', TEST_USER_ID)
    .single();

  if (!profile?.tenant_id) {
    console.error('❌ Tenant non trouvé');
    return;
  }

  const tenantId = profile.tenant_id;
  console.log(`✅ Tenant ID: ${tenantId}\n`);

  // 2. Récupérer les tâches SANS jointure
  console.log('📋 TÂCHES (données brutes):');
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, assignee_id, assigned_name')
    .eq('tenant_id', tenantId)
    .limit(10);

  if (tasks && tasks.length > 0) {
    tasks.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.title}`);
      console.log(`     - assignee_id: ${t.assignee_id || 'NULL'}`);
      console.log(`     - assigned_name: ${t.assigned_name || 'NULL'}`);
    });
  } else {
    console.log('  Aucune tâche trouvée\n');
    return;
  }

  // 3. Récupérer les tâches AVEC jointure (comme useTasksEnterprise)
  console.log('\n📋 TÂCHES (avec jointure assignee):');
  const { data: tasksWithJoin, error } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      assignee_id,
      assigned_name,
      assignee:assignee_id(id, user_id, full_name, employee_id)
    `)
    .eq('tenant_id', tenantId)
    .limit(10);

  if (error) {
    console.error('❌ Erreur jointure:', error.message);
  }

  if (tasksWithJoin) {
    tasksWithJoin.forEach((t: any, i) => {
      console.log(`  ${i + 1}. ${t.title}`);
      console.log(`     - assignee_id: ${t.assignee_id || 'NULL'}`);
      console.log(`     - assigned_name: ${t.assigned_name || 'NULL'}`);
      console.log(`     - assignee (jointure): ${t.assignee ? JSON.stringify(t.assignee) : 'NULL'}`);
    });
  }

  // 4. Vérifier les employés
  console.log('\n👥 EMPLOYÉS DU TENANT:');
  const { data: employees } = await supabase
    .from('employees')
    .select('id, user_id, full_name, employee_id')
    .eq('tenant_id', tenantId)
    .limit(10);

  if (employees) {
    employees.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.full_name} (${e.employee_id})`);
      console.log(`     - id: ${e.id}`);
      console.log(`     - user_id: ${e.user_id || 'NULL'}`);
    });
  }

  // 5. Analyse de cohérence
  console.log('\n🔍 ANALYSE COHÉRENCE:');
  if (tasks && employees) {
    const taskAssigneeIds = tasks.map(t => t.assignee_id).filter(Boolean);
    const employeeIds = employees.map(e => e.id);
    const employeeUserIds = employees.map(e => e.user_id).filter(Boolean);

    console.log(`  Tâches avec assignee_id: ${taskAssigneeIds.length}/${tasks.length}`);
    console.log(`  Employés dans le tenant: ${employees.length}`);
    
    // Vérifier si assignee_id correspond à employees.id
    const matchingIds = taskAssigneeIds.filter(id => employeeIds.includes(id));
    console.log(`  assignee_id qui matchent employees.id: ${matchingIds.length}/${taskAssigneeIds.length}`);
    
    // Vérifier si assignee_id correspond à employees.user_id
    const matchingUserIds = taskAssigneeIds.filter(id => employeeUserIds.includes(id));
    console.log(`  assignee_id qui matchent employees.user_id: ${matchingUserIds.length}/${taskAssigneeIds.length}`);

    if (matchingIds.length === 0 && matchingUserIds.length > 0) {
      console.log('\n⚠️  PROBLÈME DÉTECTÉ:');
      console.log('  assignee_id semble contenir des user_id au lieu de employees.id');
      console.log('  La foreign key tasks_assignee_id_fkey pointe vers employees(id)');
      console.log('  Mais les données contiennent employees.user_id');
      console.log('\n💡 SOLUTION:');
      console.log('  Modifier la foreign key pour pointer vers employees(user_id)');
      console.log('  OU mettre à jour assignee_id pour utiliser employees.id');
    }
  }

  // 6. Test avec profiles au lieu d'employees
  console.log('\n📋 TEST avec profiles (full_name):');
  const { data: tasksWithProfiles, error: profileError } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      assignee_id,
      profiles:assignee_id(id, user_id, full_name)
    `)
    .eq('tenant_id', tenantId)
    .limit(5);

  if (profileError) {
    console.error('❌ Erreur jointure profiles:', profileError.message);
  } else if (tasksWithProfiles) {
    tasksWithProfiles.forEach((t: any, i) => {
      console.log(`  ${i + 1}. ${t.title}`);
      console.log(`     - profiles (jointure): ${t.profiles ? JSON.stringify(t.profiles) : 'NULL'}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

analyzeTaskAssignees()
  .then(() => {
    console.log('\n✅ Analyse terminée\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  });

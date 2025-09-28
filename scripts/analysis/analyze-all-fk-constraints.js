import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeFKConstraints() {
  console.log('=== ANALYSE DES CONTRAINTES FK POUR LES 11 TABLES ===\n');

  const definitionTables = [
    'roles', 'permissions', 'role_permissions', 'absence_types', 
    'alert_types', 'evaluation_categories', 'expense_categories', 
    'alert_solutions', 'skills', 'positions', 'alert_type_solutions'
  ];

  console.log('1. CONTRAINTES FK IDENTIFIÉES:');
  console.log('   - role_permissions.role_id → roles.id');
  console.log('   - role_permissions.permission_id → permissions.id');
  console.log('   - alert_type_solutions.alert_type_id → alert_types.id');
  console.log('   - alert_type_solutions.solution_id → alert_solutions.id');

  console.log('\n2. AUTRES RÉFÉRENCES POTENTIELLES:');
  console.log('   - user_roles.role_id → roles.id');
  console.log('   - profiles.role → roles.name (string reference)');
  console.log('   - absences.absence_type_id → absence_types.id');
  console.log('   - employee_skills.skill_id → skills.id (si existe)');
  console.log('   - employee_positions.position_id → positions.id (si existe)');

  console.log('\n3. VÉRIFICATION DES RÉFÉRENCES ORPHELINES:');
  
  try {
    // Vérifier user_roles → roles
    const { data: orphanUserRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('id, role_id')
      .not('role_id', 'in', `(SELECT id FROM roles)`);

    if (!userRolesError && orphanUserRoles) {
      console.log(`   - user_roles orphelins: ${orphanUserRoles.length}`);
    }

    // Vérifier absences → absence_types
    const { data: orphanAbsences, error: absencesError } = await supabase
      .from('absences')
      .select('id, absence_type_id')
      .not('absence_type_id', 'in', `(SELECT id FROM absence_types)`);

    if (!absencesError && orphanAbsences) {
      console.log(`   - absences orphelines: ${orphanAbsences.length}`);
    }

    // Vérifier role_permissions → roles/permissions
    const { data: orphanRolePerms, error: rolePermsError } = await supabase
      .from('role_permissions')
      .select('id, role_id, permission_id')
      .or('role_id.not.in.(SELECT id FROM roles),permission_id.not.in.(SELECT id FROM permissions)');

    if (!rolePermsError && orphanRolePerms) {
      console.log(`   - role_permissions orphelins: ${orphanRolePerms.length}`);
    }

    // Vérifier alert_type_solutions → alert_types/alert_solutions
    const { data: orphanAlertTypeSols, error: alertTypeSolsError } = await supabase
      .from('alert_type_solutions')
      .select('id, alert_type_id, solution_id')
      .or('alert_type_id.not.in.(SELECT id FROM alert_types),solution_id.not.in.(SELECT id FROM alert_solutions)');

    if (!alertTypeSolsError && orphanAlertTypeSols) {
      console.log(`   - alert_type_solutions orphelins: ${orphanAlertTypeSols.length}`);
    }

  } catch (err) {
    console.log('   - Erreur lors de la vérification:', err.message);
  }

  console.log('\n4. ORDRE D\'EXÉCUTION RECOMMANDÉ:');
  console.log('   DELETE (ordre inverse des dépendances):');
  console.log('   1. alert_type_solutions (dépend de alert_types + alert_solutions)');
  console.log('   2. role_permissions (dépend de roles + permissions)');
  console.log('   3. roles, permissions, alert_types, alert_solutions');
  console.log('   4. absence_types, evaluation_categories, expense_categories');
  console.log('   5. skills, positions');

  console.log('\n   INSERT (ordre des dépendances):');
  console.log('   1. roles, permissions, alert_types, alert_solutions');
  console.log('   2. absence_types, evaluation_categories, expense_categories');
  console.log('   3. skills, positions');
  console.log('   4. role_permissions (avec validation FK)');
  console.log('   5. alert_type_solutions (avec validation FK)');

  console.log('\n5. CORRECTIONS NÉCESSAIRES DANS LE SCRIPT:');
  console.log('   ✅ alert_type_solutions: validation FK ajoutée');
  console.log('   ✅ role_permissions: validation FK ajoutée');
  console.log('   ✅ Ordre DELETE: tables de liaison en premier');
  console.log('   ✅ Ordre INSERT: tables de base puis liaisons');

  console.log('\n=== ANALYSE TERMINÉE ===');
}

analyzeFKConstraints();

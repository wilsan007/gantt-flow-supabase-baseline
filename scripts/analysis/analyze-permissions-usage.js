import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzePermissionsUsage() {
  console.log('=== ANALYSE DE L\'USAGE DES PERMISSIONS ===\n');

  try {
    // 1. Analyser les politiques RLS sur les tables
    console.log('1. POLITIQUES RLS SUR LES TABLES DE PERMISSIONS:');
    
    // Analyser les politiques RLS directement

    // Alternative: requête directe sur pg_policies
    const { data: rolesInfo, error: rolesError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', 'roles')
      .eq('table_schema', 'public');

    if (!rolesError) {
      console.log('Structure de la table roles:');
      rolesInfo.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    }

    // 2. Analyser les colonnes tenant_id dans les tables
    console.log('\n2. COLONNES TENANT_ID DANS LES TABLES:');
    
    const tables = ['roles', 'permissions', 'role_permissions'];
    for (const table of tables) {
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', table)
        .eq('table_schema', 'public')
        .in('column_name', ['tenant_id', 'user_id']);

      if (!error && columns.length > 0) {
        console.log(`Table ${table}:`);
        columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
      }
    }

    // 3. Analyser les données avec tenant_id
    console.log('\n3. RÉPARTITION DES DONNÉES PAR TENANT:');
    
    // Roles par tenant
    const { data: rolesByTenant, error: rolesErr } = await supabase
      .from('roles')
      .select('tenant_id, name, count(*)')
      .not('tenant_id', 'is', null);

    if (!rolesErr && rolesByTenant) {
      console.log('Rôles par tenant:');
      const tenantCounts = {};
      rolesByTenant.forEach(role => {
        if (!tenantCounts[role.tenant_id]) tenantCounts[role.tenant_id] = 0;
        tenantCounts[role.tenant_id]++;
      });
      Object.entries(tenantCounts).forEach(([tenantId, count]) => {
        console.log(`  Tenant ${tenantId}: ${count} rôles`);
      });
    }

    // 4. Vérifier si les rôles sont vraiment spécifiques aux tenants
    console.log('\n4. ANALYSE DES RÔLES DUPLIQUÉS:');
    
    const { data: roleNames, error: namesErr } = await supabase
      .from('roles')
      .select('name, tenant_id, count(*)')
      .order('name');

    if (!namesErr && roleNames) {
      const nameGroups = {};
      roleNames.forEach(role => {
        if (!nameGroups[role.name]) nameGroups[role.name] = [];
        nameGroups[role.name].push(role.tenant_id);
      });

      Object.entries(nameGroups).forEach(([name, tenants]) => {
        if (tenants.length > 1) {
          console.log(`Rôle "${name}" existe dans ${tenants.length} tenants`);
        }
      });
    }

    // 5. Analyser les user_roles pour comprendre l'usage
    console.log('\n5. USAGE DES USER_ROLES:');
    
    const { data: userRolesUsage, error: urErr } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles:role_id (name, tenant_id)
      `)
      .limit(10);

    if (!urErr && userRolesUsage) {
      console.log('Exemples d\'assignations user_roles:');
      userRolesUsage.forEach(ur => {
        console.log(`  User ${ur.user_id} -> Rôle "${ur.roles?.name}" (tenant: ${ur.roles?.tenant_id})`);
      });
    }

  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

analyzePermissionsUsage();

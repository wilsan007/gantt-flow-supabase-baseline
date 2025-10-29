import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugRLSPermissions() {
  console.log('🔍 DIAGNOSTIC RLS ET PERMISSIONS');
  console.log('================================');
  
  try {
    // 1. Vérifier l'utilisateur Super Admin
    console.log('\n1️⃣ Vérification Super Admin...');
    
    const { data: superAdmin, error: superAdminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', '5c5731ce-75d0-4455-8184-bc42c626cb17')
      .single();
    
    if (superAdminError) {
      console.error('❌ Erreur Super Admin:', superAdminError);
    } else {
      console.log('✅ Super Admin trouvé:', {
        user_id: superAdmin.user_id,
        email: superAdmin.email,
        tenant_id: superAdmin.tenant_id,
        role: superAdmin.role
      });
    }
    
    // 2. Vérifier les rôles du Super Admin
    console.log('\n2️⃣ Vérification rôles Super Admin...');
    
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles(name, display_name)
      `)
      .eq('user_id', '5c5731ce-75d0-4455-8184-bc42c626cb17');
    
    if (rolesError) {
      console.error('❌ Erreur rôles:', rolesError);
    } else {
      console.log('✅ Rôles Super Admin:', userRoles?.map(ur => ({
        role: ur.roles.name,
        tenant_id: ur.tenant_id,
        is_active: ur.is_active
      })));
    }
    
    // 3. Compter les projets SANS RLS (avec service_role)
    console.log('\n3️⃣ Comptage projets SANS RLS...');
    
    const { count: totalProjects, error: projectCountError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    if (projectCountError) {
      console.error('❌ Erreur comptage projets:', projectCountError);
    } else {
      console.log(`✅ Total projets en DB: ${totalProjects}`);
    }
    
    // 4. Compter les tâches SANS RLS
    console.log('\n4️⃣ Comptage tâches SANS RLS...');
    
    const { count: totalTasks, error: taskCountError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });
    
    if (taskCountError) {
      console.error('❌ Erreur comptage tâches:', taskCountError);
    } else {
      console.log(`✅ Total tâches en DB: ${totalTasks}`);
    }
    
    // 5. Vérifier les politiques RLS
    console.log('\n5️⃣ Vérification politiques RLS...');
    
    const tables = ['projects', 'tasks', 'profiles', 'user_roles'];
    
    for (const table of tables) {
      const { data: policies, error: policyError } = await supabase
        .rpc('get_table_policies', { table_name: table })
        .catch(() => ({ data: null, error: 'RPC non disponible' }));
      
      if (policyError) {
        console.log(`⚠️ ${table}: Impossible de vérifier les politiques`);
      } else {
        console.log(`📋 ${table}: ${policies?.length || 0} politique(s)`);
      }
    }
    
    // 6. Créer des données de test si aucune n'existe
    if (totalProjects === 0) {
      console.log('\n6️⃣ Création de données de test...');
      
      // Créer un projet de test
      const { data: testProject, error: createProjectError } = await supabase
        .from('projects')
        .insert({
          name: 'Projet Test',
          description: 'Projet de test pour vérifier les permissions',
          status: 'active',
          tenant_id: '00000000-0000-0000-0000-000000000000', // Tenant Super Admin
          manager_id: '5c5731ce-75d0-4455-8184-bc42c626cb17'
        })
        .select()
        .single();
      
      if (createProjectError) {
        console.error('❌ Erreur création projet test:', createProjectError);
      } else {
        console.log('✅ Projet test créé:', testProject.id);
        
        // Créer une tâche de test
        const { data: testTask, error: createTaskError } = await supabase
          .from('tasks')
          .insert({
            title: 'Tâche Test',
            description: 'Tâche de test pour vérifier les permissions',
            status: 'todo',
            project_id: testProject.id,
            tenant_id: '00000000-0000-0000-0000-000000000000',
            assigned_to: '5c5731ce-75d0-4455-8184-bc42c626cb17'
          })
          .select()
          .single();
        
        if (createTaskError) {
          console.error('❌ Erreur création tâche test:', createTaskError);
        } else {
          console.log('✅ Tâche test créée:', testTask.id);
        }
      }
    }
    
    // 7. Test avec un client "utilisateur normal" (anon_key)
    console.log('\n7️⃣ Test avec clé anonyme (simulation utilisateur)...');
    
    const userSupabase = createClient(
      supabaseUrl, 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.6z-WQqyKHcM_rLSrJJhGSHFkrLHgHFJxWvfOgAy-Kqg'
    );
    
    // Simuler une session utilisateur
    await userSupabase.auth.setSession({
      access_token: 'fake-token-for-test',
      refresh_token: 'fake-refresh-token'
    });
    
    const { count: userProjects, error: userProjectError } = await userSupabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    if (userProjectError) {
      console.log('❌ Accès projets avec clé utilisateur:', userProjectError.message);
    } else {
      console.log(`✅ Projets visibles avec clé utilisateur: ${userProjects}`);
    }
    
    console.log('\n🎯 DIAGNOSTIC TERMINÉ');
    console.log('====================');
    
    if (totalProjects === 0 && totalTasks === 0) {
      console.log('💡 PROBLÈME: Aucune donnée en base');
      console.log('   SOLUTION: Créer des projets/tâches de test');
    } else if (totalProjects > 0 && totalTasks > 0) {
      console.log('💡 PROBLÈME: RLS bloque probablement l\'accès');
      console.log('   SOLUTION: Vérifier les politiques RLS et user_roles');
    }
    
  } catch (error) {
    console.error('💥 Erreur diagnostic:', error);
  }
}

debugRLSPermissions();

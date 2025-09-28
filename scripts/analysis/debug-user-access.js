import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function debugUserAccess() {
  console.log('🔍 DEBUG: ACCÈS UTILISATEUR DONNÉES');
  console.log('===================================\n');

  const userId = "5c5731ce-75d0-4455-8184-bc42c626cb17";
  const userEmail = "awalehnasri@gmail.com";

  try {
    // 1. Vérifier le profil utilisateur
    console.log('1️⃣ Profil utilisateur...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('❌ Erreur profil:', profileError);
    } else {
      console.log('✅ Profil trouvé:');
      console.log(`   - Nom: ${profile.full_name}`);
      console.log(`   - Email: ${profile.email}`);
      console.log(`   - Tenant ID: ${profile.tenant_id}`);
      console.log(`   - Rôle: ${profile.role}`);
    }

    // 2. Vérifier les rôles utilisateur
    console.log('\n2️⃣ Rôles utilisateur...');
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles:role_id(name, permissions),
        tenants:tenant_id(name)
      `)
      .eq('user_id', userId);

    if (rolesError) {
      console.error('❌ Erreur rôles:', rolesError);
    } else {
      console.log(`✅ ${userRoles.length} rôle(s) trouvé(s):`);
      userRoles.forEach(role => {
        console.log(`   - Rôle: ${role.roles?.name}`);
        console.log(`   - Tenant: ${role.tenants?.name}`);
        console.log(`   - Actif: ${role.is_active}`);
      });
    }

    // 3. Vérifier le tenant
    if (profile?.tenant_id) {
      console.log('\n3️⃣ Informations tenant...');
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single();

      if (tenantError) {
        console.error('❌ Erreur tenant:', tenantError);
      } else {
        console.log('✅ Tenant trouvé:');
        console.log(`   - Nom: ${tenant.name}`);
        console.log(`   - Statut: ${tenant.status}`);
        console.log(`   - Créé: ${tenant.created_at}`);
      }
    }

    // 4. Vérifier les tâches disponibles
    console.log('\n4️⃣ Tâches disponibles...');
    const { data: tasks, error: tasksError, count: tasksCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact' })
      .limit(5);

    if (tasksError) {
      console.error('❌ Erreur tâches:', tasksError);
    } else {
      console.log(`✅ ${tasksCount} tâche(s) totale(s) dans la base`);
      if (tasks.length > 0) {
        console.log('Exemples:');
        tasks.forEach(task => {
          console.log(`   - ${task.title} (Tenant: ${task.tenant_id})`);
        });
      }
    }

    // 5. Vérifier les tâches du tenant utilisateur
    if (profile?.tenant_id) {
      console.log('\n5️⃣ Tâches du tenant utilisateur...');
      const { data: tenantTasks, error: tenantTasksError, count: tenantTasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('tenant_id', profile.tenant_id);

      if (tenantTasksError) {
        console.error('❌ Erreur tâches tenant:', tenantTasksError);
      } else {
        console.log(`✅ ${tenantTasksCount} tâche(s) pour ce tenant`);
        if (tenantTasks.length > 0) {
          tenantTasks.forEach(task => {
            console.log(`   - ${task.title} (Statut: ${task.status})`);
          });
        }
      }
    }

    // 6. Vérifier les projets
    console.log('\n6️⃣ Projets disponibles...');
    const { data: projects, error: projectsError, count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .limit(5);

    if (projectsError) {
      console.error('❌ Erreur projets:', projectsError);
    } else {
      console.log(`✅ ${projectsCount} projet(s) totaux dans la base`);
      if (projects.length > 0) {
        projects.forEach(project => {
          console.log(`   - ${project.name} (Tenant: ${project.tenant_id})`);
        });
      }
    }

    // 7. Vérifier les employés
    console.log('\n7️⃣ Employés...');
    const { data: employees, error: employeesError, count: employeesCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .eq('tenant_id', profile?.tenant_id || 'none');

    if (employeesError) {
      console.error('❌ Erreur employés:', employeesError);
    } else {
      console.log(`✅ ${employeesCount} employé(s) pour ce tenant`);
    }

    // 8. Recommandations
    console.log('\n8️⃣ RECOMMANDATIONS:');
    console.log('─────────────────────────────────');
    
    if (!profile) {
      console.log('🔧 Créer un profil pour cet utilisateur');
    }
    
    if (!profile?.tenant_id) {
      console.log('🔧 Assigner un tenant à cet utilisateur');
    }
    
    if (tasksCount === 0) {
      console.log('🔧 Créer des tâches de démonstration');
    }
    
    if (projectsCount === 0) {
      console.log('🔧 Créer des projets de démonstration');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le debug
debugUserAccess();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeContextIssues() {
  console.log('');
  console.log('═'.repeat(80));
  console.log('🔍 ANALYSE DES PROBLÈMES DE CONTEXTE dans user_roles');
  console.log('═'.repeat(80));
  console.log('');

  try {
    // Récupérer tous les user_roles avec leurs rôles
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select(`
        id,
        user_id,
        role_id,
        context_type,
        context_id,
        tenant_id,
        is_active,
        created_at,
        roles (
          name,
          display_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`📊 Total lignes: ${userRoles.length}`);
    console.log('');

    // Problème 1: context_type = 'global' MAIS context_id != NULL
    console.log('⚠️  PROBLÈME 1: context_type = "global" avec context_id NON NULL');
    console.log('─'.repeat(80));
    
    const globalWithId = userRoles.filter(
      ur => ur.context_type === 'global' && ur.context_id !== null
    );

    if (globalWithId.length > 0) {
      console.log(`   Trouvé: ${globalWithId.length} lignes`);
      console.log('');
      globalWithId.slice(0, 10).forEach(ur => {
        console.log(`   • ID: ${ur.id.substring(0, 8)}...`);
        console.log(`     Role: ${ur.roles?.name || 'N/A'}`);
        console.log(`     context_type: ${ur.context_type}`);
        console.log(`     context_id: ${ur.context_id} ❌ (devrait être NULL)`);
        console.log(`     tenant_id: ${ur.tenant_id}`);
        console.log(`     Créé: ${new Date(ur.created_at).toLocaleString()}`);
        console.log('');
      });
      if (globalWithId.length > 10) {
        console.log(`   ... et ${globalWithId.length - 10} autres lignes`);
        console.log('');
      }
    } else {
      console.log('   ✅ Aucun problème détecté');
      console.log('');
    }

    // Problème 2: context_id = tenant_id (redondance)
    console.log('⚠️  PROBLÈME 2: context_id = tenant_id (redondance)');
    console.log('─'.repeat(80));
    
    const contextIdEqualsTenantId = userRoles.filter(
      ur => ur.context_id !== null && ur.context_id === ur.tenant_id
    );

    if (contextIdEqualsTenantId.length > 0) {
      console.log(`   Trouvé: ${contextIdEqualsTenantId.length} lignes`);
      console.log('');
      contextIdEqualsTenantId.slice(0, 10).forEach(ur => {
        console.log(`   • ID: ${ur.id.substring(0, 8)}...`);
        console.log(`     Role: ${ur.roles?.name || 'N/A'}`);
        console.log(`     context_type: ${ur.context_type}`);
        console.log(`     context_id: ${ur.context_id} ❌`);
        console.log(`     tenant_id: ${ur.tenant_id} ❌ (même valeur!)`);
        console.log(`     Créé: ${new Date(ur.created_at).toLocaleString()}`);
        console.log('');
      });
      if (contextIdEqualsTenantId.length > 10) {
        console.log(`   ... et ${contextIdEqualsTenantId.length - 10} autres lignes`);
        console.log('');
      }
    } else {
      console.log('   ✅ Aucun problème détecté');
      console.log('');
    }

    // Problème 3: context_type = 'project' mais context_id ne correspond à aucun projet
    console.log('⚠️  PROBLÈME 3: context_type = "project" avec context_id invalide');
    console.log('─'.repeat(80));
    
    const projectContexts = userRoles.filter(ur => ur.context_type === 'project');
    
    if (projectContexts.length > 0) {
      const projectIds = [...new Set(projectContexts.map(ur => ur.context_id))];
      
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .in('id', projectIds);
      
      const validProjectIds = new Set(projects?.map(p => p.id) || []);
      
      const invalidProjects = projectContexts.filter(
        ur => !validProjectIds.has(ur.context_id)
      );

      if (invalidProjects.length > 0) {
        console.log(`   Trouvé: ${invalidProjects.length} lignes avec context_id invalide`);
        console.log('');
        invalidProjects.slice(0, 5).forEach(ur => {
          console.log(`   • ID: ${ur.id.substring(0, 8)}...`);
          console.log(`     Role: ${ur.roles?.name || 'N/A'}`);
          console.log(`     context_id: ${ur.context_id} ❌ (projet inexistant)`);
          console.log('');
        });
      } else {
        console.log('   ✅ Tous les context_id pointent vers des projets valides');
        console.log('');
      }
    } else {
      console.log('   ℹ️  Aucun rôle avec context_type = "project"');
      console.log('');
    }

    // Problème 4: context_type = 'department' mais context_id ne correspond à aucun département
    console.log('⚠️  PROBLÈME 4: context_type = "department" avec context_id invalide');
    console.log('─'.repeat(80));
    
    const departmentContexts = userRoles.filter(ur => ur.context_type === 'department');
    
    if (departmentContexts.length > 0) {
      const deptIds = [...new Set(departmentContexts.map(ur => ur.context_id))];
      
      const { data: departments } = await supabase
        .from('departments')
        .select('id')
        .in('id', deptIds);
      
      const validDeptIds = new Set(departments?.map(d => d.id) || []);
      
      const invalidDepts = departmentContexts.filter(
        ur => !validDeptIds.has(ur.context_id)
      );

      if (invalidDepts.length > 0) {
        console.log(`   Trouvé: ${invalidDepts.length} lignes avec context_id invalide`);
        console.log('');
        invalidDepts.slice(0, 5).forEach(ur => {
          console.log(`   • ID: ${ur.id.substring(0, 8)}...`);
          console.log(`     Role: ${ur.roles?.name || 'N/A'}`);
          console.log(`     context_id: ${ur.context_id} ❌ (département inexistant)`);
          console.log('');
        });
      } else {
        console.log('   ✅ Tous les context_id pointent vers des départements valides');
        console.log('');
      }
    } else {
      console.log('   ℹ️  Aucun rôle avec context_type = "department"');
      console.log('');
    }

    // Statistiques par context_type
    console.log('📊 STATISTIQUES PAR CONTEXT_TYPE');
    console.log('─'.repeat(80));
    
    const stats = userRoles.reduce((acc, ur) => {
      const type = ur.context_type || 'NULL';
      if (!acc[type]) {
        acc[type] = { count: 0, withId: 0, withoutId: 0 };
      }
      acc[type].count++;
      if (ur.context_id !== null) {
        acc[type].withId++;
      } else {
        acc[type].withoutId++;
      }
      return acc;
    }, {});

    Object.entries(stats).forEach(([type, data]) => {
      console.log(`   ${type}:`);
      console.log(`     Total: ${data.count}`);
      console.log(`     Avec context_id: ${data.withId}`);
      console.log(`     Sans context_id (NULL): ${data.withoutId}`);
      console.log('');
    });

    // Résumé des problèmes
    console.log('═'.repeat(80));
    console.log('📋 RÉSUMÉ DES PROBLÈMES');
    console.log('═'.repeat(80));
    console.log('');
    
    const totalProblems = globalWithId.length + contextIdEqualsTenantId.length;
    
    if (totalProblems > 0) {
      console.log(`   ⚠️  ${totalProblems} lignes avec des problèmes de contexte détectées`);
      console.log('');
      console.log('   Problèmes identifiés:');
      if (globalWithId.length > 0) {
        console.log(`   • ${globalWithId.length} lignes: context_type="global" avec context_id non NULL`);
      }
      if (contextIdEqualsTenantId.length > 0) {
        console.log(`   • ${contextIdEqualsTenantId.length} lignes: context_id = tenant_id (redondance)`);
      }
      console.log('');
      console.log('   💡 SOLUTION:');
      console.log('      Ces lignes doivent être corrigées avant la migration 230');
      console.log('      Exécutez: fix-context-issues-230.sql');
    } else {
      console.log('   ✅ Aucun problème de contexte détecté');
      console.log('   La migration 230 peut être exécutée en toute sécurité');
    }
    console.log('');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

analyzeContextIssues();

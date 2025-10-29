// Script pour vérifier les tâches d'un projet avec hiérarchie parent/enfant
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProject(projectName = 'Migration Cloud') {
  console.log(`\n🔍 Recherche du projet "${projectName}"...\n`);

  // Récupérer le projet
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .ilike('name', `%${projectName}%`);

  if (projectError) {
    console.error('❌ Erreur:', projectError.message);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log(`❌ Projet "${projectName}" non trouvé`);
    return;
  }

  const project = projects[0];
  console.log(`✅ Projet trouvé: ${project.name}`);
  console.log(`📊 ID: ${project.id}`);
  console.log(`📊 Progression: ${project.progress}%\n`);

  // Récupérer TOUTES les tâches du projet avec display_order pour tri
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', project.id)
    .order('display_order');

  if (tasksError) {
    console.error('❌ Erreur lors de la récupération des tâches:', tasksError.message);
    return;
  }

  console.log(`📌 Total tâches trouvées: ${tasks?.length || 0}\n`);

  if (!tasks || tasks.length === 0) {
    console.log('❌ Aucune tâche trouvée pour ce projet');
    return;
  }

  // Séparer les tâches principales et les sous-tâches (utiliser parent_id au lieu de parent_task_id)
  const mainTasks = tasks.filter(t => !t.parent_id);
  const subTasks = tasks.filter(t => t.parent_id);

  console.log('📊 STATISTIQUES:');
  console.log(`   Total tâches: ${tasks.length}`);
  console.log(`   Tâches principales: ${mainTasks.length}`);
  console.log(`   Sous-tâches: ${subTasks.length}\n`);

  console.log('┌─────────────────────────────────────────┬──────────┬──────────┬─────────────┐');
  console.log('│ Tâche                                   │ Type     │ Progress │ Parent      │');
  console.log('├─────────────────────────────────────────┼──────────┼──────────┼─────────────┤');

  // Afficher les tâches principales
  mainTasks.forEach(task => {
    const title = (task.title || 'Sans titre').padEnd(39).substring(0, 39);
    const type = 'Principale'.padEnd(8);
    const progress = `${task.progress || 0}%`.padStart(8);
    const parent = '-'.padEnd(11);
    
    console.log(`│ ${title} │ ${type} │ ${progress} │ ${parent} │`);
    
    // Afficher les sous-tâches de cette tâche (utiliser parent_id)
    const children = subTasks.filter(st => st.parent_id === task.id);
    children.forEach(child => {
      const childTitle = ('  └─ ' + (child.title || 'Sans titre')).padEnd(39).substring(0, 39);
      const childType = 'Sous-tâche'.padEnd(8);
      const childProgress = `${child.progress || 0}%`.padStart(8);
      const parentName = (task.title || '').substring(0, 11).padEnd(11);
      
      console.log(`│ ${childTitle} │ ${childType} │ ${childProgress} │ ${parentName} │`);
    });
  });

  console.log('└─────────────────────────────────────────┴──────────┴──────────┴─────────────┘');

  // Afficher les détails complets
  console.log('\n📋 DÉTAILS COMPLETS:\n');
  
  mainTasks.forEach((task, index) => {
    console.log(`${index + 1}. ${task.title}`);
    console.log(`   ID: ${task.id}`);
    console.log(`   Type: ⭐ TÂCHE PRINCIPALE (task_level: ${task.task_level || 0})`);
    console.log(`   Progress: ${task.progress}%`);
    console.log(`   Assigné à: ${task.assigned_name || 'Non assigné'}`);
    console.log(`   Dates: ${task.start_date || 'N/A'} → ${task.due_date || 'N/A'}`);
    console.log(`   Display Order: ${task.display_order || 'N/A'}`);
    console.log(`   parent_id: ${task.parent_id || 'NULL (tâche principale)'}`);
    
    const children = subTasks.filter(st => st.parent_id === task.id);
    if (children.length > 0) {
      console.log(`   📎 Sous-tâches (${children.length}):`);
      children.forEach((child, idx) => {
        console.log(`     ${idx + 1}. ${child.title} (${child.progress}%)`);
        console.log(`        ID: ${child.id}`);
        console.log(`        Type: 📌 SOUS-TÂCHE (task_level: ${child.task_level || 1})`);
        console.log(`        Assigné à: ${child.assigned_name || 'Non assigné'}`);
        console.log(`        Display Order: ${child.display_order || 'N/A'}`);
      });
    }
    console.log('');
  });

  // Vérifier les liens parents avec parent_id
  console.log('🔍 VÉRIFICATION DES LIENS PARENTS:\n');
  
  const tasksWithParent = tasks.filter(t => t.parent_id);
  
  if (tasksWithParent.length === 0) {
    console.log('✅ Aucune sous-tâche détectée (toutes les tâches sont principales)\n');
  } else {
    console.log(`📌 ${tasksWithParent.length} sous-tâche(s) détectée(s):\n`);
    
    // Vérifier chaque sous-tâche
    const parentChecks = await Promise.all(
      tasksWithParent.map(async (task) => {
        const { data: parentTask } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', task.parent_id)
          .single();
        
        return { task, parentTask };
      })
    );
    
    parentChecks.forEach(({ task, parentTask }) => {
      console.log(`📌 SOUS-TÂCHE: "${task.title}"`);
      console.log(`   ID: ${task.id}`);
      console.log(`   task_level: ${task.task_level || 1}`);
      console.log(`   display_order: ${task.display_order || 'N/A'}`);
      console.log(`   parent_id: ${task.parent_id}`);
      
      if (parentTask) {
        console.log(`   → ✅ TÂCHE PRINCIPALE trouvée: "${parentTask.title}"`);
        console.log(`   → ID parent: ${parentTask.id}`);
        console.log(`   → Projet: ${parentTask.project_name || 'N/A'}`);
        console.log(`   → Display order parent: ${parentTask.display_order || 'N/A'}`);
      } else {
        console.log(`   → ❌ TÂCHE PRINCIPALE NON TROUVÉE (orpheline - le parent n'existe plus)`);
      }
      console.log('');
    });
  }
  
  // Résumé final
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 RÉSUMÉ FINAL:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Projet: ${project.name}`);
  console.log(`Total tâches: ${tasks.length}`);
  console.log(`  ⭐ Tâches principales: ${mainTasks.length}`);
  console.log(`  📌 Sous-tâches: ${subTasks.length}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Permettre de passer le nom du projet en argument
const projectName = process.argv[2] || 'Migration Cloud';
checkProject(projectName).catch(console.error);

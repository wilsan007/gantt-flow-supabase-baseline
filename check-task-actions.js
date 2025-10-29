/**
 * Script de vérification des actions de tâches
 * Vérifie la cohérence des actions par rapport aux tâches
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTaskActions() {
  console.log('🎯 Vérification des actions de tâches...\n');

  try {
    // 1. Récupérer toutes les actions
    const { data: actions, error: actionsError } = await supabase
      .from('task_actions')
      .select('*')
      .order('task_id', { ascending: true })
      .order('created_at', { ascending: true });

    if (actionsError) throw actionsError;

    console.log(`📊 ${actions.length} actions trouvées\n`);

    if (actions.length === 0) {
      console.log('⚠️  Aucune action trouvée dans la base de données\n');
      return;
    }

    // 2. Récupérer toutes les tâches
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, start_date, due_date, parent_id, project_id, projects(name)')
      .order('title', { ascending: true });

    if (tasksError) throw tasksError;

    // Créer un map des tâches pour accès rapide
    const tasksMap = tasks.reduce((acc, task) => {
      acc[task.id] = task;
      return acc;
    }, {});

    // 3. Regrouper les actions par tâche
    const actionsByTask = actions.reduce((acc, action) => {
      if (!acc[action.task_id]) {
        acc[action.task_id] = [];
      }
      acc[action.task_id].push(action);
      return acc;
    }, {});

    console.log('━'.repeat(80));
    console.log('\n📋 Actions par Tâche:\n');

    let totalTasks = 0;
    let tasksWithActions = 0;
    let totalCompleted = 0;
    let totalPending = 0;
    let orphanedActions = 0;

    // 4. Analyser chaque tâche avec ses actions
    Object.entries(actionsByTask).forEach(([taskId, taskActions]) => {
      const task = tasksMap[taskId];
      
      if (!task) {
        console.log(`⚠️  Actions orphelines (tâche supprimée):`);
        taskActions.forEach(action => {
          console.log(`   • ${action.title} (ID: ${action.id})`);
          orphanedActions++;
        });
        console.log('');
        return;
      }

      totalTasks++;
      tasksWithActions++;

      const completed = taskActions.filter(a => a.completed).length;
      const pending = taskActions.filter(a => !a.completed).length;
      const completionRate = Math.round((completed / taskActions.length) * 100);

      totalCompleted += completed;
      totalPending += pending;

      console.log(`📝 Tâche: ${task.title}`);
      console.log(`   Projet: ${task.projects?.name || 'Aucun'}`);
      console.log(`   Type: ${task.parent_id ? 'Sous-tâche' : 'Tâche parente'}`);
      console.log(`   Dates: ${task.start_date || '❌'} → ${task.due_date || '❌'}`);
      console.log(`   Actions: ${taskActions.length} (${completed} ✅ | ${pending} ⏳) - ${completionRate}% complété`);
      console.log('');

      // Afficher les actions
      taskActions.forEach((action, index) => {
        const status = action.completed ? '✅' : '⏳';
        console.log(`   ${index + 1}. ${status} ${action.title}`);
      });

      console.log('');
    });

    // 5. Vérifier les tâches sans actions
    const tasksWithoutActions = tasks.filter(t => !actionsByTask[t.id]);

    if (tasksWithoutActions.length > 0) {
      console.log('━'.repeat(80));
      console.log(`\n⚠️  ${tasksWithoutActions.length} tâche(s) sans actions:\n`);
      
      tasksWithoutActions.forEach(task => {
        console.log(`📝 ${task.title}`);
        console.log(`   Projet: ${task.projects?.name || 'Aucun'}`);
        console.log(`   Type: ${task.parent_id ? 'Sous-tâche' : 'Tâche parente'}`);
        console.log('');
      });
    }

    // 6. Statistiques globales
    console.log('━'.repeat(80));
    console.log('\n📊 Statistiques Globales:\n');
    console.log(`   Total tâches: ${tasks.length}`);
    console.log(`   Tâches avec actions: ${tasksWithActions}`);
    console.log(`   Tâches sans actions: ${tasksWithoutActions.length}`);
    console.log(`   Total actions: ${actions.length}`);
    console.log(`   Actions complétées: ${totalCompleted} (${Math.round((totalCompleted / actions.length) * 100)}%)`);
    console.log(`   Actions en attente: ${totalPending} (${Math.round((totalPending / actions.length) * 100)}%)`);
    
    if (orphanedActions > 0) {
      console.log(`   ⚠️  Actions orphelines: ${orphanedActions}`);
    }

    // 7. Note sur l'ordre d'affichage
    console.log('\n━'.repeat(80));
    console.log('\n📝 Note: Les actions sont triées par date de création\n');

    console.log('━'.repeat(80));
    console.log('\n✅ Vérification terminée\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkTaskActions();

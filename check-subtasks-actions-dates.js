/**
 * Script de vérification des dates de tâches/sous-tâches et actions
 * Vérifie la cohérence hiérarchique complète
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

async function checkSubtasksAndActions() {
  console.log('🔍 Vérification des dates de tâches/sous-tâches et actions...\n');

  try {
    // 1. Récupérer toutes les tâches avec leurs sous-tâches
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, start_date, due_date, parent_id, project_id, projects(name)')
      .order('parent_id', { ascending: true, nullsFirst: true })
      .order('start_date', { ascending: true });

    if (tasksError) throw tasksError;

    // Séparer tâches parentes et sous-tâches
    const parentTasks = allTasks.filter(t => !t.parent_id);
    const subtasks = allTasks.filter(t => t.parent_id);

    console.log(`📊 ${parentTasks.length} tâches parentes`);
    console.log(`📊 ${subtasks.length} sous-tâches\n`);

    let subtaskIssues = 0;

    // 2. Vérifier chaque tâche parente avec ses sous-tâches
    for (const parentTask of parentTasks) {
      const taskSubtasks = subtasks.filter(st => st.parent_id === parentTask.id);
      
      if (taskSubtasks.length === 0) continue;

      console.log('━'.repeat(80));
      console.log(`\n📝 Tâche: ${parentTask.title}`);
      console.log(`   Projet: ${parentTask.projects?.name || 'Aucun'}`);
      console.log(`   Dates de la tâche:`);
      console.log(`     • Début: ${parentTask.start_date || '❌ Non défini'}`);
      console.log(`     • Fin:   ${parentTask.due_date || '❌ Non défini'}`);

      console.log(`\n   📋 ${taskSubtasks.length} sous-tâche(s):`);

      // Calculer les dates min/max des sous-tâches
      const subtaskDates = taskSubtasks
        .filter(st => st.start_date && st.due_date)
        .map(st => ({
          start: new Date(st.start_date),
          end: new Date(st.due_date)
        }));

      if (subtaskDates.length === 0) {
        console.log(`   ⚠️ Aucune sous-tâche avec des dates valides`);
        continue;
      }

      const minSubtaskDate = new Date(Math.min(...subtaskDates.map(d => d.start.getTime())));
      const maxSubtaskDate = new Date(Math.max(...subtaskDates.map(d => d.end.getTime())));

      console.log(`\n   📅 Plage des sous-tâches:`);
      console.log(`     • Date la plus tôt:  ${minSubtaskDate.toISOString().split('T')[0]}`);
      console.log(`     • Date la plus tard: ${maxSubtaskDate.toISOString().split('T')[0]}`);

      // Afficher chaque sous-tâche
      console.log(`\n   📋 Détail des sous-tâches:`);
      taskSubtasks.forEach((subtask) => {
        console.log(`   └─ ${subtask.title}`);
        console.log(`      Début: ${subtask.start_date || '❌'} | Fin: ${subtask.due_date || '❌'}`);
      });

      // Vérifications de cohérence
      console.log(`\n   🔍 Vérifications:`);

      const taskStart = parentTask.start_date ? new Date(parentTask.start_date) : null;
      const taskEnd = parentTask.due_date ? new Date(parentTask.due_date) : null;

      let hasIssues = false;

      if (!taskStart || !taskEnd) {
        console.log(`   ⚠️ La tâche parente n'a pas de dates définies`);
        hasIssues = true;
      } else {
        // Vérification 1: Les sous-tâches commencent après la tâche parente
        if (taskStart > minSubtaskDate) {
          const diff = Math.ceil((taskStart - minSubtaskDate) / (1000 * 60 * 60 * 24));
          console.log(`   ❌ La tâche commence (${parentTask.start_date}) APRÈS la première sous-tâche (${minSubtaskDate.toISOString().split('T')[0]}) - Écart: ${diff} jours`);
          hasIssues = true;
          subtaskIssues++;
        } else {
          console.log(`   ✅ La date de début de la tâche englobe les sous-tâches`);
        }

        // Vérification 2: Les sous-tâches se terminent avant la tâche parente
        if (taskEnd < maxSubtaskDate) {
          const diff = Math.ceil((maxSubtaskDate - taskEnd) / (1000 * 60 * 60 * 24));
          console.log(`   ❌ La tâche se termine (${parentTask.due_date}) AVANT la dernière sous-tâche (${maxSubtaskDate.toISOString().split('T')[0]}) - Écart: ${diff} jours`);
          hasIssues = true;
          subtaskIssues++;
        } else {
          console.log(`   ✅ La date de fin de la tâche englobe les sous-tâches`);
        }

        // Vérification 3: Durée
        const taskDuration = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24));
        const subtasksDuration = Math.ceil((maxSubtaskDate - minSubtaskDate) / (1000 * 60 * 60 * 24));
        console.log(`   📊 Durée de la tâche: ${taskDuration} jours | Durée des sous-tâches: ${subtasksDuration} jours`);
      }

      // Vérification 4: Sous-tâches avec dates incohérentes
      const invalidSubtasks = taskSubtasks.filter(st => {
        if (!st.start_date || !st.due_date) return false;
        return new Date(st.start_date) > new Date(st.due_date);
      });

      if (invalidSubtasks.length > 0) {
        console.log(`   ❌ ${invalidSubtasks.length} sous-tâche(s) avec date de début après date de fin:`);
        invalidSubtasks.forEach(st => {
          console.log(`      • ${st.title}: ${st.start_date} > ${st.due_date}`);
        });
        hasIssues = true;
      }

      if (!hasIssues && taskStart && taskEnd) {
        console.log(`   ✅ Toutes les vérifications sont OK`);
      }

      console.log('');
    }

    console.log('━'.repeat(80));
    console.log(`\n📊 Résumé: ${subtaskIssues} tâche(s) avec sous-tâches incohérentes\n`);

    // 3. Vérifier les actions
    console.log('━'.repeat(80));
    console.log('\n🎯 Vérification des actions...\n');

    const { data: actions, error: actionsError } = await supabase
      .from('task_actions')
      .select('id, title, task_id, completed, tasks(title, start_date, due_date)');

    if (actionsError) throw actionsError;

    console.log(`📊 ${actions.length} actions trouvées\n`);

    // Regrouper par tâche
    const actionsByTask = actions.reduce((acc, action) => {
      if (!acc[action.task_id]) {
        acc[action.task_id] = {
          taskTitle: action.tasks?.title || 'Inconnue',
          taskStart: action.tasks?.start_date,
          taskEnd: action.tasks?.due_date,
          actions: []
        };
      }
      acc[action.task_id].actions.push(action);
      return acc;
    }, {});

    Object.entries(actionsByTask).forEach(([taskId, data]) => {
      console.log(`📝 Tâche: ${data.taskTitle}`);
      console.log(`   Dates: ${data.taskStart || '❌'} → ${data.taskEnd || '❌'}`);
      console.log(`   Actions (${data.actions.length}):`);
      data.actions.forEach(action => {
        const status = action.completed ? '✅' : '⏳';
        console.log(`     ${status} ${action.title}`);
      });
      console.log('');
    });

    console.log('━'.repeat(80));
    console.log('\n✅ Vérification terminée\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkSubtasksAndActions();

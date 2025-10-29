/**
 * Script de vérification des dates des actions
 * Vérifie si les actions ont des dates et leur cohérence avec les tâches
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

async function checkActionDates() {
  console.log('📅 Vérification des dates des actions...\n');

  try {
    // 1. Récupérer une action pour voir sa structure
    const { data: sampleAction, error: sampleError } = await supabase
      .from('task_actions')
      .select('*')
      .limit(1)
      .single();

    if (sampleError && sampleError.code !== 'PGRST116') throw sampleError;

    console.log('📋 Structure d\'une action:');
    console.log(JSON.stringify(sampleAction, null, 2));
    console.log('\n' + '━'.repeat(80) + '\n');

    // 2. Vérifier si les actions ont des champs de dates
    const hasDateFields = sampleAction && (
      'start_date' in sampleAction || 
      'due_date' in sampleAction || 
      'deadline' in sampleAction ||
      'scheduled_date' in sampleAction
    );

    if (!hasDateFields) {
      console.log('ℹ️  Les actions n\'ont pas de champs de dates');
      console.log('   Les actions sont des checklist items sans dates spécifiques');
      console.log('   Elles héritent implicitement des dates de leur tâche parente\n');
      return;
    }

    // 3. Si les actions ont des dates, vérifier la cohérence
    console.log('🔍 Vérification de la cohérence des dates des actions...\n');

    const { data: actions, error: actionsError } = await supabase
      .from('task_actions')
      .select('*');

    if (actionsError) throw actionsError;

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, start_date, due_date');

    if (tasksError) throw tasksError;

    const tasksMap = tasks.reduce((acc, task) => {
      acc[task.id] = task;
      return acc;
    }, {});

    let issuesCount = 0;

    actions.forEach(action => {
      const task = tasksMap[action.task_id];
      if (!task) return;

      const actionStart = action.start_date || action.scheduled_date;
      const actionEnd = action.due_date || action.deadline;

      if (!actionStart && !actionEnd) return;

      const taskStart = task.start_date ? new Date(task.start_date) : null;
      const taskEnd = task.due_date ? new Date(task.due_date) : null;

      let hasIssue = false;

      console.log(`📝 Action: ${action.title}`);
      console.log(`   Tâche: ${task.title}`);
      console.log(`   Dates tâche: ${task.start_date || '❌'} → ${task.due_date || '❌'}`);
      console.log(`   Dates action: ${actionStart || '❌'} → ${actionEnd || '❌'}`);

      if (actionStart && taskStart && new Date(actionStart) < taskStart) {
        console.log(`   ❌ L'action commence AVANT la tâche`);
        hasIssue = true;
      }

      if (actionEnd && taskEnd && new Date(actionEnd) > taskEnd) {
        console.log(`   ❌ L'action se termine APRÈS la tâche`);
        hasIssue = true;
      }

      if (hasIssue) {
        issuesCount++;
      } else {
        console.log(`   ✅ Dates cohérentes`);
      }

      console.log('');
    });

    console.log('━'.repeat(80));
    console.log(`\n📊 Résumé: ${issuesCount} action(s) avec dates incohérentes\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkActionDates();

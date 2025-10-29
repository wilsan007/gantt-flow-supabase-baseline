/**
 * Script de vérification des dates de projets et tâches
 * Vérifie la cohérence entre les dates des projets et leurs tâches
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('URL:', supabaseUrl ? '✅' : '❌');
  console.error('SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

// Utiliser la clé SERVICE_ROLE pour accéder aux données
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProjectDates() {
  console.log('🔍 Vérification des dates de projets et tâches...\n');

  try {
    // 1. Récupérer tous les projets
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, start_date, end_date, status')
      .order('created_at', { ascending: false });

    if (projectsError) throw projectsError;

    console.log(`📊 ${projects.length} projets trouvés\n`);

    // 2. Pour chaque projet, récupérer ses tâches
    for (const project of projects) {
      console.log('━'.repeat(80));
      console.log(`\n📁 Projet: ${project.name}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Statut: ${project.status}`);
      console.log(`   Dates du projet:`);
      console.log(`     • Début: ${project.start_date || '❌ Non défini'}`);
      console.log(`     • Fin:   ${project.end_date || '❌ Non défini'}`);

      // Récupérer les tâches du projet
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, start_date, due_date, status, parent_id')
        .eq('project_id', project.id)
        .order('start_date', { ascending: true });

      if (tasksError) {
        console.log(`   ⚠️ Erreur lors de la récupération des tâches: ${tasksError.message}`);
        continue;
      }

      if (tasks.length === 0) {
        console.log(`   ⚠️ Aucune tâche associée à ce projet`);
        continue;
      }

      console.log(`\n   📝 ${tasks.length} tâches trouvées:`);

      // Calculer les dates min/max des tâches
      const taskDates = tasks
        .filter(t => t.start_date && t.due_date)
        .map(t => ({
          start: new Date(t.start_date),
          end: new Date(t.due_date)
        }));

      if (taskDates.length === 0) {
        console.log(`   ⚠️ Aucune tâche avec des dates valides`);
        continue;
      }

      const minTaskDate = new Date(Math.min(...taskDates.map(d => d.start.getTime())));
      const maxTaskDate = new Date(Math.max(...taskDates.map(d => d.end.getTime())));

      console.log(`\n   📅 Plage des tâches:`);
      console.log(`     • Date la plus tôt:  ${minTaskDate.toISOString().split('T')[0]}`);
      console.log(`     • Date la plus tard: ${maxTaskDate.toISOString().split('T')[0]}`);

      // Afficher chaque tâche
      console.log(`\n   📋 Détail des tâches:`);
      tasks.forEach((task, index) => {
        const isSubtask = task.parent_id ? '  └─ ' : '  • ';
        console.log(`${isSubtask}${task.title}`);
        console.log(`     Début: ${task.start_date || '❌'} | Fin: ${task.due_date || '❌'} | Statut: ${task.status}`);
      });

      // Vérifications de cohérence
      console.log(`\n   🔍 Vérifications:`);

      const projectStart = project.start_date ? new Date(project.start_date) : null;
      const projectEnd = project.end_date ? new Date(project.end_date) : null;

      let hasIssues = false;

      // Vérification 1: Le projet a-t-il des dates définies ?
      if (!projectStart || !projectEnd) {
        console.log(`   ⚠️ Le projet n'a pas de dates définies`);
        hasIssues = true;
      } else {
        // Vérification 2: La date de début du projet est-elle avant ou égale à la première tâche ?
        if (projectStart > minTaskDate) {
          const diff = Math.ceil((projectStart - minTaskDate) / (1000 * 60 * 60 * 24));
          console.log(`   ❌ La date de début du projet (${project.start_date}) est APRÈS la première tâche (${minTaskDate.toISOString().split('T')[0]}) - Écart: ${diff} jours`);
          hasIssues = true;
        } else {
          console.log(`   ✅ La date de début du projet englobe les tâches`);
        }

        // Vérification 3: La date de fin du projet est-elle après ou égale à la dernière tâche ?
        if (projectEnd < maxTaskDate) {
          const diff = Math.ceil((maxTaskDate - projectEnd) / (1000 * 60 * 60 * 24));
          console.log(`   ❌ La date de fin du projet (${project.end_date}) est AVANT la dernière tâche (${maxTaskDate.toISOString().split('T')[0]}) - Écart: ${diff} jours`);
          hasIssues = true;
        } else {
          console.log(`   ✅ La date de fin du projet englobe les tâches`);
        }

        // Vérification 4: Durée du projet vs durée des tâches
        const projectDuration = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24));
        const tasksDuration = Math.ceil((maxTaskDate - minTaskDate) / (1000 * 60 * 60 * 24));
        console.log(`   📊 Durée du projet: ${projectDuration} jours | Durée des tâches: ${tasksDuration} jours`);
      }

      // Vérification 5: Tâches avec dates incohérentes
      const invalidTasks = tasks.filter(t => {
        if (!t.start_date || !t.due_date) return false;
        return new Date(t.start_date) > new Date(t.due_date);
      });

      if (invalidTasks.length > 0) {
        console.log(`   ❌ ${invalidTasks.length} tâche(s) avec date de début après date de fin:`);
        invalidTasks.forEach(t => {
          console.log(`      • ${t.title}: ${t.start_date} > ${t.due_date}`);
        });
        hasIssues = true;
      }

      if (!hasIssues && projectStart && projectEnd) {
        console.log(`   ✅ Toutes les vérifications sont OK`);
      }

      console.log('');
    }

    console.log('━'.repeat(80));
    console.log('\n✅ Vérification terminée\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter la vérification
checkProjectDates();

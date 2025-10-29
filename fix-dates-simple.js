/**
 * Script simple pour corriger les dates et ajouter les contraintes
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
  console.error('❌ Variables manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDates() {
  console.log('🔧 Correction des dates des tâches...\n');

  try {
    // 1. Récupérer toutes les tâches avec leurs projets
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, start_date, due_date, project_id, projects(start_date, end_date, name)')
      .not('project_id', 'is', null);

    if (tasksError) throw tasksError;

    console.log(`📊 ${tasks.length} tâches à vérifier\n`);

    let fixedCount = 0;

    for (const task of tasks) {
      if (!task.projects) continue;

      const taskStart = new Date(task.start_date);
      const taskEnd = new Date(task.due_date);
      const projectStart = new Date(task.projects.start_date);
      const projectEnd = new Date(task.projects.end_date);
      
      let needsUpdate = false;
      let newStart = task.start_date;
      let newEnd = task.due_date;

      // Calculer la durée de la tâche
      const duration = taskEnd - taskStart;

      // Si la tâche commence avant le projet
      if (taskStart < projectStart) {
        newStart = task.projects.start_date;
        newEnd = new Date(projectStart.getTime() + duration).toISOString().split('T')[0];
        
        // Si la nouvelle fin dépasse le projet, ajuster
        if (new Date(newEnd) > projectEnd) {
          newEnd = task.projects.end_date;
        }
        
        needsUpdate = true;
        console.log(`🔧 ${task.title} (${task.projects.name})`);
        console.log(`   Avant: ${task.start_date} → ${task.due_date}`);
        console.log(`   Après: ${newStart} → ${newEnd}`);
      }

      // Si la tâche se termine après le projet
      if (taskEnd > projectEnd && !needsUpdate) {
        newEnd = task.projects.end_date;
        newStart = new Date(projectEnd.getTime() - duration).toISOString().split('T')[0];
        
        // Si le nouveau début est avant le projet, ajuster
        if (new Date(newStart) < projectStart) {
          newStart = task.projects.start_date;
        }
        
        needsUpdate = true;
        console.log(`🔧 ${task.title} (${task.projects.name})`);
        console.log(`   Avant: ${task.start_date} → ${task.due_date}`);
        console.log(`   Après: ${newStart} → ${newEnd}`);
      }

      // Mettre à jour si nécessaire
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            start_date: newStart,
            due_date: newEnd,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id);

        if (updateError) {
          console.log(`   ❌ Erreur: ${updateError.message}`);
        } else {
          console.log(`   ✅ Corrigé`);
          fixedCount++;
        }
        console.log('');
      }
    }

    console.log(`\n✅ ${fixedCount} tâche(s) corrigée(s)\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

async function addConstraints() {
  console.log('🛡️  Ajout des contraintes de validation...\n');

  const constraints = [
    {
      name: 'tasks_dates_order_check',
      table: 'tasks',
      sql: 'ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_dates_order_check; ALTER TABLE tasks ADD CONSTRAINT tasks_dates_order_check CHECK (start_date <= due_date);',
      description: 'start_date <= due_date sur tasks'
    },
    {
      name: 'projects_dates_order_check',
      table: 'projects',
      sql: 'ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_dates_order_check; ALTER TABLE projects ADD CONSTRAINT projects_dates_order_check CHECK (start_date <= end_date);',
      description: 'start_date <= end_date sur projects'
    }
  ];

  for (const constraint of constraints) {
    try {
      // Utiliser l'API REST pour exécuter du SQL brut
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: constraint.sql })
      });

      if (response.ok) {
        console.log(`✅ Contrainte ajoutée: ${constraint.description}`);
      } else {
        console.log(`⚠️  Contrainte ${constraint.name}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`⚠️  Impossible d'ajouter la contrainte ${constraint.name}`);
    }
  }

  console.log('\n💡 Note: Les contraintes peuvent nécessiter un accès direct à la base de données');
  console.log('   Vous pouvez les ajouter manuellement via le SQL Editor de Supabase\n');
}

async function main() {
  console.log('🚀 Démarrage de la correction des dates\n');
  console.log('='.repeat(80) + '\n');

  await fixDates();
  
  console.log('='.repeat(80) + '\n');
  
  await addConstraints();
  
  console.log('='.repeat(80));
  console.log('\n🎉 Terminé !\n');
  
  // Vérifier les résultats
  console.log('📊 Exécutez "node check-project-dates.js" pour vérifier les résultats\n');
}

main().catch(console.error);

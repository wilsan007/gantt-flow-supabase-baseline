#!/usr/bin/env node

// Script pour vérifier le calcul de progression du projet "Application Mobile"
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectProgress() {
  console.log('\n🔍 Vérification de tous les projets...\n');

  // Récupérer TOUS les projets
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .order('name');

  if (projectError) {
    console.error('❌ Erreur:', projectError.message);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log('❌ Aucun projet trouvé');
    return;
  }

  console.log(`✅ ${projects.length} projets trouvés\n`);
  console.log('┌─────────────────────────────────────────┬──────────┬─────────────┬─────────────┐');
  console.log('│ Projet                                  │ Progress │ Start Date  │ End Date    │');
  console.log('├─────────────────────────────────────────┼──────────┼─────────────┼─────────────┤');

  projects.forEach(project => {
    const name = (project.name || 'Sans nom').padEnd(39).substring(0, 39);
    const progress = `${project.progress || 0}%`.padStart(8);
    const startDate = project.start_date ? new Date(project.start_date).toLocaleDateString('fr-FR') : 'N/A';
    const endDate = project.end_date ? new Date(project.end_date).toLocaleDateString('fr-FR') : 'N/A';
    const startStr = startDate.padEnd(11);
    const endStr = endDate.padEnd(11);
    
    console.log(`│ ${name} │ ${progress} │ ${startStr} │ ${endStr} │`);
  });

  console.log('└─────────────────────────────────────────┴──────────┴─────────────┴─────────────┘');
  
  // Vérifier les projets sans dates
  const projectsWithoutDates = projects.filter(p => !p.start_date || !p.end_date);
  if (projectsWithoutDates.length > 0) {
    console.log(`\n⚠️  ${projectsWithoutDates.length} projet(s) sans dates complètes:`);
    projectsWithoutDates.forEach(p => {
      console.log(`   - ${p.name}: start=${p.start_date || 'NULL'}, end=${p.end_date || 'NULL'}`);
    });
  }

  return;

  // Récupérer les tâches du projet (par project_id)
  const { data: tasksByProjectId, error: tasksError1 } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', project.id)
    .order('title');

  console.log(`📌 Tâches par project_id: ${tasksByProjectId?.length || 0}`);

  // Récupérer les tâches par project_name (méthode alternative)
  const { data: tasksByProjectName, error: tasksError2 } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_name', project.name)
    .order('title');

  console.log(`📌 Tâches par project_name: ${tasksByProjectName?.length || 0}`);

  // Utiliser les tâches par project_name si disponibles
  const tasks = tasksByProjectName || tasksByProjectId;
  const tasksError = tasksError2 || tasksError1;

  if (tasksError) {
    console.error('❌ Erreur tâches:', tasksError.message);
    return;
  }

  if (!tasks || tasks.length === 0) {
    console.log('❌ Aucune tâche trouvée pour ce projet');
    return;
  }

  console.log(`📝 ${tasks.length} tâches trouvées:\n`);
  console.log('┌─────────────────────────────────────────┬─────────┬──────────┬─────────────┐');
  console.log('│ Tâche                                   │ Effort  │ Progress │ Complété    │');
  console.log('├─────────────────────────────────────────┼─────────┼──────────┼─────────────┤');

  let totalEffort = 0;
  let completedEffort = 0;

  tasks.forEach(task => {
    const effort = parseFloat(task.estimated_hours || task.effort_estimate_h || 0);
    const progress = parseFloat(task.progress || 0);
    const completed = effort * progress / 100;

    totalEffort += effort;
    completedEffort += completed;

    const title = task.title.padEnd(39).substring(0, 39);
    const effortStr = `${effort.toFixed(1)}h`.padStart(7);
    const progressStr = `${progress.toFixed(0)}%`.padStart(8);
    const completedStr = `${completed.toFixed(2)}h`.padStart(11);

    console.log(`│ ${title} │ ${effortStr} │ ${progressStr} │ ${completedStr} │`);
  });

  console.log('└─────────────────────────────────────────┴─────────┴──────────┴─────────────┘');

  const calculatedProgress = totalEffort > 0 ? Math.round(completedEffort / totalEffort * 100) : 0;

  console.log(`\n📊 CALCUL:`);
  console.log(`   Total effort: ${totalEffort.toFixed(2)}h`);
  console.log(`   Effort complété: ${completedEffort.toFixed(2)}h`);
  console.log(`   Formule: ROUND(${completedEffort.toFixed(2)} / ${totalEffort.toFixed(2)} × 100)`);
  console.log(`   = ROUND(${(completedEffort / totalEffort * 100).toFixed(2)}%)`);
  console.log(`   = ${calculatedProgress}%`);

  console.log(`\n🎯 RÉSULTAT:`);
  console.log(`   Progression calculée: ${calculatedProgress}%`);
  console.log(`   Progression stockée: ${project.progress}%`);
  
  if (calculatedProgress === project.progress) {
    console.log(`   ✅ Les valeurs correspondent!`);
  } else {
    console.log(`   ⚠️  Différence de ${Math.abs(calculatedProgress - project.progress)}%`);
    console.log(`   💡 Le trigger SQL devrait recalculer automatiquement`);
  }
}

checkProjectProgress().catch(console.error);

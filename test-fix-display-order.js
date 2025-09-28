#!/usr/bin/env node

/**
 * Script pour diagnostiquer et corriger les doublons de display_order
 * Usage: node test-fix-display-order.js [diagnose|fix|test]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseDisplayOrder() {
  console.log('🔍 Diagnostic des doublons display_order...\n');

  try {
    // 1. Récupérer toutes les tâches principales
    const { data: mainTasks, error: mainError } = await supabase
      .from('tasks')
      .select('id, title, display_order, task_level, parent_id, created_at')
      .is('parent_id', null)
      .eq('task_level', 0)
      .order('display_order');

    if (mainError) {
      console.error('❌ Erreur lors de la récupération des tâches:', mainError);
      return;
    }

    if (!mainTasks || mainTasks.length === 0) {
      console.log('ℹ️ Aucune tâche principale trouvée');
      return;
    }

    console.log(`📊 ${mainTasks.length} tâches principales trouvées\n`);

    // 2. Analyser les doublons
    const displayOrderCount = {};
    mainTasks.forEach(task => {
      const order = task.display_order || 'NULL';
      if (!displayOrderCount[order]) {
        displayOrderCount[order] = [];
      }
      displayOrderCount[order].push(task);
    });

    let duplicatesFound = false;
    Object.keys(displayOrderCount).forEach(order => {
      const tasks = displayOrderCount[order];
      if (tasks.length > 1) {
        duplicatesFound = true;
        console.log(`🚨 DOUBLON - Display Order "${order}": ${tasks.length} tâches`);
        tasks.forEach(task => {
          console.log(`   - ${task.title} (ID: ${task.id})`);
        });
        console.log('');
      }
    });

    if (!duplicatesFound) {
      console.log('✅ Aucun doublon détecté dans les tâches principales');
    }

    // 3. Vérifier les tâches avec display_order manquant
    const missingDisplayOrder = mainTasks.filter(task => !task.display_order || task.display_order === '');
    if (missingDisplayOrder.length > 0) {
      console.log(`🚨 ${missingDisplayOrder.length} tâches sans display_order:`);
      missingDisplayOrder.forEach(task => {
        console.log(`   - ${task.title} (ID: ${task.id})`);
      });
    } else {
      console.log('✅ Toutes les tâches principales ont un display_order');
    }

    // 4. Afficher la structure actuelle
    console.log('\n📋 Structure actuelle des tâches principales:');
    mainTasks.forEach(task => {
      console.log(`${task.display_order || 'NULL'} - ${task.title}`);
    });

    // 5. Vérifier les sous-tâches
    const { data: subTasks, error: subError } = await supabase
      .from('tasks')
      .select('id, title, display_order, task_level, parent_id')
      .gt('task_level', 0)
      .order('display_order');

    if (subTasks && subTasks.length > 0) {
      console.log(`\n📋 ${subTasks.length} sous-tâches trouvées:`);
      subTasks.slice(0, 10).forEach(task => { // Afficher les 10 premières
        const indent = '  '.repeat(task.task_level || 0);
        console.log(`${indent}${task.display_order || 'NULL'} - ${task.title}`);
      });
      if (subTasks.length > 10) {
        console.log(`   ... et ${subTasks.length - 10} autres sous-tâches`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

async function fixDisplayOrder() {
  console.log('🔧 Correction des doublons display_order...\n');

  try {
    // 1. Renuméroter les tâches principales
    console.log('1️⃣ Renumérotation des tâches principales...');
    
    const { data: mainTasks, error: mainError } = await supabase
      .from('tasks')
      .select('id, created_at')
      .is('parent_id', null)
      .eq('task_level', 0)
      .order('created_at');

    if (mainError) throw mainError;

    for (let i = 0; i < mainTasks.length; i++) {
      const newOrder = (i + 1).toString();
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ display_order: newOrder })
        .eq('id', mainTasks[i].id);

      if (updateError) throw updateError;
      console.log(`   ✅ Tâche ${mainTasks[i].id} → display_order: ${newOrder}`);
    }

    // 2. Renuméroter les sous-tâches
    console.log('\n2️⃣ Renumérotation des sous-tâches...');
    
    for (let level = 1; level <= 5; level++) {
      const { data: subtasks, error: subError } = await supabase
        .from('tasks')
        .select('id, parent_id, created_at')
        .eq('task_level', level)
        .order('parent_id, created_at');

      if (subError) throw subError;
      if (!subtasks || subtasks.length === 0) break;

      // Grouper par parent
      const byParent = {};
      subtasks.forEach(task => {
        if (!byParent[task.parent_id]) byParent[task.parent_id] = [];
        byParent[task.parent_id].push(task);
      });

      for (const parentId in byParent) {
        // Obtenir le display_order du parent
        const { data: parent, error: parentError } = await supabase
          .from('tasks')
          .select('display_order')
          .eq('id', parentId)
          .single();

        if (parentError) continue;

        const parentOrder = parent.display_order || '1';
        const children = byParent[parentId];

        for (let i = 0; i < children.length; i++) {
          const newOrder = `${parentOrder}.${i + 1}`;
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ display_order: newOrder })
            .eq('id', children[i].id);

          if (updateError) throw updateError;
          console.log(`   ✅ Sous-tâche ${children[i].id} → display_order: ${newOrder}`);
        }
      }
    }

    console.log('\n✅ Correction terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

async function testDisplayOrder() {
  console.log('🧪 Test de la fonction generate_display_order...\n');

  try {
    // Test pour tâche principale
    const { data: mainResult, error: mainError } = await supabase.rpc('generate_display_order', {
      p_parent_id: null,
      p_task_level: 0
    });

    if (mainError) throw mainError;
    console.log(`✅ Nouvelle tâche principale → display_order: ${mainResult}`);

    // Test pour sous-tâche
    const { data: firstTask, error: firstError } = await supabase
      .from('tasks')
      .select('id')
      .is('parent_id', null)
      .limit(1)
      .single();

    if (!firstError && firstTask) {
      const { data: subResult, error: subError } = await supabase.rpc('generate_display_order', {
        p_parent_id: firstTask.id,
        p_task_level: 1
      });

      if (subError) throw subError;
      console.log(`✅ Nouvelle sous-tâche → display_order: ${subResult}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécution selon l'argument
const action = process.argv[2] || 'diagnose';

switch (action) {
  case 'diagnose':
    diagnoseDisplayOrder();
    break;
  case 'fix':
    fixDisplayOrder();
    break;
  case 'test':
    testDisplayOrder();
    break;
  default:
    console.log(`
Usage: node test-fix-display-order.js [action]

Actions disponibles:
  diagnose  - Diagnostiquer les doublons (par défaut)
  fix       - Corriger les doublons
  test      - Tester la fonction generate_display_order

Exemples:
  node test-fix-display-order.js diagnose
  node test-fix-display-order.js fix
  node test-fix-display-order.js test
    `);
}

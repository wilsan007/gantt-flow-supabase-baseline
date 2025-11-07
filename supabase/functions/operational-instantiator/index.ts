// =====================================================
// Edge Function: operational-instantiator
// Génère automatiquement les occurrences de tâches récurrentes
// Exécution: Quotidienne via cron (00:00 UTC)
// =====================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { expandRRule, getIsoWeek } from './rrule-parser.ts';
import { generateTask } from './task-generator.ts';

// Types
interface OperationalSchedule {
  id: string;
  tenant_id: string;
  activity_id: string;
  rrule: string | null;
  start_date: string;
  until: string | null;
  generate_window_days: number;
  operational_activities: {
    id: string;
    is_active: boolean;
    task_title_template: string | null;
    owner_id: string | null;
    project_id: string | null;
    name: string;
  };
}

// =====================================================
// Point d'entrée principal
// =====================================================

Deno.serve(async (req) => {
  try {
    const today = new Date();
    const isoToday = today.toISOString().slice(0, 10);

    console.log(`[${isoToday}] 🚀 Démarrage de l'instantiation des activités opérationnelles`);

    // Initialiser Supabase client avec service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variables d\'environnement manquantes');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // =====================================================
    // 1. Charger les schedules actives
    // =====================================================
    console.log('📋 Chargement des planifications actives...');

    const { data: schedules, error: schedulesError } = await supabase
      .from('operational_schedules')
      .select(`
        id,
        tenant_id,
        activity_id,
        rrule,
        start_date,
        until,
        generate_window_days,
        operational_activities!inner(
          id,
          is_active,
          task_title_template,
          owner_id,
          project_id,
          name
        )
      `)
      .gte('start_date', '1900-01-01');

    if (schedulesError) {
      console.error('❌ Erreur chargement schedules:', schedulesError);
      return new Response(
        JSON.stringify({ error: schedulesError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ ${schedules?.length || 0} planification(s) trouvée(s)`);

    // =====================================================
    // 2. Traiter chaque schedule
    // =====================================================
    let totalGenerated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const schedule of schedules as OperationalSchedule[] ?? []) {
      const activity = schedule.operational_activities;

      // Vérifier si l'activité est active
      if (!activity?.is_active) {
        console.log(`⏭️  [${activity?.name}] Activité inactive - ignorée`);
        continue;
      }

      console.log(`\n📅 Traitement: "${activity.name}" (${schedule.activity_id})`);

      // Calculer la fenêtre de génération
      const windowDays = schedule.generate_window_days ?? 30;
      const start = new Date(isoToday);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + windowDays);

      console.log(`   Fenêtre: ${isoToday} → ${end.toISOString().slice(0, 10)} (${windowDays} jours)`);

      // =====================================================
      // 3. Calculer les dates d'occurrence selon RRULE
      // =====================================================
      const occurrenceDates = expandRRule({
        rrule: schedule.rrule,
        start,
        end,
        until: schedule.until ? new Date(schedule.until) : null,
      });

      console.log(`   ${occurrenceDates.length} occurrence(s) à générer`);

      // =====================================================
      // 4. Générer les tâches pour chaque occurrence
      // =====================================================
      for (const date of occurrenceDates) {
        try {
          const result = await generateTask(supabase, {
            tenantId: schedule.tenant_id,
            activityId: schedule.activity_id,
            date,
            titleTemplate: activity.task_title_template ?? activity.name,
            ownerId: activity.owner_id,
            projectId: activity.project_id,
          });

          if (result.created) {
            totalGenerated++;
            console.log(`   ✅ ${date.toISOString().slice(0, 10)} - Tâche créée (${result.taskId})`);
          } else {
            totalSkipped++;
            console.log(`   ⏭️  ${date.toISOString().slice(0, 10)} - Déjà existante (ignorée)`);
          }
        } catch (error: any) {
          console.error(`   ❌ ${date.toISOString().slice(0, 10)} - Erreur: ${error.message}`);
          totalErrors++;
        }
      }
    }

    // =====================================================
    // 5. Résumé de l'exécution
    // =====================================================
    const summary = {
      success: true,
      date: isoToday,
      schedules_processed: schedules?.length || 0,
      tasks_generated: totalGenerated,
      tasks_skipped: totalSkipped,
      errors: totalErrors,
      total: totalGenerated + totalSkipped + totalErrors,
    };

    console.log('\n═══════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ DE L\'EXÉCUTION');
    console.log('═══════════════════════════════════════════════');
    console.log(`✅ Planifications traitées: ${summary.schedules_processed}`);
    console.log(`✅ Tâches générées: ${summary.tasks_generated}`);
    console.log(`⏭️  Tâches déjà existantes: ${summary.tasks_skipped}`);
    console.log(`❌ Erreurs: ${summary.errors}`);
    console.log('═══════════════════════════════════════════════\n');

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('💥 ERREUR FATALE:', error);
    // Log stack trace en interne uniquement
    console.error('🔍 Stack trace (interne):', error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        // Ne pas exposer la stack trace dans la réponse
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

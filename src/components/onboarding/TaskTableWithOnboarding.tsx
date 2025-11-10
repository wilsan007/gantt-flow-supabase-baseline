/**
 * 🎯 Wrapper pour DynamicTable avec Onboarding
 *
 * Affiche les templates d'onboarding si le tenant n'a pas encore de tâches.
 * Sinon, affiche DynamicTable normalement.
 */

import { useState, useEffect, useMemo } from 'react';
import { useTasks } from '@/hooks/optimized';
import { EmptyStateWithTemplates } from './EmptyStateWithTemplates';
import DynamicTable from '@/components/vues/table/DynamicTable';
import { TaskTemplate } from '@/data/taskTemplates';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { supabase } from '@/integrations/supabase/client';
import type { Task } from '@/types/task';

const ONBOARDING_DISMISSED_KEY = 'wadashaqayn_onboarding_dismissed';

export function TaskTableWithOnboarding() {
  const { tasks, loading, createTask } = useTasks();
  const { toast } = useToast();
  const { tenantId } = useTenant();

  // Vérifier si l'utilisateur a déjà masqué l'onboarding
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    const dismissed = localStorage.getItem(`${ONBOARDING_DISMISSED_KEY}_${tenantId}`);
    return dismissed === 'true';
  });

  // Mode démo: afficher des tâches mockées au lieu de vraies tâches
  const [showDemoData, setShowDemoData] = useState(() => {
    const demo = localStorage.getItem(`wadashaqayn_demo_mode_${tenantId}`);
    return demo === 'true';
  });

  // Afficher EmptyState si:
  // 1. Pas de chargement en cours
  // 2. Aucune tâche
  // 3. Onboarding pas encore masqué
  // 4. Pas en mode démo
  const shouldShowOnboarding =
    !loading && tasks.length === 0 && !onboardingDismissed && !showDemoData;

  // Créer des tâches mockées pour le mode démo avec vrais UUIDs
  const mockTasks = useMemo<Task[]>(
    () => [
      {
        id: '00000000-0000-0000-0000-000000000001',
        title: 'Créer votre première tâche',
        description:
          "Exemple de tâche pour découvrir l'interface. Cliquez pour voir: Désigner un responsable, Choisir la priorité, Choisir le statut, Définir le nombre d'heures, Ajouter des dates...",
        status: 'todo',
        priority: 'medium',
        start_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_hours: null,
        progress: 0,
        tenant_id: tenantId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_to: null,
        project_id: null,
        parent_task_id: null,
        position: 0,
        // Ajouter des actions mockées
        task_actions: [
          {
            id: '00000000-0000-0000-0001-000000000001',
            task_id: '00000000-0000-0000-0000-000000000001',
            title: 'Définir une action pour la tâche N°1',
            notes: 'Ceci est une action associée à la première tâche',
            is_done: false,
            position: 0,
            weight_percentage: 25,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0001-000000000002',
            task_id: '00000000-0000-0000-0000-000000000001',
            title: 'Définir une seconde action pour la tâche N°1',
            notes: 'Action 2 de la première tâche',
            is_done: false,
            position: 1,
            weight_percentage: 25,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0001-000000000003',
            task_id: '00000000-0000-0000-0000-000000000001',
            title: 'Définir une troisième action pour la tâche N°1',
            notes: 'Action 3 de la première tâche',
            is_done: false,
            position: 2,
            weight_percentage: 25,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0001-000000000004',
            task_id: '00000000-0000-0000-0000-000000000001',
            title: 'Définir une quatrième action pour la tâche N°1',
            notes: 'Action 4 de la première tâche',
            is_done: false,
            position: 3,
            weight_percentage: 25,
            tenant_id: tenantId || '',
          },
        ],
      } as Task,
      {
        id: '00000000-0000-0000-0000-000000000002',
        title: 'Créer votre seconde tâche',
        description:
          "Exemple: Désigner un responsable, Choisir la priorité, Choisir le statut, Définir le nombre d'heures. Explorez les différentes colonnes du tableau.",
        status: 'todo',
        priority: 'medium',
        start_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_hours: null,
        progress: 0,
        tenant_id: tenantId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_to: null,
        project_id: null,
        parent_task_id: null,
        position: 1,
        // Ajouter des actions mockées
        task_actions: [
          {
            id: '00000000-0000-0000-0002-000000000001',
            task_id: '00000000-0000-0000-0000-000000000002',
            title: 'Définir une action pour la tâche N°2',
            notes: 'Ceci est une action associée à la seconde tâche',
            is_done: false,
            position: 0,
            weight_percentage: 20,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0002-000000000002',
            task_id: '00000000-0000-0000-0000-000000000002',
            title: 'Définir une seconde action pour la tâche N°2',
            notes: 'Action 2 de la seconde tâche',
            is_done: false,
            position: 1,
            weight_percentage: 20,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0002-000000000003',
            task_id: '00000000-0000-0000-0000-000000000002',
            title: 'Définir une troisième action pour la tâche N°2',
            notes: 'Action 3 de la seconde tâche',
            is_done: false,
            position: 2,
            weight_percentage: 20,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0002-000000000004',
            task_id: '00000000-0000-0000-0000-000000000002',
            title: 'Définir une quatrième action pour la tâche N°2',
            notes: 'Action 4 de la seconde tâche',
            is_done: false,
            position: 3,
            weight_percentage: 20,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0002-000000000005',
            task_id: '00000000-0000-0000-0000-000000000002',
            title: 'Définir une cinquième action pour la tâche N°2',
            notes: 'Action 5 de la seconde tâche',
            is_done: false,
            position: 4,
            weight_percentage: 20,
            tenant_id: tenantId || '',
          },
        ],
      } as Task,
      {
        id: '00000000-0000-0000-0000-000000000003',
        title: 'Créer votre troisième tâche',
        description:
          "Exemple: Désigner un responsable, Choisir la priorité, Choisir le statut, Définir le nombre d'heures. Testez toutes les fonctionnalités: filtres, tri, recherche...",
        status: 'todo',
        priority: 'medium',
        start_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_hours: null,
        progress: 0,
        tenant_id: tenantId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_to: null,
        project_id: null,
        parent_task_id: null,
        position: 2,
        // Ajouter des actions mockées
        task_actions: [
          {
            id: '00000000-0000-0000-0003-000000000001',
            task_id: '00000000-0000-0000-0000-000000000003',
            title: 'Définir une action pour la tâche N°3',
            notes: 'Ceci est une action associée à la troisième tâche',
            is_done: false,
            position: 0,
            weight_percentage: 33,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0003-000000000002',
            task_id: '00000000-0000-0000-0000-000000000003',
            title: 'Définir une seconde action pour la tâche N°3',
            notes: 'Action 2 de la troisième tâche',
            is_done: false,
            position: 1,
            weight_percentage: 33,
            tenant_id: tenantId || '',
          },
          {
            id: '00000000-0000-0000-0003-000000000003',
            task_id: '00000000-0000-0000-0000-000000000003',
            title: 'Définir une troisième action pour la tâche N°3',
            notes: 'Action 3 de la troisième tâche',
            is_done: false,
            position: 2,
            weight_percentage: 34,
            tenant_id: tenantId || '',
          },
        ],
      } as Task,
    ],
    [tenantId]
  );

  const handleUseTemplate = async (template: TaskTemplate) => {
    try {
      // Préparer les actions pour la création
      const actionsData = template.actions.map(action => ({
        title: action.title,
        description: action.description,
        weight_percentage: action.weight_percentage,
        position: action.position,
        is_done: false, // Par défaut non faites
      }));

      // Créer la tâche avec ses actions
      const newTask = await createTask({
        title: template.title,
        description: template.description,
        status: template.status,
        priority: template.priority,
        start_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 jours
      });

      // Si la tâche est créée avec succès et qu'on a son ID,
      // créer les actions associées
      if (newTask?.id) {
        // Créer toutes les actions
        for (const actionData of actionsData) {
          try {
            // Utiliser addActionColumn du hook useTasks
            // Note: Cette fonction doit accepter taskId et actionData
            // await addActionColumn(newTask.id, actionData);

            // Alternative: Import direct Supabase si addActionColumn pas disponible
            const { error } = await supabase.from('task_actions').insert({
              task_id: newTask.id,
              title: actionData.title,
              notes: actionData.description,
              weight_percentage: actionData.weight_percentage,
              position: actionData.position,
              is_done: false,
              tenant_id: tenantId,
            });

            if (error) throw error;
          } catch (actionError) {
            console.error('Erreur création action:', actionError);
            // Continue avec les autres actions même si une échoue
          }
        }
      }

      toast({
        title: '✅ Tâche créée depuis le template!',
        description: `"${template.title}" avec ${template.actions.length} actions a été ajoutée à votre tableau.`,
      });

      // Masquer l'onboarding après création réussie
      localStorage.setItem(`${ONBOARDING_DISMISSED_KEY}_${tenantId}`, 'true');
      setOnboardingDismissed(true);

      // Refresh pour afficher la nouvelle tâche
      // (Le hook useTasks devrait gérer ça automatiquement via cache invalidation)
    } catch (error) {
      console.error('Erreur lors de la création de la tâche template:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de créer la tâche depuis le template.',
        variant: 'destructive',
      });
    }
  };

  const handleDismissOnboarding = () => {
    // Activer le mode démo avec données mockées
    localStorage.setItem(`wadashaqayn_demo_mode_${tenantId}`, 'true');
    localStorage.setItem(`${ONBOARDING_DISMISSED_KEY}_${tenantId}`, 'true');
    setShowDemoData(true);
    setOnboardingDismissed(true);

    toast({
      title: '🎨 Mode découverte activé!',
      description:
        "Explorez le tableau avec des données d'exemple. Créez votre première vraie tâche quand vous êtes prêt!",
    });
  };

  // Si en mode démo et pas de vraies tâches, afficher les données mockées
  if (!loading && tasks.length === 0 && showDemoData) {
    return (
      <div className="relative">
        {/* Bannière mode démo */}
        <div className="mb-4 rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🎨</div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">Mode Découverte - Données d'exemple</h4>
              <p className="mt-1 text-sm text-blue-700">
                Ces 3 tâches sont des exemples pour découvrir l'interface.{' '}
                <strong>Elles ne sont pas sauvegardées</strong>. Explorez:{' '}
                <strong>Désigner un responsable</strong>, <strong>Choisir la priorité</strong>,{' '}
                <strong>Choisir le statut</strong>,<strong>Définir le nombre d'heures</strong>, et
                voir les <strong>actions associées</strong>. Créez votre première vraie tâche avec{' '}
                <strong>"+ Nouvelle tâche"</strong> quand vous êtes prêt!
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem(`wadashaqayn_demo_mode_${tenantId}`);
                localStorage.removeItem(`${ONBOARDING_DISMISSED_KEY}_${tenantId}`);
                setShowDemoData(false);
                setOnboardingDismissed(false);
              }}
              className="whitespace-nowrap text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              Retour au guide
            </button>
          </div>
        </div>

        {/* Tableau avec données mockées */}
        <DynamicTable demoTasks={mockTasks} isDemoMode={true} />
      </div>
    );
  }

  // Si onboarding dismissed mais toujours 0 tâches et pas en mode démo
  if (!loading && tasks.length === 0 && onboardingDismissed && !showDemoData) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="max-w-md space-y-4 text-center">
          <div className="mb-4 text-6xl">📋</div>
          <h3 className="text-2xl font-bold">Aucune tâche pour le moment</h3>
          <p className="text-muted-foreground">
            Commencez par créer votre première tâche avec le bouton
            <span className="font-semibold text-primary"> "+ Nouvelle tâche" </span>
            en haut à droite.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem(`${ONBOARDING_DISMISSED_KEY}_${tenantId}`);
              setOnboardingDismissed(false);
            }}
            className="text-sm text-primary hover:underline"
          >
            Afficher à nouveau les templates d'aide
          </button>
        </div>
      </div>
    );
  }

  // Afficher les templates d'onboarding
  if (shouldShowOnboarding) {
    return (
      <EmptyStateWithTemplates
        onUseTemplate={handleUseTemplate}
        onDismiss={handleDismissOnboarding}
      />
    );
  }

  // Afficher le tableau normal avec vraies tâches
  // Désactiver le mode démo si l'utilisateur a créé des vraies tâches
  if (tasks.length > 0 && showDemoData) {
    localStorage.removeItem(`wadashaqayn_demo_mode_${tenantId}`);
    setShowDemoData(false);
  }

  return <DynamicTable />;
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AlertSolution {
  id: string;
  title: string;
  description: string;
  category: string;
  implementation_time: string;
  cost_level: string;
  effectiveness_score: number;
  required_roles: string[];
  action_steps: any;
}

export interface AlertRecommendation {
  id: string;
  alert_instance_id: string;
  solution_id: string;
  recommended_score: number;
  is_primary: boolean;
  solution: AlertSolution;
}

export const useAlertSolutions = () => {
  const [solutions, setSolutions] = useState<AlertSolution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les solutions recommandées pour un type d'alerte spécifique
  const getSolutionsForAlertType = async (alertType: string): Promise<AlertSolution[]> => {
    try {
      setLoading(true);
      setError(null);

      // D'abord récupérer l'alert_type_id
      const { data: alertTypeData, error: alertTypeError } = await supabase
        .from('alert_types')
        .select('id')
        .eq('code', alertType)
        .maybeSingle();

      if (alertTypeError) {
        console.error('Erreur lors de la récupération du type d\'alerte:', alertTypeError);
        return [];
      }

      if (!alertTypeData) {
        // Si le type d'alerte n'existe pas dans la table, retourner des solutions génériques
        return getGenericSolutions(alertType);
      }

      // Récupérer les solutions liées à ce type d'alerte
      const { data: solutionsData, error: solutionsError } = await supabase
        .from('alert_type_solutions')
        .select(`
          *,
          alert_solutions (
            id,
            title,
            description,
            category,
            implementation_time,
            cost_level,
            effectiveness_score,
            required_roles,
            action_steps
          )
        `)
        .eq('alert_type_id', alertTypeData.id)
        .order('priority_order', { ascending: true });

      if (solutionsError) {
        console.error('Erreur lors de la récupération des solutions:', solutionsError);
        return getGenericSolutions(alertType);
      }

      return solutionsData?.map(item => item.alert_solutions).filter(Boolean) || getGenericSolutions(alertType);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
      return getGenericSolutions(alertType);
    } finally {
      setLoading(false);
    }
  };

  // Solutions génériques basées sur le type d'alerte
  const getGenericSolutions = (alertType: string): AlertSolution[] => {
    const genericSolutions: Record<string, AlertSolution[]> = {
      'WORKLOAD_HIGH': [
        {
          id: 'generic-redistribute',
          title: 'Redistribuer la charge de travail',
          description: 'Répartir les tâches entre plusieurs employés pour équilibrer la charge',
          category: 'capacity',
          implementation_time: 'immediate',
          cost_level: 'low',
          effectiveness_score: 85,
          required_roles: ['manager', 'hr'],
          action_steps: {
            steps: [
              'Analyser les tâches en cours',
              'Identifier les employés moins chargés',
              'Réassigner les tâches non critiques',
              'Communiquer les changements'
            ]
          }
        },
        {
          id: 'generic-hire-temp',
          title: 'Recruter du personnel temporaire',
          description: 'Embaucher des ressources temporaires pour réduire la surcharge',
          category: 'recruitment',
          implementation_time: 'short_term',
          cost_level: 'medium',
          effectiveness_score: 75,
          required_roles: ['hr', 'manager'],
          action_steps: {
            steps: [
              'Définir le besoin en compétences',
              'Lancer un processus de recrutement express',
              'Sélectionner et intégrer rapidement',
              'Former et accompagner'
            ]
          }
        }
      ],
      'OVERLOAD_90': [
        {
          id: 'generic-urgent-rebalance',
          title: 'Réorganisation urgente des priorités',
          description: 'Revoir immédiatement les priorités et reporter les tâches non critiques',
          category: 'emergency',
          implementation_time: 'immediate',
          cost_level: 'low',
          effectiveness_score: 90,
          required_roles: ['manager'],
          action_steps: {
            steps: [
              'Convoquer une réunion d\'urgence',
              'Identifier les tâches critiques vs non-critiques',
              'Reporter ou déléguer les tâches non-urgentes',
              'Mettre en place un suivi quotidien'
            ]
          }
        }
      ],
      'ABSENCE_PATTERN': [
        {
          id: 'generic-investigate',
          title: 'Investigation des causes d\'absence',
          description: 'Analyser les raisons des absences répétées et proposer des solutions',
          category: 'hr',
          implementation_time: 'short_term',
          cost_level: 'low',
          effectiveness_score: 80,
          required_roles: ['hr', 'manager'],
          action_steps: {
            steps: [
              'Programmer un entretien individuel',
              'Analyser les patterns d\'absence',
              'Identifier les causes (santé, stress, personnel)',
              'Proposer un plan d\'accompagnement'
            ]
          }
        }
      ],
      'DEADLINE_RISK': [
        {
          id: 'generic-escalate',
          title: 'Escalade et repriorisation',
          description: 'Escalader le projet en retard et réorganiser les ressources',
          category: 'project',
          implementation_time: 'immediate',
          cost_level: 'low',
          effectiveness_score: 85,
          required_roles: ['project_manager', 'manager'],
          action_steps: {
            steps: [
              'Alerter les parties prenantes',
              'Revoir le scope et les délais',
              'Allouer des ressources supplémentaires',
              'Mettre en place un suivi renforcé'
            ]
          }
        }
      ],
      'PERFORMANCE_DROP': [
        {
          id: 'generic-support',
          title: 'Support et déblocage',
          description: 'Identifier les blocages et apporter un support technique ou méthodologique',
          category: 'support',
          implementation_time: 'immediate',
          cost_level: 'low',
          effectiveness_score: 85,
          required_roles: ['manager', 'senior'],
          action_steps: {
            steps: [
              'Identifier les points de blocage',
              'Organiser une session de déblocage',
              'Fournir les ressources nécessaires',
              'Accompagner dans la résolution'
            ]
          }
        }
      ]
    };

    return genericSolutions[alertType] || [
      {
        id: 'generic-default',
        title: 'Analyser et agir',
        description: 'Analyser la situation en détail et définir un plan d\'action approprié',
        category: 'general',
        implementation_time: 'short_term',
        cost_level: 'low',
        effectiveness_score: 70,
        required_roles: ['manager'],
        action_steps: {
          steps: [
            'Analyser la situation en détail',
            'Consulter les parties prenantes',
            'Définir un plan d\'action',
            'Mettre en œuvre et suivre'
          ]
        }
      }
    ];
  };

  return {
    solutions,
    loading,
    error,
    getSolutionsForAlertType
  };
};
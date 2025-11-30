/**
 * Hook usePerformance - Gestion des performances et évaluations
 * Pattern Enterprise pour le module RH
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { useRolesCompat as useUserRoles } from '@/contexts/RolesContext';
import { useUserFilterContext } from '@/hooks/useUserAuth';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';

export interface Objective {
  id: string;
  employee_id: string;
  employee_name?: string; // Added
  department?: string; // Added
  title: string;
  description?: string;
  due_date: string; // Renamed from target_date
  type?: 'individual' | 'team' | 'okr'; // Added
  status: string;
  progress: number;
  created_at?: string;
  updated_at?: string;
}

export interface Evaluation {
  id: string;
  employee_id: string;
  employee_name?: string; // Added
  evaluator_id: string;
  evaluator_name?: string; // Added
  period: string; // Added (was period_start/end, component expects single string or mapped)
  type?: 'annual' | 'quarterly' | '360'; // Added
  overall_score: number; // Renamed from overall_rating
  strengths?: string;
  areas_for_improvement?: string;
  comments?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const usePerformance = () => {
  const [objectiveTemplates, setObjectiveTemplates] = useState<any[]>([]);

  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { userRoles } = useUserRoles();

  // 🔒 Contexte utilisateur pour le filtrage
  const { userContext } = useUserFilterContext();

  // SOLUTION TEMPORAIRE : Récupérer le tenant_id depuis user_roles si useTenant échoue
  const tenantIdFromRoles = userRoles[0]?.tenant_id;
  const effectiveTenantId = tenantId || tenantIdFromRoles;

  const fetchData = useCallback(async () => {
    if (!userContext) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch objectives avec filtrage
      let objectivesQuery = supabase
        .from('objectives')
        .select('*')
        .order('created_at', { ascending: false });

      // 🔒 Appliquer le filtrage par rôle (performance_goals est l'équivalent)
      objectivesQuery = applyRoleFilters(objectivesQuery, userContext, 'performance_goals');

      // Fetch templates (Global + Tenant)
      let templatesQuery = supabase
        .from('objective_templates' as any)
        .select('*')
        .order('category', { ascending: true });

      // Filtrage manuel pour les templates (car pas de RLS helper pour ça encore)
      if (userContext.tenantId) {
        templatesQuery = templatesQuery.or(
          `tenant_id.is.null,tenant_id.eq.${userContext.tenantId}`
        );
      } else {
        templatesQuery = templatesQuery.is('tenant_id', null);
      }

      const { data: objectivesData, error: objectivesError } = await objectivesQuery;
      if (objectivesError) throw objectivesError;

      const { data: templatesData, error: templatesError } = await templatesQuery;
      if (templatesError) {
        console.warn('Templates fetch error (might not exist yet):', templatesError);
      }

      // Fetch evaluations avec filtrage
      let evaluationsQuery = supabase
        .from('evaluations')
        .select('*')
        .order('created_at', { ascending: false });
      evaluationsQuery = applyRoleFilters(evaluationsQuery, userContext, 'performance_reviews');
      const { data: evaluationsData, error: evaluationsError } = await evaluationsQuery;
      if (evaluationsError) throw evaluationsError;

      // Map objectives data
      const mappedObjectives = (objectivesData || []).map((obj: any) => ({
        ...obj,
        due_date: obj.due_date || obj.target_date, // Handle both naming conventions
        employee_name: obj.employee_name || 'Employé', // Fallback
        department: obj.department || 'Département', // Fallback
        type: obj.type || 'individual',
      }));

      // Map evaluations data
      const mappedEvaluations = (evaluationsData || []).map((ev: any) => ({
        ...ev,
        overall_score: ev.overall_rating || 0,
        period: ev.period || `${ev.period_start} - ${ev.period_end}`,
        employee_name: ev.employee_name || 'Employé',
        evaluator_name: ev.evaluator_name || 'Évaluateur',
        type: ev.type || 'annual',
      }));

      setObjectives(mappedObjectives);
      setObjectiveTemplates((templatesData as any) || []);
      setEvaluations(mappedEvaluations);
    } catch (err: any) {
      console.error('Error fetching performance data:', err);
      setError(err.message);
      if (!err.message?.includes('relation') && !err.message?.includes('does not exist')) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données de performance',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [userContext?.userId, userContext?.tenantId]);

  useEffect(() => {
    if (userContext?.userId) {
      fetchData();
    } else if (effectiveTenantId) {
      // Si on a un tenantId mais pas de userContext, on charge quand même avec des données vides
      setLoading(false);
    }
  }, [fetchData, effectiveTenantId, userContext?.userId]);

  const createObjective = async (data: Omit<Objective, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase.from('objectives').insert([data as any]);

      if (error) throw error;

      toast({
        title: 'Objectif créé',
        description: "L'objectif a été créé avec succès",
      });

      await fetchData();
    } catch (err: any) {
      console.error('Error creating objective:', err);
      toast({
        title: 'Erreur',
        description: "Impossible de créer l'objectif",
        variant: 'destructive',
      });
      throw err;
    }
  };

  const createEvaluation = async (data: Omit<Evaluation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase.from('evaluations').insert([data as any]);

      if (error) throw error;

      toast({
        title: 'Évaluation créée',
        description: "L'évaluation a été créée avec succès",
      });

      await fetchData();
    } catch (err: any) {
      console.error('Error creating evaluation:', err);
      toast({
        title: 'Erreur',
        description: "Impossible de créer l'évaluation",
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateObjective = async (id: string, data: Partial<Objective>) => {
    try {
      const { error } = await supabase
        .from('objectives')
        .update(data as any)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Objectif mis à jour',
        description: "L'objectif a été mis à jour avec succès",
      });

      await fetchData();
    } catch (err: any) {
      console.error('Error updating objective:', err);
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour l'objectif",
        variant: 'destructive',
      });
      throw err;
    }
  };

  const createObjectiveTemplate = async (data: {
    title: string;
    category: string;
    description?: string;
  }) => {
    try {
      if (!effectiveTenantId) throw new Error('Tenant ID not found');

      const { error } = await supabase.from('objective_templates' as any).insert([
        {
          ...data,
          tenant_id: effectiveTenantId,
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Modèle créé',
        description: "Le modèle d'objectif a été créé avec succès",
      });

      await fetchData();
    } catch (err: any) {
      console.error('Error creating objective template:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le modèle',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteObjective = async (id: string) => {
    try {
      const { error } = await supabase.from('objectives').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Objectif supprimé',
        description: "L'objectif a été supprimé avec succès",
      });

      await fetchData();
    } catch (err: any) {
      console.error('Error deleting objective:', err);
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer l'objectif",
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Fonctions utilitaires manquantes
  const getKeyResultsByObjective = (objectiveId: string) => {
    return []; // TODO: Implémenter si nécessaire
  };

  const getCategoriesByEvaluation = (evaluationId: string) => {
    return []; // TODO: Implémenter si nécessaire
  };

  const getPerformanceStats = () => {
    const totalObjectives = objectives.length;
    const completedObjectives = objectives.filter(o => o.status === 'completed').length;
    const activeObjectives = objectives.filter(o => o.status === 'active').length;
    const completionRate =
      totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0;

    const totalEvaluations = evaluations.length;
    const scheduledEvaluations = evaluations.filter(e => e.status === 'scheduled').length;
    const completedEvaluations = evaluations.filter(e => e.status === 'completed');
    const averageScore =
      completedEvaluations.length > 0
        ? Number(
            (
              completedEvaluations.reduce((acc, curr) => acc + curr.overall_score, 0) /
              completedEvaluations.length
            ).toFixed(1)
          )
        : 0;

    return {
      totalObjectives,
      completedObjectives,
      activeObjectives, // Added
      completionRate, // Added
      totalEvaluations,
      scheduledEvaluations, // Added
      averageScore,
    };
  };

  return {
    objectives,
    objectiveTemplates, // Added
    evaluations,
    keyResults: [], // TODO: Implémenter si nécessaire
    evaluationCategories: [], // TODO: Implémenter si nécessaire
    loading,
    error,
    refresh: fetchData,
    createObjective,
    createObjectiveTemplate, // Added
    createEvaluation,
    updateObjective,
    deleteObjective,
    getKeyResultsByObjective,
    getCategoriesByEvaluation,
    getPerformanceStats,
  };
};

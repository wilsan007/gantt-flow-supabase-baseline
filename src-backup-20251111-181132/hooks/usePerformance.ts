/**
 * Hook usePerformance - Gestion des performances et évaluations
 * Pattern Enterprise pour le module RH
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { useRolesCompat as useUserRoles } from '@/contexts/RolesContext';
import { useUserFilterContext } from '@/hooks/useUserAuth';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';

interface Objective {
  id: string;
  employee_id: string;
  title: string;
  description?: string;
  target_date: string;
  status: string;
  progress: number;
  created_at?: string;
  updated_at?: string;
}

interface Evaluation {
  id: string;
  employee_id: string;
  evaluator_id: string;
  period_start: string;
  period_end: string;
  overall_rating: number;
  strengths?: string;
  areas_for_improvement?: string;
  comments?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const usePerformance = () => {
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

  const fetchData = async () => {
    if (!userContext) return;

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

      const { data: objectivesData, error: objectivesError } = await objectivesQuery;

      if (objectivesError) throw objectivesError;

      // Fetch evaluations avec filtrage
      let evaluationsQuery = supabase
        .from('evaluations')
        .select('*')
        .order('created_at', { ascending: false });

      // 🔒 Appliquer le filtrage par rôle (performance_reviews est l'équivalent)
      evaluationsQuery = applyRoleFilters(evaluationsQuery, userContext, 'performance_reviews');

      const { data: evaluationsData, error: evaluationsError } = await evaluationsQuery;

      if (evaluationsError) throw evaluationsError;

      setObjectives((objectivesData as any) || []);
      setEvaluations((evaluationsData as any) || []);
    } catch (err: any) {
      console.error('Error fetching performance data:', err);
      setError(err.message);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de performance',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveTenantId) {
      fetchData();
    }
  }, [effectiveTenantId]);

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
    return {
      totalObjectives: objectives.length,
      completedObjectives: objectives.filter(o => o.status === 'completed').length,
      totalEvaluations: evaluations.length,
      averageScore: 0, // TODO: Calculer si nécessaire
    };
  };

  return {
    objectives,
    evaluations,
    keyResults: [], // TODO: Implémenter si nécessaire
    evaluationCategories: [], // TODO: Implémenter si nécessaire
    loading,
    error,
    refresh: fetchData,
    createObjective,
    createEvaluation,
    updateObjective,
    deleteObjective,
    getKeyResultsByObjective,
    getCategoriesByEvaluation,
    getPerformanceStats,
  };
};

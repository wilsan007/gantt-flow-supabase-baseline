import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Objective {
  id: string;
  employee_id?: string;
  employee_name: string;
  title: string;
  description?: string;
  department: string;
  type: 'individual' | 'team' | 'okr';
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  progress: number;
  due_date: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface KeyResult {
  id: string;
  objective_id: string;
  title: string;
  target: string;
  current_value?: string;
  progress: number;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface Evaluation {
  id: string;
  employee_id?: string;
  employee_name: string;
  evaluator_id?: string;
  evaluator_name: string;
  period: string;
  type: 'annual' | 'quarterly' | '360';
  status: 'scheduled' | 'in_progress' | 'completed';
  overall_score: number;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface EvaluationCategory {
  id: string;
  evaluation_id: string;
  name: string;
  score: number;
  weight: number;
  feedback?: string;
  created_at: string;
  tenant_id?: string;
}

export const usePerformance = () => {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [evaluationCategories, setEvaluationCategories] = useState<EvaluationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [objectivesRes, evaluationsRes, keyResultsRes, categoriesRes] = await Promise.all([
        supabase.from('objectives').select('*').order('created_at', { ascending: false }),
        supabase.from('evaluations').select('*').order('created_at', { ascending: false }),
        supabase.from('key_results').select('*').order('created_at', { ascending: false }),
        supabase.from('evaluation_categories').select('*').order('created_at', { ascending: false })
      ]);

      if (objectivesRes.error) throw objectivesRes.error;
      if (evaluationsRes.error) throw evaluationsRes.error;
      if (keyResultsRes.error) throw keyResultsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setObjectives(objectivesRes.data as Objective[] || []);
      setEvaluations(evaluationsRes.data as Evaluation[] || []);
      setKeyResults(keyResultsRes.data as KeyResult[] || []);
      setEvaluationCategories(categoriesRes.data as EvaluationCategory[] || []);
    } catch (err: any) {
      console.error('Error fetching performance data:', err);
      setError(err.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de performance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createObjective = async (data: Omit<Objective, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('objectives')
        .insert(data);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Objectif créé avec succès"
      });

      fetchData();
    } catch (err: any) {
      console.error('Error creating objective:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'objectif",
        variant: "destructive"
      });
    }
  };

  const updateObjective = async (id: string, data: Partial<Objective>) => {
    try {
      const { error } = await supabase
        .from('objectives')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Objectif mis à jour avec succès"
      });

      fetchData();
    } catch (err: any) {
      console.error('Error updating objective:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'objectif",
        variant: "destructive"
      });
    }
  };

  const createEvaluation = async (data: Omit<Evaluation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('evaluations')
        .insert(data);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Évaluation créée avec succès"
      });

      fetchData();
    } catch (err: any) {
      console.error('Error creating evaluation:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'évaluation",
        variant: "destructive"
      });
    }
  };

  const updateEvaluation = async (id: string, data: Partial<Evaluation>) => {
    try {
      const { error } = await supabase
        .from('evaluations')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Évaluation mise à jour avec succès"
      });

      fetchData();
    } catch (err: any) {
      console.error('Error updating evaluation:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'évaluation",
        variant: "destructive"
      });
    }
  };

  const createKeyResult = async (data: Omit<KeyResult, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('key_results')
        .insert(data);

      if (error) throw error;

      fetchData();
    } catch (err: any) {
      console.error('Error creating key result:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer le résultat clé",
        variant: "destructive"
      });
    }
  };

  const getObjectivesByEmployee = (employeeName: string) => {
    return objectives.filter(obj => obj.employee_name === employeeName);
  };

  const getEvaluationsByEmployee = (employeeName: string) => {
    return evaluations.filter(evaluation => evaluation.employee_name === employeeName);
  };

  const getKeyResultsByObjective = (objectiveId: string) => {
    return keyResults.filter(kr => kr.objective_id === objectiveId);
  };

  const getCategoriesByEvaluation = (evaluationId: string) => {
    return evaluationCategories.filter(cat => cat.evaluation_id === evaluationId);
  };

  const getPerformanceStats = () => {
    const activeObjectives = objectives.filter(obj => obj.status === 'active').length;
    const completedObjectives = objectives.filter(obj => obj.status === 'completed').length;
    const totalObjectives = objectives.length;
    const completionRate = totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0;
    
    const completedEvaluations = evaluations.filter(evaluation => evaluation.status === 'completed');
    const averageScore = completedEvaluations.length > 0 
      ? completedEvaluations.reduce((sum, evaluation) => sum + evaluation.overall_score, 0) / completedEvaluations.length 
      : 0;
    
    const scheduledEvaluations = evaluations.filter(evaluation => evaluation.status === 'scheduled').length;

    return {
      activeObjectives,
      completionRate,
      averageScore: Math.round(averageScore * 10) / 10,
      scheduledEvaluations
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    objectives,
    evaluations,
    keyResults,
    evaluationCategories,
    loading,
    error,
    refetch: fetchData,
    createObjective,
    updateObjective,
    createEvaluation,
    updateEvaluation,
    createKeyResult,
    getObjectivesByEmployee,
    getEvaluationsByEmployee,
    getKeyResultsByObjective,
    getCategoriesByEvaluation,
    getPerformanceStats
  };
};
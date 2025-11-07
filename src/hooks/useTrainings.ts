/**
 * 🎓 Hook useTrainings - Gestion Formations & Inscriptions
 * Pattern: Cornerstone, LinkedIn Learning, BambooHR
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserFilterContext } from '@/hooks/useUserAuth';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';
import { useToast } from '@/hooks/use-toast';

export interface Training {
  id: string;
  title: string;
  description: string | null;
  category: string;
  type: 'internal' | 'external' | 'e-learning' | 'certification' | 'webinar';
  provider: string | null;
  duration_hours: number;
  cost: number;
  currency: string;
  language: string;
  level: string;
  is_mandatory: boolean;
  max_participants: number | null;
  url: string | null;
  objectives: string[] | null;
  prerequisites: string[] | null;
  tenant_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingEnrollment {
  id: string;
  training_id: string;
  session_id: string | null;
  employee_id: string;
  training?: Training;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'waitlist';
  enrollment_date: string;
  approved_by: string | null;
  approved_at: string | null;
  completion_date: string | null;
  certificate_url: string | null;
  quiz_score: number | null;
  rating: number | null;
  feedback: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingFilters {
  category?: string;
  type?: string;
  level?: string;
  is_mandatory?: boolean;
  search?: string;
}

export function useTrainings() {
  const { userContext, profile, loading: authLoading } = useUserFilterContext();
  const { toast } = useToast();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<TrainingEnrollment[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<TrainingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch catalogue formations avec filtres
  const fetchTrainings = useCallback(
    async (filters?: TrainingFilters) => {
      if (!userContext) return;

      try {
        let query = supabase.from('trainings').select('*').eq('is_active', true).order('title');

        query = applyRoleFilters(query, userContext, 'trainings');

        // Appliquer filtres
        if (filters?.category) {
          query = query.eq('category', filters.category);
        }
        if (filters?.type) {
          query = query.eq('type', filters.type);
        }
        if (filters?.level) {
          query = query.eq('level', filters.level);
        }
        if (filters?.is_mandatory !== undefined) {
          query = query.eq('is_mandatory', filters.is_mandatory);
        }
        if (filters?.search) {
          query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setTrainings(data || []);
      } catch (err: any) {
        console.error('Erreur chargement formations:', err);
        setError(err.message);
      }
    },
    [userContext]
  );

  // Fetch mes inscriptions
  const fetchMyEnrollments = useCallback(async () => {
    if (!profile) return;

    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', profile.userId)
        .single();

      if (!employee) return;

      const { data, error: fetchError } = await supabase
        .from('training_enrollments')
        .select(
          `
          *,
          training:trainings(*)
        `
        )
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setMyEnrollments(data || []);
    } catch (err: any) {
      console.error('Erreur chargement inscriptions:', err);
      setError(err.message);
    }
  }, [profile]);

  // Fetch demandes en attente (manager)
  const fetchPendingApprovals = useCallback(async () => {
    if (
      !userContext ||
      !['project_manager', 'team_lead', 'hr_manager', 'tenant_admin'].includes(userContext.role)
    ) {
      return;
    }

    try {
      let query = supabase
        .from('training_enrollments')
        .select(
          `
          *,
          training:trainings(*),
          employee:employees(full_name, email)
        `
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      query = applyRoleFilters(query, userContext, 'training_enrollments');

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setPendingApprovals(data || []);
    } catch (err: any) {
      console.error('Erreur chargement approbations:', err);
      setError(err.message);
    }
  }, [userContext]);

  // S'inscrire à une formation
  const enrollInTraining = useCallback(
    async (trainingId: string, sessionId?: string, justification?: string) => {
      if (!profile) return;

      try {
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', profile.userId)
          .single();

        if (!employee) throw new Error('Employé non trouvé');

        // Vérifier si formation externe coûteuse (nécessite approbation)
        const { data: training } = await supabase
          .from('trainings')
          .select('cost, type, is_mandatory')
          .eq('id', trainingId)
          .single();

        const requiresApproval = training && training.type === 'external' && training.cost > 100;
        const status = requiresApproval ? 'pending' : 'approved';

        const { error: insertError } = await supabase.from('training_enrollments').insert({
          training_id: trainingId,
          session_id: sessionId || null,
          employee_id: employee.id,
          status,
          tenant_id: profile.tenantId,
        });

        if (insertError) throw insertError;

        toast({
          title: requiresApproval ? 'Demande envoyée' : 'Inscription confirmée',
          description: requiresApproval
            ? 'Votre manager recevra une notification pour approuver cette formation'
            : 'Vous êtes inscrit à cette formation',
        });

        fetchMyEnrollments();
      } catch (err: any) {
        toast({
          title: 'Erreur',
          description: err.message,
          variant: 'destructive',
        });
      }
    },
    [profile, toast, fetchMyEnrollments]
  );

  // Approuver inscription (manager)
  const approveEnrollment = useCallback(
    async (enrollmentId: string, approverId: string) => {
      try {
        const { error: updateError } = await supabase
          .from('training_enrollments')
          .update({
            status: 'approved',
            approved_by: approverId,
            approved_at: new Date().toISOString(),
          })
          .eq('id', enrollmentId);

        if (updateError) throw updateError;

        toast({
          title: 'Formation approuvée',
          description: "L'employé a été notifié de l'approbation",
        });

        fetchPendingApprovals();
      } catch (err: any) {
        toast({
          title: 'Erreur',
          description: err.message,
          variant: 'destructive',
        });
      }
    },
    [toast, fetchPendingApprovals]
  );

  // Rejeter inscription (manager)
  const rejectEnrollment = useCallback(
    async (enrollmentId: string, reason: string) => {
      try {
        const { error: updateError } = await supabase
          .from('training_enrollments')
          .update({
            status: 'rejected',
            rejection_reason: reason,
          })
          .eq('id', enrollmentId);

        if (updateError) throw updateError;

        toast({
          title: 'Formation rejetée',
          description: "L'employé a été notifié avec la raison du refus",
        });

        fetchPendingApprovals();
      } catch (err: any) {
        toast({
          title: 'Erreur',
          description: err.message,
          variant: 'destructive',
        });
      }
    },
    [toast, fetchPendingApprovals]
  );

  // Marquer formation comme terminée
  const markCompleted = useCallback(
    async (enrollmentId: string, quizScore?: number) => {
      try {
        const { error: updateError } = await supabase
          .from('training_enrollments')
          .update({
            status: 'completed',
            completion_date: new Date().toISOString(),
            quiz_score: quizScore || null,
          })
          .eq('id', enrollmentId);

        if (updateError) throw updateError;

        toast({
          title: 'Formation terminée',
          description: 'Félicitations ! Vous pouvez maintenant télécharger votre certificat',
        });

        fetchMyEnrollments();
      } catch (err: any) {
        toast({
          title: 'Erreur',
          description: err.message,
          variant: 'destructive',
        });
      }
    },
    [toast, fetchMyEnrollments]
  );

  // Noter une formation
  const rateTraining = useCallback(
    async (enrollmentId: string, rating: number, feedback?: string) => {
      try {
        const { error: updateError } = await supabase
          .from('training_enrollments')
          .update({
            rating,
            feedback: feedback || null,
          })
          .eq('id', enrollmentId);

        if (updateError) throw updateError;

        toast({
          title: 'Merci pour votre évaluation',
          description: 'Votre feedback nous aide à améliorer nos formations',
        });

        fetchMyEnrollments();
      } catch (err: any) {
        toast({
          title: 'Erreur',
          description: err.message,
          variant: 'destructive',
        });
      }
    },
    [toast, fetchMyEnrollments]
  );

  // Annuler inscription
  const cancelEnrollment = useCallback(
    async (enrollmentId: string) => {
      try {
        const { error: updateError } = await supabase
          .from('training_enrollments')
          .update({ status: 'cancelled' })
          .eq('id', enrollmentId);

        if (updateError) throw updateError;

        toast({
          title: 'Inscription annulée',
          description: 'Votre place a été libérée',
        });

        fetchMyEnrollments();
      } catch (err: any) {
        toast({
          title: 'Erreur',
          description: err.message,
          variant: 'destructive',
        });
      }
    },
    [toast, fetchMyEnrollments]
  );

  // Statistiques formations
  const getStats = useCallback(() => {
    const completed = myEnrollments.filter(e => e.status === 'completed').length;
    const inProgress = myEnrollments.filter(e => e.status === 'approved').length;
    const pending = myEnrollments.filter(e => e.status === 'pending').length;
    const totalHours = myEnrollments
      .filter(e => e.status === 'completed' && e.training)
      .reduce((sum, e) => sum + (e.training?.duration_hours || 0), 0);

    return {
      completed,
      inProgress,
      pending,
      totalHours,
      averageRating: myEnrollments
        .filter(e => e.rating)
        .reduce((sum, e, _, arr) => sum + (e.rating || 0) / arr.length, 0),
    };
  }, [myEnrollments]);

  useEffect(() => {
    if (authLoading || !userContext) return;

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTrainings(), fetchMyEnrollments(), fetchPendingApprovals()]);
      setLoading(false);
    };

    loadData();
  }, [authLoading, userContext, fetchTrainings, fetchMyEnrollments, fetchPendingApprovals]);

  return {
    // Data
    trainings,
    myEnrollments,
    pendingApprovals,
    stats: getStats(),

    // States
    loading,
    error,

    // Actions
    fetchTrainings,
    fetchMyEnrollments,
    fetchPendingApprovals,
    enrollInTraining,
    approveEnrollment,
    rejectEnrollment,
    markCompleted,
    rateTraining,
    cancelEnrollment,

    // Utils
    refresh: () => {
      fetchTrainings();
      fetchMyEnrollments();
      fetchPendingApprovals();
    },
  };
}

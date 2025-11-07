/**
 * 🎯 useLeaveApproval - Hook pour gérer le workflow d'approbation des congés
 * Pattern: BambooHR, Workday, SAP SuccessFactors
 *
 * Fonctionnalités:
 * - Récupération des demandes en attente d'approbation
 * - Approbation/Rejet avec notes
 * - Historique des approbations
 * - Notifications automatiques
 * - Support multi-niveaux
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface LeaveApproval {
  id: string;
  leave_request_id: string;
  tenant_id: string;
  approver_id: string;
  approver_level: number;
  status: 'pending' | 'approved' | 'rejected';
  decision_date?: string;
  notes?: string;
  sequence_order: number;
  is_final_approver: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  leave_request?: {
    id: string;
    employee_id: string;
    start_date: string;
    end_date: string;
    leave_type: string;
    reason?: string;
    status: string;
    employee?: {
      full_name: string;
      email: string;
      department?: string;
    };
  };
}

interface UseLeaveApprovalReturn {
  pendingApprovals: LeaveApproval[];
  myApprovals: LeaveApproval[];
  loading: boolean;
  error: Error | null;
  approveRequest: (approvalId: string, notes?: string) => Promise<boolean>;
  rejectRequest: (approvalId: string, reason: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export const useLeaveApproval = (): UseLeaveApprovalReturn => {
  const [pendingApprovals, setPendingApprovals] = useState<LeaveApproval[]>([]);
  const [myApprovals, setMyApprovals] = useState<LeaveApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { currentTenant } = useTenant();

  /**
   * Charger les approbations en attente pour l'utilisateur actuel
   */
  const fetchPendingApprovals = useCallback(async () => {
    if (!currentTenant?.id) {
      setPendingApprovals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Non authentifié');
      }

      // Récupérer les approbations en attente où je suis l'approbateur
      const { data, error: fetchError } = await supabase
        .from('leave_approvals')
        .select(
          `
          *,
          leave_request:leave_requests(
            id,
            employee_id,
            start_date,
            end_date,
            leave_type,
            reason,
            status,
            employee:employees(
              full_name,
              email,
              department
            )
          )
        `
        )
        .eq('tenant_id', currentTenant.id)
        .eq('approver_id', session.session.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPendingApprovals((data as any) || []);
    } catch (err) {
      console.error('Erreur chargement approbations en attente:', err);
      setError(err as Error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de charger les approbations en attente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentTenant?.id, toast]);

  /**
   * Charger toutes mes approbations (historique)
   */
  const fetchMyApprovals = useCallback(async () => {
    if (!currentTenant?.id) {
      setMyApprovals([]);
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Non authentifié');
      }

      const { data, error: fetchError } = await supabase
        .from('leave_approvals')
        .select(
          `
          *,
          leave_request:leave_requests(
            id,
            employee_id,
            start_date,
            end_date,
            leave_type,
            reason,
            status,
            employee:employees(
              full_name,
              email,
              department
            )
          )
        `
        )
        .eq('tenant_id', currentTenant.id)
        .eq('approver_id', session.session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setMyApprovals((data as any) || []);
    } catch (err) {
      console.error('Erreur chargement historique approbations:', err);
    }
  }, [currentTenant?.id]);

  useEffect(() => {
    fetchPendingApprovals();
    fetchMyApprovals();
  }, [fetchPendingApprovals, fetchMyApprovals]);

  /**
   * Approuver une demande
   */
  const approveRequest = useCallback(
    async (approvalId: string, notes?: string): Promise<boolean> => {
      try {
        const { data, error } = await supabase.rpc('process_leave_approval', {
          p_approval_id: approvalId,
          p_status: 'approved',
          p_notes: notes || null,
        });

        if (error) throw error;

        const result = data as { success: boolean; message: string; final_status: string };

        if (!result.success) {
          throw new Error(result.message || "Erreur lors de l'approbation");
        }

        toast({
          title: '✅ Demande approuvée',
          description: result.message,
        });

        await fetchPendingApprovals();
        await fetchMyApprovals();

        return true;
      } catch (err) {
        console.error('Erreur approbation:', err);
        toast({
          title: '❌ Erreur',
          description: "Impossible d'approuver la demande",
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, fetchPendingApprovals, fetchMyApprovals]
  );

  /**
   * Rejeter une demande
   */
  const rejectRequest = useCallback(
    async (approvalId: string, reason: string): Promise<boolean> => {
      if (!reason.trim()) {
        toast({
          title: '⚠️ Attention',
          description: 'Veuillez fournir une raison pour le rejet',
          variant: 'destructive',
        });
        return false;
      }

      try {
        const { data, error } = await supabase.rpc('process_leave_approval', {
          p_approval_id: approvalId,
          p_status: 'rejected',
          p_notes: reason,
        });

        if (error) throw error;

        const result = data as { success: boolean; message: string };

        if (!result.success) {
          throw new Error(result.message || 'Erreur lors du rejet');
        }

        toast({
          title: '❌ Demande rejetée',
          description: result.message,
        });

        await fetchPendingApprovals();
        await fetchMyApprovals();

        return true;
      } catch (err) {
        console.error('Erreur rejet:', err);
        toast({
          title: '❌ Erreur',
          description: 'Impossible de rejeter la demande',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, fetchPendingApprovals, fetchMyApprovals]
  );

  /**
   * Rafraîchir les données
   */
  const refresh = useCallback(async () => {
    await Promise.all([fetchPendingApprovals(), fetchMyApprovals()]);
  }, [fetchPendingApprovals, fetchMyApprovals]);

  return {
    pendingApprovals,
    myApprovals,
    loading,
    error,
    approveRequest,
    rejectRequest,
    refresh,
  };
};

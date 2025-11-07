/**
 * 💼 Hook useHRSelfService - Système RH Complet pour Employés
 * Pattern: Expensify, BambooHR, Workday, SAP Concur
 * 
 * Gère:
 * - Notes de frais
 * - Justificatifs d'absence
 * - Demandes administratives
 * - Timesheets
 * - Demandes de télétravail
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserFilterContext } from '@/hooks/useUserAuth';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES - Notes de Frais
// ============================================================================
export interface ExpenseReport {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  category: string;
  amount: number;
  currency: string;
  expense_date: string;
  receipt_url: string | null;
  status: 'draft' | 'submitted' | 'approved_manager' | 'approved_finance' | 'rejected' | 'paid';
  submitted_at: string | null;
  approved_by_manager: string | null;
  approved_manager_at: string | null;
  rejection_reason: string | null;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TYPES - Justificatifs d'Absence
// ============================================================================
export interface AbsenceJustification {
  id: string;
  employee_id: string;
  absence_date: string;
  absence_type: 'sick_leave' | 'medical_appointment' | 'family_emergency' | 'other';
  justification_type: 'medical_certificate' | 'official_document' | 'declaration';
  document_url: string | null;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  is_paid: boolean;
  created_at: string;
}

// ============================================================================
// TYPES - Demandes Administratives
// ============================================================================
export interface AdministrativeRequest {
  id: string;
  employee_id: string;
  request_type: 'employment_certificate' | 'salary_advance' | 'rib_change' | 'situation_change' | 'other';
  title: string;
  description: string;
  amount: number | null;
  document_url: string | null;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  processed_by: string | null;
  processed_at: string | null;
  response: string | null;
  completion_date: string | null;
  created_at: string;
}

// ============================================================================
// TYPES - Timesheet
// ============================================================================
export interface Timesheet {
  id: string;
  employee_id: string;
  week_start_date: string;
  week_end_date: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface TimesheetEntry {
  id: string;
  timesheet_id: string;
  work_date: string;
  project_id: string | null;
  task_id: string | null;
  hours: number;
  description: string | null;
  is_overtime: boolean;
}

// ============================================================================
// TYPES - Télétravail
// ============================================================================
export interface RemoteWorkRequest {
  id: string;
  employee_id: string;
  request_date: string;
  start_date: string;
  end_date: string;
  frequency: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================
export function useHRSelfService() {
  const { userContext, profile, loading: authLoading } = useUserFilterContext();
  const { toast } = useToast();
  
  // États
  const [expenseReports, setExpenseReports] = useState<ExpenseReport[]>([]);
  const [absenceJustifications, setAbsenceJustifications] = useState<AbsenceJustification[]>([]);
  const [administrativeRequests, setAdministrativeRequests] = useState<AdministrativeRequest[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [remoteWorkRequests, setRemoteWorkRequests] = useState<RemoteWorkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // NOTES DE FRAIS
  // ============================================================================
  
  const fetchExpenseReports = useCallback(async () => {
    if (!userContext) return;

    try {
      let query = supabase
        .from('expense_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      query = applyRoleFilters(query, userContext, 'expense_reports');

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      setExpenseReports(data || []);
    } catch (err: any) {
      console.error('Erreur chargement notes de frais:', err);
      setError(err.message);
    }
  }, [userContext]);

  const createExpenseReport = useCallback(async (expense: Partial<ExpenseReport>) => {
    if (!profile) return;

    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', profile.userId)
        .single();

      if (!employee) throw new Error('Employé non trouvé');

      const { error: insertError } = await supabase
        .from('expense_reports')
        .insert({
          ...expense,
          employee_id: employee.id,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Note de frais créée',
        description: 'Votre note de frais a été enregistrée',
      });

      fetchExpenseReports();
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [profile, toast, fetchExpenseReports]);

  const submitExpenseReport = useCallback(async (expenseId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('expense_reports')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', expenseId);

      if (updateError) throw updateError;

      toast({
        title: 'Note de frais soumise',
        description: 'Votre manager recevra une notification',
      });

      fetchExpenseReports();
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [toast, fetchExpenseReports]);

  const approveExpenseReport = useCallback(async (expenseId: string, approverId: string, approvalLevel: 'manager' | 'finance') => {
    try {
      const updates = approvalLevel === 'manager' 
        ? {
            status: 'approved_manager',
            approved_by_manager: approverId,
            approved_manager_at: new Date().toISOString(),
          }
        : {
            status: 'approved_finance',
            approved_by_finance: approverId,
            approved_finance_at: new Date().toISOString(),
          };

      const { error: updateError } = await supabase
        .from('expense_reports')
        .update(updates)
        .eq('id', expenseId);

      if (updateError) throw updateError;

      toast({
        title: 'Note de frais approuvée',
        description: `Approuvée par ${approvalLevel === 'manager' ? 'le manager' : 'la finance'}`,
      });

      fetchExpenseReports();
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [toast, fetchExpenseReports]);

  // ============================================================================
  // JUSTIFICATIFS D'ABSENCE
  // ============================================================================
  
  const fetchAbsenceJustifications = useCallback(async () => {
    if (!userContext) return;

    try {
      let query = supabase
        .from('absence_justifications')
        .select('*')
        .order('absence_date', { ascending: false });
      
      query = applyRoleFilters(query, userContext, 'absence_justifications');

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      setAbsenceJustifications(data || []);
    } catch (err: any) {
      console.error('Erreur chargement justificatifs:', err);
      setError(err.message);
    }
  }, [userContext]);

  const createAbsenceJustification = useCallback(async (justification: Partial<AbsenceJustification>) => {
    if (!profile) return;

    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', profile.userId)
        .single();

      if (!employee) throw new Error('Employé non trouvé');

      const { error: insertError } = await supabase
        .from('absence_justifications')
        .insert({
          ...justification,
          employee_id: employee.id,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Justificatif soumis',
        description: 'Votre justificatif d\'absence a été enregistré',
      });

      fetchAbsenceJustifications();
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [profile, toast, fetchAbsenceJustifications]);

  // ============================================================================
  // DEMANDES ADMINISTRATIVES
  // ============================================================================
  
  const fetchAdministrativeRequests = useCallback(async () => {
    if (!userContext) return;

    try {
      let query = supabase
        .from('administrative_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      query = applyRoleFilters(query, userContext, 'administrative_requests');

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      setAdministrativeRequests(data || []);
    } catch (err: any) {
      console.error('Erreur chargement demandes admin:', err);
      setError(err.message);
    }
  }, [userContext]);

  const createAdministrativeRequest = useCallback(async (request: Partial<AdministrativeRequest>) => {
    if (!profile) return;

    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', profile.userId)
        .single();

      if (!employee) throw new Error('Employé non trouvé');

      const { error: insertError } = await supabase
        .from('administrative_requests')
        .insert({
          ...request,
          employee_id: employee.id,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Demande envoyée',
        description: 'Votre demande administrative a été enregistrée',
      });

      fetchAdministrativeRequests();
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [profile, toast, fetchAdministrativeRequests]);

  // ============================================================================
  // TIMESHEETS
  // ============================================================================
  
  const fetchTimesheets = useCallback(async () => {
    if (!userContext) return;

    try {
      let query = supabase
        .from('timesheets')
        .select('*')
        .order('week_start_date', { ascending: false });
      
      query = applyRoleFilters(query, userContext, 'timesheets');

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      setTimesheets(data || []);
    } catch (err: any) {
      console.error('Erreur chargement timesheets:', err);
      setError(err.message);
    }
  }, [userContext]);

  const createTimesheet = useCallback(async (timesheet: Partial<Timesheet>) => {
    if (!profile) return;

    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', profile.userId)
        .single();

      if (!employee) throw new Error('Employé non trouvé');

      const { error: insertError } = await supabase
        .from('timesheets')
        .insert({
          ...timesheet,
          employee_id: employee.id,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Timesheet créé',
        description: 'Votre feuille de temps a été créée',
      });

      fetchTimesheets();
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [profile, toast, fetchTimesheets]);

  // ============================================================================
  // TÉLÉTRAVAIL
  // ============================================================================
  
  const fetchRemoteWorkRequests = useCallback(async () => {
    if (!userContext) return;

    try {
      let query = supabase
        .from('remote_work_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      query = applyRoleFilters(query, userContext, 'remote_work_requests');

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      setRemoteWorkRequests(data || []);
    } catch (err: any) {
      console.error('Erreur chargement demandes télétravail:', err);
      setError(err.message);
    }
  }, [userContext]);

  const createRemoteWorkRequest = useCallback(async (request: Partial<RemoteWorkRequest>) => {
    if (!profile) return;

    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', profile.userId)
        .single();

      if (!employee) throw new Error('Employé non trouvé');

      const { error: insertError } = await supabase
        .from('remote_work_requests')
        .insert({
          ...request,
          employee_id: employee.id,
          request_date: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      toast({
        title: 'Demande envoyée',
        description: 'Votre demande de télétravail a été soumise',
      });

      fetchRemoteWorkRequests();
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [profile, toast, fetchRemoteWorkRequests]);

  // ============================================================================
  // CHARGEMENT INITIAL
  // ============================================================================
  
  useEffect(() => {
    if (authLoading || !userContext) return;

    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchExpenseReports(),
        fetchAbsenceJustifications(),
        fetchAdministrativeRequests(),
        fetchTimesheets(),
        fetchRemoteWorkRequests(),
      ]);
      setLoading(false);
    };

    loadAllData();
  }, [
    authLoading,
    userContext,
    fetchExpenseReports,
    fetchAbsenceJustifications,
    fetchAdministrativeRequests,
    fetchTimesheets,
    fetchRemoteWorkRequests,
  ]);

  // ============================================================================
  // RETOUR API
  // ============================================================================
  
  return {
    // Data
    expenseReports,
    absenceJustifications,
    administrativeRequests,
    timesheets,
    remoteWorkRequests,
    
    // States
    loading,
    error,
    
    // Actions - Notes de Frais
    fetchExpenseReports,
    createExpenseReport,
    submitExpenseReport,
    approveExpenseReport,
    
    // Actions - Justificatifs
    fetchAbsenceJustifications,
    createAbsenceJustification,
    
    // Actions - Demandes Admin
    fetchAdministrativeRequests,
    createAdministrativeRequest,
    
    // Actions - Timesheets
    fetchTimesheets,
    createTimesheet,
    
    // Actions - Télétravail
    fetchRemoteWorkRequests,
    createRemoteWorkRequest,
    
    // Utils
    refresh: () => {
      fetchExpenseReports();
      fetchAbsenceJustifications();
      fetchAdministrativeRequests();
      fetchTimesheets();
      fetchRemoteWorkRequests();
    },
  };
}

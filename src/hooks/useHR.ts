import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '../contexts/TenantContext';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  absence_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
  reason?: string;
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

export interface AbsenceType {
  id: string;
  name: string;
  code: string;
  color: string;
  requires_approval: boolean;
  deducts_from_balance: boolean;
  max_days_per_year?: number;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  break_duration?: number;
  total_hours?: number;
  status: string;
  notes?: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  absence_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
}

export interface Employee {
  id: string;
  full_name: string;
  avatar_url?: string;
  job_title?: string;
  employee_id?: string;
  hire_date?: string;
  contract_type?: string;
}

export const useHR = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { tenantId } = useTenant();

  // Fetch all HR data
  const fetchHRData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!tenantId) {
        console.log('⚠️ Tenant ID not available, skipping HR data fetch');
        setLoading(false);
        return;
      }

      console.log('🔄 Fetching HR data for tenant:', tenantId);

      const [
        leaveRequestsRes,
        absenceTypesRes,
        attendancesRes,
        leaveBalancesRes,
        employeesRes
      ] = await Promise.all([
        supabase.from('leave_requests').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('absence_types').select('*').eq('tenant_id', tenantId).order('name'),
        supabase.from('attendances').select('*').eq('tenant_id', tenantId).order('date', { ascending: false }).limit(100),
        supabase.from('leave_balances').select('*').eq('tenant_id', tenantId),
        supabase.from('profiles').select('id, full_name, avatar_url, job_title, employee_id, hire_date, contract_type').eq('tenant_id', tenantId)
      ]);

      if (leaveRequestsRes.error) throw leaveRequestsRes.error;
      if (absenceTypesRes.error) throw absenceTypesRes.error;
      if (attendancesRes.error) throw attendancesRes.error;
      if (leaveBalancesRes.error) throw leaveBalancesRes.error;
      if (employeesRes.error) throw employeesRes.error;

      setLeaveRequests(leaveRequestsRes.data || []);
      setAbsenceTypes(absenceTypesRes.data || []);
      setAttendances(attendancesRes.data || []);
      setLeaveBalances(leaveBalancesRes.data || []);
      setEmployees(employeesRes.data || []);

      console.log('✅ HR data loaded:', {
        leaveRequests: leaveRequestsRes.data?.length || 0,
        absenceTypes: absenceTypesRes.data?.length || 0,
        attendances: attendancesRes.data?.length || 0,
        employees: employeesRes.data?.length || 0
      });
    } catch (error: any) {
      console.error('❌ Error fetching HR data:', error);
      setError(error.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données RH",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create leave request
  const createLeaveRequest = async (data: Omit<LeaveRequest, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .insert(data);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Demande de congé créée avec succès"
      });

      fetchHRData();
    } catch (error: any) {
      console.error('Error creating leave request:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la demande de congé",
        variant: "destructive"
      });
    }
  };

  // Update leave request status
  const updateLeaveRequestStatus = async (id: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      const updateData: any = {
        status,
        approved_at: status === 'approved' ? new Date().toISOString() : null
      };

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Demande de congé ${status === 'approved' ? 'approuvée' : 'rejetée'}`
      });

      fetchHRData();
    } catch (error: any) {
      console.error('Error updating leave request:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la demande",
        variant: "destructive"
      });
    }
  };

  // Create attendance record
  const createAttendance = async (data: Omit<Attendance, 'id'>) => {
    try {
      const { error } = await supabase
        .from('attendances')
        .insert(data);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Présence enregistrée avec succès"
      });

      fetchHRData();
    } catch (error: any) {
      console.error('Error creating attendance:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la présence",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchHRData();
    }
  }, [tenantId]);

  return {
    // Data
    leaveRequests,
    absenceTypes,
    attendances,
    leaveBalances,
    employees,
    loading,
    error,
    
    // Actions
    createLeaveRequest,
    updateLeaveRequestStatus,
    createAttendance,
    refetch: fetchHRData
  };
};
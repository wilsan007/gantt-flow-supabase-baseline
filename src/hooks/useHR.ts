import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types pour le module RH
type LeaveRequestRow = Database['public']['Tables']['leave_requests']['Row'];
type LeaveBalanceRow = Database['public']['Tables']['leave_balances']['Row'];
type AbsenceTypeRow = Database['public']['Tables']['absence_types']['Row'];
type AttendanceRow = Database['public']['Tables']['attendances']['Row'];
type TimesheetRow = Database['public']['Tables']['timesheets']['Row'];
type PositionRow = Database['public']['Tables']['positions']['Row'];

export interface LeaveRequest extends LeaveRequestRow {
  absence_type?: AbsenceTypeRow;
  employee?: { full_name: string; avatar_url?: string };
  approved_by_name?: string;
}

export interface LeaveBalance extends LeaveBalanceRow {
  absence_type?: AbsenceTypeRow;
}

export interface Attendance extends AttendanceRow {
  employee?: { full_name: string; avatar_url?: string };
}

export interface Timesheet extends TimesheetRow {
  employee?: { full_name: string; avatar_url?: string };
  task?: { title: string };
  project?: { name: string };
}

export const useHR = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceTypeRow[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all HR data
  const fetchHRData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch leave requests with related data
      const { data: leaveRequestsData, error: leaveRequestsError } = await supabase
        .from('leave_requests')
        .select(`
          *,
          absence_type:absence_types(*),
          employee:profiles!employee_id(full_name, avatar_url),
          approved_by_profile:profiles!approved_by(full_name)
        `)
        .order('created_at', { ascending: false });

      if (leaveRequestsError) throw leaveRequestsError;

      // Fetch leave balances
      const { data: leaveBalancesData, error: leaveBalancesError } = await supabase
        .from('leave_balances')
        .select(`
          *,
          absence_type:absence_types(*)
        `)
        .eq('year', new Date().getFullYear());

      if (leaveBalancesError) throw leaveBalancesError;

      // Fetch absence types
      const { data: absenceTypesData, error: absenceTypesError } = await supabase
        .from('absence_types')
        .select('*')
        .order('name');

      if (absenceTypesError) throw absenceTypesError;

      // Fetch recent attendances
      const { data: attendancesData, error: attendancesError } = await supabase
        .from('attendances')
        .select(`
          *,
          employee:profiles!employee_id(full_name, avatar_url)
        `)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(100);

      if (attendancesError) throw attendancesError;

      // Fetch recent timesheets
      const { data: timesheetsData, error: timesheetsError } = await supabase
        .from('timesheets')
        .select(`
          *,
          employee:profiles!employee_id(full_name, avatar_url),
          task:tasks(title),
          project:projects(name)
        `)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(100);

      if (timesheetsError) throw timesheetsError;

      // Fetch positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .order('title');

      if (positionsError) throw positionsError;

      setLeaveRequests(leaveRequestsData || []);
      setLeaveBalances(leaveBalancesData || []);
      setAbsenceTypes(absenceTypesData || []);
      setAttendances(attendancesData || []);
      setTimesheets(timesheetsData || []);
      setPositions(positionsData || []);

    } catch (err) {
      console.error('Error fetching HR data:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Create leave request
  const createLeaveRequest = async (request: {
    absence_type_id: string;
    start_date: string;
    end_date: string;
    reason?: string;
  }) => {
    try {
      // Get current user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profil utilisateur non trouvé');

      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: profile.id,
          ...request,
          total_days: 0 // Will be calculated by trigger
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchHRData(); // Refresh data
      return data;
    } catch (err) {
      console.error('Error creating leave request:', err);
      throw err;
    }
  };

  // Approve/reject leave request
  const updateLeaveRequestStatus = async (
    requestId: string, 
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Utilisateur non connecté');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentUser.user.id)
        .single();

      if (!profile) throw new Error('Profil utilisateur non trouvé');

      const updates: any = {
        status,
        approved_by: profile.id,
        approved_at: new Date().toISOString()
      };

      if (status === 'rejected' && rejectionReason) {
        updates.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('leave_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;
      
      await fetchHRData(); // Refresh data
    } catch (err) {
      console.error('Error updating leave request:', err);
      throw err;
    }
  };

  // Clock in/out
  const clockInOut = async (type: 'in' | 'out') => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Utilisateur non connecté');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentUser.user.id)
        .single();

      if (!profile) throw new Error('Profil utilisateur non trouvé');

      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0];

      if (type === 'in') {
        const { error } = await supabase
          .from('attendances')
          .upsert({
            employee_id: profile.id,
            date: today,
            check_in: currentTime,
            status: 'present'
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('attendances')
          .update({ check_out: currentTime })
          .eq('employee_id', profile.id)
          .eq('date', today);

        if (error) throw error;
      }
      
      await fetchHRData(); // Refresh data
    } catch (err) {
      console.error('Error clocking in/out:', err);
      throw err;
    }
  };

  // Log timesheet entry
  const logTimesheet = async (entry: {
    task_id?: string;
    project_id?: string;
    date: string;
    hours: number;
    description?: string;
    billable?: boolean;
  }) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Utilisateur non connecté');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentUser.user.id)
        .single();

      if (!profile) throw new Error('Profil utilisateur non trouvé');

      const { data, error } = await supabase
        .from('timesheets')
        .insert({
          employee_id: profile.id,
          ...entry
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchHRData(); // Refresh data
      return data;
    } catch (err) {
      console.error('Error logging timesheet:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  return {
    // Data
    leaveRequests,
    leaveBalances,
    absenceTypes,
    attendances,
    timesheets,
    positions,
    loading,
    error,

    // Actions
    createLeaveRequest,
    updateLeaveRequestStatus,
    clockInOut,
    logTimesheet,
    refetch: fetchHRData
  };
};
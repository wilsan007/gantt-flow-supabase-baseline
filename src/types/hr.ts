/**
 * Types pour le module HR (Ressources Humaines)
 */

export interface Employee {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  job_title: string | null;
  department_id: string | null;
  employee_id: string;
  status: string | null;
  hire_date: string | null;
  contract_type: string | null;
  salary: number | null;
  manager_id: string | null;
  emergency_contact: any | null;
  weekly_hours: number | null;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: string;
  tenant_id?: string;
  absence_type_id?: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
  profiles?: { full_name: string; tenant_id?: string };
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  tenant_id?: string;
  profiles?: { full_name: string; tenant_id?: string };
}

export interface AbsenceType {
  id: string;
  name: string;
  description?: string;
  code?: string;
  color?: string;
  deducts_from_balance?: boolean;
  max_days_per_year?: number;
  requires_approval?: boolean;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  absence_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HRData {
  leaveRequests: LeaveRequest[];
  absenceTypes: AbsenceType[];
  attendances: Attendance[];
  employees: Employee[];
  leaveBalances: LeaveBalance[];
  departments: any[];
}

export interface HRMetrics {
  fetchTime: number;
  cacheHit: boolean;
  dataSize: number;
  lastUpdate: Date;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

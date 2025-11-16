import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserFilterContext } from '@/hooks/useUserAuth';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';

export interface Employee {
  id: string;
  user_id?: string;
  employee_id?: string;
  full_name: string;
  phone?: string;
  job_title?: string;
  department_id?: string;
  manager_id?: string;
  hire_date?: string;
  contract_type?: string;
  salary?: number;
  weekly_hours?: number;
  avatar_url?: string;
  emergency_contact?: any;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  manager_id?: string;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔒 Contexte utilisateur pour le filtrage
  const { userContext } = useUserFilterContext();

  useEffect(() => {
    if (userContext) {
      fetchData();
    }
  }, [userContext?.userId, userContext?.tenantId]); // Dépendances stables

  const fetchData = async () => {
    if (!userContext) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch employees from profiles table avec filtrage
      let employeesQuery = supabase.from('profiles').select('*').order('full_name');

      // 🔒 Appliquer le filtrage par rôle (profiles = employees)
      employeesQuery = applyRoleFilters(employeesQuery, userContext, 'employees');

      const { data: employeesData, error: employeesError } = await employeesQuery;

      // Employés chargés

      if (employeesError) throw employeesError;

      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (departmentsError) throw departmentsError;

      // Map profiles data to match Employee interface
      const mappedEmployees = (employeesData || []).map(profile => ({
        ...profile,
        employee_id: profile.employee_id || `EMP${profile.id.slice(-4)}`,
      }));

      // Déjà filtré par applyRoleFilters
      setEmployees(mappedEmployees);
      setDepartments(departmentsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Error fetching employees data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (
    employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      // TODO: La création d'employés doit passer par le système d'invitation (send-collaborator-invitation)
      // Cette fonction nécessite un email, tenant_id et user_id qui ne sont pas fournis ici
      // Pour créer un employé, utilisez la fonctionnalité d'invitation depuis l'interface RH

      throw new Error(
        "La création directe d'employés n'est pas supportée. Utilisez le système d'invitation."
      );

      // const { data, error } = await supabase
      //   .from('profiles')
      //   .insert([
      //     {
      //       email: '', // REQUIS mais non fourni
      //       tenant_id: '', // REQUIS mais non fourni
      //       user_id: '', // REQUIS mais non fourni
      //       full_name: employeeData.full_name,
      //       job_title: employeeData.job_title,
      //       employee_id: employeeData.employee_id || `EMP${Date.now().toString().slice(-6)}`,
      //       hire_date: employeeData.hire_date,
      //       contract_type: employeeData.contract_type || 'CDI',
      //       phone: employeeData.phone,
      //       salary: employeeData.salary,
      //       weekly_hours: employeeData.weekly_hours || 35,
      //       manager_id: employeeData.manager_id,
      //       emergency_contact: employeeData.emergency_contact,
      //     },
      //   ])
      //   .select()
      //   .single();
      // if (error) throw error;

      // return mappedEmployee;
    } catch (err) {
      console.error('Error creating employee:', err);
      throw err;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', id) // Use user_id for updates
        .select()
        .single();

      if (error) throw error;

      setEmployees(prev =>
        prev.map(employee => (employee.user_id === id ? { ...employee, ...data } : employee))
      );
      return data;
    } catch (err) {
      console.error('Error updating employee:', err);
      throw err;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase.from('profiles').delete().eq('user_id', id); // Use user_id for deletion

      if (error) throw error;

      setEmployees(prev => prev.filter(employee => employee.user_id !== id));
    } catch (err) {
      console.error('Error deleting employee:', err);
      throw err;
    }
  };

  const createDepartment = async (
    departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .insert([departmentData])
        .select()
        .single();

      if (error) throw error;

      setDepartments(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating department:', err);
      throw err;
    }
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setDepartments(prev =>
        prev.map(department => (department.id === id ? { ...department, ...data } : department))
      );
      return data;
    } catch (err) {
      console.error('Error updating department:', err);
      throw err;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      const { error } = await supabase.from('departments').delete().eq('id', id);

      if (error) throw error;

      setDepartments(prev => prev.filter(department => department.id !== id));
    } catch (err) {
      console.error('Error deleting department:', err);
      throw err;
    }
  };

  return {
    employees,
    departments,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    refetch: fetchData,
  };
};

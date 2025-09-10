import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Employee {
  id: string;
  user_id?: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  department_id?: string;
  manager_id?: string;
  hire_date?: string;
  contract_type?: string;
  salary?: number;
  weekly_hours?: number;
  status?: string;
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .order('full_name');

      if (employeesError) throw employeesError;

      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (departmentsError) throw departmentsError;

      setEmployees(employeesData || []);
      setDepartments(departmentsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Error fetching employees data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();

      if (error) throw error;
      
      setEmployees(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating employee:', err);
      throw err;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEmployees(prev => 
        prev.map(employee => employee.id === id ? { ...employee, ...data } : employee)
      );
      return data;
    } catch (err) {
      console.error('Error updating employee:', err);
      throw err;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEmployees(prev => prev.filter(employee => employee.id !== id));
    } catch (err) {
      console.error('Error deleting employee:', err);
      throw err;
    }
  };

  const createDepartment = async (departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => {
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
        prev.map(department => department.id === id ? { ...department, ...data } : department)
      );
      return data;
    } catch (err) {
      console.error('Error updating department:', err);
      throw err;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

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
    refetch: fetchData
  };
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExpenseReport {
  id: string;
  employee_id: string;
  employee_name: string;
  title: string;
  total_amount: number;
  currency: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  submission_date?: string;
  approval_date?: string;
  approved_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface ExpenseItem {
  id: string;
  report_id: string;
  expense_date: string;
  category_id?: string;
  category_name: string;
  description: string;
  amount: number;
  currency: string;
  receipt_url?: string;
  mileage?: number;
  location?: string;
  created_at: string;
  tenant_id?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon?: string;
  max_amount?: number;
  requires_receipt: boolean;
  color: string;
  created_at: string;
  tenant_id?: string;
}

export const useExpenseManagement = () => {
  const [expenseReports, setExpenseReports] = useState<ExpenseReport[]>([]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reportsRes, itemsRes, categoriesRes] = await Promise.all([
        supabase.from('expense_reports').select('*').order('created_at', { ascending: false }),
        supabase.from('expense_items').select('*').order('expense_date', { ascending: false }),
        supabase.from('expense_categories').select('*').order('name')
      ]);

      if (reportsRes.error) throw reportsRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setExpenseReports(reportsRes.data as ExpenseReport[] || []);
      setExpenseItems(itemsRes.data as ExpenseItem[] || []);
      setExpenseCategories(categoriesRes.data as ExpenseCategory[] || []);
    } catch (err: any) {
      console.error('Error fetching expense data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createExpenseReport = async (data: Omit<ExpenseReport, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('expense_reports')
        .insert(data);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Note de frais créée avec succès"
      });

      fetchData();
    } catch (err: any) {
      console.error('Error creating expense report:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer la note de frais",
        variant: "destructive"
      });
    }
  };

  const updateExpenseReportStatus = async (
    reportId: string, 
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid',
    rejectionReason?: string
  ) => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'approved') {
        updateData.approval_date = new Date().toISOString().split('T')[0];
      }

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('expense_reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Statut de la note de frais mis à jour"
      });

      fetchData();
    } catch (err: any) {
      console.error('Error updating expense report status:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  const createExpenseCategory = async (data: Omit<ExpenseCategory, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .insert(data);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Catégorie créée avec succès"
      });

      fetchData();
    } catch (err: any) {
      console.error('Error creating expense category:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer la catégorie",
        variant: "destructive"
      });
    }
  };

  const getTotalByStatus = (status: string) => {
    return expenseReports
      .filter(report => report.status === status)
      .reduce((total, report) => total + report.total_amount, 0);
  };

  const getReportItems = (reportId: string) => {
    return expenseItems.filter(item => item.report_id === reportId);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    expenseReports,
    expenseItems,
    expenseCategories,
    loading,
    error,
    refetch: fetchData,
    createExpenseReport,
    updateExpenseReportStatus,
    createExpenseCategory,
    getTotalByStatus,
    getReportItems
  };
};
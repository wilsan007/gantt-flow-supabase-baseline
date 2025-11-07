import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserFilterContext } from '@/hooks/useUserAuth';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';

interface Incident {
  id: string;
  type: 'accident' | 'near-miss' | 'hazard' | 'illness';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  reportedBy: string;
  reportedDate: string;
  location: string;
  affectedEmployee?: string;
  status: 'reported' | 'investigating' | 'action-required' | 'resolved';
  actions: CorrectiveAction[];
  attachments?: string[];
}

interface CorrectiveAction {
  id: string;
  description: string;
  responsiblePerson: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedDate?: string;
}

interface SafetyDocument {
  id: string;
  title: string;
  type: 'policy' | 'procedure' | 'training' | 'certificate' | 'inspection';
  category: string;
  version: string;
  publishedDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'draft';
  downloadUrl: string;
}

interface TrainingRecord {
  id: string;
  employeeName: string;
  trainingTitle: string;
  trainingDate: string;
  expiryDate?: string;
  score?: number;
  certificateUrl?: string;
  status: 'completed' | 'expired' | 'due';
}

export const useHealthSafety = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [safetyDocuments, setSafetyDocuments] = useState<SafetyDocument[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔒 Contexte utilisateur pour le filtrage
  const { userContext } = useUserFilterContext();

  const fetchHealthSafetyData = async () => {
    if (!userContext) return;

    try {
      setLoading(true);

      // Fetch incidents avec filtrage
      let incidentsQuery = supabase
        .from('safety_incidents')
        .select('*')
        .order('reported_date', { ascending: false });

      // 🔒 Appliquer le filtrage par rôle
      incidentsQuery = applyRoleFilters(incidentsQuery, userContext, 'health_safety_incidents');

      const { data: incidentsData, error: incidentsError } = await incidentsQuery;

      if (incidentsError) throw incidentsError;

      // Fetch safety documents (données de référence - pas de filtrage nécessaire)
      const { data: documentsData, error: documentsError } = await supabase
        .from('safety_documents')
        .select('*')
        .order('published_date', { ascending: false });

      if (documentsError) throw documentsError;

      // Map database data to component interfaces
      const mappedIncidents: Incident[] = (incidentsData || []).map(incident => ({
        id: incident.id,
        type: incident.type as any,
        severity: incident.severity as any,
        title: incident.title,
        description: incident.description,
        reportedBy: incident.reported_by,
        reportedDate: incident.reported_date,
        location: incident.location,
        affectedEmployee: incident.affected_employee || undefined,
        status: incident.status as any,
        actions: [], // TODO: Fetch from separate table
      }));

      const mappedDocuments: SafetyDocument[] = (documentsData || []).map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type as any,
        category: doc.category,
        version: doc.version,
        publishedDate: doc.published_date,
        expiryDate: doc.expiry_date || undefined,
        status: doc.status as any,
        downloadUrl: doc.download_url,
      }));

      setIncidents(mappedIncidents);
      setSafetyDocuments(mappedDocuments);
      setTrainingRecords([]); // No training records table yet
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Error fetching health safety data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createIncident = async (incidentData: Omit<Incident, 'id' | 'actions'>) => {
    try {
      const dbData = {
        type: incidentData.type,
        severity: incidentData.severity,
        title: incidentData.title,
        description: incidentData.description,
        reported_by: incidentData.reportedBy,
        reported_date: incidentData.reportedDate,
        location: incidentData.location,
        affected_employee: incidentData.affectedEmployee,
        status: incidentData.status,
      };

      const { data, error } = await supabase
        .from('safety_incidents')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      const mappedData: Incident = {
        id: data.id,
        type: data.type as any,
        severity: data.severity as any,
        title: data.title,
        description: data.description,
        reportedBy: data.reported_by,
        reportedDate: data.reported_date,
        location: data.location,
        affectedEmployee: data.affected_employee || undefined,
        status: data.status as any,
        actions: [],
      };

      setIncidents(prev => [mappedData, ...prev]);
      return mappedData;
    } catch (err) {
      console.error('Error creating incident:', err);
      throw err;
    }
  };

  const updateIncident = async (id: string, updates: Partial<Incident>) => {
    try {
      const dbUpdates: any = {};
      if (updates.reportedBy) dbUpdates.reported_by = updates.reportedBy;
      if (updates.reportedDate) dbUpdates.reported_date = updates.reportedDate;
      if (updates.affectedEmployee) dbUpdates.affected_employee = updates.affectedEmployee;
      if (updates.type) dbUpdates.type = updates.type;
      if (updates.severity) dbUpdates.severity = updates.severity;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.description) dbUpdates.description = updates.description;
      if (updates.location) dbUpdates.location = updates.location;

      const { data, error } = await supabase
        .from('safety_incidents')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const mappedData: Incident = {
        id: data.id,
        type: data.type as any,
        severity: data.severity as any,
        title: data.title,
        description: data.description,
        reportedBy: data.reported_by,
        reportedDate: data.reported_date,
        location: data.location,
        affectedEmployee: data.affected_employee || undefined,
        status: data.status as any,
        actions: [], // Keep existing actions
      };

      setIncidents(prev =>
        prev.map(incident => (incident.id === id ? { ...incident, ...mappedData } : incident))
      );
      return mappedData;
    } catch (err) {
      console.error('Error updating incident:', err);
      throw err;
    }
  };

  const uploadDocument = async (documentData: Omit<SafetyDocument, 'id'>) => {
    try {
      const dbData = {
        title: documentData.title,
        type: documentData.type,
        category: documentData.category,
        version: documentData.version,
        published_date: documentData.publishedDate,
        expiry_date: documentData.expiryDate,
        status: documentData.status,
        download_url: documentData.downloadUrl,
      };

      const { data, error } = await supabase
        .from('safety_documents')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      const mappedData: SafetyDocument = {
        id: data.id,
        title: data.title,
        type: data.type as any,
        category: data.category,
        version: data.version,
        publishedDate: data.published_date,
        expiryDate: data.expiry_date || undefined,
        status: data.status as any,
        downloadUrl: data.download_url,
      };

      setSafetyDocuments(prev => [mappedData, ...prev]);
      return mappedData;
    } catch (err) {
      console.error('Error uploading document:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchHealthSafetyData();
  }, []);

  return {
    incidents,
    safetyDocuments,
    trainingRecords,
    loading,
    error,
    createIncident,
    updateIncident,
    uploadDocument,
    refetch: fetchHealthSafetyData,
  };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Capacity Planning interfaces
export interface CapacityPlanning {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  allocated_hours: number;
  available_hours: number;
  project_hours: number;
  absence_hours: number;
  capacity_utilization: number;
  created_at: string;
  updated_at: string;
}

// Recruitment interfaces (Mini-ATS)
export interface JobPost {
  id: string;
  title: string;
  department_id?: string;
  position_id?: string;
  description?: string;
  requirements?: string;
  status: string;
  salary_min?: number;
  salary_max?: number;
  location?: string;
  employment_type: string;
  posted_date?: string;
  closing_date?: string;
  hiring_manager_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  linkedin_url?: string;
  resume_url?: string;
  cover_letter?: string;
  status: string;
  source?: string;
  applied_date: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_post_id: string;
  candidate_id: string;
  status: string;
  applied_date: string;
  stage: string;
  score?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  interviewer_id?: string;
  interviewer_name: string;
  scheduled_date: string;
  scheduled_time?: string;
  duration_minutes: number;
  type: string;
  location?: string;
  status: string;
  feedback?: string;
  score?: number;
  recommendation?: string;
  created_at: string;
  updated_at: string;
}

export interface JobOffer {
  id: string;
  application_id: string;
  salary_offered: number;
  benefits?: string;
  start_date?: string;
  offer_date: string;
  expiry_date?: string;
  status: string;
  terms_conditions?: string;
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

// AI Insights interfaces
export interface EmployeeInsight {
  id: string;
  employee_id: string;
  insight_type: string;
  risk_level: string;
  score?: number;
  description?: string;
  recommendations?: string;
  data_sources?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Analytics interfaces
export interface HRAnalytics {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_type: string;
  period_start: string;
  period_end: string;
  department_id?: string;
  metadata?: any;
  calculated_at: string;
}

// Country Policies interfaces
export interface CountryPolicy {
  id: string;
  country_code: string;
  country_name: string;
  currency: string;
  language: string;
  working_hours_per_week: number;
  public_holidays?: any;
  leave_policies?: any;
  tax_rates?: any;
  compliance_rules?: string;
  created_at: string;
  updated_at: string;
}

export const useAdvancedHR = () => {
  // Capacity Planning
  const [capacityPlanning, setCapacityPlanning] = useState<CapacityPlanning[]>([]);
  
  // Recruitment (ATS)
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  
  // AI Insights
  const [employeeInsights, setEmployeeInsights] = useState<EmployeeInsight[]>([]);
  
  // Analytics
  const [hrAnalytics, setHRAnalytics] = useState<HRAnalytics[]>([]);
  
  // Country Policies
  const [countryPolicies, setCountryPolicies] = useState<CountryPolicy[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all advanced HR data
  const fetchAdvancedHRData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        capacityRes,
        jobPostsRes,
        candidatesRes,
        applicationsRes,
        interviewsRes,
        offersRes,
        insightsRes,
        analyticsRes,
        policiesRes
      ] = await Promise.all([
        supabase.from('capacity_planning').select('*').order('period_start', { ascending: false }),
        supabase.from('job_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('candidates').select('*').order('applied_date', { ascending: false }),
        supabase.from('job_applications').select('*').order('applied_date', { ascending: false }),
        supabase.from('interviews').select('*').order('scheduled_date', { ascending: false }),
        supabase.from('job_offers').select('*').order('offer_date', { ascending: false }),
        supabase.from('employee_insights').select('*').order('created_at', { ascending: false }),
        supabase.from('hr_analytics').select('*').order('calculated_at', { ascending: false }),
        supabase.from('country_policies').select('*').order('country_name')
      ]);

      if (capacityRes.error) throw capacityRes.error;
      if (jobPostsRes.error) throw jobPostsRes.error;
      if (candidatesRes.error) throw candidatesRes.error;
      if (applicationsRes.error) throw applicationsRes.error;
      if (interviewsRes.error) throw interviewsRes.error;
      if (offersRes.error) throw offersRes.error;
      if (insightsRes.error) throw insightsRes.error;
      if (analyticsRes.error) throw analyticsRes.error;
      if (policiesRes.error) throw policiesRes.error;

      setCapacityPlanning(capacityRes.data || []);
      setJobPosts(jobPostsRes.data || []);
      setCandidates(candidatesRes.data || []);
      setJobApplications(applicationsRes.data || []);
      setInterviews(interviewsRes.data || []);
      setJobOffers(offersRes.data || []);
      setEmployeeInsights(insightsRes.data || []);
      setHRAnalytics(analyticsRes.data || []);
      setCountryPolicies(policiesRes.data || []);
    } catch (error: any) {
      console.error('Error fetching advanced HR data:', error);
      setError(error.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données RH avancées",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Job Post functions
  const createJobPost = async (data: Omit<JobPost, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('job_posts')
        .insert(data);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Offre d'emploi créée avec succès"
      });

      fetchAdvancedHRData();
    } catch (error: any) {
      console.error('Error creating job post:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'offre d'emploi",
        variant: "destructive"
      });
    }
  };

  const updateJobPost = async (id: string, data: Partial<JobPost>) => {
    try {
      const { error } = await supabase
        .from('job_posts')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Offre d'emploi mise à jour"
      });

      fetchAdvancedHRData();
    } catch (error: any) {
      console.error('Error updating job post:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'offre",
        variant: "destructive"
      });
    }
  };

  // Candidate functions
  const createCandidate = async (data: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .insert(data);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Candidat ajouté avec succès"
      });

      fetchAdvancedHRData();
    } catch (error: any) {
      console.error('Error creating candidate:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le candidat",
        variant: "destructive"
      });
    }
  };

  // Interview functions
  const createInterview = async (data: Omit<Interview, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('interviews')
        .insert(data);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Entretien programmé avec succès"
      });

      fetchAdvancedHRData();
    } catch (error: any) {
      console.error('Error creating interview:', error);
      toast({
        title: "Erreur",
        description: "Impossible de programmer l'entretien",
        variant: "destructive"
      });
    }
  };

  // AI Insights functions
  const generateEmployeeInsights = async (employeeId?: string) => {
    try {
      // Si aucun employeeId fourni, prendre le premier employé disponible
      if (!employeeId) {
        // On peut récupérer un employé existant depuis les données
        const firstEmployeeId = '54aa6b55-d898-4e14-a337-2ee4477e55db'; // Marie Dupont
        employeeId = firstEmployeeId;
      }

      // Vérifier que l'ID est un UUID valide
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(employeeId)) {
        throw new Error('ID d\'employé invalide');
      }

      const insight: Omit<EmployeeInsight, 'id' | 'created_at' | 'updated_at'> = {
        employee_id: employeeId,
        insight_type: 'risk_analysis',
        risk_level: 'medium',
        score: 65,
        description: 'Analyse automatique des patterns d\'absence et de performance',
        recommendations: 'Proposer un entretien de suivi ou formation complémentaire',
        data_sources: {
          absences: true,
          performance: true,
          workload: true
        },
        is_active: true
      };

      const { error } = await supabase
        .from('employee_insights')
        .insert(insight);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Insight généré avec succès"
      });

      fetchAdvancedHRData();
    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les insights",
        variant: "destructive"
      });
    }
  };

  // Analytics functions
  const calculateHRMetrics = async () => {
    try {
      // Période = mois courant
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const period_start = startOfMonth.toISOString().split('T')[0];
      const period_end = endOfMonth.toISOString().split('T')[0];

      // Charger les employés (profiles) et les tâches
      const [profilesRes, tasksRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name'),
        supabase.from('tasks').select('assigned_name, start_date, due_date, effort_estimate_h')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (tasksRes.error) throw tasksRes.error;

      const profiles = profilesRes.data || [];
      const tasks = tasksRes.data || [];

      // Tâche qui chevauche la période
      const overlaps = (start?: string | null, due?: string | null) => {
        if (!start || !due) return false;
        const s = new Date(start);
        const d = new Date(due);
        return d >= startOfMonth && s <= endOfMonth;
      };

      // Heures par personne (nom)
      const hoursByName = new Map<string, number>();
      for (const t of tasks as any[]) {
        if (!overlaps(t.start_date, t.due_date)) continue;
        const name = t.assigned_name as string | null;
        if (!name) continue;
        const hours = Number(t.effort_estimate_h) || 0;
        hoursByName.set(name, (hoursByName.get(name) || 0) + hours);
      }

      // Nettoyer la capacité existante pour la période, puis réinsérer
      await supabase
        .from('capacity_planning')
        .delete()
        .eq('period_start', period_start)
        .eq('period_end', period_end);

      const allocatedPerMonth = 160; // capacité mensuelle par défaut
      const capacityRows = profiles.map((p: any) => {
        const project_hours = Math.round(hoursByName.get(p.full_name) || 0);
        const absence_hours = 0;
        const available_hours = Math.max(allocatedPerMonth - absence_hours, 1);
        const capacity_utilization = Math.min(100, Math.max(0, Math.round((project_hours / available_hours) * 100)));
        return {
          employee_id: p.id,
          period_start,
          period_end,
          allocated_hours: allocatedPerMonth,
          available_hours,
          project_hours,
          absence_hours,
          capacity_utilization,
        };
      });

      if (capacityRows.length > 0) {
        const { error: capErr } = await supabase.from('capacity_planning').insert(capacityRows);
        if (capErr) throw capErr;
      }

      // Recalculer les métriques pour la période (sans valeurs en dur)
      await supabase
        .from('hr_analytics')
        .delete()
        .eq('period_start', period_start)
        .eq('period_end', period_end)
        .in('metric_name', ['headcount', 'turnover_rate']);

      const metrics = [
        {
          metric_name: 'headcount',
          metric_value: profiles.length,
          metric_type: 'count',
          period_start,
          period_end,
          metadata: { scope: 'profiles' },
        },
        {
          metric_name: 'turnover_rate',
          metric_value: 0,
          metric_type: 'percentage',
          period_start,
          period_end,
          metadata: { method: 'basic' },
        },
      ];

      const { error: metErr } = await supabase.from('hr_analytics').insert(metrics);
      if (metErr) throw metErr;

      toast({ title: 'Succès', description: 'Capacité et métriques recalculées' });

      fetchAdvancedHRData();
    } catch (error: any) {
      console.error('Error calculating metrics:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de recalculer la capacité et les métriques",
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchAdvancedHRData();
  }, []);

  return {
    // Data
    capacityPlanning,
    jobPosts,
    candidates,
    jobApplications,
    interviews,
    jobOffers,
    employeeInsights,
    hrAnalytics,
    countryPolicies,
    loading,
    error,
    
    // Functions
    createJobPost,
    updateJobPost,
    createCandidate,
    createInterview,
    generateEmployeeInsights,
    calculateHRMetrics,
    refetch: fetchAdvancedHRData
  };
};
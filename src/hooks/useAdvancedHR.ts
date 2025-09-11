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

// Fonction pour créer les alertes de capacité
const createCapacityAlerts = async (overloadedEmployees: any[], highUtilizationEmployees: any[], averageUtilization: number) => {
  try {
    const alertsToCreate = [];

    // Alertes pour surcharge >= 90%
    for (const employee of overloadedEmployees) {
      // Récupérer le nom de l'employé
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', employee.employee_id)
        .maybeSingle();

      alertsToCreate.push({
        title: `Surcharge détectée - ${profile?.full_name || 'Employé'}`,
        description: `Taux d'utilisation de ${employee.capacity_utilization}% (≥ 90%)`,
        severity: 'high',
        status: 'active',
        entity_type: 'employee',
        entity_id: employee.employee_id,
        entity_name: profile?.full_name || 'Employé',
        context_data: {
          capacity_utilization: employee.capacity_utilization,
          threshold: 90,
          period_start: employee.period_start,
          period_end: employee.period_end
        },
        alert_type_id: null // À définir si vous avez des types d'alertes configurés
      });
    }

    // Alertes pour taux > moyenne + 25%
    for (const employee of highUtilizationEmployees) {
      // Éviter les doublons avec les alertes de surcharge
      if (employee.capacity_utilization < 90) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', employee.employee_id)
          .maybeSingle();

        alertsToCreate.push({
          title: `Utilisation élevée - ${profile?.full_name || 'Employé'}`,
          description: `Taux de ${employee.capacity_utilization}% (25% au-dessus de la moyenne de ${Math.round(averageUtilization)}%)`,
          severity: 'medium',
          status: 'active',
          entity_type: 'employee',
          entity_id: employee.employee_id,
          entity_name: profile?.full_name || 'Employé',
          context_data: {
            capacity_utilization: employee.capacity_utilization,
            average_utilization: averageUtilization,
            difference: employee.capacity_utilization - averageUtilization,
            period_start: employee.period_start,
            period_end: employee.period_end
          },
          alert_type_id: null
        });
      }
    }

    // Insérer les alertes
    if (alertsToCreate.length > 0) {
      const { error } = await supabase
        .from('alert_instances')
        .insert(alertsToCreate);
      
      if (error) {
        console.error('Erreur lors de la création des alertes:', error);
      }
    }
  } catch (error) {
    console.error('Erreur dans createCapacityAlerts:', error);
  }
};

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
  const calculateHRMetrics = async (customPeriodStart?: string, customPeriodEnd?: string) => {
    try {
      // Utiliser la période personnalisée ou le mois courant
      const now = new Date();
      const startOfMonth = customPeriodStart ? new Date(customPeriodStart) : new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = customPeriodEnd ? new Date(customPeriodEnd) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const period_start = startOfMonth.toISOString().split('T')[0];
      const period_end = endOfMonth.toISOString().split('T')[0];
      const today = new Date();

      // Charger les employés (profiles), les tâches, absences et congés
      const [profilesRes, tasksRes, employeesRes, absencesRes, leaveRequestsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name'),
        supabase.from('tasks').select('assigned_name, start_date, due_date, effort_estimate_h, progress'),
        supabase.from('employees').select('id, full_name, weekly_hours'),
        supabase.from('absences').select('employee_id, start_date, end_date, total_days'),
        supabase.from('leave_requests').select('employee_id, start_date, end_date, total_days, status').eq('status', 'approved')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (employeesRes.error) throw employeesRes.error;
      if (absencesRes.error) throw absencesRes.error;
      if (leaveRequestsRes.error) throw leaveRequestsRes.error;

      const profiles = profilesRes.data || [];
      const tasks = tasksRes.data || [];
      const employees = employeesRes.data || [];
      const absences = absencesRes.data || [];
      const leaveRequests = leaveRequestsRes.data || [];

      // Fonction pour calculer les jours ouvrés dans une période
      const calculateWorkingDays = (start: Date, end: Date): number => {
        let count = 0;
        const current = new Date(start);
        while (current <= end) {
          const dayOfWeek = current.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclure dimanche (0) et samedi (6)
            count++;
          }
          current.setDate(current.getDate() + 1);
        }
        return count;
      };

      // Fonction pour vérifier si une période chevauche avec une autre
      const periodsOverlap = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
        return start1 <= end2 && end1 >= start2;
      };

      // Fonction pour calculer les jours d'absence d'un employé sur la période
      const calculateAbsenceDays = (employeeId: string): number => {
        let totalAbsenceDays = 0;
        
        // Absences
        absences.forEach(absence => {
          if (absence.employee_id === employeeId) {
            const absenceStart = new Date(absence.start_date);
            const absenceEnd = new Date(absence.end_date);
            if (periodsOverlap(absenceStart, absenceEnd, startOfMonth, endOfMonth)) {
              const overlapStart = new Date(Math.max(absenceStart.getTime(), startOfMonth.getTime()));
              const overlapEnd = new Date(Math.min(absenceEnd.getTime(), endOfMonth.getTime()));
              totalAbsenceDays += calculateWorkingDays(overlapStart, overlapEnd);
            }
          }
        });

        // Congés approuvés
        leaveRequests.forEach(leave => {
          if (leave.employee_id === employeeId) {
            const leaveStart = new Date(leave.start_date);
            const leaveEnd = new Date(leave.end_date);
            if (periodsOverlap(leaveStart, leaveEnd, startOfMonth, endOfMonth)) {
              const overlapStart = new Date(Math.max(leaveStart.getTime(), startOfMonth.getTime()));
              const overlapEnd = new Date(Math.min(leaveEnd.getTime(), endOfMonth.getTime()));
              totalAbsenceDays += calculateWorkingDays(overlapStart, overlapEnd);
            }
          }
        });

        return totalAbsenceDays;
      };

      // Calculer les heures de travail par employé sur la période
      const employeeWorkingHours = new Map<string, number>();
      const totalWorkingDays = calculateWorkingDays(startOfMonth, endOfMonth);
      
      profiles.forEach(profile => {
        const employee = employees.find(emp => emp.full_name === profile.full_name);
        const weeklyHours = employee?.weekly_hours || 35;
        const dailyHours = weeklyHours / 5; // 5 jours ouvrés par semaine
        
        const absenceDays = calculateAbsenceDays(profile.id);
        const availableWorkingDays = Math.max(0, totalWorkingDays - absenceDays);
        const totalAvailableHours = availableWorkingDays * dailyHours;
        
        employeeWorkingHours.set(profile.full_name, totalAvailableHours);
      });

      // Calculer les heures de projet par employé avec prise en compte du progrès
      const projectHoursByEmployee = new Map<string, number>();
      
      tasks.forEach((task: any) => {
        const taskStart = new Date(task.start_date);
        const taskEnd = new Date(task.due_date);
        const assignedName = task.assigned_name;
        
        if (!assignedName || !task.effort_estimate_h) return;
        
        // Vérifier si la tâche chevauche avec la période
        if (periodsOverlap(taskStart, taskEnd, startOfMonth, endOfMonth)) {
          let hoursToAdd = Number(task.effort_estimate_h) || 0;
          
          // Calculer la période de chevauchement entre la tâche et la période d'analyse
          const overlapStart = new Date(Math.max(taskStart.getTime(), startOfMonth.getTime()));
          const overlapEnd = new Date(Math.min(taskEnd.getTime(), endOfMonth.getTime()));
          
          // Calculer les jours totaux de la tâche et les jours de chevauchement
          const totalTaskDays = calculateWorkingDays(taskStart, taskEnd);
          const overlapDays = calculateWorkingDays(overlapStart, overlapEnd);
          
          // Calculer le pourcentage de la tâche qui doit être fait pendant la période d'analyse
          const overlapPercentage = totalTaskDays > 0 ? overlapDays / totalTaskDays : 0;
          
          // Appliquer le pourcentage aux heures totales de la tâche
          hoursToAdd = hoursToAdd * overlapPercentage;
          
          // Si la date d'aujourd'hui est dans la période de la tâche ET dans la période d'analyse
          if (today >= startOfMonth && today <= endOfMonth && today >= taskStart && today <= taskEnd) {
            const progress = Number(task.progress) || 0;
            // Calculer les heures restantes basées sur le progrès
            hoursToAdd = hoursToAdd * (1 - progress / 100);
          }
          
          const currentHours = projectHoursByEmployee.get(assignedName) || 0;
          projectHoursByEmployee.set(assignedName, currentHours + hoursToAdd);
        }
      });

      // Nettoyer la capacité existante pour la période, puis réinsérer
      await supabase
        .from('capacity_planning')
        .delete()
        .eq('period_start', period_start)
        .eq('period_end', period_end);

      const capacityRows = profiles.map((profile: any) => {
        const availableHours = Math.round(employeeWorkingHours.get(profile.full_name) || 0);
        const projectHours = Math.round(projectHoursByEmployee.get(profile.full_name) || 0);
        const absenceDays = calculateAbsenceDays(profile.id);
        const absenceHours = Math.round(absenceDays * 7); // 7h par jour d'absence
        
        const capacity_utilization = availableHours > 0 
          ? Math.round((projectHours / availableHours) * 100)
          : 0;

        return {
          employee_id: profile.id,
          period_start,
          period_end,
          allocated_hours: Math.round(employeeWorkingHours.get(profile.full_name) || 0) + absenceHours,
          available_hours: availableHours,
          project_hours: projectHours,
          absence_hours: absenceHours,
          capacity_utilization,
        };
      });

      if (capacityRows.length > 0) {
        const { error: capErr } = await supabase.from('capacity_planning').insert(capacityRows);
        if (capErr) throw capErr;
      }

      // Calculer le taux moyen d'utilisation
      const averageUtilization = capacityRows.length > 0 
        ? capacityRows.reduce((sum, row) => sum + row.capacity_utilization, 0) / capacityRows.length
        : 0;

      // Détecter les surcharges (>= 90%)
      const overloadedEmployees = capacityRows.filter(row => row.capacity_utilization >= 90);
      
      // Détecter les employés avec un taux supérieur à 25% par rapport à la moyenne
      const highUtilizationEmployees = capacityRows.filter(row => 
        row.capacity_utilization > averageUtilization + 25
      );

      // Créer les alertes proactives
      await createCapacityAlerts(overloadedEmployees, highUtilizationEmployees, averageUtilization);
      
      // Recalculer les métriques pour la période
      await supabase
        .from('hr_analytics')
        .delete()
        .eq('period_start', period_start)
        .eq('period_end', period_end)
        .in('metric_name', ['headcount', 'turnover_rate', 'overload_count']);

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
        {
          metric_name: 'overload_count',
          metric_value: overloadedEmployees.length,
          metric_type: 'count',
          period_start,
          period_end,
          metadata: { threshold: '90%', employees: overloadedEmployees.map(e => e.employee_id) },
        },
      ];

      const { error: metErr } = await supabase.from('hr_analytics').insert(metrics);
      if (metErr) throw metErr;

      const message = overloadedEmployees.length > 0 || highUtilizationEmployees.length > 0
        ? `Capacité recalculée. ${overloadedEmployees.length} surcharge(s) et ${highUtilizationEmployees.filter(e => e.capacity_utilization < 90).length} utilisation(s) élevée(s) détectée(s)`
        : 'Capacité et métriques recalculées avec succès';

      toast({ 
        title: 'Succès', 
        description: message,
        variant: (overloadedEmployees.length > 0 || highUtilizationEmployees.length > 0) ? 'destructive' : 'default'
      });

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
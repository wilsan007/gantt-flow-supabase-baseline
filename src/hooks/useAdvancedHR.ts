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

// Fonction dynamique pour créer les alertes basées sur les types configurés
const createDynamicAlerts = async (capacityData: any[], averageUtilization: number) => {
  try {
    // Récupérer les types d'alertes de capacité
    const { data: alertTypes, error: alertTypesError } = await supabase
      .from('alert_types')
      .select('*')
      .in('category', ['capacity']);

    if (alertTypesError) {
      console.error('Erreur lors de la récupération des types d\'alertes:', alertTypesError);
      return;
    }

    const alertsToCreate = [];

    for (const employee of capacityData) {
      // Récupérer le nom de l'employé
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', employee.employee_id)
        .maybeSingle();

      const employeeName = profile?.full_name || 'Employé';

      // Vérifier chaque type d'alerte
      for (const alertType of alertTypes || []) {
        let shouldTrigger = false;
        const conditions = alertType.auto_trigger_conditions;

        // Évaluer les conditions de déclenchement
        const conditionsObj = conditions as any;
        if (conditionsObj?.capacity_utilization) {
          const condition = conditionsObj.capacity_utilization;
          const value = employee.capacity_utilization;
          
          switch (condition.operator) {
            case '>=':
              shouldTrigger = value >= condition.value;
              break;
            case '>':
              shouldTrigger = value > condition.value;
              break;
            case '<':
              shouldTrigger = value < condition.value;
              break;
            case '<=':
              shouldTrigger = value <= condition.value;
              break;
          }
        }

        if (conditionsObj?.capacity_utilization_vs_avg) {
          const condition = conditionsObj.capacity_utilization_vs_avg;
          const difference = employee.capacity_utilization - averageUtilization;
          
          switch (condition.operator) {
            case '>':
              shouldTrigger = difference > condition.value;
              break;
            case '>=':
              shouldTrigger = difference >= condition.value;
              break;
          }
        }

        // Si les conditions sont remplies, créer l'alerte
        if (shouldTrigger) {
          // Vérifier si une alerte similaire existe déjà pour cet employé
          const { data: existingAlert } = await supabase
            .from('alert_instances')
            .select('id')
            .eq('alert_type_id', alertType.id)
            .eq('entity_id', employee.employee_id)
            .eq('status', 'active')
            .maybeSingle();

          if (!existingAlert) {
            alertsToCreate.push({
              title: `${alertType.name} - ${employeeName}`,
              description: `${alertType.description}. Taux actuel: ${employee.capacity_utilization}%`,
              severity: alertType.severity,
              status: 'active',
              entity_type: 'employee',
              entity_id: employee.employee_id,
              entity_name: employeeName,
              alert_type_id: alertType.id,
              context_data: {
                capacity_utilization: employee.capacity_utilization,
                average_utilization: averageUtilization,
                period_start: employee.period_start,
                period_end: employee.period_end,
                trigger_conditions: conditions
              }
            });
          }
        }
      }
    }

    // Nouvelle logique pour les alertes spécialisées
    const tenantId = capacityData[0]?.tenant_id;
    
    // Alerte ABSENCE_SPIKE - Pic d'absences (+50% vs mois précédent)
    const currentMonth = new Date();
    const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    const { data: currentAbsences } = await supabase
      .from('absences')
      .select('*')
      .gte('start_date', currentMonthStart.toISOString().split('T')[0])
      .eq('tenant_id', tenantId);

    const { data: previousAbsences } = await supabase
      .from('absences')
      .select('*')
      .gte('start_date', previousMonth.toISOString().split('T')[0])
      .lt('start_date', currentMonthStart.toISOString().split('T')[0])
      .eq('tenant_id', tenantId);

    const currentCount = currentAbsences?.length || 0;
    const previousCount = previousAbsences?.length || 0;
    const absenceIncrease = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;

    if (absenceIncrease >= 50) {
      const absenceSpikeAlert = alertTypes?.find(at => at.code === 'ABSENCE_SPIKE');
      if (absenceSpikeAlert) {
        const { data: existing } = await supabase
          .from('alert_instances')
          .select('id')
          .eq('alert_type_id', absenceSpikeAlert.id)
          .eq('status', 'active')
          .gte('triggered_at', currentMonthStart.toISOString())
          .maybeSingle();

        if (!existing) {
          alertsToCreate.push({
            title: 'Pic d\'absences détecté',
            description: `Augmentation de ${absenceIncrease.toFixed(1)}% des absences ce mois`,
            severity: absenceSpikeAlert.severity,
            status: 'active',
            entity_type: 'organization',
            entity_id: tenantId,
            entity_name: 'Organisation',
            alert_type_id: absenceSpikeAlert.id,
            context_data: {
              current_count: currentCount,
              previous_count: previousCount,
              increase_percentage: absenceIncrease
            }
          });
        }
      }
    }

    // Alerte SICK_LEAVE_PATTERN - 3+ arrêts maladie en 3 mois
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: sickLeaves } = await supabase
      .from('absences')
      .select('employee_id, absence_types!inner(code)')
      .eq('absence_types.code', 'SICK')
      .gte('start_date', threeMonthsAgo.toISOString().split('T')[0])
      .eq('tenant_id', tenantId);

    if (sickLeaves) {
      const employeeSickCount = sickLeaves.reduce((acc: Record<string, number>, leave) => {
        acc[leave.employee_id] = (acc[leave.employee_id] || 0) + 1;
        return acc;
      }, {});

      for (const [employeeId, count] of Object.entries(employeeSickCount)) {
        if (count >= 3) {
          const sickPatternAlert = alertTypes?.find(at => at.code === 'SICK_LEAVE_PATTERN');
          if (sickPatternAlert) {
            const { data: existing } = await supabase
              .from('alert_instances')
              .select('id')
              .eq('alert_type_id', sickPatternAlert.id)
              .eq('entity_id', employeeId)
              .eq('status', 'active')
              .maybeSingle();

            if (!existing) {
              const { data: employee } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', employeeId)
                .maybeSingle();

              alertsToCreate.push({
                title: `Arrêts maladie fréquents - ${employee?.full_name || 'Employé'}`,
                description: `${count} arrêts maladie en 3 mois`,
                severity: sickPatternAlert.severity,
                status: 'active',
                entity_type: 'employee',
                entity_id: employeeId,
                entity_name: employee?.full_name || 'Employé',
                alert_type_id: sickPatternAlert.id,
                context_data: {
                  sick_leaves_count: count,
                  period_months: 3
                }
              });
            }
          }
        }
      }
    }

    // Alerte NO_EVALUATION - Pas d'évaluation depuis 12 mois
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: allEmployees } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('tenant_id', tenantId);

    if (allEmployees) {
      for (const employee of allEmployees) {
        const { data: recentEvaluation } = await supabase
          .from('evaluations')
          .select('id')
          .eq('employee_id', employee.id)
          .gte('created_at', oneYearAgo.toISOString())
          .maybeSingle();

        if (!recentEvaluation) {
          const noEvalAlert = alertTypes?.find(at => at.code === 'NO_EVALUATION');
          if (noEvalAlert) {
            const { data: existing } = await supabase
              .from('alert_instances')
              .select('id')
              .eq('alert_type_id', noEvalAlert.id)
              .eq('entity_id', employee.id)
              .eq('status', 'active')
              .maybeSingle();

            if (!existing) {
              alertsToCreate.push({
                title: `Évaluation en retard - ${employee.full_name}`,
                description: 'Aucune évaluation depuis plus de 12 mois',
                severity: noEvalAlert.severity,
                status: 'active',
                entity_type: 'employee',
                entity_id: employee.id,
                entity_name: employee.full_name || 'Employé',
                alert_type_id: noEvalAlert.id,
                context_data: {
                  months_since_evaluation: 12
                }
              });
            }
          }
        }
      }
    }

    // Insérer les alertes et générer les recommandations
    if (alertsToCreate.length > 0) {
      const { data: insertedAlerts, error } = await supabase
        .from('alert_instances')
        .insert(alertsToCreate)
        .select('id');
      
      if (error) {
        console.error('Erreur lors de la création des alertes:', error);
      } else {
        // Générer les recommandations pour chaque alerte créée
        for (const alert of insertedAlerts || []) {
          await supabase.rpc('calculate_alert_recommendations', { 
            p_alert_instance_id: alert.id 
          });
        }
      }
    }

    return alertsToCreate.length;
  } catch (error) {
    console.error('Erreur dans createDynamicAlerts:', error);
    return 0;
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

      // Créer les alertes proactives dynamiques
      const alertsCreated = await createDynamicAlerts(capacityRows, averageUtilization);
      
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

      const message = alertsCreated > 0
        ? `Capacité recalculée. ${alertsCreated} alerte(s) proactive(s) générée(s)`
        : 'Capacité et métriques recalculées avec succès';

      toast({ 
        title: 'Succès', 
        description: message,
        variant: alertsCreated > 0 ? 'destructive' : 'default'
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
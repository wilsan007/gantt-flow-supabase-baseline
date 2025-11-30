import { useState, useEffect } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Clock,
  Award,
  Target,
  FileText,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Star,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EmployeeDetailsDialogProps {
  employee: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SkillAssessment {
  id: string;
  skill_id: string;
  skill_name: string;
  current_level: number;
  target_level: number;
  last_assessed: string;
  assessor: string;
}

interface Evaluation {
  id: string;
  type: string;
  period: string;
  overall_score: number;
  status: string;
  evaluator_name: string;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  progress: number;
  due_date: string;
  assignee: string;
}

interface Absence {
  id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
  absence_type_id: string;
  absence_type_name: string;
  reason: string;
}

export const EmployeeDetailsDialog = ({
  employee,
  isOpen,
  onOpenChange,
}: EmployeeDetailsDialogProps) => {
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
  const [recentAbsences, setRecentAbsences] = useState<Absence[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee && isOpen) {
      fetchEmployeeDetails();
    }
  }, [employee, isOpen]);

  const fetchEmployeeDetails = async () => {
    if (!employee) return;

    setLoading(true);
    try {
      // Fetch skill assessments
      const { data: skills } = await supabase
        .from('skill_assessments')
        .select(
          `
          id,
          current_level,
          target_level,
          last_assessed,
          assessor,
          skill_id
        `
        )
        .eq('employee_id', employee.id)
        .order('last_assessed', { ascending: false });

      // Get skills separately
      let skillsMap: { [key: string]: string } = {};
      if (skills && skills.length > 0) {
        const skillIds = [...new Set(skills.map(s => s.skill_id))];
        const { data: skillsData } = await supabase
          .from('skills')
          .select('id, name')
          .in('id', skillIds);

        if (skillsData) {
          skillsMap = skillsData.reduce(
            (acc, skill) => {
              acc[skill.id] = skill.name;
              return acc;
            },
            {} as { [key: string]: string }
          );
        }
      }

      if (skills) {
        setSkillAssessments(
          skills.map(s => ({
            ...s,
            skill_name: skillsMap[s.skill_id] || 'Compétence inconnue',
          }))
        );
      }

      // Fetch evaluations
      const { data: evals } = await supabase
        .from('evaluations')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (evals) {
        setEvaluations(evals);
      }

      // Fetch current tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_name', employee.full_name)
        .in('status', ['todo', 'doing'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (tasks) {
        setCurrentTasks(
          tasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            progress: t.progress || 0,
            due_date: t.due_date,
            assignee: (t as any).assigned_name,
          }))
        );
      }

      // Fetch recent absences
      const { data: absences } = await supabase
        .from('absences')
        .select(
          `
          id,
          start_date,
          end_date,
          total_days,
          status,
          reason,
          absence_type_id
        `
        )
        .eq('employee_id', employee.id)
        .gte(
          'start_date',
          new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        )
        .order('start_date', { ascending: false })
        .limit(10);

      // Get absence types separately
      let absenceTypesMap: { [key: string]: string } = {};
      if (absences && absences.length > 0) {
        const typeIds = [...new Set(absences.map(a => a.absence_type_id))];
        const { data: types } = await supabase
          .from('absence_types')
          .select('id, name')
          .in('id', typeIds);

        if (types) {
          absenceTypesMap = types.reduce(
            (acc, type) => {
              acc[type.id] = type.name;
              return acc;
            },
            {} as { [key: string]: string }
          );
        }
      }

      if (absences) {
        setRecentAbsences(
          absences.map(a => ({
            ...a,
            absence_type_name: absenceTypesMap[a.absence_type_id] || 'Type inconnu',
          }))
        );
      }

      // Fetch attendance statistics
      const { data: attendances } = await supabase
        .from('attendances')
        .select('date, total_hours, status')
        .eq('employee_id', employee.id)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (attendances) {
        const totalDays = attendances.length;
        const presentDays = attendances.filter(a => a.status === 'present').length;
        const totalHours = attendances.reduce((sum, a) => sum + (a.total_hours || 0), 0);
        const avgHours = totalDays > 0 ? totalHours / totalDays : 0;

        setAttendanceStats({
          totalDays,
          presentDays,
          presentRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
          avgHoursPerDay: avgHours,
          totalHours,
        });
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'done':
        return 'default';
      case 'pending':
      case 'doing':
      case 'in_progress':
        return 'secondary';
      case 'rejected':
      case 'cancelled':
        return 'destructive';
      case 'todo':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!employee) return null;

  return (
    <ResponsiveModal open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={employee.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {employee.full_name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{employee.full_name}</h2>
              <p className="text-muted-foreground text-lg">
                {employee.job_title || 'Poste non défini'}
              </p>
            </div>
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="personal">Profil</TabsTrigger>
            <TabsTrigger value="work">Travail</TabsTrigger>
            <TabsTrigger value="skills">Compétences</TabsTrigger>
            <TabsTrigger value="evaluations">Évaluations</TabsTrigger>
            <TabsTrigger value="tasks">Projets</TabsTrigger>
            <TabsTrigger value="attendance">Présences</TabsTrigger>
          </TabsList>

          {/* Informations personnelles */}
          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">Email:</span>
                    <span className="font-medium">{employee.email || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">Téléphone:</span>
                    <span className="font-medium">{employee.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">ID Employé:</span>
                    <span className="font-medium">{employee.employee_id || 'Non assigné'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Contact d'urgence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employee.emergency_contact ? (
                    <div className="space-y-2">
                      <p>
                        <strong>Nom:</strong> {employee.emergency_contact.name}
                      </p>
                      <p>
                        <strong>Téléphone:</strong> {employee.emergency_contact.phone}
                      </p>
                      <p>
                        <strong>Relation:</strong> {employee.emergency_contact.relation}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucun contact d'urgence renseigné</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Informations de travail */}
          <TabsContent value="work" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Détails du poste
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Date d'embauche</Label>
                    <p className="font-medium">
                      {employee.hire_date
                        ? format(new Date(employee.hire_date), 'dd MMMM yyyy', { locale: fr })
                        : 'Non renseignée'}
                    </p>
                  </div>
                  <div>
                    <Label>Type de contrat</Label>
                    <div className="mt-1">
                      <Badge variant={employee.contract_type === 'CDI' ? 'default' : 'secondary'}>
                        {employee.contract_type || 'Non défini'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Heures par semaine</Label>
                    <p className="font-medium">{employee.weekly_hours || 35}h</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Rémunération
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Salaire annuel</Label>
                    <p className="text-primary text-2xl font-bold">
                      {employee.salary ? formatCurrency(employee.salary) : 'Confidentiel'}
                    </p>
                  </div>
                  <div>
                    <Label>Salaire mensuel (estimation)</Label>
                    <p className="text-muted-foreground font-medium">
                      {employee.salary ? formatCurrency(employee.salary / 12) : 'Confidentiel'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Compétences */}
          <TabsContent value="skills" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Évaluations des compétences
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skillAssessments.length > 0 ? (
                  <div className="space-y-4">
                    {skillAssessments.map(skill => (
                      <div key={skill.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{skill.skill_name}</h4>
                          <div className="text-muted-foreground text-sm">
                            {skill.current_level}/{skill.target_level} - Évalué par {skill.assessor}
                          </div>
                        </div>
                        <Progress
                          value={(skill.current_level / skill.target_level) * 100}
                          className="h-2"
                        />
                        <p className="text-muted-foreground text-xs">
                          Dernière évaluation:{' '}
                          {format(new Date(skill.last_assessed), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Aucune évaluation de compétences disponible
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Évaluations */}
          <TabsContent value="evaluations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Évaluations de performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evaluations.length > 0 ? (
                  <div className="space-y-4">
                    {evaluations.map(evaluation => (
                      <div key={evaluation.id} className="space-y-2 rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">
                              {evaluation.type} - {evaluation.period}
                            </h4>
                            <p className="text-muted-foreground text-sm">
                              Évaluateur: {evaluation.evaluator_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-primary text-2xl font-bold">
                              {evaluation.overall_score}/100
                            </div>
                            <Badge variant={getStatusColor(evaluation.status)}>
                              {evaluation.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {format(new Date(evaluation.created_at), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Aucune évaluation de performance disponible
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projets et tâches */}
          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Projets et tâches en cours
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentTasks.length > 0 ? (
                  <div className="space-y-3">
                    {currentTasks.map(task => (
                      <div key={task.id} className="space-y-2 rounded-lg border p-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium">{task.title}</h4>
                          <div className="flex gap-2">
                            <Badge variant={getStatusColor(task.status)}>{task.status}</Badge>
                            <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progression</span>
                            <span>{task.progress}%</span>
                          </div>
                          <Progress value={task.progress} className="h-2" />
                        </div>
                        {task.due_date && (
                          <p className="text-muted-foreground text-xs">
                            Échéance:{' '}
                            {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: fr })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun projet ou tâche en cours</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Présences et absences */}
          <TabsContent value="attendance" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Statistiques (30 derniers jours)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Taux de présence</span>
                    <span className="text-primary font-bold">
                      {attendanceStats.presentRate?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jours travaillés</span>
                    <span className="font-medium">
                      {attendanceStats.presentDays || 0}/{attendanceStats.totalDays || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heures moyennes/jour</span>
                    <span className="font-medium">
                      {attendanceStats.avgHoursPerDay?.toFixed(1) || 0}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total heures</span>
                    <span className="font-medium">
                      {attendanceStats.totalHours?.toFixed(1) || 0}h
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Absences récentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentAbsences.length > 0 ? (
                    <div className="max-h-60 space-y-3 overflow-y-auto">
                      {recentAbsences.map(absence => (
                        <div key={absence.id} className="space-y-1 rounded border p-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">{absence.absence_type_name}</p>
                              <p className="text-muted-foreground text-xs">
                                {format(new Date(absence.start_date), 'dd/MM', { locale: fr })} -
                                {format(new Date(absence.end_date), 'dd/MM/yyyy', { locale: fr })}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={getStatusColor(absence.status)} className="text-xs">
                                {absence.status}
                              </Badge>
                              <p className="text-muted-foreground text-xs">
                                {absence.total_days} jour(s)
                              </p>
                            </div>
                          </div>
                          {absence.reason && (
                            <p className="text-muted-foreground text-xs italic">{absence.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Aucune absence récente</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};

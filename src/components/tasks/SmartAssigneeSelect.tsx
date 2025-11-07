import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Search, TrendingUp, Clock, Calendar } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useSkillsTraining } from '@/hooks/useSkillsTraining';
import { useTasksEnterprise as useTasks, type Task } from '@/hooks/useTasksEnterprise';

interface SmartAssigneeSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAssignee?: string;
  onAssigneeSelect: (employeeId: string) => void;
  taskStartDate: string;
  taskEndDate: string;
  taskSkills?: string[]; // Skills required for the task
}

interface EmployeeMetrics {
  id: string;
  name: string;
  avatar_url?: string;
  skillMatch: number; // 0-100%
  workload: number; // 0-100%
  currentTasks: number;
  totalTasksInPeriod: number;
  availableHours: number;
  totalHours: number;
}

export const SmartAssigneeSelect: React.FC<SmartAssigneeSelectProps> = ({
  open,
  onOpenChange,
  currentAssignee,
  onAssigneeSelect,
  taskStartDate,
  taskEndDate,
  taskSkills = [],
}) => {
  const { employees } = useEmployees();
  const { skillAssessments } = useSkillsTraining();
  const { tasks } = useTasks();
  const [searchTerm, setSearchTerm] = useState('');

  const employeeMetrics = useMemo(() => {
    const startDate = new Date(taskStartDate);
    const endDate = new Date(taskEndDate);

    return employees.map(employee => {
      // Calculate skill match
      let skillMatch = 0;
      if (taskSkills.length > 0) {
        const employeeSkills = skillAssessments.filter(
          assessment => assessment.employee_id === employee.id
        );

        if (employeeSkills.length > 0) {
          const matchingSkills = employeeSkills.filter(skill =>
            taskSkills.some(taskSkill =>
              skill.employee_name.toLowerCase().includes(taskSkill.toLowerCase())
            )
          );

          if (matchingSkills.length > 0) {
            const avgLevel =
              matchingSkills.reduce((sum, skill) => sum + skill.current_level, 0) /
              matchingSkills.length;
            skillMatch = Math.min(100, (avgLevel / 5) * 100); // Assuming 5 is max skill level
          }
        }
      } else {
        // If no specific skills required, base on overall skill level
        const employeeSkills = skillAssessments.filter(
          assessment => assessment.employee_id === employee.id
        );
        if (employeeSkills.length > 0) {
          const avgLevel =
            employeeSkills.reduce((sum, skill) => sum + skill.current_level, 0) /
            employeeSkills.length;
          skillMatch = Math.min(100, (avgLevel / 5) * 100);
        } else {
          skillMatch = 50; // Default if no skill data
        }
      }

      // Calculate workload during task period
      const tasksInPeriod = tasks.filter(task => {
        if (task.assignee !== employee.full_name) return false;

        const taskStart = new Date(task.start_date);
        const taskEnd = new Date(task.due_date);

        // Check if task overlaps with our period
        return taskStart <= endDate && taskEnd >= startDate;
      });

      const totalHoursInPeriod = tasksInPeriod.reduce(
        (sum, task) => sum + task.effort_estimate_h,
        0
      );
      const weeklyHours = employee.weekly_hours || 35;
      const workingDays = Math.max(
        1,
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
      );
      const availableHours = weeklyHours * workingDays;
      const workload = Math.min(100, (totalHoursInPeriod / availableHours) * 100);

      // Count active tasks
      const currentTasks = tasks.filter(
        task => task.assignee === employee.full_name && task.status !== 'done'
      ).length;

      return {
        id: employee.id,
        name: employee.full_name,
        avatar_url: employee.avatar_url,
        skillMatch,
        workload,
        currentTasks,
        totalTasksInPeriod: tasksInPeriod.length,
        availableHours,
        totalHours: totalHoursInPeriod,
      } as EmployeeMetrics;
    });
  }, [employees, skillAssessments, tasks, taskStartDate, taskEndDate, taskSkills]);

  const filteredEmployees = useMemo(() => {
    return employeeMetrics
      .filter(employee => employee.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        // Sort by skill match first, then by lower workload
        const aScore = a.skillMatch * 0.6 + (100 - a.workload) * 0.4;
        const bScore = b.skillMatch * 0.6 + (100 - b.workload) * 0.4;
        return bScore - aScore;
      });
  }, [employeeMetrics, searchTerm]);

  const getWorkloadColor = (workload: number) => {
    if (workload < 50) return 'text-green-600';
    if (workload < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWorkloadBadge = (workload: number) => {
    if (workload < 50) return { label: 'Disponible', variant: 'default' as const };
    if (workload < 80) return { label: 'Chargé', variant: 'secondary' as const };
    return { label: 'Surchargé', variant: 'destructive' as const };
  };

  const getSkillMatchBadge = (skillMatch: number) => {
    if (skillMatch >= 80) return { label: 'Excellent', variant: 'default' as const };
    if (skillMatch >= 60) return { label: 'Bon', variant: 'secondary' as const };
    if (skillMatch >= 40) return { label: 'Moyen', variant: 'outline' as const };
    return { label: 'Faible', variant: 'destructive' as const };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sélection intelligente d'assigné
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* Search and info */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Du {new Date(taskStartDate).toLocaleDateString()} au{' '}
                {new Date(taskEndDate).toLocaleDateString()}
              </div>
              {taskSkills.length > 0 && (
                <div className="flex items-center gap-1">
                  <span>Compétences requises:</span>
                  <div className="flex gap-1">
                    {taskSkills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Employee list */}
          <div className="flex-1 space-y-3 overflow-y-auto">
            {filteredEmployees.map(employee => {
              const workloadBadge = getWorkloadBadge(employee.workload);
              const skillBadge = getSkillMatchBadge(employee.skillMatch);

              return (
                <div
                  key={employee.id}
                  className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-accent/50"
                  onClick={() => {
                    onAssigneeSelect(employee.id);
                    onOpenChange(false);
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar and basic info */}
                    <div className="flex flex-1 items-center gap-3">
                      <Avatar>
                        <AvatarImage src={employee.avatar_url} />
                        <AvatarFallback>
                          {employee.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{employee.name}</h4>
                          {currentAssignee === employee.id && (
                            <Badge variant="outline" className="text-xs">
                              Actuel
                            </Badge>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {employee.currentTasks} tâches actives
                          </div>
                          <div>{employee.totalTasksInPeriod} tâches sur la période</div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="min-w-0 flex-1 space-y-3">
                      {/* Skill match */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Correspondance des compétences</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{Math.round(employee.skillMatch)}%</span>
                            <Badge variant={skillBadge.variant} className="text-xs">
                              {skillBadge.label}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={employee.skillMatch} className="h-2" />
                      </div>

                      {/* Workload */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Charge de travail</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${getWorkloadColor(employee.workload)}`}>
                              {Math.round(employee.workload)}%
                            </span>
                            <Badge variant={workloadBadge.variant} className="text-xs">
                              {workloadBadge.label}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={employee.workload} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {employee.totalHours}h sur {employee.availableHours}h disponibles
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredEmployees.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              Aucun employé trouvé pour cette recherche
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

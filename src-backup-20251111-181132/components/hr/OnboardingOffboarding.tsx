import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  UserPlus,
  UserMinus,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Building2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOnboardingOffboarding } from '@/hooks/useOnboardingOffboarding';

// Interfaces are now imported from the hook

export const OnboardingOffboarding = () => {
  const [activeView, setActiveView] = useState('onboarding');
  const {
    onboardingProcesses,
    offboardingProcesses,
    onboardingTasks,
    offboardingTasks,
    loading,
    error,
    updateTaskStatus,
  } = useOnboardingOffboarding();

  if (loading) return <div className="p-6 text-center">Chargement...</div>;
  if (error) return <div className="p-6 text-center text-destructive">Erreur: {error}</div>;

  // Group tasks by process
  const getProcessTasks = (processId: string, isOnboarding: boolean) => {
    const tasks = isOnboarding ? onboardingTasks : offboardingTasks;
    return tasks.filter(task => task.process_id === processId);
  };

  // Calculate progress based on completed tasks
  const calculateProgress = (processId: string, isOnboarding: boolean) => {
    const tasks = getProcessTasks(processId, isOnboarding);
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rh':
        return <User className="h-4 w-4" />;
      case 'it':
        return <Building2 className="h-4 w-4" />;
      case 'manager':
        return <User className="h-4 w-4" />;
      case 'employee':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Onboarding & Offboarding</h2>
          <p className="text-muted-foreground">Processus d'intégration et de départ des employés</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Nouveau processus
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger value="offboarding" className="flex items-center gap-2">
            <UserMinus className="h-4 w-4" />
            Offboarding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="space-y-4">
          <div className="grid gap-4">
            {onboardingProcesses.map(process => {
              const processTasks = getProcessTasks(process.id, true);
              const progress = calculateProgress(process.id, true);

              return (
                <Card key={process.id} className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{process.employee_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {process.position} • {process.department}
                        </p>
                      </div>
                      <Badge className={getStatusColor(process.status)}>
                        {process.status === 'in_progress' && <Clock className="mr-1 h-3 w-3" />}
                        {process.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                        {process.status === 'pending' && <AlertCircle className="mr-1 h-3 w-3" />}
                        {process.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Début: {new Date(process.start_date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Progression</span>
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Tâches en cours</h4>
                      {processTasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                        >
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(task.category)}
                            <div>
                              <p className="text-sm font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Responsable: {task.responsible} • Échéance:{' '}
                                {new Date(task.due_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                            {task.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => updateTaskStatus(task.id, 'completed', true)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="offboarding" className="space-y-4">
          <div className="grid gap-4">
            {offboardingProcesses.map(process => {
              const processTasks = getProcessTasks(process.id, false);
              const progress = calculateProgress(process.id, false);

              return (
                <Card key={process.id} className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{process.employee_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {process.position} • {process.department}
                        </p>
                      </div>
                      <Badge className={getStatusColor(process.status)}>
                        {process.status === 'in_progress' && <Clock className="mr-1 h-3 w-3" />}
                        {process.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                        {process.status === 'scheduled' && <AlertCircle className="mr-1 h-3 w-3" />}
                        {process.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Dernier jour: {new Date(process.last_work_day).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Progression</span>
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Tâches à compléter</h4>
                      {processTasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                        >
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(task.category)}
                            <div>
                              <p className="text-sm font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Responsable: {task.responsible} • Échéance:{' '}
                                {new Date(task.due_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                            {task.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => updateTaskStatus(task.id, 'completed', false)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

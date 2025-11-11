import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CheckCircle2, Circle } from '@/lib/icons';
// Hooks optimisés avec cache intelligent et métriques
import { useTasks, type Task } from '@/hooks/optimized';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

interface MobileDynamicTableProps {
  tasks?: Task[];
  loading?: boolean;
  error?: string;
  duplicateTask?: (taskId: string) => void;
  deleteTask?: (taskId: string) => Promise<void>;
  toggleAction?: (taskId: string, actionId: string) => Promise<void>;
  addActionColumn?: (title: string, taskId: string) => Promise<void>;
  createSubTask?: (parentId: string, linkedActionId?: string, customData?: any) => Promise<any>;
  updateTaskAssignee?: (taskId: string, assignee: string) => Promise<void>;
  refetch?: () => Promise<void>;
}

const PRIORITY_COLORS = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/20 text-warning border-warning/30',
  high: 'bg-tech-orange/20 text-tech-orange border-tech-orange/30',
  urgent: 'bg-destructive/20 text-destructive border-destructive/30',
};

const STATUS_COLORS = {
  todo: 'bg-muted text-muted-foreground',
  doing: 'bg-info/20 text-info border-info/30',
  blocked: 'bg-warning/20 text-warning border-warning/30',
  done: 'bg-success/20 text-success border-success/30',
};

function MobileTaskCard({
  task,
  onToggleAction,
  isSelected,
  onSelect,
}: {
  task: Task;
  onToggleAction: (taskId: string, actionId: string) => void;
  isSelected: boolean;
  onSelect: (taskId: string) => void;
}) {
  return (
    <Card
      className={`glass transition-smooth mb-4 border-primary/30 bg-card/40 backdrop-blur-sm ${isSelected ? 'glow-primary ring-2 ring-primary/50' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="mr-2 flex-1 text-base font-semibold leading-tight text-foreground">
            {task.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(task.id)}
            className={`h-8 w-8 shrink-0 p-0 ${isSelected ? 'bg-primary/20 text-primary' : ''}`}
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`border text-xs font-medium ${STATUS_COLORS[task.status]}`}>
            {task.status}
          </Badge>
          <Badge className={`border text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority}
          </Badge>
          <div className="ml-auto flex items-center gap-1">
            {(() => {
              const assigneeStr =
                typeof task.assignee === 'string'
                  ? task.assignee
                  : (task.assignee as any)?.full_name || task.assigned_name || 'NA';
              return (
                <>
                  <Avatar className="h-6 w-6 ring-2 ring-primary/40">
                    <AvatarImage src="" alt={assigneeStr} />
                    <AvatarFallback className="bg-primary/40 text-xs font-semibold text-primary-foreground">
                      {assigneeStr.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-foreground/80">
                    {assigneeStr !== 'NA' ? assigneeStr : 'Non assigné'}
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Dates and Progress */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="block font-medium text-foreground/80">Début</span>
            <span className="text-foreground/70">
              {new Date(task.start_date).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div>
            <span className="block font-medium text-foreground/80">Fin</span>
            <span className="text-foreground/70">
              {new Date(task.due_date).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-foreground/80">Progrès</span>
            <span className="font-semibold text-primary">{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-2" />
        </div>

        {/* Effort estimate */}
        {task.effort_estimate_h > 0 && (
          <div className="flex items-center gap-1 text-xs text-foreground/70">
            <span className="h-1 w-1 rounded-full bg-accent"></span>
            Estimé: {task.effort_estimate_h}h
          </div>
        )}

        {/* Actions */}
        {task.task_actions && task.task_actions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground/80">Actions</h4>
            <div className="space-y-2">
              {task.task_actions.map(action => (
                <div key={action.id} className="flex items-center gap-2 rounded-md bg-muted/20 p-2">
                  <Checkbox
                    checked={action.is_done}
                    onCheckedChange={() => onToggleAction(task.id, action.id)}
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-sm ${action.is_done ? 'text-foreground/50 line-through' : 'text-foreground'}`}
                    >
                      {action.title}
                    </span>
                    {action.weight_percentage > 0 && (
                      <span className="ml-2 text-xs text-foreground/60">
                        ({action.weight_percentage}%)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MobileDynamicTable({
  tasks: propTasks,
  loading: propLoading,
  error: propError,
  duplicateTask: propDuplicateTask,
  deleteTask: propDeleteTask,
  toggleAction: propToggleAction,
  addActionColumn: propAddActionColumn,
  createSubTask: propCreateSubTask,
  updateTaskAssignee: propUpdateTaskAssignee,
  refetch: propRefetch,
}: MobileDynamicTableProps) {
  const hookData = useTasks();

  // Use props if provided, otherwise use hook data
  const tasks = propTasks || hookData.tasks;
  const loading = propLoading !== undefined ? propLoading : hookData.loading;
  const error = propError || hookData.error;
  const duplicateTask = propDuplicateTask || hookData.duplicateTask;
  const deleteTask = propDeleteTask || hookData.deleteTask;
  const toggleAction = propToggleAction || hookData.toggleAction;
  const addActionColumn = propAddActionColumn || hookData.addActionColumn;
  const createSubTask = propCreateSubTask || hookData.createSubTask;
  const updateTaskAssignee = propUpdateTaskAssignee || hookData.updateTaskAssignee;
  const refetch = propRefetch || hookData.refetch;

  const [newActionTitle, setNewActionTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);

  useEffect(() => {
    setOptimisticTasks(tasks);
  }, [tasks]);

  const handleAddActionColumn = async () => {
    if (newActionTitle.trim() && selectedTaskId && addActionColumn) {
      try {
        await addActionColumn(newActionTitle.trim(), selectedTaskId);
        setNewActionTitle('');
        setSelectedTaskId(undefined);
        if (refetch) await refetch();
      } catch (error) {
        console.error('Error adding action column:', error);
      }
    }
  };

  const handleToggleAction = async (taskId: string, actionId: string) => {
    if (!toggleAction) return;

    try {
      // Optimistic update
      const updatedTasks = optimisticTasks.map(task => {
        if (task.id === taskId && task.task_actions) {
          const updatedActions = task.task_actions.map(action =>
            action.id === actionId ? { ...action, is_done: !action.is_done } : action
          );

          const totalWeight = updatedActions.reduce(
            (sum, action) => sum + action.weight_percentage,
            0
          );
          const completedWeight = updatedActions
            .filter(action => action.is_done)
            .reduce((sum, action) => sum + action.weight_percentage, 0);

          const newProgress = totalWeight === 0 ? 0 : Math.round(completedWeight);

          let newStatus = task.status;
          if (newProgress === 100) {
            newStatus = 'done';
          } else if (newProgress > 0) {
            newStatus = 'doing';
          } else {
            newStatus = 'todo';
          }

          return {
            ...task,
            task_actions: updatedActions,
            progress: newProgress,
            status: newStatus as any,
          };
        }
        return task;
      });

      setOptimisticTasks(updatedTasks);
      await toggleAction(taskId, actionId);
    } catch (error) {
      console.error('Error in handleToggleAction:', error);
      if (refetch) await refetch();
    }
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId === selectedTaskId ? undefined : taskId);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  // Group tasks by status
  const tasksByStatus = {
    todo: optimisticTasks.filter(task => task.status === 'todo'),
    doing: optimisticTasks.filter(task => task.status === 'doing'),
    blocked: optimisticTasks.filter(task => task.status === 'blocked'),
    done: optimisticTasks.filter(task => task.status === 'done'),
  };

  const statusLabels = {
    todo: 'À faire',
    doing: 'En cours',
    blocked: 'Bloqué',
    done: 'Terminé',
  };

  return (
    <Card className="modern-card glow-accent transition-smooth w-full">
      <CardHeader className="border-b bg-gradient-to-r from-primary/10 via-accent/10 to-tech-purple/10 backdrop-blur-sm">
        <CardTitle className="text-lg font-semibold text-foreground">
          Tableau Dynamique Mobile
        </CardTitle>

        {/* Add Action Form */}
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Nouvelle action..."
            value={newActionTitle}
            onChange={e => setNewActionTitle(e.target.value)}
            className="flex-1 text-sm"
          />
          <Button
            onClick={handleAddActionColumn}
            disabled={!selectedTaskId || !newActionTitle.trim()}
            size="sm"
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {selectedTaskId && (
          <p className="text-xs text-foreground/70">
            Action sélectionnée pour: {optimisticTasks.find(t => t.id === selectedTaskId)?.title}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="todo" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-primary/5 via-accent/5 to-tech-purple/5">
            {Object.entries(statusLabels).map(([status, label]) => (
              <TabsTrigger
                key={status}
                value={status}
                className="transition-smooth text-xs font-semibold data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                {label}
                <Badge
                  variant="secondary"
                  className="ml-1 bg-primary/30 text-xs text-primary-foreground"
                >
                  {tasksByStatus[status as keyof typeof tasksByStatus].length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <TabsContent key={status} value={status} className="bg-card/30 p-4 backdrop-blur-sm">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-4">
                  {statusTasks.map(task => (
                    <MobileTaskCard
                      key={task.id}
                      task={task}
                      onToggleAction={handleToggleAction}
                      isSelected={selectedTaskId === task.id}
                      onSelect={handleSelectTask}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

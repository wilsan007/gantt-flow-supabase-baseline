import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Task } from '@/hooks/useTasksWithActions';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormattedActionText } from '@/components/ui/formatted-action-text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CheckCircle2, Circle } from 'lucide-react';
import { LoadingState } from '@/components/table/LoadingState';
import { ErrorState } from '@/components/table/ErrorState';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  onSelect 
}: { 
  task: Task; 
  onToggleAction: (taskId: string, actionId: string) => void;
  isSelected: boolean;
  onSelect: (taskId: string) => void;
}) {
  return (
    <Card className={`mb-4 glass border-primary/30 bg-card/40 backdrop-blur-sm transition-smooth ${isSelected ? 'ring-2 ring-primary/50 glow-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold text-foreground leading-tight flex-1 mr-2">
            {task.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(task.id)}
            className={`shrink-0 h-8 w-8 p-0 ${isSelected ? 'bg-primary/20 text-primary' : ''}`}
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-xs border font-medium ${STATUS_COLORS[task.status]}`}>
            {task.status}
          </Badge>
          <Badge className={`text-xs border font-medium ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority}
          </Badge>
          <div className="flex items-center gap-1 ml-auto">
            <Avatar className="h-6 w-6 ring-2 ring-primary/40">
              <AvatarImage src="" alt={task.assigned_name || 'Non assigné'} />
              <AvatarFallback className="text-xs bg-primary/40 text-primary-foreground font-semibold">
                {(task.assigned_name || 'NA').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-foreground/80">{task.assigned_name || 'Non assigné'}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Dates and Progress */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="block font-medium text-foreground/80">Début</span>
            <span className="text-foreground/70">{new Date(task.start_date).toLocaleDateString('fr-FR')}</span>
          </div>
          <div>
            <span className="block font-medium text-foreground/80">Fin</span>
            <span className="text-foreground/70">{new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-foreground/80 font-medium">Progrès</span>
            <span className="text-primary font-semibold">{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-2" />
        </div>

        {/* Effort estimate */}
        {task.effort_estimate_h > 0 && (
          <div className="text-xs text-foreground/70 flex items-center gap-1">
            <span className="w-1 h-1 bg-accent rounded-full"></span>
            Estimé: {task.effort_estimate_h}h
          </div>
        )}

        {/* Actions */}
        {task.task_actions && task.task_actions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground/80">Actions</h4>
            <div className="space-y-2">
              {task.task_actions.map((action) => (
                <div key={action.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/20">
                  <Checkbox
                    checked={action.is_done}
                    onCheckedChange={() => onToggleAction(task.id, action.id)}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${action.is_done ? 'line-through text-foreground/50' : 'text-foreground'}`}>
                      {action.title}
                    </span>
                    {action.weight_percentage > 0 && (
                      <span className="text-xs text-foreground/60 ml-2">
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
  refetch: propRefetch
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
            action.id === actionId 
              ? { ...action, is_done: !action.is_done }
              : action
          );
          
          const totalWeight = updatedActions.reduce((sum, action) => sum + action.weight_percentage, 0);
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
            status: newStatus as any
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
    <Card className="w-full modern-card glow-accent transition-smooth">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-tech-purple/10 backdrop-blur-sm border-b">
        <CardTitle className="text-lg font-semibold text-foreground">
          Tableau Dynamique Mobile
        </CardTitle>
        
        {/* Add Action Form */}
        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Nouvelle action..."
            value={newActionTitle}
            onChange={(e) => setNewActionTitle(e.target.value)}
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
                className="text-xs transition-smooth data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-semibold"
              >
                {label}
                <Badge variant="secondary" className="ml-1 text-xs bg-primary/30 text-primary-foreground">
                  {tasksByStatus[status as keyof typeof tasksByStatus].length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <TabsContent key={status} value={status} className="p-4 bg-card/30 backdrop-blur-sm">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-4">
                  {statusTasks.map((task) => (
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

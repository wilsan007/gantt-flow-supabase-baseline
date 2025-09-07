import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTasks, Task } from '@/hooks/useTasks';
import { GanttHeader } from '../gantt/GanttHeader';
import { GanttLoadingState, GanttErrorState } from '../gantt/GanttStates';
import { ViewMode, statusColors } from '@/lib/ganttHelpers';

interface MobileGanttChartProps {
  tasks?: Task[];
  loading?: boolean;
  error?: string;
  updateTaskDates?: (taskId: string, startDate: string, dueDate: string) => Promise<void>;
}

const PRIORITY_COLORS = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/20 text-warning border-warning/30',
  high: 'bg-tech-orange/20 text-tech-orange border-tech-orange/30',
  urgent: 'bg-destructive/20 text-destructive border-destructive/30',
};

function MobileTaskCard({ task }: { task: Task }) {
  const statusColor = statusColors[task.status];
  
  return (
    <Card className="mb-4 glass border-primary/30 bg-card/40 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with title and status */}
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-foreground text-base leading-tight flex-1 mr-2">
              {task.title}
            </h3>
            <Badge 
              className="shrink-0 text-xs font-medium"
              style={{ 
                backgroundColor: `${statusColor}20`, 
                color: statusColor,
                borderColor: `${statusColor}50`
              }}
            >
              {task.status}
            </Badge>
          </div>

          {/* Assignee and Priority */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 ring-2 ring-primary/40">
                <AvatarImage src="" alt={task.assignee} />
                <AvatarFallback className="text-xs bg-primary/40 text-primary-foreground font-semibold">
                  {task.assignee.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground/80">{task.assignee}</span>
            </div>
            <Badge className={`text-xs border font-medium ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </Badge>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2 text-xs text-foreground/70">
            <div>
              <span className="block font-medium">Début</span>
              <span>{new Date(task.start_date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div>
              <span className="block font-medium">Fin</span>
              <span>{new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>

          {/* Progress */}
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
        </div>
      </CardContent>
    </Card>
  );
}

export function MobileGanttChart({ 
  tasks: propTasks, 
  loading: propLoading, 
  error: propError,
  updateTaskDates: propUpdateTaskDates 
}: MobileGanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const hookData = useTasks();
  
  // Use props if provided, otherwise use hook data
  const tasks = propTasks || hookData.tasks;
  const loading = propLoading !== undefined ? propLoading : hookData.loading;
  const error = propError || hookData.error;

  if (loading) {
    return <GanttLoadingState />;
  }

  if (error) {
    return <GanttErrorState error={error} />;
  }

  // Group tasks by status for better mobile organization
  const tasksByStatus = {
    todo: tasks.filter(task => task.status === 'todo'),
    doing: tasks.filter(task => task.status === 'doing'),
    blocked: tasks.filter(task => task.status === 'blocked'),
    done: tasks.filter(task => task.status === 'done'),
  };

  const statusLabels = {
    todo: 'À faire',
    doing: 'En cours',
    blocked: 'Bloqué',
    done: 'Terminé',
  };

  return (
    <Card className="w-full modern-card glow-primary transition-smooth">
      <GanttHeader 
        viewMode={viewMode} 
        onViewModeChange={setViewMode} 
      />
      <CardContent className="p-4 bg-gantt-header/50 backdrop-blur-sm">
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="space-y-6">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              statusTasks.length > 0 && (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-lg font-semibold text-foreground">
                      {statusLabels[status as keyof typeof statusLabels]}
                    </h2>
                    <Badge variant="secondary" className="bg-primary/40 text-primary-foreground border-primary/50">
                      {statusTasks.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {statusTasks.map((task) => (
                      <MobileTaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
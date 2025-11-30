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
import { MobileTaskCard } from './MobileTaskCard';

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
  onSwitchToDesktop?: () => void;
}

// ... (keep existing code)

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
  onSwitchToDesktop,
}: MobileDynamicTableProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('todo');

  const statusLabels = {
    todo: 'À faire',
    doing: 'En cours',
    blocked: 'Bloqué',
    done: 'Terminé',
  };

  // Grouper les tâches par statut
  const tasksByStatus = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {
      todo: [],
      doing: [],
      blocked: [],
      done: [],
    };

    if (propTasks) {
      propTasks.forEach(task => {
        const status = task.status || 'todo';
        if (grouped[status]) {
          grouped[status].push(task);
        } else {
          // Fallback pour les status inconnus
          grouped['todo'].push(task);
        }
      });
    }

    return grouped;
  }, [propTasks]);

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId === selectedTaskId ? null : taskId);
  };

  const handleToggleAction = async (taskId: string, actionId: string) => {
    if (propToggleAction) {
      await propToggleAction(taskId, actionId);
    }
  };

  if (propLoading) {
    return <LoadingState message="Chargement des tâches..." />;
  }

  if (propError) {
    return <ErrorState error={propError} onRetry={propRefetch} />;
  }

  return (
    <Card className="modern-card glow-accent transition-smooth flex h-[calc(100vh-120px)] w-full flex-col">
      <CardHeader className="from-primary/10 via-accent/10 to-tech-purple/10 flex shrink-0 flex-row items-center justify-between border-b bg-gradient-to-r px-4 py-3 backdrop-blur-sm">
        <CardTitle className="text-foreground text-lg font-semibold">Tableau Dynamique</CardTitle>
        {onSwitchToDesktop && (
          <Button variant="outline" size="sm" onClick={onSwitchToDesktop} className="h-8 text-xs">
            🖥️ Vue Bureau
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <Tabs
          defaultValue="todo"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex h-full w-full flex-col"
        >
          <TabsList className="from-primary/5 via-accent/5 to-tech-purple/5 grid h-12 w-full shrink-0 grid-cols-4 rounded-none bg-gradient-to-r">
            {Object.entries(statusLabels).map(([status, label]) => (
              <TabsTrigger
                key={status}
                value={status}
                className="transition-smooth data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary h-full rounded-none border-b-2 border-transparent text-xs font-semibold"
              >
                <div className="flex flex-col items-center gap-1">
                  <span>{label}</span>
                  <Badge
                    variant="secondary"
                    className="bg-primary/30 text-primary-foreground flex h-4 min-w-[16px] items-center justify-center px-1 text-[10px]"
                  >
                    {tasksByStatus[status as keyof typeof tasksByStatus]?.length || 0}
                  </Badge>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <TabsContent
              key={status}
              value={status}
              className="bg-card/30 mt-0 flex-1 overflow-hidden backdrop-blur-sm data-[state=inactive]:hidden"
            >
              <ScrollArea className="h-full w-full">
                <div className="space-y-3 p-4 pb-20">
                  {statusTasks.length === 0 ? (
                    <div className="text-muted-foreground py-10 text-center text-sm">
                      Aucune tâche dans cette colonne
                    </div>
                  ) : (
                    statusTasks.map(task => (
                      <MobileTaskCard
                        key={task.id}
                        task={task}
                        onToggleAction={handleToggleAction}
                        isSelected={selectedTaskId === task.id}
                        onSelect={handleSelectTask}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

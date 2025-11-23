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
  // ... (keep existing hooks and state)

  // ... (keep existing render logic)

  return (
    <Card className="modern-card glow-accent transition-smooth w-full">
      <CardHeader className="from-primary/10 via-accent/10 to-tech-purple/10 flex flex-row items-center justify-between border-b bg-gradient-to-r backdrop-blur-sm">
        <CardTitle className="text-foreground text-lg font-semibold">Tableau Dynamique</CardTitle>
        {onSwitchToDesktop && (
          <Button variant="outline" size="sm" onClick={onSwitchToDesktop} className="h-8 text-xs">
            🖥️ Vue Bureau
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="todo" className="w-full">
          <TabsList className="from-primary/5 via-accent/5 to-tech-purple/5 grid w-full grid-cols-4 bg-gradient-to-r">
            {Object.entries(statusLabels).map(([status, label]) => (
              <TabsTrigger
                key={status}
                value={status}
                className="transition-smooth data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs font-semibold"
              >
                {label}
                <Badge
                  variant="secondary"
                  className="bg-primary/30 text-primary-foreground ml-1 text-xs"
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

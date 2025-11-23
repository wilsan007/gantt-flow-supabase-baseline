import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// Hooks optimisés avec cache intelligent et métriques
import { useTasks, type Task } from '@/hooks/optimized';
import { GanttHeader } from '../gantt/GanttHeader';
import { GanttLoadingState, GanttErrorState } from '../gantt/GanttStates';
import { ViewMode, statusColors } from '@/lib/ganttHelpers';

interface MobileGanttChartProps {
  tasks?: Task[];
  loading?: boolean;
  error?: string;
  updateTaskDates?: (taskId: string, startDate: string, dueDate: string) => Promise<void>;
  onSwitchToDesktop?: () => void;
}

// ... (keep existing code)

export function MobileGanttChart({
  tasks: propTasks,
  loading: propLoading,
  error: propError,
  updateTaskDates: propUpdateTaskDates,
  onSwitchToDesktop,
}: MobileGanttChartProps) {
  // ... (keep existing hooks and state)

  // ... (keep existing render logic)

  return (
    <Card className="modern-card glow-primary transition-smooth w-full">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Vue Gantt Mobile</h2>
        {onSwitchToDesktop && (
          <Button variant="outline" size="sm" onClick={onSwitchToDesktop} className="h-8 text-xs">
            🖥️ Vue Gantt
          </Button>
        )}
      </div>
      <GanttHeader viewMode={viewMode} onViewModeChange={setViewMode} />
      <CardContent className="bg-gantt-header/50 p-4 backdrop-blur-sm">
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="space-y-6">
            {Object.entries(tasksByStatus).map(
              ([status, statusTasks]) =>
                statusTasks.length > 0 && (
                  <div key={status}>
                    <div className="mb-3 flex items-center gap-2">
                      <h2 className="text-foreground text-lg font-semibold">
                        {statusLabels[status as keyof typeof statusLabels]}
                      </h2>
                      <Badge
                        variant="secondary"
                        className="border-primary/50 bg-primary/40 text-primary-foreground"
                      >
                        {statusTasks.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {statusTasks.map(task => (
                        <MobileTaskCard key={task.id} task={task} />
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

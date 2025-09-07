import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTasks, Task } from '@/hooks/useTasks';
import { GanttHeader } from './gantt/GanttHeader';
import { GanttTaskList } from './gantt/GanttTaskList';
import { GanttTimeline } from './gantt/GanttTimeline';
import { GanttLoadingState, GanttErrorState } from './gantt/GanttStates';
import { useGanttDrag } from '@/hooks/useGanttDrag';
import { 
  ViewMode, 
  GanttTask, 
  getViewConfig, 
  statusColors 
} from '@/lib/ganttHelpers';

const GanttChart = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const { tasks, loading, error, updateTaskDates } = useTasks();
  
  const config = getViewConfig(viewMode);
  const rowHeight = 60;
  const startDate = new Date(2024, 0, 1);
  const endDate = new Date(2024, 11, 31);

  const getGanttTask = (task: Task): GanttTask => ({
    id: task.id,
    name: task.title,
    startDate: new Date(task.start_date),
    endDate: new Date(task.due_date),
    progress: task.progress,
    color: statusColors[task.status],
    assignee: task.assignee,
    priority: task.priority,
    status: task.status
  });

  const ganttTasks = tasks.map(getGanttTask);

  const {
    draggedTask,
    resizeTask,
    chartRef,
    taskMouseDownHandler,
    handleMouseMove,
    handleMouseUp
  } = useGanttDrag(config, startDate, updateTaskDates);

  const onTaskMouseDown = (
    e: React.MouseEvent, 
    taskId: string, 
    action: 'drag' | 'resize-left' | 'resize-right'
  ) => {
    taskMouseDownHandler(e, taskId, action, ganttTasks);
  };

  useEffect(() => {
    if (draggedTask || resizeTask) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedTask, resizeTask, handleMouseMove, handleMouseUp]);

  if (loading) {
    return <GanttLoadingState />;
  }

  if (error) {
    return <GanttErrorState error={error} />;
  }

  return (
    <Card className="w-full modern-card glow-primary transition-smooth">
      <GanttHeader 
        viewMode={viewMode} 
        onViewModeChange={setViewMode} 
      />
      <CardContent className="p-0 bg-gantt-header/50 backdrop-blur-sm">
        <div className="flex h-[600px] overflow-hidden rounded-b-xl">
          <GanttTaskList 
            tasks={ganttTasks} 
            rowHeight={rowHeight} 
          />
          <div ref={chartRef} className="flex-1 min-w-0 bg-gantt-task-bg/30">
            <GanttTimeline
              tasks={ganttTasks}
              config={config}
              startDate={startDate}
              endDate={endDate}
              rowHeight={rowHeight}
              draggedTask={draggedTask}
              resizeTask={resizeTask}
              onTaskMouseDown={onTaskMouseDown}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChart;
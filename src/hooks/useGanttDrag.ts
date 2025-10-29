import { useState, useCallback, useRef } from 'react';
import { ViewConfig, GanttTask } from '@/lib/ganttHelpers';

interface DragState {
  x: number;
  originalStartDate: Date;
  originalEndDate: Date;
}

export const useGanttDrag = (
  config: ViewConfig,
  timelineStartDate: Date,
  updateTaskDates?: (taskId: string, startDate: string, endDate: string) => Promise<void>,
  onError?: (taskId: string) => Promise<void>
) => {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [resizeTask, setResizeTask] = useState<{ taskId: string; side: 'left' | 'right' } | null>(null);
  const [dragStart, setDragStart] = useState<DragState | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const taskMouseDownHandler = useCallback((
    e: React.MouseEvent, 
    taskId: string, 
    action: 'drag' | 'resize-left' | 'resize-right',
    tasks: GanttTask[]
  ) => {
    e.preventDefault();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setDragStart({
      x: e.clientX,
      originalStartDate: new Date(task.startDate),
      originalEndDate: new Date(task.endDate)
    });

    if (action === 'drag') {
      setDraggedTask(taskId);
    } else if (action === 'resize-left' || action === 'resize-right') {
      setResizeTask({ taskId, side: action === 'resize-left' ? 'left' : 'right' });
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStart || !chartRef.current) return;
    
    const deltaX = e.clientX - dragStart.x;
    const pixelsPerDay = config.unitWidth / config.unitDuration;
    const daysDelta = deltaX / pixelsPerDay;
    const timeDelta = daysDelta * 24 * 60 * 60 * 1000;
    
    if (draggedTask) {
      const newStartDate = new Date(dragStart.originalStartDate.getTime() + timeDelta);
      const newEndDate = new Date(dragStart.originalEndDate.getTime() + timeDelta);
      
      const taskElement = document.querySelector(`[data-task-id="${draggedTask}"]`) as HTMLElement;
      if (taskElement) {
        const left = (newStartDate.getTime() - timelineStartDate.getTime()) / (1000 * 60 * 60 * 24) / config.unitDuration * config.unitWidth;
        taskElement.style.left = `${left}px`;
      }
    } else if (resizeTask) {
      let newStartDate = new Date(dragStart.originalStartDate);
      let newEndDate = new Date(dragStart.originalEndDate);
      
      if (resizeTask.side === 'left') {
        newStartDate = new Date(dragStart.originalStartDate.getTime() + timeDelta);
        // Minimum 1 day duration
        if (newStartDate >= dragStart.originalEndDate) {
          newStartDate = new Date(dragStart.originalEndDate.getTime() - 24 * 60 * 60 * 1000);
        }
      } else {
        newEndDate = new Date(dragStart.originalEndDate.getTime() + timeDelta);
        // Minimum 1 day duration
        if (newEndDate <= dragStart.originalStartDate) {
          newEndDate = new Date(dragStart.originalStartDate.getTime() + 24 * 60 * 60 * 1000);
        }
      }
      
      const taskElement = document.querySelector(`[data-task-id="${resizeTask.taskId}"]`) as HTMLElement;
      if (taskElement) {
        const left = (newStartDate.getTime() - timelineStartDate.getTime()) / (1000 * 60 * 60 * 24) / config.unitDuration * config.unitWidth;
        const duration = Math.max(1, Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24)));
        const width = (duration / config.unitDuration) * config.unitWidth;
        taskElement.style.left = `${left}px`;
        taskElement.style.width = `${width}px`;
      }
    }
  }, [dragStart, draggedTask, resizeTask, config]);

  const handleMouseUp = useCallback(async (e: MouseEvent) => {
    if (!dragStart || !updateTaskDates) return;
    
    try {
      const deltaX = e.clientX - dragStart.x;
      const pixelsPerDay = config.unitWidth / config.unitDuration;
      const daysDelta = Math.round(deltaX / pixelsPerDay);
      const timeDelta = daysDelta * 24 * 60 * 60 * 1000;
      
      if (draggedTask) {
        const newStartDate = new Date(dragStart.originalStartDate.getTime() + timeDelta);
        const newEndDate = new Date(dragStart.originalEndDate.getTime() + timeDelta);
        
        await updateTaskDates(draggedTask, 
          newStartDate.toISOString().split('T')[0], 
          newEndDate.toISOString().split('T')[0]
        );
      } else if (resizeTask) {
        let newStartDate = new Date(dragStart.originalStartDate);
        let newEndDate = new Date(dragStart.originalEndDate);
        
        if (resizeTask.side === 'left') {
          newStartDate = new Date(dragStart.originalStartDate.getTime() + timeDelta);
          // Minimum 1 day duration
          if (newStartDate >= dragStart.originalEndDate) {
            newStartDate = new Date(dragStart.originalEndDate.getTime() - 24 * 60 * 60 * 1000);
          }
        } else {
          newEndDate = new Date(dragStart.originalEndDate.getTime() + timeDelta);
          // Minimum 1 day duration
          if (newEndDate <= dragStart.originalStartDate) {
            newEndDate = new Date(dragStart.originalStartDate.getTime() + 24 * 60 * 60 * 1000);
          }
        }
        
        await updateTaskDates(resizeTask.taskId,
          newStartDate.toISOString().split('T')[0],
          newEndDate.toISOString().split('T')[0]
        );
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // ✅ Utiliser la fonction de callback pour gérer l'erreur et rafraîchir les données
      if (onError) {
        const errorTaskId = draggedTask || resizeTask?.taskId;
        if (errorTaskId) {
          // Appeler le callback qui va refresh() les données depuis Supabase
          await onError(errorTaskId);
        }
      } else {
        // Fallback : recharger la page si pas de callback
        window.location.reload();
      }
    } finally {
      setDraggedTask(null);
      setResizeTask(null);
      setDragStart(null);
    }
  }, [dragStart, draggedTask, resizeTask, config, updateTaskDates, onError]);

  return {
    draggedTask,
    resizeTask,
    chartRef,
    taskMouseDownHandler,
    handleMouseMove,
    handleMouseUp
  };
};
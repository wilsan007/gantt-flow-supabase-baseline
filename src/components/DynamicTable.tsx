import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useTasks, Task } from '@/hooks/useTasks';
import { TaskTableHeader } from './table/TaskTableHeader';
import { TaskFixedColumns } from './table/TaskFixedColumns';
import { TaskActionColumns } from './table/TaskActionColumns';
import { LoadingState } from './table/LoadingState';
import { ErrorState } from './table/ErrorState';

const DynamicTable = () => {
  const { 
    tasks, 
    loading, 
    error, 
    duplicateTask, 
    deleteTask, 
    toggleAction, 
    addActionColumn,
    createSubTask,
    updateTaskAssignee,
    refetch
  } = useTasks();
  
  const [newActionTitle, setNewActionTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);

  // Synchroniser les tâches optimistes avec les vraies tâches
  useEffect(() => {
    setOptimisticTasks(tasks);
  }, [tasks]);

  const handleAddActionColumn = async () => {
    if (newActionTitle.trim() && selectedTaskId) {
      try {
        await addActionColumn(newActionTitle.trim(), selectedTaskId);
        setNewActionTitle('');
        setSelectedTaskId(undefined);
        await refetch(); // Rafraîchir les données après l'ajout
      } catch (error) {
        console.error('Error adding action column:', error);
      }
    }
  };

  const handleToggleAction = async (taskId: string, actionId: string) => {
    try {
      console.log('handleToggleAction called:', { taskId, actionId });
      
      // Mise à jour optimiste : on met à jour l'interface immédiatement
      const updatedTasks = optimisticTasks.map(task => {
        if (task.id === taskId && task.task_actions) {
          const updatedActions = task.task_actions.map(action => 
            action.id === actionId 
              ? { ...action, is_done: !action.is_done }
              : action
          );
          
          // Calculer la nouvelle progression
          const totalWeight = updatedActions.reduce((sum, action) => sum + action.weight_percentage, 0);
          const completedWeight = updatedActions
            .filter(action => action.is_done)
            .reduce((sum, action) => sum + action.weight_percentage, 0);
          
          const newProgress = totalWeight === 0 ? 0 : Math.round(completedWeight);
          
          // Calculer le nouveau statut
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
      
      // Ensuite on fait la vraie mise à jour
      await toggleAction(taskId, actionId);
      // La subscription temps réel synchronisera automatiquement
    } catch (error) {
      console.error('Error in handleToggleAction:', error);
      // En cas d'erreur, on refetch pour revenir à l'état correct
      await refetch();
    }
  };

  const handleDuplicateTask = (taskId: string) => {
    duplicateTask(taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    await refetch();
  };

  const handleCreateSubtask = async (parentId: string, linkedActionId?: string, customData?: {
    title: string;
    start_date: string;
    due_date: string;
    effort_estimate_h: number;
  }) => {
    try {
      console.log('Creating subtask with data:', { parentId, linkedActionId, customData });
      const newSubtask = await createSubTask(parentId, linkedActionId, customData);
      console.log('Subtask created successfully:', newSubtask);
      
      // Rafraîchir les données immédiatement après la création
      await refetch();
    } catch (error) {
      console.error('Error creating subtask:', error);
    }
  };

  const handleUpdateAssignee = async (taskId: string, assignee: string) => {
    try {
      await updateTaskAssignee(taskId, assignee);
      await refetch();
    } catch (error) {
      console.error('Error updating assignee:', error);
    }
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId === selectedTaskId ? undefined : taskId);
  };

  const isActionButtonEnabled = !!(selectedTaskId && newActionTitle.trim());

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <Card className="w-full modern-card glow-accent transition-smooth">
        <TaskTableHeader 
          newActionTitle={newActionTitle}
          setNewActionTitle={setNewActionTitle}
          onAddActionColumn={handleAddActionColumn}
          selectedTaskId={selectedTaskId}
          isActionButtonEnabled={isActionButtonEnabled}
        />
      <CardContent className="bg-gantt-header/20 backdrop-blur-sm">
        <ResizablePanelGroup direction="horizontal" className="border rounded-lg border-border/50 overflow-hidden">
          <ResizablePanel defaultSize={70} minSize={60}>
            <TaskFixedColumns 
              tasks={optimisticTasks}
              onDuplicate={handleDuplicateTask}
              onDelete={handleDeleteTask}
              onCreateSubtask={handleCreateSubtask}
              onUpdateAssignee={handleUpdateAssignee}
              selectedTaskId={selectedTaskId}
              onSelectTask={handleSelectTask}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={30} minSize={25}>
            <TaskActionColumns 
              tasks={optimisticTasks}
              onToggleAction={handleToggleAction}
              selectedTaskId={selectedTaskId}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </CardContent>
    </Card>
  );
};

export default DynamicTable;
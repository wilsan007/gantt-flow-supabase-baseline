import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useTasks } from '@/hooks/useTasks';
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
    await toggleAction(taskId, actionId);
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
      await createSubTask(parentId, linkedActionId, customData);
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
    <Card className="w-full">
        <TaskTableHeader 
          newActionTitle={newActionTitle}
          setNewActionTitle={setNewActionTitle}
          onAddActionColumn={handleAddActionColumn}
          selectedTaskId={selectedTaskId}
          isActionButtonEnabled={isActionButtonEnabled}
        />
      <CardContent>
        <ResizablePanelGroup direction="horizontal" className="border rounded-lg">
          <ResizablePanel defaultSize={60} minSize={40}>
            <TaskFixedColumns 
              tasks={tasks}
              onDuplicate={handleDuplicateTask}
              onDelete={handleDeleteTask}
              onCreateSubtask={handleCreateSubtask}
              onUpdateAssignee={handleUpdateAssignee}
              selectedTaskId={selectedTaskId}
              onSelectTask={handleSelectTask}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={40} minSize={30}>
            <TaskActionColumns 
              tasks={tasks}
              onToggleAction={handleToggleAction}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </CardContent>
    </Card>
  );
};

export default DynamicTable;
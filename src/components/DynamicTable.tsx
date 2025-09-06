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
    addActionColumn 
  } = useTasks();
  
  const [newActionTitle, setNewActionTitle] = useState('');

  const handleAddActionColumn = async () => {
    if (newActionTitle.trim()) {
      await addActionColumn(newActionTitle.trim());
      setNewActionTitle('');
    }
  };

  const handleToggleAction = async (taskId: string, actionId: string) => {
    await toggleAction(taskId, actionId);
  };

  const handleDuplicateTask = (taskId: string) => {
    duplicateTask(taskId);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

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
      />
      <CardContent>
        <ResizablePanelGroup direction="horizontal" className="border rounded-lg">
          <ResizablePanel defaultSize={60} minSize={40}>
            <TaskFixedColumns 
              tasks={tasks}
              onDuplicate={handleDuplicateTask}
              onDelete={handleDeleteTask}
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
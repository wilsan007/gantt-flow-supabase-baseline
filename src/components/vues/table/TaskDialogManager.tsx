import { useState } from 'react';
import { type Task } from '@/hooks/optimized';
import { TaskDetailsDialog } from '../dialogs/TaskDetailsDialog';

interface TaskDialogManagerProps {
  tasks: Task[];
  onCreateSubtask: (parentId: string, linkedActionId?: string, customData?: {
    title: string;
    start_date: string;
    due_date: string;
    effort_estimate_h: number;
  }) => void;
}

export const TaskDialogManager = ({ tasks, onCreateSubtask }: TaskDialogManagerProps) => {
  const [actionSelectionOpen, setActionSelectionOpen] = useState(false);
  const [selectedParentTask, setSelectedParentTask] = useState<Task | null>(null);
  const [createSubtaskOpen, setCreateSubtaskOpen] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | undefined>();
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);

  const handleCreateSubtask = (parentId: string) => {
    const parentTask = tasks.find(task => task.id === parentId);
    if (parentTask && parentTask.task_actions && parentTask.task_actions.length > 0) {
      setSelectedParentTask(parentTask);
      setActionSelectionOpen(true);
    } else {
      // Si pas d'actions, ouvrir directement le dialog de création
      setSelectedParentTask(parentTask || null);
      setSelectedActionId(undefined);
      setCreateSubtaskOpen(true);
    }
  };

  const handleActionSelection = (actionId: string) => {
    setSelectedActionId(actionId);
    setActionSelectionOpen(false);
    setCreateSubtaskOpen(true);
  };

  const handleCreateSubtaskSubmit = (customData: {
    title: string;
    start_date: string;
    due_date: string;
    effort_estimate_h: number;
  }) => {
    if (selectedParentTask) {
      onCreateSubtask(selectedParentTask.id, selectedActionId, customData);
      setSelectedParentTask(null);
      setSelectedActionId(undefined);
    }
  };

  const handleRowDoubleClick = (task: Task) => {
    setSelectedTaskForDetails(task);
    setTaskDetailsOpen(true);
  };

  return {
    // Handlers
    handleCreateSubtask,
    handleRowDoubleClick,
    
    // Dialogs JSX
    dialogs: (
      <>
        <TaskDetailsDialog
          open={taskDetailsOpen}
          onOpenChange={setTaskDetailsOpen}
          task={selectedTaskForDetails}
        />
      </>
    )
  };
};
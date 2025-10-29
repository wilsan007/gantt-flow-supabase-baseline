import { TableBody } from '@/components/ui/table';
import { type Task } from '@/hooks/optimized';
import { TaskRow } from './TaskRow';

interface TaskTableBodyProps {
  tasks: Task[];
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
  onRowDoubleClick: (task: Task) => void;
  onCreateSubtask: (parentId: string, linkedActionId?: string, customData?: {
    title: string;
    start_date: string;
    due_date: string;
    effort_estimate_h: number;
  }) => void;
  onCreateSubtaskWithActions?: (parentId: string, customData: {
    title: string;
    start_date: string;
    due_date: string;
    effort_estimate_h: number;
  }, actions: Array<{
    id: string;
    title: string;
    weight_percentage: number;
    due_date?: string;
    notes?: string;
  }>) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onUpdateAssignee: (taskId: string, assignee: string) => void;
}

export const TaskTableBody = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onRowDoubleClick,
  onCreateSubtask,
  onCreateSubtaskWithActions,
  onDelete,
  onDuplicate,
  onEdit,
  onUpdateAssignee
}: TaskTableBodyProps) => {
  // Trier les tâches par display_order pour afficher les sous-tâches correctement
  const sortedTasks = [...tasks].sort((a, b) => {
    const orderA = a.display_order?.split('.').map(n => parseInt(n)) || [0];
    const orderB = b.display_order?.split('.').map(n => parseInt(n)) || [0];
    
    for (let i = 0; i < Math.max(orderA.length, orderB.length); i++) {
      const numA = orderA[i] || 0;
      const numB = orderB[i] || 0;
      if (numA !== numB) return numA - numB;
    }
    return 0;
  });

  return (
    <TableBody>
      {sortedTasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          selectedTaskId={selectedTaskId}
          onSelectTask={onSelectTask}
          onRowDoubleClick={onRowDoubleClick}
          onCreateSubtask={onCreateSubtask}
          onCreateSubtaskWithActions={onCreateSubtaskWithActions}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
          onUpdateAssignee={onUpdateAssignee}
        />
      ))}
    </TableBody>
  );
};
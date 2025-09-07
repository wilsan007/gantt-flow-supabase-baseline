import { TableBody } from '@/components/ui/table';
import { Task } from '@/hooks/useTasks';
import { TaskRow } from './TaskRow';

interface TaskTableBodyProps {
  tasks: Task[];
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
  onRowDoubleClick: (task: Task) => void;
  onCreateSubtask: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onUpdateAssignee: (taskId: string, assignee: string) => void;
}

export const TaskTableBody = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onRowDoubleClick,
  onCreateSubtask,
  onDelete,
  onDuplicate,
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
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onUpdateAssignee={onUpdateAssignee}
        />
      ))}
    </TableBody>
  );
};
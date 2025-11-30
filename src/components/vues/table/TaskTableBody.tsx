import { TableBody } from '@/components/ui/table';
import { type Task } from '@/hooks/optimized';
import { TaskRow } from './TaskRow';

interface TaskTableBodyProps {
  tasks: Task[];
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
  onRowDoubleClick: (task: Task) => void;
  onCreateSubtask: (
    parentId: string,
    linkedActionId?: string,
    customData?: {
      title: string;
      start_date: string;
      due_date: string;
      effort_estimate_h: number;
    }
  ) => void;
  onCreateSubtaskWithActions?: (
    parentId: string,
    customData: {
      title: string;
      start_date: string;
      due_date: string;
      effort_estimate_h: number;
    },
    actions: Array<{
      id: string;
      title: string;
      weight_percentage: number;
      due_date?: string;
      notes?: string;
    }>
  ) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onUpdateAssignee: (taskId: string, assignee: string) => void;
  onUpdateAssignee: (taskId: string, assignee: string) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onCreateTask?: (taskData: {
    title: string;
    assignee: string;
    department: string;
    project: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'doing' | 'blocked' | 'done';
    effort_estimate_h: number;
  }) => Promise<any>;
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
  onUpdateAssignee,
  onUpdateTask,
  onCreateTask,
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

  // Générer les lignes fantômes
  const ghostTasks: Task[] = Array.from({ length: 5 }).map(
    (_, index) =>
      ({
        id: `ghost-task-${index}`,
        title: '', // Titre vide pour inviter à la saisie
        status: 'todo',
        priority: 'medium',
        assignee: '',
        project_id: '',
        start_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        effort_estimate_h: 0,
        progress: 0,
        tags: [],
        subtasks: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_ghost: true, // Flag pour le style
      }) as any
  );

  const handleGhostTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    // Si on modifie le titre d'une tâche fantôme, on la crée
    if (updates.title && onCreateTask) {
      try {
        await onCreateTask({
          title: updates.title,
          assignee: typeof updates.assignee === 'string' ? updates.assignee : '',
          department: '', // À définir ou laisser vide
          project: updates.project_id || '',
          priority: (updates.priority as any) || 'medium',
          status: (updates.status as any) || 'todo',
          effort_estimate_h: updates.effort_estimate_h || 0,
        });
        // Le re-render se fera automatiquement quand la nouvelle tâche sera ajoutée à la liste 'tasks'
      } catch (error) {
        console.error('Erreur lors de la création de la tâche fantôme:', error);
      }
    }
  };

  const allTasks = [...sortedTasks, ...ghostTasks];

  return (
    <TableBody>
      {allTasks.map(task => (
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
          onUpdateTask={(taskId, updates) => {
            if (taskId.startsWith('ghost-task-')) {
              handleGhostTaskUpdate(taskId, updates);
            } else if (onUpdateTask) {
              onUpdateTask(taskId, updates);
            }
          }}
          isGhost={task.id.startsWith('ghost-task-')}
        />
      ))}
    </TableBody>
  );
};

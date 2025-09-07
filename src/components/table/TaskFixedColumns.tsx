import { 
  Table, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Task } from '@/hooks/useTasks';
import { TaskTableBody } from './TaskTableBody';
import { TaskDialogManager } from './TaskDialogManager';

interface TaskFixedColumnsProps {
  tasks: Task[];
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onCreateSubtask: (parentId: string, linkedActionId?: string, customData?: {
    title: string;
    start_date: string;
    due_date: string;
    effort_estimate_h: number;
  }) => void;
  onUpdateAssignee: (taskId: string, assignee: string) => void;
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
}

export const TaskFixedColumns = ({ 
  tasks, 
  onDuplicate, 
  onDelete, 
  onCreateSubtask, 
  onUpdateAssignee,
  selectedTaskId,
  onSelectTask
}: TaskFixedColumnsProps) => {
  const dialogManager = TaskDialogManager({ tasks, onCreateSubtask });

  return (
    <>
      <div className="h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow className="h-12">
              <TableHead className="min-w-[200px] h-12">Tâche</TableHead>
              <TableHead className="min-w-[150px] h-12">Responsable</TableHead>
              <TableHead className="min-w-[80px] h-12">Début</TableHead>
              <TableHead className="min-w-[80px] h-12">Échéance</TableHead>
              <TableHead className="min-w-[80px] h-12">Priorité</TableHead>
              <TableHead className="min-w-[80px] h-12">Statut</TableHead>
              <TableHead className="min-w-[80px] h-12">Charge (h)</TableHead>
              <TableHead className="min-w-[100px] h-12">Progression</TableHead>
              <TableHead className="min-w-[100px] h-12">Documents</TableHead>
              <TableHead className="min-w-[100px] h-12">Commentaires</TableHead>
              <TableHead className="w-[50px] h-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          <TaskTableBody
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
            onRowDoubleClick={dialogManager.handleRowDoubleClick}
            onCreateSubtask={dialogManager.handleCreateSubtask}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onUpdateAssignee={onUpdateAssignee}
          />
        </Table>
      </div>
      
      {dialogManager.dialogs}
    </>
  );
};
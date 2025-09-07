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
          <TableHeader className="sticky top-0 bg-gantt-header backdrop-blur-sm z-10 border-b border-gantt-grid">
            <TableRow className="h-12 hover:bg-transparent">
              <TableHead className="min-w-[200px] h-12 text-foreground font-semibold">Tâche</TableHead>
              <TableHead className="min-w-[150px] h-12 text-foreground font-semibold">Responsable</TableHead>
              <TableHead className="min-w-[80px] h-12 text-foreground font-semibold">Début</TableHead>
              <TableHead className="min-w-[80px] h-12 text-foreground font-semibold">Échéance</TableHead>
              <TableHead className="min-w-[80px] h-12 text-foreground font-semibold">Priorité</TableHead>
              <TableHead className="min-w-[80px] h-12 text-foreground font-semibold">Statut</TableHead>
              <TableHead className="min-w-[80px] h-12 text-foreground font-semibold">Charge (h)</TableHead>
              <TableHead className="min-w-[100px] h-12 text-foreground font-semibold">Progression</TableHead>
              <TableHead className="min-w-[100px] h-12 text-foreground font-semibold">Documents</TableHead>
              <TableHead className="min-w-[100px] h-12 text-foreground font-semibold">Commentaires</TableHead>
              <TableHead className="w-[50px] h-12 text-foreground font-semibold">Actions</TableHead>
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
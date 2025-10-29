import React from 'react';
import { 
  Table, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { type Task } from '@/hooks/optimized';
import { TaskTableBody } from './TaskTableBody';
import { TaskDialogManager } from './TaskDialogManager';

interface TaskFixedColumnsProps {
  tasks: Task[];
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
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
  onUpdateAssignee: (taskId: string, assignee: string) => void;
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
  scrollRef?: React.RefObject<HTMLDivElement>;
  onScroll?: () => void;
}

export const TaskFixedColumns = ({ 
  tasks, 
  onDuplicate, 
  onDelete, 
  onEdit,
  onCreateSubtask, 
  onCreateSubtaskWithActions,
  onUpdateAssignee,
  selectedTaskId,
  onSelectTask,
  scrollRef,
  onScroll
}: TaskFixedColumnsProps) => {
  const dialogManager = TaskDialogManager({ tasks, onCreateSubtask });

  return (
    <>
      <div 
        ref={scrollRef}
        className="h-[600px] overflow-auto"
        onScroll={onScroll}
      >
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-gradient-to-r from-blue-500 to-blue-600 border-b-2 border-slate-300 shadow-md">
            <TableRow className="h-16 hover:bg-transparent border-0">
              <TableHead className="min-w-[200px] h-16 text-white font-bold">Tâche</TableHead>
              <TableHead className="min-w-[150px] h-16 text-white font-bold">Responsable</TableHead>
              <TableHead className="min-w-[80px] h-16 text-white font-bold">Début</TableHead>
              <TableHead className="min-w-[80px] h-16 text-white font-bold">Échéance</TableHead>
              <TableHead className="min-w-[80px] h-16 text-white font-bold">Priorité</TableHead>
              <TableHead className="min-w-[80px] h-16 text-white font-bold">Statut</TableHead>
              <TableHead className="min-w-[80px] h-16 text-white font-bold">Charge (h)</TableHead>
              <TableHead className="min-w-[100px] h-16 text-white font-bold">Progression</TableHead>
              <TableHead className="min-w-[100px] h-16 text-white font-bold">Documents</TableHead>
              <TableHead className="min-w-[100px] h-16 text-white font-bold">Commentaires</TableHead>
              <TableHead className="w-[50px] h-16 text-white font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TaskTableBody
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
            onRowDoubleClick={dialogManager.handleRowDoubleClick}
            onCreateSubtask={onCreateSubtask}
            onCreateSubtaskWithActions={onCreateSubtaskWithActions}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onEdit={onEdit}
            onUpdateAssignee={onUpdateAssignee}
          />
        </Table>
      </div>
      
      {dialogManager.dialogs}
    </>
  );
};
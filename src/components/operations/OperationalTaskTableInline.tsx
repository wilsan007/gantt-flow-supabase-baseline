import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar } from 'lucide-react';
import { OperationalTaskRow } from './OperationalTaskRow';

interface OperationalTask {
  id: string;
  title: string;
  status: string;
  priority?: string;
  category?: string;
  assigned_to?: string | { id: string; full_name: string } | null;
  due_date?: string | null;
  department?: string;
  created_by?: string;
  is_recurring?: boolean;
  [key: string]: any;
}

interface OperationalTaskTableInlineProps {
  tasks: OperationalTask[];
  onUpdateTask?: (taskId: string, updates: Partial<OperationalTask>) => Promise<void> | void;
  onTaskClick?: (task: OperationalTask) => void;
  selectedTaskId?: string;
  compactMode?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'todo', label: 'À faire', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'En cours', color: 'bg-blue-500' },
  { value: 'blocked', label: 'Bloqué', color: 'bg-red-500' },
  { value: 'done', label: 'Terminé', color: 'bg-green-500' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Basse', color: 'bg-gray-400' },
  { value: 'medium', label: 'Moyenne', color: 'bg-yellow-500' },
  { value: 'high', label: 'Haute', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-500' },
];

export const OperationalTaskTableInline: React.FC<OperationalTaskTableInlineProps> = ({
  tasks,
  onUpdateTask,
  onTaskClick,
  selectedTaskId,
  compactMode = false,
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Titre</TableHead>
            <TableHead className="w-[120px]">Statut</TableHead>
            <TableHead className="w-[120px]">Priorité</TableHead>
            <TableHead className="w-[150px]">Catégorie</TableHead>
            {!compactMode && (
              <>
                <TableHead className="w-[150px]">Assigné à</TableHead>
                <TableHead className="w-[120px]">Échéance</TableHead>
                <TableHead className="w-[120px]">Département</TableHead>
              </>
            )}
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={compactMode ? 5 : 8} className="h-24 text-center">
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <Calendar className="h-8 w-8" />
                  <p>Aucune tâche opérationnelle trouvée</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            tasks.map(task => (
              <OperationalTaskRow
                key={task.id}
                task={task}
                onUpdateTask={onUpdateTask}
                onTaskClick={onTaskClick}
                isSelected={selectedTaskId === task.id}
                compactMode={compactMode}
                statusOptions={STATUS_OPTIONS}
                priorityOptions={PRIORITY_OPTIONS}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

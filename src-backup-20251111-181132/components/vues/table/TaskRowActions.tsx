import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Copy, Trash2, Edit } from 'lucide-react';

interface TaskRowActionsProps {
  taskId: string;
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
}

export const TaskRowActions = ({ taskId, onDuplicate, onDelete, onEdit }: TaskRowActionsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onEdit(taskId)}>
        <Edit className="mr-2 h-4 w-4" />
        Modifier
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onDuplicate(taskId)}>
        <Copy className="mr-2 h-4 w-4" />
        Dupliquer
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onDelete(taskId)} className="text-destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Supprimer
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

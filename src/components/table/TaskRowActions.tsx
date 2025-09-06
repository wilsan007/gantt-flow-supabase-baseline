import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Copy, Trash2 } from 'lucide-react';

interface TaskRowActionsProps {
  taskId: string;
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export const TaskRowActions = ({ taskId, onDuplicate, onDelete }: TaskRowActionsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onDuplicate(taskId)}>
        <Copy className="h-4 w-4 mr-2" />
        Dupliquer
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={() => onDelete(taskId)}
        className="text-destructive"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Supprimer
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
/**
 * 👤 Affichage Simple de l'Assigné
 * Inspiré du Kanban - Affiche le nom tel qu'il est stocké
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/icons';

interface SimpleAssigneeDisplayProps {
  assignee: string | { full_name: string } | null | undefined;
  className?: string;
}

export const SimpleAssigneeDisplay = ({ assignee, className = '' }: SimpleAssigneeDisplayProps) => {
  // Normaliser assignee (peut être string, objet, null, undefined)
  const assigneeStr = (() => {
    if (!assignee) return null;
    if (typeof assignee === 'string') return assignee;
    return (assignee as any)?.full_name || null;
  })();

  if (!assigneeStr || assigneeStr === 'Non assigné') {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <User className="h-4 w-4" />
        <span className="text-sm">Non assigné</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar className="h-6 w-6">
        <AvatarImage src="" alt={assigneeStr} />
        <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
          {assigneeStr.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-sm">{assigneeStr}</span>
    </div>
  );
};

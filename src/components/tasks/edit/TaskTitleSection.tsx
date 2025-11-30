import React from 'react';
import { Input } from '@/components/ui/input';
import { Link2 } from '@/lib/icons';

interface TaskTitleSectionProps {
  title: string;
  onTitleChange: (title: string) => void;
  hasParent?: boolean;
}

export const TaskTitleSection: React.FC<TaskTitleSectionProps> = ({
  title,
  onTitleChange,
  hasParent,
}) => {
  return (
    <div className="space-y-2">
      <Input
        value={title}
        onChange={e => onTitleChange(e.target.value)}
        placeholder="Nom de la tâche"
        className="h-auto border-none px-0 text-3xl font-bold shadow-none focus-visible:ring-0"
        autoFocus
      />
      {hasParent && (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Link2 className="h-4 w-4" />
          Sous-tâche
        </p>
      )}
    </div>
  );
};

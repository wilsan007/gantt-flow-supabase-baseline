import React from 'react';
import { Input } from '@/components/ui/input';
import { Link2 } from '@/lib/icons';

interface TaskBasicInfoProps {
  title: string;
  setTitle: (title: string) => void;
  parentTask?: {
    title?: string;
  };
}

export const TaskBasicInfo: React.FC<TaskBasicInfoProps> = ({ title, setTitle, parentTask }) => {
  return (
    <div className="space-y-2">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Nom de la tâche"
        className="h-auto border-none px-0 text-3xl font-bold shadow-none focus-visible:ring-0"
        autoFocus
      />
      {parentTask?.title && (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Link2 className="h-4 w-4" />
          Sous-tâche de: {parentTask.title}
        </p>
      )}
    </div>
  );
};

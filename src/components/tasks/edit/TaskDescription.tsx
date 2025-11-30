import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from '@/lib/icons';

interface TaskDescriptionProps {
  description: string;
  onDescriptionChange: (description: string) => void;
}

export const TaskDescription: React.FC<TaskDescriptionProps> = ({
  description,
  onDescriptionChange,
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground flex items-center gap-2 text-sm">
        <FileText className="h-4 w-4" />
        Description
      </Label>
      <Textarea
        value={description}
        onChange={e => onDescriptionChange(e.target.value)}
        placeholder="Ajouter une description..."
        className="min-h-[120px] resize-none"
      />
    </div>
  );
};

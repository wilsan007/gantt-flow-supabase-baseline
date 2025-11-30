import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, X } from '@/lib/icons';

interface TaskDescriptionProps {
  description: string;
  setDescription: (desc: string) => void;
  showDescription: boolean;
  setShowDescription: (show: boolean) => void;
}

export const TaskDescription: React.FC<TaskDescriptionProps> = ({
  description,
  setDescription,
  showDescription,
  setShowDescription,
}) => {
  return (
    <div className="space-y-2">
      {!showDescription ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDescription(true)}
          className="text-muted-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une description
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              Description
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowDescription(false);
                setDescription('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Décrivez la tâche..."
            className="min-h-[100px]"
          />
        </div>
      )}
    </div>
  );
};

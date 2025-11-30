import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, Plus, Trash2, Target } from '@/lib/icons';
import { Separator } from '@/components/ui/separator';

interface TaskAction {
  id: string;
  name: string;
  description?: string;
  status?: string;
  progress?: number;
}

interface TaskActionsSubtasksProps {
  actions: TaskAction[];
  onActionsChange: (actions: TaskAction[]) => void;
  showActions: boolean;
  onToggleActions: () => void;
  showSubtasks: boolean;
  onToggleSubtasks: () => void;
}

export const TaskActionsSubtasks: React.FC<TaskActionsSubtasksProps> = ({
  actions,
  onActionsChange,
  showActions,
  onToggleActions,
  showSubtasks,
  onToggleSubtasks,
}) => {
  const handleDeleteAction = (actionId: string) => {
    onActionsChange(actions.filter(a => a.id !== actionId));
  };

  return (
    <>
      <Separator />

      {/* Actions */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={onToggleActions}
          type="button"
        >
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Actions et sous-tâches
          </span>
          {showActions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {showActions && (
          <div className="space-y-3">
            {actions.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Actions ({actions.length})</p>
                {actions.map(action => (
                  <div
                    key={action.id}
                    className="bg-muted flex items-center justify-between rounded-lg p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="font-medium">{action.name}</span>
                        {action.progress !== undefined && (
                          <Badge variant="secondary" className="ml-auto">
                            {action.progress}%
                          </Badge>
                        )}
                      </div>
                      {action.progress !== undefined && (
                        <Progress value={action.progress} className="mt-2 h-1" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAction(action.id)}
                      className="text-destructive hover:text-destructive ml-2"
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button variant="outline" className="w-full" type="button">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une action
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

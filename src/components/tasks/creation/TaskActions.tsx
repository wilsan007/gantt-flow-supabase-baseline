import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Target, Plus, X, Trash2 } from '@/lib/icons';

interface TaskAction {
  id: string;
  name: string;
  description?: string;
}

interface TaskActionsProps {
  actions: TaskAction[];
  setActions: (actions: TaskAction[]) => void;
  newActionName: string;
  setNewActionName: (name: string) => void;
  newActionDescription: string;
  setNewActionDescription: (desc: string) => void;
  addAction: () => void;
  removeAction: (id: string) => void;
  showActions: boolean;
  setShowActions: (show: boolean) => void;
}

export const TaskActions: React.FC<TaskActionsProps> = ({
  actions,
  setActions,
  newActionName,
  setNewActionName,
  newActionDescription,
  setNewActionDescription,
  addAction,
  removeAction,
  showActions,
  setShowActions,
}) => {
  return (
    <div className="space-y-2">
      {!showActions ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowActions(true)}
          className="text-muted-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter des actions
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4" />
              Actions de la tâche
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowActions(false);
                setActions([]);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Liste des actions */}
          {actions.length > 0 && (
            <div className="space-y-2">
              {actions.map(action => (
                <div
                  key={action.id}
                  className="bg-muted/30 flex items-start gap-2 rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{action.name}</p>
                    {action.description && (
                      <p className="text-muted-foreground mt-1 text-xs">{action.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAction(action.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire d'ajout d'action */}
          <div className="bg-muted/10 space-y-2 rounded-lg border p-3">
            <Input
              value={newActionName}
              onChange={e => setNewActionName(e.target.value)}
              placeholder="Nom de l'action"
              className="font-medium"
            />
            <Textarea
              value={newActionDescription}
              onChange={e => setNewActionDescription(e.target.value)}
              placeholder="Description (optionnel)"
              className="min-h-[60px] text-sm"
            />
            <Button
              size="sm"
              onClick={addAction}
              disabled={!newActionName.trim()}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter l'action
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

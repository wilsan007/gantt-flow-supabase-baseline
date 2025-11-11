/**
 * Composant: ActionTemplateList
 * Liste drag & drop des templates d'actions
 * Pattern: Notion/Linear checklist
 */

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, X, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface ActionTemplate {
  id?: string;
  title: string;
  description: string;
  position: number;
}

interface ActionTemplateListProps {
  templates: ActionTemplate[];
  onChange: (templates: ActionTemplate[]) => void;
  readonly?: boolean;
}

export const ActionTemplateList: React.FC<ActionTemplateListProps> = ({
  templates,
  onChange,
  readonly = false,
}) => {
  const handleAdd = () => {
    const newTemplate: ActionTemplate = {
      title: '',
      description: '',
      position: templates.length,
    };
    onChange([...templates, newTemplate]);
  };

  const handleRemove = (index: number) => {
    const updated = templates.filter((_, i) => i !== index);
    // Réorganiser les positions
    const reindexed = updated.map((t, i) => ({ ...t, position: i }));
    onChange(reindexed);
  };

  const handleChange = (index: number, field: keyof ActionTemplate, value: string) => {
    const updated = [...templates];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(templates);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Réorganiser les positions
    const reindexed = items.map((item, index) => ({
      ...item,
      position: index,
    }));

    onChange(reindexed);
  };

  if (readonly && templates.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <CheckSquare className="mx-auto mb-2 h-12 w-12 opacity-50" />
        <p>Aucune action définie pour cette activité</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-muted-foreground" />
          <Label className="text-base font-semibold">Actions templates ({templates.length})</Label>
        </div>
        {!readonly && (
          <Button onClick={handleAdd} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une action
          </Button>
        )}
      </div>

      {/* Info */}
      {!readonly && templates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Les actions seront automatiquement clonées sur chaque tâche générée
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Vous pouvez les réorganiser par glisser-déposer
            </p>
          </CardContent>
        </Card>
      )}

      {/* Liste Drag & Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="actions-list">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-2 ${snapshot.isDraggingOver ? 'rounded-lg bg-muted/50 p-2' : ''}`}
            >
              {templates.map((template, index) => (
                <Draggable
                  key={`action-${index}`}
                  draggableId={`action-${index}`}
                  index={index}
                  isDragDisabled={readonly}
                >
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`transition-shadow ${
                        snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          {/* Drag Handle */}
                          {!readonly && (
                            <div
                              {...provided.dragHandleProps}
                              className="flex cursor-grab items-start pt-2 active:cursor-grabbing"
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}

                          {/* Position Badge */}
                          <div className="flex items-start pt-2">
                            <Badge variant="secondary" className="text-xs">
                              {index + 1}
                            </Badge>
                          </div>

                          {/* Content */}
                          <div className="flex-1 space-y-3">
                            {readonly ? (
                              <>
                                <div>
                                  <h4 className="font-medium">
                                    {template.title || '(Sans titre)'}
                                  </h4>
                                  {template.description && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {template.description}
                                    </p>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <Input
                                  value={template.title}
                                  onChange={e => handleChange(index, 'title', e.target.value)}
                                  placeholder="Titre de l'action *"
                                  className={
                                    template.title.trim() === '' ? 'border-destructive' : ''
                                  }
                                />
                                <Textarea
                                  value={template.description}
                                  onChange={e => handleChange(index, 'description', e.target.value)}
                                  placeholder="Description détaillée (optionnel)"
                                  rows={2}
                                />
                              </>
                            )}
                          </div>

                          {/* Remove Button */}
                          {!readonly && (
                            <Button
                              onClick={() => handleRemove(index)}
                              size="sm"
                              variant="ghost"
                              className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Validation */}
      {!readonly && templates.some(t => t.title.trim() === '') && (
        <p className="text-sm text-destructive">⚠️ Certaines actions n'ont pas de titre</p>
      )}
    </div>
  );
};

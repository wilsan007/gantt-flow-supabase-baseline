/**
 * Composant: ActionTemplateListEnhanced
 * Liste drag & drop des templates d'actions avec assignation et timeline
 * Pattern: Monday.com/Asana - Gestion avancée des actions
 */

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  CheckSquare,
  User,
  Calendar,
  Clock,
  UserCheck,
  ChevronRight,
  Paperclip,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ActionTemplateForm, ActionTemplateData } from './ActionTemplateForm';
import { OperationalActionTemplate } from '@/hooks/useOperationalActionTemplates';
import { ActionAttachmentUpload } from './ActionAttachmentUpload';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ActionTemplateListEnhancedProps {
  templates: OperationalActionTemplate[];
  onAdd: (data: ActionTemplateData) => Promise<void>;
  onUpdate: (id: string, data: Partial<ActionTemplateData>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (templates: OperationalActionTemplate[]) => Promise<void>;
  mainTaskAssignee?: {
    id: string;
    name: string;
  };
  mainTaskDate?: Date;
  activityKind?: 'recurring' | 'one_off';
  rrule?: string | null; // Règle de récurrence (RRULE)
  readonly?: boolean;
  loading?: boolean;
}

export const ActionTemplateListEnhanced: React.FC<ActionTemplateListEnhancedProps> = ({
  templates,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  mainTaskAssignee,
  mainTaskDate = new Date(),
  activityKind = 'recurring',
  rrule = null,
  readonly = false,
  loading = false,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OperationalActionTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedTemplateForUpload, setSelectedTemplateForUpload] =
    useState<OperationalActionTemplate | null>(null);
  const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({});
  const { currentTenant } = useTenant();

  // Charger les compteurs de fichiers pour chaque template
  React.useEffect(() => {
    const loadAttachmentCounts = async () => {
      if (!currentTenant) return;

      const counts: Record<string, number> = {};

      for (const template of templates) {
        try {
          const { count, error } = await supabase
            .from('operational_action_attachments')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', currentTenant.id)
            .eq('action_template_id', template.id);

          if (!error && count !== null) {
            counts[template.id] = count;
          }
        } catch (err) {
          console.error(`Erreur chargement compteur pour ${template.id}:`, err);
        }
      }

      setAttachmentCounts(counts);
    };

    if (templates.length > 0 && !readonly && currentTenant) {
      loadAttachmentCounts();
    }
  }, [templates, readonly, currentTenant]);

  const handleAdd = () => {
    setEditingTemplate(null);
    setFormOpen(true);
  };

  const handleEdit = (template: OperationalActionTemplate) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: ActionTemplateData) => {
    if (editingTemplate) {
      await onUpdate(editingTemplate.id, data);
    } else {
      await onAdd(data);
    }
    setFormOpen(false);
    setEditingTemplate(null);
  };

  const handleDeleteClick = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (templateToDelete) {
      await onDelete(templateToDelete);
      setTemplateToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || readonly) return;

    const items = Array.from(templates);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Réorganiser les positions
    const reindexed = items.map((item, index) => ({
      ...item,
      position: index,
    }));

    onReorder(reindexed);
  };

  const handleAttachmentClick = (template: OperationalActionTemplate) => {
    setSelectedTemplateForUpload(template);
    setUploadDialogOpen(true);
  };

  const handleUploadSuccess = () => {
    // Rafraîchir les compteurs
    if (selectedTemplateForUpload) {
      const newCount = (attachmentCounts[selectedTemplateForUpload.id] || 0) + 1;
      setAttachmentCounts(prev => ({
        ...prev,
        [selectedTemplateForUpload.id]: newCount,
      }));
    }
  };

  const getOffsetLabel = (offset: number) => {
    if (offset === 0) return 'Même jour';
    if (offset > 0) return `J+${offset}`;
    return `J${offset}`;
  };

  const getOffsetBadgeVariant = (offset: number): 'default' | 'secondary' | 'outline' => {
    if (offset < 0) return 'default';
    if (offset === 0) return 'secondary';
    return 'outline';
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
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-semibold">Actions ({templates.length})</h3>
          </div>
          {!readonly && (
            <Button onClick={handleAdd} size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          )}
        </div>

        {/* Info */}
        {!readonly && templates.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Créez des actions qui seront automatiquement clonées pour chaque tâche
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Assignez des personnes et définissez leur position temporelle
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
                    key={template.id}
                    draggableId={template.id}
                    index={index}
                    isDragDisabled={readonly || loading}
                  >
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all ${
                          snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            {/* Drag Handle */}
                            {!readonly && (
                              <div
                                {...provided.dragHandleProps}
                                className="flex cursor-grab items-center active:cursor-grabbing"
                              >
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}

                            {/* Position Badge + Bouton Fichiers */}
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                #{index + 1}
                              </Badge>

                              {/* Bouton + pour ajouter des fichiers */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      onClick={() => handleAttachmentClick(template)}
                                      size="sm"
                                      variant="ghost"
                                      className="relative h-6 w-6 p-0 hover:bg-primary/10"
                                    >
                                      <Paperclip className="h-3.5 w-3.5" />
                                      <Plus className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 text-green-600" />

                                      {/* Compteur de fichiers */}
                                      {attachmentCounts[template.id] > 0 && (
                                        <Badge
                                          variant="destructive"
                                          className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center p-0 text-[9px]"
                                        >
                                          {attachmentCounts[template.id]}
                                        </Badge>
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">
                                      {attachmentCounts[template.id] > 0
                                        ? `${attachmentCounts[template.id]} fichier(s) • Cliquez pour ajouter`
                                        : 'Ajouter des preuves de réalisation'}
                                    </p>
                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                      ⚠️ Requis pour validation
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-2">
                              {/* Titre */}
                              <h4 className="font-medium">{template.title}</h4>

                              {/* Description */}
                              {template.description && (
                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                  {template.description}
                                </p>
                              )}

                              {/* Métadonnées */}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                {/* Assignation */}
                                <div className="flex items-center gap-1.5">
                                  {template.inherit_assignee ? (
                                    <>
                                      <UserCheck className="h-3.5 w-3.5" />
                                      <span>Hérite de la tâche</span>
                                    </>
                                  ) : template.assigned_name ? (
                                    <>
                                      <User className="h-3.5 w-3.5" />
                                      <span>{template.assigned_name}</span>
                                    </>
                                  ) : (
                                    <>
                                      <User className="h-3.5 w-3.5" />
                                      <span className="text-orange-500">Non assigné</span>
                                    </>
                                  )}
                                </div>

                                {/* Timeline */}
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <Badge
                                    variant={getOffsetBadgeVariant(template.offset_days)}
                                    className="px-1.5 py-0 text-[10px]"
                                  >
                                    {getOffsetLabel(template.offset_days)}
                                  </Badge>
                                </div>

                                {/* Durée */}
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{template.estimated_hours}h</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            {!readonly && (
                              <div className="flex items-center gap-1">
                                <Button
                                  onClick={() => handleEdit(template)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  disabled={loading}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteClick(template.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                  disabled={loading}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
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
      </div>

      {/* Formulaire Action */}
      <ActionTemplateForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        initialData={editingTemplate || undefined}
        mainTaskAssignee={mainTaskAssignee}
        mainTaskDate={mainTaskDate}
        activityKind={activityKind}
        rrule={rrule}
      />

      {/* Dialog Suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette action ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action sera supprimée du template. Les actions déjà créées sur les tâches
              existantes ne seront pas affectées.
              <br />
              <br />
              ⚠️ Tous les fichiers attachés à cette action seront également supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Upload Fichiers */}
      {selectedTemplateForUpload && (
        <ActionAttachmentUpload
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          actionTemplateId={selectedTemplateForUpload.id}
          actionTitle={selectedTemplateForUpload.title}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </>
  );
};

export default ActionTemplateListEnhanced;

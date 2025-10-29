/**
 * Composant: ActivityDetailDialog
 * Dialog complet pour voir/éditer les détails d'une activité
 * Pattern: Linear/Notion detail view
 */

import React, { useState, useEffect } from 'react';
import { X, Edit, Save, Calendar, CheckSquare, BarChart3, List } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScheduleForm } from './ScheduleForm';
import { ActionTemplateListEnhanced } from './ActionTemplateListEnhanced';
import { OccurrencesList } from './OccurrencesList';
import { ActivityStatisticsCard } from './ActivityStatisticsCard';
import { useOperationalActivities } from '@/hooks/useOperationalActivities';
import { useOperationalSchedules } from '@/hooks/useOperationalSchedules';
import { useOperationalActionTemplates } from '@/hooks/useOperationalActionTemplates';
import type { OperationalActivity } from '@/hooks/useOperationalActivities';
import type { OperationalSchedule } from '@/hooks/useOperationalSchedules';

interface ActivityDetailDialogProps {
  activityId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ActivityDetailDialog: React.FC<ActivityDetailDialogProps> = ({
  activityId,
  open,
  onOpenChange,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [activity, setActivity] = useState<OperationalActivity | null>(null);
  const [schedule, setSchedule] = useState<OperationalSchedule | null>(null);
  const [localActivity, setLocalActivity] = useState<Partial<OperationalActivity>>({});
  const [localSchedule, setLocalSchedule] = useState<Partial<OperationalSchedule>>({});

  const { activities, updateActivity } = useOperationalActivities({ autoFetch: false });
  const { getSchedule, upsertSchedule } = useOperationalSchedules();
  const { 
    templates, 
    fetchTemplates, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate 
  } = useOperationalActionTemplates();

  // Charger les données
  useEffect(() => {
    if (open && activityId) {
      loadData();
    }
  }, [open, activityId]);

  const loadData = async () => {
    try {
      // Charger l'activité (depuis le cache si disponible)
      const foundActivity = activities.find(a => a.id === activityId);
      if (foundActivity) {
        setActivity(foundActivity);
        setLocalActivity(foundActivity);
      }

      // Charger la planification
      if (foundActivity?.kind === 'recurring') {
        const scheduleData = await getSchedule(activityId);
        setSchedule(scheduleData);
        setLocalSchedule(scheduleData || {});
      }

      // Charger les templates
      await fetchTemplates(activityId);
    } catch (error) {
      console.error('Erreur loadData:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Sauvegarder l'activité
      await updateActivity(activityId, localActivity);

      // Sauvegarder la planification si récurrente
      if (activity?.kind === 'recurring' && localSchedule) {
        await upsertSchedule({
          ...localSchedule,
          activity_id: activityId,
        });
      }

      setEditMode(false);
      loadData(); // Recharger
    } catch (error) {
      console.error('Erreur handleSave:', error);
    }
  };

  const handleCancel = () => {
    setLocalActivity(activity || {});
    setLocalSchedule(schedule || {});
    setEditMode(false);
  };

  if (!activity) {
    return null;
  }

  const scopeLabels: Record<string, string> = {
    org: 'Organisation',
    department: 'Département',
    team: 'Équipe',
    person: 'Personne',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editMode ? (
                <Input
                  value={localActivity.name || ''}
                  onChange={(e) => setLocalActivity({ ...localActivity, name: e.target.value })}
                  className="text-2xl font-bold"
                />
              ) : (
                <DialogTitle className="text-2xl">{activity.name}</DialogTitle>
              )}
              <div className="flex gap-2 mt-2">
                <Badge variant={activity.is_active ? 'default' : 'secondary'}>
                  {activity.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">
                  {activity.kind === 'recurring' ? 'Récurrente' : 'Ponctuelle'}
                </Badge>
                <Badge variant="secondary">{scopeLabels[activity.scope]}</Badge>
              </div>
            </div>
            {editMode ? (
              <div className="flex gap-2">
                <Button onClick={handleCancel} variant="outline" size="sm">
                  Annuler
                </Button>
                <Button onClick={handleSave} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            ) : (
              <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">
              <List className="h-4 w-4 mr-2" />
              Infos
            </TabsTrigger>
            <TabsTrigger value="schedule" disabled={activity.kind === 'one_off'}>
              <Calendar className="h-4 w-4 mr-2" />
              Planning
            </TabsTrigger>
            <TabsTrigger value="actions">
              <CheckSquare className="h-4 w-4 mr-2" />
              Actions
            </TabsTrigger>
            <TabsTrigger value="occurrences">
              <List className="h-4 w-4 mr-2" />
              Occurrences
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="h-4 w-4 mr-2" />
              Stats
            </TabsTrigger>
          </TabsList>

          {/* Onglet: Informations */}
          <TabsContent value="info" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Description</Label>
                {editMode ? (
                  <Textarea
                    value={localActivity.description || ''}
                    onChange={(e) => setLocalActivity({ ...localActivity, description: e.target.value })}
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {activity.description || 'Aucune description'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Template du titre</Label>
                {editMode ? (
                  <Input
                    value={localActivity.task_title_template || ''}
                    onChange={(e) => setLocalActivity({ ...localActivity, task_title_template: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {activity.task_title_template || 'Aucun template'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">
                    {activity.kind === 'recurring' ? 'Récurrente' : 'Ponctuelle'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Portée</Label>
                  <p className="font-medium">{scopeLabels[activity.scope]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Créée le</Label>
                  <p className="font-medium">
                    {new Date(activity.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Modifiée le</Label>
                  <p className="font-medium">
                    {new Date(activity.updated_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Onglet: Planification */}
          <TabsContent value="schedule" className="space-y-4">
            {activity.kind === 'recurring' ? (
              editMode ? (
                <ScheduleForm
                  value={localSchedule}
                  onChange={setLocalSchedule}
                  activityId={activityId}
                />
              ) : schedule ? (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <Label>Règle RRULE</Label>
                    <code className="text-sm block mt-2">{schedule.rrule || 'Aucune'}</code>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Date de début</Label>
                      <p className="font-medium">
                        {new Date(schedule.start_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Date de fin</Label>
                      <p className="font-medium">
                        {schedule.until ? new Date(schedule.until).toLocaleDateString('fr-FR') : 'Aucune'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Aucune planification configurée</p>
              )
            ) : (
              <p className="text-muted-foreground">Non applicable pour les activités ponctuelles</p>
            )}
          </TabsContent>

          {/* Onglet: Actions Templates */}
          <TabsContent value="actions">
            <ActionTemplateListEnhanced
              templates={templates}
              onAdd={async (data) => {
                await createTemplate({
                  activity_id: activityId,
                  ...data,
                });
                await fetchTemplates(activityId);
              }}
              onUpdate={async (id, data) => {
                await updateTemplate(id, data);
                await fetchTemplates(activityId);
              }}
              onDelete={async (id) => {
                await deleteTemplate(id, activityId);
              }}
              onReorder={async (reordered) => {
                // Mettre à jour les positions
                for (const template of reordered) {
                  await updateTemplate(template.id, { position: template.position });
                }
                await fetchTemplates(activityId);
              }}
              mainTaskAssignee={
                activity.owner_name && activity.owner_employee_id
                  ? { id: activity.owner_employee_id, name: activity.owner_name }
                  : undefined
              }
              mainTaskDate={activity.one_off_date ? new Date(activity.one_off_date) : new Date()}
              activityKind={activity.kind}
              rrule={schedule?.rrule || null}
              readonly={!editMode}
            />
          </TabsContent>

          {/* Onglet: Occurrences */}
          <TabsContent value="occurrences">
            <OccurrencesList activityId={activityId} activityName={activity.name} />
          </TabsContent>

          {/* Onglet: Statistiques */}
          <TabsContent value="stats">
            <ActivityStatisticsCard activityId={activityId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

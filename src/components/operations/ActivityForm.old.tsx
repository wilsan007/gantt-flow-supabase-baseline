/**
 * Composant: ActivityForm
 * Formulaire de création/édition d'activité opérationnelle
 * 3 onglets: Informations, Planification, Actions
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, GripVertical, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { OperationalActivity } from '@/hooks/useOperationalActivities';
import type { OperationalSchedule } from '@/hooks/useOperationalSchedules';
import type { OperationalActionTemplate } from '@/hooks/useOperationalActionTemplates';

interface ActivityFormProps {
  activity?: OperationalActivity;
  kind: 'recurring' | 'one_off';
  onSave: (data: ActivityFormData) => void;
  onCancel: () => void;
}

export interface ActivityFormData {
  // Informations
  name: string;
  description: string;
  kind: 'recurring' | 'one_off';
  scope: 'org' | 'department' | 'team' | 'person';
  owner_id: string | null;
  project_id: string | null;
  task_title_template: string;
  is_active: boolean;

  // Planification (si recurring)
  schedule?: Partial<OperationalSchedule>;

  // Actions templates
  action_templates: Array<{
    title: string;
    description: string;
    position: number;
  }>;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({ activity, kind, onSave, onCancel }) => {
  // États du formulaire
  const [formData, setFormData] = useState<ActivityFormData>({
    name: activity?.name || '',
    description: activity?.description || '',
    kind: activity?.kind || kind,
    scope: activity?.scope || 'org',
    owner_id: activity?.owner_id || null,
    project_id: activity?.project_id || null,
    task_title_template: activity?.task_title_template || '{{name}} - {{date}}',
    is_active: activity?.is_active ?? true,
    action_templates: [],
  });

  // État pour la planification (onglet 2)
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [weekDays, setWeekDays] = useState<string[]>(['MO']);
  const [monthDays, setMonthDays] = useState<string>('1');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // État pour les actions (onglet 3)
  const [actionTemplates, setActionTemplates] = useState<
    Array<{ title: string; description: string; position: number }>
  >([{ title: '', description: '', position: 0 }]);

  // Générer RRULE selon le type
  const generateRRule = (): string | null => {
    if (kind === 'one_off') return null;

    switch (scheduleType) {
      case 'daily':
        return 'FREQ=DAILY';
      case 'weekly':
        return `FREQ=WEEKLY;BYDAY=${weekDays.join(',')}`;
      case 'monthly':
        return `FREQ=MONTHLY;BYMONTHDAY=${monthDays}`;
      default:
        return null;
    }
  };

  // Handler submit
  const handleSubmit = () => {
    const dataToSave: ActivityFormData = {
      ...formData,
      action_templates: actionTemplates.filter(a => a.title.trim() !== ''),
    };

    // Ajouter la planification si récurrent
    if (kind === 'recurring' && startDate) {
      dataToSave.schedule = {
        rrule: generateRRule(),
        start_date: format(startDate, 'yyyy-MM-dd'),
        until: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        timezone: 'Africa/Djibouti',
        generate_window_days: 30,
      };
    }

    onSave(dataToSave);
  };

  // Handler ajout action
  const handleAddAction = () => {
    setActionTemplates([
      ...actionTemplates,
      { title: '', description: '', position: actionTemplates.length },
    ]);
  };

  // Handler suppression action
  const handleRemoveAction = (index: number) => {
    setActionTemplates(actionTemplates.filter((_, i) => i !== index));
  };

  // Handler modification action
  const handleActionChange = (index: number, field: 'title' | 'description', value: string) => {
    const updated = [...actionTemplates];
    updated[index][field] = value;
    setActionTemplates(updated);
  };

  const weekDayOptions = [
    { value: 'MO', label: 'Lundi' },
    { value: 'TU', label: 'Mardi' },
    { value: 'WE', label: 'Mercredi' },
    { value: 'TH', label: 'Jeudi' },
    { value: 'FR', label: 'Vendredi' },
    { value: 'SA', label: 'Samedi' },
    { value: 'SU', label: 'Dimanche' },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="schedule" disabled={kind === 'one_off'}>
            Planification
          </TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Onglet 1 : Informations */}
        <TabsContent value="info" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'activité *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Réunion d'équipe hebdomadaire"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez l'objectif de cette activité..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Portée</Label>
              <Select
                value={formData.scope}
                onValueChange={(value: any) => setFormData({ ...formData, scope: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org">Organisation</SelectItem>
                  <SelectItem value="department">Département</SelectItem>
                  <SelectItem value="team">Équipe</SelectItem>
                  <SelectItem value="person">Personne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.kind} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recurring">Récurrente</SelectItem>
                  <SelectItem value="one_off">Ponctuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Template du titre des tâches</Label>
            <Input
              id="template"
              value={formData.task_title_template}
              onChange={e => setFormData({ ...formData, task_title_template: e.target.value })}
              placeholder="Ex: Réunion - Semaine {{isoWeek}}"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData({ ...formData, task_title_template: '{{name}} - {{date}}' })
                }
                className="text-xs"
              >
                📅 Nom + Date
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData({
                    ...formData,
                    task_title_template: '{{name}} - Semaine {{isoWeek}}',
                  })
                }
                className="text-xs"
              >
                📆 Nom + Semaine
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData({ ...formData, task_title_template: '{{name}} - {{month}}/{{year}}' })
                }
                className="text-xs"
              >
                📊 Nom + Mois
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData({ ...formData, task_title_template: '{{name}} du {{date}}' })
                }
                className="text-xs"
              >
                📝 Format Simple
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Onglet 2 : Planification */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="space-y-2">
            <Label>Fréquence</Label>
            <Select value={scheduleType} onValueChange={(value: any) => setScheduleType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configuration Hebdomadaire */}
          {scheduleType === 'weekly' && (
            <div className="space-y-2">
              <Label>Jours de la semaine</Label>
              <div className="grid grid-cols-2 gap-3">
                {weekDayOptions.map(day => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.value}
                      checked={weekDays.includes(day.value)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setWeekDays([...weekDays, day.value]);
                        } else {
                          setWeekDays(weekDays.filter(d => d !== day.value));
                        }
                      }}
                    />
                    <Label htmlFor={day.value} className="cursor-pointer">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuration Mensuelle */}
          {scheduleType === 'monthly' && (
            <div className="space-y-2">
              <Label htmlFor="monthDays">Jours du mois (séparés par des virgules)</Label>
              <Input
                id="monthDays"
                value={monthDays}
                onChange={e => setMonthDays(e.target.value)}
                placeholder="Ex: 1,15 (1er et 15 du mois)"
              />
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PP', { locale: fr }) : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date de fin (optionnel)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PP', { locale: fr }) : 'Aucune'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Aperçu RRULE */}
          <div className="rounded-lg bg-muted p-3">
            <p className="mb-1 text-sm font-medium">Règle générée (RRULE):</p>
            <code className="text-xs">{generateRRule() || 'Aucune'}</code>
          </div>
        </TabsContent>

        {/* Onglet 3 : Actions */}
        <TabsContent value="actions" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Liste des actions (checklist)</Label>
            <Button onClick={handleAddAction} size="sm" variant="outline">
              <Plus className="mr-1 h-4 w-4" />
              Ajouter
            </Button>
          </div>

          <div className="space-y-3">
            {actionTemplates.map((action, index) => (
              <div key={index} className="flex gap-2 rounded-lg border bg-card p-3">
                <GripVertical className="mt-1 h-5 w-5 flex-shrink-0 cursor-move text-muted-foreground" />
                <div className="flex-1 space-y-2">
                  <Input
                    value={action.title}
                    onChange={e => handleActionChange(index, 'title', e.target.value)}
                    placeholder="Titre de l'action"
                  />
                  <Textarea
                    value={action.description}
                    onChange={e => handleActionChange(index, 'description', e.target.value)}
                    placeholder="Description (optionnel)"
                    rows={2}
                  />
                </div>
                <Button
                  onClick={() => handleRemoveAction(index)}
                  size="sm"
                  variant="ghost"
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {actionTemplates.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <p>Aucune action définie</p>
              <p className="mt-1 text-sm">
                Les actions seront clonées automatiquement sur chaque tâche générée
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Boutons d'action */}
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
          {activity ? 'Mettre à jour' : "Créer l'activité"}
        </Button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Plus, Trash2, Target, Link, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { type Task } from '@/hooks/optimized';

interface ActionData {
  id: string;
  title: string;
  weight_percentage: number;
  due_date?: string;
  notes?: string;
}

interface SubtaskCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentTask: Task;
  onCreateSubtask: (
    parentId: string,
    linkedActionId?: string,
    customData?: {
      title: string;
      start_date: string;
      due_date: string;
      effort_estimate_h: number;
    }
  ) => void;
  onCreateSubtaskWithActions?: (
    parentId: string,
    customData: {
      title: string;
      start_date: string;
      due_date: string;
      effort_estimate_h: number;
    },
    actions: ActionData[]
  ) => void;
  linkedActionId?: string;
}

export const SubtaskCreationDialog = ({
  open,
  onOpenChange,
  parentTask,
  onCreateSubtask,
  onCreateSubtaskWithActions,
  linkedActionId,
}: SubtaskCreationDialogProps) => {
  const [title, setTitle] = useState(`Sous-tâche de ${parentTask.title}`);
  const [startDate, setStartDate] = useState<Date>(new Date(parentTask.start_date));
  const [dueDate, setDueDate] = useState<Date>(new Date(parentTask.due_date));
  const [effort, setEffort] = useState(1);
  const [assignee, setAssignee] = useState(
    parentTask.assignee && parentTask.assignee !== 'Non assigné'
      ? parentTask.assignee
      : 'Ahmed Waleh' // Valeur par défaut si parent non assigné
  );
  const [selectedActionId, setSelectedActionId] = useState<string>('none');

  // État pour les actions
  const [actions, setActions] = useState<ActionData[]>([]);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionWeight, setNewActionWeight] = useState([25]);
  const [newActionDueDate, setNewActionDueDate] = useState<Date>();
  const [newActionNotes, setNewActionNotes] = useState('');

  // Liste des responsables possibles (assignation obligatoire pour les sous-tâches)
  const availableAssignees = [
    'Ahmed Waleh',
    'Sarah Martin',
    'Jean Dupont',
    'Marie Dubois',
    'Pierre Moreau',
  ];

  // Fonctions pour gérer les actions
  const addAction = () => {
    if (!newActionTitle.trim()) return;

    const newAction: ActionData = {
      id: `temp-${Date.now()}`, // ID temporaire
      title: newActionTitle.trim(),
      weight_percentage: newActionWeight[0], // Sera recalculé automatiquement
      due_date: newActionDueDate?.toISOString(),
      notes: newActionNotes.trim() || undefined,
    };

    const updatedActions = [...actions, newAction];

    // Redistribution automatique des poids pour atteindre 100%
    const equalWeight = Math.floor(100 / updatedActions.length);
    const remainder = 100 - equalWeight * updatedActions.length;

    const redistributedActions = updatedActions.map((action, index) => ({
      ...action,
      weight_percentage: index === 0 ? equalWeight + remainder : equalWeight,
    }));

    setActions(redistributedActions);

    // Reset form
    setNewActionTitle('');
    setNewActionWeight([25]);
    setNewActionDueDate(undefined);
    setNewActionNotes('');
  };

  const removeAction = (actionId: string) => {
    const updatedActions = actions.filter(action => action.id !== actionId);

    // Redistribution automatique des poids après suppression
    if (updatedActions.length > 0) {
      const equalWeight = Math.floor(100 / updatedActions.length);
      const remainder = 100 - equalWeight * updatedActions.length;

      const redistributedActions = updatedActions.map((action, index) => ({
        ...action,
        weight_percentage: index === 0 ? equalWeight + remainder : equalWeight,
      }));

      setActions(redistributedActions);
    } else {
      setActions([]);
    }
  };

  const redistributeWeights = () => {
    if (actions.length === 0) return;

    const equalWeight = Math.floor(100 / actions.length);
    const remainder = 100 - equalWeight * actions.length;

    const updatedActions = actions.map((action, index) => ({
      ...action,
      weight_percentage: index === 0 ? equalWeight + remainder : equalWeight,
    }));

    setActions(updatedActions);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (!assignee || assignee === 'Non assigné') {
      alert('Un responsable doit être assigné à la sous-tâche');
      return;
    }

    // Validation des pourcentages d'actions si des actions sont définies
    if (actions.length > 0) {
      const totalWeight = actions.reduce((sum, action) => sum + action.weight_percentage, 0);
      if (totalWeight !== 100) {
        alert(
          `La somme des pourcentages des actions doit être égale à 100% (actuellement: ${totalWeight}%)`
        );
        return;
      }
    }

    const subtaskData = {
      title: title.trim(),
      start_date: startDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      effort_estimate_h: effort,
      assignee: assignee,
    };

    // Si on a des actions et la fonction callback existe, on l'utilise
    if (actions.length > 0 && onCreateSubtaskWithActions) {
      onCreateSubtaskWithActions(parentTask.id, subtaskData, actions);
    } else {
      // Sinon, création normale avec l'action liée si sélectionnée
      const linkedAction =
        selectedActionId && selectedActionId !== 'none' ? selectedActionId : undefined;
      onCreateSubtask(parentTask.id, linkedAction, subtaskData);
    }

    handleCancel();
  };

  const handleCancel = () => {
    // Reset form to defaults
    setTitle(`Sous-tâche de ${parentTask.title}`);
    setStartDate(new Date(parentTask.start_date));
    setDueDate(new Date(parentTask.due_date));
    setEffort(1);
    setAssignee(parentTask.assignee || '');
    setSelectedActionId('none');

    // Reset actions
    setActions([]);
    setNewActionTitle('');
    setNewActionWeight([25]);
    setNewActionDueDate(undefined);
    setNewActionNotes('');

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Créer une Sous-tâche
            {linkedActionId && (
              <span className="mt-1 block text-sm text-muted-foreground">
                Liée à une action spécifique
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Titre */}
          <div className="grid gap-2">
            <Label htmlFor="title">Titre de la sous-tâche *</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nom de la sous-tâche..."
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100 caractères</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'PPP', { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={date => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Date d'échéance</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dueDate, 'PPP', { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={date => date && setDueDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Effort et Responsable */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="effort">Charge estimée (heures)</Label>
              <Input
                id="effort"
                type="number"
                min="0.5"
                step="0.5"
                value={effort}
                onChange={e => setEffort(parseFloat(e.target.value) || 1)}
              />
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Responsable *
              </Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un responsable" />
                </SelectTrigger>
                <SelectContent>
                  {availableAssignees.map(person => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Liaison avec action du parent */}
          {parentTask.task_actions && parentTask.task_actions.length > 0 && (
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Lier à une action de la tâche parent (optionnel)
              </Label>
              <Select value={selectedActionId} onValueChange={setSelectedActionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucune liaison - sous-tâche indépendante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune liaison</SelectItem>
                  {parentTask.task_actions.map(action => (
                    <SelectItem key={action.id} value={action.id}>
                      {action.title} ({action.weight_percentage}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedActionId && selectedActionId !== 'none' && (
                <p className="text-xs text-muted-foreground">
                  💡 Cette sous-tâche contribuera à l'accomplissement de l'action sélectionnée
                </p>
              )}
            </div>
          )}

          {/* Info parent */}
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              <strong>Tâche parent:</strong> {parentTask.title}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Responsable hérité:</strong> {parentTask.assignee}
            </p>
          </div>

          <Separator />

          {/* Section Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Target className="h-4 w-4" />
                Actions de la sous-tâche ({actions.length})
              </Label>
              {actions.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={redistributeWeights}
                  className="text-xs"
                >
                  Redistribuer équitablement
                </Button>
              )}
            </div>

            {/* Liste des actions existantes */}
            {actions.length > 0 && (
              <div className="max-h-32 space-y-2 overflow-y-auto">
                {actions.map(action => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between rounded-md bg-muted/50 p-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{action.title}</span>
                        <span className="rounded bg-primary/20 px-2 py-1 text-xs text-primary">
                          {action.weight_percentage}%
                        </span>
                      </div>
                      {action.due_date && (
                        <p className="text-xs text-muted-foreground">
                          Échéance: {format(new Date(action.due_date), 'PPP', { locale: fr })}
                        </p>
                      )}
                      {action.notes && (
                        <p className="truncate text-xs text-muted-foreground">{action.notes}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(action.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire d'ajout d'action */}
            <div className="space-y-4 rounded-md border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Plus className="h-4 w-4" />
                  Ajouter une action à cette sous-tâche
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAction}
                  disabled={!newActionTitle.trim()}
                  className="text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Ajouter
                </Button>
              </div>

              <div className="grid gap-3">
                {/* Titre de l'action */}
                <div className="grid gap-1">
                  <Label className="text-xs">Nom de l'action *</Label>
                  <Input
                    placeholder="Titre de l'action"
                    value={newActionTitle}
                    onChange={e => setNewActionTitle(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && newActionTitle.trim() && addAction()}
                    className="text-sm"
                    maxLength={40}
                  />
                  <p className="text-xs text-muted-foreground">
                    {newActionTitle.length}/40 caractères
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Poids */}
                  <div className="grid gap-1">
                    <Label className="text-xs">Poids: {newActionWeight[0]}%</Label>
                    <Slider
                      value={newActionWeight}
                      onValueChange={setNewActionWeight}
                      max={100}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Date d'échéance */}
                  <div className="space-y-2">
                    <Label className="text-xs">Échéance (optionnelle)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left text-xs font-normal"
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {newActionDueDate
                            ? format(newActionDueDate, 'dd/MM', { locale: fr })
                            : 'Choisir'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newActionDueDate}
                          onSelect={setNewActionDueDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Notes */}
                <div className="grid gap-2">
                  <Label className="text-xs">Notes (optionnelles)</Label>
                  <Textarea
                    placeholder="Détails, instructions spécifiques..."
                    value={newActionNotes}
                    onChange={e => setNewActionNotes(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Bouton permanent pour ajouter une autre action */}
              <div className="border-t pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Reset le formulaire pour une nouvelle action
                    setNewActionTitle('');
                    setNewActionWeight([25]);
                    setNewActionDueDate(undefined);
                    setNewActionNotes('');
                  }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Ajouter une autre action
                </Button>
              </div>
            </div>

            {actions.length > 0 &&
              (() => {
                const totalWeight = actions.reduce(
                  (sum, action) => sum + action.weight_percentage,
                  0
                );
                const isValid = totalWeight === 100;
                return (
                  <div
                    className={`rounded p-2 text-xs ${
                      isValid
                        ? 'border border-green-200 bg-green-50 text-green-700'
                        : 'border border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {isValid ? '✅' : '⚠️'} <strong>Total des poids: {totalWeight}%</strong>
                    {isValid
                      ? ' (Parfait ! Les actions totalisent 100%)'
                      : ' (Doit être égal à 100% pour valider)'}
                  </div>
                );
              })()}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !title.trim() ||
              !assignee ||
              assignee === 'Non assigné' ||
              (actions.length > 0 &&
                actions.reduce((sum, action) => sum + action.weight_percentage, 0) !== 100)
            }
          >
            Créer la Sous-tâche
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

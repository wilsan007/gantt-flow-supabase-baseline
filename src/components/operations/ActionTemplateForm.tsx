/**
 * Formulaire de Configuration d'Action Template
 * Avec assignation employé + timeline visuelle
 * Pattern: Linear/Asana - Configuration avancée
 */

import React, { useState, useEffect } from 'react';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import { getAvailableDays, getMaxOffsetDays, getTimelineInfo, extractFrequency, type FrequencyType } from '@/lib/scheduleUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Check,
  AlertCircle,
  UserCheck
} from 'lucide-react';

interface ActionTemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ActionTemplateData) => void;
  initialData?: Partial<ActionTemplateData>;
  mainTaskAssignee?: {
    id: string;
    name: string;
  };
  mainTaskDate?: Date;
  activityKind?: 'recurring' | 'one_off'; // Type de l'activité parent
  rrule?: string | null; // Règle de récurrence pour déterminer la fourchette
}

export interface ActionTemplateData {
  title: string;
  description?: string;
  position: number;
  assignee_id?: string;
  assigned_name?: string;
  inherit_assignee: boolean;
  estimated_hours: number;
  offset_days: number; // Pour récurrente : offset en jours
  specific_date?: string; // Pour ponctuelle : date ISO (YYYY-MM-DD)
}

export const ActionTemplateForm: React.FC<ActionTemplateFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mainTaskAssignee,
  mainTaskDate = new Date(),
  activityKind = 'recurring',
  rrule = null,
}) => {
  const { employees, loading: loadingEmployees } = useHRMinimal();

  const [formData, setFormData] = useState<ActionTemplateData>({
    title: '',
    description: '',
    position: 0,
    inherit_assignee: true,
    estimated_hours: 1,
    offset_days: 0,
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculer la fréquence et les jours disponibles
  const frequency: FrequencyType = activityKind === 'recurring' ? extractFrequency(rrule) : null;
  const availableDays = getAvailableDays(frequency, activityKind);
  const maxOffset = getMaxOffsetDays(frequency, activityKind);
  const timelineInfo = getTimelineInfo(frequency, activityKind);
  const isDailyRecurrence = frequency === 'daily';

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [open, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est obligatoire';
    }

    if (!formData.inherit_assignee && !formData.assignee_id) {
      newErrors.assignee = 'Veuillez sélectionner un employé';
    }

    if (formData.estimated_hours <= 0) {
      newErrors.estimated_hours = 'La durée doit être supérieure à 0';
    }

    // Validation date spécifique pour activité ponctuelle
    if (activityKind === 'one_off') {
      if (!formData.specific_date) {
        newErrors.specific_date = 'La date est obligatoire pour une action ponctuelle';
      } else {
        // Vérifier que la date est dans la fourchette
        const selectedDate = new Date(formData.specific_date);
        const min = new Date(minDate);
        const max = new Date(maxDate);
        
        if (selectedDate < min || selectedDate > max) {
          newErrors.specific_date = `La date doit être entre le ${min.toLocaleDateString('fr-FR')} et le ${max.toLocaleDateString('fr-FR')}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Mettre à jour assigned_name si un employé est sélectionné
      const finalData = { ...formData };
      if (!finalData.inherit_assignee && finalData.assignee_id) {
        const employee = employees.find(e => e.user_id === finalData.assignee_id);
        finalData.assigned_name = employee?.full_name || '';
      }
      onSubmit(finalData);
      onOpenChange(false);
    }
  };

  const handleOffsetChange = (newOffset: number) => {
    setFormData({ ...formData, offset_days: newOffset });
  };

  const selectedEmployee = employees.find(e => e.user_id === formData.assignee_id);
  const displayAssignee = formData.inherit_assignee 
    ? mainTaskAssignee 
    : selectedEmployee 
      ? { id: selectedEmployee.user_id, name: selectedEmployee.full_name }
      : null;

  // Calcul de la date effective de l'action
  const getActionDate = () => {
    const date = new Date(mainTaskDate);
    date.setDate(date.getDate() + formData.offset_days);
    return date;
  };

  // Calculer les dates min/max pour les activités ponctuelles
  const getMinMaxDates = () => {
    const minDate = new Date(mainTaskDate);
    const maxDate = new Date(mainTaskDate);
    
    // Pour ponctuel : ±15 jours
    const offsetRange = activityKind === 'one_off' ? 15 : maxOffset / 2;
    
    minDate.setDate(minDate.getDate() - offsetRange);
    maxDate.setDate(maxDate.getDate() + offsetRange);
    
    return {
      min: minDate.toISOString().split('T')[0], // Format YYYY-MM-DD
      max: maxDate.toISOString().split('T')[0],
    };
  };

  const { min: minDate, max: maxDate } = getMinMaxDates();

  // La timeline est maintenant calculée selon la fréquence (availableDays)

  const formatDate = (daysOffset: number) => {
    const date = new Date(mainTaskDate);
    date.setDate(date.getDate() + daysOffset);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {initialData?.title ? 'Modifier l\'action' : 'Nouvelle action'}
          </DialogTitle>
          <DialogDescription>
            Configurez l'action avec son assignation et sa position temporelle
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="required">
                  Titre de l'action
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Préparer le rapport hebdomadaire"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description (optionnelle)</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails supplémentaires sur cette action..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="estimated_hours">
                  Durée estimée (heures)
                </Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                  className={errors.estimated_hours ? 'border-red-500' : ''}
                />
                {errors.estimated_hours && (
                  <p className="text-sm text-red-500 mt-1">{errors.estimated_hours}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Assignation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="inherit_assignee" className="text-base font-semibold">
                  Assignation
                </Label>
              </div>

              {/* Switch: Hériter ou personnaliser */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Hériter de la tâche principale</p>
                    <p className="text-sm text-muted-foreground">
                      Même personne que la tâche principale
                    </p>
                  </div>
                </div>
                <Switch
                  id="inherit_assignee"
                  checked={formData.inherit_assignee}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, inherit_assignee: checked })
                  }
                />
              </div>

              {/* Sélection employé si non hérité */}
              {!formData.inherit_assignee && (
                <div>
                  <Label htmlFor="assignee" className="required">
                    Assigné à
                  </Label>
                  <Select
                    value={formData.assignee_id}
                    onValueChange={(value) => 
                      setFormData({ ...formData, assignee_id: value })
                    }
                  >
                    <SelectTrigger className={errors.assignee ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Sélectionnez un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingEmployees ? (
                        <SelectItem value="loading" disabled>
                          Chargement...
                        </SelectItem>
                      ) : employees.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          Aucun employé disponible
                        </SelectItem>
                      ) : (
                        employees.map((employee) => (
                          <SelectItem key={employee.user_id} value={employee.user_id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{employee.full_name}</span>
                              {employee.job_title && (
                                <span className="text-xs text-muted-foreground">
                                  ({employee.job_title})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.assignee && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.assignee}
                    </p>
                  )}
                </div>
              )}

              {/* Affichage de l'assigné actuel */}
              {displayAssignee && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Assigné à : {displayAssignee.name}</span>
                    {formData.inherit_assignee && (
                      <Badge variant="secondary" className="text-xs">
                        Hérité
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Timeline ou Date selon le type */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">
                  {activityKind === 'recurring' ? 'Position temporelle' : 'Date de l\'action'}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {activityKind === 'recurring' 
                    ? 'Quand cette action doit-elle être effectuée par rapport à la tâche principale ?'
                    : 'À quelle date cette action doit-elle être réalisée ?'
                  }
                </p>
              </div>

              {/* ACTIVITÉ RÉCURRENTE : Timeline avec offset de jours */}
              {activityKind === 'recurring' && (
                <>
                  {/* Date calculée */}
                  <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-muted-foreground">Tâche principale</p>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            🔒 Fixe
                          </Badge>
                        </div>
                        <p className="font-medium">
                          {mainTaskDate.toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-1">
                          <p className="text-sm text-muted-foreground">Cette action</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500 text-blue-600">
                            ✓ Variable
                          </Badge>
                        </div>
                        <p className="font-medium text-blue-600">
                          {getActionDate().toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      🔒 La date de la tâche parent est fixe (non modifiable)
                    </p>
                  </div>

                  {/* Info fourchette disponible */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Fourchette disponible
                      </p>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Vous pouvez planifier cette action entre <strong>{availableDays[0] < 0 ? availableDays[0] : `J+${availableDays[0]}`}</strong> et <strong>{availableDays[availableDays.length - 1] > 0 ? `J+${availableDays[availableDays.length - 1]}` : availableDays[availableDays.length - 1]}</strong> par rapport à la tâche principale
                    </p>
                  </div>

                  {/* Timeline interactive */}
                  <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOffsetChange(formData.offset_days - 1)}
                    disabled={isDailyRecurrence || formData.offset_days <= availableDays[0]}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Jour précédent
                  </Button>

                  <Badge variant="outline" className="px-4 py-2">
                    {formData.offset_days === 0 
                      ? 'Même jour (J)' 
                      : formData.offset_days > 0 
                        ? `J+${formData.offset_days}` 
                        : `J${formData.offset_days}`
                    }
                  </Badge>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOffsetChange(formData.offset_days + 1)}
                    disabled={isDailyRecurrence || formData.offset_days >= availableDays[availableDays.length - 1]}
                  >
                    Jour suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Grille timeline */}
                <div className="relative">
                  {isDailyRecurrence ? (
                    <div className="p-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                      <Calendar className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Tâches quotidiennes
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Les actions sont exécutées le même jour que la tâche (pas de décalage possible)
                      </p>
                    </div>
                  ) : (
                    <>
                  <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    {availableDays.map((offset) => {
                      const isMainDay = offset === 0;
                      const isSelectedDay = offset === formData.offset_days;
                      const isPastDay = offset < formData.offset_days;
                      const isFutureDay = offset > formData.offset_days;

                      return (
                        <button
                          key={offset}
                          type="button"
                          onClick={() => handleOffsetChange(offset)}
                          className={`
                            relative flex-1 min-w-[60px] p-3 rounded-lg border-2 transition-all
                            ${isMainDay 
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' 
                              : isSelectedDay
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="text-center">
                            <div className="text-xs font-medium mb-1">
                              {offset === 0 ? 'J' : offset > 0 ? `J+${offset}` : `J${offset}`}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {formatDate(offset)}
                            </div>
                          </div>

                          {isMainDay && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                Tâche
                              </Badge>
                            </div>
                          )}

                          {isSelectedDay && !isMainDay && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                              <Check className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Légende */}
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded border-2 border-orange-500 bg-orange-50" />
                      <span>Tâche principale</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded border-2 border-blue-500 bg-blue-50" />
                      <span>Action sélectionnée</span>
                    </div>
                  </div>
                    </>
                  )}
                </div>
              </div>
                
              {/* Info sur la fréquence */}
              <p className="text-xs text-muted-foreground text-center">
                {timelineInfo}
              </p>
                </>
              )}

              {/* ACTIVITÉ PONCTUELLE : Date spécifique */}
              {activityKind === 'one_off' && (
                <div className="space-y-4">
                  {/* Date de la tâche parent (lecture seule) */}
                  <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium text-muted-foreground">
                        Tâche ponctuelle parent
                      </Label>
                    </div>
                    <p className="font-medium text-lg">
                      {mainTaskDate.toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      🔒 Date fixe de référence (non modifiable)
                    </p>
                  </div>

                  {/* Fourchette autorisée */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Fourchette autorisée
                      </p>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Du <strong>{new Date(minDate).toLocaleDateString('fr-FR')}</strong> au <strong>{new Date(maxDate).toLocaleDateString('fr-FR')}</strong> (±15 jours)
                    </p>
                  </div>

                  {/* Sélection de la date */}
                  <div>
                    <Label htmlFor="specific_date" className="required">
                      Date de l'action *
                    </Label>
                    <Input
                      id="specific_date"
                      type="date"
                      min={minDate}
                      max={maxDate}
                      value={formData.specific_date || ''}
                      onChange={(e) => setFormData({ ...formData, specific_date: e.target.value })}
                      className={errors.specific_date ? 'border-red-500' : ''}
                    />
                    {errors.specific_date && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.specific_date}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      📅 Sélectionnez une date dans la fourchette autorisée
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {initialData?.title ? 'Enregistrer' : 'Créer l\'action'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ActionTemplateForm;

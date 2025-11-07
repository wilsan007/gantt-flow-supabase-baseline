/**
 * ⏰ Feuille de Temps Hebdomadaire - Pattern Harvest/Toggl
 */

import { useState, useEffect } from 'react';
import { useHRSelfService } from '@/hooks/useHRSelfService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, Plus, Save, Send, Trash2, AlertCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TimesheetEntry {
  id?: string;
  work_date: string;
  project_id: string | null;
  task_id: string | null;
  hours: number;
  description: string | null;
  is_overtime: boolean;
}

interface TimesheetWeeklyProps {
  weekStartDate: Date;
  onSuccess?: () => void;
}

export function TimesheetWeekly({ weekStartDate, onSuccess }: TimesheetWeeklyProps) {
  const { createTimesheet, loading } = useHRSelfService();

  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isDraft, setIsDraft] = useState(true);

  const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 }); // Lundi
  const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 }); // Dimanche
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Initialiser avec une ligne vide
  useEffect(() => {
    if (entries.length === 0) {
      addNewEntry();
    }
  }, []);

  const addNewEntry = () => {
    const newEntry: TimesheetEntry = {
      work_date: format(weekStart, 'yyyy-MM-dd'),
      project_id: selectedProject || null,
      task_id: null,
      hours: 0,
      description: null,
      is_overtime: false,
    };
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof TimesheetEntry, value: any) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const calculateDayTotal = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return entries
      .filter(e => e.work_date === dayStr)
      .reduce((sum, e) => sum + (Number(e.hours) || 0), 0);
  };

  const calculateWeekTotal = () => {
    return entries.reduce((sum, e) => sum + (Number(e.hours) || 0), 0);
  };

  const calculateRegularHours = () => {
    return entries.filter(e => !e.is_overtime).reduce((sum, e) => sum + (Number(e.hours) || 0), 0);
  };

  const calculateOvertimeHours = () => {
    return entries.filter(e => e.is_overtime).reduce((sum, e) => sum + (Number(e.hours) || 0), 0);
  };

  const handleSave = async (submit: boolean = false) => {
    const totalHours = calculateWeekTotal();
    const regularHours = calculateRegularHours();
    const overtimeHours = calculateOvertimeHours();

    if (totalHours === 0) {
      return;
    }

    await createTimesheet({
      week_start_date: format(weekStart, 'yyyy-MM-dd'),
      week_end_date: format(weekEnd, 'yyyy-MM-dd'),
      total_hours: totalHours,
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      status: submit ? 'submitted' : 'draft',
    });

    setIsDraft(!submit);
    onSuccess?.();
  };

  const totalHours = calculateWeekTotal();
  const regularHours = calculateRegularHours();
  const overtimeHours = calculateOvertimeHours();
  const isOvertime = totalHours > 40;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Feuille de Temps - Semaine du {format(weekStart, 'dd MMM', { locale: fr })} au{' '}
          {format(weekEnd, 'dd MMM yyyy', { locale: fr })}
        </CardTitle>
        <CardDescription>Remplissez vos heures travaillées pour la semaine</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alerte heures supplémentaires */}
        {isOvertime && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vous avez dépassé 40 heures cette semaine. Pensez à cocher "Heures sup." pour les
              heures excédentaires.
            </AlertDescription>
          </Alert>
        )}

        {/* Tableau des entrées */}
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div key={index} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Entrée {index + 1}</h4>
                {entries.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeEntry(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Projet */}
                <div className="space-y-2">
                  <Label>Projet</Label>
                  <Select
                    value={entry.project_id || ''}
                    onValueChange={value => updateEntry(index, 'project_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proj1">Projet Alpha</SelectItem>
                      <SelectItem value="proj2">Projet Beta</SelectItem>
                      <SelectItem value="general">Général</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tâche */}
                <div className="space-y-2">
                  <Label>Tâche (optionnel)</Label>
                  <Input
                    placeholder="Ex: Développement, Réunion..."
                    value={entry.description || ''}
                    onChange={e => updateEntry(index, 'description', e.target.value)}
                  />
                </div>
              </div>

              {/* Heures par jour */}
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isToday = format(new Date(), 'yyyy-MM-dd') === dayStr;
                  const isSelected = entry.work_date === dayStr;

                  return (
                    <div key={dayStr} className="space-y-2">
                      <Label
                        className={`block text-center text-xs ${isToday ? 'font-bold text-primary' : ''}`}
                      >
                        {format(day, 'EEE', { locale: fr })}
                        <br />
                        {format(day, 'dd')}
                      </Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        placeholder="0"
                        className={`text-center ${isSelected ? 'border-primary' : ''}`}
                        value={isSelected ? entry.hours : ''}
                        onChange={e => {
                          updateEntry(index, 'work_date', dayStr);
                          updateEntry(index, 'hours', parseFloat(e.target.value) || 0);
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Heures supplémentaires */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`overtime-${index}`}
                  checked={entry.is_overtime}
                  onCheckedChange={checked => updateEntry(index, 'is_overtime', checked)}
                />
                <Label htmlFor={`overtime-${index}`} className="cursor-pointer text-sm">
                  Heures supplémentaires
                </Label>
              </div>
            </div>
          ))}
        </div>

        {/* Bouton ajouter entrée */}
        <Button variant="outline" onClick={addNewEntry} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une ligne
        </Button>

        {/* Totaux journaliers */}
        <div className="border-t pt-4">
          <Label className="text-sm font-medium">Total par jour</Label>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {weekDays.map(day => {
              const total = calculateDayTotal(day);
              const isOvertime = total > 8;
              return (
                <div key={format(day, 'yyyy-MM-dd')} className="text-center">
                  <div className={`font-bold ${isOvertime ? 'text-orange-600' : ''}`}>
                    {total.toFixed(1)}h
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totaux globaux */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Heures normales</span>
            <span className="font-semibold">{regularHours.toFixed(1)}h</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Heures supplémentaires</span>
            <span className="font-semibold text-orange-600">{overtimeHours.toFixed(1)}h</span>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <span className="font-medium">Total semaine</span>
            <span className="text-xl font-bold text-primary">{totalHours.toFixed(1)}h</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={loading || totalHours === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            Enregistrer brouillon
          </Button>
          <Button onClick={() => handleSave(true)} disabled={loading || totalHours === 0}>
            <Send className="mr-2 h-4 w-4" />
            Soumettre pour approbation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
